"use client";

import { Store, PlusCircle, Ticket, Settings } from "lucide-react";
import { Sidebar, type SidebarLink } from "@/components/ui/Sidebar";
import { platformSignOut } from "@/lib/platform-auth-client";

const LINKS: SidebarLink[] = [
  { href: "/platform", label: "Restaurantes", icon: Store },
  { href: "/platform/restaurantes/novo", label: "Novo restaurante", icon: PlusCircle },
  { href: "/platform/cupons", label: "Cupons", icon: Ticket },
  { href: "/platform/configuracoes", label: "Configurações", icon: Settings },
];

export default function PlatformNav({ userName }: { userName: string }) {
  return (
    <Sidebar
      brand="cardapio-saas"
      links={LINKS}
      userName={userName}
      onSignOut={() => platformSignOut()}
      tone="dark"
      brandDot
    />
  );
}