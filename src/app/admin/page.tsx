import Link from "next/link";
import { Suspense } from "react";
import { requireAdmin } from "@/lib/auth";
import { priceLabel } from "@/lib/site";

export default function AdminProductsPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-serif text-3xl font-normal">Productos</h1>
        <Link
          href="/admin/productos/nuevo"
          className="inline-flex min-h-11 items-center bg-tinta px-5 text-sm text-crema no-underline hover:text-crema"
        >
          + Nuevo producto
        </Link>
      </div>
      <Suspense fallback={<div className="h-64 animate-pulse bg-arena" />}>
        <ProductTable />
      </Suspense>
    </div>
  );
}

async function ProductTable() {
  const { supabase } = await requireAdmin();
  const { data: products, error } = await supabase
    .from("products")
    .select("id, name, slug, price, active, featured, position, product_variants(stock), product_images(url, position)")
    .order("position");

  if (error) return <p className="text-[#A3262A]">Error: {error.message}</p>;
  if (!products?.length) return <p className="text-suave">Todavía no hay productos. Cree el primero.</p>;

  return (
    <div className="overflow-x-auto border border-linea bg-crema">
      <table className="w-full min-w-[640px] text-left text-sm">
        <thead className="border-b border-linea text-xs uppercase tracking-wider text-suave">
          <tr>
            <th className="p-3">Producto</th>
            <th className="p-3">Precio</th>
            <th className="p-3">Stock</th>
            <th className="p-3">Fotos</th>
            <th className="p-3">Estado</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-linea">
          {products.map((p) => {
            const stock = p.product_variants.reduce((n: number, v: { stock: number }) => n + v.stock, 0);
            return (
              <tr key={p.id}>
                <td className="p-3">
                  <Link href={`/admin/productos/${p.id}`} className="font-medium">
                    {p.name}
                  </Link>
                  <div className="text-xs text-suave">/{p.slug}</div>
                </td>
                <td className="p-3">{priceLabel(p.price)}</td>
                <td className={`p-3 ${stock === 0 ? "text-[#A3262A]" : ""}`}>{stock}</td>
                <td className="p-3">{p.product_images.length}</td>
                <td className="p-3">
                  {p.active ? "Visible" : "Oculto"}
                  {p.featured ? " · Destacado" : ""}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
