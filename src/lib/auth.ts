import "server-only";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { createSessionClient } from "./supabase/server";

/**
 * Verifica que quien está en /admin sea un admin registrado en la tabla `admins`.
 * Devuelve el cliente con su sesión: todas las escrituras pasan por RLS.
 */
export async function requireAdmin() {
  // El panel siempre se arma al momento de la petición (nunca se prerenderiza).
  await connection();
  const supabase = await createSessionClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/admin/login");

  const { data: admin } = await supabase.from("admins").select("user_id").eq("user_id", user.id).maybeSingle();
  if (!admin) redirect("/admin/login?error=no-admin");

  return { supabase, user };
}
