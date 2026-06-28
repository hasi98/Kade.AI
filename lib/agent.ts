import type { Product } from "./types";

const SINHALA_RE = /[\u0d80-\u0dff]/;
const TAMIL_RE = /[\u0b80-\u0bff]/;
const SINHALA_FLOWER_RE = /මල්|රෝස/;
const TAMIL_FLOWER_RE = /பூ|மலர்|ரோஜா/;
const SINHALA_EDIBLE_RE = /කන්න|කෑම|කේක්|චොකලට්|චොක්ලට්|බිස්කට්/;
const TAMIL_EDIBLE_RE = /சாப்பிட|உணவு|கேக்|சாக்லேட்|பிஸ்கட்/;
const SINHALA_CAKE_RE = /කේක්|උපන්දින/;
const TAMIL_CAKE_RE = /கேக்|பிறந்தநாள்/;
const SINHALA_CHOCOLATE_RE = /චොකලට්|චොක්ලට්/;
const TAMIL_CHOCOLATE_RE = /சாக்லேட்/;
const SINHALA_BISCUIT_RE = /බිස්කට්/;
const TAMIL_BISCUIT_RE = /பிஸ்கட்/;
const SINHALA_GIFT_RE = /තෑගි|තෑග්ග/;
const TAMIL_GIFT_RE = /பரிசு/;

function hasAny(input: string, terms: string[]) {
  const lower = input.toLowerCase();
  return terms.some((term) => lower.includes(term));
}

function hasFlowerMention(input: string) {
  return /\b(flowers?|roses?|bouquet|mal|poo|pookal)\b/i.test(input) ||
    SINHALA_FLOWER_RE.test(input) ||
    TAMIL_FLOWER_RE.test(input);
}

export function dislikesFlowers(input: string) {
  return hasFlowerMention(input) &&
    /\b(don'?t|doesn'?t|do not|does not|not|hate|hates|dislike|dislikes|avoid|no|epa|kamathi na|asa na)\b/i.test(input);
}

export function asksForEdibleGift(input: string) {
  return /\b(eat|eats|edible|food|snack|snacks|sweet|dessert|kanna|cake|chocolate|biscuits?|cookies?)\b/i.test(input) ||
    SINHALA_EDIBLE_RE.test(input) ||
    TAMIL_EDIBLE_RE.test(input);
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
  const wantsCake = /\b(cakes?|birthday|icing|keik|bento|ribbon)\b/.test(lower) || SINHALA_CAKE_RE.test(input) || TAMIL_CAKE_RE.test(input);
  const wantsFlowers = !flowerBlocked && hasFlowerMention(input);
  const wantsChocolate = /\b(chocolates?|choco|choko|soklet|ferrero|toblerone)\b/.test(lower) || SINHALA_CHOCOLATE_RE.test(input) || TAMIL_CHOCOLATE_RE.test(input);
  const wantsBiscuits = /\b(biscuits?|cookies?|crackers?|biskut|munchee|maliban|oreo)\b/.test(lower) || SINHALA_BISCUIT_RE.test(input) || TAMIL_BISCUIT_RE.test(input);
  const wantsModelVehicle =
    /\b(hot wheels?|die-?cast|dicast|miniature cars?|mini cars?|small cars?|toy cars?|model cars?|collect(?:ible|able) cars?|car stuff|vehicle models?|bike models?)\b/.test(lower) ||
    (/\b(cars?|vehicles?|bikes?|motorbikes?|motorcycles?)\b/.test(lower) && /\b(model|models|toy|toys|small|mini|miniature|collect(?:ible|able)|die-?cast|dicast)\b/.test(lower));
  const wantsGift = /\b(gifts?|thagi|thaagi|parisu)\b/.test(lower) || SINHALA_GIFT_RE.test(input) || TAMIL_GIFT_RE.test(input);

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
  if (wantsModelVehicle) q = "diecast model car";
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

function productName(product?: Product) {
  if (!product) return null;
  const price = product.price?.amount == null ? "" : ` (Rs. ${new Intl.NumberFormat("en-LK", { maximumFractionDigits: 0 }).format(product.price.amount)})`;
  return `${product.name}${price}`;
}

function emotionalGiftCopy(input: string, products: Product[]) {
  const lower = input.toLowerCase();
  const isApology = /\b(messed up|sorry|apology|forgive|angry|mad|fight|damage control)\b/.test(lower);
  const isGirlfriend = /\b(girlfriend|gf|wife|crush|love)\b/.test(lower);
  const isAmma = /\b(amma|ammi|mother|mom|mum)\b/.test(lower);

  if (!products.length || (!isApology && !isGirlfriend && !isAmma)) return null;

  const textFor = (product: Product) =>
    `${product.id} ${product.name} ${product.summary ?? ""} ${product.category?.name ?? ""}`.toLowerCase();
  const flowers = products.find((product) => /\b(rose|flower|bouquet)\b/.test(textFor(product)));
  const chocolate = products.find((product) => /\b(chocolate|ferrero|truffle|hearts?)\b/.test(textFor(product)));
  const romanticAlternative = products.find((product) => {
    const text = textFor(product);
    return product !== flowers && product !== chocolate && /\b(heart|love|romantic|ferrero|truffle|chocolate)\b/.test(text);
  });
  const first = products[0];

  if (isApology || isGirlfriend) {
    const safeProduct = flowers || chocolate || products.find((product) => (product.price?.amount ?? 0) <= 10000) || first;
    const grandProduct =
      products.find((product) => product !== safeProduct && (product.price?.amount ?? 0) >= 10000) ||
      products.find((product) => product !== safeProduct);
    const cuteProduct =
      chocolate ||
      romanticAlternative ||
      products.find((product) => product !== safeProduct && product !== grandProduct && (product.price?.amount ?? 0) <= 7000);
    const safe = productName(safeProduct);
    const grand = productName(grandProduct);
    const cute = productName(cuteProduct && cuteProduct !== safeProduct && cuteProduct !== grandProduct ? cuteProduct : undefined);

    return [
      "Aiyo, okay. For this one, do not overthink it: make it feel intentional, sweet, and a little romantic.",
      safe ? `The safest move is ${safe}. It says sorry without looking random.` : null,
      grand ? `If this is proper damage-control territory, pick ${grand}. One strong gesture is better than three confused small ones.` : null,
      cute ? `If you want something softer, ${cute} keeps it cute and not too dramatic.` : null,
      "Add the option that feels closest to the situation and I can help with delivery plus a sincere gift message.",
    ].filter(Boolean).join("\n\n");
  }

  if (isAmma) {
    const main = productName(first);
    const second = productName(products[1]);
    return [
      "For Amma, I would keep it thoughtful and useful rather than flashy.",
      main ? `${main} looks like the safest first pick.` : null,
      second ? `${second} is also worth considering if you want a softer add-on.` : null,
      "Pick one and I can help check delivery and add a warm message.",
    ].filter(Boolean).join("\n\n");
  }

  return null;
}

export function assistantCopy(input: string, products: Product[], city?: string | null) {
  const tone = detectTone(input);
  const count = products.length;
  const emotionalCopy = emotionalGiftCopy(input, products);

  if (emotionalCopy) return emotionalCopy;

  if (tone === "sinhala") {
    return count
      ? "හරි, මේ options ටික බලන්න. කැමති එකක් දැක්කොත් කියන්න, මම ඊළඟට delivery බලන්නම්."
      : "මට තව ටිකක් context දෙන්න. ඔයා හොයන්නේ cake එකක්ද, chocolate එකක්ද, නැත්තම් වෙන gift එකක්ද?";
  }

  if (tone === "tamil") {
    return count
      ? "சரி, இந்த options நல்லா பொருந்தும். பிடித்தது இருந்தா சொல்லுங்க, அடுத்தது delivery பார்க்கலாம்."
      : "கொஞ்சம் context சொல்லுங்க. Cake வேண்டுமா, chocolate வேண்டுமா, இல்ல வேற gift ஒன்றா?";
  }

  if (tone === "tanglish") {
    return count
      ? `Hari, me options tika balanna${city ? ` for ${city}` : ""}. Kamathi ekak thiyenawanam kiyanna, next delivery balamu.`
      : "Thawa poddak context denna. Cake ekakda, chocolate ekakda, nathnam wena gift ekakda?";
  }

  return count
    ? `Nice, these Kapruka picks look closest to what you asked${city ? ` for ${city}` : ""}. Pick the one that feels right and I can handle delivery next.`
    : "Give me a little more context. Are we thinking cake, chocolate, hamper, or another kind of gift?";
}
