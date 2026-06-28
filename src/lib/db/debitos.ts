import { suscripcionesRepo } from "./suscripciones";
import { transaccionesRepo } from "./transacciones";
import { hoyISO } from "@/lib/format";

const LIMITE_PERIODOS_POR_CORRIDA = 36; // salvaguarda anti-loop-infinito ante datos corruptos

export interface ResultadoDebito {
  suscripcionId: string;
  nombre: string;
  vecesDebitada: number;
}

/**
 * Revisa TODAS las suscripciones y, para cada una cuyo `proximoPago` ya
 * llegó o pasó, genera el gasto correspondiente y avanza `proximoPago` al
 * siguiente período — repitiendo el proceso si hay varios períodos
 * atrasados (ej. la app estuvo cerrada 2 meses → debita 2 veces).
 *
 * Por qué no duplica si se abre la app varias veces el mismo día: después
 * de procesar una suscripción, su `proximoPago` queda en una fecha
 * ESTRICTAMENTE futura respecto a hoy. La próxima vez que se llame a esta
 * función (aunque sea minutos después, en la misma sesión o en una nueva),
 * la condición `proximoPago <= hoy` ya es falsa para esa suscripción, así
 * que no se vuelve a debitar. No hace falta ningún flag extra: el propio
 * dato (`proximoPago`) es la garantía de que no hay doble cobro.
 */
export function procesarDebitosPendientes(): ResultadoDebito[] {
  if (typeof window === "undefined") return [];

  const hoy = hoyISO();
  const resultados: ResultadoDebito[] = [];

  for (const suscripcion of suscripcionesRepo.getAll()) {
    let proximoPagoActual = suscripcion.proximoPago;
    let vecesDebitada = 0;

    while (proximoPagoActual <= hoy && vecesDebitada < LIMITE_PERIODOS_POR_CORRIDA) {
      try {
        // Se registra con la fecha en que correspondía el cobro, no con la fecha de hoy,
        // para que el historial refleje cuándo "debió" pasar el débito.
        transaccionesRepo.crear({
          monto: suscripcion.monto,
          tipo: "gasto",
          billeteraId: suscripcion.billeteraId,
          categoriaId: suscripcion.categoriaId,
          descripcion: `Débito automático: ${suscripcion.nombre}`,
          fecha: proximoPagoActual,
        });
      } catch (error) {
        // Ej: la billetera o categoría de la suscripción fue borrada. Se corta el loop
        // para esta suscripción puntual en vez de tirar abajo el resto del procesamiento.
        console.error(`[débitos] No se pudo debitar "${suscripcion.nombre}":`, error);
        break;
      }

      // Reutiliza el mismo método ya probado que avanza un período (mensual/anual).
      const actualizada = suscripcionesRepo.registrarPago(suscripcion.id);
      if (!actualizada) break;

      proximoPagoActual = actualizada.proximoPago;
      vecesDebitada++;
    }

    if (vecesDebitada > 0) {
      resultados.push({ suscripcionId: suscripcion.id, nombre: suscripcion.nombre, vecesDebitada });
    }
  }

  return resultados;
}
