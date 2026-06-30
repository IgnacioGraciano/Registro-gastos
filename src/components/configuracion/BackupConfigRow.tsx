"use client";

import { useState } from "react";
import { ChevronRight, Download } from "lucide-react";
import BackupSheet from "./BackupSheet";

export default function BackupConfigRow() {
  const [abierto, setAbierto] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setAbierto(true)}
        className="ios-press flex w-full items-center gap-3 p-3.5"
      >
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-surface-line text-ink-soft">
          <Download size={17} />
        </span>
        <span className="flex-1 text-left text-[14px] font-medium text-ink">Exportar / Importar datos</span>
        <ChevronRight size={18} className="text-ink-faint" />
      </button>

      <BackupSheet abierto={abierto} onCerrar={() => setAbierto(false)} />
    </>
  );
}
