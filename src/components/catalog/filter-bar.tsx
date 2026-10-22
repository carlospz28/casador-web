"use client";

import { usePathname, useRouter } from "next/navigation";
import { useTransition } from "react";
import type { Filters } from "./filters";

type Props = {
  current: Filters;
  colors: string[];
  balls: string[];
  count: number;
};

const selectClass =
  "min-h-11 min-w-40 border border-borde bg-blanco px-2.5 text-sm normal-case tracking-normal text-tinta";
const labelClass = "flex flex-col gap-1 text-xs uppercase tracking-[0.08em] text-suave";

export function FilterBar({ current, colors, balls, count }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const [pending, startTransition] = useTransition();

  function update(key: keyof Filters, value: string) {
    const next = { ...current, [key]: value };
    const params = new URLSearchParams();
    Object.entries(next).forEach(([k, v]) => v && params.set(k, v));
    const qs = params.toString();
    startTransition(() => router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false }));
  }

  return (
    <div
      className="flex flex-wrap items-end justify-between gap-4 border-y border-linea py-3.5"
      aria-busy={pending}
    >
      <div className="flex flex-wrap gap-3">
        {colors.length > 0 && (
          <label className={labelClass}>
            Color de cordón
            <select className={selectClass} value={current.color} onChange={(e) => update("color", e.target.value)}>
              <option value="">Todos</option>
              {colors.map((c) => (
                <option key={c} value={c.toLowerCase()}>
                  {c}
                </option>
              ))}
            </select>
          </label>
        )}
        {balls.length > 1 && (
          <label className={labelClass}>
            Tamaño de balín
            <select className={selectClass} value={current.balin} onChange={(e) => update("balin", e.target.value)}>
              <option value="">Todos</option>
              {balls.map((b) => (
                <option key={b} value={b}>
                  {b.replace(".", ",")} mm
                </option>
              ))}
            </select>
          </label>
        )}
      </div>
      <div className="flex flex-wrap items-end gap-4">
        <span className="pb-3 text-sm text-suave" aria-live="polite">
          {count} {count === 1 ? "manilla" : "manillas"}
        </span>
        <label className={labelClass}>
          Ordenar
          <select className={selectClass} value={current.orden} onChange={(e) => update("orden", e.target.value)}>
            <option value="">Destacadas</option>
            <option value="precio-asc">Precio: menor a mayor</option>
            <option value="precio-desc">Precio: mayor a menor</option>
          </select>
        </label>
      </div>
    </div>
  );
}
