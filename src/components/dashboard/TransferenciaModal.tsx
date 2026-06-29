"use client";

import { useEffect, useState } from "react";
import { ArrowRightLeft, Check, Wallet } from "lucide-react";
import type { Billetera } from "@/lib/db";
import { registrarTransferencia, useMoneda } from "@/lib/db";
import { formatMonto } from "@/lib/format";
import BottomSheet from "@/components/BottomSheet";

interface Props {
  abierto: boolean;
  onCerrar: () => void;
  billeteras: Billetera[];
}

export default function TransferenciaModal({ abierto, onCerrar, billeteras }: Props) {
  const moneda = useMoneda();
  const [origenId, setOrigenId] = useState<string | null>(null);
  const [destinoId, setDestinoId] = useState<string | null>(null);
  const [montoStr, setMontoStr] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [exito, setExito] = useState(false);

  // Cada vez que se abre el modal, arranca limpio.
  useEffect(() => {
    if (abierto) {
      setOrigenId(null);
      setDestinoId(null);
      setMontoStr("");
      setError(null);
      setExito(false);
    }
  }, [abierto]);

  const monto = parseFloat(montoStr.replace(",", "."));
  const puedeConfirmar = origenId !== null && destinoId !== null && Number.isFinite(monto) && monto > 0;

  function confirmar() {
    if (!origenId || !destinoId) return;
    try {
      registrarTransferencia(origenId, destinoId, monto);
      setError(null);
      setExito(true);
      setTimeout(onCerrar, 700);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo transferir.");
    }
  }

  return (
    <BottomSheet
      abierto={abierto}
      onCerrar={onCerrar}
      titulo="Transferir entre cuentas"
      footer={
        !exito && (
          <>
            <button
              type="button"
              onClick={confirmar}
              disabled={!puedeConfirmar}
              className={`ios-press w-full rounded-ios py-3.5 text-[15px] font-bold text-white transition-colors ${
                puedeConfirmar ? "bg-brand" : "bg-brand/25"
              }`}
            >
              Confirmar transferencia
            </button>
            {origenId && destinoId && Number.isFinite(monto) && monto > 0 && (
              <p className="mt-2 text-center text-[12px] text-ink-faint">
                {formatMonto(monto, moneda)} de{" "}
                <span className="font-medium text-ink">
                  {billeteras.find((b) => b.id === origenId)?.nombre}
                </span>{" "}
                a{" "}
                <span className="font-medium text-ink">
                  {billeteras.find((b) => b.id === destinoId)?.nombre}
                </span>
              </p>
            )}
          </>
        )
      }
    >
      {exito ? (
        <div className="flex flex-col items-center gap-3 py-8">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-accent text-white shadow-fab animate-pop-in">
            <Check size={30} strokeWidth={3} />
          </div>
          <p className="text-[15px] font-semibold text-ink">¡Transferencia realizada!</p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {/* Origen */}
          <div>
            <p className="mb-2 text-[13px] font-semibold text-ink">Desde</p>
            <div className="flex flex-wrap gap-2">
              {billeteras.map((b) => {
                const activa = origenId === b.id;
                const deshabilitada = destinoId === b.id;
                return (
                  <button
                    key={b.id}
                    type="button"
                    disabled={deshabilitada}
                    onClick={() => setOrigenId(b.id)}
                    className={`ios-press flex items-center gap-1.5 rounded-full px-3.5 py-2 text-[13px] font-medium shadow-card transition-opacity ${
                      activa ? "bg-brand text-white" : "bg-surface text-ink"
                    } ${deshabilitada ? "pointer-events-none opacity-30" : ""}`}
                  >
                    <Wallet size={14} />
                    {b.nombre}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Flechita decorativa */}
          <div className="flex justify-center text-ink-faint">
            <ArrowRightLeft size={16} />
          </div>

          {/* Destino */}
          <div>
            <p className="mb-2 text-[13px] font-semibold text-ink">Hacia</p>
            <div className="flex flex-wrap gap-2">
              {billeteras.map((b) => {
                const activa = destinoId === b.id;
                const deshabilitada = origenId === b.id;
                return (
                  <button
                    key={b.id}
                    type="button"
                    disabled={deshabilitada}
                    onClick={() => setDestinoId(b.id)}
                    className={`ios-press flex items-center gap-1.5 rounded-full px-3.5 py-2 text-[13px] font-medium shadow-card transition-opacity ${
                      activa ? "bg-accent text-white" : "bg-surface text-ink"
                    } ${deshabilitada ? "pointer-events-none opacity-30" : ""}`}
                  >
                    <Wallet size={14} />
                    {b.nombre}
                  </button>
                );
              })}
            </div>
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

          {error && <p className="text-center text-[12.5px] font-medium text-expense">{error}</p>}
        </div>
      )}
    </BottomSheet>
  );
}
