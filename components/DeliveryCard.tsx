"use client";

import { AlertTriangle, CalendarDays, Info, Tag, Truck } from "lucide-react";
import type { DeliveryResult } from "@/lib/types";
import {
  deliveryDisplayDate,
  formatDeliveryDate,
  formatDeliveryDateWithRelative,
  formatDeliveryRate,
  isToday,
  isTomorrow,
} from "@/lib/delivery";
import styles from "./DeliveryCard.module.css";

export interface DeliveryCardProps extends DeliveryResult {
  onConfirm?: () => void;
  onCheckAnother?: () => void;
  onCheckNext?: () => void;
}

function statusFor(delivery: DeliveryResult) {
  const date = deliveryDisplayDate(delivery);
  if (delivery.available && isToday(date)) {
    return { label: "TODAY", className: styles.badgeToday };
  }
  if (delivery.nextAvailableDate || delivery.available) {
    if (isTomorrow(date)) return { label: "TOMORROW", className: styles.badgeTomorrow };
    return { label: formatDeliveryDate(date, "short"), className: styles.badgeFuture };
  }
  return { label: "UNAVAILABLE", className: styles.badgeUnavailable };
}

export function DeliveryCard({
  city,
  available,
  checkedDate,
  nextAvailableDate,
  rate,
  currency,
  reason,
  perishableWarning,
  onConfirm,
  onCheckAnother,
  onCheckNext,
}: DeliveryCardProps) {
  const delivery: DeliveryResult = {
    city,
    available,
    checkedDate,
    nextAvailableDate,
    rate,
    currency,
    reason,
    perishableWarning,
  };
  const deliveryDate = deliveryDisplayDate(delivery);
  const status = statusFor(delivery);
  const hasAvailableDate = available || Boolean(nextAvailableDate);

  return (
    <section className={styles.card}>
      <div className={styles.header}>
        <div className={styles.title}>
          <Truck size={18} />
          <strong>Delivery to {city}</strong>
        </div>
        <span className={`${styles.badge} ${status.className}`}>{status.label}</span>
      </div>

      <div className={styles.divider} />

      <div className={styles.rows}>
        <div className={styles.row}>
          <CalendarDays size={17} />
          <div>
            <span>Delivery date</span>
            <strong className={!available && nextAvailableDate ? styles.warningValue : undefined}>
              {formatDeliveryDateWithRelative(deliveryDate)}
            </strong>
          </div>
        </div>

        <div className={styles.row}>
          <Tag size={17} />
          <div>
            <span>Delivery cost</span>
            <strong className={rate <= 0 ? styles.freeValue : styles.priceValue}>
              {formatDeliveryRate(rate, currency)}
            </strong>
          </div>
        </div>
      </div>

      {perishableWarning && (
        <div className={styles.warning}>
          <AlertTriangle size={16} />
          <p>Perishable item - must be delivered on the scheduled date. Cannot be rescheduled.</p>
        </div>
      )}

      {!available && reason && (
        <div className={styles.reason}>
          <Info size={15} />
          <p>{reason}</p>
        </div>
      )}

      <div className={styles.actions}>
        {hasAvailableDate ? (
          <>
            <button type="button" className={styles.primaryAction} onClick={onConfirm}>
              Confirm this delivery
            </button>
            <button type="button" className={styles.secondaryAction} onClick={onCheckAnother}>
              Check another date
            </button>
          </>
        ) : (
          <button type="button" className={styles.secondaryAction} onClick={onCheckNext}>
            Check next available date
          </button>
        )}
      </div>
    </section>
  );
}
