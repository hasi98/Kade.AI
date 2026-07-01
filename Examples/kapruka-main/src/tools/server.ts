import { tool, type ToolSet } from "ai";
import { mcpClient } from "@/lib/server/mcp-client";
import { TOOL_SPECS } from "./specs";
import type { CartItem, Product, SearchResult } from "@/types";

// per-lambda-instance: multiple warm lambdas each maintain a separate map
const recentOrders = new Map<string, { result: unknown; expiresAt: number }>();
const ORDER_DEDUPE_TTL = 5 * 60 * 1000;

function orderFingerprint(args: Record<string, unknown>): string {
  const cart = ((args.cart ?? []) as Array<{ product_id: string }>)
    .slice()
    .sort((a, b) => a.product_id.localeCompare(b.product_id));
  return JSON.stringify({
    cart,
    recipient: args.recipient,
    delivery: args.delivery,
    sender: args.sender,
    gift_message: args.gift_message,
  });
}

async function callMcp(name: string, params: Record<string, unknown>) {
  try {
    const result = await mcpClient.callTool(name, params);
    console.log(`[MCP] ${name}`, JSON.stringify(params), "→", JSON.stringify(result));
    return result;
  } catch (err) {
    console.log(`[MCP] ${name} ERROR`, JSON.stringify(params), "→", (err as Error).message);
    return { error: (err as Error).message };
  }
}

function checkOrderAuthorization(
  args: Record<string, unknown>,
  serverCart: CartItem[],
): { error: string } | null {
  const serverCartIds = new Set(serverCart.map((i) => i.id));
  const orderCart = (args.cart ?? []) as Array<{ product_id: string }>;
  const unauthorizedIds = orderCart
    .map((item) => item.product_id)
    .filter((id) => !serverCartIds.has(id));
  if (unauthorizedIds.length > 0) {
    return {
      error: `Cannot checkout: product(s) [${unauthorizedIds.join(", ")}] are not in the cart. Add them to the cart first.`,
    };
  }
  return null;
}

async function executeBatchSearch(args: {
  queries: string[];
  budget_max?: number;
  budget_min?: number;
  limit: number;
}): Promise<{ results: Product[] }> {
  const { queries, budget_max, budget_min, limit } = args;

  const rawResults = await Promise.all(
    queries.map((q) =>
      callMcp("kapruka_search_products", {
        q,
        limit: 10,
        in_stock_only: true,
        sort: "bestseller",
        ...(budget_max != null ? { max_price: budget_max } : {}),
        ...(budget_min != null ? { min_price: budget_min } : {}),
      }),
    ),
  );

  // Round-robin interleave so every search angle is represented, then dedupe + budget-filter
  const perSearch = rawResults.map((r) => ((r as SearchResult)?.results ?? []) as Product[]);
  const seen = new Set<string>();
  const merged: Product[] = [];
  const maxLen = Math.max(...perSearch.map((a) => a.length), 0);

  outer: for (let i = 0; i < maxLen; i++) {
    for (const arr of perSearch) {
      if (i >= arr.length) continue;
      const p = arr[i];
      if (seen.has(p.id)) continue;
      seen.add(p.id);
      const price = p.price?.amount ?? 0;
      if (budget_max != null && price > budget_max) continue;
      if (budget_min != null && price < budget_min) continue;
      merged.push(p);
      if (merged.length >= limit) break outer;
    }
  }

  return { results: merged };
}

/**
 * Single execution path for ALL tools, used by both the text agent
 * (/api/chat via buildChatTools) and the voice agent (/api/realtime-tools).
 * Always resolves to a result object — errors are returned as { error }
 * so the model can read them and self-correct.
 */
export async function executeServerTool(
  name: string,
  rawArgs: unknown,
  serverCart: CartItem[],
): Promise<unknown> {
  const spec = TOOL_SPECS[name];
  if (!spec) return { error: `Unknown tool: ${name}` };

  const parsed = spec.inputSchema.safeParse(rawArgs ?? {});
  if (!parsed.success) {
    return { error: `Invalid arguments for ${name}: ${parsed.error.message}` };
  }
  const args = parsed.data as Record<string, unknown>;

  if (name === "kapruka_create_order") {
    const authError = checkOrderAuthorization(args, serverCart);
    if (authError) return authError;

    const now = Date.now();
    for (const [k, v] of recentOrders) {
      if (v.expiresAt <= now) recentOrders.delete(k);
    }

    const key = orderFingerprint(args);
    const deduped = recentOrders.get(key);
    if (deduped) {
      console.log("[MCP] kapruka_create_order DEDUPED");
      return deduped.result;
    }

    const result = await callMcp(name, args);
    if (!(result !== null && typeof result === "object" && "error" in result)) {
      recentOrders.set(key, { result, expiresAt: Date.now() + ORDER_DEDUPE_TTL });
    }
    return result;
  }

  if (name === "kapruka_batch_search") {
    return executeBatchSearch(args as {
      queries: string[];
      budget_max?: number;
      budget_min?: number;
      limit: number;
    });
  }

  if (spec.execution === "client") return args;

  return callMcp(name, args);
}

export function buildChatTools(serverCart: CartItem[]): ToolSet {
  return Object.fromEntries(
    Object.entries(TOOL_SPECS).map(function toAiSdkTool([name, spec]) {
      return [
        name,
        tool({
          description: spec.description,
          inputSchema: spec.inputSchema,
          execute(params: unknown) {
            return executeServerTool(name, params, serverCart);
          },
        }),
      ];
    }),
  ) as ToolSet;
}
