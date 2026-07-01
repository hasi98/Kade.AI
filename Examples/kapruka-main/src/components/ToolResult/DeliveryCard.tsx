"use client";

import { AlertTriangle } from "lucide-react";
import type { DeliveryInfo } from "@/types";

export default function DeliveryCard({ delivery }: { delivery: DeliveryInfo }) {
  const dateStr = new Date(delivery.checked_date + "T00:00:00").toLocaleDateString(
    "en-LK",
    { weekday: "long", day: "numeric", month: "long" }
  );

  return (
    <div className="mt-3 bg-surface rounded-2xl shadow-card border border-line/70 p-4 max-w-sm animate-rise">
      {/* City + status row */}
      <div className="flex items-center gap-2 text-ink font-semibold text-[14px] mb-3">
        <span className={delivery.available ? "text-forest" : "text-brand"}>
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 6h11v9H3zM14 9h4l3 3v3h-7z" />
            <circle cx="7" cy="18" r="1.6" /><circle cx="17.5" cy="18" r="1.6" />
          </svg>
        </span>
        Delivery to {delivery.city}
        <span
          className={`ml-auto text-[11px] font-semibold px-2 py-0.5 rounded-full ${
            delivery.available
              ? "bg-forestsoft text-forest"
              : "bg-brandsoft text-brand"
          }`}
        >
          {delivery.available ? "Available" : "Unavailable"}
        </span>
      </div>

      {/* Address row */}
      <div className="flex items-start gap-2 bg-surf2 rounded-xl px-3 py-2.5 border border-line mb-3">
        <span className="text-inksoft mt-0.5">
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="M12 21s7-5.6 7-11a7 7 0 1 0-14 0c0 5.4 7 11 7 11Z" /><circle cx="12" cy="10" r="2.4" />
          </svg>
        </span>
        <div className="text-[13px] text-ink leading-tight">
          {delivery.city}
          <span className="block text-inksoft">{dateStr}</span>
        </div>
      </div>

      {/* Delivery fee */}
      {delivery.available && (
        <div className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-forestsoft border border-forest/20">
          <span className="text-[13px] text-ink">Delivery fee</span>
          <span className="text-[15px] font-bold text-forest">
            {delivery.currency} {delivery.rate.toLocaleString()}
          </span>
        </div>
      )}

      {/* Unavailability reason */}
      {!delivery.available && delivery.reason && (
        <p className="text-[13px] text-inksoft">{delivery.reason}</p>
      )}
      {!delivery.available && delivery.next_available_date && (
        <p className="text-[12.5px] text-forest font-medium mt-1">
          Next available: {new Date(delivery.next_available_date + "T00:00:00").toLocaleDateString("en-LK", { weekday: "short", day: "numeric", month: "short" })}
        </p>
      )}

      {/* Perishable warning */}
      {delivery.perishable_warning && (
        <div className="mt-2.5 flex items-start gap-1.5 text-[12.5px] text-gold">
          <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
          <span>{delivery.perishable_warning}</span>
        </div>
      )}
    </div>
  );
}
