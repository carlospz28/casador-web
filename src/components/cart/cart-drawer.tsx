"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect } from "react";
import { priceLabel, site, whatsappLink } from "@/lib/site";
import { CloseIcon } from "../icons";
import { useCart } from "./cart-provider";

export function cartMessage(items: { name: string; colorName: string; size: string; qty: number }[]) {
  const lines = items.map((i) => `• ${i.qty} × ${i.name} (cordón ${i.colorName.toLowerCase()}, talla ${i.size})`);
  return `Hola ${site.name}, quiero hacer este pedido:\n${lines.join("\n")}`;
}

export function CartDrawer() {
  const { items, subtotal, open, setOpen, setQty, remove, notice } = useCart();

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, setOpen]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end" role="dialog" aria-modal="true" aria-label="Tu bolsa">
      <button
        type="button"
        aria-label="Cerrar la bolsa"
        className="absolute inset-0 bg-tinta/40"
        onClick={() => setOpen(false)}
      />
      <div className="relative flex h-full w-full max-w-md flex-col bg-crema shadow-xl">
        <div className="flex items-center justify-between border-b border-linea px-6 py-4">
          <h2 className="font-serif text-2xl">Tu bolsa</h2>
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Cerrar"
            className="flex size-11 items-center justify-center"
          >
            <CloseIcon />
          </button>
        </div>

        {notice && (
          <p role="status" className="border-b border-linea bg-arena px-6 py-3 text-sm text-texto">
            {notice}
          </p>
        )}

        {items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 p-6 text-center">
            <p className="text-texto">Tu bolsa está vacía.</p>
            <Link
              href="/manillas"
              onClick={() => setOpen(false)}
              className="inline-flex min-h-12 items-center bg-tinta px-8 text-sm uppercase tracking-widest text-crema hover:text-crema"
            >
              Ver manillas
            </Link>
          </div>
        ) : (
          <>
            <ul className="flex-1 divide-y divide-linea overflow-y-auto px-6">
              {items.map((item) => (
                <li key={`${item.variantId}-${item.size}`} className="flex gap-4 py-5">
                  <div className="relative size-20 shrink-0 overflow-hidden bg-lino">
                    {item.image && <Image src={item.image} alt="" fill sizes="80px" className="object-cover" />}
                  </div>
                  <div className="flex flex-1 flex-col gap-1">
                    <Link
                      href={`/manillas/${item.slug}`}
                      onClick={() => setOpen(false)}
                      className="text-[15px] no-underline"
                    >
                      {item.name}
                    </Link>
                    <p className="text-[13px] text-suave">
                      Cordón {item.colorName.toLowerCase()} · Talla {item.size}
                    </p>
                    <div className="mt-auto flex items-center justify-between">
                      <div className="flex items-center border border-borde">
                        <button
                          type="button"
                          aria-label="Quitar una"
                          className="size-9"
                          onClick={() => setQty(item.variantId, item.size, item.qty - 1)}
                        >
                          −
                        </button>
                        <span className="w-7 text-center text-sm">{item.qty}</span>
                        <button
                          type="button"
                          aria-label="Agregar una"
                          className="size-9"
                          onClick={() => setQty(item.variantId, item.size, item.qty + 1)}
                        >
                          +
                        </button>
                      </div>
                      <span className="text-sm font-medium">{priceLabel(item.unitPrice * item.qty)}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => remove(item.variantId, item.size)}
                      className="self-start text-xs text-suave underline"
                    >
                      Quitar
                    </button>
                  </div>
                </li>
              ))}
            </ul>
            <div className="flex flex-col gap-3 border-t border-linea px-6 py-5">
              <div className="flex justify-between text-base">
                <span>Subtotal</span>
                <span className="font-medium">{priceLabel(subtotal)}</span>
              </div>
              <p className="text-xs text-suave">El envío se calcula en el siguiente paso.</p>
              <Link
                href="/checkout"
                onClick={() => setOpen(false)}
                className="flex min-h-13 items-center justify-center bg-tinta text-sm uppercase tracking-widest text-crema hover:text-crema"
              >
                Pagar ahora
              </Link>
              <a
                href={whatsappLink(cartMessage(items))}
                className="flex min-h-13 items-center justify-center border border-tinta text-sm uppercase tracking-widest"
              >
                Pedir por WhatsApp
              </a>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
