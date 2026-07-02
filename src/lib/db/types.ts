/**
 * Tipos del dominio. Estas interfaces son la "fuente de verdad" de la forma
 * de los datos: tanto el motor de persistencia como la UI deben tipar todo
 * en base a esto.
 */

export type TipoTransaccion = "ingreso" | "gasto";
export type FrecuenciaSuscripcion = "mensual" | "anual";

export interface Transaccion {
  id: string; // UUID v4
  monto: number; // siempre positivo; el signo lo da `tipo`
  tipo: TipoTransaccion;
  billeteraId: string; // referencia a Billetera.id
  categoriaId: string; // referencia a Categoria.id
  descripcion: string;
  fecha: string; // formato "YYYY-MM-DD"
}

export interface Billetera {
  id: string; // UUID v4
  nombre: string; // ej: "Mercado Pago", "Galicia", "Efectivo"
  saldo: number;
}

export type TipoCategoria = "gasto" | "ingreso" | "ambos";

export interface Categoria {
  id: string; // UUID v4
  nombre: string; // ej: "Padel", "Super", "Comida"
  icono: string; // nombre de ícono de lucide-react, ej: "Utensils"
  esEditable: boolean; // si es false, no se puede renombrar ni eliminar
  /**
   * Para qué tipo de movimiento aplica esta categoría. Es OPCIONAL a propósito:
   * las categorías creadas antes de agregar este campo no lo tienen, y deben
   * seguir funcionando igual que siempre (se tratan como "ambos" en toda la
   * app — ver `categoriaAplicaA` en lib/categoria-filtros.ts).
   */
  tipo?: TipoCategoria;
  /**
   * Color personalizado (hex) para el ícono de la categoría. OPCIONAL: las
   * categorías sin color definido usan un color cíclico automático (ver
   * `obtenerColorCategoria` en lib/categoria-filtros.ts), así que datos viejos
   * siguen funcionando sin cambios.
   */
  color?: string;
  /** Posición en la lista. OPCIONAL: las categorías viejas sin este campo se ordenan al final. */
  orden?: number;
}

export interface Suscripcion {
  id: string; // UUID v4
  nombre: string;
  monto: number;
  billeteraId: string; // referencia a Billetera.id
  categoriaId: string; // referencia a Categoria.id
  frecuencia: FrecuenciaSuscripcion;
  proximoPago: string; // formato "YYYY-MM-DD"
}

export interface Presupuesto {
  id: string; // UUID v4
  categoriaId: string; // referencia a Categoria.id (uno por categoría)
  montoMensual: number;
}

/** Toda entidad persistida tiene, como mínimo, un id. */
export interface Identificable {
  id: string;
}
