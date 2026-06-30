"use client";

import { useEffect, useState } from "react";
import { Check, ChevronLeft, Wallet } from "lucide-react";
import {
  billeterasRepo,
  categoriasRepo,
  suscripcionesRepo,
  useCollection,
  NOMBRE_CATEGORIA_TRANSFERENCIA,
} from "@/lib/db";
import { hoyISO } from "@/lib/format";
import { categoriaAplicaA } from "@/lib/categoria-filtros";
import { obtenerIconoCategoria } from "@/lib/icons";

interface Props {
  abierto: boolean;
  onCerrar: () => void;
}

/**
 * Pantalla completa (no una hoja capada al 88%) para que "Crear
 * suscripción" quede SIEMPRE anclado al fondo real de la pantalla, sin
 * importar cuánto contenido tenga el formulario — mismo patrón ya probado
 * en Nueva Carga (alto garantizado + footer fijo).
 */
export default function NuevaSuscripcionModal({ abierto, onCerrar }: Props) {
  const billeteras = useCollection(billeterasRepo);
  // Una suscripción siempre se debita como "gasto": se excluye la categoría de sistema
  // Transferencia y las categorías creadas específicamente para ingresos.
  const categorias = useCollection(categoriasRepo).filter(
    (c) => c.nombre !== NOMBRE_CATEGORIA_TRANSFERENCIA && categoriaAplicaA(c, "gasto")
  );

  const [nombre, setNombre] = useState("");
  const [montoStr, setMontoStr] = useState("");
  const [billeteraId, setBilleteraId] = useState<string | null>(null);
  const [categoriaId, setCategoriaId] = useState<string | null>(null);
  const [frecuencia, setFrecuencia] = useState<"mensual" | "anual">("mensual");
  const [proximoPago, setProximoPago] = useState(hoyISO());
  const [error, setError] = useState<string | null>(null);
  const [exito, setExito] = useState(false);

  useEffect(() => {
    if (abierto) {
      setNombre("");
      setMontoStr("");
      setBilleteraId(null);
      setCategoriaId(null);
      setFrecuencia("mensual");
      setProximoPago(hoyISO());
      setError(null);
      setExito(false);
    }
  }, [abierto]);

  if (!abierto) return null;

  const monto = parseFloat(montoStr.replace(",", "."));
  const puedeGuardar =
    nombre.trim().length > 0 &&
    Number.isFinite(monto) &&
    monto > 0 &&
    billeteraId !== null &&
    categoriaId !== null &&
    proximoPago.length > 0;

  function guardar() {
    if (!billeteraId || !categoriaId) return;
    try {
      suscripcionesRepo.crear({
        nombre: nombre.trim(),
        monto,
        billeteraId,
        categoriaId,
        frecuencia,
        proximoPago,
      });
      setError(null);
      setExito(true);
      setTimeout(onCerrar, 700);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo crear la suscripción.");
    }
  }

  return (
    <div className="absolute inset-0 z-[85] flex flex-col bg-surface-base">
      <header className="flex shrink-0 items-center gap-3 border-b border-surface-line bg-surface-base px-5 pb-3 pt-[calc(var(--safe-top)+14px)]">
        <button
          type="button"
          onClick={onCerrar}
          aria-label="Volver"
          className="ios-press flex h-8 w-8 items-center justify-center rounded-full bg-surface shadow-card"
        >
          <ChevronLeft size={18} className="text-ink" />
        </button>
        <h1 className="text-[17px] font-bold text-ink">Nueva suscripción</h1>
      </header>

      <div className="no-scrollbar scroll-contenido min-h-0 flex-1 overflow-y-auto px-5 py-4">
        {exito ? (
          <div className="flex flex-col items-center gap-3 py-8">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-accent text-white shadow-fab animate-pop-in">
              <Check size={30} strokeWidth={3} />
            </div>
            <p className="text-[15px] font-semibold text-ink">¡Suscripción creada!</p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {/* Nombre */}
            <div>
              <p className="mb-2 text-[13px] font-semibold text-ink">Nombre</p>
              <input
                type="text"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder="Ej: Netflix, Spotify, Gimnasio"
                maxLength={40}
                className="w-full rounded-ios bg-surface p-3 text-[14px] text-ink shadow-card outline-none placeholder:text-ink-faint"
              />
            </div>

            {/* Monto */}
            <div>
              <p className="mb-2 text-[13px] font-semibold text-ink">Monto</p>
              <input
                type="number"
                inputMode="decimal"
                value={montoStr}
                onChange={(e) => setMontoStr(e.target.value)}
                placeholder="$0"
                className="figure-amount w-full rounded-ios bg-surface p-3.5 text-center text-[22px] font-semibold text-ink shadow-card outline-none placeholder:text-ink-faint"
              />
            </div>

            {/* Frecuencia: toggle deslizante */}
            <div>
              <p className="mb-2 text-[13px] font-semibold text-ink">Frecuencia</p>
              <div className="relative grid grid-cols-2 rounded-full bg-surface-line p-1">
                <div
                  className={`absolute inset-y-1 left-1 w-[calc(50%-4px)] rounded-full bg-surface shadow-card transition-transform duration-300 ease-ios ${
                    frecuencia === "anual" ? "translate-x-[calc(100%+4px)]" : "translate-x-0"
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setFrecuencia("mensual")}
                  className={`ios-press relative z-10 rounded-full py-2 text-[14px] font-semibold transition-colors duration-200 ${
                    frecuencia === "mensual" ? "text-ink" : "text-ink-faint"
                  }`}
                >
                  Mensual
                </button>
                <button
                  type="button"
                  onClick={() => setFrecuencia("anual")}
                  className={`ios-press relative z-10 rounded-full py-2 text-[14px] font-semibold transition-colors duration-200 ${
                    frecuencia === "anual" ? "text-ink" : "text-ink-faint"
                  }`}
                >
                  Anual
                </button>
              </div>
            </div>

            {/* Próximo pago */}
            <div>
              <p className="mb-2 text-[13px] font-semibold text-ink">Próximo pago</p>
              <input
                type="date"
                value={proximoPago}
                onChange={(e) => setProximoPago(e.target.value)}
                className="w-full rounded-ios bg-surface p-3 text-[14px] text-ink shadow-card outline-none"
              />
            </div>

            {/* Billetera */}
            <div>
              <p className="mb-2 text-[13px] font-semibold text-ink">Billetera de débito</p>
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
                {categorias.map((c) => {
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
                      <Icono size={20} />
                      <span className="text-[11px] font-medium leading-tight">{c.nombre}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {error && <p className="text-center text-[12.5px] font-medium text-expense">{error}</p>}
          </div>
        )}
      </div>

      {!exito && (
        <div className="shrink-0 border-t border-surface-line bg-surface-base px-5 pb-[calc(var(--tabbar-height)+var(--safe-bottom)+8px)] pt-3">
          <button
            type="button"
            onClick={guardar}
            disabled={!puedeGuardar}
            className={`ios-press w-full rounded-ios py-4 text-[16px] font-bold text-white transition-colors duration-200 ${
              puedeGuardar ? "bg-brand" : "bg-brand/25"
            }`}
          >
            Crear suscripción
          </button>
        </div>
      )}
    </div>
  );
}
