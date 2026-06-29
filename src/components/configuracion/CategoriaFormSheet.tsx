"use client";

import { useEffect, useState } from "react";
import { categoriasRepo, type Categoria, type TipoCategoria } from "@/lib/db";
import { PALETA_COLORES_CATEGORIA } from "@/lib/categoria-filtros";
import { obtenerIconoCategoria, ICONOS_DISPONIBLES } from "@/lib/icons";
import BottomSheet from "@/components/BottomSheet";

interface Props {
  abierto: boolean;
  onCerrar: () => void;
  /** Si se pasa, edita esta categoría. Si no, crea una nueva. */
  categoria: Categoria | null;
  /** Tipo con el que se crea una categoría nueva (no aplica al editar). */
  tipoNueva: TipoCategoria;
}

/** Hoja de alta/edición de una categoría: nombre, color y un ícono entre 70+ opciones. El botón Guardar queda fijo abajo (no se "esconde" con el scroll del listado de íconos). */
export default function CategoriaFormSheet({ abierto, onCerrar, categoria, tipoNueva }: Props) {
  const [nombre, setNombre] = useState("");
  const [icono, setIcono] = useState("Tag");
  const [color, setColor] = useState(PALETA_COLORES_CATEGORIA[0]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!abierto) return;
    if (categoria) {
      setNombre(categoria.nombre);
      setIcono(categoria.icono);
      setColor(categoria.color ?? PALETA_COLORES_CATEGORIA[0]);
    } else {
      setNombre("");
      setIcono("Tag");
      setColor(PALETA_COLORES_CATEGORIA[0]);
    }
    setError(null);
  }, [abierto, categoria]);

  function guardar() {
    const nombreLimpio = nombre.trim();
    if (!nombreLimpio) return;
    try {
      if (categoria) {
        categoriasRepo.actualizar(categoria.id, { nombre: nombreLimpio, icono, color });
      } else {
        categoriasRepo.crear(nombreLimpio, icono, tipoNueva, color);
      }
      onCerrar();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo guardar la categoría.");
    }
  }

  return (
    <BottomSheet
      abierto={abierto}
      onCerrar={onCerrar}
      titulo={categoria ? "Editar categoría" : "Nueva categoría"}
      footer={
        <>
          {error && <p className="mb-2 text-center text-[12px] font-medium text-expense">{error}</p>}
          <button
            type="button"
            onClick={guardar}
            disabled={!nombre.trim()}
            className={`ios-press w-full rounded-ios py-3.5 text-[15px] font-bold text-white ${
              nombre.trim() ? "bg-brand" : "bg-brand/25"
            }`}
          >
            {categoria ? "Guardar cambios" : "Crear categoría"}
          </button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <div>
          <p className="mb-2 text-[13px] font-semibold text-ink">Nombre</p>
          <input
            type="text"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            placeholder="Ej: Mascotas, Freelance"
            maxLength={30}
            className="w-full rounded-ios bg-surface p-3 text-[14px] text-ink shadow-card outline-none placeholder:text-ink-faint"
          />
        </div>

        {/* Selector de color */}
        <div>
          <p className="mb-2 text-[13px] font-semibold text-ink">Color</p>
          <div className="flex flex-wrap gap-2">
            {PALETA_COLORES_CATEGORIA.map((c) => {
              const activo = color === c;
              return (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  aria-label={`Color ${c}`}
                  className={`h-9 w-9 shrink-0 rounded-full transition-transform ${
                    activo ? "scale-110 ring-2 ring-ink ring-offset-2 ring-offset-surface-base" : ""
                  }`}
                  style={{ backgroundColor: c }}
                />
              );
            })}
          </div>
        </div>

        {/* Selector de ícono: grilla amplia */}
        <div>
          <p className="mb-2 text-[13px] font-semibold text-ink">Ícono</p>
          <div className="flex flex-wrap gap-2">
            {ICONOS_DISPONIBLES.map((nombreIcono) => {
              const Icono = obtenerIconoCategoria(nombreIcono);
              const activo = icono === nombreIcono;
              return (
                <button
                  key={nombreIcono}
                  type="button"
                  onClick={() => setIcono(nombreIcono)}
                  className={`ios-press flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
                    activo ? "text-white" : "bg-surface text-ink-soft"
                  }`}
                  style={activo ? { backgroundColor: color } : undefined}
                >
                  <Icono size={17} />
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </BottomSheet>
  );
}
