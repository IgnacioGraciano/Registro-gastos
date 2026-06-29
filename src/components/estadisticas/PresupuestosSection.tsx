"use client";

import { useState } from "react";
import { AlertTriangle, ChevronDown, Pencil, Plus } from "lucide-react";
import {
  categoriasRepo,
  presupuestosRepo,
  transaccionesRepo,
  useCollection,
  useMoneda,
  NOMBRE_CATEGORIA_TRANSFERENCIA,
} from "@/lib/db";
import { calcularProgresoPresupuestos, inicioDeMes } from "@/lib/dashboard";
import { formatMonto } from "@/lib/format";
import { categoriaAplicaA } from "@/lib/categoria-filtros";
import { obtenerIconoCategoria } from "@/lib/icons";
import BottomSheet from "@/components/BottomSheet";

export default function PresupuestosSection() {
  const categorias = useCollection(categoriasRepo);
  const transacciones = useCollection(transaccionesRepo);
  const presupuestos = useCollection(presupuestosRepo);
  const moneda = useMoneda();

  const [expandido, setExpandido] = useState(false);
  const [sheetAbierta, setSheetAbierta] = useState(false);
  const [categoriaId, setCategoriaId] = useState<string | null>(null);
  const [montoStr, setMontoStr] = useState("");
  const [error, setError] = useState<string | null>(null);

  const idTransferencia = categorias.find((c) => c.nombre === NOMBRE_CATEGORIA_TRANSFERENCIA)?.id;
  const progreso = calcularProgresoPresupuestos(
    transacciones,
    categorias,
    presupuestos,
    inicioDeMes(),
    idTransferencia
  );

  // Sólo categorías de gasto (con la de Transferencia ya excluida) pueden tener presupuesto.
  const categoriasDeGasto = categorias.filter(
    (c) => c.nombre !== NOMBRE_CATEGORIA_TRANSFERENCIA && categoriaAplicaA(c, "gasto")
  );

  function abrirEdicion(catId: string) {
    const existente = presupuestosRepo.porCategoria(catId);
    setCategoriaId(catId);
    setMontoStr(existente ? String(existente.montoMensual) : "");
    setError(null);
    setSheetAbierta(true);
  }

  function guardar() {
    if (!categoriaId) return;
    const monto = parseFloat(montoStr.replace(",", "."));
    try {
      presupuestosRepo.establecer(categoriaId, monto);
      setSheetAbierta(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo guardar el presupuesto.");
    }
  }

  function eliminar() {
    if (!categoriaId) return;
    const existente = presupuestosRepo.porCategoria(categoriaId);
    if (existente) presupuestosRepo.eliminar(existente.id);
    setSheetAbierta(false);
  }

  const cantidadExcedidos = progreso.filter((p) => p.excedido).length;

  return (
    <section>
      {/* Resumen compacto: siempre visible, tocar para expandir/colapsar */}
      <button
        type="button"
        onClick={() => setExpandido((v) => !v)}
        className="ios-press flex w-full items-center gap-3 rounded-ios-lg bg-surface p-3.5 shadow-card"
      >
        <span
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
            cantidadExcedidos > 0 ? "bg-expense-soft text-expense" : "bg-surface-line text-ink-soft"
          }`}
        >
          {cantidadExcedidos > 0 ? <AlertTriangle size={16} /> : <Plus size={16} />}
        </span>
        <div className="flex-1 text-left">
          <p className="text-[14px] font-semibold text-ink">Presupuestos del mes</p>
          <p className="text-[12px] text-ink-faint">
            {progreso.length === 0
              ? "Todavía no definiste ninguno"
              : cantidadExcedidos > 0
                ? `${progreso.length} definidos · ${cantidadExcedidos} excedido${cantidadExcedidos > 1 ? "s" : ""}`
                : `${progreso.length} definidos · dentro de lo previsto`}
          </p>
        </div>
        <ChevronDown
          size={18}
          className={`shrink-0 text-ink-faint transition-transform ${expandido ? "rotate-180" : ""}`}
        />
      </button>

      {expandido && (
        <div className="mt-2 flex flex-col gap-2">
          <button
            type="button"
            onClick={() => abrirEdicion(categoriasDeGasto[0]?.id ?? "")}
            disabled={categoriasDeGasto.length === 0}
            className="ios-press self-end rounded-full bg-surface px-2.5 py-1.5 text-[12px] font-medium text-ink shadow-card"
          >
            + Nuevo presupuesto
          </button>

      {progreso.length === 0 ? (
        <div className="rounded-ios-lg bg-surface p-5 text-center shadow-card">
          <p className="text-[13px] text-ink-faint">
            Todavía no definiste ningún presupuesto. Tocá &quot;Nuevo&quot; para crear el primero.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {progreso.map((p) => {
            const Icono = obtenerIconoCategoria(p.categoria.icono);
            const porcentajeBarra = Math.min(p.porcentaje, 100);
            return (
              <button
                key={p.categoria.id}
                type="button"
                onClick={() => abrirEdicion(p.categoria.id)}
                className="ios-press w-full rounded-ios-lg bg-surface p-3.5 text-left shadow-card"
              >
                <div className="mb-2 flex items-center gap-2.5">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-surface-line text-ink-soft">
                    <Icono size={15} />
                  </span>
                  <span className="min-w-0 flex-1 truncate text-[14px] font-medium text-ink">
                    {p.categoria.nombre}
                  </span>
                  {p.excedido && <AlertTriangle size={15} className="shrink-0 text-expense" />}
                  <Pencil size={13} className="shrink-0 text-ink-faint" />
                </div>

                <div className="mb-1.5 h-2 w-full overflow-hidden rounded-full bg-surface-line">
                  <div
                    className={`h-full rounded-full ${p.excedido ? "bg-expense" : "bg-accent"}`}
                    style={{ width: `${porcentajeBarra}%` }}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <p className={`text-[12px] font-medium ${p.excedido ? "text-expense" : "text-ink-faint"}`}>
                    {formatMonto(p.gastado, moneda)} de {formatMonto(p.presupuesto, moneda)}
                  </p>
                  <p className={`text-[12px] font-semibold ${p.excedido ? "text-expense" : "text-ink-faint"}`}>
                    {p.porcentaje.toFixed(0)}%
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      )}
        </div>
      )}

      <BottomSheet
        abierto={sheetAbierta}
        onCerrar={() => setSheetAbierta(false)}
        titulo="Presupuesto"
        footer={
          <>
            <button
              type="button"
              onClick={guardar}
              disabled={!categoriaId || !montoStr.trim()}
              className={`ios-press w-full rounded-ios py-3.5 text-[15px] font-bold text-white ${
                categoriaId && montoStr.trim() ? "bg-brand" : "bg-brand/25"
              }`}
            >
              Guardar presupuesto
            </button>
            {categoriaId && presupuestosRepo.porCategoria(categoriaId) && (
              <button
                type="button"
                onClick={eliminar}
                className="ios-press mt-1.5 w-full rounded-ios py-2 text-[13px] font-semibold text-expense"
              >
                Eliminar presupuesto
              </button>
            )}
          </>
        }
      >
        <div className="flex flex-col gap-4">
          <div>
            <p className="mb-2 text-[13px] font-semibold text-ink">Categoría</p>
            <div className="flex flex-wrap gap-2">
              {categoriasDeGasto.map((c) => {
                const Icono = obtenerIconoCategoria(c.icono);
                const activa = categoriaId === c.id;
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => {
                      setCategoriaId(c.id);
                      const existente = presupuestosRepo.porCategoria(c.id);
                      setMontoStr(existente ? String(existente.montoMensual) : "");
                    }}
                    className={`ios-press flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[13px] font-medium shadow-card ${
                      activa ? "bg-brand text-white" : "bg-surface text-ink"
                    }`}
                  >
                    <Icono size={13} />
                    {c.nombre}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <p className="mb-2 text-[13px] font-semibold text-ink">Monto mensual</p>
            <input
              type="number"
              inputMode="decimal"
              value={montoStr}
              onChange={(e) => setMontoStr(e.target.value)}
              placeholder="$0"
              className="figure-amount w-full rounded-ios bg-surface p-3.5 text-center text-[22px] font-semibold text-ink shadow-card outline-none placeholder:text-ink-faint"
            />
          </div>

          {error && <p className="text-center text-[12.5px] font-medium text-expense">{error}</p>}
        </div>
      </BottomSheet>
    </section>
  );
}
