import { GoogleGenAI, type Content } from "@google/genai";
import { MODELS } from "./models";

const apiKey = process.env.GEMINI_API_KEY || "";
const ai = new GoogleGenAI({ apiKey });

const CLASSIFIER_PROMPT =
  "Classify this shopping message as SIMPLE or COMPLEX. Before classifying, check if the user has already provided enough information to search directly. If yes, classify as SIMPLE and search immediately regardless of topic complexity. COMPLEX means: gift advice, emotional context, budget planning, relationship situations, or unclear intent. SIMPLE means: direct product search, order tracking, yes/no replies, greetings. Reply with only one word: SIMPLE or COMPLEX.";

const CLASSIFIER_TIMEOUT_MS = 200;

export function hasComplexShoppingSignal(message: string): boolean {
  const lower = message.toLowerCase();
  return (
    /\b(recommend|suggest|ideas?|help me choose|what should|which one|budget plan|bundle|combine|you choose|send some gifts|some gifts|something nice)\b/.test(lower) ||
    /\b(amma|ammi|mother|mom|mum|dad|thaththa|girlfriend|gf|boyfriend|bf|wife|husband|crush|girl|boy|daughter|son|kid|kids|child|children|teen|teenager|niece|nephew)\b/.test(lower) ||
    /\b(anniversary|wedding|valentine|graduation|housewarming|apology|sorry|messed up|forgot|hospital)\b/.test(lower) ||
    /\b(gift|present|surprise)\b.*\b(for|to)\b/.test(lower) ||
    /\b(for|to)\b.*\b(amma|ammi|mother|mom|mum|dad|girlfriend|gf|wife|husband)\b/.test(lower)
  );
}

function historyText(history: Content[] = []) {
  return history
    .slice(-8)
    .flatMap((entry) => entry.parts?.map((part) => part.text ?? "") ?? [])
    .join("\n")
    .toLowerCase();
}

function isAgeGatedGiftContext(text: string) {
  const lower = text.toLowerCase();
  const hasGiftIntent =
    /\b(gift|gifts|present|surprise|recommend|suggest|ideas?|what should|what would|would love|something nice|something special)\b/.test(lower) ||
    /\b(show|find|search|send|buy|choose|pick)\b.*\b(gift|gifts|present|surprise)\b/.test(lower);
  const hasAgeSensitiveRecipient =
    /\b(girl|boy|girlfriend|gf|boyfriend|bf|daughter|son|kid|kids|child|children|teen|teenager|niece|nephew|wife|husband)\b/.test(lower);
  return hasGiftIntent && hasAgeSensitiveRecipient;
}

function hasRecipientAge(text: string) {
  const lower = text.toLowerCase();
  return (
    /\b(?:age|aged|old|years? old|yrs? old|y\/o|yo)\s*(?:is|:)?\s*\d{1,2}\b/.test(lower) ||
    /\b(?:she|he|they|girl|boy|girlfriend|boyfriend|gf|bf|daughter|son|kid|child|wife|husband)\s*(?:is|'s|age is|aged)?\s*\d{1,2}\b/.test(lower) ||
    /\b(?:she|he|they|girl|boy|girlfriend|boyfriend|gf|bf|daughter|son|kid|child|wife|husband)\s*(?:is|'s)?\s*(?:turning|turns?|becoming)\s*(?:into)?\s*\d{1,2}\b/.test(lower) ||
    /\b(?:turning|turns?|becoming)\s*(?:into)?\s*\d{1,2}\b/.test(lower) ||
    /\b\d{1,2}\s*(?:years? old|yrs? old|y\/o|yo)\b/.test(lower)
  );
}

export function hasEnoughInfoToSearch(message: string, history: Content[] = []): boolean {
  const lower = message.toLowerCase();
  const context = historyText(history);
  const combined = `${context}\n${lower}`;

  if (isAgeGatedGiftContext(combined) && !hasRecipientAge(combined)) {
    return false;
  }

  if (/\b(track|tracking|where is my order|order status)\b/i.test(lower) && /\b[A-Z0-9]{5,}\b/i.test(message)) {
    return true;
  }

  const concreteProduct =
    /\b(chocolate cakes?|cake|cakes|bento|ribbon cake|cupcakes?|brownies?|chocolates?|ferrero|truffle|java chocolate|biscuits?|cookies?|crackers?|gourmet hamper|food hamper|snack hamper|tea|basilur|dilmah|qualitea|coffee|spa ceylon|perfume|handbag|jewellery|jewelry|flowers?|roses?|bouquet|baby hamper|gift set|gift box|toy cars?|model cars?|small cars?|mini cars?|miniature cars?|die-?cast|dicast|hot wheels?|collectible cars?|collectable cars?|car stuff|vehicle models?)\b/i.test(lower);
  const directAction =
    /\b(show|find|search|send|buy|order|add|checkout|look for|show me|give me options|pick|choose)\b/i.test(lower);
  const concreteAnswer =
    /\b(she|he|they|my gf|my girlfriend|my wife|my husband|my amma|my friend)\b.*\b(likes|loves|wants|is into|prefers)\b.*\b(chocolate cakes?|cakes?|chocolates?|biscuits?|cookies?|tea|coffee|flowers?|roses?|spa ceylon|perfume|jewellery|jewelry|toy cars?|model cars?|small cars?|mini cars?|miniature cars?|die-?cast|dicast|hot wheels?|collectible cars?|collectable cars?|car stuff|vehicle models?)\b/i.test(lower);
  const budgetOnly = /\b(budget|under|below|max|around|about)\s*(?:rs\.?|lkr)?\s*[\d,]+|(?:rs\.?|lkr)\s*[\d,]+/i.test(lower);
  const cityOnly = /\b(deliver|delivery|send)\b.*\b(colombo\s?\d{1,2}|galle|kandy|negombo|jaffna|matara|kurunegala|balangoda)\b/i.test(lower);
  const contextHasProduct = /\b(cake|cakes|chocolate|chocolates|biscuit|biscuits|cookies|flowers|roses|bouquet|hamper|tea|coffee|spa ceylon|perfume|gift set)\b/i.test(combined);

  if (concreteProduct && (directAction || concreteAnswer)) return true;
  if ((budgetOnly || cityOnly) && contextHasProduct) return true;
  if (concreteAnswer) return true;

  return false;
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

export async function isComplexIntent(message: string, history: Content[] = []): Promise<boolean> {
  if (!apiKey || !message.trim()) return false;
  if (hasEnoughInfoToSearch(message, history)) return false;

  const request = ai.models
    .generateContent({
      model: MODELS.classifier,
      contents: [{ role: "user", parts: [{ text: message.slice(0, 700) }] }],
      config: {
        systemInstruction: CLASSIFIER_PROMPT,
        temperature: 0,
        maxOutputTokens: 3,
      },
    })
    .then((response) => response.text?.trim().toUpperCase() === "COMPLEX");

  return withTimeout(request, false, CLASSIFIER_TIMEOUT_MS);
}
