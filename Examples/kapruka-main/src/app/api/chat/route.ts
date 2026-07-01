import { anthropic } from "@ai-sdk/anthropic";
import { streamText, stepCountIs, convertToModelMessages, type UIMessage } from "ai";
import { headers } from "next/headers";
import { recordUsage } from "@/lib/server/usage-tracker";
import { rateLimit } from "@/lib/server/rate-limit";
import { buildChatTools } from "@/tools/server";
import { buildCartContext, buildAddressContext, agentInstructions } from "@/lib/instructions";
import type { CartItem, Address } from "@/types";

export const runtime = "nodejs";
export const maxDuration = 120;

export async function POST(req: Request) {
  const ip = (await headers()).get("x-forwarded-for") ?? "unknown";
  if (!rateLimit(ip, 30, 60_000)) {
    return new Response("Too many requests", { status: 429 });
  }

  const { messages, cart, gift_message, delivery_fee, addresses } = (await req.json()) as {
    messages: UIMessage[];
    cart?: CartItem[];
    gift_message?: string;
    delivery_fee?: number | null;
    addresses?: Address[];
  };
  const cartContext = buildCartContext(cart ?? [], gift_message, delivery_fee);
  const addressContext = buildAddressContext(addresses ?? []);
  const modelMessages = await convertToModelMessages(messages);

  const model = process.env.ANTHROPIC_MODEL ?? "claude-sonnet-4-6";

  const result = streamText({
    model: anthropic(model),
    system: agentInstructions(cartContext, "chat", addressContext),
    messages: modelMessages,
    stopWhen: stepCountIs(16),
    providerOptions: {
      anthropic: {
        thinking: { type: "enabled", budgetTokens: 5000 },
      },
    },
    onFinish: ({ totalUsage }) => {
      if (totalUsage) recordUsage(model, totalUsage.inputTokens ?? 0, totalUsage.outputTokens ?? 0);
    },
    tools: buildChatTools(cart ?? []),
  });

  return result.toUIMessageStreamResponse();
}
