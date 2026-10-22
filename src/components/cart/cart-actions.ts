"use server";

import { parseLines, priceLines, type PricedLine } from "@/lib/pricing";

export type CartQuote = { ok: true; lines: PricedLine[] } | { ok: false };

/** Devuelve el precio, la foto y el stock actuales de lo que hay en la bolsa. */
export async function quoteCart(raw: unknown): Promise<CartQuote> {
  const lines = parseLines(raw);
  if (lines.length === 0) return { ok: true, lines: [] };
  try {
    return { ok: true, lines: await priceLines(lines) };
  } catch {
    return { ok: false };
  }
}
