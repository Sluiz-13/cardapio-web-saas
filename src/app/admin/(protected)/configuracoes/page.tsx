"use client";

import { useEffect, useState, useRef } from "react";
import { Power, Settings, ImageIcon, Wallet, Phone as PhoneIcon, Clock, Printer } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardBody } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Label } from "@/components/ui/Input";
import { PageHeader } from "@/components/ui/PageHeader";
import { Skeleton } from "@/components/ui/Skeleton";
import { useToast } from "@/components/ui/Toast";


const DAY_LABELS = ["Domingo", "Segunda-feira", "Terça-feira", "Quarta-feira", "Quinta-feira", "Sexta-feira", "Sábado"];

type BusinessHour = { dayOfWeek: number; isOpen: boolean; openTime: string; closeTime: string };

function Toggle({ checked, onChange, size = "md" }: { checked: boolean; onChange: () => void; size?: "sm" | "md" }) {
  const dims = size === "md" ? { w: "w-12", h: "h-7", dot: "w-5 h-5", on: "26px", off: "4px" } : { w: "w-10", h: "h-6", dot: "w-4 h-4", on: "20px", off: "4px" };
  return (
    <button
      onClick={onChange}
      className={`relative ${dims.w} ${dims.h} rounded-full transition-colors duration-[180ms] shrink-0`}
      style={{ background: checked ? "#059669" : "#D1D5DB" }}
    >
      <span
        className={`absolute top-1 ${dims.dot} rounded-full bg-white shadow-sm transition-all duration-[180ms]`}
        style={{ left: checked ? dims.on : dims.off }}
      />
    </button>
  );
}

export default function ConfiguracoesPage() {
  const { show } = useToast();
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
  const [printMethod, setPrintMethod] = useState("MANUAL");
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
        setPrintMethod(data.restaurant.printMethod ?? "MANUAL");
        setLogoUrl(data.restaurant.logoUrl ?? null);
        setLoading(false);
      });
  }, []);

  function updateDay(dayOfWeek: number, patch: Partial<BusinessHour>) {
    setHours((hs) => hs.map((h) => (h.dayOfWeek === dayOfWeek ? { ...h, ...patch } : h)));
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
        printMethod,
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
            <option value="AGENT" disabled>Automático via PC/notebook (em breve)</option>
          </select>
          {printMethod === "RAWBT" && (
            <div className="mt-3 rounded-xl bg-amber-50 border border-amber-200 p-3 text-xs text-amber-800 leading-relaxed">
              Instale o app <strong>RawBT</strong> (gratuito, na Play Store) no celular que fica no balcão e
              conecte-o na sua impressora térmica. Depois disso, os pedidos novos imprimem sozinhos, sem
              precisar clicar em nada.
            </div>
          )}
        </CardBody>
      </Card>

      <div className="flex items-center gap-2 mb-3 mt-8">
        <Clock size={13} className="text-gray-400" />
        <p className="text-xs uppercase tracking-wide font-semibold text-gray-400">Horário de funcionamento</p>
      </div>
      <div className="space-y-2 mb-8">
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

      {/* Barra fixa no rodapé: evita ter que rolar a tela toda de volta pra
          achar o botão salvar depois de mexer nos horários lá embaixo. */}
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