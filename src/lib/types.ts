export type Variant = {
  id: string;
  color_name: string;
  color_hex: string;
  stock: number;
};

export type ProductImage = {
  id: string;
  url: string;
  alt: string;
  position: number;
};

export type SizeOption = {
  label: string;
  range: string;
};

export type Product = {
  id: string;
  slug: string;
  name: string;
  short_description: string;
  description: string;
  ball_size_mm: number | null;
  ball_count: number | null;
  gold_weight_g: number | null;
  length_min_cm: number | null;
  length_max_cm: number | null;
  closure: string;
  cord_material: string;
  price: number;
  badge: string;
  active: boolean;
  featured: boolean;
  position: number;
  sizes: SizeOption[];
  variants: Variant[];
  images: ProductImage[];
  collections: string[];
};

export type Collection = {
  id: string;
  slug: string;
  name: string;
  description: string;
  position: number;
};

export type Review = {
  id: string;
  product_id: string | null;
  name: string;
  city: string;
  body: string;
  rating: number;
  approved: boolean;
  created_at: string;
};

export type CartItem = {
  variantId: string;
  productId: string;
  slug: string;
  name: string;
  colorName: string;
  size: string;
  qty: number;
  unitPrice: number;
  image: string | null;
};

export type OrderStatus =
  | "pendiente_pago"
  | "pagado"
  | "rechazado"
  | "pedido_whatsapp"
  | "enviado"
  | "entregado"
  | "cancelado";

export const ORDER_STATUS_LABEL: Record<OrderStatus, string> = {
  pendiente_pago: "Pendiente de pago",
  pagado: "Pagado",
  rechazado: "Pago rechazado",
  pedido_whatsapp: "Pedido por WhatsApp",
  enviado: "Enviado",
  entregado: "Entregado",
  cancelado: "Cancelado",
};
