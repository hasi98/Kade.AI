export type Price = {
  amount: number | null;
  currency: string;
};

export type Product = {
  id: string;
  name: string;
  summary?: string;
  description?: string;
  price: Price;
  compare_at_price?: Price | null;
  in_stock: boolean;
  stock_level?: string;
  image_url?: string | null;
  images?: string[];
  category?: { id?: string; name?: string; slug?: string; path?: string };
  ships_internationally?: boolean;
  url: string;
};

export type CartItem = {
  product: Product;
  quantity: number;
  icing_text?: string | null;
  gift_wrap?: boolean;
  personal_note?: string | null;
};

export type MessageLabel =
  | "AI_RECOMMENDATION"
  | "DIRECT_LINK"
  | "SEARCH_RESULT"
  | "DELIVERY_INFO"
  | "ORDER_UPDATE";

export type ChatMessage = {
  id: string;
  role: "assistant" | "user";
  text: string;
  products?: Product[];
  quickReplies?: string[];
  label?: MessageLabel;
  delivery?: DeliveryQuote;
  orderResult?: OrderResult;
  isStreaming?: boolean;
};

export type DeliveryQuote = {
  city?: string;
  available?: boolean;
  rate_lkr?: number;
  delivery_date?: string;
  estimated_time?: string;
  shipping_method?: string;
  message?: string;
  raw?: unknown;
};

export type OrderResult = {
  order_number?: string;
  pay_url?: string;
  payment_url?: string;
  status?: string;
  total?: number;
  currency?: string;
  raw?: unknown;
};

export type SelectedProduct = {
  product: Product;
  deliveryCity?: string;
  deliveryDate?: string;
  estimatedArrival?: string;
};

export type ConversationEntry = {
  role: "user" | "model";
  parts: Array<{ text: string }>;
};
