"use client";

import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Bot,
  Gift,
  History,
  Image as ImageIcon,
  Bookmark,
  Camera,
  Loader2,
  LockKeyhole,
  MapPin,
  Menu,
  MessageCircle,
  Mic,
  Minus,
  MoreVertical,
  Moon,
  Pencil,
  Pin,
  Sun,
  Package,
  Plus,
  Search,
  Send,
  Settings,
  ShoppingBag,
  ShoppingCart,
  Sparkles,
  Tag,
  Trash2,
  Truck,
  User,
  Volume2,
  Check,
  ExternalLink,
  X,
  ZoomIn,
} from "lucide-react";
import clsx from "clsx";
import { GoogleGenAI, Modality, type FunctionCall } from "@google/genai";
import { CityInputPopup } from "@/components/CityInputPopup";
import { DeliveryCard } from "@/components/DeliveryCard";
import { LiveOrderForm } from "@/components/LiveOrderForm";
import { OrderSuccess } from "@/components/OrderSuccess";
import { ProductModal, prefetchProductDetail } from "@/components/ProductModal";
import { deliveryDisplayDate, formatDeliveryDate, formatDeliveryResponse, isDeliveryResult, normalizeDeliveryResult } from "@/lib/delivery";
import { resizeImage, validateImageFile, type PreparedImage } from "@/lib/imageUtils";
import { VoiceBridge, resolveProductReference, toShownVoiceProducts } from "@/lib/voiceBridge";
import { VoiceSessionProvider, useVoiceSession, type ShownVoiceProduct } from "@/lib/voiceSessionContext";
import {
  clearOrderDraft,
  formatOrderDate,
  getMissingFields,
  loadOrderDraft,
  orderItemsTotal,
  orderGrandTotal,
  saveOrderDraft,
  type LocationType,
  type OrderCreatedMetadata,
  type OrderDraft,
} from "@/lib/orderState";
import type { CartItem, ChatMessage, DeliveryResult, Product, SelectedProduct } from "@/lib/types";
import styles from "./page.module.css";

/* ── Helpers ── */

const prompts = [
  "🎂 Birthday cake under LKR 8000 to Colombo",
  "🌺 අම්මාට flowers gift එකක් බලමු",
  "🍫 Premium chocolate hamper for a friend",
  "🎁 Machan surprise gift karanna, budget 5000",
];

const sidebarPrompts = [
  { label: "Trending today", prompt: "What gifts are trending today on Kapruka?" },
  { label: "Surprise me", prompt: "Surprise me with a thoughtful gift idea" },
  { label: "Apology saver", prompt: "I need a safe apology gift" },
  { label: "Under Rs. 5,000", prompt: "Show me good gifts under Rs. 5000" },
];

const LIVE_VOICES = [
  "Zephyr",
  "Kore",
  "Orus",
  "Autonoe",
  "Umbriel",
  "Erinome",
  "Laomedeia",
  "Schedar",
  "Achird",
  "Sadachbia",
  "Puck",
  "Fenrir",
  "Aoede",
  "Enceladus",
  "Algieba",
  "Algenib",
  "Achernar",
  "Gacrux",
  "Zubenelgenubi",
  "Sadaltager",
  "Charon",
  "Leda",
  "Callirrhoe",
  "Iapetus",
  "Despina",
  "Rasalgethi",
  "Alnilam",
  "Pulcherrima",
  "Vindemiatrix",
  "Sulafat",
] as const;

let activeLiveCallGeneration = 0;
let stopActiveLiveCall: (() => void) | null = null;

type VoiceSearchArgs = {
  q?: string;
  query?: string;
  category?: string | null;
  max_price?: number | string | null;
  limit?: number | string | null;
  sort?: string | null;
  mode?: "more" | "fresh" | string | null;
};

type VoiceCartAddArgs = {
  action?: "add" | "remove" | "set_quantity" | "clear" | string | null;
  product_id?: string | null;
  productId?: string | null;
  product_index?: number | string | null;
  productIndex?: number | string | null;
  product_name?: string | null;
  productName?: string | null;
  quantity?: number | string | null;
};

type VoiceCheckoutArgs = {
  answer?: string | null;
  field?: string | null;
};

type VoiceOrderFieldName =
  | "recipientName"
  | "recipientPhone"
  | "streetAddress"
  | "city"
  | "deliveryDate"
  | "senderName"
  | "anonymous"
  | "giftMessage";

type VoiceOrderFieldArgs = {
  field?: VoiceOrderFieldName | string | null;
  value?: string | null;
  displayValue?: string | null;
};

type VoiceOrderReadyArgs = {
  allFieldsSummary?: string | null;
};

type VoiceDeliveryCheckArgs = {
  city?: string | null;
  deliveryDate?: string | null;
  delivery_date?: string | null;
  productId?: string | null;
  product_id?: string | null;
  productIndex?: number | string | null;
  product_index?: number | string | null;
  productName?: string | null;
  product_name?: string | null;
  itemType?: string | null;
};

type VoiceConfirmOrderArgs = {
  confirmed?: boolean | string | null;
};

const today = new Date().toISOString().slice(0, 10);
const CART_STORAGE_KEY = "kade-ai-cart";
const RECENT_CARTS_STORAGE_KEY = "kade-ai-recent-carts";
const CHAT_SESSIONS_STORAGE_KEY = "kade-ai-chat-sessions";
const DELIVERY_CITY_STORAGE_KEY = "kade_delivery_city";
const USER_LANGUAGE_STORAGE_KEY = "kade-ai-preferred-language";
const VOICE_GENDER_STORAGE_KEY = "kade-ai-voice-gender";
const AUTH_USER_STORAGE_KEY = "kade-ai-auth-user";
const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ?? "";
const ACTIVE_CHAT_COOKIE = "kade_active_chat";
const CHAT_SESSION_LIMIT = 12;
const VOICE_BY_GENDER = {
  female: "Aoede",
  male: "Orus",
} as const;
const POPULAR_DELIVERY_CITIES = [
  "Colombo 01",
  "Colombo 02",
  "Colombo 03",
  "Colombo 04",
  "Colombo 05",
  "Colombo 06",
  "Colombo 07",
  "Colombo 08",
  "Colombo 09",
  "Colombo 10",
  "Colombo 11",
  "Colombo 12",
  "Colombo 13",
  "Colombo 14",
  "Colombo 15",
  "Kandy",
  "Galle",
  "Negombo",
  "Jaffna",
  "Matara",
  "Kurunegala",
  "Anuradhapura",
  "Ratnapura",
  "Batticaloa",
  "Nugegoda",
  "Maharagama",
  "Dehiwala",
  "Mount Lavinia",
  "Moratuwa",
  "Kelaniya",
  "Wattala",
  "Panadura",
  "Kalutara",
  "Gampaha",
].map((name) => ({ name }));

type RecentCart = {
  id: string;
  label: string;
  createdAt: string;
  items: CartItem[];
};

type ChatSession = {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  messages: ChatMessage[];
  pinned?: boolean;
  customTitle?: boolean;
  language?: ConversationLanguage;
};

type DeliveryCity = {
  name: string;
  aliases?: string[];
};

type ChatApiPayload = {
  reply?: string;
  products?: Product[];
  delivery?: unknown;
  order?: unknown;
  label?: ChatMessage["label"];
  quickReplies?: string[];
  cartActions?: CartAction[];
};

type ConversationLanguage = "en" | "si" | "ta";
type VoiceGender = keyof typeof VOICE_BY_GENDER;
type AuthUser = {
  mode: "guest" | "google";
  name: string;
  email?: string;
  picture?: string;
};

type GoogleCredentialPayload = {
  name?: string;
  given_name?: string;
  email?: string;
  picture?: string;
};

type GoogleCredentialResponse = {
  credential?: string;
};

declare global {
  interface Window {
    google?: {
      accounts?: {
        id?: {
          initialize: (config: { client_id: string; callback: (response: GoogleCredentialResponse) => void }) => void;
          renderButton: (element: HTMLElement, options: Record<string, string | number | boolean>) => void;
        };
      };
    };
  }
}

type CartAction = {
  action: "add" | "remove" | "set_quantity" | "clear";
  product_id?: string | null;
  productId?: string | null;
  product_index?: number | string | null;
  productIndex?: number | string | null;
  product_name?: string | null;
  productName?: string | null;
  quantity?: number | string | null;
};

function money(price?: { amount: number | null; currency: string }) {
  if (!price || price.amount == null) return "Price on request";
  return `Rs. ${new Intl.NumberFormat("en-LK", { maximumFractionDigits: 0 }).format(price.amount)}`;
}

function firstImage(product: Product) {
  return product.image_url || product.images?.[0] || "";
}

function stripInternalControlText(text: string) {
  const withoutBracketedControl = text
    .replace(/\[[^\]]*INTERNAL UI EVENT[^\]]*\]/gi, " ")
    .replace(/\[[^\]]*(?:SYSTEM\s+)?CONTEXT UPDATE[^\]]*\]/gi, " ");
  if (/INTERNAL UI EVENT|(?:SYSTEM\s+)?CONTEXT UPDATE|do not call tools for this message|do not say this aloud|Say this aloud/i.test(withoutBracketedControl)) {
    return "";
  }
  return withoutBracketedControl.replace(/\s+/g, " ").trim();
}

function cleanVoiceTranscript(text: string) {
  const safeText = stripInternalControlText(text);
  if (!safeText) {
    return "";
  }
  const normalized = safeText
    .replace(/\s+/g, " ")
    .replace(/\s+([,;:.!?])/g, "$1")
    .replace(/([,;:!?])(?=\S)/g, "$1 ")
    .replace(/\.([A-Z])/g, ". $1")
    .replace(/\b(chocolate)(cakes?)\b/gi, "$1 $2")
    .replace(/\b(birthday)(cakes?)\b/gi, "$1 $2")
    .replace(/\b(some)(options?)\b/gi, "$1 $2")
    .replace(/\b(on)(screen)\b/gi, "$1 $2")
    .replace(/\b(by)(number)\b/gi, "$1 $2")
    .replace(/\b(or)(tap)\b/gi, "$1 $2")
    .trim();
  if (!normalized) return "";
  const parts = normalized
    .split(/(?<=[.!?])\s+/)
    .map((part) => part.trim())
    .filter(Boolean);
  if (parts.length >= 2) {
    const deduped: string[] = [];
    for (const part of parts) {
      const last = deduped[deduped.length - 1];
      const compactPart = part.toLowerCase().replace(/[^a-z0-9]+/g, "");
      const compactLast = last?.toLowerCase().replace(/[^a-z0-9]+/g, "");
      if (compactPart && compactPart === compactLast) continue;
      deduped.push(part);
    }
    return deduped.join(" ");
  }
  return normalized;
}

function transcriptFingerprint(text: string) {
  return cleanVoiceTranscript(text).toLowerCase().replace(/[^a-z0-9]+/g, "");
}

function isNearDuplicateTranscript(a: string, b: string) {
  const left = transcriptFingerprint(a);
  const right = transcriptFingerprint(b);
  if (!left || !right) return false;
  if (left === right) return true;
  const minLength = Math.min(left.length, right.length);
  return minLength > 32 && (left.includes(right) || right.includes(left));
}

function isLikelyAssistantEcho(input: string, assistant: string) {
  const inputFingerprint = transcriptFingerprint(input);
  const assistantFingerprint = transcriptFingerprint(assistant);
  if (inputFingerprint.length < 16 || assistantFingerprint.length < 16) return false;
  if (inputFingerprint === assistantFingerprint) return true;
  return assistantFingerprint.includes(inputFingerprint) || inputFingerprint.includes(assistantFingerprint);
}

function assistantIsWaitingForUser(text: string) {
  const cleaned = cleanVoiceTranscript(text).toLowerCase();
  if (!cleaned) return false;
  return /[?]\s*$/.test(cleaned) ||
    /\b(what kind|which kind|what type|which type|flavou?r|preference|prefer|specific|budget|city|where|who is it for|tell me|would you like|do you want|should i)\b/.test(cleaned);
}

function isAgeGatedGiftRequest(text: string) {
  const lower = text.toLowerCase();
  const hasGiftIntent =
    /\b(gift|gifts|present|surprise|recommend|suggest|ideas?|what should|what would|would love|something nice|something special)\b/.test(lower) ||
    /\b(show|find|search|send|buy|choose|pick)\b.*\b(gift|gifts|present|surprise)\b/.test(lower);
  const hasAgeSensitiveRecipient =
    /\b(girl|boy|girlfriend|gf|boyfriend|bf|daughter|son|kid|kids|child|children|teen|teenager|niece|nephew|wife|husband)\b/.test(lower);
  return hasGiftIntent && hasAgeSensitiveRecipient;
}

function hasGiftRecipientAge(text: string) {
  const lower = text.toLowerCase();
  return (
    /\b(?:age|aged|old|years? old|yrs? old|y\/o|yo)\s*(?:is|:)?\s*\d{1,2}\b/.test(lower) ||
    /\b(?:she|he|they|girl|boy|girlfriend|boyfriend|gf|bf|daughter|son|kid|child|wife|husband)\s*(?:is|'s|age is|aged)?\s*\d{1,2}\b/.test(lower) ||
    /\b(?:she|he|they|girl|boy|girlfriend|boyfriend|gf|bf|daughter|son|kid|child|wife|husband)\s*(?:is|'s)?\s*(?:turning|turns?|becoming)\s*(?:into)?\s*\d{1,2}\b/.test(lower) ||
    /\b(?:turning|turns?|becoming)\s*(?:into)?\s*\d{1,2}\b/.test(lower) ||
    /\b\d{1,2}\s*(?:years? old|yrs? old|y\/o|yo)\b/.test(lower)
  );
}

function giftRequestNeedsAge(text: string, context = "") {
  const combined = `${context}\n${text}`;
  return isAgeGatedGiftRequest(combined) && !hasGiftRecipientAge(combined);
}

function isConcreteProductGiftRequest(text: string) {
  return /\b(cakes?|bento|chocolates?|biscuits?|cookies?|crackers?|flowers?|roses?|bouquet|hamper|tea|coffee|perfume|spa ceylon|cosmetics?|jewellery|jewelry|teddy|toy|toys|book|books|watch|bag|handbag|wallet)\b/i.test(text) ||
    hasModelVehicleIntent(text);
}

function shouldUseGiftResearchFlow(text: string, context = "") {
  const combined = `${context}\n${text}`;
  return isAgeGatedGiftRequest(combined) && !isConcreteProductGiftRequest(text);
}

function isVoiceStatusOnly(text: string) {
  const cleaned = cleanVoiceTranscript(text).toLowerCase();
  if (!cleaned) return true;
  if (/^(okay|ok|sure|got it|perfect|nice|cool|great|alright|right|done|hari|seri|ela)[.!]*$/.test(cleaned)) {
    return true;
  }
  if (/^(let me|i'll|i will)\s+(search|check|think|look|find|see|try|work|set|place|add)\b/.test(cleaned)) {
    return true;
  }
  if (/^(checking|searching|looking up|setting up|placing order|selecting that product|switching voice|call ended|voice connection|gift idea)\b/.test(cleaned)) {
    return true;
  }
  if (/^(api balamu|kapruka eke|city:|audio \d+ chunks?|test tone)\b/.test(cleaned)) {
    return true;
  }
  return cleaned.length < 18 && !/[?]/.test(cleaned);
}

function isPostProductResultChatter(text: string) {
  const cleaned = cleanVoiceTranscript(text).toLowerCase();
  if (!cleaned) return true;
  return /\b(options?|products?|cards?|visible|screen|pick|choose|select|number|tap|shown|showing)\b/.test(cleaned) &&
    cleaned.length < 220;
}

function voiceSearchKey(query: string, args: VoiceSearchArgs = {}) {
  const category = String(args.category ?? "").toLowerCase().trim();
  const maxPrice = args.max_price == null ? "" : String(args.max_price).trim();
  const stopWords = new Set([
    "can",
    "okay",
    "ok",
    "then",
    "you",
    "please",
    "search",
    "find",
    "show",
    "browse",
    "look",
    "for",
    "some",
    "good",
    "nice",
    "best",
    "options",
    "again",
    "kapruka",
    "stuff",
    "things",
    "like",
    "is",
    "there",
    "any",
    "many",
    "included",
    "include",
    "with",
    "me",
    "the",
    "a",
    "an",
  ]);
  const tokens = query
    .toLowerCase()
    .replace(/gift\s*(packs?|boxes|hampers?|sets?|bundles?)/g, "gift hamper")
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter(Boolean)
    .filter((word) => !stopWords.has(word))
    .map((word) => word.endsWith("s") && word.length > 4 ? word.slice(0, -1) : word);

  return [category, maxPrice, Array.from(new Set(tokens)).sort().join(" ")]
    .filter(Boolean)
    .join("|");
}

function isMoreOptionsRequest(text: string) {
  const lower = text.toLowerCase();
  return /\b(more|another|other|different|else|next|again|new options?|more options?|more choices?|look for more|show more|find more|search more|keep looking|load more|try more)\b/.test(lower) ||
    /\b(thawa|wena|ayeth|innum|vera|vere)\b/i.test(lower);
}

function stripMoreOptionsWords(text: string) {
  return text
    .toLowerCase()
    .replace(/\b(can you|could you|please|pls|i need|need|want|show|find|search|look|browse|check|for|me|some|more|another|other|different|else|next|again|new|options?|choices?|ones?|items?|things?|stuff|type|types|kind|kinds|tickets?)\b/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function hasModelVehicleIntent(text: string) {
  const lower = text.toLowerCase();
  return /\b(hot wheels?|die-?cast|dicast|miniature cars?|mini cars?|small cars?|toy cars?|model cars?|collect(?:ible|able) cars?|car stuff|vehicle models?|bike models?)\b/.test(lower) ||
    (/\b(cars?|vehicles?|bikes?|motorbikes?|motorcycles?)\b/.test(lower) && /\b(model|models|toy|toys|small|mini|miniature|collect(?:ible|able)|die-?cast|dicast)\b/.test(lower));
}

function normalizeProductSearchQuery(query: string) {
  return hasModelVehicleIntent(query) ? "diecast model car" : query;
}

function inferSearchQueryFromProducts(products: Product[]) {
  const text = products
    .map((product) => `${product.name} ${product.category?.name ?? ""} ${product.category?.slug ?? ""}`)
    .join(" ")
    .toLowerCase();
  if (/\b(chocolate|choco|cocoa|fudge)\b/.test(text) && /\b(cake|cakes|bento)\b/.test(text)) return "chocolate cake";
  if (/\b(cake|cakes|bento|birthday)\b/.test(text)) return "cake";
  if (/\b(biscuit|biscuits|cookie|cookies|cracker|crackers)\b/.test(text)) return "biscuits";
  if (/\b(flower|flowers|rose|roses|bouquet)\b/.test(text)) return "roses";
  if (/\b(chocolate|choco|ferrero|truffle)\b/.test(text)) return "chocolate";
  if (/\b(hamper|gift box|gift set)\b/.test(text)) return "gift hamper";
  return products[0]?.category?.name || products[0]?.name || "";
}

function isBroadCakeSearch(query: string, args: VoiceSearchArgs = {}) {
  const text = `${query} ${args.q ?? ""} ${args.query ?? ""} ${args.category ?? ""}`.toLowerCase();
  if (!/\b(cake|cakes)\b/.test(text)) return false;
  if (/\b(chocolate|vanilla|fruit|butter|ribbon|bento|birthday|anniversary|wedding|love|kids?|small|large|big|under|below|budget|rs|lkr|\d+)/.test(text)) {
    return false;
  }
  const meaningfulWords = text
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter(Boolean)
    .filter((word) => ![
      "hey",
      "there",
      "can",
      "you",
      "please",
      "show",
      "find",
      "search",
      "browse",
      "look",
      "for",
      "me",
      "some",
      "any",
      "good",
      "nice",
      "options",
      "cakes",
      "cake",
    ].includes(word));
  return meaningfulWords.length === 0;
}

function isCakeQuery(query: string, args: VoiceSearchArgs = {}) {
  return /\b(cake|cakes|birthday|bento)\b/i.test(`${query} ${args.q ?? ""} ${args.query ?? ""} ${args.category ?? ""}`);
}

function labelText(label?: string) {
  switch (label) {
    case "AI_RECOMMENDATION": return "AI Recommendation";
    case "DIRECT_LINK": return "Direct Link";
    case "SEARCH_RESULT": return "Search Result";
    case "DELIVERY_INFO": return "Delivery Info";
    case "ORDER_UPDATE": return "Order Update";
    default: return null;
  }
}

function productPickMeta(product: Product, index: number) {
  const text = `${product.id} ${product.name} ${product.summary ?? ""} ${product.category?.name ?? ""}`.toLowerCase();
  const price = product.price?.amount ?? null;

  if (index === 0) {
    return { badge: "Kade pick", reason: "Best first option for this request." };
  }
  if (price != null && price < 1000) {
    return { badge: "Best value", reason: "Good low-risk pick for the budget." };
  }
  if (/cake|birthday|icing/.test(text)) {
    return { badge: "Celebration", reason: "Works well when the moment needs a cake." };
  }
  if (/flower|rose|bouquet/.test(text)) {
    return { badge: "Warm gesture", reason: "A safe emotional pick with strong gifting value." };
  }
  if (/chocolate|ferrero|toblerone|hamper/.test(text)) {
    return { badge: "Easy win", reason: "Simple, familiar, and easy to pair with a note." };
  }
  if (product.in_stock) {
    return { badge: "Ready", reason: "In stock and suitable for quick ordering." };
  }
  return { badge: "Option", reason: "Worth checking as an alternative." };
}

function recentCartLabel(items: CartItem[]) {
  const first = items[0]?.product.name ?? "Saved cart";
  return items.length > 1 ? `${first} + ${items.length - 1} more` : first;
}

function welcomeMessage(): ChatMessage {
  return {
    id: "welcome",
    role: "assistant",
    text: "Hey, I'm Kade. Think of me as your Kapruka shopping friend.\n\nWe can browse, rescue a last-minute gift, fix an apology situation, or just look around. What are we finding today?",
    label: "AI_RECOMMENDATION",
    quickReplies: prompts,
  };
}

function createChatId() {
  return `chat_${Date.now().toString(36)}_${crypto.randomUUID().slice(0, 8)}`;
}

function chatTitle(messages: ChatMessage[]) {
  const firstUserMessage = messages.find((message) => message.role === "user")?.text.trim();
  if (!firstUserMessage) return "New Kade chat";
  return firstUserMessage.length > 42 ? `${firstUserMessage.slice(0, 42)}...` : firstUserMessage;
}

function isCheckoutIntent(text: string) {
  return /\b(check\s*out|checkout|order this|buy this|proceed|place order|create order|pay link|continue checkout|confirm this delivery)\b/i.test(text);
}

function locationTypeFromText(text: string): LocationType {
  const lower = text.toLowerCase();
  if (/apartment|flat/.test(lower)) return "apartment";
  if (/office|work/.test(lower)) return "office";
  if (/house|home|gedara/.test(lower)) return "house";
  return "other";
}

function yesNoToBoolean(text: string) {
  const lower = text.toLowerCase();
  if (/\b(no|nope|show my name|not anonymous|show it|nah)\b/i.test(lower)) return false;
  if (/\b(yes|yeah|yep|anonymous|keep it anonymous|hide|sure|ow|hari)\b/i.test(lower)) return true;
  return null;
}

function isSkipAnswer(text: string) {
  const lower = text.trim().toLowerCase();
  const noAnswers = new Set([
    "no",
    "nope",
    "nop",
    "nah",
    "ne",
    "naha",
    "na",
    "epa",
    "skip",
    "none",
    "blank",
    "leave blank",
    "no need",
    "no message",
    "නෑ",
    "නැහැ",
    "නැත",
    "එපා",
    "இல்லை",
    "வேண்டாம்",
  ]);
  return noAnswers.has(lower) || /\b(skip|nope|no message|none|leave blank|blank|no need|epa|naha)\b/i.test(lower);
}

type OrderField =
  | "recipientName"
  | "recipientPhone"
  | "deliveryAddress"
  | "deliveryCity"
  | "locationType"
  | "deliveryDate"
  | "senderName"
  | "anonymous"
  | "giftMessage"
  | "icingText";

type OrderFieldUpdate = {
  field: OrderField;
  value: string;
};

function cleanOrderValue(value: string) {
  return value
    .replace(/^[\s:=-]+/, "")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/[.!?]+$/, "")
    .trim();
}

function extractAfter(text: string, patterns: RegExp[]) {
  for (const pattern of patterns) {
    const match = text.match(pattern);
    const value = match?.[1] ? cleanOrderValue(match[1]) : "";
    if (value) return value;
  }
  return null;
}

function isOrderEditIntent(text: string) {
  const lower = text.trim().toLowerCase();
  return /^(edit|change|fix|wrong|modify|update|details|edit details)$/i.test(lower) ||
    /\b(edit|change|fix|wrong|modify|update)\b/i.test(lower) ||
    /(වෙනස්|නිවැරදි|திருத்த|மாற்ற|சரி பண்ண)/.test(text);
}

function looksLikeClarifyingQuestion(text: string) {
  const normalized = text.trim().toLowerCase();
  if (!normalized) return false;
  if (/[?？]$/.test(normalized)) return true;
  return (
    /\b(what|who|why|how|which|where|when|meaning|mean|means|explain|help|confused|don't understand|dont understand|didn't understand|didnt understand)\b/i.test(normalized) ||
    /\b(kiyanne|mokakda|mokadda|monawada|kohomada|ai|kauda|kawda|therenne|pahadili|pahadili karanna)\b/i.test(normalized) ||
    /\b(enna|enna artham|enna meaning|puriyala|puriyala illa|vilakkam|enna sollreenga|yaaru|epdi|eppadi)\b/i.test(normalized)
  );
}

function inferOrderFieldUpdate(text: string): OrderFieldUpdate | null {
  const raw = text.trim();
  const lower = raw.toLowerCase();

  if (/\b(anonymous|hide my name|keep it anonymous|show my name|not anonymous)\b/i.test(raw)) {
    return { field: "anonymous", value: raw };
  }

  const senderName = extractAfter(raw, [
    /\b(?:sender|from|my)\s+name\s*(?:is|must be|should be|=|:)?\s+(.+)$/i,
    /\bgift\s+card\s+name\s*(?:is|must be|should be|=|:)?\s+(.+)$/i,
  ]);
  if (senderName) return { field: "senderName", value: senderName };

  const recipientName = extractAfter(raw, [
    /\b(?:recipient|receiver|deliver\s+to)\s+name\s*(?:is|must be|should be|=|:)?\s+(.+)$/i,
    /\b(?:the\s+)?name\s*(?:is|must be|should be|=|:)\s+(.+)$/i,
    /\b(?:to|for)\s+([A-Za-z][A-Za-z\s.'-]{2,})$/i,
  ]);
  if (recipientName) return { field: "recipientName", value: recipientName };

  const phone = raw.match(/(?:\+94|0)\d[\d\s-]{7,}/)?.[0];
  if (phone) return { field: "recipientPhone", value: cleanOrderValue(phone) };

  const address = extractAfter(raw, [
    /\b(?:delivery\s+)?address\s*(?:is|=|:)?\s+(.+)$/i,
    /\b(?:deliver|send)\s+(?:it\s+)?to\s+(?:this\s+address\s*)?(.+\b(?:road|rd|street|st|lane|mawatha|mw|place|pl|apartment|flat|house|home|gedara)\b.*)$/i,
  ]);
  if (address) return { field: "deliveryAddress", value: address };

  const city = extractAfter(raw, [
    /\b(?:delivery\s+)?city\s*(?:is|=|:)?\s+(.+)$/i,
    /\b(?:town|area)\s*(?:is|=|:)?\s+(.+)$/i,
  ]);
  if (city) return { field: "deliveryCity", value: city };

  if (/\b(apartment|flat|office|work|house|home|gedara)\b/i.test(lower)) {
    return { field: "locationType", value: raw };
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(lower) || /\b(today|tomorrow)\b/i.test(lower)) {
    return { field: "deliveryDate", value: raw };
  }

  const deliveryDate = extractAfter(raw, [
    /\b(?:delivery\s+)?date\s*(?:is|=|:)?\s+(.+)$/i,
    /\b(?:arrive|deliver|send)\s+(?:on|by)\s+(.+)$/i,
  ]);
  if (deliveryDate) return { field: "deliveryDate", value: deliveryDate };

  const giftMessage = extractAfter(raw, [
    /\b(?:gift\s+)?message\s*(?:is|=|:)?\s+(.+)$/i,
    /\b(?:note|card)\s*(?:says|is|=|:)?\s+(.+)$/i,
  ]);
  if (giftMessage) return { field: "giftMessage", value: giftMessage };

  const icingText = extractAfter(raw, [
    /\b(?:icing|cake\s+text)\s*(?:says|is|=|:)?\s+(.+)$/i,
  ]);
  if (icingText) return { field: "icingText", value: icingText };

  return null;
}

function normalizeCityText(text: string) {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function findDeliveryCityInText(text: string, options: DeliveryCity[]) {
  const normalizedText = ` ${normalizeCityText(text)} `;
  const sortedOptions = [...options].sort((a, b) => b.name.length - a.name.length);

  for (const option of sortedOptions) {
    const names = [option.name, ...(option.aliases ?? [])];
    for (const name of names) {
      const normalizedName = normalizeCityText(name);
      if (normalizedName && normalizedText.includes(` ${normalizedName} `)) {
        return option.name;
      }
    }
  }

  return null;
}

function normalizeDeliveryCityCandidate(text: string, options: DeliveryCity[]) {
  const normalized = normalizeCityText(text);
  const colomboMatch = normalized.match(/^colombo\s+0?([1-9]|1[0-5])$/);
  if (colomboMatch) {
    const cityName = `Colombo ${colomboMatch[1].padStart(2, "0")}`;
    const matchingOption = options.find((option) => normalizeCityText(option.name) === normalizeCityText(cityName));
    return matchingOption?.name ?? cityName;
  }

  const exact = options.find((option) => {
    const names = [option.name, ...(option.aliases ?? [])];
    return names.some((name) => normalizeCityText(name) === normalized);
  });
  return exact?.name ?? findDeliveryCityInText(text, options);
}

function isLikelyContactNumber(text: string) {
  const digits = text.replace(/\D/g, "");
  return /^94\d{9}$/.test(digits) || /^0\d{9}$/.test(digits);
}

function isLikelyFullName(text: string) {
  return text.trim().split(/\s+/).filter(Boolean).length >= 2;
}

function detectConversationLanguage(text: string): ConversationLanguage | null {
  const lower = text.toLowerCase();
  if (/[\u0B80-\u0BFF]/.test(text)) return "ta";
  if (/[\u0D80-\u0DFF]/.test(text)) return "si";
  if (/^(yes|yeah|yep|no|nope|nop|nah|ok|okay|sure)$/i.test(lower.trim())) return null;
  if (/\b(venum|venuma|enna|eppadi|epdi|sapadu|saapadu|nalla|illa|illai|seri|podunga|kudunga|konjam|romba|anga|inge|aval|avan)\b/i.test(lower)) {
    return "ta";
  }
  if (/\b(mata|mama|oya|oyata|eyata|eka|ekak|karanna|balamu|gedara|hari|naha|ne|neda|mokakda|kohomada|lassana|thiyenawa|denna|ganna|ammata|appata)\b/i.test(lower)) {
    return "si";
  }
  if (/\b(hello|hi|hey|thanks|thank you|please|show|find|search|checkout|order|delivery|address|phone|name|message)\b/i.test(lower)) {
    return "en";
  }
  return null;
}

function inferConversationLanguageFromMessages(messages: ChatMessage[]) {
  for (const message of messages) {
    if (message.role !== "user") continue;
    const language = detectConversationLanguage(message.text);
    if (language) return language;
  }
  return null;
}

function sriLankaDateFromText(text: string) {
  const lower = text.toLowerCase().trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(lower)) return lower;
  const offset = lower.includes("tomorrow") ? 1 : 0;
  const date = new Date(Date.now() + offset * 24 * 60 * 60 * 1000);
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Colombo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const get = (type: string) => parts.find((part) => part.type === type)?.value;
  return `${get("year")}-${get("month")}-${get("day")}`;
}

function orderQuestion(field: string, language: ConversationLanguage) {
  const questions: Record<ConversationLanguage, Record<string, string>> = {
    en: {
      recipientName: "What's the recipient's full name?",
      recipientPhone: "What's their contact number? Kapruka needs it to coordinate delivery.",
      deliveryAddress: "What's the full delivery address?",
      deliveryCity: "I couldn't catch the main delivery city from that address. Which Kapruka delivery city should I use?",
      locationType: "Is that a house, apartment, office, or something else?",
      deliveryDate: "When should it arrive?",
      senderName: "And your name for the gift card?",
      anonymous: "Should I show your name or keep it anonymous?",
      giftMessage: "Want to add a custom message? Say it here, or say no/skip if you don't want one.",
      icingText: "Oh, and any text for the cake icing? Like Happy Birthday Amma, or say skip.",
      fallback: "I need one more detail before creating the order.",
    },
    si: {
      recipientName: "Delivery එක ලැබෙන කෙනාගේ සම්පූර්ණ නම මොකක්ද?",
      recipientPhone: "එයාගේ දුරකථන අංකය එවන්න. Delivery එකට ඒක ඕන.",
      deliveryAddress: "සම්පූර්ණ delivery address එක එවන්න.",
      deliveryCity: "Address එකෙන් main city එක හොයාගන්න බැරි වුණා. Kapruka delivery city එක මොකක්ද?",
      locationType: "ඒක ගෙදරක්ද, apartment එකක්ද, office එකක්ද, නැත්නම් වෙන තැනක්ද?",
      deliveryDate: "කවදාට delivery කරන්නද?",
      senderName: "Gift card එකේ ඔයාගේ නම කොහොමද දාන්න ඕන?",
      anonymous: "ඔයාගේ නම පෙන්වන්නද, නැත්නම් anonymous විදියට යවන්නද?",
      giftMessage: "Message එකක් දාන්න ඕනද? නැත්නම් නෑ/skip කියන්න.",
      icingText: "Cake එකට icing text එකක් ඕනද? උදා: Happy Birthday Amma. නැත්නම් නෑ කියන්න.",
      fallback: "Order එක හදන්න තව එක detail එකක් ඕන.",
    },
    ta: {
      recipientName: "Delivery பெறும் நபரின் முழு பெயர் என்ன?",
      recipientPhone: "அவர்களின் தொலைபேசி எண்ணை அனுப்புங்க. Delivery-க்கு அது தேவை.",
      deliveryAddress: "முழு delivery address அனுப்புங்க.",
      deliveryCity: "Address-ல main city தெளிவா கிடைக்கல. எந்த Kapruka delivery city use பண்ணலாம்?",
      locationType: "அது வீடா, apartment-ஆ, office-ஆ, இல்ல வேற இடமா?",
      deliveryDate: "எந்த date-க்கு delivery பண்ணணும்?",
      senderName: "Gift card-ல உங்கள் பெயர் எப்படி போடணும்?",
      anonymous: "உங்கள் பெயர் காட்டணுமா, இல்ல anonymous-ஆ அனுப்பணுமா?",
      giftMessage: "Message சேர்க்கணுமா? வேண்டாம் என்றா no/skip சொல்லுங்க.",
      icingText: "Cake icing text ஏதாவது வேண்டுமா? உதா: Happy Birthday Amma. வேண்டாம் என்றா skip சொல்லுங்க.",
      fallback: "Order create பண்ண இன்னும் ஒரு detail தேவை.",
    },
  };
  return questions[language][field] ?? questions[language].fallback;
}

function orderCopy(language: ConversationLanguage) {
  const copy = {
    en: {
      editAsk: "What should I fix? Name, address, date - tell me.",
      editRetry: "Which detail should I fix? Pick name, phone, address, city, date, or message.",
      emptyCart: "Aiyo, the cart is empty ne - add something first!",
      fullNameRetry: "Can you give me their full name for delivery?",
      phoneRetry: "Can you send a valid contact number? Something like 0771234567 or +94771234567.",
      collectingTitle: "Collecting details",
      editSelect: "Choose the detail you want to fix.",
      collectingHelp: "Answer in the chat. I will ask one thing at a time.",
      confirmCreate: "Shall I create the order?",
      yesCreate: "Yes, create order",
      editDetails: "Edit details",
      summaryIntro: "Okay, let me confirm everything:",
      summaryTo: "To",
      summaryAddress: "Address",
      summaryArriving: "Arriving",
      summaryMessage: "Message",
      summarySubtotal: "Items subtotal",
      summaryDeliveryKnown: "Delivery fee",
      summaryDeliveryPending: "Delivery fee will be checked before creating the order.",
      summaryTotal: "Total",
      deliveryUpdated: "Aiyo, that delivery date is not open. I updated it to the next available date before creating the order.",
      orderCreated: "Yesss! Order created!",
      paySoon: "Your payment link is ready - prices are locked for 60 minutes so pay soon!",
      deliveryOn: "Delivery on",
      toCity: "to",
      didGood: "You did good!",
      tryAgain: "Try again",
      openingPayment: "Payment link is ready. Opening it now.",
    },
    si: {
      editAsk: "මොකක්ද වෙනස් කරන්න ඕන? නම, address, date - කියන්න.",
      editRetry: "මොන detail එකද වෙනස් කරන්න ඕන? නම, phone, address, city, date, message එකක් කියන්න.",
      emptyCart: "Aiyo, cart එක හිස් නේ - මුලින් product එකක් add කරන්න.",
      fullNameRetry: "Delivery එකට එයාගේ සම්පූර්ණ නම එවන්න පුළුවන්ද?",
      phoneRetry: "Valid දුරකථන අංකයක් එවන්න. උදා: 0771234567 හෝ +94771234567.",
      collectingTitle: "Details ගන්නවා",
      editSelect: "වෙනස් කරන්න ඕන detail එක තෝරන්න.",
      collectingHelp: "Chat එකේ reply කරන්න. මම එක වතාවකට එක detail එකක් අහන්නම්.",
      confirmCreate: "Order එක හදන්නද?",
      yesCreate: "ඔව්, order එක හදන්න",
      editDetails: "Details වෙනස් කරන්න",
      summaryIntro: "හරි, details ටික confirm කරගමු:",
      summaryTo: "ලැබෙන්නේ",
      summaryAddress: "Address එක",
      summaryArriving: "Delivery date එක",
      summaryMessage: "Message එක",
      summarySubtotal: "Items subtotal",
      summaryDeliveryKnown: "Delivery fee එක",
      summaryDeliveryPending: "Delivery fee එක order එක හදන්න කලින් check කරනවා.",
      summaryTotal: "Total එක",
      deliveryUpdated: "Aiyo, ඒ delivery date එක available නෑ. Order එක හදන්න කලින් next available date එකට update කළා.",
      orderCreated: "Yesss! Order එක හැදුනා!",
      paySoon: "Payment link එක ready. Prices විනාඩි 60ක් lock වෙනවා, ඒ නිසා ඉක්මනින් pay කරන්න.",
      deliveryOn: "Delivery date එක",
      toCity: "city එක",
      didGood: "වැඩේ හරි!",
      tryAgain: "ආයෙ try කරන්න",
      openingPayment: "Payment link එක ready. දැන් open කරනවා.",
    },
    ta: {
      editAsk: "எதை மாற்றணும்? Name, address, date - சொல்லுங்க.",
      editRetry: "எந்த detail மாற்றணும்? Name, phone, address, city, date, message சொல்லுங்க.",
      emptyCart: "Aiyo, cart காலியா இருக்கு - முதலில் product add பண்ணுங்க.",
      fullNameRetry: "Delivery-க்கு அவர்களின் முழு பெயர் அனுப்ப முடியுமா?",
      phoneRetry: "Valid தொலைபேசி எண் அனுப்புங்க. உதா: 0771234567 அல்லது +94771234567.",
      collectingTitle: "Details கேட்கிறேன்",
      editSelect: "மாற்ற வேண்டிய detail-ஐ தேர்வு பண்ணுங்க.",
      collectingHelp: "Chat-ல reply பண்ணுங்க. நான் ஒரு நேரத்தில் ஒரு detail மட்டும் கேட்பேன்.",
      confirmCreate: "Order create பண்ணலாமா?",
      yesCreate: "ஆம், order create பண்ணுங்கள்",
      editDetails: "Details மாற்று",
      summaryIntro: "சரி, details confirm பண்ணிக்கலாம்:",
      summaryTo: "பெறுபவர்",
      summaryAddress: "Address",
      summaryArriving: "Delivery date",
      summaryMessage: "Message",
      summarySubtotal: "Items subtotal",
      summaryDeliveryKnown: "Delivery fee",
      summaryDeliveryPending: "Delivery fee order create பண்ணும் முன் check பண்ணப்படும்.",
      summaryTotal: "Total",
      deliveryUpdated: "Aiyo, அந்த delivery date available இல்லை. Order create பண்ணும் முன் next available date-க்கு update பண்ணிட்டேன்.",
      orderCreated: "Yesss! Order created!",
      paySoon: "Payment link ready. Prices 60 minutes lock ஆகும், சீக்கிரம் pay பண்ணுங்க.",
      deliveryOn: "Delivery date",
      toCity: "city",
      didGood: "வேலை முடிஞ்சது!",
      tryAgain: "மீண்டும் try பண்ணு",
      openingPayment: "Payment link ready. இப்ப open பண்ணுறேன்.",
    },
  };
  return copy[language];
}

function orderConfirmationText(draft: OrderDraft, language: ConversationLanguage) {
  const copy = orderCopy(language);
  const giftMessageLine = draft.giftMessage?.trim()
    ? `\n${copy.summaryMessage}: ${draft.giftMessage}`
    : "";
  const deliveryLine = draft.deliveryRate === undefined
    ? copy.summaryDeliveryPending
    : `${copy.summaryDeliveryKnown}: Rs. ${new Intl.NumberFormat("en-LK").format(draft.deliveryRate)}`;
  const totalLabel = draft.deliveryRate === undefined ? copy.summarySubtotal : copy.summaryTotal;
  const totalAmount = draft.grandTotal ?? orderGrandTotal(draft);

  return `${copy.summaryIntro}

${draft.items.map((item) => `${item.productName} x${item.quantity}`).join("\n")}

${copy.summaryTo}: ${draft.recipientName} (${draft.recipientPhone})
${copy.summaryAddress}: ${draft.deliveryAddress}, ${draft.deliveryCity}
${copy.summaryArriving}: ${formatOrderDate(draft.deliveryDate)}
${deliveryLine}${giftMessageLine}
${totalLabel}: Rs. ${new Intl.NumberFormat("en-LK").format(totalAmount)}

${copy.confirmCreate}`;
}

function isOrderConfirmIntent(text: string, language: ConversationLanguage) {
  const lower = text.toLowerCase().trim();
  const compact = lower.replace(/\s+/g, " ");
  if (compact === orderCopy(language).yesCreate.toLowerCase()) return true;
  if (/\b(yes|yeah|yep|create|place|confirm|go ahead|hari|ela|ow|okay|ok)\b/i.test(lower)) return true;
  if (/(ඔව්|හරි|කරන්න|හදන්න|යවන්න|ඕකේ)/.test(text)) return true;
  if (/(ஆம்|சரி|பண்ணு|பண்ணுங்கள்|create|confirm)/i.test(text)) return true;
  return false;
}

function normalizeOrderEditField(text: string) {
  const lower = text.toLowerCase();
  if (/recipient|name|nama/.test(lower)) return "recipientName";
  if (/phone|number|call/.test(lower)) return "recipientPhone";
  if (/address|addr|gedara|home|location/.test(lower)) return "deliveryAddress";
  if (/city|town|area/.test(lower)) return "deliveryCity";
  if (/date|day|arrive|deliver/.test(lower)) return "deliveryDate";
  if (/message|msg|note|card/.test(lower)) return "giftMessage";
  return null;
}

function sanitizedMessageText(message: ChatMessage) {
  return message.source === "voice"
    ? cleanVoiceTranscript(message.text)
    : stripInternalControlText(message.text);
}

function hasVisibleMessageContent(message: ChatMessage) {
  return Boolean(
    message.text ||
    message.products?.length ||
    message.delivery ||
    message.orderResult ||
    message.image
  );
}

function sanitizeMessages(messages: ChatMessage[]) {
  return messages
    .map((message) => {
      const text = sanitizedMessageText(message);
      return { ...message, text, image: undefined, isStreaming: false };
    })
    .filter(hasVisibleMessageContent);
}

function messagesMatch(a: ChatMessage[] = [], b: ChatMessage[] = []) {
  return JSON.stringify(sanitizeMessages(a)) === JSON.stringify(sanitizeMessages(b));
}

function decodeGoogleCredential(credential: string): GoogleCredentialPayload | null {
  try {
    const payload = credential.split(".")[1];
    if (!payload) return null;
    const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
    const padded = normalized.padEnd(normalized.length + ((4 - normalized.length % 4) % 4), "=");
    const bytes = Uint8Array.from(atob(padded), (char) => char.charCodeAt(0));
    return JSON.parse(new TextDecoder().decode(bytes)) as GoogleCredentialPayload;
  } catch {
    return null;
  }
}

function authInitial(name?: string) {
  return (name?.trim()?.[0] ?? "G").toUpperCase();
}

function sortChatSessions(sessions: ChatSession[]) {
  return [...sessions].sort((a, b) => {
    if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
    return Date.parse(b.updatedAt) - Date.parse(a.updatedAt);
  });
}

function orderProgressCount(draft: OrderDraft | null) {
  if (!draft) return 0;
  let count = 0;
  if (draft.recipientName?.trim()) count += 1;
  if (draft.recipientPhone?.trim()) count += 1;
  if (draft.deliveryAddress?.trim() && draft.deliveryCity?.trim()) count += 1;
  if (draft.deliveryDate?.trim()) count += 1;
  if (draft.giftMessage !== undefined) count += 1;
  return count;
}

function readCookie(name: string) {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

function writeCookie(name: string, value: string, days = 30) {
  if (typeof document === "undefined") return;
  const maxAge = days * 24 * 60 * 60;
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=${maxAge}; samesite=lax`;
}

function updateChatUrl(id: string, temporary: boolean, mode: "push" | "replace" = "push") {
  if (typeof window === "undefined") return;
  const url = new URL(window.location.href);
  if (temporary) {
    url.searchParams.delete("chat");
    url.searchParams.set("temp", id);
  } else {
    url.searchParams.delete("temp");
    url.searchParams.set("chat", id);
  }
  window.history[mode === "push" ? "pushState" : "replaceState"]({}, "", `${url.pathname}${url.search}${url.hash}`);
}

/* ── Main Page ── */

export default function Home() {
  return (
    <VoiceSessionProvider>
      <HomeExperience />
    </VoiceSessionProvider>
  );
}

function HomeExperience() {
  const { state: voiceSession, dispatch: dispatchVoiceSession } = useVoiceSession();
  const [messages, setMessages] = useState<ChatMessage[]>(() => [welcomeMessage()]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [typingMessageId, setTypingMessageId] = useState<string | null>(null);
  const [activeChatId, setActiveChatId] = useState("");
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
  const [temporaryChat, setTemporaryChat] = useState(false);
  const [chatHydrated, setChatHydrated] = useState(false);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [recentCarts, setRecentCarts] = useState<RecentCart[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<SelectedProduct | null>(null);
  const [modalProduct, setModalProduct] = useState<Product | null>(null);
  const [detailOpen, setDetailOpen] = useState(true);
  const [rightTab, setRightTab] = useState<"product" | "cart" | "order">("product");
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [giftWrap, setGiftWrap] = useState(false);
  const [personalNote, setPersonalNote] = useState(false);
  const [city, setCity] = useState("Colombo 07");
  const [cityOptions, setCityOptions] = useState<DeliveryCity[]>([]);
  const [deliveryDate, setDeliveryDate] = useState(today);
  const [showCheckout, setShowCheckout] = useState(false);
  const [checkout, setCheckout] = useState({
    recipientName: "",
    recipientPhone: "",
    address: "",
    senderName: "",
    anonymous: false,
    giftMessage: "",
  });
  const [order, setOrder] = useState<Record<string, unknown> | null>(null);
  const [deliveryQuote, setDeliveryQuote] = useState<DeliveryResult | null>(null);
  const [orderDraft, setOrderDraft] = useState<OrderDraft | null>(null);
  const [orderResult, setOrderResult] = useState<OrderCreatedMetadata | null>(null);
  const [voiceFormFillKey, setVoiceFormFillKey] = useState(0);
  const [conversationLanguage, setConversationLanguage] = useState<ConversationLanguage>("en");
  const conversationLanguageRef = useRef<ConversationLanguage>("en");
  const conversationLanguageLockedRef = useRef(false);
  const [preferredLanguage, setPreferredLanguage] = useState<ConversationLanguage>("en");
  const [voiceGender, setVoiceGender] = useState<VoiceGender>("female");
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [authUser, setAuthUser] = useState<AuthUser | null>(null);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [googleScriptReady, setGoogleScriptReady] = useState(false);
  const [googleAuthError, setGoogleAuthError] = useState("");
  const [openChatMenuId, setOpenChatMenuId] = useState<string | null>(null);
  const [trackingNumber, setTrackingNumber] = useState("");
  const [trackingResult, setTrackingResult] = useState<Record<string, unknown> | null>(null);
  const [busyAction, setBusyAction] = useState<string | null>(null);
  const [darkMode, setDarkMode] = useState(false);
  const [showImageSheet, setShowImageSheet] = useState(false);
  const [showDropZone, setShowDropZone] = useState(false);
  const [pendingImage, setPendingImage] = useState<PreparedImage | null>(null);

  const [showLiveCall, setShowLiveCall] = useState(false);
  const closeLiveCall = useCallback(() => setShowLiveCall(false), []);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const lastProductMessageRef = useRef<HTMLElement | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const googleButtonRef = useRef<HTMLDivElement>(null);
  const imagePreviewUrlsRef = useRef<string[]>([]);
  const chatBusy = loading || Boolean(typingMessageId);
  const chatSessionsRef = useRef<ChatSession[]>([]);
  const voiceBridgeRef = useRef(new VoiceBridge());
  const liveAssistantMessageIdRef = useRef<string | null>(null);
  const lastFinalVoiceAssistantRef = useRef<{ text: string; at: number } | null>(null);
  const livePlaybackContextRef = useRef<AudioContext | null>(null);
  const latestVoiceProductsRef = useRef<Product[]>([]);
  const voiceSearchInFlightRef = useRef<Map<string, Promise<Product[]>>>(new Map());
  const voiceSearchStartedAtRef = useRef(0);
  const recentVoiceSearchRef = useRef<Map<string, { at: number; products: Product[] }>>(new Map());
  const voiceSearchMissRef = useRef<Map<string, number>>(new Map());
  const lastVoiceSearchRef = useRef<{ query: string; key: string; args: VoiceSearchArgs } | null>(null);
  const voiceSearchHistoryRef = useRef<{ key: string; ids: Set<string> } | null>(null);
  const lastVoiceProductsShownAtRef = useRef(0);
  const orderPlacementInFlightRef = useRef(false);
  const orderPlacementPromiseRef = useRef<Promise<OrderCreatedMetadata | null> | null>(null);
  const lastPlacedOrderSignatureRef = useRef("");
  const lastPlacedOrderRef = useRef<OrderCreatedMetadata | null>(null);
  const lastPlacedOrderAtRef = useRef(0);
  const lastOrderErrorRef = useRef("");

  const openLiveCall = useCallback(() => {
    const AudioContextClass = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (AudioContextClass && (!livePlaybackContextRef.current || livePlaybackContextRef.current.state === "closed")) {
      livePlaybackContextRef.current = new AudioContextClass({ sampleRate: 24000 });
    }
    const ctx = livePlaybackContextRef.current;
    if (ctx) {
      void ctx.resume().then(() => {
        const source = ctx.createBufferSource();
        const gain = ctx.createGain();
        gain.gain.value = 0;
        source.buffer = ctx.createBuffer(1, 1, 24000);
        source.connect(gain);
        gain.connect(ctx.destination);
        source.start();
      }).catch(() => {
        // Browser may require a second tap; the voice dock will still connect.
      });
    }
    setShowLiveCall(true);
  }, []);

  const applyPreferredLanguage = useCallback((language: ConversationLanguage) => {
    setPreferredLanguage(language);
    conversationLanguageRef.current = language;
    conversationLanguageLockedRef.current = true;
    setConversationLanguage(language);
    try {
      window.localStorage.setItem(USER_LANGUAGE_STORAGE_KEY, language);
    } catch {
      // Ignore local storage quota errors.
    }
  }, []);

  const applyVoiceGender = useCallback((gender: VoiceGender) => {
    setVoiceGender(gender);
    try {
      window.localStorage.setItem(VOICE_GENDER_STORAGE_KEY, gender);
    } catch {
      // Ignore local storage quota errors.
    }
  }, []);

  const persistAuthUser = useCallback((user: AuthUser) => {
    setAuthUser(user);
    setAuthModalOpen(false);
    setGoogleAuthError("");
    try {
      window.localStorage.setItem(AUTH_USER_STORAGE_KEY, JSON.stringify(user));
    } catch {
      // Ignore local storage quota errors.
    }
  }, []);

  const continueAsGuest = useCallback(() => {
    persistAuthUser({ mode: "guest", name: "Guest" });
  }, [persistAuthUser]);

  const signOutToGuest = useCallback(() => {
    persistAuthUser({ mode: "guest", name: "Guest" });
  }, [persistAuthUser]);

  const handleGoogleCredential = useCallback((response: GoogleCredentialResponse) => {
    if (!response.credential) {
      setGoogleAuthError("Google did not return a sign-in token. Try again or continue as guest.");
      return;
    }

    const payload = decodeGoogleCredential(response.credential);
    if (!payload) {
      setGoogleAuthError("Could not read the Google profile. Guest mode still works.");
      return;
    }

    persistAuthUser({
      mode: "google",
      name: payload.name || payload.given_name || "Google user",
      email: payload.email,
      picture: payload.picture,
    });
  }, [persistAuthUser]);

  const openAuthChooser = useCallback(() => {
    setSettingsOpen(false);
    setAuthModalOpen(true);
  }, []);

  const syncShownProducts = useCallback((products: Product[]) => {
    latestVoiceProductsRef.current = products;
    const shownProducts = toShownVoiceProducts(products);
    dispatchVoiceSession({ type: "SET_SHOWN_PRODUCTS", products: shownProducts });
    voiceBridgeRef.current.updateGeminiContext(shownProducts, cart);
  }, [cart, dispatchVoiceSession]);

  const resetConversationSurface = useCallback(() => {
    setSelectedProduct(null);
    setShowCheckout(false);
    setDeliveryQuote(null);
    setOrder(null);
    setTrackingResult(null);
    setTypingMessageId(null);
    setLoading(false);
  }, []);

  useEffect(() => {
    voiceBridgeRef.current.setContext(voiceSession);
  }, [voiceSession]);

  useEffect(() => {
    dispatchVoiceSession({ type: "UPDATE_CART", cartItems: cart });
    voiceBridgeRef.current.updateGeminiContext(voiceSession.shownProducts, cart);
  }, [cart, dispatchVoiceSession, voiceSession.shownProducts]);

  const persistChatSessions = useCallback((sessions: ChatSession[]) => {
    const nextSessions = sortChatSessions(sessions).slice(0, CHAT_SESSION_LIMIT);
    chatSessionsRef.current = nextSessions;
    setChatSessions(nextSessions);
    try {
      window.localStorage.setItem(CHAT_SESSIONS_STORAGE_KEY, JSON.stringify(nextSessions));
    } catch {
      // Ignore local storage quota errors.
    }
    return nextSessions;
  }, []);

  const openChatSession = useCallback((session: ChatSession, mode: "push" | "replace" = "push") => {
    const inferredLanguage = session.language ?? inferConversationLanguageFromMessages(session.messages ?? []);
    const sessionLanguage = inferredLanguage ?? "en";
    conversationLanguageRef.current = sessionLanguage;
    conversationLanguageLockedRef.current = Boolean(inferredLanguage);
    setConversationLanguage(sessionLanguage);
    setActiveChatId(session.id);
    setTemporaryChat(false);
    setMessages(session.messages?.length ? sanitizeMessages(session.messages) : [welcomeMessage()]);
    resetConversationSurface();
    writeCookie(ACTIVE_CHAT_COOKIE, session.id);
    updateChatUrl(session.id, false, mode);
  }, [resetConversationSurface]);

  const startChat = useCallback((temporary = false) => {
    const id = createChatId();
    const createdAt = new Date().toISOString();
    const freshMessages = [welcomeMessage()];

    setActiveChatId(id);
    setTemporaryChat(temporary);
    setMessages(freshMessages);
    conversationLanguageRef.current = preferredLanguage;
    conversationLanguageLockedRef.current = preferredLanguage !== "en";
    setConversationLanguage(preferredLanguage);
    resetConversationSurface();
    setOrderDraft(null);
    setOrderResult(null);
    clearOrderDraft();
    updateChatUrl(id, temporary);

    if (temporary) return;

    const session: ChatSession = {
      id,
      title: "New Kade chat",
      createdAt,
      updatedAt: createdAt,
      messages: freshMessages,
      language: preferredLanguage !== "en" ? preferredLanguage : undefined,
    };
    persistChatSessions([session, ...chatSessionsRef.current]);
    writeCookie(ACTIVE_CHAT_COOKIE, id);
  }, [persistChatSessions, preferredLanguage, resetConversationSurface]);

  const toggleChatPin = useCallback((sessionId: string) => {
    persistChatSessions(
      chatSessionsRef.current.map((session) =>
        session.id === sessionId ? { ...session, pinned: !session.pinned } : session
      )
    );
  }, [persistChatSessions]);

  const renameChatSession = useCallback((session: ChatSession) => {
    const nextTitle = window.prompt("Rename chat", session.title)?.trim();
    if (!nextTitle) return;
    persistChatSessions(
      chatSessionsRef.current.map((entry) =>
        entry.id === session.id ? { ...entry, title: nextTitle, customTitle: true } : entry
      )
    );
  }, [persistChatSessions]);

  const deleteChatSession = useCallback((sessionId: string) => {
    if (!window.confirm("Delete this chat?")) return;
    const nextSessions = persistChatSessions(chatSessionsRef.current.filter((session) => session.id !== sessionId));
    if (sessionId !== activeChatId || temporaryChat) return;

    if (nextSessions[0]) {
      openChatSession(nextSessions[0], "replace");
      return;
    }

    startChat(false);
  }, [activeChatId, openChatSession, persistChatSessions, startChat, temporaryChat]);

  // Conversation history for Gemini
  const conversationHistory = useMemo(() => {
    return messages
      .map((message) => ({ ...message, text: sanitizedMessageText(message) }))
      .filter((m) => m.id !== "welcome" && hasVisibleMessageContent(m))
      .map((m) => ({
        role: m.role === "assistant" ? ("model" as const) : ("user" as const),
        parts: [{ text: m.text }],
      }));
  }, [messages]);

  const displayMessages = useMemo(
    () =>
      messages
        .map((message) => ({ ...message, text: sanitizedMessageText(message) }))
        .filter(hasVisibleMessageContent),
    [messages]
  );

  const total = useMemo(
    () => cart.reduce((sum, item) => sum + (item.product.price?.amount ?? 0) * item.quantity, 0),
    [cart]
  );

  const deliveryCityOptions = useMemo(() => {
    const options = cityOptions.length ? cityOptions : [{ name: city }];
    return city && !options.some((option) => option.name === city) ? [{ name: city }, ...options] : options;
  }, [city, cityOptions]);

  const canCheckout =
    cart.length > 0 &&
    city &&
    checkout.recipientName.trim() &&
    checkout.recipientPhone.trim() &&
    checkout.address.trim();

  useEffect(() => {
    const lastMessage = displayMessages[displayMessages.length - 1];
    if (!lastMessage) return;
    if (lastMessage.products?.length) {
      lastProductMessageRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }
    if (lastMessage.source === "voice" && lastMessage.role === "assistant") {
      return;
    }
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [displayMessages, loading]);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', darkMode ? 'dark' : 'light');
  }, [darkMode]);

  useEffect(() => {
    try {
      const savedAuth = window.localStorage.getItem(AUTH_USER_STORAGE_KEY);
      if (savedAuth) {
        const parsedAuth = JSON.parse(savedAuth) as AuthUser;
        if (parsedAuth?.mode === "guest" || parsedAuth?.mode === "google") {
          setAuthUser(parsedAuth);
        } else {
          setAuthModalOpen(true);
        }
      } else {
        setAuthModalOpen(true);
      }

      const savedLanguage = window.localStorage.getItem(USER_LANGUAGE_STORAGE_KEY);
      if (savedLanguage === "en" || savedLanguage === "si" || savedLanguage === "ta") {
        setPreferredLanguage(savedLanguage);
      }

      const savedVoiceGender = window.localStorage.getItem(VOICE_GENDER_STORAGE_KEY);
      if (savedVoiceGender === "female" || savedVoiceGender === "male") {
        setVoiceGender(savedVoiceGender);
      }
    } catch {
      // Ignore local storage errors.
    }
  }, []);

  useEffect(() => {
    if (!GOOGLE_CLIENT_ID) return;
    if (window.google?.accounts?.id) {
      setGoogleScriptReady(true);
      return;
    }

    const existingScript = document.getElementById("google-identity-services");
    if (existingScript) {
      existingScript.addEventListener("load", () => setGoogleScriptReady(true), { once: true });
      return;
    }

    const script = document.createElement("script");
    script.id = "google-identity-services";
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = () => setGoogleScriptReady(true);
    script.onerror = () => setGoogleAuthError("Google sign-in could not load. Guest mode is available.");
    document.head.appendChild(script);
  }, []);

  useEffect(() => {
    if (!authModalOpen || !GOOGLE_CLIENT_ID || !googleScriptReady || !googleButtonRef.current || !window.google?.accounts?.id) return;

    googleButtonRef.current.innerHTML = "";
    window.google.accounts.id.initialize({
      client_id: GOOGLE_CLIENT_ID,
      callback: handleGoogleCredential,
    });
    window.google.accounts.id.renderButton(googleButtonRef.current, {
      theme: "outline",
      size: "large",
      type: "standard",
      shape: "pill",
      text: "continue_with",
      width: 320,
    });
  }, [authModalOpen, googleScriptReady, handleGoogleCredential]);

  useEffect(() => {
    if (cart.length === 0) {
      setCartOpen(false);
    }
  }, [cart.length]);

  useEffect(() => {
    if (!openChatMenuId) return;
    const closeMenu = () => setOpenChatMenuId(null);
    window.addEventListener("pointerdown", closeMenu);
    return () => window.removeEventListener("pointerdown", closeMenu);
  }, [openChatMenuId]);

  useEffect(() => {
    if (!settingsOpen) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setSettingsOpen(false);
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [settingsOpen]);

  useEffect(() => {
    chatSessionsRef.current = chatSessions;
  }, [chatSessions]);

  useEffect(() => {
    try {
      const savedSessions = window.localStorage.getItem(CHAT_SESSIONS_STORAGE_KEY);
      const parsedSessions: ChatSession[] = savedSessions ? JSON.parse(savedSessions) : [];
      const sessions = sortChatSessions(parsedSessions).slice(0, CHAT_SESSION_LIMIT);
      const params = new URLSearchParams(window.location.search);
      const tempId = params.get("temp");
      const requestedChatId = params.get("chat") || readCookie(ACTIVE_CHAT_COOKIE);

      chatSessionsRef.current = sessions;
      setChatSessions(sessions);

      if (tempId) {
        setActiveChatId(tempId);
        setTemporaryChat(true);
        setMessages([welcomeMessage()]);
        conversationLanguageRef.current = "en";
        conversationLanguageLockedRef.current = false;
        setConversationLanguage("en");
        updateChatUrl(tempId, true, "replace");
        setChatHydrated(true);
        return;
      }

      const matchedSession = requestedChatId
        ? sessions.find((session) => session.id === requestedChatId)
        : sessions[0];

      if (matchedSession) {
        openChatSession(matchedSession, "replace");
        setChatHydrated(true);
        return;
      }

      const id = requestedChatId || createChatId();
      const createdAt = new Date().toISOString();
      const freshSession: ChatSession = {
        id,
        title: "New Kade chat",
        createdAt,
        updatedAt: createdAt,
        messages: [welcomeMessage()],
      };
      const nextSessions = sortChatSessions([freshSession, ...sessions]).slice(0, CHAT_SESSION_LIMIT);
      chatSessionsRef.current = nextSessions;
      setChatSessions(nextSessions);
      setActiveChatId(id);
      setTemporaryChat(false);
      setMessages(freshSession.messages);
      conversationLanguageRef.current = "en";
      conversationLanguageLockedRef.current = false;
      setConversationLanguage("en");
      updateChatUrl(id, false, "replace");
      writeCookie(ACTIVE_CHAT_COOKIE, id);
      window.localStorage.setItem(CHAT_SESSIONS_STORAGE_KEY, JSON.stringify(nextSessions));
      setChatHydrated(true);
    } catch {
      const id = createChatId();
      setActiveChatId(id);
      setTemporaryChat(false);
      setMessages([welcomeMessage()]);
      conversationLanguageRef.current = "en";
      conversationLanguageLockedRef.current = false;
      setConversationLanguage("en");
      updateChatUrl(id, false, "replace");
      writeCookie(ACTIVE_CHAT_COOKIE, id);
      setChatHydrated(true);
    }
  }, [openChatSession]);

  useEffect(() => {
    if (!chatHydrated) return;

    function handlePopState() {
      const params = new URLSearchParams(window.location.search);
      const tempId = params.get("temp");
      const chatId = params.get("chat");

      if (tempId) {
        setActiveChatId(tempId);
        setTemporaryChat(true);
        setMessages([welcomeMessage()]);
        resetConversationSurface();
        return;
      }

      const session = chatSessionsRef.current.find((entry) => entry.id === chatId);
      if (session) {
        openChatSession(session, "replace");
      }
    }

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [chatHydrated, openChatSession, resetConversationSurface]);

  useEffect(() => {
    if (!chatHydrated || temporaryChat || !activeChatId || chatBusy) return;

    try {
      const now = new Date().toISOString();
      const existing = chatSessionsRef.current.find((session) => session.id === activeChatId);
      const sanitizedMessages = sanitizeMessages(messages);
      const nextTitle = existing?.customTitle ? existing.title : chatTitle(messages);
      const nextLanguage = conversationLanguageLockedRef.current ? conversationLanguageRef.current : existing?.language;
      const messagesChanged = !existing || !messagesMatch(existing.messages, sanitizedMessages);
      const titleChanged = existing ? existing.title !== nextTitle : true;
      const languageChanged = existing ? existing.language !== nextLanguage : Boolean(nextLanguage);

      if (existing && !messagesChanged && !titleChanged && !languageChanged) {
        writeCookie(ACTIVE_CHAT_COOKIE, activeChatId);
        return;
      }

      const snapshot: ChatSession = {
        id: activeChatId,
        title: nextTitle,
        createdAt: existing?.createdAt ?? now,
        updatedAt: messagesChanged ? now : existing?.updatedAt ?? now,
        messages: sanitizedMessages,
        pinned: existing?.pinned,
        customTitle: existing?.customTitle,
        language: nextLanguage,
      };
      const nextSessions = sortChatSessions([
        snapshot,
        ...chatSessionsRef.current.filter((session) => session.id !== activeChatId),
      ]).slice(0, CHAT_SESSION_LIMIT);

      chatSessionsRef.current = nextSessions;
      setChatSessions(nextSessions);
      window.localStorage.setItem(CHAT_SESSIONS_STORAGE_KEY, JSON.stringify(nextSessions));
      writeCookie(ACTIVE_CHAT_COOKIE, activeChatId);
    } catch {
      // Ignore local storage quota errors.
    }
  }, [messages, activeChatId, temporaryChat, chatHydrated, chatBusy]);

  useEffect(() => {
    try {
      const savedCart = window.localStorage.getItem(CART_STORAGE_KEY);
      const savedRecent = window.localStorage.getItem(RECENT_CARTS_STORAGE_KEY);
      const savedCity = window.localStorage.getItem(DELIVERY_CITY_STORAGE_KEY);
      const savedDraft = loadOrderDraft();
      if (savedCart) setCart(JSON.parse(savedCart));
      if (savedRecent) setRecentCarts(JSON.parse(savedRecent));
      if (savedCity) setCity(savedCity);
      if (savedDraft && ["collecting", "confirming"].includes(savedDraft.stage)) {
        setOrderDraft(savedDraft);
        setRightTab("order");
        setDetailOpen(true);
        setMessages((prev) => [
          ...prev,
          {
            id: crypto.randomUUID(),
            role: "assistant",
            text: "Oh, you have an unfinished order - want to continue?",
            label: "AI_RECOMMENDATION",
            quickReplies: ["Yes, continue", "Start fresh"],
          },
        ]);
      }
    } catch {
      // Ignore local storage corruption.
    }
  }, []);

  useEffect(() => {
    if (!orderDraft || ["complete", "idle"].includes(orderDraft.stage)) return;
    try {
      saveOrderDraft(orderDraft);
    } catch {
      // Ignore storage quota errors.
    }
  }, [orderDraft]);

  useEffect(() => {
    try {
      if (city) window.localStorage.setItem(DELIVERY_CITY_STORAGE_KEY, city);
    } catch {
      // Ignore storage quota errors.
    }
  }, [city]);

  useEffect(() => {
    try {
      window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
    } catch {
      // Ignore storage quota errors.
    }
  }, [cart]);

  useEffect(() => {
    try {
      window.localStorage.setItem(RECENT_CARTS_STORAGE_KEY, JSON.stringify(recentCarts));
    } catch {
      // Ignore storage quota errors.
    }
  }, [recentCarts]);

  useEffect(() => {
    return () => {
      imagePreviewUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
      imagePreviewUrlsRef.current = [];
      if (livePlaybackContextRef.current && livePlaybackContextRef.current.state !== "closed") {
        void livePlaybackContextRef.current.close();
      }
    };
  }, []);

  useEffect(() => {
    let mounted = true;

    fetch("/api/cities?limit=50")
      .then((res) => res.json())
      .then((data) => {
        if (!mounted) return;
        const cities: DeliveryCity[] = Array.isArray(data.cities) ? data.cities : [];
        const merged = [...POPULAR_DELIVERY_CITIES, ...cities].filter(
          (option, index, all) => all.findIndex((item) => item.name === option.name) === index
        );
        setCityOptions(merged.length ? merged : [{ name: "Colombo 07" }]);
      })
      .catch(() => {
        if (mounted) setCityOptions([{ name: "Colombo 07" }]);
      });

    return () => {
      mounted = false;
    };
  }, []);

  /* ── Chat ── */

  const revealAssistantMessage = useCallback((
    messageId: string,
    fullText: string,
    options: { fromLength?: number; keepStreaming?: boolean } = {}
  ) => {
    return new Promise<void>((resolve) => {
      const text = fullText || "I couldn't process that. Try again?";
      const fromLength = Math.min(options.fromLength ?? 0, text.length);
      const step = Math.max(1, Math.ceil(text.length / 320));
      let index = fromLength;

      setTypingMessageId(messageId);
      if (fromLength === 0) {
        setMessages((prev) =>
          prev.map((message) => (message.id === messageId ? { ...message, text: "" } : message))
        );
      }
      const interval = window.setInterval(() => {
        index = Math.min(text.length, index + step);
        setMessages((prev) =>
          prev.map((message) =>
            message.id === messageId ? { ...message, text: text.slice(0, index) } : message
          )
        );

        if (index >= text.length) {
          window.clearInterval(interval);
          setMessages((prev) =>
            prev.map((message) =>
              message.id === messageId ? { ...message, text, isStreaming: options.keepStreaming ?? false } : message
            )
          );
          if (!options.keepStreaming) setTypingMessageId(null);
          resolve();
        }
      }, 24);
    });
  }, []);

  const sendMessage = useCallback(
    async (text = input, audioData?: { data: string; mimeType: string }) => {
      const trimmed = text.trim();
      if ((!trimmed && !audioData) || chatBusy) return;
      if (trimmed) updateConversationLanguage(trimmed);

      if (!audioData && handleLocalOrderMessage(trimmed)) {
        setInput("");
        inputRef.current?.focus();
        return;
      }

      const userMessage: ChatMessage = { 
        id: crypto.randomUUID(), 
        role: "user", 
        text: trimmed || (audioData ? "🔊 Audio Message" : "") 
      };
      setMessages((prev) => [...prev, userMessage]);
      setInput("");
      setLoading(true);

      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: trimmed,
            history: conversationHistory,
            audio: audioData,
            stream: true,
            orderDraft: orderDraft ? { stage: orderDraft.stage } : null,
            language: conversationLanguageRef.current,
            cart: cart.map((item) => ({ product: item.product, quantity: item.quantity })),
            visibleProducts: latestVisibleProducts(),
          }),
        });

        const assistantId = crypto.randomUUID();
        let assistantAdded = false;
        let starterText = "";
        let finalData: ChatApiPayload | null = null;

        const addAssistant = () => {
          if (assistantAdded) return;
          assistantAdded = true;
          setLoading(false);
          setMessages((prev) => [
            ...prev,
            {
              id: assistantId,
              role: "assistant",
              text: "",
              label: "AI_RECOMMENDATION",
              isStreaming: true,
            },
          ]);
        };

        const applyFinalMeta = (data: ChatApiPayload) => {
          data.products?.forEach((product) => prefetchProductDetail(product.id));
          if (data.products?.length) syncShownProducts(data.products);
          const delivery = data.delivery
            ? isDeliveryResult(data.delivery)
              ? data.delivery
              : normalizeDeliveryResult(data.delivery, city)
            : null;
          if (delivery) {
            setDeliveryQuote(delivery);
            setCity(delivery.city);
            setRightTab("product");
            setDetailOpen(true);
          }
          applyCartActions(data.cartActions, data.products ?? []);

          setMessages((prev) =>
            prev.map((message) =>
              message.id === assistantId
                ? {
                    ...message,
                    products: data.products?.length ? data.products : undefined,
                    delivery: delivery ?? undefined,
                    label: data.label || "AI_RECOMMENDATION",
                    quickReplies: data.quickReplies?.length
                      ? data.quickReplies
                      : data.products?.length
                        ? ["Show more options", "Check delivery cost", "Add all to cart"]
                        : ["Browse cakes", "Chocolate gifts", "Biscuit hampers", "Track my order"],
                    isStreaming: true,
                  }
                : message
            )
          );
        };

        const handleStreamEvent = async (rawEvent: string) => {
          const lines = rawEvent.split("\n");
          const event = lines.find((line) => line.startsWith("event:"))?.slice(6).trim() || "message";
          const dataText = lines
            .filter((line) => line.startsWith("data:"))
            .map((line) => line.slice(5).trim())
            .join("\n");
          const data = (dataText ? JSON.parse(dataText) : {}) as ChatApiPayload;

          if (event === "starter") {
            addAssistant();
            starterText = data.reply || "";
            await revealAssistantMessage(assistantId, starterText, { keepStreaming: true });
          }

          if (event === "final") {
            addAssistant();
            finalData = data;
            applyFinalMeta(data);
            const finalReply = data.reply || "I couldn't process that. Try again?";
            await revealAssistantMessage(assistantId, finalReply);
          }

          if (event === "error") {
            addAssistant();
            await revealAssistantMessage(assistantId, data.reply || "Something went wrong connecting to the server.");
          }
        };

        const contentType = res.headers.get("content-type") || "";
        if (contentType.includes("text/event-stream") && res.body) {
          const reader = res.body.getReader();
          const decoder = new TextDecoder();
          let buffer = "";

          while (true) {
            const { value, done } = await reader.read();
            if (done) break;
            buffer += decoder.decode(value, { stream: true });
            const events = buffer.split("\n\n");
            buffer = events.pop() ?? "";
            for (const event of events) {
              if (event.trim()) await handleStreamEvent(event);
            }
          }

          if (buffer.trim()) await handleStreamEvent(buffer);
        } else {
          const data = (await res.json()) as ChatApiPayload;
          addAssistant();
          finalData = data;
          applyFinalMeta(data);
          await revealAssistantMessage(assistantId, data.reply || "I couldn't process that. Try again?");
        }

        if (finalData?.products?.length && !selectedProduct) {
          setSelectedProduct({ product: finalData.products[0] });
          setRightTab("product");
          setDetailOpen(true);
        }
      } catch {
        setMessages((prev) => [
          ...prev,
          {
            id: crypto.randomUUID(),
            role: "assistant",
            text: "Something went wrong connecting to the server. Please try again! 🙏",
          },
        ]);
      } finally {
        setLoading(false);
        inputRef.current?.focus();
      }
    },
    [input, chatBusy, conversationHistory, selectedProduct, revealAssistantMessage, city, orderDraft, cart, deliveryQuote, checkout, deliveryDate, syncShownProducts]
  );

  function applyChatPayloadToSurface(data: ChatApiPayload, assistantId: string) {
    data.products?.forEach((product) => prefetchProductDetail(product.id));
    if (data.products?.length) syncShownProducts(data.products);
    const delivery = data.delivery
      ? isDeliveryResult(data.delivery)
        ? data.delivery
        : normalizeDeliveryResult(data.delivery, city)
      : null;
    if (delivery) {
      setDeliveryQuote(delivery);
      setCity(delivery.city);
      setRightTab("product");
      setDetailOpen(true);
    }
    applyCartActions(data.cartActions, data.products ?? []);
    setMessages((prev) =>
      prev.map((message) =>
        message.id === assistantId
          ? {
              ...message,
              text: data.reply || message.text,
              products: data.products?.length ? data.products : undefined,
              delivery: delivery ?? undefined,
              label: data.label || "AI_RECOMMENDATION",
              quickReplies: data.quickReplies?.length
                ? data.quickReplies
                : data.products?.length
                  ? ["Show more options", "Check delivery cost", "Add all to cart"]
                  : ["Browse cakes", "Chocolate gifts", "Biscuit hampers", "Track my order"],
              isStreaming: false,
            }
          : message
      )
    );
    if (data.products?.length && !selectedProduct) {
      setSelectedProduct({ product: data.products[0] });
      setRightTab("product");
      setDetailOpen(true);
    }
  }

  const addVoiceUserMessage = useCallback((text: string) => {
    const normalizedText = text.trim();
    if (!normalizedText) return;
    updateConversationLanguage(normalizedText);
    voiceBridgeRef.current.handleUserText(normalizedText);
    setMessages((prev) => {
      const last = prev[prev.length - 1];
      if (last?.role === "user" && last.source === "voice" && last.text === normalizedText) return prev;
      const userMsg: ChatMessage = { id: crypto.randomUUID(), role: "user", text: normalizedText, source: "voice" };
      // If the last message is a streaming voice assistant message that hasn't
      // finished yet, insert the user message BEFORE it so chat order matches
      // the real conversation sequence (user spoke first, model responded).
      if (
        last?.role === "assistant" &&
        last.source === "voice" &&
        last.isStreaming
      ) {
        return [...prev.slice(0, -1), userMsg, last];
      }
      return [...prev, userMsg];
    });
  }, []);

  const upsertVoiceAssistantMessage = useCallback((text: string, final = false) => {
    const normalizedText = cleanVoiceTranscript(text);
    if (!normalizedText) return;
    const existingId = liveAssistantMessageIdRef.current;
    const suppressAsStatus = isVoiceStatusOnly(normalizedText);
    const suppressAsProductChatter =
      Date.now() - lastVoiceProductsShownAtRef.current < 7000 &&
      isPostProductResultChatter(normalizedText);

    if (!final && !existingId) {
      return;
    }

    if ((suppressAsStatus || suppressAsProductChatter) && (!existingId || final)) {
      liveAssistantMessageIdRef.current = null;
      if (final) {
        voiceBridgeRef.current.handleAssistantText(normalizedText);
      }
      return;
    }

    const recentFinal = lastFinalVoiceAssistantRef.current;
    if (
      !liveAssistantMessageIdRef.current &&
      recentFinal &&
      Date.now() - recentFinal.at < 15000 &&
      isNearDuplicateTranscript(normalizedText, recentFinal.text)
    ) {
      return;
    }

    setMessages((prev) => {
      if (existingId) {
        const existingIndex = prev.findIndex((message) => message.id === existingId);
        if (existingIndex >= 0) {
          return prev.map((message) =>
            message.id === existingId
              ? { ...message, text: normalizedText, source: "voice", isStreaming: !final }
              : message
          );
        }
        liveAssistantMessageIdRef.current = null;
      }

      const id = crypto.randomUUID();
      liveAssistantMessageIdRef.current = id;
      return [
        ...prev,
        {
          id,
          role: "assistant",
          text: normalizedText,
          source: "voice",
          label: "AI_RECOMMENDATION",
          isStreaming: !final,
        },
      ];
    });

    if (final) {
      lastFinalVoiceAssistantRef.current = { text: normalizedText, at: Date.now() };
      voiceBridgeRef.current.handleAssistantText(normalizedText);
      liveAssistantMessageIdRef.current = null;
    }
  }, []);

  const voiceSearchResultText = useCallback((hasProducts: boolean) => {
    if (hasProducts) {
      if (conversationLanguageRef.current === "ta") {
        return "இதோ closest options. Number சொல்லுங்க, name சொல்லுங்க, இல்ல tap பண்ணுங்க.";
      }
      if (conversationLanguageRef.current === "si") {
        return "මෙන්න closest options ටික. Number එකක් කියන්න, name එක කියන්න, නැත්නම් tap කරන්න.";
      }
      return "Here are the closest options. Say a number, say a name, or tap one.";
    }
    if (conversationLanguageRef.current === "ta") {
      return "Aiyo, இந்த specific item exact match ஆக கிடைக்கல. வேற option பார்க்கலாமா?";
    }
    if (conversationLanguageRef.current === "si") {
      return "Aiyo, මේ specific එක Kapruka එකේ clean match වෙන්නේ නෑ වගේ. වෙන option එකක් බලමුද?";
    }
    return "Aiyo, I could not find a clean match for that exact item. Want to try a nearby option?";
  }, []);

  const ensureVoiceProductsMessage = useCallback((products: Product[]) => {
    if (!products.length) return;
    lastVoiceProductsShownAtRef.current = Date.now();
    const productIds = new Set(products.map((product) => product.id));
    setMessages((prev) => {
      const alreadyVisible = prev.some((message) =>
        message.source === "voice" &&
        message.products?.some((product) => productIds.has(product.id))
      );
      if (alreadyVisible) return prev;
      return [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          source: "voice",
          text: voiceSearchResultText(true),
          products,
          label: "SEARCH_RESULT",
          quickReplies: ["Check delivery cost", "Add selected to cart"],
        },
      ];
    });
  }, [voiceSearchResultText]);

  const searchProductsDuringVoice = useCallback(async (query: string, args: VoiceSearchArgs = {}) => {
    const explicitQuery = args.q ?? args.query;
    const requestedQuery = String(explicitQuery ?? query).trim();
    if (!requestedQuery) return [];
    const wantsMore = args.mode === "more" || isMoreOptionsRequest(query) || isMoreOptionsRequest(requestedQuery);
    const strippedMoreQuery = wantsMore ? stripMoreOptionsWords(requestedQuery) : "";
    const normalizedQuery = wantsMore
      ? strippedMoreQuery || lastVoiceSearchRef.current?.query || inferSearchQueryFromProducts(latestVoiceProductsRef.current) || requestedQuery
      : requestedQuery;
    const searchQuery = normalizeProductSearchQuery(normalizedQuery);
    if (!searchQuery) return [];
    const baseDedupeKey = voiceSearchKey(searchQuery, args) || searchQuery.toLowerCase();
    const historyForQuery = voiceSearchHistoryRef.current?.key === baseDedupeKey
      ? voiceSearchHistoryRef.current
      : null;
    const seenIds = wantsMore
      ? new Set<string>(historyForQuery?.ids ?? latestVoiceProductsRef.current.map((product) => product.id))
      : new Set<string>();
    const dedupeKey = wantsMore
      ? `${baseDedupeKey}|more|${Array.from(seenIds).sort().join(",")}`
      : baseDedupeKey;
    const now = Date.now();
    const recentSearch = recentVoiceSearchRef.current.get(dedupeKey);
    if (!wantsMore && recentSearch && now - recentSearch.at < 4500) {
      ensureVoiceProductsMessage(recentSearch.products);
      return recentSearch.products;
    }
    const lastMissAt = voiceSearchMissRef.current.get(dedupeKey);
    if (lastMissAt && now - lastMissAt < 30000) {
      return [];
    }
    const activeSearch = voiceSearchInFlightRef.current.get(dedupeKey);
    if (activeSearch) {
      return activeSearch;
    }
    if (voiceSearchInFlightRef.current.size > 0 && now - voiceSearchStartedAtRef.current < 2600) {
      const [, existingSearch] = Array.from(voiceSearchInFlightRef.current.entries())[0] ?? [];
      if (existingSearch) return existingSearch;
    }

    let resolveInFlight!: (products: Product[]) => void;
    const inFlightPromise = new Promise<Product[]>((resolve) => {
      resolveInFlight = resolve;
    });
    voiceSearchInFlightRef.current.set(dedupeKey, inFlightPromise);
    voiceSearchStartedAtRef.current = now;
    const finishVoiceSearch = (products: Product[]) => {
      recentVoiceSearchRef.current.set(dedupeKey, { at: Date.now(), products });
      for (const [key, value] of recentVoiceSearchRef.current) {
        if (Date.now() - value.at > 15000) {
          recentVoiceSearchRef.current.delete(key);
        }
      }
      resolveInFlight(products);
      if (voiceSearchInFlightRef.current.get(dedupeKey) === inFlightPromise) {
        voiceSearchInFlightRef.current.delete(dedupeKey);
      }
      return products;
    };

    const hasExplicitQuery = explicitQuery != null && String(explicitQuery).trim().length > 0;
    const limit = Math.max(1, Math.min(8, Number(args.limit ?? 8) || 8));
    const requestLimit = wantsMore ? Math.min(24, Math.max(limit + seenIds.size + 8, limit * 2)) : limit;
    const maxPrice = args.max_price == null ? null : Number(args.max_price);
    const priceFilter = typeof maxPrice === "number" && Number.isFinite(maxPrice) ? maxPrice : undefined;

    const searchBody = (searchQuery: string, forceExactQuery: boolean) => ({
      query: searchQuery,
      ...(forceExactQuery ? { q: searchQuery } : {}),
      category: args.category ?? undefined,
      limit: requestLimit,
      max_price: priceFilter,
      sort: args.sort ?? "relevance",
      source: "voice",
      context: {
        occasion: voiceSession.detectedOccasion,
        budget: voiceSession.detectedBudget,
        city: voiceSession.detectedCity || city,
      },
    });

    const runSearch = async (body: Record<string, unknown>) => {
      const response = await fetch("/api/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = (await response.json()) as { results?: Product[]; error?: string };
      if (!response.ok) throw new Error(data.error || "Voice product search failed");
      return data.results ?? [];
    };

    const assistantId = crypto.randomUUID();
    setMessages((prev) => [
      ...prev,
      {
        id: assistantId,
        role: "assistant",
        source: "voice",
        text: "Api balamu... Kapruka eke options tika hoyanawa.",
        label: "AI_RECOMMENDATION",
        isStreaming: true,
      },
    ]);

    try {
      const rawProducts = await runSearch(searchBody(searchQuery, hasExplicitQuery && !wantsMore));
      const products = wantsMore
        ? rawProducts.filter((product) => !seenIds.has(product.id)).slice(0, limit)
        : rawProducts.slice(0, limit);

      products.forEach((product) => prefetchProductDetail(product.id));
      if (!products.length) {
        voiceSearchMissRef.current.set(dedupeKey, Date.now());
      } else {
        voiceSearchMissRef.current.delete(dedupeKey);
      }
      if (!wantsMore || products.length) {
        syncShownProducts(products);
      }
      if (products.length) {
        const nextIds = wantsMore ? new Set(seenIds) : new Set<string>();
        products.forEach((product) => nextIds.add(product.id));
        voiceSearchHistoryRef.current = { key: baseDedupeKey, ids: nextIds };
        lastVoiceSearchRef.current = { query: searchQuery, key: baseDedupeKey, args };
      }
      if (products[0]) {
        setSelectedProduct({ product: products[0] });
        setRightTab("product");
        setDetailOpen(true);
      }
      if (products.length) {
        lastVoiceProductsShownAtRef.current = Date.now();
      }

      const searchResultText = products.length && wantsMore
        ? "Here are more options I found. Say a number, say a name, or tap one."
        : wantsMore
          ? "I could not find new options beyond the ones already shown. Want me to try a different type?"
          : voiceSearchResultText(products.length > 0);
      /*
        if (products.length) {
          if (conversationLanguageRef.current === "ta") {
            return "இதோ closest options. Number சொல்லுங்க, name சொல்லுங்க, இல்ல tap பண்ணுங்க.";
          }
          if (conversationLanguageRef.current === "si") {
            return "මෙන්න closest options ටික. Number එකක් කියන්න, name එක කියන්න, නැත්නම් tap කරන්න.";
          }
          return "Here are the closest options. Say a number, say a name, or tap one.";
        }
        if (conversationLanguageRef.current === "ta") {
          return "Aiyo, இந்த specific item exact match ஆக கிடைக்கல. வேற cake type பார்க்கலாமா, இல்ல chocolate cake options பார்க்கலாமா?";
        }
        if (conversationLanguageRef.current === "si") {
          return "Aiyo, මේ specific එක Kapruka එකේ clean match වෙන්නේ නෑ වගේ. වෙන cake type එකක් බලමුද, නැත්නම් chocolate cake options බලමුද?";
        }
        return "Aiyo, I could not find a clean match for that exact item. Want to try another cake type or chocolate cake options?";
      */

      setMessages((prev) =>
        prev.map((message) =>
          message.id === assistantId
            ? {
                ...message,
                text: searchResultText,
                products: products.length ? products : undefined,
                label: products.length ? "SEARCH_RESULT" : "AI_RECOMMENDATION",
                quickReplies: products.length ? ["Show more options", "Check delivery cost", "Add selected to cart"] : ["Show chocolate cakes", "Try birthday cakes", "Try gift hampers"],
                isStreaming: false,
              }
            : message
        )
      );
      return finishVoiceSearch(products);
    } catch (error) {
      const fallback = error instanceof Error ? error.message : "Aiyo, voice search failed. Try again?";
      setMessages((prev) =>
        prev.map((message) =>
          message.id === assistantId
            ? {
                ...message,
                text: fallback,
                isStreaming: false,
              }
            : message
        )
      );
      return finishVoiceSearch([]);
    }
  }, [city, ensureVoiceProductsMessage, syncShownProducts, voiceSearchResultText, voiceSession.detectedBudget, voiceSession.detectedCity, voiceSession.detectedOccasion]);

  const handleVoiceShoppingIntent = useCallback(async (text: string, args: VoiceSearchArgs = {}) => {
    const lowerText = text.toLowerCase();
    const hasSelectionIntent =
      /\b(number|no\.?|#?\d+|first|second|third|fourth|fifth|cheap|cheapest|best|add|cart|select|choose|pick|ganna|damu|karamu)\b/.test(lowerText) ||
      voiceSession.shownProducts.some((product) => product.name.length > 8 && lowerText.includes(product.name.toLowerCase()));
    const selected = hasSelectionIntent ? resolveProductReference(text, voiceSession.shownProducts) : null;
    if (selected) {
      const fullProducts = [
        ...latestVoiceProductsRef.current,
        ...messages.flatMap((message) => message.products ?? []),
      ];
      const matched = fullProducts
        .find((product) => product.id === selected.id);
      if (matched) {
        setSelectedProduct({ product: matched });
        prefetchProductDetail(matched.id);
        setRightTab("product");
        setDetailOpen(true);
        voiceBridgeRef.current.updateGeminiContext(voiceSession.shownProducts, cart);
        if (/\b(add|cart|damu|danna|karamu|ganna)\b/i.test(text)) {
          addToCart(matched);
          const reply = `${selected.index} number eka cart ekata add kala - ${selected.name}. Continue shopping da, checkout da?`;
          upsertVoiceAssistantMessage(reply, true);
          voiceBridgeRef.current.updateGeminiContext(voiceSession.shownProducts, cart);
          return [matched];
        }
        const reply = `${selected.index} number eka select kala - ${selected.name}. Cart eke add karamu da?`;
        upsertVoiceAssistantMessage(reply, true);
        voiceBridgeRef.current.updateGeminiContext(voiceSession.shownProducts, cart);
        return [matched];
      }
    }
    return searchProductsDuringVoice(text, args);
  }, [cart, messages, searchProductsDuringVoice, upsertVoiceAssistantMessage, voiceSession.shownProducts]);

  const findVoiceProduct = useCallback((args: VoiceCartAddArgs) => {
    const products = [
      ...latestVoiceProductsRef.current,
      ...messages.flatMap((message) => message.products ?? []),
      ...(selectedProduct ? [selectedProduct.product] : []),
    ];
    const uniqueProducts = Array.from(new Map(products.map((product) => [product.id, product])).values());

    const productId = String(args.product_id ?? args.productId ?? "").trim();
    if (productId) {
      const byId = uniqueProducts.find((product) => product.id === productId);
      if (byId) return byId;
    }

    const index = Number(args.product_index ?? args.productIndex);
    if (Number.isInteger(index) && index > 0) {
      const shown = voiceSession.shownProducts[index - 1];
      if (shown) {
        const byShownId = uniqueProducts.find((product) => product.id === shown.id);
        if (byShownId) return byShownId;
      }
      if (latestVoiceProductsRef.current[index - 1]) return latestVoiceProductsRef.current[index - 1];
    }

    const productName = String(args.product_name ?? args.productName ?? "").trim().toLowerCase();
    if (productName) {
      const nameWords = productName.split(/\s+/).filter((word) => word.length > 2);
      return uniqueProducts.find((product) => {
        const name = product.name.toLowerCase();
        return name.includes(productName) || nameWords.some((word) => name.includes(word));
      }) ?? null;
    }

    return selectedProduct?.product ?? latestVoiceProductsRef.current[0] ?? null;
  }, [messages, selectedProduct, voiceSession.shownProducts]);

  const handleVoiceCartAdd = useCallback((args: VoiceCartAddArgs) => {
    const rawAction = String(args.action ?? "add").toLowerCase().replace("-", "_");
    const action = rawAction === "set" || rawAction === "update" ? "set_quantity" : rawAction;

    if (action === "clear") {
      setCart([]);
      setCartOpen(true);
      setRightTab("cart");
      setDetailOpen(true);
      return {
        ok: true,
        action,
        cart_count_after_request: 0,
      };
    }
    if (action === "add_all_visible") {
      const products = latestVoiceProductsRef.current.length
        ? latestVoiceProductsRef.current
        : messages.flatMap((message) => message.products ?? []).slice(0, 8);
      if (!products.length) {
        return { ok: false, error: "No visible products to add." };
      }
      products.slice(0, 8).forEach((product) => addToCart(product));
      setCartOpen(true);
      setRightTab("cart");
      setDetailOpen(true);
      return {
        ok: true,
        action,
        quantity: products.length,
        cart_count_after_request: cart.reduce((sum, item) => sum + item.quantity, 0) + products.length,
      };
    }

    const resolveCartProduct = () => {
      const productId = String(args.product_id ?? args.productId ?? "").trim();
      const productName = String(args.product_name ?? args.productName ?? "").trim().toLowerCase();
      const index = Number(args.product_index ?? args.productIndex);

      if (productId) {
        const byId = cart.find((item) => item.product.id === productId)?.product;
        if (byId) return byId;
      }
      if (Number.isInteger(index) && index > 0) {
        const byIndex = cart[index - 1]?.product;
        if (byIndex) return byIndex;
      }
      if (productName) {
        const words = productName.split(/\s+/).filter((word) => word.length > 2);
        return cart.find((item) => {
          const name = item.product.name.toLowerCase();
          return name.includes(productName) || words.every((word) => name.includes(word));
        })?.product ?? cart.find((item) => {
          const name = item.product.name.toLowerCase();
          return words.some((word) => name.includes(word));
        })?.product ?? null;
      }
      return null;
    };

    const product = action === "remove" || action === "set_quantity"
      ? resolveCartProduct()
      : findVoiceProduct(args);
    if (!product) {
      return {
        ok: false,
        error: action === "add"
          ? "No visible product matched. Ask the user which product number to add."
          : "No cart item matched. Ask the user which cart item to change.",
      };
    }

    const quantity = Math.max(1, Math.min(10, Number(args.quantity ?? 1) || 1));
    if (action === "remove") {
      setCart((prev) => prev.filter((item) => item.product.id !== product.id));
    } else if (action === "set_quantity") {
      setCart((prev) =>
        prev.map((item) => item.product.id === product.id ? { ...item, quantity } : item)
          .filter((item) => item.quantity > 0)
      );
    } else {
      for (let i = 0; i < quantity; i++) {
        addToCart(product);
      }
    }
    setSelectedProduct({ product });
    prefetchProductDetail(product.id);
    setCartOpen(true);
    setRightTab("cart");
    setDetailOpen(true);

    return {
      ok: true,
      action,
      product_id: product.id,
      name: product.name,
      quantity,
      price: product.price?.amount ?? null,
      cart_count_after_request: action === "remove"
        ? Math.max(0, cart.reduce((sum, item) => sum + item.quantity, 0) - (cart.find((item) => item.product.id === product.id)?.quantity ?? 0))
        : action === "set_quantity"
          ? cart.reduce((sum, item) => sum + (item.product.id === product.id ? quantity : item.quantity), 0)
          : cart.reduce((sum, item) => sum + item.quantity, 0) + quantity,
    };
  }, [cart, findVoiceProduct]);

  const handleVoiceDeliveryCheck = useCallback(async (args: VoiceDeliveryCheckArgs) => {
    const requestedCity = cleanOrderValue(String(args.city ?? ""));
    if (!requestedCity) {
      return {
        ok: false,
        error: "Missing delivery city.",
        say_next: currentOrderLanguage() === "en"
          ? "Which city should I check delivery for? For Colombo, please include the number, like Colombo 03."
          : "Delivery check karanna city eka mokakda? Colombo nam Colombo 03 wage number ekath kiyanna.",
      };
    }

    const normalizedCity = normalizeDeliveryCityCandidate(requestedCity, deliveryCityOptions);
    if (/^colombo$/i.test(requestedCity)) {
      return {
        ok: false,
        error: "Colombo needs a zone number.",
        say_next: currentOrderLanguage() === "en"
          ? "Colombo needs the exact delivery zone. Is it Colombo 01, Colombo 02, Colombo 03, or another Colombo number?"
          : "Colombo nam exact delivery zone eka one. Colombo 01, Colombo 02, Colombo 03 wage mokakda?",
      };
    }
    if (!normalizedCity && deliveryCityOptions.length > 5) {
      return {
        ok: false,
        error: `Unknown delivery city: ${requestedCity}`,
        say_next: currentOrderLanguage() === "en"
          ? `I can't find "${requestedCity}" in Kapruka delivery cities. Can you say the nearest main city?`
          : `"${requestedCity}" Kapruka delivery city list eke hoyaganna bari una. Langa main city eka kiyanna puluwanda?`,
      };
    }

    const hasProductReference = Boolean(
      args.product_id ?? args.productId ?? args.product_index ?? args.productIndex ?? args.product_name ?? args.productName
    );
    const product = hasProductReference
      ? findVoiceProduct({
          product_id: args.product_id,
          productId: args.productId,
          product_index: args.product_index,
          productIndex: args.productIndex,
          product_name: args.product_name,
          productName: args.productName,
        })
      : null;
    const checkCity = normalizedCity ?? requestedCity;
    const checkDate = sriLankaDateFromText(String(args.deliveryDate ?? args.delivery_date ?? deliveryDate));

    try {
      const res = await fetch("/api/delivery", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          city: checkCity,
          delivery_date: checkDate,
          product_id: args.product_id ?? args.productId ?? product?.id ?? null,
        }),
      });
      const data = (await res.json()) as { reply?: string; delivery?: unknown; error?: string };
      if (!res.ok) throw new Error(data.error || "Delivery check failed");
      const delivery = data.delivery
        ? isDeliveryResult(data.delivery)
          ? data.delivery
          : normalizeDeliveryResult(data.delivery, checkCity)
        : null;
      if (!delivery) throw new Error("Delivery check did not return a quote.");

      setDeliveryQuote(delivery);
      setCity(delivery.city);
      setDeliveryDate(delivery.checkedDate || checkDate);

      return {
        ok: true,
        city: delivery.city,
        requested_date: checkDate,
        available: delivery.available,
        checked_date: delivery.checkedDate,
        next_available_date: delivery.nextAvailableDate,
        rate: delivery.rate,
        fee_text: delivery.rate > 0 ? `Rs. ${new Intl.NumberFormat("en-LK").format(delivery.rate)}` : "Free",
        reply: data.reply || formatDeliveryResponse(delivery),
        itemType: args.itemType ?? null,
        product: product ? { id: product.id, name: product.name } : null,
        say_next: data.reply || formatDeliveryResponse(delivery),
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Delivery check failed.";
      return {
        ok: false,
        error: message,
        say_next: currentOrderLanguage() === "en"
          ? `${message} Want to try another city or date?`
          : `${message} Wena city ekak hari date ekak hari try karamu da?`,
      };
    }
  }, [deliveryCityOptions, deliveryDate, findVoiceProduct]);

  function orderToolState(draft: OrderDraft | null = orderDraft) {
    if (!draft) {
      return {
        stage: "idle",
        cart_count: cart.reduce((sum, item) => sum + item.quantity, 0),
      };
    }

    const missing = getMissingFields(draft);
    const nextQuestion = missing[0] ? orderQuestion(missing[0], currentOrderLanguage()) : undefined;
    const readyToConfirm = missing.length === 0;
    return {
      stage: draft.stage,
      missing,
      next_question: nextQuestion,
      say_next: nextQuestion ?? (readyToConfirm && draft.stage !== "complete"
        ? "Okay, I have the details. Please check the order summary in the chat. Shall I create the order?"
        : undefined),
      ready_to_confirm: readyToConfirm,
      checkout_url: draft.checkoutUrl,
      order_ref: draft.orderRef,
      items: draft.items.map((item) => ({
        product_id: item.productId,
        name: item.productName,
        quantity: item.quantity,
      })),
      recipient: draft.recipientName,
      phone: draft.recipientPhone,
      city: draft.deliveryCity,
      date: draft.deliveryDate,
      total: draft.grandTotal ?? orderGrandTotal(draft),
    };
  }

  const handleVoiceCheckoutAction = useCallback(async (action: "start" | "detail" | "place", args: VoiceCheckoutArgs = {}) => {
    if (action === "start") {
      const draft = orderDraft && ["collecting", "confirming"].includes(orderDraft.stage)
        ? orderDraft
        : draftFromCurrentCart();
      continueOrderDraft(draft);
      return { ok: true, action, ...orderToolState(draft) };
    }

    if (action === "detail") {
      const answer = String(args.answer ?? "").trim();
      if (!answer) {
        return { ok: false, error: "Missing checkout answer." };
      }
      if (looksLikeClarifyingQuestion(answer)) {
        return {
          ok: false,
          clarification_question: true,
          message: "The user asked a question instead of answering. Explain the current field naturally and ask the same detail again.",
          ...orderToolState(orderDraft),
        };
      }
      if (isCheckoutIntent(answer)) {
        return {
          ok: false,
          checkout_command_not_detail: true,
          message: "The user asked to checkout/order, not an answer to the current detail. Continue asking the current checkout question.",
          ...orderToolState(orderDraft),
        };
      }
      if (!orderDraft) {
        beginOrderCollection();
        return {
          ok: false,
          needs_checkout_start: true,
          message: "Checkout collection started. Ask the current question again.",
          ...orderToolState(draftFromCurrentCart()),
        };
      }
      if (orderDraft.stage !== "collecting") {
        const handled = handleLocalOrderMessage(answer, { appendUser: false });
        return { ok: handled, action, accepted_answer: answer, ...orderToolState(orderDraft) };
      }
      const nextDraft = applyOrderAnswer(answer);
      return {
        ok: Boolean(nextDraft),
        action,
        accepted_answer: Boolean(nextDraft) ? answer : undefined,
        message: nextDraft
          ? "Detail accepted. Continue with the next checkout question from next_question, or summarize if ready_to_confirm is true."
          : "That did not look like a valid answer for the current checkout field. The UI has asked again; repeat that naturally.",
        ...orderToolState(nextDraft ?? orderDraft),
      };
    }

    const draft = orderDraft;
    if (!draft) {
      beginOrderCollection();
      return {
        ok: false,
        needs_details: true,
        message: "Checkout details are not started yet.",
        ...orderToolState(draftFromCurrentCart()),
      };
    }

    if (draft.stage === "complete" && draft.checkoutUrl) {
      return {
        ok: true,
        action,
        checkout_url: draft.checkoutUrl,
        order_ref: draft.orderRef,
        grand_total: draft.grandTotal,
        expires_at: draft.expiresAt,
        already_created: true,
      };
    }

    const missing = getMissingFields(draft);
    if (missing.length) {
      continueOrderDraft(draft);
      return {
        ok: false,
        needs_details: true,
        missing,
        next_question: orderQuestion(missing[0], currentOrderLanguage()),
      };
    }

    const created = await placeOrderFromDraft({ ...draft, stage: "confirming" });
    return created
      ? {
          ok: true,
          action,
          say_next: "Yesss, the order is created. The payment link is ready now, and prices are locked for 60 minutes.",
          checkout_url: created.checkoutUrl,
          order_ref: created.orderRef,
          grand_total: created.summary.grandTotal,
          expires_at: created.expiresAt,
        }
      : { ok: false, action, error: "Order creation failed. The UI has the latest error." };
  }, [cart, checkout, city, deliveryDate, deliveryQuote, orderDraft, orderResult]);

  function normalizeVoiceBoolean(value: string | boolean | null | undefined) {
    if (typeof value === "boolean") return value;
    const text = String(value ?? "").trim().toLowerCase();
    if (!text) return false;
    if (/\b(true|yes|yep|yeah|anonymous|hide|ow|hari|seri)\b/.test(text)) return true;
    if (/\b(false|no|nope|show|name|ne|epa)\b/.test(text)) return false;
    return false;
  }

  function looksLikeCityOnlyAddress(address: string, cityName: string) {
    const normalizedAddress = address.trim().toLowerCase().replace(/[.,\s]+/g, " ");
    const normalizedCity = cityName.trim().toLowerCase().replace(/[.,\s]+/g, " ");
    if (!normalizedAddress || !normalizedCity) return false;
    if (normalizedAddress === normalizedCity) return true;
    const addressCity = findDeliveryCityInText(address, deliveryCityOptions);
    const hasStreetSignal = /\b(road|rd|street|st|lane|ln|mawatha|place|no\.?|number|house|flat|apartment|building|gedara|para|watta|junction|floor)\b/i.test(address);
    const wordCount = normalizedAddress.split(/\s+/).filter(Boolean).length;
    return Boolean(addressCity) && !hasStreetSignal && wordCount <= 3;
  }

  function voiceFieldToDraftKey(field: string): keyof OrderDraft | null {
    if (field === "streetAddress") return "deliveryAddress";
    if (field === "city") return "deliveryCity";
    if (
      field === "recipientName" ||
      field === "recipientPhone" ||
      field === "deliveryDate" ||
      field === "senderName" ||
      field === "anonymous" ||
      field === "giftMessage"
    ) {
      return field;
    }
    return null;
  }

  function normalizeVoiceOrderField(field: string, value: string) {
    const cleaned = cleanOrderValue(value);
    if (field === "recipientPhone") return cleaned.replace(/[^\d+]/g, "");
    if (field === "deliveryDate") return sriLankaDateFromText(cleaned);
    if (field === "anonymous") return normalizeVoiceBoolean(cleaned) ? "true" : "false";
    if (field === "giftMessage") return isSkipAnswer(cleaned) ? "" : cleaned.slice(0, 300);
    return cleaned;
  }

  function applyVoiceOrderField(args: VoiceOrderFieldArgs, corrected: boolean) {
    const items = checkoutItemsForDraft();
    if (!items.length) {
      return {
        ok: false,
        error: "Cart is empty. Ask the user to add an item first.",
        say_next: "Aiyo, cart eka empty ne. Product ekak add karala order hadamu.",
      };
    }

    const field = String(args.field ?? "").trim();
    const draftKey = voiceFieldToDraftKey(field);
    if (!draftKey) {
      return {
        ok: false,
        error: `Unsupported order field: ${field || "missing"}`,
        say_next: "Aiyo, field eka match une na. Eka ayeth ahanna.",
      };
    }

    let value = normalizeVoiceOrderField(field, String(args.value ?? ""));
    let displayValue = String(args.displayValue ?? value).trim() || (field === "giftMessage" && !value ? "None" : value);
    if (!value && field !== "giftMessage") {
      return {
        ok: false,
        error: "Missing field value.",
        field,
        say_next: "Aiyo, answer eka clear na. Eka ayeth kiyanna.",
      };
    }

    if (field === "recipientPhone" && !isLikelyContactNumber(value)) {
      return {
        ok: false,
        error: "Phone number is not valid.",
        say_next: "Phone number eka hariyata ahaganna one. 0771234567 wage number ekak kiyanna.",
      };
    }

    if (field === "streetAddress") {
      const detectedCity = findDeliveryCityInText(value, deliveryCityOptions);
      const existingCity = orderDraft?.deliveryCity ?? city;
      if (looksLikeCityOnlyAddress(value, detectedCity || existingCity)) {
        return {
          ok: false,
          error: "Street address is missing. User only gave the city.",
          field,
          say_next: "City eka hari. Full address eka mokakda - house number, road/lane, area eka?",
        };
      }
    }

    if (field === "city" && /^colombo$/i.test(value.trim())) {
      const english = currentOrderLanguage() === "en";
      return {
        ok: false,
        error: "Colombo needs a zone number.",
        field,
        say_next: english
          ? "Colombo needs the delivery zone. Is it Colombo 01, Colombo 02, Colombo 03, or another Colombo number?"
          : "Colombo nam delivery zone number eka one. Colombo 01, Colombo 02, Colombo 03 wage mokakda?",
      };
    }

    if (field === "city") {
      const normalizedCity = normalizeDeliveryCityCandidate(value, deliveryCityOptions);
      const canValidateCity = deliveryCityOptions.length > 5;
      if (!normalizedCity && canValidateCity) {
        const english = currentOrderLanguage() === "en";
        return {
          ok: false,
          error: `Unknown delivery city: ${value}`,
          field,
          say_next: english
            ? `I can't find "${value}" in Kapruka delivery cities. Can you say the nearest main city? For example: Colombo 03, Kandy, Galle, or Balangoda.`
            : `"${value}" Kapruka delivery city list eke hoyaganna bari una. Langa main city eka kiyanna puluwanda? Colombo 03, Kandy, Galle, Balangoda wage.`,
        };
      }
      if (normalizedCity) {
        value = normalizedCity;
        displayValue = normalizedCity;
      }
    }

    const baseDraft: OrderDraft = orderDraft && ["collecting", "confirming", "error"].includes(orderDraft.stage)
      ? orderDraft
      : draftFromCurrentCart("collecting");
    const now = Date.now();
    const nextDraft: OrderDraft = {
      ...baseDraft,
      items,
      stage: "collecting",
      locationType: baseDraft.locationType ?? "house",
      displayValues: {
        ...(baseDraft.displayValues ?? {}),
        [field]: displayValue,
      },
      editingField: undefined,
      lastFilledField: corrected ? baseDraft.lastFilledField : field,
      lastFilledAt: corrected ? baseDraft.lastFilledAt : now,
      lastCorrectedField: corrected ? field : baseDraft.lastCorrectedField,
      lastCorrectedAt: corrected ? now : baseDraft.lastCorrectedAt,
    };

    if (draftKey === "recipientName") nextDraft.recipientName = value;
    if (draftKey === "recipientPhone") nextDraft.recipientPhone = value;
    if (draftKey === "deliveryAddress") nextDraft.deliveryAddress = value;
    if (draftKey === "deliveryCity") nextDraft.deliveryCity = value;
    if (draftKey === "deliveryDate") nextDraft.deliveryDate = value;
    if (draftKey === "senderName") nextDraft.senderName = value;
    if (draftKey === "giftMessage") nextDraft.giftMessage = value;
    if (draftKey === "anonymous") nextDraft.anonymous = normalizeVoiceBoolean(value);

    if (field === "city") setCity(value);
    if (field === "deliveryDate") setDeliveryDate(value);
    setCheckout((prev) => ({
      ...prev,
      recipientName: nextDraft.recipientName ?? prev.recipientName,
      recipientPhone: nextDraft.recipientPhone ?? prev.recipientPhone,
      address: nextDraft.deliveryAddress ?? prev.address,
      senderName: nextDraft.senderName ?? prev.senderName,
      anonymous: nextDraft.anonymous ?? prev.anonymous,
      giftMessage: nextDraft.giftMessage ?? prev.giftMessage,
    }));
    setOrderResult(null);
    setOrderDraft(nextDraft);
    saveOrderDraft(nextDraft);
    setRightTab("order");
    setDetailOpen(true);

    const followUp = field === "city" && !nextDraft.deliveryAddress?.trim()
      ? currentOrderLanguage() === "en"
        ? "Got the city. I still need the street address first - house number, road or lane, and area."
        : "City eka hari. Thawa street address eka one - house number, road/lane, area eka kiyanna."
      : undefined;

    return {
      ok: true,
      result: corrected ? "corrected" : "filled",
      field,
      value,
      displayValue,
      say_next: followUp,
      missing: getMissingFields(nextDraft),
      draft: {
        recipientName: nextDraft.recipientName,
        recipientPhone: nextDraft.recipientPhone,
        streetAddress: nextDraft.deliveryAddress,
        city: nextDraft.deliveryCity,
        deliveryDate: nextDraft.deliveryDate,
        senderName: nextDraft.senderName,
        anonymous: nextDraft.anonymous,
        giftMessage: nextDraft.giftMessage,
        itemCount: items.length,
      },
    };
  }

  function handleVoiceOrderFieldFill(args: VoiceOrderFieldArgs) {
    return applyVoiceOrderField(args, false);
  }

  function handleVoiceOrderFieldCorrection(args: VoiceOrderFieldArgs) {
    return applyVoiceOrderField(args, true);
  }

  function handleVoiceOrderReady(args: VoiceOrderReadyArgs = {}) {
    const draft = orderDraft;
    if (!draft) {
      return {
        ok: false,
        error: "No order form is active.",
        say_next: "Aiyo, order form eka start wela na. Details tika collect karamu.",
      };
    }

    const requiredMissing = [
      !draft.recipientName?.trim() ? "recipientName" : null,
      !draft.recipientPhone?.trim() ? "recipientPhone" : null,
      !draft.deliveryAddress?.trim() ? "streetAddress" : null,
      !draft.deliveryCity?.trim() ? "city" : null,
      !draft.deliveryDate?.trim() ? "deliveryDate" : null,
      !draft.senderName?.trim() ? "senderName" : null,
    ].filter(Boolean);

    if (requiredMissing.length) {
      return {
        ok: false,
        missing: requiredMissing,
        say_next: "Thawa podi details tikak missing. Eka fill karala confirm karamu.",
      };
    }

    if (/^colombo$/i.test(draft.deliveryCity?.trim() ?? "")) {
      return {
        ok: false,
        error: "Colombo needs a zone number.",
        missing: ["city"],
        say_next: currentOrderLanguage() === "en"
          ? "There is a problem with the delivery city. Colombo needs a number, like Colombo 01, Colombo 02, or Colombo 03. Which one should I use?"
          : "Delivery city eke podi problem ekak thiyenawa. Colombo nam Colombo 01, Colombo 02, Colombo 03 wage number ekak one. Mokakda use karanne?",
      };
    }

    const normalizedCity = normalizeDeliveryCityCandidate(draft.deliveryCity ?? "", deliveryCityOptions);
    if (!normalizedCity && deliveryCityOptions.length > 5) {
      return {
        ok: false,
        error: `Unknown delivery city: ${draft.deliveryCity}`,
        missing: ["city"],
        say_next: currentOrderLanguage() === "en"
          ? `There is a problem with the delivery city "${draft.deliveryCity}". Can you say the nearest Kapruka delivery city again? For example: Colombo 03, Kandy, Galle, or Balangoda.`
          : `Delivery city "${draft.deliveryCity}" eke problem ekak thiyenawa. Langa Kapruka delivery city eka ayeth kiyanna puluwanda? Colombo 03, Kandy, Galle, Balangoda wage.`,
      };
    }

    const confirmingDraft: OrderDraft = {
      ...draft,
      deliveryCity: normalizedCity ?? draft.deliveryCity,
      giftMessage: draft.giftMessage ?? "",
      anonymous: draft.anonymous ?? false,
      stage: "confirming",
      grandTotal: orderGrandTotal(draft),
      lastFilledField: "ready",
      lastFilledAt: Date.now(),
    };
    setOrderDraft(confirmingDraft);
    saveOrderDraft(confirmingDraft);
    setRightTab("order");
    setDetailOpen(true);
    setVoiceFormFillKey((value) => value + 1);

    return {
      ok: true,
      result: "ready",
      summary: args.allFieldsSummary ?? "",
      say_next: currentOrderLanguage() === "en"
        ? "All set. Please check the details on the right - are they correct?"
        : "Api ready! Screen eke details check karanna - correct da?",
    };
  }

  function voiceOrderFailureMessage(errorMessage: string) {
    const language = currentOrderLanguage();
    const needsColomboZone = /colombo/i.test(orderDraft?.deliveryCity ?? "") && /city|deliver|delivery|available/i.test(errorMessage);
    if (language === "en") {
      if (needsColomboZone) {
        return "Kapruka needs the exact Colombo delivery zone. Can you change the city to Colombo 01, Colombo 02, Colombo 03, or the correct Colombo number?";
      }
      const cleanMessage = /cart|empty/i.test(errorMessage)
        ? "The cart is empty."
        : /stock|out.?of.?stock/i.test(errorMessage)
          ? "One of the items may be out of stock."
          : /city|deliver|delivery|available|date/i.test(errorMessage)
            ? "There is a delivery city or date issue."
            : "Something went wrong while creating the order.";
      return `${cleanMessage} Want me to fix it and try again?`;
    }
    if (needsColomboZone) {
      return "Kapruka ekata exact Colombo delivery zone eka one. City eka Colombo 01, Colombo 02, Colombo 03 wage correct number ekata change karamu da?";
    }
    return `${errorMessage} City hari date eka change karala ayeth try karamu da?`;
  }

  async function handleVoiceConfirmAndPlace(args: VoiceConfirmOrderArgs) {
    const confirmedValue = args.confirmed;
    const confirmed = typeof confirmedValue === "boolean"
      ? confirmedValue
      : /\b(true|yes|yep|yeah|place|order|correct|seri|hari|ow|ok|okay)\b/i.test(String(confirmedValue ?? ""));

    if (!confirmed) {
      return {
        ok: false,
        cancelled: true,
        say_next: currentOrderLanguage() === "en"
          ? "Okay, I won't place it yet. Tell me what you want to change."
          : "Hari, place karanne na. Change karanna ona detail eka kiyanna.",
      };
    }

    const draft = orderDraft;
    if (!draft) {
      return {
        ok: false,
        error: "No order form is ready.",
        say_next: currentOrderLanguage() === "en"
          ? "Aiyo, the order form is not ready yet. Let's collect the details first."
          : "Aiyo, order form eka ready na. Details tika collect karamu.",
      };
    }

    const missing = getMissingFields(draft);
    if (missing.length) {
      return {
        ok: false,
        missing,
        say_next: currentOrderLanguage() === "en"
          ? "A few details are still missing. Let's fill those before placing the order."
          : "Podi details tikak missing ne. Eka fill karala order hadamu.",
      };
    }

    lastOrderErrorRef.current = "";
    const created = await placeOrderFromDraft({ ...draft, stage: "confirming" });
    if (!created) {
      const errorMessage = lastOrderErrorRef.current || "Order creation failed.";
      return {
        ok: false,
        error: errorMessage,
        say_next: voiceOrderFailureMessage(errorMessage),
      };
    }

    return {
      ok: true,
      checkout_url: created.checkoutUrl,
      order_ref: created.orderRef,
      grand_total: created.summary.grandTotal,
      expires_at: created.expiresAt,
      say_next: currentOrderLanguage() === "en"
        ? "Yesss, the order is created. The payment link is ready, and prices are locked for 60 minutes."
        : "Yesss, order eka haduwa! Payment link eka ready. Prices 60 minutes lock wela.",
    };
  }

  async function handleImageFile(file: File) {
    const validation = validateImageFile(file);
    if (!validation.valid) {
      addAssistantMessage(validation.error || "Aiyo, I couldn't read that image.");
      return;
    }

    let prepared: PreparedImage;
    try {
      prepared = await resizeImage(file);
    } catch (error) {
      addAssistantMessage(error instanceof Error ? error.message : "Aiyo, I couldn't process that image.");
      return;
    }

    imagePreviewUrlsRef.current.push(prepared.url);
    setPendingImage((current) => {
      if (current) URL.revokeObjectURL(current.url);
      return prepared;
    });
    inputRef.current?.focus();
  }

  async function sendPendingImageSearch() {
    if (!pendingImage || chatBusy) return;
    const prepared = pendingImage;
    const typedText = input.trim();
    const userText = typedText || "Find something like this";
    updateConversationLanguage(typedText || "image search");
    setPendingImage(null);
    setInput("");

    const userMessageId = crypto.randomUUID();
    const assistantId = crypto.randomUUID();
    const steps = conversationLanguageRef.current === "en"
      ? ["Analyzing image...", "Searching Kapruka...", "Found some matches!"]
      : ["Image eka balanne... 👀", "Kapruka eke hoyanne... 🔍", "Best matches tibunawa! ✨"];

    setMessages((prev) => [
      ...prev,
      {
        id: userMessageId,
        role: "user",
        text: userText,
        image: { url: prepared.url, mimeType: prepared.mimeType, searching: true },
      },
      {
        id: assistantId,
        role: "assistant",
        text: steps[0],
        label: "AI_RECOMMENDATION",
        isStreaming: true,
      },
    ]);
    setTypingMessageId(assistantId);

    let stepIndex = 0;
    const interval = window.setInterval(() => {
      stepIndex = Math.min(stepIndex + 1, steps.length - 1);
      setMessages((prev) => prev.map((message) => message.id === assistantId ? { ...message, text: steps[stepIndex] } : message));
    }, 1500);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userText,
          history: conversationHistory,
          image: {
            base64: prepared.base64,
            mimeType: prepared.mimeType,
            userText,
          },
          language: conversationLanguageRef.current,
          cart: cart.map((item) => ({ product: item.product, quantity: item.quantity })),
          visibleProducts: latestVisibleProducts(),
        }),
      });
      const data = (await res.json()) as ChatApiPayload;
      if (!res.ok) throw new Error(data.reply || "Image search failed");
      applyChatPayloadToSurface(data, assistantId);
    } catch (error) {
      setMessages((prev) =>
        prev.map((message) =>
          message.id === assistantId
            ? { ...message, text: error instanceof Error ? error.message : "Aiyo, image search failed. Try another photo?", isStreaming: false }
            : message
        )
      );
    } finally {
      window.clearInterval(interval);
      setTypingMessageId(null);
      setMessages((prev) => prev.map((message) => message.id === userMessageId && message.image ? { ...message, image: { ...message.image, searching: false } } : message));
      inputRef.current?.focus();
    }
  }

  function addToCart(product: Product) {
    setCartOpen(true);
    setRightTab("order");
    setDetailOpen(true);
    setCart((prev) => {
      const found = prev.find((item) => item.product.id === product.id);
      if (found) {
        return prev.map((item) =>
          item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
  }

  function openProductModal(product: Product) {
    setModalProduct(product);
    prefetchProductDetail(product.id);
  }

  function updateQuantity(productId: string, delta: number) {
    setCart((prev) =>
      prev
        .map((item) => (item.product.id === productId ? { ...item, quantity: item.quantity + delta } : item))
        .filter((item) => item.quantity > 0)
    );
  }

  function latestVisibleProducts() {
    const latestProductMessage = [...messages].reverse().find((message) => message.products?.length);
    return latestProductMessage?.products ?? latestVoiceProductsRef.current;
  }

  function resolveCartActionProduct(action: CartAction, productsHint: Product[] = []) {
    const productId = String(action.product_id ?? action.productId ?? "").trim();
    const productName = String(action.product_name ?? action.productName ?? "").trim().toLowerCase();
    const productIndex = Number(action.product_index ?? action.productIndex);
    const visibleProducts = productsHint.length ? productsHint : latestVisibleProducts();
    const allProducts = Array.from(
      new Map([
        ...visibleProducts,
        ...(selectedProduct ? [selectedProduct.product] : []),
        ...latestVoiceProductsRef.current,
        ...messages.flatMap((message) => message.products ?? []),
        ...cart.map((item) => item.product),
      ].map((product) => [product.id, product])).values()
    );

    if (productId) {
      const byId = allProducts.find((product) => product.id === productId);
      if (byId) return byId;
    }

    if (Number.isInteger(productIndex) && productIndex > 0) {
      const byIndex = visibleProducts[productIndex - 1];
      if (byIndex) return byIndex;
    }

    if (productName) {
      const words = productName.split(/\s+/).filter((word) => word.length > 2);
      return allProducts.find((product) => {
        const name = product.name.toLowerCase();
        return name.includes(productName) || words.every((word) => name.includes(word));
      }) ?? allProducts.find((product) => {
        const name = product.name.toLowerCase();
        return words.some((word) => name.includes(word));
      }) ?? null;
    }

    return null;
  }

  function applyCartActions(actions?: CartAction[], productsHint: Product[] = []) {
    if (!actions?.length) return;
    let openedCart = false;
    actions.forEach((action) => {
      const quantity = Math.max(1, Math.min(99, Number(action.quantity ?? 1) || 1));
      if (action.action === "clear") {
        setCart([]);
        openedCart = true;
        return;
      }

      const product = resolveCartActionProduct(action, productsHint);
      if (!product) return;

      setCart((prev) => {
        if (action.action === "remove") {
          return prev.filter((item) => item.product.id !== product.id);
        }
        if (action.action === "set_quantity") {
          return quantity <= 0
            ? prev.filter((item) => item.product.id !== product.id)
            : prev.some((item) => item.product.id === product.id)
              ? prev.map((item) => item.product.id === product.id ? { ...item, quantity } : item)
              : [...prev, { product, quantity }];
        }
        const found = prev.find((item) => item.product.id === product.id);
        return found
          ? prev.map((item) => item.product.id === product.id ? { ...item, quantity: item.quantity + quantity } : item)
          : [...prev, { product, quantity }];
      });
      setSelectedProduct({ product });
      prefetchProductDetail(product.id);
      openedCart = true;
    });

    if (openedCart) {
      setCartOpen(true);
      setRightTab("cart");
      setDetailOpen(true);
    }
  }

  function saveRecentCart(items = cart) {
    if (!items.length) return;
    const snapshot: RecentCart = {
      id: crypto.randomUUID(),
      label: recentCartLabel(items),
      createdAt: new Date().toISOString(),
      items,
    };
    setRecentCarts((prev) => [snapshot, ...prev.filter((entry) => entry.label !== snapshot.label)].slice(0, 4));
  }

  function restoreRecentCart(recent: RecentCart) {
    setCart(recent.items);
    setCartOpen(true);
    setRightTab("cart");
    setDetailOpen(true);
    setShowCheckout(false);
    setMessages((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        role: "assistant",
        text: `Aney nice, I brought back that cart: ${recent.label}. Check the items and I'll help with delivery details.`,
        label: "AI_RECOMMENDATION",
      },
    ]);
  }

  function checkoutItemsForDraft() {
    const source = cart.length
      ? cart
      : selectedProduct
        ? [{ product: selectedProduct.product, quantity: 1 }]
        : [];

    return source.map((item) => ({
      productId: item.product.id,
      productName: item.product.name,
      productImage: firstImage(item.product) || null,
      price: item.product.price?.amount ?? 0,
      quantity: item.quantity,
      icingText: item.icing_text ?? undefined,
    }));
  }

  function draftFromCurrentCart(stage: OrderDraft["stage"] = "collecting"): OrderDraft {
    return {
      items: checkoutItemsForDraft(),
      recipientName: checkout.recipientName || undefined,
      recipientPhone: checkout.recipientPhone || undefined,
      deliveryAddress: checkout.address || undefined,
      deliveryCity: deliveryQuote?.city || undefined,
      deliveryDate: deliveryQuote ? deliveryDisplayDate(deliveryQuote) : deliveryDate,
      locationType: undefined,
      deliveryRate: deliveryQuote?.rate,
      senderName: checkout.senderName || undefined,
      anonymous: checkout.anonymous ? true : undefined,
      giftMessage: checkout.giftMessage || undefined,
      stage,
    };
  }

  function updateConversationLanguage(text: string) {
    if (conversationLanguageLockedRef.current) return conversationLanguageRef.current;
    const language = detectConversationLanguage(text);
    if (!language) return conversationLanguageRef.current;
    conversationLanguageRef.current = language;
    conversationLanguageLockedRef.current = true;
    setConversationLanguage(language);
    return language;
  }

  function currentOrderLanguage() {
    return conversationLanguageRef.current;
  }

  function openExistingPaymentLink() {
    const checkoutUrl = orderResult?.checkoutUrl ?? orderDraft?.checkoutUrl;
    if (!checkoutUrl) return false;

    setRightTab("cart");
    setDetailOpen(true);
    addAssistantMessage(orderCopy(currentOrderLanguage()).openingPayment, ["Open payment link", "Track my order"]);
    window.open(checkoutUrl, "_blank", "noopener,noreferrer");
    return true;
  }

  function addAssistantMessage(text: string, quickReplies?: string[]) {
    setMessages((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        role: "assistant",
        text,
        label: "AI_RECOMMENDATION",
        quickReplies,
      },
    ]);
  }

  function askOrderEditField(draft: OrderDraft) {
    const editingDraft = { ...draft, stage: "collecting" as const, editingField: "select" };
    const copy = orderCopy(currentOrderLanguage());
    setVoiceFormFillKey(0);
    setOrderDraft(editingDraft);
    setRightTab("order");
    setDetailOpen(true);
    addAssistantMessage(
      copy.editAsk,
      ["Recipient name", "Phone", "Address", "City", "Date", "Message"]
    );
  }

  function editOrderField(field: keyof OrderDraft) {
    if (!orderDraft) return;
    const nextDraft = {
      ...orderDraft,
      stage: "collecting" as const,
      editingField: field === "deliveryAddress" ? "deliveryAddress" : String(field),
    };
    setVoiceFormFillKey(0);
    setOrderDraft(nextDraft);
    setRightTab("order");
    setDetailOpen(true);
    addAssistantMessage(orderQuestion(String(field), currentOrderLanguage()));
  }

  function continueOrderDraft(nextDraft: OrderDraft) {
    const missing = getMissingFields(nextDraft);
    const language = currentOrderLanguage();
    const copy = orderCopy(language);
    setVoiceFormFillKey(0);
    if (missing.includes("items")) {
      addAssistantMessage(copy.emptyCart);
      return;
    }

    if (missing.length > 0) {
      const collectingDraft = { ...nextDraft, stage: "collecting" as const };
      setOrderDraft(collectingDraft);
      setRightTab("order");
      setDetailOpen(true);
      addAssistantMessage(orderQuestion(missing[0], language));
      return;
    }

    const confirmingDraft = {
      ...nextDraft,
      stage: "confirming" as const,
      grandTotal: orderGrandTotal(nextDraft),
    };
    setOrderDraft(confirmingDraft);
    setRightTab("order");
    setDetailOpen(true);
    addAssistantMessage(
      orderConfirmationText(confirmingDraft, language),
      [copy.yesCreate, copy.editDetails]
    );
  }

  function beginOrderCollection() {
    const draft = orderDraft && ["collecting", "confirming"].includes(orderDraft.stage)
      ? orderDraft
      : draftFromCurrentCart();
    continueOrderDraft(draft);
  }

  function applyOrderAnswer(text: string): OrderDraft | null {
    if (!orderDraft) return null;
    const inferredUpdate = inferOrderFieldUpdate(text);

    if (isOrderEditIntent(text) && !inferredUpdate) {
      askOrderEditField(orderDraft);
      return null;
    }

    if (orderDraft.editingField === "select") {
      const selectedField = inferredUpdate?.field ?? normalizeOrderEditField(text);
      if (!selectedField) {
        const copy = orderCopy(currentOrderLanguage());
        addAssistantMessage(
          copy.editRetry,
          ["Recipient name", "Phone", "Address", "City", "Date", "Message"]
        );
        return null;
      }
      const nextDraft = { ...orderDraft, editingField: selectedField, stage: "collecting" as const };
      setOrderDraft(nextDraft);
      addAssistantMessage(orderQuestion(selectedField, currentOrderLanguage()));
      return nextDraft;
    }

    const field = orderDraft.editingField && orderDraft.editingField !== "select"
      ? orderDraft.editingField
      : inferredUpdate?.field ?? getMissingFields(orderDraft)[0];
    if (!field) {
      continueOrderDraft(orderDraft);
      return orderDraft;
    }

    const value = cleanOrderValue(inferredUpdate?.field === field ? inferredUpdate.value : text);
    const nextDraft: OrderDraft = { ...orderDraft };

    if (field === "recipientName") {
      if (!isLikelyFullName(value)) {
        addAssistantMessage(orderCopy(currentOrderLanguage()).fullNameRetry);
        return null;
      }
      nextDraft.recipientName = value;
    }
    if (field === "recipientPhone") {
      if (!isLikelyContactNumber(value)) {
        addAssistantMessage(orderCopy(currentOrderLanguage()).phoneRetry);
        return null;
      }
      nextDraft.recipientPhone = value;
    }
    if (field === "deliveryAddress") {
      nextDraft.deliveryAddress = value;
      const cityFromAddress = findDeliveryCityInText(value, deliveryCityOptions);
      if (cityFromAddress) {
        nextDraft.deliveryCity = cityFromAddress;
        setCity(cityFromAddress);
      }
      if (!nextDraft.locationType && /\b(home|house|gedara)\b/i.test(value)) nextDraft.locationType = "house";
      if (!nextDraft.locationType && /\b(office|work)\b/i.test(value)) nextDraft.locationType = "office";
      if (!nextDraft.locationType && /\b(apartment|flat)\b/i.test(value)) nextDraft.locationType = "apartment";
    }
    if (field === "deliveryCity") {
      nextDraft.deliveryCity = value;
      setCity(value);
    }
    if (field === "locationType") nextDraft.locationType = locationTypeFromText(value);
    if (field === "deliveryDate") nextDraft.deliveryDate = sriLankaDateFromText(value);
    if (field === "senderName") nextDraft.senderName = isSkipAnswer(value) ? "Kade AI shopper" : value;
    if (field === "anonymous") nextDraft.anonymous = yesNoToBoolean(value) ?? false;
    if (field === "giftMessage") nextDraft.giftMessage = isSkipAnswer(value) ? "" : value.slice(0, 300);
    if (field === "icingText") {
      nextDraft.items = nextDraft.items.map((item) =>
        /^cake/i.test(item.productId) ? { ...item, icingText: isSkipAnswer(value) ? "" : value.slice(0, 120) } : item
      );
    }

    if (orderDraft.editingField && orderDraft.editingField !== "select") {
      const fixedDraft = {
        ...nextDraft,
        editingField: undefined,
        stage: "confirming" as const,
        grandTotal: orderGrandTotal(nextDraft),
      };
      setOrderDraft(fixedDraft);
      continueOrderDraft(fixedDraft);
      return fixedDraft;
    }

    continueOrderDraft(nextDraft);
    return nextDraft;
  }

  async function prepareDraftForOrder(draft: OrderDraft) {
    const productId = draft.items[0]?.productId;
    if (!draft.deliveryCity || !draft.deliveryDate) return draft;

    const res = await fetch("/api/delivery", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        city: draft.deliveryCity,
        delivery_date: draft.deliveryDate,
        product_id: productId ?? null,
      }),
    });

    if (!res.ok) return draft;

    const data = (await res.json()) as { delivery?: DeliveryResult };
    const delivery = data.delivery;
    if (!delivery) return draft;

    const nextDate = delivery.available
      ? delivery.checkedDate
      : delivery.nextAvailableDate;
    if (!nextDate) {
      throw new Error(delivery.reason || "Delivery is not available for that city/date.");
    }

    const updatedDraft = {
      ...draft,
      deliveryCity: delivery.city || draft.deliveryCity,
      deliveryDate: nextDate,
      deliveryRate: delivery.rate,
      grandTotal: orderItemsTotal(draft) + delivery.rate,
    };

    setDeliveryQuote(delivery);
    setCity(updatedDraft.deliveryCity);
    setDeliveryDate(updatedDraft.deliveryDate);

    if (!delivery.available || nextDate !== draft.deliveryDate) {
      addAssistantMessage(
        orderCopy(currentOrderLanguage()).deliveryUpdated
      );
    }

    return updatedDraft;
  }

  function orderPlacementSignature(draft: OrderDraft) {
    return JSON.stringify({
      items: draft.items.map((item) => ({
        productId: item.productId,
        quantity: item.quantity,
        icingText: item.icingText || "",
      })),
      recipientName: draft.recipientName || "",
      recipientPhone: draft.recipientPhone || "",
      deliveryAddress: draft.deliveryAddress || "",
      deliveryCity: draft.deliveryCity || "",
      deliveryDate: draft.deliveryDate || "",
      locationType: draft.locationType || "house",
      deliveryInstructions: draft.deliveryInstructions || "",
      senderName: draft.senderName || "",
      anonymous: draft.anonymous ?? false,
      giftMessage: draft.giftMessage || "",
    });
  }

  async function placeOrderFromDraft(draft: OrderDraft) {
    const signature = orderPlacementSignature(draft);
    if (orderPlacementPromiseRef.current) {
      return orderPlacementPromiseRef.current;
    }
    if (
      lastPlacedOrderRef.current &&
      lastPlacedOrderSignatureRef.current === signature &&
      Date.now() - lastPlacedOrderAtRef.current < 5 * 60 * 1000
    ) {
      return lastPlacedOrderRef.current;
    }

    const placement = (async () => {
      orderPlacementInFlightRef.current = true;
      lastOrderErrorRef.current = "";
      let placingDraft = { ...draft, stage: "placing" as const };
      setOrderDraft(placingDraft);
      setBusyAction("order");
      setRightTab("order");
      setDetailOpen(true);

      try {
        placingDraft = { ...(await prepareDraftForOrder(placingDraft)), stage: "placing" as const };
        setOrderDraft(placingDraft);
        const res = await fetch("/api/order", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            cart: placingDraft.items.map((item) => ({
              product_id: item.productId,
              quantity: item.quantity,
              icing_text: item.icingText || null,
            })),
            recipient: {
              name: placingDraft.recipientName,
              phone: placingDraft.recipientPhone,
            },
            delivery: {
              address: placingDraft.deliveryAddress,
              city: placingDraft.deliveryCity,
              date: placingDraft.deliveryDate,
              location_type: placingDraft.locationType ?? "house",
              instructions: placingDraft.deliveryInstructions || null,
            },
            sender: {
              name: placingDraft.senderName || "Kade AI shopper",
              anonymous: placingDraft.anonymous ?? false,
            },
            gift_message: placingDraft.giftMessage || null,
            currency: "LKR",
          }),
        });

        const data = (await res.json()) as OrderCreatedMetadata & { reply?: string; error?: string };
        if (!res.ok || !data.checkoutUrl) {
          throw new Error(data.reply || data.error || "Order creation failed");
        }

        lastOrderErrorRef.current = "";
        lastPlacedOrderSignatureRef.current = signature;
        lastPlacedOrderRef.current = data;
        lastPlacedOrderAtRef.current = Date.now();
        setOrderResult(data);
        setOrder(data as unknown as Record<string, unknown>);
        setOrderDraft({
          ...placingDraft,
          stage: "complete",
          checkoutUrl: data.checkoutUrl,
          orderRef: data.orderRef,
          grandTotal: data.summary.grandTotal,
          expiresAt: data.expiresAt,
        });
        clearOrderDraft();
        saveRecentCart();
        const copy = orderCopy(currentOrderLanguage());
        addAssistantMessage(
          `${copy.orderCreated}\n\n${copy.paySoon}\n\n${copy.deliveryOn} ${formatOrderDate(placingDraft.deliveryDate)} ${copy.toCity} ${placingDraft.deliveryCity}. ${copy.didGood}`,
          ["Open payment link", "Track my order"]
        );
        return data;
      } catch (error) {
        const message = error instanceof Error ? error.message : "Aiyo, something went wrong - want to try again?";
        lastOrderErrorRef.current = message;
        setOrderDraft({ ...placingDraft, stage: "error", errorMessage: message });
        addAssistantMessage(message, ["Try again", "Edit details"]);
        return null;
      } finally {
        orderPlacementInFlightRef.current = false;
        orderPlacementPromiseRef.current = null;
        setBusyAction(null);
      }
    })();

    orderPlacementPromiseRef.current = placement;
    return placement;
  }

  function handleLocalOrderMessage(text: string, options: { appendUser?: boolean } = {}) {
    const trimmed = text.trim();
    if (!trimmed) return false;
    const appendUser = options.appendUser !== false;
    const appendUserMessage = () => {
      if (!appendUser) return;
      setMessages((prev) => [...prev, { id: crypto.randomUUID(), role: "user", text: trimmed }]);
    };

    if (/\b(open\s+)?(payment|pay|checkout)\s+link\b/i.test(trimmed) || /(payment link|pay link|checkout link)/i.test(trimmed)) {
      if (orderResult?.checkoutUrl || orderDraft?.checkoutUrl) {
        appendUserMessage();
        openExistingPaymentLink();
        return true;
      }
    }

    if (/^start fresh$/i.test(trimmed) && orderDraft) {
      appendUserMessage();
      clearOrderDraft();
      setOrderDraft(null);
      setOrderResult(null);
      addAssistantMessage("Hari, fresh start. What are we ordering?");
      return true;
    }

    if (/^yes,? continue$/i.test(trimmed) && orderDraft) {
      appendUserMessage();
      continueOrderDraft(orderDraft);
      return true;
    }

    if (orderDraft?.stage === "collecting") {
      appendUserMessage();
      applyOrderAnswer(trimmed);
      return true;
    }

    if (orderDraft?.stage === "confirming" && isOrderConfirmIntent(trimmed, currentOrderLanguage())) {
      appendUserMessage();
      void placeOrderFromDraft(orderDraft);
      return true;
    }

    if (orderDraft?.stage === "confirming") {
      appendUserMessage();
      if (isOrderEditIntent(trimmed) && !inferOrderFieldUpdate(trimmed)) {
        askOrderEditField(orderDraft);
      } else {
        applyOrderAnswer(trimmed);
      }
      return true;
    }

    if (isCheckoutIntent(trimmed)) {
      appendUserMessage();
      beginOrderCollection();
      return true;
    }

    return false;
  }

  function openDeliveryDetails() {
    if (!cart.length) return;
    beginOrderCollection();
  }

  async function checkDeliveryQuote() {
    setBusyAction("delivery");
    setDeliveryQuote(null);
    try {
      const res = await fetch("/api/delivery", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          city,
          delivery_date: deliveryDate,
          product_id: cart[0]?.product.id ?? selectedProduct?.product.id ?? null,
        }),
      });
      const data = (await res.json()) as { reply?: string; delivery?: unknown };
      const delivery = data.delivery
        ? isDeliveryResult(data.delivery)
          ? data.delivery
          : normalizeDeliveryResult(data.delivery, city)
        : null;
      if (delivery) {
        setDeliveryQuote(delivery);
        setCity(delivery.city);
        setMessages((prev) => [
          ...prev,
          {
            id: crypto.randomUUID(),
            role: "assistant",
            text: data.reply || formatDeliveryResponse(delivery),
            delivery,
            label: "DELIVERY_INFO",
            quickReplies: ["Confirm this delivery", "Check another date", "Continue checkout"],
          },
        ]);
      }
    } finally {
      setBusyAction(null);
    }
  }

  function confirmDeliverySelection() {
    if (!deliveryQuote) return;
    const confirmedDate = deliveryDisplayDate(deliveryQuote);
    setDeliveryDate(confirmedDate);
    setCity(deliveryQuote.city);
    addAssistantMessage(
      `Hari, delivery date confirmed for ${formatDeliveryDate(confirmedDate)} to ${deliveryQuote.city}. Let's finish the order details.`,
      ["Continue checkout"]
    );
    beginOrderCollection();
  }

  async function createOrder() {
    if (!cart.length) return;
    setBusyAction("order");
    setOrder(null);
    try {
      const res = await fetch("/api/order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cart: cart.map((item) => ({
            product_id: item.product.id,
            quantity: item.quantity,
            icing_text: item.icing_text || null,
          })),
          recipient: {
            name: checkout.recipientName,
            phone: checkout.recipientPhone,
          },
          delivery: {
            address: checkout.address,
            city,
            date: deliveryDate,
            location_type: "house",
            instructions: null,
          },
          sender: {
            name: checkout.senderName || "Kade AI shopper",
            anonymous: checkout.anonymous,
          },
          gift_message: checkout.giftMessage || null,
          currency: "LKR",
        }),
      });
      const createdOrder = await res.json();
      setOrder(createdOrder);
      saveRecentCart();
    } finally {
      setBusyAction(null);
    }
  }

  async function trackOrder() {
    const orderNumber = trackingNumber.trim();
    if (!orderNumber) return;

    setBusyAction("track");
    setTrackingResult(null);
    try {
      const res = await fetch("/api/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ order_number: orderNumber }),
      });
      setTrackingResult(await res.json());
    } finally {
      setBusyAction(null);
    }
  }

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (pendingImage) {
      void sendPendingImageSearch();
      return;
    }
    sendMessage();
  }

  const payUrl =
    typeof order?.checkoutUrl === "string" ? order.checkoutUrl :
    typeof order?.checkout_url === "string" ? order.checkout_url :
    typeof order?.pay_url === "string" ? order.pay_url :
    typeof order?.payment_url === "string" ? order.payment_url :
    null;
  const profileName = authUser?.name ?? "Guest";
  const profileLabel = authUser?.mode === "google" ? (authUser.email ?? "Google account") : "Guest mode";

  return (
    <main
      className={clsx(
        styles.shell,
        mobileSidebarOpen && styles.sidebarOpen,
        (selectedProduct || rightTab === "cart" || showCheckout || orderDraft) && styles.rightPanelActive,
        !detailOpen && styles.detailCollapsed
      )}
    >
      {/* ═══ LEFT: Cart Sidebar ═══ */}
      <aside className={styles.cartSidebar}>
        <div className={styles.sidebarTop}>
          <div className={styles.sidebarBrand}>
            <div className={styles.sidebarLogo}>
              <img src="/logo.png" alt="Kade AI" />
            </div>
            <strong><span>Kade</span> <em>AI</em></strong>
          </div>
          <button
            className={styles.sidebarNewChat}
            type="button"
            onClick={() => {
              startChat(false);
              setMobileSidebarOpen(false);
            }}
          >
            <Plus size={15} />
            New chat
          </button>
        </div>

        <div className={styles.sidebarChats}>
          <div className={styles.sidebarPromptGrid}>
            {sidebarPrompts.map((item) => (
              <button
                key={item.label}
                type="button"
                onClick={() => {
                  setMobileSidebarOpen(false);
                  sendMessage(item.prompt);
                }}
              >
                {item.label}
              </button>
            ))}
          </div>
          <span className={styles.sidebarSectionLabel}>Today</span>
          {chatSessions.slice(0, 6).map((session) => (
            <div
              key={session.id}
              className={clsx(styles.sidebarChatItem, session.id === activeChatId && !temporaryChat && styles.sidebarChatItemActive)}
            >
              <button
                type="button"
                className={styles.sidebarChatMain}
                onClick={() => {
                  openChatSession(session);
                  setMobileSidebarOpen(false);
                }}
              >
                <MessageCircle size={15} />
                <span>{session.title}</span>
                {session.pinned && <Pin size={12} className={styles.sidebarPinnedMarker} />}
              </button>
              <div className={styles.sidebarChatMenu} onPointerDown={(event) => event.stopPropagation()}>
                <button
                  type="button"
                  aria-label="Chat actions"
                  onClick={(event) => {
                    event.stopPropagation();
                    setOpenChatMenuId((current) => current === session.id ? null : session.id);
                  }}
                >
                  <MoreVertical size={15} />
                </button>
                {openChatMenuId === session.id && (
                  <div className={styles.sidebarChatMenuPanel}>
                    <button type="button" onClick={() => { toggleChatPin(session.id); setOpenChatMenuId(null); }}>
                      <Pin size={13} className={session.pinned ? styles.sidebarPinnedIcon : undefined} />
                      {session.pinned ? "Unpin" : "Pin"}
                    </button>
                    <button type="button" onClick={() => { renameChatSession(session); setOpenChatMenuId(null); }}>
                      <Pencil size={13} />
                      Rename
                    </button>
                    <button type="button" onClick={() => { deleteChatSession(session.id); setOpenChatMenuId(null); }}>
                      <Trash2 size={13} />
                      Delete
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
          {chatSessions.length === 0 && (
            <p className={styles.sidebarEmpty}>Your saved chats will appear here.</p>
          )}

          {chatSessions.length > 6 && (
            <>
              <span className={styles.sidebarSectionLabel}>Yesterday</span>
              {chatSessions.slice(6, 12).map((session) => (
                <div
                  key={session.id}
                  className={clsx(styles.sidebarChatItem, session.id === activeChatId && !temporaryChat && styles.sidebarChatItemActive)}
                >
                  <button
                    type="button"
                    className={styles.sidebarChatMain}
                    onClick={() => {
                      openChatSession(session);
                      setMobileSidebarOpen(false);
                    }}
                  >
                    <MessageCircle size={15} />
                    <span>{session.title}</span>
                    {session.pinned && <Pin size={12} className={styles.sidebarPinnedMarker} />}
                  </button>
                  <div className={styles.sidebarChatMenu} onPointerDown={(event) => event.stopPropagation()}>
                    <button
                      type="button"
                      aria-label="Chat actions"
                      onClick={(event) => {
                        event.stopPropagation();
                        setOpenChatMenuId((current) => current === session.id ? null : session.id);
                      }}
                    >
                      <MoreVertical size={15} />
                    </button>
                    {openChatMenuId === session.id && (
                      <div className={styles.sidebarChatMenuPanel}>
                        <button type="button" onClick={() => { toggleChatPin(session.id); setOpenChatMenuId(null); }}>
                          <Pin size={13} className={session.pinned ? styles.sidebarPinnedIcon : undefined} />
                          {session.pinned ? "Unpin" : "Pin"}
                        </button>
                        <button type="button" onClick={() => { renameChatSession(session); setOpenChatMenuId(null); }}>
                          <Pencil size={13} />
                          Rename
                        </button>
                        <button type="button" onClick={() => { deleteChatSession(session.id); setOpenChatMenuId(null); }}>
                          <Trash2 size={13} />
                          Delete
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </>
          )}
        </div>

        <div className={styles.sidebarUser}>
          <div className={styles.sidebarAvatar}>
            {authUser?.picture ? (
              <img src={authUser.picture} alt="" referrerPolicy="no-referrer" />
            ) : (
              authInitial(profileName)
            )}
          </div>
          <div>
            <strong>{profileName}</strong>
            <span>{profileLabel}</span>
          </div>
          <button type="button" aria-label="Settings" onClick={() => setSettingsOpen(true)}>
            <Settings size={16} />
          </button>
        </div>
      </aside>

      {authModalOpen && (
        <div
          className={styles.authOverlay}
          onPointerDown={() => {
            if (authUser) setAuthModalOpen(false);
          }}
          role="presentation"
        >
          <section
            className={styles.authDialog}
            role="dialog"
            aria-modal="true"
            aria-labelledby="auth-title"
            onPointerDown={(event) => event.stopPropagation()}
          >
            {authUser && (
              <button className={styles.authClose} type="button" aria-label="Close sign in" onClick={() => setAuthModalOpen(false)}>
                <X size={18} />
              </button>
            )}
            <div className={styles.authLogo}>
              <img src="/logo.png" alt="Kade AI" />
            </div>
            <div className={styles.authIntro}>
              <span>Kapruka shopping desk</span>
              <h2 id="auth-title">Start shopping your way</h2>
              <p>Use Kade instantly as a guest, or sign in with Google only if you want your profile shown here.</p>
            </div>

            <button className={styles.authGuestButton} type="button" onClick={continueAsGuest}>
              <User size={18} />
              <span>Continue as guest</span>
              <small>No account needed</small>
            </button>

            <div className={styles.authDivider}>
              <span>or</span>
            </div>

            <div className={styles.authGoogleBox}>
              {GOOGLE_CLIENT_ID ? (
                <>
                  <div ref={googleButtonRef} className={styles.googleButtonMount}>
                    {!googleScriptReady && <span>Loading Google sign-in...</span>}
                  </div>
                  <p>Optional - shopping still works without signing in.</p>
                </>
              ) : (
                <div className={styles.authGoogleSetup}>
                  Add <code>NEXT_PUBLIC_GOOGLE_CLIENT_ID</code> to enable Google sign-in.
                </div>
              )}
            </div>

            {googleAuthError && <p className={styles.authError}>{googleAuthError}</p>}
          </section>
        </div>
      )}

      {settingsOpen && (
        <div
          className={styles.settingsOverlay}
          onPointerDown={() => setSettingsOpen(false)}
          role="presentation"
        >
          <section
            className={styles.settingsDialog}
            role="dialog"
            aria-modal="true"
            aria-labelledby="settings-title"
            onPointerDown={(event) => event.stopPropagation()}
          >
            <div className={styles.settingsHeader}>
              <div>
                <span>Kade AI</span>
                <h2 id="settings-title">Settings</h2>
              </div>
              <button type="button" aria-label="Close settings" onClick={() => setSettingsOpen(false)}>
                <X size={18} />
              </button>
            </div>

            <div className={styles.settingsSection}>
              <div>
                <h3>Account</h3>
                <p>{authUser?.mode === "google" ? `Signed in as ${profileName}` : "Using guest mode."}</p>
              </div>
              <div className={styles.settingsAccountActions}>
                {authUser?.mode === "google" ? (
                  <>
                    <button className={styles.settingsWideButton} type="button" onClick={openAuthChooser}>
                      Switch account
                    </button>
                    <button className={clsx(styles.settingsWideButton, styles.settingsDangerButton)} type="button" onClick={signOutToGuest}>
                      Sign out
                    </button>
                  </>
                ) : (
                  <button className={styles.settingsWideButton} type="button" onClick={openAuthChooser}>
                    Sign in with Google
                  </button>
                )}
              </div>
            </div>

            <div className={styles.settingsSection}>
              <div>
                <h3>Language</h3>
                <p>Choose the default chat language.</p>
              </div>
              <div className={styles.settingsOptionGrid}>
                {[
                  { value: "en", label: "English" },
                  { value: "si", label: "Sinhala" },
                  { value: "ta", label: "Tamil" },
                ].map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    className={clsx(styles.settingsOption, preferredLanguage === option.value && styles.settingsOptionActive)}
                    onClick={() => applyPreferredLanguage(option.value as ConversationLanguage)}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            <div className={styles.settingsSection}>
              <div>
                <h3>Voice</h3>
                <p>Pick a simple voice profile for Gemini Live.</p>
              </div>
              <div className={styles.settingsOptionGrid}>
                {[
                  { value: "female", label: "Female" },
                  { value: "male", label: "Male" },
                ].map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    className={clsx(styles.settingsOption, voiceGender === option.value && styles.settingsOptionActive)}
                    onClick={() => applyVoiceGender(option.value as VoiceGender)}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
          </section>
        </div>
      )}

      <section className={styles.chatPane}>
        <header className={styles.topbar}>
          <div className={styles.chatTitleBlock}>
            <button className={styles.mobileMenuBtn} type="button" onClick={() => setMobileSidebarOpen(true)} aria-label="Open sidebar">
              <Menu size={18} />
            </button>
            <div>
              <h1>{temporaryChat ? "Temporary chat" : chatTitle(messages)}</h1>
              <span>Kapruka shopping desk</span>
            </div>
          </div>

          <div className={styles.topbarActions}>
            <div className={styles.livePill}>
              <span />
              MCP live
            </div>
            <button
              className={clsx(styles.iconBtn, showLiveCall && styles.iconBtnActive)}
              type="button"
              aria-label="Voice mode"
              onClick={openLiveCall}
            >
              <Mic size={18} />
            </button>
            <button 
              className={clsx(styles.iconBtn, styles.themeToggle)} 
              aria-label={darkMode ? 'Light mode' : 'Dark mode'}
              onClick={() => setDarkMode(!darkMode)}
            >
              {darkMode ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <button
              className={styles.iconBtn}
              aria-label="Cart"
              onClick={() => {
                setRightTab("cart");
                setDetailOpen(true);
              }}
            >
              <ShoppingCart size={18} />
              {cart.length > 0 && <span className={styles.topbarBadge}>{cart.length}</span>}
            </button>
            <button className={styles.iconBtn} type="button" onClick={() => startChat(false)} aria-label="New chat">
              <Plus size={18} />
            </button>
          </div>
        </header>

        <div
          className={styles.messages}
          onDragOver={(event) => {
            event.preventDefault();
            setShowDropZone(true);
          }}
          onDragLeave={(event) => {
            if (event.currentTarget === event.target) setShowDropZone(false);
          }}
          onDrop={(event) => {
            event.preventDefault();
            setShowDropZone(false);
            const file = Array.from(event.dataTransfer.files).find((item) => item.type.startsWith("image/"));
            if (file) void handleImageFile(file);
          }}
        >
          {showDropZone && (
            <div className={styles.dropZone}>
              <ImageIcon size={42} />
              <strong>Drop image to search 🔍</strong>
            </div>
          )}
          {displayMessages.length <= 1 && (
          <section className={styles.commandDeck}>
            <div className={styles.commandHero}>
              <div className={styles.welcomeLogo}>
                <ShoppingBag size={28} />
              </div>
              <h2>හෙලෝ, I am Kade AI.</h2>
              <p>Ask naturally. I can browse Kapruka, compare gifts, check delivery, and help you checkout.</p>
            </div>
            <div className={styles.giftLanes}>
              <button type="button" onClick={() => sendMessage("Birthday cake under Rs. 5000")}>
                <Gift size={17} />
                <span>Birthday cake under Rs. 5000</span>
              </button>
              <button type="button" onClick={() => sendMessage("Corporate gift hamper")}>
                <Package size={17} />
                <span>Corporate gift hamper</span>
              </button>
              <button type="button" onClick={() => sendMessage("Flowers for delivery today")}>
                <Sparkles size={17} />
                <span>Flowers for delivery today</span>
              </button>
              <button type="button" onClick={() => sendMessage("Surprise gift for my girlfriend")}>
                <MessageCircle size={17} />
                <span>Surprise gift for my girlfriend</span>
              </button>
            </div>
          </section>
          )}

          {displayMessages.map((message) => (
            <article
              key={message.id}
              ref={message.products?.length ? lastProductMessageRef : undefined}
              className={clsx(
                styles.message,
                message.role === "user" && styles.messageUser,
                message.source === "voice" && styles.messageVoice,
                message.source === "voice" && message.role === "assistant" && message.isStreaming && styles.messageVoiceSpeaking
              )}
            >
              <div className={styles.messageAvatar}>
                {message.role === "assistant" ? <Bot size={16} /> : <User size={16} />}
              </div>
              <div className={styles.messageBubble}>
                {message.source === "voice" && (
                  <span className={styles.voiceBubbleIcon} aria-label={message.role === "user" ? "Voice message" : "Voice response"}>
                    {message.role === "user" ? <Mic size={12} /> : <Volume2 size={12} />}
                  </span>
                )}
                {message.label && labelText(message.label) && (
                  <div
                    className={clsx(
                      styles.messageLabel,
                      message.label === "SEARCH_RESULT" && styles.messageLabelSearch,
                      message.label === "DIRECT_LINK" && styles.messageLabelLink
                    )}
                  >
                    {message.label === "AI_RECOMMENDATION" && <Sparkles size={10} />}
                    {message.label === "SEARCH_RESULT" && <Search size={10} />}
                    {message.label === "DELIVERY_INFO" && <Truck size={10} />}
                    {labelText(message.label)}
                  </div>
                )}

                <div className={styles.messageText}>
                  {message.image && (
                    <div className={styles.messageImageWrap}>
                      <img src={message.image.url} alt="Uploaded product search" />
                      {message.image.searching && (
                        <div className={styles.messageImageLoading}>
                          <Loader2 size={20} className={styles.spinIcon} />
                        </div>
                      )}
                    </div>
                  )}
                  <MessageContent text={message.text} />
                  {message.isStreaming && <span className={styles.streamingCursor} />}
                </div>

                {!message.isStreaming && message.products?.length ? (
                  <div className={styles.productGrid}>
                    <div className={styles.productGridIntro}>
                      <Sparkles size={13} />
                      <span>{message.products.length} results - tap to explore</span>
                    </div>
                    {message.products.map((product, index) => (
                      <ProductCard
                        key={product.id}
                        product={product}
                        index={index}
                        selected={selectedProduct?.product.id === product.id}
                        onAdd={addToCart}
                        onSelect={() => {
                          setSelectedProduct({ product });
                          prefetchProductDetail(product.id);
                          setDetailOpen(true);
                          setRightTab("product");
                        }}
                      />
                    ))}
                  </div>
                ) : null}

                {!message.isStreaming && message.quickReplies && (
                  <div className={styles.quickReplies}>
                    {message.quickReplies.map((reply) => (
                      <button
                        key={reply}
                        className={styles.quickReplyBtn}
                        onClick={() => sendMessage(reply)}
                      >
                        {reply}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </article>
          ))}

          {loading && (
            <article className={styles.message}>
              <div className={styles.messageAvatar}>
                <Bot size={16} />
              </div>
              <div className={styles.messageBubble}>
                <div className={styles.typing}>
                  <div className={styles.typingDots}>
                    <span />
                    <span />
                    <span />
                  </div>
                  Searching Kapruka...
                </div>
              </div>
            </article>
          )}

          <div ref={messagesEndRef} />
        </div>

        {showLiveCall ? (
          <LiveCallOverlay
            onClose={() => {
              closeLiveCall();
              dispatchVoiceSession({ type: "SET_VOICE_STATE", active: false, listening: false, speaking: false });
              voiceBridgeRef.current.setContextSender(null);
            }}
            onShoppingRequest={handleVoiceShoppingIntent}
            onCartAddRequest={handleVoiceCartAdd}
            onDeliveryCheckRequest={handleVoiceDeliveryCheck}
            onCheckoutAction={handleVoiceCheckoutAction}
            onOrderFieldFill={handleVoiceOrderFieldFill}
            onOrderFieldCorrection={handleVoiceOrderFieldCorrection}
            onOrderReady={handleVoiceOrderReady}
            onConfirmOrder={handleVoiceConfirmAndPlace}
            onUserTranscript={addVoiceUserMessage}
            onAssistantTranscript={upsertVoiceAssistantMessage}
            onStatusChange={(status) => {
              dispatchVoiceSession({
                type: "SET_VOICE_STATE",
                active: true,
                listening: status === "listening",
                speaking: status === "speaking",
              });
            }}
            onContextSender={(sender) => voiceBridgeRef.current.setContextSender(sender)}
            playbackContextRef={livePlaybackContextRef}
            shownProducts={voiceSession.shownProducts}
            cartItems={cart}
            conversationSummary={messages.filter((message) => message.id !== "welcome").slice(-10).map((message) => `${message.role}: ${message.text}`).join("\n")}
            lockedLanguage={conversationLanguage}
            preferredVoiceName={VOICE_BY_GENDER[voiceGender]}
          />
        ) : (
          <form className={styles.composer} onSubmit={onSubmit}>
            <input
              ref={galleryInputRef}
              type="file"
              accept="image/*,.heic,.heif"
              className={styles.hiddenFileInput}
              onChange={(event) => {
                const file = event.target.files?.[0];
                event.target.value = "";
                if (file) void handleImageFile(file);
              }}
            />
            <input
              ref={cameraInputRef}
              type="file"
              accept="image/*,.heic,.heif"
              capture="environment"
              className={styles.hiddenFileInput}
              onChange={(event) => {
                const file = event.target.files?.[0];
                event.target.value = "";
                if (file) void handleImageFile(file);
              }}
            />
            <button type="button" className={clsx(styles.composerIconBtn, styles.desktopImageBtn)} title="Search by photo" aria-label="Search by photo" onClick={() => galleryInputRef.current?.click()}>
              <ImageIcon size={18} />
            </button>
            <button type="button" className={clsx(styles.composerIconBtn, styles.desktopImageBtn)} title="Take a photo" aria-label="Take a photo" onClick={() => cameraInputRef.current?.click()}>
              <Camera size={18} />
            </button>
            <button type="button" className={clsx(styles.composerIconBtn, styles.mobileImageBtn)} title="Search by image" aria-label="Search by image" onClick={() => setShowImageSheet(true)}>
              <ImageIcon size={18} />
            </button>
            {pendingImage && (
              <div className={styles.pendingImageChip}>
                <img src={pendingImage.url} alt="Selected image" />
                <span>Ready</span>
                <button
                  type="button"
                  aria-label="Remove image"
                  onClick={() => {
                    URL.revokeObjectURL(pendingImage.url);
                    setPendingImage(null);
                  }}
                >
                  <X size={13} />
                </button>
              </div>
            )}
            <input
              ref={inputRef}
              className={styles.composerInput}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onPaste={(event) => {
                const imageItem = Array.from(event.clipboardData.items).find((item) => item.type.startsWith("image/"));
                const file = imageItem?.getAsFile();
                if (file) {
                  event.preventDefault();
                  addAssistantMessage("Image pasted! Add a message and press send.");
                  void handleImageFile(file);
                }
              }}
              placeholder="Ask Kade AI... / කඩේ AI එකෙන් විමසන්න..."
              disabled={chatBusy}
            />
            <button 
              type="button" 
              className={styles.composerIconBtn}
              aria-label="Voice"
              onClick={openLiveCall}
            >
              <Mic size={18} />
            </button>
            <button
              type="submit"
              className={styles.composerSend}
              disabled={(!input.trim() && !pendingImage) || chatBusy}
              aria-label="Send"
            >
              {chatBusy ? <Loader2 size={18} className={styles.spinIcon} /> : <Send size={18} />}
            </button>
          </form>
        )}
        {showImageSheet && (
          <div className={styles.imageSheetBackdrop} onClick={() => setShowImageSheet(false)}>
            <div className={styles.imageSheet} onClick={(event) => event.stopPropagation()}>
              <h3>Search by image</h3>
              <button type="button" onClick={() => { setShowImageSheet(false); cameraInputRef.current?.click(); }}>
                <Camera size={18} />
                Take a photo
              </button>
              <button type="button" onClick={() => { setShowImageSheet(false); galleryInputRef.current?.click(); }}>
                <ImageIcon size={18} />
                Choose from gallery
              </button>
              <button type="button" className={styles.imageSheetCancel} onClick={() => setShowImageSheet(false)}>
                Cancel
              </button>
            </div>
          </div>
        )}
      </section>

      {/* ═══ RIGHT: Product Detail ═══ */}
      <aside className={clsx(styles.detailPane, voiceFormFillKey > 0 && rightTab === "order" && styles.detailPaneVoiceFocus)}>
        <div className={styles.detailPanelHeader}>
          <div className={styles.rightTabs}>
            <button
              type="button"
              className={clsx(styles.rightTab, rightTab === "product" && styles.rightTabActive)}
              onClick={() => {
                setRightTab("product");
                setShowCheckout(false);
              }}
            >
              Product
            </button>
            <button
              type="button"
              className={clsx(styles.rightTab, rightTab === "cart" && styles.rightTabActive)}
              onClick={() => setRightTab("cart")}
            >
              Cart
              <span>{cart.length}</span>
            </button>
            {orderDraft && (
              <button
                type="button"
                className={clsx(styles.rightTab, rightTab === "order" && styles.rightTabActive)}
                onClick={() => setRightTab("order")}
              >
                Order
                <span>{getMissingFields(orderDraft).length === 0 ? <Check size={11} /> : `${orderProgressCount(orderDraft)}/5`}</span>
              </button>
            )}
          </div>
          <button
            className={styles.deliveryCityChip}
            type="button"
            onClick={() => {
              setRightTab("product");
              setDetailOpen(true);
            }}
          >
            <MapPin size={12} />
            {city}
          </button>
          <button className={styles.panelCloseBtn} onClick={() => setDetailOpen(false)} aria-label="Close panel">
            <X size={16} />
          </button>
        </div>

        {rightTab === "product" ? (
          selectedProduct ? (
            <ProductDetailPanel
              selected={selectedProduct}
              city={city}
              cityOptions={deliveryCityOptions}
              deliveryDate={deliveryDate}
              deliveryQuote={deliveryQuote}
              busyAction={busyAction}
              onCityChange={setCity}
              onDateChange={setDeliveryDate}
              onCheckDelivery={checkDeliveryQuote}
              onConfirmDelivery={confirmDeliverySelection}
              onClearDelivery={() => setDeliveryQuote(null)}
              giftWrap={giftWrap}
              personalNote={personalNote}
              onGiftWrapToggle={() => setGiftWrap(!giftWrap)}
              onPersonalNoteToggle={() => setPersonalNote(!personalNote)}
              onAddToCart={() => addToCart(selectedProduct.product)}
              onOpenProductModal={() => openProductModal(selectedProduct.product)}
            />
          ) : (
            <div className={styles.detailEmpty}>
              {deliveryQuote && (
                <DeliveryCard
                  {...deliveryQuote}
                  onConfirm={confirmDeliverySelection}
                  onCheckAnother={() => setDeliveryQuote(null)}
                  onCheckNext={checkDeliveryQuote}
                />
              )}
              <div className={styles.detailEmptyIcon}>
                <ShoppingBag size={28} />
              </div>
              <h3>Search for products</h3>
              <p>Click a product chip to see details here.</p>
            </div>
          )
        ) : rightTab === "order" && orderDraft?.stage === "complete" && orderResult ? (
          <OrderSuccess
            order={orderResult}
            onTrackOrder={() => addAssistantMessage("After paying, send me the Kapruka order number and I will track it for you.")}
            onDone={() => {
              setOrderDraft(null);
              setOrderResult(null);
              clearOrderDraft();
              setRightTab("product");
            }}
          />
        ) : rightTab === "order" && orderDraft ? (
          <LiveOrderForm
            draft={orderDraft}
            onFieldEdit={editOrderField}
            onPlaceOrder={() => placeOrderFromDraft(orderDraft.stage === "error" ? { ...orderDraft, stage: "confirming" } : orderDraft)}
            onCancel={() => {
              clearOrderDraft();
              setOrderDraft(null);
              setOrderResult(null);
              setRightTab(cart.length ? "cart" : "product");
            }}
          />
        ) : showCheckout ? (
          <DeliveryDetailsPanel
            cart={cart}
            total={total}
            city={city}
            cityOptions={deliveryCityOptions}
            deliveryDate={deliveryDate}
            checkout={checkout}
            order={order}
            payUrl={payUrl}
            deliveryQuote={deliveryQuote}
            busyAction={busyAction}
            canCheckout={Boolean(canCheckout)}
            onCityChange={setCity}
            onDateChange={setDeliveryDate}
            onCheckoutChange={setCheckout}
            onCheckDelivery={checkDeliveryQuote}
            onConfirmDelivery={confirmDeliverySelection}
            onClearDelivery={() => setDeliveryQuote(null)}
            onCreateOrder={createOrder}
            onBack={() => setShowCheckout(false)}
          />
        ) : (
          <div className={styles.cartTabContent}>
            <div className={styles.cartHeaderClean}>
              <h2>Your cart</h2>
              <span>Your gift bundle</span>
            </div>

            <div className={styles.cartItems}>
              {cart.length === 0 ? (
                <div className={styles.cartEmptyState}>
                  <div className={styles.detailEmptyIcon}>
                    <Gift size={26} />
                  </div>
                  <h3>Your cart is empty</h3>
                  <p>Add a product and I will help with delivery and checkout.</p>
                  {recentCarts.length > 0 && (
                    <div className={styles.recentCartList}>
                      <span>Order again</span>
                      {recentCarts.map((recent) => (
                        <button key={recent.id} type="button" onClick={() => restoreRecentCart(recent)}>
                          <History size={13} />
                          {recent.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                cart.map((item) => (
                  <div className={styles.cartItem} key={item.product.id}>
                    {firstImage(item.product) ? (
                      <img className={styles.cartItemImg} src={firstImage(item.product)} alt="" />
                    ) : (
                      <div className={styles.cartItemFallback}>
                        <ShoppingBag size={20} />
                      </div>
                    )}
                    <div className={styles.cartItemInfo}>
                      <h4>{item.product.name}</h4>
                      <span className={styles.cartItemPrice}>{money(item.product.price)}</span>
                      <div className={styles.cartItemQty}>
                        <button onClick={() => updateQuantity(item.product.id, -1)} aria-label="Decrease">
                          <Minus size={12} />
                        </button>
                        <span>{item.quantity}</span>
                        <button onClick={() => updateQuantity(item.product.id, 1)} aria-label="Increase">
                          <Plus size={12} />
                        </button>
                        <button
                          className={styles.cartItemRemove}
                          onClick={() => updateQuantity(item.product.id, -99)}
                          aria-label="Remove"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className={styles.cartFooter}>
              <div className={styles.cartTotal}>
                <span>Total</span>
                <span className={styles.cartTotalPrice}>{money({ amount: total, currency: "LKR" })}</span>
              </div>
              <button className={styles.checkoutBtn} disabled={cart.length === 0} onClick={openDeliveryDetails}>
                <LockKeyhole size={16} />
                Proceed to Secure Kapruka Checkout
              </button>
              <button className={styles.saveCartBtn} type="button" onClick={() => saveRecentCart()} disabled={cart.length === 0}>
                <Bookmark size={14} />
                Save for reorder
              </button>
            </div>
          </div>
        )}
      </aside>

      <ProductModal
        open={Boolean(modalProduct)}
        productId={modalProduct?.id ?? null}
        fallbackProduct={modalProduct}
        onClose={() => setModalProduct(null)}
        onAddToCart={addToCart}
      />
    </main>
  );
}

/* ── Message Content — simple markdown-like rendering ── */

function MessageContent({ text }: { text: string }) {
  // Simple markdown: **bold**, split by newlines
  const lines = text.split("\n");
  return (
    <>
      {lines.map((line, i) => {
        if (!line.trim()) return <br key={i} />;
        // Bold
        const parts = line.split(/(\*\*[^*]+\*\*)/g);
        return (
          <p key={i}>
            {parts.map((part, j) => {
              if (part.startsWith("**") && part.endsWith("**")) {
                return <strong key={j}>{part.slice(2, -2)}</strong>;
              }
              return <span key={j}>{part}</span>;
            })}
          </p>
        );
      })}
    </>
  );
}

/* ── Product Card ── */

function ProductCard({
  product,
  index,
  selected,
  onAdd,
  onSelect,
}: {
  product: Product;
  index: number;
  selected: boolean;
  onAdd: (p: Product) => void;
  onSelect: () => void;
}) {
  const pick = productPickMeta(product, index);

  return (
    <div className={clsx(styles.productCard, selected && styles.productCardSelected)} onClick={onSelect}>
      <div className={styles.productCardImage}>
        {firstImage(product) ? (
          <img src={firstImage(product)} alt={product.name} />
        ) : (
          <div className={styles.productCardFallback}>
            <ShoppingBag size={28} />
          </div>
        )}
        <span className={clsx(styles.stockBadge, !product.in_stock && styles.stockBadgeOut)}>
          {product.in_stock ? "In Stock" : "Check Stock"}
        </span>
        <span className={styles.pickBadge}>{pick.badge}</span>
      </div>
      <div className={styles.productCardBody}>
        <h4>{product.name}</h4>
        <p>{product.summary || product.category?.name || "Kapruka product"}</p>
        <div className={styles.pickReason}>
          <Sparkles size={11} />
          <span>{pick.reason}</span>
        </div>
        <div className={styles.productCardFoot}>
          <strong>{money(product.price)}</strong>
          <button
            className={styles.addCartBtn}
            onClick={(e) => {
              e.stopPropagation();
              onAdd(product);
            }}
            aria-label={`Add ${product.name} to cart`}
          >
            <Plus size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}

function TrackingTimeline({ result }: { result: Record<string, unknown> }) {
  const status = String(result.status ?? result.order_status ?? "Tracking received");
  const steps = [
    "Order received",
    status,
    result.delivery_status ? String(result.delivery_status) : "Delivery update pending",
  ].filter(Boolean);

  return (
    <div className={styles.trackingTimeline}>
      {steps.map((step, index) => (
        <div className={styles.trackingStep} key={`${step}-${index}`}>
          <span />
          <p>{step}</p>
        </div>
      ))}
    </div>
  );
}

function DeliveryDetailsPanel({
  cart,
  total,
  city,
  cityOptions,
  deliveryDate,
  checkout,
  order,
  payUrl,
  deliveryQuote,
  busyAction,
  canCheckout,
  onCityChange,
  onDateChange,
  onCheckoutChange,
  onCheckDelivery,
  onConfirmDelivery,
  onClearDelivery,
  onCreateOrder,
  onBack,
}: {
  cart: CartItem[];
  total: number;
  city: string;
  cityOptions: DeliveryCity[];
  deliveryDate: string;
  checkout: {
    recipientName: string;
    recipientPhone: string;
    address: string;
    senderName: string;
    anonymous: boolean;
    giftMessage: string;
  };
  order: Record<string, unknown> | null;
  payUrl: string | null;
  deliveryQuote: DeliveryResult | null;
  busyAction: string | null;
  canCheckout: boolean;
  onCityChange: (value: string) => void;
  onDateChange: (value: string) => void;
  onCheckoutChange: (value: {
    recipientName: string;
    recipientPhone: string;
    address: string;
    senderName: string;
    anonymous: boolean;
    giftMessage: string;
  }) => void;
  onCheckDelivery: () => void;
  onConfirmDelivery: () => void;
  onClearDelivery: () => void;
  onCreateOrder: () => void;
  onBack: () => void;
}) {
  return (
    <div className={styles.checkoutSection}>
      <div className={styles.deliveryHero}>
        <button type="button" className={styles.deliveryBackBtn} onClick={onBack}>
          <Package size={14} />
          Back to product
        </button>
        <h2>Continue to delivery</h2>
        <p>No form stress. Just the details Kapruka needs for the secure pay link.</p>
      </div>

      <div className={styles.checkoutSummary}>
        <span>{cart.length} item{cart.length === 1 ? "" : "s"} in bundle</span>
        <strong>{money({ amount: total, currency: "LKR" })}</strong>
      </div>

      <div className={styles.deliveryMiniCart}>
        {cart.slice(0, 3).map((item) => (
          <div key={item.product.id}>
            {firstImage(item.product) ? <img src={firstImage(item.product)} alt="" /> : <span />}
            <p>{item.product.name}</p>
            <strong>{item.quantity}x</strong>
          </div>
        ))}
        {cart.length > 3 && <small>+ {cart.length - 3} more items</small>}
      </div>

      <div className={styles.checkoutGroup}>
        <label>
          <span>Delivery city</span>
          <select className={styles.checkoutInput} value={city} onChange={(e) => onCityChange(e.target.value)}>
            {(cityOptions.length ? cityOptions : [{ name: city }]).map((option) => (
              <option key={option.name} value={option.name}>
                {option.name}
              </option>
            ))}
          </select>
        </label>

        <label>
          <span>Delivery date</span>
          <input
            className={styles.checkoutInput}
            type="date"
            min={today}
            value={deliveryDate}
            onChange={(e) => onDateChange(e.target.value)}
          />
        </label>

        <button className={styles.deliveryQuoteBtn} type="button" onClick={onCheckDelivery} disabled={busyAction === "delivery"}>
          {busyAction === "delivery" ? <Loader2 size={15} className={styles.spinIcon} /> : <Truck size={15} />}
          Check delivery price
        </button>
      </div>

      {deliveryQuote && (
        <DeliveryCard
          {...deliveryQuote}
          onConfirm={onConfirmDelivery}
          onCheckAnother={onClearDelivery}
          onCheckNext={onCheckDelivery}
        />
      )}

      <div className={styles.checkoutGroup}>
        <input
          className={styles.checkoutInput}
          placeholder="Recipient name"
          value={checkout.recipientName}
          onChange={(e) => onCheckoutChange({ ...checkout, recipientName: e.target.value })}
        />
        <input
          className={styles.checkoutInput}
          placeholder="Recipient phone"
          value={checkout.recipientPhone}
          onChange={(e) => onCheckoutChange({ ...checkout, recipientPhone: e.target.value })}
        />
        <textarea
          className={`${styles.checkoutInput} ${styles.checkoutTextarea}`}
          placeholder="Delivery address"
          value={checkout.address}
          onChange={(e) => onCheckoutChange({ ...checkout, address: e.target.value })}
        />
        <input
          className={styles.checkoutInput}
          placeholder="Sender name (optional)"
          value={checkout.senderName}
          onChange={(e) => onCheckoutChange({ ...checkout, senderName: e.target.value })}
        />
        <textarea
          className={`${styles.checkoutInput} ${styles.checkoutTextarea}`}
          placeholder="Gift message (optional)"
          value={checkout.giftMessage}
          onChange={(e) => onCheckoutChange({ ...checkout, giftMessage: e.target.value })}
        />
        <label className={styles.checkoutRow}>
          <input
            type="checkbox"
            checked={checkout.anonymous}
            onChange={(e) => onCheckoutChange({ ...checkout, anonymous: e.target.checked })}
          />
          Send anonymously
        </label>
      </div>

      <button className={styles.payBtn} onClick={onCreateOrder} disabled={!canCheckout || busyAction === "order"}>
        {busyAction === "order" ? <Loader2 size={16} className={styles.spinIcon} /> : <ShoppingBag size={16} />}
        Create secure Kapruka pay link
      </button>

      {order && (
        <div className={styles.orderResult}>
          {payUrl && (
            <a href={payUrl} target="_blank" rel="noreferrer" className={styles.orderResultLink}>
              <ExternalLink size={16} /> Open secure payment link
            </a>
          )}
          <p className={styles.orderResultNote}>Secure checkout is ready. The payment link locks the current cart and delivery details.</p>
        </div>
      )}
    </div>
  );
}

/* ── Product Detail Panel ── */

function ProductDetailPanel({
  selected,
  city,
  cityOptions,
  deliveryDate,
  deliveryQuote,
  busyAction,
  onCityChange,
  onDateChange,
  onCheckDelivery,
  onConfirmDelivery,
  onClearDelivery,
  giftWrap,
  personalNote,
  onGiftWrapToggle,
  onPersonalNoteToggle,
  onAddToCart,
  onOpenProductModal,
}: {
  selected: SelectedProduct;
  city: string;
  cityOptions: DeliveryCity[];
  deliveryDate: string;
  deliveryQuote: DeliveryResult | null;
  busyAction: string | null;
  onCityChange: (v: string) => void;
  onDateChange: (v: string) => void;
  onCheckDelivery: () => void;
  onConfirmDelivery: () => void;
  onClearDelivery: () => void;
  giftWrap: boolean;
  personalNote: boolean;
  onGiftWrapToggle: () => void;
  onPersonalNoteToggle: () => void;
  onAddToCart: () => void;
  onOpenProductModal: () => void;
}) {
  const { product } = selected;

  return (
    <>
      <button className={styles.detailImage} type="button" onClick={onOpenProductModal}>
        {firstImage(product) ? (
          <img src={firstImage(product)} alt={product.name} />
        ) : (
          <div className={styles.productCardFallback} style={{ aspectRatio: "4/3" }}>
            <ShoppingBag size={48} />
          </div>
        )}
        <div className={styles.detailBadges}>
          {product.in_stock && (
            <span className={clsx(styles.detailBadge, styles.detailBadgeStock)}>In Stock</span>
          )}
          <span className={clsx(styles.detailBadge, styles.detailBadgeDelivery)}>Next Day Delivery</span>
        </div>
        <div className={styles.detailImageOverlay}>
          <ZoomIn size={24} />
          <span>View details</span>
        </div>
      </button>

      <div className={styles.detailContent}>
        <h2>{product.name}</h2>

        <div className={styles.detailPricing}>
          <span className={styles.detailPrice}>{money(product.price)}</span>
          {product.compare_at_price?.amount && (
            <span className={styles.detailCompare}>{money(product.compare_at_price)}</span>
          )}
        </div>

        <button className={styles.detailAddBtn} onClick={onAddToCart}>
          <ShoppingCart size={18} /> Add to Cart
        </button>

        {deliveryQuote ? (
          <DeliveryCard
            {...deliveryQuote}
            onConfirm={onConfirmDelivery}
            onCheckAnother={onClearDelivery}
            onCheckNext={onCheckDelivery}
          />
        ) : (
          <div className={styles.deliveryPlaceholder}>
            <div className={styles.deliveryPlaceholderTitle}>
              <Truck size={17} />
              <strong>{city ? `Delivery to ${city}` : "Check delivery availability"}</strong>
            </div>
            <label>
              <span>City</span>
              <select className={styles.checkoutInput} value={city} onChange={(e) => onCityChange(e.target.value)}>
                {cityOptions.map((option) => (
                  <option key={option.name} value={option.name}>
                    {option.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span>Date</span>
              <input
                className={styles.checkoutInput}
                type="date"
                min={today}
                value={deliveryDate}
                onChange={(e) => onDateChange(e.target.value)}
              />
            </label>
            <button
              className={styles.deliveryQuoteBtn}
              type="button"
              onClick={onCheckDelivery}
              disabled={busyAction === "delivery"}
            >
              {busyAction === "delivery" ? <Loader2 size={15} className={styles.spinIcon} /> : <Truck size={15} />}
              Check delivery
            </button>
          </div>
        )}

        {/* Gift Options */}
        <div className={styles.giftOptions}>
          <div
            className={clsx(styles.giftOption, giftWrap && styles.giftOptionActive)}
            onClick={onGiftWrapToggle}
          >
            <div className={styles.giftOptionHeader}>
              <Gift size={18} />
              <div className={styles.giftOptionCheck}>{giftWrap && <Check size={12} />}</div>
            </div>
            <h5>Gift Wrap</h5>
            <span className={styles.giftOptionSub}>+ Rs. 250</span>
          </div>

          <div
            className={clsx(styles.giftOption, personalNote && styles.giftOptionActive)}
            onClick={onPersonalNoteToggle}
          >
            <div className={styles.giftOptionHeader}>
              <Tag size={18} />
              <div className={styles.giftOptionCheck}>{personalNote && <Check size={12} />}</div>
            </div>
            <h5>Personal Note</h5>
            <span className={styles.giftOptionSub}>Included</span>
          </div>

          <div className={styles.giftOption}>
            <div className={styles.giftOptionHeader}>
              <Package size={18} />
              <div className={styles.giftOptionCheck} />
            </div>
            <h5>Ingredients</h5>
            <span className={styles.giftOptionSub}>Full details</span>
          </div>
        </div>

        {product.description && (
          <p style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.5 }}>
            {product.description}
          </p>
        )}
      </div>
    </>
  );
}

/* ── Live Call Overlay Component ── */

function LiveCallOverlay({
  onClose,
  onShoppingRequest,
  onCartAddRequest,
  onDeliveryCheckRequest,
  onCheckoutAction,
  onOrderFieldFill,
  onOrderFieldCorrection,
  onOrderReady,
  onConfirmOrder,
  onUserTranscript,
  onAssistantTranscript,
  onStatusChange,
  onContextSender,
  playbackContextRef,
  shownProducts,
  cartItems,
  conversationSummary,
  lockedLanguage,
  preferredVoiceName,
}: {
  onClose: () => void;
  onShoppingRequest: (text: string, args?: VoiceSearchArgs) => Promise<Product[]> | Product[] | void;
  onCartAddRequest: (args: VoiceCartAddArgs) => Record<string, unknown>;
  onDeliveryCheckRequest: (args: VoiceDeliveryCheckArgs) => Promise<Record<string, unknown>> | Record<string, unknown>;
  onCheckoutAction: (action: "start" | "detail" | "place", args?: VoiceCheckoutArgs) => Promise<Record<string, unknown>> | Record<string, unknown>;
  onOrderFieldFill: (args: VoiceOrderFieldArgs) => Record<string, unknown>;
  onOrderFieldCorrection: (args: VoiceOrderFieldArgs) => Record<string, unknown>;
  onOrderReady: (args?: VoiceOrderReadyArgs) => Record<string, unknown>;
  onConfirmOrder: (args: VoiceConfirmOrderArgs) => Promise<Record<string, unknown>> | Record<string, unknown>;
  onUserTranscript: (text: string) => void;
  onAssistantTranscript: (text: string, final?: boolean) => void;
  onStatusChange: (status: "connecting" | "listening" | "speaking") => void;
  onContextSender: (sender: ((text: string) => void) | null) => void;
  playbackContextRef: { current: AudioContext | null };
  shownProducts: ShownVoiceProduct[];
  cartItems: CartItem[];
  conversationSummary: string;
  lockedLanguage: ConversationLanguage;
  preferredVoiceName: (typeof LIVE_VOICES)[number];
}) {
  const [status, setStatus] = useState<"connecting" | "listening" | "speaking">("connecting");
  const [muted, setMuted] = useState(false);
  const [voiceName, setVoiceName] = useState<(typeof LIVE_VOICES)[number]>(preferredVoiceName);
  const [transcript, setTranscript] = useState("Connecting to Kade AI...");
  const [audioDebug, setAudioDebug] = useState("audio waiting");
  const [checkoutStatus, setCheckoutStatus] = useState("");
  const [cityPopup, setCityPopup] = useState<{ visible: boolean; reason: string; partialAddress: string }>({
    visible: false,
    reason: "",
    partialAddress: "",
  });
  const sessionRef = useRef<Awaited<ReturnType<GoogleGenAI["live"]["connect"]>> | null>(null);
  const mutedRef = useRef(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const nextPlayTimeRef = useRef(0);
  const playingSourcesRef = useRef<AudioBufferSourceNode[]>([]);
  const outputCompressorRef = useRef<DynamicsCompressorNode | null>(null);
  const liveReadyRef = useRef(false);
  const pendingMicChunksRef = useRef<string[]>([]);
  const closeRequestedRef = useRef(false);
  const voiceBriefRef = useRef<string[]>([]);
  const lastDispatchedVoiceRef = useRef("");
  const lastHandledInputTranscriptRef = useRef("");
  const pendingInputTranscriptRef = useRef("");
  const inputTranscriptTimerRef = useRef<number | null>(null);
  const directSearchFallbackTimerRef = useRef<number | null>(null);
  const pendingDirectSearchRef = useRef("");
  const pendingDirectSearchArgsRef = useRef<VoiceSearchArgs>({});
  const pendingDirectSearchOutputCounterRef = useRef(0);
  const productActionFallbackTimerRef = useRef<number | null>(null);
  const pendingProductActionRef = useRef("");
  const audioChunkCountRef = useRef(0);
  const onCloseRef = useRef(onClose);
  const onShoppingRequestRef = useRef(onShoppingRequest);
  const onCartAddRequestRef = useRef(onCartAddRequest);
  const onDeliveryCheckRequestRef = useRef(onDeliveryCheckRequest);
  const onCheckoutActionRef = useRef(onCheckoutAction);
  const onOrderFieldFillRef = useRef(onOrderFieldFill);
  const onOrderFieldCorrectionRef = useRef(onOrderFieldCorrection);
  const onOrderReadyRef = useRef(onOrderReady);
  const onConfirmOrderRef = useRef(onConfirmOrder);
  const onUserTranscriptRef = useRef(onUserTranscript);
  const onAssistantTranscriptRef = useRef(onAssistantTranscript);
  const onContextSenderRef = useRef(onContextSender);
  const statusRef = useRef(status);
  const latestOutputTranscriptRef = useRef("");
  const lastFinalOutputTranscriptRef = useRef("");
  const liveOutputCounterRef = useRef(0);
  const shownProductsRef = useRef(shownProducts);
  const cartItemsRef = useRef(cartItems);
  const conversationSummaryRef = useRef(conversationSummary);
  const lockedLanguageRef = useRef(lockedLanguage);
  const pendingCityToolRef = useRef<{ id?: string; name?: string; partialAddress?: string } | null>(null);
  const checkoutActiveRef = useRef(false);
  const liveSearchInFlightRef = useRef(false);
  const lastLiveSearchToolRef = useRef<{ input: string; at: number } | null>(null);
  const lastLocalVoiceStatusRef = useRef<{ text: string; at: number } | null>(null);

  useEffect(() => {
    mutedRef.current = muted;
  }, [muted]);

  useEffect(() => {
    setVoiceName(preferredVoiceName);
  }, [preferredVoiceName]);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    statusRef.current = status;
    onStatusChange(status);
  }, [status]);

  useEffect(() => {
    onShoppingRequestRef.current = onShoppingRequest;
  }, [onShoppingRequest]);

  useEffect(() => {
    onCartAddRequestRef.current = onCartAddRequest;
  }, [onCartAddRequest]);

  useEffect(() => {
    onDeliveryCheckRequestRef.current = onDeliveryCheckRequest;
  }, [onDeliveryCheckRequest]);

  useEffect(() => {
    onCheckoutActionRef.current = onCheckoutAction;
  }, [onCheckoutAction]);

  useEffect(() => {
    onOrderFieldFillRef.current = onOrderFieldFill;
  }, [onOrderFieldFill]);

  useEffect(() => {
    onOrderFieldCorrectionRef.current = onOrderFieldCorrection;
  }, [onOrderFieldCorrection]);

  useEffect(() => {
    onOrderReadyRef.current = onOrderReady;
  }, [onOrderReady]);

  useEffect(() => {
    onConfirmOrderRef.current = onConfirmOrder;
  }, [onConfirmOrder]);

  useEffect(() => {
    onUserTranscriptRef.current = onUserTranscript;
  }, [onUserTranscript]);

  useEffect(() => {
    onAssistantTranscriptRef.current = onAssistantTranscript;
  }, [onAssistantTranscript]);

  useEffect(() => {
    onContextSenderRef.current = onContextSender;
  }, [onContextSender]);

  useEffect(() => {
    shownProductsRef.current = shownProducts;
  }, [shownProducts]);

  useEffect(() => {
    cartItemsRef.current = cartItems;
  }, [cartItems]);

  useEffect(() => {
    conversationSummaryRef.current = conversationSummary;
  }, [conversationSummary]);

  useEffect(() => {
    lockedLanguageRef.current = lockedLanguage;
  }, [lockedLanguage]);

  const clearDirectSearchFallback = useCallback(() => {
    if (directSearchFallbackTimerRef.current) {
      window.clearTimeout(directSearchFallbackTimerRef.current);
      directSearchFallbackTimerRef.current = null;
    }
    pendingDirectSearchRef.current = "";
    pendingDirectSearchArgsRef.current = {};
    pendingDirectSearchOutputCounterRef.current = 0;
  }, []);

  const scheduleDirectSearchFallback = useCallback((_text: string, _args: VoiceSearchArgs = {}) => {
    // Disabled intentionally: Gemini/Gemma must call search tools explicitly.
  }, []);

  const clearProductActionFallback = useCallback(() => {
    if (productActionFallbackTimerRef.current) {
      window.clearTimeout(productActionFallbackTimerRef.current);
      productActionFallbackTimerRef.current = null;
    }
    pendingProductActionRef.current = "";
  }, []);

  const scheduleProductActionFallback = useCallback((_text: string) => {
    // Disabled intentionally: Gemini/Gemma must call cart tools explicitly.
  }, []);

  const handleVoiceTranscript = useCallback((text: string) => {
    const normalizedText = cleanVoiceTranscript(text);
    if (normalizedText.length < 3) return;
    if (normalizedText === lastHandledInputTranscriptRef.current) return;
    if (
      isLikelyAssistantEcho(normalizedText, latestOutputTranscriptRef.current) ||
      isLikelyAssistantEcho(normalizedText, lastFinalOutputTranscriptRef.current)
    ) {
      return;
    }
    lastHandledInputTranscriptRef.current = normalizedText;
    onUserTranscriptRef.current(normalizedText);

    const lower = normalizedText.toLowerCase();
    if (isCheckoutIntent(normalizedText) || /\b(payment link|pay link|place order|make the order|order this|checkout)\b/i.test(normalizedText)) {
      checkoutActiveRef.current = true;
      setCheckoutStatus("Collecting order details...");
    } else if (checkoutActiveRef.current && !/[?？]$/.test(normalizedText)) {
      setCheckoutStatus("Collecting order details...");
    }

    // Transcripts are display/history only. Gemini Live must call tools itself;
    // local keyword fallbacks caused surprise searches after the model asked a question.
    return;

    if (checkoutActiveRef.current) {
      clearDirectSearchFallback();
      clearProductActionFallback();
      return;
    }

    const looksLikeDeliveryQuoteIntent =
      /\b(delivery|deliver|shipping|ship)\b/.test(lower) &&
      /\b(fee|fees|cost|charge|charges|price|available|availability|how much|quote)\b/.test(lower);
    if (looksLikeDeliveryQuoteIntent) {
      clearDirectSearchFallback();
      clearProductActionFallback();
      return;
    }

    if (giftRequestNeedsAge(normalizedText, conversationSummaryRef.current) || shouldUseGiftResearchFlow(normalizedText, conversationSummaryRef.current)) {
      clearDirectSearchFallback();
      clearProductActionFallback();
      return;
    }

    const looksLikeMoreOptions =
      shownProductsRef.current.length > 0 &&
      isMoreOptionsRequest(normalizedText);
    if (looksLikeMoreOptions) {
      clearProductActionFallback();
      setTranscript("Searching for more options...");
      scheduleDirectSearchFallback(normalizedText, { mode: "more" });
      return;
    }

    const looksLikeProductReference =
      shownProductsRef.current.length > 0 &&
      (/\b(number|no\.?|#?\d+|first|second|third|fourth|fifth|cheap|cheapest|best|hoda|laabu|dekweni|thunweni)\b/.test(lower) ||
        /\b(add|cart|select|choose|pick|ganna|damu|karamu)\b/.test(lower));

    if (looksLikeProductReference) {
      setTranscript("Selecting that product...");
      scheduleProductActionFallback(normalizedText);
      return;
    }

    const isConfirmation =
      /\b(okay|ok|yes|yeah|yep|sure|correct|confirm|search|show me|show them|find them|go ahead|that's all|thats all|hari|ela|ow|oya)\b/.test(lower) ||
      /හරි|ඔව්|ඔයා|බලන්න|හොයන්න|පෙන්වන්න|ඒක තමයි|சரி|ஆம்|தேடு|காட்டு/.test(normalizedText);

    const hasShoppingSignal =
      /\b(cakes?|birthday|flowers?|roses?|bouquet|gifts?|chocolates?|biscuits?|cookies?|crackers?|hamper|delivery|colombo|kandy|galle|vanilla|chocolate|small|large|big|budget|under|rs|lkr|toys?|cars?|vehicles?|models?|die-?cast|dicast|miniature|collectible|collectable|hot wheels?)\b/.test(lower) ||
      /කේක්|උපන්දින|මල්|රෝස|තෑගි|චොකලට්|බිස්කට්|කොළඹ|වැනිලා|පොඩි|ලොකු|යට|கேக்|பிறந்தநாள்|பூ|மலர்|பரிசு|சாக்லேட்|பிஸ்கட்|கொழும்பு/.test(normalizedText);

    const isDirectProductSearch =
      /\b(show|find|search|browse|look for|check|see|display|hoyanna|balanna|pennanna|denna|ganna)\b/.test(lower);

    if (hasShoppingSignal && isDirectProductSearch) {
      const lastBrief = voiceBriefRef.current[voiceBriefRef.current.length - 1];
      if (lastBrief !== normalizedText) {
        voiceBriefRef.current = [...voiceBriefRef.current, normalizedText].slice(-6);
      }
      scheduleDirectSearchFallback(normalizedText);
      return;
    }

    if (hasShoppingSignal && !isConfirmation) {
      const lastBrief = voiceBriefRef.current[voiceBriefRef.current.length - 1];
      if (lastBrief !== normalizedText) {
        voiceBriefRef.current = [...voiceBriefRef.current, normalizedText].slice(-6);
      }
      const isConcreteProductAnswer =
        /\b(chocolate|vanilla|fruit|butter|bento|biscuits?|cookies?|crackers?|flowers?|roses?|bouquet|toys?|cars?|vehicles?|models?|die-?cast|dicast|miniature|collectible|collectable|hot wheels?)\b/.test(lower) ||
        hasModelVehicleIntent(normalizedText) ||
        (/\b(cakes?)\b/.test(lower) && !isBroadCakeSearch(normalizedText));
      if (isConcreteProductAnswer) {
        scheduleDirectSearchFallback(normalizedText);
      }
      return;
    }

    if (!isConfirmation) {
      return;
    }

    const briefParts = voiceBriefRef.current.length ? voiceBriefRef.current : [normalizedText];
    const searchText = [...briefParts, normalizedText].join(". ");
    if (voiceBriefRef.current.length === 0) {
      return;
    }
    if (searchText.length < 3 || searchText === lastDispatchedVoiceRef.current) return;

    voiceBriefRef.current = [];
  }, [clearDirectSearchFallback, clearProductActionFallback, scheduleDirectSearchFallback, scheduleProductActionFallback]);

  const sendToolResponse = useCallback((functionCall: FunctionCall, response: Record<string, unknown>) => {
    const session = sessionRef.current;
    if (!session) return;
    session.sendToolResponse({
      functionResponses: [
        {
          id: functionCall.id,
          name: functionCall.name,
          response,
        },
      ],
    });
  }, []);

  const sendToolResponseById = useCallback((id: string | undefined, name: string | undefined, response: Record<string, unknown>) => {
    const session = sessionRef.current;
    if (!session || !name) return;
    session.sendToolResponse({
      functionResponses: [
        {
          id,
          name,
          response,
        },
      ],
    });
  }, []);

  const showLocalVoiceStatus = useCallback((text?: unknown) => {
    const spokenText = typeof text === "string" ? cleanVoiceTranscript(text) : "";
    if (!spokenText) return;
    const recent = lastLocalVoiceStatusRef.current;
    if (recent && Date.now() - recent.at < 2500 && isNearDuplicateTranscript(spokenText, recent.text)) {
      return;
    }
    lastLocalVoiceStatusRef.current = { text: spokenText, at: Date.now() };
    setTranscript(spokenText);
  }, []);

  const nudgeLiveToSpeak = useCallback((text?: unknown) => {
    const spokenText = typeof text === "string" ? cleanVoiceTranscript(text) : "";
    if (!spokenText) return;
    const outputCounterAtSchedule = liveOutputCounterRef.current;
    window.setTimeout(() => {
      if (liveOutputCounterRef.current !== outputCounterAtSchedule) return;
      if (statusRef.current === "speaking") return;
      showLocalVoiceStatus(spokenText);
    }, 700);
  }, [showLocalVoiceStatus]);

  const liveToolPhrase = useCallback((toolName: string, phase: "start" | "ready", count = 0) => {
    const language = lockedLanguageRef.current;
    const isSearch = toolName === "kapruka_search_products" || toolName === "search_products";
    const isDelivery = toolName === "kapruka_check_delivery" || toolName === "check_delivery";
    const isOrder = toolName === "confirm_and_place_order" || toolName === "checkout_place_order";
    const isTracking = toolName === "kapruka_track_order" || toolName === "track_order";

    if (phase === "ready" && isSearch) {
      if (language === "ta") {
        return count > 0 ? `கிடைத்தது! ${count} options இருக்கு - பாருங்க.` : "Aiyo, exact match கிடைக்கல. வேற option பார்க்கலாமா?";
      }
      if (language === "si") {
        return count > 0 ? `හොයාගත්තා! options ${count}ක් තියෙනවා - බලන්න.` : "Aiyo, exact match එක නෑ වගේ. වෙන option එකක් බලමුද?";
      }
      return count > 0 ? `Found ${count} good options for you.` : "I could not find that exact one. Want to try a nearby option?";
    }

    if (isSearch) {
      if (language === "ta") return "சரி, Kaprukaல check பண்ணுறேன்.";
      if (language === "si") return "හරි, Kapruka එකේ බලනවා.";
      return "Let me search Kapruka for that.";
    }
    if (isDelivery) {
      if (language === "ta") return "Delivery availability check பண்ணுறேன்.";
      if (language === "si") return "Delivery availability එක check කරනවා.";
      return "Checking delivery availability.";
    }
    if (isOrder) {
      if (language === "ta") return "Order setup பண்ணுறேன்.";
      if (language === "si") return "Order එක setup කරනවා.";
      return "Setting up your order now.";
    }
    if (isTracking) {
      if (language === "ta") return "Order status பார்க்குறேன்.";
      if (language === "si") return "Order status එක බලනවා.";
      return "Looking up your order status.";
    }
    return "";
  }, []);

  const liveOrderFailurePhrase = useCallback(() => {
    const language = lockedLanguageRef.current;
    if (language === "ta") {
      return "Order create panna mudiyala. Details check pannitu again try pannalama?";
    }
    if (language === "si") {
      return "Order eka hadaganna bari una. Details tika check karala ayeth try karamu da?";
    }
    return "The order did not go through on my side. Want me to check the details and try again?";
  }, []);

  const promptLiveToSpeakNow = useCallback((text: string) => {
    if (statusRef.current === "speaking") return;
    showLocalVoiceStatus(text);
  }, [showLocalVoiceStatus]);

  const executeLiveToolCall = useCallback(async (functionCall: FunctionCall) => {
    const name = functionCall.name ?? "";
    const rawArgs = (functionCall.args ?? {}) as Record<string, unknown>;

    if (name === "research_gift_ideas") {
      try {
        clearDirectSearchFallback();
        clearProductActionFallback();
        promptLiveToSpeakNow(
          lockedLanguageRef.current === "ta"
            ? "Gift idea konjam yosichu paakuren."
            : lockedLanguageRef.current === "si"
              ? "Gift idea eka poddak balannam."
              : "Let me think through the gift idea first."
        );
        const recipient = String(rawArgs.recipient ?? "").trim();
        const age = String(rawArgs.age ?? "").trim();
        const occasion = String(rawArgs.occasion ?? "").trim();
        const interests = String(rawArgs.interests ?? "").trim();
        const budget = String(rawArgs.budget ?? "").trim();
        const userRequest = String(rawArgs.userRequest ?? "").trim();
        const message = [
          recipient ? `Recipient: ${recipient}` : "",
          age ? `Age: ${age}` : "",
          occasion ? `Occasion: ${occasion}` : "",
          interests ? `Interests: ${interests}` : "",
          budget ? `Budget: ${budget}` : "",
          userRequest ? `Request: ${userRequest}` : "",
        ].filter(Boolean).join("\n") || userRequest || recipient || "gift ideas";

        const response = await fetch("/api/gift-research", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message,
            context: conversationSummaryRef.current,
          }),
        });
        const data = await response.json();
        sendToolResponse(functionCall, { output: data });
      } catch (error) {
        sendToolResponse(functionCall, {
          error: error instanceof Error ? error.message : "Gift research failed.",
        });
      }
      return;
    }

    if (name === "update_cart_from_voice" || name === "cart_add_item") {
      try {
        clearDirectSearchFallback();
        clearProductActionFallback();
        const result = onCartAddRequestRef.current(rawArgs as VoiceCartAddArgs);
        sendToolResponse(functionCall, { output: result });
      } catch (error) {
        sendToolResponse(functionCall, {
          error: error instanceof Error ? error.message : "Could not add item to cart.",
        });
      }
      return;
    }

    if (name === "kapruka_check_delivery" || name === "check_delivery") {
      try {
        promptLiveToSpeakNow(liveToolPhrase(name, "start"));
        clearDirectSearchFallback();
        clearProductActionFallback();
        setCheckoutStatus("");
        setTranscript("Checking delivery...");
        const result = await onDeliveryCheckRequestRef.current(rawArgs as VoiceDeliveryCheckArgs);
        sendToolResponse(functionCall, { output: result });
        if (result.say_next) nudgeLiveToSpeak(result.say_next);
      } catch (error) {
        sendToolResponse(functionCall, {
          error: error instanceof Error ? error.message : "Could not check delivery.",
        });
        nudgeLiveToSpeak("Aiyo, delivery check eka fail una. City eka ayeth kiyanna puluwanda?");
      }
      return;
    }

    if (name === "fill_order_field") {
      try {
        clearDirectSearchFallback();
        clearProductActionFallback();
        checkoutActiveRef.current = true;
        setCheckoutStatus("Collecting order details...");
        const result = onOrderFieldFillRef.current(rawArgs as VoiceOrderFieldArgs);
        sendToolResponse(functionCall, { output: result });
        if (result.say_next) nudgeLiveToSpeak(result.say_next);
      } catch (error) {
        setCheckoutStatus("Checkout needs attention");
        sendToolResponse(functionCall, {
          error: error instanceof Error ? error.message : "Could not fill order field.",
        });
        nudgeLiveToSpeak("Aiyo, detail eka fill karanna podi issue ekak awa. Eka ayeth kiyanna.");
      }
      return;
    }

    if (name === "correct_order_field") {
      try {
        clearDirectSearchFallback();
        clearProductActionFallback();
        checkoutActiveRef.current = true;
        setCheckoutStatus("Correcting detail...");
        const result = onOrderFieldCorrectionRef.current(rawArgs as VoiceOrderFieldArgs);
        sendToolResponse(functionCall, { output: result });
        if (result.say_next) nudgeLiveToSpeak(result.say_next);
        window.setTimeout(() => setCheckoutStatus("Collecting order details..."), 900);
      } catch (error) {
        setCheckoutStatus("Checkout needs attention");
        sendToolResponse(functionCall, {
          error: error instanceof Error ? error.message : "Could not correct order field.",
        });
      }
      return;
    }

    if (name === "confirm_order_ready") {
      try {
        clearDirectSearchFallback();
        clearProductActionFallback();
        checkoutActiveRef.current = true;
        setCheckoutStatus("Review on the right ->");
        const result = onOrderReadyRef.current(rawArgs as VoiceOrderReadyArgs);
        sendToolResponse(functionCall, { output: result });
        if (result.say_next) nudgeLiveToSpeak(result.say_next);
      } catch (error) {
        setCheckoutStatus("Checkout needs attention");
        sendToolResponse(functionCall, {
          error: error instanceof Error ? error.message : "Could not mark order ready.",
        });
      }
      return;
    }

    if (name === "request_city_input") {
      clearDirectSearchFallback();
      clearProductActionFallback();
      checkoutActiveRef.current = true;
      const reason = String(rawArgs.reason ?? "I could not hear the city clearly. Type it here and I will continue.");
      const partialAddress = String(rawArgs.partialAddress ?? "");
      pendingCityToolRef.current = {
        id: functionCall.id,
        name: functionCall.name,
        partialAddress,
      };
      setCheckoutStatus("Waiting for city...");
      setCityPopup({ visible: true, reason, partialAddress });
      return;
    }

    if (name === "confirm_and_place_order") {
      try {
        promptLiveToSpeakNow(liveToolPhrase(name, "start"));
        clearDirectSearchFallback();
        clearProductActionFallback();
        checkoutActiveRef.current = true;
        setCheckoutStatus("Placing order...");
        setTranscript("Placing order...");
        const result = await onConfirmOrderRef.current(rawArgs as VoiceConfirmOrderArgs);
        sendToolResponse(functionCall, { output: result });
        nudgeLiveToSpeak(result.say_next);
        setCheckoutStatus(result.ok ? "Payment link ready" : "Order needs attention");
        if (result.ok) checkoutActiveRef.current = false;
      } catch (error) {
        setCheckoutStatus("Order needs attention");
        sendToolResponse(functionCall, {
          error: error instanceof Error ? error.message : "Could not place order.",
        });
        nudgeLiveToSpeak(liveOrderFailurePhrase());
      }
      return;
    }

    if (name === "checkout_start") {
      try {
        clearDirectSearchFallback();
        const result = await onCheckoutActionRef.current("start", {});
        sendToolResponse(functionCall, { output: result });
        nudgeLiveToSpeak(result.say_next);
      } catch (error) {
        sendToolResponse(functionCall, {
          error: error instanceof Error ? error.message : "Could not start checkout.",
        });
      }
      return;
    }

    if (name === "checkout_provide_detail") {
      try {
        clearDirectSearchFallback();
        const result = await onCheckoutActionRef.current("detail", rawArgs as VoiceCheckoutArgs);
        sendToolResponse(functionCall, { output: result });
        nudgeLiveToSpeak(result.say_next);
      } catch (error) {
        sendToolResponse(functionCall, {
          error: error instanceof Error ? error.message : "Could not update checkout details.",
        });
      }
      return;
    }

    if (name === "checkout_place_order") {
      try {
        clearDirectSearchFallback();
        const result = await onCheckoutActionRef.current("place", {});
        sendToolResponse(functionCall, { output: result });
        nudgeLiveToSpeak(result.say_next);
      } catch (error) {
        sendToolResponse(functionCall, {
          error: error instanceof Error ? error.message : "Could not place order.",
        });
      }
      return;
    }

    const args = rawArgs as VoiceSearchArgs;

    if (name !== "kapruka_search_products" && name !== "search_products") {
      sendToolResponse(functionCall, {
        error: `Unsupported voice tool: ${name || "unknown"}`,
      });
      return;
    }

    if (checkoutActiveRef.current) {
      sendToolResponse(functionCall, {
        error: "Checkout is active. Do not search products for checkout answers. Continue collecting the current checkout detail or confirm/place the order.",
      });
      nudgeLiveToSpeak("Checkout details walata answer eka ganna. Product search karanna one na.");
      return;
    }

    const q = String(args.q ?? args.query ?? "").trim();
    if (!q) {
      sendToolResponse(functionCall, {
        error: "Missing search query. Ask the user one short clarifying question.",
      });
      return;
    }

    // Prevent duplicate concurrent searches — if a search is already running,
    // tell the model to wait instead of firing another one.
    if (liveSearchInFlightRef.current) {
      sendToolResponse(functionCall, {
        output: {
          query: q,
          rendered_in_ui: false,
          count: 0,
          instruction: "A search is already in progress for this request. Do NOT call kapruka_search_products again. Wait for the current search to finish, then present the results.",
        },
      });
      return;
    }

    const isMoreSearch = args.mode === "more" || isMoreOptionsRequest(lastHandledInputTranscriptRef.current) || isMoreOptionsRequest(q);
    const lastSearchTool = lastLiveSearchToolRef.current;
    if (
      !isMoreSearch &&
      lastSearchTool &&
      lastSearchTool.input === lastHandledInputTranscriptRef.current &&
      Date.now() - lastSearchTool.at < 9000
    ) {
      sendToolResponse(functionCall, {
        output: {
          query: q,
          rendered_in_ui: false,
          count: 0,
          instruction: "A Kapruka search was already rendered for this user turn. Do NOT call another search now. Use the visible cards, or ask the user one short follow-up question.",
        },
      });
      return;
    }

    if (!isMoreSearch && (isBroadCakeSearch(q, args) || (isBroadCakeSearch(lastHandledInputTranscriptRef.current) && isCakeQuery(q, args)))) {
      const question = lockedLanguageRef.current === "ta"
        ? "Cake பார்க்கலாம். Birthday cake வேண்டுமா, chocolate cake வேண்டுமா, இல்ல simple tea-time cake வேண்டுமா?"
        : lockedLanguageRef.current === "si"
          ? "Cake බලමු. Birthday cake එකක්ද, chocolate cake එකක්ද, නැත්නම් simple tea-time cake එකක්ද?"
          : "Sure, what kind of cake should I look for - birthday cake, chocolate cake, or a simple tea-time cake?";
      sendToolResponse(functionCall, {
        output: {
          needs_clarification: true,
          query: q,
          rendered_in_ui: false,
          count: 0,
          instruction: "Do not search yet. Ask this one clarifying question and wait for the answer: " + question,
        },
      });
      promptLiveToSpeakNow(question);
      return;
    }

    try {
      liveSearchInFlightRef.current = true;
      promptLiveToSpeakNow(liveToolPhrase(name, "start"));
      clearDirectSearchFallback();
      voiceBriefRef.current = [];
      lastDispatchedVoiceRef.current = q;
      lastLiveSearchToolRef.current = { input: lastHandledInputTranscriptRef.current, at: Date.now() };
      setTranscript("Checking Kapruka...");
      const searchArgs = isMoreSearch ? { ...args, mode: "more" } : args;
      const maybeProducts = await onShoppingRequestRef.current(q, searchArgs);
      const products = Array.isArray(maybeProducts) ? maybeProducts : [];
      promptLiveToSpeakNow(liveToolPhrase(name, "ready", products.length));
      const compactProducts = products.slice(0, 8).map((product, index) => ({
        index: index + 1,
        id: product.id,
        name: product.name,
        price: product.price?.amount ?? null,
        currency: product.price?.currency ?? "LKR",
        in_stock: product.in_stock,
        category: product.category?.name ?? product.category?.slug ?? null,
      }));

      sendToolResponse(functionCall, {
        output: {
          query: q,
          rendered_in_ui: products.length > 0,
          count: products.length,
          products: compactProducts,
          more_search: isMoreSearch,
          instruction: products.length > 0
            ? isMoreSearch
              ? "New product cards are visible in the UI. Say these are more options and ask the user to pick by number, name, or tap."
              : "Product cards are visible in the UI. Mention the best options by number, name, and price."
            : isMoreSearch
              ? "No additional product cards were rendered. Do not say you found more. Tell the user there are no new options beyond the ones already shown and ask one short alternative question."
              : "No product cards were rendered. Do not call kapruka_search_products again for this same request. Tell the user this exact specific item was not found and ask one short alternative question.",
        },
      });
    } catch (error) {
      sendToolResponse(functionCall, {
        error: error instanceof Error ? error.message : "Kapruka search failed.",
      });
    } finally {
      liveSearchInFlightRef.current = false;
    }
  }, [clearDirectSearchFallback, clearProductActionFallback, liveToolPhrase, nudgeLiveToSpeak, promptLiveToSpeakNow, sendToolResponse]);

  const scheduleInputTranscriptFlush = useCallback((text: string) => {
    const normalizedText = text.trim();
    if (normalizedText.length < 3) return;
    pendingInputTranscriptRef.current = normalizedText;
    if (inputTranscriptTimerRef.current) {
      window.clearTimeout(inputTranscriptTimerRef.current);
    }
    inputTranscriptTimerRef.current = window.setTimeout(() => {
      inputTranscriptTimerRef.current = null;
      handleVoiceTranscript(pendingInputTranscriptRef.current);
    }, 650);
  }, [handleVoiceTranscript]);

  const commitPendingInputTranscript = useCallback(() => {
    const pendingText = pendingInputTranscriptRef.current.trim();
    if (pendingText.length < 3 || pendingText === lastHandledInputTranscriptRef.current) return;
    if (inputTranscriptTimerRef.current) {
      window.clearTimeout(inputTranscriptTimerRef.current);
      inputTranscriptTimerRef.current = null;
    }
    handleVoiceTranscript(pendingText);
  }, [handleVoiceTranscript]);

  const mergeTranscriptChunk = useCallback((current: string, next: string) => {
    const trimmedNext = cleanVoiceTranscript(next);
    if (!trimmedNext) return current;
    const cleanedCurrent = cleanVoiceTranscript(current);
    if (!cleanedCurrent) return trimmedNext;
    if (trimmedNext.startsWith(cleanedCurrent)) return trimmedNext;
    if (cleanedCurrent.endsWith(trimmedNext)) return cleanedCurrent;

    const maxOverlap = Math.min(cleanedCurrent.length, trimmedNext.length);
    for (let size = maxOverlap; size >= 8; size--) {
      if (cleanedCurrent.slice(-size).toLowerCase() === trimmedNext.slice(0, size).toLowerCase()) {
        return cleanVoiceTranscript(`${cleanedCurrent}${trimmedNext.slice(size)}`);
      }
    }

    const needsSpace = /[A-Za-z0-9)]$/.test(cleanedCurrent) && /^[A-Za-z0-9(]/.test(trimmedNext);
    return cleanVoiceTranscript(`${cleanedCurrent}${needsSpace ? " " : ""}${trimmedNext}`);
  }, []);

  const stopQueuedAudio = useCallback(() => {
    for (const source of playingSourcesRef.current) {
      try {
        source.stop();
      } catch {
        // Source may already have finished.
      }
      try {
        source.disconnect();
      } catch {
        // Source may already be disconnected.
      }
    }
    playingSourcesRef.current = [];
    nextPlayTimeRef.current = 0;
  }, []);

  const getPlaybackOutput = useCallback((ctx: AudioContext) => {
    if (!outputCompressorRef.current || outputCompressorRef.current.context !== ctx) {
      const compressor = ctx.createDynamicsCompressor();
      compressor.threshold.value = -18;
      compressor.knee.value = 18;
      compressor.ratio.value = 3;
      compressor.attack.value = 0.006;
      compressor.release.value = 0.16;
      compressor.connect(ctx.destination);
      outputCompressorRef.current = compressor;
    }
    return outputCompressorRef.current;
  }, []);

  const flushPendingMicChunks = useCallback(() => {
    const session = sessionRef.current;
    if (!session || pendingMicChunksRef.current.length === 0) return;
    const chunks = pendingMicChunksRef.current.splice(0);
    for (const data of chunks) {
      session.sendRealtimeInput({
        audio: {
          data,
          mimeType: "audio/pcm;rate=16000",
        },
      });
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    let cleanedUp = false;
    const generation = activeLiveCallGeneration + 1;
    activeLiveCallGeneration = generation;
    const isCurrentCall = () => mounted && generation === activeLiveCallGeneration;

    const cleanupLiveResources = () => {
      if (cleanedUp) return;
      cleanedUp = true;
      mounted = false;
      closeRequestedRef.current = true;
      onContextSenderRef.current(null);
      if (inputTranscriptTimerRef.current) {
        window.clearTimeout(inputTranscriptTimerRef.current);
        inputTranscriptTimerRef.current = null;
      }
      if (directSearchFallbackTimerRef.current) {
        window.clearTimeout(directSearchFallbackTimerRef.current);
        directSearchFallbackTimerRef.current = null;
      }
      pendingDirectSearchRef.current = "";
      pendingDirectSearchArgsRef.current = {};
      pendingDirectSearchOutputCounterRef.current = 0;
      if (productActionFallbackTimerRef.current) {
        window.clearTimeout(productActionFallbackTimerRef.current);
        productActionFallbackTimerRef.current = null;
      }
      pendingProductActionRef.current = "";
      pendingMicChunksRef.current = [];
      liveReadyRef.current = false;
      if (sessionRef.current) {
        try {
          sessionRef.current.close();
        } catch {
          // Session may already be closed.
        }
        sessionRef.current = null;
      }
      stopQueuedAudio();
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
        streamRef.current = null;
      }
      if (sourceRef.current) {
        try {
          sourceRef.current.disconnect();
        } catch {
          // Source may already be disconnected.
        }
        sourceRef.current = null;
      }
      if (processorRef.current) {
        try {
          processorRef.current.disconnect();
        } catch {
          // Processor may already be disconnected.
        }
        processorRef.current = null;
      }
      if (audioContextRef.current) {
        void audioContextRef.current.close().catch(() => undefined);
        audioContextRef.current = null;
      }
      if (stopActiveLiveCall === cleanupLiveResources) {
        stopActiveLiveCall = null;
      }
    };

    stopActiveLiveCall?.();
    stopActiveLiveCall = cleanupLiveResources;

    const init = async () => {
      try {
        // Start microphone first so the Live session receives audio quickly after opening.
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            channelCount: 1,
            sampleRate: 16000,
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          },
        });

        if (!isCurrentCall()) {
          stream.getTracks().forEach(t => t.stop());
          return;
        }

        streamRef.current = stream;

        // We must use an AudioContext to process the raw audio
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        const ctx = new AudioContextClass({ sampleRate: 16000 });
        audioContextRef.current = ctx;

        const source = ctx.createMediaStreamSource(stream);
        sourceRef.current = source;

        const processor = ctx.createScriptProcessor(4096, 1, 1);
        processorRef.current = processor;

        processor.onaudioprocess = (e) => {
          if (mutedRef.current) return;

          const inputData = e.inputBuffer.getChannelData(0);
          let audioLevel = 0;

          const pcmData = new Int16Array(inputData.length);
          for (let i = 0; i < inputData.length; i++) {
            const s = Math.max(-1, Math.min(1, inputData[i]));
            audioLevel += Math.abs(s);
            pcmData[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
          }

          if (statusRef.current === "speaking") {
            return;
          }

          const buffer = new Uint8Array(pcmData.buffer);
          let binary = '';
          for (let i = 0; i < buffer.byteLength; i++) {
            binary += String.fromCharCode(buffer[i]);
          }
          const base64 = btoa(binary);

          const session = sessionRef.current;
          if (!isCurrentCall()) return;
          if (!session || !liveReadyRef.current) {
            const averageLevel = audioLevel / inputData.length;
            if (averageLevel > 0.006) {
              pendingMicChunksRef.current.push(base64);
              pendingMicChunksRef.current = pendingMicChunksRef.current.slice(-10);
            }
            return;
          }

          session.sendRealtimeInput({
            audio: {
              data: base64,
              mimeType: "audio/pcm;rate=16000",
            },
          });
        };

        const silentOutput = ctx.createGain();
        silentOutput.gain.value = 0;
        source.connect(processor);
        processor.connect(silentOutput);
        silentOutput.connect(ctx.destination);

        const tokenResponse = await fetch("/api/live-token", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            voiceName,
            context: {
              conversationSummary: conversationSummaryRef.current,
              shownProducts: shownProductsRef.current,
              cartItems: cartItemsRef.current.map((item) => ({
                productId: item.product.id,
                productName: item.product.name,
                quantity: item.quantity,
                price: item.product.price?.amount ?? 0,
              })),
              cartCount: cartItemsRef.current.length,
              cartTotal: cartItemsRef.current.reduce((sum, item) => sum + (item.product.price?.amount ?? 0) * item.quantity, 0),
              language: lockedLanguageRef.current,
            },
          }),
        });
        const tokenData = await tokenResponse.json();

        if (!isCurrentCall()) return;

        if (!tokenResponse.ok || !tokenData.token || !tokenData.model) {
          throw new Error(tokenData.error || "Could not start Gemini Live.");
        }

        const ai = new GoogleGenAI({
          apiKey: tokenData.token,
          httpOptions: { apiVersion: "v1alpha" },
        });
        const session = await ai.live.connect({
          model: tokenData.model,
          config: tokenData.liveConfig ?? {
            responseModalities: [Modality.AUDIO],
          },
          callbacks: {
            onopen: () => {
              if (!isCurrentCall()) return;
              liveReadyRef.current = true;
              flushPendingMicChunks();
              setStatus("listening");
              setTranscript("...");
              onContextSenderRef.current((text) => {
                try {
                  sessionRef.current?.sendRealtimeInput({ text });
                } catch {
                  // Ignore context updates if Live is between turns.
                }
              });
            },
            onmessage: (message) => {
              if (!isCurrentCall()) return;
              const functionCalls = message.toolCall?.functionCalls ?? [];
              const serverContent = message.serverContent;

              if (serverContent?.interrupted) {
                console.debug("[KADE Live] Gemini reported interruption; keeping queued audio for playback.");
              }

              const inputTranscript = serverContent?.inputTranscription?.text;
              const outputTranscript = serverContent?.outputTranscription?.text;
              if (inputTranscript) {
                setTranscript(inputTranscript);
                scheduleInputTranscriptFlush(inputTranscript);
                if (serverContent?.inputTranscription?.finished) {
                  if (inputTranscriptTimerRef.current) {
                    window.clearTimeout(inputTranscriptTimerRef.current);
                    inputTranscriptTimerRef.current = null;
                  }
                  handleVoiceTranscript(inputTranscript);
                }
              }

              if (functionCalls.length > 0) {
                commitPendingInputTranscript();
                void Promise.all(functionCalls.map((functionCall) => executeLiveToolCall(functionCall)));
              }

              if (!serverContent) return;

              if (outputTranscript) {
                commitPendingInputTranscript();
                liveOutputCounterRef.current += 1;
                const merged = mergeTranscriptChunk(latestOutputTranscriptRef.current, outputTranscript);
                setTranscript(merged);
                setStatus("speaking");
                latestOutputTranscriptRef.current = merged;
                if (assistantIsWaitingForUser(merged)) {
                  clearDirectSearchFallback();
                }
                onAssistantTranscriptRef.current(merged, false);
              }

              for (const part of serverContent.modelTurn?.parts ?? []) {
                if (part.inlineData?.data) {
                  liveOutputCounterRef.current += 1;
                  setStatus("speaking");
                  void playAudioChunk(part.inlineData.data, part.inlineData.mimeType);
                }
                if (part.text) {
                  commitPendingInputTranscript();
                  liveOutputCounterRef.current += 1;
                  const merged = mergeTranscriptChunk(latestOutputTranscriptRef.current, part.text);
                  setTranscript(merged);
                  setStatus("speaking");
                  latestOutputTranscriptRef.current = merged;
                  if (assistantIsWaitingForUser(merged)) {
                    clearDirectSearchFallback();
                  }
                  onAssistantTranscriptRef.current(merged, false);
                }
              }

              if (serverContent.turnComplete || serverContent.waitingForInput) {
                if (latestOutputTranscriptRef.current.trim()) {
                  const finalTranscript = cleanVoiceTranscript(latestOutputTranscriptRef.current);
                  lastFinalOutputTranscriptRef.current = finalTranscript;
                  onAssistantTranscriptRef.current(finalTranscript, true);
                  latestOutputTranscriptRef.current = "";
                }
                setStatus("listening");
              }
            },
            onerror: (event) => {
              console.error("Gemini Live error", event);
              if (isCurrentCall()) setTranscript("Gemini Live connection error.");
            },
            onclose: (event) => {
              if (!isCurrentCall()) return;
              if (closeRequestedRef.current || event.code === 1000) {
                setTranscript("Call ended");
                setTimeout(() => onCloseRef.current(), 900);
              } else {
                setStatus("connecting");
                setTranscript("Voice connection closed. Please start a new call.");
              }
            },
          },
        });

        if (!isCurrentCall()) {
          try {
            session.close();
          } catch {
            // Session may already be closing.
          }
          return;
        }

        sessionRef.current = session;
        if (liveReadyRef.current) {
          flushPendingMicChunks();
        }

      } catch (err) {
        console.error("Setup error:", err);
        if (isCurrentCall()) {
          setTranscript("Failed to access microphone or connect to server.");
        }
      }
    };

    init();

    return cleanupLiveResources;
  }, [clearDirectSearchFallback, commitPendingInputTranscript, executeLiveToolCall, flushPendingMicChunks, handleVoiceTranscript, mergeTranscriptChunk, scheduleInputTranscriptFlush, stopQueuedAudio, voiceName]);

  // Decode base64 PCM Int16 to Float32 and play on a dedicated output context.
  const playAudioChunk = async (base64: string, mimeType?: string) => {
    if (!liveReadyRef.current) return;
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) {
      setAudioDebug("audio unsupported");
      return;
    }
    if (!playbackContextRef.current || playbackContextRef.current.state === "closed") {
      playbackContextRef.current = new AudioContextClass({ sampleRate: 24000 });
    }
    const ctx = playbackContextRef.current;
    
    const binaryStr = atob(base64);
    const buffer = new Uint8Array(binaryStr.length);
    for (let i = 0; i < binaryStr.length; i++) {
      buffer[i] = binaryStr.charCodeAt(i);
    }
    
    const view = new DataView(buffer.buffer, buffer.byteOffset, buffer.byteLength);
    const sampleCount = Math.floor(buffer.byteLength / 2);
    const sampleRate = Number(/rate=(\d+)/i.exec(mimeType ?? "")?.[1] ?? 24000);
    const float32Array = new Float32Array(sampleCount);
    let peak = 0;
    for (let i = 0; i < sampleCount; i++) {
      const sample = view.getInt16(i * 2, true) / 32768;
      peak = Math.max(peak, Math.abs(sample));
      float32Array[i] = sample;
    }
    
    if (ctx.state === "suspended") {
      await ctx.resume();
    }
    if (!liveReadyRef.current) return;
    const audioBuffer = ctx.createBuffer(1, float32Array.length, sampleRate);
    const output = audioBuffer.getChannelData(0);
    const gain = peak > 0.0001 ? Math.min(2.4, 0.72 / peak) : 1;
    for (let i = 0; i < float32Array.length; i++) {
      output[i] = Math.max(-1, Math.min(1, float32Array[i] * gain));
    }

    const source = ctx.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(getPlaybackOutput(ctx));
    playingSourcesRef.current.push(source);
    source.onended = () => {
      playingSourcesRef.current = playingSourcesRef.current.filter((item) => item !== source);
      try {
        source.disconnect();
      } catch {
        // Source may already be disconnected.
      }
    };

    if (nextPlayTimeRef.current < ctx.currentTime) {
      nextPlayTimeRef.current = ctx.currentTime + 0.03;
    }
    source.start(nextPlayTimeRef.current);
    nextPlayTimeRef.current += audioBuffer.duration;
    audioChunkCountRef.current += 1;
    setAudioDebug(`audio ${audioChunkCountRef.current} chunks ${Math.round(binaryStr.length / 1024)}KB ${ctx.state} peak ${peak.toFixed(3)}`);
    console.debug("[KADE Live] playing Gemini audio chunk", {
      bytes: binaryStr.length,
      mimeType,
      contextState: ctx.state,
      duration: audioBuffer.duration,
      sampleRate,
      queuedUntil: nextPlayTimeRef.current,
      peak,
      gain,
    });
  };

  const playTestTone = async () => {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) {
      setAudioDebug("audio unsupported");
      return;
    }
    if (!playbackContextRef.current || playbackContextRef.current.state === "closed") {
      playbackContextRef.current = new AudioContextClass({ sampleRate: 24000 });
    }
    const ctx = playbackContextRef.current;
    if (ctx.state === "suspended") await ctx.resume();

    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();
    oscillator.type = "sine";
    oscillator.frequency.value = 660;
    gain.gain.setValueAtTime(0.001, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.18, ctx.currentTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.28);
    oscillator.connect(gain);
    gain.connect(ctx.destination);
    oscillator.start();
    oscillator.stop(ctx.currentTime + 0.3);
    setAudioDebug(`test tone ${ctx.state}`);
  };

  const forceSearchVisibleTranscript = () => {
    const text = cleanVoiceTranscript(pendingInputTranscriptRef.current || transcript);
    if (!text.trim()) return;
    if (giftRequestNeedsAge(text, conversationSummaryRef.current) || shouldUseGiftResearchFlow(text, conversationSummaryRef.current)) {
      setTranscript("Let's narrow the gift first.");
      return;
    }
    if (isBroadCakeSearch(text)) {
      setTranscript("What kind of cake should I look for - birthday, chocolate, or tea-time?");
      return;
    }
    handleVoiceTranscript(text);
  };

  const endCall = () => {
    closeRequestedRef.current = true;
    if (sessionRef.current) {
      sessionRef.current.close();
    }
    onCloseRef.current();
  };

  const submitVoiceCity = (typedCity: string) => {
    const pendingTool = pendingCityToolRef.current;
    if (!pendingTool) {
      setCityPopup({ visible: false, reason: "", partialAddress: "" });
      return;
    }

    const selectedCity = typedCity.trim();
    if (!selectedCity) return;
    const fullAddress = [pendingTool.partialAddress, selectedCity].filter(Boolean).join(", ");
    sendToolResponseById(pendingTool.id, pendingTool.name, {
      selectedCity,
      fullAddress,
    });
    pendingCityToolRef.current = null;
    setCityPopup({ visible: false, reason: "", partialAddress: "" });
    setCheckoutStatus("Collecting order details...");
    setTranscript(`City: ${selectedCity}`);
  };

  const cancelVoiceCity = () => {
    const pendingTool = pendingCityToolRef.current;
    if (pendingTool) {
      sendToolResponseById(pendingTool.id, pendingTool.name, {
        cancelled: true,
        message: "User closed the city popup. Ask for the city again naturally.",
      });
    }
    pendingCityToolRef.current = null;
    setCityPopup({ visible: false, reason: "", partialAddress: "" });
    setCheckoutStatus("");
  };

  return (
    <div className={styles.liveCallOverlay}>
      <div className={styles.liveCallPanel}>
        <div className={styles.liveCallAvatar}>
          {status !== "connecting" && (
            <>
              <div className={styles.liveCallRing} />
              <div className={styles.liveCallRing} />
              <div className={styles.liveCallRing} />
            </>
          )}
          <div className={styles.liveCallAvatarInner}>
            <Bot size={22} />
          </div>
        </div>

        <div className={styles.liveCallInfo}>
          <h3>Kade AI</h3>
          <div className={styles.liveCallStatus}>
            <span 
              className={clsx(
                styles.liveCallStatusDot, 
                status === "listening" && styles.liveCallStatusDotListening,
                status === "speaking" && styles.liveCallStatusDotSpeaking,
                status === "connecting" && styles.liveCallStatusDotConnecting
              )} 
            />
            {status === "connecting" ? "Connecting..." : status === "speaking" ? "Speaking..." : "Listening..."}
          </div>
          {checkoutStatus && (
            <div className={styles.liveCheckoutStatus}>
              {checkoutStatus}
            </div>
          )}
          <select
            className={styles.liveVoiceSelect}
            value={voiceName}
            onChange={(event) => {
              stopQueuedAudio();
              setStatus("connecting");
              setTranscript(`Switching voice to ${event.target.value}...`);
              setVoiceName(event.target.value as (typeof LIVE_VOICES)[number]);
            }}
            aria-label="Select Gemini Live voice"
          >
            {LIVE_VOICES.map((voice) => (
              <option key={voice} value={voice}>
                {voice}
              </option>
            ))}
          </select>
        </div>

        <div className={styles.liveCallTranscript}>
          {transcript}
          <span className={styles.liveAudioDebug}>{audioDebug}</span>
        </div>

        <div className={styles.liveCallActions}>
          <button
            className={styles.liveCallMuteBtn}
            onClick={forceSearchVisibleTranscript}
            aria-label="Show products from transcript"
            title="Show products"
          >
            <Search size={20} />
          </button>
          <button
            className={styles.liveCallMuteBtn}
            onClick={playTestTone}
            aria-label="Test sound"
            title="Test sound"
          >
            <Volume2 size={20} />
          </button>
          <button 
            className={clsx(styles.liveCallMuteBtn, muted && styles.muted)} 
            onClick={() => setMuted(!muted)}
            aria-label={muted ? "Unmute" : "Mute"}
          >
            <Mic size={20} />
          </button>
          <button className={styles.liveCallEndBtn} onClick={endCall} aria-label="End call">
            <X size={24} />
          </button>
        </div>
      </div>
      <CityInputPopup
        visible={cityPopup.visible}
        reason={cityPopup.reason}
        onSubmit={submitVoiceCity}
        onCancel={cancelVoiceCity}
      />
    </div>
  );
}
