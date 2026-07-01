"use client";

import type { ToolUIPart, DynamicToolUIPart } from "ai";
import ThinkingDots from "./ThinkingDots";
import ProductCarousel from "./ProductCarousel";
import DeliveryCard from "./DeliveryCard";
import CheckoutCard from "./CheckoutCard";
import OrderStatus from "./OrderStatus";
import type { SearchResult, DeliveryInfo, OrderResult, ProductDetail } from "@/types";
import ProductDetailCard from "./ProductDetailCard";
import ClarifyingQuestionsCard from "./ClarifyingQuestionsCard";
import GiftMessageChatCard from "./GiftMessageChatCard";
import {
  CartAddExecutor,
  CartRemoveExecutor,
  CartClearExecutor,
  CartSetDeliveryFeeExecutor,
  AddressBookSaveExecutor,
} from "./CartExecutors";

const TOOL_LABELS: Record<string, string> = {
  ask_gift_message: "Preparing your gift card…",
  ask_clarifying_questions: "Gathering your preferences…",
  kapruka_search_products: "Searching catalog…",
  kapruka_batch_search: "Searching across categories…",
  kapruka_get_product: "Getting product details…",
  kapruka_list_categories: "Loading categories…",
  kapruka_list_delivery_cities: "Finding cities…",
  kapruka_check_delivery: "Checking delivery…",
  kapruka_create_order: "Creating your order…",
  kapruka_track_order: "Tracking order…",
  cart_add_item: "Adding to cart…",
  cart_remove_item: "Removing from cart…",
  cart_clear: "Clearing cart…",
  cart_set_delivery_fee: "Updating delivery fee…",
};

export default function ToolResultView({
  part,
  onSend,
  isHistorical,
}: {
  part: ToolUIPart | DynamicToolUIPart;
  onSend?: (text: string) => void;
  isHistorical?: boolean;
}) {
  const toolName =
    part.type === "dynamic-tool" ? part.toolName : part.type.replace(/^tool-/, "");
  const state = part.state;

  if (state === "input-streaming" || state === "input-available") {
    return <ThinkingDots label={TOOL_LABELS[toolName] ?? "Working…"} />;
  }

  if (state !== "output-available") return null;

  const result = part.output as Record<string, unknown>;
  if (!result || result.error) return null;

  switch (toolName) {
    case "kapruka_search_products": {
      const data = result as unknown as SearchResult;
      if (!data?.results) return null;
      const args = part.input as { q?: string };
      return <ProductCarousel products={data.results} query={args?.q} />;
    }

    case "kapruka_batch_search": {
      const data = result as unknown as SearchResult;
      if (!data?.results) return null;
      const args = part.input as { queries?: string[] };
      const label = args?.queries?.join(" · ");
      return <ProductCarousel products={data.results} query={label} />;
    }

    case "kapruka_get_product": {
      const data = result as unknown as ProductDetail;
      if (!data?.id) return null;
      return <ProductDetailCard product={data} />;
    }

    case "kapruka_check_delivery": {
      const data = result as unknown as DeliveryInfo;
      if (data?.city == null) return null;
      return <DeliveryCard delivery={data} />;
    }

    case "kapruka_create_order": {
      const data = result as unknown as OrderResult;
      if (!data?.checkout_url) return null;
      return <CheckoutCard order={data} />;
    }

    case "kapruka_list_categories":
      return null;

    case "kapruka_track_order": {
      const data = result as unknown as Parameters<typeof OrderStatus>[0]["data"];
      if (!data?.order_number) return null;
      return <OrderStatus data={data} />;
    }

    case "cart_add_item": {
      const data = result as {
        product_id: string;
        name: string;
        price: number;
        currency: string;
        quantity: number;
        image_url?: string | null;
        icing_text?: string;
      };
      if (!data?.product_id) return null;
      return (
        <CartAddExecutor
          product_id={data.product_id}
          name={data.name}
          price={data.price}
          currency={data.currency}
          quantity={data.quantity}
          image_url={data.image_url}
          icing_text={data.icing_text}
          isHistorical={isHistorical}
        />
      );
    }

    case "cart_remove_item": {
      const data = result as { product_id: string };
      if (!data?.product_id) return null;
      return <CartRemoveExecutor productId={data.product_id} isHistorical={isHistorical} />;
    }

    case "cart_clear":
      return <CartClearExecutor isHistorical={isHistorical} />;

    case "cart_set_delivery_fee": {
      const data = result as { fee: number };
      if (data?.fee == null) return null;
      return <CartSetDeliveryFeeExecutor fee={data.fee} isHistorical={isHistorical} />;
    }

    case "kapruka_list_delivery_cities":
      return null;

    case "address_book_save": {
      const data = result as {
        label: string;
        recipient_name: string;
        phone: string;
        address: string;
        city: string;
        location_type: "house" | "apartment" | "office" | "other";
      };
      if (!data?.recipient_name) return null;
      return <AddressBookSaveExecutor entry={data} isHistorical={isHistorical} />;
    }

    case "ask_gift_message": {
      const data = result as { intro?: string };
      return (
        <GiftMessageChatCard
          intro={data.intro}
          onSend={onSend ?? (() => {})}
        />
      );
    }

    case "ask_clarifying_questions": {
      const data = result as {
        intro?: string;
        questions: Array<{ key: string; label: string; options?: string[]; emoji?: string }>;
      };
      if (!data?.questions?.length) return null;
      return (
        <ClarifyingQuestionsCard
          intro={data.intro}
          questions={data.questions}
          onSend={onSend ?? (() => {})}
        />
      );
    }

    default:
      return null;
  }
}
