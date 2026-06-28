"use client";

import { useState } from "react";
import { ChevronRight, RefreshCw } from "lucide-react";
import SuscripcionesOverlay from "./SuscripcionesOverlay";

export default function SuscripcionesConfigRow() {
  const [abierto, setAbierto] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setAbierto(true)}
        className="ios-press flex w-full items-center gap-3 border-b border-surface-line p-3.5"
      >
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-surface-line text-ink-soft">
          <RefreshCw size={17} />
        </span>
        <span className="flex-1 text-left text-[14px] font-medium text-ink">Suscripciones</span>
        <ChevronRight size={18} className="text-ink-faint" />
      </button>

      <SuscripcionesOverlay abierto={abierto} onCerrar={() => setAbierto(false)} />
    </>
  );
}
