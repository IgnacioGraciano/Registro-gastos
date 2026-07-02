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
import { inicioDeMes } from "@/lib/dashboard";
import MovimientoRow from "./MovimientoRow";
import EditarMovimientoSheet from "./EditarMovimientoSheet";

interface Props {
  abierto: boolean;
  onCerrar: () => void;
  categoriaId?: string;
  tituloFiltro?: string;
  /** Si true, filtra sólo los movimientos del mes actual. */
  soloMesActual?: boolean;
  /** Rango explícito de fechas (para Estadísticas: filtra el período seleccionado). */
  desdeHasta?: { desde: string; hasta: string };
}

export default function HistorialCompletoOverlay({
  abierto,
  onCerrar,
  categoriaId,
  tituloFiltro,
  soloMesActual,
  desdeHasta,
}: Props) {
  const transacciones = useCollection(transaccionesRepo);
  const billeteras = useCollection(billeterasRepo);
  const categorias = useCollection(categoriasRepo);
  const [enEdicion, setEnEdicion] = useState<Transaccion | null>(null);

  if (!abierto) return null;

  const desde = desdeHasta?.desde ?? (soloMesActual ? inicioDeMes() : null);
  const hasta = desdeHasta?.hasta ?? null;

  const filtradas = transacciones.filter((t) => {
    if (categoriaId && t.categoriaId !== categoriaId) return false;
    if (desde && t.fecha < desde) return false;
    if (hasta && t.fecha > hasta) return false;
    return true;
  });

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
            {categoriaId ? "No hay movimientos en este período." : "Todavía no hay movimientos."}
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
            <p className="px-1 pb-[calc(var(--tabbar-height)+var(--safe-bottom)+8px)] pt-3 text-center text-[11.5px] text-ink-faint">
              Tocá un movimiento para editarlo. Deslizá hacia la izquierda para eliminarlo.
            </p>
          </>
        )}
      </div>

      <EditarMovimientoSheet transaccion={enEdicion} onCerrar={() => setEnEdicion(null)} />
    </div>
  );
}
