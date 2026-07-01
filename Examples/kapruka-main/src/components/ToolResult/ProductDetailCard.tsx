"use client";

import { useState } from "react";
import { useCartStore } from "@/store/cart";
import type { ProductDetail } from "@/types";
import Image from "next/image";
import { decodeHtml } from "@/lib/product";
import { Stars } from "@/components/shared/Stars";

export default function ProductDetailCard({
  product,
}: {
  product: ProductDetail;
}) {
  const addItem = useCartStore((s) => s.addItem);
  const openCart = useCartStore((s) => s.openCart);

  const hasVariants = product.variants && product.variants.length > 0;
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(
    hasVariants ? product.variants[0].id : null,
  );
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);
  const [imgFailed, setImgFailed] = useState(false);

  const selectedVariant = hasVariants
    ? (product.variants.find((v) => v.id === selectedVariantId) ??
      product.variants[0])
    : null;

  const activePrice = selectedVariant?.price ?? product.price;
  const activeStock = selectedVariant
    ? selectedVariant.in_stock
    : product.in_stock;
  const imageUrl = product.images?.[0] ?? product.image_url;

  const priceAmt = activePrice.amount;
  const compareAmt = product.compare_at_price?.amount;
  const hasDiscount = compareAmt && priceAmt && compareAmt > priceAmt;

  function handleAdd() {
    if (!activeStock || priceAmt == null) return;
    const variantSuffix = selectedVariant
      ? ` — ${Object.values(selectedVariant.attributes).join(", ")}`
      : "";
    addItem({
      id: selectedVariant ? `${product.id}-${selectedVariant.id}` : product.id,
      name: decodeHtml(product.name) + variantSuffix,
      price: priceAmt,
      currency: activePrice.currency,
      quantity: qty,
      image_url: imageUrl,
    });
    openCart();
    setAdded(true);
    setTimeout(() => setAdded(false), 1300);
  }

  return (
    <div className="mt-3 flex rounded-2xl overflow-hidden border border-line bg-surface shadow-card">
      {/* Image */}
      <div className="relative w-52 shrink-0 bg-surf2">
        {imageUrl && !imgFailed ? (
          <Image
            fill
            src={imageUrl}
            alt={product.name}
            sizes="208px"
            onError={() => setImgFailed(true)}
            className="object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-5xl">
            🛍️
          </div>
        )}

        {hasDiscount && priceAmt && compareAmt && (
          <span className="absolute top-2.5 left-2.5 bg-brand text-surface text-[10.5px] font-bold px-2 py-1 rounded-full">
            -{Math.round((1 - priceAmt / compareAmt) * 100)}%
          </span>
        )}
      </div>

      {/* Details */}
      <div className="flex flex-col gap-3 p-4 flex-1 min-w-0">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-widest text-brand">
            {product.category.name}
          </p>
          <h2 className="text-[17px] font-bold text-ink leading-snug mt-0.5">
            {decodeHtml(product.name)}
          </h2>
          {product.rating && (
            <div className="flex items-center gap-1.5 mt-1">
              <Stars rating={product.rating} size="md" />
            </div>
          )}
          {product.description && (
            <p className="text-[13px] text-inksoft mt-1.5 leading-relaxed line-clamp-2">
              {decodeHtml(product.description)}
            </p>
          )}
        </div>

        {/* Variant selector */}
        {hasVariants && (
          <div>
            <p className="text-[11.5px] text-inksoft mb-1.5">
              {Object.keys(product.variants[0].attributes)[0] ?? "Option"}
            </p>
            <div className="flex flex-wrap gap-2">
              {product.variants.map((v) => (
                <button
                  key={v.id}
                  onClick={() => setSelectedVariantId(v.id)}
                  disabled={!v.in_stock}
                  className={`text-[12.5px] px-3 py-1.5 rounded-full border transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
                    v.id === selectedVariantId
                      ? "bg-ink text-surface border-ink"
                      : "bg-surface text-ink border-line hover:border-ink"
                  }`}
                >
                  {Object.values(v.attributes)[0] ?? v.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Price + qty + add */}
        <div className="mt-auto flex flex-col gap-2.5">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[20px] font-bold text-ink">
                {activePrice.currency}{" "}
                {priceAmt != null ? (priceAmt * qty).toLocaleString() : "—"}
              </span>
              {hasDiscount && compareAmt && (
                <span className="ml-2 text-[12px] text-inksoft line-through">
                  {compareAmt.toLocaleString()}
                </span>
              )}
            </div>

            {/* Qty stepper */}
            <div className="flex items-center gap-2 border border-line rounded-full px-3 py-1">
              <button
                onClick={() => setQty((q) => Math.max(1, q - 1))}
                className="text-ink text-[16px] leading-none w-5 text-center"
              >
                −
              </button>
              <span className="text-[14px] font-semibold text-ink w-4 text-center">
                {qty}
              </span>
              <button
                onClick={() => setQty((q) => q + 1)}
                className="text-ink text-[16px] leading-none w-5 text-center"
              >
                +
              </button>
            </div>
          </div>

          <button
            onClick={handleAdd}
            disabled={!activeStock}
            className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-full text-[14px] font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed ${
              added
                ? "bg-forest text-white"
                : "bg-brand text-white hover:bg-brand/90"
            }`}
          >
            {added ? (
              <>
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
                Added
              </>
            ) : (
              <>
                <svg
                  viewBox="0 0 24 24"
                  width="16"
                  height="16"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
                  <line x1="3" y1="6" x2="21" y2="6" />
                  <path d="M16 10a4 4 0 01-8 0" />
                </svg>
                Add to cart · {activePrice.currency}{" "}
                {priceAmt != null ? (priceAmt * qty).toLocaleString() : "—"}
              </>
            )}
          </button>

          {product.shipping?.ships_internationally && (
            <p className="text-[11.5px] text-forest font-medium flex items-center gap-1">
              <svg
                viewBox="0 0 24 24"
                width="12"
                height="12"
                fill="currentColor"
              >
                <path d="M13 2.05v2.02c3.95.49 7 3.85 7 7.93 0 3.21-1.81 6-4.72 7.72L13 17v5l5-3-1.22-1.22C19.91 15.87 22 12.57 22 12c0-5.18-3.95-9.45-9-9.95zM11 2.05C5.95 2.55 2 6.82 2 12c0 3.57 2.09 6.87 5.22 8.78L6 22l5-3v-5l-2.28 2.72C7.81 15.6 6 13.21 6 12c0-4.08 3.05-7.44 7-7.93V2.05z" />
              </svg>
              Ships internationally
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
