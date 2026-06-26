import { NextRequest, NextResponse } from "next/server";
import { formatDeliveryResponse, normalizeDeliveryResult } from "@/lib/delivery";
import { callKaprukaTool } from "@/lib/mcp";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const result = await callKaprukaTool("kapruka_check_delivery", {
      city: body.city,
      delivery_date: body.delivery_date || null,
      product_id: body.product_id || null,
      response_format: "json"
    });
    const delivery = normalizeDeliveryResult(result, String(body.city ?? "Colombo 07"));
    return NextResponse.json({
      reply: formatDeliveryResponse(delivery),
      delivery,
    });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Delivery check failed" }, { status: 500 });
  }
}
