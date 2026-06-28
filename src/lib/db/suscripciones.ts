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

/** Suma un período (1 mes o 1 año) a una fecha "YYYY-MM-DD", sin librerías externas. */
function avanzarPeriodo(fechaISO: string, frecuencia: Suscripcion["frecuencia"]): string {
  const [anio, mes, dia] = fechaISO.split("-").map(Number);
  const fecha = new Date(anio, mes - 1, dia);
  if (frecuencia === "mensual") {
    fecha.setMonth(fecha.getMonth() + 1);
  } else {
    fecha.setFullYear(fecha.getFullYear() + 1);
  }
  return fecha.toISOString().slice(0, 10);
}

export const suscripcionesRepo = {
  ...base,

  crear(data: Omit<Suscripcion, "id">): Suscripcion {
    validar(data);
    return base.create(data);
  },

  actualizar(id: string, patch: Partial<Omit<Suscripcion, "id">>): Suscripcion | null {
    const anterior = base.getById(id);
    if (!anterior) return null;
    const siguiente = { ...anterior, ...patch };
    validar(siguiente);
    return base.update(id, patch);
  },

  eliminar(id: string): boolean {
    return base.remove(id);
  },

  /** Avanza `proximoPago` al siguiente período. Se llama al confirmar que el pago se efectuó. */
  registrarPago(id: string): Suscripcion | null {
    const actual = base.getById(id);
    if (!actual) return null;
    return base.update(id, {
      proximoPago: avanzarPeriodo(actual.proximoPago, actual.frecuencia),
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
