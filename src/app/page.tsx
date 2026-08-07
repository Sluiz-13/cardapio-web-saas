import Link from "next/link";
import {
  UtensilsCrossed,
  QrCode,
  Wallet,
  LayoutDashboard,
  CheckCircle2,
  ArrowRight,
  MessageCircle,
} from "lucide-react";
import { PLAN_PRICE_CENTS } from "@/lib/plan-pricing";
import { PLAN_LIMITS } from "@/lib/plan-features";
import { landingWhatsAppLink } from "@/lib/landing-whatsapp";

const currency = (cents: number) => `R$ ${Math.floor(cents / 100)}`;

const CTA_START = landingWhatsAppLink("Olá! Quero contratar o Cardápio Digital para o meu restaurante.");
const CTA_CONTACT = landingWhatsAppLink("Olá! Tenho uma dúvida sobre o Cardápio Digital.");

const FEATURES = [
  {
    icon: QrCode,
    title: "Cardápio Online",
    description: "Seu cardápio sempre atualizado, com QR Code pra mesa e link pra compartilhar no WhatsApp e redes sociais.",
  },
  {
    icon: UtensilsCrossed,
    title: "Pedidos Online",
    description: "Cliente monta o carrinho, escolhe entrega ou retirada, e o pedido cai direto no seu painel — sem app pra baixar.",
  },
  {
    icon: Wallet,
    title: "Pagamento Pix",
    description: "QR Code Pix gerado na hora, direto na sua chave. Sem intermediário, sem taxa por venda.",
  },
  {
    icon: LayoutDashboard,
    title: "Painel Completo",
    description: "Pedidos em tempo quase real, financeiro, relatórios e dashboard com gráfico — tudo no plano Pro.",
  },
];

const PLAN_FEATURE_ROWS: { label: string; start: boolean | string; pro: boolean | string }[] = [
  { label: "Cardápio online + QR Code", start: true, pro: true },
  { label: "Produtos", start: `Até ${PLAN_LIMITS.START.maxProducts}`, pro: "Ilimitado" },
  { label: "Categorias", start: `Até ${PLAN_LIMITS.START.maxCategories}`, pro: "Ilimitado" },
  { label: "Pedido pelo site + Pix", start: true, pro: true },
  { label: "Financeiro", start: true, pro: true },
  { label: "Dashboard com gráfico", start: false, pro: true },
  { label: "Relatórios avançados", start: false, pro: true },
  { label: "Cupons de desconto", start: false, pro: true },
  { label: "Exportação CSV", start: false, pro: true },
];

function FeatureCell({ value }: { value: boolean | string }) {
  if (typeof value === "string") return <span className="text-sm font-medium text-gray-700">{value}</span>;
  return value ? (
    <CheckCircle2 size={16} className="text-emerald-500" />
  ) : (
    <span className="text-gray-300 text-sm">—</span>
  );
}

export default function LandingPage() {
  return (
    <div className="bg-surface-bg text-gray-900">
      {/* NAV */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur border-b border-surface-border">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 font-bold text-gray-900">
            <div className="w-8 h-8 rounded-xl bg-brand-light flex items-center justify-center">
              <UtensilsCrossed size={16} className="text-brand" />
            </div>
            Cardápio Digital
          </div>
          <nav className="hidden sm:flex items-center gap-6 text-sm font-medium text-gray-600">
            <a href="#recursos" className="hover:text-gray-900 transition-colors duration-[180ms]">Recursos</a>
            <a href="#planos" className="hover:text-gray-900 transition-colors duration-[180ms]">Planos</a>
            <a href="#como-funciona" className="hover:text-gray-900 transition-colors duration-[180ms]">Como funciona</a>
            <a href={CTA_CONTACT} target="_blank" rel="noopener noreferrer" className="hover:text-gray-900 transition-colors duration-[180ms]">Contato</a>
          </nav>
          <div className="flex items-center gap-2">
            <Link href="/admin/login" className="hidden sm:inline text-sm font-semibold text-gray-600 hover:text-gray-900 px-3 py-2">
              Entrar
            </Link>
            
            <a href={CTA_START}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-semibold px-4 py-2.5 rounded-full bg-brand text-white shadow-sm hover:bg-brand-dark transition-colors duration-[180ms]"
            >
              Começar Agora
            </a>
          </div>
        </div>
      </header>

      {/* HERO */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 pt-16 pb-20 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        <div>
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand bg-brand-light px-3 py-1.5 rounded-full mb-5">
            Solução completa para restaurantes
          </span>
          <h1 className="text-4xl sm:text-5xl font-bold leading-tight text-gray-900 mb-5">
            Cardápio Digital para Restaurantes
          </h1>
          <p className="text-lg text-gray-500 mb-8 max-w-md">
            Receba pedidos online, gerencie seu restaurante e aumente suas vendas — sem taxa por pedido, sem complicação.
          </p>
          <div className="flex flex-wrap gap-3">
            
            <a href={CTA_START}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-5 py-3 rounded-full font-semibold text-sm bg-brand text-white shadow-sm hover:bg-brand-dark transition-colors duration-[180ms]"
            >
              Começar Agora <ArrowRight size={15} />
            </a>
            
            <a href="#como-funciona"
              className="inline-flex items-center px-5 py-3 rounded-full font-semibold text-sm border border-surface-border text-gray-700 hover:bg-gray-50 transition-colors duration-[180ms]"
            >
              Ver como funciona
            </a>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-surface-border shadow-lg p-5 max-w-sm mx-auto w-full">
          <div className="flex items-center justify-between mb-4">
            <p className="font-bold text-sm">Pizzaria Exemplo</p>
            <span className="text-emerald-600 text-xs font-semibold">R$ 67,90</span>
          </div>
          {[
            { name: "Pizza Margherita", desc: "Molho, muçarela, manjericão", price: "R$ 45,90" },
            { name: "Coca-Cola 350ml", desc: "Gelada", price: "R$ 6,00" },
            { name: "Combo Família", desc: "2 pizzas grandes + refrigerante", price: "R$ 88,90" },
          ].map((item) => (
            <div key={item.name} className="flex items-center justify-between py-3 border-b border-gray-50 last:border-0">
              <div>
                <p className="text-sm font-semibold text-gray-800">{item.name}</p>
                <p className="text-xs text-gray-400">{item.desc}</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-xs font-semibold text-gray-600">{item.price}</span>
                <div className="w-6 h-6 rounded-full bg-brand text-white flex items-center justify-center text-sm font-bold">+</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* FEATURES */}
      <section id="recursos" className="max-w-6xl mx-auto px-4 sm:px-6 py-16 scroll-mt-20">
        <h2 className="text-2xl font-bold text-center mb-2">Tudo que seu restaurante precisa</h2>
        <p className="text-gray-500 text-center mb-10">Sem mensalidade escondida, sem taxa por pedido.</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {FEATURES.map((f) => (
            <div key={f.title} className="bg-white rounded-2xl border border-surface-border shadow-sm p-5">
              <div className="w-10 h-10 rounded-xl bg-brand-light flex items-center justify-center mb-3">
                <f.icon size={18} className="text-brand" />
              </div>
              <p className="font-bold text-sm text-gray-900 mb-1">{f.title}</p>
              <p className="text-xs text-gray-500 leading-relaxed">{f.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* COMO FUNCIONA */}
      <section id="como-funciona" className="bg-white border-y border-surface-border py-16 scroll-mt-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <h2 className="text-2xl font-bold text-center mb-10">Como funciona</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
            {[
              { step: "1", title: "Você fala com a gente", desc: "Manda mensagem no WhatsApp e a gente configura seu cardápio pra você." },
              { step: "2", title: "Cliente faz o pedido", desc: "Pelo link do seu cardápio, sem precisar instalar nada." },
              { step: "3", title: "Você recebe e prepara", desc: "Pedido cai no seu painel, com aviso sonoro e status em tempo quase real." },
            ].map((s) => (
              <div key={s.step} className="text-center">
                <div className="w-10 h-10 rounded-full bg-brand text-white font-bold flex items-center justify-center mx-auto mb-3">
                  {s.step}
                </div>
                <p className="font-bold text-sm text-gray-900 mb-1">{s.title}</p>
                <p className="text-xs text-gray-500">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PLANOS */}
      <section id="planos" className="max-w-5xl mx-auto px-4 sm:px-6 py-16 scroll-mt-20">
        <h2 className="text-2xl font-bold text-center mb-2">Planos para o seu negócio</h2>
        <p className="text-gray-500 text-center mb-10">Escolha o plano ideal pro seu restaurante.</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-2xl mx-auto mb-10">
          <div className="bg-white rounded-2xl border border-surface-border shadow-sm p-6">
            <p className="text-xs font-bold uppercase tracking-wide text-gray-400 mb-2">Start</p>
            <p className="text-3xl font-bold text-gray-900 mb-1">
              {currency(PLAN_PRICE_CENTS.START)}<span className="text-sm font-medium text-gray-400">/mês</span>
            </p>
            <p className="text-xs text-gray-400 mb-5">Ideal para pequenos restaurantes</p>
            
            <a href={CTA_START}
              target="_blank"
              rel="noopener noreferrer"
              className="block text-center py-2.5 rounded-full font-semibold text-sm border border-surface-border text-gray-700 hover:bg-gray-50 transition-colors duration-[180ms]"
            >
              Começar Agora
            </a>
          </div>

          <div className="bg-ink rounded-2xl shadow-lg p-6 relative overflow-hidden">
            <span className="absolute top-4 right-4 text-[10px] font-bold uppercase tracking-wide bg-brand text-white px-2 py-1 rounded-full">
              Popular
            </span>
            <p className="text-xs font-bold uppercase tracking-wide text-gray-400 mb-2">Pro</p>
            <p className="text-3xl font-bold text-white mb-1">
              {currency(PLAN_PRICE_CENTS.PRO)}<span className="text-sm font-medium text-gray-400">/mês</span>
            </p>
            <p className="text-xs text-gray-400 mb-5">Para restaurantes que querem crescer</p>
            
            <a href={CTA_START}
              target="_blank"
              rel="noopener noreferrer"
              className="block text-center py-2.5 rounded-full font-semibold text-sm bg-brand text-white hover:bg-brand-dark transition-colors duration-[180ms]"
            >
              Começar Agora
            </a>
          </div>
        </div>

        <div className="overflow-x-auto rounded-2xl border border-surface-border bg-white shadow-sm">
          <table className="w-full text-sm table-fixed">
            <colgroup>
              <col className="w-1/2" />
              <col className="w-1/4" />
              <col className="w-1/4" />
            </colgroup>
            <thead>
              <tr className="border-b border-surface-border text-left text-xs uppercase tracking-wide text-gray-400">
                <th className="px-4 py-3 font-medium">Recurso</th>
                <th className="px-4 py-3 font-medium text-center">Start</th>
                <th className="px-4 py-3 font-medium text-center">Pro</th>
              </tr>
            </thead>
            <tbody>
              {PLAN_FEATURE_ROWS.map((row) => (
                <tr key={row.label} className="border-b border-gray-50 last:border-0">
                  <td className="px-4 py-3 text-gray-700">{row.label}</td>
                  <td className="px-4 py-3">
                    <div className="flex justify-center"><FeatureCell value={row.start} /></div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-center"><FeatureCell value={row.pro} /></div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* CTA FINAL */}
      <section className="bg-ink py-16">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="text-2xl font-bold text-white mb-3">Pronto pra digitalizar seu cardápio?</h2>
          <p className="text-gray-400 mb-7">Fala com a gente no WhatsApp e comece hoje mesmo.</p>
          
          <a href={CTA_START}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-6 py-3.5 rounded-full font-semibold text-sm bg-brand text-white shadow-sm hover:bg-brand-dark transition-colors duration-[180ms]"
          >
            <MessageCircle size={16} /> Falar no WhatsApp
          </a>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="py-8 border-t border-surface-border">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-gray-400">
          <span>© {new Date().getFullYear()} Cardápio Digital. Todos os direitos reservados.</span>
          <Link href="/privacidade" className="hover:text-gray-600 transition-colors duration-[180ms]">
            Aviso de Privacidade
          </Link>
        </div>
      </footer>
    </div>
  );
}