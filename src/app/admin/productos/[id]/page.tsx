import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { requireAdmin } from "@/lib/auth";
import type { Collection, Product } from "@/lib/types";
import { ProductForm } from "../product-form";
import { ImageManager } from "../image-manager";
import { deleteProduct } from "../actions";

export default function EditProductPage(props: PageProps<"/admin/productos/[id]">) {
  return (
    <div className="flex flex-col gap-6">
      <Link href="/admin" className="text-sm">
        ← Productos
      </Link>
      <Suspense fallback={<div className="h-96 animate-pulse bg-arena" />}>
        <Editor params={props.params} searchParams={props.searchParams} />
      </Suspense>
    </div>
  );
}

const SELECT = `
  id, slug, name, short_description, description, ball_size_mm, ball_count, gold_weight_g,
  length_min_cm, length_max_cm, closure, cord_material, price, badge, active, featured, position, sizes,
  variants:product_variants(id, color_name, color_hex, stock, position),
  images:product_images(id, url, alt, position),
  product_collections(collection_id)
`;

async function Editor({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { supabase } = await requireAdmin();
  const { id } = await params;
  const isNew = id === "nuevo";
  const justCreated = (await searchParams).nuevo === "1";

  const { data: collections } = await supabase.from("collections").select("id, slug, name, description, position").order("position");

  let product: (Product & { collectionIds: string[] }) | null = null;
  if (!isNew) {
    const { data } = await supabase.from("products").select(SELECT).eq("id", id).maybeSingle();
    if (!data) notFound();
    const row = data as unknown as Product & {
      variants: (Product["variants"][number] & { position: number })[];
      product_collections: { collection_id: string }[];
    };
    product = {
      ...row,
      variants: [...row.variants].sort((a, b) => a.position - b.position),
      images: [...row.images].sort((a, b) => a.position - b.position),
      collections: [],
      collectionIds: row.product_collections.map((pc) => pc.collection_id),
    };
  }

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-serif text-3xl font-normal">{isNew ? "Nuevo producto" : product?.name}</h1>
        {product && (
          <Link href={`/manillas/${product.slug}`} target="_blank" className="text-sm">
            Ver en la tienda
          </Link>
        )}
      </div>
      {justCreated && (
        <p className="border border-borde bg-arena p-3 text-sm">Producto creado. Ahora suba sus fotos abajo.</p>
      )}

      <ProductForm product={product} collections={(collections ?? []) as Collection[]} />

      {product ? (
        <>
          <ImageManager productId={product.id} productName={product.name} images={product.images} />
          <form action={deleteProduct} className="border-t border-linea pt-6">
            <input type="hidden" name="id" value={product.id} />
            <button type="submit" className="text-sm text-[#A3262A] underline">
              Borrar este producto
            </button>
            <p className="mt-1 text-xs text-suave">
              Si solo quiere esconderlo, quite la casilla “Visible en la tienda” y guarde.
            </p>
          </form>
        </>
      ) : (
        <p className="text-sm text-suave">Las fotos se suben después de guardar el producto por primera vez.</p>
      )}
    </>
  );
}
