"use server";

import { refresh } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { ORDER_STATUS_LABEL } from "@/lib/types";

export async function updateOrderStatus(fd: FormData) {
  const { supabase } = await requireAdmin();
  const id = String(fd.get("id") ?? "");
  const status = String(fd.get("status") ?? "");
  if (!(status in ORDER_STATUS_LABEL)) return;
  await supabase.from("orders").update({ status }).eq("id", id);
  refresh();
}
