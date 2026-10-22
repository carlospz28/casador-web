"use client";

import Link from "next/link";
import { useState } from "react";
import { priceLabel, site, whatsappLink } from "@/lib/site";
import type { Product } from "@/lib/types";
import { useCart } from "../cart/cart-provider";

export function Purchase({ product }: { product: Product }) {
  const { add } = useCart();
  const firstInStock = product.variants.find((v) => v.stock > 0) ?? product.variants[0];
  const [variantId, setVariantId] = useState(firstInStock?.id ?? "");
  const [size, setSize] = useState(product.sizes[1]?.label ?? product.sizes[0]?.label ?? "Única");
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);

  const variant = product.variants.find((v) => v.id === variantId);
  const soldOut = !variant || variant.stock <= 0;
  const canBuyOnline = product.price > 0 && !soldOut;

  const waMessage = `Hola ${site.name}, quiero la ${product.name}${
    variant ? ` con cordón ${variant.color_name.toLowerCase()}` : ""
  }, talla ${size}, cantidad ${qty}.`;

  function addToBag() {
    if (!variant || !canBuyOnline) return;
    add({
      variantId: variant.id,
      productId: product.id,
      slug: product.slug,
      name: product.name,
      colorName: variant.color_name,
      size,
      qty,
      unitPrice: product.price,
      image: product.images[0]?.url ?? null,
    });
    setAdded(true);
  }

  return (
    <div className="flex flex-col gap-6">
      {product.variants.length > 0 && (
        <fieldset className="flex flex-col gap-3">
          <legend className="pb-3 text-sm">
            Color de cordón: <strong className="font-medium">{variant?.color_name}</strong>
            {soldOut && <span className="ml-2 text-suave">(agotado)</span>}
          </legend>
          <div className="flex flex-wrap gap-2.5">
            {product.variants.map((v) => {
              const on = v.id === variantId;
              return (
                <button
                  key={v.id}
                  type="button"
                  onClick={() => {
                    setVariantId(v.id);
                    setAdded(false);
                  }}
                  aria-label={`${v.color_name}${v.stock <= 0 ? ", agotado" : ""}`}
                  aria-pressed={on}
                  className={`flex size-11 items-center justify-center rounded-full ${
                    on ? "ring-1 ring-tinta ring-offset-2 ring-offset-crema" : ""
                  }`}
                >
                  <span
                    className={`size-[34px] rounded-full border border-borde ${v.stock <= 0 ? "opacity-35" : ""}`}
                    style={{ background: v.color_hex }}
                  />
                </button>
              );
            })}
          </div>
        </fieldset>
      )}

      {product.sizes.length > 0 && (
        <fieldset className="flex flex-col gap-3">
          <legend className="flex gap-3 pb-3 text-sm">
            Talla de muñeca
            <Link href="/ayuda/guia-de-tallas" className="text-[13px] text-suave">
              Guía de tallas
            </Link>
          </legend>
          <div className="flex flex-wrap gap-2.5">
            {product.sizes.map((s) => {
              const on = s.label === size;
              return (
                <button
                  key={s.label}
                  type="button"
                  aria-pressed={on}
                  onClick={() => {
                    setSize(s.label);
                    setAdded(false);
                  }}
                  className={`flex min-h-12 min-w-24 flex-col items-center justify-center gap-0.5 border px-3.5 py-1.5 ${
                    on ? "border-tinta bg-tinta text-crema" : "border-borde"
                  }`}
                >
                  <span className="text-[15px]">{s.label}</span>
                  {s.range && <span className="text-[11px] opacity-80">{s.range}</span>}
                </button>
              );
            })}
          </div>
        </fieldset>
      )}

      {canBuyOnline ? (
        <div className="flex flex-wrap gap-3">
          <div className="flex items-center border border-borde">
            <button type="button" aria-label="Quitar una" className="h-13 w-11 text-xl" onClick={() => setQty(Math.max(1, qty - 1))}>
              −
            </button>
            <span className="w-8 text-center" aria-live="polite">
              {qty}
            </span>
            <button
              type="button"
              aria-label="Agregar una"
              className="h-13 w-11 text-xl"
              onClick={() => setQty(Math.min(variant?.stock ?? 1, qty + 1))}
            >
              +
            </button>
          </div>
          <button
            type="button"
            onClick={addToBag}
            className="min-h-13 flex-[1_1_220px] bg-tinta text-sm uppercase tracking-[0.1em] text-crema hover:bg-[#33302b]"
          >
            {added ? "Agregada a la bolsa" : `Agregar a la bolsa · ${priceLabel(product.price * qty)}`}
          </button>
        </div>
      ) : (
        <p className="border border-borde bg-arena p-4 text-sm text-texto">
          {soldOut
            ? "Este color está agotado. Escríbenos y te avisamos cuando vuelva, o elige otro color."
            : "Esta pieza se cotiza por WhatsApp según colores y medida."}
        </p>
      )}

      <a
        href={whatsappLink(waMessage)}
        className="flex min-h-13 items-center justify-center border border-tinta text-sm uppercase tracking-[0.1em] no-underline"
      >
        Pedir por WhatsApp
      </a>
    </div>
  );
}
