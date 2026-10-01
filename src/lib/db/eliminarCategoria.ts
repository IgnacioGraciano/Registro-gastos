import { categoriasRepo } from "./categorias";
import { presupuestosRepo } from "./presupuestos";
import { suscripcionesRepo } from "./suscripciones";
import { transaccionesRepo } from "./transacciones";

/**
 * Si la categoría NO se puede eliminar, devuelve el motivo; si se puede, null.
 * Se bloquea cuando alguna suscripción la usa: el débito automático seguiría
 * generando gastos en una categoría que ya no existe.
 */
export function motivoNoSePuedeEliminarCategoria(id: string): string | null {
  const suscripciones = suscripcionesRepo.getAll().filter((s) => s.categoriaId === id);
  if (suscripciones.length > 0) {
    const nombres = suscripciones.map((s) => s.nombre).join(", ");
    return `Esta categoría la usan suscripciones (${nombres}). Cambiales la categoría o eliminalas antes de borrarla.`;
  }
  return null;
}

/** Cantidad de movimientos del historial cargados en la categoría. */
export function contarMovimientosDeCategoria(id: string): number {
  return transaccionesRepo.getAll().filter((t) => t.categoriaId === id).length;
}

/**
 * Elimina la categoría (y su presupuesto, si tenía). Sus movimientos NO se
 * borran: quedan en el historial y en los totales como "Sin categoría".
 */
export function eliminarCategoriaSegura(id: string): boolean {
  const motivo = motivoNoSePuedeEliminarCategoria(id);
  if (motivo) throw new Error(motivo);
  const eliminada = categoriasRepo.eliminar(id);
  if (eliminada) {
    const presupuesto = presupuestosRepo.porCategoria(id);
    if (presupuesto) presupuestosRepo.eliminar(presupuesto.id);
  }
  return eliminada;
}
