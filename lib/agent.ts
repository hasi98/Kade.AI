import type { Product } from "./types";

const SINHALA_RE = /[\u0d80-\u0dff]/;
const TAMIL_RE = /[\u0b80-\u0bff]/;

function hasAny(input: string, terms: string[]) {
  const lower = input.toLowerCase();
  return terms.some((term) => lower.includes(term));
}

function hasFlowerMention(input: string) {
  return /\b(flowers?|roses?|bouquet|mal|poo|pookal)\b/i.test(input) ||
    /මල්|රෝස|பூ|மலர்|ரோஜா/.test(input);
}

export function dislikesFlowers(input: string) {
  return hasFlowerMention(input) &&
    /\b(don'?t|doesn'?t|do not|does not|not|hate|hates|dislike|dislikes|avoid|no|epa|kamathi na|asa na)\b/i.test(input);
}

export function asksForEdibleGift(input: string) {
  return /\b(eat|eats|edible|food|snack|snacks|sweet|dessert|kanna|cake|chocolate|biscuits?|cookies?)\b/i.test(input) ||
    /කන්න|කෑම|பசிக்க|சாப்பிட|உணவு/.test(input);
}

export function detectTone(input: string) {
  const lower = input.toLowerCase();
  if (SINHALA_RE.test(input)) return "sinhala";
  if (TAMIL_RE.test(input)) return "tamil";
  if (/\b(ane|aney|machan|hari|kohomada|oyata|mata|denna|colombo|galle|kanna)\b/.test(lower)) return "tanglish";
  return "english";
}

export function extractSearchIntent(input: string) {
  const lower = input.toLowerCase();
  const budgetMatch = lower.match(/(?:under|below|less than|max|budget|yata|adui|යට)\s*(?:rs\.?|lkr)?\s*([\d,]+)/i);
  const cityMatch = input.match(/\b(colombo\s?\d{1,2}|galle|kandy|negombo|jaffna|matara|kurunegala|anuradhapura|ratnapura|batticaloa|balangoda)\b/i);

  const flowerBlocked = dislikesFlowers(input);
  const wantsCake = /\b(cakes?|birthday|icing|keik|bento|ribbon)\b/.test(lower) || /කේක්|උපන්दिन|கேக்|பிறந்தநாள்/.test(input);
  const wantsFlowers = !flowerBlocked && hasFlowerMention(input);
  const wantsChocolate = /\b(chocolates?|choco|choko|soklet|ferrero|toblerone)\b/.test(lower) || /චොකලට්|சாக்லேட்/.test(input);
  const wantsBiscuits = /\b(biscuits?|cookies?|crackers?|biskut|munchee|maliban|oreo)\b/.test(lower) || /බිස්කට්|பிஸ்கட்/.test(input);
  const wantsGift = /\b(gifts?|thagi|thaagi|parisu)\b/.test(lower) || /තෑගි|තෑග්ග|பரிசு/.test(input);

  const category = wantsCake
    ? "Cakes"
    : wantsFlowers
      ? "Flowers"
      : wantsChocolate
        ? "Chocolates"
        : wantsGift
          ? "Gifts"
          : null;

  const cleaned = lower
    .replace(/(?:show|find|search|need|want|buy|gift|for|under|below|less than|max|budget|rs\.?|lkr|mata|oyata|denna|ane|aney|machan|hoyala|balanna)/gi, " ")
    .replace(/[\d,]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  let q = cleaned || category || input.trim();
  if (wantsCake) q = "birthday";
  if (wantsFlowers) q = "roses";
  if (wantsChocolate) q = "chocolate";
  if (wantsBiscuits) q = "biscuits";
  if (!wantsCake && !wantsChocolate && !wantsBiscuits && flowerBlocked && asksForEdibleGift(input)) {
    q = "chocolate";
  }
  if (q.length < 3) q = category || "gift";

  return {
    q,
    category,
    max_price: budgetMatch ? Number(budgetMatch[1].replace(/,/g, "")) : null,
    city: cityMatch?.[1] ?? null,
    tone: detectTone(input),
  };
}

export function assistantCopy(input: string, products: Product[], city?: string | null) {
  const tone = detectTone(input);
  const count = products.length;

  if (tone === "sinhala") {
    return count
      ? `Kapruka එකෙන් ගැලපෙන options ${count}ක් තියෙනවා. කැමති item එක cart එකට දාන්න; city/date දුන්නොත් delivery quote එකත් බලන්නම්.`
      : "මේකට හරි match එකක් හම්බුනේ නැහැ. තව ටිකක් specific කරලා කියන්න, cake, chocolates, biscuits වගේ.";
  }

  if (tone === "tamil") {
    return count
      ? `Kapruka-வில் பொருத்தமான ${count} options கிடைத்தது. பிடித்த item-ஐ cart-க்கு add பண்ணுங்கள்; city/date கொடுத்தால் delivery quote பார்க்கலாம்.`
      : "இதற்கு சரியான match கிடைக்கவில்லை. Cake, chocolates, biscuits மாதிரி இன்னும் specific-ஆ சொல்லுங்கள்.";
  }

  if (tone === "tanglish") {
    return count
      ? `Hari, Kapruka eke solid picks ${count} found${city ? ` for ${city}` : ""}. Add karanna, delivery quote eka balala checkout link eka denna puluwan.`
      : "Me request ekata clear match ekak na. Cake, chocolate, biscuits wage edible gift type ekak kiyanna.";
  }

  return count
    ? `I found ${count} Kapruka picks${city ? ` that can work for ${city}` : ""}. Add a few to the cart, then I can check delivery and create the pay link.`
    : "I could not find a strong match. Try a more specific phrase like birthday cake, chocolates, tea hamper, or biscuits.";
}
