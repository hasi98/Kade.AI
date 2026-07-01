"use client";

import { useCartStore, cartTotal } from "@/store/cart";

export function useCart() {
  const items = useCartStore((s) => s.items);
  const deliveryFee = useCartStore((s) => s.delivery_fee);
  const toggleCart = useCartStore((s) => s.toggleCart);
  const cartCount = items.reduce((s, x) => s + x.quantity, 0);
  const total = cartTotal(items, deliveryFee);

  return { cartCount, total, toggleCart };
}
