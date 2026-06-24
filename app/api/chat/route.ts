import { NextRequest } from "next/server";
import { asksForEdibleGift, assistantCopy, dislikesFlowers, extractSearchIntent } from "@/lib/agent";
import { KADE_COMPLEX_PROMPT } from "@/lib/complex";
import { chatWithTools, quickComplexStarter, researchGiftIdeas } from "@/lib/gemini";
import { hasComplexShoppingSignal, hasEnoughInfoToSearch, isComplexIntent } from "@/lib/intent";
import { callKaprukaTool } from "@/lib/mcp";
import { alternateTextModel, MODELS, type TextModel } from "@/lib/models";
import type { Product } from "@/lib/types";
import type { Content } from "@google/genai";

/* ── MCP tool dispatcher ── */

async function handleToolCall(name: string, args: Record<string, unknown>): Promise<unknown> {
  switch (name) {
    case "search_products":
      const rawQuery = String(args.q ?? "gift");
      if (isSmallTalkOnly(rawQuery)) {
        return { results: [], next_cursor: null, applied_filters: { blocked_reason: "smalltalk" } };
      }
      return searchKaprukaProducts(rawQuery, {
        limit: Number(args.limit ?? 8),
        max_price: typeof args.max_price === "number" ? args.max_price : null,
      });

    case "check_delivery":
      return callKaprukaTool("kapruka_check_delivery", {
        city: args.city,
        delivery_date: normalizeDeliveryDate(args.delivery_date),
        product_id: args.product_id ?? null,
        response_format: "json",
      });

    case "list_categories":
      return callKaprukaTool("kapruka_list_categories", {
        depth: args.depth ?? 2,
        response_format: "json",
      });

    case "list_delivery_cities":
      return callKaprukaTool("kapruka_list_delivery_cities", {
        query: args.query ?? null,
        limit: 25,
        response_format: "json",
      });

    case "track_order":
      return callKaprukaTool("kapruka_track_order", {
        order_number: args.order_number,
        response_format: "json",
      });

    case "create_order":
      return callKaprukaTool("kapruka_create_order", {
        cart: args.cart,
        recipient: {
          name: args.recipient_name,
          phone: args.recipient_phone,
        },
        delivery: {
          address: args.delivery_address,
          city: args.delivery_city,
          date: normalizeDeliveryDate(args.delivery_date) ?? sriLankaDate(1),
          location_type: "house",
          instructions: null,
        },
        sender: {
          name: args.sender_name ?? "Kade AI shopper",
          anonymous: args.anonymous ?? false,
        },
        gift_message: args.gift_message ?? null,
        currency: "LKR",
        response_format: "json",
      });

    default:
      return { error: `Unknown tool: ${name}` };
  }
}

type SearchResult = {
  results?: Product[];
  next_cursor?: string | null;
  applied_filters?: Record<string, unknown>;
};

const SEARCH_CACHE_TTL_MS = 3 * 60 * 1000;
const searchCache = new Map<string, { expiresAt: number; value: SearchResult }>();
const SINHALA_RE = /[\u0d80-\u0dff]/;
const TAMIL_RE = /[\u0b80-\u0bff]/;
const SINHALA_SHOPPING_RE = /හොය|බල|දෙන්න|ගන්න|යවන්න|කේක්|උපන්දින|මල්|රෝස|බිස්කට්|චොකලට්|චොක්ලට්|තෑගි|තෑග්ග|මිල|බජට්|අඩු/;
const TAMIL_SHOPPING_RE = /தேடு|காட்டு|வாங்க|அனுப்பு|கேக்|பிறந்தநாள்|பூ|மலர்|ரோஜா|பிஸ்கட்|சாக்லேட்|பரிசு|விலை|பட்ஜெட்/;

function isRomanticRecoveryQuery(rawQuery: string) {
  return /\b(girlfriend|gf|wife|love|romantic|sorry|apology|messed up|angry|mad|late|safe combo|safe apology combo|apology combo|make it grand)\b/i.test(rawQuery);
}


function isFoodGiftQuery(rawQuery: string) {
  return /\b(foodie|food lover|likes food|loves food|eat|edible|snack|snacks|sweet tooth|sweets?|dessert|gourmet|hamper|cakes?|chocolates?|biscuits?|cookies?|tea|coffee|fruit)\b/i.test(rawQuery);
}
function normalizeSearchQuery(rawQuery: string) {
  const lower = rawQuery.toLowerCase();
  if (isRomanticRecoveryQuery(rawQuery)) return "romantic gift";
  if (/\b(foodie|food lover|likes food|loves food|edible|snack|snacks|gourmet)\b/.test(lower)) return "chocolate hamper";
  if (/\b(cakes?|birthday cake|birthday|ribbon cake|bento cake|keik)\b/.test(lower) || /කේක්|උපන්දින|கேக்|பிறந்தநாள்/.test(rawQuery)) return "birthday";
  if (/\b(flowers?|roses?|bouquet|mal|poo|pookal)\b/.test(lower) || /මල්|රෝස|பூ|மலர்|ரோஜா/.test(rawQuery)) return "roses";
  if (/\b(biscuits?|cookies?|crackers?|biskut|munchee|maliban)\b/.test(lower) || /බිස්කට්|பிஸ்கட்/.test(rawQuery)) return "biscuits";
  if (/\b(chocolates?|choko|soklet)\b/.test(lower) || /චොකලට්|சாக்லேட்/.test(rawQuery)) return "chocolate";
  if (/\b(thagi|thaagi|parisu|gift)\b/.test(lower) || /තෑගි|තෑග්ග|பரிசு/.test(rawQuery)) return "gift";
  return rawQuery.trim() || "gift";
}

function relevanceKind(rawQuery: string) {
  const lower = rawQuery.toLowerCase();
  if (isRomanticRecoveryQuery(rawQuery)) return "romantic";
  if (isFoodGiftQuery(rawQuery)) return "food";
  if (/\b(cakes?|birthday cake|birthday|ribbon cake|bento cake|keik)\b/.test(lower) || /කේක්|උපන්දින|கேக்|பிறந்தநாள்/.test(rawQuery)) return "cake";
  if (/\b(biscuits?|cookies?|crackers?|oreo|munchee|maliban|biskut)\b/.test(lower) || /බිස්කට්|பிஸ்கட்/.test(rawQuery)) return "biscuit";
  if (/\b(flowers?|roses?|bouquet|mal|poo|pookal)\b/.test(lower) || /මල්|රෝස|பூ|மலர்|ரோஜா/.test(rawQuery)) return "flower";
  if (/\b(chocolates?|choko|soklet)\b/.test(lower) || /චොකලට්|சாக்லேட்/.test(rawQuery)) return "chocolate";
  return null;
}

function isShoppingQuery(rawQuery: string) {
  const lower = rawQuery.toLowerCase();
  if (SINHALA_SHOPPING_RE.test(rawQuery) || TAMIL_SHOPPING_RE.test(rawQuery)) return true;

  return (
    /\b(show|find|search|need|want|buy|send|deliver|gift|cake|flower|rose|biscuit|cookie|cracker|chocolate|hamper|cart|checkout|price|budget|hoyala|balanna|denna|ganna|yawanna)\b/.test(lower) ||
    /හොය|බල|දෙන්න|ගන්න|යවන්න|කේක්|උපන්දින|මල්|රෝස|බිස්කට්|චොකලට්|තෑගි|තෑග්ග|මිල/.test(rawQuery) ||
    /தேடு|காட்டு|வாங்க|அனுப்பு|கேக்|பிறந்தநாள்|பூ|மலர்|ரோஜா|பிஸ்கட்|சாக்லேட்|பரிசு|விலை/.test(rawQuery)
  );
}

function normalizeSmallTalk(rawQuery: string) {
  return rawQuery
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{M}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function isSinhalaSmallTalk(text: string) {
  return /^(හායි|හෙලෝ|හෙලො|ආයුබෝවන්|කොහොමද|කොහොමද ඉතින්|සුභ උදෑසන|සුභ සන්ධ්‍යාව|හරි|ස්තුතියි|බොහොම ස්තුතියි)$/.test(text);
}

function isTamilSmallTalk(text: string) {
  return /^(வணக்கம்|ஹலோ|ஹாய்|எப்படி இருக்கீங்க|எப்படி இருக்கிறீர்கள்|நன்றி|சரி)$/.test(text);
}

function isSmallTalkOnly(rawQuery: string) {
  const text = normalizeSmallTalk(rawQuery);
  if (!text || isShoppingQuery(rawQuery)) return false;

  return (
    isSinhalaSmallTalk(text) ||
    isTamilSmallTalk(text) ||
    /^(hi|hello|hey|heyy|yo|sup|good morning|good afternoon|good evening|good night|ayubowan|vanakkam|kohomada|kohomadha|machan|aney|ane|thanks|thank you|tnx|thx|ok|okay)$/i.test(text) ||
    /^(hi|hello|hey)\s+(kade|there|machan|aney|ai)$/i.test(text) ||
    /^(who are you|what can you do|can you help me|help me|are you there)$/i.test(text)
  );
}

function smallTalkReply(rawQuery: string) {
  const text = normalizeSmallTalk(rawQuery);
  const thanks = /\b(thanks|thank you|tnx|thx)\b/i.test(text);
  const asksIdentity = /\b(who are you|what can you do|can you help me|help me|are you there)\b/i.test(text);
  const isSinhala = SINHALA_RE.test(rawQuery);
  const isTamil = TAMIL_RE.test(rawQuery);

  let reply = "Hey! What are we finding today - something special or just browsing?";

  if (thanks) {
    reply = isSinhala ? "ඕන වෙලාවක. මම ඉන්නවා." : isTamil ? "எப்போதும் சந்தோஷம். நான் இருக்கேன்." : "Anytime, machan. Happy to help.";
  } else if (asksIdentity) {
    reply = isSinhala
      ? "මම Kade. Kapruka එකෙන් හොඳ දෙයක් හොයාගන්න උදව් කරන shopping යාලුවා. අද මොකක්ද බලමු?"
      : isTamil
        ? "நான் Kade. Kapruka-ல சரியான gift கண்டுபிடிக்க உதவும் shopping friend. இன்று என்ன பார்க்கலாம்?"
        : "Of course. I am Kade - I help you find the right thing from Kapruka without making you scroll forever. What are we sorting out today?";
  } else if (isSinhala) {
    reply = text.includes("කොහොමද") ? "හොඳින් ඉන්නවා! ඔයා කොහොමද?" : "හෙලෝ! කොහොමද?";
  } else if (isTamil) {
    reply = text.includes("எப்படி") ? "நன்றாக இருக்கேன்! நீங்க எப்படி?" : "வணக்கம்! எப்படி இருக்கீங்க?";
  }

  return {
    reply,
    products: [],
    delivery: null,
    order: null,
    label: "AI_RECOMMENDATION",
    quickReplies: ["Birthday gift", "Apology gift", "Chocolate hamper", "Check delivery"],
    model: "kade-smalltalk-precheck",
  };
}

function shouldClarifyEdibleGift(rawQuery: string) {
  const lower = rawQuery.toLowerCase();
  const hasSpecificEdible =
    /\b(cakes?|birthday cake|bento|ribbon|chocolates?|biscuits?|cookies?|crackers?|hamper|tea|coffee|fruit|sweets?)\b/.test(lower) ||
    /කේක්|චොකලට්|බිස්කට්|கேக்|சாக்லேட்|பிஸ்கட்/.test(rawQuery);

  return dislikesFlowers(rawQuery) && asksForEdibleGift(rawQuery) && !hasSpecificEdible;
}

function edibleGiftClarification(rawQuery: string) {
  const lower = rawQuery.toLowerCase();
  const recipient = /\bgf|girlfriend\b/.test(lower) ? "your girlfriend" : "them";

  return {
    reply: `Got it, no flowers. Since ${recipient} likes edible gifts, shall we go sweet and romantic, or snacky and fun? I can look for chocolates, cakes, biscuits, or a food hamper once you pick the direction.`,
    products: [],
    delivery: null,
    order: null,
    label: "AI_RECOMMENDATION",
    quickReplies: ["Chocolate gifts", "Small cake", "Biscuit hamper", "Food gift under Rs. 5000"],
    model: "kapruka-preflight",
  };
}

function historyText(history: Content[]) {
  return history
    .slice(-8)
    .flatMap((entry) => entry.parts?.map((part) => part.text ?? "") ?? [])
    .join("\n")
    .toLowerCase();
}

function hasEmotionalContext(text: string) {
  return /\b(girlfriend|gf|boyfriend|bf|wife|husband|amma|ammi|mother|mom|mum|dad|thaththa|anniversary|wedding|valentine|apology|sorry|messed up|angry|mad|late|fight|forgot|hospital|birthday|housewarming)\b/.test(text);
}

function isVagueGiftFollowUp(message: string) {
  const lower = message.toLowerCase();
  const wantsGiftAction = /\b(send|show|find|suggest|recommend|choose|pick|buy|can you|please|gift|gifts|something)\b/.test(lower);
  const hasDelegatedChoice = /\b(you choose|u choose|choose for me|show safe combo|safe apology combo|safe combo|apology combo|make it grand)\b/.test(lower);
  const hasSpecificProduct = /\b(cake|cakes|chocolate|chocolates|flower|flowers|rose|roses|bouquet|biscuit|biscuits|cookie|cookies|hamper|tea|coffee|wine|perfume|teddy|watch|mug)\b/.test(lower);
  const hasBudget = /\b(?:rs\.?|lkr|budget|under|below|max)\s*\d|(?:\d{3,})/.test(lower);
  const hasRecipient = /\b(girlfriend|gf|boyfriend|bf|wife|husband|amma|ammi|mother|mom|dad|friend|boss|teacher)\b/.test(lower);
  return wantsGiftAction && !hasDelegatedChoice && !hasSpecificProduct && !hasBudget && !hasRecipient;
}

function isUncertainFollowUp(message: string) {
  return /\b(idk|i don't know|i dont know|dont know|don't know|not sure|no idea|confused|hard to choose|how to find|help me decide)\b/i.test(message);
}

function isRecipientProfilingContext(history: Content[]) {
  const context = historyText(history);
  return /\b(tell me a bit about (her|him|them)|what'?s (she|he|they) into|what does (she|he|they) like|foodie|fashion person|homebody|cozy things|profile the recipient)\b/i.test(context);
}

function isProfileOnlyAnswer(message: string) {
  const lower = message.toLowerCase();
  const hasProfileSignal = /\b(she|he|they|my gf|my girlfriend|my wife|my husband|my amma|my friend)\b.*\b(is|likes|loves|into|enjoys)\b|\b(foodie|food lover|homebody|fashion|skincare|self care|jewellery|jewelry|practical|outdoorsy|sporty|reader|cooking|gardening|music|books|makeup|cozy)\b/i.test(lower);
  const asksToSearch = /\b(show|find|search|send|buy|order|add|checkout|give me options|show me|pick one|choose)\b/i.test(lower);
  return hasProfileSignal && !asksToSearch;
}

function recipientProfileFollowup(message: string) {
  const lower = message.toLowerCase();
  const food = /\b(foodie|food lover|likes food|loves food|eat|snack|sweet|dessert|cake|chocolate|cooking)\b/i.test(lower);
  const fashion = /\b(fashion|clothes|style|jewellery|jewelry|makeup|beauty|skincare|self care)\b/i.test(lower);
  const homebody = /\b(homebody|cozy|cosy|reading|books|tea|coffee|movie|movies|relax|self care)\b/i.test(lower);

  let reply = "Nice, that helps. What kind of gifts does she usually enjoy more - cute and personal, or useful and practical?";
  let quickReplies = ["Cute and personal", "Useful and practical", "A bit premium", "Keep it simple"];

  if (food) {
    reply = "Perfect, then we should keep it edible - not mugs or random gift sets. Is she more into sweet treats like cake/chocolate, or snacky gourmet hampers?";
    quickReplies = ["Cake or chocolate", "Snacky hamper", "Premium sweets", "Not sure"];
  } else if (fashion) {
    reply = "Nice, so presentation matters. Is she more into beauty/self-care gifts, or stylish little accessories?";
    quickReplies = ["Beauty/self-care", "Accessories", "Premium gift", "Not sure"];
  } else if (homebody) {
    reply = "Aww okay, cozy gifts can be really thoughtful. Should we go self-care cozy, or tea/coffee and snacks kind of cozy?";
    quickReplies = ["Self-care cozy", "Tea and snacks", "Sweet treats", "Not sure"];
  }

  return {
    reply,
    products: [],
    delivery: null,
    order: null,
    label: "AI_RECOMMENDATION",
    quickReplies,
    model: "kade-profile-precheck",
  };
}

function contextClarification(message: string, history: Content[]) {
  const context = historyText(history);
  if (!hasEmotionalContext(context) || !isVagueGiftFollowUp(message)) return null;

  const isApology = /\b(girlfriend|gf|wife|boyfriend|bf|husband|angry|mad|late|messed up|sorry|apology|fight)\b/.test(context);
  const isAmma = /\b(amma|ammi|mother|mom|mum)\b/.test(context);
  const isOccasion = /\b(anniversary|wedding|birthday|housewarming|hospital|graduation)\b/.test(context);
  const isUncertain = isUncertainFollowUp(message);

  if (isApology) {
    if (isUncertain) {
      return {
        reply:
          "No stress. I’ll make it simple: for this situation, the safest move is a proper apology combo, not a random gift. I’d do flowers or a romantic gift set, add something sweet if the budget allows, and include a sincere note. Give me a rough budget, or say “show safe combo” and I’ll keep it sensible.",
        products: [],
        delivery: null,
        order: null,
        label: "AI_RECOMMENDATION",
        quickReplies: ["Show safe combo", "Keep under Rs. 8,000", "Around Rs. 10,000", "Make it grand"],
        model: "kade-context-precheck",
      };
    }

    return {
      reply:
        "Yes, I can send something. But for an apology, let’s not send random gifts and make it look careless. Is she more flowers-and-romance, chocolates/sweets, or should I build a safe apology combo with flowers, chocolates, and a sincere note?",
      products: [],
      delivery: null,
      order: null,
      label: "AI_RECOMMENDATION",
      quickReplies: ["Safe apology combo", "Flowers and romance", "Chocolates or sweets", "Budget around Rs. 10,000"],
      model: "kade-context-precheck",
    };
  }

  if (isAmma) {
    if (isUncertain) {
      return {
        reply:
          "No problem. For Amma, I’ll avoid random flashy things and choose something thoughtful. A useful premium gift or a small hamper is usually safest. Give me a rough budget, or say “show thoughtful picks” and I’ll start with safe options.",
        products: [],
        delivery: null,
        order: null,
        label: "AI_RECOMMENDATION",
        quickReplies: ["Show thoughtful picks", "Keep under Rs. 5,000", "Premium useful gift", "Small hamper"],
        model: "kade-context-precheck",
      };
    }

    return {
      reply:
        "Yes, I can. For Amma, I’d keep it thoughtful instead of random. Should we go useful and premium, sweet and simple, or a proper hamper? If you give me a budget, I’ll keep it inside that.",
      products: [],
      delivery: null,
      order: null,
      label: "AI_RECOMMENDATION",
      quickReplies: ["Premium useful gift", "Sweet and simple", "Proper hamper", "Budget Rs. 5,000"],
      model: "kade-context-precheck",
    };
  }

  if (isOccasion) {
    if (isUncertain) {
      return {
        reply:
          "That’s okay. I’ll narrow it down for you: safest is something classic, sweet, and easy to deliver. Give me a rough budget, or say “show safe picks” and I’ll choose a balanced set.",
        products: [],
        delivery: null,
        order: null,
        label: "AI_RECOMMENDATION",
        quickReplies: ["Show safe picks", "Keep under Rs. 8,000", "Something sweet", "Gift set"],
        model: "kade-context-precheck",
      };
    }

    return {
      reply:
        "Yes, I can help. Before I show products, let’s make it fit the moment. Do you want something classic, something sweet, or a bigger gift set? A budget will help me avoid random picks.",
      products: [],
      delivery: null,
      order: null,
      label: "AI_RECOMMENDATION",
      quickReplies: ["Classic gift", "Sweet gift", "Gift set", "Budget Rs. 8,000"],
      model: "kade-context-precheck",
    };
  }

  return null;
}

function extractDeliveryCity(rawQuery: string) {
  const match = rawQuery.match(/\b(colombo\s?\d{1,2}|galle|kandy|negombo|jaffna|matara|kurunegala|anuradhapura|ratnapura|batticaloa|balangoda)\b/i);
  return match?.[1] ?? null;
}

function isDeliveryAvailabilityQuestion(rawQuery: string) {
  const lower = rawQuery.toLowerCase();
  return /\b(deliver|delivery|ship|send|yawanna|denna)\b/.test(lower) && Boolean(extractDeliveryCity(rawQuery));
}

async function deliveryAvailabilityReply(rawQuery: string) {
  const city = extractDeliveryCity(rawQuery);
  if (!city) return null;

  const delivery = await callKaprukaTool<Record<string, unknown>>("kapruka_check_delivery", {
    city,
    delivery_date: sriLankaDate(1),
    product_id: null,
    response_format: "json",
  });
  const cityName = String(delivery.city ?? city);
  const rate = typeof delivery.rate === "number" ? ` Delivery fee is Rs. ${delivery.rate.toLocaleString("en-US")}.` : "";
  const nextDate = typeof delivery.next_available_date === "string" ? delivery.next_available_date : null;
  const available = delivery.available === true;
  const reply = available
    ? `Yes, Kapruka delivers to ${cityName}.${rate} Tell me what you want to send and I will keep the options practical for that city.`
    : `Kapruka can deliver to ${cityName}, but the checked date looks full${nextDate ? `; next available date is ${nextDate}` : ""}.${rate} Tell me what kind of gift you want and I will avoid anything that does not fit.`;

  return {
    reply,
    products: [],
    delivery,
    order: null,
    label: "DELIVERY_INFO",
    quickReplies: ["Anniversary gift", "Chocolate gifts", "Cake options", "Food hamper"],
    model: "kapruka-delivery-check",
  };
}

function productText(product: Product) {
  return `${product.id} ${product.name} ${product.summary ?? ""} ${product.category?.name ?? ""}`.toLowerCase();
}

function isRelevantProduct(product: Product, rawQuery: string) {
  const text = productText(product);
  const kind = relevanceKind(rawQuery);

  if (kind === "cake") {
    return product.id.toLowerCase().startsWith("cake");
  }

  if (kind === "biscuit") {
    const id = product.id.toLowerCase();
    return (
      !id.startsWith("cake") &&
      (id.startsWith("grocery") || id.includes("_groc") || /confectioneryandbiscuits|\bgrocery\b|\bmunchee\b|\bmaliban\b|\boreo\b/.test(text)) &&
      /\bbiscuits?\b|\bcookies?\b|\bcrackers?\b|\boreo\b|\bmunchee\b|\bmaliban\b|confectioneryandbiscuits/.test(text)
    );
  }

  if (kind === "flower") {
    return product.id.toLowerCase().startsWith("flowers") || /\bflowers?\b|\broses?\b|\bbouquet\b/.test(text);
  }

  if (kind === "chocolate") {
    return product.id.toLowerCase().startsWith("chocolates") || /\bchocolates?\b|\bferrero\b|\btoblerone\b/.test(text);
  }

  if (kind === "food") {
    const id = product.id.toLowerCase();
    const nonFood = /\b(mug|cup|card|greeting|book|books|flower|flowers|rose|roses|bouquet|toy|teddy|perfume|jewellery|jewelry|watch|bra|google)\b/.test(text);
    const edible =
      id.startsWith("cake") ||
      id.startsWith("chocolates") ||
      id.startsWith("grocery") ||
      id.includes("_groc") ||
      /\b(chocolate|ferrero|truffle|cake|bento|brownie|cookie|biscuit|cracker|snack|sweet|dessert|hamper|gourmet|tea|coffee|fruit|nuts|dates|kithul|honey|cupcake|cheese)\b/.test(text);
    return !nonFood && edible;
  }

  if (kind === "romantic") {
    const noisy = /\b(book|books|mug|google|kid|kids|pokemon|children|birthday character|standing up for girls)\b/.test(text);
    const romantic = /\b(rose|roses|flower|bouquet|chocolate|ferrero|truffle|heart|love|romantic|anniversary|gift set|giftbox|for my love)\b/.test(text);
    return !noisy && romantic;
  }

  return true;
}

async function searchKaprukaProducts(
  rawQuery: string,
  options: { limit: number; max_price: number | null }
) {
  const limit = Math.min(Math.max(options.limit || 8, 1), 20);
  const normalizedQuery = normalizeSearchQuery(rawQuery);
  const cacheKey = JSON.stringify({
    q: normalizedQuery,
    limit,
    max_price: options.max_price ?? null,
  });
  const cached = searchCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.value;
  }

  const result = await callKaprukaTool<SearchResult>("kapruka_search_products", {
    q: normalizedQuery,
    category: null,
    limit: Math.max(limit, 12),
    currency: "LKR",
    max_price: options.max_price,
    in_stock_only: true,
    response_format: "json",
  });

  const uniqueProducts = Array.from(new Map((result.results ?? []).map((product) => [product.id, product])).values());
  const products = uniqueProducts.filter((product) => isRelevantProduct(product, rawQuery)).slice(0, limit);

  const value = {
    ...result,
    results: products,
  };
  searchCache.set(cacheKey, { expiresAt: Date.now() + SEARCH_CACHE_TTL_MS, value });

  if (searchCache.size > 80) {
    const firstKey = searchCache.keys().next().value;
    if (firstKey) searchCache.delete(firstKey);
  }

  return value;
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

function normalizeDeliveryDate(value: unknown) {
  if (!value) return null;
  const text = String(value).trim();
  const lower = text.toLowerCase();
  if (lower.includes("tomorrow")) return sriLankaDate(1);
  if (lower.includes("today")) return sriLankaDate(0);

  if (/^\d{4}-\d{2}-\d{2}$/.test(text)) {
    return text < sriLankaDate(0) ? sriLankaDate(1) : text;
  }

  return null;
}

/* ── Extract products from tool results ── */

function extractProducts(toolResults: Array<{ name: string; result: unknown }>) {
  for (const tr of toolResults) {
    if (tr.name === "search_products") {
      const res = tr.result as { results?: unknown[] };
      if (res?.results) return res.results;
    }
  }
  return [];
}

function extractDelivery(toolResults: Array<{ name: string; result: unknown }>) {
  for (const tr of toolResults) {
    if (tr.name === "check_delivery") {
      return tr.result;
    }
  }
  return null;
}

function extractOrder(toolResults: Array<{ name: string; result: unknown }>) {
  for (const tr of toolResults) {
    if (tr.name === "create_order") {
      return tr.result;
    }
  }
  return null;
}

async function fallbackSearch(message: string) {
  const intent = extractSearchIntent(message);
  const result = await searchKaprukaProducts(message, {
    limit: 8,
    max_price: intent.max_price,
  });

  const products = result.results ?? [];
  return {
    reply: assistantCopy(message, products, intent.city),
    products,
    delivery: null,
    order: null,
    label: products.length ? "SEARCH_RESULT" : "AI_RECOMMENDATION",
    model: "kapruka-fallback",
  };
}

/* ── SSE streaming endpoint ── */

class TextModelsRateLimitedError extends Error {
  constructor() {
    super("Both routed text models were rate limited.");
    this.name = "TextModelsRateLimitedError";
  }
}

function isRateLimitError(error: unknown) {
  const message = error instanceof Error ? error.message : JSON.stringify(error);
  return /\b429\b|rate.?limit|quota|resource_exhausted/i.test(message);
}

function logModelRoute(intent: string, model: string, startedAt: number) {
  console.log(`[KADE] intent=${intent} model=${model} ms=${Date.now() - startedAt}`);
}

function normalizeReplyKey(value: string) {
  return value.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, " ").replace(/\s+/g, " ").trim();
}

function polishFinalReply(reply: string) {
  let polished = reply.trim().replace(/^["“”]+|["“”]+$/g, "").trim();

  const repeatedOpening = polished.slice(1).search(/\b(Aww|Aiyo|Aney|Got it|Hari|Okay|No worries|Don't worry|Machan|Nona)\b/i);
  if (repeatedOpening > 40) {
    polished = polished.slice(repeatedOpening + 1).trim();
  }

  const uniqueParagraphs: string[] = [];
  for (const paragraph of polished.split(/\n\s*\n/).map((part) => part.trim()).filter(Boolean)) {
    const key = normalizeReplyKey(paragraph);
    if (!uniqueParagraphs.some((existing) => {
      const existingKey = normalizeReplyKey(existing);
      return key === existingKey || key.includes(existingKey) || existingKey.includes(key);
    })) {
      uniqueParagraphs.push(paragraph);
    }
  }

  return (uniqueParagraphs.length ? uniqueParagraphs.join("\n\n") : polished).trim();
}

function cleanAssistantReply(reply: string) {
  let cleaned = reply.replace(/\r\n/g, "\n").trim();
  const rightAnswerStart = cleaned.lastIndexOf("(Right)");
  if (rightAnswerStart >= 0) {
    cleaned = cleaned.slice(rightAnswerStart + "(Right)".length).trim();
  }
  const kadeStyleMatch = cleaned.match(/Kade style\)\s*:\*?\s*([\s\S]+)$/i);
  if (kadeStyleMatch?.[1]) {
    cleaned = kadeStyleMatch[1].trim();
  }
  cleaned = cleaned
    .replace(/^"[^"]+"\s*\((?:GOOD|BAD|RIGHT|WRONG)\s*[-–][^)]+\)\.?\s*/i, "")
    .replace(/\s*\((?:GOOD|BAD|RIGHT|WRONG)\s*[-–][^)]+\)/gi, "");

  const planningLabel =
    "(?:User(?:\\s+says|'s problem)?|Language|Emotion|Intent|Role|Personality|Action|Goal|Status|Tone|Rule|Step\\s+\\d+|STEP\\s+\\d+|Confidence Score|Constraint Checklist[^:]*|Profiling Question\\s*\\d*|Phrasing|Emotional state|Persona requirements|Empathize(?: first)?|Empathy|Advice|Suggestions|Call to Action|Products found|Products|Strategy|Clarification(?:/Question)?|Avoid(?: sounding| jumping| being)?[^:]*|Suggest[^:]*|Ask[^:]*|Option\\s+\\d+|Final answer|Draft\\s*\\d*|Natural phrasing|No markdown[^:]*|No cold[^:]*|No \"I found[^:]*\")";
  const hasPlanningLeak =
    new RegExp(`(^|\\n)\\s*(?:[-*]\\s*)?(?:\\*+\\s*)?${planningLabel}\\s*(?:\\*+)?\\s*:`, "i").test(cleaned) ||
    /(^|\n)\s*(?:[-*]\s*)+(?:The user|I need|I should|I shouldn't|No markdown|Warm,|Natural flow)\b/i.test(cleaned) ||
    /^\s*(?:User is|The user|User wants|User's goal|User's intent)\b/i.test(cleaned) ||
    /\((?:GOOD|BAD|RIGHT|WRONG)\s*[-–]/i.test(cleaned) ||
    /\b(I'll present these options|Let's suggest|Wait, let's look|I have several options:)/i.test(cleaned);

  if (!hasPlanningLeak) return polishFinalReply(cleaned);

  const finalStarterRe = /(?:^|[\n.!?"')])\s*(Aiyo|Aney|Got it|Hari|Okay|No worries|Don't worry|Machan|Nona)\b/gi;
  let finalStart = -1;
  let match: RegExpExecArray | null;
  while ((match = finalStarterRe.exec(cleaned)) !== null) {
    finalStart = match.index + match[0].indexOf(match[1]);
  }

  if (finalStart > 0) {
    cleaned = cleaned.slice(finalStart).trim();
  } else if (/^\s*(?:User is|The user|User wants|User's goal|User's intent)\b/i.test(cleaned)) {
    const paragraphs = cleaned.split(/\n\s*\n/).map((part) => part.trim()).filter(Boolean);
    cleaned = paragraphs.at(-1) ?? cleaned;
  }

  cleaned = cleaned
    .split("\n")
    .filter(
      (line) =>
        !new RegExp(`^\\s*(?:[-*]\\s*)?(?:\\*+\\s*)?${planningLabel}\\s*(?:\\*+)?\\s*:`, "i").test(line) &&
        !/^\s*(?:[-*]\s*)+(?:The user|This is|Following|Do not|I need|I should|I shouldn't|No markdown|Warm,|Natural flow|Right|Wrong)\b/i.test(line)
    )
    .join("\n")
    .replace(/\b(I'll present these options|Let's suggest|Wait, let's look)[^.\n]*\.?/gi, "")
    .replace(/^\*+\s*/, "")
    .trim();

  return polishFinalReply(cleaned) || "Aiyo, I got tangled there. Tell me the occasion and budget again and I will keep it clean.";
}

async function chatWithModelFallback({
  message,
  history,
  audio,
  primaryModel,
  prompt,
  enableGoogleSearch,
}: {
  message: string;
  history: Content[];
  audio?: { data: string; mimeType: string };
  primaryModel: TextModel;
  prompt?: string;
  enableGoogleSearch?: boolean;
}) {
  try {
    return {
      ...(await chatWithTools(message, history, handleToolCall, audio, primaryModel, {
        prompt,
        enableGoogleSearch,
      })),
      modelUsed: primaryModel,
    };
  } catch (primaryError) {
    if (!isRateLimitError(primaryError)) throw primaryError;

    const fallbackModel = alternateTextModel(primaryModel);
    console.warn(`[KADE] model=${primaryModel} rate_limited retry=${fallbackModel}`);

    try {
      return {
        ...(await chatWithTools(message, history, handleToolCall, audio, fallbackModel, {
          prompt,
          enableGoogleSearch,
        })),
        modelUsed: fallbackModel,
      };
    } catch (fallbackError) {
      if (isRateLimitError(fallbackError)) {
        throw new TextModelsRateLimitedError();
      }
      throw fallbackError;
    }
  }
}

function withTimeout<T>(promise: Promise<T>, fallback: T, ms: number): Promise<T> {
  return new Promise((resolve) => {
    const timeout = setTimeout(() => resolve(fallback), ms);
    promise
      .then((value) => {
        clearTimeout(timeout);
        resolve(value);
      })
      .catch(() => {
        clearTimeout(timeout);
        resolve(fallback);
      });
  });
}

function complexPromptWithResearch(research: string) {
  if (!research.trim()) return KADE_COMPLEX_PROMPT;

  return `${KADE_COMPLEX_PROMPT}

---

PRIVATE GOOGLE SEARCH RESEARCH CONTEXT:

${research}

Use this research only as private guidance. Do not mention Google Search,
grounding, sources, or research to the customer. If the research says
NEED_PROFILE, ask that one profiling question naturally and wait. If it
contains gift categories, explain why the best category fits this specific
person, then search Kapruka only when there is enough intent to show real
products.`;
}

function sse(event: string, data: unknown) {
  return `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
}

function shouldSendStarter(reply: string) {
  const trimmed = reply.trim();
  return (
    Boolean(trimmed) &&
    trimmed.length <= 260 &&
    !/give me a second|suggesting anything random|think through this properly|flowers?|cakes?|chocolates?|products?|search|recommend|price|rs\.?/i.test(trimmed)
  );
}

async function precheckResponse(message: string, history: Content[], startedAt: number) {
  if (isSmallTalkOnly(message)) {
    logModelRoute("PRECHECK", "kade-smalltalk-precheck", startedAt);
    return smallTalkReply(message);
  }

  if (!hasEnoughInfoToSearch(message, history) && isRecipientProfilingContext(history) && isProfileOnlyAnswer(message)) {
    logModelRoute("PRECHECK", "kade-profile-precheck", startedAt);
    return recipientProfileFollowup(message);
  }

  const contextReply = contextClarification(message, history);
  if (contextReply) {
    logModelRoute("PRECHECK", "kade-context-precheck", startedAt);
    return contextReply;
  }

  if (shouldClarifyEdibleGift(message)) {
    logModelRoute("PRECHECK", "kapruka-preflight", startedAt);
    return edibleGiftClarification(message);
  }

  if (isDeliveryAvailabilityQuestion(message)) {
    const deliveryReply = await deliveryAvailabilityReply(message);
    if (deliveryReply) {
      logModelRoute("PRECHECK", "kapruka-delivery-check", startedAt);
      return deliveryReply;
    }
  }

  return null;
}

async function routedChatResponse({
  message,
  history,
  audio,
  classifierPromise,
  startedAt,
}: {
  message: string;
  history: Content[];
  audio?: { data: string; mimeType: string };
  classifierPromise: Promise<boolean>;
  startedAt: number;
}) {
  const obviousComplex = hasComplexShoppingSignal(message ?? "");
  const directSearchReady = hasEnoughInfoToSearch(message ?? "", history);
  const isComplex = !directSearchReady && (obviousComplex || await classifierPromise);
  const routeIntent = isComplex ? "COMPLEX" : "SIMPLE";
  const primaryModel = isComplex ? MODELS.complex : MODELS.chat;
  const research = isComplex
    ? await withTimeout(researchGiftIdeas(message, history), "", 2500)
    : "";
  const routeOptions = isComplex
    ? { prompt: complexPromptWithResearch(research), enableGoogleSearch: false }
    : {};

  const { text, toolResults, modelUsed } = await chatWithModelFallback({
    message,
    history,
    audio,
    primaryModel,
    ...routeOptions,
  });
  const reply = cleanAssistantReply(text);
  logModelRoute(routeIntent, modelUsed, startedAt);

  const products = extractProducts(toolResults);
  const delivery = extractDelivery(toolResults);
  const order = extractOrder(toolResults);

  if (!isComplex && toolResults.length === 0 && isShoppingQuery(message)) {
    const fallback = await fallbackSearch(message);
    return { ...fallback, routedModel: modelUsed, intent: routeIntent };
  }

  let label = null;
  if (products.length > 0) label = "SEARCH_RESULT";
  if (delivery) label = "DELIVERY_INFO";
  if (order) label = "ORDER_UPDATE";
  if (toolResults.length === 0) label = "AI_RECOMMENDATION";

  return {
    reply,
    products,
    delivery,
    order,
    label,
    model: modelUsed,
    intent: routeIntent,
  };
}

function friendlyRateLimitResponse(routeIntent: string, startedAt: number) {
  logModelRoute(routeIntent, "rate-limited", startedAt);
  return {
    reply: "Aiyo, ekka busy wela — try again in a moment!",
    products: [],
    delivery: null,
    order: null,
    label: "AI_RECOMMENDATION",
    model: "rate-limited",
  };
}

function streamChatResponse({
  message,
  history,
  audio,
  classifierPromise,
  startedAt,
}: {
  message: string;
  history: Content[];
  audio?: { data: string; mimeType: string };
  classifierPromise: Promise<boolean>;
  startedAt: number;
}) {
  const encoder = new TextEncoder();

  return new Response(
    new ReadableStream({
      async start(controller) {
        const send = (event: string, data: unknown) => controller.enqueue(encoder.encode(sse(event, data)));

        try {
          const precheck = await precheckResponse(message, history, startedAt);
          if (precheck) {
            send("final", precheck);
            send("done", {});
            return;
          }

          const obviousComplex = hasComplexShoppingSignal(message ?? "");
          const directSearchReady = hasEnoughInfoToSearch(message ?? "", history);
          const isComplex = !directSearchReady && (obviousComplex || await classifierPromise);

          if (isComplex) {
            const starterPromise = withTimeout(
              quickComplexStarter(message).then(cleanAssistantReply),
              "",
              1200
            );
            const finalPromise = routedChatResponse({
              message,
              history,
              audio,
              classifierPromise: Promise.resolve(true),
              startedAt,
            });

            const starterReply = await starterPromise;
            if (shouldSendStarter(starterReply)) {
              send("starter", {
                reply: starterReply,
                model: MODELS.chat,
                intent: "COMPLEX",
              });
            }
            send("final", await finalPromise);
          } else {
            send(
              "final",
              await routedChatResponse({
                message,
                history,
                audio,
                classifierPromise: Promise.resolve(false),
                startedAt,
              })
            );
          }

          send("done", {});
        } catch (error) {
          if (error instanceof TextModelsRateLimitedError) {
            send("final", friendlyRateLimitResponse("COMPLEX", startedAt));
          } else {
            console.error("Chat stream error:", error);
            try {
              send("final", await fallbackSearch(message));
            } catch {
              send("error", {
                reply: "I'm having trouble connecting right now. Please try again in a moment!",
              });
            }
          }
          send("done", {});
        } finally {
          controller.close();
        }
      },
    }),
    {
      headers: {
        "Content-Type": "text/event-stream; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
      },
    }
  );
}

export async function POST(req: NextRequest) {
  let messageForFallback = "";
  const startedAt = Date.now();
  let routeIntent = "SIMPLE";

  try {
    const { message, history, audio, stream } = (await req.json()) as {
      message: string;
      history?: Content[];
      audio?: { data: string; mimeType: string };
      stream?: boolean;
    };
    messageForFallback = message || "audio message";

    const conversationHistory: Content[] = history ?? [];
    const classifierPromise = isComplexIntent(message ?? "", conversationHistory);

    if (stream) {
      return streamChatResponse({
        message,
        history: conversationHistory,
        audio,
        classifierPromise,
        startedAt,
      });
    }

    const precheck = await precheckResponse(message, conversationHistory, startedAt);
    if (precheck) return Response.json(precheck);

    const obviousComplex = hasComplexShoppingSignal(message ?? "");
    const directSearchReady = hasEnoughInfoToSearch(message ?? "", conversationHistory);
    const isComplex = !directSearchReady && (obviousComplex || await classifierPromise);
    routeIntent = isComplex ? "COMPLEX" : "SIMPLE";
    const primaryModel = isComplex ? MODELS.complex : MODELS.chat;
    const research = isComplex
      ? await withTimeout(researchGiftIdeas(message, conversationHistory), "", 2500)
      : "";
    const routeOptions = isComplex
      ? { prompt: complexPromptWithResearch(research), enableGoogleSearch: false }
      : {};

    const { text, toolResults, modelUsed } = await chatWithModelFallback({
      message,
      history: conversationHistory,
      audio,
      primaryModel,
      ...routeOptions,
    });
    const reply = cleanAssistantReply(text);
    logModelRoute(routeIntent, modelUsed, startedAt);

    const products = extractProducts(toolResults);
    const delivery = extractDelivery(toolResults);
    const order = extractOrder(toolResults);

    if (!isComplex && toolResults.length === 0 && isShoppingQuery(message)) {
      const fallback = await fallbackSearch(message);
      return Response.json({ ...fallback, routedModel: modelUsed });
    }

    // Determine label based on what tools were called
    let label = null;
    if (products.length > 0) label = "SEARCH_RESULT";
    if (delivery) label = "DELIVERY_INFO";
    if (order) label = "ORDER_UPDATE";
    if (toolResults.length === 0) label = "AI_RECOMMENDATION";

    return Response.json({
      reply,
      products,
      delivery,
      order,
      label,
      model: modelUsed,
    });
  } catch (error) {
    if (error instanceof TextModelsRateLimitedError) {
      logModelRoute(routeIntent, "rate-limited", startedAt);
      return Response.json({
        reply: "Aiyo, ekka busy wela — try again in a moment!",
        products: [],
        delivery: null,
        order: null,
        label: "AI_RECOMMENDATION",
        model: "rate-limited",
      });
    }

    console.error("Chat API error:", error);
    try {
      if (messageForFallback) {
        return Response.json(await fallbackSearch(messageForFallback));
      }
    } catch (fallbackError) {
      console.error("Chat fallback error:", fallbackError);
    }

    return Response.json(
      {
        reply:
          "I'm having trouble connecting right now. Please try again in a moment! 🙏",
        products: [],
        error: error instanceof Error ? error.message : "Chat failed",
      },
      { status: 500 }
    );
  }
}
