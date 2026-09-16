export type AdminRole = "OWNER" | "GERENTE" | "CAIXA" | "STAFF";
export type AdminGroup = "operacao" | "cadastro" | "financeiro" | "administracao";

export const GROUP_ROLES: Record<AdminGroup, AdminRole[]> = {
  operacao: ["OWNER", "GERENTE", "CAIXA"],
  cadastro: ["OWNER", "GERENTE"],
  financeiro: ["OWNER", "GERENTE"],
  administracao: ["OWNER"],
};


const ROUTE_GROUPS: { prefix: string; group: AdminGroup }[] = [
  // Cadastro
  { prefix: "/admin/produtos", group: "cadastro" },
  { prefix: "/api/admin/products", group: "cadastro" },
  { prefix: "/admin/categorias", group: "cadastro" },
  { prefix: "/api/admin/categories", group: "cadastro" },
  { prefix: "/admin/cupons", group: "cadastro" },
  { prefix: "/api/admin/coupons", group: "cadastro" },
  { prefix: "/admin/insumos", group: "cadastro" },
  { prefix: "/api/admin/insumos", group: "cadastro" },
  { prefix: "/admin/clientes", group: "cadastro" },
  { prefix: "/api/admin/customers", group: "cadastro" },

  // Financeiro
  { prefix: "/admin/caixa", group: "financeiro" },
  { prefix: "/api/admin/caixa", group: "financeiro" },
  { prefix: "/admin/financeiro", group: "financeiro" },
  { prefix: "/api/admin/financeiro", group: "financeiro" },
  { prefix: "/admin/fechamento", group: "financeiro" },
  { prefix: "/admin/historico", group: "financeiro" },
  { prefix: "/api/admin/historico", group: "financeiro" },
  { prefix: "/admin/relatorios", group: "financeiro" },
  { prefix: "/api/admin/reports", group: "financeiro" },

  // Administração
  { prefix: "/admin/equipe", group: "administracao" },
  { prefix: "/api/admin/staff", group: "administracao" },
  { prefix: "/admin/configuracoes", group: "administracao" },
  { prefix: "/api/admin/settings", group: "administracao" },
  { prefix: "/api/admin/logo", group: "administracao" },
  { prefix: "/admin/planos", group: "administracao" },
  { prefix: "/api/admin/plan", group: "administracao" },

  // Operação 
  { prefix: "/admin/pedidos", group: "operacao" },
  { prefix: "/admin/imprimir-comanda", group: "operacao" },
  { prefix: "/admin", group: "operacao" },
  { prefix: "/api/admin", group: "operacao" },
];

// Toda conta autenticada mexe na própria conta, independente do papel.
const ALWAYS_ALLOWED_PREFIXES = ["/admin/conta", "/api/admin/account"];

export function isAdminRouteAllowed(role: string, pathname: string): boolean {
  if (role === "OWNER") return true;
  if (role === "STAFF") return false; // STAFF nunca acessa /admin — vai pro /garcom
  if (ALWAYS_ALLOWED_PREFIXES.some((p) => pathname.startsWith(p))) return true;

  const match = ROUTE_GROUPS.find((r) => pathname.startsWith(r.prefix));
  if (!match) return true;
  return GROUP_ROLES[match.group].includes(role as AdminRole);
}