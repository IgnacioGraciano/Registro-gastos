import { billeterasRepo } from "./billeteras";
import { categoriasRepo } from "./categorias";
import { transaccionesRepo } from "./transacciones";
import { NOMBRE_CATEGORIA_TRANSFERENCIA } from "./seed";
import { hoyISO } from "@/lib/format";

/**
 * Transfiere saldo de una billetera a otra. No es una entidad nueva: genera
 * dos Transacciones (un "gasto" en origen y un "ingreso" en destino, ambas
 * con la categoría de sistema "Transferencia"), reutilizando el mismo
 * mecanismo que ya sincroniza los saldos automáticamente. Así la operación
 * queda trazable en el historial de ambas billeteras.
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

  const categoriaTransferencia = categoriasRepo
    .getAll()
    .find((c) => c.nombre === NOMBRE_CATEGORIA_TRANSFERENCIA);
  if (!categoriaTransferencia) {
    // No debería pasar: inicializarDatosBase() la crea siempre. Mensaje defensivo por si igual ocurre.
    throw new Error("No se encontró la categoría de transferencias. Reiniciá la app e intentá de nuevo.");
  }

  const fecha = hoyISO();

  transaccionesRepo.crear({
    monto,
    tipo: "gasto",
    billeteraId: origen.id,
    categoriaId: categoriaTransferencia.id,
    descripcion: `Transferencia a ${destino.nombre}`,
    fecha,
  });

  transaccionesRepo.crear({
    monto,
    tipo: "ingreso",
    billeteraId: destino.id,
    categoriaId: categoriaTransferencia.id,
    descripcion: `Transferencia desde ${origen.nombre}`,
    fecha,
  });
}
