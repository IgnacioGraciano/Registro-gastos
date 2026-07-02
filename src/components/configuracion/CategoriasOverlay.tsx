"use client";

import { useState } from "react";
import { ChevronDown, ChevronLeft, ChevronUp, Pencil, Plus, Trash2 } from "lucide-react";
import { categoriasRepo, useCollection, NOMBRE_CATEGORIA_TRANSFERENCIA, type Categoria } from "@/lib/db";
import { categoriaAplicaA, obtenerColorCategoria } from "@/lib/categoria-filtros";
import { obtenerIconoCategoria } from "@/lib/icons";
import CategoriaFormSheet from "./CategoriaFormSheet";

interface Props {
  abierto: boolean;
  onCerrar: () => void;
}

export default function CategoriasOverlay({ abierto, onCerrar }: Props) {
  const categorias = useCollection(categoriasRepo);
  const [tipoActivo, setTipoActivo] = useState<"gasto" | "ingreso">("gasto");
  const [formAbierto, setFormAbierto] = useState(false);
  const [categoriaEditando, setCategoriaEditando] = useState<Categoria | null>(null);

  if (!abierto) return null;

  // Ordenar por campo orden (retrocompatible: sin orden van al final)
  const categoriasDelTipo = [...categorias]
    .filter((c) => c.nombre !== NOMBRE_CATEGORIA_TRANSFERENCIA && categoriaAplicaA(c, tipoActivo))
    .sort((a, b) => (a.orden ?? Infinity) - (b.orden ?? Infinity));

  function abrirCreacion() {
    setCategoriaEditando(null);
    setFormAbierto(true);
  }

  function abrirEdicion(c: Categoria) {
    setCategoriaEditando(c);
    setFormAbierto(true);
  }

  function eliminar(id: string) {
    try {
      categoriasRepo.eliminar(id);
    } catch {
      // Categoría no editable: el botón de eliminar ni se muestra para esos casos.
    }
  }

  function mover(indice: number, direccion: -1 | 1) {
    const nuevoIndice = indice + direccion;
    if (nuevoIndice < 0 || nuevoIndice >= categoriasDelTipo.length) return;
    // Swap de los dos elementos en su posición
    const ids = categoriasDelTipo.map((c) => c.id);
    [ids[indice], ids[nuevoIndice]] = [ids[nuevoIndice], ids[indice]];
    categoriasRepo.reordenar(ids);
  }

  return (
    <div className="absolute inset-0 z-[80] flex flex-col bg-surface-base">
      <header className="flex shrink-0 items-center gap-3 border-b border-surface-line bg-surface-base px-5 pb-3 pt-[calc(var(--safe-top)+14px)]">
        <button
          type="button"
          onClick={onCerrar}
          aria-label="Volver"
          className="ios-press flex h-8 w-8 items-center justify-center rounded-full bg-surface shadow-card"
        >
          <ChevronLeft size={18} className="text-ink" />
        </button>
        <h1 className="flex-1 text-[17px] font-bold text-ink">Categorías</h1>
        <button
          type="button"
          onClick={abrirCreacion}
          aria-label="Nueva categoría"
          className="ios-press flex h-9 w-9 items-center justify-center rounded-full bg-brand text-white shadow-card"
        >
          <Plus size={18} />
        </button>
      </header>

      <div className="no-scrollbar scroll-contenido flex-1 overflow-y-auto px-5 py-4">
        {/* Toggle Gasto / Ingreso */}
        <div className="relative mb-4 grid grid-cols-2 rounded-full bg-surface-line p-1">
          <div
            className={`absolute inset-y-1 left-1 w-[calc(50%-4px)] rounded-full bg-surface shadow-card transition-transform duration-300 ease-ios ${
              tipoActivo === "ingreso" ? "translate-x-[calc(100%+4px)]" : "translate-x-0"
            }`}
          />
          <button
            type="button"
            onClick={() => setTipoActivo("gasto")}
            className={`ios-press relative z-10 rounded-full py-2 text-[14px] font-semibold transition-colors duration-200 ${
              tipoActivo === "gasto" ? "text-ink" : "text-ink-faint"
            }`}
          >
            Gastos
          </button>
          <button
            type="button"
            onClick={() => setTipoActivo("ingreso")}
            className={`ios-press relative z-10 rounded-full py-2 text-[14px] font-semibold transition-colors duration-200 ${
              tipoActivo === "ingreso" ? "text-accent" : "text-ink-faint"
            }`}
          >
            Ingresos
          </button>
        </div>

        {/* Lista */}
        <div className="flex flex-col gap-2 pb-[calc(var(--tabbar-height)+var(--safe-bottom)+8px)]">
          {categoriasDelTipo.length === 0 && (
            <p className="py-6 text-center text-[13px] text-ink-faint">
              Todavía no hay categorías de {tipoActivo === "gasto" ? "gastos" : "ingresos"}.
            </p>
          )}
          {categoriasDelTipo.map((c, i) => {
            const Icono = obtenerIconoCategoria(c.icono);
            const color = obtenerColorCategoria(c, categorias);
            return (
              <div key={c.id} className="flex items-center gap-2 rounded-ios bg-surface p-3 shadow-card">
                {/* Botones de reordenamiento */}
                <div className="flex flex-col gap-0.5">
                  <button
                    type="button"
                    onClick={() => mover(i, -1)}
                    disabled={i === 0}
                    aria-label="Mover arriba"
                    className={`flex h-6 w-6 items-center justify-center rounded-full ${
                      i === 0 ? "text-ink-faint opacity-30" : "ios-press bg-surface-line text-ink-soft"
                    }`}
                  >
                    <ChevronUp size={13} />
                  </button>
                  <button
                    type="button"
                    onClick={() => mover(i, 1)}
                    disabled={i === categoriasDelTipo.length - 1}
                    aria-label="Mover abajo"
                    className={`flex h-6 w-6 items-center justify-center rounded-full ${
                      i === categoriasDelTipo.length - 1
                        ? "text-ink-faint opacity-30"
                        : "ios-press bg-surface-line text-ink-soft"
                    }`}
                  >
                    <ChevronDown size={13} />
                  </button>
                </div>

                <span
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full"
                  style={{ backgroundColor: `${color}33`, color }}
                >
                  <Icono size={16} />
                </span>
                <span className="flex-1 truncate text-[14px] font-medium text-ink">{c.nombre}</span>
                {c.esEditable ? (
                  <>
                    <button
                      type="button"
                      onClick={() => abrirEdicion(c)}
                      aria-label={`Editar categoría ${c.nombre}`}
                      className="ios-press flex h-8 w-8 items-center justify-center rounded-full bg-surface-line text-ink-soft"
                    >
                      <Pencil size={13} />
                    </button>
                    <button
                      type="button"
                      onClick={() => eliminar(c.id)}
                      aria-label={`Eliminar categoría ${c.nombre}`}
                      className="ios-press flex h-8 w-8 items-center justify-center rounded-full bg-expense-soft text-expense"
                    >
                      <Trash2 size={15} />
                    </button>
                  </>
                ) : (
                  <span className="text-[11px] text-ink-faint">fija</span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <CategoriaFormSheet
        abierto={formAbierto}
        onCerrar={() => setFormAbierto(false)}
        categoria={categoriaEditando}
        tipoNueva={tipoActivo}
      />
    </div>
  );
}
