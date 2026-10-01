"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { Check, Plus, Minus, ArrowRight, MessageCircle, Mail, Play } from "lucide-react";
import { PLAN_PRICE_CENTS } from "@/lib/plan-pricing";
import { PLAN_LIMITS } from "@/lib/plan-features";
import { landingWhatsAppLink } from "@/lib/landing-whatsapp";

const CONTACT_EMAIL = "suporte@menuair.com.br";
const CONTACT_PHONE_LABEL = "(35) 99972-2478";
const currency = (cents: number) => `R$ ${Math.floor(cents / 100)}`;
const brl = (value: number) => value.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });

// Laranja do logo (public/landing/logo.png). Texto em cima dele é sempre preto.
const ORANGE = "#FF7A00";

const STEPS = [
  { title: "Abre o cardápio", text: "Pelo link do restaurante ou pelo QR Code na mesa. Nada pra instalar.", src: "/landing/menu.webp" },
  { title: "Monta o pedido", text: "Tira a cebola, põe bacon. Cada item com seus removíveis e adicionais.", src: "/landing/product.webp" },
  { title: "Escolhe como pagar", text: "Entrega ou retirada. Pix, cartão ou dinheiro. Cupom, se tiver.", src: "/landing/checkout.webp" },
  { title: "Foi pra cozinha", text: "Aparece no painel com aviso sonoro e já sai impresso.", src: "/landing/confirm.webp" },
];

const TEAM = [
  {
    role: "Garçom",
    items: ["App próprio pra lançar pedido na mesa.", "Comanda acumula tudo até fechar a conta.", "Pedido manual no balcão."],
  },
  {
    role: "Caixa",
    items: ["Abertura e fechamento com conferência.", "Sangria e suprimento registrados na hora.", "Taxa de serviço só nos pedidos de mesa."],
  },
  {
    role: "Entrega",
    items: ["Entregador atribuído em cada pedido.", "Taxa por bairro, com pausa quando precisar.", "2ª via impressa só com os itens, pra cozinha"],
  },
];

const EXTRAS = [
  { title: "Estoque com CMV", text: "Ficha técnica em cada prato. O estoque baixa a cada venda e você vê custo e margem de cada produto." },
  { title: "Fidelidade e cashback", text: "O cliente junta pontos e usa o saldo no próximo pedido, sem cupom de marketplace." },
  { title: "Reservas de mesa", text: "Reserva que chegou por telefone ou WhatsApp entra no sistema com horário, status e mesa." },
  { title: "Cardápio Premium", text: "Um segundo visual pro cardápio, escuro e mais sóbrio, pra quem quer outra identidade." },
];

const CASE_FACTS = [
  { k: "Pagamento", v: "Pix na chave do quiosque, sem comissão" },
  { k: "Cozinha", v: "Impressora térmica Wi-Fi e Bluetooth, com 2ª via" },
  { k: "Mesas", v: "Comanda por mesa e app do garçom" },
  { k: "Caixa", v: "Abertura, sangria, suprimento e fechamento" },
  { k: "Entrega", v: "Entregadores cadastrados, taxa por bairro" },
  { k: "Financeiro", v: "Histórico, relatórios e fechamento diário" },
];

const COMPARISON = [
  { label: "Comissão por pedido", them: "8% a 12%", us: "0%" },
  { label: "Dados do cliente", them: "Ficam com o app", us: "Ficam com você" },
  { label: "Marca", them: "Layout do app", us: "Seu logo e suas cores" },
  { label: "Cupons", them: "Regras do app", us: "Você decide" },
  { label: "Mesa, comanda e caixa", them: "Não tem", us: "Incluso" },
  { label: "Pagamento online", them: "Com taxa extra", us: "Pix direto, sem taxa" },
];

const PLAN_FEATURE_ROWS: { label: string; start: boolean | string; pro: boolean | string }[] = [
  { label: "Cardápio online e QR Code do cardápio", start: true, pro: true },
  { label: "Comandas por mesa e app do garçom", start: true, pro: true },
  { label: "QR Code de autoatendimento na mesa", start: false, pro: true },
  { label: "Produtos", start: `Até ${PLAN_LIMITS.START.maxProducts}`, pro: "Ilimitado" },
  { label: "Categorias", start: `Até ${PLAN_LIMITS.START.maxCategories}`, pro: "Ilimitado" },
  { label: "Pedido pelo site com Pix", start: true, pro: true },
  { label: "Financeiro", start: true, pro: true },
  { label: "Dashboard com gráfico", start: false, pro: true },
  { label: "Relatórios avançados", start: false, pro: true },
  { label: "Cupons de desconto", start: false, pro: true },
  { label: "Exportação CSV", start: false, pro: true },
];

const FAQ = [
  { q: "Preciso instalar algum aplicativo?", a: "Não. O Menuair funciona no navegador, pra você e pro seu cliente." },
  { q: "Como meu cliente acessa o cardápio?", a: "Por um link do seu restaurante ou pelo QR Code, direto no celular." },
  { q: "Vocês cobram comissão por pedido?", a: "Não. Você paga só a mensalidade do plano." },
  { q: "Como funciona o Pix?", a: "O código é gerado na hora com a sua chave. O dinheiro cai direto na sua conta, sem intermediário." },
  { q: "Como funciona o caixa?", a: "Você abre com um valor inicial, registra sangria e suprimento durante o dia e, no fechamento, confere o valor contado com o que o sistema esperava." },
  { q: "Dá pra pausar a entrega num bairro?", a: "Dá. Choveu ou o trânsito travou, você pausa o bairro na hora e o cliente de lá é orientado a chamar no WhatsApp." },
  { q: "Preciso entender de tecnologia?", a: "Não. A gente configura o cardápio com você, e o dia a dia é feito em telas simples." },
];

function FeatureCell({ value }: { value: boolean | string }) {
  if (typeof value === "string") return <span className="text-sm font-semibold text-neutral-800">{value}</span>;
  return value ? <Check size={18} strokeWidth={3} className="text-neutral-900 mx-auto" aria-label="Incluso" /> : <span className="text-neutral-300" aria-label="Não incluso">–</span>;
}

function Screenshot({ src, alt, className = "" }: { src: string; alt: string; className?: string }) {
  return (
    <img
      src={src}
      alt={alt}
      loading="lazy"
      decoding="async"
      className={`block w-full h-auto rounded-lg ring-1 ring-black/10 ${className}`}
    />
  );
}

function Phone({ src, alt, className = "", eager = false }: { src: string; alt: string; className?: string; eager?: boolean }) {
  return (
    <div className={`rounded-[1.75rem] bg-neutral-950 p-[6px] ring-1 ring-white/10 ${className}`}>
      <div className="relative rounded-[1.4rem] overflow-hidden bg-white aspect-[9/16]">
        <img
          src={src}
          alt={alt}
          className="absolute inset-0 w-full h-full object-cover object-top"
          loading={eager ? "eager" : "lazy"}
          decoding="async"
        />
      </div>
    </div>
  );
}

function Logo({ dark = false }: { dark?: boolean }) {
  return (
    <span className="flex items-center gap-2.5">
      <img src="/landing/logo.png" alt="" width={36} height={36} className="w-9 h-9 rounded-lg" />
      <span className={`text-xl font-extrabold tracking-tight ${dark ? "text-white" : "text-neutral-950"}`}>Menuair</span>
    </span>
  );
}

function DemoVideo() {
  const ref = useRef<HTMLVideoElement>(null);
  const [started, setStarted] = useState(false);

  function play() {
    setStarted(true);
    ref.current?.play();
  }

  return (
    <div className="relative rounded-xl overflow-hidden bg-black aspect-video">
      <video
        ref={ref}
        src="/landing/menuair-demo.mp4"
        poster="/landing/video-capa.webp"
        controls={started}
        playsInline
        preload="none"
        className="w-full h-full object-cover"
      />
      {!started && (
        <button
          onClick={play}
          className="group absolute inset-0 flex items-end justify-start p-3 sm:p-6"
          aria-label="Assistir vídeo de demonstração"
        >
          <span
            className="flex items-center gap-2 pl-2.5 pr-3.5 py-1.5 sm:pl-3 sm:pr-5 sm:py-3 rounded-md text-sm sm:text-base font-bold text-neutral-950 group-hover:brightness-95 transition"
            style={{ background: ORANGE }}
          >
            <Play size={16} fill="currentColor" /> Assistir com som
          </span>
        </button>
      )}
    </div>
  );
}

function CommissionCalculator() {
  const [monthly, setMonthly] = useState(20000);
  const low = monthly * 0.08;
  const high = monthly * 0.12;
  const plan = PLAN_PRICE_CENTS.PRO / 100;

  return (
    <div className="rounded-xl bg-neutral-950 text-white p-6 sm:p-8">
      <label htmlFor="faturamento" className="block text-sm text-neutral-400 mb-1">
        Quanto você vende por mês em delivery?
      </label>
      <div className="text-4xl font-extrabold tracking-tight mb-5 tabular-nums">{brl(monthly)}</div>
      <input
        id="faturamento"
        type="range"
        min={5000}
        max={100000}
        step={1000}
        value={monthly}
        onChange={(e) => setMonthly(Number(e.target.value))}
        className="w-full mb-8"
        style={{ accentColor: ORANGE }}
      />
      <div className="grid grid-cols-2 gap-6 border-t border-white/10 pt-6">
        <div>
          <p className="text-xs text-neutral-400 mb-1">Comissão no marketplace</p>
          <p className="text-lg sm:text-2xl font-bold text-neutral-300 tabular-nums">
            {brl(low)} a {brl(high)}
          </p>
        </div>
        <div>
          <p className="text-xs text-neutral-400 mb-1">Menuair Pro, por mês</p>
          <p className="text-lg sm:text-2xl font-bold tabular-nums" style={{ color: ORANGE }}>{brl(plan)}</p>
        </div>
      </div>
      <p className="text-xs text-neutral-500 mt-6 leading-relaxed">
        Estimativa com as faixas de comissão mais comuns de marketplace (8% a 12%). Não inclui taxa de pagamento online.
      </p>
    </div>
  );
}

function FaqAccordion() {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <div className="border-t-2 border-neutral-950">
      {FAQ.map((item, i) => (
        <div key={item.q} className="border-b border-neutral-200">
          <button
            onClick={() => setOpen(open === i ? null : i)}
            aria-expanded={open === i}
            className="w-full flex items-center justify-between gap-6 py-5 text-left font-semibold text-neutral-900"
          >
            {item.q}
            {open === i ? <Minus size={18} className="shrink-0" /> : <Plus size={18} className="shrink-0" />}
          </button>
          {open === i && <p className="pb-6 -mt-1 text-neutral-600 leading-relaxed max-w-2xl">{item.a}</p>}
        </div>
      ))}
    </div>
  );
}

export default function LandingPage() {
  const [form, setForm] = useState({ restaurantName: "", yourName: "", phone: "", plan: "START" as "START" | "PRO" });
  const formValid = form.restaurantName.trim() && form.yourName.trim() && form.phone.trim();

  const devWhatsApp = "https://wa.me/553599722478?text=" + encodeURIComponent("Olá! Vi um cardápio digital feito por você e gostaria de saber mais.");
  const quickWhatsApp = landingWhatsAppLink("Olá! Quero conhecer o Menuair pro meu restaurante.");

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
    const subject = encodeURIComponent(`Quero contratar o Menuair: ${form.restaurantName || "novo restaurante"}`);
    window.open(`mailto:${CONTACT_EMAIL}?subject=${subject}&body=${encodeURIComponent(buildMessage())}`, "_blank");
  }

  const inputClass =
    "w-full px-4 py-3 rounded-md border border-neutral-300 bg-white text-neutral-900 text-[15px] placeholder:text-neutral-400 focus:outline-none focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900 transition-colors";

  const primaryBtn =
    "inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-md font-bold text-neutral-950 hover:brightness-95 transition";

  return (
    <div className="min-h-screen bg-white text-neutral-950 font-sans scroll-smooth antialiased overflow-x-clip">
      {/* NAVBAR */}
      <nav className="sticky top-0 z-40 bg-neutral-950 text-white">
        <div className="flex items-center justify-between px-5 sm:px-6 h-16 max-w-7xl mx-auto">
          <div className="flex items-center gap-10">
            <a href="#" aria-label="Menuair, início">
              <Logo dark />
            </a>
            <div className="hidden md:flex items-center gap-7 text-sm text-neutral-400">
              <a href="#como-funciona" className="hover:text-white transition-colors">Como funciona</a>
              <a href="#painel" className="hover:text-white transition-colors">Painel</a>
              <a href="#planos" className="hover:text-white transition-colors">Planos</a>
              <a href="#faq" className="hover:text-white transition-colors">Dúvidas</a>
            </div>
          </div>
          <div className="flex items-center gap-5">
            <Link href="/admin/login" className="hidden sm:block text-sm text-neutral-400 hover:text-white transition-colors">
              Entrar
            </Link>
            <a href="#contato" className="px-4 py-2 rounded-md text-sm font-bold text-neutral-950" style={{ background: ORANGE }}>
              Quero conhecer
            </a>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <header className="bg-neutral-950 text-white">
        <div className="max-w-7xl mx-auto px-5 sm:px-6 pt-14 sm:pt-20 pb-16 sm:pb-24 grid lg:grid-cols-[1fr_1fr] gap-14 lg:gap-12 items-center">
          <div>
            <h1 className="text-[2.75rem] leading-[1] sm:text-7xl font-extrabold tracking-tight mb-7">
              Seu restaurante sob controle.{" "}
              <span style={{ color: ORANGE }}>Sem comissão.</span>
            </h1>
            <p className="text-lg sm:text-xl text-neutral-300 leading-relaxed mb-9 max-w-lg">
              Cardápio digital, pedidos, mesas, caixa e entrega num painel só. O Pix cai na sua conta e você paga uma mensalidade fixa.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 mb-12">
              <a href="#contato" className={primaryBtn} style={{ background: ORANGE }}>
                Quero conhecer <ArrowRight size={18} strokeWidth={2.5} />
              </a>
              <a
                href="#video"
                className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-md font-bold text-white ring-1 ring-white/25 hover:bg-white/5 transition"
              >
                <Play size={16} fill="currentColor" /> Ver funcionando
              </a>
            </div>
            <p className="text-sm text-neutral-500">
              <span className="text-white font-semibold">12.000+ pedidos</span> já passaram pelo Menuair. A partir de{" "}
              <span className="text-white font-semibold">{currency(PLAN_PRICE_CENTS.START)}/mês</span>.
            </p>
          </div>

          <div className="relative">
            <Screenshot
              src="/landing/painel-pedidos.webp"
              alt="Painel de pedidos do Menuair com colunas Novo, Em preparo, Pronto, Saiu para entrega e Entregue"
              className="ring-white/10"
            />
            <Phone
              src="/landing/menu.webp"
              alt="Cardápio digital aberto no celular"
              eager
              className="absolute -bottom-10 right-4 sm:right-8 w-[30%] sm:w-[26%]"
            />
          </div>
        </div>
      </header>

      {/* VÍDEO */}
      <section id="video" className="py-20 sm:py-28 scroll-mt-16">
        <div className="max-w-5xl mx-auto px-5 sm:px-6">
          <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight mb-3">Veja como funciona em menos de 30 segundos</h2>
          <p className="text-lg text-neutral-600 mb-10">Do pedido no celular direto pra gestão do seu restaurante.</p>
          <DemoVideo />
        </div>
      </section>

      {/* COMO FUNCIONA */}
      <section id="como-funciona" className="bg-neutral-100 py-20 sm:py-28 scroll-mt-16">
        <div className="max-w-7xl mx-auto px-5 sm:px-6">
          <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight mb-3 max-w-3xl">Seu cliente pede sem baixar nada</h2>
          <p className="text-lg text-neutral-600 mb-14 max-w-2xl">São quatro telas, do link até a cozinha. Com a sua logo e as suas cores.</p>

          <ol className="grid grid-cols-2 lg:grid-cols-4 gap-x-5 gap-y-12 sm:gap-x-8">
            {STEPS.map((step, i) => (
              <li key={step.title}>
                <Phone src={step.src} alt={step.title} className="max-w-[250px] mx-auto mb-6" />
                <div className="flex items-baseline gap-3">
                  <span className="text-4xl font-extrabold tabular-nums" style={{ color: ORANGE }}>{i + 1}</span>
                  <div>
                    <h3 className="font-bold text-lg leading-tight mb-1">{step.title}</h3>
                    <p className="text-[15px] text-neutral-600 leading-relaxed">{step.text}</p>
                  </div>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* PAINEL */}
      <section id="painel" className="py-20 sm:py-28 scroll-mt-16">
        <div className="max-w-7xl mx-auto px-5 sm:px-6">
          <div className="grid lg:grid-cols-[0.9fr_1.1fr] gap-12 lg:gap-16 items-center mb-20">
            <div>
              <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight mb-6">O pedido chega completo. Ninguém precisa perguntar de novo.</h2>
              <p className="text-lg text-neutral-600 leading-relaxed">
                Itens, adicionais, endereço e pagamento aparecem no painel com aviso sonoro, e a impressora da cozinha já solta a comanda. Nas mesas, cada uma tem QR Code e comanda própria.
              </p>
            </div>
            <Screenshot src="/landing/painel-mesas.webp" alt="Tela de mesas do Menuair, com mesas livres e ocupadas" />
          </div>

          <div className="grid md:grid-cols-3 gap-px bg-neutral-200 rounded-xl overflow-hidden ring-1 ring-neutral-200">
            {TEAM.map((col) => (
              <div key={col.role} className="bg-white p-7">
                <h3 className="text-xl font-extrabold mb-4">{col.role}</h3>
                <ul className="space-y-3">
                  {col.items.map((item) => (
                    <li key={item} className="text-[15px] text-neutral-700 leading-relaxed">{item}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="mt-20 grid sm:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-10">
            {EXTRAS.map((item) => (
              <div key={item.title} className="border-t-2 border-neutral-950 pt-4">
                <h3 className="font-bold mb-2">{item.title}</h3>
                <p className="text-[15px] text-neutral-600 leading-relaxed">{item.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CASE */}
      <section id="case" className="scroll-mt-16 text-neutral-950" style={{ background: ORANGE }}>
        <div className="max-w-7xl mx-auto px-5 sm:px-6 py-20 sm:py-24 grid lg:grid-cols-2 gap-12 lg:gap-16 items-start">
          <div>
            <p className="font-bold mb-4">Quiosque Tô Em Casa</p>
            <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight mb-6">Roda no Menuair todo dia, do primeiro pedido ao fechamento do caixa.</h2>
            <p className="text-lg leading-relaxed max-w-lg">
              Foi o primeiro restaurante com o sistema completo: cardápio, pedido, Pix e impressão na cozinha, sem planilha paralela e sem app de terceiro.
            </p>
          </div>
          <dl className="border-t-2 border-neutral-950">
            {CASE_FACTS.map((f) => (
              <div key={f.k} className="grid grid-cols-[110px_1fr] sm:grid-cols-[140px_1fr] gap-4 py-4 border-b border-neutral-950/20">
                <dt className="font-bold">{f.k}</dt>
                <dd>{f.v}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* COMPARATIVO */}
      <section className="py-20 sm:py-28">
        <div className="max-w-6xl mx-auto px-5 sm:px-6">
          <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight mb-4 max-w-3xl">Quanto sai a comissão do marketplace?</h2>
          <p className="text-lg text-neutral-600 mb-12 max-w-2xl">
            Muita gente usa os dois: o marketplace pra ser encontrado e o canal próprio pro cliente que já é seu. Com esse cliente, não faz sentido pagar comissão.
          </p>

          <div className="grid lg:grid-cols-2 gap-8 items-start">
            <CommissionCalculator />

            <table className="w-full border-collapse text-[15px]">
              <thead>
                <tr className="border-b-2 border-neutral-950">
                  <th className="py-3 text-left font-normal"><span className="sr-only">Item</span></th>
                  <th className="py-3 px-2 text-center font-semibold text-neutral-500">Marketplace</th>
                  <th className="py-3 px-2 text-center font-extrabold">Menuair</th>
                </tr>
              </thead>
              <tbody>
                {COMPARISON.map((row) => (
                  <tr key={row.label} className="border-b border-neutral-200">
                    <td className="py-4 pr-2 text-neutral-800">{row.label}</td>
                    <td className="py-4 px-2 text-neutral-400 text-center">{row.them}</td>
                    <td className="py-4 px-2 font-bold text-center">{row.us}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* PLANOS */}
      <section id="planos" className="bg-neutral-100 py-20 sm:py-28 scroll-mt-16">
        <div className="max-w-4xl mx-auto px-5 sm:px-6">
          <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight mb-3">Planos</h2>
          <p className="text-lg text-neutral-600 mb-12">Mensalidade fixa. Nenhum plano cobra comissão por pedido.</p>

          <div className="grid md:grid-cols-2 gap-5 mb-12">
            <div className="rounded-xl p-7 sm:p-8 bg-white ring-1 ring-neutral-200 flex flex-col">
              <h3 className="text-2xl font-extrabold">Start</h3>
              <p className="text-neutral-500 mb-6">Pra começar a operar</p>
              <div className="flex items-baseline gap-1 mb-6">
                <span className="text-5xl font-extrabold tracking-tight tabular-nums">{currency(PLAN_PRICE_CENTS.START)}</span>
                <span className="text-neutral-500">/mês</span>
              </div>
              <p className="text-neutral-700 mb-8 flex-grow">Cardápio, pedidos, Pix, mesas, comandas e caixa. O que o dia a dia pede.</p>
              <a
                href="#contato"
                onClick={() => setForm((f) => ({ ...f, plan: "START" }))}
                className="block text-center w-full py-3.5 rounded-md ring-1 ring-neutral-950 font-bold hover:bg-neutral-50 transition-colors"
              >
                Quero o Start
              </a>
            </div>

            <div className="rounded-xl p-7 sm:p-8 bg-neutral-950 text-white flex flex-col">
              <div className="flex items-center justify-between">
                <h3 className="text-2xl font-extrabold">Pro</h3>
                <span className="text-xs font-bold px-2 py-1 rounded text-neutral-950" style={{ background: ORANGE }}>Mais escolhido</span>
              </div>
              <p className="text-neutral-400 mb-6">Pra ter o controle do negócio</p>
              <div className="flex items-baseline gap-1 mb-6">
                <span className="text-5xl font-extrabold tracking-tight tabular-nums">{currency(PLAN_PRICE_CENTS.PRO)}</span>
                <span className="text-neutral-400">/mês</span>
              </div>
              <p className="text-neutral-300 mb-8 flex-grow">Tudo do Start, mais dashboard, relatórios, cupons, exportação e QR Code de autoatendimento na mesa.</p>
              <a
                href="#contato"
                onClick={() => setForm((f) => ({ ...f, plan: "PRO" }))}
                className="block text-center w-full py-3.5 rounded-md font-bold text-neutral-950 hover:brightness-95 transition"
                style={{ background: ORANGE }}
              >
                Quero o Pro
              </a>
            </div>
          </div>

          <table className="w-full text-left text-[15px]">
            <thead>
              <tr className="border-b-2 border-neutral-950">
                <th className="py-3 pr-2 font-bold">Recursos</th>
                <th className="py-3 px-2 font-bold text-center w-24 sm:w-32">Start</th>
                <th className="py-3 px-2 font-bold text-center w-24 sm:w-32">Pro</th>
              </tr>
            </thead>
            <tbody>
              {PLAN_FEATURE_ROWS.map((row) => (
                <tr key={row.label} className="border-b border-neutral-200">
                  <td className="py-3.5 pr-2 text-neutral-700">{row.label}</td>
                  <td className="py-3.5 px-2 text-center"><FeatureCell value={row.start} /></td>
                  <td className="py-3.5 px-2 text-center"><FeatureCell value={row.pro} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-20 sm:py-28 scroll-mt-16">
        <div className="max-w-6xl mx-auto px-5 sm:px-6 grid lg:grid-cols-[0.75fr_1.25fr] gap-10 lg:gap-16">
          <div>
            <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight mb-4">Dúvidas</h2>
            <p className="text-neutral-600">
              Não achou a sua?{" "}
              <a href={quickWhatsApp} target="_blank" rel="noopener noreferrer" className="font-semibold text-neutral-950 underline underline-offset-4">
                Pergunta no WhatsApp
              </a>
              .
            </p>
          </div>
          <FaqAccordion />
        </div>
      </section>

      {/* CONTATO */}
      <section id="contato" className="bg-neutral-950 text-white py-20 sm:py-28 scroll-mt-16">
        <div className="max-w-6xl mx-auto px-5 sm:px-6 grid lg:grid-cols-2 gap-12 lg:gap-16 items-start">
          <div>
            <h2 className="text-4xl sm:text-6xl font-extrabold tracking-tight mb-6">
              Bora colocar seu cardápio <span style={{ color: ORANGE }}>no ar?</span>
            </h2>
            <p className="text-lg text-neutral-300 leading-relaxed mb-10 max-w-md">
              Deixa seus dados que a gente chama no WhatsApp, mostra o sistema e monta o cardápio junto com você.
            </p>
            <div className="space-y-4">
              <a href={quickWhatsApp} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 text-lg font-semibold hover:text-neutral-300 transition-colors">
                <MessageCircle size={20} style={{ color: ORANGE }} /> {CONTACT_PHONE_LABEL}
              </a>
              <a href={`mailto:${CONTACT_EMAIL}`} className="flex items-center gap-3 text-lg font-semibold hover:text-neutral-300 transition-colors">
                <Mail size={20} style={{ color: ORANGE }} /> {CONTACT_EMAIL}
              </a>
            </div>
          </div>

          <form onSubmit={handleWhatsApp} className="bg-white text-neutral-950 rounded-xl p-6 sm:p-8">
            <div className="grid sm:grid-cols-2 gap-4 mb-4">
              <div className="sm:col-span-2">
                <label htmlFor="restaurante" className="block text-sm font-semibold mb-1.5">Nome do restaurante</label>
                <input
                  id="restaurante"
                  value={form.restaurantName}
                  onChange={(e) => setForm((f) => ({ ...f, restaurantName: e.target.value }))}
                  placeholder="Ex.: Pizzaria da Praça"
                  className={inputClass}
                />
              </div>
              <div>
                <label htmlFor="nome" className="block text-sm font-semibold mb-1.5">Seu nome</label>
                <input
                  id="nome"
                  value={form.yourName}
                  onChange={(e) => setForm((f) => ({ ...f, yourName: e.target.value }))}
                  placeholder="Como te chamamos"
                  className={inputClass}
                />
              </div>
              <div>
                <label htmlFor="telefone" className="block text-sm font-semibold mb-1.5">WhatsApp</label>
                <input
                  id="telefone"
                  type="tel"
                  inputMode="tel"
                  value={form.phone}
                  onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                  placeholder="(35) 99999-9999"
                  className={inputClass}
                />
              </div>
            </div>

            <p className="text-sm font-semibold mb-1.5">Plano de interesse</p>
            <div className="grid grid-cols-2 gap-2 mb-6">
              {(["START", "PRO"] as const).map((p) => (
                <button
                  type="button"
                  key={p}
                  onClick={() => setForm((f) => ({ ...f, plan: p }))}
                  aria-pressed={form.plan === p}
                  className={`py-3 rounded-md text-sm font-bold transition-colors ${
                    form.plan === p ? "bg-neutral-950 text-white" : "ring-1 ring-neutral-300 text-neutral-600 hover:ring-neutral-500"
                  }`}
                >
                  {p === "START" ? `Start · ${currency(PLAN_PRICE_CENTS.START)}` : `Pro · ${currency(PLAN_PRICE_CENTS.PRO)}`}
                </button>
              ))}
            </div>

            <button
              type="submit"
              disabled={!formValid}
              className="w-full flex items-center justify-center gap-2 py-3.5 rounded-md font-bold bg-[#25D366] text-neutral-950 hover:brightness-95 disabled:opacity-40 transition mb-2.5"
            >
              <MessageCircle size={18} /> Enviar pelo WhatsApp
            </button>
            <button
              type="button"
              onClick={handleEmail}
              disabled={!formValid}
              className="w-full flex items-center justify-center gap-2 py-3.5 rounded-md font-bold ring-1 ring-neutral-300 text-neutral-700 hover:bg-neutral-50 disabled:opacity-40 transition-colors"
            >
              <Mail size={18} /> Enviar por e-mail
            </button>
            <p className="text-xs text-neutral-500 mt-4 text-center">Sem cartão de crédito. Respondemos em até 1 dia útil.</p>
          </form>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-neutral-950 text-neutral-500 border-t border-white/10 py-8 px-5 sm:px-6">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6 text-sm">
          <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-5">
            <Logo dark />
            <span>
              © {new Date().getFullYear()}{" "}
              <a href={devWhatsApp} target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">
                MenuAir
              </a>
              . Todos os direitos reservados.
            </span>
          </div>
          <div className="flex gap-6">
            <Link href="/privacidade" className="hover:text-white transition-colors">Privacidade</Link>
            <Link href="/termos" className="hover:text-white transition-colors">Termos de uso</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
