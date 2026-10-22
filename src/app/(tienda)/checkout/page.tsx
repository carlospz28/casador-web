import type { Metadata } from "next";
import { CheckoutForm } from "./checkout-form";

export const metadata: Metadata = {
  title: "Finalizar pedido",
  robots: { index: false },
};

export default function CheckoutPage() {
  return (
    <div className="mx-auto max-w-6xl px-6 pb-22 pt-10">
      <h1 className="mb-8 font-serif text-[clamp(32px,3.5vw,44px)] font-normal">Finalizar pedido</h1>
      <CheckoutForm />
    </div>
  );
}
