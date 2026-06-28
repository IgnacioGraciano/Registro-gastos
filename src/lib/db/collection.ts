import { eliminarRaw, escribirRaw, leerRaw, suscribirseAKey } from "./storage";
import { generarId } from "./uuid";
import type { Identificable } from "./types";

export interface Coleccion<T extends Identificable> {
  /** Devuelve todos los registros. Misma referencia si no hubo cambios (clave para reactividad eficiente). */
  getAll: () => T[];
  getById: (id: string) => T | undefined;
  /** Crea un registro nuevo, generando su id automáticamente. */
  create: (data: Omit<T, "id">) => T;
  /** Actualiza parcialmente un registro existente. Devuelve null si el id no existe. */
  update: (id: string, patch: Partial<Omit<T, "id">>) => T | null;
  /** Elimina un registro. Devuelve false si el id no existía. */
  remove: (id: string) => boolean;
  /** Reemplaza toda la colección de una sola vez (ej. para importar un backup). */
  replaceAll: (items: T[]) => boolean;
  /** Se ejecuta cada vez que la colección cambia (en esta pestaña o en otra). */
  subscribe: (listener: () => void) => () => void;
}

/**
 * Fábrica de repositorios CRUD seguros sobre localStorage.
 *
 * @param key      nombre lógico de la colección (ej. "billeteras")
 * @param esValido type guard que valida la forma de cada item al leer,
 *                 para que datos corruptos o de un esquema viejo no rompan la app.
 */
export function createCollection<T extends Identificable>(
  key: string,
  esValido: (valor: unknown) => valor is T
): Coleccion<T> {
  // Cache en memoria: getAll() devuelve siempre la misma referencia hasta
  // que algo invalide el cache. Esto es necesario para que React
  // (useSyncExternalStore) no entre en un loop de re-renders.
  let cache: T[] | null = null;

  function cargarDesdeStorage(): T[] {
    const raw = leerRaw(key);
    if (!raw) return [];
    try {
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) return [];
      return parsed.filter(esValido);
    } catch (error) {
      console.error(`[db:${key}] Datos corruptos, se ignoran:`, error);
      return [];
    }
  }

  // Invalida el cache ante cualquier cambio (propio o de otra pestaña).
  suscribirseAKey(key, () => {
    cache = null;
  });

  function getAll(): T[] {
    if (cache === null) cache = cargarDesdeStorage();
    return cache;
  }

  function persistir(items: T[]): boolean {
    cache = items;
    return escribirRaw(key, JSON.stringify(items));
  }

  function getById(id: string): T | undefined {
    return getAll().find((item) => item.id === id);
  }

  function create(data: Omit<T, "id">): T {
    const nuevo = { ...data, id: generarId() } as T;
    const actuales = getAll();
    persistir([...actuales, nuevo]);
    return nuevo;
  }

  function update(id: string, patch: Partial<Omit<T, "id">>): T | null {
    const actuales = getAll();
    const indice = actuales.findIndex((item) => item.id === id);
    if (indice === -1) return null;
    const actualizado = { ...actuales[indice], ...patch, id } as T;
    const siguientes = [...actuales];
    siguientes[indice] = actualizado;
    persistir(siguientes);
    return actualizado;
  }

  function remove(id: string): boolean {
    const actuales = getAll();
    const siguientes = actuales.filter((item) => item.id !== id);
    if (siguientes.length === actuales.length) return false; // no existía
    if (siguientes.length === 0) {
      eliminarRaw(key);
      cache = [];
      return true;
    }
    return persistir(siguientes);
  }

  function replaceAll(items: T[]): boolean {
    return persistir(items.filter(esValido));
  }

  function subscribe(listener: () => void): () => void {
    return suscribirseAKey(key, listener);
  }

  return { getAll, getById, create, update, remove, replaceAll, subscribe };
}
