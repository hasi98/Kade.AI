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
  language?: "en" | "si" | "ta";
};

const liveTools: FunctionDeclaration[] = [
  {
    name: "research_gift_ideas",
    description:
      "Privately research current gift categories using Google Search grounding before searching Kapruka. Use this for gift advice involving a recipient profile such as girl, boy, girlfriend, boyfriend, daughter, son, kid, teen, wife, husband, parent, or friend. Do not call this until age is known for girl/boy/gf/bf/child/teen style recipients. If age is missing, ask the age first instead of calling any tool.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        recipient: {
          type: Type.STRING,
          description: "Recipient relationship, e.g. girlfriend, 8 year old boy, wife, friend.",
        },
        age: {
          type: Type.STRING,
          description: "Known age or age range. Required for girl/boy/gf/bf/child/teen style gift requests.",
        },
        occasion: {
          type: Type.STRING,
          description: "Occasion if known, e.g. birthday, anniversary, apology.",
        },
        interests: {
          type: Type.STRING,
          description: "Known interests, personality, tastes, dislikes, or preferences.",
        },
        budget: {
          type: Type.STRING,
          description: "Budget in LKR if known.",
        },
        userRequest: {
          type: Type.STRING,
          description: "The user's latest request in their words.",
        },
      },
      required: ["recipient", "userRequest"],
    },
  },
  {
    name: "kapruka_search_products",
    description:
      "Search live Kapruka products and render product cards in the Kade UI. Call this whenever the user asks to show, find, search, browse, see products, more options, another type, different options, or once you have enough details to make a useful recommendation. Current visible products are context only; they never limit you from searching again. Do not claim products are visible until this function returns.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        q: {
          type: Type.STRING,
          description: "Specific Kapruka search query, e.g. 'chocolate cake', 'red roses', 'self care hamper', 'diecast model car'.",
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
        mode: {
          type: Type.STRING,
          enum: ["fresh", "more"],
          description: "Use 'more' when the user asks for more, other, next, or different options from the current visible products.",
        },
      },
      required: ["q"],
    },
  },
  {
    name: "kapruka_check_delivery",
    description:
      "Check Kapruka delivery availability and fee for a city/date without requiring anything in the cart. Call this whenever the user asks about delivery fee, delivery cost, delivery availability, or whether Kapruka delivers to a city. Do not search products just because the user mentions what they might deliver.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        city: {
          type: Type.STRING,
          description: "Kapruka delivery city, e.g. Colombo 03, Kandy, Balangoda.",
        },
        deliveryDate: {
          type: Type.STRING,
          description: "Optional delivery date in YYYY-MM-DD format. Use today/tomorrow if user asked.",
        },
        productId: {
          type: Type.STRING,
          description: "Optional Kapruka product ID if a specific visible product is involved.",
        },
        itemType: {
          type: Type.STRING,
          description: "Optional plain item type such as cake, flowers, chocolates. Do not search for this; delivery can be checked without it.",
        },
      },
      required: ["city"],
    },
  },
  {
    name: "fill_order_field",
    description:
      "Call this immediately after the user provides any single piece of order information. Do not wait to collect all fields first. Fire this tool after each answer, one at a time, as soon as you have the value.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        field: {
          type: Type.STRING,
          enum: ["recipientName", "recipientPhone", "streetAddress", "city", "deliveryDate", "senderName", "anonymous", "giftMessage"],
          description: "The specific order field being filled.",
        },
        value: {
          type: Type.STRING,
          description:
            "The value to fill. Normalize phone to local format, deliveryDate to YYYY-MM-DD, anonymous to true or false string, and giftMessage to empty string if skipped.",
        },
        displayValue: {
          type: Type.STRING,
          description: "Human-friendly version for display in the form.",
        },
      },
      required: ["field", "value", "displayValue"],
    },
  },
  {
    name: "correct_order_field",
    description:
      "Call this when the user wants to change a field that was already filled. Use the same field names as fill_order_field.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        field: {
          type: Type.STRING,
          enum: ["recipientName", "recipientPhone", "streetAddress", "city", "deliveryDate", "senderName", "anonymous", "giftMessage"],
          description: "The specific order field being corrected.",
        },
        value: {
          type: Type.STRING,
          description: "The corrected value.",
        },
        displayValue: {
          type: Type.STRING,
          description: "Human-friendly corrected value for display in the form.",
        },
      },
      required: ["field", "value", "displayValue"],
    },
  },
  {
    name: "confirm_order_ready",
    description:
      "Call this only after all required fields have been filled via fill_order_field. Required fields: recipientName, recipientPhone, streetAddress, city, deliveryDate, senderName. Optional: anonymous, giftMessage. This shows the Place Order button to the user.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        allFieldsSummary: {
          type: Type.STRING,
          description: "Brief one-line summary of the order for confirmation.",
        },
      },
      required: ["allFieldsSummary"],
    },
  },
  {
    name: "update_cart_from_voice",
    description:
      "Add one of the currently visible Kapruka products to the cart during voice conversation. Call this whenever the user picks, selects, says add to cart, says 'number two', 'second one', names a visible product, or asks to buy a visible product. Do not say the cart was updated until this function returns.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        productId: {
          type: Type.STRING,
          description: "Product ID from the latest kapruka_search_products result, if known.",
        },
        productIndex: {
          type: Type.NUMBER,
          description: "1-based visible product number, e.g. 2 for 'second one'.",
        },
        productName: {
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
    name: "request_city_input",
    description:
      "Call this if the user is struggling to say their city clearly after 2 attempts, or if the accent/audio makes the city hard to recognize. This opens a text city input popup on screen.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        reason: {
          type: Type.STRING,
          description: "Friendly reason explaining why the user should type the city.",
        },
        partialAddress: {
          type: Type.STRING,
          description: "Street part of the address already collected.",
        },
      },
      required: ["reason"],
    },
  },
  {
    name: "confirm_and_place_order",
    description:
      "Call when the user verbally confirms the order details are correct and wants to proceed with placing the order.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        confirmed: {
          type: Type.BOOLEAN,
          description: "True when the user confirmed the order.",
        },
      },
      required: ["confirmed"],
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
  const language = context?.language === "si" ? "Sinhala/Singlish" : context?.language === "ta" ? "Tamil/Tanglish" : "English";

  return `${KADE_LIVE_SYSTEM_PROMPT}

---

VOICE MODE SPECIFIC RULES:

You are in voice mode. The user is speaking to you and can also see the chat UI, product cards, and cart.

LOCKED CHAT LANGUAGE:
${language}

You MUST keep every spoken response in this locked language for the whole voice session. Do not switch language because later checkout answers contain Sinhala/Tamil/Singlish words.
If locked language is English, ask checkout questions in English with light Sri Lankan warmth, not Sinhala/Singlish.
If locked language is Sinhala/Singlish, use Sinhala/Singlish.
If locked language is Tamil/Tanglish, use Tamil/Tanglish.

TRANSCRIPT:
Meaningful customer-facing responses appear in the chat UI, but short tool/status filler may stay only in the voice dock. Keep responses concise for voice. Do not create extra filler just to fill the chat.

PRODUCT REFERENCES:
When products are visible, refer to them by number and name. If the user says "number two", "second one", "dekweni eka", "cheap one", or a partial product name, treat that as referring to the visible products below.
If the user asks for "more", "another type", "different ones", "other options", "show another", or anything similar, that is NOT a product reference. Call kapruka_search_products again with a fresh query based on the current shopping category.
If the user says "look for more", "show more", "find more", "more options", or similar, you MUST call kapruka_search_products with mode="more" and q set to the previous product category/query. Never say you found more from memory.

CURRENTLY SHOWN PRODUCTS:
${products}

CART:
Cart items: ${cartCount}
Cart total: Rs.${cartTotal.toLocaleString("en-LK")}

CONVERSATION SO FAR:
${history}

SHOPPING FLOW IN VOICE:
- Never disconnect or pause while searching, checking delivery, or cart operations happen in the UI.
- Never go silent while a tool is running. If you are waiting for gift research, Kapruka search, delivery, order, or tracking results, say one short natural line in the locked language such as "Let me think through the gift idea", "Let me search Kapruka for that", "Delivery availability check කරනවා", or "Order setup பண்ணுறேன்". Keep it natural, not scripted.
- When tool results arrive, transition naturally in the locked language. For product results, briefly say that options are visible on screen. If there are no results, say the exact item was not found and ask one short alternative question. Do not retry the same tool call.
- AGE-FIRST GIFT RULE: If the user asks for a gift for a girl, boy, girlfriend, boyfriend, daughter, son, kid, child, teen, wife, or husband and age is not known, ask only their age first. Do not call kapruka_search_products. Do not call research_gift_ideas. Do not suggest product categories yet.
- Once age is known for that gift recipient, call research_gift_ideas before Kapruka unless the user already gave a very direct product request like "show chocolate cakes" or "find biscuits". Use the research result privately to pick concrete Kapruka search terms, then call kapruka_search_products once. Do not mention Google or research to the user.
- If research_gift_ideas returns NEED_PROFILE, ask that one profiling question and wait. Do not search Kapruka yet.
- Do not wait for the user to say "okay" after they have already given enough intent. A clear product/category, or a gift recipient with age plus a specific interest/category, is permission to search.
- Examples that should search without another confirmation: "he's 21 and likes small cars", "find model cars", "she is 24 and likes skincare", "show me biscuits", "look for more chocolates".
- If the user says "small cars", "toy cars", "model cars", "mini cars", "diecast", "Hot Wheels", "car stuff", or "collectible cars", infer "diecast model car" or "toy car" as the Kapruka search term.
- Only ask "okay?" before cart changes, checkout/order placement, or when the request still lacks a useful product/category/profile.
- If the user asks to show/search/find/browse a specific product type, call kapruka_search_products. Do not just say you found items.
- Broad cake requests need one question before searching. If the user only says "show cakes", "show me some cakes", or similar without flavor/occasion/budget, ask one natural question first: birthday cake, chocolate cake, or simple tea-time cake? Wait for the answer before calling kapruka_search_products.
- Specific direct product searches are commands, not profiling conversations. If the user says "show me biscuits", "find flowers", "show chocolate cake", "birthday cake under 8000", or similar, do not ask what flavor/type/preference they like after the search starts or after results appear. Show results, then ask them to pick a visible option by number/name/tap.
- While a direct product search is running, your waiting line must be only a short acknowledgement. Do not add a clarifying question unless kapruka_search_products returns count=0.
- If the user asks for delivery fee, delivery cost, delivery availability, or "do you deliver to [city]", call kapruka_check_delivery. Do not ask them to add something to cart. Product ID is optional.
- If the user asks delivery fee and later says an item type like "cakes", do NOT search cakes repeatedly. Use kapruka_check_delivery with the city/date already known, and itemType if useful.
- If products are already visible and the user asks for another/different/more options, call kapruka_search_products again. Never say you can only see the previous products.
- For "more options" follow-ups, call kapruka_search_products with mode="more". Only say more products are on screen if the tool response says rendered_in_ui=true and count is greater than 0.
- For elliptical follow-ups like "another type of cakes", infer the category from the follow-up and search a useful fresh query such as "cake", "chocolate cake", "fruit cake", or the user's spoken modifier.
- After kapruka_search_products returns products, the React UI has rendered those product cards. Say briefly that options are on screen and ask the user to pick one by number/name/tap. Do not ask for more preferences.
- If kapruka_search_products returns count=0 or rendered_in_ui=false, do not say products are visible and do not call kapruka_search_products again for the same request. Tell the user that exact match is not available, then ask one short alternative question such as whether to try a nearby category.
- You cannot render product cards yourself. The React UI renders cards only after kapruka_search_products returns or after a Kapruka search context update.
- Ask one thing at a time for delivery details.
- If the user selects a cake, ask if it should be added to cart, then suggest flowers only if it fits.
- If the user selects flowers, ask if it should be added to cart, then ask about a personal note.
- If the user selects or asks to add a visible product, call update_cart_from_voice. Never only say you added it.
- If the user wants checkout/order/payment link, collect checkout details in natural voice and fill each field immediately with fill_order_field.
- During checkout, if the user asks what a field means, asks for help, sounds confused, corrects you, or asks a question, answer naturally in the user's language. Do not treat that question as a field value.
- During checkout, NEVER call kapruka_search_products for answers to checkout questions. Phrases like "no need to put my name", "it's a surprise", "keep anonymous", "yes they are correct", phone numbers, addresses, city names, dates, and gift messages are checkout answers, not product searches.
- After any fill_order_field, correct_order_field, kapruka_check_delivery, or confirm_order_ready call, inspect the tool response. If say_next is present, speak that say_next meaning immediately. If ok=false, do not continue to the next checkout question until the user fixes it.
- After confirm_order_ready and asking the user to confirm, if they say yes/seri/correct/order/okay/hari/ow in any language, immediately call confirm_and_place_order.
- For apology contexts, prioritize a sincere personal note and a tasteful combo.
- After any add-to-cart intent, ask whether to continue shopping or checkout.

VOICE CHECKOUT - REAL-TIME FIELD FILLING:

When the user wants to checkout or order, collect and fill fields ONE AT A TIME. Fire fill_order_field immediately after EACH answer.

CRITICAL RULE: Do NOT collect multiple answers and submit at the end. Fill each field the moment you have it. The user sees each field appear on screen as they speak.

Collection order:
1. Recipient name
Ask in the locked language. English example: "What's the recipient's name?" Singlish example: "Recipient name eka?"
User answers -> immediately call fill_order_field:
field: "recipientName"
value: the name as given
displayValue: properly capitalized name
Then ask the next question without waiting.

2. Phone number
Ask in the locked language. English example: "What's their phone number?" Singlish example: "Phone number eka?"
User answers -> immediately call fill_order_field:
field: "recipientPhone"
value: normalized local number, e.g. 0771687791
displayValue: formatted number, e.g. 077 168 7791
Then ask the next question.

3. Street address and city as separate fields
Ask in the locked language. English example: "What's the street address first?" Singlish example: "Address eka kiyanna - street eka first"
User gives street -> immediately call fill_order_field:
field: "streetAddress"
value: street only
displayValue: street only
If the user gives a full address containing both street and city, call fill_order_field twice: first streetAddress with the street/area, then city with the city.
Then ask in the locked language. English example: "Which delivery city should I use? If it's Colombo, tell me Colombo 01, Colombo 02, and so on." Singlish example: "City eka? Colombo nam Colombo 01, Colombo 02 wage number ekath kiyanna."
User gives city -> immediately call fill_order_field:
field: "city"
value: city name
displayValue: city name
If user gives only a city when you asked for street, do not fill streetAddress. Say: "City eka hari. Full address eka mokakda - house number, road/lane, area eka?"
If user says only "Colombo", do not fill city yet. Ask for the exact Colombo zone such as Colombo 01, Colombo 02, Colombo 03, etc.
If fill_order_field returns a city error, tell the user there is a problem with the delivery city and ask them to say it again with an example.
If after 2 tries city still unclear, call request_city_input immediately.

4. Delivery date
Ask in the locked language. English example: "When should it be delivered? Is tomorrow okay?" Singlish example: "Kawadada deliver karanna? Tomorrow okay da?"
User answers -> immediately call fill_order_field:
field: "deliveryDate"
value: YYYY-MM-DD
displayValue: "Tomorrow, 26 June" style

5. Sender name
Ask in the locked language. English example: "What's your name for the gift card?" Singlish example: "Oya name eka mokakda? Gift card eke danne."
User answers -> immediately call fill_order_field:
field: "senderName"
value: sender name
displayValue: sender name

6. Anonymous option, only if this feels like a gift
Ask in the locked language. English example: "Should I show your name, or keep it anonymous?" Singlish example: "Name eka show karamu da, hari anonymous da?"
User answers -> immediately call fill_order_field:
field: "anonymous"
value: "true" or "false"
displayValue: "Anonymous" or the sender name
If the user says "no need to put my name", "it's a surprise", "anonymous", "hide my name", "mage nama epa", or similar, fill anonymous=true. Do not search products.

7. Gift message, optional
Ask in the locked language. English example: "Any gift message? You can say skip if not." Singlish example: "Kisi message ekak add karamu da? Skip kiyanna one na thiyenam"
If user gives message -> immediately call fill_order_field:
field: "giftMessage"
value: message
displayValue: message
If user says skip/no/ne/epa -> immediately call fill_order_field:
field: "giftMessage"
value: ""
displayValue: "None"

8. All fields done
Call confirm_order_ready immediately.
Then say: "Api ready! Screen eke details check karanna - correct da?"
Say this in the locked language. English example: "All set. Please check the details on the right - are they correct?"

CORRECTIONS DURING COLLECTION:
If user says "no wait", "wrong", "change that", "aney no", or similar, ask what to correct. When the user gives the new value, immediately call correct_order_field, then continue from where you were.
Do not re-ask fields already filled unless user specifically asks to change them.

If order creation fails, announce it naturally in the user's language:
English: "Aiyo, something went wrong with the order - want me to try again?"
Singlish: "Aiyo, order eka hadaganna bari una ne - again try karamu da?"
If the tool response includes say_next or error, speak that exact meaning instead of saying a generic failure.
Then wait for the user's response.

The UI will keep sending context updates during the same voice session. Use those updates immediately without re-asking.`;
}

const liveToolConfig = {
  behavior: "NON_BLOCKING",
  functionDeclarations: liveTools,
} as const;

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
    tools: [liveToolConfig],
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
