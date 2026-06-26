"use client";

import { Check, Clipboard, ExternalLink, MailCheck, PhoneCall, Share2, Timer, Truck } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { OrderCreatedMetadata } from "@/lib/orderState";
import styles from "./OrderSuccess.module.css";

function remainingMs(expiresAt: string) {
  return Math.max(0, new Date(expiresAt).getTime() - Date.now());
}

function formatRemaining(ms: number) {
  const totalSeconds = Math.ceil(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

export function OrderSuccess({
  order,
  onTrackOrder,
  onDone,
}: {
  order: OrderCreatedMetadata;
  onTrackOrder: () => void;
  onDone: () => void;
}) {
  const [remaining, setRemaining] = useState(() => remainingMs(order.expiresAt));
  const [copied, setCopied] = useState(false);
  const urgent = remaining <= 5 * 60 * 1000;

  useEffect(() => {
    const interval = window.setInterval(() => setRemaining(remainingMs(order.expiresAt)), 1000);
    return () => window.clearInterval(interval);
  }, [order.expiresAt]);

  const payText = useMemo(() => (remaining > 0 ? `Pay within ${formatRemaining(remaining)}` : "Payment link expired"), [remaining]);

  async function copyRef() {
    await navigator.clipboard.writeText(order.orderRef);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1200);
  }

  async function shareLink() {
    if (navigator.share) {
      await navigator.share({ title: "Kapruka payment link", url: order.checkoutUrl });
      return;
    }
    await navigator.clipboard.writeText(order.checkoutUrl);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1200);
  }

  return (
    <section className={styles.wrap}>
      <div className={styles.hero}>
        <span className={styles.checkCircle}><Check size={34} /></span>
        <h2>Order created!</h2>
        <p>Your payment link is ready</p>
      </div>

      <div className={`${styles.timer} ${urgent ? styles.timerUrgent : ""}`}>
        <Timer size={16} />
        {payText}
      </div>

      <a className={styles.payButton} href={order.checkoutUrl} target="_blank" rel="noreferrer">
        Open payment link <ExternalLink size={18} />
      </a>

      <div className={styles.refRow}>
        <span>Order ref: {order.orderRef}</span>
        <button type="button" onClick={copyRef}>
          <Clipboard size={14} />
          {copied ? "Copied" : "Copy"}
        </button>
      </div>

      <div className={styles.nextCard}>
        <strong>After payment:</strong>
        <p><MailCheck size={15} /> You'll get a confirmation email from Kapruka</p>
        <p><PhoneCall size={15} /> Kapruka will contact the recipient to coordinate</p>
        <p><Truck size={15} /> Track your order using the order number</p>
      </div>

      <div className={styles.note}>
        After paying, Kapruka emails you an order number. That's different from the ref above.
      </div>

      <button type="button" className={styles.secondary} onClick={onTrackOrder}>
        Track my order
      </button>
      <button type="button" className={styles.secondary} onClick={shareLink}>
        <Share2 size={15} />
        Share payment link
      </button>
      <button type="button" className={styles.done} onClick={onDone}>
        Done
      </button>
    </section>
  );
}
