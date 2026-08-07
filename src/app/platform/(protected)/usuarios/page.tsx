"use client";

import { useEffect, useState } from "react";
import { Users, Search } from "lucide-react";
import { Table, Thead, Tbody, Tr, Th, Td } from "@/components/ui/Table";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/Skeleton";

type AdminUserRow = {
  id: string;
  name: string;
  email: string;
  role: "OWNER" | "STAFF";
  createdAt: string;
  restaurant: { id: string; name: string; slug: string; active: boolean };
};

export default function PlatformUsuariosPage() {
  const [users, setUsers] = useState<AdminUserRow[] | null>(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetch("/api/platform/users")
      .then((r) => r.json())
      .then(setUsers);
  }, []);

  if (!users) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-6 sm:px-6">
        <Skeleton className="h-8 w-40 mb-6" />
        <Skeleton className="h-56" />
      </div>
    );
  }

  const filtered = users.filter((u) => {
    const term = search.toLowerCase();
    return (
      u.name.toLowerCase().includes(term) ||
      u.email.toLowerCase().includes(term) ||
      u.restaurant.name.toLowerCase().includes(term)
    );
  });

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 sm:px-6">
      <h1 className="text-xl font-bold text-gray-900 mb-1">Usuários</h1>
      <p className="text-sm text-gray-500 mb-4">{users.length} conta(s) de admin em todos os restaurantes.</p>

      <div className="relative mb-4 max-w-xs">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por nome, e-mail ou restaurante"
          className="pl-9 mb-0"
        />
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={<Users size={18} />} title="Nenhum usuário encontrado" />
      ) : (
        <Table>
          <Thead>
            <Tr>
              <Th>Nome</Th>
              <Th>E-mail</Th>
              <Th>Restaurante</Th>
              <Th>Papel</Th>
              <Th>Status</Th>
            </Tr>
          </Thead>
          <Tbody>
            {filtered.map((u) => (
              <Tr key={u.id}>
                <Td className="font-semibold text-gray-800">{u.name}</Td>
                <Td className="font-mono text-xs">{u.email}</Td>
                <Td>{u.restaurant.name}</Td>
                <Td>
                  <Badge tone={u.role === "OWNER" ? "brand" : "neutral"}>{u.role}</Badge>
                </Td>
                <Td>
                  <Badge tone={u.restaurant.active ? "success" : "neutral"}>
                    {u.restaurant.active ? "Ativo" : "Desativado"}
                  </Badge>
                </Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      )}
    </div>
  );
}