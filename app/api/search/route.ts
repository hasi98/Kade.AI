import { NextRequest, NextResponse } from "next/server";
import { extractSearchIntent } from "@/lib/agent";
import { callKaprukaTool } from "@/lib/mcp";
import type { Product } from "@/lib/types";

type SearchResponse = {
  results: Product[];
  next_cursor: string | null;
  applied_filters: Record<string, unknown>;
};

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const intent = extractSearchIntent(String(body.query ?? ""));
    const result = await callKaprukaTool<SearchResponse>("kapruka_search_products", {
      q: body.q ?? intent.q,
      category: body.category ?? null,
      limit: body.limit ?? 10,
      cursor: body.cursor ?? null,
      currency: body.currency ?? "LKR",
      max_price: body.max_price ?? intent.max_price,
      in_stock_only: body.in_stock_only ?? true,
      sort: body.sort ?? "relevance",
      response_format: "json"
    });

    return NextResponse.json({ ...result, intent });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Search failed" }, { status: 500 });
  }
}
