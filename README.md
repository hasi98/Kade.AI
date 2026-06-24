# 🌺 Kade AI - Your Sri Lankan Shopping Companion

> **Built for the Kapruka Agent Challenge 2026**  
> *"After talking to Kade, you'll never go back to the Kapruka website."*

<div align="center">

![Kade AI](https://img.shields.io/badge/Kade_AI-Shopping_Agent-E8A020?style=for-the-badge)
![Next.js](https://img.shields.io/badge/Next.js_16-App_Router-000000?style=for-the-badge&logo=nextdotjs)
![Gemini](https://img.shields.io/badge/Google_Gemini-Multi--Model-4285F4?style=for-the-badge&logo=google)
![Kapruka MCP](https://img.shields.io/badge/Kapruka-MCP_Connected-8B0000?style=for-the-badge)
![Vercel](https://img.shields.io/badge/Hosted_on-Vercel-000000?style=for-the-badge&logo=vercel)

**[🛍️ Live Demo](https://kade-ai.vercel.app/)** &nbsp;|&nbsp;  **[🐛 Report Issue](https://github.com/hasi98/Kade.AI/issues)**

</div>

---

## ✨ What is Kade AI?

Kade AI is a full-screen, conversational AI shopping agent built on top of [Kapruka](https://www.kapruka.com) - Sri Lanka's largest e-commerce platform. It's not a chatbot. It's not a search engine. It's your warm, friendly Sri Lankan shopping companion that speaks your language - **Sinhala, Tamil, Singlish, and Tanglish** - and genuinely helps you find the perfect thing.

Think of Kade as that one friend who knows every shop in Colombo and actually wants to help you find the right gift - not just push products at you.

```
User:  "Machan I messed up with my wife, need to fix this fast 😭"

Kade:  "Aiyo machan... okay okay, don't panic - I got you 😄
        Flowers alone won't cut it, but flowers + a heartfelt 
        personal note? That hits different. I'll even help you 
        write the note. Does she prefer roses or something more 
        colourful? 🌸"
```

---

## 🎯 Features

### 🗣️ Natural Language Shopping
Talk to Kade the way you actually talk - mix Sinhala, English, Singlish, and Tanglish freely. Kade understands and responds in kind.

### 🧠 Smart Multi-Model AI Routing
Kade uses multiple models intelligently based on what you need:
- **Gemini 3.1 Flash** - fast, snappy responses for everyday chat
- **Gemma 4 31B** - deep reasoning for complex gift advice and emotional situations
- **Gemma 4 26B** - lightweight intent classifier to decide routing
- **Gemini 3.1 Flash Live** - real-time voice conversations (fully duplex!)

Complex gift tasks also use a **Google Search grounding step** before the final answer - so Kade researches what people like before searching Kapruka.

### 🛒 Full Shopping Flow - End to End
- 🔍 Search 120,000+ products on Kapruka live
- 📂 Browse all Kapruka categories
- 🏙️ Delivery city lookup across Sri Lanka
- 📦 Real-time delivery availability and quotes
- 🎁 Gift wrap, personal note, and extras
- ✅ Guest checkout - no account needed, 60-minute locked prices
- 📍 Track existing orders with live status updates

### 🎤 Live Voice Mode
Tap the mic and just talk. Kade listens, thinks, and talks back in real time using **Gemini Live API with ephemeral tokens** - no separate voice server needed. Full duplex - interrupt anytime.

### 🌗 Smart Theme Switching
- Uses the browser's **Ambient Light Sensor** if available - theme switches automatically based on room lighting
- Falls back to your **OS dark/light preference**
- Manual toggle always available

### 💾 Persistent Memory
Kade remembers your cart, preferences, and chat history in the browser - even after a refresh. Returns are greeted warmly:
> *"හෙලෝ, welcome back! Last time you were looking at birthday cakes ne - did that work out? 🌺"*

### 🌺 Distinctly Sri Lankan
- Sinhala, Tamil, Singlish, and Tanglish support throughout
- Warm, friendly personality - not corporate, not robotic
- Understands local context: New Year gifts, Avurudu, corporate hampers, sending gifts overseas

---

## 🏗️ Architecture

```
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
  |-- Live Voice Token API
  |     app/api/live-token/route.ts
  |       - creates short-lived Gemini Live ephemeral tokens
  |       - browser connects directly to Gemini Live
  |       - no separate voice server needed
  |
  |-- Gemini / Gemma
  |     lib/gemini.ts
  |     lib/intent.ts
  |     lib/models.ts
  |
  |-- Kapruka MCP
        https://mcp.kapruka.com/mcp
```

Voice runs entirely through the browser using ephemeral tokens, with no separate voice server and no extra hosting costs.

---

## 🤖 Model Stack

| Purpose | Model |
|---------|-------|
| Main text chat | `gemini-3.1-flash-preview` |
| Complex reasoning + gift advice | `gemma-4-31b-it` |
| Intent classification | `gemma-4-26b-a4b-it` |
| Real-time voice | `gemini-3.1-flash-live-preview` |
| Voice fallback | `gemini-2.5-flash-native-audio-latest` |

All models used are from Google AI Studio.

---


## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 App Router |
| UI | React 19, CSS Modules |
| Animations | Framer Motion |
| Icons | Lucide React |
| AI SDK | `@google/genai` |
| Shopping backend | Kapruka MCP |
| Voice | Browser-to-Gemini Live with ephemeral tokens |
| Storage | Browser localStorage (cart, chat history, preferences) |
| Hosting | Vercel (single deployment, no extra services) |

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- A [Google AI Studio](https://aistudio.google.com) API key

### Installation

```bash
# Clone the repo
git clone https://github.com/hasi98/kade-ai.git
cd kade-ai

# Install dependencies
npm install

# Create .env.local and add your GEMINI_API_KEY

# Run the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see Kade AI.

### Environment Variables

```env
# Required
GEMINI_API_KEY=your_google_ai_studio_key

# Optional - override default voice model
GEMINI_LIVE_MODEL=gemini-3.1-flash-live-preview
```

---

## 🌍 Deployment

The entire app deploys as a **single Next.js app on Vercel** - no extra services needed.

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

Set in Vercel dashboard:

| Variable | Value |
|----------|-------|
| `GEMINI_API_KEY` | Your Google AI Studio key |
| `GEMINI_LIVE_MODEL` | `gemini-3.1-flash-live-preview` (optional) |

Recommended Vercel settings:

| Setting | Value |
|---------|-------|
| Framework preset | Next.js |
| Build command | `npm run build` |
| Output directory | Next.js default |
| Install command | `npm install` |

---

## 📁 Project Structure

```
kade-ai/
  app/
    api/
      agent/route.ts         # Agent orchestration
      categories/route.ts    # Category listing
      chat/route.ts          # Main chat + MCP dispatch
      cities/route.ts        # Delivery city lookup
      delivery/route.ts      # Delivery availability
      live-token/route.ts    # Gemini Live ephemeral tokens
      order/route.ts         # Order creation
      search/route.ts        # Product search
      track/route.ts         # Order tracking
    globals.css
    layout.tsx
    page.module.css
    page.tsx                 # Main shopping UI
  lib/
    agent.ts                 # Agent logic
    complex.ts               # Complex gift reasoning prompt
    gemini.ts                # Gemini/Gemma calls + grounding
    intent.ts                # Intent classifier + routing rules
    mcp.ts                   # Kapruka MCP client
    models.ts                # Model constants
    personality.ts           # Kade system prompt + behavior rules
    types.ts                 # Shared TypeScript types
  package.json
  next.config.ts
  tsconfig.json
```

---

## 🧠 How Kade Thinks

### Simple request → fast path
```
"Show me chocolate cakes under Rs. 3000"
        ↓
gemma-4-26b classifies → SIMPLE
        ↓
gemini-3.1-flash-preview searches Kapruka directly
        ↓
Results shown instantly
```

### Complex request → reasoning path
```
"What gift would my girlfriend love for her birthday?
 She's really into self care and cozy things."
        ↓
gemma-4-26b classifies → COMPLEX
        ↓
gemma-4-31b profiles the recipient from conversation
        ↓
Google Search grounding researches gift ideas for
"self care cozy gifts women Sri Lanka"
        ↓
Translates to Kapruka search terms:
"luxury spa gift set", "Spa Ceylon", "wellness hamper"
        ↓
Kapruka MCP returns real products
        ↓
gemma-4-31b presents with warm reasoning
```

---

## 🏆 Built for Kapruka Agent Challenge 2026

This project is an entry for the [Kapruka Agent Challenge](https://www.kapruka.com/contactUs/agentChallenge.html) - a competition to build the best AI shopping agent on Kapruka's MCP server.

**Scoring criteria met:**

| Criteria | Points | How Kade addresses it |
|----------|--------|-----------------------|
| Experience & polish | 30 | Full-screen 3-panel UI, smooth animations, warm UX |
| Visual richness | 20 | Product image cards, carousels, delivery info panels |
| Personality | 15 | Warm Sri Lankan friend, Singlish, empathy first |
| Genuinely helpful | 15 | Smart gift profiling, Google Search + MCP combined |
| End-to-end checkout | 15 | Guest checkout link, order tracking |
| Creativity | 5 | Live voice, ambient light sensor, multi-model routing |
| **Bonus** | +extra | Sinhala, Tamil, Singlish, Tanglish support |

---

## 👨‍💻 Built By

**Hasith Lakshan** - Self-taught full-stack developer from Sri Lanka 🇱🇰

- 🌐 [hasithlakshan.dev](https://hasithlakshan.dev)
- 💻 [github.com/hasi98](https://github.com/hasi98)
- 🛍️ [CloudPipe](https://cloudpipe.app) · [Portlora](https://portlora.com)

---

## 📄 License

MIT License

---

<div align="center">
  <p>Made with ❤️ and a lot of <em>aiyo</em> moments in Sri Lanka 🌺</p>
  <p><strong>Kade AI - Shop Sri Lanka, your way.</strong></p>
</div>
