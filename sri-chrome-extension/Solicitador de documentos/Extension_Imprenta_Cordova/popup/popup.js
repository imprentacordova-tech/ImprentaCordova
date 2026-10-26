document.addEventListener('DOMContentLoaded', () => {
  const blocksInput = document.getElementById('blocks');
  const autoPilotSwitch = document.getElementById('auto-pilot');
  const autoSuggestSwitch = document.getElementById('auto-suggest');
  const docChips = document.querySelectorAll('.doc-chips .doc-chip');
  const qtyChips = document.querySelectorAll('.qty-chip');
  const modelChips = document.querySelectorAll('.model-chip');
  const btnStart = document.getElementById('btn-start');
  const btnOpenSolicitud = document.getElementById('btn-open-solicitud');
  const btnRegistry = document.getElementById('btn-registry');

  // Imprenta Elements
  const elCount = document.getElementById('countValue');
  const elT25 = document.getElementById('labelT25');
  const elT50 = document.getElementById('labelT50');
  const elT100 = document.getElementById('labelT100');
  const elT200 = document.getElementById('labelT200');
  const elTOther = document.getElementById('labelTOther');
  const elStatusText = document.getElementById('statusText');
  const elStatusPill = document.getElementById('statusPill');
  const elLogContainer = document.getElementById('logContainer');
  
  const btnStartReport = document.getElementById('btnStartReport');
  const btnAceptar = document.getElementById('btnAceptar');
  const btnStop = document.getElementById('btnStop');
  const btnReset = document.getElementById('btnReset');
  const chkAssistant = document.getElementById('chkAssistant');
  const btnRegistryImprenta = document.getElementById('btn-registry-imprenta');

  const sectionCliente = document.getElementById('section-cliente');
  const sectionImprenta = document.getElementById('section-imprenta');

  const tabModeCliente = document.getElementById('tab-mode-cliente');
  const tabModeImprenta = document.getElementById('tab-mode-imprenta');
  const backendChip = document.getElementById('backend-status-chip');
  const backendText = document.getElementById('backend-status-text');

  // Comprobar estado de conexión con el backend (Render)
  function checkBackendHealth() {
    CordovaApi.ping()
      .then(() => {
        if (backendChip && backendText) {
          backendChip.classList.remove('offline');
          backendText.textContent = 'Backend Online';
        }
      })
      .catch(() => {
        if (backendChip && backendText) {
          backendChip.classList.add('offline');
          backendText.textContent = 'Modo Offline';
        }
      });
  }

  checkBackendHealth();

  // Helper para cambiar vistas entre pestañas
  function switchSection(rucOrMode) {
    const isImp = (rucOrMode === '0702065319001' || rucOrMode === 'imprenta');
    if (isImp) {
      sectionCliente.style.display = 'none';
      sectionImprenta.style.display = 'block';
      if (tabModeCliente) tabModeCliente.classList.remove('active');
      if (tabModeImprenta) tabModeImprenta.classList.add('active');
      syncFromStorage();
    } else {
      sectionCliente.style.display = 'block';
      sectionImprenta.style.display = 'none';
      if (tabModeImprenta) tabModeImprenta.classList.remove('active');
      if (tabModeCliente) tabModeCliente.classList.add('active');
      loadClientConfig();
    }
  }

  if (tabModeCliente) tabModeCliente.addEventListener('click', () => switchSection('cliente'));
  if (tabModeImprenta) tabModeImprenta.addEventListener('click', () => switchSection('imprenta'));

  // --- CLIENT LOGIC ---
  function loadClientConfig() {
    chrome.storage.local.get(['cordovaBlocks', 'cordovaAutoPilot', 'cordovaDocType', 'cordova_suggestion_disabled'], (result) => {
      // Blocks
      if (result.cordovaBlocks) {
        blocksInput.value = result.cordovaBlocks;
        updateQtyChips(result.cordovaBlocks.toString());
      } else {
        chrome.storage.local.set({ cordovaBlocks: 100 });
        blocksInput.value = 100;
        updateQtyChips("100");
      }
      
      // Auto Pilot
      if (result.cordovaAutoPilot !== undefined) {
        autoPilotSwitch.checked = result.cordovaAutoPilot;
      } else {
        chrome.storage.local.set({ cordovaAutoPilot: true });
        autoPilotSwitch.checked = true;
      }

      // Auto Suggest
      if (result.cordova_suggestion_disabled !== undefined) {
        autoSuggestSwitch.checked = !result.cordova_suggestion_disabled;
      } else {
        chrome.storage.local.set({ cordova_suggestion_disabled: false });
        autoSuggestSwitch.checked = true;
      }

      // Doc Type
      if (result.cordovaDocType !== undefined) {
        docChips.forEach(chip => {
          chip.classList.remove('active');
          if (chip.dataset.val === result.cordovaDocType) {
            chip.classList.add('active');
          }
        });
      } else {
        chrome.storage.local.set({ cordovaDocType: "1" }); 
      // Preferred SRI Print Model
      const preferredModel = result.cordova_preferred_print_model || 'sri-sobre-preimpreso';
      modelChips.forEach(chip => {
        chip.classList.toggle('active', chip.dataset.model === preferredModel);
      });
    });
  }

  const saveBlocks = (val) => {
    chrome.storage.local.set({ cordovaBlocks: val });
  };

  const updateQtyChips = (val) => {
    qtyChips.forEach(c => c.classList.remove('active'));
    const matchedChip = Array.from(qtyChips).find(c => c.dataset.val === val);
    if (matchedChip) {
        matchedChip.classList.add('active');
    }
  };

  qtyChips.forEach(chip => {
    chip.addEventListener('click', () => {
        const val = chip.dataset.val;
        blocksInput.value = val;
        updateQtyChips(val);
        saveBlocks(parseInt(val, 10));
    });
  });

  modelChips.forEach(chip => {
    chip.addEventListener('click', () => {
      modelChips.forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      chrome.storage.local.set({ cordova_preferred_print_model: chip.dataset.model });
    });
  });

  blocksInput.addEventListener('input', () => {
    let val = parseInt(blocksInput.value, 10);
    if (!isNaN(val)) {
        updateQtyChips(val.toString());
        saveBlocks(val);
    }
  });

  autoPilotSwitch.addEventListener('change', (e) => {
    chrome.storage.local.set({ cordovaAutoPilot: e.target.checked });
  });

  autoSuggestSwitch.addEventListener('change', (e) => {
    chrome.storage.local.set({ cordova_suggestion_disabled: !e.target.checked });
  });

  docChips.forEach(chip => {
    chip.addEventListener('click', () => {
      docChips.forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      chrome.storage.local.set({ cordovaDocType: chip.dataset.val });
    });
  });

  if (btnStart) {
    btnStart.addEventListener('click', () => {
      btnStart.innerHTML = 'INICIANDO...';
      btnStart.style.opacity = '0.8';
      btnStart.style.pointerEvents = 'none';

      chrome.storage.local.set({ cordova_suggested: true, cordova_est_selected: false }, () => {
        chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
          if (tabs[0]) {
            const currentUrl = tabs[0].url || '';
            const targetUrl = 'https://srienlinea.sri.gob.ec/facturacion-internet/preimpresos/inicio-contribuyente.jspa';
            
            if (currentUrl.includes('inicio-contribuyente.jspa') || currentUrl.includes('seleccionar-establecimiento')) {
              chrome.tabs.reload(tabs[0].id);
            } else {
              chrome.tabs.update(tabs[0].id, { url: targetUrl });
            }
            setTimeout(() => { window.close(); }, 500);
          }
        });
      });
    });
  }

  if (btnOpenSolicitud) {
    btnOpenSolicitud.addEventListener('click', () => {
      chrome.storage.local.get(['cordova_preferred_print_model', 'cordova_pending_order', 'current_session_ruc', 'cordovaDocType', 'cordovaBlocks'], (res) => {
        const preferredModel = res.cordova_preferred_print_model || 'sri-sobre-preimpreso';
        const pending = res.cordova_pending_order || {};
        const ruc = pending.clientRuc || res.current_session_ruc || '0702065319001';
        const docNames = { "0": "Facturas", "1": "Notas de Venta", "5": "Guías de Remisión" };
        const docTypeVal = pending.docType || res.cordovaDocType || "1";
        const docName = docNames[docTypeVal] || "Nota de Venta";
        const blocksVal = pending.blocks || res.cordovaBlocks || 100;

        const params = new URLSearchParams({
          mode: preferredModel,
          ruc: ruc,
          name: pending.clientName || 'CONTRIBUYENTE SRI',
          doc: docName,
          blocks: String(blocksVal),
          docSize: pending.docSize || '1/4 Oficio',
          total: String(pending.total || 13.00),
          abono: String(pending.abono || 0.00),
          phone: pending.clientPhone || '',
          activity: pending.activity || ''
        });
        const url = `https://www.imprentacordova.net/#/solicitud-impresion/directo?${params.toString()}`;
        chrome.tabs.create({ url });
        window.close();
      });
    });
  }

  const btnOpenRecibo = document.getElementById('btn-open-recibo');
  if (btnOpenRecibo) {
    btnOpenRecibo.addEventListener('click', () => {
      chrome.storage.local.get(['cordova_preferred_comercial_model', 'cordova_pending_order', 'current_session_ruc'], (res) => {
        const preferredModel = res.cordova_preferred_comercial_model || 'comercial-sobre-preimpreso';
        const pending = res.cordova_pending_order || {};
        const ruc = pending.clientRuc || res.current_session_ruc || '0702065319001';

        const params = new URLSearchParams({
          mode: preferredModel,
          ruc: ruc,
          name: pending.clientName || 'CLIENTE COMERCIAL',
          doc: pending.docName || 'Trabajo Comercial General',
          qty: String(pending.blocks || 100),
          tamano: pending.docSize || '1/4 Oficio',
          total: String(pending.total || 25.00),
          abono: String(pending.abono || 10.00),
          saldo: String(pending.saldo || 15.00),
          phone: pending.clientPhone || '',
          detalle: pending.activity || ''
        });
        const url = `https://www.imprentacordova.net/#/recibo-epson/directo?${params.toString()}`;
        chrome.tabs.create({ url });
        window.close();
      });
    });
  }

  const btnOpenNota = document.getElementById('btn-open-nota');
  if (btnOpenNota) {
    btnOpenNota.addEventListener('click', () => {
      chrome.storage.local.get(['cordova_pending_order', 'current_session_ruc'], (res) => {
        const pending = res.cordova_pending_order || {};
        const ruc = pending.clientRuc || res.current_session_ruc || '0702065319001';

        const params = new URLSearchParams({
          mode: 'nota-sobre-preimpreso',
          ruc: ruc,
          name: pending.clientName || 'CLIENTE MOSTRADOR',
          doc: pending.docName || 'Trabajo de Imprenta',
          qty: String(pending.blocks || 1),
          total: String(pending.total || 25.00),
          abono: String(pending.total || 25.00),
          saldo: '0.00',
          phone: pending.clientPhone || '',
          address: pending.clientAddress || 'Pasaje, El Oro'
        });
        const url = `https://www.imprentacordova.net/#/nota-de-venta/directo?${params.toString()}`;
        chrome.tabs.create({ url });
        window.close();
      });
    });
  }

  if (btnRegistry) {
    btnRegistry.addEventListener('click', () => {
      chrome.tabs.create({ url: chrome.runtime.getURL('registro.html') });
      window.close();
    });
  }

  // --- IMPRENTA LOGIC ---
  function appendLog(msg) {
      const div = document.createElement('div');
      div.className = 'console-entry';
      const time = new Date().toLocaleTimeString('es-EC', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
      div.innerHTML = `<span class="console-time">[${time}]</span> <span class="console-msg">${msg}</span>`;
      elLogContainer.appendChild(div);
      elLogContainer.scrollTop = elLogContainer.scrollHeight;
  }

  function updateStatusUI(state) {
      if (!state) return;

      const total = state.totalReported || 1;
      
      function updateCounter(el, val) {
          if (val === undefined || !el) return;
          el.textContent = val;
          // Update bar
          const bar = el.parentElement.querySelector('.data-bar-fill');
          if (bar) {
              const pct = Math.min(100, Math.round((val / total) * 100));
              bar.style.width = (val > 0 ? Math.max(pct, 8) : 0) + '%';
          }
      }
      
      if (state.totalReported !== undefined) {
          elCount.textContent = state.totalReported;
          const totalBar = elCount.parentElement.querySelector('.data-bar-fill');
          if (totalBar) totalBar.style.width = state.totalReported > 0 ? '100%' : '0%';
      }
      updateCounter(elT25, state.t25);
      updateCounter(elT50, state.t50);
      updateCounter(elT100, state.t100);
      updateCounter(elT200, state.t200);
      updateCounter(elTOther, state.tOther);

      if (state.currentStatus) {
          elStatusText.textContent = state.currentStatus;
      }

      if (state.isRunning) {
          elStatusPill.style.background = 'rgba(78, 222, 163, 0.1)';
          elStatusPill.style.color = '#4edea3';
          elStatusPill.querySelector('.dot').style.background = '#4edea3';
          elStatusPill.querySelector('.dot').style.boxShadow = '0 0 8px #4edea3';
      } else {
          elStatusPill.style.background = 'rgba(255, 111, 111, 0.1)';
          elStatusPill.style.color = '#ff6f6f';
          elStatusPill.querySelector('.dot').style.background = '#ff6f6f';
          elStatusPill.querySelector('.dot').style.boxShadow = '0 0 8px #ff6f6f';
      }
  }

  function syncFromStorage() {
      chrome.storage.local.get(['sriState', 'sriLogs', 'assistantVisible'], (result) => {
          if (result.sriState) {
              updateStatusUI(result.sriState);
          }
          if (result.sriLogs && result.sriLogs.length > 0) {
              elLogContainer.innerHTML = '';
              result.sriLogs.slice(-20).forEach(log => appendLog(log));
          }
          if (result.assistantVisible !== undefined) {
              chkAssistant.checked = result.assistantVisible;
          } else {
              chkAssistant.checked = true;
          }
      });
  }

  if (btnStartReport) {
    btnStartReport.addEventListener('click', () => {
        const newState = { isRunning: true, currentStatus: "Iniciando secuencia..." };
        updateStatusUI(newState);
        
        chrome.storage.local.get('sriState', (res) => {
            const prevState = res.sriState || {};
            const mergedState = {
                ...prevState,
                ...newState,
                command: 'START',
                targetMode: 'REPORTAR'
            };
            chrome.storage.local.set({ sriState: mergedState }, () => {
                chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
                    if (tabs[0]?.id) {
                        chrome.tabs.sendMessage(tabs[0].id, { action: 'START', targetMode: 'REPORTAR' }).catch(() => {});
                    }
                });
            });
        });
    });
  }

  if (btnAceptar) {
    btnAceptar.addEventListener('click', () => {
        const newState = { isRunning: true, currentStatus: "Navegando a solicitudes..." };
        updateStatusUI(newState);
        
        chrome.storage.local.get('sriState', (res) => {
            const prevState = res.sriState || {};
            const mergedState = {
                ...prevState,
                ...newState,
                command: 'START',
                targetMode: 'ACEPTAR'
            };
            chrome.storage.local.set({ sriState: mergedState }, () => {
                chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
                    if (tabs[0]?.id) {
                        chrome.tabs.sendMessage(tabs[0].id, { action: 'START', targetMode: 'ACEPTAR' }).catch(() => {});
                    }
                });
            });
        });
    });
  }

  if (btnStop) {
    btnStop.addEventListener('click', () => {
        const newState = { isRunning: false, currentStatus: "Detenido por usuario." };
        updateStatusUI(newState);
        chrome.storage.local.get('sriState', (res) => {
            const prevState = res.sriState || {};
            chrome.storage.local.set({ 
                sriState: { 
                    ...prevState,
                    ...newState, 
                    command: 'STOP' 
                } 
            });
        });
    });
  }

  if (chkAssistant) {
    chkAssistant.addEventListener('change', () => {
        chrome.storage.local.set({ assistantVisible: chkAssistant.checked });
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (tabs[0]?.id) {
                chrome.tabs.sendMessage(tabs[0].id, { action: 'TOGGLE_ASSISTANT', visible: chkAssistant.checked }).catch(() => {});
            }
        });
    });
  }

  if (btnReset) {
    btnReset.addEventListener('click', () => {
        if (confirm("¿Reiniciar el contador a 0?")) {
            const emptyState = {
                totalReported: 0,
                t25: 0, t50: 0, t100: 0, t200: 0, tOther: 0,
                currentStatus: "Contador reiniciado.",
                isRunning: false
            };
            chrome.storage.local.set({
                sriState: emptyState,
                sriLogs: []
            });
            updateStatusUI(emptyState);
            elLogContainer.innerHTML = "";
        }
    });
  }

  if (btnRegistryImprenta) {
    btnRegistryImprenta.addEventListener('click', () => {
      chrome.tabs.create({ url: chrome.runtime.getURL('registro.html') });
      window.close();
    });
  }

  // --- CREDENCIALES AUTO-LOGIN ---
  const inputImprentaRuc = document.getElementById('imprenta-ruc');
  const inputImprentaPass = document.getElementById('imprenta-pass');
  const switchAutoLogin = document.getElementById('auto-login-switch');

  chrome.storage.local.get(['cordova_imprenta_ruc', 'cordova_imprenta_pass', 'cordova_auto_login'], (res) => {
    if (inputImprentaRuc && res.cordova_imprenta_ruc) inputImprentaRuc.value = res.cordova_imprenta_ruc;
    if (inputImprentaPass && res.cordova_imprenta_pass) inputImprentaPass.value = res.cordova_imprenta_pass;
    if (switchAutoLogin && res.cordova_auto_login !== undefined) switchAutoLogin.checked = res.cordova_auto_login;
  });

  if (inputImprentaRuc) {
    inputImprentaRuc.addEventListener('change', (e) => {
      chrome.storage.local.set({ cordova_imprenta_ruc: e.target.value });
    });
  }

  if (inputImprentaPass) {
    inputImprentaPass.addEventListener('change', (e) => {
      chrome.storage.local.set({ cordova_imprenta_pass: e.target.value });
    });
  }

  if (switchAutoLogin) {
    switchAutoLogin.addEventListener('change', (e) => {
      chrome.storage.local.set({ cordova_auto_login: e.target.checked });
    });
  }

  // --- STORAGE SYNC FOR REPORTADOR ---
  chrome.storage.onChanged.addListener((changes, namespace) => {
      if (namespace === 'local') {
          if (changes.sriState) {
              updateStatusUI(changes.sriState.newValue);
          }
          if (changes.sriLogs) {
              const newLogs = changes.sriLogs.newValue;
              if (newLogs && newLogs.length > 0) {
                  appendLog(newLogs[newLogs.length - 1]);
              }
          }
          if (changes.current_session_ruc) {
              switchSection(changes.current_session_ruc.newValue);
          }
      }
  });

  // --- IDENTITY RESOLUTION ---
  // 1. Query the active tab and try to detect RUC
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs[0] && tabs[0].url && tabs[0].url.includes("sri.gob.ec")) {
      chrome.scripting.executeScript({
        target: { tabId: tabs[0].id },
        func: () => {
          const selectors = ['.sri-ruc-cabecera', '#usuario', '.usuario-login', '#lblRuc', '#userRuc', '.ruc-header'];
          for (let sel of selectors) {
            const el = document.querySelector(sel);
            if (el && el.innerText) {
              const match = el.innerText.match(/\b\d{13}\b/);
              if (match) return match[0];
            }
          }
          const ths = Array.from(document.querySelectorAll('th, td, span, div'));
          for (let el of ths) {
            if (el.children.length === 0 && el.innerText) {
              const text = el.innerText.trim();
              if (text === 'RUC:' || text.startsWith('RUC:')) {
                const next = el.nextElementSibling;
                if (next && next.innerText) {
                  const match = next.innerText.match(/\b\d{13}\b/);
                  if (match) return match[0];
                }
              }
            }
          }
          const bodyText = document.body ? document.body.innerText : '';
          const match = bodyText.match(/\b\d{10}001\b/);
          return match ? match[0] : null;
        }
      }, (results) => {
        if (results && results[0] && results[0].result) {
          switchSection(results[0].result);
        } else {
          // Fallback a almacenamiento si no hay RUC explícito en la pestaña activa
          chrome.storage.local.get(['current_session_ruc'], (result) => {
            if (result.current_session_ruc) {
              switchSection(result.current_session_ruc);
            } else {
              switchSection('cliente');
            }
          });
        }
      });
    } else {
      // If not on SRI pages, fallback to storage or default to client
      chrome.storage.local.get(['current_session_ruc'], (result) => {
        if (result.current_session_ruc) {
          switchSection(result.current_session_ruc);
        } else {
          switchSection('cliente');
        }
      });
    }
  });
});
