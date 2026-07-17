"use client";

import { useState } from "react";
import { Plus, Trash2, Calendar } from "lucide-react";
import usePrestamosStore, { Prestamo } from "@/lib/prestamos";
import { useMoneda } from "@/lib/db";
import { formatMonto } from "@/lib/format";
import BottomSheet from "@/components/BottomSheet";
import { hoyISO } from "@/lib/format";

interface Props {
  abierto: boolean;
  onCerrar: () => void;
}

export default function PrestamosSheet({ abierto, onCerrar }: Props) {
  const moneda = useMoneda();
  const store = usePrestamosStore();
  const prestamos = store.prestamos;

  const [modo, setModo] = useState<"lista" | "crear" | "pago">("lista");
  const [prestamoSeleccionado, setPrestamoSeleccionado] = useState<Prestamo | null>(null);

  const [persona, setPersona] = useState("");
  const [monto, setMonto] = useState("");
  const [fecha, setFecha] = useState(hoyISO());
  const [descripcion, setDescripcion] = useState("");
  const [error, setError] = useState<string | null>(null);

  const [montoPago, setMontoPago] = useState("");
  const [fechaPago, setFechaPago] = useState(hoyISO());

  const totalPendiente = store.calcularTotalPendiente();
  const prestamosPendientes = prestamos.filter((p) => p.estado !== "pagado");
  const prestamosPageos = prestamos.filter((p) => p.estado === "pagado");

  function crearPrestamo() {
    if (!persona.trim()) {
      setError("Ingresá el nombre de la persona.");
      return;
    }
    const montoNum = parseFloat(monto.replace(",", "."));
    if (!Number.isFinite(montoNum) || montoNum <= 0) {
      setError("Ingresá un monto válido.");
      return;
    }

    store.crearPrestamo({
      persona: persona.trim(),
      monto: montoNum,
      moneda,
      fecha,
      billeteraId: "",
      descripcion: descripcion.trim(),
    });

    setPersona("");
    setMonto("");
    setFecha(hoyISO());
    setDescripcion("");
    setError(null);
    setModo("lista");
  }

  function registrarPago() {
    if (!prestamoSeleccionado) return;
    const montoNum = parseFloat(montoPago.replace(",", "."));
    if (!Number.isFinite(montoNum) || montoNum <= 0) {
      setError("Ingresá un monto válido.");
      return;
    }

    const montoPendiente = store.calcularMontoPendiente(prestamoSeleccionado);
    if (montoNum > montoPendiente) {
      setError(`No podés registrar más de ${formatMonto(montoPendiente, moneda)}.`);
      return;
    }

    store.registrarPago(prestamoSeleccionado.id, montoNum, fechaPago);

    setMontoPago("");
    setFechaPago(hoyISO());
    setError(null);
    setModo("lista");
    setPrestamoSeleccionado(null);
  }

  function abrirModalPago(prestamo: Prestamo) {
    setPrestamoSeleccionado(prestamo);
    setModo("pago");
    setError(null);
  }

  return (
    <BottomSheet abierto={abierto} onCerrar={onCerrar} titulo="Mis Préstamos">
      {modo === "lista" && (
        <div className="flex flex-col gap-4">
          {prestamos.length > 0 && (
            <div className="rounded-ios bg-accent-soft p-3 text-center">
              <p className="text-[12px] text-ink-faint">Dinero que te deben:</p>
              <p className="figure-amount text-[24px] font-bold text-accent">
                {formatMonto(totalPendiente, moneda)}
              </p>
            </div>
          )}

          {prestamosPendientes.length > 0 && (
            <div>
              <p className="mb-2 text-[12px] font-semibold text-ink-faint uppercase tracking-wide">
                Pendientes ({prestamosPendientes.length})
              </p>
              <div className="flex flex-col gap-2">
                {prestamosPendientes.map((p) => (
                  <div key={p.id} className="rounded-ios bg-surface p-3 shadow-card">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div>
                        <p className="text-[14px] font-semibold text-ink">{p.persona}</p>
                        <p className="text-[12px] text-ink-faint">{p.fecha}</p>
                      </div>
                      <div className="text-right">
                        <p className="figure-amount text-[14px] font-bold text-ink">
                          {formatMonto(p.monto, moneda)}
                        </p>
                        <p className="text-[11px] text-ink-faint">
                          {p.estado === "parcial"
                            ? `Pagado: ${formatMonto(p.montoPagado || 0, moneda)}`
                            : "Sin pagos"}
                        </p>
                      </div>
                    </div>

                    {p.estado === "parcial" && (
                      <div className="mb-2 h-1.5 w-full rounded-full bg-surface-line overflow-hidden">
                        <div
                          className="h-full bg-accent"
                          style={{
                            width: `${((p.montoPagado || 0) / p.monto) * 100}%`,
                          }}
                        />
                      </div>
                    )}

                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => abrirModalPago(p)}
                        className="ios-press flex-1 rounded-ios bg-brand py-2 text-[13px] font-semibold text-white"
                      >
                        Registrar pago
                      </button>
                      <button
                        type="button"
                        onClick={() => store.eliminarPrestamo(p.id)}
                        className="ios-press flex h-9 w-9 items-center justify-center rounded-ios bg-expense-soft text-expense"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {prestamosPageos.length > 0 && (
            <div>
              <p className="mb-2 text-[12px] font-semibold text-ink-faint uppercase tracking-wide">
                Pagados ({prestamosPageos.length})
              </p>
              <div className="flex flex-col gap-2">
                {prestamosPageos.map((p) => (
                  <div key={p.id} className="rounded-ios bg-surface p-3 shadow-card opacity-60">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-[14px] font-semibold text-ink">{p.persona}</p>
                        <p className="text-[12px] text-ink-faint">✓ Pagado</p>
                      </div>
                      <p className="figure-amount text-[14px] font-bold text-ink">
                        {formatMonto(p.monto, moneda)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {prestamos.length === 0 && (
            <p className="py-4 text-center text-[13px] text-ink-faint">Sin préstamos registrados.</p>
          )}

          <button
            type="button"
            onClick={() => {
              setModo("crear");
              setError(null);
            }}
            className="ios-press flex items-center justify-center gap-2 rounded-ios bg-accent py-3 text-[14px] font-bold text-white"
          >
            <Plus size={16} />
            Nuevo Préstamo
          </button>
        </div>
      )}

      {modo === "crear" && (
        <div className="flex flex-col gap-4">
          <div>
            <label className="mb-1 block text-[13px] font-semibold text-ink">Nombre de la persona</label>
            <input
              type="text"
              value={persona}
              onChange={(e) => setPersona(e.target.value)}
              placeholder="Ej: Juan Pérez"
              maxLength={50}
              autoFocus
              className="w-full rounded-ios bg-surface p-3 text-[14px] text-ink outline-none placeholder:text-ink-faint"
            />
          </div>

          <div>
            <label className="mb-1 block text-[13px] font-semibold text-ink">Monto</label>
            <input
              type="text"
              value={monto}
              onChange={(e) => setMonto(e.target.value)}
              placeholder="0"
              className="figure-amount w-full rounded-ios bg-surface p-3 text-[14px] text-ink outline-none placeholder:text-ink-faint"
            />
          </div>

          <div>
            <label className="mb-1 block text-[13px] font-semibold text-ink">Fecha</label>
            <div className="flex items-center gap-2 rounded-ios bg-surface p-3">
              <Calendar size={16} className="text-ink-soft" />
              <input
                type="date"
                value={fecha}
                max={hoyISO()}
                onChange={(e) => setFecha(e.target.value)}
                className="flex-1 bg-transparent text-[14px] text-ink outline-none"
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-[13px] font-semibold text-ink">Descripción (opcional)</label>
            <input
              type="text"
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              placeholder="Ej: Cena en restaurante"
              maxLength={60}
              className="w-full rounded-ios bg-surface p-3 text-[14px] text-ink outline-none placeholder:text-ink-faint"
            />
          </div>

          {error && <p className="text-center text-[12.5px] font-medium text-expense">{error}</p>}

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => {
                setModo("lista");
                setError(null);
              }}
              className="ios-press flex-1 rounded-ios border border-surface-line py-3 text-[14px] font-semibold text-ink"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={crearPrestamo}
              className="ios-press flex-1 rounded-ios bg-brand py-3 text-[14px] font-bold text-white"
            >
              Guardar
            </button>
          </div>
        </div>
      )}

      {modo === "pago" && prestamoSeleccionado && (
        <div className="flex flex-col gap-4">
          <div className="rounded-ios bg-surface p-3">
            <p className="text-[12px] text-ink-faint">Préstamo a</p>
            <p className="text-[14px] font-semibold text-ink">{prestamoSeleccionado.persona}</p>
            <p className="mt-2 text-[12px] text-ink-faint">Monto original</p>
            <p className="figure-amount text-[18px] font-bold text-ink">
              {formatMonto(prestamoSeleccionado.monto, moneda)}
            </p>
            <p className="mt-2 text-[12px] text-ink-faint">Falta cobrar</p>
            <p className="figure-amount text-[16px] font-bold text-accent">
              {formatMonto(store.calcularMontoPendiente(prestamoSeleccionado), moneda)}
            </p>
          </div>

          <div>
            <label className="mb-1 block text-[13px] font-semibold text-ink">Monto del pago</label>
            <input
              type="text"
              value={montoPago}
              onChange={(e) => setMontoPago(e.target.value)}
              placeholder="0"
              autoFocus
              className="figure-amount w-full rounded-ios bg-surface p-3 text-[14px] text-ink outline-none placeholder:text-ink-faint"
            />
          </div>

          <div>
            <label className="mb-1 block text-[13px] font-semibold text-ink">Fecha del pago</label>
            <div className="flex items-center gap-2 rounded-ios bg-surface p-3">
              <Calendar size={16} className="text-ink-soft" />
              <input
                type="date"
                value={fechaPago}
                max={hoyISO()}
                onChange={(e) => setFechaPago(e.target.value)}
                className="flex-1 bg-transparent text-[14px] text-ink outline-none"
              />
            </div>
          </div>

          {error && <p className="text-center text-[12.5px] font-medium text-expense">{error}</p>}

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => {
                setModo("lista");
                setPrestamoSeleccionado(null);
                setError(null);
              }}
              className="ios-press flex-1 rounded-ios border border-surface-line py-3 text-[14px] font-semibold text-ink"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={registrarPago}
              className="ios-press flex-1 rounded-ios bg-accent py-3 text-[14px] font-bold text-white"
            >
              Registrar pago
            </button>
          </div>
        </div>
      )}
    </BottomSheet>
  );
}
