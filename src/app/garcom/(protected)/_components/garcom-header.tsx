"use client";

import { signOut } from "next-auth/react";
import { LogOut, UtensilsCrossed } from "lucide-react";

export default function GarcomHeader({
  restaurantName,
  userName,
}: {
  restaurantName: string;
  userName: string;
}) {
  return (
    <header className="flex items-center justify-between px-4 py-3 bg-white border-b border-surface-border sticky top-0 z-20">
      <div className="flex items-center gap-2 min-w-0">
        <div className="w-8 h-8 rounded-lg bg-brand-light flex items-center justify-center shrink-0">
          <UtensilsCrossed size={14} className="text-brand" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-bold text-gray-900 truncate">{restaurantName}</p>
          <p className="text-[11px] text-gray-400 truncate">{userName}</p>
        </div>
      </div>
      <button
        onClick={() => signOut({ callbackUrl: "/garcom/login" })}
        className="flex items-center justify-center w-9 h-9 rounded-full text-gray-400 hover:bg-red-50 hover:text-red-500 transition-colors duration-[180ms] shrink-0"
        aria-label="Sair"
      >
        <LogOut size={16} />
      </button>
    </header>
  );
}