import type { Metadata } from "next";
import { ProductImageBox } from "@/components/product-image";
import { ButtonLink, Eyebrow, SectionTitle } from "@/components/ui";

export const metadata: Metadata = {
  title: "Nosotros",
  description: "Casa D'Or teje a mano manillas con balines de oro 18K en Fusagasugá, Colombia.",
  alternates: { canonical: "/nosotros" },
};

const STEPS = [
  { title: "Elegimos el oro", text: "Balines de oro 18K ley 750. Pesamos el oro de cada pieza y lo anotamos en su certificado." },
  { title: "Tejemos a mano", text: "Cada manilla se teje en el taller de Fusagasugá, una por una, en el color de cordón que elijas." },
  { title: "Revisamos y empacamos", text: "Revisamos nudos y cierre, y la enviamos empacada con su certificado de autenticidad." },
];

export default function NosotrosPage() {
  return (
    <div className="mx-auto max-w-7xl px-6 pb-22 pt-12">
      <div className="flex flex-wrap items-center gap-14">
        <div className="flex min-w-0 flex-[1_1_420px] flex-col gap-5">
          <Eyebrow>Nosotros</Eyebrow>
          <h1 className="font-serif text-[clamp(36px,4vw,52px)] font-normal leading-tight">
            Oro de verdad, tejido a mano en Fusagasugá.
          </h1>
          <p className="text-[17px] leading-[1.7] text-texto">
            [Cuente aquí la historia de Casa D&apos;Or en 3 o 4 líneas: quién la empezó, por qué y qué la hace distinta.]
          </p>
        </div>
        <ProductImageBox
          image={{ id: "nosotros", url: "/fotos/doble-hilera-marmol.jpg", alt: "Manilla Doble Hilera de Casa D'Or sobre mármol", position: 0 }}
          label="manilla sobre mármol"
          sizes="(min-width: 1024px) 50vw, 100vw"
          className="aspect-[4/5] min-w-0 flex-[1_1_420px]"
        />
      </div>

      <section className="mt-22">
        <SectionTitle className="mb-8">Cómo hacemos cada manilla</SectionTitle>
        <ol className="grid gap-6 md:grid-cols-3">
          {STEPS.map((s, i) => (
            <li key={s.title} className="flex flex-col gap-3 border-t border-tinta pt-5">
              <span className="font-serif text-3xl text-oro">{i + 1}</span>
              <h3 className="text-lg font-medium">{s.title}</h3>
              <p className="leading-relaxed text-texto">{s.text}</p>
            </li>
          ))}
        </ol>
      </section>

      <div className="mt-16">
        <ButtonLink href="/manillas">Ver manillas</ButtonLink>
      </div>
    </div>
  );
}
