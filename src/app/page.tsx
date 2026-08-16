"use client";

import { useState } from "react";
import Link from "next/link";
import {
  QrCode,
  ClipboardList,
  Store,
  Wallet,
  Smartphone,
  Check,
  ChevronDown,
  ArrowRight,
  MessageCircle,
  Mail,
  SlidersHorizontal
} from "lucide-react";
import { PLAN_PRICE_CENTS } from "@/lib/plan-pricing";
import { PLAN_LIMITS } from "@/lib/plan-features";
import { landingWhatsAppLink } from "@/lib/landing-whatsapp";

const CONTACT_EMAIL = "suporte@menuair.com.br";
const currency = (cents: number) => `R$ ${Math.floor(cents / 100)}`;

const BENEFITS = [
  { icon: QrCode, title: "Cardápio digital", text: "Seu cliente acessa pelo celular, por link ou QR Code na mesa." },
  { icon: ClipboardList, title: "Pedidos organizados", text: "Chega tudo no painel — sem depender de mensagem espalhada no WhatsApp." },
  { icon: SlidersHorizontal, title: "Você no controle", text: "Produtos, preços, categorias e pedidos, tudo num só lugar." },
];

const STEPS = [
  { n: "01", title: "Abre o cardápio", text: "O cliente acessa seu cardápio pelo link ou QR Code.", src: "/screenshots/menu.jpeg" },
  { n: "02", title: "Escolhe os produtos", text: "Personaliza removíveis e extras de cada item.", src: "/screenshots/product.jpeg" },
  { n: "03", title: "Envia o pedido", text: "Preenche os dados, escolhe a forma de pagamento e finaliza.", src: "/screenshots/checkout.jpeg" },
  { n: "04", title: "Pedido confirmado", text: "Recebe a confirmação e o pedido já vai pra cozinha.", src: "/screenshots/confirm.jpeg" },
];

const OWNER_BENEFITS = [
  { icon: ClipboardList, title: "Pedidos organizados", text: "Informação clara, direto no painel." },
  { icon: Store, title: "Seu próprio cardápio", text: "Logo, cores e produtos do seu jeito." },
  { icon: Wallet, title: "Pagamento por Pix", text: "Sem intermediário, sem comissão." },
  { icon: Smartphone, title: "Acesso pelo celular", text: "Gerencie de onde estiver." },
];

const PLAN_FEATURE_ROWS: { label: string; start: boolean | string; pro: boolean | string }[] = [
  { label: "Cardápio online + QR Code do seu cardápio", start: true, pro: true },
  { label: "QR Code por mesa", start: false, pro: true },
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
  if (typeof value === "string") return <span className="text-sm font-medium text-slate-700">{value}</span>;
  return value ? <Check size={18} className="text-[#D35400] mx-auto" /> : <span className="text-slate-300">—</span>;
}

const FAQ = [
  { q: "Preciso instalar algum aplicativo?", a: "Não. O Menuair funciona no navegador, tanto pra você quanto pro seu cliente." },
  { q: "Como meu cliente acessa o cardápio?", a: "Por um link do seu restaurante ou por QR Code, direto do celular." },
  { q: "O Menuair cobra comissão por pedido?", a: "Não. Você paga só a mensalidade do plano escolhido." },
  { q: "Posso receber pagamento por Pix?", a: "Sim, o Pix é gerado na hora, direto na sua chave — sem intermediário." },
  { q: "Preciso ter conhecimento técnico?", a: "Não. A gente ajuda a configurar tudo, e o dia a dia é feito em telas simples." },
];

function FaqAccordion() {
  const [open, setOpen] = useState<number | null>(null);
  return (
    <div className="divide-y divide-slate-200">
      {FAQ.map((item, i) => (
        <div key={item.q} className="py-5">
          <button
            onClick={() => setOpen(open === i ? null : i)}
            className="w-full flex items-center justify-between text-left font-medium text-slate-800 hover:text-[#D35400] transition-colors"
          >
            {item.q}
            <ChevronDown size={20} className={`text-slate-400 shrink-0 transition-transform duration-[180ms] ${open === i ? "rotate-180" : ""}`} />
          </button>
          {open === i && <p className="mt-4 text-sm text-slate-500 leading-relaxed">{item.a}</p>}
        </div>
      ))}
    </div>
  );
}

export default function LandingPage() {
  const [form, setForm] = useState({ restaurantName: "", yourName: "", phone: "", plan: "START" as "START" | "PRO" });
  const formValid = form.restaurantName.trim() && form.yourName.trim() && form.phone.trim();

  const devWhatsApp = "https://wa.me/5535999603944?text=" + encodeURIComponent("Olá! Vi um cardápio digital feito por você e gostaria de saber mais.");

  function buildMessage() {
    return [
      "Olá! Quero contratar o Menuair.",
      `Restaurante: ${form.restaurantName || "-"}`,
      `Meu nome: ${form.yourName || "-"}`,
      `Telefone: ${form.phone || "-"}`,
      `Plano de interesse: ${form.plan === "PRO" ? "Pro" : "Start"}`,
    ].join("\n");
  }

  function handleWhatsApp(e: React.FormEvent) {
    e.preventDefault();
    window.open(landingWhatsAppLink(buildMessage()), "_blank");
  }

  function handleEmail() {
    const subject = encodeURIComponent(`Quero contratar o Menuair — ${form.restaurantName || "novo restaurante"}`);
    window.open(`mailto:${CONTACT_EMAIL}?subject=${subject}&body=${encodeURIComponent(buildMessage())}`, "_blank");
  }

  return (
    <div className="min-h-screen bg-[#FCFBF8] text-slate-900 font-sans scroll-smooth">
      
      {/* NAVBAR */}
      {/* NAVBAR */}
      <nav className="sticky top-0 z-40 bg-[#FCFBF8]/95 backdrop-blur border-b border-slate-200">
        <div className="flex items-center justify-between px-6 py-4 max-w-7xl mx-auto">
          <div className="flex items-center gap-8 lg:gap-12">
            <div className="flex items-center gap-2 font-bold text-xl text-slate-900">
              <div className="bg-slate-900 text-white p-1 rounded-md w-8 h-8 flex items-center justify-center text-sm">M</div>
              Menuair
            </div>
            <div className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600">
              <a href="#como-funciona" className="hover:text-slate-900 transition-colors">Como funciona</a>
              <a href="#planos" className="hover:text-slate-900 transition-colors">Planos</a>
              <a href="#faq" className="hover:text-slate-900 transition-colors">Dúvidas</a>
            </div>
          </div>
          <div className="flex items-center gap-4 sm:gap-6">
            <a href="#contato" className="bg-[#D35400] text-white px-5 py-2.5 rounded-full text-sm font-semibold hover:bg-[#b84a00] transition-colors text-center">
              Falar com a gente
            </a>
            <Link href="/admin/login" className="hidden sm:block text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">
              Entrar
            </Link>
          </div>
        </div>
      </nav>

      {/* HERO SECTION */}
      <section className="max-w-7xl mx-auto px-6 pt-16 pb-24 grid md:grid-cols-2 gap-12 items-center">
        <div>
          <span className="inline-block border border-slate-200 text-slate-500 text-xs font-bold tracking-wider uppercase px-3 py-1 rounded-full mb-6 bg-white">
            Seu próprio canal de pedidos — sem pagar comissão por venda
          </span>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold leading-[1.1] mb-6 tracking-tight">
            Seu restaurante <br/> online. <br/>
            <span className="text-[#D35400]">Seus pedidos</span> em <br/>
            um só lugar.
          </h1>
          <p className="text-slate-600 text-lg mb-8 max-w-md">
            Cardápio digital próprio, pedidos organizados e pagamento por Pix. Simples para você e fácil para o seu cliente.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <a href="#contato" className="bg-[#D35400] text-white px-6 py-3 rounded-full font-semibold hover:bg-[#b84a00] transition-colors text-center inline-flex justify-center items-center gap-2">
              Quero meu cardápio digital <ArrowRight size={18} />
            </a>
            <a href="#como-funciona" className="bg-white border border-slate-300 text-slate-700 px-6 py-3 rounded-full font-semibold hover:bg-slate-50 transition-colors text-center">
              Ver como funciona
            </a>
          </div>
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <Check size={16} className="text-[#D35400] shrink-0" />
            <span>Sem comissão sobre suas vendas — você paga só a mensalidade.</span>
          </div>
        </div>

        {/* HERO MOCKUP CELULAR */}
        <div className="flex justify-center md:justify-end items-center mt-10 md:mt-0">
          <div className="relative w-full max-w-[300px] sm:max-w-[320px]">
            {/* Moldura do celular */}
            <div className="bg-[#0F172A] p-3 rounded-[3rem] shadow-[0_20px_50px_rgba(0,0,0,0.15)] border-4 border-[#1E293B]">
              {/* Tela do celular */}
              <div className="bg-white rounded-[2.2rem] overflow-hidden aspect-[9/19] relative w-full">
                <img 
                  src="/screenshots/menu.jpeg" 
                  alt="Cardápio digital do Menuair aberto" 
                  className="w-full h-auto object-top" 
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3 FEATURES BENEATH HERO */}
      <section className="max-w-7xl mx-auto px-6 pb-24">
        <div className="grid md:grid-cols-3 gap-12 border-t border-slate-200 pt-16">
          {BENEFITS.map((b) => (
            <div key={b.title}>
              <b.icon className="text-[#D35400] mb-4" size={28} />
              <h3 className="font-bold text-lg mb-2 text-slate-900">{b.title}</h3>
              <p className="text-slate-500 text-sm leading-relaxed">{b.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="como-funciona" className="bg-[#FCFBF8] border-t border-slate-200 py-24 scroll-mt-16">
        <div className="max-w-7xl mx-auto px-6">
          <div className="mb-16 max-w-2xl">
            <h2 className="text-4xl font-extrabold mb-4 tracking-tight">Do primeiro contato<br/>ao pedido na cozinha</h2>
            <p className="text-slate-600">Veja como seu cliente faz um pedido pelo Menuair.</p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {STEPS.map((step) => (
              <div key={step.n} className="flex flex-col">
                
                {/* Moldura de Celular para os Steps */}
                <div className="flex justify-center mb-6">
                  <div className="relative w-full max-w-[220px]">
                    <div className="bg-[#0F172A] p-2.5 rounded-[2.5rem] shadow-lg border-4 border-[#1E293B]">
                      <div className="bg-white rounded-[1.8rem] overflow-hidden aspect-[9/19] relative w-full">
                        <img 
                          src={step.src} 
                          alt={step.title} 
                          className="w-full h-auto object-top" 
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <h4 className="font-bold mb-2 text-slate-900"><span className="text-[#D35400] mr-2">{step.n}</span>{step.title}</h4>
                <p className="text-sm text-slate-500 leading-relaxed">{step.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* RESTAURANT DASHBOARD */}
      <section className="border-t border-slate-200 py-24">
        <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-2 gap-16 items-center">
          <div>
            <h2 className="text-4xl font-extrabold mb-6 tracking-tight">Enquanto seu cliente faz o pedido, você acompanha tudo.</h2>
            <p className="text-slate-600 mb-10 leading-relaxed">Cada pedido chega com os itens, os extras, os dados de entrega e a forma de pagamento — direto no painel, com aviso sonoro.</p>
            
            <div className="grid grid-cols-2 gap-8">
              {OWNER_BENEFITS.map((b) => (
                <div key={b.title}>
                  <b.icon className="text-[#D35400] mb-3" size={24} />
                  <h4 className="font-bold mb-1 text-slate-900">{b.title}</h4>
                  <p className="text-sm text-slate-500">{b.text}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Imagens do Dashboard com Moldura de Celular */}
          <div className="grid gap-6 sm:grid-cols-2 items-start justify-items-center md:justify-items-end">
            
            {/* Celular Principal (Painel) */}
            <div className="relative w-full max-w-[260px]">
              <div className="bg-[#0F172A] p-3 rounded-[3rem] shadow-xl border-4 border-[#1E293B]">
                <div className="bg-white rounded-[2.2rem] overflow-hidden aspect-[9/19] relative w-full">
                  <img 
                    src="/screenshots/admin-pedidos.jpeg" 
                    alt="Painel de pedidos" 
                    className="w-full h-auto object-top" 
                  />
                </div>
              </div>
            </div>
            
            {/* 2 Celulares Menores Empilhados */}
            <div className="grid gap-8 w-full max-w-[220px]">
              <div className="bg-[#0F172A] p-2.5 rounded-[2.5rem] shadow-lg border-4 border-[#1E293B]">
                <div className="bg-white rounded-[1.8rem] overflow-hidden aspect-[9/19] relative w-full">
                  <img 
                    src="/screenshots/confirm.jpeg" 
                    alt="Confirmação" 
                    className="w-full h-auto object-top" 
                  />
                </div>
              </div>
              
              <div className="bg-[#0F172A] p-2.5 rounded-[2.5rem] shadow-lg border-4 border-[#1E293B]">
                <div className="bg-white rounded-[1.8rem] overflow-hidden aspect-[9/19] relative w-full">
                  <img 
                    src="/screenshots/product.jpeg" 
                    alt="Produto" 
                    className="w-full h-auto object-top" 
                  />
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* PRICING */}
      <section id="planos" className="bg-[#FCFBF8] border-t border-slate-200 py-24 scroll-mt-16">
        <div className="max-w-4xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-extrabold mb-4 tracking-tight">Planos</h2>
            <p className="text-slate-600">Mensalidade fixa, sem comissão por pedido.</p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 mb-16">
            {/* Start Plan */}
            <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm flex flex-col">
              <h3 className="font-bold text-xl mb-4 uppercase tracking-wide text-slate-900">Start</h3>
              <div className="flex items-baseline gap-1 mb-4">
                <span className="text-4xl font-extrabold text-slate-900">{currency(PLAN_PRICE_CENTS.START)}</span>
                <span className="text-slate-500">/mês</span>
              </div>
              <p className="text-slate-500 text-sm mb-8 flex-grow">Para colocar o cardápio no ar e começar a receber pedidos.</p>
              <a 
                href="#contato"
                onClick={() => setForm((f) => ({ ...f, plan: "START" }))}
                className="block text-center w-full py-3 rounded-full border border-slate-300 font-bold text-slate-700 hover:bg-slate-50 transition-colors"
              >
                Começar com o Start
              </a>
            </div>

            {/* Pro Plan */}
            <div className="bg-[#111827] text-white rounded-3xl p-8 shadow-xl relative flex flex-col">
              <div className="absolute top-0 right-8 -translate-y-1/2 bg-[#D35400] text-white text-xs font-bold px-3 py-1 rounded-full">
                POPULAR
              </div>
              <h3 className="font-bold text-xl mb-4 uppercase tracking-wide text-white">Pro</h3>
              <div className="flex items-baseline gap-1 mb-4">
                <span className="text-4xl font-extrabold text-white">{currency(PLAN_PRICE_CENTS.PRO)}</span>
                <span className="text-slate-300">/mês</span>
              </div>
              <p className="text-slate-300 text-sm mb-8 flex-grow">Tudo do Start, mais financeiro, dashboard, relatórios, cupons e exportação.</p>
              <a 
                href="#contato"
                onClick={() => setForm((f) => ({ ...f, plan: "PRO" }))}
                className="block text-center w-full py-3 rounded-full bg-[#D35400] text-white font-bold hover:bg-[#b84a00] transition-colors"
              >
                Começar com o Pro
              </a>
            </div>
          </div>

          {/* Pricing Table */}
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="py-4 px-6 font-semibold text-slate-700">Recursos</th>
                  <th className="py-4 px-6 font-semibold text-center text-slate-700 w-28 sm:w-32">Start</th>
                  <th className="py-4 px-6 font-semibold text-center text-slate-700 w-28 sm:w-32">Pro</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {PLAN_FEATURE_ROWS.map((row, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-4 px-6 text-slate-600">{row.label}</td>
                    <td className="py-4 px-6 text-center"><FeatureCell value={row.start} /></td>
                    <td className="py-4 px-6 text-center"><FeatureCell value={row.pro} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* FAQ SECTION */}
      <section id="faq" className="py-24 max-w-3xl mx-auto px-6 scroll-mt-16">
        <h2 className="text-3xl font-extrabold text-center mb-12 tracking-tight">Perguntas frequentes</h2>
        <FaqAccordion />
      </section>

      {/* CTA FOOTER & CONTACT FORM */}
      <section id="contato" className="max-w-5xl mx-auto px-6 pb-24 scroll-mt-16">
        <div className="bg-[#111827] rounded-[2rem] p-8 md:p-16 text-center text-white relative overflow-hidden shadow-2xl">
          <div className="relative z-10 max-w-md mx-auto">
            <h2 className="text-3xl sm:text-4xl font-extrabold mb-4 tracking-tight">Pronto para colocar<br/>seu restaurante online?</h2>
            <p className="text-slate-400 mb-10">Preenche rapidinho, a gente te chama para configurar o seu cardápio digital.</p>
            
            <form onSubmit={handleWhatsApp} className="bg-white rounded-2xl p-6 sm:p-8 shadow-xl text-left">
              <label className="block text-xs font-bold uppercase tracking-wide mb-1.5 text-slate-500">Nome do restaurante</label>
              <input
                value={form.restaurantName}
                onChange={(e) => setForm((f) => ({ ...f, restaurantName: e.target.value }))}
                placeholder="Ex: Pizzaria da Praça"
                className="w-full mb-5 px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#D35400]/20 focus:border-[#D35400] transition-all"
              />
              
              <label className="block text-xs font-bold uppercase tracking-wide mb-1.5 text-slate-500">Seu nome</label>
              <input
                value={form.yourName}
                onChange={(e) => setForm((f) => ({ ...f, yourName: e.target.value }))}
                placeholder="Como gosta de ser chamado"
                className="w-full mb-5 px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#D35400]/20 focus:border-[#D35400] transition-all"
              />
              
              <label className="block text-xs font-bold uppercase tracking-wide mb-1.5 text-slate-500">Telefone / WhatsApp</label>
              <input
                value={form.phone}
                onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                placeholder="(35) 99999-9999"
                className="w-full mb-6 px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#D35400]/20 focus:border-[#D35400] transition-all"
              />
              
              <label className="block text-xs font-bold uppercase tracking-wide mb-1.5 text-slate-500">Plano de interesse</label>
              <div className="flex gap-3 mb-8">
                {(["START", "PRO"] as const).map((p) => (
                  <button
                    type="button"
                    key={p}
                    onClick={() => setForm((f) => ({ ...f, plan: p }))}
                    className={`flex-1 py-3 rounded-xl text-sm font-bold border transition-all ${
                      form.plan === p 
                        ? "bg-slate-900 text-white border-slate-900 shadow-md" 
                        : "bg-white text-slate-500 border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    {p === "START" ? "Start" : "Pro"}
                  </button>
                ))}
              </div>

              <button
                type="submit"
                disabled={!formValid}
                className="w-full flex items-center justify-center gap-2 py-4 rounded-full font-bold text-sm bg-emerald-500 text-white shadow-sm hover:bg-emerald-600 disabled:opacity-50 disabled:hover:bg-emerald-500 transition-colors mb-3"
              >
                <MessageCircle size={18} /> Enviar pelo WhatsApp
              </button>
              <button
                type="button"
                onClick={handleEmail}
                disabled={!formValid}
                className="w-full flex items-center justify-center gap-2 py-4 rounded-full font-bold text-sm border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-50 transition-colors"
              >
                <Mail size={18} /> Enviar por e-mail
              </button>
            </form>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-slate-200 py-10 px-6">
        <div className="mmax-w-7xl mx-auto mt-8 pt-8 border-t border-slate-100 flex flex-col items-center justify-center text-sm text-slate-500 gap-6">
          <div className="flex items-center gap-2 font-bold text-lg text-slate-900">
            <div className="bg-slate-900 text-white p-1 rounded-md w-7 h-7 flex items-center justify-center text-xs">
              M
            </div>
            Menuair
          </div>
        </div>
        <div className="max-w-7xl mx-auto mt-8 pt-8 border-t border-slate-100 flex flex-col items-center justify-center text-sm text-slate-500 gap-6">
          <div className="text-center leading-relaxed">
            <p>
              © {new Date().getFullYear()} Desenvolvido por{" "}
              <a
                href={devWhatsApp}
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-slate-600 hover:text-slate-800 underline transition-colors"
              >
                Luiz Felippe
              </a>
            </p>
            <p>Todos os direitos reservados</p>
          </div>
          <div className="flex gap-6 text-xs text-slate-400">
            <Link href="/privacidade" className="hover:text-slate-600 transition-colors">
              Política de Privacidade
            </Link>
            <Link href="/termos" className="hover:text-slate-600 transition-colors">
              Termos de Uso
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}