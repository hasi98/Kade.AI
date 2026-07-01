"use client";

import { useState } from "react";
import { useCartStore } from "@/store/cart";
import { GiftIcon, GiftMessageTextarea } from "@/components/shared/GiftMessageTextarea";

interface Props {
  intro?: string;
  onSend: (text: string) => void;
}

export default function GiftMessageChatCard({ intro, onSend }: Props) {
  const storeGiftMessage = useCartStore((s) => s.gift_message);
  const setGiftMessage = useCartStore((s) => s.setGiftMessage);

  const [msg, setMsg] = useState(storeGiftMessage);
  const [saved, setSaved] = useState(false);

  function handleSave() {
    if (!msg.trim() || saved) return;
    setGiftMessage(msg.trim());
    setSaved(true);
    onSend(`Gift message: "${msg.trim()}"`);
  }

  return (
    <div className="mt-1 max-w-115 animate-rise">
      {intro && (
        <p className="text-[15px] leading-relaxed text-ink mb-3">{intro}</p>
      )}

      <button
        onClick={() => {}}
        className="inline-flex items-center gap-2 text-[13px] font-semibold text-brand mb-2"
      >
        <GiftIcon />
        {saved ? "Gift message added" : "Add a gift message"}
        {saved && (
          <svg
            viewBox="0 0 24 24"
            width="14"
            height="14"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.4"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-forest"
          >
            <path d="M5 12.5l4.5 4.5L19 7" />
          </svg>
        )}
      </button>

      <GiftMessageTextarea
        value={msg}
        onChange={(v) => {
          setMsg(v);
          setSaved(false);
        }}
        saved={saved}
        autoFocus={!saved}
        onKeyDown={(e) => {
          if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleSave();
        }}
      />

      {!saved && (
        <button
          onClick={handleSave}
          disabled={!msg.trim()}
          className="mt-2.5 w-full h-10 rounded-xl bg-brand text-white font-semibold text-[14px] disabled:opacity-30 hover:bg-branddeep transition-colors"
        >
          Save message →
        </button>
      )}
    </div>
  );
}
