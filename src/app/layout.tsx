import type { Metadata } from "next";
import "./global.css";
import { ToastProvider } from "@/components/ui/Toast";
import { CookieConsent } from "@/components/ui/CookieConsent";

export const metadata: Metadata = {
  title: "Menuair — Cardápio Digital para Restaurantes",
  description: "Cardápio online, pedidos e Pix pro seu restaurante — sem taxa por venda.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className="bg-chalk text-ink min-h-screen">
        <ToastProvider>{children}</ToastProvider>
        <CookieConsent />
      </body>
    </html>
  );
}