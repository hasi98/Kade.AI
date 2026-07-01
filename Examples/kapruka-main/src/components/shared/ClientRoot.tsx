"use client";

import dynamic from "next/dynamic";
import { TreeMark } from "./KapuAvatar";
import { AGENT } from "@/lib/persona";
import CreditsBadge from "./CreditsBadge";

const ChatInterface = dynamic(() => import("@/components/ChatInterface"), {
  ssr: false,
  loading: () => (
    <div className="flex h-screen items-center justify-center bg-canvas">
      <div className="flex items-center gap-3 text-inksoft">
        <div
          className="w-10 h-10 rounded-full grid place-items-center animate-pulse"
          style={{ background: "linear-gradient(150deg,#6040A0,#402970)" }}
        >
          <TreeMark size={22} className="text-goldsoft" />
        </div>
        <span className="text-[14px] font-medium">Loading {AGENT.name}…</span>
      </div>
    </div>
  ),
});

export default function ClientRoot() {
  return (
    <>
      <ChatInterface />
      <CreditsBadge />
    </>
  );
}
