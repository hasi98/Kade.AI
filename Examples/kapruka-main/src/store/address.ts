"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Address } from "@/types";

interface AddressStore {
  addresses: Address[];
  addAddress: (a: Address) => void;
  removeAddress: (id: string) => void;
}

export const useAddressStore = create<AddressStore>()(
  persist(
    (set) => ({
      addresses: [],

      addAddress: (a) =>
        set((state) => ({ addresses: [...state.addresses, a] })),

      removeAddress: (id) =>
        set((state) => ({
          addresses: state.addresses.filter((a) => a.id !== id),
        })),
    }),
    {
      name: "kapruka_addresses",
    },
  ),
);
