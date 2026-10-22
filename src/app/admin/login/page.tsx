import { Suspense } from "react";
import { LoginForm } from "./login-form";

export default function LoginPage(props: PageProps<"/admin/login">) {
  return (
    <div className="mx-auto max-w-sm py-10">
      <h1 className="mb-6 font-serif text-3xl font-normal">Entrar al panel</h1>
      <Suspense>
        <NoAdminNotice searchParams={props.searchParams} />
      </Suspense>
      <LoginForm />
    </div>
  );
}

async function NoAdminNotice({ searchParams }: { searchParams: PageProps<"/admin/login">["searchParams"] }) {
  const sp = await searchParams;
  if (sp.error !== "no-admin") return null;
  return (
    <p className="mb-4 border border-borde bg-arena p-3 text-sm">
      Su usuario existe pero no es admin. Agréguelo a la tabla <code>admins</code> (ver README).
    </p>
  );
}
