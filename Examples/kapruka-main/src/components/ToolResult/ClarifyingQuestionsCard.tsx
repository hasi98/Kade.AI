"use client";

import { useEffect, useRef, useState } from "react";

interface Question {
  key: string;
  label: string;
  options?: string[];
  emoji?: string;
}

interface Props {
  intro?: string;
  questions: Question[];
  onSend: (text: string) => void;
}

export default function ClarifyingQuestionsCard({ intro, questions, onSend }: Props) {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [step, setStep] = useState(0);
  const [goingBack, setGoingBack] = useState(false);
  const [pendingChip, setPendingChip] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const advanceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (advanceTimer.current) clearTimeout(advanceTimer.current);
    };
  }, []);

  const q = questions[step];
  const isLast = step === questions.length - 1;
  const current = answers[q?.key ?? ""] ?? "";

  function set(key: string, val: string) {
    setAnswers((prev) => ({ ...prev, [key]: val }));
  }

  function finish(finalAnswers: Record<string, string>) {
    const parts = questions
      .map((question) => finalAnswers[question.key]?.trim())
      .filter(Boolean) as string[];
    if (parts.length) onSend(parts.join(", "));
    setSubmitted(true);
  }

  function advance(finalAnswers: Record<string, string>) {
    if (isLast) {
      finish(finalAnswers);
    } else {
      setGoingBack(false);
      setStep((s) => s + 1);
    }
  }

  function handleChip(opt: string) {
    if (pendingChip) return;
    const next = { ...answers, [q.key]: opt };
    setAnswers(next);
    setPendingChip(opt);
    advanceTimer.current = setTimeout(() => {
      setPendingChip(null);
      advance(next);
    }, 220);
  }

  function handleBack() {
    if (step === 0 || pendingChip) return;
    setGoingBack(true);
    setStep((s) => s - 1);
  }

  if (submitted) {
    const answered = questions.filter((question) => answers[question.key]?.trim());
    if (!answered.length) return null;
    return (
      <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-line/60 bg-surface shadow-sm animate-rise">
        <svg
          viewBox="0 0 24 24"
          width="13"
          height="13"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.6"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-forest shrink-0"
        >
          <path d="M5 12.5l4.5 4.5L19 7" />
        </svg>
        <span className="text-[13px] font-medium text-ink">
          {answered
            .map((question) =>
              [question.emoji, answers[question.key].trim()].filter(Boolean).join(" ")
            )
            .join("  ·  ")}
        </span>
      </div>
    );
  }

  return (
    <div data-testid="clarifying-questions-card" className="bg-surface rounded-2xl rounded-tl-md shadow-lift overflow-hidden border border-line/50 animate-rise">
      {intro && (
        <div className="px-5 pt-5">
          <p className="text-[15px] leading-relaxed text-ink">{intro}</p>
        </div>
      )}

      <div className="px-5 pt-4 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          {questions.map((question, i) => (
            <span
              key={question.key}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i === step
                  ? "w-5 bg-brand"
                  : answers[question.key]?.trim()
                    ? "w-1.5 bg-brand/60"
                    : "w-1.5 bg-line"
              }`}
            />
          ))}
        </div>
        <span className="text-[11px] font-medium text-inksoft/70 tabular-nums">
          {step + 1} of {questions.length}
        </span>
      </div>

      <div key={q.key} className={goingBack ? "animate-step-in-back" : "animate-step-in"}>
        <div className="px-5 pt-4 space-y-3">
          <p className="text-[15px] font-semibold text-ink">
            {q.emoji && <span className="mr-2">{q.emoji}</span>}
            {q.label}
          </p>

          {q.options && (
            <div className="flex flex-wrap gap-2">
              {q.options.map((opt) => {
                const selected = current === opt;
                return (
                  <button
                    key={opt}
                    onClick={() => handleChip(opt)}
                    className={`px-3.5 py-1.5 rounded-full text-[13px] font-medium border transition-all duration-150 ${
                      selected
                        ? "bg-brand text-white border-brand shadow-sm scale-[1.03]"
                        : "border-line text-inksoft bg-canvas hover:border-brand/50 hover:text-brand hover:bg-brandsoft/20"
                    }`}
                  >
                    {selected && <span className="mr-1 text-[11px] opacity-80">✓</span>}
                    {opt}
                  </button>
                );
              })}
            </div>
          )}

          <input
            type="text"
            value={q.options && q.options.includes(current) ? "" : current}
            onChange={(e) => set(q.key, e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && current.trim() && advance(answers)}
            placeholder={q.options ? "Or type your own…" : "Type here…"}
            className="w-full px-3.5 py-2.5 rounded-xl border border-line bg-canvas text-[14px] text-ink placeholder:text-inksoft/60 outline-none focus:border-brand/50 focus:ring-2 focus:ring-brand/10 transition-all"
          />
        </div>

        <div className="px-5 pb-4 pt-3 flex items-center justify-between">
          <button
            onClick={handleBack}
            className={`text-[13px] font-medium text-inksoft/70 hover:text-brand transition-colors ${
              step === 0 ? "invisible" : ""
            }`}
          >
            ← Back
          </button>
          <button
            onClick={() => advance(answers)}
            className={`text-[13px] font-semibold transition-colors ${
              current.trim()
                ? "text-brand hover:text-branddeep"
                : "text-inksoft/70 hover:text-brand"
            }`}
          >
            {current.trim()
              ? isLast
                ? "Done →"
                : "Next →"
              : isLast
                ? "Finish →"
                : "Skip →"}
          </button>
        </div>
      </div>
    </div>
  );
}
