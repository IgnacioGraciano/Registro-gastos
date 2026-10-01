// Punto único de entrada al motor de persistencia local.
// Importar siempre desde "@/lib/db", nunca directo de los archivos internos.

export type {
  Billetera,
  Categoria,
  FrecuenciaSuscripcion,
  Identificable,
  Presupuesto,
  Prestamo,
  Suscripcion,
  TipoCategoria,
  TipoTransaccion,
  Transaccion,
} from "./types";

export { billeterasRepo } from "./billeteras";
export { categoriasRepo } from "./categorias";
export { transaccionesRepo } from "./transacciones";
export { suscripcionesRepo } from "./suscripciones";
export { presupuestosRepo } from "./presupuestos";
export { prestamosRepo, migrarPrestamosZustand } from "./prestamos";
export {
  actualizarTransferencia,
  eliminarMovimiento,
  esTransferencia,
  registrarTransferencia,
} from "./transferencias";
export {
  contarMovimientosDeCategoria,
  eliminarCategoriaSegura,
  motivoNoSePuedeEliminarCategoria,
} from "./eliminarCategoria";
export {
  contarMovimientosDeBilletera,
  eliminarBilleteraSegura,
  motivoNoSePuedeEliminarBilletera,
} from "./eliminarBilletera";
export { exportarTodoElStorage, importarTodoElStorage } from "./storage";
export { procesarDebitosPendientes } from "./debitos";
export type { ResultadoDebito } from "./debitos";

export {
  inicializarDatosBase,
  NOMBRE_CATEGORIA_TRANSFERENCIA,
  NOMBRE_CATEGORIA_PRESTAMO,
  NOMBRE_CATEGORIA_GANANCIA_PRESTAMO,
  NOMBRE_CATEGORIA_PERDIDA_PRESTAMO,
} from "./seed";
export { useCollection } from "./useCollection";
export { useMoneda } from "./usePreferencias";
export { actualizarMoneda } from "./preferencias";
