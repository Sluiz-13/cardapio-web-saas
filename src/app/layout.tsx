import type { Metadata } from "next";
import "./global.css";
import { ToastProvider } from "@/components/ui/Toast";

export const metadata: Metadata = {
  title: "Cardápio Digital",
  description: "Cardápio online com pedido e pagamento",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className="bg-chalk text-ink min-h-screen">
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}