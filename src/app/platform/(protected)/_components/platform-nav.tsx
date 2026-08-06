"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";
import { platformSignOut } from "@/lib/platform-auth-client";

const LINKS = [
  { href: "/platform", label: "Restaurantes" },
  { href: "/platform/restaurantes/novo", label: "Novo restaurante" },
  { href: "/platform/cupons", label: "Cupons" },
  { href: "/platform/configuracoes", label: "Configurações" },
];

export default function PlatformNav({ userName }: { userName: string }) {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 flex flex-col gap-3 px-4 py-3.5 bg-ink border-b border-black/20 sm:flex-row sm:items-center sm:justify-between sm:px-6">
      <div className="min-w-0 w-full sm:w-auto flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-6">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-brand" />
          <p className="text-[11px] uppercase tracking-wide text-gray-400 font-medium">cardapio-saas</p>
        </div>
        <nav className="flex gap-1 overflow-x-auto whitespace-nowrap pb-1 -mb-1 scrollbar-none">
          {LINKS.map((link) => {
            const active = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={clsx(
                  "px-3 py-1.5 rounded-full text-sm font-medium transition-colors duration-[180ms]",
                  active ? "bg-white/10 text-white" : "text-gray-400 hover:text-gray-200 hover:bg-white/5"
                )}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>
      </div>
      <div className="flex items-center justify-between gap-3 sm:justify-start">
        <span className="text-sm text-gray-300 truncate">{userName}</span>
        <button
          onClick={() => platformSignOut()}
          className="text-xs font-semibold px-3.5 py-1.5 rounded-full border border-white/15 text-gray-300 hover:bg-white/5 transition-colors duration-[180ms]"
        >
          Sair
        </button>
      </div>
    </header>
  );
}