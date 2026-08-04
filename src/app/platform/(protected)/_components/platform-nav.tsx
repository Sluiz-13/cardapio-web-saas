"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";

const LINKS = [
  { href: "/platform", label: "Restaurantes" },
  { href: "/platform/restaurantes/novo", label: "Novo restaurante" },
];

export default function PlatformNav({ userName }: { userName: string }) {
  const pathname = usePathname();

  return (
    <header className="flex flex-col gap-3 px-4 py-3.5 bg-ink border-b border-gray-800 sm:flex-row sm:items-center sm:justify-between sm:px-6">
      <div className="min-w-0 w-full sm:w-auto">
        <p className="text-[11px] uppercase tracking-wide text-gray-400 font-medium">cardapio-saas · plataforma</p>
        <nav className="flex gap-5 mt-0.5 overflow-x-auto whitespace-nowrap pb-1 -mb-1 scrollbar-none">
          {LINKS.map((link) => {
            const active = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm font-semibold pb-0.5 transition-colors"
                style={{
                  color: active ? "#FFFFFF" : "#9CA3AF",
                  borderBottom: active ? "2px solid #FFFFFF" : "2px solid transparent",
                }}
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
          onClick={() => signOut({ callbackUrl: "/platform/login" })}
          className="text-xs font-semibold px-3.5 py-1.5 rounded-full border border-gray-600 text-gray-300 hover:bg-gray-800 transition-colors"
        >
          Sair
        </button>
      </div>
    </header>
  );
}