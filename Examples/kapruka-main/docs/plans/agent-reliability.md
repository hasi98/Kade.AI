# Agent Reliability Hardening Plan

Goal: make the Kapruka Concierge agent resilient to transport failures, prevent duplicate orders, and surface failures to the model and the user instead of failing silently.

This plan is self-contained. Implement the tasks **in order** — Task 1 is a prerequisite for Task 2. Each task lists the files to touch, the exact changes, and acceptance criteria.

## Project conventions (follow these)

- Prefer **named function declarations** over arrow function expressions (`function foo() {}`, not `const foo = () => {}`). Inline callbacks may stay arrows only when trivially short and matching surrounding code.
- Do **not** add a `Co-Authored-By` line to any git commit.
- Match existing code style and import ordering; TypeScript strict.
- After all tasks: run `npm run lint` and `npx tsc --noEmit` (or `npm run build`) and fix any errors.

## Architecture refresher

- `src/app/api/chat/route.ts` — text agent endpoint. Uses AI SDK v6 `streamText` with Anthropic, `stopWhen: stepCountIs(12)`.
- `src/tools/server.ts` — single execution path for all tools (`executeServerTool`), used by both the text agent and the voice agent (`/api/realtime-tools`). Tool errors are returned as `{ error: string }` objects so the model can read them and self-correct — **preserve this pattern everywhere**.
- `src/tools/specs.ts` — Zod tool specs shared by both agents.
- `src/lib/server/mcp-client.ts` — singleton JSON-RPC client for `https://mcp.kapruka.com/mcp` with in-memory caching (30 min default, 1 min for tracking/delivery, never for `kapruka_create_order`) and a local 58-req/min rate limiter.
- `src/hooks/useAgent.ts` — client hook wrapping `useChat` from `@ai-sdk/react`.
- `src/components/ChatInterface/index.tsx` — chat UI.

---

## Task 1 — Harden the MCP client transport

**File:** `src/lib/server/mcp-client.ts`

### 1a. Add fetch timeouts

No fetch in this file has a timeout today; a hung Kapruka request stalls the agent turn until the route's 120 s `maxDuration`. Add `signal: AbortSignal.timeout(...)` to every fetch:

- `doInitialize` initialize POST: 10 000 ms.
- The fire-and-forget `notifications/initialized` POST: 5 000 ms (it already swallows errors).
- The `tools/call` POST in `callTool`: 20 000 ms.

Define the timeouts as named constants at the top of the file next to `CACHE_TTL`.

### 1b. Check `resp.ok` and return structured errors

Currently only 404/401/429 are handled; a 500/502/503 falls through to `parseSSE`, fails to parse, and returns `null` — which the model receives as a "successful" empty result and may hallucinate around. After the existing 429 check, add:

```ts
if (!resp.ok) {
  throw new Error(`Kapruka MCP returned HTTP ${resp.status}`);
}
```

(`callMcp` in `src/tools/server.ts` already converts thrown errors into `{ error }` for the model — rely on that.)

### 1c. Never return `null` from `callTool`

When `parseSSE` returns `null` (unparseable/empty response), throw `new Error("Kapruka MCP returned an unreadable response")` instead of returning `null`. Keep `parseSSE` itself unchanged; do the null check at its call site in `callTool`.

### 1d. Bound the session re-init retry

The 404/401 handler re-initializes and recursively calls `this.callTool(name, params)` with **no depth limit** — a persistent 404 (MCP outage) loops forever. Change `callTool`'s signature to carry a private retry flag:

```ts
async callTool(
  name: string,
  params: Record<string, unknown>,
  isRetry = false,
): Promise<unknown>
```

In the 404/401 branch: if `isRetry` is already true, throw `new Error("Kapruka MCP session could not be re-established")`; otherwise re-init and call `this.callTool(name, params, true)`.

### 1e. One automatic retry for transient failures

Wrap the fetch + status handling so that a **network error (fetch rejection / abort)** or an **HTTP 5xx** gets exactly one automatic retry after a 1 s delay — but **never** for `kapruka_create_order` (a timeout there may mean the order was actually placed; retrying risks a duplicate). 429 and 404/401 keep their existing dedicated handling and are excluded from this retry.

Cleanest structure: extract the single attempt into a private method, e.g.:

```ts
private async attemptToolCall(name: string, toolParams: ..., isRetry: boolean): Promise<unknown>
```

and have `callTool` orchestrate cache → init → rate limit → attempt → (one retry on transient failure if `name !== "kapruka_create_order"`) → cache write. Reuse the existing rate-limit accounting for the retry attempt too (call `checkRateLimit()` before each attempt).

### Acceptance criteria

- Every fetch has an abort timeout.
- `callTool` can never resolve to `null`.
- HTTP 5xx → thrown error (after one retry); model sees `{ error: "..." }` via `callMcp`.
- Session re-init happens at most once per call.
- `kapruka_create_order` is never auto-retried.
- Existing behavior preserved: caching rules, 429 → `KAPRUKA_RATE_LIMIT` error message verbatim (the system prompt in `src/lib/instructions.ts` matches on this string), `{ params: toolParams }` argument envelope, `response_format: "json"` injection.

---

## Task 2 — Idempotency guard for `kapruka_create_order`

**File:** `src/tools/server.ts` (keep the MCP client order-agnostic; this is business logic).

Prevent duplicate orders when the model retries after an ambiguous failure or a user double-sends a confirmation.

Implementation:

1. Add a module-level map in `server.ts`:

```ts
const recentOrders = new Map<string, { result: unknown; expiresAt: number }>();
const ORDER_DEDUPE_TTL = 5 * 60 * 1000;
```

2. Add a named function `orderFingerprint(args: Record<string, unknown>): string` that builds a stable key from the parsed (post-Zod, so defaults are applied) order args: JSON-stringify `{ cart, recipient, delivery, sender, gift_message }` — cart sorted by `product_id` for stability.
3. In `executeServerTool`, inside the existing `kapruka_create_order` branch (after `checkOrderAuthorization` passes):
   - Purge expired entries, compute the fingerprint.
   - If a non-expired entry exists, **return its stored result** without calling MCP (log `[MCP] kapruka_create_order DEDUPED`).
   - Otherwise call `callMcp` as today; if the result is **not** an `{ error }` object, store it in `recentOrders`.
4. This is per-lambda-instance memory — acceptable for this app (same caveat as the existing cache); note it in a one-line comment on the map.

### Acceptance criteria

- Two identical `kapruka_create_order` calls within 5 minutes hit MCP once; the second returns the first result.
- A failed order (`{ error }`) is **not** cached — the model may legitimately retry after fixing arguments.
- Different payloads (e.g. changed quantity) are not deduped.

---

## Task 3 — Surface stream errors to the user with retry

**Files:** `src/hooks/useAgent.ts`, `src/components/ChatInterface/index.tsx` (+ a small render block, either inline or a new tiny component in `src/components/ChatInterface/`).

Today `onError` in `useAgent.ts` only does `console.error` + `stop()` — the user sees the agent silently freeze.

1. In `useAgent.ts`, also destructure `error` and `regenerate` from `useChat`. Export from the hook:
   - `error` (the `Error | undefined` from `useChat`),
   - a named function `retry()` that calls `regenerate()` (AI SDK v6 `useChat` re-runs the last turn).
   Keep the existing `onError` handler (logging + stop) as-is.
2. In `ChatInterface/index.tsx`, when `error` is set and the agent is not streaming, render an error notice at the bottom of the message list (above the composer): a short friendly line such as “Something went wrong while replying.” plus a **Try again** button wired to `retry`. Style it consistently with existing bubbles/cards (look at `MessageBubble.tsx` and nearby components for tailwind patterns — muted red/amber tones, rounded-2xl, small text).
3. Do not show raw `error.message` to the user; log it to console only.

### Acceptance criteria

- Killing the network mid-response shows the error notice; clicking **Try again** re-runs the last user message.
- Notice disappears once a new attempt starts streaming.
- No layout shift for normal conversations (renders nothing when `error` is undefined).

---

## Task 4 — Handle the step-cap gracefully

**Files:** `src/app/api/chat/route.ts`, `src/components/ChatInterface/index.tsx` (or `SuggestedReplies.tsx`).

With `stopWhen: stepCountIs(12)`, a long flow (batch search → clarifying card → delivery check → checkout) can hit the cap and stop mid-task with no visible sign.

1. In `route.ts`, raise the cap to `stepCountIs(16)`.
2. Client-side detection: after streaming finishes (`status === "ready"`), if the **last assistant message's final part is a tool output with no trailing text part**, the turn likely ended abruptly (cap or stream cut). In that case show a single suggested-reply chip **“Continue”** (reuse the existing `SuggestedReplies` component/pattern) that sends the literal text `Continue` via the existing `send`.
3. Implement the detection as a named helper, e.g. `function endedMidTask(message: UIMessage): boolean`, checking `message.parts` — last part’s `type` starts with `"tool-"` and there is no later `text` part with non-empty text. Skip this for client-executed interactive tools that legitimately end a turn awaiting user input: `ask_clarifying_questions`, `ask_gift_message` (their part types are `tool-ask_clarifying_questions`, `tool-ask_gift_message`).

### Acceptance criteria

- Normal turns (ending in text, or ending in a clarifying/gift-message card) show no “Continue” chip.
- A turn that ends on a non-interactive tool result with no closing text shows the chip; clicking it resumes the flow.

---

## Task 5 — Re-enable IP rate limiting on /api/chat

**File:** `src/app/api/chat/route.ts`

The rate-limit block is commented out (lines ~14–17). Re-enable it with `rateLimit(ip, 30, 60_000)` (30 requests/min per IP — generous for one chat user, protective of the Anthropic budget). Keep the existing `headers()` / `x-forwarded-for` logic and the 429 plain-text response. `rateLimit` already exists in `src/lib/server/rate-limit.ts`; the import is already present in the route.

Also check `src/app/api/realtime-tools/route.ts` and `src/app/api/realtime-session/route.ts` — if they have no rate limiting, add the same guard (session creation can be stricter, e.g. 10/min).

### Acceptance criteria

- 31st chat request from one IP within a minute gets HTTP 429.
- `npm run dev` + normal chatting is unaffected.

---

## Task 6 — Agent regression evals (Playwright)

**Files:** new `tests/e2e/agent-evals.spec.ts`, `package.json` script.

Playwright is already configured (`playwright.config.ts`, testDir `tests/e2e`, dev server auto-start, 120 s timeouts). These tests hit the real Anthropic + Kapruka APIs, so they must **not** run by default:

1. Add script `"test:evals": "playwright test tests/e2e/agent-evals.spec.ts --workers=1"` to `package.json`. Keep them out of `test:e2e` by naming: check how existing specs in `tests/e2e/` are picked up; if `test:e2e` runs the whole dir, gate the new spec with `test.skip(!process.env.RUN_EVALS, "set RUN_EVALS=1")` and have `test:evals` set `RUN_EVALS=1` (use `cross-env`-free syntax: `"test:evals": "RUN_EVALS=1 playwright test ..."` — fine on darwin/linux).
2. Look at the existing spec(s) in `tests/e2e/` first and reuse their selectors/helpers for sending a chat message and waiting for a reply.
3. Write 3 scenario tests asserting on **rendered UI artifacts** (not network internals):
   - **Occasion search:** send “birthday gift for a 10 year old boy under 3000 rupees” → expect a product carousel/cards to render (locate via the `ProductCarousel`/`ProductCard` DOM — inspect `src/components/ToolResult/ProductCarousel.tsx` for a stable selector; add a `data-testid` if none exists) and expect **no** product list repeated as message text.
   - **Clarifying questions:** send “I need a gift” → expect the clarifying-questions card (`ClarifyingQuestionsCard`) to render with at least one option chip.
   - **City canonicalization:** add an item to cart via a search flow, then say “deliver to Candy” → expect the agent to either resolve to Kandy or ask for clarification — assert the reply text mentions “Kandy” (case-insensitive) and that no error bubble is shown.
4. Keep assertions loose enough to survive wording changes (assert on cards/testids and key tokens, not exact sentences).

### Acceptance criteria

- `npm run test:e2e` behavior unchanged (evals skipped).
- `npm run test:evals` runs the 3 scenarios against the live dev server (requires `ANTHROPIC_API_KEY` in env; document this in a comment at the top of the spec).

---

## Out of scope (documented limitations — do not implement)

- The MCP client's cache, rate limiter, and the order-dedupe map are **per-serverless-instance**. Multiple warm Vercel lambdas can collectively exceed Kapruka's 60/min limit; the 429 → `KAPRUKA_RATE_LIMIT` path covers this. Fixing properly requires shared storage (e.g. Upstash Redis) — not part of this plan.
- No changes to the voice agent's OpenAI Realtime wiring; it benefits automatically from Tasks 1–2 via `executeServerTool`.

## Final verification checklist

1. `npm run lint` — clean.
2. `npx tsc --noEmit` — clean.
3. `npm run dev`, then manually:
   - Normal flow: “show me cakes” → product cards render.
   - Add a cake to the cart, confirm checkout flow still asks for details (cart authorization untouched).
   - Temporarily point `MCP_URL` at an invalid host and ask “show me cakes” → agent replies with a graceful apology (model received `{ error }`), no infinite hang, no `null` crash. Revert the URL.
4. `npm run test:e2e` still passes.
