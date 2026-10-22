import type { Metadata } from "next";
import localFont from "next/font/local";
import { CartProvider } from "@/components/cart/cart-provider";
import { CartDrawer } from "@/components/cart/cart-drawer";
import { site } from "@/lib/site";
import "./globals.css";

// Fuentes guardadas en el proyecto (licencia OFL): no dependen de Google al compilar.
const playfair = localFont({
  variable: "--font-playfair",
  display: "swap",
  src: [
    { path: "../fonts/playfair.woff2", weight: "400 900", style: "normal" },
    { path: "../fonts/playfair-italic.woff2", weight: "400 900", style: "italic" },
  ],
});

const jost = localFont({
  variable: "--font-jost",
  display: "swap",
  src: [{ path: "../fonts/jost.woff2", weight: "100 900", style: "normal" }],
});

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: {
    default: "Casa D'Or · Manillas con balines de oro 18K tejidas a mano",
    template: "%s · Casa D'Or",
  },
  description: site.description,
  openGraph: {
    type: "website",
    locale: "es_CO",
    siteName: site.name,
    description: site.description,
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es-CO" className={`${playfair.variable} ${jost.variable}`}>
      <body className="min-h-screen bg-crema text-tinta">
        <CartProvider>
          {children}
          <CartDrawer />
        </CartProvider>
      </body>
    </html>
  );
}
