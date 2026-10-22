import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getCollections, getProducts } from "@/lib/catalog";
import { CatalogView } from "@/components/catalog/catalog-view";

export async function generateStaticParams() {
  const collections = await getCollections();
  return collections.length > 0 ? collections.map((c) => ({ slug: c.slug })) : [{ slug: "__vacio__" }];
}

export async function generateMetadata(props: PageProps<"/coleccion/[slug]">): Promise<Metadata> {
  const { slug } = await props.params;
  const collection = (await getCollections()).find((c) => c.slug === slug);
  if (!collection) return {};
  return {
    title: collection.name,
    description: collection.description,
    alternates: { canonical: `/coleccion/${slug}` },
  };
}

export default async function CollectionPage(props: PageProps<"/coleccion/[slug]">) {
  const { slug } = await props.params;
  const [products, collections] = await Promise.all([getProducts(), getCollections()]);
  const collection = collections.find((c) => c.slug === slug);
  if (!collection) notFound();

  return (
    <CatalogView
      title={collection.name}
      description={collection.description}
      products={products.filter((p) => p.collections.includes(slug))}
      collections={collections}
      activeSlug={slug}
      searchParams={props.searchParams}
    />
  );
}
