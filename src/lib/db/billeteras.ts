import { createCollection } from "./collection";
import { esBilletera } from "./validators";
import type { Billetera } from "./types";

const KEY = "billeteras";
const base = createCollection<Billetera>(KEY, esBilletera);

export const billeterasRepo = {
  ...base,

  /** Crea una billetera nueva con saldo inicial (0 por defecto). */
  crear(nombre: string, saldoInicial = 0): Billetera {
    const nombreLimpio = nombre.trim();
    if (!nombreLimpio) {
      throw new Error("El nombre de la billetera no puede estar vacío.");
    }
    if (!Number.isFinite(saldoInicial)) {
      throw new Error("El saldo inicial debe ser un número válido.");
    }
    return base.create({ nombre: nombreLimpio, saldo: saldoInicial });
  },

  /** Renombra una billetera existente. */
  renombrar(id: string, nombre: string): Billetera | null {
    const nombreLimpio = nombre.trim();
    if (!nombreLimpio) {
      throw new Error("El nombre de la billetera no puede estar vacío.");
    }
    return base.update(id, { nombre: nombreLimpio });
  },

  /**
   * Suma (o resta, pasando un valor negativo) un monto al saldo actual.
   * La usan internamente las transacciones para mantener el saldo siempre
   * sincronizado; también se puede usar para una corrección manual.
   */
  ajustarSaldo(id: string, delta: number): Billetera | null {
    if (!Number.isFinite(delta)) {
      throw new Error("El ajuste de saldo debe ser un número válido.");
    }
    const actual = base.getById(id);
    if (!actual) return null;
    // Redondeo a 2 decimales para evitar errores de punto flotante (0.1 + 0.2 ...).
    const nuevoSaldo = Math.round((actual.saldo + delta) * 100) / 100;
    return base.update(id, { saldo: nuevoSaldo });
  },

  /**
   * Fija el saldo de una billetera a un valor exacto, SIN generar ninguna
   * Transacción. Se usa desde Configuración > Cuentas para corregir un saldo
   * a mano (ej. al crear la app, o por un desajuste) sin que eso quede
   * mezclado con el historial de movimientos reales.
   */
  establecerSaldo(id: string, nuevoSaldo: number): Billetera | null {
    if (!Number.isFinite(nuevoSaldo)) {
      throw new Error("El saldo debe ser un número válido.");
    }
    return base.update(id, { saldo: Math.round(nuevoSaldo * 100) / 100 });
  },

  eliminar(id: string): boolean {
    return base.remove(id);
  },
};
