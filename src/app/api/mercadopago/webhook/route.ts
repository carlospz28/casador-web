import type { NextRequest } from "next/server";
import { getPayment, hasMercadoPago, orderStatusFromPayment, verifyWebhookSignature } from "@/lib/mercadopago";
import { createServiceClient, hasServiceKey } from "@/lib/supabase/service";

/**
 * MercadoPago avisa aquí cuando cambia un pago.
 * Nunca confiamos en el cuerpo del aviso: consultamos el pago a la API con nuestro token.
 */
export async function POST(request: NextRequest) {
  if (!hasMercadoPago || !hasServiceKey) return new Response("no configurado", { status: 200 });

  const url = request.nextUrl;
  const body = (await request.json().catch(() => ({}))) as { type?: string; topic?: string; data?: { id?: string } };

  const type = url.searchParams.get("type") ?? url.searchParams.get("topic") ?? body.type ?? body.topic;
  const dataId = url.searchParams.get("data.id") ?? url.searchParams.get("id") ?? body.data?.id ?? "";
  if (type !== "payment" || !dataId) return new Response("ignorado", { status: 200 });

  const valid = verifyWebhookSignature({
    signature: request.headers.get("x-signature"),
    requestId: request.headers.get("x-request-id"),
    dataId: String(dataId),
  });
  if (!valid) return new Response("firma inválida", { status: 401 });

  try {
    const payment = await getPayment(String(dataId));
    if (!payment.external_reference) return new Response("sin referencia", { status: 200 });

    const db = createServiceClient();
    const { data: order } = await db
      .from("orders")
      .select("id, total, status")
      .eq("id", payment.external_reference)
      .maybeSingle();
    if (!order) return new Response("pedido no encontrado", { status: 200 });

    let status = orderStatusFromPayment(payment.status);
    // Si el monto pagado no coincide con el pedido, no lo marcamos como pagado.
    if (status === "pagado" && Math.round(payment.transaction_amount) !== order.total) {
      console.error(`Pedido ${order.id}: monto pagado ${payment.transaction_amount} distinto del total ${order.total}`);
      status = "pendiente_pago";
    }
    // No retrocedemos pedidos ya enviados o entregados.
    const finalStatus = ["enviado", "entregado"].includes(order.status) ? order.status : status;

    await db
      .from("orders")
      .update({ status: finalStatus, mp_payment_id: String(payment.id), mp_status: payment.status })
      .eq("id", order.id);

    return new Response("ok", { status: 200 });
  } catch (e) {
    console.error(e);
    // 500 hace que MercadoPago reintente más tarde
    return new Response("error", { status: 500 });
  }
}
