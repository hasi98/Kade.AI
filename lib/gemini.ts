import { GoogleGenAI, type Content, type FunctionDeclaration, Type } from "@google/genai";
import { MODELS, type TextModel } from "./models";
import { KADE_TEXT_SYSTEM_PROMPT } from "./personality";

const apiKey = process.env.GEMINI_API_KEY || "";

const ai = new GoogleGenAI({ apiKey });
const CHAT_TEMPERATURE = 0.9;

/* ── MCP tool function declarations for Gemini ── */

const mcpTools: FunctionDeclaration[] = [
  {
    name: "search_products",
    description:
      "Search for products on Kapruka, Sri Lanka's largest e-commerce platform. Use this only when the user has a clear product/category intent. Never use this for greetings, thanks, small talk, or vague setup messages like 'hello' or 'can you help me'. Do not search for products the user says the recipient dislikes; ask a clarification instead when preferences are broad, such as 'likes to eat'. Supports filtering by price, category, stock, etc.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        q: { type: Type.STRING, description: "Search query, e.g. 'birthday cake', 'red roses', 'chocolate hamper'" },
        category: { type: Type.STRING, description: "Category filter (optional), e.g. 'Cakes', 'Flowers'" },
        max_price: { type: Type.NUMBER, description: "Maximum price in LKR (optional)" },
        limit: { type: Type.NUMBER, description: "Number of results, default 6" },
      },
      required: ["q"],
    },
  },
  {
    name: "check_delivery",
    description:
      "Check delivery availability and cost for a Kapruka delivery city. Use this when user asks about delivery, shipping cost, or delivery times.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        city: { type: Type.STRING, description: "Delivery city, e.g. 'Colombo 07', 'Kandy', 'Galle'" },
        delivery_date: { type: Type.STRING, description: "Delivery date in YYYY-MM-DD format (optional)" },
        product_id: { type: Type.STRING, description: "Product ID to check delivery for (optional)" },
      },
      required: ["city"],
    },
  },
  {
    name: "list_categories",
    description: "List available product categories on Kapruka. Use when user wants to browse categories.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        depth: { type: Type.NUMBER, description: "Category tree depth, default 2" },
      },
    },
  },
  {
    name: "list_delivery_cities",
    description: "List delivery cities that Kapruka delivers to. Use when user asks which cities are available.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        query: { type: Type.STRING, description: "City name prefix to search for (optional)" },
      },
    },
  },
  {
    name: "track_order",
    description: "Track the status of a Kapruka order. Use when user provides an order number.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        order_number: { type: Type.STRING, description: "The Kapruka order number" },
      },
      required: ["order_number"],
    },
  },
  {
    name: "create_order",
    description:
      "Create a Kapruka order and get a payment link. Use ONLY when the user has confirmed all checkout details (recipient, address, cart items).",
    parameters: {
      type: Type.OBJECT,
      properties: {
        cart: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              product_id: { type: Type.STRING },
              quantity: { type: Type.NUMBER },
              icing_text: { type: Type.STRING },
            },
            required: ["product_id", "quantity"],
          },
        },
        recipient_name: { type: Type.STRING },
        recipient_phone: { type: Type.STRING },
        delivery_address: { type: Type.STRING },
        delivery_city: { type: Type.STRING },
        delivery_date: { type: Type.STRING },
        location_type: { type: Type.STRING },
        delivery_instructions: { type: Type.STRING },
        sender_name: { type: Type.STRING },
        anonymous: { type: Type.BOOLEAN },
        gift_message: { type: Type.STRING },
      },
      required: ["cart", "recipient_name", "recipient_phone", "delivery_address", "delivery_city", "delivery_date", "sender_name"],
    },
  },
];

/* ── System prompt ── */

function sriLankaToday() {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Colombo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());

  const get = (type: string) => parts.find((part) => part.type === type)?.value;
  return `${get("year")}-${get("month")}-${get("day")}`;
}

function systemPrompt(basePrompt = KADE_TEXT_SYSTEM_PROMPT) {
  return `${basePrompt}\n\nCurrent Sri Lanka date: ${sriLankaToday()}. Resolve relative dates like today and tomorrow using Asia/Colombo time.`;
}

type ChatWithToolsOptions = {
  prompt?: string;
  enableGoogleSearch?: boolean;
};

function supportsGoogleSearch(modelName: string) {
  return modelName.startsWith("gemini-");
}

function toolConfig(modelName: string, enableGoogleSearch?: boolean) {
  const tools: unknown[] = [];
  if (enableGoogleSearch && supportsGoogleSearch(modelName)) {
    tools.push({ type: "google_search" });
  }
  tools.push({ functionDeclarations: mcpTools });
  return tools;
}

/* ── Model router ── */

/* ── Streaming chat ── */

export async function* streamChat(
  message: string,
  history: Content[],
  onToolCall: (name: string, args: Record<string, unknown>) => Promise<unknown>,
  modelName: TextModel = MODELS.chat,
  options: ChatWithToolsOptions = {}
) {
  const response = await ai.models.generateContentStream({
    model: modelName,
    contents: [
      ...history,
      { role: "user", parts: [{ text: message }] },
    ],
    config: {
      systemInstruction: systemPrompt(options.prompt),
      tools: toolConfig(modelName, options.enableGoogleSearch) as any,
      temperature: CHAT_TEMPERATURE,
      maxOutputTokens: 2048,
    },
  });

  let pendingFunctionCalls: Array<{ name: string; args: Record<string, unknown>; id: string }> = [];

  for await (const chunk of response) {
    // Check for function calls
    if (chunk.candidates?.[0]?.content?.parts) {
      for (const part of chunk.candidates[0].content.parts) {
        if (part.functionCall) {
          const fc = part.functionCall;
          const fcName = fc.name ?? "unknown";
          const fcArgs = (fc.args ?? {}) as Record<string, unknown>;
          const result = await onToolCall(fcName, fcArgs);

          // We need to continue the conversation with the function result
          pendingFunctionCalls.push({
            name: fcName,
            args: fcArgs,
            id: fcName,
          });

          // Yield a special marker so the caller knows a tool was called
          yield {
            type: "tool_call" as const,
            name: fc.name,
            args: fc.args as Record<string, unknown>,
            result,
          };
        }

        if (part.text) {
          yield { type: "text" as const, text: part.text };
        }
      }
    }
  }

  // If there were function calls, make a follow-up call with results
  if (pendingFunctionCalls.length > 0) {
    // The results will have been yielded already as tool_call events
    // The caller is responsible for making the follow-up call
  }
}

/* ── Non-streaming fallback for simple tool routing ── */

export async function chatWithTools(
  message: string,
  history: Content[],
  onToolCall: (name: string, args: Record<string, unknown>) => Promise<unknown>,
  audio?: { data: string; mimeType: string },
  modelName: TextModel = MODELS.chat,
  options: ChatWithToolsOptions = {}
): Promise<{ text: string; toolResults: Array<{ name: string; result: unknown }> }> {
  const parts = [];
  if (message) parts.push({ text: message });
  if (audio) {
    parts.push({
      inlineData: {
        data: audio.data,
        mimeType: audio.mimeType,
      },
    });
  }

  let currentContents: Content[] = [
    ...history,
    { role: "user", parts },
  ];

  const toolResults: Array<{ name: string; result: unknown }> = [];
  let iterations = 0;
  const maxIterations = 5;

  while (iterations < maxIterations) {
    iterations++;

    const response = await ai.models.generateContent({
      model: modelName,
      contents: currentContents,
      config: {
        systemInstruction: systemPrompt(options.prompt),
        tools: toolConfig(modelName, options.enableGoogleSearch) as any,
        temperature: CHAT_TEMPERATURE,
        maxOutputTokens: 2048,
      },
    });

    const parts = response.candidates?.[0]?.content?.parts ?? [];
    const functionCalls = parts.filter((p) => p.functionCall);
    const textParts = parts.filter((p) => p.text).map((p) => p.text).join("");

    if (functionCalls.length === 0) {
      return { text: textParts, toolResults };
    }

    // Process function calls
    const functionResponseParts = [];
    for (const part of functionCalls) {
      const fc = part.functionCall!;
      const fcName = fc.name ?? "unknown";
      const fcArgs = (fc.args ?? {}) as Record<string, unknown>;
      const result = await onToolCall(fcName, fcArgs);
      toolResults.push({ name: fcName, result });
      functionResponseParts.push({
        functionResponse: {
          name: fcName,
          response: result as Record<string, unknown>,
        },
      });
    }

    // Add model response and function results to continue
    currentContents = [
      ...currentContents,
      { role: "model", parts },
      { role: "user", parts: functionResponseParts },
    ];
  }

  return { text: "I ran into an issue processing your request. Could you try again?", toolResults };
}

export async function quickComplexStarter(message: string, language?: "en" | "si" | "ta"): Promise<string> {
  const lockedLanguage =
    language === "si" ? "Sinhala/Singlish" :
    language === "ta" ? "Tamil/Tanglish" :
    "English";
  const response = await ai.models.generateContent({
    model: MODELS.chat,
    contents: [{ role: "user", parts: [{ text: message }] }],
    config: {
      systemInstruction:
        `You are Kade, a warm Sri Lankan shopping friend. Write a natural quick acknowledgement in ${lockedLanguage}, because this chat's language was decided at the start. Do not switch language based on this latest message. Be human and emotionally aware, but do not solve the request yet. Do not ask a question. Do not mention products, categories, prices, search results, tools, or internal reasoning. Do not say 'give me a second'. Keep it to 1 short sentence.`,
      temperature: CHAT_TEMPERATURE,
      maxOutputTokens: 120,
    },
  });

  return response.text?.trim() || "";
}

export async function researchGiftIdeas(message: string, history: Content[] = []): Promise<string> {
  const context = history
    .slice(-6)
    .flatMap((entry) => entry.parts?.map((part) => part.text ?? "") ?? [])
    .filter(Boolean)
    .join("\n")
    .slice(-2500);

  const response = await ai.models.generateContent({
    model: MODELS.chat,
    contents: [
      {
        role: "user",
        parts: [
          {
            text: `Conversation context:\n${context || "(none)"}\n\nLatest user message:\n${message}`,
          },
        ],
      },
    ],
    config: {
      systemInstruction:
        "You are Kade's private gift research assistant. Use Google Search grounding to identify current gift categories that fit the recipient, relationship, occasion, interests, age, and Sri Lankan delivery context. Do not write a customer-facing reply. Age is mandatory for any gift request involving a girl, boy, girlfriend, boyfriend, daughter, son, kid, child, teen, wife, or husband. If age is missing, start with NEED_PROFILE and ask only the age question. Once age is known, research current gift ideas and return 3-5 concise gift categories with why each fits and concrete Kapruka search terms. If the user says small cars, model cars, toy cars, diecast, Hot Wheels, car stuff, or collectible cars, treat that as diecast/model toy vehicles and include Kapruka terms like diecast model car, toy car, car model, or vehicle model. If there is still not enough recipient detail after age, start with NEED_PROFILE and name one best next profiling question. No markdown tables.",
      tools: [{ type: "google_search" }] as any,
      temperature: 0.45,
      maxOutputTokens: 420,
    },
  });

  return response.text?.trim() || "";
}
