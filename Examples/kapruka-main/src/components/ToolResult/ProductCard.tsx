"use client";

import { useState } from "react";
import Image from "next/image";
import { ExternalLink } from "lucide-react";
import { useCartStore } from "@/store/cart";
import type { Product } from "@/types";
import { decodeHtml } from "@/lib/product";
import { Stars } from "@/components/shared/Stars";

export default function ProductCard({ product }: { product: Product }) {
  const addItem = useCartStore((s) => s.addItem);
  const openCart = useCartStore((s) => s.openCart);
  const [added, setAdded] = useState(false);
  const [imgFailed, setImgFailed] = useState(false);

  const handleAdd = () => {
    if (!product.in_stock) return;
    addItem({
      id: product.id,
      name: decodeHtml(product.name),
      price: product.price.amount ?? 0,
      currency: product.price.currency,
      quantity: 1,
      image_url: product.image_url,
    });
    openCart();
    setAdded(true);
    setTimeout(() => setAdded(false), 1300);
  };

  const priceAmt = product.price.amount;
  const compareAmt = product.compare_at_price?.amount;
  const hasDiscount = compareAmt && priceAmt && compareAmt > priceAmt;

  return (
    <div data-testid="product-card" className="group shrink-0 w-52.5 bg-surface rounded-2xl overflow-hidden border border-line/70">
      {/* Image */}
      <div className="relative aspect-square overflow-hidden bg-surf2">
        {product.image_url && !imgFailed ? (
          <Image
            fill
            src={product.image_url}
            alt={product.name}
            sizes="210px"
            onError={() => setImgFailed(true)}
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-inksoft text-4xl">
            🛍️
          </div>
        )}

        {/* Category tag */}
        <span className="absolute top-2.5 left-2.5 bg-surface/90 backdrop-blur text-ink text-[10.5px] font-bold uppercase tracking-wider px-2 py-1 rounded-full">
          {product.category.name}
        </span>

        {/* Discount badge */}
        {hasDiscount && priceAmt && compareAmt && (
          <span className="absolute top-2.5 right-2.5 bg-brand text-surface text-[10.5px] font-bold px-2 py-1 rounded-full">
            -{Math.round((1 - priceAmt / compareAmt) * 100)}%
          </span>
        )}

        {/* Out of stock overlay */}
        {!product.in_stock && (
          <div className="absolute inset-0 bg-canvas/70 flex items-center justify-center">
            <span className="text-xs font-semibold text-inksoft bg-surface/80 px-2 py-1 rounded-full">
              Out of stock
            </span>
          </div>
        )}
      </div>

      {/* Details */}
      <div className="p-3">
        <div className="text-[14px] font-semibold text-ink leading-snug line-clamp-2 min-h-9.5">
          {decodeHtml(product.name)}
        </div>

        {product.rating && (
          <div className="mt-1 flex items-center gap-1.5">
            <Stars rating={product.rating} />
          </div>
        )}

        <div className="mt-2 flex items-end justify-between">
          <div>
            <div className="text-[15px] font-bold text-ink">
              {product.price.currency}{" "}
              {priceAmt != null ? priceAmt.toLocaleString() : "—"}
            </div>
            {hasDiscount && compareAmt && (
              <div className="text-[11.5px] text-inksoft line-through -mt-0.5">
                {compareAmt.toLocaleString()}
              </div>
            )}
          </div>

          <div className="flex items-center gap-1.5">
            <a
              href={product.url}
              target="_blank"
              rel="noopener noreferrer"
              className="w-8 h-8 rounded-full grid place-items-center bg-surf2 border border-line text-inksoft hover:text-ink transition-colors"
              title="View on Kapruka"
              onClick={(e) => e.stopPropagation()}
            >
              <ExternalLink className="w-3 h-3" />
            </a>
            <button
              onClick={handleAdd}
              disabled={!product.in_stock}
              className={`grid place-items-center w-9 h-9 rounded-full transition-all ${
                added
                  ? "bg-forest text-white"
                  : "bg-brandsoft text-brand hover:bg-brand hover:text-white disabled:opacity-40 disabled:cursor-not-allowed"
              }`}
              aria-label="Add to cart"
            >
              {added ? (
                <svg
                  viewBox="0 0 24 24"
                  width="16"
                  height="16"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M5 12.5l4.5 4.5L19 7" />
                </svg>
              ) : (
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
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
