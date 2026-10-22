"use client";

import Link from "next/link";
import { useState } from "react";
import { BagIcon, CloseIcon, MenuIcon } from "./icons";
import { useCart } from "./cart/cart-provider";

export function CartButton() {
  const { count, setOpen } = useCart();
  return (
    <button
      type="button"
      onClick={() => setOpen(true)}
      aria-label={`Bolsa, ${count} ${count === 1 ? "producto" : "productos"}`}
      className="relative flex size-11 items-center justify-center"
    >
      <BagIcon />
      {count > 0 && (
        <span className="absolute right-0.5 top-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-oro px-1 text-[11px] text-white">
          {count}
        </span>
      )}
    </button>
  );
}

export function MobileMenu({ links }: { links: { href: string; label: string }[] }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="lg:hidden">
      <button
        type="button"
        aria-label={open ? "Cerrar menú" : "Abrir menú"}
        aria-expanded={open}
        onClick={() => setOpen(!open)}
        className="flex size-11 items-center justify-center"
      >
        {open ? <CloseIcon /> : <MenuIcon />}
      </button>
      {open && (
        <nav
          aria-label="Menú"
          className="absolute inset-x-0 top-full flex flex-col border-b border-linea bg-crema px-6 py-4"
        >
          {[...links, { href: "/nosotros", label: "Nosotros" }].map((l) => (
            <Link
              key={l.href}
              href={l.href}
              onClick={() => setOpen(false)}
              className="py-3 text-sm uppercase tracking-[0.06em] no-underline"
            >
              {l.label}
            </Link>
          ))}
        </nav>
      )}
    </div>
  );
}
