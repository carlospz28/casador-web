import "server-only";
import { sampleProducts } from "./sample-data";
import { hasSupabase } from "./supabase/env";
import { createPublicClient } from "./supabase/public";
import { createServiceClient, hasServiceKey } from "./supabase/service";

export type LineIn = { variantId: string; size: string; qty: number };

export type PricedLine = LineIn & {
  productId: string;
  slug: string;
  productName: string;
  colorName: string;
  unitPrice: number;
  stock: number;
  active: boolean;
  image: string | null;
};

/** Lee las líneas de la bolsa que manda el navegador, con límites sanos. */
export function parseLines(raw: unknown): LineIn[] {
  let list: unknown = raw;
  if (typeof raw === "string") {
    try {
      list = JSON.parse(raw);
    } catch {
      return [];
    }
  }
  if (!Array.isArray(list)) return [];
  return list
    .slice(0, 50)
    .map((l) => ({
      variantId: String(l?.variantId ?? ""),
      size: String(l?.size ?? "").slice(0, 20),
      qty: Math.max(1, Math.min(20, Math.floor(Number(l?.qty) || 0))),
    }))
    .filter((l) => l.variantId);
}

type VariantRow = {
  id: string;
  color_name: string;
  stock: number;
  products: {
    id: string;
    slug: string;
    name: string;
    price: number;
    active: boolean;
    product_images: { url: string; position: number }[];
  };
};

/**
 * Precio, nombre, foto y stock actuales de cada línea, siempre desde la base de datos.
 * Las líneas cuyo color ya no existe no se devuelven.
 */
export async function priceLines(lines: LineIn[]): Promise<PricedLine[]> {
  if (!hasSupabase) {
    return lines.flatMap((l) => {
      for (const p of sampleProducts) {
        const v = p.variants.find((x) => x.id === l.variantId);
        if (v) {
          return [
            {
              ...l,
              productId: p.id,
              slug: p.slug,
              productName: p.name,
              colorName: v.color_name,
              unitPrice: p.price,
              stock: v.stock,
              active: p.active,
              image: p.images[0]?.url ?? null,
            },
          ];
        }
      }
      return [];
    });
  }

  const ids = [...new Set(lines.map((l) => l.variantId))];
  const client = hasServiceKey ? createServiceClient() : createPublicClient();
  const { data, error } = await client
    .from("product_variants")
    .select("id, color_name, stock, products(id, slug, name, price, active, product_images(url, position))")
    .in("id", ids);
  if (error) throw new Error(error.message);

  const byId = new Map((data as unknown as VariantRow[]).map((v) => [v.id, v]));
  return lines.flatMap((l) => {
    const v = byId.get(l.variantId);
    if (!v?.products) return [];
    const first = [...(v.products.product_images ?? [])].sort((a, b) => a.position - b.position)[0];
    return [
      {
        ...l,
        productId: v.products.id,
        slug: v.products.slug,
        productName: v.products.name,
        colorName: v.color_name,
        unitPrice: v.products.price,
        stock: v.stock,
        active: v.products.active,
        image: first?.url ?? null,
      },
    ];
  });
}
