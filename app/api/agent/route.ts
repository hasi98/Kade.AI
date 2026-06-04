import { NextRequest, NextResponse } from "next/server";
import { assistantCopy, extractSearchIntent } from "@/lib/agent";
import { callKaprukaTool } from "@/lib/mcp";
import type { Product } from "@/lib/types";

type SearchResponse = {
  results: Product[];
  next_cursor: string | null;
  applied_filters: Record<string, unknown>;
};

export async function POST(req: NextRequest) {
  try {
    const { message } = await req.json();
    const text = String(message ?? "");
    const intent = extractSearchIntent(text);

    const result = await callKaprukaTool<SearchResponse>("kapruka_search_products", {
      q: intent.q,
      category: null,
      limit: 8,
      currency: "LKR",
      max_price: intent.max_price,
      in_stock_only: true,
      response_format: "json"
    });

    return NextResponse.json({
      reply: assistantCopy(text, result.results ?? [], intent.city),
      products: result.results ?? [],
      intent,
      next_cursor: result.next_cursor ?? null
    });
  } catch (error) {
    return NextResponse.json(
      {
        reply: "I hit a Kapruka lookup issue. Try a more specific product request or search again in a moment.",
        products: [],
        error: error instanceof Error ? error.message : "Agent failed"
      },
      { status: 500 }
    );
  }
}
