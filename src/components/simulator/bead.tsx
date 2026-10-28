"use client";

import { useEffect, useLayoutEffect, useRef, type CSSProperties } from "react";

/** 1 mm del balín = 10 px de diseño. El escenario escala todo junto. */
export const PX_PER_MM = 10;

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
        {/* Tallado diamantado: cortes en forma de hoja, en diagonal; cada corte tiene una cara que brilla y otra en sombra */}
        <pattern id="cd-tallado" width="24" height="13" patternUnits="userSpaceOnUse" patternTransform="rotate(-58)">
          <path d="M0 3.25 Q11.5 -2.95 23 3.25 Z" fill="#FFF2A6" opacity="0.95" />
          <path d="M0 3.25 Q11.5 8.52 23 3.25 Z" fill="#4A2E02" opacity="0.68" />
          <path d="M24 3.25 Q35.5 -2.95 47 3.25 Z" fill="#FFF2A6" opacity="0.95" />
          <path d="M24 3.25 Q35.5 8.52 47 3.25 Z" fill="#4A2E02" opacity="0.68" />
          <path d="M-24 3.25 Q-12.5 -2.95 -1 3.25 Z" fill="#FFF2A6" opacity="0.95" />
          <path d="M-24 3.25 Q-12.5 8.52 -1 3.25 Z" fill="#4A2E02" opacity="0.68" />
          <path d="M-12 9.75 Q-0.5 3.55 11 9.75 Z" fill="#FFF2A6" opacity="0.95" />
          <path d="M-12 9.75 Q-0.5 15.02 11 9.75 Z" fill="#4A2E02" opacity="0.68" />
          <path d="M12 9.75 Q23.5 3.55 35 9.75 Z" fill="#FFF2A6" opacity="0.95" />
          <path d="M12 9.75 Q23.5 15.02 35 9.75 Z" fill="#4A2E02" opacity="0.68" />
          <path d="M36 9.75 Q47.5 3.55 59 9.75 Z" fill="#FFF2A6" opacity="0.95" />
          <path d="M36 9.75 Q47.5 15.02 59 9.75 Z" fill="#4A2E02" opacity="0.68" />
        </pattern>
        <radialGradient id="cd-volumen" cx="40%" cy="34%" r="66%">
          <stop offset="0.55" stopColor="#2A1600" stopOpacity="0" />
          <stop offset="0.85" stopColor="#2A1600" stopOpacity="0.38" />
          <stop offset="1" stopColor="#1E1000" stopOpacity="0.78" />
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
      </defs>
    </svg>
  );
}

/** El dibujo de un balín (sirve también para las miniaturas). */
export function BeadArt({
  size,
  x,
  y,
  spinRef,
  glintRef,
}: {
  size: number;
  x?: number;
  y?: number;
  spinRef?: React.Ref<SVGRectElement>;
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
      <circle r="49" fill="url(#cd-oro)" />
      <g clipPath="url(#cd-esfera)">
        <rect ref={spinRef} x="-70" y="-130" width="140" height="260" fill="url(#cd-tallado)" />
        <circle r="49" fill="url(#cd-volumen)" />
        <ellipse cx="-17" cy="-21" rx="13" ry="8" fill="url(#cd-reflejo)" transform="rotate(-30 -17 -21)" />
        <ellipse cx="22" cy="27" rx="12" ry="4" fill="#FFE9A6" opacity="0.28" transform="rotate(-38 22 27)" />
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
  fromX?: number; // de dónde entra (solo balines nuevos)
  leaving?: Leaving;
  outX: number; // a dónde sale cuando se quita por una punta
  zoom: number; // escala actual del escenario (para que el rebote se note igual a cualquier tamaño)
  reduce: boolean;
  position: number;
  onContact: (id: number, fromLeft: boolean) => void;
  onGone: (id: number) => void;
  onRemove: (id: number) => void;
  register: (id: number, handle: BeadHandle | null) => void;
};

const ENTER_MS = 1650;

const MOVE_MS = 900;
const MOVE_EASE = "cubic-bezier(.45,0,.2,1)"; // la misma curva de la cámara, para que todo se mueva junto

export function Bead({ id, n, mm, x, fromX, leaving, outX, zoom, reduce, position, onContact, onGone, onRemove, register }: Props) {
  const outer = useRef<HTMLButtonElement>(null);
  const inner = useRef<HTMLSpanElement>(null);
  const spin = useRef<SVGRectElement>(null);
  const glint = useRef<SVGRectElement>(null);
  const last = useRef<number | null>(null);
  const timers = useRef<number[]>([]);
  const d = mm * PX_PER_MM;
  const r = d / 2;
  const at = (cx: number) => `translate(${cx - r}px, ${-r}px)`;

  // Callbacks siempre al día sin volver a disparar las animaciones
  const cb = useRef({ onContact, onGone });
  useEffect(() => {
    cb.current = { onContact, onGone };
  });

  useEffect(() => {
    const t = timers.current;
    return () => t.forEach((h) => window.clearTimeout(h));
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
    if (reduce || Math.abs(from - x) < 0.5) return;

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
      spin.current?.animate(
        [{ transform: `translateY(${fromLeft ? 78 : -78}px)` }, { transform: "translateY(0)" }],
        { duration: ENTER_MS * 0.84, easing: "cubic-bezier(.3,.12,.22,1)" },
      );
      later(ENTER_MS * 0.82, () => cb.current.onContact(id, fromLeft));
      shine(ENTER_MS * 0.84);
    } else {
      const dist = x - from;
      el.animate([{ transform: at(from) }, { transform: at(x) }], { duration: MOVE_MS, easing: MOVE_EASE });
      spin.current?.animate([{ transform: `translateY(${-dist * 0.3}px)` }, { transform: "translateY(0)" }], {
        duration: MOVE_MS,
        easing: MOVE_EASE,
      });
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
      spin.current?.animate([{ transform: "translateY(0)" }, { transform: `translateY(${outX > from ? 50 : -50}px)` }], {
        duration: 700,
        easing: "cubic-bezier(.5,0,.75,0)",
        fill: "forwards",
      });
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
  const style: CSSProperties = { width: d, height: d };

  return (
    <button
      ref={outer}
      type="button"
      tabIndex={leaving ? -1 : 0}
      disabled={Boolean(leaving)}
      onClick={() => onRemove(id)}
      aria-label={`Quitar el balín #${n} de la posición ${position}`}
      className="group absolute left-0 top-0 cursor-pointer rounded-full p-0 focus-visible:outline-offset-4 disabled:cursor-default"
      style={style}
    >
      <span ref={inner} className="relative block size-full">
        <span
          aria-hidden="true"
          className="absolute left-[6%] top-[62%] h-[52%] w-[88%] rounded-[50%] bg-[radial-gradient(closest-side,rgba(0,0,0,.55),transparent)]"
        />
        <span className="relative block transition-[filter] duration-200 group-hover:brightness-110">
          <BeadArt size={d} spinRef={spin} glintRef={glint} />
        </span>
      </span>
    </button>
  );
}
