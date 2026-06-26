import type { DeliveryResult } from "@/lib/types";

type UnknownRecord = Record<string, unknown>;

function asRecord(value: unknown): UnknownRecord {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as UnknownRecord) : {};
}

function stringValue(record: UnknownRecord, key: string) {
  const value = record[key];
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function booleanValue(record: UnknownRecord, key: string) {
  const value = record[key];
  return typeof value === "boolean" ? value : false;
}

function numberValue(record: UnknownRecord, key: string) {
  const value = record[key];
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value.replace(/,/g, ""));
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function sriLankaDate(offsetDays = 0) {
  const date = new Date(Date.now() + offsetDays * 24 * 60 * 60 * 1000);
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Colombo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);

  const get = (type: string) => parts.find((part) => part.type === type)?.value;
  return `${get("year")}-${get("month")}-${get("day")}`;
}

function dateFromIso(value: string) {
  return new Date(`${value}T00:00:00+05:30`);
}

export function normalizeDeliveryResult(input: unknown, fallbackCity = "Colombo 07"): DeliveryResult {
  const root = asRecord(input);
  const nested = asRecord(root.delivery);
  const record = Object.keys(nested).length ? nested : root;

  const checkedDate =
    stringValue(record, "checkedDate") ??
    stringValue(record, "checked_date") ??
    stringValue(record, "delivery_date") ??
    sriLankaDate(0);

  return {
    city: stringValue(record, "city") ?? fallbackCity,
    available: booleanValue(record, "available"),
    checkedDate,
    nextAvailableDate:
      stringValue(record, "nextAvailableDate") ??
      stringValue(record, "next_available_date") ??
      null,
    rate: numberValue(record, "rate") ?? numberValue(record, "rate_lkr") ?? numberValue(record, "delivery_fee") ?? 0,
    currency: stringValue(record, "currency") ?? "LKR",
    reason: stringValue(record, "reason") ?? stringValue(record, "message"),
    perishableWarning:
      stringValue(record, "perishableWarning") ??
      stringValue(record, "perishable_warning") ??
      null,
  };
}

export function isDeliveryResult(value: unknown): value is DeliveryResult {
  const record = asRecord(value);
  return (
    typeof record.city === "string" &&
    typeof record.available === "boolean" &&
    typeof record.checkedDate === "string" &&
    typeof record.rate === "number" &&
    typeof record.currency === "string" &&
    "nextAvailableDate" in record
  );
}

export function deliveryDisplayDate(delivery: DeliveryResult) {
  return delivery.available ? delivery.checkedDate : delivery.nextAvailableDate ?? delivery.checkedDate;
}

export function isToday(date: string) {
  return date === sriLankaDate(0);
}

export function isTomorrow(date: string) {
  return date === sriLankaDate(1);
}

export function formatDeliveryRate(rate: number, currency = "LKR") {
  if (rate <= 0) return "Free delivery";
  const prefix = currency.toUpperCase() === "LKR" ? "Rs." : currency.toUpperCase();
  return `${prefix} ${new Intl.NumberFormat("en-LK", { maximumFractionDigits: 0 }).format(rate)}`;
}

export function formatDeliveryDate(date: string, variant: "short" | "long" = "long") {
  if (!date) return "soon";
  const parsed = dateFromIso(date);
  if (Number.isNaN(parsed.getTime())) return date;

  return new Intl.DateTimeFormat("en-LK", {
    day: "numeric",
    month: variant === "short" ? "short" : "long",
  }).format(parsed);
}

export function formatDeliveryDateWithRelative(date: string) {
  const formatted = formatDeliveryDate(date, "long");
  if (isToday(date)) return `Today, ${formatted}`;
  if (isTomorrow(date)) return `Tomorrow, ${formatted}`;
  return formatted;
}

export function formatDeliveryResponse(input: DeliveryResult | unknown) {
  const delivery = isDeliveryResult(input) ? input : normalizeDeliveryResult(input);
  const deliveryDate = deliveryDisplayDate(delivery);
  const rate = formatDeliveryRate(delivery.rate, delivery.currency);
  const city = delivery.city;

  let message: string;
  if (delivery.available && isToday(deliveryDate)) {
    message = `Great news! Delivery to ${city} is available today for ${rate}. Shall I set that up? I can get it there by tonight!`;
  } else if (isTomorrow(deliveryDate)) {
    message = delivery.available
      ? `Tomorrow delivery to ${city} is open ne. Delivery will be ${rate}. Want me to schedule it for tomorrow?`
      : `Aiyo, today's slots for ${city} are full ne. But tomorrow (${formatDeliveryDate(deliveryDate)}) is open! Delivery will be ${rate} to ${city}. Want me to schedule it for tomorrow?`;
  } else if (delivery.nextAvailableDate || delivery.available) {
    message = `Good news - Kapruka can deliver to ${city} on ${formatDeliveryDate(deliveryDate)}. Delivery will be ${rate}. Shall I keep this date for the order?`;
  } else {
    message = `Aiyo, delivery to ${city} is not available for that date. ${delivery.reason ?? "Let me check another date for you."}`;
  }

  if (delivery.perishableWarning) {
    message += " One thing - this is a perishable item so it needs to be delivered on the day. Just so you know!";
  }

  return message;
}
