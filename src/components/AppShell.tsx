import BottomNav from "@/components/BottomNav";

export default function AppShell({ children }: { children: React.ReactNode }) {
  return (
    // Fondo "ambiente" detrás del dispositivo, sólo visible en pantallas grandes
    <div className="flex min-h-[100dvh] w-full justify-center bg-[#070704] sm:py-6">
      {/* Marco del dispositivo: 100% en mobile, simil-iPhone centrado en desktop */}
      <div
        className="relative h-[100dvh] w-full max-w-[430px] overflow-hidden bg-surface-base
                   sm:h-[calc(100dvh-3rem)] sm:max-h-[896px] sm:rounded-[44px]
                   sm:border sm:border-white/[0.08] sm:shadow-2xl"
      >
        {/* Notch / status-bar safe area superior (sólo estética en desktop) */}
        <div className="pointer-events-none absolute inset-x-0 top-0 z-40 h-[var(--safe-top)] sm:h-2" />

        {/* Contenido scrolleable, con espacio inferior para la tab bar */}
        <main
          className="no-scrollbar scroll-contenido absolute inset-0 overflow-y-auto overflow-x-hidden
                     pb-[calc(var(--tabbar-height)+var(--safe-bottom)+18px)]"
        >
          {children}
        </main>

        {/* Bottom Tab Bar fija al marco del dispositivo (no al viewport) */}
        <BottomNav />
      </div>
    </div>
  );
}
