"use client";

import { useCallback, useSyncExternalStore } from "react";
import { obtenerPreferencias, suscribirsePreferencias } from "./preferencias";
import type { Moneda } from "@/lib/format";

/** Devuelve la moneda activa y hace que el componente se re-renderice solo si cambia. */
export function useMoneda(): Moneda {
  const subscribe = useCallback((listener: () => void) => suscribirsePreferencias(listener), []);
  const getSnapshot = useCallback(() => obtenerPreferencias().moneda, []);
  return useSyncExternalStore(subscribe, getSnapshot, () => "ARS");
}
