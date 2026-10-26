// ==========================================================================
// CORDOVA ELITE SRI EXTENSION - CONTENT SCRIPT
// Ultra-subtle, non-intrusive automation, robust login & live synchronization
// ==========================================================================

// Utility: Request background script to execute function in MAIN world (Bypasses CSP)
function triggerMainWorldClick(selector, fallbackFunc) {
  chrome.runtime.sendMessage({ action: "callFunction", funcName: fallbackFunc });
}

// Utility: Wait for an element to exist
function waitForElement(selector, timeout = 10000) {
  return new Promise((resolve, reject) => {
    if (document.querySelector(selector)) return resolve(document.querySelector(selector));
    const observer = new MutationObserver(mutations => {
      if (document.querySelector(selector)) {
        observer.disconnect();
        resolve(document.querySelector(selector));
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });
    setTimeout(() => {
      observer.disconnect();
      reject(new Error(`Timeout: ${selector}`));
    }, timeout);
  });
}

// Utility: Detect if current page is a login / authentication screen
function isSRILoginScreen() {
  const url = window.location.href.toLowerCase();
  if (url.includes('login') || url.includes('logout') || url.includes('j_security_check')) return true;
  
  const hasPasswordInput = !!document.querySelector('input[type="password"], #password, #pass');
  const hasLoginSubmit = !!document.querySelector('input.boton-ingresar-login, input[name="boton"][value="Ingresar"], input[value="Ingresar"]');
  const hasLoginForm = !!document.querySelector('form[action*="login"], form[action*="j_security_check"]');
  
  return hasPasswordInput || hasLoginSubmit || hasLoginForm;
}

// Utility: Subtle non-blocking Toast HUD in the corner
function showCordovaToastHud(message) {
  const existing = document.getElementById('cordova-toast-hud');
  if (existing) existing.remove();

  const toast = document.createElement('div');
  toast.id = 'cordova-toast-hud';
  toast.className = 'cordova-toast-hud';
  const logoUrl = chrome.runtime.getURL('icons/icon128.png');
  toast.innerHTML = `
    <img src="${logoUrl}" alt="Cordova">
    <span>${message}</span>
  `;
  document.body.appendChild(toast);

  setTimeout(() => toast.classList.add('show'), 10);
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 350);
  }, 3200);
}

// Utility: Subtle non-blocking Warning Card
function showCordovaWarningCard(title, message, onDismiss = null) {
  const existing = document.getElementById('cordova-warning-card');
  if (existing) existing.remove();

  const card = document.createElement('div');
  card.id = 'cordova-warning-card';
  card.className = 'cordova-warning-card';
  card.innerHTML = `
    <div class="warn-header">
      <div class="warn-title">⚠️ ${title}</div>
      <button id="cdv-warn-close" style="background: none; border: none; font-size: 16px; cursor: pointer; color: #64748b;">&times;</button>
    </div>
    <div class="warn-body">${message}</div>
    <button class="warn-btn" id="cdv-warn-ok">Entendido</button>
  `;
  document.body.appendChild(card);

  const close = () => {
    card.remove();
    if (onDismiss) onDismiss();
  };

  const okBtn = card.querySelector('#cdv-warn-ok');
  const closeBtn = card.querySelector('#cdv-warn-close');
  if (okBtn) okBtn.addEventListener('click', close);
  if (closeBtn) closeBtn.addEventListener('click', close);
}

// Utility: Replace old disruptive alert with non-blocking HUD pill
function showCordovaAlert(title, message, isFinal = false, onConfirm = null, autoPilot = false, isError = false) {
  if (isError) {
    showCordovaWarningCard(title, message, onConfirm);
    return;
  }

  if (autoPilot) {
    showCordovaToastHud(`⚡ ${title} • ${message.replace(/<[^>]*>?/gm, '')}`);
    if (onConfirm) {
      setTimeout(() => onConfirm(), 250);
    }
    return;
  }

  showCordovaToastHud(`💡 ${title}`);
  if (onConfirm) setTimeout(() => onConfirm(), 350);
}

// Utility: Briefly highlight element being acted on
function highlightSRIElement(el) {
  if (!el || !(el instanceof HTMLElement)) return;
  el.classList.add('cdv-target-highlight');
  setTimeout(() => {
    el.classList.remove('cdv-target-highlight');
  }, 1400);
}

// -------------------------------------------------------------
// STEP SUGGESTION FLOATING MINI-HUD (DOCKABLE / NON-INTRUSIVE)
// -------------------------------------------------------------
function showStepSuggestionBanner() {
  // CRÍTICO: Si estamos en la pantalla de Login, NUNCA inyectar el HUD para no tapar el formulario
  if (isSRILoginScreen()) {
    const existing = document.querySelector('.cordova-suggestion-banner');
    if (existing) existing.remove();
    return;
  }

  chrome.storage.local.get([
    'cordova_suggestion_disabled',
    'cordovaAutoPilot',
    'cordovaBlocks',
    'cordovaDocType',
    'cordova_suggested',
    'cordova_hud_minimized'
  ], (config) => {
    if (config.cordova_suggestion_disabled) return;

    const url = window.location.href;
    const existingBanner = document.querySelector('.cordova-suggestion-banner');
    if (!url.includes('facturacion-internet')) {
      if (existingBanner) existingBanner.remove();
      return;
    }

    const blocks = config.cordovaBlocks || 100;
    const autoPilot = config.cordovaAutoPilot !== undefined ? config.cordovaAutoPilot : true;
    const isMinimized = !!config.cordova_hud_minimized;

    let stepNum = 1;
    let whereAmI = "📍 Paso 1/5: Inicio del Trámite";
    let whatTouchesNext = "👉 Siguiente: Selección de Establecimiento";

    if (url.includes('inicio-contribuyente.jspa')) {
      stepNum = 2;
      whereAmI = "📍 Paso 2/5: Selección de Establecimiento";
      whatTouchesNext = `👉 Siguiente: Inserción de comprobantes (${blocks}h)`;
    } else if (url.includes('seleccionar-establecimiento-contibuyente-imprenta.jspa')) {
      stepNum = 3;
      whereAmI = `📍 Paso 3/5: Llenando ${blocks} Comprobantes`;
      whatTouchesNext = "👉 Siguiente: Validar tabla de secuencias";
    } else if (url.includes('agregar-cantidades-imprenta.jspa') || url.includes('confirmar-cantidades.jspa') || url.includes('seleccionar-imprenta.jspa')) {
      stepNum = 4;
      whereAmI = "📍 Paso 4/5: Imprenta Córdova (Cód. 8634)";
      whatTouchesNext = "👉 Siguiente: Finalización y Sincronización";
    } else if (url.includes('seleccionar-establecimiento-imprenta.jspa')) {
      stepNum = 5;
      whereAmI = "📍 Paso 5/5: Solicitud Finalizada 🎉";
      whatTouchesNext = "👉 Siguiente: Descargar PDF y Registrar Retiro";
    }

    if (existingBanner) existingBanner.remove();

    const banner = document.createElement('div');
    banner.className = `cordova-suggestion-banner ${autoPilot ? 'autopilot-active' : ''} ${isMinimized ? 'minimized' : ''}`;
    const logoUrl = chrome.runtime.getURL('icons/icon128.png');

    // Stepper Line HTML
    let stepperHtml = `
      <div class="cordova-stepper-container">
        <div class="cordova-stepper-line">
          <div class="cordova-stepper-line-fill" style="width: ${((stepNum - 1) / 4) * 100}%"></div>
        </div>
    `;
    for (let i = 1; i <= 5; i++) {
      let stateClass = i < stepNum ? 'completed' : (i === stepNum ? 'active' : '');
      stepperHtml += `<div class="cordova-step-node ${stateClass}">${i < stepNum ? '✓' : i}</div>`;
    }
    stepperHtml += `</div>`;

    const badgeText = autoPilot 
      ? `<span class="cordova-beacon-dot"></span> ⚡ AUTO-PILOTO` 
      : `<span class="cordova-beacon-dot"></span> 💡 GUIADO`;

    banner.innerHTML = `
      <div class="cordova-banner-trigger" id="cdv-trigger-header">
        <div class="cordova-banner-brand">
          <img src="${logoUrl}" alt="Cordova" class="cordova-banner-logo">
          <span class="cordova-banner-title">Imprenta Córdova</span>
          <span class="cordova-banner-badge">${badgeText}</span>
        </div>
        <div class="cordova-banner-actions">
          <button class="cordova-banner-btn-min" id="cdv-btn-toggle-min" title="${isMinimized ? 'Expandir HUD' : 'Minimizar HUD'}">${isMinimized ? '▲' : '−'}</button>
          <button class="cordova-banner-close" id="cdv-ignore" title="Ocultar">&times;</button>
        </div>
      </div>

      <div class="cordova-banner-body">
        ${stepperHtml}

        <div class="cordova-banner-step-info">
          <div class="cordova-banner-where">${whereAmI}</div>
          <div class="cordova-banner-next">${whatTouchesNext}</div>
        </div>

        <div class="cordova-banner-pills">
          <button class="cordova-pill-btn ${autoPilot ? 'highlight' : ''}" id="cdv-toggle-pilot">
            ${autoPilot ? '⏸ Pausar' : '▶ Reanudar'}
          </button>
          <button class="cordova-pill-btn ${blocks === 25 ? 'highlight' : ''}" data-val="25">25h</button>
          <button class="cordova-pill-btn ${blocks === 50 ? 'highlight' : ''}" data-val="50">50h</button>
          <button class="cordova-pill-btn ${blocks === 100 ? 'highlight' : ''}" data-val="100">1 Block (100h)</button>
          <button class="cordova-pill-btn ${blocks === 200 ? 'highlight' : ''}" data-val="200">2 Blocks (200h)</button>
          <button class="cordova-pill-btn ${blocks === 500 ? 'highlight' : ''}" data-val="500">5 Blocks</button>
          <div class="cordova-banner-custom">
            <input type="number" id="cdv-custom-val" placeholder="Hojas" value="${blocks}" min="1">
            <button id="cdv-custom-btn">Ir</button>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(banner);

    // Minimize / Restore Toggle
    const minBtn = banner.querySelector('#cdv-btn-toggle-min');
    if (minBtn) {
      minBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const newState = !banner.classList.contains('minimized');
        banner.classList.toggle('minimized', newState);
        minBtn.textContent = newState ? '▲' : '−';
        chrome.storage.local.set({ cordova_hud_minimized: newState });
      });
    }

    // Toggle Pilot
    const toggleBtn = banner.querySelector('#cdv-toggle-pilot');
    if (toggleBtn) {
      toggleBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const newAutoState = !autoPilot;
        chrome.storage.local.set({ cordovaAutoPilot: newAutoState }, () => {
          showStepSuggestionBanner();
        });
      });
    }

    // Start / Change quantity
    const startAutomation = (newBlocks) => {
      chrome.storage.local.set({ 
        cordovaBlocks: newBlocks, 
        cordova_suggested: true, 
        cordova_est_selected: false,
        cordovaAutoPilot: true 
      }, () => {
        if (!url.includes('inicio-contribuyente.jspa')) {
          window.location.href = '/facturacion-internet/preimpresos/inicio-contribuyente.jspa';
        } else {
          window.location.reload();
        }
      });
    };

    banner.querySelectorAll('.cordova-pill-btn[data-val]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const val = parseInt(e.currentTarget.getAttribute('data-val'), 10);
        startAutomation(val);
      });
    });

    const customBtn = banner.querySelector('#cdv-custom-btn');
    const customInput = banner.querySelector('#cdv-custom-val');
    if (customBtn && customInput) {
      customBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const val = parseInt(customInput.value, 10);
        if (val > 0) startAutomation(val);
      });
      customInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          const val = parseInt(customInput.value, 10);
          if (val > 0) startAutomation(val);
        }
      });
    }

    const ignoreBtn = banner.querySelector('#cdv-ignore');
    if (ignoreBtn) {
      ignoreBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        banner.remove();
      });
    }
  });
}

// -------------------------------------------------------------
// SRI LOGIN ASSISTANT BAR
// -------------------------------------------------------------
function injectSRILoginAssistant() {
  if (window.self !== window.top) return;
  if (document.getElementById('cordova-login-minimal-bar')) return;

  const logoUrl = chrome.runtime.getURL('icons/icon128.png');

  const bar = document.createElement('div');
  bar.id = 'cordova-login-minimal-bar';
  bar.className = 'cordova-login-minimal-bar';
  bar.innerHTML = `
    <div class="bar-brand">
      <img src="${logoUrl}" alt="Cordova">
      <span>IMPRENTA CÓRDOVA</span>
    </div>
    <div class="bar-btns">
      <button type="button" id="cdv-btn-login-mode-client" class="mode-btn client">
        👤 Cliente (Manual)
      </button>
      <button type="button" id="cdv-btn-login-mode-imprenta" class="mode-btn imprenta">
        🏢 Imprenta (Auto 0702065319001)
      </button>
    </div>
  `;

  document.body.appendChild(bar);

  // Modo Cliente
  document.getElementById('cdv-btn-login-mode-client').addEventListener('click', () => {
    const nativeRucInput = document.querySelector('#userPri, input[name="j_username"], input[name="usuario"], input[name="ruc"], #usuario');
    const nativePassInput = document.querySelector('input[type="password"], #pass, #password');

    if (nativeRucInput) {
      nativeRucInput.value = '';
      nativeRucInput.focus();
    }
    if (nativePassInput) {
      nativePassInput.value = '';
    }

    chrome.storage.local.set({ current_session_ruc: null, cordovaAutoPilot: false });
    showCordovaToastHud("Modo Cliente Activo");
  });

  // Modo Imprenta
  document.getElementById('cdv-btn-login-mode-imprenta').addEventListener('click', () => {
    chrome.storage.local.get(['cordova_imprenta_ruc', 'cordova_imprenta_pass'], (creds) => {
      const ruc = creds.cordova_imprenta_ruc || '0702065319001';
      const pass = creds.cordova_imprenta_pass || 'GrafiCoR8634@';

      chrome.storage.local.set({ cordova_imprenta_ruc: ruc, cordova_imprenta_pass: pass });

      const nativeRucInput = document.querySelector('#userPri, input[name="j_username"], input[name="usuario"], input[name="ruc"], #usuario');
      const nativePassInput = document.querySelector('#password, input[name="password"], input[type="password"], #pass');

      if (nativeRucInput) {
        nativeRucInput.value = ruc;
        nativeRucInput.dispatchEvent(new Event('input', { bubbles: true }));
        nativeRucInput.dispatchEvent(new Event('change', { bubbles: true }));
      }
      
      if (nativePassInput) {
        nativePassInput.value = pass;
        nativePassInput.dispatchEvent(new Event('input', { bubbles: true }));
        nativePassInput.dispatchEvent(new Event('change', { bubbles: true }));
      }

      chrome.storage.local.set({ current_session_ruc: ruc }, () => {
        const submitBtn = document.querySelector('input.boton-ingresar-login, input[name="boton"][value="Ingresar"]');
        if (submitBtn) {
          highlightSRIElement(submitBtn);
          setTimeout(() => submitBtn.click(), 150);
        }
      });
    });
  });
}

// -------------------------------------------------------------
// RUC DETECTION UTILITY
// -------------------------------------------------------------
function detectActiveSRIRuc() {
  try {
    const selectors = ['.sri-ruc-cabecera', '#usuario', '.usuario-login', '#lblRuc', '#userRuc', '.ruc-header'];
    for (let sel of selectors) {
      const el = document.querySelector(sel);
      if (el) {
        const text = (el.textContent || '').trim();
        const match = text.match(/\b\d{13}\b/);
        if (match) return match[0];
      }
    }

    const thElements = Array.from(document.querySelectorAll('th, td'));
    for (let el of thElements) {
      const text = (el.textContent || '').trim();
      if (text.includes('RUC:')) {
        const match = text.match(/\b\d{13}\b/);
        if (match) return match[0];
        if (el.nextElementSibling) {
          const nextMatch = (el.nextElementSibling.textContent || '').match(/\b\d{13}\b/);
          if (nextMatch) return nextMatch[0];
        }
      }
    }

    const bodyText = document.body ? (document.body.textContent || '') : '';
    if (bodyText.includes('0702065319001')) return '0702065319001';

    const anyRucMatch = bodyText.match(/\b\d{10}001\b/);
    if (anyRucMatch) return anyRucMatch[0];
  } catch (err) {
    console.warn("[Cordova Ext] RUC Detection warn:", err);
  }

  return null;
}

function parseSRIDateToISO(dateStr) {
  if (!dateStr) return null;
  if (dateStr.includes('T')) return dateStr;

  const months = {
    'enero': '01', 'febrero': '02', 'marzo': '03', 'abril': '04',
    'mayo': '05', 'juno': '06', 'junio': '06', 'julio': '07', 'agosto': '08',
    'septiembre': '09', 'octubre': '10', 'noviembre': '11', 'diciembre': '12'
  };

  const parts = dateStr.split('/');
  if (parts.length === 3) {
    const day = parts[0].padStart(2, '0');
    const monthRaw = parts[1].toLowerCase().trim();
    const month = months[monthRaw] || parts[1].padStart(2, '0');
    const year = parts[2].trim();
    return `${year}-${month}-${day}T00:00:00.000Z`;
  }
  return null;
}

// -------------------------------------------------------------
// SINCRONIZACIÓN EN LA NUBE — vía backend (Render)
// -------------------------------------------------------------
// Antes esto escribía directo en Supabase con la anon key. Pero TODAS las políticas
// RLS exigen `get_user_role()`, que lee `auth.uid()`: para una petición `anon` eso es
// NULL, así que ninguna política se cumplía y las escrituras fallaban en silencio.
// Ahora pasan por el backend (cordovaApi.js), que sí puede escribir con la service_role
// sin exponerla dentro del paquete de la extensión.

let currentSyncedTrabajoId = null;
let currentSyncedClienteId = null;

async function autoSyncToSupabase(orderData) {
  const docNames = { '0': 'Factura', '1': 'Nota de Venta', '5': 'Guía de Remisión' };
  const docName = docNames[orderData.docType] || 'Nota de Venta';

  const totalVal = parseFloat(orderData.total) || 13.00;
  const abonoVal = parseFloat(orderData.abono) || 0.00;
  const saldoVal = Math.max(0, totalVal - abonoVal);

  try {
    // 1. Crear / Actualizar Cliente
    let clienteId = null;
    if (orderData.clientRuc) {
      const clientPayload = {
        ruc: orderData.clientRuc,
        cedula: orderData.clientRuc.length === 13 ? orderData.clientRuc.substring(0, 10) : orderData.clientRuc,
        nombre: (orderData.clientName || 'CLIENTE SRI').toUpperCase(),
        telefono: orderData.clientPhone ? [orderData.clientPhone] : [],
        email: orderData.clientEmail || null,
        actividades: (orderData.activity || 'COMERCIO / SERVICIOS GENERAL').toUpperCase()
      };

      const clientRes = await CordovaApi.post('/api/v1/clientes/upsert', clientPayload);

      if (clientRes && clientRes.cliente) {
        clienteId = clientRes.cliente.id || null;
        currentSyncedClienteId = clienteId;
      }
    }

    // 2. Crear Trabajo vinculado
    const trabajoPayload = {
      cliente_id: clienteId,
      titular: (orderData.clientName || 'CLIENTE SRI').toUpperCase(),
      tipo: docName,
      subtipo: `${orderData.blocks || 100} Hojas (${orderData.docSize || '1/4 Oficio'})`,
      cantidad: 1,
      total: totalVal,
      abono: abonoVal,
      saldo: saldoVal,
      prioridad: 'Normal',
      estado: 'Pendiente',
      fecha_entrada: new Date().toISOString(),
      origen: 'SRI Extension',
      establecimiento: '001',
      punto_emision: '001',
      tamano: orderData.docSize || '1/4 Oficio',
      actividad_seleccionada: (orderData.activity || 'COMERCIO / SERVICIOS GENERAL').toUpperCase(),
      fecha_vencimiento: parseSRIDateToISO(orderData.caducidad)
    };

    const trabajoRes = await CordovaApi.post('/api/v1/trabajos/crear', trabajoPayload);

    if (trabajoRes && trabajoRes.trabajo) {
      currentSyncedTrabajoId = trabajoRes.trabajo.id || null;
      return true;
    }
  } catch(e) {
    console.error('⚠️ [AutoSync Supabase Error]:', e);
  }
  return false;
}

async function updateSupabaseOrderRefinement(orderData) {
  const totalVal = parseFloat(orderData.total) || 13.00;
  const abonoVal = parseFloat(orderData.abono) || 0.00;
  const saldoVal = Math.max(0, totalVal - abonoVal);

  try {
    if (currentSyncedClienteId || orderData.clientRuc) {
      const clientUpdate = {
        telefono: orderData.clientPhone ? [orderData.clientPhone] : [],
        email: orderData.clientEmail || null,
        actividades: (orderData.activity || 'COMERCIO / SERVICIOS GENERAL').toUpperCase()
      };
      
      await CordovaApi.post('/api/v1/clientes/actualizar', {
        ...(currentSyncedClienteId ? { id: currentSyncedClienteId } : { ruc: orderData.clientRuc }),
        cambios: clientUpdate
      });
    }

    if (currentSyncedTrabajoId) {
      const trabajoUpdate = {
        total: totalVal,
        abono: abonoVal,
        saldo: saldoVal,
        tamano: orderData.docSize || '1/4 Oficio',
        subtipo: `${orderData.blocks || 100} Hojas (${orderData.docSize || '1/4 Oficio'})`,
        actividad_seleccionada: (orderData.activity || 'COMERCIO / SERVICIOS GENERAL').toUpperCase()
      };

      await CordovaApi.post('/api/v1/trabajos/actualizar', {
        id: currentSyncedTrabajoId,
        cambios: trabajoUpdate
      });
    }
  } catch(e) {
    console.error('⚠️ [Refine Sync Error]:', e);
  }
}

// -------------------------------------------------------------
// COMPLETION DRAWER (RIGHT-SIDE SMART PANEL)
// -------------------------------------------------------------
function showCordovaSuccessModal(finalData, blocks) {
  chrome.storage.local.get(['cordova_orders', 'cordova_preferred_print_model'], (result) => {
    const orders = result.cordova_orders || [];
    let selectedModel = result.cordova_preferred_print_model || 'sri-sobre-preimpreso';
    const clientRuc = finalData.cordovaClientRuc || '';
    const clientOrders = orders.filter(o => o.clientRuc === clientRuc);
    const lastOrder = clientOrders.length > 0 ? clientOrders[clientOrders.length - 1] : null;

    const prices = {
      "1/4 Oficio": { 25: 9.00, 50: 10.00, 100: 13.00, 200: 20.00, 300: 30.00, 400: 36.00, 500: 40.00, 1000: 65.00 },
      "1/2 Oficio": { 25: 12.00, 50: 14.00, 100: 18.00, 200: 32.00, 300: 48.00, 400: 60.00, 500: 65.00, 1000: 100.00 }
    };

    const getPrice = (size, qty) => {
      if (prices[size] && prices[size][qty] !== undefined) {
        return prices[size][qty];
      }
      const base = size === "1/2 Oficio" ? 18.00 : 13.00;
      return (qty / 100) * base;
    };

    let selectedSize = (lastOrder && lastOrder.docSize) ? lastOrder.docSize : "1/4 Oficio";
    let selectedAbonoVal = "5";
    let customAbonoVal = "";
    let selectedActivity = (lastOrder && lastOrder.activity) ? lastOrder.activity : (finalData.cordovaNombreComercial && !finalData.cordovaNombreComercial.includes('Sin nombre') ? finalData.cordovaNombreComercial : "Comercio / Servicios General");
    let selectedPhoneVal = (lastOrder && lastOrder.clientPhone) ? lastOrder.clientPhone : "";
    let selectedEmailVal = (lastOrder && lastOrder.clientEmail) ? lastOrder.clientEmail : "";

    if (lastOrder && lastOrder.abono) {
      const abVal = String(lastOrder.abono);
      if (abVal === "5" || abVal === "10" || abVal === "15") {
        selectedAbonoVal = abVal;
      } else {
        selectedAbonoVal = "custom";
        customAbonoVal = lastOrder.abono;
      }
    }

    let currentTotal = getPrice(selectedSize, blocks);

    const existingOverlay = document.querySelector('.cordova-completion-drawer-overlay');
    if (existingOverlay) existingOverlay.remove();

    const overlay = document.createElement('div');
    overlay.className = 'cordova-completion-drawer-overlay';
    const logoUrl = chrome.runtime.getURL('icons/icon128.png');
    const docName = finalData.cordovaDocType === '0' ? 'Factura' : finalData.cordovaDocType === '5' ? 'Guía de Remisión' : 'Nota de Venta';

    overlay.innerHTML = `
      <div class="cordova-completion-card">
        <!-- HEADER -->
        <div class="drawer-header">
          <div class="drawer-brand">
            <img src="${logoUrl}" alt="Cordova" class="drawer-logo">
            <div>
              <div class="drawer-badge-sri">IMPRENTA CÓRDOVA • CÓD. 8634</div>
              <h3 class="drawer-title">Solicitud SRI Completada</h3>
            </div>
          </div>
          <button class="drawer-close-btn" id="cdv-btn-drawer-close" title="Minimizar / Cerrar">&times;</button>
        </div>

        <!-- SUCCESS BADGE -->
        <div class="drawer-success-banner">
          <span>⚡ Sincronizado en Vivo con la Plataforma Web (imprentacordova.net)</span>
        </div>

        <!-- FORM BOX -->
        <div class="drawer-form-box">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
            <span class="drawer-field-lbl">Comprobante</span>
            <span style="font-size: 10px; font-weight: 800; color: #2563eb; background: #eff6ff; padding: 2px 8px; border-radius: 6px; border: 1px solid #bfdbfe;">
              ${docName} • ${blocks} Hojas
            </span>
          </div>

          <!-- CLIENT NAME -->
          <div style="margin-bottom: 8px;">
            <div class="drawer-field-lbl">Cliente / Razón Social:</div>
            <input type="text" id="cdv-drawer-name" value="${finalData.cordovaClientName || 'Desconocido'}" class="drawer-input-inline-name">
          </div>

          <!-- RUC & CADUCIDAD -->
          <div style="display: flex; gap: 10px; margin-bottom: 8px; font-size: 11px;">
            <div style="flex: 1;">
              <span class="drawer-field-lbl">RUC: </span>
              <span style="font-family: monospace; font-weight: 800; color: #0f172a;">${finalData.cordovaClientRuc || ''}</span>
            </div>
            <div style="flex: 1;">
              <span class="drawer-field-lbl">Caducidad: </span>
              <span style="font-weight: 700; color: #0f172a;">${finalData.cordovaCaducidad || '12 Meses'}</span>
            </div>
          </div>

          <!-- ACTIVIDAD ECONÓMICA -->
          <div style="margin-bottom: 8px;">
            <div class="drawer-field-lbl">Actividad Económica:</div>
            <input type="text" id="cdv-drawer-activity" value="${selectedActivity}" placeholder="Ej. Comercio, Servicios..." class="drawer-input">
          </div>

          <!-- TELÉFONO & CORREO -->
          <div style="display: flex; gap: 8px; margin-bottom: 8px;">
            <div style="flex: 1;">
              <div class="drawer-field-lbl">Teléfono:</div>
              <input type="text" id="cdv-drawer-phone" value="${selectedPhoneVal}" placeholder="0993083943" class="drawer-input">
            </div>
            <div style="flex: 1;">
              <div class="drawer-field-lbl">Correo:</div>
              <input type="email" id="cdv-drawer-email" value="${selectedEmailVal}" placeholder="cliente@correo.com" class="drawer-input">
            </div>
          </div>

          <!-- TAMAÑO -->
          <div style="margin-bottom: 8px;">
            <div class="drawer-field-lbl">Tamaño de Comprobante:</div>
            <div class="drawer-segment-group" id="cdv-drawer-size">
              <button class="drawer-segment-btn ${selectedSize === '1/4 Oficio' ? 'active' : ''}" data-val="1/4 Oficio">1/4 Oficio</button>
              <button class="drawer-segment-btn ${selectedSize === '1/2 Oficio' ? 'active' : ''}" data-val="1/2 Oficio">1/2 Oficio</button>
            </div>
          </div>

          <!-- ABONO -->
          <div>
            <div class="drawer-field-lbl">Abono Inicial ($):</div>
            <div style="display: flex; gap: 6px; align-items: center;">
              <div class="drawer-segment-group" id="cdv-drawer-abono" style="flex: 1;">
                <button class="drawer-segment-btn ${selectedAbonoVal === '5' ? 'active' : ''}" data-val="5">$5</button>
                <button class="drawer-segment-btn ${selectedAbonoVal === '10' ? 'active' : ''}" data-val="10">$10</button>
                <button class="drawer-segment-btn ${selectedAbonoVal === '15' ? 'active' : ''}" data-val="15">$15</button>
                <button class="drawer-segment-btn ${selectedAbonoVal === 'custom' ? 'active' : ''}" data-val="custom">Otro</button>
              </div>
              <input type="number" id="cdv-drawer-abono-manual" value="${customAbonoVal}" placeholder="$" style="width: 55px; display: ${selectedAbonoVal === 'custom' ? 'inline-block' : 'none'}; padding: 4px 6px; font-size: 11px; border-radius: 6px; border: 1.5px solid #2563eb; text-align: center;" min="1" step="0.01">
            </div>
          <!-- MODELO DE SOLICITUD SRI (LAS 3 VERSIONES) -->
          <div style="margin-top: 10px; margin-bottom: 8px;">
            <div class="drawer-field-lbl" style="font-weight: 800; color: #0f172a; display: flex; justify-content: space-between; align-items: center;">
              <span>Formato de Solicitud SRI:</span>
              <span style="font-size: 8.5px; color: #b45309; background: #fef3c7; padding: 1px 5px; border-radius: 4px; font-weight: 700;">10 Blocks en stock</span>
            </div>
            <div class="drawer-segment-group" id="cdv-drawer-model" style="display: flex; flex-direction: column; gap: 4px; margin-top: 4px;">
              <button class="drawer-segment-btn ${selectedModel === 'sri-sobre-preimpreso' ? 'active' : ''}" data-val="sri-sobre-preimpreso" style="text-align: left; padding: 5px 8px; font-size: 10.5px; border-radius: 6px; display: flex; justify-content: space-between;">
                <strong>📦 1. Sobre Preimpreso</strong>
                <span style="font-size: 9px; opacity: 0.8;">(Gasta 10 Blocks)</span>
              </button>
              <button class="drawer-segment-btn ${selectedModel === 'sri-arte-completo' ? 'active' : ''}" data-val="sri-arte-completo" style="text-align: left; padding: 5px 8px; font-size: 10.5px; border-radius: 6px; display: flex; justify-content: space-between;">
                <strong>📄 2. Clásico Completo</strong>
                <span style="font-size: 9px; opacity: 0.8;">(Hoja en Blanco)</span>
              </button>
              <button class="drawer-segment-btn ${selectedModel === 'sri-moderno' ? 'active' : ''}" data-val="sri-moderno" style="text-align: left; padding: 5px 8px; font-size: 10.5px; border-radius: 6px; display: flex; justify-content: space-between;">
                <strong>✨ 3. Evolución Moderna</strong>
                <span style="font-size: 9px; opacity: 0.8;">(Full Pro con QR)</span>
              </button>
            </div>
          </div>
        </div>

        <!-- FINANCIAL SUMMARY -->
        <div class="drawer-financial-bar">
          <div>Total: <span id="cdv-drawer-live-total" class="total-val">$${currentTotal.toFixed(2)}</span></div>
          <div>Saldo: <span id="cdv-drawer-live-saldo" class="saldo-val">$${currentTotal.toFixed(2)}</span></div>
        </div>

        <!-- ACTIONS -->
        <div>
          <button class="drawer-btn-primary" id="cdv-btn-drawer-web">
            ✅ VER EN PLATAFORMA WEB (imprentacordova.net)
          </button>
          
          <div class="drawer-actions-row">
            <button class="drawer-btn-sec print" id="cdv-btn-drawer-print">
              🖨️ Imprimir Solicitud
            </button>
            <button class="drawer-btn-sec wa" id="cdv-btn-drawer-wa">
              📱 WhatsApp
            </button>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);
    setTimeout(() => overlay.classList.add('show'), 50);

    const liveTotalSpan = document.getElementById('cdv-drawer-live-total');
    const liveSaldoSpan = document.getElementById('cdv-drawer-live-saldo');
    const inputAbonoManual = document.getElementById('cdv-drawer-abono-manual');
    const inputEditName = document.getElementById('cdv-drawer-name');
    const inputEditActivity = document.getElementById('cdv-drawer-activity');
    const inputEditPhone = document.getElementById('cdv-drawer-phone');
    const inputEditEmail = document.getElementById('cdv-drawer-email');
    const btnWebPlatform = document.getElementById('cdv-btn-drawer-web');
    const btnPrint = document.getElementById('cdv-btn-drawer-print');
    const btnWhatsApp = document.getElementById('cdv-btn-drawer-wa');
    const closeBtn = document.getElementById('cdv-btn-drawer-close');

    const updateFinancials = () => {
      currentTotal = getPrice(selectedSize, blocks);
      if (liveTotalSpan) liveTotalSpan.textContent = `$${currentTotal.toFixed(2)}`;
      
      let abono = 0;
      if (selectedAbonoVal === "custom" && inputAbonoManual) {
        abono = parseFloat(inputAbonoManual.value) || 0;
      } else {
        abono = parseFloat(selectedAbonoVal) || 0;
      }
      
      const saldo = Math.max(0, currentTotal - abono);
      if (liveSaldoSpan) liveSaldoSpan.textContent = `$${saldo.toFixed(2)}`;
    };

    // Tamaño buttons
    document.querySelectorAll('#cdv-drawer-size .drawer-segment-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('#cdv-drawer-size .drawer-segment-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        selectedSize = btn.dataset.val;
        updateFinancials();
      });
    });

    // Abono buttons
    document.querySelectorAll('#cdv-drawer-abono .drawer-segment-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('#cdv-drawer-abono .drawer-segment-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        selectedAbonoVal = btn.dataset.val;
        if (selectedAbonoVal === 'custom' && inputAbonoManual) {
          inputAbonoManual.style.display = 'inline-block';
          inputAbonoManual.focus();
        } else if (inputAbonoManual) {
          inputAbonoManual.style.display = 'none';
        }
        updateFinancials();
      });
    });

    // Model selection buttons
    document.querySelectorAll('#cdv-drawer-model .drawer-segment-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('#cdv-drawer-model .drawer-segment-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        selectedModel = btn.dataset.val;
        chrome.storage.local.set({ cordova_preferred_print_model: selectedModel });
      });
    });

    if (inputAbonoManual) {
      inputAbonoManual.addEventListener('input', updateFinancials);
    }

    updateFinancials();

    const savePending = (autoPrint, callback) => {
      let finalAbono = 0;
      if (selectedAbonoVal === 'custom' && inputAbonoManual) {
        finalAbono = parseFloat(inputAbonoManual.value) || 0;
      } else {
        finalAbono = parseFloat(selectedAbonoVal) || 0;
      }
      const finalSaldo = Math.max(0, currentTotal - finalAbono);

      const editedName = inputEditName ? inputEditName.value.trim().toUpperCase() : (finalData.cordovaClientName || '');
      const editedActivity = inputEditActivity ? inputEditActivity.value.trim() : selectedActivity;
      const editedPhone = inputEditPhone ? inputEditPhone.value.trim() : selectedPhoneVal;
      const editedEmail = inputEditEmail ? inputEditEmail.value.trim() : selectedEmailVal;

      const pendingOrder = {
        clientRuc: finalData.cordovaClientRuc || '',
        clientName: editedName || finalData.cordovaClientName || '',
        caducidad: finalData.cordovaCaducidad || '',
        vigencia: finalData.cordovaVigencia || '',
        nombreComercial: finalData.cordovaNombreComercial || '',
        docType: finalData.cordovaDocType || '1',
        blocks: blocks,
        docSize: selectedSize,
        model: selectedModel,
        activity: editedActivity || "Comercio / Servicios General",
        clientPhone: editedPhone || "Dictado / Sin teléfono",
        clientEmail: editedEmail,
        phoneOpt: "Dictado",
        abono: finalAbono,
        total: currentTotal,
        saldo: finalSaldo,
        autoPrint: autoPrint,
        timestamp: Date.now()
      };

      updateSupabaseOrderRefinement(pendingOrder).catch(e => console.error(e));
      chrome.storage.local.set({ cordova_pending_order: pendingOrder }, callback);
    };

    if (btnWebPlatform) {
      btnWebPlatform.addEventListener('click', () => {
        savePending(false, () => {
          const ruc = finalData.cordovaClientRuc || '';
          const editedName = inputEditName ? inputEditName.value.trim().toUpperCase() : (finalData.cordovaClientName || '');
          const editedActivity = inputEditActivity ? inputEditActivity.value.trim() : selectedActivity;
          const editedPhone = inputEditPhone ? inputEditPhone.value.trim() : selectedPhoneVal;
          const editedEmail = inputEditEmail ? inputEditEmail.value.trim() : selectedEmailVal;
          
          let finalAbono = selectedAbonoVal === 'custom' && inputAbonoManual ? (parseFloat(inputAbonoManual.value) || 0) : (parseFloat(selectedAbonoVal) || 0);

          const params = new URLSearchParams({
            mode: selectedModel || 'sri-sobre-preimpreso',
            ruc: ruc,
            name: editedName,
            activity: editedActivity,
            phone: editedPhone,
            email: editedEmail,
            docType: finalData.cordovaDocType || '1',
            blocks: String(blocks),
            docSize: selectedSize,
            abono: String(finalAbono),
            total: String(currentTotal),
            caducidad: finalData.cordovaCaducidad || ''
          });

          const webUrl = `https://www.imprentacordova.net/#/nuevo?${params.toString()}`;
          window.open(webUrl, '_blank');
        });
      });
    }

    if (btnPrint) {
      btnPrint.addEventListener('click', () => {
        savePending(true, () => {
          const ruc = finalData.cordovaClientRuc || '';
          const editedName = inputEditName ? inputEditName.value.trim().toUpperCase() : (finalData.cordovaClientName || '');
          const editedActivity = inputEditActivity ? inputEditActivity.value.trim() : selectedActivity;
          const editedPhone = inputEditPhone ? inputEditPhone.value.trim() : selectedPhoneVal;
          const editedEmail = inputEditEmail ? inputEditEmail.value.trim() : selectedEmailVal;
          let finalAbono = selectedAbonoVal === 'custom' && inputAbonoManual ? (parseFloat(inputAbonoManual.value) || 0) : (parseFloat(selectedAbonoVal) || 0);

          const params = new URLSearchParams({
            mode: selectedModel || 'sri-sobre-preimpreso',
            ruc: ruc,
            name: editedName,
            activity: editedActivity,
            phone: editedPhone,
            email: editedEmail,
            docType: finalData.cordovaDocType || '1',
            doc: docName,
            blocks: String(blocks),
            docSize: selectedSize,
            abono: String(finalAbono),
            total: String(currentTotal),
            caducidad: finalData.cordovaCaducidad || ''
          });

          const targetTrabajoId = currentSyncedTrabajoId || 'directo';
          const printUrl = `https://www.imprentacordova.net/#/solicitud-impresion/${targetTrabajoId}?${params.toString()}`;
          window.open(printUrl, '_blank');
        });
      });
    }

    if (btnWhatsApp) {
      btnWhatsApp.addEventListener('click', () => {
        const phone = inputEditPhone ? inputEditPhone.value.trim() : selectedPhoneVal;
        let cleanPhone = phone.replace(/\D/g, '');
        if (cleanPhone.startsWith('09')) cleanPhone = '593' + cleanPhone.substring(1);
        else if (cleanPhone.length === 9 && cleanPhone.startsWith('9')) cleanPhone = '593' + cleanPhone;
        else if (cleanPhone.length === 10 && cleanPhone.startsWith('0')) cleanPhone = '593' + cleanPhone.substring(1);

        const name = inputEditName ? inputEditName.value.trim() : (finalData.cordovaClientName || 'Estimado cliente');
        let abonoVal = selectedAbonoVal === 'custom' && inputAbonoManual ? (parseFloat(inputAbonoManual.value) || 0) : (parseFloat(selectedAbonoVal) || 0);
        const saldoVal = Math.max(0, currentTotal - abonoVal);

        const clientRucVal = finalData.cordovaClientRuc || '';
        const msg = encodeURIComponent(
          `¡Hola ${name}! 🖨️ *IMPRENTA CÓRDOVA*\n` +
          `Su solicitud SRI para *${docName}* (${blocks} comprobantes) ha sido autorizada exitosamente.\n\n` +
          `📋 *RUC:* ${clientRucVal}\n` +
          `📐 *Tamaño:* ${selectedSize}\n` +
          `💰 *Total:* $${currentTotal.toFixed(2)}\n` +
          `💵 *Abono:* $${abonoVal.toFixed(2)}\n` +
          `📌 *Saldo Restante:* $${saldoVal.toFixed(2)}\n\n` +
          `Rastree el estado de su orden en: https://www.imprentacordova.net/tracking`
        );

        const waUrl = cleanPhone.length >= 10 ? `https://wa.me/${cleanPhone}?text=${msg}` : `https://wa.me/?text=${msg}`;
        window.open(waUrl, '_blank');
      });
    }

    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        overlay.classList.remove('show');
        setTimeout(() => overlay.remove(), 350);
      });
    }
  });
}

// -------------------------------------------------------------
// MAIN WORKFLOW INITIALIZATION
// -------------------------------------------------------------
chrome.storage.local.get(['cordovaBlocks', 'cordovaAutoPilot', 'cordovaDocType', 'cordova_suggested', 'cordova_est_selected', 'current_session_ruc'], async (config) => {
  const url = window.location.href;
  const blocks = config.cordovaBlocks || 100;
  const autoPilot = config.cordovaAutoPilot !== undefined ? config.cordovaAutoPilot : true;
  const docType = config.cordovaDocType || "1";
  const docNames = { "0": "Facturas", "1": "Notas de Venta", "5": "Guías de Remisión" };
  const docName = docNames[docType] || "Documento";

  // Identidad
  let isImprenta = false;
  let activeRuc = detectActiveSRIRuc();

  if (!activeRuc) {
    try {
      await waitForElement('.sri-ruc-cabecera, th, td', 1200);
      activeRuc = detectActiveSRIRuc();
    } catch (e) {}
  }

  if (activeRuc) {
    chrome.storage.local.set({ current_session_ruc: activeRuc });
    isImprenta = (activeRuc === '0702065319001');
  } else {
    if (isSRILoginScreen()) {
      chrome.storage.local.set({ current_session_ruc: null });
      isImprenta = false;
    } else {
      isImprenta = (config.current_session_ruc === '0702065319001');
    }
  }

  // SRI Login Page Assistant: Solo la barra superior
  if (isSRILoginScreen()) {
    injectSRILoginAssistant();
    return; // NO inyectar el stepper HUD en el login
  }

  // Sugerencia HUD en Facturación solo si no es Login y no es Imprenta propia
  if (!isImprenta && !config.cordova_suggestion_disabled && url.includes('facturacion-internet')) {
    showStepSuggestionBanner();
  }

  if (!autoPilot) return;

  // Paso 2: Selección de Establecimiento Contribuyente
  if (url.includes('inicio-contribuyente.jspa') && config.cordova_suggested) {
    try {
      const thElements = Array.from(document.querySelectorAll('th'));
      let rucText = '', razonText = '', caducidadText = '';
      thElements.forEach(th => {
        const text = th.textContent.trim();
        if (text === 'RUC:') rucText = th.nextElementSibling ? th.nextElementSibling.textContent.trim() : '';
        if (text === 'Razón Social:') razonText = th.nextElementSibling ? th.nextElementSibling.textContent.trim() : '';
        if (text === 'Fecha de Caducidad:') caducidadText = th.nextElementSibling ? th.nextElementSibling.textContent.trim() : '';
      });

      let row = await waitForElement('tr.seleccion', 6000).catch(() => null);
      if (!row) {
        const allRows = document.querySelectorAll('tr');
        row = Array.from(allRows).find(r => r.getAttribute('onClick') && r.getAttribute('onClick').includes('forma.numeroEstablecimiento.value'));
      }

      let nombreComercial = '';
      if (row) {
        const tds = row.querySelectorAll('td');
        if (tds.length >= 2) {
          nombreComercial = tds[1].textContent.trim();
        }
      }

      chrome.storage.local.set({
        cordovaClientRuc: rucText,
        cordovaClientName: razonText,
        cordovaCaducidad: caducidadText,
        cordovaNombreComercial: nombreComercial
      });

      if (row && !config.cordova_est_selected) {
        chrome.storage.local.set({ cordova_est_selected: true });
        highlightSRIElement(row);
        row.click();
      }
    } catch(e) {
      console.error("[Cordova SRI] Error en inicio-contribuyente:", e);
    }
  }

  // Paso 3: Selección de Establecimiento Contribuyente Imprenta (Llenado de cantidades)
  if (url.includes('seleccionar-establecimiento-contibuyente-imprenta.jspa')) {
    try {
      await waitForElement('input[name^="documento0_"]', 6000);
      const docInput = document.querySelector(`input[name="documento0_${docType}"]`);
      
      if (!docInput) {
        chrome.storage.local.set({ cordovaAutoPilot: false });
        if (docType === "1") {
          showCordovaAlert(
            'Régimen Diferente Detectado',
            'Este contribuyente <b>NO</b> puede emitir Notas de Venta Físicas.<br>Solo puede emitir Facturas (máx. 25h) o Facturar Electrónicamente.',
            true, null, false, true
          );
        } else {
          showCordovaAlert('Documento No Disponible', `El documento (${docName}) no está habilitado para este contribuyente.`, true, null, false, true);
        }
        return;
      }

      docInput.value = blocks;
      highlightSRIElement(docInput);
      showCordovaAlert('Llenando Cantidades', `Insertando ${blocks} comprobantes...`, false, () => {
        const nextBtn = document.querySelector("a[href*='siguientePaso']");
        if (nextBtn) highlightSRIElement(nextBtn);
        triggerMainWorldClick("a[href*='siguientePaso']", "siguientePaso");
      }, autoPilot);
    } catch(e) {
      console.error("[Cordova SRI] Error en Paso 3:", e);
    }
  }

  // Paso 4: Agregar Cantidades Imprenta
  if (url.includes('agregar-cantidades-imprenta.jspa')) {
    try {
      const nextBtn = await waitForElement("a[href*='siguientePaso']", 6000);
      if (nextBtn) highlightSRIElement(nextBtn);
      showCordovaAlert('Confirmando', 'Validando cuadro de comprobantes...', false, () => {
        triggerMainWorldClick('', 'bypassAlertsAndNext');
      }, autoPilot);
    } catch(e) {
      console.error("[Cordova SRI] Error en Paso 4:", e);
    }
  }

  // Paso 5: Confirmar Cantidades & Búsqueda Córdova (8634)
  if (url.includes('confirmar-cantidades.jspa')) {
    try {
      if (document.body.textContent.includes('secuencias solicitadas son las siguientes')) {
        const nextBtn = await waitForElement("a[href*='siguientePaso']", 5000);
        if (nextBtn) highlightSRIElement(nextBtn);
        showCordovaAlert('Confirmando', 'Aceptando secuencias...', false, () => {
          triggerMainWorldClick('', 'bypassAlertsAndNext');
        }, autoPilot);
        return;
      }

      const radioFR = await waitForElement('input[type="radio"][name="FR"][value="1"]', 5000);
      const inputNumero = await waitForElement('input[type="text"][name="numero"]', 5000);
      
      highlightSRIElement(radioFR);
      radioFR.checked = true;
      triggerMainWorldClick('', 'habilitar');
      
      setTimeout(() => {
        inputNumero.disabled = false;
        inputNumero.value = '8634';
        highlightSRIElement(inputNumero);

        showCordovaAlert('Buscando Imprenta', 'Direccionando a Imprenta Córdova (8634)...', false, () => {
          const nextBtn = document.querySelector("a[href*='nextPage']");
          if (nextBtn) highlightSRIElement(nextBtn);
          triggerMainWorldClick("a[href*='nextPage']", "nextPage");
        }, autoPilot);
      }, 250);
    } catch(e) {
      console.error("[Cordova SRI] Error en Paso 5:", e);
    }
  }

  // Paso 6: Seleccionar Imprenta Córdova en resultados
  if (url.includes('seleccionar-imprenta.jspa')) {
    const trySelectImprenta = () => {
      const dataRows = Array.from(document.querySelectorAll('table:not(#anchoDoc) tbody tr'));
      const row = dataRows.find(tr => {
        const text = tr.textContent.toUpperCase();
        return text.includes('CORDOVA RODRIGUEZ PEDRO MANUEL') || 
               text.includes('0702065319001') || 
               text.includes('8634') ||
               text.includes('IMPRENTA CORDOVA');
      });

      if (row) {
        highlightSRIElement(row);
        const onclickStr = row.getAttribute('onclick') || '';
        const aLink = row.querySelector('a');
        
        showCordovaAlert('Imprenta Encontrada', 'Confirmando asignación...', false, () => {
          let match = onclickStr.match(/siguientePaso\(['"]?(\d+)['"]?\)/);
          if (!match && aLink) {
            const hrefStr = aLink.getAttribute('href') || '';
            match = hrefStr.match(/siguientePaso\(['"]?(\d+)['"]?\)/);
          }

          let param = match ? match[1] : null;
          if (param !== null) {
            document.body.setAttribute('data-cordova-param', param);
            triggerMainWorldClick('', 'siguientePaso');
          } else {
            row.click();
          }
        }, autoPilot);
        return true;
      }
      return false;
    };

    if (!trySelectImprenta()) {
      const intId = setInterval(() => {
        if (trySelectImprenta()) clearInterval(intId);
      }, 400);
      setTimeout(() => clearInterval(intId), 12000);
    }
  }

  // Paso 7: Finalización & Ingestión Automática a Supabase + Drawer Lateral
  if (url.includes('seleccionar-establecimiento-imprenta.jspa')) {
    chrome.storage.local.get(['cordovaClientRuc', 'cordovaClientName', 'cordovaCaducidad', 'cordovaNombreComercial', 'cordovaDocType', 'cordovaBlocks'], async (finalData) => {
      chrome.storage.local.remove(['cordova_suggested', 'cordova_est_selected']);

      const blocksVal = finalData.cordovaBlocks || 100;
      const prices = {
        "1/4 Oficio": { 25: 9.00, 50: 10.00, 100: 13.00, 200: 20.00, 300: 30.00, 400: 36.00, 500: 40.00, 1000: 65.00 },
        "1/2 Oficio": { 25: 12.00, 50: 14.00, 100: 18.00, 200: 32.00, 300: 48.00, 400: 60.00, 500: 65.00, 1000: 100.00 }
      };
      const totalVal = (prices["1/4 Oficio"] && prices["1/4 Oficio"][blocksVal]) ? prices["1/4 Oficio"][blocksVal] : ((blocksVal / 100) * 13.00);

      const immediateOrder = {
        clientRuc: finalData.cordovaClientRuc || '',
        clientName: (finalData.cordovaClientName || 'CLIENTE SRI').toUpperCase(),
        caducidad: finalData.cordovaCaducidad || '',
        nombreComercial: finalData.cordovaNombreComercial || '',
        docType: finalData.cordovaDocType || '1',
        blocks: blocksVal,
        docSize: '1/4 Oficio',
        activity: 'Comercio / Servicios General',
        abono: 0,
        total: totalVal,
        saldo: totalVal,
        timestamp: Date.now()
      };

      // Sincronización transparente con clave pública segura
      await autoSyncToSupabase(immediateOrder);
      showCordovaToastHud(`⚡ Orden Sincronizada en la Web • RUC: ${immediateOrder.clientRuc}`);

      setTimeout(() => {
        showCordovaSuccessModal(finalData, blocksVal);
      }, 800);
    });
  }
});
