"use client";

import { AGENT } from "@/lib/persona";
import SuggestedReplies from "./SuggestedReplies";

export default function Greeting({ onSend }: { onSend: (t: string) => void }) {
  return (
    <div className="flex gap-2.5 sm:gap-3 max-w-160 animate-rise">
      <div className="min-w-0 flex-1">
        <div className="text-[12px] font-semibold text-inksoft mb-1.5 tracking-wide">
          {AGENT.name}
        </div>
        <div className="bg-surface rounded-2xl rounded-tl-md px-3.5 py-2.5 sm:px-4 sm:py-3 shadow-card text-[14px] sm:text-[15.5px] leading-relaxed text-ink">
          <span className="font-display text-[18px] sm:text-[22px] leading-tight text-ink block mb-1">
            Ayubowan! I&apos;m {AGENT.name} 🌿
          </span>
          Whatever you need — groceries, gadgets, cakes, or a gift for someone
          special — I&apos;ll find it on Kapruka and get it delivered anywhere in
          Sri Lanka. What can I get you today?
        </div>
        <SuggestedReplies visible onSelect={onSend} className="mt-2.5" />
      </div>
    </div>
  );
}
