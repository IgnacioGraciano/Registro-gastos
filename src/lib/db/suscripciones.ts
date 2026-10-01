import { createCollection } from "./collection";
import { esSuscripcion } from "./validators";
import type { Suscripcion } from "./types";

const KEY = "suscripciones";
const base = createCollection<Suscripcion>(KEY, esSuscripcion);

const FECHA_ISO = /^\d{4}-\d{2}-\d{2}$/;

function validar(data: Omit<Suscripcion, "id">): void {
  if (!data.nombre.trim()) {
    throw new Error("El nombre de la suscripción no puede estar vacío.");
  }
  if (!Number.isFinite(data.monto) || data.monto <= 0) {
    throw new Error("El monto debe ser un número mayor a 0.");
  }
  if (!data.billeteraId) {
    throw new Error("Falta indicar la billetera de la suscripción.");
  }
  if (!data.categoriaId) {
    throw new Error("Falta indicar la categoría de la suscripción.");
  }
  if (data.frecuencia !== "mensual" && data.frecuencia !== "anual") {
    throw new Error('La frecuencia debe ser "mensual" o "anual".');
  }
  if (!FECHA_ISO.test(data.proximoPago)) {
    throw new Error('proximoPago debe tener formato "YYYY-MM-DD".');
  }
}

function diaDe(fechaISO: string): number {
  return Number(fechaISO.split("-")[2]);
}

/**
 * Suma un período (1 mes o 1 año) a una fecha "YYYY-MM-DD", sin librerías
 * externas y sin pasar por `Date` (así no depende del huso horario).
 *
 * `diaDeCobro` es el día "real" de la suscripción: si el mes destino no
 * tiene ese día (ej. 31 en febrero), se usa el último día de ese mes, y al
 * mes siguiente vuelve al día original (31/01 → 28/02 → 31/03).
 */
function avanzarPeriodo(
  fechaISO: string,
  frecuencia: Suscripcion["frecuencia"],
  diaDeCobro: number
): string {
  let [anio, mes] = fechaISO.split("-").map(Number); // mes 1-12
  if (frecuencia === "mensual") {
    mes += 1;
    if (mes > 12) {
      mes = 1;
      anio += 1;
    }
  } else {
    anio += 1;
  }
  const ultimoDiaDelMes = new Date(anio, mes, 0).getDate(); // día 0 del mes siguiente
  const dia = Math.min(Math.max(1, Math.trunc(diaDeCobro)), ultimoDiaDelMes);
  return `${anio}-${String(mes).padStart(2, "0")}-${String(dia).padStart(2, "0")}`;
}

export const suscripcionesRepo = {
  ...base,

  crear(data: Omit<Suscripcion, "id">): Suscripcion {
    validar(data);
    return base.create({ ...data, diaDeCobro: diaDe(data.proximoPago) });
  },

  actualizar(id: string, patch: Partial<Omit<Suscripcion, "id">>): Suscripcion | null {
    const anterior = base.getById(id);
    if (!anterior) return null;
    const siguiente = { ...anterior, ...patch };
    validar(siguiente);
    // Sólo si el usuario cambió la fecha a mano se toma su día como nuevo día de
    // cobro; si no, se conserva el original (puede estar "adelantado" por un mes corto).
    const cambioFecha = patch.proximoPago !== undefined && patch.proximoPago !== anterior.proximoPago;
    return base.update(id, cambioFecha ? { ...patch, diaDeCobro: diaDe(siguiente.proximoPago) } : patch);
  },

  eliminar(id: string): boolean {
    return base.remove(id);
  },

  /** Avanza `proximoPago` al siguiente período. Se llama al confirmar que el pago se efectuó. */
  registrarPago(id: string): Suscripcion | null {
    const actual = base.getById(id);
    if (!actual) return null;
    const diaDeCobro = actual.diaDeCobro ?? diaDe(actual.proximoPago);
    return base.update(id, {
      proximoPago: avanzarPeriodo(actual.proximoPago, actual.frecuencia, diaDeCobro),
      diaDeCobro,
    });
  },

  /** Suscripciones cuyo próximo pago cae dentro de los próximos `dias` (por defecto 7). */
  proximasAVencer(dias = 7): Suscripcion[] {
    const hoy = new Date();
    const limite = new Date();
    limite.setDate(hoy.getDate() + dias);
    return base
      .getAll()
      .filter((s) => {
        const fecha = new Date(s.proximoPago);
        return fecha >= hoy && fecha <= limite;
      })
      .sort((a, b) => a.proximoPago.localeCompare(b.proximoPago));
  },
};
