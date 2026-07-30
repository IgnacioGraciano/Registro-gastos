import { billeterasRepo } from "./billeteras";
import { categoriasRepo } from "./categorias";

/** Nombre de la categoría de sistema usada para las dos patas de una transferencia entre billeteras. */
export const NOMBRE_CATEGORIA_TRANSFERENCIA = "Transferencia";

/** Categoría de sistema para préstamos (gasto al prestar, ingreso al cobrar). */
export const NOMBRE_CATEGORIA_PRESTAMO = "Préstamo";

/**
 * Categoría de sistema para la ganancia (o pérdida) de un préstamo: la
 * diferencia entre lo prestado y lo cobrado. Es la única pata de un préstamo
 * que cuenta como ingreso/gasto "real" en los totales (ver `esGastoReal` /
 * `esIngresoReal` en lib/dashboard.ts).
 */
export const NOMBRE_CATEGORIA_GANANCIA_PRESTAMO = "Ganancia de préstamo";

/** Categoría de sistema para la parte de un préstamo dada por incobrable: sí cuenta como gasto real. */
export const NOMBRE_CATEGORIA_PERDIDA_PRESTAMO = "Pérdida de préstamo";

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

function asegurarCategoriaPrestamo(): void {
  const existe = categoriasRepo.getAll().some((c) => c.nombre === NOMBRE_CATEGORIA_PRESTAMO);
  if (!existe) {
    categoriasRepo.create({
      nombre: NOMBRE_CATEGORIA_PRESTAMO,
      icono: "Banknote",
      esEditable: false,
      tipo: "ambos",
    });
  }
}

function asegurarCategoriaGananciaPrestamo(): void {
  const existe = categoriasRepo
    .getAll()
    .some((c) => c.nombre === NOMBRE_CATEGORIA_GANANCIA_PRESTAMO);
  if (!existe) {
    categoriasRepo.create({
      nombre: NOMBRE_CATEGORIA_GANANCIA_PRESTAMO,
      icono: "TrendingUp",
      esEditable: false,
      tipo: "ambos",
    });
  }
}

function asegurarCategoriaPerdidaPrestamo(): void {
  const existe = categoriasRepo
    .getAll()
    .some((c) => c.nombre === NOMBRE_CATEGORIA_PERDIDA_PRESTAMO);
  if (!existe) {
    categoriasRepo.create({
      nombre: NOMBRE_CATEGORIA_PERDIDA_PRESTAMO,
      icono: "TrendingDown",
      esEditable: false,
      tipo: "ambos",
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
    asegurarCategoriaPrestamo();
    asegurarCategoriaGananciaPrestamo();
    asegurarCategoriaPerdidaPrestamo();
  } catch (error) {
    console.error("[seed] No se pudieron precargar los datos base:", error);
  } finally {
    yaCorrioEnEstaSesion = true;
  }
}
