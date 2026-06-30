"use client";

import { useState } from "react";
import { ChevronLeft, Plus } from "lucide-react";
import { billeterasRepo, categoriasRepo, suscripcionesRepo, useCollection, useMoneda } from "@/lib/db";
import { formatMonto } from "@/lib/format";
import SuscripcionRow from "@/components/suscripciones/SuscripcionRow";
import NuevaSuscripcionModal from "@/components/suscripciones/NuevaSuscripcionModal";

interface Props {
  abierto: boolean;
  onCerrar: () => void;
}

export default function SuscripcionesOverlay({ abierto, onCerrar }: Props) {
  const suscripciones = useCollection(suscripcionesRepo);
  const billeteras = useCollection(billeterasRepo);
  const categorias = useCollection(categoriasRepo);
  const moneda = useMoneda();
  const [modalAbierto, setModalAbierto] = useState(false);

  if (!abierto) return null;

  // Promedio mensual "justo": las anuales se amortizan /12, así no se mezclan peras con manzanas.
  const promedioMensual = suscripciones.reduce(
    (acc, s) => acc + (s.frecuencia === "anual" ? s.monto / 12 : s.monto),
    0
  );

  const ordenadasPorProximoPago = [...suscripciones].sort((a, b) =>
    a.proximoPago.localeCompare(b.proximoPago)
  );

  return (
    <div className="absolute inset-0 z-[80] flex flex-col bg-surface-base">
      <header className="flex shrink-0 items-center gap-3 border-b border-surface-line bg-surface-base px-5 pb-3 pt-[calc(var(--safe-top)+14px)]">
        <button
          type="button"
          onClick={onCerrar}
          aria-label="Volver"
          className="ios-press flex h-8 w-8 items-center justify-center rounded-full bg-surface shadow-card"
        >
          <ChevronLeft size={18} className="text-ink" />
        </button>
        <h1 className="flex-1 text-[17px] font-bold text-ink">Suscripciones</h1>
        <button
          type="button"
          onClick={() => setModalAbierto(true)}
          aria-label="Nueva suscripción"
          className="ios-press flex h-9 w-9 items-center justify-center rounded-full bg-brand text-white shadow-card"
        >
          <Plus size={18} />
        </button>
      </header>

      <div className="no-scrollbar scroll-contenido flex-1 overflow-y-auto px-5 py-4">
        <section className="mb-5 rounded-ios-lg bg-surface p-4 shadow-card">
          <p className="text-[13px] text-ink-faint">Promedio mensual comprometido</p>
          <p className="figure-amount mt-1 text-[28px] font-semibold text-expense">
            {formatMonto(promedioMensual, moneda)}
          </p>
          <p className="mt-0.5 text-[11.5px] text-ink-faint">
            Las suscripciones anuales se prorratean en 12 cuotas para este cálculo.
          </p>
        </section>

        <section className="flex flex-col gap-2">
          {ordenadasPorProximoPago.length === 0 ? (
            <div className="rounded-ios bg-surface p-5 text-center shadow-card">
              <p className="text-[13px] text-ink-faint">Todavía no tenés suscripciones cargadas.</p>
            </div>
          ) : (
            ordenadasPorProximoPago.map((s) => (
              <SuscripcionRow
                key={s.id}
                suscripcion={s}
                billetera={billeteras.find((b) => b.id === s.billeteraId)}
                categoria={categorias.find((c) => c.id === s.categoriaId)}
                onEliminar={() => suscripcionesRepo.eliminar(s.id)}
              />
            ))
          )}
        </section>

        {ordenadasPorProximoPago.length > 0 && (
          <p className="mb-[calc(var(--tabbar-height)+var(--safe-bottom)+8px)] mt-2 px-1 text-center text-[11.5px] text-ink-faint">
            Deslizá una suscripción hacia la izquierda para eliminarla.
          </p>
        )}
      </div>

      <NuevaSuscripcionModal abierto={modalAbierto} onCerrar={() => setModalAbierto(false)} />
    </div>
  );
}
