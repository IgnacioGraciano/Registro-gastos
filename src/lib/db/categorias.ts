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
    // Asigna el orden más alto existente + 1, para que la nueva quede al final.
    const maxOrden = Math.max(0, ...base.getAll().map((c) => c.orden ?? 0));
    return base.create({ nombre: nombreLimpio, icono, esEditable: true, tipo, color, orden: maxOrden + 1 });
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

  /**
   * Persiste un nuevo orden para un SUBCONJUNTO de categorías (las visibles en
   * la pestaña Gastos o Ingresos), dado un array con sus IDs en el orden deseado.
   *
   * Las categorías del subconjunto se reacomodan entre sí usando los mismos
   * "lugares" que ya ocupaban en la lista completa; las que no están en el
   * array no se mueven. Después se renumera TODA la lista (0, 1, 2, ...), así
   * nunca quedan dos categorías con el mismo `orden` y reordenar una pestaña
   * no desordena la otra.
   */
  reordenar(idsEnOrden: string[]): void {
    const ordenadas = this.getOrdenadas();
    const enSubconjunto = new Set(idsEnOrden);
    const porId = new Map(ordenadas.map((c) => [c.id, c]));
    const cola = idsEnOrden.filter((id) => porId.has(id));

    let siguiente = 0;
    const resultado = ordenadas.map((c) =>
      enSubconjunto.has(c.id) ? porId.get(cola[siguiente++])! : c
    );
    base.replaceAll(resultado.map((c, indice) => ({ ...c, orden: indice })));
  },

  /**
   * Devuelve todas las categorías ordenadas por el campo `orden`.
   * Las que no tienen `orden` definido van al final, manteniendo
   * compatibilidad con datos creados antes de agregar este campo.
   */
  getOrdenadas(): Categoria[] {
    return [...base.getAll()].sort((a, b) => {
      const oa = a.orden ?? Infinity;
      const ob = b.orden ?? Infinity;
      return oa - ob;
    });
  },
};
