/**
 * Capa más baja del motor de persistencia: lectura/escritura segura sobre
 * localStorage + un sistema de notificaciones para que cualquier parte de
 * la UI pueda "suscribirse" a cambios de una key y re-renderizar sola.
 *
 * Por qué localStorage y no SQLite-wasm:
 * para una app 100% personal, de un solo usuario y sin servidor, un wrapper
 * reactivo sobre localStorage da la misma robustez práctica (CRUD seguro,
 * validado y reactivo) sin sumar ~1MB de WebAssembly ni complejidad de
 * inicialización async. Todo el acceso pasa SIEMPRE por este archivo, así
 * que si en el futuro se quiere migrar a IndexedDB o sql.js, sólo hay que
 * reimplementar estas 4 funciones.
 */

type Listener = () => void;

const PREFIJO = "gg:"; // namespace para no colisionar con otras apps en el mismo dominio
const listenersPorKey = new Map<string, Set<Listener>>();

function esNavegador(): boolean {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function clave(key: string): string {
  return key.startsWith(PREFIJO) ? key : `${PREFIJO}${key}`;
}

function notificar(key: string): void {
  listenersPorKey.get(key)?.forEach((listener) => listener());
}

/** Sincronización entre pestañas/ventanas: el evento "storage" sólo dispara en pestañas que NO hicieron el cambio. */
if (esNavegador()) {
  window.addEventListener("storage", (evento) => {
    if (evento.key) notificar(evento.key);
  });
}

/** Permite a cualquier consumidor (ej. un hook de React) reaccionar a cambios de una key. */
export function suscribirseAKey(key: string, listener: Listener): () => void {
  const k = clave(key);
  if (!listenersPorKey.has(k)) listenersPorKey.set(k, new Set());
  listenersPorKey.get(k)!.add(listener);
  return () => listenersPorKey.get(k)?.delete(listener);
}

export function leerRaw(key: string): string | null {
  if (!esNavegador()) return null;
  try {
    return window.localStorage.getItem(clave(key));
  } catch (error) {
    // Puede fallar en modo incógnito estricto, con storage lleno, o con
    // localStorage deshabilitado por política del navegador.
    console.error(`[storage] No se pudo leer "${key}":`, error);
    return null;
  }
}

export function escribirRaw(key: string, valor: string): boolean {
  if (!esNavegador()) return false;
  try {
    window.localStorage.setItem(clave(key), valor);
    notificar(clave(key));
    return true;
  } catch (error) {
    console.error(`[storage] No se pudo escribir "${key}" (¿quota llena?):`, error);
    return false;
  }
}

export function eliminarRaw(key: string): void {
  if (!esNavegador()) return;
  try {
    window.localStorage.removeItem(clave(key));
    notificar(clave(key));
  } catch (error) {
    console.error(`[storage] No se pudo eliminar "${key}":`, error);
  }
}

/**
 * Vuelca TODO lo que la app guardó en localStorage (todas las claves con el
 * prefijo `gg:`) a un objeto plano. Es la base del backup exportable: como
 * todos los datos viven sólo en este dispositivo/navegador, esta es la
 * única forma de protegerlos contra que el navegador los borre (ej. iOS
 * puede liberar el storage de una app instalada si no se abre en varios
 * días) o de llevarlos a otro dispositivo.
 */
export function exportarTodoElStorage(): Record<string, string> {
  if (!esNavegador()) return {};
  const resultado: Record<string, string> = {};
  for (let i = 0; i < window.localStorage.length; i++) {
    const key = window.localStorage.key(i);
    if (key && key.startsWith(PREFIJO)) {
      const valor = window.localStorage.getItem(key);
      if (valor !== null) resultado[key] = valor;
    }
  }
  return resultado;
}

/**
 * Restaura un backup generado por `exportarTodoElStorage`. Sobrescribe lo
 * que ya hubiera guardado bajo esas mismas claves. Sólo escribe claves con
 * el prefijo `gg:` (nunca toca otra cosa que hubiera en el localStorage del
 * dominio, por si en algún momento conviviera con otra app).
 */
export function importarTodoElStorage(datos: Record<string, string>): void {
  if (!esNavegador()) return;
  for (const [key, valor] of Object.entries(datos)) {
    if (!key.startsWith(PREFIJO)) continue;
    try {
      window.localStorage.setItem(key, valor);
    } catch (error) {
      console.error(`[storage] No se pudo restaurar "${key}":`, error);
    }
  }
}
