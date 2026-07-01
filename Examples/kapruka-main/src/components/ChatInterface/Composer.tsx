"use client";

import { useRef } from "react";
import type { UIMessage } from "ai";
import { AGENT } from "@/lib/persona";
import { useOpenAIRealtimeVoice } from "@/hooks/useOpenAIRealtimeVoice";
import VoiceButton from "./VoiceButton";
import MicWave from "./MicWave";

export default function Composer({
  value,
  setValue,
  onSend,
  onStop,
  disabled,
  messages,
  onVoiceUserMessage,
  onVoiceAssistantMessage,
  onVoiceToolResult,
}: {
  value: string;
  setValue: (v: string) => void;
  onSend: () => void;
  onStop?: () => void;
  disabled: boolean;
  messages?: UIMessage[];
  onVoiceUserMessage?: (text: string) => void;
  onVoiceAssistantMessage?: (text: string) => void;
  onVoiceToolResult?: (
    toolName: string,
    args: Record<string, unknown>,
    result: unknown,
  ) => void;
}) {
  const taRef = useRef<HTMLTextAreaElement>(null);
  const {
    connecting,
    listening,
    speaking,
    transcript,
    toggleVoice,
    sendText,
    analyserRef,
  } = useOpenAIRealtimeVoice(
    {
      onUserMessage: onVoiceUserMessage,
      onAssistantMessage: onVoiceAssistantMessage,
      onToolResult: onVoiceToolResult,
    },
    messages,
  );

  function handleKey(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (listening) {
        if (value.trim()) {
          sendText(value);
          setValue("");
        }
      } else {
        onSend();
      }
    }
  }

  function handleSend() {
    if (listening) {
      if (value.trim()) {
        sendText(value);
        setValue("");
      }
    } else {
      onSend();
    }
  }

  return (
    <div className="shrink-0">
      <div className="mx-auto w-full max-w-190 px-3 sm:px-6 pt-2.5 pb-3 sm:pt-3 sm:pb-4">
        <div className="bg-surface rounded-2xl border border-line shadow-card focus-within:border-brand/50 focus-within:shadow-lift transition-all px-3 pt-3 pb-2">
          {/* Voice status bar — shown above the textarea when active */}
          {(connecting || listening) && (
            <div className="flex items-center gap-3 mb-2 min-h-9">
              {connecting ? (
                <div className="shrink-0 w-8 h-8 rounded-full bg-brand/10 grid place-items-center">
                  <svg
                    className="animate-spin text-brand"
                    viewBox="0 0 24 24"
                    width="16"
                    height="16"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                  >
                    <path strokeLinecap="round" d="M12 2a10 10 0 0 1 10 10" />
                  </svg>
                </div>
              ) : speaking ? (
                <div className="relative shrink-0 w-8 h-8 rounded-full bg-brand/10 grid place-items-center">
                  <span className="absolute inset-0 rounded-full bg-brand/20 animate-ping" />
                  <svg
                    viewBox="0 0 24 24"
                    width="16"
                    height="16"
                    fill="currentColor"
                    className="text-brand relative z-10"
                  >
                    <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3A4.5 4.5 0 0 0 14 7.97v8.05c1.48-.73 2.5-2.25 2.5-4.02z" />
                  </svg>
                </div>
              ) : (
                <MicWave analyserRef={analyserRef} />
              )}
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-semibold text-ink leading-tight">
                  {connecting ? "Connecting…" : speaking ? `${AGENT.name} is speaking…` : "Listening…"}
                </p>
                {!connecting && transcript && (
                  <p className="text-[12px] text-inksoft truncate mt-0.5">
                    You said: &quot;{transcript}&quot;
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Text input — always visible so users can type accurate info (city, address, etc.) */}
          <textarea
            ref={taRef}
            rows={1}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={handleKey}
            disabled={connecting}
            placeholder={listening ? "Type city, address, or any details here…" : `Ask ${AGENT.name} anything…`}
            className="w-full min-w-0 resize-none bg-transparent outline-none text-[15px] text-ink placeholder:text-inksoft leading-relaxed disabled:opacity-60 mb-2"
          />

          {/* Toolbar row */}
          <div className="flex items-center gap-2">
            <span className="flex-1 text-[12px] text-inksoft select-none">
              {AGENT.tagline}
            </span>

            <VoiceButton
              connecting={connecting}
              listening={listening}
              speaking={speaking}
              disabled={(disabled && !listening) || connecting}
              onClick={toggleVoice}
            />

            {disabled && !listening ? (
              <button
                onClick={onStop}
                className="shrink-0 w-9 h-9 rounded-xl grid place-items-center bg-inksoft/15 text-ink hover:bg-inksoft/25 transition-colors"
                aria-label="Stop"
              >
                <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                  <rect x="5" y="5" width="14" height="14" rx="2" />
                </svg>
              </button>
            ) : (
              <button
                onClick={handleSend}
                disabled={!value.trim() || connecting}
                className="shrink-0 w-9 h-9 rounded-xl grid place-items-center bg-brand text-white disabled:opacity-30 hover:bg-branddeep transition-colors"
                aria-label="Send"
              >
                <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                  <path d="M3.4 20.4 21 12 3.4 3.6 3.4 10l11 2-11 2z" />
                </svg>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
