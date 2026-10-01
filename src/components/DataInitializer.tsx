"use client";

import { useEffect } from "react";
import { inicializarDatosBase, procesarDebitosPendientes, migrarPrestamosZustand } from "@/lib/db";

/**
 * No renderiza nada visible. Al montar la app (una vez por sesión):
 * 1. precarga billeteras/categorías si todavía no existen.
 * 2. corre el motor de débito automático de suscripciones vencidas.
 *    (y lo repite cada vez que la app vuelve a primer plano).
 * 3. registra el service worker (uso offline después de la primera visita).
 */
export default function DataInitializer() {
  useEffect(() => {
    inicializarDatosBase();
    migrarPrestamosZustand();

    const resultados = procesarDebitosPendientes();
    if (resultados.length > 0) {
      console.info("[débitos] Suscripciones procesadas al iniciar la app:", resultados);
    }

    // La app instalada suele quedar abierta en segundo plano durante días sin
    // recargarse: cada vez que vuelve a primer plano se revisan de nuevo los débitos.
    const alVolver = () => {
      if (document.visibilityState === "visible") procesarDebitosPendientes();
    };
    document.addEventListener("visibilitychange", alVolver);

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

    return () => document.removeEventListener("visibilitychange", alVolver);
  }, []);

  return null;
}
