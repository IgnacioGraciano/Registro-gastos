import { ShieldCheck } from "lucide-react";
import CategoriasConfigRow from "@/components/configuracion/CategoriasConfigRow";
import MonedaConfigRow from "@/components/configuracion/MonedaConfigRow";
import CuentasConfigRow from "@/components/configuracion/CuentasConfigRow";
import SuscripcionesConfigRow from "@/components/configuracion/SuscripcionesConfigRow";
import BackupConfigRow from "@/components/configuracion/BackupConfigRow";
import PrestamosConfigRow from "@/components/configuracion/PrestamosConfigRow";

export default function ConfiguracionPage() {
  return (
    <div className="flex flex-col gap-6 px-5 pt-[calc(var(--safe-top)+18px)] sm:pt-6">
      <header>
        <h1 className="font-display text-[22px] font-semibold tracking-tight text-ink">
          Configuración
        </h1>
      </header>

      <section className="overflow-hidden rounded-ios bg-surface shadow-card">
        <CuentasConfigRow />
        <PrestamosConfigRow />
        <SuscripcionesConfigRow />
        <CategoriasConfigRow />
        <MonedaConfigRow />
        <BackupConfigRow />
      </section>

      {/* Nota de privacidad: refuerza la promesa de almacenamiento 100% local */}
      <div className="mb-4 flex items-start gap-2.5 rounded-ios bg-accent-soft p-3.5">
        <ShieldCheck size={18} className="mt-0.5 shrink-0 text-accent" />
        <p className="text-[12.5px] leading-snug text-ink-soft">
          Todos tus datos se guardan únicamente en este dispositivo. Nada se envía a servidores
          externos.
        </p>
      </div>
    </div>
  );
}
