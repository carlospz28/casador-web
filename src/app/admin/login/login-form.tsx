"use client";

import { useActionState } from "react";
import { signIn } from "./actions";

const input = "min-h-12 w-full border border-borde bg-blanco px-3";

export function LoginForm() {
  const [state, action, pending] = useActionState(signIn, {});
  return (
    <form action={action} className="flex flex-col gap-4">
      <label className="flex flex-col gap-1.5 text-sm">
        Correo
        <input name="email" type="email" autoComplete="email" required className={input} />
      </label>
      <label className="flex flex-col gap-1.5 text-sm">
        Contraseña
        <input name="password" type="password" autoComplete="current-password" required className={input} />
      </label>
      {state.error && (
        <p role="alert" className="text-sm text-[#A3262A]">
          {state.error}
        </p>
      )}
      <button disabled={pending} className="min-h-12 bg-tinta text-sm uppercase tracking-widest text-crema disabled:opacity-60">
        {pending ? "Entrando…" : "Entrar"}
      </button>
    </form>
  );
}
