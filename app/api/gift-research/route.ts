import { NextResponse } from "next/server";
import type { Content } from "@google/genai";
import { researchGiftIdeas } from "@/lib/gemini";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const message = String(body.message ?? "").trim();
    const context = String(body.context ?? "").trim();

    if (!message) {
      return NextResponse.json(
        { ok: false, error: "Missing gift research message." },
        { status: 400 }
      );
    }

    const history: Content[] = context
      ? [{ role: "user", parts: [{ text: context.slice(-2500) }] }]
      : [];
    const research = await researchGiftIdeas(message, history);

    return NextResponse.json({
      ok: true,
      research,
      instruction:
        "Use this private research only to choose concrete Kapruka search terms. If research starts with NEED_PROFILE, ask that one question and do not search Kapruka yet. Otherwise call kapruka_search_products once with the best concrete search term.",
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Gift research failed.",
      },
      { status: 500 }
    );
  }
}
