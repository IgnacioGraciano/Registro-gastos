import { leerRaw, escribirRaw, suscribirseAKey } from "./storage";
import type { Moneda } from "@/lib/format";

export interface Preferencias {
  moneda: Moneda;
}

const KEY = "preferencias";
const PREFERENCIAS_DEFECTO: Preferencias = { moneda: "ARS" };

function esMonedaValida(v: unknown): v is Moneda {
  return v === "ARS" || v === "USD" || v === "EUR";
}

function esPreferencias(v: unknown): v is Preferencias {
  if (typeof v !== "object" || v === null) return false;
  return esMonedaValida((v as Record<string, unknown>).moneda);
}

// Mismo patrón de cache que las colecciones: evita reparsear JSON en cada lectura
// y devuelve siempre la misma referencia hasta que algo cambie (clave para React).
let cache: Preferencias | null = null;
suscribirseAKey(KEY, () => {
  cache = null;
});

export function obtenerPreferencias(): Preferencias {
  if (cache !== null) return cache;

  const raw = leerRaw(KEY);
  if (!raw) {
    cache = PREFERENCIAS_DEFECTO;
    return cache;
  }

  try {
    const parsed = JSON.parse(raw);
    cache = esPreferencias(parsed) ? parsed : PREFERENCIAS_DEFECTO;
  } catch {
    cache = PREFERENCIAS_DEFECTO;
  }
  return cache;
}

export function actualizarMoneda(moneda: Moneda): void {
  const siguientes: Preferencias = { ...obtenerPreferencias(), moneda };
  cache = siguientes;
  escribirRaw(KEY, JSON.stringify(siguientes));
}

export function suscribirsePreferencias(listener: () => void): () => void {
  return suscribirseAKey(KEY, listener);
}
