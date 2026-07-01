"use client";

import { MapPin } from "lucide-react";

interface ProgressStep {
  step: string;
  timestamp: string;
}

interface TrackingData {
  order_number: string;
  status: string;
  status_display: string;
  order_date: string;
  delivery_date: string;
  amount: string;
  recipient: { name: string; address: string; city: string };
  progress: ProgressStep[];
  has_delivery_photo: boolean;
  has_delivery_video: boolean;
}

const STATUS_COLORS: Record<string, { bg: string; text: string; dot: string }> = {
  delivered: { bg: "bg-forestsoft", text: "text-forest", dot: "bg-forest" },
  shipped:   { bg: "bg-goldsoft",   text: "text-gold",   dot: "bg-gold" },
  confirmed: { bg: "bg-brandsoft",  text: "text-brand",  dot: "bg-brand" },
  received:  { bg: "bg-surf2",      text: "text-inksoft",dot: "bg-inksoft" },
};

const STATUS_LABELS: Record<string, string> = {
  delivered: "Delivered ✓",
  shipped:   "Out for delivery",
  confirmed: "Confirmed",
  received:  "Received",
};

export default function OrderStatus({ data }: { data: TrackingData }) {
  const colors = STATUS_COLORS[data.status] ?? STATUS_COLORS.received;

  return (
    <div className="mt-3 bg-surface rounded-2xl shadow-card border border-line/70 p-4 max-w-sm animate-rise">
      {/* Status badge + order number */}
      <div className="flex items-start justify-between gap-2 mb-3">
        <div>
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[12px] font-semibold ${colors.bg} ${colors.text}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${colors.dot}`} />
            {STATUS_LABELS[data.status] ?? data.status_display}
          </span>
          <p className="text-[12px] text-inksoft font-mono mt-1">{data.order_number}</p>
        </div>
        <div className="text-right">
          <div className="text-[12px] text-inksoft">Amount</div>
          <div className="text-[15px] font-bold text-ink">LKR {data.amount}</div>
        </div>
      </div>

      {/* Delivery details */}
      <div className="bg-surf2 rounded-xl px-3 py-2.5 border border-line mb-3 space-y-1">
        <div className="flex items-center gap-1.5 text-[13px] text-ink">
          <MapPin className="w-3.5 h-3.5 text-inksoft shrink-0" />
          <span className="truncate">{data.recipient.city}</span>
        </div>
        <div className="flex justify-between text-[12.5px]">
          <span className="text-inksoft">Delivery date</span>
          <span className="text-ink font-medium">{data.delivery_date}</span>
        </div>
      </div>

      {/* Progress timeline */}
      {data.progress && data.progress.length > 0 && (
        <div className="space-y-2.5 border-t border-line pt-3">
          {data.progress.slice(-3).map((step, i) => (
            <div key={i} className="flex items-start gap-2.5 text-[12.5px]">
              <span className="w-1.5 h-1.5 rounded-full bg-brand mt-1.5 shrink-0" />
              <div>
                <p className="text-ink font-medium">{step.step}</p>
                <p className="text-inksoft">{step.timestamp}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
