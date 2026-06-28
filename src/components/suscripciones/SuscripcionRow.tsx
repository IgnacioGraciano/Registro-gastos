"use client";

import { Trash2 } from "lucide-react";
import type { Billetera, Categoria, Suscripcion } from "@/lib/db";
import { useMoneda } from "@/lib/db";
import { formatMonto, formatFechaRelativa } from "@/lib/format";
import { obtenerIconoCategoria } from "@/lib/icons";

interface Props {
  suscripcion: Suscripcion;
  billetera: Billetera | undefined;
  categoria: Categoria | undefined;
  onEliminar: () => void;
}

const ANCHO_ACCION = 76; // px

/**
 * Fila deslizable estilo iOS. En vez de manejar el gesto a mano con
 * pointer events (frágil: hay que distinguir swipe horizontal de scroll
 * vertical, manejar inercia, etc.), se usa scroll-snap nativo: la fila es
 * en sí un mini-carrusel horizontal con dos "páginas" (contenido / acción
 * eliminar). El navegador se encarga de toda la física del gesto.
 */
export default function SuscripcionRow({ suscripcion, billetera, categoria, onEliminar }: Props) {
  const Icono = categoria ? obtenerIconoCategoria(categoria.icono) : null;
  const moneda = useMoneda();

  return (
    <div className="relative overflow-hidden rounded-ios bg-surface shadow-card">
      <div
        className="no-scrollbar overflow-x-auto"
        style={{ scrollSnapType: "x mandatory", containerType: "inline-size" } as React.CSSProperties}
      >
        <div className="flex w-max">
          {/* Página 1: contenido de la suscripción */}
          <div
            className="flex shrink-0 items-center gap-3 p-3"
            style={{ width: "100cqw", scrollSnapAlign: "start" } as React.CSSProperties}
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gold-soft text-gold">
              {Icono ? <Icono size={18} /> : null}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[14px] font-medium text-ink">{suscripcion.nombre}</p>
              <p className="truncate text-[12px] text-ink-faint">
                {billetera?.nombre ?? "—"} · Próximo: {formatFechaRelativa(suscripcion.proximoPago)}
              </p>
            </div>
            <p className="figure-amount shrink-0 text-[14px] font-semibold text-expense">
              {formatMonto(suscripcion.monto, moneda)}
            </p>
          </div>

          {/* Página 2: acción de eliminar, revelada al deslizar a la izquierda */}
          <button
            type="button"
            onClick={onEliminar}
            aria-label={`Eliminar suscripción ${suscripcion.nombre}`}
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
