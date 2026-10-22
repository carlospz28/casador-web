import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";

const btn =
  "inline-flex min-h-13 items-center justify-center px-8 text-sm uppercase tracking-[0.1em] no-underline transition-colors";

export function ButtonLink({
  variant = "solid",
  className = "",
  ...props
}: ComponentProps<typeof Link> & { variant?: "solid" | "outline" | "light" }) {
  const styles = {
    solid: "bg-tinta text-crema hover:bg-[#33302b] hover:text-crema",
    outline: "border border-tinta text-tinta hover:bg-tinta hover:text-crema",
    light: "bg-[#F3EBDB] text-tinta hover:bg-white hover:text-tinta",
  }[variant];
  return <Link className={`${btn} ${styles} ${className}`} {...props} />;
}

export function Eyebrow({ children }: { children: ReactNode }) {
  return <p className="text-[13px] uppercase tracking-[0.16em] text-oro">{children}</p>;
}

export function SectionTitle({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <h2 className={`font-serif text-3xl font-normal sm:text-4xl ${className}`}>{children}</h2>;
}

export function Breadcrumbs({ items }: { items: { href?: string; label: string }[] }) {
  return (
    <nav aria-label="Ruta" className="flex flex-wrap gap-2 text-[13px] text-suave">
      {items.map((item, i) => (
        <span key={item.label} className="flex gap-2">
          {i > 0 && <span aria-hidden="true">/</span>}
          {item.href ? (
            <Link href={item.href} className="text-suave">
              {item.label}
            </Link>
          ) : (
            <span aria-current="page">{item.label}</span>
          )}
        </span>
      ))}
    </nav>
  );
}
