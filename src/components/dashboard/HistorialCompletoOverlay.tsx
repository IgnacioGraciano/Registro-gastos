"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { ChevronLeft } from "lucide-react";
import {
  billeterasRepo,
  categoriasRepo,
  eliminarMovimiento,
  prestamosRepo,
  transaccionesRepo,
  useCollection,
  NOMBRE_CATEGORIA_PRESTAMO,
  type Prestamo,
  type Transaccion,
} from "@/lib/db";
import { compararRecientePrimero } from "@/lib/db/orden";
import { ID_SIN_CATEGORIA, inicioDeMes } from "@/lib/dashboard";
import MovimientoRow from "./MovimientoRow";
import PrestamoRow from "./PrestamoRow";
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

type ItemHistorial =
  | { tipo: "transaccion"; transaccion: Transaccion; fecha: string; creadoEn?: number }
  | { tipo: "prestamo"; prestamo: Prestamo; fecha: string; creadoEn?: number };

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
  const prestamos = useCollection(prestamosRepo);
  const [enEdicion, setEnEdicion] = useState<Transaccion | null>(null);

  // Se renderiza en `#app-overlays` (igual que BottomSheet) y no en el lugar
  // donde se lo invoca: ahí adentro quedaba posicionado contra el contenido
  // scrolleable, y si la página estaba scrolleada se abría fuera de pantalla.
  const [portalRoot, setPortalRoot] = useState<Element | null>(null);
  useEffect(() => {
    setPortalRoot(document.getElementById("app-overlays"));
  }, []);

  if (!abierto || !portalRoot) return null;

  const desde = desdeHasta?.desde ?? (soloMesActual ? inicioDeMes() : null);
  const hasta = desdeHasta?.hasta ?? null;

  // El capital de un préstamo (prestarlo y recuperarlo) es un movimiento de
  // plata propio, no un ingreso/gasto real: no queda registro en el
  // historial, prestado o ya saldado. Sólo dejan rastro la ganancia o la
  // pérdida real de un préstamo (categorías separadas, sin excluir acá).
  const idCategoriaPrestamo = categoriasRepo
    .getAll()
    .find((c) => c.nombre === NOMBRE_CATEGORIA_PRESTAMO)?.id;

  const transaccionesFiltradas = transacciones.filter((t) => {
    if (idCategoriaPrestamo && t.categoriaId === idCategoriaPrestamo) return false;
    if (categoriaId === ID_SIN_CATEGORIA) {
      // "Sin categoría": movimientos cuya categoría fue eliminada.
      if (categorias.some((c) => c.id === t.categoriaId)) return false;
    } else if (categoriaId && t.categoriaId !== categoriaId) {
      return false;
    }
    if (desde && t.fecha < desde) return false;
    if (hasta && t.fecha > hasta) return false;
    return true;
  });

  const prestamosFiltrados = categoriaId
    ? []
    : prestamos.filter((p) => {
        if (prestamosRepo.montoPendiente(p) <= 0) return false;
        if (desde && p.fecha < desde) return false;
        if (hasta && p.fecha > hasta) return false;
        return true;
      });

  const items: ItemHistorial[] = [
    ...transaccionesFiltradas.map((t) => ({
      tipo: "transaccion" as const,
      transaccion: t,
      fecha: t.fecha,
      creadoEn: t.creadoEn,
    })),
    ...prestamosFiltrados.map((p) => ({
      tipo: "prestamo" as const,
      prestamo: p,
      fecha: p.fecha,
      creadoEn: p.creadoEn,
    })),
  ].sort(compararRecientePrimero);

  return createPortal(
    <div className="pointer-events-auto absolute inset-0 z-[80] flex flex-col bg-surface-base">
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
        {items.length === 0 ? (
          <p className="py-10 text-center text-[13px] text-ink-faint">
            {categoriaId ? "No hay movimientos en este período." : "Todavía no hay movimientos."}
          </p>
        ) : (
          <>
            <div className="flex flex-col gap-2">
              {items.map((item) =>
                item.tipo === "prestamo" ? (
                  <PrestamoRow
                    key={`prestamo-${item.prestamo.id}`}
                    prestamo={item.prestamo}
                    billetera={billeteras.find((b) => b.id === item.prestamo.billeteraId)}
                  />
                ) : (
                  <MovimientoRow
                    key={item.transaccion.id}
                    transaccion={item.transaccion}
                    billetera={billeteras.find((b) => b.id === item.transaccion.billeteraId)}
                    categoria={categorias.find((c) => c.id === item.transaccion.categoriaId)}
                    onEliminar={() => eliminarMovimiento(item.transaccion.id)}
                    onEditar={() => setEnEdicion(item.transaccion)}
                  />
                )
              )}
            </div>
            <p className="px-1 pb-[calc(var(--tabbar-height)+var(--safe-bottom)+8px)] pt-3 text-center text-[11.5px] text-ink-faint">
              Tocá un movimiento para editarlo. Deslizá hacia la izquierda para eliminarlo.
            </p>
          </>
        )}
      </div>

      <EditarMovimientoSheet transaccion={enEdicion} onCerrar={() => setEnEdicion(null)} />
    </div>,
    portalRoot
  );
}
