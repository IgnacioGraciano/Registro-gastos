export type Moneda = "ARS" | "USD" | "EUR";

export const MONEDAS_DISPONIBLES: { codigo: Moneda; nombre: string; simbolo: string }[] = [
  { codigo: "ARS", nombre: "Peso argentino", simbolo: "$" },
  { codigo: "USD", nombre: "Dólar estadounidense", simbolo: "US$" },
  { codigo: "EUR", nombre: "Euro", simbolo: "€" },
];

/**
 * Formatea un monto según la moneda elegida en Configuración. Se mantiene
 * siempre el formato numérico "es-AR" (separador de miles con punto) para
 * que la app se vea consistente sin importar la moneda activa; lo único
 * que cambia es el código/símbolo de moneda.
 */
export function formatMonto(amount: number, moneda: Moneda = "ARS"): string {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: moneda,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDateShort(date: Date): string {
  return new Intl.DateTimeFormat("es-AR", {
    day: "2-digit",
    month: "short",
  }).format(date);
}

/** Convierte una fecha "YYYY-MM-DD" a "Hoy", "Ayer", o "dd mmm" según corresponda. */
export function formatFechaRelativa(fechaISO: string): string {
  const hoy = hoyISO();
  if (fechaISO === hoy) return "Hoy";
  if (fechaISO === ayerISO()) return "Ayer";

  const [anio, mes, dia] = fechaISO.split("-").map(Number);
  return formatDateShort(new Date(anio, mes - 1, dia));
}

/** Fecha de hoy en formato "YYYY-MM-DD", en huso horario LOCAL (no UTC). */
export function hoyISO(): string {
  const hoy = new Date();
  const anio = hoy.getFullYear();
  const mes = String(hoy.getMonth() + 1).padStart(2, "0");
  const dia = String(hoy.getDate()).padStart(2, "0");
  return `${anio}-${mes}-${dia}`;
}

/** Fecha de ayer en formato "YYYY-MM-DD", en huso horario LOCAL. */
export function ayerISO(): string {
  const ayer = new Date();
  ayer.setDate(ayer.getDate() - 1);
  const anio = ayer.getFullYear();
  const mes = String(ayer.getMonth() + 1).padStart(2, "0");
  const dia = String(ayer.getDate()).padStart(2, "0");
  return `${anio}-${mes}-${dia}`;
}
