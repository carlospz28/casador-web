import type { Review } from "@/lib/types";

export function ReviewList({ reviews }: { reviews: Review[] }) {
  return (
    <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
      {reviews.map((r) => (
        <figure key={r.id} className="flex flex-col gap-4 border border-linea bg-blanco p-7">
          <div className="tracking-[0.2em] text-oro" aria-label={`${r.rating} de 5 estrellas`}>
            {"★".repeat(r.rating)}
            <span className="text-borde">{"★".repeat(5 - r.rating)}</span>
          </div>
          <blockquote className="font-serif text-lg leading-normal">“{r.body}”</blockquote>
          <figcaption className="text-sm text-suave">
            {r.name}
            {r.city ? ` · ${r.city}` : ""}
          </figcaption>
        </figure>
      ))}
    </div>
  );
}
