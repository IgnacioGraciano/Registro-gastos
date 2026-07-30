"use client";

import { Banknote } from "lucide-react";
import type { Billetera, Prestamo } from "@/lib/db";
import { prestamosRepo, useMoneda } from "@/lib/db";
import { formatMonto, formatFechaRelativa } from "@/lib/format";

interface Props {
  prestamo: Prestamo;
  billetera: Billetera | undefined;
}

export default function PrestamoRow({ prestamo, billetera }: Props) {
  const moneda = useMoneda();
  const pendiente = prestamosRepo.montoPendiente(prestamo);

  return (
    <div className="rounded-ios bg-surface p-3 shadow-card">
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand/15 text-brand">
          <Banknote size={18} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[14px] font-medium text-ink">Préstamo a {prestamo.persona}</p>
          <p className="truncate text-[12px] text-ink-faint">
            {billetera?.nombre ?? "—"} · {formatFechaRelativa(prestamo.fecha)}
            {prestamo.montoPagado > 0 ? ` · Pagado ${formatMonto(prestamo.montoPagado, moneda)}` : ""}
          </p>
        </div>
        <div className="shrink-0 text-right">
          <p className="figure-amount text-[14px] font-semibold text-brand">
            {formatMonto(pendiente, moneda)}
          </p>
          <p className="text-[11px] text-ink-faint">pendiente</p>
        </div>
      </div>

      {prestamo.montoPagado > 0 && (
        <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-surface-line">
          <div
            className="h-full bg-brand"
            style={{ width: `${(prestamo.montoPagado / prestamo.monto) * 100}%` }}
          />
        </div>
      )}
    </div>
  );
}
