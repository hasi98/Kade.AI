import { NextResponse } from "next/server";
import { callKaprukaTool } from "@/lib/mcp";

export async function GET() {
  try {
    const result = await callKaprukaTool("kapruka_list_categories", {
      depth: 2,
      response_format: "json"
    });
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Categories failed" }, { status: 500 });
  }
}
