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
