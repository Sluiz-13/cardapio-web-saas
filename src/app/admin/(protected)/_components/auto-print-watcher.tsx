"use client";

import { useEffect, useRef } from "react";
import { playNotificationSound } from "@/lib/notification-sound";
import { isMenuairApp, printViaAgent, printViaBluetoothAgent } from "@/lib/print-agent";
import { printViaQzTray } from "@/lib/qz-print";

const POLL_INTERVAL_MS = 2000;

// Fica montado no layout do admin — ou seja, roda em QUALQUER tela (Caixa,
// Comandas, Financeiro, etc.), não só na tela de Pedidos. É o único lugar
// que dispara som + impressão automática; o orders-board.tsx cuida só da
// lista visual quando essa tela específica está aberta.
export default function AutoPrintWatcher({
  printMethod,
  printerIp,
  printerPort,
  printerBluetoothAddress,
  printerQzName,
}: {
  printMethod: string;
  printerIp?: string | null;
  printerPort?: number | null;
  printerBluetoothAddress?: string | null;
  printerQzName?: string | null;
}) {
  const knownIds = useRef<Set<string> | null>(null);

  useEffect(() => {
    async function triggerAutoPrint(orderId: string) {
      try {
        const res = await fetch(`/api/admin/orders/${orderId}/print`, { method: "POST" });
        if (!res.ok) return;
        const { full, kitchen } = await res.json();

        if (printMethod === "AGENT" && printerIp && (await isMenuairApp())) {
          await printViaAgent(full.hex, printerIp, printerPort ?? 9100);
          await printViaAgent(kitchen.hex, printerIp, printerPort ?? 9100);
          return;
        }
        if (printMethod === "AGENT_BLUETOOTH" && printerBluetoothAddress && (await isMenuairApp())) {
          await printViaBluetoothAgent(full.hex, printerBluetoothAddress);
          await printViaBluetoothAgent(kitchen.hex, printerBluetoothAddress);
          return;
        }
        if (printMethod === "QZ_TRAY" && printerQzName) {
          await printViaQzTray(full.hex, printerQzName);
          await printViaQzTray(kitchen.hex, printerQzName);
          return;
        }
        if (printMethod === "RAWBT") {
          window.location.href = full.rawbtUrl;
          setTimeout(() => {
            window.location.href = kitchen.rawbtUrl;
          }, 1500);
        }
      } catch {
        // Falha silenciosa — impressão manual continua disponível na tela de Pedidos.
      }
    }

    async function poll() {
      try {
        const res = await fetch("/api/admin/orders");
        if (!res.ok) return;
        const fetched: { id: string }[] = await res.json();

        if (knownIds.current === null) {
          // Primeira leitura: só grava o estado atual, não imprime pedidos que já existiam.
          knownIds.current = new Set(fetched.map((o) => o.id));
          return;
        }

        const newOnes = fetched.filter((o) => !knownIds.current!.has(o.id));
        knownIds.current = new Set(fetched.map((o) => o.id));

        if (newOnes.length === 0) return;

        playNotificationSound();

        if (printMethod === "RAWBT" || printMethod === "AGENT" || printMethod === "AGENT_BLUETOOTH" || printMethod === "QZ_TRAY") {
          newOnes.forEach((o, i) => {
            setTimeout(() => triggerAutoPrint(o.id), i * 1200);
          });
        }
      } catch {
        // Falha de rede no polling não deve quebrar nada — só tenta de novo no próximo ciclo.
      }
    }

    poll();
    const interval = setInterval(poll, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [printMethod, printerIp, printerPort, printerBluetoothAddress, printerQzName]);

  return null;
}