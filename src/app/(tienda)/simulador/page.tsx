import type { Metadata } from "next";
import { Simulator } from "@/components/simulator/simulator";
import { Breadcrumbs, Eyebrow } from "@/components/ui";

export const metadata: Metadata = {
  title: "Arma tu manilla",
  description:
    "Elige el calibre de los balines de oro 18K, cuántos quieres y el color del cordón, y mira cómo queda tu manilla antes de pedirla.",
  alternates: { canonical: "/simulador" },
};

export default function SimuladorPage() {
  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-8 px-6 pb-22 pt-6">
      <Breadcrumbs items={[{ href: "/", label: "Inicio" }, { label: "Arma tu manilla" }]} />
      <div className="flex max-w-[640px] flex-col gap-3">
        <Eyebrow>Simulador</Eyebrow>
        <h1 className="font-serif text-[clamp(34px,4vw,48px)] font-normal leading-tight">Arma tu manilla</h1>
        <p className="text-[17px] leading-relaxed text-texto">
          Elige el calibre, agrega los balines que quieras y mira cómo van quedando sobre el cordón. Cuando te guste,
          nos la mandas por WhatsApp y te enviamos el precio.
        </p>
      </div>
      <Simulator />
    </div>
  );
}
