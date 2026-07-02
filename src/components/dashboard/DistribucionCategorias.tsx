"use client";

import { useState } from "react";
import {
  categoriasRepo,
  transaccionesRepo,
  useCollection,
  useMoneda,
  NOMBRE_CATEGORIA_TRANSFERENCIA,
} from "@/lib/db";
import { agruparPorCategoria, inicioDeMes } from "@/lib/dashboard";
import { formatMonto } from "@/lib/format";
import { obtenerIconoCategoria } from "@/lib/icons";
import { obtenerColorCategoria } from "@/lib/categoria-filtros";
import { useCategoriasOrdenadas } from "@/lib/useCategoriasOrdenadas";
import HistorialCompletoOverlay from "./HistorialCompletoOverlay";

export default function DistribucionCategorias() {
  const categorias = useCategoriasOrdenadas();
  const transacciones = useCollection(transaccionesRepo);
  const moneda = useMoneda();
  const [tipo, setTipo] = useState<"gasto" | "ingreso">("gasto");
  const [categoriaAbierta, setCategoriaAbierta] = useState<{ id: string; nombre: string } | null>(
    null
  );

  const idTransferencia = categorias.find((c) => c.nombre === NOMBRE_CATEGORIA_TRANSFERENCIA)?.id;
  const distribucion = agruparPorCategoria(transacciones, categorias, inicioDeMes(), tipo, idTransferencia);

  return (
    <section>
      <div className="mb-2 flex items-center justify-between px-0.5">
        <h2 className="text-[15px] font-semibold text-ink">
          {tipo === "gasto" ? "Gastos" : "Ingresos"} por categoría
        </h2>

        {/* Botoncito para cambiar Gasto/Ingreso en el mismo espacio */}
        <div className="relative flex rounded-full bg-surface p-0.5 shadow-card">
          <div
            className={`absolute inset-y-0.5 left-0.5 w-[34px] rounded-full bg-surface-line transition-transform duration-200 ease-ios ${
              tipo === "ingreso" ? "translate-x-[34px]" : "translate-x-0"
            }`}
          />
          <button
            type="button"
            onClick={() => setTipo("gasto")}
            className={`ios-press relative z-10 w-[34px] py-1.5 text-[11px] font-semibold ${
              tipo === "gasto" ? "text-ink" : "text-ink-faint"
            }`}
          >
            Gasto
          </button>
          <button
            type="button"
            onClick={() => setTipo("ingreso")}
            className={`ios-press relative z-10 w-[34px] py-1.5 text-[11px] font-semibold ${
              tipo === "ingreso" ? "text-accent" : "text-ink-faint"
            }`}
          >
            Ing.
          </button>
        </div>
      </div>

      {distribucion.length === 0 ? (
        <div className="rounded-ios-lg bg-surface p-6 text-center shadow-card">
          <p className="text-[13px] text-ink-faint">
            Todavía no hay {tipo === "gasto" ? "gastos" : "ingresos"} registrados este mes.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {distribucion.map((d) => {
            const Icono = obtenerIconoCategoria(d.categoria.icono);
            const color = obtenerColorCategoria(d.categoria, categorias);
            return (
              <button
                key={d.categoria.id}
                type="button"
                onClick={() => setCategoriaAbierta({ id: d.categoria.id, nombre: d.categoria.nombre })}
                className="ios-press relative block w-full overflow-hidden rounded-ios-lg bg-surface p-3 text-left shadow-card"
              >
                {/* Barra de relleno proporcional al porcentaje, estilo "rectángulo redondeado" */}
                <div
                  className="absolute inset-y-0 left-0 rounded-ios-lg opacity-[0.18]"
                  style={{ width: `${Math.max(d.porcentaje, 4)}%`, backgroundColor: color }}
                />
                <div className="relative flex items-center gap-3">
                  <span
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full"
                    style={{ backgroundColor: `${color}33`, color }}
                  >
                    <Icono size={16} />
                  </span>
                  <span className="min-w-0 flex-1 truncate text-[14px] font-medium text-ink">
                    {d.categoria.nombre}
                  </span>
                  <span className="shrink-0 text-[12px] font-semibold text-ink-faint">
                    {d.porcentaje.toFixed(0)}%
                  </span>
                  {/* Blanco/neutro a propósito: para no recargar visualmente con otro color más */}
                  <span className="figure-amount shrink-0 text-[14px] font-semibold text-ink">
                    {formatMonto(d.monto, moneda)}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      )}

      <HistorialCompletoOverlay
        abierto={categoriaAbierta !== null}
        onCerrar={() => setCategoriaAbierta(null)}
        categoriaId={categoriaAbierta?.id}
        tituloFiltro={categoriaAbierta?.nombre}
        soloMesActual
      />
    </section>
  );
}
