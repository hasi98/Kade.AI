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
  const candidates = [
    explicitQ?.trim(),
    raw,
    intent.q,
  ];

  if (/\b(chocolate|choco|ferrero|truffle)\b/.test(lower) && /\b(cake|cakes|bento)\b/.test(lower)) {
    candidates.push("chocolate cake", "chocolate birthday cake", "cake");
  } else if (/\b(cake|cakes|bento|icing)\b/.test(lower) || category === "Cakes") {
    candidates.push("cake", "birthday cake", "bento cake");
  }

  if (/\b(biscuit|biscuits|cookie|cookies|cracker|crackers|munchee|maliban)\b/.test(lower)) {
    candidates.push("biscuits", "cookies", "Munchee biscuits");
  }
  if (/\b(chocolate|choco|ferrero|truffle)\b/.test(lower) && !/\b(cake|cakes)\b/.test(lower)) {
    candidates.push("chocolate", "chocolate gift box", "Ferrero Rocher");
  }
  if (/\b(flowers?|roses?|bouquet)\b/.test(lower)) {
    candidates.push("roses", "flower bouquet", "red roses");
  }
  if (/\b(hamper|gift box|gift set)\b/.test(lower)) {
    candidates.push("gift hamper", "gift box", "special gift");
  }

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
    const candidates = searchCandidates(query, intent, typeof body.q === "string" ? body.q : null, typeof body.category === "string" ? body.category : intent.category);
    const attempts: Array<{ q: string; in_stock_only: boolean }> = [
      ...candidates.map((q) => ({ q, in_stock_only: body.in_stock_only ?? true })),
      ...candidates.slice(0, 5).map((q) => ({ q, in_stock_only: false })),
    ];

    const merged: Product[] = [];
    let firstResult: SearchResponse | null = null;
    const tried: string[] = [];

    for (const attempt of attempts) {
      tried.push(`${attempt.q}:${attempt.in_stock_only ? "stock" : "all"}`);
      const result = await runSearch({
        q: attempt.q,
        category: body.category ?? intent.category ?? null,
        limit: Math.max(limit, 12),
        cursor: body.cursor ?? null,
        currency: body.currency ?? "LKR",
        max_price: maxPrice,
        in_stock_only: attempt.in_stock_only,
        sort: body.sort ?? "relevance",
      });
      firstResult ??= result;
      merged.push(...result.results);
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
