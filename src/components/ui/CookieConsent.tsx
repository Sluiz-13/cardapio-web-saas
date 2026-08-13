"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

const STORAGE_KEY = "menuair-cookie-consent";

export function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Só decide depois de montar no navegador — localStorage não existe
    // no servidor, então isso precisa rodar no cliente.
    if (!localStorage.getItem(STORAGE_KEY)) setVisible(true);
  }, []);

  function accept() {
    localStorage.setItem(STORAGE_KEY, "accepted");
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-ink text-white px-4 py-4 sm:px-6 shadow-[0_-4px_20px_rgba(0,0,0,0.15)]">
      <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center gap-3 sm:gap-4">
        <p className="text-xs sm:text-sm text-white/80 flex-1 leading-relaxed">
          Usamos cookies essenciais para o funcionamento do site. Ao continuar navegando, você concorda
          com nossa{" "}
          <Link href="/privacidade" className="underline hover:text-white">
            Política de Privacidade
          </Link>
          .
        </p>
        <button
          onClick={accept}
          className="shrink-0 px-5 py-2 rounded-full bg-brand text-white text-sm font-semibold hover:bg-brand-dark active:scale-[0.98] transition-all duration-[180ms]"
        >
          Aceitar
        </button>
      </div>
    </div>
  );
}