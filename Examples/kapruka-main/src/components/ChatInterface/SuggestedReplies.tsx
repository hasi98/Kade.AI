"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

const EVERYDAY_SUGGESTIONS = [
  "🛒 I need to order my weekly groceries",
  "🔌 Find me a phone charger under Rs 5000",
  "🎧 Show me wireless earbuds under Rs 10000",
  "🧴 I'm out of shampoo and body wash — restock me",
  "🍚 Order a 5kg bag of rice and some dhal",
  "💻 What laptop accessories do you have?",
  "🏠 I need new bedsheets for a double bed",
  "📦 Can you help me track my existing order?",
];

const GIFT_SUGGESTIONS = [
  "🎂 Can you find a birthday gift for my amma under Rs 3000?",
  "💐 What flowers can I send as a surprise for someone special?",
  "🎁 Do you have gift hampers under Rs 5000?",
  "🍰 What cakes can I order for a party?",
  "🧸 Can you suggest a toy for a child under Rs 2000?",
  "💍 What anniversary gifts are available under Rs 10000?",
];

function pickRandom<T>(arr: T[], n: number): T[] {
  return [...arr].sort(() => Math.random() - 0.5).slice(0, n);
}

interface Props {
  onSelect: (text: string) => void;
  visible: boolean;
  suggestions?: string[];
  className?: string;
}

export default function SuggestedReplies({ onSelect, visible, suggestions, className = "px-4 sm:px-6 py-2 mx-auto w-full max-w-190" }: Props) {
  const [defaultSuggestions] = useState(() => [...pickRandom(EVERYDAY_SUGGESTIONS, 2), ...pickRandom(GIFT_SUGGESTIONS, 2)]);
  const displayed = suggestions ?? defaultSuggestions;
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 8 }}
          transition={{ duration: 0.2 }}
          className={`flex flex-wrap gap-1 sm:gap-2 ${className}`}
        >
          {displayed.map((s) => (
            <button
              key={s}
              onClick={() => onSelect(s)}
              className="px-3 py-1.5 rounded-full bg-surface border border-line text-[13px] text-ink hover:border-brand hover:text-brand transition-all shadow-card"
            >
              {s}
            </button>
          ))}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
