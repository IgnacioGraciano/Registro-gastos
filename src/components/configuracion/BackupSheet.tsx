"use client";

import { useRef, useState } from "react";
import { Download, ShieldAlert, Upload } from "lucide-react";
import { exportarTodoElStorage, importarTodoElStorage } from "@/lib/db";
import { hoyISO } from "@/lib/format";
import BottomSheet from "@/components/BottomSheet";

interface Props {
  abierto: boolean;
  onCerrar: () => void;
}

export default function BackupSheet({ abierto, onCerrar }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [pendienteDeConfirmar, setPendienteDeConfirmar] = useState<Record<string, string> | null>(
    null
  );
  const [error, setError] = useState<string | null>(null);

  function exportar() {
    const datos = exportarTodoElStorage();
    const contenido = JSON.stringify(
      { app: "gestor-gastos", version: 1, exportadoEl: new Date().toISOString(), datos },
      null,
      2
    );
    const blob = new Blob([contenido], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `gestor-gastos-backup-${hoyISO()}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  function elegirArchivo() {
    inputRef.current?.click();
  }

  function onArchivoElegido(e: React.ChangeEvent<HTMLInputElement>) {
    const archivo = e.target.files?.[0];
    e.target.value = ""; // permite elegir el mismo archivo otra vez si hace falta
    if (!archivo) return;

    const lector = new FileReader();
    lector.onload = () => {
      try {
        const parseado = JSON.parse(String(lector.result));
        const datos = parseado?.datos;
        if (!datos || typeof datos !== "object") throw new Error("Formato inválido");
        setPendienteDeConfirmar(datos);
        setError(null);
      } catch {
        setError("Ese archivo no parece ser un backup válido de esta app.");
      }
    };
    lector.onerror = () => setError("No se pudo leer el archivo.");
    lector.readAsText(archivo);
  }

  function confirmarImportacion() {
    if (!pendienteDeConfirmar) return;
    importarTodoElStorage(pendienteDeConfirmar);
    window.location.reload(); // recarga para que toda la app lea los datos restaurados desde cero
  }

  return (
    <BottomSheet abierto={abierto} onCerrar={onCerrar} titulo="Exportar / Importar datos">
      {pendienteDeConfirmar ? (
        <div className="flex flex-col gap-4">
          <div className="flex items-start gap-2.5 rounded-ios bg-expense-soft p-3.5">
            <ShieldAlert size={18} className="mt-0.5 shrink-0 text-expense" />
            <p className="text-[12.5px] leading-snug text-ink">
              Esto va a <span className="font-semibold">reemplazar todos los datos actuales</span> de
              la app (cuentas, movimientos, categorías, suscripciones) con los del backup elegido.
              No se puede deshacer.
            </p>
          </div>
          <button
            type="button"
            onClick={confirmarImportacion}
            className="ios-press w-full rounded-ios bg-expense py-3.5 text-[15px] font-bold text-white"
          >
            Sí, reemplazar mis datos
          </button>
          <button
            type="button"
            onClick={() => setPendienteDeConfirmar(null)}
            className="ios-press w-full rounded-ios py-2 text-[13px] font-semibold text-ink-faint"
          >
            Cancelar
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <p className="text-[12.5px] leading-snug text-ink-faint">
            Todos tus datos viven únicamente en este dispositivo. Hacer un backup de vez en cuando
            te protege si algún día el navegador borra el storage (puede pasar en iPhone si no abrís
            la app por varios días) o si cambiás de celular.
          </p>

          <button
            type="button"
            onClick={exportar}
            className="ios-press flex items-center gap-3 rounded-ios-lg bg-surface p-3.5 text-left shadow-card"
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent-soft text-accent">
              <Download size={17} />
            </span>
            <span className="flex-1">
              <span className="block text-[14px] font-medium text-ink">Exportar datos</span>
              <span className="block text-[12px] text-ink-faint">
                Descarga un archivo .json con todo
              </span>
            </span>
          </button>

          <button
            type="button"
            onClick={elegirArchivo}
            className="ios-press flex items-center gap-3 rounded-ios-lg bg-surface p-3.5 text-left shadow-card"
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-surface-line text-ink-soft">
              <Upload size={17} />
            </span>
            <span className="flex-1">
              <span className="block text-[14px] font-medium text-ink">Importar datos</span>
              <span className="block text-[12px] text-ink-faint">
                Restaura desde un backup .json
              </span>
            </span>
          </button>
          <input ref={inputRef} type="file" accept="application/json" onChange={onArchivoElegido} className="hidden" />

          {error && <p className="text-center text-[12.5px] font-medium text-expense">{error}</p>}
        </div>
      )}
    </BottomSheet>
  );
}
