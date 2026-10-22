"use server";

import { headers } from "next/headers";
import { DEPARTAMENTOS } from "@/lib/colombia";
import { createPreference, hasMercadoPago } from "@/lib/mercadopago";
import { parseLines, priceLines, type PricedLine } from "@/lib/pricing";
import { shippingFor, site, whatsappLink, formatCOP } from "@/lib/site";
import { createServiceClient, hasServiceKey } from "@/lib/supabase/service";

export type CheckoutState = {
  error?: string;
  fieldErrors?: Partial<Record<string, string>>;
  redirectTo?: string;
  values?: Record<string, string>;
};

const text = (fd: FormData, key: string) => String(fd.get(key) ?? "").trim();

async function siteUrl() {
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, "");
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}

function whatsappOrderMessage(number: number | null, lines: PricedLine[], total: number, name: string, city: string) {
  const head = number ? `Hola ${site.name}, acabo de hacer el pedido #${number}:` : `Hola ${site.name}, quiero hacer este pedido:`;
  const body = lines.map((l) => `• ${l.qty} × ${l.productName} (cordón ${l.colorName.toLowerCase()}, talla ${l.size})`);
  const totalText = total > 0 ? formatCOP(total) : "por cotizar";
  return `${head}\n${body.join("\n")}\nTotal: ${totalText}\nA nombre de ${name}, ${city}.`;
}

export async function createOrder(_prev: CheckoutState, fd: FormData): Promise<CheckoutState> {
  const channel = text(fd, "channel") === "whatsapp" ? "whatsapp" : "mercadopago";

  const f = {
    first_name: text(fd, "first_name"),
    last_name: text(fd, "last_name"),
    phone: text(fd, "phone").replace(/[^\d+]/g, ""),
    email: text(fd, "email").toLowerCase(),
    document: text(fd, "document"),
    address: text(fd, "address"),
    city: text(fd, "city"),
    department: text(fd, "department"),
    notes: text(fd, "notes").slice(0, 500),
  };

  const fieldErrors: Record<string, string> = {};
  if (!f.first_name) fieldErrors.first_name = "Escribe tu nombre";
  if (!f.last_name) fieldErrors.last_name = "Escribe tu apellido";
  if (f.phone.replace(/\D/g, "").length < 10) fieldErrors.phone = "Escribe un celular de 10 dígitos";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email)) fieldErrors.email = "Escribe un correo válido";
  if (f.address.length < 6) fieldErrors.address = "Escribe la dirección completa";
  if (!f.city) fieldErrors.city = "Escribe tu ciudad o municipio";
  if (!DEPARTAMENTOS.includes(f.department)) fieldErrors.department = "Elige el departamento";
  if (fd.get("consent") !== "on") fieldErrors.consent = "Debes aceptar el tratamiento de datos";
  if (Object.keys(fieldErrors).length > 0) {
    return { error: "Revisa los campos marcados.", fieldErrors, values: f };
  }

  const lines = parseLines(text(fd, "cart"));
  if (lines.length === 0) return { error: "Tu bolsa está vacía.", values: f };

  let priced: PricedLine[];
  try {
    priced = await priceLines(lines);
  } catch {
    return { error: "No pudimos revisar los productos. Intenta de nuevo en un momento.", values: f };
  }
  if (priced.length !== lines.length || priced.some((l) => !l.active)) {
    return { error: "Una de las manillas de tu bolsa ya no está disponible. Quítala e intenta de nuevo.", values: f };
  }
  const short = priced.find((l) => l.stock < l.qty);
  if (short) {
    const left = short.stock === 0 ? "Ya no quedan" : short.stock === 1 ? "Solo queda 1" : `Solo quedan ${short.stock}`;
    return { error: `${left} de ${short.productName} en cordón ${short.colorName.toLowerCase()}.`, values: f };
  }

  const subtotal = priced.reduce((n, l) => n + l.unitPrice * l.qty, 0);
  const shipping = shippingFor(subtotal);
  const total = subtotal + shipping;
  const fullName = `${f.first_name} ${f.last_name}`;

  if (channel === "mercadopago") {
    if (!hasMercadoPago || !hasServiceKey) {
      return { error: "El pago en línea todavía no está activo. Usa “Enviar pedido por WhatsApp”.", values: f };
    }
    if (priced.some((l) => l.unitPrice <= 0)) {
      return { error: "Hay una pieza sin precio. Envía el pedido por WhatsApp y te cotizamos.", values: f };
    }
  }

  // Sin base de datos: solo armamos el mensaje de WhatsApp
  if (!hasServiceKey) {
    return { redirectTo: whatsappLink(whatsappOrderMessage(null, priced, total, fullName, f.city)) };
  }

  const db = createServiceClient();
  const { data: order, error } = await db
    .from("orders")
    .insert({
      ...f,
      channel,
      status: channel === "whatsapp" ? "pedido_whatsapp" : "pendiente_pago",
      subtotal,
      shipping,
      total,
      data_consent: true,
    })
    .select("id, number")
    .single();
  if (error || !order) return { error: "No pudimos crear el pedido. Intenta de nuevo.", values: f };

  const { error: itemsError } = await db.from("order_items").insert(
    priced.map((l) => ({
      order_id: order.id,
      variant_id: l.variantId,
      product_name: l.productName,
      color_name: l.colorName,
      size: l.size,
      qty: l.qty,
      unit_price: l.unitPrice,
    })),
  );
  if (itemsError) {
    await db.from("orders").delete().eq("id", order.id);
    return { error: "No pudimos guardar el pedido. Intenta de nuevo.", values: f };
  }

  if (channel === "whatsapp") {
    return { redirectTo: whatsappLink(whatsappOrderMessage(order.number, priced, total, fullName, f.city)) };
  }

  try {
    const pref = await createPreference({
      orderId: order.id,
      orderNumber: order.number,
      items: priced.map((l) => ({
        id: l.variantId,
        title: `${l.productName} · cordón ${l.colorName.toLowerCase()} · talla ${l.size}`,
        quantity: l.qty,
        unit_price: l.unitPrice,
      })),
      shipping,
      payer: { name: f.first_name, surname: f.last_name, email: f.email, phone: f.phone },
      siteUrl: await siteUrl(),
    });
    await db.from("orders").update({ mp_preference_id: pref.id }).eq("id", order.id);
    return { redirectTo: pref.url };
  } catch (e) {
    console.error(e);
    return { error: "No pudimos conectar con Mercado Pago. Intenta de nuevo o envía el pedido por WhatsApp.", values: f };
  }
}
