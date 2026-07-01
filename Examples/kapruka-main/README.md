# Kapruka Concierge

A warm, AI-powered personal shopping concierge for [Kapruka.com](https://kapruka.com) — Sri Lanka's largest e-commerce and gifting platform. Built for the **Kapruka Agent Challenge 2026**.

> Live URL: *(add after deployment)*

---

## Features

- **Streaming chat with generative UI** — product carousels, delivery cards, checkout cards, and clarifying-question forms render directly in the chat as the agent calls tools
- **Persistent multi-item cart** — animated slide-in drawer with live subtotal, delivery fee, and order total
- **Full checkout flow** — recipient details, delivery city + date lookup, creates a real Kapruka guest-checkout pay link (no payment is ever auto-completed)
- **Voice mode** — OpenAI Realtime API (WebRTC); the agent switches to a voice-optimized system prompt and injects the existing text conversation so it picks up in context
- **Sinhala / Tanglish support** — detects the user's language and responds naturally in Sinhala or mixed Tanglish
- **Gift messages + cake icing text** — parchment-style gift card UI; icing text passed through to the order
- **Live credits badge** — shows API usage in real time

---

## Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 App Router |
| AI | Vercel AI SDK · Claude (`claude-sonnet-4-6` default) |
| MCP | Kapruka MCP server — server-side client with in-memory cache + 60 req/min throttle |
| Styling | Tailwind CSS 4 · Framer Motion |
| State | Zustand (cart store) |
| Voice | OpenAI Realtime API (WebRTC) |

---

## Architecture

```
Browser (full-screen chat UI)
  → /api/chat  (Vercel AI SDK · streaming · tool loop)
      → Kapruka MCP client (server-side · in-memory cache · 60/min throttle)
  ← streamed text + structured tool results
Custom React components render tool results as rich generative UI
```

Cart mutations follow a deliberate indirection: the `/api/chat` route echoes cart tool arguments back as the tool result, and client-side executor components in `src/components/ToolResult/CartExecutors.tsx` fire `useEffect` hooks to mutate the Zustand cart store. This keeps cart state purely client-side while keeping the agent in control of when mutations happen.

---

## Screenshots

*(add after deployment)*

---

## Run locally

```bash
pnpm install

# Copy and fill in your keys
cp .env.example .env.local
# Required: ANTHROPIC_API_KEY
# Optional: OPENAI_API_KEY  (enables voice mode)

pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

> **Note:** `kapruka_create_order` creates real Kapruka guest-checkout pay links but no payment is ever auto-completed in the demo.
