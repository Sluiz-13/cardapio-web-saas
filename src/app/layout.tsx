import type { Metadata } from "next";
import "./global.css";

export const metadata: Metadata = {
  title: "Cardápio Digital",
  description: "Cardápio online com pedido e pagamento",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className="bg-chalk text-ink">{children}</body>
    </html>
  );
}