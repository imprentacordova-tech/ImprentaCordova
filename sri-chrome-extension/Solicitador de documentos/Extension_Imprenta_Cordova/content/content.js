// ==========================================================================
// CORDOVA ELITE SRI EXTENSION - CONTENT SCRIPT
// Ultra-subtle, non-intrusive automation, robust login & live synchronization
// ==========================================================================

// Utility: Request background script to execute function in MAIN world (Bypasses CSP)
function triggerMainWorldClick(selector, fallbackFunc) {
  chrome.runtime.sendMessage({ action: "callFunction", funcName: fallbackFunc });
}

// ==========================================================================
// VENTANA DE AUTOMATIZACIÓN
// ==========================================================================
// `content/overrides.js` solo cortocircuita confirm()/alert() del portal
// mientras esta ventana está abierta. Fuera de ella, los diálogos del SRI son
// los nativos y el operador los contesta él. Antes estaban anulados siempre,
// así que cualquier confirmación del portal —incluso navegando a mano— se
// aceptaba sola.
//
// El permiso caduca solo a los 30 s (ver TTL_MS en overrides.js); `renovar`
// lo extiende mientras el paso siga trabajando.

let _renovadorAutomatizacion = null;

/** Abre la ventana: los diálogos del portal pasan a auto-aceptarse. */
function activarAutomatizacion() {
  try {
    window.postMessage({ type: 'SRI_AUTOMATION_ON' }, '*');
  } catch (e) { /* la página pudo navegar */ }

  if (_renovadorAutomatizacion === null) {
    // Renovar a la mitad del TTL para que un paso lento no la pierda.
    _renovadorAutomatizacion = setInterval(() => {
      try { window.postMessage({ type: 'SRI_AUTOMATION_ON' }, '*'); } catch (e) { }
    }, 12000);
  }
}

/** Cierra la ventana: el portal vuelve a preguntar como siempre. */
function desactivarAutomatizacion() {
  if (_renovadorAutomatizacion !== null) {
    clearInterval(_renovadorAutomatizacion);
    _renovadorAutomatizacion = null;
  }
  try {
    window.postMessage({ type: 'SRI_AUTOMATION_OFF' }, '*');
  } catch (e) { /* la página pudo navegar */ }
}

/** URLs del portal en las que el piloto automático actúa de verdad. */
const PASOS_AUTOMATIZADOS = [
  'inicio-contribuyente.jspa',
  'seleccionar-establecimiento-contibuyente-imprenta.jspa',
  'agregar-cantidades-imprenta.jspa',
  'confirmar-cantidades.jspa',
  'seleccionar-imprenta.jspa',
  'seleccionar-establecimiento-imprenta.jspa',
];

const esPasoAutomatizado = (url) => PASOS_AUTOMATIZADOS.some(p => url.includes(p));

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

/**
 * Envía un POST al portal del SRI navegando a la respuesta, sin depender de la UI.
 * El formulario oculto usa las cookies de la sesión (mismo origen), así que es
 * inmune a que otra extensión cambie los radios o limpie los campos.
 *
 * Datos del recorrido real (export de Burp "Recorrido de solicitud de documentos sri"):
 *   POST .../preimpresos/seleccionar-imprenta.jspa
 *        accion=siguiente&FR=1&numero=8634          (búsqueda por código)
 *   POST .../preimpresos/seleccionar-establecimiento-imprenta.jspa
 *        accion=siguiente&imprenta=8155&lineasPagina=
 */
function postFormNavegando(action, campos) {
  const form = document.createElement('form');
  form.method = 'POST';
  form.action = action;
  form.style.display = 'none';
  Object.entries(campos || {}).forEach(([name, value]) => {
    const input = document.createElement('input');
    input.type = 'hidden';
    input.name = name;
    input.value = String(value);
    form.appendChild(input);
  });
  document.body.appendChild(form);
  form.submit();
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
function showStepSuggestionBanner(simulacion) {
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
          ${simulacion ? '<span style="background:#FEF3C7;color:#92400E;font-size:8px;font-weight:800;padding:1px 6px;border-radius:99px;margin-left:4px;">🧪 SIMULACIÓN</span>' : ''}
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
          ${url.includes('confirmar-cantidades.jspa') ? '<button class="cordova-pill-btn highlight" id="cdv-btn-buscar8634" title="Marcar Por Código, escribir 8634 y Buscar">🔎 Buscar 8634</button>' : ''}
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

    // Botón manual de rescate: marca Por Código, escribe 8634 y envía la búsqueda.
    const btnBuscar8634 = banner.querySelector('#cdv-btn-buscar8634');
    if (btnBuscar8634) {
      btnBuscar8634.addEventListener('click', (e) => {
        e.stopPropagation();
        triggerMainWorldClick('', 'buscarPorCodigo');
      });
    }

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
          showStepSuggestionBanner(simulacion);
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
      const pass = creds.cordova_imprenta_pass || '';

      if (!pass) {
        showCordovaWarningCard(
          'Clave SRI no configurada',
          'Configurá la clave del SRI de la Imprenta en la pestaña "🏢 Imprenta Córdova" de la extensión (Antesala Auto-Login). Por seguridad no se guarda ninguna clave por defecto.'
        );
        return;
      }

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
    'mayo': '05', 'junio': '06', 'julio': '07', 'agosto': '08',
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

/**
 * Analiza la "Fecha de Caducidad" que asigna el SRI.
 * Normal: 12 meses. Si el contribuyente tiene obligaciones pendientes (primera
 * vez), el SRI da solo 3 meses. Devuelve los meses y si corresponde alertar.
 */
function analizarCaducidad(texto) {
  const iso = typeof parseSRIDateToISO === 'function' ? parseSRIDateToISO(texto) : null;
  if (!iso) return { meses: null, alerta: false, iso: null };
  const ms = new Date(iso).getTime() - Date.now();
  const meses = Math.round(ms / (1000 * 60 * 60 * 24 * 30.44));
  return { meses, alerta: meses !== null && meses <= 4, iso };
}

/**
 * Lee el resumen que muestra el SRI al finalizar la solicitud. En la pantalla de
 * confirmación aparecen, por ejemplo:
 *   RUC: 0705787745001
 *   Razón Social: CORDOVA RAMIREZ ROBERTO SANTIAGO
 *   Código del Establecimiento: 001
 *   Nombre Comercial del Establecimiento:
 *   Dirección del establecimiento: COLON S/N Y SUCRE
 *   Fecha de Solicitud: 29-10-2026
 *
 * Es la fuente más fiel de los datos del pedido: se lee al final y viaja a la web
 * para registrar la orden con la dirección y el establecimiento correctos.
 */
const leerResumenSolicitud = () => CordovaParseo.leerResumenSolicitud(document);

// ==========================================================================
// CONTRATO DE DATOS MÍNIMOS
// ==========================================================================
// El parseo lee el DOM del portal del SRI, que no controlamos. Cuando el SRI
// cambia una maqueta, la lectura devuelve vacío — y antes la orden se
// registraba igual: quedaba un trabajo fantasma, sin RUC y con el titular en
// "CLIENTE SRI", que alguien descubría días después sin saber de quién era.
//
// Estos dos campos son los que identifican al cliente. Sin ellos no se
// registra: se avisa en pantalla y el operador completa en el panel lateral,
// que ahora sí puede crear la orden (ver updateSupabaseOrderRefinement).

/** @returns {{ok: boolean, faltan: string[]}} */
const validarCaptura = (orden) => CordovaParseo.validarCaptura(orden);

/**
 * Lee la serie y el rango de secuencia de la página "Confirmación de la Solicitud".
 * Ejemplo de la tabla:
 *   Serie: 001-001 | NOTA DE VENTA | Secuencia solicitada Inicial: 1 | #Final: 50
 * Devuelve { serie, tipo, inicial, final } o null.
 */
const leerSecuencias = () => CordovaParseo.leerSecuencias(document);

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

// ==========================================================================
// GUARDA CONTRA ÓRDENES DUPLICADAS
// ==========================================================================
// El registro se dispara al llegar a `seleccionar-establecimiento-imprenta.jspa`
// (la pantalla final). Pero esa pantalla se vuelve a cargar si el operador
// recarga con F5, si vuelve con el botón Atrás o si el portal la re-emite: cada
// vez se llamaba a `/api/v1/trabajos/crear` otra vez y quedaba una orden
// duplicada en el sistema, que alguien tenía que descubrir y borrar a mano.
//
// Se guarda la huella de la última solicitud registrada. Si vuelve a aparecer
// la misma dentro de la ventana, no se registra de nuevo.
//
// La huella incluye la serie/secuencia que asigna el SRI, que es única por
// solicitud: dos pedidos distintos del mismo cliente por el mismo documento no
// comparten huella. La ventana corta es la red de seguridad por si el SRI aún
// no mostró la serie en esa pantalla.

// ==========================================================================
// PRECIO DE LA ORDEN
// ==========================================================================
// La extensión NO cotiza. El precio bueno lo calcula la web (precio del
// catálogo del documento según el régimen + los recargos del Paso 2: tamaño de
// corte y copias químicas) y viaja en el lanzamiento.
//
// Antes acá había una tabla propia que cobraba todo como nota de venta de 1/4
// de oficio: una factura de RIMPE Emprendedor ($14), una liquidación de compra
// ($15 a $20) o un juego de boletos ($25) se registraban a $13, y un 1/2 oficio
// se registraba al precio del 1/4. La diferencia se descubría en caja.
//
// La tabla de abajo quedó SOLO como piso para las solicitudes que se hacen
// directo en el portal, sin pasar por la web: ahí no hay precio que heredar y
// es preferible una referencia a dejar la orden en $0.

// La tabla vive en precios.js, que el manifest carga antes que este script.
const precioDeLaOrden = (lanzamiento, hojas, tamano) =>
  CordovaPrecios.precioDeLaOrden(lanzamiento, hojas, tamano);

/** Minutos en los que una solicitud idéntica se considera la misma. */
const VENTANA_DEDUPE_MS = 10 * 60 * 1000;

const CLAVE_ULTIMA_SYNC = 'cordova_ultima_sync';

function huellaSolicitud(orden) {
  return [
    orden.clientRuc || '',
    orden.docType || '',
    orden.blocks || '',
    orden.fechaSolicitud || '',
    orden.serie || '',
  ].join('|');
}

/**
 * ¿Ya se registró esta misma solicitud hace poco?
 * @returns {Promise<{huella: string, trabajoId: string|null, ts: number}|null>}
 */
function registroPrevioDe(huella) {
  return new Promise((resolve) => {
    try {
      chrome.storage.local.get([CLAVE_ULTIMA_SYNC], (r) => {
        const prev = r && r[CLAVE_ULTIMA_SYNC];
        if (!prev || prev.huella !== huella) return resolve(null);
        if (Date.now() - (prev.ts || 0) > VENTANA_DEDUPE_MS) return resolve(null);
        resolve(prev);
      });
    } catch (e) {
      // Si el storage falla, se sigue de largo y se registra: perder una orden
      // es peor que duplicarla (la duplicada se ve y se borra; la perdida no).
      resolve(null);
    }
  });
}

function marcarComoRegistrada(huella, trabajoId) {
  try {
    chrome.storage.local.set({ [CLAVE_ULTIMA_SYNC]: { huella, trabajoId: trabajoId || null, ts: Date.now() } });
  } catch (e) { /* sin storage, la próxima recarga podría duplicar: aceptable */ }
}

/**
 * ÚNICO camino para registrar una orden en el sistema.
 *
 * Junta las tres reglas que antes no existían o estaban sueltas:
 *   1. No se registra una orden sin RUC ni razón social (contrato).
 *   2. No se registra dos veces la misma solicitud (huella).
 *   3. Si el backend falla, se dice; no se anuncia "sincronizada".
 *
 * @returns {Promise<{estado:'registrada'|'duplicada'|'incompleta'|'error', faltan?: string[]}>}
 */
async function registrarOrden(orden, { serie = '' } = {}) {
  const validacion = validarCaptura(orden);
  if (!validacion.ok) return { estado: 'incompleta', faltan: validacion.faltan };

  const huella = huellaSolicitud({ ...orden, serie });
  const previo = await registroPrevioDe(huella);
  if (previo) {
    // Se recupera el id del trabajo ya creado: si el operador después guarda
    // desde el panel lateral, se ACTUALIZA ese trabajo en vez de crear otro.
    if (previo.trabajoId) currentSyncedTrabajoId = previo.trabajoId;
    return { estado: 'duplicada' };
  }

  const ok = await autoSyncToSupabase(orden);
  if (!ok) return { estado: 'error' };

  marcarComoRegistrada(huella, currentSyncedTrabajoId);
  return { estado: 'registrada' };
}

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

  // Camino de rescate: si la captura automática no alcanzó el contrato de datos
  // mínimos, no hay trabajo creado. Guardar desde el panel lateral —con los
  // datos ya corregidos a mano— es la segunda oportunidad de registrarlo.
  // Antes este caso no existía: la orden simplemente nunca llegaba al sistema.
  if (!currentSyncedTrabajoId) {
    const resultado = await registrarOrden(orderData);
    if (resultado.estado === 'registrada') {
      showCordovaToastHud(`⚡ Orden registrada • RUC: ${orderData.clientRuc}`);
      return;
    }
    if (resultado.estado === 'incompleta') {
      showCordovaToastHud(`⚠️ Falta ${resultado.faltan.join(' y ')}: la orden sigue sin registrarse.`);
      return;
    }
    // 'duplicada' deja currentSyncedTrabajoId recuperado: sigue y actualiza.
    if (resultado.estado === 'error') {
      showCordovaToastHud('⚠️ No se pudo registrar la orden. Cargala a mano en la web.');
      return;
    }
  }

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

    // Misma lista de precios que el resto de la extensión (precios.js).
    const getPrice = (size, qty) => CordovaPrecios.precioReferencia(size, qty);

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
            caducidad: finalData.cordovaCaducidad || '',
            direccion: finalData.cordovaDireccion || '',
            est: finalData.cordovaEstablecimiento || '001',
            pto: finalData.cordovaPuntoEmision || '001',
            fechaSolicitud: finalData.cordovaFechaSolicitud || ''
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
chrome.storage.local.get(['cordovaBlocks', 'cordovaAutoPilot', 'cordovaDocType', 'cordova_suggested', 'cordova_est_selected', 'current_session_ruc', 'flow_select_est', 'flow_fill_qty', 'flow_buscar', 'flow_metodo', 'flow_select_imprenta', 'flow_directo', 'flow_volver_web', 'flow_mostrar_drawer', 'flow_simulacion'], async (config) => {
  const url = window.location.href;
  const blocks = config.cordovaBlocks || 100;
  const autoPilot = config.cordovaAutoPilot !== undefined ? config.cordovaAutoPilot : true;
  const docType = config.cordovaDocType || "1";
  const docNames = {
    "0": "Facturas",
    "1": "Notas de Venta",
    "2": "Liquidación de Compra de Bienes Muebles Usados",
    "3": "Notas de Crédito",
    "4": "Notas de Débito",
    "5": "Guías de Remisión",
    "6": "Boletos o Entradas a Espectáculos",
    "7": "Liquidación de Compra de Vehículos Usados",
    "8": "Acta de Entrega - Recepción de Vehículos Usados",
    "10": "Liquidación de Compra de Bienes o Servicios",
  };
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
    showStepSuggestionBanner(config.flow_simulacion === true);
  }

  if (!autoPilot) return;

  // El piloto automático está encendido Y estamos parados en un paso del flujo:
  // recién ahí se permiten los diálogos auto-aceptados (ver overrides.js).
  if (esPasoAutomatizado(url)) activarAutomatizacion();

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

      const cad = analizarCaducidad(caducidadText);
      chrome.storage.local.set({
        cordovaClientRuc: rucText,
        cordovaClientName: razonText,
        cordovaCaducidad: caducidadText,
        cordovaNombreComercial: nombreComercial,
        cordovaCaducidadMeses: cad.meses,
        cordovaCaducidadAlerta: cad.alerta,
      });
      if (cad.alerta && cad.meses !== null) {
        showCordovaToastHud(`⚠️ Caducidad de ${cad.meses} meses (obligaciones pendientes).`);
      }

      if (row && !config.cordova_est_selected && config.flow_select_est !== false) {
        highlightSRIElement(row);
        if (config.flow_simulacion === true) {
          showCordovaToastHud('🧪 Simulación: elegiría el establecimiento (no envío).');
        } else {
          chrome.storage.local.set({ cordova_est_selected: true });
          row.click();
        }
      }
    } catch(e) {
      console.error("[Cordova SRI] Error en inicio-contribuyente:", e);
    }
  }

  // Paso 3: Selección de Establecimiento Contribuyente Imprenta (Llenado de cantidades)
  if (url.includes('seleccionar-establecimiento-contibuyente-imprenta.jspa') && config.flow_fill_qty !== false) {
    try {
      await waitForElement('input[name^="documento0_"]', 6000);
      const docInput = document.querySelector(`input[name="documento0_${docType}"]`);
      
      if (!docInput) {
        // El flujo se detiene acá: devolvemos los diálogos del portal al operador.
        desactivarAutomatizacion();
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
      if (config.flow_simulacion === true) {
        showCordovaToastHud(`🧪 Simulación: llenaría ${blocks} hojas (${docName}) y avanzaría.`);
      } else {
        showCordovaAlert('Llenando Cantidades', `Insertando ${blocks} comprobantes...`, false, () => {
          const nextBtn = document.querySelector("a[href*='siguientePaso']");
          if (nextBtn) highlightSRIElement(nextBtn);
          triggerMainWorldClick("a[href*='siguientePaso']", "siguientePaso");
        }, autoPilot);
      }
    } catch(e) {
      console.error("[Cordova SRI] Error en Paso 3:", e);
    }
  }

  // Paso 4: Agregar Cantidades Imprenta
  if (url.includes('agregar-cantidades-imprenta.jspa') && config.flow_fill_qty !== false) {
    try {
      const nextBtn = await waitForElement("a[href*='siguientePaso']", 6000);
      if (nextBtn) highlightSRIElement(nextBtn);

      // Capturar la serie y la secuencia que muestra la "Confirmación de la Solicitud".
      const sec = leerSecuencias();
      if (sec) {
        chrome.storage.local.set({
          cordovaSerie: sec.serie,
          cordovaNumeracion: `${sec.serie} · ${sec.inicial} - ${sec.final}`,
        });
      }

      if (config.flow_simulacion === true) {
        showCordovaToastHud('🧪 Simulación: confirmaría las cantidades (no envío).');
      } else {
        showCordovaAlert('Confirmando', 'Validando cuadro de comprobantes...', false, () => {
          triggerMainWorldClick('', 'bypassAlertsAndNext');
        }, autoPilot);
      }
    } catch(e) {
      console.error("[Cordova SRI] Error en Paso 4:", e);
    }
  }

  // Paso 5: Confirmar Cantidades & Búsqueda Córdova (8634)
  if (url.includes('confirmar-cantidades.jspa') && config.flow_buscar !== false) {
    try {
      if (document.body.textContent.includes('secuencias solicitadas son las siguientes')) {
        const nextBtn = await waitForElement("a[href*='siguientePaso']", 5000);
        if (nextBtn) highlightSRIElement(nextBtn);
        showCordovaAlert('Confirmando', 'Aceptando secuencias...', false, () => {
          triggerMainWorldClick('', 'bypassAlertsAndNext');
        }, autoPilot);
        return;
      }

      // La pantalla muestra los radios (Por RUC / Por Código…). Según las opciones
      // del popup: se elige el método (código/RUC) y si se envía directo o por UI.
      const metodo = config.flow_metodo === 'ruc' ? 'ruc' : 'codigo';
      const camposBusqueda = metodo === 'ruc'
        ? { accion: 'siguiente', FR: '0', ruc: '0702065319001', lineasPagina: '' }
        : { accion: 'siguiente', FR: '1', numero: '8634', lineasPagina: '' };

      await waitForElement('input[type="radio"][name="FR"]', 8000).catch(() => null);

      showCordovaAlert(
        'Buscando Imprenta',
        metodo === 'ruc' ? 'Buscando por RUC 0702065319001...' : 'Buscando por código 8634...',
        false, null, autoPilot,
      );

      if (config.flow_simulacion === true) {
        showCordovaToastHud(`🧪 Simulación: buscaría por ${metodo === 'ruc' ? 'RUC 0702065319001' : 'código 8634'} (no envío).`);
      } else if (config.flow_directo !== false) {
        postFormNavegando('/facturacion-internet/preimpresos/seleccionar-imprenta.jspa', camposBusqueda);
      } else {
        // Modo UI: marcar el radio correspondiente y usar el botón Buscar.
        document.body.setAttribute('data-cordova-metodo', metodo);
        triggerMainWorldClick('', 'buscarPorCodigo');
        setTimeout(() => document.body.removeAttribute('data-cordova-metodo'), 1500);
      }
    } catch(e) {
      console.error("[Cordova SRI] Error en Paso 5:", e);
    }
  }

  // Paso 6: Seleccionar Imprenta Córdova en resultados
  if (url.includes('seleccionar-imprenta.jspa') && config.flow_select_imprenta !== false) {
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
          if (config.flow_simulacion === true) {
            showCordovaToastHud('🧪 Simulación: elegiría Imprenta Córdova (no envío).');
            return;
          }
          let match = onclickStr.match(/siguientePaso\(['"]?(\d+)['"]?\)/);
          if (!match && aLink) {
            const hrefStr = aLink.getAttribute('href') || '';
            match = hrefStr.match(/siguientePaso\(['"]?(\d+)['"]?\)/);
          }

          let param = match ? match[1] : null;
          if (param !== null) {
            // Enviar directo con el id de la imprenta (datos del recorrido real):
            //   POST seleccionar-establecimiento-imprenta.jspa
            //        accion=siguiente&imprenta=<id>&lineasPagina=
            postFormNavegando('/facturacion-internet/preimpresos/seleccionar-establecimiento-imprenta.jspa', {
              accion: 'siguiente',
              imprenta: param,
              lineasPagina: '',
            });
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
    chrome.storage.local.get(['cordovaClientRuc', 'cordovaClientName', 'cordovaCaducidad', 'cordovaNombreComercial', 'cordovaDocType', 'cordovaBlocks', 'cordova_origin_tab', 'cordovaNumeracion', 'cordovaSerie', 'cordovaCaducidadMeses', 'cordovaCaducidadAlerta', 'cordova_launch_payload'], async (finalData) => {
      chrome.storage.local.remove(['cordova_suggested', 'cordova_est_selected']);

      if (config.flow_simulacion === true) {
        showCordovaToastHud('🧪 Simulación: la solicitud no se envió (no se registra orden).');
        return;
      }

      // Leer el resumen REAL de la pantalla del SRI (RUC, razón social, dirección,
      // establecimiento, fecha) y completar lo que falte desde storage.
      const resumen = leerResumenSolicitud();
      const clientRuc = resumen.ruc || finalData.cordovaClientRuc || '';
      const clientName = (resumen.razonSocial || finalData.cordovaClientName || 'CLIENTE SRI').toUpperCase();
      const direccion = resumen.direccion || finalData.cordovaDireccion || '';
      const codigoEst = resumen.codigoEstablecimiento || finalData.cordovaEstablecimiento || '001';
      const nombreComercial = resumen.nombreComercial || finalData.cordovaNombreComercial || '';
      const fechaSolicitud = resumen.fechaSolicitud || finalData.cordovaFechaSolicitud || '';

      chrome.storage.local.set({
        cordovaClientRuc: clientRuc,
        cordovaClientName: clientName,
        cordovaDireccion: direccion,
        cordovaEstablecimiento: codigoEst,
        cordovaNombreComercial: nombreComercial,
        cordovaFechaSolicitud: fechaSolicitud,
      });

      const blocksVal = finalData.cordovaBlocks || 100;
      const lanzamiento = finalData.cordova_launch_payload || {};
      const docSizeVal = lanzamiento.docSize || '1/4 Oficio';
      const totalVal = precioDeLaOrden(lanzamiento, blocksVal, docSizeVal);

      const immediateOrder = {
        clientRuc,
        clientName,
        caducidad: finalData.cordovaCaducidad || '',
        nombreComercial,
        direccion,
        establecimiento: codigoEst,
        puntoEmision: '001',
        fechaSolicitud,
        docType: finalData.cordovaDocType || '1',
        blocks: blocksVal,
        docSize: docSizeVal,
        activity: 'Comercio / Servicios General',
        abono: 0,
        total: totalVal,
        saldo: totalVal,
        timestamp: Date.now()
      };

      // Devolver los datos a la pestaña web que originó la solicitud (flujo
      // "Hacer solicitud en SRI" desde el Paso 2). El bridge los reenvía a la app.
      const originTab = finalData.cordova_origin_tab;
      if (originTab && config.flow_volver_web !== false) {
        try {
          chrome.runtime.sendMessage({
            action: 'sriSolicitudResult',
            tabId: originTab,
            data: {
              // Identificador del lanzamiento que originó esta solicitud. La web
              // descarta los resultados que no correspondan al pedido que está
              // esperando (p. ej. el de una solicitud anterior que llegó tarde).
              requestId: (finalData.cordova_launch_payload || {}).requestId || null,
              ruc: clientRuc,
              name: clientName,
              direccion,
              establecimiento: codigoEst,
              puntoEmision: '001',
              caducidad: finalData.cordovaCaducidad || '',
              fechaSolicitud,
              docType: finalData.cordovaDocType || '1',
              blocks: blocksVal,
              docSize: docSizeVal,
              nombreComercial,
              numeracion: finalData.cordovaNumeracion || '',
              serie: finalData.cordovaSerie || '',
              caducidadMeses: finalData.cordovaCaducidadMeses || null,
              caducidadAlerta: finalData.cordovaCaducidadAlerta === true,
            },
          });
        } catch (e) { console.warn('[Cordova] No se pudo avisar a la web:', e); }
      }

      // El flujo del SRI terminó: los diálogos del portal vuelven al operador.
      desactivarAutomatizacion();

      // Registro con contrato + una sola vez por solicitud: recargar esta
      // pantalla no vuelve a crear la orden.
      const resultado = await registrarOrden(immediateOrder, { serie: finalData.cordovaSerie || '' });

      if (resultado.estado === 'registrada') {
        showCordovaToastHud(`⚡ Orden Sincronizada en la Web • RUC: ${immediateOrder.clientRuc}`);
      } else if (resultado.estado === 'duplicada') {
        showCordovaToastHud('ℹ️ Esta solicitud ya estaba registrada. No se duplicó la orden.');
      } else if (resultado.estado === 'incompleta') {
        // No se registra un fantasma. El panel lateral queda abierto con los
        // campos editables y, al guardar desde ahí, se crea la orden.
        showCordovaWarningCard(
          'Faltan datos del cliente',
          `No se pudo leer <b>${resultado.faltan.join('</b> ni <b>')}</b> de la pantalla del SRI, ` +
          'así que la orden NO se registró para no dejar un trabajo sin dueño.<br><br>' +
          'Completá los datos en el panel de la derecha y guardá: desde ahí se registra.',
        );
      } else {
        // Antes esto se anunciaba como "Sincronizada" aunque hubiera fallado.
        showCordovaToastHud('⚠️ No se pudo registrar la orden. Cargala a mano en la web.');
      }

      if (config.flow_mostrar_drawer !== false) {
        setTimeout(() => {
          showCordovaSuccessModal({
            ...finalData,
            cordovaClientRuc: clientRuc,
            cordovaClientName: clientName,
            cordovaDireccion: direccion,
            cordovaEstablecimiento: codigoEst,
            cordovaNombreComercial: nombreComercial,
            cordovaFechaSolicitud: fechaSolicitud,
          }, blocksVal);
        }, 800);
      }
    });
  }

  // ── IMPRENTA: bandeja de solicitudes recibidas ─────────────────────
  if (url.includes('no-procesadas-listado.jspa')) {
    try {
      const pendientes = CordovaParseo.filasBandeja(document);
      chrome.storage.local.set({ cordova_solicitudes_pendientes: pendientes.slice(0, 50) });
      if (pendientes.length > 0) {
        showCordovaToastHud(`📥 ${pendientes.length} solicitud(es) pendiente(s) de aceptar.`);
      }
    } catch (e) { console.warn('[Cordova] Bandeja imprenta:', e); }
  }

  // ── IMPRENTA: detalle de la solicitud (secuencias autorizadas) ─────
  if (url.includes('no-procesada-informacion.jspa')) {
    try {
      const sec = leerSecuencias();
      if (sec) {
        chrome.storage.local.set({
          cordovaSerie: sec.serie,
          cordovaNumeracion: `${sec.serie} · ${sec.inicial} - ${sec.final}`,
        });
      }
    } catch (e) { /* ignore */ }
  }

  // ── IMPRENTA: aceptar solicitud → la orden pasa a "En Diseño" ───────
  if (url.includes('no-procesada-confirmacion.jspa')) {
    try {
      const rucInput = (document.querySelector('input[name="numeroRuc"]')?.value || '');
      const rucTexto = ((document.body.innerText || '').match(/RUC:\s*(\d{10,13})/) || [])[1] || '';
      const ruc = (rucInput || rucTexto).replace(/\D/g, '');
      chrome.runtime.sendMessage({
        action: 'sriAceptadaResult',
        data: { ruc, aceptada: true, timestamp: Date.now() },
      });
      showCordovaToastHud('✅ Solicitud aceptada. La orden pasa a Diseño.');
    } catch (e) { console.warn('[Cordova] Aceptación imprenta:', e); }
  }
});
