import Link from "next/link";
import Image from "next/image";
import { getCollections, getProducts, getReviews } from "@/lib/catalog";
import { site, whatsappLink } from "@/lib/site";
import { ProductGrid } from "@/components/product-card";
import { ProductImageBox } from "@/components/product-image";
import { TrustStrip } from "@/components/trust-strip";
import { ReviewList } from "@/components/reviews";
import { ButtonLink, Eyebrow, SectionTitle } from "@/components/ui";

const CORDS = [
  { name: "Negro", hex: "#1C1A17" },
  { name: "Dorado", hex: "#C9A54C" },
  { name: "Rosado", hex: "#E8B4B8" },
  { name: "Rojo", hex: "#A3262A" },
  { name: "Azul", hex: "#1F3A68" },
];

export default async function HomePage() {
  const [products, collections, reviews] = await Promise.all([getProducts(), getCollections(), getReviews()]);
  const featured = (products.some((p) => p.featured) ? products.filter((p) => p.featured) : products).slice(0, 4);
  const usedCovers = new Set<string>(["/fotos/trebol-puesta.jpg"]); // la del inicio no se repite
  const heroImage = { id: "hero", url: "/fotos/trebol-puesta.jpg", alt: "Manilla Trébol de Casa D'Or puesta en la muñeca", position: 0 };

  return (
    <>
      <section className="mx-auto flex max-w-7xl flex-wrap items-center gap-12 px-6 pb-16 pt-12">
        <div className="flex min-w-0 flex-[1_1_420px] flex-col gap-6">
          <Eyebrow>Tejidas a mano en Fusagasugá</Eyebrow>
          <h1 className="font-serif text-[clamp(40px,5vw,64px)] font-normal leading-[1.08]">
            Balines en oro 18K, tejidos para usarse todos los días.
          </h1>
          <p className="max-w-[480px] text-lg leading-relaxed text-texto">
            Cada manilla lleva balines de oro 18K ley 750 sobre cordón tejido a mano. Con certificado de autenticidad
            y el peso del oro en cada ficha.
          </p>
          <div className="flex flex-wrap gap-3">
            <ButtonLink href="/manillas">Ver manillas</ButtonLink>
            <ButtonLink href={whatsappLink(`Hola ${site.name}, quiero información de las manillas.`)} variant="outline">
              Pedir por WhatsApp
            </ButtonLink>
          </div>
        </div>
        <ProductImageBox
          image={heroImage}
          label="manilla puesta en la muñeca, luz natural"
          sizes="(min-width: 1024px) 50vw, 100vw"
          priority
          className="aspect-[4/5] max-h-[640px] min-w-0 flex-[1_1_420px]"
        />
      </section>

      <TrustStrip />

      <section className="mx-auto max-w-7xl px-6 pb-6 pt-20">
        <SectionTitle className="mb-8">Encuentra la tuya</SectionTitle>
        <div className="grid grid-cols-2 gap-5 lg:grid-cols-4">
          {collections.map((c) => {
            // Una foto distinta por colección: la primera que no se haya usado ya.
            const cover =
              products
                .filter((p) => p.collections.includes(c.slug))
                .flatMap((p) => p.images)
                .find((img) => !usedCovers.has(img.url)) ?? null;
            if (cover) usedCovers.add(cover.url);
            return (
              <Link key={c.id} href={`/coleccion/${c.slug}`} className="group flex flex-col gap-3.5 no-underline">
                <ProductImageBox image={cover} label={c.name.toLowerCase()} sizes="(min-width: 1024px) 25vw, 50vw" />
                <span className="text-[15px] uppercase tracking-[0.08em] group-hover:underline">{c.name}</span>
              </Link>
            );
          })}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-18">
        <div className="mb-8 flex flex-wrap items-baseline justify-between gap-4">
          <SectionTitle>Las más pedidas</SectionTitle>
          <Link href="/manillas" className="text-sm uppercase tracking-[0.08em]">
            Ver todas
          </Link>
        </div>
        <ProductGrid products={featured} />
      </section>

      <section className="border-y border-linea bg-arena">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-12 px-6 py-18">
          <div className="min-w-0 flex-[1_1_360px]">
            <SectionTitle className="mb-4">Cinco colores de cordón</SectionTitle>
            <p className="max-w-[440px] text-[17px] leading-relaxed text-texto">
              Elige el color en cada manilla. Si quieres combinar dos colores o una medida especial, escríbenos y la
              tejemos para ti.
            </p>
          </div>
          <ul className="grid min-w-0 flex-[1_1_480px] grid-cols-5 gap-4">
            {CORDS.map((c) => (
              <li key={c.name} className="flex flex-col items-center gap-2.5">
                <span className="size-14 rounded-full border border-borde sm:size-16" style={{ background: c.hex }} />
                <span className="text-sm">{c.name}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="bg-tinta text-[#F3EBDB]">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-12 px-6 py-18">
          <div className="flex min-w-0 flex-[1_1_340px] flex-col gap-4">
            <p className="text-[13px] uppercase tracking-[0.16em] text-oro-claro">Nuestros balines</p>
            <h2 className="font-serif text-3xl font-normal sm:text-4xl">Del #3 al #8, tallados en oro 18K.</h2>
            <p className="text-[17px] leading-relaxed text-[#D9CDB6]">
              Cada balín tiene un tallado que refleja la luz. Elige un tamaño discreto para el día a día o uno grande
              que se note. Si quieres un tamaño en especial, pídelo en tu manilla personalizada.
            </p>
            <Link href="/coleccion/personalizadas" className="self-start text-sm uppercase tracking-[0.08em] text-[#F3EBDB] hover:text-oro-claro">
              Personaliza la tuya
            </Link>
          </div>
          <div className="relative aspect-[1272/832] min-w-0 flex-[1.4_1_480px] overflow-hidden">
            <Image
              src="/fotos/tamanos-de-balin.jpg"
              alt="Balines de oro 18K tallados en tamaños del #3 al #8"
              fill
              sizes="(min-width: 1024px) 60vw, 100vw"
              className="object-cover"
            />
          </div>
        </div>
      </section>

      <section className="mx-auto flex max-w-7xl flex-wrap items-center gap-14 px-6 py-22">
        <ProductImageBox
          image={{ id: "taller", url: "/fotos/doble-hilera-puesta.jpg", alt: "Manilla Doble Hilera tejida a mano, puesta en la muñeca", position: 0 }}
          label="detalle del tejido"
          sizes="(min-width: 1024px) 50vw, 100vw"
          className="aspect-[4/5] max-h-[620px] min-w-0 flex-[1_1_420px]"
        />
        <div className="flex min-w-0 flex-[1_1_420px] flex-col gap-5">
          <Eyebrow>Del taller a tu muñeca</Eyebrow>
          <SectionTitle className="leading-tight">Oro de verdad, tejido a mano, sin producción en serie.</SectionTitle>
          <p className="text-[17px] leading-[1.7] text-texto">
            Tejemos cada manilla en Fusagasugá con balines de oro 18K ley 750. Cada pieza sale con su certificado de
            autenticidad y el peso del oro en gramos, para que sepas exactamente qué estás comprando.
          </p>
          <Link href="/nosotros" className="self-start text-sm uppercase tracking-[0.08em]">
            Conoce cómo las hacemos
          </Link>
        </div>
      </section>

      {reviews.length > 0 && (
        <section className="mx-auto max-w-7xl px-6 pb-22">
          <SectionTitle className="mb-8">Lo que dicen nuestros clientes</SectionTitle>
          <ReviewList reviews={reviews.slice(0, 3)} />
        </section>
      )}

      <section className="bg-tinta text-[#F3EBDB]">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-6 px-6 py-16">
          <div className="min-w-0 flex-[1_1_420px]">
            <h2 className="mb-2.5 font-serif text-3xl font-normal">¿Quieres una pieza a tu medida?</h2>
            <p className="text-[#D9CDB6]">Cuéntanos colores, medida o iniciales y te enviamos el precio.</p>
          </div>
          <ButtonLink
            href={whatsappLink(`Hola ${site.name}, quiero una manilla personalizada.`)}
            variant="light"
          >
            Escribir por WhatsApp
          </ButtonLink>
        </div>
      </section>
    </>
  );
}
