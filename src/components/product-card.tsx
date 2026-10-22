import Link from "next/link";
import Image from "next/image";
import { formatNumber, priceLabel } from "@/lib/site";
import type { Product } from "@/lib/types";
import { ProductImageBox } from "./product-image";

export function materialLine(p: Product) {
  const parts = ["Balines en oro 18K"];
  if (p.ball_size_mm) parts.push(`${formatNumber(p.ball_size_mm)} mm`);
  return parts.join(" · ");
}

export function ProductCard({ product, priority }: { product: Product; priority?: boolean }) {
  const [first, second] = product.images;
  return (
    <Link href={`/manillas/${product.slug}`} className="group flex flex-col gap-2.5 no-underline">
      <div className="relative">
        <ProductImageBox
          image={first}
          label={`${product.name} puesta`}
          sizes="(min-width: 1024px) 25vw, 50vw"
          priority={priority}
        />
        {second && (
          <Image
            src={second.url}
            alt=""
            fill
            sizes="(min-width: 1024px) 25vw, 50vw"
            className="object-cover opacity-0 transition-opacity duration-300 group-hover:opacity-100"
          />
        )}
        {product.badge && (
          <span className="absolute left-2.5 top-2.5 bg-crema px-2 py-1 text-[11px] uppercase tracking-[0.08em] text-tinta">
            {product.badge}
          </span>
        )}
      </div>
      <h3 className="text-base font-normal text-tinta group-hover:underline">{product.name}</h3>
      <p className="text-[13px] text-suave">{materialLine(product)}</p>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="whitespace-nowrap text-[15px] font-medium text-tinta">{priceLabel(product.price)}</span>
        <span className="flex gap-1.5" aria-label={`Colores: ${product.variants.map((v) => v.color_name).join(", ")}`}>
          {product.variants.map((v) => (
            <span
              key={v.id}
              className="size-3 rounded-full border border-borde"
              style={{ background: v.color_hex }}
            />
          ))}
        </span>
      </div>
    </Link>
  );
}

export function ProductGrid({ products }: { products: Product[] }) {
  if (products.length === 0) {
    return <p className="py-16 text-center text-suave">No hay manillas con esos filtros.</p>;
  }
  return (
    <div className="grid grid-cols-2 gap-x-5 gap-y-10 md:grid-cols-3 lg:grid-cols-4">
      {products.map((p, i) => (
        <ProductCard key={p.id} product={p} priority={i < 4} />
      ))}
    </div>
  );
}
