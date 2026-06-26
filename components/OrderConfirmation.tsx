"use client";

import type { ReactNode } from "react";
import { CalendarDays, CheckCircle2, Loader2, MapPin, MessageSquareQuote, PenLine, Truck, UserRound } from "lucide-react";
import type { OrderDraft } from "@/lib/orderState";
import { formatOrderDate, orderGrandTotal, orderItemsTotal } from "@/lib/orderState";
import styles from "./OrderConfirmation.module.css";

function money(amount: number) {
  return `Rs. ${new Intl.NumberFormat("en-LK", { maximumFractionDigits: 0 }).format(amount)}`;
}

export function OrderConfirmation({
  draft,
  placing,
  onPlaceOrder,
  onEditDetails,
}: {
  draft: OrderDraft;
  placing: boolean;
  onPlaceOrder: () => void;
  onEditDetails: () => void;
}) {
  const itemsTotal = orderItemsTotal(draft);
  const deliveryFee = draft.deliveryRate;
  const hasDeliveryFee = deliveryFee !== undefined;
  const grandTotal = draft.grandTotal ?? orderGrandTotal(draft);

  return (
    <section className={styles.wrap}>
      <header className={styles.header}>
        <span><CheckCircle2 size={20} /></span>
        <div>
          <h2>Ready to order</h2>
          <p>Review your details below</p>
        </div>
      </header>

      <div className={styles.card}>
        {draft.items.map((item) => (
          <div className={styles.item} key={item.productId}>
            {item.productImage ? <img src={item.productImage} alt="" /> : <span className={styles.itemFallback} />}
            <div>
              <strong>{item.productName}</strong>
              <small>Qty {item.quantity}</small>
              {item.icingText && <em>Icing: {item.icingText}</em>}
            </div>
            <b>{money(item.price * item.quantity)}</b>
          </div>
        ))}
      </div>

      <div className={styles.section}>
        <InfoRow icon={<UserRound size={16} />} label="Recipient" value={`${draft.recipientName ?? ""} (${draft.recipientPhone ?? ""})`} />
        <InfoRow
          icon={<MapPin size={16} />}
          label="Address"
          value={`${draft.deliveryAddress ?? ""}, ${draft.deliveryCity ?? ""} - ${draft.locationType ?? "house"}`}
        />
        <InfoRow icon={<CalendarDays size={16} />} label="Date" value={formatOrderDate(draft.deliveryDate)} />
        <InfoRow
          icon={<Truck size={16} />}
          label="Delivery fee"
          value={hasDeliveryFee ? (deliveryFee > 0 ? money(deliveryFee) : "Free delivery") : "Checked before order"}
        />
      </div>

      {(draft.giftMessage || draft.senderName || draft.anonymous) && (
        <div className={styles.section}>
          {draft.giftMessage && (
            <InfoRow icon={<MessageSquareQuote size={16} />} label="Message" value={`"${draft.giftMessage}"`} />
          )}
          <InfoRow icon={<PenLine size={16} />} label="Sender" value={draft.anonymous ? "From: Anonymous" : `From: ${draft.senderName ?? ""}`} />
        </div>
      )}

      <div className={styles.total}>
        <span>Items subtotal <b>{money(itemsTotal)}</b></span>
        <span>Delivery fee <b>{hasDeliveryFee ? (deliveryFee > 0 ? money(deliveryFee) : "Free") : "Checking at order"}</b></span>
        <strong>Grand total <em>{money(grandTotal)}</em></strong>
      </div>

      <div className={styles.actions}>
        <button type="button" className={styles.primary} onClick={onPlaceOrder} disabled={placing}>
          {placing ? <Loader2 size={16} className={styles.spin} /> : <CheckCircle2 size={16} />}
          {placing ? "Creating your order..." : "Place order"}
        </button>
        <button type="button" className={styles.secondary} onClick={onEditDetails} disabled={placing}>
          Edit details
        </button>
      </div>
    </section>
  );
}

function InfoRow({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className={styles.infoRow}>
      <span>{icon}</span>
      <div>
        <small>{label}</small>
        <strong>{value || "Not set"}</strong>
      </div>
    </div>
  );
}
