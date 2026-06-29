"use client";

import { useState } from "react";
import { ChevronRight, Tag } from "lucide-react";
import CategoriasOverlay from "./CategoriasOverlay";

export default function CategoriasConfigRow() {
  const [abierto, setAbierto] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setAbierto(true)}
        className="ios-press flex w-full items-center gap-3 border-b border-surface-line p-3.5"
      >
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-surface-line text-ink-soft">
          <Tag size={17} />
        </span>
        <span className="flex-1 text-left text-[14px] font-medium text-ink">Categorías</span>
        <ChevronRight size={18} className="text-ink-faint" />
      </button>

      <CategoriasOverlay abierto={abierto} onCerrar={() => setAbierto(false)} />
    </>
  );
}
