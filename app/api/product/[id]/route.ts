import { NextResponse } from "next/server";
import { callKaprukaTool } from "@/lib/mcp";
import type { ProductDetail } from "@/lib/types";

function asProductDetail(value: unknown): ProductDetail | null {
  if (!value || typeof value !== "object") return null;
  const record = value as Partial<ProductDetail>;
  if (!record.id || !record.name) return null;
  return {
    ...record,
    description: record.description ?? "",
    summary: record.summary ?? "",
    images: record.images?.length ? record.images : record.image_url ? [record.image_url] : [],
    variants: record.variants ?? [],
  } as ProductDetail;
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const productId = decodeURIComponent(id ?? "").trim();
    if (!productId) {
      return NextResponse.json({ error: "Product id is required" }, { status: 404 });
    }

    const result = await callKaprukaTool<ProductDetail>("kapruka_get_product", {
      product_id: productId,
      currency: "LKR",
      response_format: "json",
    });

    const product = asProductDetail(result);
    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    return NextResponse.json(product, {
      headers: {
        "Cache-Control": "public, max-age=300",
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Product lookup failed";
    if (/not found|product_not_found|invalid product/i.test(message)) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
