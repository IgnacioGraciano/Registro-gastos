import { billeterasRepo } from "./billeteras";
import { categoriasRepo } from "./categorias";
import { transaccionesRepo } from "./transacciones";
import { generarId } from "./uuid";
import { NOMBRE_CATEGORIA_TRANSFERENCIA } from "./seed";
import type { Transaccion } from "./types";
import { hoyISO } from "@/lib/format";

function idCategoriaTransferencia(): string | undefined {
  return categoriasRepo.getAll().find((c) => c.nombre === NOMBRE_CATEGORIA_TRANSFERENCIA)?.id;
}

/**
 * Transfiere saldo de una billetera a otra. No es una entidad nueva: genera
 * dos Transacciones (un "gasto" en origen y un "ingreso" en destino, ambas
 * con la categoría de sistema "Transferencia"), reutilizando el mismo
 * mecanismo que ya sincroniza los saldos automáticamente. Así la operación
 * queda trazable en el historial de ambas billeteras.
 *
 * Las dos patas comparten un `transferenciaId` para poder editarlas o
 * borrarlas siempre juntas (ver `eliminarMovimiento` / `actualizarTransferencia`).
 */
export function registrarTransferencia(
  origenId: string,
  destinoId: string,
  monto: number
): void {
  if (origenId === destinoId) {
    throw new Error("Elegí dos billeteras distintas para transferir.");
  }
  if (!Number.isFinite(monto) || monto <= 0) {
    throw new Error("El monto a transferir debe ser mayor a 0.");
  }

  const origen = billeterasRepo.getById(origenId);
  const destino = billeterasRepo.getById(destinoId);
  if (!origen) throw new Error("La billetera de origen no existe.");
  if (!destino) throw new Error("La billetera de destino no existe.");

  const categoriaId = idCategoriaTransferencia();
  if (!categoriaId) {
    // No debería pasar: inicializarDatosBase() la crea siempre. Mensaje defensivo por si igual ocurre.
    throw new Error("No se encontró la categoría de transferencias. Reiniciá la app e intentá de nuevo.");
  }

  const fecha = hoyISO();
  const transferenciaId = generarId();

  transaccionesRepo.crear({
    monto,
    tipo: "gasto",
    billeteraId: origen.id,
    categoriaId,
    descripcion: `Transferencia a ${destino.nombre}`,
    fecha,
    transferenciaId,
  });

  transaccionesRepo.crear({
    monto,
    tipo: "ingreso",
    billeteraId: destino.id,
    categoriaId,
    descripcion: `Transferencia desde ${origen.nombre}`,
    fecha,
    transferenciaId,
  });
}

/** True si el movimiento es una de las dos patas de una transferencia entre cuentas. */
export function esTransferencia(t: Transaccion): boolean {
  if (t.transferenciaId) return true;
  const categoriaId = idCategoriaTransferencia();
  return categoriaId !== undefined && t.categoriaId === categoriaId;
}

/**
 * Devuelve la otra pata de una transferencia, o undefined si no se puede
 * identificar con seguridad.
 *
 * Las transferencias nuevas se emparejan por `transferenciaId`. Las viejas
 * (creadas antes de que existiera ese campo) se emparejan por coincidencia:
 * misma categoría, mismo monto y fecha, tipo opuesto, otra cuenta, y creadas
 * una inmediatamente después de la otra.
 */
export function buscarParTransferencia(t: Transaccion): Transaccion | undefined {
  const todas = transaccionesRepo.getAll();

  if (t.transferenciaId) {
    return todas.find((o) => o.id !== t.id && o.transferenciaId === t.transferenciaId);
  }

  const categoriaId = idCategoriaTransferencia();
  if (!categoriaId || t.categoriaId !== categoriaId) return undefined;

  const indicePropio = todas.findIndex((o) => o.id === t.id);
  let mejor: Transaccion | undefined;
  let mejorDistancia = Infinity;

  todas.forEach((o, indice) => {
    if (o.id === t.id || o.transferenciaId) return;
    if (o.categoriaId !== categoriaId || o.tipo === t.tipo) return;
    if (o.monto !== t.monto || o.fecha !== t.fecha || o.billeteraId === t.billeteraId) return;

    let distancia: number;
    if (t.creadoEn !== undefined && o.creadoEn !== undefined) {
      distancia = Math.abs(t.creadoEn - o.creadoEn);
      if (distancia > 2000) return; // las dos patas se crean en el mismo instante
    } else if (t.creadoEn === undefined && o.creadoEn === undefined) {
      distancia = Math.abs(indice - indicePropio);
      if (distancia !== 1) return; // se guardan una pegada a la otra
    } else {
      return;
    }

    if (distancia < mejorDistancia) {
      mejor = o;
      mejorDistancia = distancia;
    }
  });

  return mejor;
}

/**
 * Elimina un movimiento del historial. Si es una pata de una transferencia,
 * elimina también la otra: borrar una sola dejaría plata "desaparecida" de
 * una cuenta sin que vuelva a la otra.
 */
export function eliminarMovimiento(id: string): boolean {
  const transaccion = transaccionesRepo.getById(id);
  if (!transaccion) return false;
  const par = esTransferencia(transaccion) ? buscarParTransferencia(transaccion) : undefined;
  const eliminada = transaccionesRepo.eliminar(id);
  if (eliminada && par) transaccionesRepo.eliminar(par.id);
  return eliminada;
}

/** Cambia el monto y/o la fecha de una transferencia, aplicándolo a sus dos patas a la vez. */
export function actualizarTransferencia(id: string, cambios: { monto: number; fecha: string }): void {
  const transaccion = transaccionesRepo.getById(id);
  if (!transaccion) throw new Error("No se encontró el movimiento.");
  const par = buscarParTransferencia(transaccion);

  // Se valida todo ANTES de tocar nada, para no dejar una pata actualizada y la otra no.
  for (const pata of par ? [transaccion, par] : [transaccion]) {
    if (!billeterasRepo.getById(pata.billeteraId)) {
      throw new Error("Una de las cuentas de esta transferencia ya no existe: no se puede editar, sólo eliminar.");
    }
  }

  transaccionesRepo.actualizar(transaccion.id, cambios);
  if (par) transaccionesRepo.actualizar(par.id, cambios);
}
