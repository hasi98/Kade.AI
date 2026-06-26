"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  CalendarDays,
  Check,
  CheckCircle2,
  Gift,
  Loader2,
  LockKeyhole,
  MapPin,
  MessageSquareText,
  Phone,
  RotateCcw,
  UserRound,
  X,
} from "lucide-react";
import type { OrderDraft } from "@/lib/orderState";
import { formatOrderDate, getMissingFields, orderGrandTotal, orderItemsTotal } from "@/lib/orderState";
import styles from "./LiveOrderForm.module.css";

type EditableOrderField = keyof OrderDraft;
type FieldState = "filled" | "active" | "pending";

interface LiveOrderFormProps {
  draft: OrderDraft;
  onFieldEdit: (field: EditableOrderField) => void;
  onPlaceOrder: () => void;
  onCancel: () => void;
}

type FieldDefinition = {
  key: EditableOrderField;
  displayKey: keyof NonNullable<OrderDraft["displayValues"]>;
  label: string;
  placeholder: string;
  icon: ReactNode;
  value: (draft: OrderDraft) => string;
};

const ORDER_FIELDS: FieldDefinition[] = [
  {
    key: "recipientName",
    displayKey: "recipientName",
    label: "Recipient",
    placeholder: "Waiting...",
    icon: <UserRound size={16} />,
    value: (draft) => draft.recipientName ?? "",
  },
  {
    key: "recipientPhone",
    displayKey: "recipientPhone",
    label: "Phone",
    placeholder: "Waiting...",
    icon: <Phone size={16} />,
    value: (draft) => draft.recipientPhone ?? "",
  },
  {
    key: "deliveryAddress",
    displayKey: "streetAddress",
    label: "Street address",
    placeholder: "Waiting...",
    icon: <MapPin size={16} />,
    value: (draft) => draft.displayValues?.streetAddress ?? draft.deliveryAddress ?? "",
  },
  {
    key: "deliveryCity",
    displayKey: "city",
    label: "City",
    placeholder: "Waiting...",
    icon: <MapPin size={16} />,
    value: (draft) => draft.displayValues?.city ?? draft.deliveryCity ?? "",
  },
  {
    key: "deliveryDate",
    displayKey: "deliveryDate",
    label: "Delivery date",
    placeholder: "Waiting...",
    icon: <CalendarDays size={16} />,
    value: (draft) => draft.displayValues?.deliveryDate ?? formatSmartDate(draft.deliveryDate),
  },
  {
    key: "senderName",
    displayKey: "senderName",
    label: "Sender",
    placeholder: "Waiting...",
    icon: <UserRound size={16} />,
    value: (draft) => draft.displayValues?.senderName ?? draft.senderName ?? "",
  },
  {
    key: "giftMessage",
    displayKey: "giftMessage",
    label: "Gift message",
    placeholder: "Optional",
    icon: <MessageSquareText size={16} />,
    value: (draft) => draft.displayValues?.giftMessage ?? (draft.giftMessage === undefined ? "" : draft.giftMessage.trim() || "None"),
  },
];

const STEP_FIELD_GROUPS: EditableOrderField[][] = [
  ["recipientName"],
  ["recipientPhone"],
  ["deliveryAddress"],
  ["deliveryCity"],
  ["deliveryDate"],
  ["senderName"],
  ["giftMessage"],
];

function money(amount: number) {
  return `Rs. ${new Intl.NumberFormat("en-LK", { maximumFractionDigits: 0 }).format(amount)}`;
}

function formatSmartDate(value: string | undefined) {
  if (!value) return "";
  const parsed = new Date(`${value}T00:00:00+05:30`);
  if (Number.isNaN(parsed.getTime())) return value;

  const today = new Date();
  const todayKey = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Colombo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(today);
  const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);
  const tomorrowKey = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Colombo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(tomorrow);
  const dateText = new Intl.DateTimeFormat("en-LK", { day: "numeric", month: "long" }).format(parsed);

  if (value === todayKey) return `Today, ${dateText}`;
  if (value === tomorrowKey) return `Tomorrow, ${dateText}`;
  return formatOrderDate(value);
}

function useTypewriter(text: string, speed = 30, animationKey = text) {
  const [displayed, setDisplayed] = useState("");

  useEffect(() => {
    if (!text) {
      setDisplayed("");
      return;
    }

    setDisplayed("");
    let index = 0;
    const timer = window.setInterval(() => {
      index += 1;
      setDisplayed(text.slice(0, index));
      if (index >= text.length) window.clearInterval(timer);
    }, speed);

    return () => window.clearInterval(timer);
  }, [text, speed, animationKey]);

  return displayed;
}

function fieldIsComplete(draft: OrderDraft, field: EditableOrderField) {
  if (field === "deliveryAddress") return Boolean(draft.deliveryAddress?.trim());
  if (field === "deliveryCity") return Boolean(draft.deliveryCity?.trim());
  if (field === "giftMessage") return draft.giftMessage !== undefined;
  const value = draft[field];
  return typeof value === "string" ? Boolean(value.trim()) : value !== undefined;
}

function activeField(draft: OrderDraft) {
  const editingField = draft.editingField;
  if (editingField && editingField !== "select") {
    const field = editingField as EditableOrderField;
    return field === "deliveryCity" ? "deliveryAddress" : field;
  }
  const missing = getMissingFields(draft)[0] as EditableOrderField | undefined;
  if (missing === "deliveryCity") return "deliveryAddress";
  return missing;
}

function progressForDraft(draft: OrderDraft) {
  return STEP_FIELD_GROUPS.reduce((count, group) => {
    const done = group.every((field) => fieldIsComplete(draft, field));
    return count + (done ? 1 : 0);
  }, 0);
}

export function LiveOrderForm({ draft, onFieldEdit, onPlaceOrder, onCancel }: LiveOrderFormProps) {
  const missing = getMissingFields(draft);
  const currentField = activeField(draft);
  const complete = missing.length === 0;
  const placing = draft.stage === "placing";
  const error = draft.stage === "error";
  const itemsTotal = orderItemsTotal(draft);
  const deliveryFee = draft.deliveryRate ?? 0;
  const grandTotal = draft.grandTotal ?? orderGrandTotal(draft);
  const [animatingField, setAnimatingField] = useState("");
  const [correctingField, setCorrectingField] = useState("");
  const progress = progressForDraft(draft);

  useEffect(() => {
    if (!draft.lastFilledField || !draft.lastFilledAt) return;
    setAnimatingField(draft.lastFilledField);
    const field = ORDER_FIELDS.find((item) => item.displayKey === draft.lastFilledField || item.key === draft.lastFilledField);
    const displayValue = field ? field.value(draft) : "";
    const timer = window.setTimeout(() => setAnimatingField(""), Math.max(700, displayValue.length * 26 + 450));
    return () => window.clearTimeout(timer);
  }, [draft.lastFilledAt, draft.lastFilledField]);

  useEffect(() => {
    if (!draft.lastCorrectedField || !draft.lastCorrectedAt) return;
    setCorrectingField(draft.lastCorrectedField);
    const correctionTimer = window.setTimeout(() => {
      setAnimatingField(draft.lastCorrectedField ?? "");
      setCorrectingField("");
    }, 300);
    const doneTimer = window.setTimeout(() => setAnimatingField(""), 1200);
    return () => {
      window.clearTimeout(correctionTimer);
      window.clearTimeout(doneTimer);
    };
  }, [draft.lastCorrectedAt, draft.lastCorrectedField]);

  const segmentStates = useMemo(
    () =>
      STEP_FIELD_GROUPS.map((group) => {
        if (group.every((field) => fieldIsComplete(draft, field))) return "filled";
        if (group.includes(currentField ?? "items")) return "active";
        return "pending";
      }),
    [currentField, draft]
  );

  return (
    <section className={styles.wrap}>
      <header className={styles.header}>
        <div>
          <p>Kapruka checkout</p>
          <h2>Live order form</h2>
        </div>
        <button type="button" onClick={onCancel} aria-label="Cancel order form">
          <X size={16} />
        </button>
      </header>

      <div className={styles.progress}>
        {segmentStates.map((state, index) => (
          <span key={index} className={styles[state]} />
        ))}
      </div>

      <div className={styles.statusRow}>
        {complete && !placing && !error ? (
          <span className={styles.statusReady}>
            <CheckCircle2 size={14} />
            All set - review below
          </span>
        ) : placing ? (
          <span className={styles.statusPlacing}>
            <Loader2 size={14} className={styles.spin} />
            Creating...
          </span>
        ) : error ? (
          <span className={styles.statusError}>
            <X size={14} />
            Needs attention
          </span>
        ) : (
          <span className={styles.statusCollecting}>
            <i />
            Collecting...
          </span>
        )}
        <strong>{progress}/{STEP_FIELD_GROUPS.length}</strong>
      </div>

      <div className={styles.fields}>
        {ORDER_FIELDS.map((field) => {
          const rawValue = field.value(draft);
          const isFilled = fieldIsComplete(draft, field.key);
          const isActive = !isFilled && currentField === field.key;
          const state: FieldState = isFilled ? "filled" : isActive ? "active" : "pending";
          const isAnimating = animatingField === field.displayKey || animatingField === field.key;
          const isCorrecting = correctingField === field.displayKey || correctingField === field.key;
          return (
            <LiveOrderField
              key={String(field.key)}
              state={state}
              correcting={isCorrecting}
              label={field.label}
              icon={field.icon}
              value={rawValue}
              placeholder={field.placeholder}
              disabled={placing}
              speed={isAnimating ? 18 : 30}
              animationKey={`${field.key}-${draft.lastFilledAt ?? 0}-${draft.lastCorrectedAt ?? 0}`}
              onEdit={() => onFieldEdit(field.key)}
            />
          );
        })}
      </div>

      {(complete || placing || error) && (
        <div className={styles.summary}>
          {draft.items.map((item) => (
            <div className={styles.summaryLine} key={item.productId}>
              <span>{item.productName} x{item.quantity}</span>
              <b>{money(item.price * item.quantity)}</b>
            </div>
          ))}
          <div className={styles.summaryLine}>
            <span>Delivery to {draft.deliveryCity ?? "city"}</span>
            <b>{draft.deliveryRate === undefined ? "Checking" : deliveryFee > 0 ? money(deliveryFee) : "Free"}</b>
          </div>
          <div className={styles.summaryTotal}>
            <span>Total</span>
            <strong>{money(grandTotal)}</strong>
          </div>
        </div>
      )}

      <div className={styles.actions}>
        {error ? (
          <>
            <button type="button" className={styles.primary} onClick={onPlaceOrder}>
              <RotateCcw size={16} />
              Try again
            </button>
            <button type="button" className={styles.danger} onClick={onCancel}>
              Start over
            </button>
          </>
        ) : complete || placing ? (
          <>
            <button
              type="button"
              className={`${styles.primary} ${complete ? styles.primaryReady : ""}`}
              onClick={onPlaceOrder}
              disabled={placing}
            >
              {placing ? <Loader2 size={16} className={styles.spin} /> : <LockKeyhole size={16} />}
              {placing ? "Creating order..." : "Place order"}
            </button>
            {!placing && (
              <button type="button" className={styles.secondary} onClick={() => onFieldEdit("recipientName")}>
                Something's wrong - edit
              </button>
            )}
          </>
        ) : (
          <div className={styles.waitingHint}>
            <Gift size={15} />
            Answer in chat - this form fills itself.
          </div>
        )}
      </div>
    </section>
  );
}

function LiveOrderField({
  state,
  correcting,
  label,
  icon,
  value,
  placeholder,
  disabled,
  speed,
  animationKey,
  onEdit,
}: {
  state: FieldState;
  correcting: boolean;
  label: string;
  icon: ReactNode;
  value: string;
  placeholder: string;
  disabled: boolean;
  speed: number;
  animationKey: string;
  onEdit: () => void;
}) {
  const displayed = useTypewriter(state === "filled" ? value : "", speed, animationKey);
  const typed = displayed.length >= value.length && value.length > 0;

  return (
    <article className={`${styles.field} ${styles[`field_${state}`]} ${correcting ? styles.field_correcting : ""}`}>
      <div className={styles.fieldIcon}>{icon}</div>
      <div className={styles.fieldBody}>
        <div className={styles.fieldTop}>
          <span>{label}</span>
          {state === "active" && <em>asking now</em>}
          {state === "filled" && typed && <Check size={15} className={styles.check} />}
        </div>
        <strong className={styles.fieldValue}>
          {state === "filled" ? (
            displayed.split("").map((char, index) => (
              <span key={`${char}-${index}`} className={styles.fieldChar}>
                {char === " " ? "\u00a0" : char}
              </span>
            ))
          ) : state === "active" ? (
            <span className={styles.activeDots}>
              <i />
              <i />
              <i />
            </span>
          ) : (
            placeholder
          )}
        </strong>
      </div>
      {state === "filled" && (
        <button type="button" onClick={onEdit} disabled={disabled}>
          Edit
        </button>
      )}
    </article>
  );
}
