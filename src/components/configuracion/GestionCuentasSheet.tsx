"use client";

import { useState } from "react";
import { Check, Pencil, Plus, RotateCcw, Trash2, Wallet, X } from "lucide-react";
import { billeterasRepo, useCollection, useMoneda } from "@/lib/db";
import { formatMonto } from "@/lib/format";
import BottomSheet from "@/components/BottomSheet";

interface Props {
  abierto: boolean;
  onCerrar: () => void;
}

export default function GestionCuentasSheet({ abierto, onCerrar }: Props) {
  const billeteras = useCollection(billeterasRepo);
  const moneda = useMoneda();

  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [saldoEditado, setSaldoEditado] = useState("");

  const [nombreNueva, setNombreNueva] = useState("");
  const [saldoNueva, setSaldoNueva] = useState("");

  const [confirmarReset, setConfirmarReset] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function empezarEdicion(id: string, saldoActual: number) {
    setEditandoId(id);
    setSaldoEditado(String(saldoActual));
    setError(null);
  }

  function guardarSaldoEditado() {
    if (!editandoId) return;
    const nuevoSaldo = parseFloat(saldoEditado.replace(",", "."));
    if (!Number.isFinite(nuevoSaldo)) {
      setError("Ingresá un número válido.");
      return;
    }
    billeterasRepo.establecerSaldo(editandoId, nuevoSaldo);
    setEditandoId(null);
    setError(null);
  }

  function crear() {
    const nombre = nombreNueva.trim();
    if (!nombre) return;
    const saldoInicial = saldoNueva.trim() === "" ? 0 : parseFloat(saldoNueva.replace(",", "."));
    try {
      billeterasRepo.crear(nombre, Number.isFinite(saldoInicial) ? saldoInicial : 0);
      setNombreNueva("");
      setSaldoNueva("");
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo crear la cuenta.");
    }
  }

  function restablecerTodas() {
    billeteras.forEach((b) => billeterasRepo.establecerSaldo(b.id, 0));
    setConfirmarReset(false);
  }

  return (
    <BottomSheet abierto={abierto} onCerrar={onCerrar} titulo="Cuentas">
      <div className="flex flex-col gap-4">
        {/* Lista de cuentas */}
        <div className="flex flex-col gap-2">
          {billeteras.length === 0 && (
            <p className="py-2 text-center text-[13px] text-ink-faint">Todavía no hay cuentas.</p>
          )}
          {billeteras.map((b) => {
            const editando = editandoId === b.id;
            return (
              <div key={b.id} className="rounded-ios bg-surface p-3 shadow-card">
                <div className="flex items-center gap-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-surface-line text-ink-soft">
                    <Wallet size={16} />
                  </span>
                  <span className="flex-1 text-[14px] font-medium text-ink">{b.nombre}</span>

                  {editando ? (
                    <>
                      <input
                        autoFocus
                        type="number"
                        inputMode="decimal"
                        value={saldoEditado}
                        onChange={(e) => setSaldoEditado(e.target.value)}
                        className="figure-amount w-24 rounded-ios bg-surface-base p-1.5 text-right text-[13px] outline-none"
                      />
                      <button
                        type="button"
                        onClick={guardarSaldoEditado}
                        aria-label="Guardar saldo"
                        className="ios-press flex h-8 w-8 items-center justify-center rounded-full bg-accent text-white"
                      >
                        <Check size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditandoId(null)}
                        aria-label="Cancelar"
                        className="ios-press flex h-8 w-8 items-center justify-center rounded-full bg-surface-line text-ink-soft"
                      >
                        <X size={14} />
                      </button>
                    </>
                  ) : (
                    <>
                      <span className="figure-amount text-[14px] font-semibold text-ink">
                        {formatMonto(b.saldo, moneda)}
                      </span>
                      <button
                        type="button"
                        onClick={() => empezarEdicion(b.id, b.saldo)}
                        aria-label={`Editar saldo de ${b.nombre}`}
                        className="ios-press flex h-8 w-8 items-center justify-center rounded-full bg-surface-line text-ink-soft"
                      >
                        <Pencil size={13} />
                      </button>
                      <button
                        type="button"
                        onClick={() => billeterasRepo.eliminar(b.id)}
                        aria-label={`Eliminar ${b.nombre}`}
                        className="ios-press flex h-8 w-8 items-center justify-center rounded-full bg-expense-soft text-expense"
                      >
                        <Trash2 size={13} />
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {error && <p className="text-center text-[12.5px] font-medium text-expense">{error}</p>}

        {/* Alta de cuenta nueva */}
        <div className="rounded-ios-lg bg-surface p-3.5 shadow-card">
          <p className="mb-2 text-[13px] font-semibold text-ink">Nueva cuenta</p>
          <div className="mb-2 flex gap-2">
            <input
              type="text"
              value={nombreNueva}
              onChange={(e) => setNombreNueva(e.target.value)}
              placeholder="Nombre, ej: Galicia"
              maxLength={30}
              className="flex-1 rounded-ios bg-surface-base p-2.5 text-[14px] text-ink outline-none placeholder:text-ink-faint"
            />
            <input
              type="number"
              inputMode="decimal"
              value={saldoNueva}
              onChange={(e) => setSaldoNueva(e.target.value)}
              placeholder="Saldo"
              className="figure-amount w-24 rounded-ios bg-surface-base p-2.5 text-right text-[14px] text-ink outline-none placeholder:text-ink-faint"
            />
          </div>
          <button
            type="button"
            onClick={crear}
            disabled={!nombreNueva.trim()}
            className={`ios-press flex w-full items-center justify-center gap-1.5 rounded-ios py-2.5 text-[14px] font-bold text-white ${
              nombreNueva.trim() ? "bg-brand" : "bg-brand/25"
            }`}
          >
            <Plus size={16} />
            Crear cuenta
          </button>
        </div>

        {/* Restablecer todo a $0 */}
        {!confirmarReset ? (
          <button
            type="button"
            onClick={() => setConfirmarReset(true)}
            className="ios-press flex items-center justify-center gap-1.5 rounded-ios border border-dashed border-surface-line py-3 text-[13px] font-medium text-ink-faint"
          >
            <RotateCcw size={14} />
            Restablecer todos los saldos a $0
          </button>
        ) : (
          <div className="rounded-ios bg-expense-soft p-3.5">
            <p className="mb-2 text-center text-[12.5px] font-medium text-expense">
              Esto pone en $0 el saldo de todas las cuentas (no borra movimientos). ¿Confirmás?
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setConfirmarReset(false)}
                className="ios-press flex-1 rounded-ios bg-surface py-2 text-[13px] font-semibold text-ink"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={restablecerTodas}
                className="ios-press flex-1 rounded-ios bg-expense py-2 text-[13px] font-semibold text-white"
              >
                Sí, restablecer
              </button>
            </div>
          </div>
        )}
      </div>
    </BottomSheet>
  );
}
