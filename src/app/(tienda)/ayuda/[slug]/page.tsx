import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { HELP_PAGES, getHelpPage } from "@/lib/help-content";
import { Breadcrumbs } from "@/components/ui";

export function generateStaticParams() {
  return HELP_PAGES.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata(props: PageProps<"/ayuda/[slug]">): Promise<Metadata> {
  const page = getHelpPage((await props.params).slug);
  if (!page) return {};
  return { title: page.title, description: page.intro, alternates: { canonical: `/ayuda/${page.slug}` } };
}

export default async function HelpPage(props: PageProps<"/ayuda/[slug]">) {
  const page = getHelpPage((await props.params).slug);
  if (!page) notFound();

  return (
    <div className="mx-auto flex max-w-7xl flex-wrap gap-14 px-6 pb-22 pt-6">
      <div className="w-full">
        <Breadcrumbs items={[{ href: "/", label: "Inicio" }, { label: "Ayuda" }, { label: page.title }]} />
      </div>
      <nav aria-label="Ayuda" className="flex min-w-0 flex-[1_1_220px] flex-col gap-2 text-sm">
        {HELP_PAGES.map((p) => (
          <Link
            key={p.slug}
            href={`/ayuda/${p.slug}`}
            aria-current={p.slug === page.slug ? "page" : undefined}
            className={`py-1 no-underline ${p.slug === page.slug ? "font-medium text-oro" : ""}`}
          >
            {p.title}
          </Link>
        ))}
      </nav>
      <article className="flex min-w-0 flex-[3_1_520px] flex-col gap-6">
        <h1 className="font-serif text-[clamp(32px,3.5vw,44px)] font-normal">{page.title}</h1>
        <p className="text-lg leading-relaxed text-texto">{page.intro}</p>
        {page.sections.map((s) => (
          <section key={s.heading} className="flex flex-col gap-3 border-t border-linea pt-6">
            <h2 className="text-xl font-medium">{s.heading}</h2>
            {s.paragraphs.map((para) => (
              <p key={para} className="leading-[1.7] text-texto">
                {para}
              </p>
            ))}
          </section>
        ))}
      </article>
    </div>
  );
}
