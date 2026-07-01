"use client";

import { AGENT } from "@/lib/persona";

export default function VoiceOverlay({
  speaking,
  transcript,
  onStop,
}: {
  speaking: boolean;
  transcript: string;
  onStop: () => void;
}) {
  return (
    <div className="absolute inset-x-0 bottom-0 z-20 flex justify-center px-3 sm:px-6 pb-3 sm:pb-4 pointer-events-none">
      <div className="pointer-events-auto w-full max-w-190">
        <div className="bg-surface border border-line rounded-2xl shadow-lift px-4 py-4 flex flex-col gap-3">
          {/* Status row */}
          <div className="flex items-center gap-3">
            {/* Animated indicator */}
            <div className="relative shrink-0 w-10 h-10 rounded-full bg-brand/10 grid place-items-center">
              {speaking ? (
                <>
                  <span className="absolute inset-0 rounded-full bg-brand/20 animate-ping" />
                  <svg
                    viewBox="0 0 24 24"
                    width="18"
                    height="18"
                    fill="currentColor"
                    className="text-brand relative z-10"
                  >
                    <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3A4.5 4.5 0 0 0 14 7.97v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" />
                  </svg>
                </>
              ) : (
                <>
                  <span className="absolute inset-0 rounded-full bg-red-500/20 animate-pulse" />
                  <svg
                    viewBox="0 0 24 24"
                    width="18"
                    height="18"
                    fill="currentColor"
                    className="text-red-500 relative z-10"
                  >
                    <path d="M12 14a3 3 0 0 0 3-3V5a3 3 0 0 0-6 0v6a3 3 0 0 0 3 3zm5-3a5 5 0 0 1-10 0H5a7 7 0 0 0 6 6.93V20H9v2h6v-2h-2v-2.07A7 7 0 0 0 19 11h-2z" />
                  </svg>
                </>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-semibold text-ink leading-tight">
                {speaking ? `${AGENT.name} is speaking…` : "Listening…"}
              </p>
              {transcript && (
                <p className="text-[12px] text-inksoft truncate mt-0.5">
                  You said: &quot;{transcript}&quot;
                </p>
              )}
            </div>

            {/* Stop button */}
            <button
              onClick={onStop}
              className="shrink-0 w-9 h-9 rounded-xl grid place-items-center bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-colors"
              aria-label="End voice session"
            >
              <svg
                viewBox="0 0 24 24"
                width="16"
                height="16"
                fill="currentColor"
              >
                <path d="M6 6h12v12H6z" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
