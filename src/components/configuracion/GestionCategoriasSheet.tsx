"use client";

import { useState } from "react";
import { Pencil, Trash2, X } from "lucide-react";
import { categoriasRepo, useCollection, NOMBRE_CATEGORIA_TRANSFERENCIA } from "@/lib/db";
import { categoriaAplicaA, obtenerColorCategoria, PALETA_COLORES_CATEGORIA } from "@/lib/categoria-filtros";
import { obtenerIconoCategoria, ICONOS_DISPONIBLES } from "@/lib/icons";
import BottomSheet from "@/components/BottomSheet";

interface Props {
  abierto: boolean;
  onCerrar: () => void;
}

export default function GestionCategoriasSheet({ abierto, onCerrar }: Props) {
  const categorias = useCollection(categoriasRepo);
  const [tipoActivo, setTipoActivo] = useState<"gasto" | "ingreso">("gasto");

  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [nombreForm, setNombreForm] = useState("");
  const [iconoForm, setIconoForm] = useState("Tag");
  const [colorForm, setColorForm] = useState(PALETA_COLORES_CATEGORIA[0]);
  const [error, setError] = useState<string | null>(null);

  const categoriasDelTipo = categorias.filter(
    (c) => c.nombre !== NOMBRE_CATEGORIA_TRANSFERENCIA && categoriaAplicaA(c, tipoActivo)
  );

  function empezarCreacion() {
    setEditandoId(null);
    setNombreForm("");
    setIconoForm("Tag");
    setColorForm(PALETA_COLORES_CATEGORIA[0]);
    setError(null);
  }

  function empezarEdicion(id: string) {
    const categoria = categorias.find((c) => c.id === id);
    if (!categoria) return;
    setEditandoId(id);
    setNombreForm(categoria.nombre);
    setIconoForm(categoria.icono);
    setColorForm(obtenerColorCategoria(categoria, categorias));
    setError(null);
  }

  function guardar() {
    const nombre = nombreForm.trim();
    if (!nombre) return;
    try {
      if (editandoId) {
        categoriasRepo.actualizar(editandoId, { nombre, icono: iconoForm, color: colorForm });
      } else {
        categoriasRepo.crear(nombre, iconoForm, tipoActivo, colorForm);
      }
      empezarCreacion();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo guardar la categoría.");
    }
  }

  function eliminar(id: string) {
    try {
      categoriasRepo.eliminar(id);
      if (editandoId === id) empezarCreacion();
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo eliminar la categoría.");
    }
  }

  return (
    <BottomSheet abierto={abierto} onCerrar={onCerrar} titulo="Categorías">
      <div className="flex flex-col gap-4">
        {/* Toggle Gasto / Ingreso */}
        <div className="relative grid grid-cols-2 rounded-full bg-surface-line p-1">
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

        {/* Lista de categorías del tipo activo */}
        <div className="flex flex-col gap-2">
          {categoriasDelTipo.length === 0 && (
            <p className="py-2 text-center text-[13px] text-ink-faint">
              Todavía no hay categorías de {tipoActivo === "gasto" ? "gastos" : "ingresos"}.
            </p>
          )}
          {categoriasDelTipo.map((c) => {
            const Icono = obtenerIconoCategoria(c.icono);
            const color = obtenerColorCategoria(c, categorias);
            return (
              <div key={c.id} className="flex items-center gap-3 rounded-ios bg-surface p-3 shadow-card">
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
                      onClick={() => empezarEdicion(c.id)}
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

        {/* Alta / edición de categoría */}
        <div className="rounded-ios-lg bg-surface p-3.5 shadow-card">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-[13px] font-semibold text-ink">
              {editandoId
                ? "Editar categoría"
                : `Nueva categoría de ${tipoActivo === "gasto" ? "gasto" : "ingreso"}`}
            </p>
            {editandoId && (
              <button
                type="button"
                onClick={empezarCreacion}
                aria-label="Cancelar edición"
                className="ios-press flex h-7 w-7 items-center justify-center rounded-full bg-surface-line text-ink-soft"
              >
                <X size={13} />
              </button>
            )}
          </div>

          <input
            type="text"
            value={nombreForm}
            onChange={(e) => setNombreForm(e.target.value)}
            placeholder="Ej: Mascotas, Freelance"
            maxLength={30}
            className="mb-3 w-full rounded-ios bg-surface-base p-2.5 text-[14px] text-ink outline-none placeholder:text-ink-faint"
          />

          {/* Selector de color */}
          <p className="mb-1.5 text-[12px] font-medium text-ink-faint">Color</p>
          <div className="mb-3 flex flex-wrap gap-2">
            {PALETA_COLORES_CATEGORIA.map((c) => {
              const activo = colorForm === c;
              return (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColorForm(c)}
                  aria-label={`Color ${c}`}
                  className={`h-8 w-8 shrink-0 rounded-full transition-transform ${
                    activo ? "scale-110 ring-2 ring-ink ring-offset-2 ring-offset-surface" : ""
                  }`}
                  style={{ backgroundColor: c }}
                />
              );
            })}
          </div>

          {/* Selector de ícono: grilla amplia con scroll */}
          <p className="mb-1.5 text-[12px] font-medium text-ink-faint">Ícono</p>
          <div className="no-scrollbar scroll-contenido mb-3 flex max-h-[168px] flex-wrap gap-2 overflow-y-auto">
            {ICONOS_DISPONIBLES.map((nombreIcono) => {
              const Icono = obtenerIconoCategoria(nombreIcono);
              const activo = iconoForm === nombreIcono;
              return (
                <button
                  key={nombreIcono}
                  type="button"
                  onClick={() => setIconoForm(nombreIcono)}
                  className={`ios-press flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
                    activo ? "text-white" : "bg-surface-base text-ink-soft"
                  }`}
                  style={activo ? { backgroundColor: colorForm } : undefined}
                >
                  <Icono size={16} />
                </button>
              );
            })}
          </div>

          {error && <p className="mb-2 text-[12px] font-medium text-expense">{error}</p>}
          <button
            type="button"
            onClick={guardar}
            disabled={!nombreForm.trim()}
            className={`ios-press w-full rounded-ios py-2.5 text-[14px] font-bold text-white ${
              nombreForm.trim() ? "bg-brand" : "bg-brand/25"
            }`}
          >
            {editandoId ? "Guardar cambios" : "Crear categoría"}
          </button>
        </div>
      </div>
    </BottomSheet>
  );
}
