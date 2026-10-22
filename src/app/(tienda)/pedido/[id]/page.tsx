import type { Metadata } from "next";
import { Suspense } from "react";
import { connection } from "next/server";
import { createServiceClient, hasServiceKey } from "@/lib/supabase/service";
import { formatCOP, site, whatsappLink } from "@/lib/site";
import { ORDER_STATUS_LABEL, type OrderStatus } from "@/lib/types";
import { ButtonLink } from "@/components/ui";
import { ClearCart } from "./clear-cart";

export const metadata: Metadata = { title: "Tu pedido", robots: { index: false } };

export default function OrderPage(props: PageProps<"/pedido/[id]">) {
  return (
    <div className="mx-auto max-w-2xl px-6 pb-22 pt-14">
      <ClearCart />
      <Suspense fallback={<div className="h-72 animate-pulse bg-arena" />}>
        <OrderDetails params={props.params} />
      </Suspense>
    </div>
  );
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function OrderDetails({ params }: { params: Promise<{ id: string }> }) {
  await connection();
  const { id } = await params;
  if (!hasServiceKey || !UUID.test(id)) return <NotFoundOrder />;

  const { data: order } = await createServiceClient()
    .from("orders")
    .select("id, number, status, total, first_name, order_items(product_name, color_name, size, qty, unit_price)")
    .eq("id", id)
    .maybeSingle();
  if (!order) return <NotFoundOrder />;

  const status = order.status as OrderStatus;
  const title =
    status === "pagado"
      ? `¡Gracias, ${order.first_name}! Tu pago fue aprobado.`
      : status === "rechazado"
        ? "El pago no fue aprobado"
        : `Recibimos tu pedido, ${order.first_name}`;
  const text =
    status === "pagado"
      ? "Empezamos a preparar tu manilla. Te escribimos por WhatsApp con el número de guía cuando la despachemos."
      : status === "rechazado"
        ? "Puedes intentar de nuevo con otro medio de pago o escribirnos por WhatsApp y te ayudamos."
        : "Si pagaste con PSE o Efecty, el pago puede tardar en confirmarse. Te avisamos apenas se apruebe.";

  return (
    <div className="flex flex-col gap-6">
      <p className="text-[13px] uppercase tracking-[0.16em] text-oro">Pedido #{order.number}</p>
      <h1 className="font-serif text-[clamp(30px,3.5vw,42px)] font-normal leading-tight">{title}</h1>
      <p className="text-[17px] leading-relaxed text-texto">{text}</p>
      <p className="text-sm">
        Estado: <strong className="font-medium">{ORDER_STATUS_LABEL[status] ?? status}</strong>
      </p>
      <ul className="divide-y divide-linea border-y border-linea">
        {order.order_items.map((i, n) => (
          <li key={n} className="flex justify-between gap-4 py-3 text-sm">
            <span>
              {i.qty} × {i.product_name} · cordón {i.color_name.toLowerCase()} · talla {i.size}
            </span>
            <span>{formatCOP(i.unit_price * i.qty)}</span>
          </li>
        ))}
        <li className="flex justify-between py-3 font-medium">
          <span>Total</span>
          <span>{formatCOP(order.total)}</span>
        </li>
      </ul>
      <div className="flex flex-wrap gap-3">
        <ButtonLink href={whatsappLink(`Hola ${site.name}, tengo una pregunta sobre mi pedido #${order.number}.`)}>
          Escribir por WhatsApp
        </ButtonLink>
        <ButtonLink href="/manillas" variant="outline">
          Seguir viendo
        </ButtonLink>
      </div>
    </div>
  );
}

function NotFoundOrder() {
  return (
    <div className="flex flex-col gap-5">
      <h1 className="font-serif text-4xl font-normal">No encontramos este pedido</h1>
      <p className="text-texto">Si ya pagaste, escríbenos por WhatsApp con tu nombre y te confirmamos el estado.</p>
      <ButtonLink href={whatsappLink(`Hola ${site.name}, quiero confirmar el estado de mi pedido.`)} className="self-start">
        Escribir por WhatsApp
      </ButtonLink>
    </div>
  );
}
