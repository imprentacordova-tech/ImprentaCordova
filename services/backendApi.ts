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
 * Autenticación: cada operador inicia sesión en `/api/v1/auth/login` y el backend
 * devuelve un token firmado (services/sesion.ts) que va en `Authorization: Bearer`.
 * Antes se mandaba una `VITE_RENDER_API_KEY` incrustada en el bundle: era pública,
 * así que no protegía el correo ni el listado de órdenes.
 */
import { sesion } from './sesion';

const BACKEND_URL = (
  import.meta.env.VITE_RENDER_SRI_API_URL || 'https://cordova-sri-api.onrender.com'
).replace(/\/+$/, '');


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

  const token = sesion.token();
  try {
    const res = await fetch(`${BACKEND_URL}${path}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    const payload = await res.json().catch(() => ({}));

    if (!res.ok) {
      // Solo si había sesión: con el login de respaldo (sin token) un 401 no es "venció".
      if (res.status === 401 && token) {
        sesion.limpiar();
        window.dispatchEvent(new Event('cordova:sesion-vencida'));
      }
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

/** Indica si hay sesión para operaciones privilegiadas (correo, IA, padrón). */
export const backendConfigurado = (): boolean => Boolean(sesion.token());

export interface UsuarioSesion { id: string; nombre: string; rol: string }

/**
 * Login contra el backend. Errores: status 0 = sin conexión (Render dormido o sin red);
 * 401/403/429 = el mensaje del servidor; 503 = login no configurado en el servidor.
 */
export async function loginBackend(nombre: string, password: string): Promise<{ token: string; user: UsuarioSesion }> {
  try {
    return await backendFetch<{ token: string; user: UsuarioSesion }>(
      '/api/v1/auth/login', { nombre, password }, { timeoutMs: 45000, etiqueta: 'Login' },
    );
  } catch (err) {
    if (err instanceof BackendError && [0, 408, 502, 504].includes(err.status)) {
      throw new BackendError('El servidor está despertando, reintentá en 30 s.', err.status);
    }
    throw err;
  }
}

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
