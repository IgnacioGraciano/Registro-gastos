import { Download, Lock, Info, ShieldCheck } from "lucide-react";
import CategoriasConfigRow from "@/components/configuracion/CategoriasConfigRow";
import MonedaConfigRow from "@/components/configuracion/MonedaConfigRow";
import CuentasConfigRow from "@/components/configuracion/CuentasConfigRow";
import SuscripcionesConfigRow from "@/components/configuracion/SuscripcionesConfigRow";

const AJUSTES_ESTATICOS: { label: string; icon: typeof Download }[] = [
  { label: "Exportar datos", icon: Download },
  { label: "Código de acceso", icon: Lock },
  { label: "Acerca de", icon: Info },
];

export default function ConfiguracionPage() {
  return (
    <div className="flex flex-col gap-6 px-5 pt-[calc(var(--safe-top)+18px)] sm:pt-6">
      <header>
        <h1 className="font-display text-[22px] font-semibold tracking-tight text-ink">
          Configuración
        </h1>
      </header>

      <section className="overflow-hidden rounded-ios bg-surface shadow-card">
        {/* Funcionales */}
        <CuentasConfigRow />
        <SuscripcionesConfigRow />
        <CategoriasConfigRow />
        <MonedaConfigRow />

        {/* Estáticas (sin cambios) */}
        {AJUSTES_ESTATICOS.map((item, i) => {
          const Icon = item.icon;
          return (
            <button
              key={item.label}
              className={`ios-press flex w-full items-center gap-3 p-3.5 ${
                i !== AJUSTES_ESTATICOS.length - 1 ? "border-b border-surface-line" : ""
              }`}
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-surface-line text-ink-soft">
                <Icon size={17} />
              </span>
              <span className="flex-1 text-left text-[14px] font-medium text-ink">{item.label}</span>
            </button>
          );
        })}
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
