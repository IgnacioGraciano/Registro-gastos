"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2, Calendar, Wallet } from "lucide-react";
import {
  billeterasRepo,
  prestamosRepo,
  useCollection,
  useMoneda,
  type Prestamo,
} from "@/lib/db";
import { formatMonto, hoyISO } from "@/lib/format";
import BottomSheet from "@/components/BottomSheet";

interface Props {
  abierto: boolean;
  onCerrar: () => void;
}

export default function PrestamosSheet({ abierto, onCerrar }: Props) {
  const moneda = useMoneda();
  const prestamos = useCollection(prestamosRepo);
  const billeteras = useCollection(billeterasRepo);

  const [modo, setModo] = useState<"lista" | "crear" | "pago">("lista");
  const [prestamoSeleccionado, setPrestamoSeleccionado] = useState<Prestamo | null>(null);

  const [persona, setPersona] = useState("");
  const [monto, setMonto] = useState("");
  const [fecha, setFecha] = useState(hoyISO());
  const [descripcion, setDescripcion] = useState("");
  const [billeteraId, setBilleteraId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [montoPago, setMontoPago] = useState("");
  const [fechaPago, setFechaPago] = useState(hoyISO());

  useEffect(() => {
    if (!abierto) {
      setModo("lista");
      setPrestamoSeleccionado(null);
      setPersona("");
      setMonto("");
      setFecha(hoyISO());
      setDescripcion("");
      setBilleteraId(null);
      setMontoPago("");
      setFechaPago(hoyISO());
      setError(null);
    }
  }, [abierto]);

  const pendientes = prestamos
    .filter((p) => prestamosRepo.montoPendiente(p) > 0)
    .sort((a, b) => b.fecha.localeCompare(a.fecha));

  const totalPendiente = prestamosRepo.totalPendiente();

  function crearPrestamo() {
    if (!persona.trim()) {
      setError("Ingresá el nombre de la persona.");
      return;
    }
    if (!billeteraId) {
      setError("Elegí una cuenta.");
      return;
    }
    const montoNum = parseFloat(monto.replace(",", "."));
    if (!Number.isFinite(montoNum) || montoNum <= 0) {
      setError("Ingresá un monto válido.");
      return;
    }

    try {
      prestamosRepo.crear({
        persona: persona.trim(),
        monto: montoNum,
        billeteraId,
        fecha,
        descripcion: descripcion.trim(),
      });
      setModo("lista");
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo crear el préstamo.");
    }
  }

  function registrarPago() {
    if (!prestamoSeleccionado) return;
    const montoNum = parseFloat(montoPago.replace(",", "."));
    if (!Number.isFinite(montoNum) || montoNum <= 0) {
      setError("Ingresá un monto válido.");
      return;
    }

    try {
      prestamosRepo.registrarPago(prestamoSeleccionado.id, montoNum, fechaPago);
      setModo("lista");
      setPrestamoSeleccionado(null);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo registrar el pago.");
    }
  }

  function marcarPerdida() {
    if (!prestamoSeleccionado) return;
    try {
      prestamosRepo.marcarComoPerdida(prestamoSeleccionado.id, fechaPago);
      setModo("lista");
      setPrestamoSeleccionado(null);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo registrar la pérdida.");
    }
  }

  function abrirModalPago(prestamo: Prestamo) {
    setPrestamoSeleccionado(prestamo);
    setModo("pago");
    setMontoPago("");
    setFechaPago(hoyISO());
    setError(null);
  }

  const footerLista = (
    <button
      type="button"
      onClick={() => {
        setModo("crear");
        setError(null);
      }}
      className="ios-press flex w-full items-center justify-center gap-2 rounded-ios bg-accent py-3 text-[14px] font-bold text-white"
    >
      <Plus size={16} />
      Nuevo Préstamo
    </button>
  );

  const footerCrear = (
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
  );

  const footerPago = (
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
  );

  return (
    <BottomSheet
      abierto={abierto}
      onCerrar={onCerrar}
      titulo="Mis Préstamos"
      footer={modo === "lista" ? footerLista : modo === "crear" ? footerCrear : footerPago}
    >
      {modo === "lista" && (
        <div className="flex flex-col gap-4">
          {pendientes.length > 0 && (
            <div className="rounded-ios bg-accent-soft p-3 text-center">
              <p className="text-[12px] text-ink-faint">Dinero que te deben:</p>
              <p className="figure-amount text-[24px] font-bold text-accent">
                {formatMonto(totalPendiente, moneda)}
              </p>
            </div>
          )}

          {pendientes.length > 0 ? (
            <div className="flex flex-col gap-2">
              {pendientes.map((p) => {
                const pendiente = prestamosRepo.montoPendiente(p);
                return (
                  <div key={p.id} className="rounded-ios bg-surface p-3 shadow-card">
                    <div className="mb-2 flex items-start justify-between gap-2">
                      <div>
                        <p className="text-[14px] font-semibold text-ink">{p.persona}</p>
                        <p className="text-[12px] text-ink-faint">{p.fecha}</p>
                      </div>
                      <div className="text-right">
                        <p className="figure-amount text-[14px] font-bold text-ink">
                          {formatMonto(pendiente, moneda)}
                        </p>
                        <p className="text-[11px] text-ink-faint">
                          {p.montoPagado > 0
                            ? `de ${formatMonto(p.monto, moneda)}`
                            : "Sin pagos"}
                        </p>
                      </div>
                    </div>

                    {p.montoPagado > 0 && (
                      <div className="mb-2 h-1.5 w-full overflow-hidden rounded-full bg-surface-line">
                        <div
                          className="h-full bg-accent"
                          style={{ width: `${(p.montoPagado / p.monto) * 100}%` }}
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
                        onClick={() => prestamosRepo.eliminar(p.id)}
                        className="ios-press flex h-9 w-9 items-center justify-center rounded-ios bg-expense-soft text-expense"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="py-4 text-center text-[13px] text-ink-faint">Sin préstamos registrados.</p>
          )}
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
              inputMode="decimal"
              value={monto}
              onChange={(e) => setMonto(e.target.value)}
              placeholder="0"
              className="figure-amount w-full rounded-ios bg-surface p-3 text-[14px] text-ink outline-none placeholder:text-ink-faint"
            />
          </div>

          <div>
            <p className="mb-2 text-[13px] font-semibold text-ink">Cuenta</p>
            <div className="flex flex-wrap gap-2">
              {billeteras.map((b) => (
                <button
                  key={b.id}
                  type="button"
                  onClick={() => setBilleteraId(b.id)}
                  className={`ios-press flex items-center gap-1.5 rounded-full px-3.5 py-2 text-[13px] font-medium shadow-card ${
                    billeteraId === b.id ? "bg-brand text-white" : "bg-surface text-ink"
                  }`}
                >
                  <Wallet size={14} />
                  {b.nombre}
                </button>
              ))}
            </div>
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
              {formatMonto(prestamosRepo.montoPendiente(prestamoSeleccionado), moneda)}
            </p>
          </div>

          <div>
            <label className="mb-1 block text-[13px] font-semibold text-ink">Monto del pago</label>
            <input
              type="text"
              inputMode="decimal"
              value={montoPago}
              onChange={(e) => setMontoPago(e.target.value)}
              placeholder="0"
              autoFocus
              className="figure-amount w-full rounded-ios bg-surface p-3 text-[14px] text-ink outline-none placeholder:text-ink-faint"
            />
            <p className="mt-1.5 text-[11.5px] text-ink-faint">
              Recuperar lo prestado no cuenta como ingreso. Si te pagan de más, esa diferencia sí
              se registra como ganancia.
            </p>
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

          <button
            type="button"
            onClick={marcarPerdida}
            className="ios-press w-full rounded-ios border border-expense/30 py-2.5 text-[12.5px] font-semibold text-expense"
          >
            No van a pagar el resto: dar por pérdida{" "}
            {formatMonto(prestamosRepo.montoPendiente(prestamoSeleccionado), moneda)}
          </button>

          {error && <p className="text-center text-[12.5px] font-medium text-expense">{error}</p>}
        </div>
      )}
    </BottomSheet>
  );
}
