"use client";

import { useEffect } from "react";

// Client component minúsculo só pra disparar window.print() assim que a
// página carrega — precisa ser client porque window só existe no navegador.
export default function PrintTrigger() {
  useEffect(() => {
    window.print();
  }, []);

  return null;
}