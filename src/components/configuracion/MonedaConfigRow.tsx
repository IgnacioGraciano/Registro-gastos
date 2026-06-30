"use client";

import { useState } from "react";
import { Banknote, ChevronRight } from "lucide-react";
import { useMoneda } from "@/lib/db";
import MonedaSheet from "./MonedaSheet";

export default function MonedaConfigRow() {
  const moneda = useMoneda();
  const [abierto, setAbierto] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setAbierto(true)}
        className="ios-press flex w-full items-center gap-3 border-b border-surface-line p-3.5"
      >
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-surface-line text-ink-soft">
          <Banknote size={17} />
        </span>
        <span className="flex-1 text-left text-[14px] font-medium text-ink">Moneda</span>
        <span className="text-[13px] text-ink-faint">{moneda}</span>
        <ChevronRight size={18} className="text-ink-faint" />
      </button>

      <MonedaSheet abierto={abierto} onCerrar={() => setAbierto(false)} />
    </>
  );
}
