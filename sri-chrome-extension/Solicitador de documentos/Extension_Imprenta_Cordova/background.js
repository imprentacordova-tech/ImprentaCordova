// Consulta de trabajos listos en Vitrina (100% GRATIS - CERO TOKENS DE IA)
async function actualizarBadgeRetiros() {
  try {
    const res = await fetch('https://cordova-sri-api.onrender.com/api/v1/trabajos/vitrina-count');
    const data = await res.json();
    if (data && typeof data.count === 'number') {
      if (data.count > 0) {
        chrome.action.setBadgeText({ text: String(data.count) });
        chrome.action.setBadgeBackgroundColor({ color: '#16a34a' });
        chrome.action.setTitle({ title: `Imprenta Córdova: ${data.count} trabajo(s) listos para retiro en Vitrina` });
      } else {
        chrome.action.setBadgeText({ text: '' });
        chrome.action.setTitle({ title: 'Imprenta Córdova Solicitador SRI' });
      }
    }
  } catch (e) {
    // Modo offline silencioso
  }
}

chrome.runtime.onInstalled.addListener(() => {
  // Inicializar cantidad predeterminada
  chrome.storage.local.get(['cordovaBlocks'], (result) => {
    if (!result.cordovaBlocks) {
      chrome.storage.local.set({ cordovaBlocks: 100 });
    }
  });

  // Alarma periódica cada 5 minutos (100% gratuito, cero consumo de tokens)
  chrome.alarms.create('checkVitrina', { periodInMinutes: 5 });
  actualizarBadgeRetiros();
  console.log("Extension Imprenta Cordova Solicitador iniciada.");
});

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'checkVitrina') {
    actualizarBadgeRetiros();
  }
});

chrome.runtime.onStartup.addListener(() => {
  actualizarBadgeRetiros();
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "refreshVitrinaBadge") {
    actualizarBadgeRetiros();
    return;
  }
  if (request.action === "openRegistry") {
    chrome.storage.local.get(['cordovaOpenWebDirect'], (res) => {
      if (res.cordovaOpenWebDirect) {
        chrome.tabs.create({ url: 'https://www.imprentacordova.net/#/nuevo' });
      } else {
        chrome.tabs.create({ url: chrome.runtime.getURL('registro.html') });
      }
    });
    return;
  }
  if (request.action === "launchSriSolicitud") {
    // La app web (Paso 2) pidió lanzar la solicitud SRI con el documento y la
    // cantidad ya configurados. Guardamos el payload y abrimos el portal.
    const p = request.payload || {};
    const payload = {
      ...p,
      originTabId: sender.tab ? sender.tab.id : null,
      createdAt: Date.now(),
    };
    chrome.storage.local.set({
      cordova_launch_payload: payload,
      cordova_origin_tab: payload.originTabId,
      cordovaBlocks: payload.blocks || 100,
      cordovaDocType: String(payload.docType || '1'),
      cordova_suggested: true,
      cordova_est_selected: false,
      cordovaAutoPilot: true,
      cordovaClientRuc: payload.ruc || '',
      cordovaClientName: (payload.name || '').toUpperCase(),
      cordovaDireccion: payload.direccion || '',
    }, () => {
      chrome.tabs.create({
        url: 'https://srienlinea.sri.gob.ec/facturacion-internet/preimpresos/inicio-contribuyente.jspa',
      });
    });
    return;
  }

  if (request.action === "sriSolicitudResult") {
    // El content script del SRI terminó: devolvemos los datos a la pestaña web
    // que originó la solicitud (el bridge los reenvía a la página).
    const tabId = request.tabId;
    if (tabId) {
      chrome.tabs.sendMessage(tabId, { action: 'sriSolicitudResult', data: request.data || {} })
        .catch(() => { /* la pestaña pudo cerrarse */ });
    }
    return;
  }

  if (request.action === "callFunction" && sender.tab) {
    chrome.scripting.executeScript({
      target: { tabId: sender.tab.id },
      world: "MAIN",
      args: [request.funcName],
      func: (fnName) => {
        try {
          window.alert = function(){};
          window.confirm = function(){ return true; };
          
          if (fnName === 'siguientePaso' && typeof siguientePaso === 'function') {
            const param = document.body.getAttribute('data-cordova-param');
            if (param) {
              siguientePaso(param);
              document.body.removeAttribute('data-cordova-param');
            } else {
              siguientePaso();
            }
          } else if (fnName === 'nextPage' && typeof nextPage === 'function') {
            nextPage();
          } else if (fnName === 'buscarPorCodigo') {
            // ATOMIC: marcar FR=1 → habilitar → escribir 8634 → enviar el formulario
            // en el MISMO tick. Sin delays, para que otra extensión (Ghost, Declarador…)
            // no alcance a volver a marcar "Por RUC" ni a limpiar el campo.
            const form = document.forma || document.forms[0];
            const cont = form || document;
            const radios = Array.from(cont.querySelectorAll('input[type="radio"][name="FR"]'));
            const radioCodigo = radios.find(r => r.value === '1');
            const radioRuc = radios.find(r => r.value === '0');

            if (radioCodigo) {
              radioCodigo.checked = true;
              try { if (typeof habilitar === 'function') habilitar(radioCodigo); } catch (e) { }
              const num = cont.querySelector('input[name="numero"]') || document.querySelector('input[name="numero"]');
              if (num) {
                num.disabled = false;
                num.value = '8634';
                try {
                  num.dispatchEvent(new Event('input', { bubbles: true }));
                  num.dispatchEvent(new Event('change', { bubbles: true }));
                } catch (e) { }
              }
            } else if (radioRuc) {
              radioRuc.checked = true;
              try { if (typeof habilitar === 'function') habilitar(radioRuc); } catch (e) { }
              const ruc = cont.querySelector('input[name="ruc"]') || document.querySelector('input[name="ruc"]');
              if (ruc) { ruc.disabled = false; ruc.value = '0702065319001'; }
            }

            // Enviar directo (equivale al botón Buscar). Se evita nextPage() porque
            // otras extensiones / alertas / CSP pueden bloquearlo.
            try {
              if (form) {
                if (form.accion) form.accion.value = 'siguiente';
                form.submit();
              } else if (typeof nextPage === 'function') {
                nextPage();
              }
            } catch (e) {
              console.error('Cordova Ext: error al enviar búsqueda', e);
            }
          } else if (fnName === 'habilitar') {
            // El content script deja el value del radio elegido en data-cordova-radio.
            const val = document.body.getAttribute('data-cordova-radio');
            const radios = Array.from(document.querySelectorAll('input[type="radio"][name="FR"]'));
            let radio = val !== null ? radios.find(r => r.value === val) : null;
            if (!radio) radio = radios.find(r => r.value === '1' || r.value === '2');
            if (!radio) radio = radios.find(r => r.value !== '0') || radios[0];
            if (typeof habilitar === 'function' && radio) habilitar(radio);
          } else if (fnName === 'bypassAlertsAndNext') {
             if (typeof siguientePaso === 'function') siguientePaso();
             else if(document.forms.length > 0) document.forms[0].submit();
          } else {
             if (document.forms.length > 0) {
                 document.forms[0].submit();
             }
          }
        } catch(e) {
          console.error("Cordova Ext: Main world error", e);
        }
      }
    });
  }
});
