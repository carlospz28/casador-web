import "server-only";
import { createClient } from "@supabase/supabase-js";
import { SUPABASE_URL } from "./env";

const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";

export const hasServiceKey = Boolean(SUPABASE_URL && SERVICE_KEY);

/**
 * Cliente con la llave de servicio: se salta RLS.
 * Solo se usa en el servidor para crear pedidos y procesar pagos.
 * Nunca lo importe en un componente de cliente.
 */
export function createServiceClient() {
  return createClient(SUPABASE_URL, SERVICE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
