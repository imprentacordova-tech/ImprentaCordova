chrome.runtime.onInstalled.addListener(() => {
  // Initialize default block quantity
  chrome.storage.local.get(['cordovaBlocks'], (result) => {
    if (!result.cordovaBlocks) {
      chrome.storage.local.set({ cordovaBlocks: 100 });
    }
  });
  console.log("Extension Imprenta Cordova Solicitador iniciada.");
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "openRegistry") {
    chrome.storage.local.get(['cordovaOpenWebDirect'], (res) => {
      if (res.cordovaOpenWebDirect) {
        chrome.tabs.create({ url: 'https://www.imprentacordova.net/nuevo-pedido' });
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
          } else if (fnName === 'habilitar' && typeof habilitar === 'function') {
            habilitar(document.querySelector('input[type="radio"][name="FR"][value="1"]'));
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
