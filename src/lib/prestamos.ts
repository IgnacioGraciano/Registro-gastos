"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export type Moneda = "ARS" | "USD" | "EUR";

export type Prestamo = {
  id: string;
  persona: string;
  monto: number;
  moneda: Moneda;
  fecha: string;
  billeteraId: string;
  estado: "pendiente" | "parcial" | "pagado";
  montoPagado?: number;
  descripcion?: string;
  createdAt: number;
};

type Pago = {
  id: string;
  prestamoId: string;
  monto: number;
  fecha: string;
  createdAt: number;
};

interface PrestamosStore {
  prestamos: Prestamo[];
  pagos: Pago[];
  crearPrestamo: (data: Omit<Prestamo, "id" | "createdAt" | "estado" | "montoPagado">) => void;
  registrarPago: (prestamoId: string, monto: number, fecha: string) => void;
  eliminarPrestamo: (id: string) => void;
  editarPrestamo: (id: string, data: Partial<Prestamo>) => void;
  obtenerPrestamo: (id: string) => Prestamo | undefined;
  obtenerPagos: (prestamoId: string) => Pago[];
  calcularTotalPendiente: () => number;
  calcularMontoPendiente: (prestamo: Prestamo) => number;
}

function generateId() {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

const usePrestamosStore = create<PrestamosStore>()(
  persist(
    (set, get) => ({
      prestamos: [],
      pagos: [],

      crearPrestamo: (data) =>
        set((state) => ({
          prestamos: [
            ...state.prestamos,
            {
              ...data,
              id: generateId(),
              estado: "pendiente" as const,
              montoPagado: 0,
              createdAt: Date.now(),
            },
          ],
        })),

      registrarPago: (prestamoId, monto, fecha) =>
        set((state) => {
          const prestamo = state.prestamos.find((p) => p.id === prestamoId);
          if (!prestamo) return state;

          const nuevoMontoPagado = (prestamo.montoPagado || 0) + monto;
          const nuevoEstado =
            nuevoMontoPagado >= prestamo.monto
              ? ("pagado" as const)
              : ("parcial" as const);

          return {
            prestamos: state.prestamos.map((p) =>
              p.id === prestamoId
                ? {
                    ...p,
                    montoPagado: nuevoMontoPagado,
                    estado: nuevoEstado,
                  }
                : p
            ),
            pagos: [
              ...state.pagos,
              {
                id: generateId(),
                prestamoId,
                monto,
                fecha,
                createdAt: Date.now(),
              },
            ],
          };
        }),

      eliminarPrestamo: (id) =>
        set((state) => ({
          prestamos: state.prestamos.filter((p) => p.id !== id),
          pagos: state.pagos.filter((pago) => pago.prestamoId !== id),
        })),

      editarPrestamo: (id, data) =>
        set((state) => ({
          prestamos: state.prestamos.map((p) =>
            p.id === id ? { ...p, ...data } : p
          ),
        })),

      obtenerPrestamo: (id) => get().prestamos.find((p) => p.id === id),

      obtenerPagos: (prestamoId) =>
        get().pagos.filter((pago) => pago.prestamoId === prestamoId),

      calcularTotalPendiente: () => {
        return get().prestamos.reduce((total, p) => {
          if (p.estado === "pagado") return total;
          const faltante = p.monto - (p.montoPagado || 0);
          return total + faltante;
        }, 0);
      },

      calcularMontoPendiente: (prestamo) => {
        if (prestamo.estado === "pagado") return 0;
        return prestamo.monto - (prestamo.montoPagado || 0);
      },
    }),
    {
      name: "prestamos-store",
    }
  )
);

export default usePrestamosStore;
