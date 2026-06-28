/**
 * Genera un UUID v4. Usa la Web Crypto API (disponible en todo navegador
 * moderno y en localhost, que se considera "contexto seguro") y cae a un
 * generador manual sólo si `crypto.randomUUID` no existiera.
 */
export function generarId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  // Fallback defensivo (no debería usarse en la práctica)
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}
