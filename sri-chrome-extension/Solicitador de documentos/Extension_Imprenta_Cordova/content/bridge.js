/**
 * Puente Web ↔ Extensión — Imprenta Córdova
 * =====================================================================
 * Este content script corre en imprentacordova.net. Su trabajo es conectar la
 * app web con la extensión para el flujo "lanzar la solicitud SRI desde el
 * Paso 2 de Nueva Orden":
 *
 *   Web  --postMessage('CORDOVA_SRI_LAUNCH')-->  bridge  -->  background
 *   background  --abre el portal SRI y automatiza la solicitud-->
 *   background  --mensaje('sriSolicitudResult')-->  bridge  -->  Web
 *   Web  <--postMessage('CORDOVA_SRI_RESULT')--  bridge
 *
 * La web escucha `CORDOVA_SRI_RESULT` y rellena la orden con los datos que
 * devolvió el SRI (RUC, razón social, dirección, establecimiento, autorización…).
 */
(function () {
  'use strict';

  // 1) La web pide lanzar la solicitud SRI.
  window.addEventListener('message', (event) => {
    if (event.source !== window) return;
    const data = event.data;
    if (!data || data.type !== 'CORDOVA_SRI_LAUNCH') return;

    try {
      chrome.runtime.sendMessage(
        { action: 'launchSriSolicitud', payload: data.payload || {} },
        () => { void chrome.runtime.lastError; },
      );
    } catch (e) {
      console.warn('[Cordova Bridge] No se pudo lanzar la solicitud:', e);
    }
  });

  // 2) El background devuelve el resultado de la solicitud completada.
  chrome.runtime.onMessage.addListener((msg) => {
    // El destino es la propia página, así que se acota el targetOrigin en vez
    // de usar '*': con '*' el mensaje también lo ven los iframes de terceros.
    if (msg && msg.action === 'sriSolicitudResult') {
      window.postMessage({ type: 'CORDOVA_SRI_RESULT', data: msg.data || {} }, window.location.origin);
    }
    if (msg && msg.action === 'sriAceptadaResult') {
      window.postMessage({ type: 'CORDOVA_SRI_ACEPTADA', data: msg.data || {} }, window.location.origin);
    }
  });

  // 3) Avisar a la página que el puente está listo (para mostrar/ocultar el botón).
  //
  // Se anuncia Y se contesta cuando preguntan: este content script corre en
  // `document_idle`, así que el anuncio inicial puede salir ANTES de que React
  // monte el componente que escucha, y la web se quedaba sin saber que la
  // extensión existe. Con el ping, quien llegue tarde pregunta.
  const anunciar = () => window.postMessage(
    { type: 'CORDOVA_BRIDGE_READY', version: chrome.runtime.getManifest().version },
    window.location.origin,
  );

  window.addEventListener('message', (event) => {
    if (event.source !== window) return;
    if (!event.data || event.data.type !== 'CORDOVA_BRIDGE_PING') return;
    anunciar();
  });

  anunciar();
})();
