import { NextResponse } from "next/server";

export async function GET() {
  try {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), 3000);
    const resp = await fetch("https://mcp.kapruka.com/mcp", { 
      method: "OPTIONS",
      signal: controller.signal
    });
    clearTimeout(id);
    return NextResponse.json({ ok: resp.ok || resp.status === 405 });
  } catch (e) {
    return NextResponse.json({ ok: false });
  }
}
