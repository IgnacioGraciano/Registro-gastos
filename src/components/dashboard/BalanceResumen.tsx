"use client";

import { useState } from "react";
import { ArrowRightLeft } from "lucide-react";
import {
  billeterasRepo,
  categoriasRepo,
  transaccionesRepo,
  useCollection,
  useMoneda,
  NOMBRE_CATEGORIA_TRANSFERENCIA,
  NOMBRE_CATEGORIA_PRESTAMO,
} from "@/lib/db";
import { formatMonto, MONEDAS_DISPONIBLES } from "@/lib/format";
import { inicioDeMes, sumarGastosDesde, sumarIngresosDesde } from "@/lib/dashboard";
import TransferenciaModal from "./TransferenciaModal";

export default function BalanceResumen() {
  const billeteras = useCollection(billeterasRepo);
  const categorias = useCollection(categoriasRepo);
  const transacciones = useCollection(transaccionesRepo);
  const moneda = useMoneda();
  const [modalAbierto, setModalAbierto] = useState(false);

  const idTransferencia = categorias.find((c) => c.nombre === NOMBRE_CATEGORIA_TRANSFERENCIA)?.id;
  const idPrestamo = categorias.find((c) => c.nombre === NOMBRE_CATEGORIA_PRESTAMO)?.id;
  const idsExcluidos = [idTransferencia, idPrestamo];

  const ingresoMes = sumarIngresosDesde(transacciones, inicioDeMes(), idsExcluidos);
  const gastoMes = sumarGastosDesde(transacciones, inicioDeMes(), idsExcluidos);
  // El balance es la resta entre ingreso y gasto del mes (no la suma de saldos de todas las cuentas).
  const balance = ingresoMes - gastoMes;
  const colorBalance = balance === 0 ? "text-ink" : balance > 0 ? "text-accent" : "text-expense";

  return (
    <section className="rounded-ios-lg bg-surface p-4 shadow-card">
      <div className="mb-2 flex items-center justify-end">
        <button
          type="button"
          onClick={() => setModalAbierto(true)}
          disabled={billeteras.length < 2}
          className={`ios-press flex items-center gap-1.5 rounded-full bg-surface-base px-3 py-1.5 text-[12.5px] font-medium text-ink ${
            billeteras.length < 2 ? "opacity-40" : ""
          }`}
        >
          <ArrowRightLeft size={13} />
          Transferir
        </button>
      </div>

      <div className="flex items-start gap-3">
        {/* Balance del mes: ingreso - gasto. Neutro si es 0, verde si es positivo, rojo si es negativo */}
        <div className="flex min-w-0 flex-[1.3] flex-col justify-center">
          <p className="text-[12px] text-ink-faint">Balance</p>
          {(() => {
            // Separo el signo + símbolo del número puro para que sean más chicos
            const abs = Math.abs(balance);
            const simbolo = MONEDAS_DISPONIBLES.find((m) => m.codigo === moneda)?.simbolo ?? "$";
            const numStr = new Intl.NumberFormat("es-AR", { maximumFractionDigits: 0 }).format(abs);
            const tamano = numStr.length <= 7 ? "text-[30px]" : numStr.length <= 10 ? "text-[24px]" : "text-[20px]";
            return (
              <p className={`figure-amount mt-0.5 font-bold leading-tight ${tamano} ${colorBalance}`}>
                <span className="text-[0.6em]">
                  {balance < 0 ? "-" : ""}
                  {simbolo}
                </span>
                {numStr}
              </p>
            );
          })()}
        </div>

        {/* Divisor */}
        <div className="h-12 w-px shrink-0 bg-surface-line" />

        {/* Ingreso / Gasto del mes: 0.8x el tamaño del balance, apiladas */}
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <div className="min-w-0">
            <p className="text-[11px] text-ink-faint">Ingreso del mes</p>
            <p className="figure-amount truncate text-[24px] font-bold leading-tight text-accent">
              {formatMonto(ingresoMes, moneda)}
            </p>
          </div>
          <div className="min-w-0">
            <p className="text-[11px] text-ink-faint">Gasto del mes</p>
            <p className="figure-amount truncate text-[24px] font-bold leading-tight text-expense">
              {formatMonto(gastoMes, moneda)}
            </p>
          </div>
        </div>
      </div>

      <TransferenciaModal
        abierto={modalAbierto}
        onCerrar={() => setModalAbierto(false)}
        billeteras={billeteras}
      />
    </section>
  );
}
