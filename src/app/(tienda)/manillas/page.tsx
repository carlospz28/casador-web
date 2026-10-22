import type { Metadata } from "next";
import { getCollections, getProducts } from "@/lib/catalog";
import { CatalogView } from "@/components/catalog/catalog-view";

export const metadata: Metadata = {
  title: "Manillas con balines de oro 18K",
  description:
    "Manillas tejidas a mano con balines de oro 18K ley 750. Cinco colores de cordón, talla ajustable y certificado. Envío a todo Colombia.",
  alternates: { canonical: "/manillas" },
};

export default async function ManillasPage(props: PageProps<"/manillas">) {
  const [products, collections] = await Promise.all([getProducts(), getCollections()]);
  return (
    <CatalogView
      title="Manillas"
      description="Balines de oro 18K ley 750 sobre cordón tejido a mano. Cinco colores de cordón, talla ajustable y certificado en cada pieza."
      products={products}
      collections={collections}
      searchParams={props.searchParams}
    />
  );
}
