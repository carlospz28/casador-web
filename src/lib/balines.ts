// Medidas de los balines de Casa D'Or. Cambie aquí y se actualiza el simulador.
//
// mm: diámetro aproximado. Se usa la convención del gremio: el número del balín es su diámetro en milímetros.
// gramos: peso de un balín, medido con el pedido de oro de mayo de 2026. null = todavía sin pesar.

export type Balin = { n: number; mm: number; gramos: number | null };

export const BALINES: Balin[] = [
  { n: 3, mm: 3, gramos: 1 / 37 },
  { n: 4, mm: 4, gramos: 1 / 16 },
  { n: 5, mm: 5, gramos: 2.094 / 24 },
  { n: 6, mm: 6, gramos: 1.871 / 14 },
  { n: 7, mm: 7, gramos: null },
  { n: 8, mm: 8, gramos: null },
];

export function getBalin(n: number): Balin | undefined {
  return BALINES.find((b) => b.n === n);
}

export const CORDONES = [
  { id: "negro", name: "Negro", hex: "#1C1A17" },
  { id: "dorado", name: "Dorado", hex: "#C9A54C" },
  { id: "rosado", name: "Rosado", hex: "#E8B4B8" },
  { id: "rojo", name: "Rojo", hex: "#A3262A" },
  { id: "azul", name: "Azul", hex: "#1F3A68" },
] as const;

export type CordonId = (typeof CORDONES)[number]["id"];
