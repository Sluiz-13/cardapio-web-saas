"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { Download } from "lucide-react";

export default function TableQrCode({ url, label }: { url: string; label: string }) {
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);

  useEffect(() => {
    QRCode.toDataURL(url, { width: 320, margin: 1 })
      .then(setQrDataUrl)
      .catch(() => setQrDataUrl(null));
  }, [url]);

  return (
    <div className="flex flex-col items-center">
      {qrDataUrl ? (
        <img src={qrDataUrl} alt={`QR Code ${label}`} className="w-48 h-48 rounded-lg border border-surface-border" />
      ) : (
        <div className="w-48 h-48 rounded-lg bg-gray-100 animate-pulse" />
      )}
      {qrDataUrl && (
        <a
          href={qrDataUrl}
          download={`qrcode-${label.toLowerCase().replace(/\s+/g, "-")}.png`}
          className="mt-3 flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold border border-surface-border text-gray-700 hover:bg-gray-50 transition-colors duration-[180ms]"
        >
          <Download size={13} /> Baixar pra imprimir
        </a>
      )}
    </div>
  );
}