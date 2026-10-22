import Link from "next/link";
import { site } from "@/lib/site";
import { HELP_PAGES } from "@/lib/help-content";

export function Footer() {
  return (
    <footer className="border-t border-linea bg-crema">
      <div className="mx-auto grid max-w-7xl gap-8 px-6 pb-8 pt-14 sm:grid-cols-2 lg:grid-cols-4">
        <div className="flex flex-col gap-3">
          <p className="font-serif text-[22px] tracking-[0.16em]">CASA D&apos;OR</p>
          <p className="text-sm leading-relaxed text-suave">
            Manillas con balines de oro 18K, tejidas a mano en Fusagasugá, Colombia.
          </p>
          <a href={`https://instagram.com/${site.instagram}`} className="text-sm">
            @{site.instagram}
          </a>
        </div>
        <nav aria-label="Ayuda" className="flex flex-col gap-2.5 text-sm">
          <p className="text-xs uppercase tracking-[0.12em] text-suave">Ayuda</p>
          {HELP_PAGES.filter((p) => p.inFooter).map((p) => (
            <Link key={p.slug} href={`/ayuda/${p.slug}`} className="no-underline">
              {p.title}
            </Link>
          ))}
        </nav>
        <nav aria-label="Casa D'Or" className="flex flex-col gap-2.5 text-sm">
          <p className="text-xs uppercase tracking-[0.12em] text-suave">Casa D&apos;Or</p>
          <Link href="/nosotros" className="no-underline">Nosotros</Link>
          <Link href="/manillas" className="no-underline">Todas las manillas</Link>
          <Link href="/coleccion/personalizadas" className="no-underline">Personaliza la tuya</Link>
          <a href={`https://wa.me/${site.whatsapp}`} className="no-underline">WhatsApp</a>
        </nav>
        <div className="flex flex-col gap-2.5 text-sm text-suave">
          <p className="text-xs uppercase tracking-[0.12em]">Datos del vendedor</p>
          <p>{site.sellerName} · {site.sellerId}</p>
          <p>{site.city}</p>
          <p>{site.email}</p>
          <p>{site.hours}</p>
        </div>
      </div>
      <div className="mx-auto flex max-w-7xl flex-wrap justify-between gap-4 border-t border-linea px-6 py-6 text-[13px] text-suave">
        <div className="flex flex-wrap gap-2">
          {["Nequi", "PSE", "Tarjetas", "Efecty", "Mercado Pago"].map((m) => (
            <span key={m} className="border border-borde px-2.5 py-1">{m}</span>
          ))}
        </div>
        <div className="flex flex-wrap gap-4">
          <span>© Casa D&apos;Or</span>
          <Link href="/ayuda/terminos">Términos</Link>
          <Link href="/ayuda/tratamiento-de-datos">Tratamiento de datos</Link>
        </div>
      </div>
    </footer>
  );
}
