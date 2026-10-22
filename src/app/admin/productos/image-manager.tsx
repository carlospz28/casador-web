"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { createBrowserSupabase } from "@/lib/supabase/browser";
import { PRODUCT_BUCKET } from "@/lib/supabase/env";
import type { ProductImage } from "@/lib/types";
import { addImage, deleteImage, reorderImages } from "./actions";

const MAX_MB = 8;

export function ImageManager({
  productId,
  productName,
  images,
}: {
  productId: string;
  productName: string;
  images: ProductImage[];
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [, startTransition] = useTransition();

  async function upload(files: FileList | null) {
    if (!files?.length) return;
    setError("");
    setBusy(true);
    const supabase = createBrowserSupabase();
    try {
      for (const file of Array.from(files)) {
        if (!file.type.startsWith("image/")) throw new Error(`${file.name} no es una imagen.`);
        if (file.size > MAX_MB * 1024 * 1024) throw new Error(`${file.name} pesa más de ${MAX_MB} MB.`);
        const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
        const path = `${productId}/${crypto.randomUUID()}.${ext}`;
        const { error: upErr } = await supabase.storage
          .from(PRODUCT_BUCKET)
          .upload(path, file, { cacheControl: "31536000", contentType: file.type });
        if (upErr) throw new Error(`No se pudo subir ${file.name}: ${upErr.message}`);
        const { data } = supabase.storage.from(PRODUCT_BUCKET).getPublicUrl(path);
        await addImage(productId, data.publicUrl, path, productName);
      }
      router.refresh();
    } catch (e) {
      const msg = e instanceof Error ? e.message : "";
      setError(
        msg.startsWith("No se pudo") || msg.includes("no es una imagen") || msg.includes("pesa más")
          ? msg
          : "No se pudo subir la foto. Revise su conexión e intente de nuevo.",
      );
    } finally {
      setBusy(false);
    }
  }

  function move(index: number, dir: -1 | 1) {
    const ids = images.map((i) => i.id);
    const target = index + dir;
    if (target < 0 || target >= ids.length) return;
    [ids[index], ids[target]] = [ids[target], ids[index]];
    startTransition(async () => {
      await reorderImages(productId, ids);
      router.refresh();
    });
  }

  function remove(id: string) {
    if (!confirm("¿Borrar esta foto?")) return;
    startTransition(async () => {
      await deleteImage(id);
      router.refresh();
    });
  }

  return (
    <section className="flex flex-col gap-4 border border-linea bg-crema p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xs uppercase tracking-[0.12em] text-suave">Fotos (la primera es la principal)</h2>
        <label className="inline-flex min-h-11 cursor-pointer items-center bg-tinta px-5 text-sm text-crema">
          {busy ? "Subiendo…" : "+ Subir fotos"}
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            disabled={busy}
            className="sr-only"
            onChange={(e) => {
              upload(e.target.files);
              e.target.value = "";
            }}
          />
        </label>
      </div>
      <p className="text-xs text-suave">
        Recomendado: fotos cuadradas o verticales (4:5), mínimo 1200 px, JPG o WebP de menos de {MAX_MB} MB. Orden ideal:
        puesta, detalle del balín, cierre, junto a una regla, empaque.
      </p>
      {error && <p className="text-sm text-[#A3262A]">{error}</p>}
      {images.length === 0 ? (
        <p className="text-sm text-suave">Todavía no hay fotos.</p>
      ) : (
        <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {images.map((img, i) => (
            <li key={img.id} className="flex flex-col gap-2">
              <div className="relative aspect-[4/5] overflow-hidden bg-lino">
                <Image src={img.url} alt={img.alt} fill sizes="200px" className="object-cover" />
                {i === 0 && (
                  <span className="absolute left-1.5 top-1.5 bg-crema px-1.5 py-0.5 text-[10px] uppercase">Principal</span>
                )}
              </div>
              <div className="flex justify-between text-sm">
                <div className="flex gap-1">
                  <button type="button" onClick={() => move(i, -1)} disabled={i === 0} aria-label="Mover antes" className="size-9 border border-borde disabled:opacity-30">
                    ←
                  </button>
                  <button type="button" onClick={() => move(i, 1)} disabled={i === images.length - 1} aria-label="Mover después" className="size-9 border border-borde disabled:opacity-30">
                    →
                  </button>
                </div>
                <button type="button" onClick={() => remove(img.id)} className="text-[#A3262A] underline">
                  Borrar
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
