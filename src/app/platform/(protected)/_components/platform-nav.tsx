"use client";

import { LayoutDashboard, Store, PlusCircle, Crown, Wallet, Users, Ticket, Settings, UserCircle } from "lucide-react";
import { Sidebar, type SidebarLink } from "@/components/ui/Sidebar";
import { platformSignOut } from "@/lib/platform-auth-client";

const LINKS: SidebarLink[] = [
  { href: "/platform", label: "Dashboard", icon: LayoutDashboard },
  { href: "/platform/restaurantes", label: "Restaurantes", icon: Store },
  { href: "/platform/restaurantes/novo", label: "Novo restaurante", icon: PlusCircle },
  { href: "/platform/planos", label: "Planos", icon: Crown },
  { href: "/platform/financeiro", label: "Financeiro", icon: Wallet },
  { href: "/platform/usuarios", label: "Usuários", icon: Users },
  { href: "/platform/cupons", label: "Cupons", icon: Ticket },
  { href: "/platform/conta", label: "Conta", icon: UserCircle },
  { href: "/platform/configuracoes", label: "Configurações", icon: Settings },
];
export default function PlatformNav({ userName }: { userName: string }) {
  return (
    <Sidebar
      brand="Menuair"
      links={LINKS}
      userName={userName}
      onSignOut={() => platformSignOut()}
      tone="dark"
      brandDot
    />
  );
}