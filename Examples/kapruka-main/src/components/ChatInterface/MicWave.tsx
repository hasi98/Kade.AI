"use client";

import { useEffect, useRef } from "react";

const BAR_COUNT = 3;
const BINS = [3, 6, 10, 15, 20];

export default function MicWave({
  analyserRef,
}: {
  analyserRef: React.RefObject<AnalyserNode | null>;
}) {
  const barRefs = useRef<(HTMLDivElement | null)[]>([]);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const data = new Uint8Array(32);

    function tick() {
      rafRef.current = requestAnimationFrame(tick);
      const analyser = analyserRef.current;
      if (!analyser) return;
      analyser.getByteFrequencyData(data);
      barRefs.current.forEach((el, i) => {
        if (!el) return;
        const norm = (data[BINS[i]] ?? 0) / 255;
        const pct = Math.max(0.15, norm);
        el.style.transform = `scaleY(${pct})`;
        el.style.opacity = String(0.4 + pct * 0.6);
      });
    }

    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [analyserRef]);

  return (
    <div className="flex items-end gap-0.75 h-5 shrink-0">
      {Array.from({ length: BAR_COUNT }).map((_, i) => (
        <div
          key={i}
          ref={(el) => {
            barRefs.current[i] = el;
          }}
          className="w-0.75 rounded-full bg-brand"
          style={{
            height: "20px",
            transform: "scaleY(0.15)",
            transformOrigin: "bottom",
            transition: "transform 60ms linear",
          }}
        />
      ))}
    </div>
  );
}
