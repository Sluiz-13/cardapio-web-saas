"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2, X, MapPin, Pause, Play } from "lucide-react";
import * as turf from "@turf/turf";
import { Card, CardBody } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Label } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/Skeleton";
import { useToast } from "@/components/ui/Toast";
import dynamic from "next/dynamic";

const ZoneMapEditor = dynamic(() => import("./_components/zone-map-editor"), { ssr: false });

type LatLng = { lat: number; lng: number };
type Zone = {
  id: string;
  name: string;
  feeCents: number;
  minOrderCents: number | null;
  estimatedMinutes: number | null;
  neighborhoods: string[];
  geoJson: { type: "Polygon"; coordinates: number[][][] };
  active: boolean;
  pauseReason: string | null;
};

const currency = (cents: number) => `R$ ${(cents / 100).toFixed(2).replace(".", ",")}`;

function polygonToLatLngs(geoJson: Zone["geoJson"]): LatLng[] {
  const ring = geoJson.coordinates[0] ?? [];
  // Remove o último ponto se for igual ao primeiro (GeoJSON fecha o anel assim; nosso editor não precisa disso repetido).
  const pts = ring.map(([lng, lat]) => ({ lat, lng }));
  if (pts.length > 1 && pts[0].lat === pts[pts.length - 1].lat && pts[0].lng === pts[pts.length - 1].lng) {
    pts.pop();
  }
  return pts;
}

function latLngsToPolygon(points: LatLng[]): Zone["geoJson"] {
  const ring = points.map((p) => [p.lng, p.lat] as [number, number]);
  if (ring.length > 0) ring.push(ring[0]); // GeoJSON exige o anel fechado
  return { type: "Polygon", coordinates: [ring] };
}

export default function ZonasEntregaPage() {
  const { show } = useToast();
  const [zones, setZones] = useState<Zone[]>([]);
  const [center, setCenter] = useState<LatLng>({ lat: -23.55, lng: -46.63 });
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingZone, setEditingZone] = useState<Zone | null>(null);

  async function load() {
    setLoading(true);
    const [zonesRes, centerRes] = await Promise.all([
      fetch("/api/admin/delivery-zones").then((r) => r.json()),
      fetch("/api/admin/delivery-zones/geocode-restaurant").then((r) => r.json()),
    ]);
    setZones(zonesRes);
    setCenter(centerRes);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function togglePause(zone: Zone) {
    const reason = zone.active ? prompt("Motivo da pausa (opcional):") ?? undefined : undefined;
    await fetch(`/api/admin/delivery-zones/${zone.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: !zone.active, pauseReason: zone.active ? reason || "Pausado manualmente" : null }),
    });
    load();
  }

  async function handleDelete(id: string) {
    if (!confirm("Remover essa área de entrega?")) return;
    await fetch(`/api/admin/delivery-zones/${id}`, { method: "DELETE" });
    show("Área removida.", "info");
    load();
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 sm:px-6">
      <div className="flex items-start justify-between gap-3 mb-6">
        <PageHeader icon={MapPin} title="Zonas de Entrega" subtitle="Desenhe áreas no mapa e defina uma taxa pra cada uma." />
        <Button onClick={() => setShowForm(true)} className="shrink-0">
          <Plus size={14} /> Nova área
        </Button>
      </div>

      {loading ? (
        <div className="space-y-2">
          <Skeleton className="h-20" />
          <Skeleton className="h-20" />
        </div>
      ) : zones.length === 0 ? (
        <EmptyState icon={<MapPin size={18} />} title="Nenhuma área desenhada ainda" description="Crie a primeira área acima." />
      ) : (
        <div className="space-y-2">
          {zones.map((z) => (
            <Card key={z.id}>
              <CardBody className="!py-3.5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-bold text-sm text-gray-900">{z.name}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {currency(z.feeCents)}
                      {z.minOrderCents ? ` · mín. ${currency(z.minOrderCents)}` : ""}
                      {z.estimatedMinutes ? ` · ~${z.estimatedMinutes} min` : ""}
                    </p>
                    {z.neighborhoods.length > 0 && (
                      <p className="text-xs text-gray-400 mt-0.5">Bairros: {z.neighborhoods.join(", ")}</p>
                    )}
                    {!z.active && z.pauseReason && <p className="text-xs text-amber-600 mt-1">Pausada: {z.pauseReason}</p>}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Badge tone={z.active ? "success" : "neutral"}>{z.active ? "Ativa" : "Pausada"}</Badge>
                    <button onClick={() => togglePause(z)} className="text-gray-400 hover:text-gray-700" title={z.active ? "Pausar" : "Ativar"}>
                      {z.active ? <Pause size={15} /> : <Play size={15} />}
                    </button>
                    <button onClick={() => setEditingZone(z)} className="text-gray-400 hover:text-brand text-xs font-semibold">
                      Editar
                    </button>
                    <button onClick={() => handleDelete(z.id)} className="text-gray-300 hover:text-red-500">
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      )}

      {(showForm || editingZone) && (
        <ZoneFormModal
          center={center}
          initial={editingZone}
          onClose={() => {
            setShowForm(false);
            setEditingZone(null);
          }}
          onSaved={() => {
            setShowForm(false);
            setEditingZone(null);
            show(editingZone ? "Área atualizada." : "Área criada.", "success");
            load();
          }}
        />
      )}
    </div>
  );
}

function ZoneFormModal({
  center,
  initial,
  onClose,
  onSaved,
}: {
  center: LatLng;
  initial: Zone | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const isEditing = !!initial;
  const [name, setName] = useState(initial?.name ?? "");
  const [fee, setFee] = useState(initial ? String(initial.feeCents / 100) : "");
  const [minOrder, setMinOrder] = useState(initial?.minOrderCents ? String(initial.minOrderCents / 100) : "");
  const [estimatedMinutes, setEstimatedMinutes] = useState(initial?.estimatedMinutes ? String(initial.estimatedMinutes) : "");
  const [neighborhoodsInput, setNeighborhoodsInput] = useState(initial?.neighborhoods.join(", ") ?? "");
  const [points, setPoints] = useState<LatLng[]>(initial ? polygonToLatLngs(initial.geoJson) : []);
  const [radiusKm, setRadiusKm] = useState("2");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [suggesting, setSuggesting] = useState(false);

  async function suggestNeighborhood() {
    if (points.length < 3) {
      setError("Desenhe a área no mapa primeiro.");
      return;
    }
    setSuggesting(true);
    setError("");
    const polygon = turf.polygon([[...points.map((p) => [p.lng, p.lat] as [number, number]), [points[0].lng, points[0].lat]]]);
    const centroid = turf.centroid(polygon);
    const [lng, lat] = centroid.geometry.coordinates;

    const res = await fetch("/api/admin/delivery-zones/suggest-neighborhood", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lat, lng }),
    });
    const data = await res.json();
    setSuggesting(false);

    if (!data.neighborhood) {
      setError("Não consegui identificar o bairro dessa área — digite manualmente.");
      return;
    }
    setNeighborhoodsInput((cur) => {
      const list = cur.split(",").map((n) => n.trim()).filter(Boolean);
      if (list.includes(data.neighborhood)) return cur;
      return [...list, data.neighborhood].join(", ");
    });
  }
  const inputClass = "w-full px-3.5 py-2.5 rounded-xl border border-surface-border bg-white text-sm";

  function generateCircle() {
    const km = Number(radiusKm);
    if (!km || km <= 0) return;
    const circle = turf.circle([center.lng, center.lat], km, { units: "kilometers", steps: 32 });
    const ring = circle.geometry.coordinates[0];
    setPoints(ring.slice(0, -1).map(([lng, lat]) => ({ lat, lng })));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!name.trim() || !fee) {
      setError("Preencha nome e taxa.");
      return;
    }
    if (points.length < 3) {
      setError("Desenhe a área no mapa (mínimo 3 pontos) ou gere um círculo por km.");
      return;
    }
    setSaving(true);

    const payload = {
      name,
      feeCents: Math.round(Number(fee) * 100),
      minOrderCents: minOrder ? Math.round(Number(minOrder) * 100) : undefined,
      estimatedMinutes: estimatedMinutes ? Number(estimatedMinutes) : undefined,
      neighborhoods: neighborhoodsInput
        .split(",")
        .map((n) => n.trim())
        .filter(Boolean),
      geoJson: latLngsToPolygon(points),
    };

    const res = isEditing
      ? await fetch(`/api/admin/delivery-zones/${initial!.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        })
      : await fetch("/api/admin/delivery-zones", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

    setSaving(false);
    if (!res.ok) {
      setError("Não foi possível salvar.");
      return;
    }
    onSaved();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <form onSubmit={handleSubmit} className="w-full max-w-lg bg-white rounded-2xl max-h-[90vh] flex flex-col shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-surface-border">
          <h2 className="text-lg font-bold text-gray-900">{isEditing ? "Editar Área" : "Nova Área"}</h2>
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-700" aria-label="Fechar">
            <X size={18} />
          </button>
        </div>

        <div className="overflow-y-auto px-5 py-4 space-y-4">
          <div>
            <Label>Nome da área</Label>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="ex: Centro, Zona Norte..." className={inputClass} />
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div>
              <Label>Taxa (R$)</Label>
              <input value={fee} onChange={(e) => setFee(e.target.value)} type="number" step="0.01" min="0" className={inputClass} />
            </div>
            <div>
              <Label>Pedido mín. (R$)</Label>
              <input value={minOrder} onChange={(e) => setMinOrder(e.target.value)} type="number" step="0.01" min="0" placeholder="opcional" className={inputClass} />
            </div>
            <div>
              <Label>Tempo (min)</Label>
              <input value={estimatedMinutes} onChange={(e) => setEstimatedMinutes(e.target.value)} type="number" min="1" placeholder="opcional" className={inputClass} />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <Label>Bairros cobertos</Label>
              <button
                type="button"
                onClick={suggestNeighborhood}
                disabled={suggesting || points.length < 3}
                className="text-xs font-semibold text-brand disabled:opacity-40"
              >
                {suggesting ? "Buscando..." : "Sugerir a partir do desenho"}
              </button>
            </div>
            <p className="text-xs text-gray-400 mb-1.5">Usado pra achar a taxa quando o cliente digita o bairro.</p>
            <input value={neighborhoodsInput} onChange={(e) => setNeighborhoodsInput(e.target.value)} placeholder="ex: Centro, Vila Nova" className={inputClass} />
          </div>
          <div>
            <Label>Desenhar no mapa</Label>
            <p className="text-xs text-gray-400 mb-2">Clique no mapa pra marcar os cantos da área, ou gera um círculo pronto pra ajustar:</p>
            <div className="flex items-center gap-2 mb-3">
              <input value={radiusKm} onChange={(e) => setRadiusKm(e.target.value)} type="number" step="0.5" min="0.5" className={`w-24 ${inputClass}`} />
              <span className="text-xs text-gray-500">km de raio</span>
              <button type="button" onClick={generateCircle} className="text-xs px-3 py-1.5 rounded-full border border-surface-border font-semibold text-gray-600">
                Gerar círculo
              </button>
            </div>
            <ZoneMapEditor center={center} initialPolygon={points} onPolygonChange={setPoints} />
          </div>

          {error && <p className="text-red-600 text-xs">{error}</p>}
        </div>

        <div className="px-5 py-4 border-t border-surface-border">
          <Button type="submit" isLoading={saving} className="w-full">
            {isEditing ? "Salvar Alterações" : "Criar Área"}
          </Button>
        </div>
      </form>
    </div>
  );
}