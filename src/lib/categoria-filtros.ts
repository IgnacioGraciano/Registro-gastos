import type { Categoria } from "@/lib/db";

/**
 * Una categoría "aplica" a un tipo de movimiento si fue creada para ese tipo,
 * para "ambos", o si es una categoría vieja que todavía no tiene el campo
 * `tipo` (se la trata como "ambos" para no romper datos ya existentes).
 */
export function categoriaAplicaA(categoria: Categoria, tipo: "gasto" | "ingreso"): boolean {
  return categoria.tipo === undefined || categoria.tipo === "ambos" || categoria.tipo === tipo;
}

/** Paleta de colores elegibles al crear/editar una categoría, y fallback cíclico para las que no tienen color propio. */
export const PALETA_COLORES_CATEGORIA = [
  "#1FBE82", // verde esmeralda
  "#EF5A4E", // rojo coral
  "#E0B354", // dorado
  "#C9C7B5", // beige claro
  "#8FA3C4", // celeste grisáceo
  "#5B8FE0", // azul
  "#B387E0", // violeta
  "#4FC3D9", // turquesa
  "#E0789A", // rosa
  "#D9853E", // naranja
];

/** Color de una categoría: el propio si lo definió, o uno cíclico de la paleta según su posición en `todas`. */
export function obtenerColorCategoria(categoria: Categoria, todas: Categoria[]): string {
  if (categoria.color) return categoria.color;
  const indice = Math.max(0, todas.findIndex((c) => c.id === categoria.id));
  return PALETA_COLORES_CATEGORIA[indice % PALETA_COLORES_CATEGORIA.length];
}
