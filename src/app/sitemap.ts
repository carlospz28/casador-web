import type { MetadataRoute } from "next";
import { getCollections, getProducts } from "@/lib/catalog";
import { HELP_PAGES } from "@/lib/help-content";
import { site } from "@/lib/site";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [products, collections] = await Promise.all([getProducts(), getCollections()]);
  const base = site.url.replace(/\/$/, "");
  return [
    { url: `${base}/`, priority: 1 },
    { url: `${base}/manillas`, priority: 0.9 },
    ...products.map((p) => ({ url: `${base}/manillas/${p.slug}`, priority: 0.8 })),
    ...collections.map((c) => ({ url: `${base}/coleccion/${c.slug}`, priority: 0.7 })),
    { url: `${base}/nosotros`, priority: 0.5 },
    ...HELP_PAGES.map((h) => ({ url: `${base}/ayuda/${h.slug}`, priority: 0.3 })),
  ];
}
