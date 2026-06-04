import { NextRequest, NextResponse } from "next/server";
import { callKaprukaTool } from "@/lib/mcp";

export async function GET(req: NextRequest) {
  try {
    const query = req.nextUrl.searchParams.get("q");
    const result = await callKaprukaTool("kapruka_list_delivery_cities", {
      query,
      limit: 25,
      response_format: "json"
    });
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "City lookup failed" }, { status: 500 });
  }
}
