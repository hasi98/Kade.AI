import { NextRequest, NextResponse } from "next/server";
import { rateLimit } from "@/lib/server/rate-limit";

const SESSION_CONFIG = JSON.stringify({
  session: {
    type: "realtime",
    model: "gpt-realtime-2",
    audio: {
      input: {
        transcription: { model: "gpt-4o-transcribe" },
      },
    },
  },
});

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for") ?? "unknown";
  if (!rateLimit(ip, 10, 60_000)) {
    return new NextResponse("Too many requests", { status: 429 });
  }

  const sdp = await req.text();

  // Step 1: mint an ephemeral key
  const tokenRes = await fetch(
    "https://api.openai.com/v1/realtime/client_secrets",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: SESSION_CONFIG,
    },
  );

  if (!tokenRes.ok) {
    const body = await tokenRes.text();
    console.error("[realtime-session] token error", tokenRes.status, body);
    return NextResponse.json(
      { error: "Failed to create session", detail: body },
      { status: 500 },
    );
  }

  const tokenData = (await tokenRes.json()) as { value: string };
  const ephemeralKey = tokenData.value;

  // Step 2: exchange SDP offer using the ephemeral key
  const sdpRes = await fetch("https://api.openai.com/v1/realtime/calls", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${ephemeralKey}`,
      "Content-Type": "application/sdp",
    },
    body: sdp,
  });

  if (!sdpRes.ok) {
    const body = await sdpRes.text();
    console.error("[realtime-session] SDP error", sdpRes.status, body);
    return NextResponse.json(
      { error: "Failed to exchange SDP", detail: body },
      { status: 500 },
    );
  }

  const answerSdp = await sdpRes.text();
  return new NextResponse(answerSdp, {
    headers: { "Content-Type": "application/sdp" },
  });
}
