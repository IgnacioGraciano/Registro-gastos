"use client";

import { useState } from "react";
import {
  categoriasRepo,
  transaccionesRepo,
  useCollection,
  useMoneda,
  NOMBRE_CATEGORIA_TRANSFERENCIA,
} from "@/lib/db";
import { agruparPorAnio, agruparPorMes } from "@/lib/dashboard";
import GraficoComparativo from "@/components/estadisticas/GraficoComparativo";
import PresupuestosSection from "@/components/estadisticas/PresupuestosSection";

export default function EstadisticasPage() {
  const categorias = useCollection(categoriasRepo);
  const transacciones = useCollection(transaccionesRepo);
  const moneda = useMoneda();
  const [vista, setVista] = useState<"mensual" | "anual">("mensual");

  const idTransferencia = categorias.find((c) => c.nombre === NOMBRE_CATEGORIA_TRANSFERENCIA)?.id;

  const periodos =
    vista === "mensual"
      ? agruparPorMes(transacciones, idTransferencia, 6)
      : agruparPorAnio(transacciones, idTransferencia);

  return (
    <div className="flex flex-col gap-6 px-5 pb-4 pt-[calc(var(--safe-top)+16px)]">
      <header className="flex items-center justify-between">
        <h1 className="font-display text-[22px] font-semibold tracking-tight text-ink">
          Estadísticas
        </h1>

        {/* Toggle Mensual / Anual */}
        <div className="relative flex rounded-full bg-surface p-1 shadow-card">
          <div
            className={`absolute inset-y-1 left-1 w-[58px] rounded-full bg-surface-line transition-transform duration-200 ease-ios ${
              vista === "anual" ? "translate-x-[58px]" : "translate-x-0"
            }`}
          />
          <button
            type="button"
            onClick={() => setVista("mensual")}
            className={`ios-press relative z-10 w-[58px] py-1.5 text-[12px] font-semibold ${
              vista === "mensual" ? "text-ink" : "text-ink-faint"
            }`}
          >
            Mensual
          </button>
          <button
            type="button"
            onClick={() => setVista("anual")}
            className={`ios-press relative z-10 w-[58px] py-1.5 text-[12px] font-semibold ${
              vista === "anual" ? "text-ink" : "text-ink-faint"
            }`}
          >
            Anual
          </button>
        </div>
      </header>

      <section className="rounded-ios-lg bg-surface p-4 shadow-card">
        <div className="mb-3 flex items-center gap-3">
          <span className="flex items-center gap-1.5 text-[12px] text-ink-faint">
            <span className="h-2 w-2 rounded-full bg-accent" /> Ingreso
          </span>
          <span className="flex items-center gap-1.5 text-[12px] text-ink-faint">
            <span className="h-2 w-2 rounded-full bg-expense" /> Gasto
          </span>
        </div>
        {periodos.length === 0 ? (
          <p className="py-10 text-center text-[13px] text-ink-faint">Todavía no hay datos.</p>
        ) : (
          <GraficoComparativo
            key={vista}
            periodos={periodos}
            moneda={moneda}
            transacciones={transacciones}
            categorias={categorias}
            idCategoriaTransferencia={idTransferencia}
          />
        )}
      </section>

      <PresupuestosSection />
    </div>
  );
}
