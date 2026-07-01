"use client";

import { useRef } from "react";
import ProductCard from "./ProductCard";
import type { Product } from "@/types";

interface Props {
  products: Product[];
  query?: string;
}

export default function ProductCarousel({
  products: rawProducts,
  query,
}: Props) {
  const products = rawProducts.filter(
    (p, i, arr) => arr.findIndex((q) => q.id === p.id) === i,
  );
  const scrollRef = useRef<HTMLDivElement>(null);

  const nudge = (d: number) =>
    scrollRef.current?.scrollBy({ left: d, behavior: "smooth" });

  if (!products || products.length === 0) {
    return (
      <div className="px-4 py-3 rounded-2xl bg-surface border border-line shadow-card text-[14px] text-inksoft">
        No products found{query ? ` for "${query}"` : ""}.
      </div>
    );
  }

  return (
    <div className="relative mt-3 -mr-2">
      <div
        ref={scrollRef}
        className="no-scrollbar flex gap-3 overflow-x-auto pb-2 pr-2 snap-x"
      >
        {products.map((product, i) => (
          <div
            key={product.id}
            className="snap-start"
            style={{ animation: `cardEnter 0.35s cubic-bezier(.2,.7,.2,1) ${i * 60}ms both` }}
          >
            <ProductCard product={product} />
          </div>
        ))}
      </div>

      {products.length > 2 && (
        <>
          <button
            onClick={() => nudge(-460)}
            className="absolute -left-3 top-[42%] w-9 h-9 rounded-full bg-surface shadow-lift grid place-items-center text-ink hover:bg-ink hover:text-surface transition-colors border border-line"
            aria-label="Scroll left"
          >
            <svg
              viewBox="0 0 24 24"
              width="18"
              height="18"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M15 5l-7 7 7 7" />
            </svg>
          </button>
          <button
            onClick={() => nudge(460)}
            className="absolute -right-1 top-[42%] w-9 h-9 rounded-full bg-surface shadow-lift grid place-items-center text-ink hover:bg-ink hover:text-surface transition-colors border border-line"
            aria-label="Scroll right"
          >
            <svg
              viewBox="0 0 24 24"
              width="18"
              height="18"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </>
      )}

      <p className="text-[12px] text-inksoft mt-1.5">
        {products.length} result{products.length !== 1 ? "s" : ""}
      </p>
    </div>
  );
}
