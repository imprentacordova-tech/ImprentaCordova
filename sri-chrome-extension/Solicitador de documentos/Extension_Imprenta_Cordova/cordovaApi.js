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
 * que conoce las claves.
 *
 * AUTENTICACIÓN (v3): la extensión NO tiene clave propia. Usa la sesión del operador
 * que inició sesión en el panel (imprentacordova.net): bridge.js la recibe y el
 * background la guarda en chrome.storage.session -> 'cordova_session'. Se manda como
 * `Authorization: Bearer <token>`. Sin sesión, el backend responde 401 y se pide abrir
 * el panel. (La v2 mandaba una `x-api-key` pública; el backend v3 le responde 426.)
 */
(function (global) {
  'use strict';

  /** URL del backend. Cambiar solo si se migra de Render. */
  const BACKEND_URL = 'https://cordova-sri-api.onrender.com';

  /** Token del operador o '' si no hay sesión. */
  async function obtenerToken() {
    try {
      const r = await chrome.storage.session.get(['cordova_session']);
      return (r && r.cordova_session && r.cordova_session.token) || '';
    } catch (e) {
      return '';
    }
  }

  /**
   * Petición al backend con timeout real y errores en español.
   * @returns {Promise<any>} el JSON de la respuesta
   * @throws {Error} con `.status` cuando la respuesta no es 2xx
   */
  async function request(path, { method = 'POST', body = null, timeoutMs = 30000 } = {}) {
    const token = await obtenerToken();
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const res = await fetch(`${BACKEND_URL}${path}`, {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        ...(body ? { body: JSON.stringify(body) } : {}),
        signal: controller.signal
      });

      const payload = await res.json().catch(() => ({}));

      if (!res.ok) {
        const err = new Error(res.status === 401
          ? 'Abrí el panel de Córdova (imprentacordova.net) e iniciá sesión para reconectar la extensión.'
          : (payload?.error || `Error ${res.status} del servidor`));
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

  global.CordovaApi = { post, get, ping, request, BACKEND_URL, obtenerToken };
})(typeof self !== 'undefined' ? self : this);
