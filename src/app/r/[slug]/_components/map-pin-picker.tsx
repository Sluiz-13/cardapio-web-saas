"use client";

import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import { Crosshair } from "lucide-react";

type LatLng = { lat: number; lng: number };

export default function MapPinPicker({
  center,
  onPointChange,
}: {
  center: LatLng;
  onPointChange: (point: LatLng) => void;
}) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const [locating, setLocating] = useState(false);
  const [point, setPoint] = useState<LatLng>(center);

  useEffect(() => {
    if (!mapRef.current || mapInstance.current) return;

    const map = L.map(mapRef.current).setView([center.lat, center.lng], 15);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "&copy; OpenStreetMap contributors",
      maxZoom: 19,
    }).addTo(map);

    const marker = L.marker([center.lat, center.lng], { draggable: true }).addTo(map);
    marker.on("dragend", () => {
      const pos = marker.getLatLng();
      setPoint({ lat: pos.lat, lng: pos.lng });
    });

    map.on("click", (e: L.LeafletMouseEvent) => {
      marker.setLatLng(e.latlng);
      setPoint({ lat: e.latlng.lat, lng: e.latlng.lng });
    });

    markerRef.current = marker;
    mapInstance.current = map;

    return () => {
      map.remove();
      mapInstance.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    onPointChange(point);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [point]);

  function useMyLocation() {
    if (!navigator.geolocation) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const newPoint = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setPoint(newPoint);
        markerRef.current?.setLatLng([newPoint.lat, newPoint.lng]);
        mapInstance.current?.setView([newPoint.lat, newPoint.lng], 16);
        setLocating(false);
      },
      () => setLocating(false),
      { enableHighAccuracy: true, timeout: 8000 }
    );
  }

  return (
    <div>
      <div ref={mapRef} style={{ height: 220, borderRadius: 12, overflow: "hidden" }} />
      <button
        type="button"
        onClick={useMyLocation}
        disabled={locating}
        className="flex items-center justify-center gap-1.5 w-full mt-2 py-2 rounded-full text-xs font-semibold border border-gray-200 text-gray-600 disabled:opacity-50"
      >
        <Crosshair size={13} /> {locating ? "Localizando..." : "Usar minha localização"}
      </button>
      <p className="text-[11px] text-gray-400 mt-1.5 text-center">Arraste o pino ou toque no mapa pra ajustar</p>
    </div>
  );
}