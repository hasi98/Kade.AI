import { NextRequest, NextResponse } from "next/server";
import { callKaprukaTool } from "@/lib/mcp";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const result = await callKaprukaTool("kapruka_track_order", {
      order_number: body.order_number,
      response_format: "json"
    });
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Tracking failed" }, { status: 500 });
  }
}
