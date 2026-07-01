# Everyday-Shopper Rebalance Plan

Goal: make the everyday shopper (someone buying groceries, electronics, or essentials **for themselves**) the default user of the agent, with gifting as one important mode among many — per the Kapruka Agent Challenge approval email: *"the majority of orders are people shopping for themselves… the everyday shopper buying for their own needs is your main user, with gifting as one important mode among many."*

Today the agent is gift-first everywhere: the system prompt header says "discover and send the perfect gifts", the shopping flow opens with "understand the occasion, recipient", checkout always collects a separate recipient, and the greeting/suggestion chips are ~100% gifting. Someone asking for a phone charger gets occasion questions and a gift-message card.

This is a **prompt and copy rebalance, not an architecture change**. There is no code-level mode state machine — the model infers gift vs. self-purchase intent from the conversation, and the prompt gates the gifting steps behind that inference.

This plan is self-contained. Implement the tasks **in order**. Each task lists the files to touch, the exact changes, and acceptance criteria.

## Project conventions (follow these)

- Prefer **named function declarations** over arrow function expressions (`function foo() {}`, not `const foo = () => {}`). Inline callbacks may stay arrows only when trivially short and matching surrounding code.
- Do **not** add a `Co-Authored-By` line to any git commit.
- Match existing code style and import ordering; TypeScript strict.
- After all tasks: run `npm run lint` and `npx tsc --noEmit` and fix any errors.

## Architecture refresher

- `src/lib/instructions.ts` — builds the system prompt. `agentInstructions(cartContext, mode, addressContext?)` assembles named section constants (`header`, `personalitySection`, `shoppingSection`, `toolRules`, …). Most sections have a `mode === "chat"` variant and a voice variant (the `: \`…\`` branch). **Both modes must be rebalanced.**
- `src/tools/specs.ts` — Zod tool specs shared by the text agent and the voice agent. Tool **descriptions** here are prompt content too — the model reads them when deciding which tool to call.
- `src/components/ChatInterface/Greeting.tsx` — first message shown on an empty chat.
- `src/components/ChatInterface/SuggestedReplies.tsx` — `ALL_SUGGESTIONS` chips shown under the greeting (4 random picks).
- `src/components/Cart/CartSidebar.tsx` — cart drawer. The gift-message card inside it (`GiftMessageCard`) is **already opt-in** (collapsed behind an "Add a gift message" button) — do not change that component.
- `src/app/layout.tsx` — page `<meta>` description / OG copy.
- `tests/e2e/agent-evals.spec.ts` — Playwright agent evals, gated behind `RUN_EVALS=1`, hit the real Anthropic + Kapruka APIs.

## The mode model (read before Task 1)

Encode this logic in the prompt, exactly this way:

- **Self-purchase is the default.** A request with no gift signal ("I need a phone charger", "show me rice prices", "order shampoo") is the user shopping for themselves.
- **Gift mode** activates only on explicit signals: another person is the recipient ("for my amma", "for my friend"), an occasion is named (birthday, anniversary, Avurudu, wedding…), or gift verbs appear ("send", "gift", "surprise", "deliver to her").
- **When ambiguous, don't interrogate** — just find the product. Mode only matters at two points: (a) which clarifying questions to ask, and (b) the checkout flow (recipient + gift message).
- **Checkout mapping for self-purchase:** the MCP `kapruka_create_order` schema requires both `recipient` and `sender`. For self-purchases the buyer is both: collect the buyer's name + phone **once**, pass it as `recipient`, and set `sender.name` to the same name. Never ask "who is this for?" and never offer a gift message.
- **Mode can switch mid-conversation** (e.g. user buying groceries adds "and also a cake to send to my sister" → that order is a gift).

---

## Task 1 — Rebalance the system prompt

**File:** `src/lib/instructions.ts`

### 1a. Rewrite the header (currently line ~52)

Replace the second sentence of `header`. Current:

> You are ${AGENT.name} (${AGENT.nameLocal}), a warm personal shopping concierge for Kapruka.com — Sri Lanka's largest e-commerce and gifting platform. You help people discover and send the perfect gifts.

New:

> You are ${AGENT.name} (${AGENT.nameLocal}), a warm personal shopping concierge for Kapruka.com — Sri Lanka's largest e-commerce platform, carrying everything from groceries, electronics, fashion and home essentials to cakes, flowers and gifts. Most of your users are everyday shoppers buying for themselves; gifting is one important mode among many. You help with both equally well.

Keep the voice-mode suffix (`" You are speaking to the user directly via voice."`) untouched.

### 1b. Add a "Shopping modes" section

Add a new section constant `modesSection` rendered in **both** chat and voice modes (insert it into the final array right after `personalitySection`). Chat version:

```
## Shopping modes
Every conversation is in one of two modes — infer it, never ask "is this a gift?" as your opening move:
- **Self-purchase (the default)** — the user is buying for themselves: groceries, electronics, personal items, household needs. No gift signal means self-purchase. Do NOT ask about occasions or recipients, do NOT offer a gift message. At checkout the user is both sender and recipient: collect their name + phone once, pass it as `recipient`, and set `sender.name` to the same name.
- **Gift mode** — activates only when the user signals it: another person is the recipient ("for my amma"), an occasion is named (birthday, anniversary, Avurudu, wedding), or gift language is used ("send", "surprise", "gift"). Only then run the gifting flow: occasion/recipient questions, gift message card, separate recipient details.
The mode can change mid-conversation — a grocery shopper may add "and a cake for my sister's birthday"; treat that order as a gift.
```

Voice version (shorter, same rules):

```
## Shopping modes
- Default: the user is shopping for themselves. Do not ask about occasions, recipients, or gift messages. At checkout they are both sender and recipient — collect their name and phone once and use it for both.
- Gift mode only when the user names another recipient, an occasion, or uses gift language ("send", "gift", "surprise"). Only then ask about gift messages and recipient details.
```

### 1c. Rewrite Shopping Approach steps 1–2 (chat) — currently lines ~91–95

Replace step 1 and the intro of step 2:

```
1. **Listen first** — understand what they need, the budget, and when/where to deliver. In gift mode, also understand the occasion and recipient; in self-purchase mode, never ask about either
2. **Search smart** — choose the right search tool for the request:
   - **Multi-angle intent requests** — gifting occasions ("birthday gift for a 10-year-old boy under 3000 rupees") or multi-need self-purchases ("weekly groceries for a family of 4", "everything I need for a beach trip") → use `kapruka_batch_search` with 2–4 queries covering different product angles. Pass `budget_max` when the user gives a price limit.
   - **Simple keyword searches** (e.g. "show me cakes", "I need a phone charger") → use `kapruka_search_products` directly with at least 10 results.
```

Keep the rest of step 2 (`in_stock_only`, clarifying-questions fallback) and steps 3–5 and 7 as they are. Rewrite step 6 ("Close the loop"):

```
6. **Close the loop** — self-purchase: collect the buyer's name + phone, delivery address + city + date, then call `kapruka_create_order` with the buyer as both recipient and sender. Gift mode: collect recipient name + phone, delivery address + city + date, sender's name, then call `kapruka_create_order`
```

### 1d. Make the clarifying-questions guidance mode-aware (chat) — currently lines ~114–120

In `clarifyingSection`, after the existing rules, add one bullet:

```
- Match the questions to the mode: self-purchase questions are about the product (size, brand, quantity, budget); gift-mode questions are about the occasion, recipient, and budget. Never ask occasion/recipient questions in self-purchase mode
```

### 1e. Gate the gifting tool rules (chat `toolRules`) — currently lines ~135–146

Three edits:

1. The `kapruka_batch_search` bullet (currently "For occasion/intent requests…"): change the trigger wording to match 1c — "For multi-angle requests (gifting occasions OR multi-need self-purchases like weekly groceries)…". Keep the rest of the bullet.
2. The `ask_gift_message` bullet (currently "If there is no gift message in the cart and the order is a gift, call `ask_gift_message`…"): replace with:

   ```
   - **Gift mode only:** if there is no gift message in the cart, call `ask_gift_message` to surface the parchment card BEFORE collecting delivery details. **Never call `ask_gift_message` for a self-purchase** — do not even mention gift messages
   ```

3. Add one new bullet directly after it:

   ```
   - **Self-purchase checkout:** the buyer is both sender and recipient. Collect their name + phone once; pass it as `recipient` and set `sender.name` to the same name. Do not ask "who is this for?"
   ```

### 1f. Rebalance the voice flow (`shoppingSection` voice branch) — currently lines ~102–109

Replace steps 1, 4 and 5:

```
1. Understand what the user needs, the budget, and the delivery city. Only ask about occasion and recipient if they signal a gift
4. Gift mode only: if no gift message is set, ask verbally whether they'd like to include one. Never ask for self-purchases
5. Self-purchase: collect the buyer's name + phone and address + city + date (buyer is both sender and recipient). Gift: collect recipient name + phone, address + city + date, and the sender's name
```

Steps 2, 3, 6, 7 unchanged. In the voice `toolRules` branch, the gift-message bullet ("If the cart context shows a 'Gift message'…") stays — it only fires when a message already exists.

### Acceptance criteria (Task 1)

- `agentInstructions("Cart is currently empty.", "chat")` output contains "Shopping modes", "Self-purchase (the default)", and no longer contains "discover and send the perfect gifts".
- `agentInstructions("Cart is currently empty.", "voice")` output contains the voice "Shopping modes" section.
- The string "understand the occasion, recipient" no longer appears as the unconditional step 1.
- `npx tsc --noEmit` passes.

---

## Task 2 — Rebalance tool descriptions

**File:** `src/tools/specs.ts`

These descriptions are read by the model — they must not contradict the new prompt.

1. **`kapruka_batch_search`** (currently "…whenever the user expresses a gifting occasion, recipient, or intent…"): rewrite the description to:

   > Run 2–4 product searches in parallel and return a single merged, ranked shortlist. Use this for any multi-angle request: gifting occasions ('birthday gift for a 10-year-old boy under 3000 rupees') OR multi-need self-purchases ('weekly groceries for a family of 4', 'things I need for a new apartment'). Pick 2–4 queries covering different product angles. Pass budget_max when the user gives a price limit.

2. **`ask_gift_message`** (currently "Use this for gift orders when no gift message is already in the cart context."): append to the description:

   > Gift mode ONLY — never call this when the user is shopping for themselves.

3. **`kapruka_create_order`**: append to the description:

   > For self-purchases the buyer is both recipient and sender — pass the buyer's name/phone as recipient and the same name as sender.name.

Do not change any `inputSchema`, `execution`, or `realtime` flags — the MCP server contract is unchanged.

### Acceptance criteria (Task 2)

- The three descriptions updated, schemas untouched (`git diff` shows only `description` string changes in this file).
- `npx tsc --noEmit` passes (descriptions feed `REALTIME_TOOLS` via `z.toJSONSchema` — no schema change means no breakage).

---

## Task 3 — Rebalance UI copy

### 3a. Greeting — `src/components/ChatInterface/Greeting.tsx`

Replace the message body (currently "Tell me who you're shopping for and the occasion — … What are we celebrating today?") with:

```
Whatever you need — groceries, gadgets, cakes, or a gift for someone special — I&apos;ll find it on Kapruka and get it delivered anywhere in Sri Lanka. What can I get you today?
```

Keep the "Ayubowan! I'm {AGENT.name} 🌿" headline and all markup/classes as-is.

### 3b. Suggestion chips — `src/components/ChatInterface/SuggestedReplies.tsx`

Replace the single `ALL_SUGGESTIONS` array with two pools and pick 2 from each (everyday first), so every visitor sees the agent is for self-shopping *and* gifting:

```ts
const EVERYDAY_SUGGESTIONS = [
  "🛒 I need to order my weekly groceries",
  "🔌 Find me a phone charger under Rs 5000",
  "🎧 Show me wireless earbuds under Rs 10000",
  "🧴 I'm out of shampoo and body wash — restock me",
  "🍚 Order a 5kg bag of rice and some dhal",
  "💻 What laptop accessories do you have?",
  "🏠 I need new bedsheets for a double bed",
  "📦 Can you help me track my existing order?",
];

const GIFT_SUGGESTIONS = [
  "🎂 Can you find a birthday gift for my amma under Rs 3000?",
  "💐 What flowers can I send as a surprise for someone special?",
  "🎁 Do you have gift hampers under Rs 5000?",
  "🍰 What cakes can I order for a party?",
  "🧸 Can you suggest a toy for a child under Rs 2000?",
  "💍 What anniversary gifts are available under Rs 10000?",
];
```

Update the default-suggestion initializer to `[...pickRandom(EVERYDAY_SUGGESTIONS, 2), ...pickRandom(GIFT_SUGGESTIONS, 2)]`. Keep `pickRandom` as-is and keep the `suggestions` prop override behavior unchanged.

### 3c. Cart empty state — `src/components/Cart/CartSidebar.tsx` (~line 130)

Change `Ask {AGENT.name} for a gift idea!` to `Ask {AGENT.name} to find anything on Kapruka!`.

Do **not** touch `GiftMessageCard` — it is already opt-in (collapsed behind an "Add a gift message" button), which is correct for both modes.

### 3d. Page metadata — `src/app/layout.tsx` (~lines 35, 38)

- Description: "Your AI-powered personal shopping concierge for Kapruka.com. Find perfect gifts, check delivery, and checkout — all in one chat." → "Your AI-powered personal shopping concierge for Kapruka.com. Groceries, electronics, gifts and more — search, check delivery, and checkout, all in one chat."
- OG description: "AI-powered gift finder and shopping assistant for Kapruka.com" → "AI-powered shopping assistant for Kapruka.com — everyday essentials to gifts".

### 3e. Category tile copy — `src/lib/constants.ts` (~line 13)

Change the Electronics sub-label "Gadgets & tech gifts" → "Gadgets & tech". Leave the Hampers tile ("Curated gift sets") as-is — hampers really are gifts.

### Acceptance criteria (Task 3)

- `grep -rn "perfect gift\|gift idea\|celebrating today" src/` returns no hits in Greeting, CartSidebar, or layout.
- Greeting renders 4 chips: 2 everyday + 2 gift (verify visually with `npm run dev`).
- `npm run lint` passes.

---

## Task 4 — Add a self-purchase agent eval

**File:** `tests/e2e/agent-evals.spec.ts`

Add one test mirroring the existing patterns (same `RUN_EVALS` gate, same timeouts):

```ts
test("self-purchase: everyday query gets products without gift questions", async ({ page }) => {
  await page.goto("/");

  const input = page.getByRole("textbox");
  await expect(input).toBeVisible({ timeout: 15_000 });

  await input.fill("I need a phone charger for my laptop, under 5000 rupees");
  await input.press("Enter");

  // Product cards should render
  const cards = page.locator('[data-testid="product-card"]');
  await expect(cards.first()).toBeVisible({ timeout: 90_000 });

  // The agent must not run the gifting flow for a self-purchase
  const pageText = (await page.locator("body").textContent()) ?? "";
  expect(pageText.toLowerCase()).not.toMatch(/who is (this|it) for|what's the occasion|gift message/);
});
```

Before writing the gift-message assertion, check `src/components/ToolResult/GiftMessageChatCard.tsx` for a `data-testid` — if it has one, also assert that locator is `not.toBeVisible()` (a stronger check than body text).

### Acceptance criteria (Task 4)

- Test added; full file still passes `npx tsc --noEmit` and lint.
- With `RUN_EVALS=1 ANTHROPIC_API_KEY=… npm run test:e2e`, the new test passes. (Evals hit live APIs and an LLM — if it flakes on phrasing, tighten the prompt rules from Task 1 rather than loosening the assertion.)

---

## Task 5 — Verification sweep

1. `npm run lint` and `npx tsc --noEmit` — both clean.
2. `grep -rin "perfect gift" src/ README.md` — update any stragglers (README tagline may also say gift-first; rebalance it the same way: everyday shopping first, gifting as a mode).
3. Manual smoke test with `npm run dev` (requires `ANTHROPIC_API_KEY` in `.env.local`):
   - "I need a phone charger" → product cards, **no** occasion question, **no** gift-message card.
   - Add one to cart, "deliver to Colombo, tomorrow" → agent asks for **your** name + phone (not "recipient"), checkout works with buyer as sender and recipient.
   - "birthday gift for my amma under 3000" → occasion flow, `ask_gift_message` parchment card appears before delivery details — confirm gift mode still fully works.
   - "ඔයාට මට weekly groceries order කරන්න පුළුවන්ද?" → Sinhala/Tanglish reply, batch search of grocery angles, no gift questions.
4. Voice mode smoke test (if `OPENAI_API_KEY` configured): say "I need some groceries" — the voice agent must not ask about occasions or gift messages.
