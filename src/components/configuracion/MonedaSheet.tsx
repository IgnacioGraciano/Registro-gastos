"use client";

import { Check } from "lucide-react";
import { actualizarMoneda, useMoneda } from "@/lib/db";
import { MONEDAS_DISPONIBLES } from "@/lib/format";
import BottomSheet from "@/components/BottomSheet";

interface Props {
  abierto: boolean;
  onCerrar: () => void;
}

export default function MonedaSheet({ abierto, onCerrar }: Props) {
  const monedaActual = useMoneda();

  return (
    <BottomSheet abierto={abierto} onCerrar={onCerrar} titulo="Moneda">
      <div className="flex flex-col gap-2">
        {MONEDAS_DISPONIBLES.map((m) => {
          const activa = m.codigo === monedaActual;
          return (
            <button
              key={m.codigo}
              type="button"
              onClick={() => {
                actualizarMoneda(m.codigo);
                onCerrar();
              }}
              className={`ios-press flex items-center gap-3 rounded-ios p-3.5 shadow-card ${
                activa ? "bg-brand text-white" : "bg-surface text-ink"
              }`}
            >
              <span
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[13px] font-bold ${
                  activa ? "bg-white/15" : "bg-surface-line"
                }`}
              >
                {m.simbolo}
              </span>
              <div className="flex-1 text-left">
                <p className="text-[14px] font-medium">{m.nombre}</p>
                <p className={`text-[12px] ${activa ? "text-white/60" : "text-ink-faint"}`}>
                  {m.codigo}
                </p>
              </div>
              {activa && <Check size={18} />}
            </button>
          );
        })}
      </div>
    </BottomSheet>
  );
}
