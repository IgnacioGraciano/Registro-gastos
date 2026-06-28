"use client";

import { Trash2 } from "lucide-react";
import type { Billetera, Categoria, Transaccion } from "@/lib/db";
import { useMoneda } from "@/lib/db";
import { formatMonto, formatFechaRelativa } from "@/lib/format";
import { obtenerIconoCategoria } from "@/lib/icons";

interface Props {
  transaccion: Transaccion;
  billetera: Billetera | undefined;
  categoria: Categoria | undefined;
  onEliminar: () => void;
  onEditar: () => void;
}

const ANCHO_ACCION = 76; // px

/**
 * Igual patrón que SuscripcionRow: scroll-snap nativo, deslizar a la
 * IZQUIERDA revela la acción de eliminar a la derecha (mismo sentido en
 * toda la app). Tocar el contenido (sin deslizar) abre la edición del
 * movimiento.
 */
export default function MovimientoRow({ transaccion, billetera, categoria, onEliminar, onEditar }: Props) {
  const moneda = useMoneda();
  const Icono = categoria ? obtenerIconoCategoria(categoria.icono) : null;
  const esIngreso = transaccion.tipo === "ingreso";
  const titulo = transaccion.descripcion.trim() || categoria?.nombre || "Movimiento";

  return (
    <div className="relative overflow-hidden rounded-ios bg-surface shadow-card">
      <div
        className="no-scrollbar overflow-x-auto"
        style={{ scrollSnapType: "x mandatory", containerType: "inline-size" } as React.CSSProperties}
      >
        <div className="flex w-max">
          {/* Contenido: tocar abre edición */}
          <button
            type="button"
            onClick={onEditar}
            className="flex shrink-0 items-center gap-3 p-3 text-left"
            style={{ width: "100cqw", scrollSnapAlign: "start" } as React.CSSProperties}
          >
            <span
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
                esIngreso ? "bg-accent-soft text-accent" : "bg-expense-soft text-expense"
              }`}
            >
              {Icono ? <Icono size={18} /> : null}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[14px] font-medium text-ink">{titulo}</p>
              <p className="truncate text-[12px] text-ink-faint">
                {billetera?.nombre ?? "—"} · {formatFechaRelativa(transaccion.fecha)}
              </p>
            </div>
            <p
              className={`figure-amount shrink-0 text-[14px] font-semibold ${
                esIngreso ? "text-accent" : "text-expense"
              }`}
            >
              {esIngreso ? "+" : "-"}
              {formatMonto(transaccion.monto, moneda)}
            </p>
          </button>

          {/* Acción de eliminar: oculta a la derecha, se revela deslizando a la izquierda */}
          <button
            type="button"
            onClick={onEliminar}
            aria-label={`Eliminar movimiento ${titulo}`}
            className="flex shrink-0 items-center justify-center bg-expense text-white"
            style={{ width: `${ANCHO_ACCION}px`, scrollSnapAlign: "end" } as React.CSSProperties}
          >
            <Trash2 size={20} />
          </button>
        </div>
      </div>
    </div>
  );
}
