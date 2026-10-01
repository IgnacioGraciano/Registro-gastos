import { billeterasRepo } from "./billeteras";
import { prestamosRepo } from "./prestamos";
import { suscripcionesRepo } from "./suscripciones";
import { transaccionesRepo } from "./transacciones";

/**
 * Si la cuenta NO se puede eliminar, devuelve el motivo (para mostrarlo en
 * la UI); si se puede, devuelve null.
 *
 * Se bloquea cuando hay algo "vivo" que depende de la cuenta: un préstamo
 * pendiente (no se podría cobrar ni dar por perdido) o una suscripción (el
 * débito automático fallaría en silencio en cada apertura de la app).
 */
export function motivoNoSePuedeEliminarBilletera(id: string): string | null {
  const prestamos = prestamosRepo.pendientes().filter((p) => p.billeteraId === id);
  if (prestamos.length > 0) {
    const personas = prestamos.map((p) => p.persona).join(", ");
    return `Esta cuenta tiene préstamos pendientes (${personas}). Cobralos, dalos por pérdida o eliminalos antes de borrarla.`;
  }

  const suscripciones = suscripcionesRepo.getAll().filter((s) => s.billeteraId === id);
  if (suscripciones.length > 0) {
    const nombres = suscripciones.map((s) => s.nombre).join(", ");
    return `Esta cuenta tiene suscripciones que se debitan de ella (${nombres}). Pasalas a otra cuenta o eliminalas antes de borrarla.`;
  }

  return null;
}

/** Cantidad de movimientos del historial que pertenecen a la cuenta. */
export function contarMovimientosDeBilletera(id: string): number {
  return transaccionesRepo.getAll().filter((t) => t.billeteraId === id).length;
}

/** Elimina la cuenta sólo si nada vivo depende de ella; si no, lanza un Error con el motivo. */
export function eliminarBilleteraSegura(id: string): boolean {
  const motivo = motivoNoSePuedeEliminarBilletera(id);
  if (motivo) throw new Error(motivo);
  return billeterasRepo.eliminar(id);
}
