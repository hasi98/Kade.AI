export interface Price {
  amount: number | null;
  currency: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
}

export interface Product {
  id: string;
  name: string;
  summary: string;
  price: Price;
  compare_at_price: Price | null;
  in_stock: boolean;
  stock_level: "low" | "medium" | "high";
  image_url: string | null;
  category: Category;
  rating: number | null;
  ships_internationally: boolean;
  url: string;
}

export interface ProductDetail extends Product {
  description: string;
  images: string[];
  variants: Array<{
    id: string;
    name: string;
    sku: string;
    price: Price;
    in_stock: boolean;
    stock_level: string;
    attributes: Record<string, string>;
  }>;
  attributes: {
    type?: string;
    subtype?: string;
    weight?: string;
    vendor?: string;
  };
  shipping: {
    ships_from: string;
    ships_internationally: boolean;
    restricted_countries: string[];
  };
}

export interface SearchResult {
  results: Product[];
  next_cursor: string | null;
  applied_filters: {
    q: string;
    limit: number;
    in_stock_only: boolean;
  };
}

export interface DeliveryInfo {
  city: string;
  now: string;
  checked_date: string;
  available: boolean;
  rate: number;
  currency: string;
  reason: string | null;
  next_available_date: string | null;
  perishable_warning: string | null;
}

export interface OrderSummary {
  items_total: number;
  delivery_fee: number;
  addons_total: number;
  grand_total: number;
  currency: string;
}

export interface OrderResult {
  checkout_url: string;
  order_ref: string;
  summary: OrderSummary;
  expires_at: string;
}

export interface CartItem {
  id: string;
  name: string;
  price: number;
  currency: string;
  quantity: number;
  image_url: string | null;
  icing_text?: string;
}

export interface Address {
  id: string;
  label: string;
  recipient_name: string;
  phone: string;
  address: string;
  city: string;
  location_type: "house" | "apartment" | "office" | "other";
}
