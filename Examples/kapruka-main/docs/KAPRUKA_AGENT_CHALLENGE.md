# Kapruka Agent Challenge · 2026

> 🇱🇰 For Sri Lankan developers

**Build Sri Lanka's most innovative AI shopping agent.**

Kapruka has opened up the Kapruka MCP — the same tools that power search, delivery and checkout across Sri Lanka's largest e-commerce platform. Your mission: turn it into a beautiful, full-screen chat shopping experience that real customers would love to use. **The best one wins an Apple M4 Mac Mini.**

- Free, public MCP — no API key
- Judged by the Kapruka tech team
- Entries close **30 June 2026**

---

## Why This Matters

**Real infrastructure. Real customers. Real stakes.**

This isn't a toy hackathon dataset. The Kapruka MCP connects to live products, live delivery quotes and live guest checkout. Whatever you build is something you can ship, demo to anyone, and put on your résumé — agentic commerce is one of the most in-demand skills in the world right now, and almost nobody has done it on Sri Lankan retail. **Be first.**

| | |
|---|---|
| 🛒 **Production e-commerce** | Search a real catalog, browse categories, quote delivery to any Sri Lankan address, and create real guest-checkout orders with pay links. |
| ⚡ **Zero setup friction** | The MCP is free and public. No sign-up, no API key, no rate-limit paperwork. Point your agent at one URL and start building today. |
| 🏆 **Seen by Kapruka** | The engineering team judges every entry. The standout could shape how Kapruka itself does conversational shopping. |

---

## The Brief — What You're Building

A hosted, public demo that just works — a link anyone (including the judges) can open and immediately start shopping. They care less about how it's built and more about how it *feels*. Surprise them.

- 💬 **Full-screen chat UI** — A polished, immersive conversation as the main surface — not a tiny widget in a corner. Make it feel like the future of shopping.
- 🎨 **Very visual** — Show products beautifully — images, cards, carousels, rich results. The agent should feel alive, not like a wall of text.
- 😊 **Personality** — Give your agent a voice and a point of view. Helpful, witty, warm — whatever makes people want to keep chatting.
- 🔎 **Genuinely helpful** — Help customers discover the right gift or product and guide them confidently from "I'm not sure" to "add to cart".
- 🧾 **All the way to checkout** — Take the customer through selecting goods, delivery details and a working checkout. Close the loop end to end.
- 🌐 **Live on a public URL** — Deploy it on a domain or subdomain that stays up. If the judges can't open it, it can't win — so make it reliable.

---

## How to Enter

1. **Register** — Fill in the short entry form to register your spot. It takes about a minute.
2. **Connect the MCP** — Point your agent at `mcp.kapruka.com/mcp` and explore the tools (see Resources below).
3. **Build & host** — Create your shopping agent and deploy it to a public URL that stays up.
4. **Submit your demo** — Send your live link before 30 June 2026. The Kapruka tech team takes it from there.

---

## The Prize

### 🏆 GRAND PRIZE — Apple M4 Mac Mini

The build machine every developer wants — silent, tiny, and seriously fast. Yours if you build the best shopping agent in the country.

- Apple M4 chip — 10-core CPU, 10-core GPU
- 16-core Neural Engine — built for on-device AI
- 16GB unified memory
- 512GB SSD storage
- Gigabit Ethernet + Apple Intelligence

**Winner takes home:** 1× M4 Mac Mini — Retail value ≈ USD 799

One grand prize. In the rare event of a very close call, the judges may add a 2nd and 3rd place — but the goal is one clear winner.

---

## Resources — Everything You Need to Start

The MCP is free, public and read-to-write capable (search, categories, delivery, create order, track order). Full docs live at **mcp.kapruka.com**.

**MCP Endpoint:**
```
https://mcp.kapruka.com/mcp
```

**Claude Desktop config** (`claude_desktop_config.json`):
```json
{
  "mcpServers": {
    "kapruka": {
      "command": "npx",
      "args": ["-y", "mcp-remote", "https://mcp.kapruka.com/mcp"]
    }
  }
}
```

- 📖 Full documentation — mcp.kapruka.com
- 💻 Source on GitHub
- 🛍️ Browse Kapruka — kapruka.com

---

## The Fine Print — Eligibility & Rules

- Open to **Sri Lankans based in Sri Lanka**. (This round is local — not for the diaspora.)
- **Solo builders only** — one person, one entry, one prize.
- Your submission must be a **live, public URL** that works when judged.
- Build on the **Kapruka MCP**. Use any model, framework or hosting you like.
- Keep it respectful of customers and the catalog — no spam, no abuse of the live order tools.
- **Entries close 30 June 2026.**

---

## How We Score — The Rubric (out of 100)

No mystery, no vibes-only judging. Here's exactly how the Kapruka tech team scores every entry.

| Criterion | What it measures | Points |
|---|---|---:|
| **Experience & polish** | Does it look and feel genuinely amazing? | 30 |
| **Visual richness** | Products shown beautifully — not a wall of text. | 20 |
| **Personality** | An agent people actually enjoy talking to. | 15 |
| **Usefulness** | Does it really help someone shop and decide? | 15 |
| **End-to-end completeness** | Discovery all the way through to a working checkout. | 15 |
| **Creativity** | Show us something we didn't see coming. | 5 |
| **Total** | | **100** |

### ⭐ Bonus Points — Go Where Others Won't

Nail the hard stuff and you'll pull ahead of the pack. These separate a demo from a product:

- 🛒 Multi-item carts
- 📅 Delivery-date constraints
- 🎁 Gift messaging
- 💬 Tanglish conversation
- 🇱🇰 **Sinhala-language support** — Sinhala especially fits Kapruka's market perfectly and almost no one will attempt it. Pull it off and you'll stand out instantly.

---

## Timeline — Key Dates

- **Now — open** — Registration is live. Submit the form and start building.
- **Through June** — Build and host your agent. Reach out if you hit a wall with the MCP.
- **30 June 2026** — Submissions close. Your live demo link must be in by end of day.

---

## FAQ

**Do I need a Kapruka API key?**
No. The MCP at `mcp.kapruka.com/mcp` is free and public — no key, no sign-up. Just connect and build.

**What can the MCP actually do?**
Search the catalog, browse categories, quote delivery, create guest-checkout orders, and track orders.

**Which AI model or framework should I use?**
Any model, framework or hosting you like.

**Can I enter as a team?**
No — solo builders only. One person, one entry, one prize.

**Does the demo really need to be hosted?**
Yes — it must be a live, public URL that works when judged.

**What if there are two amazing entries?**
There's one grand prize, but in a very close call the judges may add 2nd and 3rd place.

---

© 2026 Kapruka Holdings PLC · The Kapruka Agent Challenge
MCP docs · GitHub · Kapruka.com
