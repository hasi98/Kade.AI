import { test, expect } from "@playwright/test";

test("cart panel opens and closes without the agent", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("textbox")).toBeVisible({ timeout: 15_000 });

  // Panel is not in DOM yet
  await expect(page.locator('[data-testid="cart-sidebar"]')).not.toBeVisible();

  // Open
  await page.locator('[data-testid="cart-button"]').click();
  await expect(page.locator('[data-testid="cart-sidebar"]')).toBeVisible();

  // Close via X button
  await page.locator('[data-testid="cart-close"]').click();
  await expect(page.locator('[data-testid="cart-sidebar"]')).not.toBeVisible();
});

test("cart panel closes when backdrop is clicked", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("textbox")).toBeVisible({ timeout: 15_000 });

  await page.locator('[data-testid="cart-button"]').click();
  await expect(page.locator('[data-testid="cart-sidebar"]')).toBeVisible();

  await page.locator('[data-testid="cart-backdrop"]').click();
  await expect(page.locator('[data-testid="cart-sidebar"]')).not.toBeVisible();
});

test("adding two different products gives cart count of 2", async ({ page }) => {
  await page.goto("/");

  const input = page.getByRole("textbox");
  await expect(input).toBeVisible({ timeout: 15_000 });

  await input.fill("show me birthday cakes");
  await input.press("Enter");

  const cards = page.locator('[data-testid="product-card"]');
  await expect(cards.nth(1)).toBeVisible({ timeout: 90_000 });

  // Add first card
  await cards.first().getByRole("button", { name: "Add to cart" }).click();

  // Cart opens automatically — close it so the second card is clickable
  await page.locator('[data-testid="cart-close"]').click();
  await expect(page.locator('[data-testid="cart-sidebar"]')).not.toBeVisible();

  // Add second card
  await cards.nth(1).getByRole("button", { name: "Add to cart" }).click();

  const cartCount = page.locator('[data-testid="cart-count"]');
  await expect(cartCount).toHaveText("2");
});

test("cart total appears in header after adding an item", async ({ page }) => {
  await page.goto("/");

  const input = page.getByRole("textbox");
  await expect(input).toBeVisible({ timeout: 15_000 });

  await input.fill("show me birthday cakes");
  await input.press("Enter");

  const firstCard = page.locator('[data-testid="product-card"]').first();
  await expect(firstCard).toBeVisible({ timeout: 90_000 });
  await firstCard.getByRole("button", { name: "Add to cart" }).click();

  // Header shows "· Rs X,XXX" next to the cart button on desktop viewport
  const cartButton = page.locator('[data-testid="cart-button"]');
  await expect(cartButton).toContainText("Rs");
});

test("agent proactively adds item to cart from natural language", async ({
  page,
}) => {
  await page.goto("/");

  const input = page.getByRole("textbox");
  await expect(input).toBeVisible({ timeout: 15_000 });

  // The agent is instructed to call cart_add_item proactively when
  // the user clearly wants a specific product
  await input.fill("add a birthday chocolate cake to my cart");
  await input.press("Enter");

  // Cart count badge only renders when count > 0
  const cartCount = page.locator('[data-testid="cart-count"]');
  await expect(cartCount).toBeVisible({ timeout: 90_000 });
  expect(parseInt(await cartCount.textContent() ?? "0")).toBeGreaterThan(0);
});

test("manually adding product card updates cart count", async ({ page }) => {
  await page.goto("/");

  const input = page.getByRole("textbox");
  await expect(input).toBeVisible({ timeout: 15_000 });

  await input.fill("show me birthday cakes");
  await input.press("Enter");

  // Wait for product cards to appear
  const firstCard = page.locator('[data-testid="product-card"]').first();
  await expect(firstCard).toBeVisible({ timeout: 90_000 });

  // Click add-to-cart on the first in-stock product card
  const addButton = firstCard.getByRole("button", { name: "Add to cart" });
  await addButton.click();

  // Cart count badge should now show 1
  const cartCount = page.locator('[data-testid="cart-count"]');
  await expect(cartCount).toBeVisible({ timeout: 5_000 });
  await expect(cartCount).toHaveText("1");
});
