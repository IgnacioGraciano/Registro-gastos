// Punto único de entrada al motor de persistencia local.
// Importar siempre desde "@/lib/db", nunca directo de los archivos internos.

export type {
  Billetera,
  Categoria,
  FrecuenciaSuscripcion,
  Identificable,
  Presupuesto,
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
export { registrarTransferencia } from "./transferencias";
export { exportarTodoElStorage, importarTodoElStorage } from "./storage";
export { procesarDebitosPendientes } from "./debitos";
export type { ResultadoDebito } from "./debitos";

export { inicializarDatosBase, NOMBRE_CATEGORIA_TRANSFERENCIA } from "./seed";
export { useCollection } from "./useCollection";
export { useMoneda } from "./usePreferencias";
export { actualizarMoneda } from "./preferencias";
