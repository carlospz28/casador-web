import { site } from "@/lib/site";
import { LockIcon, ReturnIcon, ShieldIcon, TruckIcon } from "./icons";

const items = [
  { Icon: ShieldIcon, title: "Oro 18K certificado", text: "Ley 750, peso en gramos en cada pieza" },
  { Icon: TruckIcon, title: "Envío a todo Colombia", text: `${site.shippingDays}, con guía` },
  { Icon: ReturnIcon, title: site.warrantyText, text: "Cordón y cierre, condiciones claras" },
  { Icon: LockIcon, title: "Pago seguro", text: "Mercado Pago o por WhatsApp" },
];

export function TrustStrip() {
  return (
    <section aria-label="Garantías" className="border-y border-linea bg-arena">
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-6 px-6 py-7 sm:grid-cols-2 lg:grid-cols-4">
        {items.map(({ Icon, title, text }) => (
          <div key={title} className="flex items-start gap-3.5">
            <Icon className="size-7 shrink-0 text-oro" />
            <div>
              <p className="text-[15px] font-medium">{title}</p>
              <p className="mt-1 text-sm text-suave">{text}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
