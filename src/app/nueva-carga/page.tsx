"use client";

import { useState } from "react";
import { Calendar, Check, Delete, Wallet } from "lucide-react";
import {
  billeterasRepo,
  categoriasRepo,
  transaccionesRepo,
  useCollection,
  NOMBRE_CATEGORIA_TRANSFERENCIA,
} from "@/lib/db";
import { ayerISO, hoyISO } from "@/lib/format";
import { obtenerIconoCategoria } from "@/lib/icons";
import { categoriaAplicaA } from "@/lib/categoria-filtros";

type Tecla =
  | { tipo: "digito"; valor: string }
  | { tipo: "coma" }
  | { tipo: "borrar" };

const FILAS_TECLADO: Tecla[][] = [
  [{ tipo: "digito", valor: "1" }, { tipo: "digito", valor: "2" }, { tipo: "digito", valor: "3" }],
  [{ tipo: "digito", valor: "4" }, { tipo: "digito", valor: "5" }, { tipo: "digito", valor: "6" }],
  [{ tipo: "digito", valor: "7" }, { tipo: "digito", valor: "8" }, { tipo: "digito", valor: "9" }],
  [{ tipo: "coma" }, { tipo: "digito", valor: "0" }, { tipo: "borrar" }],
];

const MAX_DIGITOS_ENTEROS = 9;
const MAX_DECIMALES = 2;

type OpcionFecha = "hoy" | "ayer" | "otra";

/** Formatea el string crudo que va tecleando el usuario con separador de miles, sin tocar la parte decimal mientras se escribe. */
function formatearMontoEnVivo(raw: string): string {
  const [entero, decimal] = raw.split(",");
  const enteroFormateado = new Intl.NumberFormat("es-AR").format(Number(entero || "0"));
  return decimal !== undefined ? `${enteroFormateado},${decimal}` : enteroFormateado;
}

function rawANumero(raw: string): number {
  const normalizado = raw.replace(",", ".");
  const numero = parseFloat(normalizado);
  return Number.isFinite(numero) ? numero : 0;
}

const ESTADO_INICIAL = {
  raw: "0",
  tipo: "gasto" as "gasto" | "ingreso",
  billeteraId: null as string | null,
  categoriaId: null as string | null,
  descripcion: "",
  opcionFecha: "hoy" as OpcionFecha,
};

export default function NuevaCargaPage() {
  const billeteras = useCollection(billeterasRepo);
  const categorias = useCollection(categoriasRepo);

  const [raw, setRaw] = useState(ESTADO_INICIAL.raw);
  const [tipo, setTipo] = useState<"gasto" | "ingreso">(ESTADO_INICIAL.tipo);
  const [billeteraId, setBilleteraId] = useState<string | null>(ESTADO_INICIAL.billeteraId);
  const [categoriaId, setCategoriaId] = useState<string | null>(ESTADO_INICIAL.categoriaId);
  const [descripcion, setDescripcion] = useState(ESTADO_INICIAL.descripcion);
  const [opcionFecha, setOpcionFecha] = useState<OpcionFecha>(ESTADO_INICIAL.opcionFecha);
  const [fechaOtra, setFechaOtra] = useState(hoyISO());
  const [error, setError] = useState<string | null>(null);
  const [mostrarExito, setMostrarExito] = useState(false);

  const montoNumero = rawANumero(raw);
  const puedeRegistrar = montoNumero > 0 && billeteraId !== null && categoriaId !== null;

  const fechaFinal =
    opcionFecha === "hoy" ? hoyISO() : opcionFecha === "ayer" ? ayerISO() : fechaOtra;

  // La categoría de sistema "Transferencia" no se ofrece para cargas manuales,
  // y sólo se muestran las categorías que aplican al tipo elegido (Gasto/Ingreso).
  const categoriasDisponibles = categorias.filter(
    (c) => c.nombre !== NOMBRE_CATEGORIA_TRANSFERENCIA && categoriaAplicaA(c, tipo)
  );

  function cambiarTipo(nuevoTipo: "gasto" | "ingreso") {
    setTipo(nuevoTipo);
    // Si la categoría elegida no aplica al nuevo tipo, se limpia para no dejar una selección inválida.
    setCategoriaId((actual) => {
      if (!actual) return actual;
      const categoriaActual = categorias.find((c) => c.id === actual);
      if (categoriaActual && categoriaAplicaA(categoriaActual, nuevoTipo)) return actual;
      return null;
    });
  }

  function presionarTecla(tecla: Tecla) {
    setError(null);

    if (tecla.tipo === "borrar") {
      setRaw((actual) => (actual.length <= 1 ? "0" : actual.slice(0, -1)));
      return;
    }

    if (tecla.tipo === "coma") {
      setRaw((actual) => (actual.includes(",") ? actual : `${actual},`));
      return;
    }

    // tecla.tipo === "digito"
    setRaw((actual) => {
      const [entero, decimal] = actual.split(",");
      if (decimal !== undefined) {
        if (decimal.length >= MAX_DECIMALES) return actual;
        return `${entero},${decimal}${tecla.valor}`;
      }
      if (entero === "0") {
        return tecla.valor === "0" ? "0" : tecla.valor;
      }
      if (entero.length >= MAX_DIGITOS_ENTEROS) return actual;
      return `${entero}${tecla.valor}`;
    });
  }

  function registrar() {
    if (!billeteraId || !categoriaId || montoNumero <= 0) return;

    try {
      transaccionesRepo.crear({
        monto: montoNumero,
        tipo,
        billeteraId,
        categoriaId,
        descripcion: descripcion.trim(),
        fecha: fechaFinal,
      });

      // Reset + animación de éxito (el overlay tapa el "salto" visual del reset)
      setRaw(ESTADO_INICIAL.raw);
      setTipo(ESTADO_INICIAL.tipo);
      setBilleteraId(ESTADO_INICIAL.billeteraId);
      setCategoriaId(ESTADO_INICIAL.categoriaId);
      setDescripcion(ESTADO_INICIAL.descripcion);
      setOpcionFecha(ESTADO_INICIAL.opcionFecha);
      setFechaOtra(hoyISO());
      setError(null);
      setMostrarExito(true);
      setTimeout(() => setMostrarExito(false), 1000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo registrar la transacción.");
    }
  }

  return (
    <div className="relative flex h-full flex-col">
      {/* ── Bloque superior fijo: tipo + monto + teclado ── */}
      <div className="shrink-0 px-5 pt-[calc(var(--safe-top)+14px)]">
        <h1 className="text-center text-[13px] font-semibold uppercase tracking-wide text-ink-faint">
          Nueva carga
        </h1>

        {/* Toggle deslizante Gasto / Ingreso: arriba de todo */}
        <div className="relative mt-3 grid grid-cols-2 rounded-full bg-surface-line p-1">
          <div
            className={`absolute inset-y-1 left-1 w-[calc(50%-4px)] rounded-full bg-surface shadow-card transition-transform duration-300 ease-ios ${
              tipo === "ingreso" ? "translate-x-[calc(100%+4px)]" : "translate-x-0"
            }`}
          />
          <button
            type="button"
            onClick={() => cambiarTipo("gasto")}
            className={`ios-press relative z-10 rounded-full py-2 text-[14px] font-semibold transition-colors duration-200 ${
              tipo === "gasto" ? "text-ink" : "text-ink-faint"
            }`}
          >
            Gasto
          </button>
          <button
            type="button"
            onClick={() => cambiarTipo("ingreso")}
            className={`ios-press relative z-10 rounded-full py-2 text-[14px] font-semibold transition-colors duration-200 ${
              tipo === "ingreso" ? "text-accent" : "text-ink-faint"
            }`}
          >
            Ingreso
          </button>
        </div>

        <div className="flex flex-col items-center py-2">
          <p
            className={`figure-amount text-[46px] font-bold leading-none tracking-tight transition-colors duration-200 ${
              tipo === "gasto" ? "text-expense" : "text-accent"
            }`}
          >
            {montoNumero > 0 ? (tipo === "gasto" ? "−" : "+") : ""}${formatearMontoEnVivo(raw)}
          </p>
        </div>

        {/* Teclado numérico propio (no dispara el teclado nativo) */}
        <div className="mt-2 grid grid-cols-3 gap-2">
          {FILAS_TECLADO.flat().map((tecla, i) => (
            <button
              key={i}
              type="button"
              onClick={() => presionarTecla(tecla)}
              aria-label={
                tecla.tipo === "borrar" ? "Borrar" : tecla.tipo === "coma" ? "Coma decimal" : tecla.valor
              }
              className="ios-press flex h-[52px] items-center justify-center rounded-ios bg-surface text-[20px] font-semibold text-ink shadow-card"
            >
              {tecla.tipo === "borrar" ? (
                <Delete size={20} className="text-ink-soft" />
              ) : tecla.tipo === "coma" ? (
                ","
              ) : (
                tecla.valor
              )}
            </button>
          ))}
        </div>
      </div>

      {/* ── Bloque medio, scrolleable: billetera / categoría / fecha / descripción ── */}
      <div className="no-scrollbar scroll-contenido min-h-0 flex-1 overflow-y-auto px-5 pb-3 pt-4">
        {/* Billetera (obligatorio) */}
        <section className="mb-4">
          <h2 className="mb-2 px-0.5 text-[13px] font-semibold text-ink">
            ¿De dónde sale / entra?
          </h2>
          <div className="no-scrollbar scroll-contenido flex max-h-[92px] flex-wrap gap-2 overflow-y-auto pb-1">
            {billeteras.map((b) => {
              const activa = billeteraId === b.id;
              return (
                <button
                  key={b.id}
                  type="button"
                  onClick={() => setBilleteraId(b.id)}
                  className={`ios-press flex items-center gap-1.5 rounded-full px-3.5 py-2 shadow-card ${
                    activa ? "bg-brand text-white" : "bg-surface text-ink"
                  }`}
                >
                  <Wallet size={15} className={activa ? "text-white" : "text-ink-soft"} />
                  <span className="text-[13px] font-medium leading-tight">{b.nombre}</span>
                </button>
              );
            })}
            {billeteras.length === 0 && (
              <p className="py-2 text-[13px] text-ink-faint">Todavía no hay billeteras creadas.</p>
            )}
          </div>
        </section>

        {/* Categoría (obligatorio) */}
        <section className="mb-4">
          <h2 className="mb-2 px-0.5 text-[13px] font-semibold text-ink">Categoría</h2>
          <div className="grid grid-cols-3 gap-2">
            {categoriasDisponibles.map((c) => {
              const Icono = obtenerIconoCategoria(c.icono);
              const activa = categoriaId === c.id;
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setCategoriaId(c.id)}
                  className={`ios-press flex flex-col items-center gap-1.5 rounded-ios p-3 shadow-card ${
                    activa ? "bg-accent text-white" : "bg-surface text-ink-soft"
                  }`}
                >
                  <Icono size={20} />
                  <span className="text-[11px] font-medium leading-tight">{c.nombre}</span>
                </button>
              );
            })}
            {categoriasDisponibles.length === 0 && (
              <p className="col-span-3 py-2 text-center text-[13px] text-ink-faint">
                Todavía no hay categorías de {tipo === "gasto" ? "gastos" : "ingresos"}.
              </p>
            )}
          </div>
        </section>

        {/* Fecha: Hoy / Ayer / Otra (con calendario) */}
        <section className="mb-4">
          <h2 className="mb-2 px-0.5 text-[13px] font-semibold text-ink">Fecha</h2>
          <div className="flex gap-2">
            {(["hoy", "ayer", "otra"] as const).map((opcion) => {
              const activa = opcionFecha === opcion;
              return (
                <button
                  key={opcion}
                  type="button"
                  onClick={() => setOpcionFecha(opcion)}
                  className={`ios-press flex-1 rounded-ios py-2.5 text-[13px] font-semibold capitalize shadow-card ${
                    activa ? "bg-brand text-white" : "bg-surface text-ink-soft"
                  }`}
                >
                  {opcion === "otra" ? "Otra" : opcion === "hoy" ? "Hoy" : "Ayer"}
                </button>
              );
            })}
          </div>
          {opcionFecha === "otra" && (
            <div className="mt-2 flex items-center gap-2 rounded-ios bg-surface p-3 shadow-card">
              <Calendar size={16} className="shrink-0 text-ink-soft" />
              <input
                type="date"
                value={fechaOtra}
                max={hoyISO()}
                onChange={(e) => setFechaOtra(e.target.value)}
                className="w-full bg-transparent text-[14px] text-ink outline-none"
              />
            </div>
          )}
        </section>

        {/* Descripción (opcional) */}
        <section>
          <h2 className="mb-2 px-0.5 text-[13px] font-semibold text-ink">Descripción</h2>
          <input
            type="text"
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
            placeholder="Opcional, ej: Almuerzo con amigos"
            maxLength={60}
            className="w-full rounded-ios bg-surface p-3 text-[14px] text-ink shadow-card outline-none placeholder:text-ink-faint"
          />
        </section>
      </div>

      {/* ── Bloque inferior fijo: error + botón Registrar (siempre visible) ── */}
      <div className="shrink-0 border-t border-surface-line bg-surface-base px-5 pb-3 pt-3">
        {error && (
          <p className="mb-2 text-center text-[12.5px] font-medium text-expense">{error}</p>
        )}
        <button
          type="button"
          onClick={registrar}
          disabled={!puedeRegistrar}
          className={`ios-press w-full rounded-ios py-4 text-[16px] font-bold text-white transition-colors duration-200 ${
            puedeRegistrar ? (tipo === "gasto" ? "bg-brand" : "bg-accent") : "bg-brand/25"
          }`}
        >
          Registrar
        </button>
      </div>

      {/* ── Overlay de éxito (tapa el reset y se desvanece sola) ── */}
      {mostrarExito && (
        <div
          className="absolute inset-0 z-[60] flex flex-col items-center justify-center gap-3 bg-surface-base/95 backdrop-blur-sm animate-fade-out"
          style={{ animationDelay: "650ms" }}
        >
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-accent text-white shadow-fab animate-pop-in">
            <Check size={36} strokeWidth={3} />
          </div>
          <p className="animate-pop-in text-[15px] font-semibold text-ink">¡Guardado!</p>
        </div>
      )}
    </div>
  );
}
