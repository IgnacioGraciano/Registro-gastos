"use client";

import { useEffect, useState } from "react";
import { Calendar, Trash2, Wallet } from "lucide-react";
import {
  billeterasRepo,
  categoriasRepo,
  transaccionesRepo,
  useCollection,
  NOMBRE_CATEGORIA_TRANSFERENCIA,
  type Transaccion,
} from "@/lib/db";
import { ayerISO, hoyISO } from "@/lib/format";
import { useCategoriasOrdenadas } from "@/lib/useCategoriasOrdenadas";
import { categoriaAplicaA } from "@/lib/categoria-filtros";
import { obtenerIconoCategoria } from "@/lib/icons";
import BottomSheet from "@/components/BottomSheet";

interface Props {
  transaccion: Transaccion | null;
  onCerrar: () => void;
}

type OpcionFecha = "hoy" | "ayer" | "otra";

export default function EditarMovimientoSheet({ transaccion, onCerrar }: Props) {
  const billeteras = useCollection(billeterasRepo);
  const categorias = useCategoriasOrdenadas();

  const [tipo, setTipo] = useState<"gasto" | "ingreso">("gasto");
  const [montoStr, setMontoStr] = useState("");
  const [billeteraId, setBilleteraId] = useState<string | null>(null);
  const [categoriaId, setCategoriaId] = useState<string | null>(null);
  const [descripcion, setDescripcion] = useState("");
  const [opcionFecha, setOpcionFecha] = useState<OpcionFecha>("hoy");
  const [fechaOtra, setFechaOtra] = useState(hoyISO());
  const [error, setError] = useState<string | null>(null);

  // Cada vez que se abre con un movimiento distinto, precarga sus datos.
  useEffect(() => {
    if (!transaccion) return;
    setTipo(transaccion.tipo);
    setMontoStr(String(transaccion.monto));
    setBilleteraId(transaccion.billeteraId);
    setCategoriaId(transaccion.categoriaId);
    setDescripcion(transaccion.descripcion);
    setError(null);

    if (transaccion.fecha === hoyISO()) {
      setOpcionFecha("hoy");
    } else if (transaccion.fecha === ayerISO()) {
      setOpcionFecha("ayer");
    } else {
      setOpcionFecha("otra");
      setFechaOtra(transaccion.fecha);
    }
  }, [transaccion]);

  if (!transaccion) return null;

  const categoriasDisponibles = categorias.filter(
    (c) => c.nombre !== NOMBRE_CATEGORIA_TRANSFERENCIA && categoriaAplicaA(c, tipo)
  );

  const monto = parseFloat(montoStr.replace(",", "."));
  const fechaFinal = opcionFecha === "hoy" ? hoyISO() : opcionFecha === "ayer" ? ayerISO() : fechaOtra;
  const puedeGuardar = Number.isFinite(monto) && monto > 0 && billeteraId !== null && categoriaId !== null;

  function cambiarTipo(nuevoTipo: "gasto" | "ingreso") {
    setTipo(nuevoTipo);
    setCategoriaId((actual) => {
      if (!actual) return actual;
      const categoriaActual = categorias.find((c) => c.id === actual);
      if (categoriaActual && categoriaAplicaA(categoriaActual, nuevoTipo)) return actual;
      return null;
    });
  }

  function guardar() {
    if (!transaccion || !billeteraId || !categoriaId) return;
    try {
      transaccionesRepo.actualizar(transaccion.id, {
        tipo,
        monto,
        billeteraId,
        categoriaId,
        descripcion: descripcion.trim(),
        fecha: fechaFinal,
      });
      onCerrar();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo guardar el movimiento.");
    }
  }

  function eliminar() {
    if (!transaccion) return;
    transaccionesRepo.eliminar(transaccion.id);
    onCerrar();
  }

  return (
    <BottomSheet
      abierto={transaccion !== null}
      onCerrar={onCerrar}
      titulo="Editar movimiento"
      footer={
        <>
          <button
            type="button"
            onClick={guardar}
            disabled={!puedeGuardar}
            className={`ios-press w-full rounded-ios py-3.5 text-[15px] font-bold text-white ${
              puedeGuardar ? "bg-brand" : "bg-brand/25"
            }`}
          >
            Guardar cambios
          </button>
          <button
            type="button"
            onClick={eliminar}
            className="ios-press mt-1.5 flex w-full items-center justify-center gap-1.5 rounded-ios py-2 text-[13px] font-semibold text-expense"
          >
            <Trash2 size={14} />
            Eliminar movimiento
          </button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        {/* Toggle Gasto / Ingreso */}
        <div className="relative grid grid-cols-2 rounded-full bg-surface-line p-1">
          <div
            className={`absolute inset-y-1 left-1 w-[calc(50%-4px)] rounded-full bg-surface shadow-card transition-transform duration-300 ease-ios ${
              tipo === "ingreso" ? "translate-x-[calc(100%+4px)]" : "translate-x-0"
            }`}
          />
          <button
            type="button"
            onClick={() => cambiarTipo("gasto")}
            className={`ios-press relative z-10 rounded-full py-2 text-[14px] font-semibold transition-colors duration-200 ${
              tipo === "gasto" ? "text-expense" : "text-ink-faint"
            }`}
          >
            Gasto
          </button>
          <button
            type="button"
            onClick={() => cambiarTipo("ingreso")}
            className={`ios-press relative z-10 rounded-full py-2 text-[14px] font-semibold transition-colors duration-200 ${
              tipo === "ingreso" ? "text-accent" : "text-ink-faint"
            }`}
          >
            Ingreso
          </button>
        </div>

        {/* Monto */}
        <div>
          <p className="mb-2 text-[13px] font-semibold text-ink">Monto</p>
          <input
            type="number"
            inputMode="decimal"
            value={montoStr}
            onChange={(e) => setMontoStr(e.target.value)}
            className={`figure-amount w-full rounded-ios bg-surface p-3.5 text-center text-[22px] font-semibold shadow-card outline-none ${
              tipo === "gasto" ? "text-expense" : "text-accent"
            }`}
          />
        </div>

        {/* Billetera */}
        <div>
          <p className="mb-2 text-[13px] font-semibold text-ink">Billetera</p>
          <div className="flex flex-wrap gap-2">
            {billeteras.map((b) => {
              const activa = billeteraId === b.id;
              return (
                <button
                  key={b.id}
                  type="button"
                  onClick={() => setBilleteraId(b.id)}
                  className={`ios-press flex items-center gap-1.5 rounded-full px-3.5 py-2 text-[13px] font-medium shadow-card ${
                    activa ? "bg-brand text-white" : "bg-surface text-ink"
                  }`}
                >
                  <Wallet size={14} />
                  {b.nombre}
                </button>
              );
            })}
          </div>
        </div>

        {/* Categoría */}
        <div>
          <p className="mb-2 text-[13px] font-semibold text-ink">Categoría</p>
          <div className="grid grid-cols-3 gap-2">
            {categoriasDisponibles.map((c) => {
              const Icono = obtenerIconoCategoria(c.icono);
              const activa = categoriaId === c.id;
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setCategoriaId(c.id)}
                  className={`ios-press flex flex-col items-center gap-1.5 rounded-ios p-3 shadow-card ${
                    activa ? "bg-accent text-white" : "bg-surface text-ink-soft"
                  }`}
                >
                  <Icono size={18} />
                  <span className="text-[10.5px] font-medium leading-tight">{c.nombre}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Fecha */}
        <div>
          <p className="mb-2 text-[13px] font-semibold text-ink">Fecha</p>
          <div className="flex gap-2">
            {(["hoy", "ayer", "otra"] as const).map((opcion) => {
              const activa = opcionFecha === opcion;
              return (
                <button
                  key={opcion}
                  type="button"
                  onClick={() => setOpcionFecha(opcion)}
                  className={`ios-press flex-1 rounded-ios py-2.5 text-[13px] font-semibold shadow-card ${
                    activa ? "bg-brand text-white" : "bg-surface text-ink-soft"
                  }`}
                >
                  {opcion === "otra" ? "Otra" : opcion === "hoy" ? "Hoy" : "Ayer"}
                </button>
              );
            })}
          </div>
          {opcionFecha === "otra" && (
            <div className="mt-2 flex items-center gap-2 rounded-ios bg-surface p-3 shadow-card">
              <Calendar size={16} className="shrink-0 text-ink-soft" />
              <input
                type="date"
                value={fechaOtra}
                max={hoyISO()}
                onChange={(e) => setFechaOtra(e.target.value)}
                className="w-full bg-transparent text-[14px] text-ink outline-none"
              />
            </div>
          )}
        </div>

        {/* Descripción */}
        <div>
          <p className="mb-2 text-[13px] font-semibold text-ink">Descripción</p>
          <input
            type="text"
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
            maxLength={60}
            placeholder="Opcional"
            className="w-full rounded-ios bg-surface p-3 text-[14px] text-ink shadow-card outline-none placeholder:text-ink-faint"
          />
        </div>

        {error && <p className="text-center text-[12.5px] font-medium text-expense">{error}</p>}
      </div>
    </BottomSheet>
  );
}
