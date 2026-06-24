# Kade AI

Kade AI is a full-screen AI shopping companion for Kapruka, built for the Kapruka Agent Challenge 2026. It lets customers chat naturally, discover real Kapruka products, check delivery, manage a cart, and move toward guest checkout through a secure Kapruka payment link.

The goal is simple: make shopping on Kapruka feel like talking to a helpful Sri Lankan friend instead of filling a form or scrolling through search results.

## Highlights

- Full-screen conversational shopping UI
- Live Kapruka MCP product search
- Delivery city lookup and delivery quote support
- Cart, product detail panel, checkout/delivery details panel
- Guest checkout link creation through Kapruka MCP
- Order tracking support
- Text chat with model routing
- Browser-based Gemini Live voice mode using ephemeral tokens
- Sinhala, Tamil, Singlish, Tanglish, and English-oriented personality rules
- Chat history and local browser persistence
- Vercel-ready Next.js app

## Current Architecture

```text
Browser
  |
  |-- Next.js UI
  |     app/page.tsx
  |     app/page.module.css
  |
  |-- Chat API
  |     app/api/chat/route.ts
  |       - intent routing
  |       - product search orchestration
  |       - delivery/order/tracking tool calls
  |       - response cleanup
  |
  |-- Live voice token API
  |     app/api/live-token/route.ts
  |       - creates short-lived Gemini Live tokens
  |
  |-- Gemini / Gemma
  |     lib/gemini.ts
  |     lib/intent.ts
  |     lib/models.ts
  |
  |-- Kapruka MCP
        https://mcp.kapruka.com/mcp
```

Voice does not use a separate server in this version. The browser connects to Gemini Live using an ephemeral token created by the Next.js API route.

## Model Stack

The current model constants live in [lib/models.ts](lib/models.ts).

| Purpose | Model |
| --- | --- |
| Main text chat | `gemini-3.1-flash-preview` |
| Complex reasoning | `gemma-4-31b-it` |
| Intent classification | `gemma-4-26b-a4b-it` |
| Voice | `gemini-3.1-flash-live-preview` |
| Voice fallback | `gemini-2.5-flash-native-audio-latest` |

Complex gift tasks also use a separate Gemini-powered research step with Google Search grounding before the final complex answer is generated.

## Kapruka MCP Tools

Kade talks to Kapruka through the public MCP endpoint:

```text
https://mcp.kapruka.com/mcp
```

The app uses MCP tool calls for:

- Product search
- Category lookup
- Delivery city lookup
- Delivery quote checks
- Guest checkout link creation
- Order tracking

No Kapruka API key is required.

## Tech Stack

| Layer | Technology |
| --- | --- |
| Framework | Next.js 16 App Router |
| UI | React 19, CSS Modules |
| AI SDK | `@google/genai` |
| Icons | `lucide-react` |
| Animation | `framer-motion` |
| Shopping backend | Kapruka MCP |
| Voice | Browser-to-Gemini Live with ephemeral tokens |
| Storage | Browser local storage for local chat/cart state |
| Hosting target | Vercel |

## Environment Variables

Create `.env.local` in the project root:

```env
GEMINI_API_KEY=your_google_ai_studio_key
```

Optional:

```env
GEMINI_LIVE_MODEL=gemini-3.1-flash-live-preview
```

There is no public voice WebSocket URL in the current architecture.

## Local Development

```bash
npm install
npm run dev
```

Open:

```text
http://localhost:3000
```

Production build:

```bash
npm run build
npm run start
```

## Deployment

The app is designed to run on Vercel as a single Next.js deployment.

In Vercel, set:

```env
GEMINI_API_KEY=your_google_ai_studio_key
```

Optional:

```env
GEMINI_LIVE_MODEL=gemini-3.1-flash-live-preview
```

Recommended Vercel import settings:

| Setting | Value |
| --- | --- |
| Framework preset | Next.js |
| Build command | `npm run build` |
| Output directory | Next.js default |
| Install command | `npm install` |

No additional voice service is needed for the current voice implementation.

## Project Structure

```text
kade-ai/
  app/
    api/
      agent/route.ts
      categories/route.ts
      chat/route.ts
      cities/route.ts
      delivery/route.ts
      live-token/route.ts
      order/route.ts
      search/route.ts
      track/route.ts
    globals.css
    layout.tsx
    page.module.css
    page.tsx
  lib/
    agent.ts
    complex.ts
    gemini.ts
    intent.ts
    mcp.ts
    models.ts
    personality.ts
    types.ts
  package.json
  next.config.ts
  tsconfig.json
```

## Key Files

- [app/page.tsx](app/page.tsx): Main shopping UI, cart/product/checkout panels, voice overlay
- [app/api/chat/route.ts](app/api/chat/route.ts): Main chat orchestration and Kapruka tool dispatch
- [app/api/live-token/route.ts](app/api/live-token/route.ts): Gemini Live ephemeral token endpoint
- [lib/gemini.ts](lib/gemini.ts): Gemini/Gemma calls, tool declarations, grounded research helper
- [lib/intent.ts](lib/intent.ts): Intent classifier and direct-search routing rules
- [lib/complex.ts](lib/complex.ts): Complex gift reasoning and smart search translation prompt
- [lib/personality.ts](lib/personality.ts): Kade system prompt and voice/text behavior rules
- [lib/mcp.ts](lib/mcp.ts): Kapruka MCP client

## Current Behavior Notes

- Simple product searches route to Gemini Flash and Kapruka product search.
- Complex emotional/gift scenarios route through complex reasoning.
- If the user has already provided enough product detail, routing skips unnecessary clarification and searches directly.
- Foodie and other personality traits are translated into concrete Kapruka search terms before product search.
- Voice mode uses the selected Gemini Live voice from the UI and defaults to `Aoede`.

## Built For

Kapruka Agent Challenge 2026.

The judging target is a hosted, full-screen shopping assistant where customers can browse products, get delivery quotes, and complete checkout through Kapruka.

## License

MIT
