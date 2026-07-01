// Agent regression evals — hit the real Anthropic + Kapruka APIs.
// Requires ANTHROPIC_API_KEY in the environment.
// Run with: npm run test:evals
import { test, expect } from "@playwright/test";

test.skip(!process.env.RUN_EVALS, "set RUN_EVALS=1 to run agent evals");

test("occasion search: birthday gift query returns product cards", async ({ page }) => {
  await page.goto("/");

  const input = page.getByRole("textbox");
  await expect(input).toBeVisible({ timeout: 15_000 });

  await input.fill("birthday gift for a 10 year old boy under 3000 rupees");
  await input.press("Enter");

  // Expect product cards to render
  const cards = page.locator('[data-testid="product-card"]');
  await expect(cards.first()).toBeVisible({ timeout: 90_000 });
  expect(await cards.count()).toBeGreaterThan(0);

  // The product list should not be repeated as plain message text
  const bubbles = page.locator(".prose");
  const bubbleCount = await bubbles.count();
  for (let i = 0; i < bubbleCount; i++) {
    const text = await bubbles.nth(i).textContent();
    expect(text).not.toMatch(/^\s*\d+\.\s+.+\nRs/m);
  }
});

test("clarifying questions: vague gift query returns clarifying card", async ({ page }) => {
  await page.goto("/");

  const input = page.getByRole("textbox");
  await expect(input).toBeVisible({ timeout: 15_000 });

  await input.fill("I need a gift");
  await input.press("Enter");

  const card = page.locator('[data-testid="clarifying-questions-card"]');
  await expect(card).toBeVisible({ timeout: 90_000 });

  // The card should have at least one option chip (button inside the card)
  const chips = card.locator("button");
  await expect(chips.first()).toBeVisible();
});

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

test("city canonicalization: 'Candy' resolves to Kandy or triggers clarification", async ({ page }) => {
  await page.goto("/");

  const input = page.getByRole("textbox");
  await expect(input).toBeVisible({ timeout: 15_000 });

  // First get a product in the cart
  await input.fill("show me birthday cakes");
  await input.press("Enter");
  const cards = page.locator('[data-testid="product-card"]');
  await expect(cards.first()).toBeVisible({ timeout: 90_000 });
  await cards.first().getByRole("button", { name: "Add to cart" }).click();

  // Close cart if it opens
  const cartClose = page.locator('[data-testid="cart-close"]');
  if (await cartClose.isVisible()) {
    await cartClose.click();
  }

  // Now ask for delivery to misspelled city
  await input.fill("deliver to Candy");
  await input.press("Enter");

  // Agent should mention Kandy (corrected) in its reply or ask for clarification
  const assistantText = page.locator(".prose, [data-testid='clarifying-questions-card']");
  await expect(assistantText.first()).toBeVisible({ timeout: 90_000 });

  const pageText = await page.locator("body").textContent();
  expect(pageText?.toLowerCase()).toContain("kandy");

  // No error banner should be visible
  await expect(page.locator("text=Something went wrong while replying.")).not.toBeVisible();
});
