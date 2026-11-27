/**
 * Puente al mundo MAIN del portal del SRI — Imprenta Córdova
 * ==========================================================
 *
 * Corre en el contexto de la propia página (world: MAIN), que es el único desde
 * el que se pueden llamar las funciones JSP del portal (`siguientePaso`,
 * `habilitar`, `nextPage`…). El content script normal vive aislado y no las ve.
 *
 * ⚠️ DIÁLOGOS NATIVOS — por qué están condicionados
 * -------------------------------------------------
 * Antes este archivo reemplazaba `window.confirm` por `() => true` y
 * `window.alert` por un log, de entrada y para SIEMPRE, en todos los frames del
 * portal. Eso significa que mientras la pestaña del SRI estuviera abierta,
 * CUALQUIER confirmación se aceptaba sola — también las que no venían de la
 * automatización y también cuando el operador estaba navegando a mano. En un
 * portal tributario eso es pólvora: un "¿Está seguro de anular la solicitud?"
 * se respondía que sí sin que nadie lo viera.
 *
 * Ahora los diálogos solo se cortocircuitan mientras la automatización está
 * corriendo de verdad, y con interruptor de hombre muerto: si el content script
 * no renueva el permiso dentro de `TTL_MS`, los diálogos vuelven solos a ser los
 * nativos. Fuera de esa ventana, el portal se comporta como siempre.
 */
(function () {
  'use strict';

  console.log('[Cordova SRI] Puente al mundo MAIN cargado.');

  // ── Interruptor de la automatización ──────────────────────────────────────
  /** Tiempo máximo que el permiso sigue vivo sin renovarse. */
  const TTL_MS = 30000;

  let automatizacionHasta = 0;

  const automatizacionActiva = () => Date.now() < automatizacionHasta;

  const nativeConfirm = window.confirm.bind(window);
  const nativeAlert = window.alert.bind(window);

  window.confirm = function (mensaje) {
    if (!automatizacionActiva()) return nativeConfirm(mensaje);
    console.log('[Cordova SRI] confirm() auto-aceptado durante la automatización:', mensaje);
    return true;
  };

  window.alert = function (mensaje) {
    if (!automatizacionActiva()) return nativeAlert(mensaje);
    console.log('[Cordova SRI] alert() silenciado durante la automatización:', mensaje);
    return undefined;
  };

  // ── Mensajes desde el content script (mundo aislado) ──────────────────────
  window.addEventListener('message', (event) => {
    // Solo mensajes de esta misma ventana: nada que venga de otro origen.
    if (event.source !== window) return;
    const data = event.data;
    if (!data || typeof data.type !== 'string') return;

    if (data.type === 'SRI_AUTOMATION_ON') {
      automatizacionHasta = Date.now() + TTL_MS;
      return;
    }

    if (data.type === 'SRI_AUTOMATION_OFF') {
      automatizacionHasta = 0;
      return;
    }

    // Los clics automáticos solo valen mientras la automatización está activa (TTL):
    // fuera de ella, ningún script de la página puede pedirle clics a la extensión.
    if (data.type === 'SRI_CLICK' && automatizacionActiva()) {
      ejecutarClick(data.xpath);
    }
  });

  /**
   * Hace clic en un elemento del portal respetando cómo está cableado:
   * `href="javascript:…"`, `onclick` o clic normal.
   */
  function ejecutarClick(xpath) {
    console.log('[Cordova SRI] Clic solicitado sobre:', xpath);
    try {
      const el = document.evaluate(xpath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
      if (!el) {
        console.warn('[Cordova SRI] No se encontró el elemento para el clic.');
        return;
      }

      const href = el.getAttribute('href');
      const onclick = el.getAttribute('onclick');

      if (href && href.startsWith('javascript:')) {
        new Function(href.replace('javascript:', ''))();
        return;
      }

      if (onclick) {
        try {
          new Function(onclick.replace(/^javascript:/i, '')).call(el);
          el.click(); // además del handler, el clic normal para que quede seleccionado
        } catch (e) {
          el.click();
        }
        return;
      }

      el.click();
    } catch (e) {
      console.error('[Cordova SRI] Error al hacer clic:', e);
    }
  }
})();
