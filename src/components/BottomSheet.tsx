"use client";

import { X } from "lucide-react";
import type { ReactNode } from "react";

interface Props {
  abierto: boolean;
  onCerrar: () => void;
  titulo: string;
  children: ReactNode;
  /**
   * Si se pasa, se renderiza FIJO abajo de la hoja, fuera del área con
   * scroll. Es para el botón de acción principal (Crear/Guardar): así nunca
   * queda "escondido" al final de una lista larga, y nunca lo afecta el
   * rebote elástico del scroll al soltar el dedo cerca del borde.
   */
  footer?: ReactNode;
}

/** Hoja inferior estándar: fondo oscuro + panel que sube desde abajo, con título, contenido scrolleable y footer fijo opcional. */
export default function BottomSheet({ abierto, onCerrar, titulo, children, footer }: Props) {
  if (!abierto) return null;

  return (
    <div className="absolute inset-0 z-[70] flex flex-col justify-end">
      <button
        type="button"
        aria-label="Cerrar"
        onClick={onCerrar}
        className="absolute inset-0 bg-brand/40 backdrop-blur-[2px]"
      />

      <div className="relative z-10 flex max-h-[88%] flex-col animate-slide-up rounded-t-[28px] bg-surface-base shadow-2xl">
        <div className="flex shrink-0 items-center justify-between p-5 pb-4">
          <h2 className="text-[17px] font-bold text-ink">{titulo}</h2>
          <button
            type="button"
            onClick={onCerrar}
            aria-label="Cerrar"
            className="ios-press flex h-8 w-8 items-center justify-center rounded-full bg-surface-line text-ink-soft"
          >
            <X size={16} />
          </button>
        </div>

        <div
          className={`scroll-contenido min-h-0 flex-1 overflow-y-auto px-5 ${
            footer ? "pb-4" : "pb-[calc(var(--safe-bottom)+20px)]"
          }`}
        >
          {children}
        </div>

        {footer && (
          <div className="shrink-0 border-t border-surface-line px-5 pb-[calc(var(--safe-bottom)+16px)] pt-3">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
