"use client";

import { useState } from "react";
import { Clock } from "lucide-react";
import HistorialCompletoOverlay from "./HistorialCompletoOverlay";

export default function HistorialButton() {
  const [abierto, setAbierto] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setAbierto(true)}
        aria-label="Ver historial completo"
        className="ios-press flex h-9 w-9 items-center justify-center rounded-full bg-surface text-ink-soft shadow-card"
      >
        <Clock size={17} />
      </button>

      <HistorialCompletoOverlay abierto={abierto} onCerrar={() => setAbierto(false)} />
    </>
  );
}
