import type { Categoria, Presupuesto, Transaccion } from "@/lib/db";

/** Primer día del mes de `referencia` (hoy por defecto), en formato "YYYY-MM-DD". */
export function inicioDeMes(referencia: Date = new Date()): string {
  const anio = referencia.getFullYear();
  const mes = String(referencia.getMonth() + 1).padStart(2, "0");
  return `${anio}-${mes}-01`;
}

/** Fecha de hace `dias` días contando hoy como día 0 (ej. haceNDias(6) = "los últimos 7 días"). */
export function haceNDias(dias: number, referencia: Date = new Date()): string {
  const fecha = new Date(referencia);
  fecha.setDate(fecha.getDate() - dias);
  const anio = fecha.getFullYear();
  const mes = String(fecha.getMonth() + 1).padStart(2, "0");
  const dia = String(fecha.getDate()).padStart(2, "0");
  return `${anio}-${mes}-${dia}`;
}

/** Una transacción cuenta como "gasto real" si es de tipo gasto Y no es una de las dos patas de una transferencia interna. */
export function esGastoReal(t: Transaccion, idCategoriaTransferencia?: string): boolean {
  return t.tipo === "gasto" && t.categoriaId !== idCategoriaTransferencia;
}

/** Igual que esGastoReal, pero para ingresos: una transferencia entre tus propias billeteras no es "ingreso real". */
export function esIngresoReal(t: Transaccion, idCategoriaTransferencia?: string): boolean {
  return t.tipo === "ingreso" && t.categoriaId !== idCategoriaTransferencia;
}

/** Suma los gastos reales desde `desde` (inclusive) hasta hoy. */
export function sumarGastosDesde(
  transacciones: Transaccion[],
  desde: string,
  idCategoriaTransferencia?: string
): number {
  return transacciones
    .filter((t) => esGastoReal(t, idCategoriaTransferencia) && t.fecha >= desde)
    .reduce((acc, t) => acc + t.monto, 0);
}

/** Suma los ingresos reales desde `desde` (inclusive) hasta hoy. */
export function sumarIngresosDesde(
  transacciones: Transaccion[],
  desde: string,
  idCategoriaTransferencia?: string
): number {
  return transacciones
    .filter((t) => esIngresoReal(t, idCategoriaTransferencia) && t.fecha >= desde)
    .reduce((acc, t) => acc + t.monto, 0);
}

export interface CategoriaConMonto {
  categoria: Categoria;
  monto: number;
  porcentaje: number; // 0-100
}

/** Agrupa los movimientos reales de un tipo (gasto o ingreso) entre `desde` y `hasta` (ambos inclusive), por categoría, de mayor a menor monto. Si no se pasa `hasta`, no hay límite superior (incluye hasta hoy). */
export function agruparPorCategoria(
  transacciones: Transaccion[],
  categorias: Categoria[],
  desde: string,
  tipo: "gasto" | "ingreso",
  idCategoriaTransferencia?: string,
  hasta?: string
): CategoriaConMonto[] {
  const esReal = tipo === "gasto" ? esGastoReal : esIngresoReal;
  const totalPorCategoria = new Map<string, number>();

  for (const t of transacciones) {
    if (!esReal(t, idCategoriaTransferencia) || t.fecha < desde) continue;
    if (hasta && t.fecha > hasta) continue;
    totalPorCategoria.set(t.categoriaId, (totalPorCategoria.get(t.categoriaId) ?? 0) + t.monto);
  }

  const totalGeneral = [...totalPorCategoria.values()].reduce((a, b) => a + b, 0);

  const resultado: CategoriaConMonto[] = [];
  for (const [categoriaId, monto] of totalPorCategoria) {
    const categoria = categorias.find((c) => c.id === categoriaId);
    if (!categoria) continue; // categoría borrada/huérfana: se ignora de forma defensiva
    resultado.push({
      categoria,
      monto,
      porcentaje: totalGeneral > 0 ? (monto / totalGeneral) * 100 : 0,
    });
  }

  return resultado.sort((a, b) => b.monto - a.monto);
}

/**
 * A partir de la `clave` de un ResumenPeriodo ("YYYY-MM" para mensual, o
 * "YYYY" para anual), devuelve el rango de fechas exacto que cubre ese
 * período — necesario para que el detalle por categoría de un mes pasado
 * no se "filtre" hacia adelante (agruparPorCategoria por sí sola no tiene
 * límite superior).
 */
export function rangoDePeriodo(clave: string): { desde: string; hasta: string } {
  if (clave.length === 7) {
    // "YYYY-MM"
    const [anio, mes] = clave.split("-").map(Number);
    const desde = `${clave}-01`;
    const ultimoDia = new Date(anio, mes, 0).getDate(); // día 0 del mes siguiente = último día de este mes
    const hasta = `${clave}-${String(ultimoDia).padStart(2, "0")}`;
    return { desde, hasta };
  }
  // "YYYY"
  return { desde: `${clave}-01-01`, hasta: `${clave}-12-31` };
}

export interface ResumenPeriodo {
  clave: string; // "YYYY-MM" o "YYYY", para usar como key de React
  etiqueta: string; // ej. "Jun 2026" o "2026"
  ingreso: number;
  gasto: number;
  balance: number;
}

const NOMBRES_MES = [
  "ene", "feb", "mar", "abr", "may", "jun",
  "jul", "ago", "sep", "oct", "nov", "dic",
];

/** Últimos `cantidadMeses` meses (incluyendo el actual), con totales de ingreso/gasto/balance de cada uno. */
export function agruparPorMes(
  transacciones: Transaccion[],
  idCategoriaTransferencia: string | undefined,
  cantidadMeses = 6,
  referencia: Date = new Date()
): ResumenPeriodo[] {
  const meses: ResumenPeriodo[] = [];

  for (let i = cantidadMeses - 1; i >= 0; i--) {
    const fecha = new Date(referencia.getFullYear(), referencia.getMonth() - i, 1);
    const anio = fecha.getFullYear();
    const mes = fecha.getMonth(); // 0-11
    const prefijo = `${anio}-${String(mes + 1).padStart(2, "0")}`;

    let ingreso = 0;
    let gasto = 0;
    for (const t of transacciones) {
      if (!t.fecha.startsWith(prefijo)) continue;
      if (esIngresoReal(t, idCategoriaTransferencia)) ingreso += t.monto;
      else if (esGastoReal(t, idCategoriaTransferencia)) gasto += t.monto;
    }

    meses.push({
      clave: prefijo,
      etiqueta: `${NOMBRES_MES[mes]} ${anio}`,
      ingreso,
      gasto,
      balance: ingreso - gasto,
    });
  }

  return meses;
}

/** Un período por cada año que aparece en los datos (orden ascendente), con totales de ingreso/gasto/balance. */
export function agruparPorAnio(
  transacciones: Transaccion[],
  idCategoriaTransferencia?: string
): ResumenPeriodo[] {
  const totales = new Map<string, { ingreso: number; gasto: number }>();

  for (const t of transacciones) {
    const anio = t.fecha.slice(0, 4);
    if (!totales.has(anio)) totales.set(anio, { ingreso: 0, gasto: 0 });
    const acumulado = totales.get(anio)!;
    if (esIngresoReal(t, idCategoriaTransferencia)) acumulado.ingreso += t.monto;
    else if (esGastoReal(t, idCategoriaTransferencia)) acumulado.gasto += t.monto;
  }

  return [...totales.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([anio, { ingreso, gasto }]) => ({
      clave: anio,
      etiqueta: anio,
      ingreso,
      gasto,
      balance: ingreso - gasto,
    }));
}

export interface ProgresoPresupuesto {
  categoria: Categoria;
  presupuesto: number;
  gastado: number;
  porcentaje: number; // puede superar 100
  excedido: boolean;
}

/** Para cada presupuesto definido, cuánto se gastó en esa categoría durante el mes de `desde` (YYYY-MM-01). */
export function calcularProgresoPresupuestos(
  transacciones: Transaccion[],
  categorias: Categoria[],
  presupuestos: Presupuesto[],
  desde: string,
  idCategoriaTransferencia?: string
): ProgresoPresupuesto[] {
  return presupuestos
    .map((p) => {
      const categoria = categorias.find((c) => c.id === p.categoriaId);
      if (!categoria) return null; // presupuesto de una categoría ya borrada: se ignora
      const gastado = transacciones
        .filter(
          (t) =>
            t.categoriaId === p.categoriaId &&
            esGastoReal(t, idCategoriaTransferencia) &&
            t.fecha >= desde
        )
        .reduce((acc, t) => acc + t.monto, 0);
      const porcentaje = p.montoMensual > 0 ? (gastado / p.montoMensual) * 100 : 0;
      return {
        categoria,
        presupuesto: p.montoMensual,
        gastado,
        porcentaje,
        excedido: gastado > p.montoMensual,
      };
    })
    .filter((x): x is ProgresoPresupuesto => x !== null)
    .sort((a, b) => b.porcentaje - a.porcentaje);
}
