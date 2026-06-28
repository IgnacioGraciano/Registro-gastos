import type { Billetera, Categoria, Presupuesto, Suscripcion, Transaccion } from "./types";

/**
 * Type guards usados al LEER de localStorage. Si el dato fue editado a mano,
 * corrompido, o quedó de una versión vieja del esquema, estas funciones lo
 * filtran en vez de dejar que rompa la app.
 */

function esString(v: unknown): v is string {
  return typeof v === "string";
}

function esNumeroFinito(v: unknown): v is number {
  return typeof v === "number" && Number.isFinite(v);
}

function esBooleano(v: unknown): v is boolean {
  return typeof v === "boolean";
}

/** Valida formato estricto "YYYY-MM-DD" (sin validar calendario, eso lo hace Date). */
function esFechaISO(v: unknown): v is string {
  return esString(v) && /^\d{4}-\d{2}-\d{2}$/.test(v);
}

function esObjeto(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null;
}

export function esTransaccion(v: unknown): v is Transaccion {
  if (!esObjeto(v)) return false;
  return (
    esString(v.id) &&
    esNumeroFinito(v.monto) &&
    (v.tipo === "ingreso" || v.tipo === "gasto") &&
    esString(v.billeteraId) &&
    esString(v.categoriaId) &&
    esString(v.descripcion) &&
    esFechaISO(v.fecha)
  );
}

export function esBilletera(v: unknown): v is Billetera {
  if (!esObjeto(v)) return false;
  return esString(v.id) && esString(v.nombre) && esNumeroFinito(v.saldo);
}

/** Valida que sea un string con forma de color hex, ej "#1FBE82". */
function esColorHex(v: unknown): v is string {
  return esString(v) && /^#[0-9a-fA-F]{6}$/.test(v);
}

export function esCategoria(v: unknown): v is Categoria {
  if (!esObjeto(v)) return false;
  const tieneTipoValido =
    v.tipo === undefined || v.tipo === "gasto" || v.tipo === "ingreso" || v.tipo === "ambos";
  const tieneColorValido = v.color === undefined || esColorHex(v.color);
  return (
    esString(v.id) &&
    esString(v.nombre) &&
    esString(v.icono) &&
    esBooleano(v.esEditable) &&
    tieneTipoValido &&
    tieneColorValido
  );
}

export function esSuscripcion(v: unknown): v is Suscripcion {
  if (!esObjeto(v)) return false;
  return (
    esString(v.id) &&
    esNumeroFinito(v.monto) &&
    esString(v.billeteraId) &&
    esString(v.categoriaId) &&
    (v.frecuencia === "mensual" || v.frecuencia === "anual") &&
    esFechaISO(v.proximoPago)
  );
}

export function esPresupuesto(v: unknown): v is Presupuesto {
  if (!esObjeto(v)) return false;
  return esString(v.id) && esString(v.categoriaId) && esNumeroFinito(v.montoMensual);
}
