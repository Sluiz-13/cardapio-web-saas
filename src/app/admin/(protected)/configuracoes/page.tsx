"use client";

import { useEffect, useState, useRef } from "react";
import { Power, Settings, ImageIcon, Wallet, Phone as PhoneIcon, Clock, Printer, Percent, Palette, Lock, Gift, Coins, Hash, MapPin as MapPinIcon } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardBody } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Label } from "@/components/ui/Input";
import { PageHeader } from "@/components/ui/PageHeader";
import { Skeleton } from "@/components/ui/Skeleton";
import { useToast } from "@/components/ui/Toast";
import { Toggle } from "@/components/ui/Toggle";
import { listPairedBluetoothPrinters } from "@/lib/print-agent";
import { listQzPrinters } from "@/lib/qz-print";

const DAY_LABELS = ["Domingo", "Segunda-feira", "Terça-feira", "Quarta-feira", "Quinta-feira", "Sexta-feira", "Sábado"];

type BusinessHour = { dayOfWeek: number; isOpen: boolean; openTime: string; closeTime: string };

const TABS = [
  { key: "geral", label: "Geral", icon: ImageIcon },
  { key: "pagamento", label: "Pagamento", icon: Wallet },
  { key: "cardapio", label: "Cardápio & Fidelidade", icon: Palette },
  { key: "impressao", label: "Impressão", icon: Printer },
  { key: "horario", label: "Horário", icon: Clock },
] as const;
type TabKey = (typeof TABS)[number]["key"];

export default function ConfiguracoesPage() {
  const { show } = useToast();
  const [activeTab, setActiveTab] = useState<TabKey>("geral");
  const [restaurantIsOpen, setRestaurantIsOpen] = useState(true);
  const [hours, setHours] = useState<BusinessHour[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [pixKey, setPixKey] = useState("");
  const [pixKeyType, setPixKeyType] = useState("RANDOM");
  const [pixMerchantName, setPixMerchantName] = useState("");
  const [pixMerchantCity, setPixMerchantCity] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [avgDeliveryTime, setAvgDeliveryTime] = useState("");
  const [serviceFeePercent, setServiceFeePercent] = useState("0");
  const [useDeliveryZones, setUseDeliveryZones] = useState(false);
  const [menuTheme, setMenuTheme] = useState<"CLASSIC" | "PREMIUM">("CLASSIC");
  const [plan, setPlan] = useState<"START" | "PRO">("START");
  const [loyaltyPointsEnabled, setLoyaltyPointsEnabled] = useState(false);
  const [loyaltyPointsPerReal, setLoyaltyPointsPerReal] = useState("1");
  const [loyaltyPointsRedeemThreshold, setLoyaltyPointsRedeemThreshold] = useState("100");
  const [loyaltyPointsRedeemValueCents, setLoyaltyPointsRedeemValueCents] = useState("10");
  const [cashbackEnabled, setCashbackEnabled] = useState(false);
  const [cashbackPercent, setCashbackPercent] = useState("5");
  const [dailyCounterEnabled, setDailyCounterEnabled] = useState(false);
  const [dailyCounterNext, setDailyCounterNext] = useState("1");
  const [printKitchenCopy, setPrintKitchenCopy] = useState(true);
  const [printMethod, setPrintMethod] = useState("MANUAL");
  const [printerIp, setPrinterIp] = useState("");
  const [printerPort, setPrinterPort] = useState("9100");
  const [printerBluetoothAddress, setPrinterBluetoothAddress] = useState("");
  const [printerBluetoothName, setPrinterBluetoothName] = useState("");
  const [pairedPrinters, setPairedPrinters] = useState<{ name: string; address: string }[]>([]);
  const [scanningPrinters, setScanningPrinters] = useState(false);
  const [printerQzName, setPrinterQzName] = useState("");
  const [qzPrinters, setQzPrinters] = useState<string[]>([]);
  const [scanningQz, setScanningQz] = useState(false);

  async function handleScanQzPrinters() {
    setScanningQz(true);
    const printers = await listQzPrinters();
    setQzPrinters(printers);
    if (printers.length === 0) {
      show("Nenhuma impressora encontrada. O QZ Tray está instalado e aberto neste PC?", "error");
    }
    setScanningQz(false);
  }
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch("/api/admin/settings")
      .then((r) => r.json())
      .then((data) => {
        setRestaurantIsOpen(data.restaurant.isOpen);
        const fetchedHours: BusinessHour[] = data.businessHours;
        if (fetchedHours.length === 0) {
          setHours(
            Array.from({ length: 7 }, (_, dayOfWeek) => ({ dayOfWeek, isOpen: true, openTime: "08:00", closeTime: "22:00" }))
          );
        } else {
          setHours(fetchedHours.sort((a, b) => a.dayOfWeek - b.dayOfWeek));
        }
        setPixKey(data.restaurant.pixKey ?? "");
        setPixKeyType(data.restaurant.pixKeyType ?? "RANDOM");
        setPixMerchantName(data.restaurant.pixMerchantName ?? "");
        setPixMerchantCity(data.restaurant.pixMerchantCity ?? "");
        setPhone(data.restaurant.phone ?? "");
        setAddress(data.restaurant.address ?? "");
        setAvgDeliveryTime(data.restaurant.avgDeliveryTime ?? "");
        setServiceFeePercent(String(data.restaurant.serviceFeePercent ?? 0));
        setUseDeliveryZones(data.restaurant.useDeliveryZones ?? false);
        setMenuTheme(data.restaurant.menuTheme ?? "CLASSIC");
        setPlan(data.restaurant.plan ?? "START");
        setLoyaltyPointsEnabled(data.restaurant.loyaltyPointsEnabled ?? false);
        setLoyaltyPointsPerReal(String(data.restaurant.loyaltyPointsPerReal ?? 1));
        setLoyaltyPointsRedeemThreshold(String(data.restaurant.loyaltyPointsRedeemThreshold ?? 100));
        setLoyaltyPointsRedeemValueCents(String((data.restaurant.loyaltyPointsRedeemValueCents ?? 1000) / 100));
        setCashbackEnabled(data.restaurant.cashbackEnabled ?? false);
        setCashbackPercent(String(data.restaurant.cashbackPercent ?? 5));
        setDailyCounterEnabled(data.restaurant.dailyCounterEnabled ?? false);
        setDailyCounterNext(String(data.restaurant.dailyCounterNext ?? 1));
        setPrintKitchenCopy(data.restaurant.printKitchenCopy ?? true);
        setPrintMethod(data.restaurant.printMethod ?? "MANUAL");
        setPrinterIp(data.restaurant.printerIp ?? "");
        setPrinterPort(String(data.restaurant.printerPort ?? 9100));
        setPrinterBluetoothAddress(data.restaurant.printerBluetoothAddress ?? "");
        setPrinterBluetoothName(data.restaurant.printerBluetoothName ?? "");
        setPrinterQzName(data.restaurant.printerQzName ?? "");
        setLogoUrl(data.restaurant.logoUrl ?? null);
        setLoading(false);
      });
  }, []);

  function updateDay(dayOfWeek: number, patch: Partial<BusinessHour>) {
    setHours((hs) => hs.map((h) => (h.dayOfWeek === dayOfWeek ? { ...h, ...patch } : h)));
  }

  async function handleScanPrinters() {
    setScanningPrinters(true);
    const { devices, error } = await listPairedBluetoothPrinters();
    setPairedPrinters(devices);
    setScanningPrinters(false);
    if (error) {
      show(`Erro ao buscar impressoras: ${error}`, "error");
    } else if (devices.length === 0) {
      show("Nenhuma impressora pareada encontrada. Pareie primeiro nas Configurações de Bluetooth do Android.", "info");
    }
  }

  async function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingLogo(true);
    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch("/api/admin/logo", { method: "POST", body: formData });
    setUploadingLogo(false);

    if (!res.ok) {
      const data = await res.json().catch(() => null);
      show(data?.error ?? "Não foi possível enviar a logo.", "error");
      return;
    }
    const data = await res.json();
    setLogoUrl(data.logoUrl);
    show("Logo atualizada.", "success");
  }

  async function handleLogoRemove() {
    if (!confirm("Remover a logo do restaurante?")) return;
    await fetch("/api/admin/logo", { method: "DELETE" });
    setLogoUrl(null);
    show("Logo removida.", "info");
  }

  async function handleSave() {
    setSaving(true);
    const res = await fetch("/api/admin/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        isOpen: restaurantIsOpen,
        businessHours: hours,
        pixKey: pixKey || undefined,
        pixKeyType,
        pixMerchantName: pixMerchantName || undefined,
        pixMerchantCity: pixMerchantCity || undefined,
        phone: phone || undefined,
        address: address || undefined,
        avgDeliveryTime: avgDeliveryTime || undefined,
        serviceFeePercent: Number(serviceFeePercent) || 0,
        useDeliveryZones,
        menuTheme,
        loyaltyPointsEnabled,
        loyaltyPointsPerReal: Number(loyaltyPointsPerReal) || 0,
        loyaltyPointsRedeemThreshold: Number(loyaltyPointsRedeemThreshold) || 0,
        loyaltyPointsRedeemValueCents: Math.round(Number(loyaltyPointsRedeemValueCents) * 100) || 0,
        cashbackEnabled,
        cashbackPercent: Number(cashbackPercent) || 0,
        dailyCounterEnabled,
        dailyCounterNext: Number(dailyCounterNext) || 1,
        printKitchenCopy,
        printMethod,
        printerIp: printMethod === "AGENT" ? printerIp : undefined,
        printerPort: printMethod === "AGENT" ? Number(printerPort) || 9100 : undefined,
        printerBluetoothAddress: printMethod === "AGENT_BLUETOOTH" ? printerBluetoothAddress : undefined,
        printerBluetoothName: printMethod === "AGENT_BLUETOOTH" ? printerBluetoothName : undefined,
        printerQzName: printMethod === "QZ_TRAY" ? printerQzName : undefined,
      }),
    });
    setSaving(false);
    if (res.ok) show("Configurações salvas.", "success");
    else show("Não foi possível salvar.", "error");
  }

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-6 sm:px-6">
        <Skeleton className="h-8 w-40 mb-6" />
        <Skeleton className="h-20 mb-6" />
        <Skeleton className="h-56 mb-6" />
        <Skeleton className="h-40" />
      </div>
    );
  }

  const inputClass =
    "w-full px-3.5 py-2.5 rounded-xl border border-surface-border bg-white text-sm focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand transition-shadow duration-[180ms]";

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 sm:px-6 pb-28">
      <PageHeader icon={Settings} title="Configurações" subtitle="Dados do restaurante, Pix, horários e impressão." />

      {/* Abas — evita a rolagem infinita de antes; cada grupo agora fica
          isolado, e o botão salvar continua valendo pra tudo de uma vez,
          não precisa trocar de aba pra não perder o que mudou. */}
      <div className="flex gap-1.5 mb-6 overflow-x-auto scrollbar-none border-b border-surface-border">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-1.5 whitespace-nowrap px-3.5 py-2.5 text-sm font-medium border-b-2 transition-colors duration-[180ms] shrink-0 ${
                active ? "border-brand text-brand" : "border-transparent text-gray-500 hover:text-gray-800"
              }`}
            >
              <Icon size={14} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {activeTab === "geral" && (
        <>
          <Card className="mb-5">
            <CardHeader className="flex items-center gap-2">
              <ImageIcon size={15} className="text-gray-400" />
              <CardTitle>Logo do restaurante</CardTitle>
            </CardHeader>
            <CardBody className="flex items-center gap-4">
              {logoUrl ? (
                <img src={logoUrl} alt="Logo do restaurante" className="w-16 h-16 rounded-2xl object-cover border border-surface-border shrink-0" />
              ) : (
                <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center text-gray-300 text-xs font-semibold shrink-0">
                  Logo
                </div>
              )}
              <div className="flex-1 min-w-0">
                <CardDescription className="mt-0 mb-2.5">PNG, JPG ou WEBP, até 2MB. Aparece na sua barra lateral e no cardápio público.</CardDescription>
                <div className="flex gap-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    onChange={handleLogoUpload}
                    className="hidden"
                  />
                  <Button variant="secondary" size="sm" onClick={() => fileInputRef.current?.click()} isLoading={uploadingLogo}>
                    {logoUrl ? "Trocar" : "Enviar logo"}
                  </Button>
                  {logoUrl && (
                    <Button variant="ghost" size="sm" onClick={handleLogoRemove}>
                      Remover
                    </Button>
                  )}
                </div>
              </div>
            </CardBody>
          </Card>

          <Card className="mb-5">
            <CardBody className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${restaurantIsOpen ? "bg-emerald-50 text-emerald-600" : "bg-brand-light text-brand"}`}>
                  <Power size={15} />
                </div>
                <div>
                  <p className="font-semibold text-sm text-gray-900">Loja {restaurantIsOpen ? "aberta" : "fechada"} manualmente</p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Desligar aqui fecha a loja na hora, mesmo dentro do horário programado. Use para emergências.
                  </p>
                </div>
              </div>
            <Toggle checked={restaurantIsOpen} onChange={() => setRestaurantIsOpen((v) => !v)} />
          </CardBody>
        </Card>

        <Card className="mb-5">
          <CardHeader className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Hash size={15} className="text-gray-400" />
              <div>
                <CardTitle>Numeração de pedido</CardTitle>
                <CardDescription className="mt-0.5">Um número sequencial simples (#1, #2...) além do código do pedido — você controla quando reseta.</CardDescription>
              </div>
            </div>
            <Toggle checked={dailyCounterEnabled} onChange={() => setDailyCounterEnabled((v) => !v)} />
          </CardHeader>
          {dailyCounterEnabled && (
            <CardBody>
              <Label>Próximo número a usar</Label>
              <p className="text-xs text-gray-400 mb-2">
                Muda isso a qualquer momento pra resetar (ex: coloca 1 no início do dia) ou pular pra outro número.
              </p>
              <input
                value={dailyCounterNext}
                onChange={(e) => setDailyCounterNext(e.target.value)}
                type="number"
                min="1"
                className={`${inputClass} w-32`}
              />
            </CardBody>
          )}
        </Card>

        <Card className="mb-5">
          <CardHeader className="flex items-center gap-2">
            <PhoneIcon size={15} className="text-gray-400" />
            <CardTitle>Informações de contato</CardTitle>
            </CardHeader>
            <CardBody>
              <div className="space-y-3">
                <div>
                  <Label>Endereço</Label>
                  <input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Rua, número, bairro, cidade" className={inputClass} />
                </div>
                <div>
                  <Label>Telefone</Label>
                  <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="(35) 99999-9999" className={inputClass} />
                </div>
                <div>
                  <Label>Tempo médio de entrega</Label>
                  <input value={avgDeliveryTime} onChange={(e) => setAvgDeliveryTime(e.target.value)} placeholder="ex: 30-45 min" className={inputClass} />
                </div>
              </div>
            </CardBody>
          </Card>
        </>
      )}

      {activeTab === "pagamento" && (
        <>
          <Card className="mb-5">
            <CardHeader className="flex items-center gap-2">
              <Wallet size={15} className="text-gray-400" />
              <div>
                <CardTitle>Pix</CardTitle>
                <CardDescription className="mt-0.5">Sem gateway: o cliente paga direto na sua chave e você confere manualmente pelo app do banco.</CardDescription>
              </div>
            </CardHeader>
            <CardBody>
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <Label>Chave Pix</Label>
                  <input value={pixKey} onChange={(e) => setPixKey(e.target.value)} placeholder="CPF, e-mail, telefone ou chave aleatória" className={inputClass} />
                </div>
                <div>
                  <Label>Tipo</Label>
                  <select value={pixKeyType} onChange={(e) => setPixKeyType(e.target.value)} className={inputClass}>
                    <option value="RANDOM">Aleatória</option>
                    <option value="CPF">CPF</option>
                    <option value="CNPJ">CNPJ</option>
                    <option value="EMAIL">E-mail</option>
                    <option value="PHONE">Telefone</option>
                  </select>
                </div>
                <div>
                  <Label>Nome do titular</Label>
                  <input
                    value={pixMerchantName}
                    onChange={(e) => setPixMerchantName(e.target.value.slice(0, 25))}
                    placeholder="Nome que aparece no Pix"
                    maxLength={25}
                    className={inputClass}
                  />
                </div>
                <div className="col-span-2">
                  <Label>Cidade</Label>
                  <input
                    value={pixMerchantCity}
                    onChange={(e) => setPixMerchantCity(e.target.value.slice(0, 15))}
                    placeholder="ex: SAO PAULO"
                    maxLength={15}
                    className={inputClass}
                  />
                </div>
              </div>
            </CardBody>
          </Card>

          <Card className="mb-5">
            <CardHeader className="flex items-center gap-2">
              <Percent size={15} className="text-gray-400" />
              <CardTitle>Taxa de Serviço</CardTitle>
            </CardHeader>
            <CardBody>
              <CardDescription className="mb-3">
                Cobrada só no fechamento de comandas (mesas) — não afeta delivery nem balcão. Deixe 0 pra não cobrar.
              </CardDescription>
              <div className="flex items-center gap-2">
                <input
                  value={serviceFeePercent}
                  onChange={(e) => setServiceFeePercent(e.target.value)}
                  type="number"
                  step="1"
                  min="0"
                  max="100"
                  className={`${inputClass} w-24`}
                />
                <span className="text-sm text-gray-500">%</span>
              </div>
            </CardBody>
          </Card>

          <Card className="mb-5">
            <CardHeader className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MapPinIcon size={15} className="text-gray-400" />
                <div>
                  <CardTitle>Taxa de entrega por zona (mapa)</CardTitle>
                  <CardDescription className="mt-0.5">
                    Usa as áreas desenhadas em Zonas de Entrega em vez da lista simples de bairro.
                  </CardDescription>
                </div>
              </div>
              <Toggle checked={useDeliveryZones} onChange={() => setUseDeliveryZones((v) => !v)} />
            </CardHeader>
          </Card>
        </>
      )}

      {activeTab === "cardapio" && (
        <>
          <Card className="mb-5">
            <CardHeader className="flex items-center gap-2">
              <Palette size={15} className="text-gray-400" />
              <CardTitle>Tema do Cardápio</CardTitle>
            </CardHeader>
            <CardBody>
              <CardDescription className="mb-3">Escolha o visual que seu cliente vê ao abrir seu cardápio.</CardDescription>
              <div className="grid grid-cols-1 gap-3">
                <button
                  type="button"
                  onClick={() => setMenuTheme("CLASSIC")}
                  className={`text-left rounded-xl border-2 p-3 transition-colors duration-[180ms] ${
                    menuTheme === "CLASSIC" ? "border-brand" : "border-surface-border"
                  }`}
                >
                  <p className="font-semibold text-sm text-gray-800">Clássico</p>
                  <p className="text-xs text-gray-400 mt-0.5">Creme e laranja, cards com foto — estilo app de delivery.</p>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    if (plan !== "PRO") return;
                    setMenuTheme("PREMIUM");
                  }}
                  disabled={plan !== "PRO"}
                  className={`text-left rounded-xl border-2 p-3 transition-colors duration-[180ms] disabled:opacity-60 ${
                    menuTheme === "PREMIUM" ? "border-brand" : "border-surface-border"
                  }`}
                >
                  <p className="font-semibold text-sm text-gray-800 flex items-center gap-1.5">
                    Premium
                    {plan !== "PRO" && <Lock size={11} className="text-gray-400" />}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">Grafite e dourado, lista serifada — estilo cardápio de restaurante.</p>
                </button>
              </div>

              {plan !== "PRO" && (
                <p className="text-xs text-gray-500 mt-3">
                  O tema Premium é exclusivo do plano Pro.{" "}
                  <a href="/admin/planos" className="text-brand font-semibold underline">
                    Fazer upgrade
                  </a>
                </p>
              )}
            </CardBody>
          </Card>

          <Card className="mb-5">
            <CardHeader className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Gift size={15} className="text-gray-400" />
                <div>
                  <CardTitle>Pontos de Fidelidade</CardTitle>
                  <CardDescription className="mt-0.5">Cliente acumula pontos gastando, e troca por desconto.</CardDescription>
                </div>
              </div>
              <Toggle checked={loyaltyPointsEnabled} onChange={() => setLoyaltyPointsEnabled((v) => !v)} />
            </CardHeader>
            {loyaltyPointsEnabled && (
              <CardBody className="grid grid-cols-3 gap-3">
                <div>
                  <Label>Pontos por real gasto</Label>
                  <input value={loyaltyPointsPerReal} onChange={(e) => setLoyaltyPointsPerReal(e.target.value)} type="number" step="0.1" min="0" className={inputClass} />
                </div>
                <div>
                  <Label>Pontos p/ resgate</Label>
                  <input value={loyaltyPointsRedeemThreshold} onChange={(e) => setLoyaltyPointsRedeemThreshold(e.target.value)} type="number" min="0" className={inputClass} />
                </div>
                <div>
                  <Label>Valor do resgate (R$)</Label>
                  <input value={loyaltyPointsRedeemValueCents} onChange={(e) => setLoyaltyPointsRedeemValueCents(e.target.value)} type="number" step="0.01" min="0" className={inputClass} />
                </div>
              </CardBody>
            )}
          </Card>

          <Card className="mb-5">
            <CardHeader className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Coins size={15} className="text-gray-400" />
                <div>
                  <CardTitle>Cashback</CardTitle>
                  <CardDescription className="mt-0.5">Uma % do pedido volta como crédito pro próximo pedido.</CardDescription>
                </div>
              </div>
              <Toggle checked={cashbackEnabled} onChange={() => setCashbackEnabled((v) => !v)} />
            </CardHeader>
            {cashbackEnabled && (
              <CardBody>
                <div className="flex items-center gap-2">
                  <input value={cashbackPercent} onChange={(e) => setCashbackPercent(e.target.value)} type="number" min="0" max="100" className={`${inputClass} w-24`} />
                  <span className="text-sm text-gray-500">% do valor do pedido</span>
                </div>
              </CardBody>
            )}
          </Card>
        </>
      )}

      {activeTab === "impressao" && (
        <Card className="mb-5">
          <CardHeader className="flex items-center gap-2">
            <Printer size={15} className="text-gray-400" />
            <div>
              <CardTitle>Impressão automática</CardTitle>
              <CardDescription className="mt-0.5">Escolha como os pedidos novos são impressos no seu balcão.</CardDescription>
            </div>
          </CardHeader>
          <CardBody>
            <Label>Método</Label>
            <select value={printMethod} onChange={(e) => setPrintMethod(e.target.value)} className={inputClass}>
              <option value="MANUAL">Manual (clicar em imprimir)</option>
              <option value="RAWBT">Automático via app RawBT (celular)</option>
              <option value="AGENT">Automático via app Menuair Caixa — impressora Wi-Fi/Rede</option>
              <option value="AGENT_BLUETOOTH">Automático via app Menuair Caixa — impressora Bluetooth</option>
              <option value="QZ_TRAY">Automático via QZ Tray — impressora no PC/notebook</option>
            </select>
            {printMethod === "RAWBT" && (
              <div className="mt-3 rounded-xl bg-amber-50 border border-amber-200 p-3 text-xs text-amber-800 leading-relaxed">
                Instale o app <strong>RawBT</strong> (gratuito, na Play Store) no celular que fica no balcão e
                conecte-o na sua impressora térmica. Depois disso, os pedidos novos imprimem sozinhos, sem
                precisar clicar em nada.
              </div>
            )}
            {printMethod === "AGENT" && (
              <div className="mt-3 space-y-3">
                <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-3 text-xs text-emerald-800 leading-relaxed">
                  Precisa do app <strong>Menuair Caixa</strong> instalado no celular do balcão. A impressora
                  precisa estar na mesma rede Wi-Fi.
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div className="col-span-2">
                    <Label>IP da impressora</Label>
                    <input value={printerIp} onChange={(e) => setPrinterIp(e.target.value)} placeholder="192.168.1.50" className={inputClass} />
                  </div>
                  <div>
                    <Label>Porta</Label>
                    <input value={printerPort} onChange={(e) => setPrinterPort(e.target.value)} placeholder="9100" className={inputClass} />
                  </div>
                </div>
              </div>
            )}
            {printMethod === "AGENT_BLUETOOTH" && (
              <div className="mt-3 space-y-3">
                <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-3 text-xs text-emerald-800 leading-relaxed">
                  Precisa do app <strong>Menuair Caixa</strong> instalado no celular do balcão, com a
                  impressora já pareada no Bluetooth do Android (fora deste app, do mesmo jeito que se
                  pareia um fone de ouvido).
                </div>
                <Button variant="secondary" size="sm" onClick={handleScanPrinters} isLoading={scanningPrinters} type="button">
                  Buscar impressoras pareadas
                </Button>
                {pairedPrinters.length > 0 && (
                  <select
                    value={printerBluetoothAddress}
                    onChange={(e) => {
                      const selected = pairedPrinters.find((p) => p.address === e.target.value);
                      setPrinterBluetoothAddress(e.target.value);
                      setPrinterBluetoothName(selected?.name ?? "");
                    }}
                    className={inputClass}
                  >
                    <option value="">Selecione a impressora</option>
                    {pairedPrinters.map((p) => (
                      <option key={p.address} value={p.address}>
                        {p.name} ({p.address})
                      </option>
                    ))}
                  </select>
                )}
                {printerBluetoothAddress && (
                  <p className="text-xs text-emerald-700">
                    Selecionada: <strong>{printerBluetoothName || printerBluetoothAddress}</strong>
                  </p>
                )}
              </div>
            )}

            <div className="flex items-center justify-between gap-3 mt-4 pt-4 border-t border-surface-border">
              <div>
                <p className="text-sm font-semibold text-gray-800">Imprimir via separada pra cozinha</p>
                <p className="text-xs text-gray-400">Sem preços — só nome, telefone e itens. Se desligado, sai só 1 via completa.</p>
              </div>
              <Toggle checked={printKitchenCopy} onChange={() => setPrintKitchenCopy((v) => !v)} />
            </div>

            {printMethod === "QZ_TRAY" && (
              <div className="mt-3 space-y-3">
                <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-3 text-xs text-emerald-800 leading-relaxed">
                  Precisa instalar o <strong>QZ Tray</strong> (gratuito) no PC/notebook do balcão —{" "}
                  <a href="https://qz.io/download/" target="_blank" rel="noopener noreferrer" className="underline font-semibold">
                    baixar aqui
                  </a>
                  . Deixe ele aberto (ícone na bandeja do sistema) e a impressora térmica instalada normalmente no Windows/Mac.
                </div>
                <Button variant="secondary" size="sm" onClick={handleScanQzPrinters} isLoading={scanningQz} type="button">
                  Buscar impressoras do QZ Tray
                </Button>
                {qzPrinters.length > 0 && (
                  <select value={printerQzName} onChange={(e) => setPrinterQzName(e.target.value)} className={inputClass}>
                    <option value="">Selecione a impressora</option>
                    {qzPrinters.map((name) => (
                      <option key={name} value={name}>
                        {name}
                      </option>
                    ))}
                  </select>
                )}
                {printerQzName && (
                  <p className="text-xs text-emerald-700">
                    Selecionada: <strong>{printerQzName}</strong>
                  </p>
                )}
              </div>
            )}
          </CardBody>
        </Card>
      )}

      {activeTab === "horario" && (
        <div className="space-y-2">
          {hours.map((h) => (
            <Card key={h.dayOfWeek}>
              <CardBody className="flex flex-wrap items-center gap-3 !py-3.5 sm:flex-nowrap">
                <Toggle size="sm" checked={h.isOpen} onChange={() => updateDay(h.dayOfWeek, { isOpen: !h.isOpen })} />
                <span className="text-sm font-medium text-gray-800 w-24 sm:w-32 shrink-0">{DAY_LABELS[h.dayOfWeek]}</span>
                {h.isOpen ? (
                  <div className="flex flex-wrap items-center gap-2 flex-1">
                    <input
                      type="time"
                      value={h.openTime}
                      onChange={(e) => updateDay(h.dayOfWeek, { openTime: e.target.value })}
                      className="px-2.5 py-1.5 rounded-lg border border-surface-border text-sm"
                    />
                    <span className="text-gray-400 text-sm">até</span>
                    <input
                      type="time"
                      value={h.closeTime}
                      onChange={(e) => updateDay(h.dayOfWeek, { closeTime: e.target.value })}
                      className="px-2.5 py-1.5 rounded-lg border border-surface-border text-sm"
                    />
                  </div>
                ) : (
                  <span className="text-sm text-gray-400 italic">Fechado</span>
                )}
              </CardBody>
            </Card>
          ))}
        </div>
      )}

      <div className="fixed bottom-0 left-0 right-0 sm:left-64 bg-white/90 backdrop-blur border-t border-surface-border px-4 py-3 sm:px-6 z-30">
        <div className="max-w-2xl mx-auto">
          <Button onClick={handleSave} isLoading={saving} className="w-full sm:w-auto">
            Salvar configurações
          </Button>
        </div>
      </div>
    </div>
  );
}