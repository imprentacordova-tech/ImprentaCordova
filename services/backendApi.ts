/**
 * Cliente único para el backend SRI (Render) — Imprenta Córdova
 * =============================================================
 *
 * REGLA DE ORO DE SEGURIDAD
 * -------------------------
 * Todo lo que sea privilegiado (escrituras con service_role, envío de correo,
 * llamadas a IA de pago) pasa por el backend. El navegador NUNCA debe tener:
 *
 *   ✗ SUPABASE_SERVICE_ROLE_KEY   (saltea toda la Row Level Security)
 *   ✗ RESEND_API_KEY              (permite enviar correo a nombre del negocio)
 *   ✗ GEMINI_API_KEY              (consume cuota facturable)
 *
 * Cualquier variable con prefijo `VITE_` termina incrustada en el bundle público
 * que sirve Vercel. Si dudás: si es un secreto, no lleva prefijo VITE_.
 *
 * `VITE_RENDER_API_KEY` SÍ es pública por diseño: viaja en el navegador, así que
 * funciona como barrera anti-abuso (junto a CORS y rate limiting), no como credencial.
 */

const BACKEND_URL = (
  import.meta.env.VITE_RENDER_SRI_API_URL || 'https://cordova-sri-api.onrender.com'
).replace(/\/+$/, '');

const BACKEND_API_KEY = import.meta.env.VITE_RENDER_API_KEY || '';

/** Error de backend con el status HTTP disponible para quien lo consuma. */
export class BackendError extends Error {
  readonly status: number;
  readonly detalle?: string;

  constructor(message: string, status: number, detalle?: string) {
    super(message);
    this.name = 'BackendError';
    this.status = status;
    this.detalle = detalle;
  }
}

interface BackendFetchOptions {
  /** Milisegundos antes de abortar. Por defecto 30s; la IA necesita más. */
  timeoutMs?: number;
  /** Etiqueta corta para los logs de consola. */
  etiqueta?: string;
}

/**
 * Llama al backend con timeout real y errores en español de Ecuador.
 *
 * @throws {BackendError} siempre que la respuesta no sea 2xx o se agote el tiempo.
 */
export async function backendFetch<T = unknown>(
  path: string,
  body: unknown,
  { timeoutMs = 30000, etiqueta = 'Backend' }: BackendFetchOptions = {}
): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(`${BACKEND_URL}${path}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(BACKEND_API_KEY ? { 'x-api-key': BACKEND_API_KEY } : {}),
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    const payload = await res.json().catch(() => ({}));

    if (!res.ok) {
      const mensaje = payload?.error || `Error ${res.status} del servidor`;
      console.warn(`⚠️ [${etiqueta}] ${mensaje}`);
      throw new BackendError(mensaje, res.status, payload?.detalle);
    }

    return payload as T;
  } catch (err) {
    if (err instanceof BackendError) throw err;

    const abortado = err instanceof DOMException && err.name === 'AbortError';
    const mensaje = abortado
      ? 'El servidor tardó demasiado en responder. Revisá tu conexión e intentá de nuevo.'
      : 'No se pudo conectar con el servidor. Verificá que el servicio esté en línea.';

    console.error(`❌ [${etiqueta}]`, err);
    throw new BackendError(mensaje, abortado ? 408 : 0);
  } finally {
    clearTimeout(timer);
  }
}

/** Indica si el backend está configurado para operaciones privilegiadas. */
export const backendConfigurado = (): boolean => Boolean(BACKEND_API_KEY);

export const BACKEND_BASE_URL = BACKEND_URL;

/**
 * Despierta el backend de Render (plan gratuito: se duerme tras ~15 min sin tráfico
 * y la primera solicitud tarda 30-60 s). Se llama desde el panel mientras está abierto,
 * así la primera factura o consulta SRI del día no espera el arranque en frío.
 *
 * `no-cors`: no necesitamos leer la respuesta, solo que la solicitud llegue; así no
 * depende de la configuración CORS del backend ni ensucia la consola.
 */
let ultimoDespertar = 0;
export function despertarBackend(intervaloMinimoMs = 9 * 60 * 1000): void {
  const ahora = Date.now();
  if (ahora - ultimoDespertar < intervaloMinimoMs) return;
  ultimoDespertar = ahora;
  fetch(`${BACKEND_URL}/ping`, { mode: 'no-cors', cache: 'no-store' }).catch(() => {});
}
