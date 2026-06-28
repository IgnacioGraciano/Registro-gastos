import { billeterasRepo } from "./billeteras";
import { categoriasRepo } from "./categorias";

/** Nombre de la categoría de sistema usada para las dos patas de una transferencia entre billeteras. */
export const NOMBRE_CATEGORIA_TRANSFERENCIA = "Transferencia";

/**
 * Billeteras precargadas. Se incluye una tercera ("Banco") además de las dos
 * pedidas (Efectivo, Mercado Pago) para cubrir el mínimo de 3 — es fácil
 * renombrarla o borrarla desde la app una vez instalada.
 */
const BILLETERAS_BASE: { nombre: string; saldoInicial: number }[] = [
  { nombre: "Efectivo", saldoInicial: 0 },
  { nombre: "Mercado Pago", saldoInicial: 0 },
  { nombre: "Banco", saldoInicial: 0 },
];

/** Categorías base. `icono` es el nombre del componente en lucide-react. */
const CATEGORIAS_BASE: { nombre: string; icono: string }[] = [
  { nombre: "Comida", icono: "Utensils" },
  { nombre: "Padel", icono: "Dumbbell" },
  { nombre: "Transporte", icono: "Car" },
  { nombre: "Supermercado", icono: "ShoppingCart" },
  { nombre: "Salidas", icono: "PartyPopper" },
  { nombre: "Varios", icono: "MoreHorizontal" },
];

let yaCorrioEnEstaSesion = false;

/**
 * Crea la categoría de sistema "Transferencia" si todavía no existe. Se
 * marca `esEditable: false` para que no se pueda renombrar ni borrar por
 * accidente desde la UI (la usan, por dentro, las transferencias entre
 * billeteras). Es independiente del resto del seed para que también se
 * autorepare en instalaciones que ya tenían categorías antes de agregar
 * esta función.
 */
function asegurarCategoriaTransferencia(): void {
  const existe = categoriasRepo.getAll().some((c) => c.nombre === NOMBRE_CATEGORIA_TRANSFERENCIA);
  if (!existe) {
    // Se usa el método genérico `create` (no `crear`) para poder fijar esEditable: false.
    categoriasRepo.create({
      nombre: NOMBRE_CATEGORIA_TRANSFERENCIA,
      icono: "ArrowRightLeft",
      esEditable: false,
    });
  }
}

/**
 * Si la app se abre por primera vez (billeteras y categorías vacías),
 * precarga los datos base. Es idempotente y segura de llamar varias veces:
 * sólo escribe si la colección correspondiente está realmente vacía.
 */
export function inicializarDatosBase(): void {
  if (yaCorrioEnEstaSesion) return;
  if (typeof window === "undefined") return; // nunca correr en el servidor

  try {
    if (billeterasRepo.getAll().length === 0) {
      BILLETERAS_BASE.forEach(({ nombre, saldoInicial }) =>
        billeterasRepo.crear(nombre, saldoInicial)
      );
    }

    if (categoriasRepo.getAll().length === 0) {
      CATEGORIAS_BASE.forEach(({ nombre, icono }) => categoriasRepo.crear(nombre, icono));
    }

    asegurarCategoriaTransferencia();
  } catch (error) {
    console.error("[seed] No se pudieron precargar los datos base:", error);
  } finally {
    yaCorrioEnEstaSesion = true;
  }
}
