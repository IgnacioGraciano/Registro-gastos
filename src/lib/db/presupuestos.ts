import { createCollection } from "./collection";
import { esPresupuesto } from "./validators";
import type { Presupuesto } from "./types";

const KEY = "presupuestos";
const base = createCollection<Presupuesto>(KEY, esPresupuesto);

export const presupuestosRepo = {
  ...base,

  /** Busca el presupuesto de una categoría puntual (hay como máximo uno por categoría). */
  porCategoria(categoriaId: string): Presupuesto | undefined {
    return base.getAll().find((p) => p.categoriaId === categoriaId);
  },

  /**
   * Crea o actualiza el presupuesto mensual de una categoría (upsert: como
   * conceptualmente hay un solo presupuesto por categoría, no tiene sentido
   * tener un "crear" y un "actualizar" separados desde la UI).
   */
  establecer(categoriaId: string, montoMensual: number): Presupuesto {
    if (!Number.isFinite(montoMensual) || montoMensual <= 0) {
      throw new Error("El presupuesto debe ser un número mayor a 0.");
    }
    const existente = this.porCategoria(categoriaId);
    if (existente) {
      const actualizado = base.update(existente.id, { montoMensual });
      if (!actualizado) throw new Error("No se pudo actualizar el presupuesto.");
      return actualizado;
    }
    return base.create({ categoriaId, montoMensual });
  },

  eliminar(id: string): boolean {
    return base.remove(id);
  },
};
