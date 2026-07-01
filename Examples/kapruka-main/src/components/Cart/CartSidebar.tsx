"use client";

import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { useCartStore, cartTotal } from "@/store/cart";
import { AGENT } from "@/lib/persona";
import { TreeMark } from "@/components/shared/KapuAvatar";
import { IcingInput, isCake } from "./IcingInput";
import { GiftMessageCard } from "./GiftMessageCard";
import { getRawImageUrl } from "@/lib/product";

export default function CartSidebar() {
  const {
    items,
    isOpen,
    closeCart,
    removeItem,
    updateQuantity,
    gift_message,
    setGiftMessage,
  } = useCartStore();
  const sub = cartTotal(items);
  const delivery_fee = useCartStore((s) => s.delivery_fee);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            data-testid="cart-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={closeCart}
            className="fixed inset-0 bg-ink/40 backdrop-blur-[2px] z-30"
          />

          {/* Drawer */}
          <motion.aside
            key="drawer"
            data-testid="cart-sidebar"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 320, damping: 32 }}
            className="fixed top-0 right-0 h-full w-full max-w-100 bg-canvas z-40 shadow-2xl flex flex-col"
          >
            {/* Header */}
            <div className="h-15 shrink-0 px-5 flex items-center justify-between border-b border-line">
              <div className="font-semibold text-ink text-[16px] flex items-center gap-2">
                <svg
                  viewBox="0 0 24 24"
                  width="20"
                  height="20"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.9"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-brand"
                >
                  <path d="M3 4h2l2.2 11.2a1.5 1.5 0 0 0 1.5 1.2h8.4a1.5 1.5 0 0 0 1.5-1.2L21 7H6" />
                  <circle
                    cx="9.5"
                    cy="20"
                    r="1.4"
                    fill="currentColor"
                    stroke="none"
                  />
                  <circle
                    cx="18"
                    cy="20"
                    r="1.4"
                    fill="currentColor"
                    stroke="none"
                  />
                </svg>
                Your cart
                <span className="text-inksoft font-normal">
                  · {items.length}
                </span>
              </div>
              <button
                data-testid="cart-close"
                onClick={closeCart}
                className="w-8 h-8 rounded-full hover:bg-line/60 grid place-items-center text-inksoft transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Items */}
            <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-3">
              {items.length === 0 ? (
                <div className="flex-1 grid place-items-center text-center text-inksoft py-16">
                  <div>
                    <div className="mx-auto mb-3 w-14 h-14 rounded-full bg-brandsoft text-brand grid place-items-center">
                      <svg
                        viewBox="0 0 24 24"
                        width="26"
                        height="26"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.9"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M3 4h2l2.2 11.2a1.5 1.5 0 0 0 1.5 1.2h8.4a1.5 1.5 0 0 0 1.5-1.2L21 7H6" />
                        <circle
                          cx="9.5"
                          cy="20"
                          r="1.4"
                          fill="currentColor"
                          stroke="none"
                        />
                        <circle
                          cx="18"
                          cy="20"
                          r="1.4"
                          fill="currentColor"
                          stroke="none"
                        />
                      </svg>
                    </div>
                    <p className="text-[14px]">Your cart is empty.</p>
                    <p className="text-[13px] mt-1">
                      Ask {AGENT.name} to find anything on Kapruka!
                    </p>
                  </div>
                </div>
              ) : (
                items.map((item) => (
                  <motion.div
                    key={item.id}
                    layout
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className="bg-surface rounded-2xl border border-line/70 shadow-card p-2.5"
                  >
                    <div className="flex gap-3">
                      {item.image_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={item.image_url.replace(/width=\d+/, "width=80")}
                          alt={item.name}
                          referrerPolicy="no-referrer"
                          onError={(e) => {
                            const img = e.currentTarget;
                            const raw = getRawImageUrl(img.src);
                            if (raw !== img.src) {
                              img.onerror = null;
                              img.src = raw;
                            }
                          }}
                          className="w-16 h-16 rounded-xl object-cover bg-surf2 shrink-0"
                        />
                      ) : (
                        <div className="w-16 h-16 rounded-xl bg-surf2 flex items-center justify-center shrink-0 text-2xl">
                          🛍️
                        </div>
                      )}

                      <div className="flex-1 min-w-0">
                        <div className="text-[13.5px] font-semibold text-ink leading-snug line-clamp-2">
                          {item.name}
                        </div>
                        <div className="text-[13px] font-bold text-ink mt-0.5">
                          {item.currency} {item.price?.toLocaleString()}
                        </div>
                      </div>

                      <div className="flex flex-col items-end justify-between shrink-0">
                        <button
                          onClick={() => removeItem(item.id)}
                          className="text-[12px] text-inksoft hover:text-brand transition-colors"
                        >
                          Remove
                        </button>
                        <div className="flex items-center gap-1 bg-surf2 rounded-full p-0.5 border border-line">
                          <button
                            onClick={() =>
                              updateQuantity(item.id, item.quantity - 1)
                            }
                            className="w-6 h-6 grid place-items-center rounded-full hover:bg-surface text-ink transition-colors"
                          >
                            <svg
                              viewBox="0 0 20 20"
                              width="13"
                              height="13"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2.2"
                              strokeLinecap="round"
                            >
                              <path d="M4 10h12" />
                            </svg>
                          </button>
                          <span className="w-5 text-center text-[13px] font-bold">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() =>
                              updateQuantity(item.id, item.quantity + 1)
                            }
                            className="w-6 h-6 grid place-items-center rounded-full hover:bg-surface text-ink transition-colors"
                          >
                            <svg
                              viewBox="0 0 20 20"
                              width="13"
                              height="13"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2.2"
                              strokeLinecap="round"
                            >
                              <path d="M10 4v12M4 10h12" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>

                    {isCake(item) && <IcingInput item={item} />}
                  </motion.div>
                ))
              )}

              {/* Gift message card — parchment style */}
              {items.length > 0 && (
                <GiftMessageCard
                  value={gift_message}
                  onChange={setGiftMessage}
                />
              )}
            </div>

            {/* Footer */}
            {items.length > 0 && (
              <div className="shrink-0 border-t border-line p-5 bg-surface">
                <div className="flex justify-between text-[13.5px] text-inksoft mb-1">
                  <span>Subtotal</span>
                  <span className="text-ink font-medium">
                    LKR {sub.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between text-[13.5px] text-inksoft mb-2.5">
                  <span>Delivery</span>
                  {delivery_fee !== null ? (
                    <span className="text-ink font-medium">
                      LKR {delivery_fee.toLocaleString()}
                    </span>
                  ) : (
                    <span className="text-inksoft italic">Calculated at checkout</span>
                  )}
                </div>
                <div className="flex justify-between text-[16px] font-bold text-ink border-t border-line pt-2.5">
                  <span>Total</span>
                  <span>LKR {(sub + (delivery_fee ?? 0)).toLocaleString()}</span>
                </div>
                <p className="text-[12.5px] text-inksoft mt-3 text-center leading-snug">
                  Tell {AGENT.name} you&apos;re ready to checkout and{" "}
                  {AGENT.pronoun}&apos;ll collect your delivery details.
                </p>
                <div className="text-center text-[11.5px] text-forest mt-2 font-medium flex items-center justify-center gap-1">
                  <TreeMark size={13} className="text-forest" />
                  Secure checkout · No account needed
                </div>
              </div>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
