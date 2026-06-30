"use client";

import { useEffect } from "react";
import { inicializarDatosBase, procesarDebitosPendientes } from "@/lib/db";

/**
 * No renderiza nada visible. Al montar la app (una vez por sesión):
 * 1. precarga billeteras/categorías si todavía no existen.
 * 2. corre el motor de débito automático de suscripciones vencidas.
 * 3. registra el service worker (uso offline después de la primera visita).
 */
export default function DataInitializer() {
  useEffect(() => {
    inicializarDatosBase();

    const resultados = procesarDebitosPendientes();
    if (resultados.length > 0) {
      console.info("[débitos] Suscripciones procesadas al iniciar la app:", resultados);
    }

    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch((error) => {
        console.error("[sw] No se pudo registrar el service worker:", error);
      });
    }

    // Pide al navegador que NO borre el storage de la app bajo presión de espacio.
    // Es "best effort" (no todos los navegadores lo conceden), pero no tiene contras.
    if (navigator.storage?.persist) {
      navigator.storage.persist().then((concedido) => {
        console.info(`[storage] Almacenamiento persistente: ${concedido ? "concedido" : "no concedido"}`);
      });
    }
  }, []);

  return null;
}
