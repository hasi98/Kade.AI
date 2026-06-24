import { GoogleGenAI, Modality } from "@google/genai";
import { NextResponse } from "next/server";
import { MODELS } from "@/lib/models";
import { KADE_LIVE_SYSTEM_PROMPT } from "@/lib/personality";

export const runtime = "nodejs";

const apiKey = process.env.GEMINI_API_KEY;
const model = process.env.GEMINI_LIVE_MODEL || MODELS.voice;
const AVAILABLE_VOICES = new Set([
  "Zephyr",
  "Kore",
  "Orus",
  "Autonoe",
  "Umbriel",
  "Erinome",
  "Laomedeia",
  "Schedar",
  "Achird",
  "Sadachbia",
  "Puck",
  "Fenrir",
  "Aoede",
  "Enceladus",
  "Algieba",
  "Algenib",
  "Achernar",
  "Gacrux",
  "Zubenelgenubi",
  "Sadaltager",
  "Charon",
  "Leda",
  "Callirrhoe",
  "Iapetus",
  "Despina",
  "Rasalgethi",
  "Alnilam",
  "Pulcherrima",
  "Vindemiatrix",
  "Sulafat",
]);

function createLiveConfig(voiceName: string) {
  return {
    responseModalities: [Modality.AUDIO],
    systemInstruction: {
      parts: [{ text: KADE_LIVE_SYSTEM_PROMPT }],
    },
    speechConfig: {
      voiceConfig: {
        prebuiltVoiceConfig: {
          voiceName,
        },
      },
    },
    inputAudioTranscription: {},
    outputAudioTranscription: {},
  };
}

export async function POST(req: Request) {
  if (!apiKey) {
    return NextResponse.json(
      { error: "Missing GEMINI_API_KEY on the server." },
      { status: 500 }
    );
  }

  try {
    const body = await req.json().catch(() => ({}));
    const requestedVoice = typeof body.voiceName === "string" ? body.voiceName : "Aoede";
    const voiceName = AVAILABLE_VOICES.has(requestedVoice) ? requestedVoice : "Aoede";
    const liveConfig = createLiveConfig(voiceName);
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

    return NextResponse.json({ token: token.name, model, liveConfig, voiceName });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create live token.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
