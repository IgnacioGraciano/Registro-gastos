"use client";

import { X } from "lucide-react";
import type { ReactNode } from "react";

interface Props {
  abierto: boolean;
  onCerrar: () => void;
  titulo: string;
  children: ReactNode;
}

/** Hoja inferior estándar: fondo oscuro + panel que sube desde abajo, con título y botón de cerrar. */
export default function BottomSheet({ abierto, onCerrar, titulo, children }: Props) {
  if (!abierto) return null;

  return (
    <div className="absolute inset-0 z-[70] flex flex-col justify-end">
      <button
        type="button"
        aria-label="Cerrar"
        onClick={onCerrar}
        className="absolute inset-0 bg-brand/40 backdrop-blur-[2px]"
      />

      <div className="relative z-10 max-h-[88%] animate-slide-up scroll-contenido overflow-y-auto rounded-t-[28px] bg-surface-base p-5 pb-[calc(var(--safe-bottom)+20px)] shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
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

        {children}
      </div>
    </div>
  );
}
