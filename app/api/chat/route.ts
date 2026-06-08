import { NextRequest } from "next/server";
import { assistantCopy, extractSearchIntent } from "@/lib/agent";
import { chatWithTools } from "@/lib/gemini";
import { callKaprukaTool } from "@/lib/mcp";
import type { Product } from "@/lib/types";
import type { Content } from "@google/genai";

/* ── MCP tool dispatcher ── */

async function handleToolCall(name: string, args: Record<string, unknown>): Promise<unknown> {
  switch (name) {
    case "search_products":
      const rawQuery = String(args.q ?? "gift");
      return searchKaprukaProducts(rawQuery, {
        limit: Number(args.limit ?? 8),
        max_price: typeof args.max_price === "number" ? args.max_price : null,
      });

    case "check_delivery":
      return callKaprukaTool("kapruka_check_delivery", {
        city: args.city,
        delivery_date: normalizeDeliveryDate(args.delivery_date),
        product_id: args.product_id ?? null,
        response_format: "json",
      });

    case "list_categories":
      return callKaprukaTool("kapruka_list_categories", {
        depth: args.depth ?? 2,
        response_format: "json",
      });

    case "list_delivery_cities":
      return callKaprukaTool("kapruka_list_delivery_cities", {
        query: args.query ?? null,
        limit: 25,
        response_format: "json",
      });

    case "track_order":
      return callKaprukaTool("kapruka_track_order", {
        order_number: args.order_number,
        response_format: "json",
      });

    case "create_order":
      return callKaprukaTool("kapruka_create_order", {
        cart: args.cart,
        recipient: {
          name: args.recipient_name,
          phone: args.recipient_phone,
        },
        delivery: {
          address: args.delivery_address,
          city: args.delivery_city,
          date: normalizeDeliveryDate(args.delivery_date) ?? sriLankaDate(1),
          location_type: "house",
          instructions: null,
        },
        sender: {
          name: args.sender_name ?? "Kade AI shopper",
          anonymous: args.anonymous ?? false,
        },
        gift_message: args.gift_message ?? null,
        currency: "LKR",
        response_format: "json",
      });

    default:
      return { error: `Unknown tool: ${name}` };
  }
}

type SearchResult = {
  results?: Product[];
  next_cursor?: string | null;
  applied_filters?: Record<string, unknown>;
};

const SEARCH_CACHE_TTL_MS = 3 * 60 * 1000;
const searchCache = new Map<string, { expiresAt: number; value: SearchResult }>();

function normalizeSearchQuery(rawQuery: string) {
  const lower = rawQuery.toLowerCase();
  if (/\b(cakes?|birthday cake|birthday|ribbon cake|bento cake|keik)\b/.test(lower) || /කේක්|උපන්දින|கேக்|பிறந்தநாள்/.test(rawQuery)) return "birthday";
  if (/\b(flowers?|roses?|bouquet|mal|poo|pookal)\b/.test(lower) || /මල්|රෝස|பூ|மலர்|ரோஜா/.test(rawQuery)) return "roses";
  if (/\b(biscuits?|cookies?|crackers?|biskut|munchee|maliban)\b/.test(lower) || /බිස්කට්|பிஸ்கட்/.test(rawQuery)) return "biscuits";
  if (/\b(chocolates?|choko|soklet)\b/.test(lower) || /චොකලට්|சாக்லேட்/.test(rawQuery)) return "chocolate";
  if (/\b(thagi|thaagi|parisu|gift)\b/.test(lower) || /තෑගි|තෑග්ග|பரிசு/.test(rawQuery)) return "gift";
  return rawQuery.trim() || "gift";
}

function relevanceKind(rawQuery: string) {
  const lower = rawQuery.toLowerCase();
  if (/\b(cakes?|birthday cake|birthday|ribbon cake|bento cake|keik)\b/.test(lower) || /කේක්|උපන්දින|கேக்|பிறந்தநாள்/.test(rawQuery)) return "cake";
  if (/\b(biscuits?|cookies?|crackers?|oreo|munchee|maliban|biskut)\b/.test(lower) || /බිස්කට්|பிஸ்கட்/.test(rawQuery)) return "biscuit";
  if (/\b(flowers?|roses?|bouquet|mal|poo|pookal)\b/.test(lower) || /මල්|රෝස|பூ|மலர்|ரோஜா/.test(rawQuery)) return "flower";
  if (/\b(chocolates?|choko|soklet)\b/.test(lower) || /චොකලට්|சாக்லேட்/.test(rawQuery)) return "chocolate";
  return null;
}

function isShoppingQuery(rawQuery: string) {
  const lower = rawQuery.toLowerCase();
  return (
    /\b(show|find|search|need|want|buy|send|deliver|gift|cake|flower|rose|biscuit|cookie|cracker|chocolate|hamper|cart|checkout|price|budget|hoyala|balanna|denna|ganna|yawanna)\b/.test(lower) ||
    /හොය|බල|දෙන්න|ගන්න|යවන්න|කේක්|උපන්දින|මල්|රෝස|බිස්කට්|චොකලට්|තෑගි|තෑග්ග|මිල/.test(rawQuery) ||
    /தேடு|காட்டு|வாங்க|அனுப்பு|கேக்|பிறந்தநாள்|பூ|மலர்|ரோஜா|பிஸ்கட்|சாக்லேட்|பரிசு|விலை/.test(rawQuery)
  );
}

function productText(product: Product) {
  return `${product.id} ${product.name} ${product.summary ?? ""} ${product.category?.name ?? ""}`.toLowerCase();
}

function isRelevantProduct(product: Product, rawQuery: string) {
  const text = productText(product);
  const kind = relevanceKind(rawQuery);

  if (kind === "cake") {
    return product.id.toLowerCase().startsWith("cake");
  }

  if (kind === "biscuit") {
    const id = product.id.toLowerCase();
    return (
      !id.startsWith("cake") &&
      (id.startsWith("grocery") || id.includes("_groc") || /confectioneryandbiscuits|\bgrocery\b|\bmunchee\b|\bmaliban\b|\boreo\b/.test(text)) &&
      /\bbiscuits?\b|\bcookies?\b|\bcrackers?\b|\boreo\b|\bmunchee\b|\bmaliban\b|confectioneryandbiscuits/.test(text)
    );
  }

  if (kind === "flower") {
    return product.id.toLowerCase().startsWith("flowers") || /\bflowers?\b|\broses?\b|\bbouquet\b/.test(text);
  }

  if (kind === "chocolate") {
    return product.id.toLowerCase().startsWith("chocolates") || /\bchocolates?\b|\bferrero\b|\btoblerone\b/.test(text);
  }

  return true;
}

async function searchKaprukaProducts(
  rawQuery: string,
  options: { limit: number; max_price: number | null }
) {
  const limit = Math.min(Math.max(options.limit || 8, 1), 20);
  const normalizedQuery = normalizeSearchQuery(rawQuery);
  const cacheKey = JSON.stringify({
    q: normalizedQuery,
    limit,
    max_price: options.max_price ?? null,
  });
  const cached = searchCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.value;
  }

  const result = await callKaprukaTool<SearchResult>("kapruka_search_products", {
    q: normalizedQuery,
    category: null,
    limit: Math.max(limit, 12),
    currency: "LKR",
    max_price: options.max_price,
    in_stock_only: true,
    response_format: "json",
  });

  const products = (result.results ?? []).filter((product) => isRelevantProduct(product, rawQuery)).slice(0, limit);

  const value = {
    ...result,
    results: products,
  };
  searchCache.set(cacheKey, { expiresAt: Date.now() + SEARCH_CACHE_TTL_MS, value });

  if (searchCache.size > 80) {
    const firstKey = searchCache.keys().next().value;
    if (firstKey) searchCache.delete(firstKey);
  }

  return value;
}

function sriLankaDate(offsetDays = 0) {
  const date = new Date(Date.now() + offsetDays * 24 * 60 * 60 * 1000);
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Colombo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);

  const get = (type: string) => parts.find((part) => part.type === type)?.value;
  return `${get("year")}-${get("month")}-${get("day")}`;
}

function normalizeDeliveryDate(value: unknown) {
  if (!value) return null;
  const text = String(value).trim();
  const lower = text.toLowerCase();
  if (lower.includes("tomorrow")) return sriLankaDate(1);
  if (lower.includes("today")) return sriLankaDate(0);

  if (/^\d{4}-\d{2}-\d{2}$/.test(text)) {
    return text < sriLankaDate(0) ? sriLankaDate(1) : text;
  }

  return null;
}

/* ── Extract products from tool results ── */

function extractProducts(toolResults: Array<{ name: string; result: unknown }>) {
  for (const tr of toolResults) {
    if (tr.name === "search_products") {
      const res = tr.result as { results?: unknown[] };
      if (res?.results) return res.results;
    }
  }
  return [];
}

function extractDelivery(toolResults: Array<{ name: string; result: unknown }>) {
  for (const tr of toolResults) {
    if (tr.name === "check_delivery") {
      return tr.result;
    }
  }
  return null;
}

function extractOrder(toolResults: Array<{ name: string; result: unknown }>) {
  for (const tr of toolResults) {
    if (tr.name === "create_order") {
      return tr.result;
    }
  }
  return null;
}

async function fallbackSearch(message: string) {
  const intent = extractSearchIntent(message);
  const result = await searchKaprukaProducts(message, {
    limit: 8,
    max_price: intent.max_price,
  });

  const products = result.results ?? [];
  return {
    reply: assistantCopy(message, products, intent.city),
    products,
    delivery: null,
    order: null,
    label: products.length ? "SEARCH_RESULT" : "AI_RECOMMENDATION",
    model: "kapruka-fallback",
  };
}

/* ── SSE streaming endpoint ── */

export async function POST(req: NextRequest) {
  let messageForFallback = "";

  try {
    const { message, history, audio } = (await req.json()) as {
      message: string;
      history?: Content[];
      audio?: { data: string; mimeType: string };
    };
    messageForFallback = message || "audio message";

    const conversationHistory: Content[] = history ?? [];

    // Use the non-streaming tool-calling loop
    const { text, toolResults } = await chatWithTools(
      message,
      conversationHistory,
      handleToolCall,
      audio
    );

    const products = extractProducts(toolResults);
    const delivery = extractDelivery(toolResults);
    const order = extractOrder(toolResults);

    if (toolResults.length === 0 && isShoppingQuery(message)) {
      return Response.json(await fallbackSearch(message));
    }

    // Determine label based on what tools were called
    let label = null;
    if (products.length > 0) label = "SEARCH_RESULT";
    if (delivery) label = "DELIVERY_INFO";
    if (order) label = "ORDER_UPDATE";
    if (toolResults.length === 0) label = "AI_RECOMMENDATION";

    return Response.json({
      reply: text,
      products,
      delivery,
      order,
      label,
      model: toolResults.length > 0 ? "gemini-with-tools" : "gemini",
    });
  } catch (error) {
    console.error("Chat API error:", error);
    try {
      if (messageForFallback) {
        return Response.json(await fallbackSearch(messageForFallback));
      }
    } catch (fallbackError) {
      console.error("Chat fallback error:", fallbackError);
    }

    return Response.json(
      {
        reply:
          "I'm having trouble connecting right now. Please try again in a moment! 🙏",
        products: [],
        error: error instanceof Error ? error.message : "Chat failed",
      },
      { status: 500 }
    );
  }
}
