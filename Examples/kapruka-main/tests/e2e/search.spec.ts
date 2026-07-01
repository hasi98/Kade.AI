import { test, expect } from "@playwright/test";

test("search query returns product cards", async ({ page }) => {
  await page.goto("/");

  // Wait for the chat input to be ready
  const input = page.getByRole("textbox");
  await expect(input).toBeVisible({ timeout: 15_000 });

  await input.fill("show me some birthday cakes");
  await input.press("Enter");

  // Wait for product cards — Claude will search and stream results
  const cards = page.locator('[data-testid="product-card"]');
  await expect(cards.first()).toBeVisible({ timeout: 90_000 });
  expect(await cards.count()).toBeGreaterThan(0);
});

test("search with price filter returns products within range", async ({
  page,
}) => {
  await page.goto("/");

  const input = page.getByRole("textbox");
  await expect(input).toBeVisible({ timeout: 15_000 });

  await input.fill("show me chocolates under LKR 2000");
  await input.press("Enter");

  const cards = page.locator('[data-testid="product-card"]');
  await expect(cards.first()).toBeVisible({ timeout: 90_000 });
});
