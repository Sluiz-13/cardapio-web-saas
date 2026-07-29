"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";

const LINKS = [
  { href: "/admin", label: "Pedidos" },
  { href: "/admin/produtos", label: "Produtos" },
  { href: "/admin/categorias", label: "Categorias" },
  { href: "/admin/conta", label: "Conta" },
  { href: "/admin/financeiro", label: "Financeiro" },
];

export default function AdminNav({ restaurantName, userName }: { restaurantName: string; userName: string }) {
  const pathname = usePathname();

  return (
    <header className="flex items-center justify-between px-6 py-4 bg-paper-dim border-b border-ink/10">
      <div>
        <p className="font-mono text-[11px] uppercase tracking-widest text-ink/50">{restaurantName}</p>
        <nav className="flex gap-4 mt-1">
          {LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="font-display uppercase text-sm"
              style={{ color: pathname === link.href ? "#C1440E" : "#211D1A99" }}
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
      <div className="flex items-center gap-3">
        <span className="text-xs text-ink/60">{userName}</span>
        <button
          onClick={() => signOut({ callbackUrl: "/admin/login" })}
          className="text-xs font-display uppercase px-3 py-1.5 rounded-sm border border-ink/15"
        >
          Sair
        </button>
      </div>
    </header>
  );
}