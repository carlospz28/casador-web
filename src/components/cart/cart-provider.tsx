"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import type { CartItem } from "@/lib/types";
import { quoteCart } from "./cart-actions";

const STORAGE_KEY = "casador-bolsa-v1";

type CartContextValue = {
  items: CartItem[];
  ready: boolean;
  /** true mientras se confirman precios y stock con el servidor */
  syncing: boolean;
  /** aviso cuando algo de la bolsa cambió (precio, stock, producto retirado) */
  notice: string;
  count: number;
  subtotal: number;
  open: boolean;
  setOpen: (open: boolean) => void;
  add: (item: CartItem) => void;
  setQty: (variantId: string, size: string, qty: number) => void;
  remove: (variantId: string, size: string) => void;
  clear: () => void;
  sync: () => Promise<void>;
};

const CartContext = createContext<CartContextValue | null>(null);

function read(): CartItem[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function write(items: CartItem[]) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {
    // modo privado o almacenamiento lleno: la bolsa vive solo en memoria
  }
}

const same = (a: CartItem, variantId: string, size: string) => a.variantId === variantId && a.size === size;

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [open, setOpen] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [notice, setNotice] = useState("");
  const itemsRef = useRef<CartItem[]>([]);

  useEffect(() => {
    itemsRef.current = items;
  }, [items]);

  useEffect(() => {
    // La bolsa guardada solo existe en el navegador; se lee al montar.
    const saved = read();
    itemsRef.current = saved;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setItems(saved);
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (loaded) write(items);
  }, [items, loaded]);

  /** Compara la bolsa con la base de datos y corrige precio, foto y cantidades. */
  const sync = useCallback(async () => {
    const current = itemsRef.current;
    if (current.length === 0) return;
    setSyncing(true);
    try {
      const quote = await quoteCart(current.map(({ variantId, size, qty }) => ({ variantId, size, qty })));
      if (!quote.ok) return; // sin conexión: se deja la bolsa como está; el pago igual usa el precio real
      const notes: string[] = [];
      const next: CartItem[] = [];
      for (const item of itemsRef.current) {
        const line = quote.lines.find((l) => l.variantId === item.variantId && l.size === item.size);
        if (!line || !line.active || line.stock <= 0) {
          notes.push(`${item.name} (cordón ${item.colorName.toLowerCase()}) ya no está disponible y la quitamos.`);
          continue;
        }
        let qty = item.qty;
        if (qty > line.stock) {
          qty = line.stock;
          notes.push(
            `${line.stock === 1 ? "Solo queda 1" : `Solo quedan ${line.stock}`} de ${line.productName} en cordón ${line.colorName.toLowerCase()}.`,
          );
        }
        if (line.unitPrice !== item.unitPrice) notes.push(`El precio de ${line.productName} cambió.`);
        next.push({
          ...item,
          qty,
          productId: line.productId,
          slug: line.slug,
          name: line.productName,
          colorName: line.colorName,
          unitPrice: line.unitPrice,
          image: line.image,
        });
      }
      setItems(next);
      setNotice(notes.join(" "));
    } finally {
      setSyncing(false);
    }
  }, []);

  // Cada vez que se abre la bolsa se confirman precios y stock.
  useEffect(() => {
    if (open) sync();
  }, [open, sync]);

  const add = useCallback((item: CartItem) => {
    setNotice("");
    setItems((prev) => {
      const found = prev.find((i) => same(i, item.variantId, item.size));
      if (found) {
        return prev.map((i) => (same(i, item.variantId, item.size) ? { ...i, qty: i.qty + item.qty } : i));
      }
      return [...prev, item];
    });
    setOpen(true);
  }, []);

  const setQty = useCallback((variantId: string, size: string, qty: number) => {
    setItems((prev) =>
      qty <= 0
        ? prev.filter((i) => !same(i, variantId, size))
        : prev.map((i) => (same(i, variantId, size) ? { ...i, qty } : i)),
    );
  }, []);

  const remove = useCallback((variantId: string, size: string) => {
    setItems((prev) => prev.filter((i) => !same(i, variantId, size)));
  }, []);

  const clear = useCallback(() => {
    itemsRef.current = [];
    setItems([]);
    setNotice("");
  }, []);

  const value = useMemo<CartContextValue>(() => {
    const count = items.reduce((n, i) => n + i.qty, 0);
    const subtotal = items.reduce((n, i) => n + i.qty * i.unitPrice, 0);
    return { items, ready: loaded, syncing, notice, count, subtotal, open, setOpen, add, setQty, remove, clear, sync };
  }, [items, loaded, syncing, notice, open, add, setQty, remove, clear, sync]);

  return <CartContext value={value}>{children}</CartContext>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart debe usarse dentro de CartProvider");
  return ctx;
}
