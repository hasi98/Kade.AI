import type { CartItem, Product } from "@/lib/types";
import type { ShownVoiceProduct, VoiceSessionState } from "@/lib/voiceSessionContext";

export type VoiceContextUpdate = Partial<VoiceSessionState>;

type RealtimeContextSender = (text: string) => void;

const numberWords: Record<string, number> = {
  one: 1,
  first: 1,
  ekweni: 1,
  eka: 1,
  two: 2,
  second: 2,
  dekweni: 2,
  dekai: 2,
  three: 3,
  third: 3,
  tinweni: 3,
  thun: 3,
  four: 4,
  fourth: 4,
  hatarai: 4,
  five: 5,
  fifth: 5,
  paha: 5,
};

export function toShownVoiceProducts(products: Product[]): ShownVoiceProduct[] {
  return products.map((product, index) => ({
    index: index + 1,
    id: product.id,
    name: product.name,
    price: product.price?.amount ?? 0,
    imageUrl: product.image_url || product.images?.[0] || "",
    category: product.category?.name || product.category?.slug || "Kapruka product",
    inStock: product.in_stock,
  }));
}

export function resolveProductReference(spokenText: string, shownProducts: ShownVoiceProduct[]) {
  const lower = spokenText.toLowerCase();

  for (const [word, num] of Object.entries(numberWords)) {
    if (new RegExp(`\\b${word}\\b`, "i").test(lower)) {
      return shownProducts[num - 1] ?? null;
    }
  }

  const digitMatch = lower.match(/\b#?(\d+)(?:st|nd|rd|th)?\b/);
  if (digitMatch) {
    const index = Number.parseInt(digitMatch[1], 10) - 1;
    if (index >= 0 && index < shownProducts.length) return shownProducts[index];
  }

  if (/\b(cheap|cheapest|laabu|low price|lowest)\b/.test(lower)) {
    return shownProducts.reduce<ShownVoiceProduct | null>((best, product) => {
      if (!best) return product;
      return product.price < best.price ? product : best;
    }, null);
  }

  if (/\b(best|hoda|premium|expensive|grand)\b/.test(lower)) {
    return shownProducts.reduce<ShownVoiceProduct | null>((best, product) => {
      if (!best) return product;
      return product.price > best.price ? product : best;
    }, null);
  }

  const words = lower.split(/\s+/).filter((word) => word.length > 3);
  return shownProducts.find((product) => {
    const name = product.name.toLowerCase();
    return words.some((word) => name.includes(word));
  }) ?? null;
}

export class VoiceBridge {
  private context: VoiceSessionState | null = null;
  private sender: RealtimeContextSender | null = null;
  private contextUpdateCallback: ((update: VoiceContextUpdate) => void) | null = null;

  onContextUpdate(cb: (update: VoiceContextUpdate) => void) {
    this.contextUpdateCallback = cb;
  }

  setContext(context: VoiceSessionState) {
    this.context = context;
  }

  setContextSender(sender: RealtimeContextSender | null) {
    this.sender = sender;
  }

  handleAssistantText(text: string) {
    this.contextUpdateCallback?.({
      transcript: [...(this.context?.transcript ?? []), { role: "assistant", text, timestamp: Date.now() }],
    });
  }

  handleUserText(text: string) {
    const lower = text.toLowerCase();
    const budget = extractBudget(lower);
    const occasion = extractOccasion(lower);
    const recipient = extractRecipient(lower);

    this.contextUpdateCallback?.({
      transcript: [...(this.context?.transcript ?? []), { role: "user", text, timestamp: Date.now() }],
      detectedBudget: budget ?? this.context?.detectedBudget ?? null,
      detectedOccasion: occasion ?? this.context?.detectedOccasion ?? null,
      detectedRecipient: recipient ?? this.context?.detectedRecipient ?? null,
    });
  }

  updateGeminiContext(products: ShownVoiceProduct[], cartItems: CartItem[]) {
    if (!this.sender) return;
    const cartTotal = cartItems.reduce((sum, item) => sum + (item.product.price?.amount ?? 0) * item.quantity, 0);
    const productSummary = products
      .map((product) => `${product.index}. ${product.name} Rs.${product.price.toLocaleString("en-LK")}`)
      .join(", ");

    this.sender(
      `[SYSTEM CONTEXT UPDATE - do not say this aloud, do not quote it, do not treat it as a user message. Currently showing ${products.length} products: ${productSummary || "none"}. Cart has ${cartItems.length} items, total Rs.${cartTotal.toLocaleString("en-LK")}. Visible products are context, not a limit. If the user asks for more, another type, different options, or a new product/category, call kapruka_search_products again.]`
    );
  }
}

function extractBudget(text: string) {
  const match = text.match(/(?:rs\.?\s*)?(\d{1,3}(?:,\d{3})+|\d+)\s*(k|000|rupees?|lkr|rs)?/i);
  if (!match) return null;
  const base = Number.parseInt(match[1].replace(/,/g, ""), 10);
  if (Number.isNaN(base)) return null;
  return match[2]?.toLowerCase() === "k" ? base * 1000 : base;
}

function extractOccasion(text: string) {
  if (/\b(birthday|bday|upandin|piranda)\b/.test(text)) return "birthday";
  if (/\b(wedding|magul)\b/.test(text)) return "wedding";
  if (/\b(anniversary)\b/.test(text)) return "anniversary";
  if (/\b(sorry|apology|messed up|angry|fix)\b/.test(text)) return "apology";
  return null;
}

function extractRecipient(text: string) {
  if (/\b(girlfriend|gf|wife|kella)\b/.test(text)) return "partner";
  if (/\b(amma|mother|mom|mum)\b/.test(text)) return "mother";
  if (/\b(appa|father|dad)\b/.test(text)) return "father";
  if (/\b(friend|yaluwa)\b/.test(text)) return "friend";
  return null;
}
