"use client";

import { useState } from "react";
import { GiftIcon, GiftMessageTextarea } from "@/components/shared/GiftMessageTextarea";

export function GiftMessageCard({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="mt-1">
      {!open && !value ? (
        <button
          onClick={() => setOpen(true)}
          className="inline-flex items-center gap-2 text-[13px] font-semibold text-brand mb-2"
        >
          <GiftIcon />
          Add a gift message
        </button>
      ) : (
        <div className="animate-rise">
          <div className="flex items-center justify-between mb-2">
            <span className="inline-flex items-center gap-2 text-[13px] font-semibold text-brand">
              <GiftIcon />
              Gift message
            </span>
            <button
              onClick={() => {
                onChange("");
                setOpen(false);
              }}
              className="text-[12px] text-inksoft hover:text-brand transition-colors"
            >
              Remove
            </button>
          </div>
          <GiftMessageTextarea value={value} onChange={onChange} />
        </div>
      )}
    </div>
  );
}
