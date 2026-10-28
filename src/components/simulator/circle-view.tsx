"use client";

import { BeadArt } from "./bead";

/** La manilla terminada vista desde arriba. Todo se dibuja en milímetros. */

const GAP_MM = 0.2;
const CORD_MM = 1.2; // cordón por donde pasan los balines
const BAND_MM = 3.6; // ancho del tejido de macramé
const CLOSURE_MM = 14; // largo del nudo corredizo
const MIN_LENGTH_MM = 160; // largo de la manilla cerrada (talla M aprox.)

export type RingBead = { id: number; mm: number };

/** Caja del dibujo en mm: el aro más el tejido, las puntas arriba y el balín más grande abajo. */
function ringBox(beads: RingBead[]) {
  const R = ringRadius(beads);
  const big = beads.reduce((m, b) => Math.max(m, b.mm), 0);
  const side = R + BAND_MM / 2 + 0.3;
  return { x: -side, y: -(R + 10.5), w: side * 2, h: R + 10.5 + R + Math.max(BAND_MM, big) / 2 + 1.5 };
}

/** Ancho y alto del dibujo en mm (para saber cuánto escalarlo). */
export function ringSize(beads: RingBead[]) {
  const b = ringBox(beads);
  return { w: b.w, h: b.h };
}

function beadsLength(beads: RingBead[]) {
  return beads.reduce((s, b) => s + b.mm, 0) + Math.max(0, beads.length - 1) * GAP_MM;
}

function ringRadius(beads: RingBead[]) {
  const length = Math.max(MIN_LENGTH_MM, beadsLength(beads) + CLOSURE_MM + 24);
  return length / (2 * Math.PI);
}

/** Punto del aro. Ángulo 0 = abajo; positivo hacia la izquierda. */
function at(R: number, a: number) {
  return [-R * Math.sin(a), R * Math.cos(a)] as const;
}

function arcPath(R: number, a1: number, a2: number) {
  const steps = Math.max(2, Math.ceil(Math.abs(a2 - a1) / 0.04));
  let d = "";
  for (let i = 0; i <= steps; i++) {
    const [x, y] = at(R, a1 + ((a2 - a1) * i) / steps);
    d += `${i ? "L" : "M"}${x.toFixed(3)} ${y.toFixed(3)} `;
  }
  return d;
}

function placeBeads(beads: RingBead[], total: number, R: number) {
  const out: (RingBead & { deg: number })[] = [];
  let u = 0;
  for (const b of beads) {
    if (out.length) u += GAP_MM;
    const center = u + b.mm / 2;
    u += b.mm;
    out.push({ ...b, deg: (((total / 2 - center) / R) * 180) / Math.PI });
  }
  return out;
}

function shade(hex: string, t: number) {
  const v = parseInt(hex.slice(1), 16);
  const ch = [(v >> 16) & 255, (v >> 8) & 255, v & 255].map((c) =>
    Math.round(t < 0 ? c * (1 + t) : c + (255 - c) * t),
  );
  return `#${ch.map((c) => c.toString(16).padStart(2, "0")).join("")}`;
}

/** Tejido de macramé: una fila de nudos a lo largo del aro, cada uno con su luz y su sombra. */
function Knots({
  R,
  from,
  to,
  hex,
  width = BAND_MM,
  step = 1.35,
}: {
  R: number;
  from: number;
  to: number;
  hex: string;
  width?: number;
  step?: number;
}) {
  const len = Math.abs(to - from) * R;
  const count = Math.max(1, Math.round(len / step));
  const dark = shade(hex, -0.55);
  const light = shade(hex, 0.38);
  const knots = Array.from({ length: count }, (_, i) => {
    const a = from + ((to - from) * (i + 0.5)) / count;
    return { deg: (a * 180) / Math.PI, wob: i % 2 ? 0.22 : -0.22 };
  });
  return (
    <g>
      <path d={arcPath(R, from, to)} fill="none" stroke={dark} strokeWidth={width} strokeLinecap="round" />
      {knots.map((k, i) => (
        <g key={i} transform={`rotate(${k.deg.toFixed(3)}) translate(0 ${(R + k.wob).toFixed(3)})`}>
          <ellipse rx={(step * 0.62).toFixed(3)} ry={width / 2 - 0.1} fill={hex} stroke={dark} strokeWidth="0.18" />
          <ellipse cx={-step * 0.12} cy={-width * 0.18} rx={step * 0.26} ry={width * 0.2} fill={light} opacity="0.55" />
        </g>
      ))}
    </g>
  );
}

export function CircleView({
  beads,
  hex,
  pxPerMm,
  reduce,
  selectedId,
  onSelect,
}: {
  beads: RingBead[];
  hex: string;
  pxPerMm: number;
  reduce: boolean;
  selectedId: number | null;
  onSelect: (id: number) => void;
}) {
  const R = ringRadius(beads);
  const box = ringBox(beads);
  const total = beadsLength(beads);
  const endA = beads.length ? (total / 2 + 0.6) / R : 0;
  const closureA = CLOSURE_MM / 2 / R;
  const top = Math.PI;

  // Ángulo del centro de cada balín
  const placed = placeBeads(beads, total, R);

  const [lx, ly] = at(R, top - closureA);
  const [rx, ry] = at(R, -(top - closureA));
  const tail = (x: number, y: number, dir: number) =>
    `M${x} ${y} Q${x + dir * 4} ${y - 2} ${x + dir * 6} ${y - 7}`;

  return (
    <svg
      viewBox={`${box.x} ${box.y} ${box.w} ${box.h}`}
      width={box.w * pxPerMm}
      height={box.h * pxPerMm}
      className="block overflow-visible"
      style={{ transition: reduce ? "none" : "width 500ms, height 500ms" }}
      role="group"
      aria-label="Manilla terminada"
    >
      <defs>
        <filter id="cd-sombra-aro" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="0.9" stdDeviation="0.8" floodColor="#000" floodOpacity="0.55" />
        </filter>
      </defs>
      <g filter="url(#cd-sombra-aro)">
        {/* Cordón donde van los balines */}
        <circle r={R} fill="none" stroke={shade(hex, 0.08)} strokeWidth={CORD_MM} />
        {/* Tejido de macramé a cada lado */}
        <Knots R={R} from={endA} to={top - closureA} hex={hex} />
        <Knots R={R} from={-endA} to={-(top - closureA)} hex={hex} />
        {/* Puntas del cordón con su nudito */}
        <g fill="none" stroke={hex} strokeWidth={CORD_MM} strokeLinecap="round">
          <path d={tail(lx, ly, -1)} />
          <path d={tail(rx, ry, 1)} />
        </g>
        <circle cx={lx - 6} cy={ly - 7} r={1.3} fill={shade(hex, -0.15)} />
        <circle cx={rx + 6} cy={ry - 7} r={1.3} fill={shade(hex, -0.15)} />
        {/* Nudo corredizo */}
        <Knots R={R} from={top - closureA} to={top + closureA} hex={shade(hex, -0.1)} width={5} step={1.7} />

        {placed.map((b, i) => (
          <g
            key={b.id}
            style={{
              transform: `rotate(${b.deg}deg)`,
              transition: reduce ? "none" : "transform 700ms cubic-bezier(.45,0,.2,1)",
            }}
          >
            <g
              className="cd-aparece cursor-pointer outline-none"
              style={{ animationDelay: reduce ? "0ms" : `${i * 45}ms` }}
              role="button"
              tabIndex={0}
              aria-pressed={b.id === selectedId}
              aria-label={`Balín ${i + 1} de ${placed.length}, ${b.mm} mm`}
              onClick={() => onSelect(b.id)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onSelect(b.id);
                }
              }}
            >
              {b.id === selectedId && (
                <circle cy={R} r={b.mm / 2 + 0.7} fill="none" stroke="var(--cd-marca, #F3EBDB)" strokeWidth={Math.max(0.35, 1.6 / pxPerMm)} />
              )}
              <BeadArt size={b.mm} x={-b.mm / 2} y={R - b.mm / 2} fine={b.mm * pxPerMm < 18} />
            </g>
          </g>
        ))}
      </g>
    </svg>
  );
}
