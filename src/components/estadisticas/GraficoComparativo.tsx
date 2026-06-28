"use client";

import { useState } from "react";
import type { Categoria, Transaccion } from "@/lib/db";
import { agruparPorCategoria, rangoDePeriodo, type ResumenPeriodo } from "@/lib/dashboard";
import { formatMonto, type Moneda } from "@/lib/format";
import { obtenerIconoCategoria } from "@/lib/icons";
import { obtenerColorCategoria } from "@/lib/categoria-filtros";

interface Props {
  periodos: ResumenPeriodo[];
  moneda: Moneda;
  transacciones: Transaccion[];
  categorias: Categoria[];
  idCategoriaTransferencia: string | undefined;
}

const ALTURA_GRAFICO = 120; // px

export default function GraficoComparativo({
  periodos,
  moneda,
  transacciones,
  categorias,
  idCategoriaTransferencia,
}: Props) {
  const [seleccionado, setSeleccionado] = useState(periodos.length - 1);
  const [tipoDetalle, setTipoDetalle] = useState<"gasto" | "ingreso">("gasto");

  const maxValor = Math.max(1, ...periodos.flatMap((p) => [p.ingreso, p.gasto]));
  const actual = periodos[seleccionado] ?? periodos[periodos.length - 1];

  const { desde, hasta } = actual ? rangoDePeriodo(actual.clave) : { desde: "", hasta: "" };
  const distribucion = actual
    ? agruparPorCategoria(transacciones, categorias, desde, tipoDetalle, idCategoriaTransferencia, hasta)
    : [];

  return (
    <div>
      {/* Barras */}
      <div className="flex items-end justify-between gap-1.5" style={{ height: ALTURA_GRAFICO }}>
        {periodos.map((p, i) => {
          const alturaIngreso = (p.ingreso / maxValor) * ALTURA_GRAFICO;
          const alturaGasto = (p.gasto / maxValor) * ALTURA_GRAFICO;
          const activo = i === seleccionado;
          return (
            <button
              key={p.clave}
              type="button"
              onClick={() => setSeleccionado(i)}
              className="ios-press flex h-full flex-1 flex-col items-center justify-end gap-1"
            >
              <div className="flex h-full items-end gap-[3px]">
                <div
                  className={`w-[7px] rounded-t-full transition-opacity ${
                    activo ? "bg-accent opacity-100" : "bg-accent opacity-40"
                  }`}
                  style={{ height: Math.max(alturaIngreso, 2) }}
                />
                <div
                  className={`w-[7px] rounded-t-full transition-opacity ${
                    activo ? "bg-expense opacity-100" : "bg-expense opacity-40"
                  }`}
                  style={{ height: Math.max(alturaGasto, 2) }}
                />
              </div>
            </button>
          );
        })}
      </div>

      {/* Etiquetas de período */}
      <div className="mt-1 flex justify-between gap-1.5">
        {periodos.map((p, i) => (
          <p
            key={p.clave}
            className={`flex-1 text-center text-[10px] capitalize ${
              i === seleccionado ? "font-semibold text-ink" : "text-ink-faint"
            }`}
          >
            {p.etiqueta.split(" ")[0]}
          </p>
        ))}
      </div>

      {/* Detalle del período elegido: totales */}
      {actual && (
        <div className="mt-3 flex items-center justify-between rounded-ios bg-surface-base p-3">
          <div>
            <p className="text-[11px] text-ink-faint">Ingreso</p>
            <p className="figure-amount text-[14px] font-semibold text-accent">
              {formatMonto(actual.ingreso, moneda)}
            </p>
          </div>
          <div>
            <p className="text-[11px] text-ink-faint">Gasto</p>
            <p className="figure-amount text-[14px] font-semibold text-expense">
              {formatMonto(actual.gasto, moneda)}
            </p>
          </div>
          <div className="text-right">
            <p className="text-[11px] text-ink-faint">Balance</p>
            <p
              className={`figure-amount text-[14px] font-semibold ${
                actual.balance === 0
                  ? "text-ink"
                  : actual.balance > 0
                    ? "text-balance-positive"
                    : "text-balance-negative"
              }`}
            >
              {actual.balance < 0 ? "-" : ""}
              {formatMonto(Math.abs(actual.balance), moneda)}
            </p>
          </div>
        </div>
      )}

      {/* Detalle del período elegido: desglose por categoría */}
      {actual && (
        <div className="mt-3">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-[12px] font-semibold text-ink-faint">
              {tipoDetalle === "gasto" ? "Gastos" : "Ingresos"} de {actual.etiqueta}
            </p>
            <div className="relative flex rounded-full bg-surface-base p-0.5">
              <div
                className={`absolute inset-y-0.5 left-0.5 w-[34px] rounded-full bg-surface-line transition-transform duration-200 ease-ios ${
                  tipoDetalle === "ingreso" ? "translate-x-[34px]" : "translate-x-0"
                }`}
              />
              <button
                type="button"
                onClick={() => setTipoDetalle("gasto")}
                className={`ios-press relative z-10 w-[34px] py-1 text-[10.5px] font-semibold ${
                  tipoDetalle === "gasto" ? "text-ink" : "text-ink-faint"
                }`}
              >
                Gasto
              </button>
              <button
                type="button"
                onClick={() => setTipoDetalle("ingreso")}
                className={`ios-press relative z-10 w-[34px] py-1 text-[10.5px] font-semibold ${
                  tipoDetalle === "ingreso" ? "text-accent" : "text-ink-faint"
                }`}
              >
                Ing.
              </button>
            </div>
          </div>

          {distribucion.length === 0 ? (
            <p className="py-3 text-center text-[12.5px] text-ink-faint">
              Sin {tipoDetalle === "gasto" ? "gastos" : "ingresos"} en este período.
            </p>
          ) : (
            <div className="flex flex-col gap-1.5">
              {distribucion.map((d) => {
                const Icono = obtenerIconoCategoria(d.categoria.icono);
                const color = obtenerColorCategoria(d.categoria, categorias);
                return (
                  <div key={d.categoria.id} className="flex items-center gap-2.5">
                    <span
                      className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full"
                      style={{ backgroundColor: `${color}33`, color }}
                    >
                      <Icono size={13} />
                    </span>
                    <span className="min-w-0 flex-1 truncate text-[13px] text-ink">
                      {d.categoria.nombre}
                    </span>
                    <span className="shrink-0 text-[11px] font-medium text-ink-faint">
                      {d.porcentaje.toFixed(0)}%
                    </span>
                    <span className="figure-amount shrink-0 text-[13px] font-semibold text-ink">
                      {formatMonto(d.monto, moneda)}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
