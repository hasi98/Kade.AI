"use client";

import { useEffect, useRef } from "react";
import { useCartStore } from "@/store/cart";
import { useAddressStore } from "@/store/address";
import type { Address } from "@/types";

export function CartAddExecutor({
  product_id,
  name,
  price,
  currency,
  quantity,
  image_url,
  icing_text,
  isHistorical,
}: {
  product_id: string;
  name: string;
  price: number;
  currency: string;
  quantity: number;
  image_url?: string | null;
  icing_text?: string;
  isHistorical?: boolean;
}) {
  const addItem = useCartStore((s) => s.addItem);
  const openCart = useCartStore((s) => s.openCart);
  const didAdd = useRef(false);

  useEffect(() => {
    if (!isHistorical && !didAdd.current) {
      didAdd.current = true;
      addItem({ id: product_id, name, price, currency, quantity, image_url: image_url ?? null, icing_text });
      openCart();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product_id]);

  return null;
}

export function CartRemoveExecutor({
  productId,
  isHistorical,
}: {
  productId: string;
  isHistorical?: boolean;
}) {
  const removeItem = useCartStore((s) => s.removeItem);
  useEffect(() => {
    if (!isHistorical) removeItem(productId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productId]);
  return null;
}

export function CartClearExecutor({ isHistorical }: { isHistorical?: boolean }) {
  const clearCart = useCartStore((s) => s.clearCart);
  useEffect(() => {
    if (!isHistorical) clearCart();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return null;
}

export function CartSetDeliveryFeeExecutor({
  fee,
  isHistorical,
}: {
  fee: number;
  isHistorical?: boolean;
}) {
  const setDeliveryFee = useCartStore((s) => s.setDeliveryFee);

  useEffect(() => {
    if (!isHistorical) {
      setDeliveryFee(fee);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fee]);

  return null;
}

export function AddressBookSaveExecutor({
  entry,
  isHistorical,
}: {
  entry: Omit<Address, "id">;
  isHistorical?: boolean;
}) {
  const { addresses, addAddress } = useAddressStore();
  const didSave = useRef(false);

  useEffect(() => {
    if (isHistorical || didSave.current) return;
    const isDuplicate = addresses.some(
      (a) => a.recipient_name === entry.recipient_name && a.address === entry.address && a.city === entry.city,
    );
    if (!isDuplicate) {
      didSave.current = true;
      addAddress({ ...entry, id: `addr_${Date.now()}_${Math.random().toString(36).slice(2, 7)}` });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}
