/**
 * Comparador compartido para listar movimientos "más nuevo primero".
 *
 * `fecha` es sólo "YYYY-MM-DD" (sin hora), así que dos movimientos del
 * mismo día empatan si se ordena únicamente por fecha; en ese caso hay que
 * desempatar por `creadoEn` (timestamp de creación) para que el último
 * cargado en el día aparezca primero. Los registros viejos que no tienen
 * `creadoEn` caen al final del empate (se tratan como creadoEn = 0), que es
 * lo mejor que se puede hacer sin ese dato.
 */
export function compararRecientePrimero(
  a: { fecha: string; creadoEn?: number },
  b: { fecha: string; creadoEn?: number }
): number {
  const porFecha = b.fecha.localeCompare(a.fecha);
  if (porFecha !== 0) return porFecha;
  return (b.creadoEn ?? 0) - (a.creadoEn ?? 0);
}
