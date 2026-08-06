"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import clsx from "clsx";

const LINKS = [
  { href: "/admin", label: "Pedidos" },
  { href: "/admin/dashboard", label: "Dashboard" },
  { href: "/admin/produtos", label: "Produtos" },
  { href: "/admin/categorias", label: "Categorias" },
  { href: "/admin/cupons", label: "Cupons" },
  { href: "/admin/entregas", label: "Entregas" },
  { href: "/admin/relatorios", label: "Relatórios" },
  { href: "/admin/financeiro", label: "Financeiro" },
  { href: "/admin/planos", label: "Meu Plano" },
  { href: "/admin/configuracoes", label: "Configurações" },
  { href: "/admin/conta", label: "Conta" },
  
  
];

export default function AdminNav({ restaurantName, userName }: { restaurantName: string; userName: string }) {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 flex flex-col gap-3 px-4 py-3.5 bg-white/90 backdrop-blur border-b border-surface-border sm:flex-row sm:items-center sm:justify-between sm:px-6">
      <div className="min-w-0 w-full sm:w-auto">
        <p className="text-[11px] uppercase tracking-wide text-gray-400 font-medium mb-1.5">{restaurantName}</p>
        <nav className="flex gap-1 overflow-x-auto whitespace-nowrap pb-1 -mb-1 scrollbar-none">
          {LINKS.map((link) => {
            const active = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={clsx(
                  "px-3 py-1.5 rounded-full text-sm font-medium transition-colors duration-[180ms]",
                  active ? "bg-brand-light text-brand" : "text-gray-500 hover:bg-gray-50 hover:text-gray-800"
                )}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>
      </div>
      <div className="flex items-center justify-between gap-3 sm:justify-start">
        <span className="text-sm text-gray-500 truncate">{userName}</span>
        <button
          onClick={() => signOut({ callbackUrl: "/admin/login" })}
          className="text-xs font-semibold px-3.5 py-1.5 rounded-full border border-surface-border text-gray-600 hover:bg-gray-50 transition-colors duration-[180ms]"
        >
          Sair
        </button>
      </div>
    </header>
  );
}