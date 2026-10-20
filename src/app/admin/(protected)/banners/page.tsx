"use client";

import { useEffect, useRef, useState } from "react";
import { Image as ImageIcon, Plus, Trash2, ArrowUp, ArrowDown } from "lucide-react";
import { Card, CardBody } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/Skeleton";
import { useToast } from "@/components/ui/Toast";

type Banner = {
  id: string;
  imageUrl: string;
  position: number;
  active: boolean;
  couponId: string | null;
  coupon: { id: string; code: string; active: boolean } | null;
};

type CouponOption = { id: string; code: string; active: boolean };

const selectClass =
  "w-full px-3 py-2 rounded-xl border border-surface-border bg-white text-sm focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand";

export default function BannersPage() {
  const { show } = useToast();
  const [banners, setBanners] = useState<Banner[]>([]);
  const [coupons, setCoupons] = useState<CouponOption[]>([]);
  const [max, setMax] = useState(3);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  async function load() {
    const [bannersRes, couponsRes] = await Promise.all([
      fetch("/api/admin/banners").then((r) => r.json()),
      fetch("/api/admin/coupons").then((r) => r.json()),
    ]);
    setBanners(bannersRes.banners ?? []);
    setMax(bannersRes.max ?? 3);
    setCoupons(
      Array.isArray(couponsRes)
        ? couponsRes.map((c: CouponOption) => ({ id: c.id, code: c.code, active: c.active }))
        : []
    );
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ""; // permite escolher o mesmo arquivo de novo
    if (!file) return;
    setUploading(true);
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch("/api/admin/banners", { method: "POST", body: fd });
    setUploading(false);
    if (!res.ok) {
      const data = await res.json().catch(() => null);
      show(data?.error ?? "Não foi possível enviar o banner.", "error");
      return;
    }
    show("Banner adicionado.", "success");
    load();
  }

  async function patchBanner(id: string, body: { active?: boolean; couponId?: string | null }) {
    const res = await fetch(`/api/admin/banners/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => null);
      show(data?.error ?? "Não foi possível salvar.", "error");
      return;
    }
    load();
  }

  async function move(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= banners.length) return;
    const next = [...banners];
    [next[index], next[target]] = [next[target], next[index]];
    setBanners(next); // feedback imediato
    const res = await fetch("/api/admin/banners", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ order: next.map((b) => b.id) }),
    });
    if (!res.ok) show("Não foi possível reordenar.", "error");
    load();
  }

  async function handleDelete(id: string) {
    if (!confirm("Excluir esse banner?")) return;
    await fetch(`/api/admin/banners/${id}`, { method: "DELETE" });
    show("Banner excluído.", "info");
    load();
  }

  const atLimit = banners.length >= max;

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 sm:px-6">
      <div className="flex items-start justify-between gap-3 mb-6">
        <PageHeader
          icon={ImageIcon}
          title="Banners"
          subtitle={`Promoções no topo do cardápio. Até ${max} banners; com 2 ou mais vira carrossel.`}
        />
        <Button
          onClick={() => fileRef.current?.click()}
          disabled={atLimit || uploading}
          isLoading={uploading}
          className="shrink-0"
        >
          <Plus size={14} /> Novo
        </Button>
        <input
          ref={fileRef}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          className="hidden"
          onChange={handleFile}
        />
      </div>

      <p className="text-xs text-gray-400 mb-4">
        Use imagem na proporção 2:1 (ex.: 1200 × 600), PNG, JPG ou WEBP, até 3MB. No computador o
        banner aparece mais baixo e corta um pouco em cima e embaixo: deixe textos e preços no centro da arte.
        {atLimit && " Limite atingido: exclua um banner para adicionar outro."}
      </p>

      {loading ? (
        <div className="space-y-3">
          <Skeleton className="h-40" />
          <Skeleton className="h-40" />
        </div>
      ) : banners.length === 0 ? (
        <EmptyState
          icon={<ImageIcon size={18} />}
          title="Nenhum banner ainda"
          description="Suba a arte da sua promoção pra ela aparecer no topo do cardápio."
        />
      ) : (
        <div className="space-y-3">
          {banners.map((b, index) => (
            <Card key={b.id}>
              <CardBody className="!p-3">
                <div className="aspect-[2/1] w-full overflow-hidden rounded-xl bg-gray-100 mb-3">
                  <img
                    src={b.imageUrl}
                    alt={`Banner ${index + 1}`}
                    className={`w-full h-full object-cover ${b.active ? "" : "opacity-40 grayscale"}`}
                  />
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex flex-col">
                    <button
                      onClick={() => move(index, -1)}
                      disabled={index === 0}
                      className="p-1 text-gray-400 hover:text-gray-700 disabled:opacity-30"
                      aria-label="Subir"
                    >
                      <ArrowUp size={14} />
                    </button>
                    <button
                      onClick={() => move(index, 1)}
                      disabled={index === banners.length - 1}
                      className="p-1 text-gray-400 hover:text-gray-700 disabled:opacity-30"
                      aria-label="Descer"
                    >
                      <ArrowDown size={14} />
                    </button>
                  </div>
                  <div className="flex-1" />

                  <button onClick={() => patchBanner(b.id, { active: !b.active })} className="shrink-0">
                    <Badge tone={b.active ? "success" : "neutral"}>{b.active ? "Ativo" : "Inativo"}</Badge>
                  </button>

                  <button
                    onClick={() => handleDelete(b.id)}
                    className="text-gray-300 hover:text-red-500 transition-colors duration-[180ms] shrink-0"
                    aria-label="Excluir banner"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}