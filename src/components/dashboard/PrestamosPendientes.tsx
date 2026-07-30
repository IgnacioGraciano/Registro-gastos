"use client";

import { billeterasRepo, prestamosRepo, useCollection, useMoneda } from "@/lib/db";
import { formatMonto } from "@/lib/format";
import PrestamoRow from "./PrestamoRow";

export default function PrestamosPendientes() {
  const prestamos = useCollection(prestamosRepo);
  const billeteras = useCollection(billeterasRepo);
  const moneda = useMoneda();

  const pendientes = prestamos
    .filter((p) => prestamosRepo.montoPendiente(p) > 0)
    .sort((a, b) => b.fecha.localeCompare(a.fecha));

  if (pendientes.length === 0) return null;

  const totalPendiente = prestamosRepo.totalPendiente();

  return (
    <section>
      <div className="mb-2 flex items-center justify-between px-0.5">
        <h2 className="text-[15px] font-semibold text-ink">Préstamos pendientes</h2>
        <span className="figure-amount text-[13px] font-semibold text-brand">
          {formatMonto(totalPendiente, moneda)}
        </span>
      </div>

      <div className="flex flex-col gap-2">
        {pendientes.map((p) => (
          <PrestamoRow
            key={p.id}
            prestamo={p}
            billetera={billeteras.find((b) => b.id === p.billeteraId)}
          />
        ))}
      </div>
    </section>
  );
}
