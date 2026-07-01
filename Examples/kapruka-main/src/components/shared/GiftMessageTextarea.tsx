"use client";

import React from "react";

export function GiftIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="16"
      height="16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M4 11h16v9H4zM4 7h16v4H4zM12 7v13M12 7S10.5 3 8.5 3 6 5 6 6s2 1 6 1zM12 7s1.5-4 3.5-4S18 5 18 6s-2 1-6 1z" />
    </svg>
  );
}

interface Props {
  value: string;
  onChange: (v: string) => void;
  saved?: boolean;
  autoFocus?: boolean;
  onKeyDown?: React.KeyboardEventHandler<HTMLTextAreaElement>;
}

export function GiftMessageTextarea({
  value,
  onChange,
  saved = false,
  autoFocus,
  onKeyDown,
}: Props) {
  return (
    <div
      className={`rounded-2xl p-5 shadow-card border transition-colors ${saved ? "border-forest/40" : "border-goldsoft"}`}
      style={{ background: "linear-gradient(150deg,#FFFDF7,#F8EFDC)" }}
    >
      <div className="text-[11px] uppercase tracking-widest text-gold font-bold">
        A note from you
      </div>
      <textarea
        rows={3}
        maxLength={300}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={onKeyDown}
        placeholder="e.g. Happy Birthday, Amma! Wish I could be there to hug you. With all my love 🤍"
        className="mt-2 w-full bg-transparent resize-none outline-none font-hand text-[22px] leading-snug text-ink placeholder:text-[#b09a72] placeholder:text-[16px]"
        autoFocus={autoFocus}
      />
      <div className="mt-2 flex items-center justify-between text-[11.5px] text-[#9a8060]">
        <span>Printed on a Kapruka gift card · Free</span>
        <span>{value.length}/300</span>
      </div>
    </div>
  );
}
