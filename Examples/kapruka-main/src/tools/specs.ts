import { z } from "zod";

export type ToolExecution = "server" | "client";

export interface ToolSpec {
  description: string;
  inputSchema: z.ZodType;
  /** "server" → executed via MCP on the server. "client" → validated args are echoed
   *  back as the tool result and applied in the UI by CartExecutors / ToolResultView. */
  execution: ToolExecution;
  /** Whether the tool is exposed to the OpenAI Realtime voice agent. */
  realtime: boolean;
}

const cartItem = z.object({
  product_id: z.string(),
  quantity: z.number().min(1).max(99).default(1),
  icing_text: z.string().optional(),
});

export const TOOL_SPECS: Record<string, ToolSpec> = {
  kapruka_search_products: {
    description:
      "Search Kapruka catalog by keyword. Always use in_stock_only=true. Returns product list with names, prices and IDs.",
    inputSchema: z.object({
      q: z.string().describe("Search query (min 3 chars)"),
      limit: z.number().min(1).max(20).optional().default(6),
      cursor: z.string().optional().describe("Pagination cursor"),
      currency: z.string().optional().default("LKR"),
      min_price: z.number().optional(),
      max_price: z.number().optional(),
      in_stock_only: z.boolean().optional().default(true),
      sort: z
        .enum(["relevance", "price_asc", "price_desc", "newest", "bestseller"])
        .optional()
        .default("bestseller"),
    }),
    execution: "server",
    realtime: true,
  },

  kapruka_get_product: {
    description: "Get full details for a single product by its ID.",
    inputSchema: z.object({
      product_id: z.string(),
      currency: z.string().optional().default("LKR"),
    }),
    execution: "server",
    realtime: true,
  },

  kapruka_list_categories: {
    description: "List Kapruka product categories.",
    inputSchema: z.object({
      depth: z.number().min(1).max(2).optional().default(1),
    }),
    execution: "server",
    realtime: true,
  },

  kapruka_list_delivery_cities: {
    description:
      "Resolve a user-supplied city name to its canonical Kapruka name. ALWAYS call this first whenever the user mentions a delivery city — use the returned canonical name in kapruka_check_delivery.",
    inputSchema: z.object({
      query: z.string().optional().describe("Partial city name"),
      limit: z.number().optional().default(10),
    }),
    execution: "server",
    realtime: true,
  },

  kapruka_check_delivery: {
    description:
      "Check if Kapruka delivers to a city on a specific date and get the fee. NEVER call with a raw user-supplied city — call kapruka_list_delivery_cities first and pass the canonical name it returns.",
    inputSchema: z.object({
      city: z.string().describe("Canonical city name from kapruka_list_delivery_cities"),
      delivery_date: z.string().optional().describe("YYYY-MM-DD"),
      product_id: z.string().optional().describe("For perishable freshness warning"),
    }),
    execution: "server",
    realtime: true,
  },

  kapruka_create_order: {
    description:
      "Create a guest checkout order and return a pay link. Only call after the user has explicitly confirmed they want to place the order. For self-purchases the buyer is both recipient and sender — pass the buyer's name/phone as recipient and the same name as sender.name.",
    inputSchema: z.object({
      cart: z.array(cartItem).min(1).max(30),
      recipient: z.object({
        name: z.string(),
        phone: z.string().describe("E.164 (+9477…) or local (077…)"),
      }),
      delivery: z.object({
        address: z.string(),
        city: z.string(),
        location_type: z
          .enum(["house", "apartment", "office", "other"])
          .optional()
          .default("house"),
        date: z.string().describe("YYYY-MM-DD"),
        instructions: z.string().optional(),
      }),
      sender: z.object({
        name: z.string(),
        anonymous: z.boolean().optional().default(false),
      }),
      gift_message: z.string().max(300).optional(),
      currency: z.string().optional().default("LKR"),
    }),
    execution: "server",
    realtime: true,
  },

  kapruka_track_order: {
    description: "Track an existing Kapruka order by order number.",
    inputSchema: z.object({
      order_number: z.string().describe("Order number from confirmation email"),
    }),
    execution: "server",
    realtime: true,
  },

  cart_add_item: {
    description:
      "Add a product to the user's cart. Call this proactively when the user selects, picks, or clearly wants a specific product — do NOT wait for them to say 'add to cart'. Pass the full product details from the search result.",
    inputSchema: z.object({
      product_id: z.string().describe("Product ID from search results"),
      name: z.string().describe("Product name"),
      price: z.number().describe("Unit price in the given currency"),
      currency: z.string().default("LKR"),
      quantity: z.number().min(1).max(99).default(1),
      image_url: z.string().nullable().optional(),
      icing_text: z.string().optional().describe("Custom icing text for cakes"),
    }),
    execution: "client",
    realtime: true,
  },

  cart_remove_item: {
    description:
      "Remove a specific item from the user's cart by product_id. Use when the user asks to remove, delete, or take out an item.",
    inputSchema: z.object({
      product_id: z.string().describe("The product_id of the item to remove from the cart"),
      product_name: z.string().optional().describe("Human-readable name for confirmation message"),
    }),
    execution: "client",
    realtime: true,
  },

  cart_clear: {
    description:
      "Clear all items from the user's cart. Use only when the user explicitly asks to clear or empty the entire cart.",
    inputSchema: z.object({
      reason: z.string().optional().describe("Brief reason e.g. 'starting fresh'"),
    }),
    execution: "client",
    realtime: true,
  },

  cart_set_delivery_fee: {
    description:
      "Set the delivery fee in the cart UI. Call this after the user confirms their delivery city and you have checked delivery availability with kapruka_check_delivery. Pass the fee returned by kapruka_check_delivery.",
    inputSchema: z.object({
      fee: z.number().describe("Delivery fee in LKR"),
      city: z.string().optional().describe("City name for display purposes"),
    }),
    execution: "client",
    realtime: true,
  },

  ask_clarifying_questions: {
    description:
      "Ask the user clarifying questions with optional quick-reply chips. Use this instead of writing questions as text. Each question can have a list of option chips or be a free-text input.",
    inputSchema: z.object({
      intro: z
        .string()
        .optional()
        .describe("One-sentence intro before the questions"),
      questions: z
        .array(
          z.object({
            key: z
              .string()
              .describe("Short identifier e.g. 'occasion', 'budget', 'city'"),
            label: z.string().describe("Question text shown to the user"),
            options: z
              .array(z.string())
              .optional()
              .describe("Quick-reply chip labels (omit for free-text input)"),
            emoji: z
              .string()
              .optional()
              .describe("Single emoji prefix for the question"),
          }),
        )
        .min(1)
        .max(4),
    }),
    execution: "client",
    realtime: false,
  },

  kapruka_batch_search: {
    description:
      "Run 2–4 product searches in parallel and return a single merged, ranked shortlist. Use this for any multi-angle request: gifting occasions ('birthday gift for a 10-year-old boy under 3000 rupees') OR multi-need self-purchases ('weekly groceries for a family of 4', 'things I need for a new apartment'). Pick 2–4 queries covering different product angles. Pass budget_max when the user gives a price limit.",
    inputSchema: z.object({
      queries: z
        .array(z.string().min(3))
        .min(2)
        .max(4)
        .describe("2–4 parallel search queries covering different gift angles"),
      budget_max: z.number().optional().describe("Maximum price in LKR — applied across all results"),
      budget_min: z.number().optional().describe("Minimum price in LKR"),
      limit: z.number().min(4).max(12).optional().default(8).describe("Max items in merged shortlist"),
    }),
    execution: "server",
    realtime: false,
  },

  ask_gift_message: {
    description:
      "Present a beautiful parchment gift-message card in the chat for the user to write their personal note. Use this for gift orders when no gift message is already in the cart context. Gift mode ONLY — never call this when the user is shopping for themselves.",
    inputSchema: z.object({
      intro: z
        .string()
        .optional()
        .describe("One warm sentence shown above the card"),
    }),
    execution: "client",
    realtime: false,
  },

  address_book_save: {
    description:
      "Save a delivery address to the user's address book for future use. Call this silently after kapruka_create_order succeeds, using the delivery details from the order. Do NOT mention this to the user.",
    inputSchema: z.object({
      label: z.string().describe("Short name for the address e.g. 'Home', 'Office', or recipient's name"),
      recipient_name: z.string(),
      phone: z.string(),
      address: z.string().describe("Street address"),
      city: z.string(),
      location_type: z.enum(["house", "apartment", "office", "other"]).default("house"),
    }),
    execution: "client",
    realtime: false,
  },
};

export interface RealtimeTool {
  type: "function";
  name: string;
  description: string;
  parameters: Record<string, unknown>;
}

function toRealtimeTool([name, spec]: [string, ToolSpec]): RealtimeTool {
  return {
    type: "function",
    name,
    description: spec.description,
    parameters: z.toJSONSchema(spec.inputSchema) as Record<string, unknown>,
  };
}

export const REALTIME_TOOLS: RealtimeTool[] = Object.entries(TOOL_SPECS)
  .filter(function isRealtime([, spec]) {
    return spec.realtime;
  })
  .map(toRealtimeTool);
