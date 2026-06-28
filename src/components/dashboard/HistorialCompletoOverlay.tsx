"use client";

import { useState } from "react";
import { ChevronLeft } from "lucide-react";
import {
  billeterasRepo,
  categoriasRepo,
  transaccionesRepo,
  useCollection,
  type Transaccion,
} from "@/lib/db";
import MovimientoRow from "./MovimientoRow";
import EditarMovimientoSheet from "./EditarMovimientoSheet";

interface Props {
  abierto: boolean;
  onCerrar: () => void;
  /** Si se pasa, sólo muestra movimientos de esa categoría (ej. al hacer click en un ítem de "Gastos por categoría"). */
  categoriaId?: string;
  /** Título a mostrar cuando hay un filtro activo (ej. el nombre de la categoría). */
  tituloFiltro?: string;
}

export default function HistorialCompletoOverlay({
  abierto,
  onCerrar,
  categoriaId,
  tituloFiltro,
}: Props) {
  const transacciones = useCollection(transaccionesRepo);
  const billeteras = useCollection(billeterasRepo);
  const categorias = useCollection(categoriasRepo);
  const [enEdicion, setEnEdicion] = useState<Transaccion | null>(null);

  if (!abierto) return null;

  const filtradas = categoriaId
    ? transacciones.filter((t) => t.categoriaId === categoriaId)
    : transacciones;

  // Más recientes primero.
  const ordenados = [...filtradas].reverse().sort((a, b) => b.fecha.localeCompare(a.fecha));

  return (
    <div className="absolute inset-0 z-[80] flex flex-col bg-surface-base">
      <header className="flex shrink-0 items-center gap-3 border-b border-surface-line bg-surface-base px-5 pb-3 pt-[calc(var(--safe-top)+14px)]">
        <button
          type="button"
          onClick={onCerrar}
          aria-label="Volver"
          className="ios-press flex h-8 w-8 items-center justify-center rounded-full bg-surface shadow-card"
        >
          <ChevronLeft size={18} className="text-ink" />
        </button>
        <h1 className="text-[17px] font-bold text-ink">
          {tituloFiltro ? `Historial: ${tituloFiltro}` : "Historial completo"}
        </h1>
      </header>

      <div className="no-scrollbar scroll-contenido flex-1 overflow-y-auto px-5 py-4">
        {ordenados.length === 0 ? (
          <p className="py-10 text-center text-[13px] text-ink-faint">
            {categoriaId ? "No hay movimientos en esta categoría." : "Todavía no hay movimientos."}
          </p>
        ) : (
          <>
            <div className="flex flex-col gap-2">
              {ordenados.map((t) => (
                <MovimientoRow
                  key={t.id}
                  transaccion={t}
                  billetera={billeteras.find((b) => b.id === t.billeteraId)}
                  categoria={categorias.find((c) => c.id === t.categoriaId)}
                  onEliminar={() => transaccionesRepo.eliminar(t.id)}
                  onEditar={() => setEnEdicion(t)}
                />
              ))}
            </div>
            <p className="px-1 pb-[calc(var(--safe-bottom)+12px)] pt-3 text-center text-[11.5px] text-ink-faint">
              Tocá un movimiento para editarlo. Deslizá hacia la izquierda para eliminarlo (revierte
              el efecto en el saldo).
            </p>
          </>
        )}
      </div>

      <EditarMovimientoSheet transaccion={enEdicion} onCerrar={() => setEnEdicion(null)} />
    </div>
  );
}
