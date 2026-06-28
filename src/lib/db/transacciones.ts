import { createCollection } from "./collection";
import { esTransaccion } from "./validators";
import type { Transaccion } from "./types";
import { billeterasRepo } from "./billeteras";

const KEY = "transacciones";
const base = createCollection<Transaccion>(KEY, esTransaccion);

const FECHA_ISO = /^\d{4}-\d{2}-\d{2}$/;

/** +1 para ingreso, -1 para gasto: así el signo del monto en el saldo siempre es consistente. */
function signo(tipo: Transaccion["tipo"]): 1 | -1 {
  return tipo === "ingreso" ? 1 : -1;
}

function validar(data: {
  monto: number;
  tipo: Transaccion["tipo"];
  billeteraId: string;
  categoriaId: string;
  fecha: string;
}): void {
  if (!Number.isFinite(data.monto) || data.monto <= 0) {
    throw new Error("El monto debe ser un número mayor a 0.");
  }
  if (data.tipo !== "ingreso" && data.tipo !== "gasto") {
    throw new Error('El tipo debe ser "ingreso" o "gasto".');
  }
  if (!data.billeteraId) {
    throw new Error("Falta indicar la billetera de la transacción.");
  }
  if (!billeterasRepo.getById(data.billeteraId)) {
    throw new Error("La billetera indicada no existe.");
  }
  if (!data.categoriaId) {
    throw new Error("Falta indicar la categoría de la transacción.");
  }
  if (!FECHA_ISO.test(data.fecha)) {
    throw new Error('La fecha debe tener formato "YYYY-MM-DD".');
  }
}

export const transaccionesRepo = {
  ...base,

  /** Crea la transacción y aplica su efecto (+/-) sobre el saldo de la billetera. */
  crear(data: Omit<Transaccion, "id" | "descripcion"> & { descripcion?: string }): Transaccion {
    const completa = { descripcion: "", ...data };
    validar(completa);
    const nueva = base.create(completa);
    billeterasRepo.ajustarSaldo(nueva.billeteraId, signo(nueva.tipo) * nueva.monto);
    return nueva;
  },

  /**
   * Actualiza una transacción. Revierte el efecto anterior sobre el saldo
   * (incluso si cambió de billetera) y aplica el nuevo, para que el saldo
   * nunca quede desincronizado.
   */
  actualizar(id: string, patch: Partial<Omit<Transaccion, "id">>): Transaccion | null {
    const anterior = base.getById(id);
    if (!anterior) return null;

    const siguiente = { ...anterior, ...patch };
    validar(siguiente);

    // 1. revertir el efecto que tenía la transacción original
    billeterasRepo.ajustarSaldo(anterior.billeteraId, -signo(anterior.tipo) * anterior.monto);

    // 2. guardar los nuevos datos
    const actualizada = base.update(id, patch);

    // 3. aplicar el efecto nuevo (puede ser en otra billetera si billeteraId cambió)
    if (actualizada) {
      billeterasRepo.ajustarSaldo(actualizada.billeteraId, signo(actualizada.tipo) * actualizada.monto);
    }

    return actualizada;
  },

  /** Elimina la transacción y revierte su efecto sobre el saldo de la billetera. */
  eliminar(id: string): boolean {
    const transaccion = base.getById(id);
    if (!transaccion) return false;
    const eliminada = base.remove(id);
    if (eliminada) {
      billeterasRepo.ajustarSaldo(transaccion.billeteraId, -signo(transaccion.tipo) * transaccion.monto);
    }
    return eliminada;
  },

  /** Todas las transacciones de una billetera puntual, más recientes primero. */
  porBilletera(billeteraId: string): Transaccion[] {
    return base
      .getAll()
      .filter((t) => t.billeteraId === billeteraId)
      .sort((a, b) => b.fecha.localeCompare(a.fecha));
  },

  /** Todas las transacciones ordenadas de la más reciente a la más vieja. */
  ordenadasPorFecha(): Transaccion[] {
    return [...base.getAll()].sort((a, b) => b.fecha.localeCompare(a.fecha));
  },
};
