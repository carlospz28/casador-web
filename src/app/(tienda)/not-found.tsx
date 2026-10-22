import { ButtonLink } from "@/components/ui";

export default function NotFound() {
  return (
    <div className="mx-auto flex max-w-xl flex-col items-center gap-5 px-6 py-28 text-center">
      <h1 className="font-serif text-4xl font-normal">No encontramos esta página</h1>
      <p className="text-texto">Puede que la manilla ya no esté disponible o que el enlace tenga un error.</p>
      <ButtonLink href="/manillas">Ver manillas</ButtonLink>
    </div>
  );
}
