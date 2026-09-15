"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, LogOut, ChevronDown, type LucideIcon } from "lucide-react";
import clsx from "clsx";

export type SidebarLink = {
  href: string;
  label: string;
  icon: LucideIcon;
  group?: string; // opcional — se presente, agrupa visualmente com um rótulo antes do primeiro item do grupo
  badge?: number; // opcional — número num círculo vermelho ao lado do link (ex: alertas)
};
interface SidebarProps {
  brand: string;
  links: SidebarLink[];
  userName: string;
  onSignOut: () => void;
  tone?: "light" | "dark";
  brandDot?: boolean;
  logoUrl?: string | null;
}

export function Sidebar({ brand, links, userName, onSignOut, tone = "light", brandDot, logoUrl }: SidebarProps) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const dark = tone === "dark";
  const activeGroup = links.find((l) => l.href === pathname)?.group;
  const [openGroups, setOpenGroups] = useState<Set<string>>(() => new Set(activeGroup ? [activeGroup] : []));

  function toggleGroup(group: string) {
    setOpenGroups((prev) => {
      const next = new Set(prev);
      if (next.has(group)) next.delete(group);
      else next.add(group);
      return next;
    });
  }

  const content = (
    <div className={clsx("flex h-full w-64 flex-col border-r", dark ? "bg-ink border-black/20" : "bg-white border-surface-border")}>
      <div className={clsx("px-5 py-4 flex items-center gap-2.5 border-b", dark ? "border-white/10" : "border-surface-border")}>
        {logoUrl ? (
          <img src={logoUrl} alt="" className="w-8 h-8 rounded-lg object-cover shrink-0 border border-surface-border" />
        ) : (
          brandDot && <span className="w-2 h-2 rounded-full bg-brand shrink-0" />
        )}
        <p className={clsx("truncate font-semibold", logoUrl ? "text-sm text-gray-800" : "text-[11px] uppercase tracking-wide text-gray-400")}>
          {brand}
        </p>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5">
        {links.map((link, i) => {
          const active = pathname === link.href;
          const Icon = link.icon;
          const showGroupLabel = link.group && link.group !== links[i - 1]?.group;
          const groupIsOpen = !link.group || openGroups.has(link.group);

          return (
            <div key={link.href}>
              {showGroupLabel && (
                <button
                  onClick={() => toggleGroup(link.group!)}
                  className={clsx(
                    "w-full flex items-center justify-between px-3 py-1.5 mt-2 first:mt-0 text-xs font-extrabold uppercase tracking-wider transition-colors duration-[180ms]",
                    dark ? "text-gray-500 hover:text-gray-300" : "text-gray-500 hover:text-gray-800"
                  )}
                >
                  {link.group}
                  <ChevronDown size={12} className={clsx("transition-transform duration-[180ms]", groupIsOpen ? "rotate-180" : "")} />
                </button>
              )}
              {groupIsOpen && (
                <Link
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
                  <span className="flex-1">{link.label}</span>
                  {!!link.badge && (
                    <span className="min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
                      {link.badge}
                    </span>
                  )}
                </Link>
              )}
            </div>
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