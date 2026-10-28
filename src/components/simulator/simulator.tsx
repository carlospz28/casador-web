"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { BALINES, CORDONES, getBalin, type CordonId } from "@/lib/balines";
import { formatNumber, site, whatsappLink } from "@/lib/site";
import { Bead, BeadArt, BeadDefs, PX_PER_MM, type BeadHandle, type Leaving } from "./bead";

type B = { id: number; n: number; fromX?: number; leaving?: Leaving; frozenX?: number };

const GAP = 2; // px de diseño entre balines (0,2 mm)
const MAX_BALINES = 40;
const MAX_MM = 170; // 17 cm de oro: más que eso ya no cabe en una muñeca
const STAGGER = 230;

const PRESETS = [
  { name: "Clásica", hint: "11 balines #4", seq: Array(11).fill(4) as number[] },
  { name: "Degradé", hint: "del #3 al #6 y de vuelta", seq: [3, 4, 5, 6, 5, 4, 3] },
  { name: "Protagonista", hint: "un #8 en el centro", seq: [4, 4, 4, 4, 8, 4, 4, 4, 4] },
  { name: "Para hombre", hint: "9 balines #6", seq: Array(9).fill(6) as number[] },
];

/** Cuánto se acerca la cámara: lo más cerca posible sin que la manilla se salga. */
function zoomFor(total: number, w: number) {
  const max = w < 640 ? 1.1 : 1.6;
  if (total <= 0 || w <= 0) return max;
  return Math.min(max, (w - 56) / total);
}

function mmOf(n: number) {
  return getBalin(n)?.mm ?? n;
}

function layout(beads: B[]) {
  const xs = new Map<number, number>();
  let cur = 0;
  beads.forEach((b, i) => {
    const d = mmOf(b.n) * PX_PER_MM;
    if (i > 0) cur += GAP;
    xs.set(b.id, cur + d / 2);
    cur += d;
  });
  return { xs, total: cur };
}

/** Mezcla un color con negro (t<0) o blanco (t>0). */
function shade(hex: string, t: number) {
  const v = parseInt(hex.slice(1), 16);
  const ch = [(v >> 16) & 255, (v >> 8) & 255, v & 255].map((c) =>
    Math.round(t < 0 ? c * (1 + t) : c + (255 - c) * t),
  );
  return `rgb(${ch.join(",")})`;
}

/** "#4 ×3 · #6 · #4 ×3" */
function orderText(ns: number[]) {
  const runs: { n: number; k: number }[] = [];
  ns.forEach((n) => {
    const lastRun = runs[runs.length - 1];
    if (lastRun && lastRun.n === n) lastRun.k++;
    else runs.push({ n, k: 1 });
  });
  return runs.map((r) => (r.k > 1 ? `#${r.n} ×${r.k}` : `#${r.n}`)).join(" · ");
}

function countText(ns: number[]) {
  return BALINES.filter((b) => ns.includes(b.n))
    .map((b) => `${ns.filter((n) => n === b.n).length} × #${b.n}`)
    .join(", ");
}

export function Simulator() {
  const [beads, setBeads] = useState<B[]>([]);
  const [calibre, setCalibre] = useState(4);
  const [cordon, setCordon] = useState<CordonId>("negro");
  const [width, setWidth] = useState(0);
  const [reduce, setReduce] = useState(false);
  const [notice, setNotice] = useState("");
  const [started, setStarted] = useState(false);

  const stage = useRef<HTMLDivElement>(null);
  const widthRef = useRef(0);
  const beadsRef = useRef<B[]>([]);
  const nextId = useRef(1);
  const handles = useRef(new Map<number, BeadHandle>());
  const timers = useRef<number[]>([]);
  const initialized = useRef(false);
  const start = useRef(() => {});

  useEffect(() => {
    beadsRef.current = beads;
  }, [beads]);

  // Medir el escenario
  useLayoutEffect(() => {
    const el = stage.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      widthRef.current = entry.contentRect.width;
      setWidth(entry.contentRect.width);
      if (!initialized.current && entry.contentRect.width > 0) {
        initialized.current = true;
        start.current();
      }
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduce(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);


  const active = beads.filter((b) => !b.leaving);
  const { xs, total } = layout(active);
  const k = zoomFor(total, width);
  const ns = active.map((b) => b.n);
  const totalMm = ns.reduce((s, n) => s + mmOf(n), 0);
  const maxR = active.reduce((m, b) => Math.max(m, (mmOf(b.n) * PX_PER_MM) / 2), 0);
  const outX = (width / 2 + 60) / k + total / 2 + 50;
  const grams = ns.every((n) => getBalin(n)?.gramos != null)
    ? ns.reduce((s, n) => s + (getBalin(n)?.gramos ?? 0), 0)
    : null;
  const cord = CORDONES.find((c) => c.id === cordon) ?? CORDONES[0];

  const clearTimers = () => {
    timers.current.forEach((t) => window.clearTimeout(t));
    timers.current = [];
  };

  /** Agrega un balín al final del cordón. Devuelve false si ya no cabe. */
  const add = useCallback(
    (n: number, silent = false) => {
      const current = beadsRef.current.filter((b) => !b.leaving);
      const mm = current.reduce((s, b) => s + mmOf(b.n), 0) + mmOf(n);
      if (current.length >= MAX_BALINES || mm > MAX_MM) {
        setNotice(`Llegaste al máximo: ${MAX_BALINES} balines o ${MAX_MM / 10} cm de oro.`);
        return false;
      }
      const id = nextId.current++;
      setBeads((prev) => {
        const next = [...prev.filter((b) => !b.leaving), { id, n }];
        const T = layout(next).total;
        const z = zoomFor(T, widthRef.current);
        const r = (mmOf(n) * PX_PER_MM) / 2;
        const fromX = (widthRef.current / 2 + 30) / z + T / 2 + r;
        return [...prev, { id, n, fromX }];
      });
      beadsRef.current = [...beadsRef.current, { id, n }];
      if (!silent) setNotice(`Agregaste un balín #${n}. Van ${current.length + 1}.`);
      return true;
    },
    [],
  );

  const markLeaving = useCallback((pick: (active: B[]) => B[], how: Leaving) => {
    setBeads((prev) => {
      const act = prev.filter((b) => !b.leaving);
      const { xs: pos } = layout(act);
      const ids = new Set(pick(act).map((b) => b.id));
      return prev.map((b) => (ids.has(b.id) ? { ...b, leaving: how, frozenX: pos.get(b.id) } : b));
    });
  }, []);

  const removeLast = useCallback(() => {
    const act = beadsRef.current.filter((b) => !b.leaving);
    if (!act.length) return;
    const lastBead = act[act.length - 1];
    markLeaving(() => [lastBead], "out");
    beadsRef.current = beadsRef.current.map((b) => (b.id === lastBead.id ? { ...b, leaving: "out" } : b));
    setNotice(`Quitaste un balín. Quedan ${act.length - 1}.`);
  }, [markLeaving]);

  const removeId = useCallback(
    (id: number) => {
      clearTimers();
      markLeaving((act) => act.filter((b) => b.id === id), "lift");
      const left = beadsRef.current.filter((b) => !b.leaving && b.id !== id).length;
      beadsRef.current = beadsRef.current.map((b) => (b.id === id ? { ...b, leaving: "lift" } : b));
      setNotice(`Quitaste un balín. Quedan ${left}.`);
    },
    [markLeaving],
  );

  const clearAll = useCallback(() => {
    markLeaving((act) => act, "lift");
    beadsRef.current = beadsRef.current.map((b) => ({ ...b, leaving: b.leaving ?? "lift" }));
  }, [markLeaving]);

  const run = useCallback(
    (seq: number[], replace: boolean) => {
      clearTimers();
      const hadBeads = beadsRef.current.some((b) => !b.leaving);
      if (replace) clearAll();
      const wait = replace && hadBeads && !reduce ? 320 : 0;
      const step = reduce ? 0 : STAGGER;
      seq.forEach((n, i) => {
        timers.current.push(window.setTimeout(() => add(n, true), wait + i * step));
      });
    },
    [add, clearAll, reduce],
  );

  const setCount = (target: number) => {
    const act = beadsRef.current.filter((b) => !b.leaving);
    const want = Math.max(0, Math.min(MAX_BALINES, Math.round(target)));
    clearTimers();
    if (want > act.length) {
      run(Array(want - act.length).fill(calibre), false);
    } else {
      const step = reduce ? 0 : 120;
      for (let i = 0; i < act.length - want; i++) {
        timers.current.push(window.setTimeout(removeLast, i * step));
      }
    }
  };

  const onGone = useCallback((id: number) => {
    setBeads((prev) => prev.filter((b) => b.id !== id));
    beadsRef.current = beadsRef.current.filter((b) => b.id !== id);
  }, []);

  const onContact = useCallback((id: number) => {
    const act = beadsRef.current.filter((b) => !b.leaving);
    const i = act.findIndex((b) => b.id === id);
    for (let j = 1; j <= 3 && i - j >= 0; j++) {
      handles.current.get(act[i - j].id)?.nudge(3.2 / j, (j - 1) * 45);
    }
  }, []);

  const register = useCallback((id: number, h: BeadHandle | null) => {
    if (h) handles.current.set(id, h);
    else handles.current.delete(id);
  }, []);

  // Primera carga: el diseño del enlace compartido o la Clásica
  useLayoutEffect(() => {
    start.current = () => {
      const params = new URLSearchParams(window.location.search);
      const fromLink = (params.get("b") ?? "")
        .split(",")
        .map(Number)
        .filter((n) => getBalin(n))
        .slice(0, MAX_BALINES);
      const c = params.get("c");
      if (CORDONES.some((x) => x.id === c)) setCordon(c as CordonId);
      setStarted(true);
      run(fromLink.length ? fromLink : PRESETS[0].seq, false);
    };
  }, [run]);

  useEffect(() => () => clearTimers(), []);

  // El diseño queda en la dirección para poder compartirlo
  const nsKey = ns.join(",");
  useEffect(() => {
    if (!started) return;
    const q = nsKey ? `?b=${nsKey}&c=${cordon}` : `?c=${cordon}`;
    window.history.replaceState(null, "", `${window.location.pathname}${q}`);
  }, [nsKey, cordon, started]);

  const shareUrl = () => {
    return `${window.location.origin}/simulador?b=${nsKey}&c=${cordon}`;
  };

  const waMessage = () =>
    [
      `Hola ${site.name}, armé esta manilla en el simulador:`,
      `• Cordón ${cord.name.toLowerCase()}`,
      `• ${ns.length} ${ns.length === 1 ? "balín" : "balines"}: ${countText(ns)}`,
      `• Orden: ${orderText(ns)}`,
      `• Largo del tramo de oro: ${formatNumber(totalMm / 10)} cm`,
      ``,
      `Mi diseño: ${shareUrl()}`,
      `¿Me la cotizan?`,
    ].join("\n");

  async function copyLink() {
    const url = shareUrl();
    try {
      await navigator.clipboard.writeText(url);
      setNotice("Enlace copiado. Pégalo donde quieras compartir tu diseño.");
    } catch {
      setNotice(`Copia este enlace: ${url}`);
    }
  }

  const rulerMm = Math.floor(total / PX_PER_MM);

  return (
    <div className="flex flex-col gap-8">
      <BeadDefs />

      {/* Escenario */}
      <div
        ref={stage}
        className="relative h-[230px] overflow-hidden sm:h-[320px]"
        style={{
          background:
            "radial-gradient(120% 90% at 22% 12%, #57524b 0%, transparent 55%), radial-gradient(90% 70% at 85% 95%, #3d3934 0%, transparent 60%), linear-gradient(165deg, #3a3631 0%, #24211e 60%, #1b1916 100%)",
        }}
        role="img"
        aria-label={
          ns.length
            ? `Manilla con cordón ${cord.name.toLowerCase()} y ${ns.length} balines: ${orderText(ns)}`
            : "Cordón sin balines"
        }
      >
        {/* Brillo de satín */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-60"
          style={{
            background:
              "linear-gradient(110deg, transparent 20%, rgba(255,255,255,.05) 32%, transparent 44%, transparent 60%, rgba(255,255,255,.04) 70%, transparent 80%)",
          }}
        />

        <div
          className="absolute left-1/2 top-[46%]"
          style={{
            transform: `scale(${k}) translateX(${-total / 2}px)`,
            transition: reduce ? "none" : "transform 900ms cubic-bezier(.45,0,.2,1)",
          }}
        >
          {/* Cordón */}
          <div
            aria-hidden="true"
            className="absolute left-[-4000px] top-[-7px] h-[14px] w-[8000px] rounded-full"
            style={{
              background: `repeating-linear-gradient(118deg, ${shade(cord.hex, 0.18)} 0 2px, ${cord.hex} 2px 6px, ${shade(cord.hex, -0.45)} 6px 8px)`,
              boxShadow: `0 5px 9px rgba(0,0,0,.45), inset 0 2px 1px ${shade(cord.hex, 0.3)}, inset 0 -2px 2px ${shade(cord.hex, -0.5)}`,
              transition: "background 400ms",
            }}
          />

          {/* Regla en milímetros */}
          {total > 0 && (
            <svg
              aria-hidden="true"
              className="absolute left-0 overflow-visible"
              style={{ top: maxR + 22 }}
              width={total}
              height={14}
            >
              <line x1={0} x2={total} y1={0} y2={0} stroke="rgba(243,235,219,.4)" vectorEffect="non-scaling-stroke" />
              {Array.from({ length: rulerMm + 1 }, (_, mm) => (
                <line
                  key={mm}
                  x1={mm * PX_PER_MM}
                  x2={mm * PX_PER_MM}
                  y1={0}
                  y2={mm % 10 === 0 ? 13 : mm % 5 === 0 ? 9 : 5}
                  stroke={mm % 10 === 0 ? "rgba(243,235,219,.7)" : "rgba(243,235,219,.38)"}
                  vectorEffect="non-scaling-stroke"
                />
              ))}
            </svg>
          )}

          {beads.map((b) => {
            const x = b.leaving ? (b.frozenX ?? 0) : (xs.get(b.id) ?? 0);
            return (
              <Bead
                key={b.id}
                id={b.id}
                n={b.n}
                mm={mmOf(b.n)}
                x={x}
                fromX={b.fromX}
                leaving={b.leaving}
                outX={outX}
                reduce={reduce}
                position={active.indexOf(b) + 1}
                onContact={onContact}
                onGone={onGone}
                onRemove={removeId}
                register={register}
              />
            );
          })}
        </div>

        {/* Textos sobre el escenario */}
        <p className="pointer-events-none absolute left-4 top-3.5 text-[11px] uppercase tracking-[0.16em] text-[#d9cdb6] sm:left-6 sm:top-5">
          Vista de frente · medidas en mm
        </p>
        {ns.length > 0 && (
          <p className="pointer-events-none absolute right-4 top-3.5 hidden text-[12px] text-[#bfb29a] sm:right-6 sm:top-5 sm:block">
            Toca un balín para quitarlo
          </p>
        )}
        <p className="pointer-events-none absolute bottom-3.5 left-4 text-sm tabular-nums text-[#f3ebdb] sm:bottom-5 sm:left-6">
          {ns.length === 0
            ? started
              ? "Agrega tu primer balín"
              : ""
            : `${ns.length} ${ns.length === 1 ? "balín" : "balines"} · ${formatNumber(totalMm)} mm de oro`}
        </p>
      </div>

      <div className="grid gap-10 lg:grid-cols-[1.15fr_1fr]">
        {/* Elegir */}
        <div className="flex min-w-0 flex-col gap-8">
          <fieldset className="flex flex-col gap-3">
            <legend className="pb-3 text-sm">
              Calibre del balín: <strong className="font-medium">#{calibre}</strong>
            </legend>
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
              {BALINES.map((b) => {
                const on = b.n === calibre;
                return (
                  <button
                    key={b.n}
                    type="button"
                    aria-pressed={on}
                    onClick={() => setCalibre(b.n)}
                    className={`flex flex-col items-center gap-1.5 border px-2 pb-2.5 pt-3 transition-colors ${
                      on ? "border-tinta bg-blanco" : "border-linea hover:border-borde"
                    }`}
                  >
                    <span className="flex h-12 items-center justify-center">
                      <BeadArt size={b.mm * 5.5} />
                    </span>
                    <span className="text-[15px] font-medium">#{b.n}</span>
                    <span className="text-xs text-suave">{formatNumber(b.mm)} mm</span>
                  </button>
                );
              })}
            </div>
            <p className="text-[13px] text-suave">Todos en oro 18K ley 750, con tallado diamantado. Medidas aproximadas.</p>
          </fieldset>

          <fieldset className="flex flex-col gap-3">
            <legend className="pb-3 text-sm">
              Color del cordón: <strong className="font-medium">{cord.name}</strong>
            </legend>
            <div className="flex flex-wrap gap-2.5">
              {CORDONES.map((c) => {
                const on = c.id === cordon;
                return (
                  <button
                    key={c.id}
                    type="button"
                    aria-label={c.name}
                    aria-pressed={on}
                    onClick={() => setCordon(c.id)}
                    className={`flex size-11 items-center justify-center rounded-full ${
                      on ? "ring-1 ring-tinta ring-offset-2 ring-offset-crema" : ""
                    }`}
                  >
                    <span className="size-[34px] rounded-full border border-borde" style={{ background: c.hex }} />
                  </button>
                );
              })}
            </div>
          </fieldset>

          <div className="flex flex-col gap-3">
            <p className="text-sm">Ideas para empezar</p>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {PRESETS.map((p) => (
                <button
                  key={p.name}
                  type="button"
                  onClick={() => {
                    setNotice(`Armando la ${p.name}.`);
                    run(p.seq, true);
                  }}
                  className="flex flex-col items-start gap-0.5 border border-linea px-3.5 py-3 text-left transition-colors hover:border-tinta"
                >
                  <span className="text-[15px] font-medium">{p.name}</span>
                  <span className="text-xs text-suave">{p.hint}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Resumen */}
        <div className="flex min-w-0 flex-col gap-6 self-start border border-linea bg-arena p-6 sm:p-7">
          <div className="flex flex-col gap-3">
            <p className="text-sm" id="cantidad-label">
              Cantidad de balines
            </p>
            <div className="flex items-stretch" role="group" aria-labelledby="cantidad-label">
              <button
                type="button"
                onClick={removeLast}
                disabled={ns.length === 0}
                aria-label="Quitar el último balín"
                className="flex size-14 items-center justify-center border border-tinta text-2xl leading-none transition-colors hover:bg-tinta hover:text-crema disabled:border-borde disabled:text-borde disabled:hover:bg-transparent"
              >
                −
              </button>
              <input
                id="cantidad"
                type="number"
                inputMode="numeric"
                min={0}
                max={MAX_BALINES}
                value={ns.length}
                onChange={(e) => setCount(Number(e.target.value))}
                aria-label="Cantidad de balines"
                className="h-14 w-20 border-y border-tinta bg-blanco text-center text-xl tabular-nums [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
              />
              <button
                type="button"
                onClick={() => add(calibre)}
                aria-label={`Agregar un balín #${calibre}`}
                className="flex size-14 items-center justify-center bg-tinta text-2xl leading-none text-crema transition-colors hover:bg-[#33302b]"
              >
                +
              </button>
              <button
                type="button"
                onClick={() => {
                  clearTimers();
                  clearAll();
                  setNotice("Quitaste todos los balines.");
                }}
                disabled={ns.length === 0}
                className="ml-auto self-center text-sm underline underline-offset-4 disabled:text-borde disabled:no-underline"
              >
                Vaciar
              </button>
            </div>
            <p className="text-[13px] text-suave">
              El + agrega un balín #{calibre}. Para mezclar tamaños, cambia el calibre antes de agregar.
            </p>
          </div>

          <dl className="grid grid-cols-[auto_1fr] gap-x-5 gap-y-2.5 border-t border-linea pt-5 text-[15px]">
            <dt className="text-suave">Balines</dt>
            <dd className="tabular-nums">{ns.length ? countText(ns) : "—"}</dd>
            <dt className="text-suave">Orden</dt>
            <dd className="break-words">{ns.length ? orderText(ns) : "—"}</dd>
            <dt className="text-suave">Tramo de oro</dt>
            <dd className="tabular-nums">{ns.length ? `${formatNumber(totalMm / 10)} cm` : "—"}</dd>
            <dt className="text-suave">Oro 18K</dt>
            <dd className="tabular-nums">
              {!ns.length ? "—" : grams !== null ? `${formatNumber(Math.round(grams * 100) / 100)} g aprox.` : "Lo confirmamos al cotizar"}
            </dd>
            <dt className="text-suave">Cordón</dt>
            <dd>{cord.name}</dd>
          </dl>

          <div className="flex flex-col gap-2.5">
            {ns.length ? (
              <a
                href={whatsappLink(waMessage())}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-13 items-center justify-center bg-tinta px-6 text-sm uppercase tracking-[0.1em] text-crema no-underline transition-colors hover:bg-[#33302b] hover:text-crema"
              >
                Cotizar por WhatsApp
              </a>
            ) : (
              <span className="inline-flex min-h-13 items-center justify-center bg-borde px-6 text-sm uppercase tracking-[0.1em] text-crema">
                Cotizar por WhatsApp
              </span>
            )}
            <button
              type="button"
              onClick={copyLink}
              disabled={!ns.length}
              className="min-h-12 border border-tinta px-6 text-sm uppercase tracking-[0.1em] transition-colors hover:bg-tinta hover:text-crema disabled:border-borde disabled:text-borde disabled:hover:bg-transparent"
            >
              Copiar enlace del diseño
            </button>
          </div>

          <p role="status" aria-live="polite" className="min-h-5 text-[13px] text-texto">
            {notice}
          </p>

          <p className="text-[13px] leading-relaxed text-suave">
            Los balines van en el centro de la manilla; el resto se teje a mano en macramé y cierra con nudo
            corredizo. Medidas y peso aproximados.
          </p>
        </div>
      </div>
    </div>
  );
}
