"use server";

import { requireAdmin } from "@/lib/auth";
import { refreshCatalog } from "@/lib/refresh-catalog";

export async function createReview(fd: FormData) {
  const { supabase } = await requireAdmin();
  const name = String(fd.get("name") ?? "").trim();
  const body = String(fd.get("body") ?? "").trim();
  if (!name || !body) return;
  await supabase.from("reviews").insert({
    name,
    body,
    city: String(fd.get("city") ?? "").trim(),
    rating: Math.min(5, Math.max(1, Number(fd.get("rating")) || 5)),
    product_id: String(fd.get("product_id") ?? "") || null,
    approved: fd.get("approved") === "on",
  });
  await refreshCatalog("todos");
}

export async function toggleReview(fd: FormData) {
  const { supabase } = await requireAdmin();
  await supabase
    .from("reviews")
    .update({ approved: fd.get("approved") === "true" })
    .eq("id", String(fd.get("id")));
  await refreshCatalog("todos");
}

export async function deleteReview(fd: FormData) {
  const { supabase } = await requireAdmin();
  await supabase.from("reviews").delete().eq("id", String(fd.get("id")));
  await refreshCatalog("todos");
}
