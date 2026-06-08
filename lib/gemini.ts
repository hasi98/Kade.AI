import { GoogleGenAI, type Content, type FunctionDeclaration, Type } from "@google/genai";
import { KADE_TEXT_SYSTEM_PROMPT } from "./personality";

const apiKey = process.env.GEMINI_API_KEY || "";

const ai = new GoogleGenAI({ apiKey });

/* ── MCP tool function declarations for Gemini ── */

const mcpTools: FunctionDeclaration[] = [
  {
    name: "search_products",
    description:
      "Search for products on Kapruka, Sri Lanka's largest e-commerce platform. Use this whenever the user wants to find, browse, or buy products. Supports filtering by price, category, stock, etc.",
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
        sender_name: { type: Type.STRING },
        anonymous: { type: Type.BOOLEAN },
        gift_message: { type: Type.STRING },
      },
      required: ["cart", "recipient_name", "recipient_phone", "delivery_address", "delivery_city"],
    },
  },
];

/* ── System prompt ── */

const SYSTEM_PROMPT = KADE_TEXT_SYSTEM_PROMPT;

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

function systemPrompt() {
  return `${SYSTEM_PROMPT}\n\nCurrent Sri Lanka date: ${sriLankaToday()}. Resolve relative dates like today and tomorrow using Asia/Colombo time.`;
}

/* ── Model router ── */

function shouldUsePro(message: string, historyLength: number): boolean {
  const complex =
    /\b(recommend|suggest|compare|best|which one|help me choose|what should|gift ideas?|occasion|budget plan)\b/i;
  const longContext = historyLength > 10;
  return complex.test(message) || longContext;
}

function chooseModel(message: string, historyLength: number) {
  if (process.env.GEMINI_MODEL) return process.env.GEMINI_MODEL;
  return shouldUsePro(message, historyLength) ? "gemini-2.5-flash" : "gemini-2.5-flash-lite";
}

/* ── Streaming chat ── */

export async function* streamChat(
  message: string,
  history: Content[],
  onToolCall: (name: string, args: Record<string, unknown>) => Promise<unknown>
) {
  const modelName = chooseModel(message, history.length);

  const response = await ai.models.generateContentStream({
    model: modelName,
    contents: [
      ...history,
      { role: "user", parts: [{ text: message }] },
    ],
    config: {
      systemInstruction: systemPrompt(),
      tools: [{ functionDeclarations: mcpTools }],
      temperature: 0.7,
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
  audio?: { data: string; mimeType: string }
): Promise<{ text: string; toolResults: Array<{ name: string; result: unknown }> }> {
  const modelName = chooseModel(message, history.length);

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
        systemInstruction: systemPrompt(),
        tools: [{ functionDeclarations: mcpTools }],
        temperature: 0.7,
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
