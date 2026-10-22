// Datos del negocio. Cambie los valores entre corchetes por los reales.

export const site = {
  name: "Casa D'Or",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  description:
    "Manillas con balines de oro 18K ley 750, tejidas a mano en Fusagasugá, Colombia. Con certificado de autenticidad y envío a todo el país.",
  whatsapp: "573158149692",
  instagram: "casador.jewelry",
  city: "Fusagasugá, Cundinamarca",
  hours: "Lun a sáb · 9:00 a. m. a 7:00 p. m.",

  // Datos del vendedor (obligatorios en una tienda online)
  sellerName: "[Nombre o razón social]",
  sellerId: "[NIT o C.C.]",
  email: "[correo de contacto]",

  // Envíos y garantía
  shippingCost: 0, // en pesos; 0 = envío gratis siempre
  freeShippingFrom: 0, // en pesos; 0 = no aplica
  shippingDays: "2 a 5 días hábiles",
  warrantyText: "Garantía de [X] meses",
} as const;

export function whatsappLink(message: string) {
  return `https://wa.me/${site.whatsapp}?text=${encodeURIComponent(message)}`;
}

/** Enlace de WhatsApp a un cliente (agrega el 57 si el número es de 10 dígitos). */
export function whatsappTo(phone: string, message: string) {
  const digits = phone.replace(/\D/g, "");
  const full = digits.length === 10 ? `57${digits}` : digits;
  return `https://wa.me/${full}?text=${encodeURIComponent(message)}`;
}

export function shippingFor(subtotal: number) {
  if (site.freeShippingFrom > 0 && subtotal >= site.freeShippingFrom) return 0;
  return site.shippingCost;
}

export function announcement() {
  if (site.freeShippingFrom > 0) {
    return `Envío gratis a todo Colombia desde ${formatCOP(site.freeShippingFrom)} · Paga con Nequi, PSE, tarjeta o Efecty`;
  }
  return "Envíos a todo Colombia · Paga con Nequi, PSE, tarjeta o Efecty";
}

export function formatCOP(value: number) {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(value);
}

/** Números con decimales a la colombiana: 1,2 en vez de 1.2 */
export function formatNumber(value: number) {
  return new Intl.NumberFormat("es-CO", { maximumFractionDigits: 2 }).format(value);
}

export function priceLabel(value: number) {
  return value > 0 ? formatCOP(value) : "Consultar precio";
}
