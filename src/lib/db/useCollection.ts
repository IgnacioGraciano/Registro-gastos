"use client";

import { useCallback, useSyncExternalStore } from "react";
import type { Coleccion } from "./collection";
import type { Identificable } from "./types";

/**
 * Suscribe un componente a una colección: cada vez que se crea, actualiza o
 * elimina un registro (en esta pestaña o en otra), el componente se vuelve
 * a renderizar automáticamente con los datos actualizados.
 *
 * Ej: const billeteras = useCollection(billeterasRepo);
 */
export function useCollection<T extends Identificable>(repo: Coleccion<T>): T[] {
  const subscribe = useCallback((listener: () => void) => repo.subscribe(listener), [repo]);
  const getSnapshot = useCallback(() => repo.getAll(), [repo]);
  // Snapshot del servidor: vacío, porque localStorage no existe durante el SSR.
  return useSyncExternalStore(subscribe, getSnapshot, () => []);
}
