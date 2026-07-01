import { NextRequest, NextResponse } from "next/server";
import { executeServerTool } from "@/tools/server";
import { rateLimit } from "@/lib/server/rate-limit";
import type { CartItem } from "@/types";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for") ?? "unknown";
  if (!rateLimit(ip, 30, 60_000)) {
    return new NextResponse("Too many requests", { status: 429 });
  }

  const { tool_name, arguments: args, cart } = (await req.json()) as {
    tool_name: string;
    arguments: Record<string, unknown>;
    cart?: CartItem[];
  };

  try {
    const result = await executeServerTool(tool_name, args ?? {}, cart ?? []);
    return NextResponse.json({ result });
  } catch (err) {
    return NextResponse.json(
      { error: (err as Error).message },
      { status: 500 },
    );
  }
}
