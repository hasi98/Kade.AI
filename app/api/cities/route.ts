import { NextRequest, NextResponse } from "next/server";
import { callKaprukaTool } from "@/lib/mcp";

export async function GET(req: NextRequest) {
  try {
    const query = req.nextUrl.searchParams.get("q");
    const limit = Number(req.nextUrl.searchParams.get("limit") ?? 50);
    const result = await callKaprukaTool("kapruka_list_delivery_cities", {
      query,
      limit: Math.min(Math.max(limit, 1), 50),
      response_format: "json"
    });
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "City lookup failed" }, { status: 500 });
  }
}
