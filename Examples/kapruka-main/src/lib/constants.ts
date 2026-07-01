export const RAIL_CATEGORIES = [
  { label: "Flowers", emoji: "🌸" },
  { label: "Cakes", emoji: "🍰" },
  { label: "Chocolates", emoji: "🍫" },
  { label: "Hampers", emoji: "🧺" },
  { label: "Electronics", emoji: "🎧" },
];

export const STARTER_PROMPTS = [
  { emoji: "🌸", label: "Flowers", sub: "Fresh bouquets delivered" },
  { emoji: "🍰", label: "Cakes", sub: "For every occasion" },
  { emoji: "🎁", label: "Hampers", sub: "Curated gift sets" },
  { emoji: "🎧", label: "Electronics", sub: "Gadgets & tech" },
];

export function categoryPrompt(label: string) {
  return `Show me ${label.toLowerCase()}`;
}
