import type { Product } from "@/lib/types";

export type Filters = {
  color: string;
  balin: string;
  orden: string;
};

export type RawSearchParams = Record<string, string | string[] | undefined>;

const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";

export function readFilters(sp: RawSearchParams): Filters {
  return { color: one(sp.color), balin: one(sp.balin), orden: one(sp.orden) };
}

export function applyFilters(products: Product[], f: Filters) {
  let list = products;
  if (f.color) list = list.filter((p) => p.variants.some((v) => v.color_name.toLowerCase() === f.color.toLowerCase()));
  if (f.balin) list = list.filter((p) => String(p.ball_size_mm ?? "") === f.balin);
  if (f.orden === "precio-asc") list = [...list].sort((a, b) => a.price - b.price);
  if (f.orden === "precio-desc") list = [...list].sort((a, b) => b.price - a.price);
  return list;
}

export function filterOptions(products: Product[]) {
  const colors = new Map<string, string>();
  const balls = new Set<number>();
  for (const p of products) {
    p.variants.forEach((v) => colors.set(v.color_name, v.color_hex));
    if (p.ball_size_mm) balls.add(p.ball_size_mm);
  }
  return {
    colors: [...colors.keys()],
    balls: [...balls].sort((a, b) => a - b).map(String),
  };
}
