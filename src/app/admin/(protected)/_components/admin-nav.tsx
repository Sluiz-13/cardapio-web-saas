"use client";

import { signOut } from "next-auth/react";
import {
  ClipboardList,
  LayoutDashboard,
  Package,
  Tags,
  LayoutGrid,
  Receipt,
  Wallet,
  FileBarChart,
  CreditCard,
  UserCircle,
  Settings,
  Ticket,
  Truck,
} from "lucide-react";
import { Sidebar, type SidebarLink } from "@/components/ui/Sidebar";

const LINKS: SidebarLink[] = [
  { href: "/admin", label: "Pedidos", icon: ClipboardList },
  { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/produtos", label: "Produtos", icon: Package },
  { href: "/admin/categorias", label: "Categorias", icon: Tags },
  { href: "/admin/mesas", label: "Mesas", icon: LayoutGrid },
  { href: "/admin/comandas", label: "Comandas", icon: Receipt },
  { href: "/admin/financeiro", label: "Financeiro", icon: Wallet },
  { href: "/admin/relatorios", label: "Relatórios", icon: FileBarChart },
  { href: "/admin/planos", label: "Plano", icon: CreditCard },
  { href: "/admin/conta", label: "Conta", icon: UserCircle },
  { href: "/admin/configuracoes", label: "Configurações", icon: Settings },
  { href: "/admin/cupons", label: "Cupons", icon: Ticket },
  { href: "/admin/entregas", label: "Entregas", icon: Truck },
];

export default function AdminNav({
  restaurantName,
  userName,
  logoUrl,
}: {
  restaurantName: string;
  userName: string;
  logoUrl?: string | null;
}) {
  return (
    <Sidebar
      brand={restaurantName}
      links={LINKS}
      userName={userName}
      onSignOut={() => signOut({ callbackUrl: "/admin/login" })}
      tone="light"
      logoUrl={logoUrl}
    />
  );
}