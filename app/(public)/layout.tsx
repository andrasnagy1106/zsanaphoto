import type { ReactNode } from "react";
import { Footer } from "@/components/public/Footer";
import { Header } from "@/components/public/Header";

export default function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
    </>
  );
}
