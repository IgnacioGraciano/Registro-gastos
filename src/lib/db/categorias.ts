import { createCollection } from "./collection";
import { esCategoria } from "./validators";
import type { Categoria, TipoCategoria } from "./types";

const KEY = "categorias";
const base = createCollection<Categoria>(KEY, esCategoria);

export const categoriasRepo = {
  ...base,

  /** Crea una categoría nueva. Las categorías creadas a mano siempre son editables. */
  crear(nombre: string, icono: string, tipo: TipoCategoria = "ambos", color?: string): Categoria {
    const nombreLimpio = nombre.trim();
    if (!nombreLimpio) {
      throw new Error("El nombre de la categoría no puede estar vacío.");
    }
    return base.create({ nombre: nombreLimpio, icono, esEditable: true, tipo, color });
  },

  /** Renombra/cambia ícono, color o tipo. Falla si la categoría está marcada como no editable. */
  actualizar(
    id: string,
    patch: Partial<Pick<Categoria, "nombre" | "icono" | "color" | "tipo">>
  ): Categoria | null {
    const actual = base.getById(id);
    if (!actual) return null;
    if (!actual.esEditable) {
      throw new Error(`La categoría "${actual.nombre}" no se puede modificar.`);
    }
    if (patch.nombre !== undefined && !patch.nombre.trim()) {
      throw new Error("El nombre de la categoría no puede estar vacío.");
    }
    return base.update(id, patch);
  },

  /** Elimina una categoría sólo si está marcada como editable. */
  eliminar(id: string): boolean {
    const actual = base.getById(id);
    if (!actual) return false;
    if (!actual.esEditable) {
      throw new Error(`La categoría "${actual.nombre}" no se puede eliminar.`);
    }
    return base.remove(id);
  },
};
