"use client";

import Link from "next/link";
import Image from "next/image";
import { useActionState, useEffect } from "react";
import { useCart } from "@/components/cart/cart-provider";
import { DEPARTAMENTOS } from "@/lib/colombia";
import { formatCOP, priceLabel, shippingFor } from "@/lib/site";
import { createOrder, type CheckoutState } from "./actions";

const input =
  "min-h-12 w-full border border-borde bg-blanco px-3 text-[15px] text-tinta aria-[invalid=true]:border-[#A3262A]";

function Field({
  name,
  label,
  error,
  className = "",
  ...rest
}: { name: string; label: string; error?: string; className?: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className={`flex flex-col gap-1.5 text-sm ${className}`}>
      {label}
      <input name={name} className={input} aria-invalid={Boolean(error)} {...rest} />
      {error && <span className="text-[13px] text-[#A3262A]">{error}</span>}
    </label>
  );
}

export function CheckoutForm() {
  const { items, subtotal, clear, ready, sync, syncing, notice } = useCart();
  const [state, action, pending] = useActionState<CheckoutState, FormData>(createOrder, {});
  const e = state.fieldErrors ?? {};
  const v = state.values ?? {};

  // Al entrar al checkout se confirman precio, foto y stock con la base de datos.
  useEffect(() => {
    if (ready) sync();
  }, [ready, sync]);

  useEffect(() => {
    if (state.redirectTo) {
      clear();
      window.location.assign(state.redirectTo);
    }
  }, [state.redirectTo, clear]);

  if (!ready) return <div className="h-96 animate-pulse bg-arena" />;

  if (items.length === 0 && !state.redirectTo) {
    return (
      <div className="flex flex-col items-start gap-4">
        <p className="text-texto">Tu bolsa está vacía.</p>
        <Link href="/manillas" className="inline-flex min-h-12 items-center bg-tinta px-8 text-sm uppercase tracking-widest text-crema hover:text-crema">
          Ver manillas
        </Link>
      </div>
    );
  }

  const shipping = shippingFor(subtotal);
  const cartJson = JSON.stringify(items.map(({ variantId, size, qty }) => ({ variantId, size, qty })));

  return (
    <form action={action} className="grid items-start gap-12 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
      <input type="hidden" name="cart" value={cartJson} />

      <div className="order-last flex min-w-0 flex-col gap-8 lg:order-first">
        <fieldset className="grid gap-4 sm:grid-cols-2">
          <legend className="mb-4 text-xs uppercase tracking-[0.12em] text-suave">Tus datos</legend>
          <Field name="first_name" defaultValue={v.first_name} label="Nombre" autoComplete="given-name" required error={e.first_name} />
          <Field name="last_name" defaultValue={v.last_name} label="Apellido" autoComplete="family-name" required error={e.last_name} />
          <Field name="phone" defaultValue={v.phone} label="Celular (WhatsApp)" type="tel" inputMode="tel" autoComplete="tel" required error={e.phone} />
          <Field name="email" defaultValue={v.email} label="Correo" type="email" autoComplete="email" required error={e.email} />
          <Field name="document" defaultValue={v.document} label="Cédula (opcional, para la factura)" inputMode="numeric" className="sm:col-span-2" />
        </fieldset>

        <fieldset className="grid gap-4 sm:grid-cols-2">
          <legend className="mb-4 text-xs uppercase tracking-[0.12em] text-suave">Dirección de envío</legend>
          <Field
            name="address"
            label="Dirección completa"
            autoComplete="street-address"
            placeholder="Calle, número, apto, barrio"
            required
            error={e.address}
            className="sm:col-span-2"
          />
          <Field name="city" defaultValue={v.city} label="Ciudad o municipio" autoComplete="address-level2" required error={e.city} />
          <label className="flex flex-col gap-1.5 text-sm">
            Departamento
            <select name="department" required defaultValue={v.department ?? ""} key={v.department ?? "vacio"} className={input} aria-invalid={Boolean(e.department)}>
              <option value="" disabled>
                Elige uno
              </option>
              {DEPARTAMENTOS.map((d) => (
                <option key={d}>{d}</option>
              ))}
            </select>
            {e.department && <span className="text-[13px] text-[#A3262A]">{e.department}</span>}
          </label>
          <label className="flex flex-col gap-1.5 text-sm sm:col-span-2">
            Notas para el pedido (opcional)
            <textarea name="notes" defaultValue={v.notes} rows={3} maxLength={500} className={`${input} py-2`} />
          </label>
        </fieldset>

        <label className="flex items-start gap-3 text-sm leading-relaxed">
          <input type="checkbox" name="consent" required className="mt-1 size-4 accent-tinta" />
          <span>
            Acepto la{" "}
            <Link href="/ayuda/tratamiento-de-datos" target="_blank">
              política de tratamiento de datos
            </Link>{" "}
            y los{" "}
            <Link href="/ayuda/terminos" target="_blank">
              términos de compra
            </Link>
            .
            {e.consent && <span className="block text-[13px] text-[#A3262A]">{e.consent}</span>}
          </span>
        </label>

        {notice && (
          <p role="status" className="border border-borde bg-arena p-3 text-sm text-texto">
            {notice} Revisa el resumen antes de pagar.
          </p>
        )}

        {state.error && (
          <p role="alert" className="border border-[#A3262A] bg-[#FBEFEF] p-3 text-sm text-[#7A1D20]">
            {state.error}
          </p>
        )}

        <div className="flex flex-col gap-3">
          <button
            type="submit"
            name="channel"
            value="mercadopago"
            disabled={pending || syncing}
            className="min-h-13 bg-tinta text-sm uppercase tracking-[0.1em] text-crema hover:bg-[#33302b] disabled:opacity-60"
          >
            {pending ? "Procesando…" : syncing ? "Revisando precios…" : `Pagar ${formatCOP(subtotal + shipping)} con Mercado Pago`}
          </button>
          <p className="text-center text-xs text-suave">Nequi · PSE · Tarjetas · Efecty. Pago seguro en Mercado Pago.</p>
          <button
            type="submit"
            name="channel"
            value="whatsapp"
            disabled={pending || syncing}
            className="min-h-13 border border-tinta text-sm uppercase tracking-[0.1em] disabled:opacity-60"
          >
            Enviar pedido por WhatsApp
          </button>
        </div>
      </div>

      <aside className="order-first flex min-w-0 flex-col gap-4 border border-linea bg-arena p-6 lg:sticky lg:top-28 lg:order-last">
        <h2 className="text-xs uppercase tracking-[0.12em] text-suave">Tu pedido</h2>
        <ul className="flex flex-col divide-y divide-linea">
          {items.map((i) => (
            <li key={`${i.variantId}-${i.size}`} className="flex gap-3 py-3">
              <div className="relative size-16 shrink-0 overflow-hidden bg-lino">
                {i.image && <Image src={i.image} alt="" fill sizes="64px" className="object-cover" />}
              </div>
              <div className="flex flex-1 flex-col text-sm">
                <span>
                  {i.qty} × {i.name}
                </span>
                <span className="text-[13px] text-suave">
                  Cordón {i.colorName.toLowerCase()} · Talla {i.size}
                </span>
              </div>
              <span className="text-sm">{priceLabel(i.unitPrice * i.qty)}</span>
            </li>
          ))}
        </ul>
        <dl className="flex flex-col gap-2 border-t border-linea pt-4 text-sm">
          <div className="flex justify-between">
            <dt>Subtotal</dt>
            <dd>{formatCOP(subtotal)}</dd>
          </div>
          <div className="flex justify-between">
            <dt>Envío</dt>
            <dd>{shipping > 0 ? formatCOP(shipping) : "Gratis"}</dd>
          </div>
          <div className="flex justify-between border-t border-linea pt-3 text-base font-medium">
            <dt>Total</dt>
            <dd>{formatCOP(subtotal + shipping)}</dd>
          </div>
        </dl>
      </aside>
    </form>
  );
}
