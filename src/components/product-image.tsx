import Image from "next/image";
import type { ProductImage } from "@/lib/types";

type Props = {
  image?: ProductImage | null;
  label: string;
  sizes: string;
  priority?: boolean;
  className?: string;
};

/** Foto del producto, o un recuadro con texto mientras no hay foto. */
export function ProductImageBox({ image, label, sizes, priority, className = "aspect-[4/5]" }: Props) {
  return (
    <div className={`relative overflow-hidden bg-lino ${className}`}>
      {image ? (
        <Image
          src={image.url}
          alt={image.alt || label}
          fill
          sizes={sizes}
          priority={priority}
          className="object-cover"
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center p-4 text-center text-xs text-suave">
          [Foto: {label}]
        </div>
      )}
    </div>
  );
}
