/**
 * Tallado diamantado calculado sobre la esfera.
 *
 * El balín se ve de frente con el hueco de lado a lado (eje x = el cordón).
 * Los cortes van en filas alrededor de ese eje, inclinados en diagonal como en los
 * balines de verdad. Cada corte es plano y tiene dos caras; su color sale de cómo
 * le pega la luz, así que cerca del borde se achican y oscurecen solos.
 */

type V3 = [number, number, number];

const norm = (v: V3): V3 => {
  const l = Math.hypot(v[0], v[1], v[2]) || 1;
  return [v[0] / l, v[1] / l, v[2] / l];
};
const sub = (a: V3, b: V3): V3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const add = (a: V3, b: V3): V3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const mul = (a: V3, k: number): V3 => [a[0] * k, a[1] * k, a[2] * k];
const dot = (a: V3, b: V3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const cross = (a: V3, b: V3): V3 => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];

// Luz de arriba a la izquierda, un poco al frente (y crece hacia abajo, z hacia quien mira)
const LIGHT = norm([-0.45, -0.7, 0.58]);
const VIEW: V3 = [0, 0, 1];
const HALF = norm(add(LIGHT, VIEW));

const ROWS = 7;
const PER_ROW = 16;
const T_MIN = 0.17 * Math.PI;
const T_MAX = 0.83 * Math.PI;
const DT = (T_MAX - T_MIN) / ROWS;
const DU = (2 * Math.PI) / PER_ROW;

/** Punto de la esfera: t = ángulo desde el eje del cordón, u = vuelta alrededor de él. */
function sphere(t: number, u: number): V3 {
  return [Math.cos(t), Math.sin(t) * Math.cos(u), Math.sin(t) * Math.sin(u)];
}

const RAMP: [number, [number, number, number]][] = [
  [0, [70, 44, 4]],
  [0.3, [152, 102, 12]],
  [0.55, [226, 168, 30]],
  [0.75, [247, 205, 68]],
  [0.9, [252, 226, 128]],
  [1, [255, 244, 190]],
];

function gold(level: number, spec: number, contrast: number) {
  const x = Math.min(1, Math.max(0, 0.5 + (level - 0.5) * contrast * 1.3));
  let i = 0;
  while (i < RAMP.length - 2 && x > RAMP[i + 1][0]) i++;
  const [a, ca] = RAMP[i];
  const [b, cb] = RAMP[i + 1];
  const f = (x - a) / (b - a || 1);
  const c = ca.map((v, k) => v + (cb[k] - v) * f);
  const s = Math.min(1, spec);
  const out = c.map((v) => Math.round(v + (255 - v) * s * 0.9));
  return `#${out.map((v) => v.toString(16).padStart(2, "0")).join("")}`;
}

export type Facet = { d: string; fill: string };

/**
 * Cortes visibles para un giro dado alrededor del cordón.
 * `contrast` < 1 suaviza las sombras (para balines que se ven chiquitos en pantalla).
 */
export function facets(spin: number, contrast = 1): Facet[] {
  const out: Facet[] = [];
  const R = 49;
  for (let row = 0; row < ROWS; row++) {
    const tc = T_MIN + DT * (row + 0.5);
    for (let k = 0; k < PER_ROW; k++) {
      const uc = DU * k + row * DU * 0.38 + spin;
      const center = sphere(tc, uc);
      if (center[2] < 0.05) continue; // cara de atrás

      // Hoja inclinada: punta a punta en diagonal (t y u a la vez), angosta de lado
      const A: [number, number] = [0.9 * DT, 1.05 * DU];
      const B: [number, number] = [-0.42 * DT, 0.3 * DU];
      const p = (s: number, q: number) => sphere(tc + A[0] * s + B[0] * q, uc + A[1] * s + B[1] * q);
      const tip1 = p(1, 0);
      const tip2 = p(-1, 0);
      const side1 = p(0, 1);
      const side2 = p(0, -1);

      for (const [side, sgn] of [
        [side1, 1],
        [side2, -1],
      ] as const) {
        // Cara plana del corte; se exagera su inclinación para que el tallado se lea
        let n = norm(cross(sub(side, tip1), sub(tip2, tip1)));
        if (dot(n, center) < 0) n = mul(n, -1);
        n = norm(add(center, mul(sub(n, center), 2.6)));
        const diffuse = Math.max(0, dot(n, LIGHT));
        const sky = Math.max(0, -n[1]) * 0.25; // refleja la luz de arriba
        const floor = Math.max(0, n[1]) * 0.12; // y se oscurece hacia la mesa
        // Cada corte refleja un poquito distinto, como en el oro de verdad
        const jitter = (Math.sin(row * 12.9898 + k * 78.233) * 43758.5453) % 1;
        const level = diffuse * 0.85 + sky - floor + 0.08 * sgn + jitter * 0.12 + 0.1 + (1 - contrast) * 0.25;
        const spec = Math.pow(Math.max(0, dot(n, HALF)), 26) * 1.5;
        const pts = [tip1, side, tip2].map((v) => `${(v[0] * R).toFixed(2)} ${(v[1] * R).toFixed(2)}`);
        out.push({ d: `M${pts[0]} L${pts[1]} L${pts[2]} Z`, fill: gold(level, spec * contrast, contrast) });
      }
    }
  }
  return out;
}

/** Cuántos cuadros tiene el giro (el tallado se repite cada DU). */
export const SPIN_FRAMES = 6;
export const spinOf = (frame: number) => (DU * frame) / SPIN_FRAMES;
