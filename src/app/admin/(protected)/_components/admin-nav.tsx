"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";

const LINKS = [
  { href: "/admin", label: "Pedidos" },
  { href: "/admin/produtos", label: "Produtos" },
  { href: "/admin/categorias", label: "Categorias" },
  { href: "/admin/financeiro", label: "Financeiro" },
  { href: "/admin/conta", label: "Conta" },
  { href: "/admin/configuracoes", label: "Configurações" },
];

export default function AdminNav({ restaurantName, userName }: { restaurantName: string; userName: string }) {
  const pathname = usePathname();

  return (
    <header className="flex items-center justify-between px-6 py-3.5 bg-white border-b border-gray-100">
      <div>
        <p className="text-[11px] uppercase tracking-wide text-gray-400 font-medium">{restaurantName}</p>
        <nav className="flex gap-5 mt-0.5">
          {LINKS.map((link) => {
            const active = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm font-semibold pb-0.5 transition-colors"
                style={{
                  color: active ? "#C1440E" : "#6B7280",
                  borderBottom: active ? "2px solid #C1440E" : "2px solid transparent",
                }}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>
      </div>
      <div className="flex items-center gap-3">
        <span className="text-sm text-gray-500">{userName}</span>
        <button
          onClick={() => signOut({ callbackUrl: "/admin/login" })}
          className="text-xs font-semibold px-3.5 py-1.5 rounded-full border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
        >
          Sair
        </button>
      </div>
    </header>
  );
}