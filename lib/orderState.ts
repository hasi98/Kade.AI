export type LocationType = "house" | "apartment" | "office" | "other";
export type OrderStage = "idle" | "collecting" | "confirming" | "placing" | "complete" | "error";

export interface OrderDraftItem {
  productId: string;
  productName: string;
  productImage: string | null;
  price: number;
  quantity: number;
  icingText?: string;
}

export interface OrderDraft {
  items: OrderDraftItem[];
  recipientName?: string;
  recipientPhone?: string;
  deliveryAddress?: string;
  deliveryCity?: string;
  deliveryDate?: string;
  locationType?: LocationType;
  deliveryInstructions?: string;
  deliveryRate?: number;
  senderName?: string;
  anonymous?: boolean;
  giftMessage?: string;
  stage: OrderStage;
  checkoutUrl?: string;
  orderRef?: string;
  itemsTotal?: number;
  grandTotal?: number;
  expiresAt?: string;
  errorMessage?: string;
  editingField?: string;
  displayValues?: {
    recipientName?: string;
    recipientPhone?: string;
    streetAddress?: string;
    city?: string;
    deliveryDate?: string;
    senderName?: string;
    anonymous?: string;
    giftMessage?: string;
  };
  lastFilledField?: string;
  lastFilledAt?: number;
  lastCorrectedField?: string;
  lastCorrectedAt?: number;
}

export interface OrderSummary {
  itemsTotal: number;
  deliveryFee: number;
  grandTotal: number;
  currency: string;
}

export interface OrderCreatedMetadata {
  type: "order_created";
  checkoutUrl: string;
  orderRef: string;
  summary: OrderSummary;
  expiresAt: string;
}

const ORDER_DRAFT_STORAGE_KEY = "kade_order_draft";

type UnknownRecord = Record<string, unknown>;

function asRecord(value: unknown): UnknownRecord {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as UnknownRecord) : {};
}

function stringValue(record: UnknownRecord, keys: string[]) {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return null;
}

function numberValue(record: UnknownRecord, keys: string[]) {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "number" && Number.isFinite(value)) return value;
    if (typeof value === "string" && value.trim()) {
      const parsed = Number(value.replace(/,/g, ""));
      if (Number.isFinite(parsed)) return parsed;
    }
  }
  return null;
}

function fallbackExpiry() {
  return new Date(Date.now() + 60 * 60 * 1000).toISOString();
}

export function saveOrderDraft(draft: OrderDraft): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(ORDER_DRAFT_STORAGE_KEY, JSON.stringify(draft));
}

export function loadOrderDraft(): OrderDraft | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(ORDER_DRAFT_STORAGE_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as OrderDraft;
    return parsed && Array.isArray(parsed.items) && parsed.stage ? parsed : null;
  } catch {
    return null;
  }
}

export function clearOrderDraft(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(ORDER_DRAFT_STORAGE_KEY);
}

export function hasCakeItem(draft: OrderDraft) {
  return draft.items.some((item) => /^cake/i.test(item.productId) || /cake/i.test(item.productName));
}

export function getMissingFields(draft: OrderDraft): string[] {
  const missing: string[] = [];
  if (!draft.items.length) missing.push("items");
  if (!draft.recipientName?.trim()) missing.push("recipientName");
  if (!draft.recipientPhone?.trim()) missing.push("recipientPhone");
  if (!draft.deliveryAddress?.trim()) missing.push("deliveryAddress");
  if (!draft.deliveryCity?.trim()) missing.push("deliveryCity");
  if (!draft.deliveryDate?.trim()) missing.push("deliveryDate");
  if (draft.giftMessage === undefined) missing.push("giftMessage");
  return missing;
}

export function formatOrderDate(date: string | undefined) {
  if (!date) return "Not set";
  const parsed = new Date(`${date}T00:00:00+05:30`);
  if (Number.isNaN(parsed.getTime())) return date;
  return new Intl.DateTimeFormat("en-LK", { day: "numeric", month: "long", year: "numeric" }).format(parsed);
}

export function orderItemsTotal(draft: OrderDraft) {
  return draft.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
}

export function orderGrandTotal(draft: OrderDraft) {
  return orderItemsTotal(draft) + (draft.deliveryRate ?? 0);
}

export function normalizeOrderResult(input: unknown): OrderCreatedMetadata {
  const root = asRecord(input);
  const nested = asRecord(root.order);
  const record = Object.keys(nested).length ? nested : root;
  const summaryRecord = asRecord(record.summary);

  const checkoutUrl =
    stringValue(record, ["checkoutUrl", "checkout_url", "pay_url", "payment_url", "url"]) ??
    "";
  const orderRef =
    stringValue(record, ["orderRef", "order_ref", "reference", "ref", "pre_payment_reference"]) ??
    "pending-ref";
  const deliveryFee = numberValue(summaryRecord, ["deliveryFee", "delivery_fee"]) ?? numberValue(record, ["deliveryFee", "delivery_fee"]) ?? 0;
  const itemsTotal = numberValue(summaryRecord, ["itemsTotal", "items_total"]) ?? numberValue(record, ["itemsTotal", "items_total"]) ?? 0;
  const grandTotal =
    numberValue(summaryRecord, ["grandTotal", "grand_total", "total"]) ??
    numberValue(record, ["grandTotal", "grand_total", "total"]) ??
    itemsTotal + deliveryFee;

  return {
    type: "order_created",
    checkoutUrl,
    orderRef,
    summary: {
      itemsTotal,
      deliveryFee,
      grandTotal,
      currency: stringValue(summaryRecord, ["currency"]) ?? stringValue(record, ["currency"]) ?? "LKR",
    },
    expiresAt: stringValue(record, ["expiresAt", "expires_at"]) ?? fallbackExpiry(),
  };
}

export function friendlyOrderError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  if (/empty.?cart/i.test(message)) return "Aiyo, the cart is empty ne - add something first!";
  if (/past|date.*passed|invalid.*date/i.test(message)) return "Machan that date has passed - want me to check tomorrow's availability?";
  if (/date_not_deliverable|date.*not.*deliverable|slots.*full|not available.*date/i.test(message)) return "Aiyo, that delivery date is not available. I checked the next available date - try placing the order again.";
  if (/out.?of.?stock|stock/i.test(message)) return "Aiyo, that item just went out of stock! Let me find you something similar.";
  if (/city|deliverable|delivery.*area/i.test(message)) return "Hmm, Kapruka doesn't deliver to that city yet ne. Want to try a nearby city?";
  if (/missing|required/i.test(message)) return `Oops, I'm missing some details - ${message}. Can you help me with that?`;
  return "Aiyo, something went wrong creating the order - want to try again?";
}
