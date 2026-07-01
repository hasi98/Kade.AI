"use client";

import { useCartStore } from "@/store/cart";
import type { CartItem } from "@/types";

export function isCake(item: CartItem) {
  return item.id.toLowerCase().startsWith("cake");
}

export function IcingInput({ item }: { item: CartItem }) {
  const updateIcingText = useCartStore((s) => s.updateIcingText);
  return (
    <div className="mt-2 pt-2 border-t border-line/60">
      <label className="text-[11px] font-semibold text-brand uppercase tracking-wide flex items-center gap-1 mb-1">
        🎂 Cake inscription
        <span className="font-normal normal-case text-inksoft">
          (max 120 chars)
        </span>
      </label>
      <input
        type="text"
        maxLength={120}
        value={item.icing_text ?? ""}
        onChange={(e) => updateIcingText(item.id, e.target.value)}
        placeholder="e.g. Happy Birthday Amali! 🎉"
        className="w-full text-[13px] text-ink bg-surf2 border border-line rounded-lg px-2.5 py-1.5 outline-none focus:border-brand/60 placeholder:text-inksoft transition-colors"
      />
      {item.icing_text && (
        <div className="text-[10.5px] text-inksoft text-right mt-0.5">
          {item.icing_text.length}/120
        </div>
      )}
    </div>
  );
}
