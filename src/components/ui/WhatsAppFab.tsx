"use client";

import { MessageCircle } from "lucide-react";
import { landingWhatsAppLink } from "@/lib/landing-whatsapp";

export function WhatsAppFab({ message }: { message: string }) {
  return (
    
    <a href={landingWhatsAppLink(message)}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-5 right-5 z-30 w-14 h-14 rounded-full bg-emerald-500 text-white shadow-lg flex items-center justify-center hover:bg-emerald-600 hover:scale-105 transition-all duration-[180ms]"
      aria-label="Falar com o suporte no WhatsApp"
      title="Precisa de ajuda? Fala com a gente"
    >
      <MessageCircle size={24} />
    </a>
  );
}