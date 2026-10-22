"use client";

import { useActionState, useState } from "react";
import type { Collection, Product } from "@/lib/types";
import { saveProduct, type SaveState } from "./actions";

const input = "min-h-11 w-full border border-borde bg-white px-3 text-[15px]";
const label = "flex flex-col gap-1.5 text-sm";

type VariantRow = { key: string; id?: string; color_name: string; color_hex: string; stock: number };

const PRESET_COLORS = [
  { color_name: "Negro", color_hex: "#1C1A17" },
  { color_name: "Dorado", color_hex: "#C9A54C" },
  { color_name: "Rosado", color_hex: "#E8B4B8" },
  { color_name: "Rojo", color_hex: "#A3262A" },
  { color_name: "Azul", color_hex: "#1F3A68" },
];

let counter = 0;
const key = () => `n${++counter}`;

export function ProductForm({
  product,
  collections,
}: {
  product: (Product & { collectionIds: string[] }) | null;
  collections: Collection[];
}) {
  const [state, action, pending] = useActionState<SaveState, FormData>(saveProduct, {});
  const [variants, setVariants] = useState<VariantRow[]>(
    product?.variants.map((v) => ({ key: v.id, ...v })) ??
      PRESET_COLORS.slice(0, 3).map((c) => ({ key: key(), ...c, stock: 1 })),
  );

  const update = (k: string, patch: Partial<VariantRow>) =>
    setVariants((rows) => rows.map((r) => (r.key === k ? { ...r, ...patch } : r)));

  const sizesText = (product?.sizes ?? [{ label: "S", range: "" }, { label: "M", range: "" }, { label: "L", range: "" }])
    .map((s) => (s.range ? `${s.label} | ${s.range}` : s.label))
    .join("\n");

  return (
    <form action={action} className="flex flex-col gap-8 border border-linea bg-crema p-6">
      {product && <input type="hidden" name="id" value={product.id} />}
      <input
        type="hidden"
        name="variants"
        value={JSON.stringify(variants.map(({ id, color_name, color_hex, stock }) => ({ id, color_name, color_hex, stock })))}
      />

      <section className="grid gap-4 sm:grid-cols-2">
        <h2 className="text-xs uppercase tracking-[0.12em] text-suave sm:col-span-2">Información</h2>
        <label className={label}>
          Nombre
          <input name="name" required defaultValue={product?.name} className={input} />
        </label>
        <label className={label}>
          Enlace (se arma solo si lo deja vacío)
          <input name="slug" defaultValue={product?.slug} placeholder="manilla-balin-4mm" className={input} />
        </label>
        <label className={label}>
          Precio en pesos (0 = se cotiza por WhatsApp)
          <input name="price" type="number" min={0} step={1000} defaultValue={product?.price ?? 0} className={input} />
        </label>
        <label className={label}>
          Etiqueta (opcional: Más vendida, Nueva…)
          <input name="badge" defaultValue={product?.badge} className={input} />
        </label>
        <label className={`${label} sm:col-span-2`}>
          Frase corta (sale en Google y al compartir)
          <input name="short_description" defaultValue={product?.short_description} maxLength={160} className={input} />
        </label>
        <label className={`${label} sm:col-span-2`}>
          Descripción
          <textarea name="description" rows={4} defaultValue={product?.description} className={`${input} py-2`} />
        </label>
      </section>

      <section className="grid gap-4 sm:grid-cols-3">
        <h2 className="text-xs uppercase tracking-[0.12em] text-suave sm:col-span-3">Detalles y medidas</h2>
        <label className={label}>
          Balín (mm)
          <input name="ball_size_mm" inputMode="decimal" defaultValue={product?.ball_size_mm ?? ""} className={input} />
        </label>
        <label className={label}>
          Cantidad de balines
          <input name="ball_count" type="number" min={0} defaultValue={product?.ball_count ?? ""} className={input} />
        </label>
        <label className={label}>
          Peso del oro (g)
          <input name="gold_weight_g" inputMode="decimal" defaultValue={product?.gold_weight_g ?? ""} className={input} />
        </label>
        <label className={label}>
          Largo mínimo (cm)
          <input name="length_min_cm" inputMode="decimal" defaultValue={product?.length_min_cm ?? ""} className={input} />
        </label>
        <label className={label}>
          Largo máximo (cm)
          <input name="length_max_cm" inputMode="decimal" defaultValue={product?.length_max_cm ?? ""} className={input} />
        </label>
        <label className={label}>
          Cierre
          <input name="closure" defaultValue={product?.closure} placeholder="Nudo corredizo" className={input} />
        </label>
        <label className={label}>
          Material del cordón
          <input name="cord_material" defaultValue={product?.cord_material} className={input} />
        </label>
        <label className={`${label} sm:col-span-2`}>
          Tallas (una por línea: talla | rango)
          <textarea name="sizes" rows={3} defaultValue={sizesText} placeholder={"S | 14–16 cm\nM | 16–18 cm"} className={`${input} py-2 font-mono text-sm`} />
        </label>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-xs uppercase tracking-[0.12em] text-suave">Colores de cordón y stock</h2>
        {variants.map((v) => (
          <div key={v.key} className="flex flex-wrap items-end gap-3">
            <label className={label}>
              Color
              <input
                type="color"
                value={v.color_hex}
                onChange={(e) => update(v.key, { color_hex: e.target.value.toUpperCase() })}
                className="h-11 w-14 border border-borde bg-white"
              />
            </label>
            <label className={`${label} flex-1`}>
              Nombre del color
              <input
                value={v.color_name}
                onChange={(e) => update(v.key, { color_name: e.target.value })}
                className={input}
              />
            </label>
            <label className={`${label} w-28`}>
              Stock
              <input
                type="number"
                min={0}
                value={v.stock}
                onChange={(e) => update(v.key, { stock: Number(e.target.value) })}
                className={input}
              />
            </label>
            <button
              type="button"
              onClick={() => setVariants((rows) => rows.filter((r) => r.key !== v.key))}
              className="min-h-11 px-3 text-sm text-[#A3262A] underline"
            >
              Quitar
            </button>
          </div>
        ))}
        <div className="flex flex-wrap gap-2">
          {PRESET_COLORS.filter((c) => !variants.some((v) => v.color_name === c.color_name)).map((c) => (
            <button
              key={c.color_name}
              type="button"
              onClick={() => setVariants((rows) => [...rows, { key: key(), ...c, stock: 1 }])}
              className="flex min-h-10 items-center gap-2 border border-borde px-3 text-sm"
            >
              <span className="size-3 rounded-full" style={{ background: c.color_hex }} />+ {c.color_name}
            </button>
          ))}
          <button
            type="button"
            onClick={() => setVariants((rows) => [...rows, { key: key(), color_name: "", color_hex: "#888888", stock: 1 }])}
            className="min-h-10 border border-borde px-3 text-sm"
          >
            + Otro color
          </button>
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-xs uppercase tracking-[0.12em] text-suave">Colecciones y visibilidad</h2>
        <div className="flex flex-wrap gap-4">
          {collections.map((c) => (
            <label key={c.id} className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                name="collections"
                value={c.id}
                defaultChecked={product?.collectionIds.includes(c.id)}
                className="size-4 accent-tinta"
              />
              {c.name}
            </label>
          ))}
        </div>
        <div className="flex flex-wrap items-end gap-6">
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="active" defaultChecked={product?.active ?? true} className="size-4 accent-tinta" />
            Visible en la tienda
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="featured" defaultChecked={product?.featured} className="size-4 accent-tinta" />
            Destacado en el inicio
          </label>
          <label className={`${label} w-36`}>
            Orden (menor sale primero)
            <input name="position" type="number" defaultValue={product?.position ?? 0} className={input} />
          </label>
        </div>
      </section>

      {state.error && (
        <p role="alert" className="text-sm text-[#A3262A]">
          {state.error}
        </p>
      )}
      {state.ok && (
        <p role="status" className="text-sm text-[#2F6B3A]">
          Guardado. La tienda ya muestra los cambios.
        </p>
      )}
      <button
        type="submit"
        disabled={pending}
        className="min-h-12 self-start bg-tinta px-10 text-sm uppercase tracking-widest text-crema disabled:opacity-60"
      >
        {pending ? "Guardando…" : "Guardar"}
      </button>
    </form>
  );
}
