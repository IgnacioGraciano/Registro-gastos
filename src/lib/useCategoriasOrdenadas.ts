"use client";

import { categoriasRepo, useCollection, type Categoria } from "@/lib/db";

/**
 * Igual que useCollection(categoriasRepo) pero devuelve las categorías
 * ordenadas por el campo `orden` (retrocompatible: las que no tienen
 * orden van al final). Usar en cualquier componente donde el orden
 * visible importa (grillas, selectores, listas).
 */
export function useCategoriasOrdenadas(): Categoria[] {
  const categorias = useCollection(categoriasRepo);
  return [...categorias].sort((a, b) => (a.orden ?? Infinity) - (b.orden ?? Infinity));
}
