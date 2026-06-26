import { NextRequest, NextResponse } from "next/server";
import { callKaprukaTool } from "@/lib/mcp";
import { friendlyOrderError, normalizeOrderResult } from "@/lib/orderState";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const result = await callKaprukaTool("kapruka_create_order", {
      cart: body.cart,
      recipient: body.recipient,
      delivery: body.delivery,
      sender: body.sender,
      gift_message: body.gift_message || null,
      currency: body.currency || "LKR",
      response_format: "json"
    });
    return NextResponse.json(normalizeOrderResult(result));
  } catch (error) {
    console.error("[KADE] order_create_failed", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Order creation failed",
        reply: friendlyOrderError(error),
      },
      { status: 500 }
    );
  }
}
