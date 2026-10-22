import Link from "next/link";
import { Suspense } from "react";
import type { Collection, Product } from "@/lib/types";
import { ProductGrid } from "../product-card";
import { Breadcrumbs } from "../ui";
import { FilterBar } from "./filter-bar";
import { applyFilters, filterOptions, readFilters, type RawSearchParams } from "./filters";

type Props = {
  title: string;
  description: string;
  products: Product[];
  collections: Collection[];
  activeSlug?: string;
  searchParams: Promise<RawSearchParams>;
};

/** Página de catálogo: título, chips de colecciones, filtros y grilla. */
export function CatalogView({ title, description, products, collections, activeSlug, searchParams }: Props) {
  const chips = [{ slug: "", name: "Todas", href: "/manillas" }].concat(
    collections.map((c) => ({ slug: c.slug, name: c.name, href: `/coleccion/${c.slug}` })),
  );

  return (
    <div className="mx-auto max-w-7xl px-6 pb-20 pt-6">
      <Breadcrumbs items={[{ href: "/", label: "Inicio" }, { label: title }]} />
      <div className="flex max-w-3xl flex-col gap-3.5 pb-7 pt-10">
        <h1 className="font-serif text-[clamp(36px,4vw,52px)] font-normal">{title}</h1>
        <p className="text-[17px] leading-relaxed text-texto">{description}</p>
      </div>

      <nav aria-label="Colecciones" className="flex flex-wrap gap-2.5 pb-7">
        {chips.map((c) => {
          const active = (activeSlug ?? "") === c.slug;
          return (
            <Link
              key={c.href}
              href={c.href}
              aria-current={active ? "page" : undefined}
              className={`inline-flex min-h-11 items-center border px-4.5 text-sm no-underline ${
                active ? "border-tinta bg-tinta text-crema hover:text-crema" : "border-borde"
              }`}
            >
              {c.name}
            </Link>
          );
        })}
      </nav>

      <Suspense fallback={<GridSkeleton />}>
        <FilteredGrid products={products} searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function FilteredGrid({ products, searchParams }: { products: Product[]; searchParams: Promise<RawSearchParams> }) {
  const filters = readFilters(await searchParams);
  const list = applyFilters(products, filters);
  const { colors, balls } = filterOptions(products);
  return (
    <>
      <FilterBar current={filters} colors={colors} balls={balls} count={list.length} />
      <div className="pt-9">
        <ProductGrid products={list} />
      </div>
    </>
  );
}

function GridSkeleton() {
  return (
    <>
      <div className="h-[74px] border-y border-linea" />
      <div className="grid grid-cols-2 gap-x-5 gap-y-10 pt-9 md:grid-cols-3 lg:grid-cols-4">
        {Array.from({ length: 8 }, (_, i) => (
          <div key={i} className="flex flex-col gap-2.5">
            <div className="aspect-[4/5] animate-pulse bg-lino" />
            <div className="h-4 w-2/3 bg-lino" />
            <div className="h-3 w-1/2 bg-lino" />
          </div>
        ))}
      </div>
    </>
  );
}
