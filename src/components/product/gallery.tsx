"use client";

import Image from "next/image";
import { useState } from "react";
import type { ProductImage } from "@/lib/types";

const PLACEHOLDERS = ["puesta en la muñeca", "detalle del balín", "cierre", "junto a una regla", "empaque y certificado"];

export function Gallery({ images, name }: { images: ProductImage[]; name: string }) {
  const [index, setIndex] = useState(0);

  if (images.length === 0) {
    return (
      <div className="flex flex-col gap-3">
        <div className="flex aspect-square items-center justify-center bg-lino p-6 text-center text-sm text-suave">
          [Foto: {name} {PLACEHOLDERS[0]}]
        </div>
        <div className="grid grid-cols-5 gap-2">
          {PLACEHOLDERS.map((p) => (
            <div key={p} className="flex aspect-square items-center justify-center bg-arena p-1 text-center text-[10px] text-suave">
              {p}
            </div>
          ))}
        </div>
      </div>
    );
  }

  const current = images[index] ?? images[0];
  return (
    <div className="flex flex-col gap-3">
      <div className="relative aspect-square overflow-hidden bg-lino">
        <Image
          src={current.url}
          alt={current.alt || name}
          fill
          priority
          sizes="(min-width: 1024px) 55vw, 100vw"
          className="object-cover"
        />
      </div>
      {images.length > 1 && (
        <div className="grid grid-cols-5 gap-2 sm:grid-cols-6">
          {images.map((img, i) => (
            <button
              key={img.id}
              type="button"
              onClick={() => setIndex(i)}
              aria-label={`Ver foto ${i + 1}`}
              aria-pressed={i === index}
              className={`relative aspect-square overflow-hidden bg-lino ${
                i === index ? "outline-2 outline-tinta" : ""
              }`}
            >
              <Image src={img.url} alt="" fill sizes="96px" className="object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
