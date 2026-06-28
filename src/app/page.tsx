import BalanceResumen from "@/components/dashboard/BalanceResumen";
import DistribucionCategorias from "@/components/dashboard/DistribucionCategorias";
import HistorialButton from "@/components/dashboard/HistorialButton";

export default function DashboardPage() {
  return (
    <div className="flex flex-col gap-5 px-5 pb-2 pt-[calc(var(--safe-top)+16px)]">
      <header className="flex items-center justify-between">
        <h1 className="font-display text-[22px] font-semibold tracking-tight text-ink">
          Resumen Mensual
        </h1>
        <HistorialButton />
      </header>

      <BalanceResumen />
      <DistribucionCategorias />
    </div>
  );
}
