"use client";

export default function VoiceButton({
  connecting,
  listening,
  speaking,
  disabled,
  onClick,
}: {
  connecting: boolean;
  listening: boolean;
  speaking: boolean;
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`shrink-0 w-9 h-9 rounded-xl grid place-items-center transition-colors disabled:opacity-30 ${
        connecting
          ? "text-brand"
          : listening
          ? speaking
            ? "bg-brand text-white animate-pulse"
            : "bg-red-500 text-white"
          : "text-inksoft hover:text-brand"
      }`}
      aria-label={connecting ? "Connecting…" : listening ? "End voice session" : "Start voice session"}
    >
      {connecting ? (
        <svg className="animate-spin" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path strokeLinecap="round" d="M12 2a10 10 0 0 1 10 10" />
        </svg>
      ) : listening && speaking ? (
        <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
          <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3A4.5 4.5 0 0 0 14 7.97v8.05c1.48-.73 2.5-2.25 2.5-4.02z" />
        </svg>
      ) : (
        <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
          <path d="M12 14a3 3 0 0 0 3-3V5a3 3 0 0 0-6 0v6a3 3 0 0 0 3 3zm5-3a5 5 0 0 1-10 0H5a7 7 0 0 0 6 6.93V20H9v2h6v-2h-2v-2.07A7 7 0 0 0 19 11h-2z" />
        </svg>
      )}
    </button>
  );
}
