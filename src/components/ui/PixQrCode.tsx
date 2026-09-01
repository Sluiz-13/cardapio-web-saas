"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { Copy, Check } from "lucide-react";

export default function PixQrCode({ payload }: { payload: string }) {
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    QRCode.toDataURL(payload, { width: 240, margin: 1 })
      .then(setQrDataUrl)
      .catch(() => setQrDataUrl(null));
  }, [payload]);

  async function copyCode() {
    try {
      await navigator.clipboard.writeText(payload);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard pode falhar em contexto sem HTTPS — usuário ainda pode
      // selecionar o texto manualmente se precisar (fica pra melhoria futura).
    }
  }

  return (
    <div className="flex flex-col items-center">
      {qrDataUrl ? (
        <img src={qrDataUrl} alt="QR Code Pix" className="w-48 h-48 rounded-lg border border-gray-100" />
      ) : (
        <div className="w-48 h-48 rounded-lg bg-gray-100 animate-pulse" />
      )}
      <button
        type="button"
        onClick={copyCode}
        className="mt-3 flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold border border-gray-200 text-gray-700 active:scale-95 transition-transform"
      >
        {copied ? <Check size={13} className="text-emerald-600" /> : <Copy size={13} />}
        {copied ? "Código copiado!" : "Copiar código Pix"}
      </button>
    </div>
  );
}