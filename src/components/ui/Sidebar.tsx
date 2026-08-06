"use client";

import { useState, type ComponentType } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, LogOut } from "lucide-react";
import clsx from "clsx";

export type SidebarLink = {
  href: string;
  label: string;
  icon: ComponentType<{ size?: number; className?: string }>;
};

interface SidebarProps {
  brand: string;
  links: SidebarLink[];
  userName: string;
  onSignOut: () => void;
  tone?: "light" | "dark";
  brandDot?: boolean;
}

export function Sidebar({ brand, links, userName, onSignOut, tone = "light", brandDot }: SidebarProps) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const dark = tone === "dark";

  const content = (
    <div className={clsx("flex h-full w-64 flex-col border-r", dark ? "bg-ink border-black/20" : "bg-white border-surface-border")}>
      <div className={clsx("px-5 py-5 flex items-center gap-2 border-b", dark ? "border-white/10" : "border-surface-border")}>
        {brandDot && <span className="w-2 h-2 rounded-full bg-brand shrink-0" />}
        <p className="text-[11px] uppercase tracking-wide font-semibold truncate text-gray-400">{brand}</p>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5">
        {links.map((link) => {
          const active = pathname === link.href;
          const Icon = link.icon;
          return (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMobileOpen(false)}
              className={clsx(
                "flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-medium transition-colors duration-[180ms]",
                dark
                  ? active
                    ? "bg-white/10 text-white"
                    : "text-gray-400 hover:text-gray-200 hover:bg-white/5"
                  : active
                  ? "bg-brand-light text-brand"
                  : "text-gray-500 hover:bg-gray-50 hover:text-gray-800"
              )}
            >
              <Icon size={16} />
              {link.label}
            </Link>
          );
        })}
      </nav>

      <div className={clsx("px-4 py-4 flex items-center justify-between gap-2 border-t", dark ? "border-white/10" : "border-surface-border")}>
        <span className={clsx("text-sm truncate", dark ? "text-gray-300" : "text-gray-600")}>{userName}</span>
        <button
          onClick={onSignOut}
          aria-label="Sair"
          className={clsx(
            "shrink-0 p-2 rounded-full border transition-colors duration-[180ms]",
            dark ? "border-white/15 text-gray-300 hover:bg-white/5" : "border-surface-border text-gray-500 hover:bg-gray-50"
          )}
        >
          <LogOut size={14} />
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop: sidebar fixa */}
      <aside className="hidden sm:block sticky top-0 h-screen shrink-0">{content}</aside>

      {/* Mobile: barra superior + gaveta */}
      <div className={clsx("sm:hidden sticky top-0 z-40 flex items-center justify-between px-4 py-3 border-b", dark ? "bg-ink border-black/20" : "bg-white border-surface-border")}>
        <p className="text-[11px] uppercase tracking-wide font-semibold truncate text-gray-400">{brand}</p>
        <button onClick={() => setMobileOpen(true)} aria-label="Abrir menu" className={clsx("p-2 rounded-full", dark ? "text-gray-300" : "text-gray-600")}>
          <Menu size={20} />
        </button>
      </div>

      {mobileOpen && (
        <div className="sm:hidden fixed inset-0 z-50 flex animate-fade-in">
          <div className="absolute inset-0 bg-black/40" onClick={() => setMobileOpen(false)} />
          <div className="relative h-full">
            {content}
            <button
              onClick={() => setMobileOpen(false)}
              aria-label="Fechar menu"
              className="absolute top-5 right-[-44px] p-2 rounded-full bg-white shadow-sm text-gray-600"
            >
              <X size={18} />
            </button>
          </div>
        </div>
      )}
    </>
  );
}