import { Suspense } from "react";
import { requireAdmin } from "@/lib/auth";
import { createReview, deleteReview, toggleReview } from "./actions";

const input = "min-h-11 w-full border border-borde bg-white px-3 text-[15px]";

export default function ReviewsPage() {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-serif text-3xl font-normal">Reseñas</h1>
      <p className="text-sm text-suave">
        Copie aquí reseñas reales de clientes (WhatsApp, Instagram) con su permiso. Solo las aprobadas salen en la tienda.
      </p>
      <Suspense fallback={<div className="h-64 animate-pulse bg-arena" />}>
        <Reviews />
      </Suspense>
    </div>
  );
}

async function Reviews() {
  const { supabase } = await requireAdmin();
  const [{ data: reviews }, { data: products }] = await Promise.all([
    supabase.from("reviews").select("id, name, city, body, rating, approved, products(name)").order("created_at", { ascending: false }),
    supabase.from("products").select("id, name").order("position"),
  ]);

  return (
    <>
      <form action={createReview} className="grid gap-4 border border-linea bg-crema p-6 sm:grid-cols-2">
        <label className="flex flex-col gap-1.5 text-sm">
          Nombre del cliente
          <input name="name" required placeholder="Valentina R." className={input} />
        </label>
        <label className="flex flex-col gap-1.5 text-sm">
          Ciudad
          <input name="city" placeholder="Bogotá" className={input} />
        </label>
        <label className="flex flex-col gap-1.5 text-sm sm:col-span-2">
          Lo que dijo
          <textarea name="body" required rows={3} className={`${input} py-2`} />
        </label>
        <label className="flex flex-col gap-1.5 text-sm">
          Producto (opcional)
          <select name="product_id" className={input} defaultValue="">
            <option value="">General (sale en el inicio)</option>
            {(products ?? []).map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1.5 text-sm">
          Estrellas
          <select name="rating" defaultValue="5" className={input}>
            {[5, 4, 3, 2, 1].map((n) => (
              <option key={n}>{n}</option>
            ))}
          </select>
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="approved" defaultChecked className="size-4 accent-tinta" />
          Publicar ya
        </label>
        <button type="submit" className="min-h-11 bg-tinta text-sm uppercase tracking-widest text-crema sm:justify-self-end sm:px-8">
          Agregar reseña
        </button>
      </form>

      <ul className="flex flex-col gap-3">
        {(reviews ?? []).map((r) => {
          const productName = (r.products as unknown as { name: string } | null)?.name;
          return (
            <li key={r.id} className="flex flex-wrap items-start justify-between gap-4 border border-linea bg-crema p-4">
              <div className="min-w-0 flex-1">
                <p className="text-sm">
                  <strong className="font-medium">{r.name}</strong>
                  {r.city ? ` · ${r.city}` : ""} · {"★".repeat(r.rating)}
                  {productName ? ` · ${productName}` : ""}
                </p>
                <p className="mt-1 text-sm text-texto">{r.body}</p>
              </div>
              <div className="flex gap-3 text-sm">
                <form action={toggleReview}>
                  <input type="hidden" name="id" value={r.id} />
                  <input type="hidden" name="approved" value={String(!r.approved)} />
                  <button type="submit" className="underline">
                    {r.approved ? "Ocultar" : "Publicar"}
                  </button>
                </form>
                <form action={deleteReview}>
                  <input type="hidden" name="id" value={r.id} />
                  <button type="submit" className="text-[#A3262A] underline">
                    Borrar
                  </button>
                </form>
              </div>
            </li>
          );
        })}
      </ul>
    </>
  );
}
