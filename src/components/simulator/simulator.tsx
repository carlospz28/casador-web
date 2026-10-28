"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { BALINES, CORDONES, getBalin, type CordonId } from "@/lib/balines";
import { formatNumber, site, whatsappLink } from "@/lib/site";
import { Bead, BeadArt, BeadDefs, PX_PER_MM, type BeadHandle, type Leaving } from "./bead";
import { CircleView, ringSize } from "./circle-view";

type Side = "left" | "right";
type B = { id: number; n: number; fromX?: number; drop?: boolean; leaving?: Leaving; frozenX?: number; outSide?: Side };
type Vista = "armando" | "terminada";
type Escala = "real" | "cerca";
type Fondo = "terciopelo" | "seda";

const GRANO =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='180' height='180'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.85' numOctaves='2' stitchTiles='stitch'/%3E%3CfeColorMatrix values='0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 .55 0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")";

/** Los dos fondos: terciopelo de vitrina con luz desde arriba, o seda champaña como en las fotos. */
const FONDOS: Record<
  Fondo,
  { name: string; bg: string; grain: number; frame: string; label: string; text: string; ruler: string; tick: string; vars: Record<string, string> }
> = {
  terciopelo: {
    name: "Terciopelo",
    bg: "radial-gradient(ellipse 50% 55% at 50% 44%, rgba(132,104,78,.38) 0%, transparent 72%), radial-gradient(ellipse 130% 100% at 50% -10%, #2e2620 0%, #191410 55%, #0d0a08 100%)",
    grain: 0.32,
    frame: "rgba(201,165,76,.26)",
    label: "#cbbd9f",
    text: "#f3ebdb",
    ruler: "rgba(243,235,219,.38)",
    tick: "rgba(243,235,219,.72)",
    vars: { "--cd-sombra": "rgba(0,0,0,.6)", "--cd-marca": "#F3EBDB" },
  },
  seda: {
    name: "Seda",
    bg: "radial-gradient(ellipse 60% 55% at 46% 40%, rgba(255,250,240,.65) 0%, transparent 70%), linear-gradient(118deg, #eadcc5 0%, #d6c2a3 13%, #f3eadb 26%, #dccab0 39%, #f1e7d6 51%, #cfba98 65%, #ece0cc 79%, #d8c6a9 100%)",
    grain: 0.12,
    frame: "rgba(138,106,31,.32)",
    label: "#6b5a3f",
    text: "#2b241c",
    ruler: "rgba(70,52,28,.4)",
    tick: "rgba(70,52,28,.75)",
    vars: { "--cd-sombra": "rgba(70,45,10,.38)", "--cd-marca": "#1C1A17" },
  },
};

const GAP = 2; // px de diseño entre balines (0,2 mm)
const MAX_BALINES = 60;
const MAX_MM = 170; // 17 cm de oro: más que eso ya no cabe en una muñeca
const STAGGER = 230;
const CSS_PX_PER_MM = 96 / 25.4;
const CALIBRATION_KEY = "casador-px-por-mm";
const CARD_MM = 53.98; // lado corto de una tarjeta débito, crédito o cédula

const PRESETS = [
  { name: "Clásica", hint: "11 balines #4", seq: Array(11).fill(4) as number[] },
  { name: "Degradé", hint: "del #3 al #6 y de vuelta", seq: [3, 4, 5, 6, 5, 4, 3] },
  { name: "Protagonista", hint: "un #8 en el centro", seq: [4, 4, 4, 4, 8, 4, 4, 4, 4] },
  { name: "Para hombre", hint: "9 balines #6", seq: Array(9).fill(6) as number[] },
];

/**
 * Escala del escenario (px de pantalla por px de diseño).
 * "real": cada mm del balín mide un mm en la pantalla. "cerca": lo más grande que quepa.
 * Si la manilla no cabe, se reduce y se avisa.
 */
function zoomFor(total: number, w: number, escala: Escala, pxPerMm: number) {
  const max = escala === "real" ? pxPerMm / PX_PER_MM : w < 640 ? 1.1 : 1.6;
  if (total <= 0 || w <= 0) return { k: max, fitted: false };
  const fit = (w - 40) / total;
  return fit < max ? { k: fit, fitted: true } : { k: max, fitted: false };
}

/** Píxeles por mm que suele tener cada tipo de pantalla, mientras el cliente no calibre. */
function guessPxPerMm() {
  const coarse = window.matchMedia("(pointer: coarse)").matches;
  const short = Math.min(window.screen.width, window.screen.height);
  if (coarse && short < 600) return 6; // celulares
  if (coarse) return 5.2; // tabletas
  return CSS_PX_PER_MM; // computadores
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
  const [vista, setVista] = useState<Vista>("armando");
  const [escala, setEscala] = useState<Escala>("real");
  const [pxPerMm, setPxPerMm] = useState(CSS_PX_PER_MM);
  const [calibrated, setCalibrated] = useState(false);
  const [calibrando, setCalibrando] = useState(false);
  const [height, setHeight] = useState(0);
  const [fondo, setFondo] = useState<Fondo>("terciopelo");
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const stage = useRef<HTMLDivElement>(null);
  const widthRef = useRef(0);
  const beadsRef = useRef<B[]>([]);
  const nextId = useRef(1);
  const handles = useRef(new Map<number, BeadHandle>());
  const timers = useRef<number[]>([]);
  const initialized = useRef(false);
  const start = useRef(() => {});
  const scaleRef = useRef({ escala: "real" as Escala, pxPerMm: CSS_PX_PER_MM });

  useEffect(() => {
    scaleRef.current = { escala, pxPerMm };
  }, [escala, pxPerMm]);

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
      setHeight(entry.contentRect.height);
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
  const { k, fitted } = zoomFor(total, width, escala, pxPerMm);
  const ns = active.map((b) => b.n);
  const totalMm = ns.reduce((s, n) => s + mmOf(n), 0);
  const maxR = active.reduce((m, b) => Math.max(m, (mmOf(b.n) * PX_PER_MM) / 2), 0);
  const outRightX = (width / 2 + 60) / k + total / 2 + 50;
  const outLeftX = -(width / 2 + 60) / k + total / 2 - 50;
  const grams = ns.every((n) => getBalin(n)?.gramos != null)
    ? ns.reduce((s, n) => s + (getBalin(n)?.gramos ?? 0), 0)
    : null;
  const cord = CORDONES.find((c) => c.id === cordon) ?? CORDONES[0];

  const clearTimers = () => {
    timers.current.forEach((t) => window.clearTimeout(t));
    timers.current = [];
  };

  /** Agrega un balín por una punta del cordón. Devuelve false si ya no cabe. */
  const add = useCallback(
    (n: number, side: Side = "right", silent = false) => {
      const current = beadsRef.current.filter((b) => !b.leaving);
      const mm = current.reduce((s, b) => s + mmOf(b.n), 0) + mmOf(n);
      if (current.length >= MAX_BALINES || mm > MAX_MM) {
        setNotice(`Llegaste al máximo: ${MAX_BALINES} balines o ${MAX_MM / 10} cm de oro.`);
        return false;
      }
      const id = nextId.current++;
      setBeads((prev) => {
        const act = prev.filter((b) => !b.leaving);
        const next = side === "left" ? [{ id, n }, ...act] : [...act, { id, n }];
        const T = layout(next).total;
        const { k: z } = zoomFor(T, widthRef.current, scaleRef.current.escala, scaleRef.current.pxPerMm);
        const r = (mmOf(n) * PX_PER_MM) / 2;
        const edge = (widthRef.current / 2 + 30) / z;
        const fromX = side === "left" ? -edge + T / 2 - r : edge + T / 2 + r;
        const bead = { id, n, fromX };
        return side === "left" ? [bead, ...prev] : [...prev, bead];
      });
      beadsRef.current = side === "left" ? [{ id, n }, ...beadsRef.current] : [...beadsRef.current, { id, n }];
      if (!silent) {
        setNotice(`Agregaste un balín #${n} a la ${side === "left" ? "izquierda" : "derecha"}. Van ${current.length + 1}.`);
      }
      return true;
    },
    [],
  );

  /** ¿Cabe un balín #n más? (si se cambia uno, se descuenta el que sale) */
  const fits = useCallback((n: number, replacing?: number) => {
    const current = beadsRef.current.filter((b) => !b.leaving && b.id !== replacing);
    const mm = current.reduce((s, b) => s + mmOf(b.n), 0) + mmOf(n);
    if (current.length >= MAX_BALINES || mm > MAX_MM) {
      setNotice(`Llegaste al máximo: ${MAX_BALINES} balines o ${MAX_MM / 10} cm de oro.`);
      return false;
    }
    return true;
  }, []);

  /** Mete un balín en una posición del medio: cae desde arriba y los vecinos le abren campo. */
  const insertAt = useCallback(
    (index: number, n: number, replacing?: number) => {
      if (!fits(n, replacing)) return null;
      const id = nextId.current++;
      const place = (list: B[]) => {
        const act = list.filter((b) => !b.leaving && b.id !== replacing);
        const anchor = act[index];
        const out = [...list];
        const at = anchor ? out.indexOf(anchor) : out.length;
        out.splice(at, 0, { id, n, drop: true });
        return out;
      };
      setBeads(place);
      beadsRef.current = place(beadsRef.current);
      return id;
    },
    [fits],
  );

  const markLeaving = useCallback((pick: (active: B[]) => B[], how: Leaving, outSide?: Side) => {
    setBeads((prev) => {
      const act = prev.filter((b) => !b.leaving);
      const { xs: pos } = layout(act);
      const ids = new Set(pick(act).map((b) => b.id));
      return prev.map((b) => (ids.has(b.id) ? { ...b, leaving: how, frozenX: pos.get(b.id), outSide } : b));
    });
  }, []);

  /** Saca el balín de una punta: se va deslizando por el cordón. */
  const removeEnd = useCallback(
    (side: Side) => {
      const act = beadsRef.current.filter((b) => !b.leaving);
      if (!act.length) return;
      const target = side === "left" ? act[0] : act[act.length - 1];
      markLeaving(() => [target], "out", side);
      beadsRef.current = beadsRef.current.map((b) => (b.id === target.id ? { ...b, leaving: "out" } : b));
      setNotice(`Quitaste el balín de la ${side === "left" ? "izquierda" : "derecha"}. Quedan ${act.length - 1}.`);
    },
    [markLeaving],
  );
  const removeLast = useCallback(() => removeEnd("right"), [removeEnd]);

  const removeId = useCallback(
    (id: number) => {
      clearTimers();
      setSelectedId((s) => (s === id ? null : s));
      markLeaving((act) => act.filter((b) => b.id === id), "lift");
      const left = beadsRef.current.filter((b) => !b.leaving && b.id !== id).length;
      beadsRef.current = beadsRef.current.map((b) => (b.id === id ? { ...b, leaving: "lift" } : b));
      setNotice(`Quitaste un balín. Quedan ${left}.`);
    },
    [markLeaving],
  );

  const clearAll = useCallback(() => {
    setSelectedId(null);
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
        timers.current.push(window.setTimeout(() => add(n, "right", true), wait + i * step));
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

  // Cuando un balín llega, empuja un poquito a los vecinos (como bolitas de Newton)
  const zoomRef = useRef(1);
  const onContact = useCallback((id: number, dir: "left" | "right" | "both") => {
    const act = beadsRef.current.filter((b) => !b.leaving);
    const i = act.findIndex((b) => b.id === id);
    const push = Math.max(3.2, 1.6 / zoomRef.current);
    // "left": llegó por la izquierda y empuja hacia la derecha; "right" al revés; "both": cayó en medio
    const sides = dir === "both" ? [1, -1] : dir === "left" ? [1] : [-1];
    for (const s of sides) {
      for (let j = 1; j <= 3; j++) {
        const neighbor = act[i + s * j];
        if (!neighbor) break;
        handles.current.get(neighbor.id)?.nudge((-s * push) / j, (j - 1) * 45);
      }
    }
  }, []);
  useEffect(() => {
    zoomRef.current = k;
  }, [k]);

  const register = useCallback((id: number, h: BeadHandle | null) => {
    if (h) handles.current.set(id, h);
    else handles.current.delete(id);
  }, []);

  // Primera carga: el diseño del enlace compartido o la Clásica
  useLayoutEffect(() => {
    start.current = () => {
      let saved = 0;
      try {
        saved = Number(window.localStorage.getItem(CALIBRATION_KEY)) || 0;
      } catch {
        saved = 0;
      }
      setPxPerMm(saved > 1 ? saved : guessPxPerMm());
      setCalibrated(saved > 1);
      const params = new URLSearchParams(window.location.search);
      const fromLink = (params.get("b") ?? "")
        .split(",")
        .map(Number)
        .filter((n) => getBalin(n))
        .slice(0, MAX_BALINES);
      const c = params.get("c");
      if (CORDONES.some((x) => x.id === c)) setCordon(c as CordonId);
      setStarted(true);
      if (params.get("v") === "terminada") setVista("terminada");
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

  // Balín seleccionado (si se fue, no hay selección)
  const selIndex = active.findIndex((b) => b.id === selectedId);
  const selBead = selIndex >= 0 ? active[selIndex] : null;
  const toggleSelect = useCallback((id: number) => setSelectedId((s) => (s === id ? null : id)), []);

  function addCenter() {
    const act = beadsRef.current.filter((b) => !b.leaving);
    if (!act.length) {
      add(calibre, "right");
      return;
    }
    if (insertAt(Math.floor(act.length / 2), calibre) !== null) {
      setNotice(`Metiste un balín #${calibre} en el centro. Van ${act.length + 1}.`);
    }
  }

  function addNextTo(side: Side) {
    if (!selBead) return;
    const at = side === "left" ? selIndex : selIndex + 1;
    if (insertAt(at, calibre) !== null) {
      setNotice(`Metiste un balín #${calibre} a la ${side === "left" ? "izquierda" : "derecha"} del seleccionado.`);
    }
  }

  function swapSelected() {
    if (!selBead) return;
    if (selBead.n === calibre) {
      setNotice(`Ese balín ya es #${calibre}. Elige otro calibre arriba para cambiarlo.`);
      return;
    }
    const newId = insertAt(selIndex, calibre, selBead.id);
    if (newId === null) return;
    markLeaving((act) => act.filter((b) => b.id === selBead.id), "lift");
    beadsRef.current = beadsRef.current.map((b) => (b.id === selBead.id ? { ...b, leaving: "lift" } : b));
    setSelectedId(newId);
    setNotice(`Cambiaste el #${selBead.n} por un #${calibre}.`);
  }

  // Manilla terminada: cuántos px por mm caben en el escenario
  const ringBeads = active.map((b) => ({ id: b.id, mm: mmOf(b.n) }));
  const ring = ringSize(ringBeads);
  const ringMax = escala === "real" ? pxPerMm : 9;
  const ringFit = Math.min((height - 70) / ring.h, (width - 6) / ring.w);
  const ringPx = height > 0 && width > 0 ? Math.min(ringMax, ringFit) : ringMax;
  const ringFitted = escala === "real" && ringPx < pxPerMm - 0.01;
  const shownFitted = vista === "armando" ? fitted : ringFitted;

  function saveCalibration() {
    try {
      window.localStorage.setItem(CALIBRATION_KEY, String(pxPerMm));
    } catch {
      // sin almacenamiento: la calibración dura mientras la página esté abierta
    }
    setCalibrated(true);
    setCalibrando(false);
    setEscala("real");
    setNotice("Listo. Ahora los balines se ven de su tamaño real en tu pantalla.");
  }

  const F = FONDOS[fondo];

  const seg = (on: boolean) =>
    `min-h-10 px-3.5 text-[13px] uppercase tracking-[0.08em] transition-colors ${
      on ? "bg-tinta text-crema" : "text-tinta hover:bg-lino"
    }`;

  return (
    <div className="flex flex-col gap-8">
      <BeadDefs />

      <div className="flex flex-col gap-3">
        {/* Barra del escenario */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex border border-tinta" role="group" aria-label="Vista">
            <button type="button" aria-pressed={vista === "armando"} onClick={() => setVista("armando")} className={seg(vista === "armando")}>
              Armando
            </button>
            <button type="button" aria-pressed={vista === "terminada"} onClick={() => setVista("terminada")} className={seg(vista === "terminada")}>
              Terminada
            </button>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex border border-borde" role="group" aria-label="Fondo">
              {(Object.keys(FONDOS) as Fondo[]).map((f) => (
                <button key={f} type="button" aria-pressed={fondo === f} onClick={() => setFondo(f)} className={seg(fondo === f)}>
                  {FONDOS[f].name}
                </button>
              ))}
            </div>
            <div className="flex border border-borde" role="group" aria-label="Tamaño">
              <button type="button" aria-pressed={escala === "real"} onClick={() => setEscala("real")} className={seg(escala === "real")}>
                Tamaño real
              </button>
              <button type="button" aria-pressed={escala === "cerca"} onClick={() => setEscala("cerca")} className={seg(escala === "cerca")}>
                De cerca
              </button>
            </div>
            <button
              type="button"
              aria-expanded={calibrando}
              onClick={() => setCalibrando((v) => !v)}
              className="text-[13px] underline underline-offset-4"
            >
              {calibrated ? "Calibrar de nuevo" : "Calibrar pantalla"}
            </button>
          </div>
        </div>

        {calibrando && (
          <div className="flex flex-col gap-4 border border-linea bg-blanco p-5">
            <p className="max-w-[560px] text-[15px] leading-relaxed">
              Pon el <strong className="font-medium">lado corto</strong> de una tarjeta (débito, crédito o tu cédula)
              sobre la línea dorada y mueve la barra hasta que la línea mida lo mismo que la tarjeta.
            </p>
            <div className="overflow-hidden">
              <div
                className="relative h-9 border-x-2 border-oro-claro"
                style={{ width: CARD_MM * pxPerMm, maxWidth: "100%" }}
                aria-hidden="true"
              >
                <span className="absolute inset-x-0 top-1/2 h-[3px] -translate-y-1/2 bg-oro-claro" />
              </div>
            </div>
            <label htmlFor="calibracion" className="text-sm">
              Ajuste
            </label>
            <input
              id="calibracion"
              type="range"
              min={2.5}
              max={9}
              step={0.01}
              value={pxPerMm}
              onChange={(e) => setPxPerMm(Number(e.target.value))}
              className="w-full max-w-[420px] accent-[#8a6a1f]"
            />
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={saveCalibration}
                className="min-h-11 bg-tinta px-6 text-sm uppercase tracking-[0.1em] text-crema hover:bg-[#33302b]"
              >
                Guardar
              </button>
              <button type="button" onClick={() => setCalibrando(false)} className="min-h-11 px-3 text-sm underline underline-offset-4">
                Cancelar
              </button>
            </div>
          </div>
        )}

        {/* Escenario */}
        <div
          ref={stage}
          className={`relative overflow-hidden transition-[height] duration-500 ${
            vista === "armando" ? "h-[230px] sm:h-[320px]" : "h-[480px] sm:h-[460px]"
          }`}
          style={{ background: F.bg, transition: "background 500ms", ...F.vars } as React.CSSProperties}
          role="img"
          aria-label={
            ns.length
              ? `Manilla ${vista === "terminada" ? "terminada" : "armándose"} con cordón ${cord.name.toLowerCase()} y ${ns.length} balines: ${orderText(ns)}`
              : "Cordón sin balines"
          }
        >
          {/* Grano de la tela, viñeta y un filete fino como de estuche de joyería */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 mix-blend-multiply"
            style={{ backgroundImage: GRANO, opacity: F.grain }}
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0"
            style={{ background: "radial-gradient(ellipse 85% 80% at 50% 45%, transparent 55%, rgba(0,0,0,.28) 100%)" }}
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-2.5 border sm:inset-3.5"
            style={{ borderColor: F.frame }}
          />

          {/* Vista armando: el cordón recto */}
          <div
            className={`absolute inset-0 transition-opacity duration-500 ${vista === "armando" ? "opacity-100" : "pointer-events-none opacity-0"}`}
            aria-hidden={vista !== "armando"}
          >
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
                className="absolute left-[-6000px] top-[-6px] h-[12px] w-[12000px] rounded-full"
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
                  style={{ top: maxR + Math.max(22, 10 / k) }}
                  width={total}
                  height={14}
                >
                  <line x1={0} x2={total} y1={0} y2={0} stroke={F.ruler} vectorEffect="non-scaling-stroke" />
                  {Array.from({ length: rulerMm + 1 }, (_, mm) => (
                    <line
                      key={mm}
                      x1={mm * PX_PER_MM}
                      x2={mm * PX_PER_MM}
                      y1={0}
                      y2={(mm % 10 === 0 ? 13 : mm % 5 === 0 ? 9 : 5) * Math.max(1, 0.5 / k)}
                      stroke={mm % 10 === 0 ? F.tick : F.ruler}
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
                    drop={b.drop}
                    selected={b.id === selectedId}
                    leaving={b.leaving}
                    outX={b.outSide === "left" ? outLeftX : outRightX}
                    zoom={k}
                    reduce={reduce}
                    position={active.indexOf(b) + 1}
                    onContact={onContact}
                    onGone={onGone}
                    onSelect={toggleSelect}
                    register={register}
                  />
                );
              })}
            </div>
          </div>

          {/* Vista terminada: la manilla cerrada */}
          {vista === "terminada" && (
            <div className="absolute inset-0 flex items-center justify-center pt-4">
              <CircleView
                beads={ringBeads}
                hex={cord.hex}
                pxPerMm={ringPx}
                reduce={reduce}
                selectedId={selectedId}
                onSelect={toggleSelect}
              />
            </div>
          )}

          {/* Textos sobre el escenario */}
          <p
            className="pointer-events-none absolute left-5 top-5 text-[11px] uppercase tracking-[0.16em] sm:left-7 sm:top-6"
            style={{ color: F.label }}
          >
            {escala === "real" ? (shownFitted ? "Reducida para que quepa" : "Tamaño real") : "Vista de cerca"}
            {vista === "armando" ? " · regla en mm" : ""}
          </p>
          {ns.length > 0 && (
            <p
              className="pointer-events-none absolute right-7 top-6 hidden text-[12px] sm:block"
              style={{ color: F.label }}
            >
              Toca un balín para cambiarlo o meter otro al lado
            </p>
          )}
          <p
            className="pointer-events-none absolute bottom-5 left-5 font-serif text-[15px] tabular-nums sm:bottom-6 sm:left-7"
            style={{ color: F.text }}
          >
            {ns.length === 0
              ? started
                ? "Agrega tu primer balín"
                : ""
              : `${ns.length} ${ns.length === 1 ? "balín" : "balines"} · ${formatNumber(totalMm)} mm de oro`}
          </p>
          {escala === "real" && !calibrated && started && (
            <button
              type="button"
              onClick={() => setCalibrando(true)}
              className="absolute bottom-6 right-7 hidden text-[12px] underline underline-offset-4 hover:text-oro-claro sm:block"
              style={{ color: F.label }}
            >
              ¿No se ve del tamaño real? Calibra
            </button>
          )}
        </div>
      </div>

      {selBead ? (
        <div className="-mt-5 flex flex-wrap items-center gap-x-4 gap-y-3 border border-tinta bg-blanco px-4 py-3.5 sm:px-5">
          <p className="mr-auto text-sm">
            <strong className="font-medium">Balín #{selBead.n}</strong>{" "}
            <span className="text-suave">
              · posición {selIndex + 1} de {active.length}
            </span>
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={swapSelected}
              className="min-h-10 bg-tinta px-4 text-[13px] uppercase tracking-[0.08em] text-crema hover:bg-[#33302b]"
            >
              Cambiar por #{calibre}
            </button>
            <button
              type="button"
              onClick={() => addNextTo("left")}
              className="min-h-10 border border-tinta px-3.5 text-[13px] uppercase tracking-[0.08em] hover:bg-tinta hover:text-crema"
            >
              ← #{calibre} antes
            </button>
            <button
              type="button"
              onClick={() => addNextTo("right")}
              className="min-h-10 border border-tinta px-3.5 text-[13px] uppercase tracking-[0.08em] hover:bg-tinta hover:text-crema"
            >
              #{calibre} después →
            </button>
            <button type="button" onClick={() => removeId(selBead.id)} className="min-h-10 px-2 text-sm underline underline-offset-4">
              Quitar
            </button>
            <button
              type="button"
              onClick={() => setSelectedId(null)}
              aria-label="Cerrar"
              className="flex size-10 items-center justify-center text-xl leading-none text-suave hover:text-tinta"
            >
              ×
            </button>
          </div>
        </div>
      ) : (
        ns.length > 0 && (
          <p className="-mt-5 text-[13px] text-suave">
            Toca cualquier balín para cambiarlo por otro calibre o meter uno al lado.
          </p>
        )
      )}

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
            <p className="text-sm">
              Agregar un balín <strong className="font-medium">#{calibre}</strong>
            </p>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => add(calibre, "left")}
                className="flex min-h-14 flex-col items-center justify-center gap-0.5 bg-tinta px-2 text-[13px] uppercase tracking-[0.06em] text-crema transition-colors hover:bg-[#33302b] sm:flex-row sm:gap-2"
              >
                <span aria-hidden="true" className="text-lg leading-none">←</span> Izquierda
              </button>
              <button
                type="button"
                onClick={addCenter}
                className="flex min-h-14 flex-col items-center justify-center gap-0.5 bg-tinta px-2 text-[13px] uppercase tracking-[0.06em] text-crema transition-colors hover:bg-[#33302b] sm:flex-row sm:gap-2"
              >
                <span aria-hidden="true" className="text-lg leading-none">↓</span> Al centro
              </button>
              <button
                type="button"
                onClick={() => add(calibre, "right")}
                className="flex min-h-14 flex-col-reverse items-center justify-center gap-0.5 bg-tinta px-2 text-[13px] uppercase tracking-[0.06em] text-crema transition-colors hover:bg-[#33302b] sm:flex-row sm:gap-2"
              >
                Derecha <span aria-hidden="true" className="text-lg leading-none">→</span>
              </button>
            </div>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
              <span className="text-suave">Quitar:</span>
              <button type="button" onClick={() => removeEnd("left")} disabled={!ns.length} className="underline underline-offset-4 disabled:text-borde disabled:no-underline">
                el de la izquierda
              </button>
              <button type="button" onClick={() => removeEnd("right")} disabled={!ns.length} className="underline underline-offset-4 disabled:text-borde disabled:no-underline">
                el de la derecha
              </button>
              <button
                type="button"
                onClick={() => {
                  clearTimers();
                  clearAll();
                  setNotice("Quitaste todos los balines.");
                }}
                disabled={!ns.length}
                className="underline underline-offset-4 disabled:text-borde disabled:no-underline"
              >
                todos
              </button>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 border-t border-linea pt-5">
            <label htmlFor="cantidad" className="text-sm">
              Cantidad de balines
            </label>
            <input
              id="cantidad"
              type="number"
              inputMode="numeric"
              min={0}
              max={MAX_BALINES}
              value={ns.length}
              onChange={(e) => setCount(Number(e.target.value))}
              className="h-11 w-20 border border-tinta bg-blanco text-center text-lg tabular-nums"
            />
            <p className="w-full text-[13px] text-suave">
              Si escribes un número, completa con balines #{calibre} por la derecha. Para mezclar tamaños, cambia el
              calibre antes de agregar.
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
