import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getProduct, getProducts, getReviews } from "@/lib/catalog";
import { formatNumber, priceLabel, site } from "@/lib/site";
import type { Product } from "@/lib/types";
import { Gallery } from "@/components/product/gallery";
import { Purchase } from "@/components/product/purchase";
import { ProductGrid, materialLine } from "@/components/product-card";
import { ReviewList } from "@/components/reviews";
import { GiftIcon, ReturnIcon, ShieldIcon, TruckIcon } from "@/components/icons";
import { Breadcrumbs, SectionTitle } from "@/components/ui";

export async function generateStaticParams() {
  const products = await getProducts();
  return products.length > 0 ? products.map((p) => ({ slug: p.slug })) : [{ slug: "__vacio__" }];
}

export async function generateMetadata(props: PageProps<"/manillas/[slug]">): Promise<Metadata> {
  const { slug } = await props.params;
  const product = await getProduct(slug);
  if (!product) return {};
  const image = product.images[0]?.url;
  return {
    title: `${product.name} · Balines en oro 18K`,
    description: `${product.short_description} ${product.price > 0 ? priceLabel(product.price) + "." : ""} Envío a todo Colombia.`,
    alternates: { canonical: `/manillas/${slug}` },
    openGraph: { type: "website", title: product.name, images: image ? [image] : undefined },
  };
}

function details(p: Product) {
  const rows: [string, string][] = [];
  if (p.ball_size_mm) rows.push(["Balín", `${formatNumber(p.ball_size_mm)} mm, oro 18K ley 750`]);
  if (p.ball_count) rows.push(["Cantidad de balines", String(p.ball_count)]);
  if (p.gold_weight_g) rows.push(["Peso del oro", `${formatNumber(p.gold_weight_g)} g`]);
  if (p.length_min_cm && p.length_max_cm) rows.push(["Largo", `Ajustable de ${formatNumber(p.length_min_cm)} a ${formatNumber(p.length_max_cm)} cm`]);
  if (p.closure) rows.push(["Cierre", p.closure]);
  if (p.cord_material) rows.push(["Cordón", p.cord_material]);
  return rows;
}

function productJsonLd(p: Product) {
  const inStock = p.variants.some((v) => v.stock > 0);
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: p.name,
    description: p.short_description,
    image: p.images.map((i) => i.url),
    sku: p.slug,
    material: "Oro 18K ley 750",
    brand: { "@type": "Brand", name: site.name },
    ...(p.price > 0 && {
      offers: {
        "@type": "Offer",
        url: `${site.url}/manillas/${p.slug}`,
        priceCurrency: "COP",
        price: p.price,
        availability: inStock ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      },
    }),
  };
}

export default async function ProductPage(props: PageProps<"/manillas/[slug]">) {
  const { slug } = await props.params;
  const product = await getProduct(slug);
  if (!product) notFound();

  const [all, reviews] = await Promise.all([getProducts(), getReviews(product.id)]);
  const pairs = all.filter((p) => p.id !== product.id).slice(0, 4);
  const rows = details(product);

  return (
    <div className="mx-auto max-w-7xl px-6 pb-20 pt-6">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd(product)).replace(/</g, "\\u003c") }}
      />
      <Breadcrumbs
        items={[{ href: "/", label: "Inicio" }, { href: "/manillas", label: "Manillas" }, { label: product.name }]}
      />

      <div className="mt-6 flex flex-wrap items-start gap-14">
        <div className="min-w-0 flex-[1_1_520px]">
          <Gallery images={product.images} name={product.name} />
        </div>

        <div className="flex min-w-0 flex-[1_1_420px] flex-col gap-6">
          <div className="flex flex-col gap-2">
            {product.badge && (
              <span className="self-start border border-borde px-2 py-1 text-[11px] uppercase tracking-widest">
                {product.badge}
              </span>
            )}
            <h1 className="font-serif text-[clamp(32px,3.4vw,44px)] font-normal">{product.name}</h1>
            <p className="text-[15px] text-suave">
              {materialLine(product)}
              {product.gold_weight_g ? ` · ${formatNumber(product.gold_weight_g)} g de oro` : ""} · con certificado
            </p>
          </div>

          <div className="flex flex-col gap-1.5">
            <p className="text-[26px] font-medium">{priceLabel(product.price)}</p>
            <p className="text-[13px] text-suave">Nequi · PSE · Tarjetas · Efecty, con Mercado Pago</p>
          </div>

          <Purchase product={product} />

          <ul className="grid grid-cols-1 gap-3.5 border-y border-linea py-4.5 text-sm text-texto sm:grid-cols-2">
            <li className="flex items-center gap-2.5">
              <TruckIcon className="size-5 text-oro" />
              Llega en {site.shippingDays}
            </li>
            <li className="flex items-center gap-2.5">
              <ShieldIcon className="size-5 text-oro" />
              Certificado de oro 18K
            </li>
            <li className="flex items-center gap-2.5">
              <ReturnIcon className="size-5 text-oro" />
              {site.warrantyText}
            </li>
            <li className="flex items-center gap-2.5">
              <GiftIcon className="size-5 text-oro" />
              Empaque de regalo incluido
            </li>
          </ul>

          <div className="flex flex-col">
            <details open className="border-b border-linea py-4">
              <summary className="text-base">Descripción</summary>
              <p className="mt-3 whitespace-pre-line text-[15px] leading-[1.7] text-texto">{product.description}</p>
            </details>
            {rows.length > 0 && (
              <details className="border-b border-linea py-4">
                <summary className="text-base">Detalles y medidas</summary>
                <dl className="mt-3 grid grid-cols-[max-content_1fr] gap-x-6 gap-y-2 text-[15px] text-texto">
                  {rows.map(([k, v]) => (
                    <div key={k} className="contents">
                      <dt>{k}</dt>
                      <dd>{v}</dd>
                    </div>
                  ))}
                </dl>
              </details>
            )}
            <details className="border-b border-linea py-4">
              <summary className="text-base">Oro 18K y certificado</summary>
              <p className="mt-3 text-[15px] leading-[1.7] text-texto">
                Los balines son de oro 18K ley 750 (75 % oro puro). Cada manilla sale con certificado de autenticidad
                que indica el peso del oro en gramos.
              </p>
            </details>
            <details className="border-b border-linea py-4">
              <summary className="text-base">Cuidado</summary>
              <p className="mt-3 text-[15px] leading-[1.7] text-texto">
                El oro no se oxida; el cordón es la parte que se desgasta. Quítatela para la piscina y el mar, evita
                perfumes directos y guárdala seca en su bolsa.
              </p>
            </details>
            <details className="border-b border-linea py-4">
              <summary className="text-base">Envío, cambios y retracto</summary>
              <p className="mt-3 text-[15px] leading-[1.7] text-texto">
                Envío en {site.shippingDays} con número de guía. Tienes derecho de retracto en el plazo de ley; las
                piezas personalizadas no aplican. <Link href="/ayuda/cambios-y-retracto">Ver condiciones</Link>
              </p>
            </details>
          </div>
        </div>
      </div>

      {reviews.length > 0 && (
        <section className="mt-22 border-t border-linea pt-14">
          <SectionTitle className="mb-7">Reseñas de esta manilla</SectionTitle>
          <ReviewList reviews={reviews} />
        </section>
      )}

      {pairs.length > 0 && (
        <section className="mt-20">
          <SectionTitle className="mb-7">Combínala con</SectionTitle>
          <ProductGrid products={pairs} />
        </section>
      )}
    </div>
  );
}
