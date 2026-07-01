// DEV-ONLY: This component is not part of the final product.
// It tracks API usage costs during development and should be removed before shipping.
"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Zap,
  ChevronUp,
  ArrowDownLeft,
  ArrowUpRight,
  RefreshCw,
} from "lucide-react";

type UsageData = {
  inputTokens: number;
  outputTokens: number;
  requests: number;
  costUsd: number;
  startedAt: number;
};

function fmt(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return String(n);
}

function elapsed(startedAt: number) {
  const s = Math.floor((Date.now() - startedAt) / 1000);
  if (s < 60) return `${s}s`;
  if (s < 3600) return `${Math.floor(s / 60)}m ${s % 60}s`;
  return `${Math.floor(s / 3600)}h ${Math.floor((s % 3600) / 60)}m`;
}

export default function CreditsBadge() {
  const [data, setData] = useState<UsageData | null>(null);
  const [open, setOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [, setTick] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  async function load() {
    setRefreshing(true);
    try {
      const res = await fetch("/api/credits");
      if (res.ok) setData(await res.json());
    } finally {
      setRefreshing(false);
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, []);

  // Poll every 8 seconds
  useEffect(() => {
    const id = setInterval(() => {
      load();
      setTick((t) => t + 1);
    }, 8000);
    return () => clearInterval(id);
  }, []);

  // Elapsed timer
  useEffect(() => {
    if (!open) return;
    const id = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(id);
  }, [open]);

  const cost = data?.costUsd ?? 0;
  const costStr = cost < 0.01 && cost > 0 ? "<$0.01" : `~$${cost.toFixed(2)}`;

  const dotColor = cost > 0.5 ? "#ff7c5c" : cost > 0.1 ? "#FFB800" : "#4ade80";

  return (
    <div
      ref={containerRef}
      className="fixed bottom-36 left-0 z-50 flex flex-col items-start font-mono"
    >
      <AnimatePresence>
        {open && data && (
          <motion.div
            key="panel"
            initial={{ opacity: 0, x: -16, scale: 0.97 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: -16, scale: 0.97 }}
            transition={{ type: "spring", stiffness: 400, damping: 28 }}
            className="mb-2 ml-0 w-56 rounded-r-2xl overflow-hidden border-r-2 border-t-2 border-b-2 border-dashed border-yellow-400/60"
            style={{
              background: "#0d0d0d",
              boxShadow: "4px 4px 0px #eab308aa",
            }}
          >
            {/* Header */}
            <div className="px-3.5 pt-3 pb-2 flex items-center justify-between border-b border-yellow-400/20 bg-yellow-400/10">
              <div className="flex items-center gap-1.5">
                <span className="text-yellow-400 text-[9px] font-bold tracking-widest uppercase">
                  ⚠ DEV ONLY
                </span>
              </div>
              <button
                onClick={() => load()}
                className="text-yellow-400/40 hover:text-yellow-400 transition-colors"
              >
                <RefreshCw
                  size={10}
                  className={refreshing ? "animate-spin" : ""}
                />
              </button>
            </div>

            {/* Label + cost */}
            <div className="px-3.5 py-3">
              <div className="text-yellow-400/80 text-[8px] uppercase tracking-widest mb-1 flex items-center gap-1">
                <Zap size={8} />
                Session Cost
              </div>
              <div className="flex items-end gap-1">
                <span
                  className="text-2xl font-bold tracking-tight"
                  style={{ color: dotColor }}
                >
                  {costStr}
                </span>
                <span className="text-white/60 text-[10px] mb-0.5">USD</span>
              </div>
              <p className="text-white/50 text-[9px] mt-0.5">
                approx · published pricing
              </p>
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-3 divide-x divide-yellow-400/10 border-t border-yellow-400/20">
              {[
                { label: "Req", value: String(data.requests) },
                {
                  label: "In",
                  value: fmt(data.inputTokens),
                  icon: <ArrowDownLeft size={8} />,
                },
                {
                  label: "Out",
                  value: fmt(data.outputTokens),
                  icon: <ArrowUpRight size={8} />,
                },
              ].map(({ label, value, icon }) => (
                <div
                  key={label}
                  className="flex flex-col items-center py-2.5 gap-0.5"
                >
                  <div className="flex items-center gap-0.5 text-yellow-400/80 text-[8px] uppercase tracking-wider">
                    {icon}
                    {label}
                  </div>
                  <span className="text-white text-xs font-semibold">
                    {value}
                  </span>
                </div>
              ))}
            </div>

            {/* Footer */}
            <div className="px-3.5 py-2 bg-yellow-400/5 flex items-center justify-between border-t border-yellow-400/10">
              <span className="text-white/60 text-[9px]">
                {elapsed(data.startedAt)}
              </span>
              <span className="text-yellow-400/70 text-[9px]">
                not in final product
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Edge tab trigger */}
      <motion.button
        onClick={() => setOpen((o) => !o)}
        whileHover={{ x: 2 }}
        whileTap={{ scale: 0.95 }}
        initial={{ opacity: 0, x: -40 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.8, type: "spring", stiffness: 300, damping: 24 }}
        className="flex flex-col items-center gap-1 rounded-r-md px-1 py-2 cursor-pointer select-none border border-l-0 border-yellow-400/30"
        style={{ background: "#0d0d0d" }}
      >
        <motion.span
          animate={{ rotate: open ? -90 : 90 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronUp size={7} className="text-yellow-400/60" />
        </motion.span>
      </motion.button>
    </div>
  );
}
