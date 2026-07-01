"use client";

import { ExternalLink, Clock, Package } from "lucide-react";
import type { OrderResult } from "@/types";
import { useCartStore } from "@/store/cart";

export default function CheckoutCard({ order }: { order: OrderResult }) {
  const clearCart = useCartStore((s) => s.clearCart);

  const expiresAt = new Date(order.expires_at).toLocaleTimeString("en-LK", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className="mt-3 bg-surface rounded-2xl shadow-card border border-line/70 overflow-hidden max-w-sm animate-rise">
      {/* Green confirmation header */}
      <div className="p-5" style={{ background: "linear-gradient(135deg,#2F7D5B,#1F5C42)" }}>
        <div className="flex items-center gap-2 text-white">
          <span className="w-7 h-7 rounded-full bg-white/20 grid place-items-center">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12.5l4.5 4.5L19 7" />
            </svg>
          </span>
          <span className="font-semibold text-[15px]">Order created!</span>
        </div>
        <div className="text-white/80 text-[13px] mt-1.5">
          Ref <b className="text-white font-mono">{order.order_ref}</b> · placed just now
        </div>
      </div>

      {/* Details */}
      <div className="p-5">
        <div className="flex items-center gap-2 text-[13px] text-inksoft mb-1.5">
          <Package className="w-3.5 h-3.5 shrink-0" />
          <span>Order ref: <span className="text-ink font-mono">{order.order_ref}</span></span>
        </div>
        <div className="flex items-center gap-2 text-[13px] text-inksoft mb-4">
          <Clock className="w-3.5 h-3.5 shrink-0" />
          <span>Pay link expires at <span className="text-ink font-medium">{expiresAt}</span></span>
        </div>

        {/* Summary */}
        <div className="bg-surf2 rounded-xl p-3 mb-4 space-y-1 border border-line">
          <div className="flex justify-between text-[13px] text-inksoft">
            <span>Items</span>
            <span>{order.summary.currency} {order.summary.items_total.toLocaleString()}</span>
          </div>
          {order.summary.delivery_fee > 0 && (
            <div className="flex justify-between text-[13px] text-inksoft">
              <span>Delivery</span>
              <span>{order.summary.currency} {order.summary.delivery_fee.toLocaleString()}</span>
            </div>
          )}
          <div className="flex justify-between text-[15px] font-bold text-ink border-t border-line pt-1.5 mt-1">
            <span>Total</span>
            <span>{order.summary.currency} {order.summary.grand_total.toLocaleString()}</span>
          </div>
        </div>

        <a
          href={order.checkout_url}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => clearCart()}
          className="flex items-center justify-center gap-2 w-full h-11 rounded-xl bg-brand hover:bg-branddeep text-white font-semibold text-[14.5px] transition-colors shadow-[0_8px_22px_-12px_rgba(174,53,44,.8)]"
        >
          Pay now · {order.summary.currency} {order.summary.grand_total.toLocaleString()}
          <ExternalLink className="w-4 h-4" />
        </a>
        <div className="text-center text-[11.5px] text-forest mt-2 font-medium">
          🔒 Secure Kapruka checkout · No account needed
        </div>
      </div>
    </div>
  );
}
