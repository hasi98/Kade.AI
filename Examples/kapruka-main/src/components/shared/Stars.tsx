export function Stars({ rating, size = "sm" }: { rating: number; size?: "sm" | "md" }) {
  const iconSize = size === "md" ? 14 : 13;
  const textSize = size === "md" ? "text-[13px]" : "text-[12px]";
  return (
    <span className="inline-flex items-center gap-1 text-gold">
      <svg viewBox="0 0 20 20" width={iconSize} height={iconSize} fill="currentColor">
        <path d="M10 1.6l2.5 5.1 5.6.8-4 3.9.9 5.6L10 14.4 5 17l1-5.6-4-3.9 5.6-.8z" />
      </svg>
      <span className={`text-ink ${textSize} font-semibold`}>{rating.toFixed(1)}</span>
    </span>
  );
}
