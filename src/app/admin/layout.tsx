import type { Metadata } from "next";
import Link from "next/link";
import { hasSupabase } from "@/lib/supabase/env";
import { signOut } from "./login/actions";

export const metadata: Metadata = {
  title: "Admin",
  robots: { index: false, follow: false },
};

const LINKS = [
  { href: "/admin", label: "Productos" },
  { href: "/admin/pedidos", label: "Pedidos" },
  { href: "/admin/resenas", label: "Reseñas" },
];

export default function AdminLayout({ children }: LayoutProps<"/admin">) {
  return (
    <div className="min-h-screen bg-[#F7F4EE]">
      <header className="border-b border-linea bg-crema">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-6 py-3">
          <div className="flex flex-wrap items-center gap-6">
            <Link href="/admin" className="font-serif text-xl tracking-[0.14em] no-underline">
              CASA D&apos;OR · admin
            </Link>
            <nav className="flex gap-4 text-sm">
              {LINKS.map((l) => (
                <Link key={l.href} href={l.href} className="no-underline">
                  {l.label}
                </Link>
              ))}
            </nav>
          </div>
          <div className="flex items-center gap-4 text-sm">
            <Link href="/" target="_blank">
              Ver tienda
            </Link>
            <form action={signOut}>
              <button type="submit" className="underline">
                Salir
              </button>
            </form>
          </div>
        </div>
      </header>
      <div className="mx-auto max-w-6xl px-6 py-8">
        {hasSupabase ? (
          children
        ) : (
          <p className="border border-borde bg-crema p-6">
            Conecte Supabase para usar el panel: ponga <code>NEXT_PUBLIC_SUPABASE_URL</code> y{" "}
            <code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code> en <code>.env.local</code>. Los pasos están en el README.
          </p>
        )}
      </div>
    </div>
  );
}
