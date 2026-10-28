"use client";

import { useEffect, useLayoutEffect, useRef, type CSSProperties } from "react";
import { SPIN_FRAMES, facets, spinOf } from "./bead-geometry";

/** 1 mm del balín = 10 px de diseño. El escenario escala todo junto. */
export const PX_PER_MM = 10;

/** El tallado ya calculado: un cuadro por cada paso del giro, más uno suave para balines chiquitos. */
const SYMBOLS = [
  ...Array.from({ length: SPIN_FRAMES }, (_, i) => ({ id: `cd-balin-${i}`, fine: false, facets: facets(spinOf(i)) })),
  { id: "cd-balin-fino", fine: true, facets: facets(0, 0.6) },
];

/** Degradados y tallado compartidos por todos los balines (se dibujan una sola vez). */
export function BeadDefs() {
  return (
    <svg width="0" height="0" aria-hidden="true" focusable="false" style={{ position: "absolute" }}>
      <defs>
        <radialGradient id="cd-oro" cx="38%" cy="30%" r="78%">
          <stop offset="0" stopColor="#FFF3B0" />
          <stop offset="0.16" stopColor="#F7CF45" />
          <stop offset="0.42" stopColor="#DDA51A" />
          <stop offset="0.7" stopColor="#A06E0A" />
          <stop offset="1" stopColor="#4F3304" />
        </radialGradient>
        <radialGradient id="cd-volumen" cx="40%" cy="34%" r="66%">
          <stop offset="0.62" stopColor="#2A1600" stopOpacity="0" />
          <stop offset="0.9" stopColor="#2A1600" stopOpacity="0.28" />
          <stop offset="1" stopColor="#1E1000" stopOpacity="0.62" />
        </radialGradient>
        <radialGradient id="cd-volumen-fino" cx="40%" cy="34%" r="66%">
          <stop offset="0.6" stopColor="#2A1600" stopOpacity="0" />
          <stop offset="1" stopColor="#2A1600" stopOpacity="0.45" />
        </radialGradient>
        <radialGradient id="cd-reflejo" cx="50%" cy="50%" r="50%">
          <stop offset="0" stopColor="#FFFFFF" stopOpacity="0.95" />
          <stop offset="1" stopColor="#FFFFFF" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="cd-destello" x1="0" x2="1" y1="0" y2="0">
          <stop offset="0" stopColor="#FFFFFF" stopOpacity="0" />
          <stop offset="0.5" stopColor="#FFFDF2" stopOpacity="0.9" />
          <stop offset="1" stopColor="#FFFFFF" stopOpacity="0" />
        </linearGradient>
        <clipPath id="cd-esfera">
          <circle cx="0" cy="0" r="49" />
        </clipPath>
        {SYMBOLS.map((s) => (
          <symbol key={s.id} id={s.id} viewBox="-50 -50 100 100">
            <circle r="49" fill="url(#cd-oro)" />
            <g clipPath="url(#cd-esfera)">
              {s.facets.map((f, i) => (
                <path key={i} d={f.d} fill={f.fill} />
              ))}
              <circle r="49" fill={s.fine ? "url(#cd-volumen-fino)" : "url(#cd-volumen)"} />
              <ellipse cx="-18" cy="-24" rx="11" ry="6" fill="url(#cd-reflejo)" transform="rotate(-30 -18 -24)" opacity="0.85" />
            </g>
          </symbol>
        ))}
      </defs>
    </svg>
  );
}

/** El dibujo de un balín (sirve también para las miniaturas). */
export function BeadArt({
  size,
  x,
  y,
  fine = false,
  spinRef,
  glintRef,
}: {
  size: number;
  x?: number;
  y?: number;
  fine?: boolean; // se ve de menos de ~18 px en pantalla
  spinRef?: React.Ref<SVGUseElement>;
  glintRef?: React.Ref<SVGRectElement>;
}) {
  return (
    <svg
      viewBox="-50 -50 100 100"
      width={size}
      height={size}
      x={x}
      y={y}
      aria-hidden="true"
      focusable="false"
      className="block overflow-visible"
    >
      <use ref={spinRef} href={fine ? "#cd-balin-fino" : "#cd-balin-0"} x="-50" y="-50" width="100" height="100" />
      <g clipPath="url(#cd-esfera)">
        <rect ref={glintRef} x="-14" y="-80" width="28" height="160" fill="url(#cd-destello)" opacity="0" />
      </g>
    </svg>
  );
}

export type BeadHandle = { nudge: (amount: number, delay: number) => void };
export type Leaving = "out" | "lift";

type Props = {
  id: number;
  n: number;
  mm: number;
  x: number; // centro del balín, en px de diseño
  fromX?: number; // de dónde entra por una punta (solo balines nuevos)
  drop?: boolean; // entra cayendo desde arriba (cuando se mete en medio)
  selected?: boolean;
  leaving?: Leaving;
  outX: number; // a dónde sale cuando se quita por una punta
  zoom: number; // escala actual del escenario (para que el rebote se note igual a cualquier tamaño)
  reduce: boolean;
  position: number;
  onContact: (id: number, dir: "left" | "right" | "both") => void;
  onGone: (id: number) => void;
  onSelect: (id: number) => void;
  register: (id: number, handle: BeadHandle | null) => void;
};

const ENTER_MS = 1650;

const MOVE_MS = 900;
const MOVE_EASE = "cubic-bezier(.45,0,.2,1)"; // la misma curva de la cámara, para que todo se mueva junto

export function Bead({
  id,
  n,
  mm,
  x,
  fromX,
  drop,
  selected,
  leaving,
  outX,
  zoom,
  reduce,
  position,
  onContact,
  onGone,
  onSelect,
  register,
}: Props) {
  const outer = useRef<HTMLButtonElement>(null);
  const inner = useRef<HTMLSpanElement>(null);
  const spin = useRef<SVGUseElement>(null);
  const spinRaf = useRef(0);
  const glint = useRef<SVGRectElement>(null);
  const last = useRef<number | null>(null);
  const timers = useRef<number[]>([]);
  const d = mm * PX_PER_MM;
  const r = d / 2;
  const fine = d * zoom < 18;
  const at = (cx: number) => `translate(${cx - r}px, ${-r}px)`;

  // Callbacks siempre al día sin volver a disparar las animaciones
  const cb = useRef({ onContact, onGone });
  useEffect(() => {
    cb.current = { onContact, onGone };
  });

  useEffect(() => {
    const t = timers.current;
    const raf = spinRaf;
    return () => {
      t.forEach((h) => window.clearTimeout(h));
      cancelAnimationFrame(raf.current);
    };
  }, []);

  useEffect(() => {
    register(id, {
      nudge(amount, delay) {
        if (reduce || !inner.current) return;
        inner.current.animate(
          [
            { transform: "translateX(0)" },
            { transform: `translateX(${-amount}px)`, offset: 0.35 },
            { transform: "translateX(0)" },
          ],
          { duration: 320, delay, easing: "ease-out" },
        );
      },
    });
    return () => register(id, null);
  }, [id, reduce, register]);

  function later(ms: number, fn: () => void) {
    timers.current.push(window.setTimeout(fn, ms));
  }

  /** Gira el balín sobre el cordón cambiando de cuadro, frenando como el deslizamiento. */
  function spinFor(frames: number, duration: number) {
    const el = spin.current;
    if (!el || reduce || fine) return;
    cancelAnimationFrame(spinRaf.current);
    const t0 = performance.now();
    const tick = (now: number) => {
      const p = Math.min(1, (now - t0) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      const f = Math.round(frames * eased);
      el.setAttribute("href", `#cd-balin-${(((f % SPIN_FRAMES) + SPIN_FRAMES) % SPIN_FRAMES)}`);
      if (p < 1) spinRaf.current = requestAnimationFrame(tick);
    };
    spinRaf.current = requestAnimationFrame(tick);
  }

  function shine(delay: number) {
    glint.current?.animate(
      [
        { transform: "rotate(22deg) translateX(-80px)", opacity: 0 },
        { opacity: 1, offset: 0.35 },
        { transform: "rotate(22deg) translateX(80px)", opacity: 0 },
      ],
      { duration: 750, delay, easing: "ease-in-out" },
    );
  }

  /** Dónde está el balín en pantalla ahora mismo (por si va a mitad de camino). */
  function currentX(el: HTMLElement) {
    const m = new DOMMatrix(getComputedStyle(el).transform);
    return m.m41 + r;
  }

  // Deslizar a su sitio: al entrar y cada vez que cambie de lugar
  useLayoutEffect(() => {
    const el = outer.current;
    if (!el || leaving) return;
    const first = last.current === null;
    let from = first ? (fromX ?? x) : last.current!;
    const running = el.getAnimations();
    if (!first && running.length) {
      from = currentX(el);
      running.forEach((a) => a.cancel());
    }
    el.style.transform = at(x);
    last.current = x;
    if (reduce || (Math.abs(from - x) < 0.5 && !(first && drop))) return;

    if (first && fromX !== undefined) {
      // La entrada: corre por el cordón, frena, toca al vecino y rebota un poquito
      const fromLeft = fromX < x;
      const bounce = Math.max(3.5, 1.6 / zoom) * (fromLeft ? -1 : 1);
      el.animate(
        [
          { transform: at(from), easing: "cubic-bezier(.38,.08,.22,1)" },
          { transform: at(x), offset: 0.82, easing: "ease-out" },
          { transform: at(x + bounce), offset: 0.89, easing: "ease-in-out" },
          { transform: at(x) },
        ],
        { duration: ENTER_MS },
      );
      spinFor((fromLeft ? 1 : -1) * SPIN_FRAMES * 3, ENTER_MS * 0.84);
      later(ENTER_MS * 0.82, () => cb.current.onContact(id, fromLeft ? "left" : "right"));
      shine(ENTER_MS * 0.84);
    } else if (first && drop) {
      // Meterlo en medio: los vecinos abren campo y el balín cae en su sitio
      const lift = Math.max(90, 40 / zoom);
      const bounce = Math.max(6, 3 / zoom);
      const up = (dy: number) => `translate(${x - r}px, ${-r - dy}px)`;
      el.animate(
        [
          { transform: up(lift), opacity: 0, easing: "cubic-bezier(.55,0,.9,.4)" },
          { transform: at(x), opacity: 1, offset: 0.62, easing: "cubic-bezier(.2,.7,.4,1)" },
          { transform: up(bounce), offset: 0.8, easing: "ease-in" },
          { transform: at(x) },
        ],
        { duration: 820, delay: 260, fill: "backwards" },
      );
      later(260 + 820 * 0.62, () => cb.current.onContact(id, "both"));
      shine(260 + 820 * 0.66);
    } else {
      const dist = x - from;
      el.animate([{ transform: at(from) }, { transform: at(x) }], { duration: MOVE_MS, easing: MOVE_EASE });
      spinFor(Math.round(-dist / 12), MOVE_MS);
    }
    // `at` y `r` dependen de mm, que no cambia en la vida del balín
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [x]);

  // Salir
  useLayoutEffect(() => {
    const el = outer.current;
    if (!leaving || !el) return;
    if (reduce) {
      cb.current.onGone(id);
      return;
    }
    const from = el.getAnimations().length ? currentX(el) : (last.current ?? x);
    el.getAnimations().forEach((a) => a.cancel());
    el.style.transform = at(from);
    let anim: Animation;
    if (leaving === "out") {
      anim = el.animate([{ transform: at(from) }, { transform: at(outX) }], {
        duration: 700,
        easing: "cubic-bezier(.5,0,.75,0)",
        fill: "forwards",
      });
      spinFor((outX > from ? -1 : 1) * SPIN_FRAMES * 2, 700);
    } else {
      anim = inner.current!.animate(
        [
          { transform: "translateY(0) scale(1)", opacity: 1 },
          { transform: "translateY(-45%) scale(.7)", opacity: 0 },
        ],
        { duration: 320, easing: "cubic-bezier(.4,0,1,1)", fill: "forwards" },
      );
    }
    anim.onfinish = () => cb.current.onGone(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [leaving]);

  // La posición la maneja el efecto de arriba (antes de pintar), no React.
  const style: CSSProperties = {
    width: d,
    height: d,
    outline: selected ? `${2 / zoom}px solid var(--cd-marca, #F3EBDB)` : undefined,
    outlineOffset: selected ? `${3 / zoom}px` : undefined,
  };

  return (
    <button
      ref={outer}
      type="button"
      tabIndex={leaving ? -1 : 0}
      disabled={Boolean(leaving)}
      onClick={() => onSelect(id)}
      aria-pressed={Boolean(selected)}
      aria-label={`Balín #${n}, posición ${position}`}
      className="group absolute left-0 top-0 cursor-pointer rounded-full p-0 focus-visible:outline-offset-4 disabled:cursor-default"
      style={style}
    >
      <span ref={inner} className="relative block size-full">
        <span
          aria-hidden="true"
          className="absolute left-[6%] top-[62%] h-[52%] w-[88%] rounded-[50%]"
          style={{ background: "radial-gradient(closest-side, var(--cd-sombra, rgba(0,0,0,.55)), transparent)" }}
        />
        <span className="relative block transition-[filter] duration-200 group-hover:brightness-110">
          <BeadArt size={d} fine={fine} spinRef={spin} glintRef={glint} />
        </span>
      </span>
    </button>
  );
}
