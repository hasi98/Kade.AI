"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { CartItem } from "@/types";

interface CartStore {
  items: CartItem[];
  isOpen: boolean;
  gift_message: string;
  delivery_fee: number | null;
  addItem: (item: CartItem) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  updateIcingText: (id: string, text: string) => void;
  setGiftMessage: (msg: string) => void;
  setDeliveryFee: (fee: number | null) => void;
  clearCart: () => void;
  openCart: () => void;
  closeCart: () => void;
  toggleCart: () => void;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set) => ({
      items: [],
      isOpen: false,
      gift_message: "",
      delivery_fee: null,

      addItem: (item) =>
        set((state) => {
          const existing = state.items.find((i) => i.id === item.id);
          if (existing) {
            return {
              items: state.items.map((i) =>
                i.id === item.id ? { ...i, quantity: i.quantity + item.quantity } : i,
              ),
            };
          }
          return { items: [...state.items, item] };
        }),

      removeItem: (id) =>
        set((state) => ({ items: state.items.filter((i) => i.id !== id) })),

      updateQuantity: (id, quantity) =>
        set((state) => ({
          items:
            quantity <= 0
              ? state.items.filter((i) => i.id !== id)
              : state.items.map((i) => (i.id === id ? { ...i, quantity } : i)),
        })),

      updateIcingText: (id, text) =>
        set((state) => ({
          items: state.items.map((i) =>
            i.id === id ? { ...i, icing_text: text } : i,
          ),
        })),

      setGiftMessage: (msg) => set({ gift_message: msg }),
      setDeliveryFee: (fee) => set({ delivery_fee: fee }),

      clearCart: () => set({ items: [], gift_message: "", delivery_fee: null }),
      openCart: () => set({ isOpen: true }),
      closeCart: () => set({ isOpen: false }),
      toggleCart: () => set((state) => ({ isOpen: !state.isOpen })),
    }),
    {
      name: "kapruka_cart",
      partialize: (state) => ({
        items: state.items,
        gift_message: state.gift_message,
        delivery_fee: state.delivery_fee,
      }),
    },
  ),
);

export const cartTotal = (items: CartItem[], deliveryFee: number | null = null) =>
  items.reduce((sum, item) => sum + (item.price ?? 0) * item.quantity, 0) + (deliveryFee ?? 0);
