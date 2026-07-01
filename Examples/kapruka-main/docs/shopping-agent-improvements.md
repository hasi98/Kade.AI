# Shopping Agent — What Makes Them Amazing

## The Big Differentiators

**1. Occasion/Intent-based discovery (highest impact)**
Instead of "search for shoes," handle "I need a birthday gift for a 10-year-old boy under 3000 rupees that delivers by Friday." This requires the agent to decompose intent → run parallel searches → filter → rank → present a curated shortlist. Most agents don't do this well.

**2. Rich product cards with micro-UX**
- Inline "Add to Cart" without breaking conversation flow
- Image thumbnails (use `width=200` in the Kapruka image URL for cards)
- Price + delivery estimate shown together
- Star ratings if available from the MCP

**3. Comparison mode**
"Compare these 3 TVs" → render a proper side-by-side table in the chat. Extremely useful, visually impressive for judges.

**4. Proactive cart coaching**
When the user has items in cart: "You're 500 rupees away from free shipping" or "3 of your 4 items are from the same seller — might ship together." Use the cart state already passed on every request.

**5. Multilingual fluency (Kavya)**
Full Sinhala product names in responses, not just English. Judges at a Sri Lanka competition will notice this.

**6. Order status embedded in chat**
"Your order #12345 is out for delivery" right in the conversation, not a redirect to a separate page.

## What Competition Winners Usually Have

- **One killer demo flow** — a 2-minute walkthrough that hits every feature. Example: "Amma's birthday is Sunday, budget is 5000 rupees" → agent researches, compares, adds to cart, confirms delivery to an apartment in Colombo, checks out.
- **Error recovery that feels human** — "Sorry, that's out of stock, but here's something similar at the same price"
- **Speed** — streaming responses with skeleton loaders for tool calls, not a blank screen for 3 seconds

## Highest ROI for This Stack (Vercel AI SDK v6 + Zustand)

1. **Parallel tool calls** for multi-product queries — run 3 searches simultaneously, merge results
2. **A proper comparison table component** in `ToolResultView.tsx`
3. **Cart-aware suggestions** in the system prompt using live cart state
4. **Structured occasion prompts** — starter prompts on the landing page that showcase the agent's real capabilities

## References
- Perplexity Shopping, Amazon Rufus, competition-winning agent patterns
