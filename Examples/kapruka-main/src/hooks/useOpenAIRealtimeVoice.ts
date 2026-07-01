"use client";

import { useRef, useState, useEffect } from "react";
import { useCartStore } from "@/store/cart";
import { buildCartContext, agentInstructions } from "@/lib/instructions";
import { REALTIME_TOOLS } from "@/tools/specs";
import { useMicAudio } from "./useMicAudio";
import type { UIMessage } from "ai";

interface PendingCall {
  name: string;
  argsStr: string;
}

export function useOpenAIRealtimeVoice(
  callbacks?: {
    onUserMessage?: (text: string) => void;
    onAssistantMessage?: (text: string) => void;
    onToolResult?: (
      toolName: string,
      args: Record<string, unknown>,
      result: unknown,
    ) => void;
  },
  initialMessages?: UIMessage[],
) {
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const dcRef = useRef<RTCDataChannel | null>(null);
  const pendingCallsRef = useRef<Map<string, PendingCall>>(new Map());
  const assistantTranscriptRef = useRef<string>("");
  const callbacksRef = useRef(callbacks);
  useEffect(() => {
    callbacksRef.current = callbacks;
  });

  const { acquireMic, bindOutputTrack, release, analyserRef } = useMicAudio();

  const [connecting, setConnecting] = useState(false);
  const [listening, setListening] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [transcript, setTranscript] = useState("");

  const cartItems = useCartStore((s) => s.items);
  const giftMessage = useCartStore((s) => s.gift_message);

  async function executeTool(
    callId: string,
    toolName: string,
    argsStr: string,
  ) {
    let args: Record<string, unknown> = {};
    try {
      args = JSON.parse(argsStr);
    } catch {
      // malformed args — proceed with empty object
    }

    let result: unknown = { error: "unknown error" };
    let output: string;
    try {
      const res = await fetch("/api/realtime-tools", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tool_name: toolName, arguments: args, cart: cartItems }),
      });
      const data = (await res.json()) as { result?: unknown; error?: string };
      result = data.result ?? { error: data.error ?? "unknown error" };
      output = JSON.stringify(result);
    } catch (err) {
      result = { error: (err as Error).message };
      output = JSON.stringify(result);
    }

    const dc = dcRef.current;
    if (!dc || dc.readyState !== "open") return;

    dc.send(
      JSON.stringify({
        type: "conversation.item.create",
        item: {
          type: "function_call_output",
          call_id: callId,
          output,
        },
      }),
    );

    dc.send(JSON.stringify({ type: "response.create" }));

    callbacksRef.current?.onToolResult?.(toolName, args, result);
  }

  async function start() {
    setConnecting(true);
    const pc = new RTCPeerConnection();
    pcRef.current = pc;

    bindOutputTrack(pc);

    const stream = await acquireMic();
    pc.addTrack(stream.getTracks()[0]);

    const dc = pc.createDataChannel("oai-events");
    dcRef.current = dc;

    dc.addEventListener("open", () => {
      const cartContext = buildCartContext(cartItems, giftMessage);

      dc.send(
        JSON.stringify({
          type: "session.update",
          session: {
            type: "realtime",
            instructions: agentInstructions(cartContext, "voice"),
            output_modalities: ["audio"],
            audio: {
              input: {
                turn_detection: {
                  type: "server_vad",
                  threshold: 0.9,
                  prefix_padding_ms: 300,
                  silence_duration_ms: 600,
                },
                transcription: { model: "gpt-4o-transcribe" },
              },
              output: {
                voice: "marin",
              },
            },
            tools: REALTIME_TOOLS,
            tool_choice: "auto",
          },
        }),
      );

      // Inject existing text conversation so voice can pick up where text left off
      for (const msg of initialMessages ?? []) {
        const textPart = msg.parts?.find((p) => p.type === "text");
        if (!textPart || textPart.type !== "text") continue;
        const text = textPart.text.trim();
        if (!text) continue;
        if (msg.role === "user") {
          dc.send(
            JSON.stringify({
              type: "conversation.item.create",
              item: {
                type: "message",
                role: "user",
                content: [{ type: "input_text", text }],
              },
            }),
          );
        } else if (msg.role === "assistant") {
          dc.send(
            JSON.stringify({
              type: "conversation.item.create",
              item: {
                type: "message",
                role: "assistant",
                content: [{ type: "output_text", text }],
              },
            }),
          );
        }
      }

      setConnecting(false);
      setListening(true);
    });

    dc.addEventListener("message", (e: MessageEvent) => {
      const event = JSON.parse(e.data as string) as Record<string, unknown>;

      switch (event.type) {
        case "conversation.item.input_audio_transcription.completed": {
          const text = (event.transcript as string) ?? "";
          setTranscript(text);
          if (text.trim()) callbacksRef.current?.onUserMessage?.(text.trim());
          break;
        }

        case "response.output_item.added": {
          const item = event.item as Record<string, string> | undefined;
          if (item?.type === "function_call" && item.call_id) {
            pendingCallsRef.current.set(item.call_id, {
              name: item.name ?? "",
              argsStr: "",
            });
          }
          break;
        }

        case "response.function_call_arguments.delta": {
          const call = pendingCallsRef.current.get(event.call_id as string);
          if (call) call.argsStr += (event.delta as string) ?? "";
          break;
        }

        case "response.function_call_arguments.done": {
          const callId = event.call_id as string;
          const call = pendingCallsRef.current.get(callId);
          if (call) {
            pendingCallsRef.current.delete(callId);
            executeTool(
              callId,
              call.name,
              (event.arguments as string) ?? call.argsStr,
            );
          }
          break;
        }

        case "response.output_audio_transcript.delta":
          assistantTranscriptRef.current += (event.delta as string) ?? "";
          break;

        case "response.output_audio_transcript.done": {
          const text = assistantTranscriptRef.current.trim();
          assistantTranscriptRef.current = "";
          if (text) callbacksRef.current?.onAssistantMessage?.(text);
          break;
        }

        case "response.audio.delta":
          setSpeaking(true);
          break;

        case "response.audio.done":
          setSpeaking(false);
          break;

        case "response.done":
          setSpeaking(false);
          break;

        case "error":
          console.error("[realtime] error", event.error);
          break;
      }
    });

    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);

    const sdpRes = await fetch("/api/realtime-session", {
      method: "POST",
      headers: { "Content-Type": "application/sdp" },
      body: offer.sdp,
    });

    if (!sdpRes.ok) {
      const detail = await sdpRes.text();
      throw new Error(`WebRTC offer rejected: ${detail}`);
    }

    const answerSdp = await sdpRes.text();
    await pc.setRemoteDescription({ type: "answer", sdp: answerSdp });
  }

  function sendText(text: string) {
    const dc = dcRef.current;
    if (!dc || dc.readyState !== "open" || !text.trim()) return;
    dc.send(
      JSON.stringify({
        type: "conversation.item.create",
        item: {
          type: "message",
          role: "user",
          content: [{ type: "input_text", text: text.trim() }],
        },
      }),
    );
    dc.send(JSON.stringify({ type: "response.create" }));
    callbacksRef.current?.onUserMessage?.(text.trim());
  }

  function stop() {
    dcRef.current?.close();
    pcRef.current?.close();
    release();
    dcRef.current = null;
    pcRef.current = null;
    pendingCallsRef.current.clear();
    setConnecting(false);
    setListening(false);
    setSpeaking(false);
    setTranscript("");
  }

  function toggleVoice() {
    if (listening) {
      stop();
    } else {
      start().catch((err) => {
        console.error("[realtime] start failed", err);
        stop();
      });
    }
  }

  return {
    connecting,
    listening,
    speaking,
    transcript,
    toggleVoice,
    sendText,
    analyserRef,
  };
}
