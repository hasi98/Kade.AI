import { GoogleGenAI, Modality } from "@google/genai";
import { NextResponse } from "next/server";
import { KADE_LIVE_SYSTEM_PROMPT } from "@/lib/personality";

export const runtime = "nodejs";

const apiKey = process.env.GEMINI_API_KEY;
const model = process.env.GEMINI_LIVE_MODEL || "gemini-3.1-flash-live-preview";

const liveConfig = {
  responseModalities: [Modality.AUDIO],
  systemInstruction: {
    parts: [{ text: KADE_LIVE_SYSTEM_PROMPT }],
  },
  speechConfig: {
    voiceConfig: {
      prebuiltVoiceConfig: {
        voiceName: "Aoede",
      },
    },
  },
  inputAudioTranscription: {},
  outputAudioTranscription: {},
};

export async function POST() {
  if (!apiKey) {
    return NextResponse.json(
      { error: "Missing GEMINI_API_KEY on the server." },
      { status: 500 }
    );
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    const token = await ai.authTokens.create({
      config: {
        uses: 1,
        expireTime: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
        newSessionExpireTime: new Date(Date.now() + 60 * 1000).toISOString(),
        liveConnectConstraints: {
          model,
          config: liveConfig,
        },
        httpOptions: { apiVersion: "v1alpha" },
      },
    });

    if (!token.name) {
      throw new Error("Gemini did not return an ephemeral token.");
    }

    return NextResponse.json({ token: token.name, model, liveConfig });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create live token.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
