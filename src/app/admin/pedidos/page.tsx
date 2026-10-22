import { Suspense } from "react";
import { requireAdmin } from "@/lib/auth";
import { formatCOP, whatsappTo } from "@/lib/site";
import { ORDER_STATUS_LABEL, type OrderStatus } from "@/lib/types";
import { updateOrderStatus } from "./actions";

export default function OrdersPage() {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-serif text-3xl font-normal">Pedidos</h1>
      <Suspense fallback={<div className="h-64 animate-pulse bg-arena" />}>
        <OrderList />
      </Suspense>
    </div>
  );
}

type OrderRow = {
  id: string;
  number: number;
  status: OrderStatus;
  channel: string;
  first_name: string;
  last_name: string;
  phone: string;
  email: string;
  document: string;
  address: string;
  city: string;
  department: string;
  notes: string;
  total: number;
  shipping: number;
  mp_payment_id: string | null;
  created_at: string;
  order_items: { product_name: string; color_name: string; size: string; qty: number; unit_price: number }[];
};

const dateFmt = new Intl.DateTimeFormat("es-CO", { dateStyle: "medium", timeStyle: "short", timeZone: "America/Bogota" });

async function OrderList() {
  const { supabase } = await requireAdmin();
  const { data, error } = await supabase
    .from("orders")
    .select("*, order_items(product_name, color_name, size, qty, unit_price)")
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) return <p className="text-[#A3262A]">Error: {error.message}</p>;
  const orders = (data ?? []) as OrderRow[];
  if (orders.length === 0) return <p className="text-suave">Todavía no hay pedidos.</p>;

  return (
    <ul className="flex flex-col gap-4">
      {orders.map((o) => (
        <li key={o.id} className="flex flex-col gap-3 border border-linea bg-crema p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="font-medium">
                #{o.number} · {o.first_name} {o.last_name}
              </p>
              <p className="text-xs text-suave">
                {dateFmt.format(new Date(o.created_at))} · {o.channel === "whatsapp" ? "WhatsApp" : "Mercado Pago"}
                {o.mp_payment_id ? ` · pago ${o.mp_payment_id}` : ""}
              </p>
            </div>
            <form action={updateOrderStatus} className="flex items-center gap-2">
              <input type="hidden" name="id" value={o.id} />
              <select name="status" defaultValue={o.status} className="min-h-10 border border-borde bg-white px-2 text-sm">
                {Object.entries(ORDER_STATUS_LABEL).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
              <button type="submit" className="min-h-10 border border-tinta px-3 text-sm">
                Cambiar
              </button>
            </form>
          </div>
          <ul className="text-sm">
            {o.order_items.map((i, n) => (
              <li key={n}>
                {i.qty} × {i.product_name} · cordón {i.color_name.toLowerCase()} · talla {i.size} ·{" "}
                {formatCOP(i.unit_price * i.qty)}
              </li>
            ))}
          </ul>
          <p className="text-sm">
            Total <strong>{formatCOP(o.total)}</strong>
            {o.shipping > 0 ? ` (incluye envío ${formatCOP(o.shipping)})` : ""}
          </p>
          <div className="grid gap-1 text-sm text-texto sm:grid-cols-2">
            <p>
              {o.address}, {o.city}, {o.department}
            </p>
            <p>
              <a href={whatsappTo(o.phone, `Hola ${o.first_name}, te escribimos de Casa D'Or por tu pedido #${o.number}.`)}>
                {o.phone}
              </a>{" "}
              · {o.email}
              {o.document ? ` · C.C. ${o.document}` : ""}
            </p>
            {o.notes && <p className="sm:col-span-2">Notas: {o.notes}</p>}
          </div>
        </li>
      ))}
    </ul>
  );
}
