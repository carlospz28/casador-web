import { Header } from "@/components/header";
import { Footer } from "@/components/footer";

export default function TiendaLayout({ children }: LayoutProps<"/">) {
  return (
    <>
      <Header />
      <main>{children}</main>
      <Footer />
    </>
  );
}
