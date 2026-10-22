"use server";

import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { refreshCatalog } from "@/lib/refresh-catalog";
import { PRODUCT_BUCKET } from "@/lib/supabase/env";
import { slugify } from "@/lib/slug";

export type SaveState = { error?: string; ok?: boolean };

type VariantIn = { id?: string; color_name: string; color_hex: string; stock: number };

const str = (fd: FormData, k: string) => String(fd.get(k) ?? "").trim();
const num = (fd: FormData, k: string) => {
  const v = str(fd, k).replace(",", ".");
  if (!v) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
};

async function productSlug(supabase: Awaited<ReturnType<typeof requireAdmin>>["supabase"], productId: string) {
  const { data } = await supabase.from("products").select("slug").eq("id", productId).maybeSingle();
  return data?.slug ? [data.slug as string] : [];
}

function parseSizes(raw: string) {
  return raw
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [label, ...rest] = line.split("|");
      return { label: label.trim(), range: rest.join("|").trim() };
    })
    .filter((s) => s.label);
}

function parseVariants(raw: string): VariantIn[] {
  try {
    const list = JSON.parse(raw);
    if (!Array.isArray(list)) return [];
    return list
      .map((v) => ({
        id: typeof v.id === "string" && v.id ? v.id : undefined,
        color_name: String(v.color_name ?? "").trim(),
        color_hex: /^#[0-9a-f]{6}$/i.test(v.color_hex) ? v.color_hex : "#1C1A17",
        stock: Math.max(0, Math.floor(Number(v.stock) || 0)),
      }))
      .filter((v) => v.color_name);
  } catch {
    return [];
  }
}

export async function saveProduct(_prev: SaveState, fd: FormData): Promise<SaveState> {
  const { supabase } = await requireAdmin();
  const id = str(fd, "id");
  const name = str(fd, "name");
  if (!name) return { error: "El nombre es obligatorio." };
  const slug = slugify(str(fd, "slug") || name);
  if (!slug) return { error: "El enlace (slug) no es válido." };

  const product = {
    name,
    slug,
    short_description: str(fd, "short_description"),
    description: str(fd, "description"),
    ball_size_mm: num(fd, "ball_size_mm"),
    ball_count: num(fd, "ball_count"),
    gold_weight_g: num(fd, "gold_weight_g"),
    length_min_cm: num(fd, "length_min_cm"),
    length_max_cm: num(fd, "length_max_cm"),
    closure: str(fd, "closure"),
    cord_material: str(fd, "cord_material"),
    price: Math.max(0, Math.round(num(fd, "price") ?? 0)),
    badge: str(fd, "badge"),
    active: fd.get("active") === "on",
    featured: fd.get("featured") === "on",
    position: Math.round(num(fd, "position") ?? 0),
    sizes: parseSizes(str(fd, "sizes")),
  };

  const oldSlugs = id ? await productSlug(supabase, id) : [];
  const query = id
    ? supabase.from("products").update(product).eq("id", id).select("id").single()
    : supabase.from("products").insert(product).select("id").single();
  const { data: saved, error } = await query;
  if (error || !saved) {
    if (error?.code === "23505") return { error: `Ya existe un producto con el enlace “${slug}”.` };
    return { error: `No se pudo guardar: ${error?.message ?? "error desconocido"}` };
  }
  const productId = saved.id as string;

  // Variantes (colores): actualiza, crea y borra las que se quitaron
  const variants = parseVariants(str(fd, "variants"));
  const { data: existing } = await supabase.from("product_variants").select("id").eq("product_id", productId);
  const keep = new Set(variants.filter((v) => v.id).map((v) => v.id));
  const toDelete = (existing ?? []).map((v) => v.id as string).filter((vid) => !keep.has(vid));
  if (toDelete.length) await supabase.from("product_variants").delete().in("id", toDelete);

  for (const [position, v] of variants.entries()) {
    const row = { product_id: productId, color_name: v.color_name, color_hex: v.color_hex, stock: v.stock, position };
    const { error: vErr } = v.id
      ? await supabase.from("product_variants").update(row).eq("id", v.id)
      : await supabase.from("product_variants").insert(row);
    if (vErr) return { error: `Producto guardado, pero falló el color ${v.color_name}: ${vErr.message}` };
  }

  // Colecciones
  const collectionIds = fd.getAll("collections").map(String);
  await supabase.from("product_collections").delete().eq("product_id", productId);
  if (collectionIds.length) {
    await supabase
      .from("product_collections")
      .insert(collectionIds.map((collection_id) => ({ product_id: productId, collection_id })));
  }

  await refreshCatalog([...oldSlugs, slug]);
  if (!id) redirect(`/admin/productos/${productId}?nuevo=1`);
  return { ok: true };
}

export async function deleteProduct(fd: FormData) {
  const { supabase } = await requireAdmin();
  const id = str(fd, "id");
  const slugs = await productSlug(supabase, id);
  const { data: images } = await supabase.from("product_images").select("storage_path").eq("product_id", id);
  const paths = (images ?? []).map((i) => i.storage_path).filter(Boolean) as string[];
  if (paths.length) await supabase.storage.from(PRODUCT_BUCKET).remove(paths);
  await supabase.from("products").delete().eq("id", id);
  await refreshCatalog(slugs);
  redirect("/admin");
}

export async function addImage(productId: string, url: string, storagePath: string, alt: string) {
  const { supabase } = await requireAdmin();
  const { count } = await supabase
    .from("product_images")
    .select("id", { count: "exact", head: true })
    .eq("product_id", productId);
  const { error } = await supabase
    .from("product_images")
    .insert({ product_id: productId, url, storage_path: storagePath, alt, position: count ?? 0 });
  if (error) throw new Error(error.message);
  await refreshCatalog(await productSlug(supabase, productId));
}

export async function deleteImage(imageId: string) {
  const { supabase } = await requireAdmin();
  const { data: img } = await supabase
    .from("product_images")
    .select("storage_path, product_id")
    .eq("id", imageId)
    .single();
  if (img?.storage_path) await supabase.storage.from(PRODUCT_BUCKET).remove([img.storage_path]);
  await supabase.from("product_images").delete().eq("id", imageId);
  await refreshCatalog(img ? await productSlug(supabase, img.product_id) : []);
}

/** Guarda el nuevo orden de las fotos (la primera es la principal). */
export async function reorderImages(productId: string, ids: string[]) {
  const { supabase } = await requireAdmin();
  for (const [position, id] of ids.entries()) {
    await supabase.from("product_images").update({ position }).eq("id", id).eq("product_id", productId);
  }
  await refreshCatalog(await productSlug(supabase, productId));
}
