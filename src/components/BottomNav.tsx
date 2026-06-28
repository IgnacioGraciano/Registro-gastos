"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Plus, BarChart3, Settings } from "lucide-react";
import type { LucideIcon } from "lucide-react";

type Tab = {
  href: string;
  label: string;
  icon: LucideIcon;
  isFab?: boolean;
};

const TABS: Tab[] = [
  { href: "/", label: "Dashboard", icon: Home },
  { href: "/nueva-carga", label: "Nueva Carga", icon: Plus, isFab: true },
  { href: "/estadisticas", label: "Estadísticas", icon: BarChart3 },
  { href: "/historial", label: "Configuración", icon: Settings },
];

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname.startsWith(href);
}

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      className="glass-tabbar absolute inset-x-0 bottom-0 z-50 border-t border-surface-line
                 pb-[var(--safe-bottom)]"
      style={{ height: "calc(var(--tabbar-height) + var(--safe-bottom))" }}
      aria-label="Navegación principal"
    >
      <div className="grid h-[var(--tabbar-height)] grid-cols-4">
        {TABS.map((tab) => {
          const active = isActive(pathname, tab.href);
          const Icon = tab.icon;

          if (tab.isFab) {
            return (
              <div key={tab.href} className="relative flex flex-col items-center justify-end">
                <Link
                  href={tab.href}
                  aria-label={tab.label}
                  className="ios-press absolute -top-6 flex h-14 w-14 items-center justify-center
                             rounded-full bg-accent shadow-fab ring-4 ring-surface-base
                             transition-transform duration-200 ease-ios active:scale-95"
                >
                  <Plus size={26} strokeWidth={2.4} className="text-white" />
                </Link>
                <span
                  className={`mb-1.5 text-[10px] font-medium tracking-tight ${
                    active ? "text-accent" : "text-ink-faint"
                  }`}
                >
                  {tab.label}
                </span>
              </div>
            );
          }

          return (
            <Link
              key={tab.href}
              href={tab.href}
              className="ios-press flex flex-col items-center justify-center gap-1"
            >
              <Icon
                size={23}
                strokeWidth={active ? 2.4 : 2}
                className={active ? "text-accent" : "text-ink-faint"}
              />
              <span
                className={`text-[10px] tracking-tight ${
                  active ? "font-semibold text-accent" : "font-medium text-ink-faint"
                }`}
              >
                {tab.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
