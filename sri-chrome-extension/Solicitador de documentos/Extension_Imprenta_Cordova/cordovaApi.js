/**
 * Cliente HTTP compartido del backend SRI — Imprenta Córdova (extensión Chrome)
 * ============================================================================
 *
 * SEGURIDAD — leer antes de tocar:
 *
 * Esta extensión se distribuye empaquetada, así que TODO su código es público
 * (cualquiera puede descomprimir el .crx y leerlo). Por eso NO puede contener:
 *
 *   ✗ La service_role de Supabase  -> saltea toda la Row Level Security
 *   ✗ La API key de Resend         -> permite enviar correo como el negocio
 *   ✗ La API key de Gemini         -> consume cuota facturable
 *
 * Todas esas operaciones se hacen contra el backend en Render, que es el único
 * que conoce las claves. Este archivo solo guarda la URL del backend y la clave
 * anti-abuso (que es pública por diseño: viaja en el navegador).
 *
 * CONFIGURACIÓN REQUERIDA EN EL SERVIDOR (Render -> Environment):
 *   API_KEY                  = <misma clave que CORDOVA_API_KEY de aquí abajo>
 *   SUPABASE_URL             = https://<proyecto>.supabase.co
 *   SUPABASE_SERVICE_ROLE_KEY= <service_role>
 *   RESEND_API_KEY           = <resend>
 *   GEMINI_API_KEY           = <google>
 *
 * Sin API_KEY el backend responde 503 en las rutas privilegiadas (falla cerrado).
 */
(function (global) {
  'use strict';

  /** URL del backend. Cambiar solo si se migra de Render. */
  const BACKEND_URL = 'https://cordova-sri-api.onrender.com';

  /**
   * Clave anti-abuso. Debe coincidir exactamente con `API_KEY` en Render.
   * Si se deja vacía, se lee de chrome.storage.local -> 'cordova_api_key'.
   */
  const CORDOVA_API_KEY = '';

  const STORAGE_KEY = 'cordova_api_key';

  let claveEnMemoria = null;

  /** Resuelve la clave: constante -> chrome.storage -> vacío. */
  async function obtenerClave() {
    if (claveEnMemoria !== null) return claveEnMemoria;

    if (CORDOVA_API_KEY) {
      claveEnMemoria = CORDOVA_API_KEY;
      return claveEnMemoria;
    }

    try {
      const r = await chrome.storage.local.get([STORAGE_KEY]);
      claveEnMemoria = r?.[STORAGE_KEY] || '';
    } catch (e) {
      claveEnMemoria = '';
    }
    return claveEnMemoria;
  }

  /**
   * Petición al backend con timeout real y errores en español.
   * @returns {Promise<any>} el JSON de la respuesta
   * @throws {Error} con `.status` cuando la respuesta no es 2xx
   */
  async function request(path, { method = 'POST', body = null, timeoutMs = 30000 } = {}) {
    const clave = await obtenerClave();
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const res = await fetch(`${BACKEND_URL}${path}`, {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...(clave ? { 'x-api-key': clave } : {})
        },
        ...(body ? { body: JSON.stringify(body) } : {}),
        signal: controller.signal
      });

      const payload = await res.json().catch(() => ({}));

      if (!res.ok) {
        const err = new Error(payload?.error || `Error ${res.status} del servidor`);
        err.status = res.status;
        throw err;
      }

      return payload;
    } catch (err) {
      if (err.name === 'AbortError') {
        const t = new Error('El servidor tardó demasiado en responder.');
        t.status = 408;
        throw t;
      }
      if (err.status === undefined) {
        // Error de red real (backend caído, sin permiso de host, etc.)
        err.status = 0;
      }
      throw err;
    } finally {
      clearTimeout(timer);
    }
  }

  const post = (path, body, opciones = {}) => request(path, { ...opciones, method: 'POST', body });
  const get = (path, opciones = {}) => request(path, { ...opciones, method: 'GET' });
  const ping = () => request('/ping', { method: 'GET', timeoutMs: 8000 });

  global.CordovaApi = { post, get, ping, request, BACKEND_URL, obtenerClave };
})(typeof self !== 'undefined' ? self : this);
