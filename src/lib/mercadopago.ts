import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";

const ACCESS_TOKEN = process.env.MERCADOPAGO_ACCESS_TOKEN ?? "";
const WEBHOOK_SECRET = process.env.MERCADOPAGO_WEBHOOK_SECRET ?? "";
// MERCADOPAGO_API_URL solo se usa para pruebas locales con un simulador.
const API = process.env.MERCADOPAGO_API_URL ?? "https://api.mercadopago.com";

export const hasMercadoPago = Boolean(ACCESS_TOKEN);

type PreferenceInput = {
  orderId: string;
  orderNumber: number;
  items: { id: string; title: string; quantity: number; unit_price: number }[];
  shipping: number;
  payer: { name: string; surname: string; email: string; phone: string };
  siteUrl: string;
};

/** Crea la preferencia de Checkout Pro y devuelve la URL de pago. */
export async function createPreference(input: PreferenceInput) {
  const items = input.items.map((i) => ({ ...i, currency_id: "COP" }));
  if (input.shipping > 0) {
    items.push({ id: "envio", title: "Envío", quantity: 1, unit_price: input.shipping, currency_id: "COP" });
  }

  const returnUrl = `${input.siteUrl}/pedido/${input.orderId}`;
  const isPublicUrl = input.siteUrl.startsWith("https://");

  const res = await fetch(`${API}/checkout/preferences`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${ACCESS_TOKEN}`,
      "Content-Type": "application/json",
      "X-Idempotency-Key": input.orderId,
    },
    body: JSON.stringify({
      items,
      payer: {
        name: input.payer.name,
        surname: input.payer.surname,
        email: input.payer.email,
        phone: { number: input.payer.phone },
      },
      external_reference: input.orderId,
      statement_descriptor: "CASA D'OR",
      back_urls: { success: returnUrl, pending: returnUrl, failure: returnUrl },
      // MercadoPago solo acepta auto_return y notification_url con URL pública https
      ...(isPublicUrl && {
        auto_return: "approved",
        notification_url: `${input.siteUrl}/api/mercadopago/webhook`,
      }),
      metadata: { order_number: input.orderNumber },
    }),
    cache: "no-store",
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.init_point) {
    throw new Error(`MercadoPago respondió ${res.status}: ${data.message ?? "sin detalle"}`);
  }
  return { id: data.id as string, url: data.init_point as string };
}

export type MpPayment = {
  id: number;
  status: string;
  external_reference: string | null;
  transaction_amount: number;
};

/** Consulta el pago directamente a MercadoPago: es la fuente de verdad. */
export async function getPayment(paymentId: string): Promise<MpPayment> {
  const res = await fetch(`${API}/v1/payments/${encodeURIComponent(paymentId)}`, {
    headers: { Authorization: `Bearer ${ACCESS_TOKEN}` },
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`No se pudo consultar el pago ${paymentId}: ${res.status}`);
  return res.json();
}

/**
 * Valida la firma x-signature del webhook.
 * Si no hay MERCADOPAGO_WEBHOOK_SECRET configurado devuelve true: la seguridad
 * real está en que el estado del pago siempre se consulta a la API de MercadoPago.
 */
export function verifyWebhookSignature(opts: { signature: string | null; requestId: string | null; dataId: string }) {
  if (!WEBHOOK_SECRET) return true;
  if (!opts.signature) return false;

  const parts = Object.fromEntries(
    opts.signature.split(",").map((p) => {
      const [k, ...v] = p.trim().split("=");
      return [k, v.join("=")];
    }),
  );
  const ts = parts.ts;
  const hash = parts.v1;
  if (!ts || !hash) return false;

  let manifest = `id:${opts.dataId.toLowerCase()};`;
  if (opts.requestId) manifest += `request-id:${opts.requestId};`;
  manifest += `ts:${ts};`;

  const expected = createHmac("sha256", WEBHOOK_SECRET).update(manifest).digest("hex");
  const a = Buffer.from(expected);
  const b = Buffer.from(hash);
  return a.length === b.length && timingSafeEqual(a, b);
}

/** Traduce el estado de MercadoPago al estado del pedido. */
export function orderStatusFromPayment(status: string) {
  if (status === "approved") return "pagado";
  if (status === "rejected") return "rechazado";
  if (status === "cancelled" || status === "refunded" || status === "charged_back") return "cancelado";
  return "pendiente_pago";
}
