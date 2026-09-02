import { createCollection } from "./collection";
import { esPrestamo } from "./validators";
import { categoriasRepo } from "./categorias";
import { transaccionesRepo } from "./transacciones";
import { compararRecientePrimero } from "./orden";
import {
  NOMBRE_CATEGORIA_PRESTAMO,
  NOMBRE_CATEGORIA_GANANCIA_PRESTAMO,
  NOMBRE_CATEGORIA_PERDIDA_PRESTAMO,
} from "./seed";
import type { Prestamo } from "./types";

const KEY = "prestamos";
const base = createCollection<Prestamo>(KEY, esPrestamo);

function idCategoriaPrestamo(): string {
  const categoria = categoriasRepo.getAll().find((c) => c.nombre === NOMBRE_CATEGORIA_PRESTAMO);
  if (!categoria) {
    throw new Error('Falta la categoría de sistema "Préstamo". Recargá la app.');
  }
  return categoria.id;
}

function idCategoriaGananciaPrestamo(): string {
  const categoria = categoriasRepo
    .getAll()
    .find((c) => c.nombre === NOMBRE_CATEGORIA_GANANCIA_PRESTAMO);
  if (!categoria) {
    throw new Error('Falta la categoría de sistema "Ganancia de préstamo". Recargá la app.');
  }
  return categoria.id;
}

function idCategoriaPerdidaPrestamo(): string {
  const categoria = categoriasRepo
    .getAll()
    .find((c) => c.nombre === NOMBRE_CATEGORIA_PERDIDA_PRESTAMO);
  if (!categoria) {
    throw new Error('Falta la categoría de sistema "Pérdida de préstamo". Recargá la app.');
  }
  return categoria.id;
}

function descripcionGasto(persona: string, descripcion?: string): string {
  const extra = descripcion?.trim();
  return extra ? `Préstamo a ${persona}: ${extra}` : `Préstamo a ${persona}`;
}

/** Migra datos del store Zustand viejo (`prestamos-store`) al motor `gg:`. */
export function migrarPrestamosZustand(): void {
  if (typeof window === "undefined") return;
  if (base.getAll().length > 0) return;

  const raw = window.localStorage.getItem("prestamos-store");
  if (!raw) return;

  try {
    const parseado = JSON.parse(raw) as {
      state?: {
        prestamos?: Array<{
          id: string;
          persona: string;
          monto: number;
          billeteraId?: string;
          descripcion?: string;
          fecha: string;
          montoPagado?: number;
          estado?: string;
        }>;
      };
    };

    const viejos = parseado.state?.prestamos ?? [];
    const pendientes = viejos.filter((p) => p.estado !== "pagado");
    if (pendientes.length === 0) {
      window.localStorage.removeItem("prestamos-store");
      return;
    }

    const billeteraFallback = pendientes.find((p) => p.billeteraId)?.billeteraId ?? "";
    let categoriaId: string;
    try {
      categoriaId = idCategoriaPrestamo();
    } catch {
      return;
    }

    for (const p of pendientes) {
      const billeteraId = p.billeteraId || billeteraFallback;
      if (!billeteraId) continue;

      const transaccion = transaccionesRepo.crear({
        monto: p.monto,
        tipo: "gasto",
        billeteraId,
        categoriaId,
        descripcion: descripcionGasto(p.persona, p.descripcion),
        fecha: p.fecha,
      });

      base.create({
        persona: p.persona,
        monto: p.monto,
        montoPagado: p.montoPagado ?? 0,
        billeteraId,
        transaccionId: transaccion.id,
        descripcion: p.descripcion?.trim() ?? "",
        fecha: p.fecha,
        creadoEn: Date.now(),
      });
    }

    window.localStorage.removeItem("prestamos-store");
  } catch (error) {
    console.error("[prestamos] No se pudo migrar el store viejo:", error);
  }
}

export const prestamosRepo = {
  ...base,

  pendientes(): Prestamo[] {
    return base
      .getAll()
      .filter((p) => p.montoPagado < p.monto)
      .sort(compararRecientePrimero);
  },

  montoPendiente(prestamo: Prestamo): number {
    return Math.max(0, prestamo.monto - prestamo.montoPagado);
  },

  totalPendiente(): number {
    return prestamosRepo.pendientes().reduce((acc, p) => acc + prestamosRepo.montoPendiente(p), 0);
  },

  /** Registra un préstamo nuevo y el gasto asociado (salida de dinero). */
  crear(data: {
    persona: string;
    monto: number;
    billeteraId: string;
    fecha: string;
    descripcion?: string;
  }): Prestamo {
    const persona = data.persona.trim();
    if (!persona) throw new Error("Ingresá el nombre de la persona.");
    if (!Number.isFinite(data.monto) || data.monto <= 0) {
      throw new Error("Ingresá un monto válido.");
    }
    if (!data.billeteraId) throw new Error("Elegí una cuenta.");

    const categoriaId = idCategoriaPrestamo();
    const transaccion = transaccionesRepo.crear({
      monto: data.monto,
      tipo: "gasto",
      billeteraId: data.billeteraId,
      categoriaId,
      descripcion: descripcionGasto(persona, data.descripcion),
      fecha: data.fecha,
    });

    return base.create({
      persona,
      monto: data.monto,
      montoPagado: 0,
      billeteraId: data.billeteraId,
      transaccionId: transaccion.id,
      descripcion: data.descripcion?.trim() ?? "",
      fecha: data.fecha,
      creadoEn: Date.now(),
    });
  },

  /**
   * Registra un cobro parcial o total.
   *
   * El capital recuperado (hasta lo pendiente) se registra en la categoría
   * "Préstamo", que es un movimiento de plata propio y NO cuenta como
   * ingreso real (mismo tratamiento que el gasto original al prestar): así
   * evitamos que prestar y cobrar infle los totales de ingresos/gastos.
   *
   * Si el monto pagado supera lo pendiente, ese excedente sí es una
   * ganancia real (ej. interés) y se registra aparte, en la categoría
   * "Ganancia de préstamo", que sí cuenta en los totales.
   *
   * Al saldar el préstamo, se elimina el registro activo (los movimientos
   * ya generados quedan en el historial).
   */
  registrarPago(prestamoId: string, montoPago: number, fechaPago: string): void {
    const prestamo = base.getById(prestamoId);
    if (!prestamo) throw new Error("Préstamo no encontrado.");
    if (!Number.isFinite(montoPago) || montoPago <= 0) {
      throw new Error("Ingresá un monto válido.");
    }

    const pendiente = prestamosRepo.montoPendiente(prestamo);
    const montoCobro = Math.min(montoPago, pendiente);
    const ganancia = montoPago - montoCobro;

    if (montoCobro > 0) {
      transaccionesRepo.crear({
        monto: montoCobro,
        tipo: "ingreso",
        billeteraId: prestamo.billeteraId,
        categoriaId: idCategoriaPrestamo(),
        descripcion: `Cobro préstamo: ${prestamo.persona}`,
        fecha: fechaPago,
      });
    }

    if (ganancia > 0) {
      transaccionesRepo.crear({
        monto: ganancia,
        tipo: "ingreso",
        billeteraId: prestamo.billeteraId,
        categoriaId: idCategoriaGananciaPrestamo(),
        descripcion: `Ganancia préstamo: ${prestamo.persona}`,
        fecha: fechaPago,
      });
    }

    const nuevoPagado = prestamo.montoPagado + montoCobro;
    if (nuevoPagado >= prestamo.monto) {
      base.remove(prestamoId);
      return;
    }

    base.update(prestamoId, { montoPagado: nuevoPagado });
  },

  /**
   * Da por incobrable el saldo pendiente de un préstamo y lo cierra. A
   * diferencia de `eliminar` (que revierte todo, como si nunca hubiese
   * existido), esto SÍ deja rastro: lo que no se va a cobrar se registra
   * como un gasto real, en la categoría "Pérdida de préstamo".
   *
   * No genera un nuevo movimiento de plata en la billetera (esa plata ya
   * había salido al prestarla): en vez de eso, reduce (o borra, si no se
   * cobró nada) el gasto original de "Préstamo" a lo efectivamente
   * recuperado, y por diferencia registra la pérdida. El efecto neto sobre
   * el saldo de la billetera es cero, como corresponde.
   */
  marcarComoPerdida(prestamoId: string, fechaPerdida: string): void {
    const prestamo = base.getById(prestamoId);
    if (!prestamo) throw new Error("Préstamo no encontrado.");

    const pendiente = prestamosRepo.montoPendiente(prestamo);
    if (pendiente <= 0) throw new Error("Este préstamo ya está saldado.");

    if (prestamo.montoPagado > 0) {
      transaccionesRepo.actualizar(prestamo.transaccionId, { monto: prestamo.montoPagado });
    } else {
      transaccionesRepo.eliminar(prestamo.transaccionId);
    }

    transaccionesRepo.crear({
      monto: pendiente,
      tipo: "gasto",
      billeteraId: prestamo.billeteraId,
      categoriaId: idCategoriaPerdidaPrestamo(),
      descripcion: `Pérdida préstamo: ${prestamo.persona}`,
      fecha: fechaPerdida,
    });

    base.remove(prestamoId);
  },

  /** Elimina el préstamo y revierte el gasto original vinculado. */
  eliminar(id: string): boolean {
    const prestamo = base.getById(id);
    if (!prestamo) return false;
    transaccionesRepo.eliminar(prestamo.transaccionId);
    return base.remove(id);
  },
};
