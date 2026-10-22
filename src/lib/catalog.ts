import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { hasSupabase } from "./supabase/env";
import { createPublicClient } from "./supabase/public";
import { sampleCollections, sampleProducts, sampleReviews } from "./sample-data";
import type { Collection, Product, Review } from "./types";

/** Etiqueta de caché: el admin la refresca al guardar cambios. */
export const CATALOG_TAG = "catalog";

const PRODUCT_SELECT = `
  id, slug, name, short_description, description, ball_size_mm, ball_count,
  gold_weight_g, length_min_cm, length_max_cm, closure, cord_material, price,
  badge, active, featured, position, sizes,
  variants:product_variants(id, color_name, color_hex, stock, position),
  images:product_images(id, url, alt, position),
  product_collections(collections(slug))
`;

type Row = Omit<Product, "collections" | "variants"> & {
  variants: (Product["variants"][number] & { position: number })[];
  product_collections: { collections: { slug: string } | null }[];
};

export function normalizeProduct(row: Row): Product {
  const { product_collections, ...rest } = row;
  return {
    ...rest,
    sizes: Array.isArray(rest.sizes) ? rest.sizes : [],
    variants: [...(rest.variants ?? [])]
      .sort((a, b) => a.position - b.position)
      .map(({ id, color_name, color_hex, stock }) => ({ id, color_name, color_hex, stock })),
    images: [...(rest.images ?? [])].sort((a, b) => a.position - b.position),
    collections: (product_collections ?? [])
      .map((pc) => pc.collections?.slug)
      .filter((s): s is string => Boolean(s)),
  };
}

/** Todos los productos activos, ordenados. */
export async function getProducts(): Promise<Product[]> {
  "use cache";
  cacheTag(CATALOG_TAG);
  cacheLife("hours");

  if (!hasSupabase) return sampleProducts;

  const { data, error } = await createPublicClient()
    .from("products")
    .select(PRODUCT_SELECT)
    .eq("active", true)
    .order("position");

  if (error) throw new Error(`No se pudo cargar el catálogo: ${error.message}`);
  return (data as unknown as Row[]).map(normalizeProduct);
}

export async function getProduct(slug: string): Promise<Product | null> {
  const products = await getProducts();
  return products.find((p) => p.slug === slug) ?? null;
}

export async function getCollections(): Promise<Collection[]> {
  "use cache";
  cacheTag(CATALOG_TAG);
  cacheLife("hours");

  if (!hasSupabase) return sampleCollections;

  const { data, error } = await createPublicClient()
    .from("collections")
    .select("id, slug, name, description, position")
    .order("position");

  if (error) throw new Error(`No se pudieron cargar las colecciones: ${error.message}`);
  return data as Collection[];
}

export async function getReviews(productId?: string): Promise<Review[]> {
  "use cache";
  cacheTag(CATALOG_TAG);
  cacheLife("hours");

  if (!hasSupabase) return sampleReviews;

  let query = createPublicClient()
    .from("reviews")
    .select("id, product_id, name, city, body, rating, approved, created_at")
    .eq("approved", true)
    .order("created_at", { ascending: false })
    .limit(12);
  if (productId) query = query.eq("product_id", productId);

  const { data, error } = await query;
  if (error) throw new Error(`No se pudieron cargar las reseñas: ${error.message}`);
  return data as Review[];
}

/** Precio más bajo y más alto, para los filtros. */
export function priceRange(products: Product[]) {
  const prices = products.map((p) => p.price).filter((p) => p > 0);
  if (prices.length === 0) return null;
  return { min: Math.min(...prices), max: Math.max(...prices) };
}
