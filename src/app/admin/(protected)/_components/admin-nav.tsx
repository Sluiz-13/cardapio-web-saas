"use client";

import { useEffect, useState } from "react";
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
  Users,
  Bike,
  Plus,
  Wallet as WalletIcon,
  CalendarCheck,
  History,
  Package2,
  Users as UsersIcon,
  CalendarClock,
} from "lucide-react";
import { Sidebar, type SidebarLink } from "@/components/ui/Sidebar";
import { GROUP_ROLES, type AdminGroup, type AdminRole } from "@/lib/admin-permissions";

const GROUP_KEY: Record<string, AdminGroup> = {
  "Operação": "operacao",
  "Cadastro": "cadastro",
  "Financeiro": "financeiro",
  "Administração": "administracao",
};


const LINKS: SidebarLink[] = [
  // Operação
  { href: "/admin", label: "Pedidos", icon: ClipboardList, group: "Operação" },
  { href: "/garcom/mesa/balcao?from=admin", label: "Pedido Manual", icon: Plus, group: "Operação" },
  { href: "/admin/mesas", label: "Mesas", icon: LayoutGrid, group: "Operação" },
  { href: "/admin/comandas", label: "Comandas", icon: Receipt, group: "Operação" },
  { href: "/admin/entregas", label: "Entregas", icon: Truck, group: "Operação" },
  { href: "/admin/entregadores", label: "Entregadores", icon: Bike, group: "Operação" },
  { href: "/admin/reservas", label: "Reservas", icon: CalendarClock, group: "Operação" },

  // Cadastro
  { href: "/admin/produtos", label: "Produtos", icon: Package, group: "Cadastro" },
  { href: "/admin/categorias", label: "Categorias", icon: Tags, group: "Cadastro" },
  { href: "/admin/cupons", label: "Cupons", icon: Ticket, group: "Cadastro" },
  { href: "/admin/insumos", label: "Insumos", icon: Package2, group: "Cadastro" },
  { href: "/admin/clientes", label: "Clientes", icon: UsersIcon, group: "Cadastro" },

  // Financeiro
  { href: "/admin/caixa", label: "Caixa", icon: WalletIcon, group: "Financeiro" },
  { href: "/admin/financeiro", label: "Financeiro", icon: Wallet, group: "Financeiro" },
  { href: "/admin/fechamento", label: "Fechamento Diário", icon: CalendarCheck, group: "Financeiro" },
  { href: "/admin/historico", label: "Histórico", icon: History, group: "Financeiro" },
  { href: "/admin/relatorios", label: "Relatórios", icon: FileBarChart, group: "Financeiro" },
  { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard, group: "Financeiro" },

  // Administração
  { href: "/admin/equipe", label: "Equipe", icon: Users, group: "Administração" },
  { href: "/admin/conta", label: "Conta", icon: UserCircle, group: "Administração" },
  { href: "/admin/configuracoes", label: "Configurações", icon: Settings, group: "Administração" },
  { href: "/admin/planos", label: "Plano", icon: CreditCard, group: "Administração" },
];

export default function AdminNav({
  restaurantName,
  userName,
  logoUrl,
  role,
}: {
  restaurantName: string;
  userName: string;
  logoUrl?: string | null;
  role: AdminRole;
}) {
  const [lowStockCount, setLowStockCount] = useState(0);

  useEffect(() => {
    fetch("/api/admin/insumos")
      .then((r) => r.json())
      .then((insumos: { currentStock: number; minStock: number }[]) => {
        setLowStockCount(insumos.filter((i) => i.currentStock <= i.minStock).length);
      })
      .catch(() => {});
  }, []);

  const links = LINKS
    // Conta não tem grupo aqui (fica sempre visível pra qualquer papel,
    // é a própria conta da pessoa) — só filtra quem tem grupo definido.
    .filter((link) => !link.group || role === "OWNER" || GROUP_ROLES[GROUP_KEY[link.group]]?.includes(role))
    .map((link) => (link.href === "/admin/insumos" ? { ...link, badge: lowStockCount } : link));

  return (
    <Sidebar
      brand={restaurantName}
      links={links}
      userName={userName}
      onSignOut={() => signOut({ callbackUrl: "/admin/login" })}
      tone="light"
      logoUrl={logoUrl}
    />
  );
}