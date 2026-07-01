"use client";

import { KapuAvatar } from "@/components/shared/KapuAvatar";
import { AGENT } from "@/lib/persona";

export default function Header({
  count,
  total,
  onCart,
  onMenuOpen,
  isStreaming,
}: {
  count: number;
  total: number;
  onCart: () => void;
  onMenuOpen: () => void;
  isStreaming: boolean;
}) {
  return (
    <header className="shrink-0 h-12 sm:h-15 px-4 sm:px-6 flex items-center justify-between border-b border-line bg-canvas/80 backdrop-blur-md z-10">
      <div className="flex items-center gap-2.5 sm:gap-3">
        <button
          onClick={onMenuOpen}
          className="lg:hidden mr-1 w-8 h-8 rounded-lg hover:bg-surface transition-colors grid place-items-center text-inksoft"
          aria-label="Open menu"
        >
          <svg viewBox="0 0 20 20" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M3 5h14M3 10h14M3 15h14" />
          </svg>
        </button>
        <KapuAvatar size={32} />
        <div className="leading-tight">
          <div className="font-semibold text-ink text-[14px] sm:text-[15px] flex items-center gap-2">
            {AGENT.name}
            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-forest">
              <span className="w-1.5 h-1.5 rounded-full bg-forest" />
              {isStreaming ? "typing…" : "online"}
            </span>
          </div>
          <div className="hidden sm:block text-[12px] text-inksoft">
            Your shopping companion · powered by Kapruka
          </div>
        </div>
      </div>

      <button
        data-testid="cart-button"
        onClick={onCart}
        className="relative h-9 sm:h-10 px-2.5 sm:px-3.5 rounded-xl bg-surface border border-line shadow-card hover:shadow-lift transition-all inline-flex items-center gap-2 text-ink font-semibold text-[14px]"
      >
        <svg
          viewBox="0 0 24 24"
          width="20"
          height="20"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.9"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M3 4h2l2.2 11.2a1.5 1.5 0 0 0 1.5 1.2h8.4a1.5 1.5 0 0 0 1.5-1.2L21 7H6" />
          <circle cx="9.5" cy="20" r="1.4" fill="currentColor" stroke="none" />
          <circle cx="18" cy="20" r="1.4" fill="currentColor" stroke="none" />
        </svg>
        <span className="hidden sm:inline">Cart</span>
        {count > 0 && (
          <>
            <span className="hidden sm:inline text-[12px] text-inksoft font-normal">
              · Rs {total.toLocaleString()}
            </span>
            <span data-testid="cart-count" className="absolute -top-2 -right-2 min-w-5 h-5 px-1.5 rounded-full bg-brand text-white text-[11px] font-bold grid place-items-center">
              {count}
            </span>
          </>
        )}
      </button>
    </header>
  );
}
