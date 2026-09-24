"use client";

import { useEffect, useRef, useState } from "react";
import L from "leaflet";

type LatLng = { lat: number; lng: number };

export default function ZoneMapEditor({
  center,
  initialPolygon,
  onPolygonChange,
}: {
  center: LatLng;
  initialPolygon?: LatLng[];
  onPolygonChange: (points: LatLng[]) => void;
}) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<L.Map | null>(null);
  const polygonLayer = useRef<L.Polygon | null>(null);
  const markersLayer = useRef<L.LayerGroup | null>(null);
  const [points, setPoints] = useState<LatLng[]>(initialPolygon ?? []);

  useEffect(() => {
    if (!mapRef.current || mapInstance.current) return;

    const map = L.map(mapRef.current).setView([center.lat, center.lng], 14);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "&copy; OpenStreetMap contributors",
      maxZoom: 19,
    }).addTo(map);

    L.marker([center.lat, center.lng]).addTo(map).bindPopup("Seu restaurante");
    markersLayer.current = L.layerGroup().addTo(map);
    mapInstance.current = map;

    map.on("click", (e: L.LeafletMouseEvent) => {
      setPoints((cur) => [...cur, { lat: e.latlng.lat, lng: e.latlng.lng }]);
    });

    return () => {
      map.remove();
      mapInstance.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!mapInstance.current || !markersLayer.current) return;
    markersLayer.current.clearLayers();

    points.forEach((p, i) => {
      L.circleMarker([p.lat, p.lng], { radius: 5, color: "#C1440E" })
        .addTo(markersLayer.current!)
        .bindTooltip(String(i + 1));
    });

    if (polygonLayer.current) {
      mapInstance.current.removeLayer(polygonLayer.current);
      polygonLayer.current = null;
    }
    if (points.length >= 3) {
      polygonLayer.current = L.polygon(
        points.map((p) => [p.lat, p.lng] as [number, number]),
        { color: "#C1440E", fillOpacity: 0.2 }
      ).addTo(mapInstance.current);
    }

    onPolygonChange(points);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [points]);

  // Permite recentralizar quando um círculo por km é gerado por fora.
  useEffect(() => {
    if (initialPolygon && initialPolygon.length > 0) setPoints(initialPolygon);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialPolygon]);

  return (
    <div>
      <div ref={mapRef} style={{ height: 340, borderRadius: 16, overflow: "hidden" }} />
      <div className="flex flex-wrap items-center gap-2 mt-2">
        <button
          type="button"
          onClick={() => setPoints((cur) => cur.slice(0, -1))}
          disabled={points.length === 0}
          className="text-xs px-3 py-1.5 rounded-full border border-gray-200 disabled:opacity-40"
        >
          Desfazer último ponto
        </button>
        <button
          type="button"
          onClick={() => setPoints([])}
          disabled={points.length === 0}
          className="text-xs px-3 py-1.5 rounded-full border border-gray-200 disabled:opacity-40"
        >
          Limpar
        </button>
        <span className="text-xs text-gray-400">
          {points.length < 3
            ? "Clique no mapa pra marcar os cantos da área (mín. 3 pontos)"
            : `${points.length} pontos marcados`}
        </span>
      </div>
    </div>
  );
}