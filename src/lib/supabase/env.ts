export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
// La integración de Supabase en Vercel puede crear la clave con cualquiera de los dos nombres.
export const SUPABASE_ANON_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? "";

/** true cuando las variables de Supabase están puestas */
export const hasSupabase = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);

export const PRODUCT_BUCKET = "productos";
