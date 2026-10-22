import Link from "next/link";
import { announcement } from "@/lib/site";
import { CartButton, MobileMenu } from "./header-client";

export const NAV = [
  { href: "/manillas", label: "Manillas" },
  { href: "/coleccion/para-hombre", label: "Para hombre" },
  { href: "/coleccion/personalizadas", label: "Personalizadas" },
  { href: "/coleccion/regalos", label: "Regalos" },
];

export function Header() {
  return (
    <>
      <div className="bg-tinta px-4 py-2.5 text-center text-[13px] tracking-wide text-[#F3EBDB]">
        {announcement()}
      </div>
      <header className="sticky top-0 z-40 border-b border-linea bg-crema/95 backdrop-blur">
        <div className="mx-auto grid max-w-7xl grid-cols-[1fr_auto_1fr] items-center gap-4 px-4 py-3 sm:px-6 sm:py-4">
          <div className="flex items-center">
            <MobileMenu links={NAV} />
            <nav aria-label="Principal" className="hidden gap-6 text-sm uppercase tracking-[0.06em] lg:flex">
              {NAV.map((l) => (
                <Link key={l.href} href={l.href} className="no-underline">
                  {l.label}
                </Link>
              ))}
            </nav>
          </div>
          <Link
            href="/"
            className="font-serif text-2xl font-medium tracking-[0.18em] no-underline sm:text-[28px]"
          >
            CASA D&apos;OR
          </Link>
          <div className="flex items-center justify-end gap-1">
            <Link
              href="/nosotros"
              className="hidden px-2 text-sm uppercase tracking-[0.06em] no-underline lg:inline"
            >
              Nosotros
            </Link>
            <CartButton />
          </div>
        </div>
      </header>
    </>
  );
}
