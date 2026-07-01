"use client";

export default function ThinkingDots({ label }: { label?: string }) {
  return (
    <div className="bg-surface rounded-2xl rounded-tl-md px-4 py-3.5 shadow-card inline-flex items-center gap-2 w-fit">
      <div className="flex items-center gap-1.5">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="animate-blink w-2 h-2 rounded-full bg-inksoft"
            style={{ animationDelay: `${i * 0.18}s` }}
          />
        ))}
      </div>
      {label && (
        <span className="text-[13px] text-inksoft truncate">{label}</span>
      )}
    </div>
  );
}
