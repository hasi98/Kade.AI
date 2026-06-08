import type { Product } from "./types";

const SINHALA_RE = /[\u0d80-\u0dff]/;
const TAMIL_RE = /[\u0b80-\u0bff]/;

function hasAny(input: string, terms: string[]) {
  return terms.some((term) => input.includes(term));
}

export function detectTone(input: string) {
  const lower = input.toLowerCase();
  if (SINHALA_RE.test(input)) return "sinhala";
  if (TAMIL_RE.test(input)) return "tamil";
  if (/\b(ane|machan|hari|kohomada|oyata|mata|denna|colombo|galle)\b/.test(lower)) return "tanglish";
  return "english";
}

export function extractSearchIntent(input: string) {
  const lower = input.toLowerCase();
  const budgetMatch = lower.match(/(?:under|below|less than|max|budget|yata|adui|යට)\s*(?:rs\.?|lkr)?\s*([\d,]+)/i);
  const cityMatch = input.match(/\b(colombo\s?\d{1,2}|galle|kandy|negombo|jaffna|matara|kurunegala|anuradhapura|ratnapura|batticaloa)\b/i);

  const wantsCake =
    /\b(cakes?|birthday|icing|keik)\b/.test(lower) ||
    hasAny(input, ["කේක්", "උපන්දින", "கேக்", "பிறந்தநாள்"]);
  const wantsFlowers =
    /\b(flowers?|roses?|bouquet|mal|poo|pookal)\b/.test(lower) ||
    hasAny(input, ["මල්", "රෝස", "பூ", "மலர்", "ரோஜா"]);
  const wantsChocolate =
    /\b(chocolates?|choko|soklet)\b/.test(lower) ||
    hasAny(input, ["චොකලට්", "சாக்லேட்"]);
  const wantsGift =
    /\b(gifts?|thagi|thaagi|parisu)\b/.test(lower) ||
    hasAny(input, ["තෑගි", "තෑග්ග", "பரிசு"]);
  const wantsBiscuits =
    /\b(biscuits?|cookies?|crackers?|biskut|munchee|maliban)\b/.test(lower) ||
    hasAny(input, ["බිස්කට්", "பிஸ்கட்"]);

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
    .replace(/(?:show|find|search|need|want|buy|gift|for|under|below|less than|max|budget|rs\.?|lkr|mata|oyata|denna|ane|machan|hoyala|balanna)/gi, " ")
    .replace(/[\d,]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  let q = cleaned || category || input.trim();
  if (wantsCake) q = "birthday";
  if (wantsFlowers) q = "roses";
  if (wantsChocolate) q = "chocolate";
  if (wantsBiscuits) q = "biscuits";
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
      ? `මෙන්න Kapruka එකෙන් ගැළපෙන options ${count}ක්. කැමති item එක cart එකට දාන්න. City/date දුන්නොත් delivery quote එකත් බලන්නම්.`
      : "මේ search එකට හරිම match එකක් හම්බුනේ නැහැ. තව ටිකක් specific කරලා කියන්න, උදාහරණයක් විදියට birthday cake, roses, tea gift වගේ.";
  }

  if (tone === "tamil") {
    return count
      ? `Kapruka-வில் பொருத்தமான ${count} options கிடைத்தது. பிடித்த item-ஐ cart-க்கு add பண்ணுங்கள்; city/date கொடுத்தால் delivery quote பார்க்கலாம்.`
      : "இந்த search-க்கு சரியான match கிடைக்கவில்லை. Birthday cake, roses, tea gift மாதிரி இன்னும் specific-ஆ சொல்லுங்கள்.";
  }

  if (tone === "tanglish") {
    return count
      ? `Hari, Kapruka eke solid picks ${count} found${city ? ` for ${city}` : ""}. Add karanna, delivery quote eka balala checkout link eka denna puluwan.`
      : "Me query ekata clear match ekak na. Try 'birthday cake under 8000' wage specific phrase ekak.";
  }

  return count
    ? `I found ${count} Kapruka picks${city ? ` that can work for ${city}` : ""}. Add a few to the cart, then I can check delivery and create the pay link.`
    : "I could not find a strong match. Try a more specific phrase like birthday cake, red roses, tea hamper, or chocolates.";
}
