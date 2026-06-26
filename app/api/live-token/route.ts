import { GoogleGenAI, Modality, Type, type FunctionDeclaration } from "@google/genai";
import { NextResponse } from "next/server";
import { MODELS } from "@/lib/models";
import { KADE_LIVE_SYSTEM_PROMPT } from "@/lib/personality";

export const runtime = "nodejs";

const apiKey = process.env.GEMINI_API_KEY;
const model = process.env.GEMINI_LIVE_MODEL || MODELS.voice;
const AVAILABLE_VOICES = new Set([
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
]);

type LiveContextProduct = {
  index?: number;
  name?: string;
  price?: number;
  inStock?: boolean;
};

type LiveTokenContext = {
  conversationSummary?: string;
  shownProducts?: LiveContextProduct[];
  cartCount?: number;
  cartTotal?: number;
};

const liveTools: FunctionDeclaration[] = [
  {
    name: "kapruka_search_products",
    description:
      "Search live Kapruka products and render product cards in the Kade UI. Call this whenever the user asks to show, find, search, browse, see products, more options, another type, different options, or once you have enough details to make a useful recommendation. Current visible products are context only; they never limit you from searching again. Do not claim products are visible until this function returns.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        q: {
          type: Type.STRING,
          description: "Specific Kapruka search query, e.g. 'chocolate cake', 'red roses', 'self care hamper'.",
        },
        category: {
          type: Type.STRING,
          description: "Optional category hint such as Cakes, Flowers, Chocolates, Gifts, Electronics.",
        },
        max_price: {
          type: Type.NUMBER,
          description: "Optional maximum price in LKR when the user gives a budget.",
        },
        limit: {
          type: Type.NUMBER,
          description: "Number of products to return. Use 6 to 8 for voice.",
        },
      },
      required: ["q"],
    },
  },
  {
    name: "cart_add_item",
    description:
      "Add one of the currently visible Kapruka products to the cart. Call this whenever the user picks, selects, says add to cart, says 'number two', 'second one', names a visible product, or asks to buy a visible product. Do not say the cart was updated until this function returns.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        product_id: {
          type: Type.STRING,
          description: "Product ID from the latest kapruka_search_products result, if known.",
        },
        product_index: {
          type: Type.NUMBER,
          description: "1-based visible product number, e.g. 2 for 'second one'.",
        },
        product_name: {
          type: Type.STRING,
          description: "Visible product name or partial name, if the user referred by name.",
        },
        quantity: {
          type: Type.NUMBER,
          description: "Quantity to add. Default 1.",
        },
      },
    },
  },
  {
    name: "checkout_start",
    description:
      "Start collecting checkout details for the current cart. Call when the user says checkout, buy, order, make the order, place order, create payment link, or asks to send the selected items.",
    parameters: {
      type: Type.OBJECT,
      properties: {},
    },
  },
  {
    name: "checkout_provide_detail",
    description:
      "Send the user's latest checkout answer to the Kade order form. Use this only when the user is actually answering the current checkout question. Do not call this for clarification questions like 'what is recipient name?', 'what do you mean?', 'recipient kiyanne mokakda?', or if the user sounds confused. In those cases, answer naturally, explain the field, and repeat the current question. Pass the raw user answer exactly.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        answer: {
          type: Type.STRING,
          description: "The user's raw answer, e.g. full name, phone number, address, date, no/skip, or message text.",
        },
        field: {
          type: Type.STRING,
          description: "Optional target field: recipientName, recipientPhone, deliveryAddress, deliveryCity, locationType, deliveryDate, senderName, anonymous, giftMessage, icingText.",
        },
      },
      required: ["answer"],
    },
  },
  {
    name: "checkout_place_order",
    description:
      "Create the Kapruka guest checkout order and payment link after the user explicitly confirms the order summary. Do not invent a payment link; call this tool.",
    parameters: {
      type: Type.OBJECT,
      properties: {},
    },
  },
];

function voiceContextPrompt(context?: LiveTokenContext) {
  const products = context?.shownProducts?.length
    ? context.shownProducts
        .slice(0, 8)
        .map((product, index) => `${product.index ?? index + 1}. ${product.name ?? "Product"} Rs.${Number(product.price ?? 0).toLocaleString("en-LK")} ${product.inStock === false ? "(stock uncertain)" : ""}`)
        .join("\n")
    : "No products are currently shown.";

  const history = context?.conversationSummary?.trim()
    ? context.conversationSummary.trim().slice(-1800)
    : "No previous chat history.";

  const cartCount = Number(context?.cartCount ?? 0);
  const cartTotal = Number(context?.cartTotal ?? 0);

  return `${KADE_LIVE_SYSTEM_PROMPT}

---

VOICE MODE SPECIFIC RULES:

You are in voice mode. The user is speaking to you and can also see the chat UI, product cards, and cart.

TRANSCRIPT:
Every response you give appears as text in the chat UI at the same time. Keep responses concise for voice, but complete enough to read naturally.

PRODUCT REFERENCES:
When products are visible, refer to them by number and name. If the user says "number two", "second one", "dekweni eka", "cheap one", or a partial product name, treat that as referring to the visible products below.
If the user asks for "more", "another type", "different ones", "other options", "show another", or anything similar, that is NOT a product reference. Call kapruka_search_products again with a fresh query based on the current shopping category.

CURRENTLY SHOWN PRODUCTS:
${products}

CART:
Cart items: ${cartCount}
Cart total: Rs.${cartTotal.toLocaleString("en-LK")}

CONVERSATION SO FAR:
${history}

SHOPPING FLOW IN VOICE:
- Never disconnect or pause while searching, checking delivery, or cart operations happen in the UI.
- If the user asks to show/search/find/browse products, call kapruka_search_products. Do not just say you found items.
- If products are already visible and the user asks for another/different/more options, call kapruka_search_products again. Never say you can only see the previous products.
- For elliptical follow-ups like "another type of cakes", infer the category from the follow-up and search a useful fresh query such as "cake", "chocolate cake", "fruit cake", or the user's spoken modifier.
- After kapruka_search_products returns products, the React UI has rendered those product cards. Then briefly mention the best 2-3 by number, name, and price.
- You cannot render product cards yourself. The React UI renders cards only after kapruka_search_products returns or after a Kapruka search context update.
- Ask one thing at a time for delivery details.
- If the user selects a cake, ask if it should be added to cart, then suggest flowers only if it fits.
- If the user selects flowers, ask if it should be added to cart, then ask about a personal note.
- If the user selects or asks to add a visible product, call cart_add_item. Never only say you added it.
- If the user wants checkout/order/payment link, call checkout_start.
- During checkout, when the user truly answers name, phone, address, city, date, sender, anonymous, message, or icing text, call checkout_provide_detail with their raw answer.
- During checkout, if the user asks what a field means, asks for help, sounds confused, corrects you, or asks a question, DO NOT call checkout_provide_detail. Explain naturally in the user's language, then ask the same current detail again.
- When the user confirms the final order, call checkout_place_order. Never invent or describe a payment link before the tool returns.
- Checkout tools return say_next when the UI has moved to the next step. You must say that next question aloud. Never stay silent just because the UI already shows the question.
- For apology contexts, prioritize a sincere personal note and a tasteful combo.
- After any add-to-cart intent, ask whether to continue shopping or checkout.

The UI will keep sending context updates during the same voice session. Use those updates immediately without re-asking.`;
}

function createLiveConfig(voiceName: string, context?: LiveTokenContext) {
  return {
    responseModalities: [Modality.AUDIO],
    systemInstruction: {
      parts: [{ text: voiceContextPrompt(context) }],
    },
    speechConfig: {
      voiceConfig: {
        prebuiltVoiceConfig: {
          voiceName,
        },
      },
    },
    inputAudioTranscription: {},
    outputAudioTranscription: {},
    tools: [{ functionDeclarations: liveTools }],
  };
}

export async function POST(req: Request) {
  if (!apiKey) {
    return NextResponse.json(
      { error: "Missing GEMINI_API_KEY on the server." },
      { status: 500 }
    );
  }

  try {
    const body = await req.json().catch(() => ({}));
    const requestedVoice = typeof body.voiceName === "string" ? body.voiceName : "Aoede";
    const voiceName = AVAILABLE_VOICES.has(requestedVoice) ? requestedVoice : "Aoede";
    const liveConfig = createLiveConfig(voiceName, typeof body.context === "object" && body.context ? body.context : undefined);
    const ai = new GoogleGenAI({ apiKey });
    const token = await ai.authTokens.create({
      config: {
        uses: 1,
        expireTime: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
        newSessionExpireTime: new Date(Date.now() + 60 * 1000).toISOString(),
        liveConnectConstraints: {
          model,
          config: liveConfig,
        },
        httpOptions: { apiVersion: "v1alpha" },
      },
    });

    if (!token.name) {
      throw new Error("Gemini did not return an ephemeral token.");
    }

    return NextResponse.json({ token: token.name, model, liveConfig, voiceName });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create live token.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
