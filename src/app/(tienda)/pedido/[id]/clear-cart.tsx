"use client";

import { useEffect } from "react";
import { useCart } from "@/components/cart/cart-provider";

/** Vacía la bolsa al volver de MercadoPago. */
export function ClearCart() {
  const { ready, clear } = useCart();
  useEffect(() => {
    if (ready) clear();
  }, [ready, clear]);
  return null;
}
