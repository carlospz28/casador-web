import "server-only";
import { revalidatePath, updateTag } from "next/cache";
import { CATALOG_TAG, getCollections, getProducts } from "./catalog";

/**
 * Después de un cambio en el admin: borra la caché del catálogo y vuelve a
 * generar las páginas de la tienda que lo muestran, para que el cambio se vea
 * desde la siguiente visita.
 */
export async function refreshCatalog(productSlugs: string[] | "todos" = []) {
  updateTag(CATALOG_TAG);
  const collections = await getCollections().catch(() => []);
  const slugs =
    productSlugs === "todos" ? (await getProducts().catch(() => [])).map((p) => p.slug) : productSlugs;
  const paths = [
    "/",
    "/manillas",
    "/sitemap.xml",
    ...collections.map((c) => `/coleccion/${c.slug}`),
    ...slugs.map((s) => `/manillas/${s}`),
  ];
  for (const path of paths) revalidatePath(path);
}
