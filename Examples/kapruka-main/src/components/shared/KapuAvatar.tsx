import { KAPU_COLORS, KAPU_PATHS } from "@/lib/kapu-brand";

export function TreeMark({
  size = 28,
  className = "",
}: {
  size?: number;
  className?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <path
        d={KAPU_PATHS.trunk}
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <path d={KAPU_PATHS.crown} fill="currentColor" />
    </svg>
  );
}

export function KapuAvatar({ size = 36 }: { size?: number }) {
  return (
    <div
      className="shrink-0 rounded-full grid place-items-center"
      style={{
        width: size,
        height: size,
        background: `linear-gradient(150deg, ${KAPU_COLORS.gradientStart}, ${KAPU_COLORS.gradientEnd})`,
        boxShadow: "0 4px 12px -4px rgba(64,41,112,.55)",
        color: KAPU_COLORS.mark,
      }}
    >
      <TreeMark size={Math.round(size * 0.55)} />
    </div>
  );
}
