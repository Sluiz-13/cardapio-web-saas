import type { Metadata } from "next";
import "./global.css";
import "leaflet/dist/leaflet.css";
import { ToastProvider } from "@/components/ui/Toast";
import { CookieConsent } from "@/components/ui/CookieConsent";

const TITLE = "Menuair — Sistema completo pra restaurante: pedidos, mesas, caixa e estoque";
const DESCRIPTION =
  "Pedidos, mesas, comandas, caixa, estoque, fidelidade e delivery — tudo em um só lugar, sem pagar comissão por venda. Seu canal próprio de vendas.";

export const metadata: Metadata = {
  metadataBase: new URL("https://menuair.com.br"),
  title: TITLE,
  description: DESCRIPTION,
  keywords: [
    "cardápio digital",
    "sistema para restaurante",
    "PDV para restaurante",
    "controle de estoque restaurante",
    "sistema de delivery",
    "cardápio online sem taxa",
  ],
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: "https://menuair.com.br",
    siteName: "Menuair",
    locale: "pt_BR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
  },
};
const JSON_LD = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "Menuair",
  applicationCategory: "BusinessApplication",
  operatingSystem: "Web",
  description:
    "Sistema completo pra restaurante: cardápio digital, pedidos, mesas, comandas, caixa, controle de estoque, fidelidade e cashback — sem comissão por venda.",
  offers: {
    "@type": "Offer",
    priceCurrency: "BRL",
    price: "100",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <head>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(JSON_LD) }} />
      </head>
      <body className="bg-chalk text-ink min-h-screen">
        <ToastProvider>{children}</ToastProvider>
        <CookieConsent />
      </body>
    </html>
  );
}