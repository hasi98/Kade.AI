"use client";

import { TreeMark } from "@/components/shared/KapuAvatar";
import { RAIL_CATEGORIES, categoryPrompt } from "@/lib/constants";
import { version } from "../../../package.json";
import type { ConvMeta } from "@/hooks/useConversationStorage";
import { timeAgo } from "@/lib/format";

export default function Sidebar({
  onSend,
  onNewChat,
  history,
  activeId,
  onLoadConversation,
  onClearAll,
  open,
  onClose,
}: {
  onSend: (t: string) => void;
  onNewChat: () => void;
  history: ConvMeta[];
  activeId: string;
  onLoadConversation: (id: string) => void;
  onClearAll: () => void;
  open?: boolean;
  onClose?: () => void;
}) {
  return (
    <>
      {/* Mobile backdrop */}
      {open && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={[
          "fixed top-0 left-0 h-full z-50 w-65 flex flex-col bg-rail text-[#E8DEFF]",
          "transform transition-transform duration-300 ease-in-out",
          open ? "translate-x-0" : "-translate-x-full",
          "lg:relative lg:translate-x-0 lg:shrink-0",
        ].join(" ")}
      >
        {/* Logo */}
        <div className="px-5 pt-5 pb-4 flex items-start justify-between">
          <div className="flex items-center gap-2.5">
            <div
              className="w-9 h-9 rounded-xl grid place-items-center"
              style={{ background: "linear-gradient(150deg,#6040A0,#402970)" }}
            >
              <TreeMark size={20} className="text-goldsoft" />
            </div>
            <div className="leading-none">
              <div className="font-display text-[22px] tracking-tight">
                Kapruka
              </div>
              <div className="text-[10.5px] uppercase tracking-[.18em] text-[#9b8fb4]">
                Shopping concierge
              </div>
            </div>
          </div>
          {/* Close button (mobile only) */}
          <button
            onClick={onClose}
            className="lg:hidden w-8 h-8 rounded-lg hover:bg-white/10 transition-colors grid place-items-center text-[#9b8fb4]"
            aria-label="Close menu"
          >
            <svg
              viewBox="0 0 20 20"
              width="16"
              height="16"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
            >
              <path d="M4 4l12 12M16 4L4 16" />
            </svg>
          </button>
        </div>

        {/* New conversation */}
        <div className="px-3.5">
          <button
            onClick={() => {
              onNewChat();
              onClose?.();
            }}
            className="w-full h-10 rounded-xl bg-brand hover:bg-branddeep transition-colors text-white font-semibold text-[14px] inline-flex items-center justify-center gap-2"
          >
            <svg
              viewBox="0 0 20 20"
              width="16"
              height="16"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
            >
              <path d="M10 4v12M4 10h12" />
            </svg>
            New conversation
          </button>
        </div>

        {/* Shop by */}
        <div className="px-5 mt-6 text-[10.5px] font-bold uppercase tracking-[.16em] text-[#8B7BB5]">
          Shop by
        </div>
        <div className="px-3.5 mt-2 flex flex-col gap-0.5">
          {RAIL_CATEGORIES.map((c) => (
            <button
              key={c.label}
              onClick={() => {
                onSend(categoryPrompt(c.label));
                onClose?.();
              }}
              className="flex items-center gap-3 px-2.5 h-9 rounded-lg text-[14px] text-[#D4C8F0] hover:bg-white/8 transition-colors text-left"
            >
              <span className="text-[15px]">{c.emoji}</span>
              {c.label}
            </button>
          ))}
        </div>

        {/* Recent */}
        <div className="px-5 mt-6 flex items-center justify-between">
          <span className="text-[10.5px] font-bold uppercase tracking-[.16em] text-[#8B7BB5]">
            Recent
          </span>
          {history.length > 0 && (
            <button
              onClick={onClearAll}
              className="text-[10.5px] text-[#7B6BA5] hover:text-[#c4b8e0] transition-colors"
            >
              Clear all
            </button>
          )}
        </div>
        <div className="px-3.5 mt-2 flex flex-col gap-0.5 overflow-y-auto no-scrollbar flex-1">
          {history.length === 0 && (
            <div className="px-2.5 py-2 text-[12px] text-[#7B6BA5] italic">
              No conversations yet
            </div>
          )}
          {history.map((h) => (
            <button
              key={h.id}
              onClick={() => {
                onLoadConversation(h.id);
                onClose?.();
              }}
              className={`text-left px-2.5 py-2 rounded-lg transition-colors ${h.id === activeId ? "bg-white/12" : "hover:bg-white/8"}`}
            >
              <div className="text-[13px] text-[#D4C8F0] truncate">
                {h.title}
              </div>
              <div className="text-[11px] text-[#7B6BA5]">
                {timeAgo(h.updatedAt)}
              </div>
            </button>
          ))}
        </div>

        {/* Version */}
        <div className="px-5 pb-2 text-[9px] text-[#5a4f72] font-mono">v{version}</div>

        {/* Footer */}
        <div className="p-3.5 border-t border-white/10 flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-[#9b8fb4] grid place-items-center text-rail font-bold text-[13px]">
            G
          </div>
          <div className="leading-tight">
            <div className="text-[13px] text-[#E8DEFF] font-medium">
              Guest checkout
            </div>
            <div className="text-[11px] text-[#7B6BA5]">No account needed</div>
          </div>
        </div>
      </aside>
    </>
  );
}
