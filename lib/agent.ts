import type { Product } from "./types";

const SINHALA_RE = /[\u0d80-\u0dff]/;

export function detectTone(input: string) {
  const lower = input.toLowerCase();
  if (SINHALA_RE.test(input)) return "sinhala";
  if (/\b(ane|machan|hari|kohomada|oyata|mata|denna|colombo|galle)\b/.test(lower)) return "tanglish";
  return "english";
}

export function extractSearchIntent(input: string) {
  const lower = input.toLowerCase();
  const budgetMatch = lower.match(/(?:under|below|less than|max|budget|යට|adui)\s*(?:rs\.?|lkr)?\s*([\d,]+)/i);
  const cityMatch = input.match(/\b(colombo\s?\d{1,2}|galle|kandy|negombo|jaffna|matara|kurunegala|anuradhapura|ratnapura|batticaloa)\b/i);
  const category =
    lower.includes("cake") || lower.includes("birthday") || lower.includes("icing")
      ? "Cakes"
      : lower.includes("flower") || lower.includes("rose")
        ? "Flowers"
        : lower.includes("chocolate")
          ? "Chocolates"
          : lower.includes("gift")
            ? "Gifts"
            : null;

  const cleaned = lower
    .replace(/(?:show|find|search|need|want|buy|gift|for|under|below|less than|max|budget|rs\.?|lkr|mata|oyata|denna|ane|machan)/gi, " ")
    .replace(/[\d,]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  let q = cleaned || category || input.trim();
  if (lower.includes("birthday") || lower.includes("cake") || lower.includes("icing")) q = "birthday";
  if (lower.includes("flower") || lower.includes("rose")) q = "roses";
  if (lower.includes("chocolate")) q = "chocolate";
  if (q.length < 3) q = category || "gift";

  return {
    q,
    category,
    max_price: budgetMatch ? Number(budgetMatch[1].replace(/,/g, "")) : null,
    city: cityMatch?.[1] ?? null,
    tone: detectTone(input)
  };
}

export function assistantCopy(input: string, products: Product[], city?: string | null) {
  const tone = detectTone(input);
  const count = products.length;

  if (tone === "sinhala") {
    return count
      ? `මෙන්න Kapruka එකෙන් ගැලපෙන options ${count}ක්. කැමති item එක cart එකට දාන්න, city/date දුන්නොත් delivery quote එකත් බලන්නම්.`
      : "මේ search එකට හරිම match එකක් හම්බුනේ නැහැ. තව ටිකක් specific කරලා කියන්න, උදාහරණයක් විදියට birthday cake, roses, tea gift වගේ.";
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
