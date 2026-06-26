import { NextRequest, NextResponse } from "next/server";
import { extractSearchIntent } from "@/lib/agent";
import { callKaprukaTool } from "@/lib/mcp";
import type { Product } from "@/lib/types";

type SearchResponse = {
  results: Product[];
  next_cursor: string | null;
  applied_filters: Record<string, unknown>;
};

function uniqueProducts(products: Product[]) {
  return Array.from(new Map(products.filter((product) => product?.id).map((product) => [product.id, product])).values());
}

function productSearchText(product: Product) {
  return [
    product.id,
    product.name,
    product.summary,
    product.description,
    product.category?.name,
    product.category?.slug,
  ].filter(Boolean).join(" ").toLowerCase();
}

function searchKind(input: string, intent: ReturnType<typeof extractSearchIntent>) {
  const lower = `${input} ${intent.q} ${intent.category ?? ""}`.toLowerCase();
  if (/\b(biscuit|biscuits|cookie|cookies|cracker|crackers|munchee|maliban|oreo)\b/.test(lower)) return "biscuits";
  if (/\b(chocolate|choco|ferrero|truffle)\b/.test(lower) && /\b(cake|cakes|bento)\b/.test(lower)) return "chocolateCake";
  if (/\b(cake|cakes|bento|icing|birthday)\b/.test(lower) || intent.category === "Cakes") return "cakes";
  if (/\b(chocolate|choco|ferrero|truffle)\b/.test(lower) || intent.category === "Chocolates") return "chocolates";
  if (/\b(flowers?|roses?|bouquet)\b/.test(lower) || intent.category === "Flowers") return "flowers";
  return "general";
}

function relevantProducts(products: Product[], kind: ReturnType<typeof searchKind>) {
  if (kind === "general") return products;
  return products.filter((product) => {
    const text = productSearchText(product);
    if (kind === "biscuits") {
      return /\b(biscuit|biscuits|cookie|cookies|cracker|crackers|wafer|wafers|munchee|maliban|oreo|snack|snackers)\b/.test(text) &&
        !/\b(cake|bento|crop|t-?shirt|top|dress|rose|flower|bouquet)\b/.test(text);
    }
    if (kind === "chocolateCake") {
      return /\b(cake|cakes|bento)\b/.test(text) && /\b(chocolate|choco|cocoa|fudge)\b/.test(text);
    }
    if (kind === "cakes") {
      return /\b(cake|cakes|bento|icing|gateau)\b/.test(text) && !/\b(crop|t-?shirt|top|dress)\b/.test(text);
    }
    if (kind === "chocolates") {
      return /\b(chocolate|choco|ferrero|truffle|cocoa|toblerone)\b/.test(text) && !/\b(cake|bento|crop|t-?shirt|top|dress)\b/.test(text);
    }
    if (kind === "flowers") {
      return /\b(flower|flowers|rose|roses|bouquet)\b/.test(text);
    }
    return true;
  });
}

function asSearchResponse(input: unknown): SearchResponse {
  const record = input && typeof input === "object" ? input as Partial<SearchResponse> & { result?: unknown } : {};
  const nested = record.result && typeof record.result === "object" ? record.result as Partial<SearchResponse> : null;
  const source = nested ?? record;
  return {
    results: Array.isArray(source.results) ? source.results as Product[] : [],
    next_cursor: typeof source.next_cursor === "string" ? source.next_cursor : null,
    applied_filters: source.applied_filters && typeof source.applied_filters === "object"
      ? source.applied_filters as Record<string, unknown>
      : {},
  };
}

function searchCandidates(input: string, intent: ReturnType<typeof extractSearchIntent>, explicitQ?: string | null, category?: string | null) {
  const raw = input.trim();
  const lower = raw.toLowerCase();
  const semanticCandidates: Array<string | undefined | null> = [];

  if (/\b(chocolate|choco|ferrero|truffle)\b/.test(lower) && /\b(cake|cakes|bento)\b/.test(lower)) {
    semanticCandidates.push("chocolate cake", "cake", "chocolate birthday cake");
  } else if (/\b(cake|cakes|bento|icing)\b/.test(lower) || category === "Cakes") {
    semanticCandidates.push("cake", "birthday cake", "bento cake");
  }

  if (/\b(biscuit|biscuits|cookie|cookies|cracker|crackers|munchee|maliban)\b/.test(lower)) {
    semanticCandidates.push("biscuits", "cookies", "Munchee biscuits");
  }
  if (/\b(chocolate|choco|ferrero|truffle)\b/.test(lower) && !/\b(cake|cakes)\b/.test(lower)) {
    semanticCandidates.push("chocolate", "chocolate gift box", "Ferrero Rocher");
  }
  if (/\b(flowers?|roses?|bouquet)\b/.test(lower)) {
    semanticCandidates.push("roses", "flower bouquet", "red roses");
  }
  if (/\b(hamper|gift box|gift set)\b/.test(lower)) {
    semanticCandidates.push("gift hamper", "gift box", "special gift");
  }

  const candidates = [
    ...semanticCandidates,
    intent.q,
    explicitQ?.trim(),
    raw,
  ];

  if (typeof category === "string" && category.trim()) {
    candidates.push(category.trim());
  }

  return [...new Set(candidates.filter((candidate): candidate is string => Boolean(candidate && candidate.trim().length >= 2)))].slice(0, 8);
}

async function runSearch(params: {
  q: string;
  category: unknown;
  limit: number;
  cursor: unknown;
  currency: unknown;
  max_price: unknown;
  in_stock_only: boolean;
  sort: unknown;
}) {
  return asSearchResponse(await callKaprukaTool<SearchResponse>("kapruka_search_products", {
    q: params.q,
    category: params.category ?? null,
    limit: params.limit,
    cursor: params.cursor ?? null,
    currency: params.currency ?? "LKR",
    max_price: params.max_price,
    in_stock_only: params.in_stock_only,
    sort: params.sort ?? "relevance",
    response_format: "json",
  }));
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const query = String(body.query ?? body.q ?? "");
    const intent = extractSearchIntent(query);
    const limit = Math.max(1, Math.min(24, Number(body.limit ?? 10) || 10));
    const maxPrice = body.max_price ?? intent.max_price;
    const isVoiceSearch = body.source === "voice";
    const kind = searchKind(query, intent);
    const candidates = searchCandidates(query, intent, typeof body.q === "string" ? body.q : null, typeof body.category === "string" ? body.category : intent.category);
    const candidateLimit = isVoiceSearch ? 3 : 8;
    const stockCandidates = candidates.slice(0, candidateLimit);
    const looseCandidates = candidates.slice(0, isVoiceSearch ? 1 : 5);
    const categoryFilter = isVoiceSearch ? null : body.category ?? intent.category ?? null;
    const attempts: Array<{ q: string; in_stock_only: boolean }> = [
      ...stockCandidates.map((q) => ({ q, in_stock_only: body.in_stock_only ?? true })),
      ...looseCandidates.map((q) => ({ q, in_stock_only: false })),
    ];

    const merged: Product[] = [];
    let firstResult: SearchResponse | null = null;
    const tried: string[] = [];

    for (const attempt of attempts) {
      tried.push(`${attempt.q}:${attempt.in_stock_only ? "stock" : "all"}`);
      try {
        const result = await runSearch({
          q: attempt.q,
          category: categoryFilter,
          limit: Math.max(limit, 12),
          cursor: body.cursor ?? null,
          currency: body.currency ?? "LKR",
          max_price: maxPrice,
          in_stock_only: attempt.in_stock_only,
          sort: body.sort ?? "relevance",
        });
        firstResult ??= result;
        const filtered = relevantProducts(result.results, kind);
        merged.push(...(kind === "general" ? result.results : filtered));
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        if (uniqueProducts(merged).length > 0 && /rate|429|limit/i.test(message)) {
          break;
        }
        throw error;
      }
      if (uniqueProducts(merged).length >= Math.min(limit, 6)) break;
    }

    const results = uniqueProducts(merged).slice(0, limit);
    const result = {
      ...(firstResult ?? { next_cursor: null, applied_filters: {} }),
      results,
      applied_filters: {
        ...(firstResult?.applied_filters ?? {}),
        tried_queries: tried,
        fallback_used: tried.length > 1,
      },
    };

    return NextResponse.json({ ...result, intent });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Search failed" }, { status: 500 });
  }
}
