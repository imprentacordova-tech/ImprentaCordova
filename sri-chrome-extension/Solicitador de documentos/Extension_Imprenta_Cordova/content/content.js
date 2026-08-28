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

// Utility: Inject custom Cordova Alert
function showCordovaAlert(title, message, isFinal = false, onConfirm = null, autoPilot = false, isError = false) {
  // En modo piloto automático, mostramos el cuadro para que sepas en qué paso va, pero avanzamos solo.
  if (autoPilot && !isFinal && !isError && onConfirm) {
    setTimeout(() => {
        if (document.querySelector('.cordova-alert-overlay')) {
            document.querySelector('.cordova-alert-overlay').remove();
        }
        onConfirm();
    }, 600);
  }

  const existingOverlay = document.querySelector('.cordova-alert-overlay');
  if (existingOverlay) existingOverlay.remove();

  const overlay = document.createElement('div');
  overlay.className = 'cordova-alert-overlay';
  
  let pricesHtml = '';

  // Si AutoPilot está activado, la alerta es ultra-minimalista y no tiene botones (no detiene).
  let buttonsHtml = '';
  if (isError) {
    buttonsHtml = `
      <div class="cordova-btn-group">
        <button class="cordova-btn" id="cdv-btn-close">Entendido</button>
      </div>`;
  } else if (!autoPilot) {
    if (isFinal) {
      buttonsHtml = `
        <div class="cordova-btn-group" style="flex-wrap: wrap;">
          <button class="cordova-btn" id="cdv-btn-print" style="flex: 1; min-width: 120px;">Orden de Trabajo (PDF)</button>
          <button class="cordova-btn cordova-btn-secondary" id="cdv-btn-confirm" style="flex: 1; min-width: 100px;">Inicio</button>
          <button class="cordova-btn cordova-btn-secondary" id="cdv-btn-logout" style="flex: 1; min-width: 100px; border-color: #e74c3c; color: #e74c3c;">Cerrar Sesión</button>
        </div>`;
    } else {
      buttonsHtml = `
        <div class="cordova-btn-group">
          <button class="cordova-btn cordova-btn-secondary" id="cdv-btn-cancel">Cancelar</button>
          <button class="cordova-btn" id="cdv-btn-confirm">Continuar</button>
        </div>`;
    }
  }

  const logoUrl = chrome.runtime.getURL('icons/icon128.png');

  overlay.innerHTML = `
    <div class="cordova-alert-box" style="${autoPilot && !isFinal ? 'padding: 20px; max-width: 300px;' : ''}">
      ${!autoPilot || isFinal ? `<img src="${logoUrl}" alt="Cordova" class="cordova-logo">` : ''}
      <h2 class="cordova-title" style="${autoPilot && !isFinal ? 'font-size: 16px; margin-bottom: 5px;' : ''}">${title}</h2>
      <div class="cordova-message" style="${autoPilot && !isFinal ? 'margin-bottom: 0; font-size: 13px;' : ''}">${message}</div>
      ${pricesHtml}
      ${buttonsHtml}
    </div>
  `;

  document.body.appendChild(overlay);
  setTimeout(() => overlay.classList.add('show'), 10);

  const doConfirm = () => {
    overlay.classList.remove('show');
    setTimeout(() => overlay.remove(), 300);
    if (onConfirm) onConfirm();
  };

  if (isError) {
    const closeBtn = document.getElementById('cdv-btn-close');
    if (closeBtn) closeBtn.addEventListener('click', doConfirm);
  } else if (!autoPilot) {
    const confirmBtn = document.getElementById('cdv-btn-confirm');
    if (confirmBtn) {
      confirmBtn.addEventListener('click', function() {
        this.innerHTML = 'Procesando...';
        this.disabled = true;
        setTimeout(doConfirm, 300);
      });
    }
    const cancelBtn = document.getElementById('cdv-btn-cancel');
    if (cancelBtn) {
      cancelBtn.addEventListener('click', () => {
        overlay.classList.remove('show');
        setTimeout(() => overlay.remove(), 300);
      });
    }
    const printBtn = document.getElementById('cdv-btn-print');
    if (printBtn) {
      printBtn.addEventListener('click', () => {
        chrome.storage.local.get(['cordovaClientRuc', 'cordovaClientName', 'cordovaCaducidad', 'cordovaVigencia', 'cordovaNombreComercial', 'cordovaDocType', 'cordovaBlocks'], (data) => {
          const pendingOrder = {
            clientRuc: data.cordovaClientRuc || '',
            clientName: data.cordovaClientName || '',
            caducidad: data.cordovaCaducidad || '',
            vigencia: data.cordovaVigencia || '',
            nombreComercial: data.cordovaNombreComercial || '',
            docType: data.cordovaDocType || '1',
            blocks: data.cordovaBlocks || 100,
            timestamp: Date.now()
          };
          chrome.storage.local.set({ cordova_pending_order: pendingOrder }, () => {
            chrome.runtime.sendMessage({ action: "openRegistry" });
          });
        });
      });
    }
    const logoutBtn = document.getElementById('cdv-btn-logout');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', () => {
        window.location.href = '/facturacion-internet/logout.jspa';
      });
    }
  }
}

// ---------------------------------------------------------
// MAIN AUTOMATION LOGIC
// ---------------------------------------------------------

// Utility: Briefly highlight element being acted on with glowing target aura
function highlightSRIElement(el) {
  if (!el || !(el instanceof HTMLElement)) return;
  el.classList.add('cdv-target-highlight');
  setTimeout(() => {
    el.classList.remove('cdv-target-highlight');
  }, 1600);
}

function showStepSuggestionBanner() {
  chrome.storage.local.get([
    'cordova_suggestion_disabled',
    'cordovaAutoPilot',
    'cordovaBlocks',
    'cordovaDocType',
    'cordova_suggested'
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

    // Detect step info dynamically across the SRI flow
    let stepNum = 1;
    let whereAmI = "📍 Paso 1/5: Inicio del Trámite SRI";
    let whatTouchesNext = "👉 Siguiente: Selección de Establecimiento";

    if (url.includes('inicio-contribuyente.jspa')) {
      stepNum = 2;
      whereAmI = "📍 Paso 2/5: Selección de Establecimiento";
      whatTouchesNext = `👉 Siguiente: Inserción de comprobantes (${blocks}h / ${Math.ceil(blocks/100)} Block)`;
    } else if (url.includes('seleccionar-establecimiento-contibuyente-imprenta.jspa')) {
      stepNum = 3;
      whereAmI = `📍 Paso 3/5: Llenando ${blocks} Comprobantes`;
      whatTouchesNext = "👉 Siguiente: Validar tabla de secuencias";
    } else if (url.includes('agregar-cantidades-imprenta.jspa') || url.includes('confirmar-cantidades.jspa') || url.includes('seleccionar-imprenta.jspa')) {
      stepNum = 4;
      whereAmI = "📍 Paso 4/5: Buscando Imprenta Cordova (Cód. 8634)";
      whatTouchesNext = "👉 Siguiente: Generación de Orden de Trabajo";
    } else if (url.includes('seleccionar-establecimiento-imprenta.jspa')) {
      stepNum = 5;
      whereAmI = "📍 Paso 5/5: Solicitud Finalizada 🎉";
      whatTouchesNext = "👉 Siguiente: Descargar PDF y Registrar Retiro";
    }

    if (existingBanner) existingBanner.remove();

    const banner = document.createElement('div');
    banner.className = `cordova-suggestion-banner ${autoPilot ? 'autopilot-active' : ''}`;
    const logoUrl = chrome.runtime.getURL('icons/icon128.png');

    // Build Stepper nodes HTML
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
      ? `<span class="cordova-beacon-dot"></span> ⚡ AUTO-PILOTO ACTIVO` 
      : `<span class="cordova-beacon-dot"></span> 💡 MODO GUIADO`;

    banner.innerHTML = `
      <div class="cordova-banner-trigger">
        <div class="cordova-banner-brand">
          <img src="${logoUrl}" alt="Cordova" class="cordova-banner-logo">
          <span class="cordova-banner-title">Imprenta Cordova</span>
          <span class="cordova-banner-badge">${badgeText}</span>
        </div>
        <div class="cordova-banner-actions">
          <span class="cordova-banner-hint">Pasa el cursor aquí ▲ para ver opciones</span>
          <button class="cordova-banner-close" id="cdv-ignore" title="Cerrar">&times;</button>
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
            ${autoPilot ? '⏸ Pausar Piloto' : '▶ Reanudar Piloto'}
          </button>
          <button class="cordova-pill-btn ${blocks === 25 ? 'highlight' : ''}" data-val="25">25h</button>
          <button class="cordova-pill-btn ${blocks === 50 ? 'highlight' : ''}" data-val="50">50h</button>
          <button class="cordova-pill-btn ${blocks === 100 ? 'highlight' : ''}" data-val="100">1 Block (100h)</button>
          <button class="cordova-pill-btn ${blocks === 200 ? 'highlight' : ''}" data-val="200">2 Blocks (200h)</button>
          <button class="cordova-pill-btn ${blocks === 300 ? 'highlight' : ''}" data-val="300">3 Blocks</button>
          <button class="cordova-pill-btn ${blocks === 500 ? 'highlight' : ''}" data-val="500">5 Blocks</button>
          <div class="cordova-banner-custom">
            <input type="number" id="cdv-custom-val" placeholder="Hojas" value="${blocks}" min="1">
            <button id="cdv-custom-btn">Ir</button>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(banner);
    setTimeout(() => banner.classList.add('show'), 50);

    const toggleBtn = banner.querySelector('#cdv-toggle-pilot');
    if (toggleBtn) {
      toggleBtn.addEventListener('click', () => {
        const newAutoState = !autoPilot;
        chrome.storage.local.set({ cordovaAutoPilot: newAutoState }, () => {
          showStepSuggestionBanner();
        });
      });
    }

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
        const val = parseInt(e.currentTarget.getAttribute('data-val'), 10);
        startAutomation(val);
      });
    });

    const customBtn = banner.querySelector('#cdv-custom-btn');
    const customInput = banner.querySelector('#cdv-custom-val');
    if (customBtn && customInput) {
      customBtn.addEventListener('click', () => {
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
        banner.classList.remove('show');
        setTimeout(() => banner.remove(), 350);
      });
    }
  });
}

function showSuggestionPrompt() {
  showStepSuggestionBanner();
}
// =========================================================
// MODO IMPRENTA: REPORTADOR IA INTEGRATION
// =========================================================
const rocketSvg = `
<svg class="sri-loader-rocket" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path class="sri-rocket-flame" d="M32 46C29 46 27 52 32 60C37 52 35 46 32 46Z" fill="url(#flame-grad)" />
  <path d="M18 42C18 42 12 36 12 28C12 24 16 28 18 32V42Z" fill="#3b82f6" />
  <path d="M46 42C46 42 52 36 52 28C52 24 48 28 46 32V42Z" fill="#3b82f6" />
  <path d="M32 4C22 14 22 36 22 44C22 45 32 46 32 46C32 46 42 45 42 44C42 36 42 14 32 4Z" fill="#ffffff" />
  <circle cx="32" cy="22" r="5" fill="#3b82f6" stroke="#0f172a" stroke-width="1.5" />
  <path d="M32 4C28 8 26 13 25 18C28 17 32 17 32 17C32 17 36 17 39 18C38 13 36 8 32 4Z" fill="#4edea3" />
  <defs>
    <linearGradient id="flame-grad" x1="32" y1="46" x2="32" y2="60" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#ff9900" />
      <stop offset="100%" stop-color="#ff0000" stop-opacity="0" />
    </linearGradient>
  </defs>
</svg>
`;

const ReportadorCONFIG = {
    selectors: {
        btnImprenta: "//a[contains(@href, 'enviar(19)')] | //div[@id='cuadroAplicacion']//a[contains(., 'Imprenta')] | //a[contains(@href, 'enviar(19)') and contains(., 'Imprenta')]",
        linkManejoAutorizaciones: "//a[contains(., 'Manejo de Autorizaciones')]",
        linkPendientesReportar: "//a[contains(., 'Autorizaciones Pendientes de Reportar')]",
        linkSolicitudesAutorizacion: "//a[contains(@href, 'no-procesadas-listado')] | //a[contains(., 'Solicitudes enviadas directamente por el contribuyente')] | //a[contains(., 'Solicitudes enviadas directamente')]",
        rowEstablishment: "//tr[contains(@class, 'seleccion') and td[contains(., 'COLON S/N')]] | //tr[contains(@onclick, 'idEstablecimientoImprenta')]",
        radioTodas: "//input[@name='FR' and @value='3'] | //input[@id='todasRadio'] | //input[@value='T']",
        btnBuscar: "//a[contains(@href, 'nextPage')] | //a[contains(@href, 'consultar')] | //a[contains(., 'Buscar')] | //a[contains(., 'Consultar')] | //input[@value='Buscar'] | //input[@value='Consultar']",
        firstClientRow: "//td[@class='primeraCol'] | //tr[contains(@class, 'seleccion') and td[contains(@class, 'primeraCol')]]",
        btnSiguiente: "//input[@name='btnSiguiente'] | //input[@value='Siguiente'] | //input[@id='siguiente']",
        linkReturn: "//div[@id='path']//a[contains(., 'Servicio de Rentas')] | //input[@value='Aceptar'] | //input[@value='Regresar'] | //a[contains(., 'Nueva Consulta')] | //a[contains(@href, 'pendiente-reportar-busqueda')]",
        rucClient: "//td[contains(., 'RUC:')]/following-sibling::td | //div[contains(@class, 'sri-ruc-cabecera')]",
        razonSocial: "//td[contains(., 'Razón Social:')]/following-sibling::td | //div[contains(@class, 'sri-razon-social-cabecera')]",
        sequenceTable: "//table[contains(., 'Secuencia Autorizada')]//tr[td]"
    },
    styles: `
        #sri-assistant {
            position: fixed; bottom: 75px; right: 20px; height: 38px; min-width: 150px;
            background: rgba(11, 19, 38, 0.75); backdrop-filter: blur(14px) saturate(190%);
            -webkit-backdrop-filter: blur(14px) saturate(190%);
            border: 1px solid rgba(78, 222, 163, 0.25); border-radius: 21px;
            color: #fff; font-family: 'Inter', system-ui, -apple-system, sans-serif;
            z-index: 2147483647; box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255,255,255,0.1);
            padding: 0 16px; transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
            user-select: none; display: flex; align-items: center; gap: 12px; overflow: hidden;
        }
        #sri-assistant:hover { min-width: 270px; border-color: rgba(78, 222, 163, 0.6); transform: scale(1.02); box-shadow: 0 12px 40px rgba(78, 222, 163, 0.15), 0 10px 30px rgba(0,0,0,0.6); }
        #sri-assistant.hidden { display: none !important; }
        #sri-assistant.finished { border-color: #4edea3; background: rgba(10, 35, 25, 0.85); box-shadow: 0 0 25px rgba(78, 222, 163, 0.4); }
        
        .sri-asst-dot { width: 8px; height: 8px; border-radius: 50%; background: #908fa0; flex-shrink: 0; position: relative; transition: all 0.3s; }
        .running .sri-asst-dot { background: #4edea3; }
        .running .sri-asst-dot::after {
            content: '';
            position: absolute;
            top: -4px; left: -4px; right: -4px; bottom: -4px;
            border-radius: 50%;
            border: 2px solid #4edea3;
            animation: asst-aura-pulse 1.6s cubic-bezier(0.24, 0, 0.38, 1) infinite;
            opacity: 0;
        }
        .finished .sri-asst-dot { background: #4edea3; box-shadow: 0 0 10px #4edea3; }
        
        .sri-asst-label { font-size: 12.5px; font-weight: 700; color: #dae2fd; white-space: nowrap; flex: 1; text-transform: uppercase; letter-spacing: 0.8px; transition: color 0.3s; }
        .finished .sri-asst-label { color: #4edea3; }
        
        .sri-asst-btns { display: none; align-items: center; gap: 8px; opacity: 0; transition: opacity 0.3s; }
        #sri-assistant:hover .sri-asst-btns { display: flex; opacity: 1; }
        
        .sri-asst-btn {
            background: rgba(255,255,255,0.06); border: none; border-radius: 50%;
            width: 28px; height: 28px; display: flex; align-items: center; justify-content: center;
            cursor: pointer; transition: all 0.2s; color: #fff; font-size: 11px;
        }
        .sri-asst-btn:hover { background: rgba(255,255,255,0.18); transform: translateY(-1.5px); }
        .sri-asst-btn.stop { color: #ff5757; }
        
        #sri-assistant::after {
            content: '';
            position: absolute;
            bottom: 0;
            left: 0;
            height: 2px;
            width: 100%;
            background: linear-gradient(90deg, transparent, #4edea3, transparent);
            background-size: 200% 100%;
            animation: asst-glow-bar 2s linear infinite;
            opacity: 0;
            transition: opacity 0.3s;
        }
        #sri-assistant.running::after {
            opacity: 1;
        }

        @keyframes asst-aura-pulse {
            0% { transform: scale(0.6); opacity: 0.8; }
            100% { transform: scale(2.2); opacity: 0; }
        }
        @keyframes asst-glow-bar {
            0% { background-position: 200% 0; }
            100% { background-position: -200% 0; }
        }

        /* Overlay de Carga Especial */
        #sri-loading-overlay {
            position: fixed; top: 0; left: 0; width: 100%; height: 100%;
            background: rgba(10, 14, 23, 0.55); backdrop-filter: blur(4px) saturate(140%);
            -webkit-backdrop-filter: blur(4px) saturate(140%);
            z-index: 2147483645; display: flex; flex-direction: column;
            align-items: center; justify-content: center; color: #fff;
            font-family: 'Inter', system-ui, sans-serif; opacity: 0;
            pointer-events: none; transition: opacity 0.4s ease;
            overflow: hidden;
        }
        #sri-loading-overlay.show {
            opacity: 1;
            pointer-events: auto;
        }
        
        /* Contenedor del Cohete */
        .sri-loader-rocket-container {
            position: relative;
            margin-bottom: 25px;
            animation: rocket-vibrate 0.15s infinite alternate;
        }
        
        .sri-loader-rocket {
            width: 90px;
            height: 90px;
            filter: drop-shadow(0 0 15px rgba(78, 222, 163, 0.4));
            animation: rocket-float 3s infinite ease-in-out;
        }
        
        /* Fuego Propulsor */
        .sri-rocket-flame {
            transform-origin: center bottom;
            animation: flame-pulse 0.2s infinite alternate;
        }
        
        /* Partículas / Polvo Espacial */
        .sri-space-dust {
            position: absolute; width: 100%; height: 100%; top: 0; left: 0;
            pointer-events: none; z-index: -1;
        }
        .sri-dust-line {
            position: absolute; width: 1.5px; height: 50px;
            background: linear-gradient(to bottom, transparent, rgba(78, 222, 163, 0.3), transparent);
            animation: dust-fall 1.5s linear infinite;
        }
        .sri-dust-line:nth-child(1) { left: 20%; animation-delay: 0s; animation-duration: 1.2s; }
        .sri-dust-line:nth-child(2) { left: 45%; animation-delay: 0.3s; animation-duration: 0.8s; }
        .sri-dust-line:nth-child(3) { left: 75%; animation-delay: 0.6s; animation-duration: 1.5s; }
        .sri-dust-line:nth-child(4) { left: 10%; animation-delay: 0.9s; animation-duration: 1s; }
        .sri-dust-line:nth-child(5) { left: 90%; animation-delay: 0.1s; animation-duration: 1.3s; }
        .sri-dust-line:nth-child(6) { left: 60%; animation-delay: 0.5s; animation-duration: 1.1s; }
        .sri-dust-line:nth-child(7) { left: 30%; animation-delay: 0.8s; animation-duration: 0.9s; }
        .sri-dust-line:nth-child(8) { left: 80%; animation-delay: 0.2s; animation-duration: 1.4s; }
        
        /* Textos del Loader */
        .sri-loader-title {
            font-size: 10px; font-weight: 800; color: #4edea3;
            text-transform: uppercase; letter-spacing: 2px; margin-bottom: 8px;
            text-shadow: 0 0 10px rgba(78, 222, 163, 0.3);
        }
        
        .sri-loader-status {
            font-size: 16px; font-weight: 700; color: #fff;
            text-align: center; max-width: 80%;
        }
        
        /* Animaciones */
        @keyframes rocket-float {
            0% { transform: translateY(0); }
            50% { transform: translateY(-8px); }
            100% { transform: translateY(0); }
        }
        @keyframes rocket-vibrate {
            0% { transform: translate(0.5px, 0.5px) rotate(0deg); }
            100% { transform: translate(-0.5px, -0.5px) rotate(0.1deg); }
        }
        @keyframes flame-pulse {
            0% { transform: scaleY(0.85); opacity: 0.8; }
            100% { transform: scaleY(1.15); opacity: 1; }
        }
        @keyframes dust-fall {
            0% { transform: translateY(-100px); opacity: 0; }
            50% { opacity: 0.7; }
            100% { transform: translateY(105vh); opacity: 0; }
        }
    `
};

const ReportadorState = {
    isRunning: false,
    assistantVisible: true,
    currentStep: "Inicio",
    lastAction: "Cargando motor...",
    totalReported: 0,
    t25: 0,
    t50: 0,
    t100: 0,
    t200: 0,
    tOther: 0,
    targetMode: 'REPORTAR', // 'REPORTAR' or 'ACEPTAR'
    
    async save() {
        await chrome.storage.local.set({
            sriState: {
                isRunning: this.isRunning,
                currentStep: this.currentStep,
                currentStatus: this.lastAction,
                totalReported: this.totalReported,
                targetMode: this.targetMode,
                t25: this.t25 || 0,
                t50: this.t50 || 0,
                t100: this.t100 || 0,
                t200: this.t200 || 0,
                tOther: this.tOther || 0
            },
            assistantVisible: this.assistantVisible
        });
    },
    
    async load() {
        const data = await chrome.storage.local.get(['sriState', 'assistantVisible']);
        if (data.sriState) {
            Object.assign(this, data.sriState);
            this.lastAction = data.sriState.currentStatus || "Esperando...";
        }
        if (data.assistantVisible !== undefined) this.assistantVisible = data.assistantVisible;
    },
    
    async log(msg) {
        this.lastAction = msg;
        updateReportadorAssistant();
        await this.save();
        
        chrome.storage.local.get(['sriLogs'], (result) => {
            let logs = result.sriLogs || [];
            logs.push(msg);
            if (logs.length > 50) logs = logs.slice(-50);
            chrome.storage.local.set({ sriLogs: logs });
        });
    }
};

function ReportadorGetX(xpath) {
    return document.evaluate(xpath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
}

function ReportadorGetXPath(element) {
    if (element.id !== "") return 'id("' + element.id + '")';
    if (element === document.body) return element.tagName;
    let ix = 0;
    const siblings = element.parentNode.childNodes;
    for (let i = 0; i < siblings.length; i++) {
        const sibling = siblings[i];
        if (sibling === element) return ReportadorGetXPath(element.parentNode) + '/' + element.tagName + '[' + (ix + 1) + ']';
        if (sibling.nodeType === 1 && sibling.tagName === element.tagName) ix++;
    }
}

function ReportadorClick(xpath, purpose) {
    const el = ReportadorGetX(xpath);
    if (!el) return false;
    
    if (!window.location.href.includes("facturacion-internet")) return false;
    
    ReportadorState.lastAction = purpose;
    updateReportadorAssistant();
    
    el.scrollIntoView({ block: "center", behavior: "smooth" });
    
    setTimeout(() => {
        const href = el.getAttribute('href');
        const onclick = el.getAttribute('onclick');
        
        if ((href && href.startsWith('javascript:')) || onclick) {
            window.postMessage({ type: "SRI_CLICK", xpath: xpath }, "*");
        } else {
            el.click();
        }
    }, 150);
    
    return true;
}

function injectReportadorAssistant() {
    if (window.self !== window.top) return;
    if (document.getElementById('sri-assistant')) return;
    
    const styleSheet = document.createElement("style");
    styleSheet.innerText = ReportadorCONFIG.styles;
    document.head.appendChild(styleSheet);
    
    const loader = document.createElement('div');
    loader.id = 'sri-loading-overlay';
    loader.innerHTML = `
        <div class="sri-space-dust">
            <div class="sri-dust-line"></div>
            <div class="sri-dust-line"></div>
            <div class="sri-dust-line"></div>
            <div class="sri-dust-line"></div>
            <div class="sri-dust-line"></div>
            <div class="sri-dust-line"></div>
            <div class="sri-dust-line"></div>
            <div class="sri-dust-line"></div>
        </div>
        <div class="sri-loader-rocket-container">
            ${rocketSvg}
        </div>
        <div class="sri-loader-title">SRI TURBO ELITE</div>
        <div class="sri-loader-status" id="sri-loader-status-text">Procesando...</div>
    `;
    document.body.appendChild(loader);
    
    const asst = document.createElement('div');
    asst.id = 'sri-assistant';
    asst.className = ReportadorState.assistantVisible ? '' : 'hidden';
    asst.innerHTML = `
        <div class="sri-asst-dot"></div>
        <div class="sri-asst-label" id="asst-step">${ReportadorState.currentStep}</div>
        <div class="sri-asst-btns">
            <button class="sri-asst-btn" id="asst-btn-restart" title="Reiniciar">🔄</button>
            <button class="sri-asst-btn" id="asst-btn-play">▶</button>
            <button class="sri-asst-btn stop" id="asst-btn-stop">■</button>
        </div>
    `;
    document.body.appendChild(asst);
    
    document.getElementById('asst-btn-play').onclick = () => {
        ReportadorState.isRunning = !ReportadorState.isRunning;
        ReportadorState.log(ReportadorState.isRunning ? "AVANZANDO..." : "PAUSA");
        ReportadorState.save(); 
        updateReportadorAssistant();
    };
    
    document.getElementById('asst-btn-stop').onclick = () => {
        ReportadorState.isRunning = false;
        ReportadorState.log("STOP");
        ReportadorState.save(); 
        updateReportadorAssistant();
    };

    document.getElementById('asst-btn-restart').onclick = () => {
        ReportadorState.log("REINICIANDO...");
        window.location.href = "https://srienlinea.sri.gob.ec/facturacion-internet/preimpresos/pendientes-reportar-busqueda.jsp";
    };
    
    updateReportadorAssistant();
}

function updateReportadorAssistant() {
    if (window.self !== window.top) return;
    const asst = document.getElementById('sri-assistant');
    if (!asst) return;
    
    if (!window.location.href.includes("facturacion-internet")) {
        asst.classList.add('hidden');
        return;
    }
    
    asst.classList.toggle('hidden', !ReportadorState.assistantVisible);
    asst.classList.toggle('running', ReportadorState.isRunning && !ReportadorState.lastAction.includes("COMPLETADO"));
    asst.classList.toggle('finished', ReportadorState.lastAction.includes("COMPLETADO"));
    
    const stepLabel = document.getElementById('asst-step');
    if (stepLabel) {
        if (ReportadorState.lastAction.includes("COMPLETADO")) {
            stepLabel.innerText = "✓ TODO REPORTADO";
        } else {
            stepLabel.innerText = ReportadorState.isRunning ? ReportadorState.lastAction : ReportadorState.currentStep;
        }
    }
    
    const playBtn = document.getElementById('asst-btn-play');
    if (playBtn) playBtn.innerText = ReportadorState.isRunning ? '⏸' : '▶';
    
    // CONTROLAR EL OVERLAY DEL COHETE
    const loader = document.getElementById('sri-loading-overlay');
    if (loader) {
        const shouldShow = ReportadorState.isRunning && !ReportadorState.lastAction.includes("COMPLETADO") && !ReportadorState.lastAction.includes("STOP") && !ReportadorState.lastAction.includes("PAUSA");
        loader.classList.toggle('show', !!shouldShow);
        
        const loaderText = document.getElementById('sri-loader-status-text');
        if (loaderText && shouldShow) {
            let stepName = "Petición...";
            if (ReportadorState.currentStep === "Perfil") stepName = "Seleccionando Perfil Imprenta...";
            else if (ReportadorState.currentStep === "Menú") stepName = "Accediendo a Autorizaciones...";
            else if (ReportadorState.currentStep === "Local") stepName = "Cargando Establecimiento Gráfico...";
            else if (ReportadorState.currentStep === "Opciones") stepName = "Entrando a Bandeja de Pendientes...";
            else if (ReportadorState.currentStep === "Filtro") stepName = "Buscando Autorizaciones Activas...";
            else if (ReportadorState.currentStep === "Listado") stepName = "Procesando Lista de Clientes...";
            else if (ReportadorState.currentStep === "Reporte") stepName = "Calculando y Reportando Secuencias...";
            else if (ReportadorState.currentStep === "Final") stepName = "Guardando Reporte de Autorización...";
            
            loaderText.innerText = stepName;
        }
    }
}

function injectImprentaSubtleBanner() {
  if (window.self !== window.top) return;
  if (document.getElementById('cordova-imprenta-subtle-banner')) return;

  const banner = document.createElement('div');
  banner.id = 'cordova-imprenta-subtle-banner';
  banner.className = 'cordova-imprenta-subtle-banner';
  banner.innerHTML = `
    <div>
      <div class="subtle-title">⚡ Imprenta Córdova</div>
      <div style="font-size: 10px; color: #e2e8f0;">¿Qué deseas realizar hoy?</div>
    </div>
    <button id="cdv-btn-goto-solicitudes" class="subtle-btn">
      📥 Solicitudes Recibidas
    </button>
    <button id="cdv-btn-goto-reportar" class="subtle-btn secondary">
      📊 Reportar Trabajos
    </button>
    <button id="cdv-btn-close-subtle" style="background: transparent; border: none; color: #cbd5e1; cursor: pointer; font-size: 16px;">&times;</button>
  `;

  document.body.appendChild(banner);

  document.getElementById('cdv-btn-goto-solicitudes').addEventListener('click', () => {
    ReportadorState.isRunning = true;
    ReportadorState.targetMode = 'ACEPTAR';
    ReportadorState.save();

    const directLink = document.querySelector('a[href*="no-procesadas-listado"]');
    if (directLink) {
      directLink.click();
    } else {
      window.location.href = "https://srienlinea.sri.gob.ec/facturacion-internet/preimpresos/revisar-tipo-contribuyente.jspa";
    }
  });

  document.getElementById('cdv-btn-goto-reportar').addEventListener('click', () => {
    ReportadorState.isRunning = true;
    ReportadorState.targetMode = 'REPORTAR';
    ReportadorState.save();

    const directReportLink = document.querySelector('a[href*="pendientes-reportar-busqueda"]');
    if (directReportLink) {
      directReportLink.click();
    } else {
      window.location.href = "https://srienlinea.sri.gob.ec/facturacion-internet/preimpresos/revisar-tipo-contribuyente.jspa";
    }
  });

  document.getElementById('cdv-btn-close-subtle').addEventListener('click', () => {
    banner.remove();
  });
}

function injectSRILoginAssistant() {
  if (window.self !== window.top) return;
  if (document.getElementById('cordova-login-minimal-bar')) return;

  const loginForm = document.querySelector('form[action*="login"]') || document.querySelector('input.boton-ingresar-login')?.closest('form') || document.body;

  const logoUrl = chrome.runtime.getURL('icons/icon128.png');

  const bar = document.createElement('div');
  bar.id = 'cordova-login-minimal-bar';
  bar.className = 'cordova-login-minimal-bar';
  bar.innerHTML = `
    <div class="bar-brand">
      <img src="${logoUrl}" alt="Cordova Logo">
      <span>IMPRENTA CÓRDOVA</span>
    </div>
    <div class="bar-btns">
      <button type="button" id="cdv-btn-login-mode-client" class="mode-btn client">
        👤 Cliente (Ingreso Manual)
      </button>
      <button type="button" id="cdv-btn-login-mode-imprenta" class="mode-btn imprenta">
        🏢 Imprenta (Auto-Ingreso 0702065319001)
      </button>
    </div>
  `;

  document.body.appendChild(bar);

  // 1. MODO CLIENTE: Limpia campos nativos para escritura manual sin interferencias
  document.getElementById('cdv-btn-login-mode-client').addEventListener('click', () => {
    const nativeRucInput = document.querySelector('#userPri, input[name="j_username"], input[name="usuario"], input[name="ruc"], #usuario');
    const nativePassInput = document.querySelector('input[type="password"], #pass, #password');

    if (nativeRucInput) {
      nativeRucInput.value = '';
      nativeRucInput.style.border = '2px solid #2563eb';
      nativeRucInput.style.backgroundColor = '#ffffff';
      nativeRucInput.focus();
    }
    if (nativePassInput) {
      nativePassInput.value = '';
    }

    chrome.storage.local.set({ current_session_ruc: null, cordovaAutoPilot: false });
  });

  // 2. MODO IMPRENTA: Auto-Rellena credenciales imprenta (GrafiCoR8634@) e ingresa directo
  document.getElementById('cdv-btn-login-mode-imprenta').addEventListener('click', () => {
    chrome.storage.local.get(['cordova_imprenta_ruc', 'cordova_imprenta_pass'], (creds) => {
      const ruc = creds.cordova_imprenta_ruc || '0702065319001';
      const pass = creds.cordova_imprenta_pass || 'GrafiCoR8634@';

      // Guardar credenciales por defecto en storage local si no estaban presentes
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

      ReportadorState.isRunning = true;
      ReportadorState.targetMode = 'ACEPTAR';
      ReportadorState.currentStep = 'Inicio';
      ReportadorState.save();

      chrome.storage.local.set({ current_session_ruc: ruc }, () => {
        const submitBtn = document.querySelector('input.boton-ingresar-login, input[name="boton"][value="Ingresar"]');
        if (submitBtn) {
          highlightSRIElement(submitBtn);
          setTimeout(() => {
            submitBtn.click();
          }, 150);
        }
      });
    });
  });
}

async function runReportadorWorkflow() {
    const url = window.location.href;
    const bodyText = document.body.innerText || "";
    
    if (ReportadorState.isRunning) console.log(`[Reportador Debug] URL: ${url} | Step: ${ReportadorState.currentStep}`);
    
    // --- 0. LIMPIEZA DE MODALES ---
    const modalAceptar = ReportadorGetX("//div[contains(@class, 'modal') or contains(@class, 'dialog')]//button[contains(., 'Aceptar')] | //span[contains(., 'Aceptar')]/parent::button[not(contains(@class, 'home'))]");
    if (modalAceptar && modalAceptar.offsetParent !== null) {
        modalAceptar.click();
        return; 
    }

    // --- 1. INICIO / TIPO CONTRIBUYENTE ---
    if (url.includes("revisar-tipo-contribuyente.jspa") || bodyText.includes("Seleccione el Tipo de Contribuyente")) {
        ReportadorState.currentStep = "Perfil";
        if (ReportadorState.isRunning) ReportadorClick(ReportadorCONFIG.selectors.btnImprenta, "Seleccionando Perfil...");
        return;
    }

    // --- 2. MENU PRINCIPAL ---
    if (url.includes("seleccionar-tipo-contribuyente.jspa") || (bodyText.includes("Menú Principal") && bodyText.includes("Manejo de Autorizaciones"))) {
        ReportadorState.currentStep = "Menú";
        if (ReportadorState.isRunning) ReportadorClick(ReportadorCONFIG.selectors.linkManejoAutorizaciones, "Entrando...");
        return;
    }

    // --- 3. SELECCION ESTABLECIMIENTO ---
    if (url.includes("establecimientos-imprenta.jspa") || bodyText.includes("Selección de Establecimientos de Imprenta")) {
        ReportadorState.currentStep = "Local";
        if (ReportadorState.isRunning) ReportadorClick(ReportadorCONFIG.selectors.rowEstablishment, "Local...");
        return;
    }
    
    // Redirección directa si el SRI cae en inicio-impresion.jsp
    if (url.includes("inicio-impresion.jsp")) {
        window.location.href = "https://srienlinea.sri.gob.ec/facturacion-internet/preimpresos/no-procesadas-listado.jspa";
        return;
    }

    // --- 4. ACCESO A REPORTES O SOLICITUDES ---
    if (url.includes("menu-preimpresos.jspa") && !url.includes("busqueda") && !url.includes("listado")) {
        ReportadorState.currentStep = "Opciones";
        if (ReportadorState.isRunning) {
            if (ReportadorState.targetMode === 'ACEPTAR') {
                const link = ReportadorGetX("//a[contains(@href, 'no-procesadas-listado')] | //a[contains(., 'Solicitudes enviadas directamente')]") || ReportadorGetX(ReportadorCONFIG.selectors.linkSolicitudesAutorizacion);
                if (link) {
                    const path = ReportadorGetXPath(link);
                    if (path) ReportadorClick(path, "Ir a Solicitudes Recibidas...");
                    else window.location.href = "https://srienlinea.sri.gob.ec/facturacion-internet/preimpresos/no-procesadas-listado.jspa";
                } else {
                    window.location.href = "https://srienlinea.sri.gob.ec/facturacion-internet/preimpresos/no-procesadas-listado.jspa";
                }
            } else {
                ReportadorClick(ReportadorCONFIG.selectors.linkPendientesReportar, "Reportes...");
            }
        }
        return;
    }

    // --- 4.1 DESTINO SOLICITUDES ALCANZADO ---
    if (url.includes("no-procesadas-listado") || url.includes("solicitudes-autorizacion") || bodyText.includes("Solicitudes enviadas directamente por el contribuyente") || bodyText.includes("Solicitudes de autorización")) {
        ReportadorState.currentStep = "Solicitudes Recibidas";
        ReportadorState.isRunning = false;
        ReportadorState.log("✓ SOLICITUDES RECIBIDAS LISTAS");
        ReportadorState.save();
        return;
    }
    
    // --- 6. LISTADO DE TRABAJOS ---
    if (url.includes("pendientes-reportar-listado") || bodyText.includes("Autorizaciones a ser Reportadas")) {
        ReportadorState.currentStep = "Listado";
        
        const noData = bodyText.includes("No existen datos") || bodyText.includes("No se encontraron registros") || (bodyText.includes("Total de registros") && bodyText.includes(" 0"));
        if (noData) {
            ReportadorState.isRunning = false;
            ReportadorState.log("✓ REPORTE COMPLETADO");
            return;
        }
        
        if (ReportadorState.isRunning) {
            const firstRow = ReportadorGetX(ReportadorCONFIG.selectors.firstClientRow);
            const btnNext = ReportadorGetX(ReportadorCONFIG.selectors.btnSiguiente);
            if (firstRow) {
                ReportadorClick(ReportadorCONFIG.selectors.firstClientRow, "Cliente...");
                if (btnNext) setTimeout(() => ReportadorClick(ReportadorCONFIG.selectors.btnSiguiente, "Siguiente..."), 1000);
            } else if (btnNext) {
                ReportadorClick(ReportadorCONFIG.selectors.btnSiguiente, "Siguiente...");
            }
        }
        return;
    }

    // --- 5. BUSQUEDA DE CLIENTES ---
    if (url.includes("pendientes-reportar-busqueda") || bodyText.includes("Búsqueda de Autorizaciones Pendientes")) {
        ReportadorState.currentStep = "Filtro";
        const radio = ReportadorGetX(ReportadorCONFIG.selectors.radioTodas);
        if (radio && !radio.checked) {
            if (ReportadorState.isRunning) ReportadorClick(ReportadorCONFIG.selectors.radioTodas, "Fijando Todas...");
            return;
        }
        const btnB = ReportadorGetX(ReportadorCONFIG.selectors.btnBuscar);
        if (ReportadorState.isRunning && btnB) ReportadorClick(ReportadorCONFIG.selectors.btnBuscar, "Buscando...");
        return;
    }
    
    // --- 7. EXTRACCION Y REPORTE ---
    if (url.includes("reporte-autorizacion") || url.includes("pendiente-reportar-autorizacion")) {
        ReportadorState.currentStep = "Reporte";
        
        if (!ReportadorState.lastAction.includes("Hojas:")) {
            try {
                let sheets = 0;
                const table = ReportadorGetX(ReportadorCONFIG.selectors.sequenceTable);
                if (table) {
                    const rows = table.querySelectorAll("tr");
                    rows.forEach(row => {
                        const cells = row.querySelectorAll("td");
                        if (cells.length >= 4) {
                            const CellStartNum = parseInt(cells[cells.length - 2].innerText.trim());
                            const CellEndNum = parseInt(cells[cells.length - 1].innerText.trim());
                            if (!isNaN(CellStartNum) && !isNaN(CellEndNum)) sheets += (CellEndNum - CellStartNum + 1);
                        }
                    });
                }
                if (sheets === 0) {
                    const starts = document.querySelectorAll("input[name^='inicial']");
                    const ends = document.querySelectorAll("input[name^='rangoFinal']");
                    starts.forEach((s, idx) => {
                        if (ends[idx]) {
                            const sv = parseInt(s.value);
                            const ev = parseInt(ends[idx].value);
                            if (!isNaN(sv) && !isNaN(ev)) sheets += (ev - sv + 1);
                        }
                    });
                }
                
                // Track quantities reported
                ReportadorState.totalReported = (ReportadorState.totalReported || 0) + sheets;
                if (sheets === 25) ReportadorState.t25 = (ReportadorState.t25 || 0) + 1;
                else if (sheets === 50) ReportadorState.t50 = (ReportadorState.t50 || 0) + 1;
                else if (sheets === 100) ReportadorState.t100 = (ReportadorState.t100 || 0) + 1;
                else if (sheets === 200) ReportadorState.t200 = (ReportadorState.t200 || 0) + 1;
                else ReportadorState.tOther = (ReportadorState.tOther || 0) + 1;
                
                await ReportadorState.save();
                await ReportadorState.log("Hojas: " + sheets);
            } catch(e) { console.error(e); }
        }
        
        if (ReportadorState.isRunning) ReportadorClick(ReportadorCONFIG.selectors.btnSiguiente, "Enviando...");
        return;
    }
    
    // --- 8. FIRMA Y REINICIO ---
    if (url.includes("pendiente-reportar-informacion.jspa") || bodyText.includes("Firma de Autorización") || bodyText.includes("comprobante ha sido reportado")) {
        ReportadorState.currentStep = "Final";
        if (ReportadorState.isRunning) {
            ReportadorState.log("LOOP...");
            const checkAndClick = () => {
                const lb = ReportadorGetX(ReportadorCONFIG.selectors.linkReturn) || ReportadorGetX("//a[contains(@href, 'busqueda')]");
                if (lb) {
                    const path = ReportadorGetXPath(lb);
                    if (path) ReportadorClick(path, "Reset...");
                    else window.location.href = "https://srienlinea.sri.gob.ec/facturacion-internet/preimpresos/pendientes-reportar-busqueda.jsp";
                    return true;
                }
                return false;
            };
            if (!checkAndClick()) {
                let att = 0;
                const int = setInterval(() => {
                    att++;
                    if (checkAndClick() || att > 5) {
                        clearInterval(int);
                        if (att > 5) window.location.href = "https://srienlinea.sri.gob.ec/facturacion-internet/preimpresos/pendientes-reportar-busqueda.jsp";
                    }
                }, 300);
            }
        }
        return;
    }
}

function detectActiveSRIRuc() {
  const selectors = ['.sri-ruc-cabecera', '#usuario', '.usuario-login', '#lblRuc', '#userRuc', '.ruc-header'];
  for (let sel of selectors) {
    const el = document.querySelector(sel);
    if (el && el.innerText) {
      const match = el.innerText.match(/\b\d{13}\b/);
      if (match) return match[0];
    }
  }

  const thElements = Array.from(document.querySelectorAll('th, td, span, div'));
  for (let el of thElements) {
    if (el.children.length === 0) {
      const text = el.innerText ? el.innerText.trim() : '';
      if (text === 'RUC:' || text.startsWith('RUC:')) {
        const next = el.nextElementSibling;
        if (next && next.innerText) {
          const match = next.innerText.match(/\b\d{13}\b/);
          if (match) return match[0];
        }
        if (el.parentElement) {
          const match = el.parentElement.innerText.match(/\b\d{13}\b/);
          if (match) return match[0];
        }
      }
    }
  }

  const bodyText = document.body ? document.body.innerText : '';
  if (bodyText.includes('0702065319001')) return '0702065319001';

  const anyRucMatch = bodyText.match(/\b\d{10}001\b/);
  if (anyRucMatch) return anyRucMatch[0];

  return null;
}

chrome.storage.local.get(['cordovaBlocks', 'cordovaAutoPilot', 'cordovaDocType', 'cordova_suggested', 'cordova_est_selected', 'current_session_ruc'], async (config) => {
  const url = window.location.href;
  const blocks = config.cordovaBlocks || 100;
  const autoPilot = config.cordovaAutoPilot !== undefined ? config.cordovaAutoPilot : true;
  const docType = config.cordovaDocType || "1";

  const docNames = { "0": "Facturas", "1": "Notas de Venta", "5": "Guías de Remisión" };
  const docName = docNames[docType] || "Documento";

  // 1. Identidad (Comprobar si el usuario activo es la Imprenta Cordova o un Contribuyente)
  let isImprenta = false;
  let activeRuc = detectActiveSRIRuc();

  if (!activeRuc) {
    try {
      await waitForElement('.sri-ruc-cabecera, th, td', 1500);
      activeRuc = detectActiveSRIRuc();
    } catch (e) {}
  }

  if (activeRuc) {
    chrome.storage.local.set({ current_session_ruc: activeRuc });
    if (activeRuc === '0702065319001') {
      isImprenta = true;
    } else {
      isImprenta = false;
    }
  } else {
    if (url.includes('login') || url.includes('logout') || url.includes('desconexion') || document.querySelector('form[action*="login"]')) {
      chrome.storage.local.set({ current_session_ruc: null });
      isImprenta = false;
    } else {
      if (config.current_session_ruc === '0702065319001') {
        isImprenta = true;
      }
    }
  }

  // Acción si se identifica a la Imprenta
  if (isImprenta) {
    await ReportadorState.load();
    injectReportadorAssistant();
    injectImprentaSubtleBanner();
    
    // Por defecto al entrar en Imprenta NO se ejecuta ningún bucle de saltos automático
    if (!ReportadorState.isRunning || url.includes("no-procesadas-listado.jspa") || url.includes("inicio-contribuyente.jspa")) {
      ReportadorState.isRunning = false;
      ReportadorState.log("✓ ESPERANDO ACCIÓN");
      await ReportadorState.save();
    } else if (ReportadorState.isRunning) {
      runReportadorWorkflow().catch(e => console.error("Error en Reportador Workflow:", e));
      
      if (window.reportadorInterval) clearInterval(window.reportadorInterval);
      window.reportadorInterval = setInterval(() => {
        if (ReportadorState.isRunning && !window.location.href.includes("no-procesadas-listado.jspa")) {
          runReportadorWorkflow().catch(e => console.error("Error en Reportador Workflow:", e));
        } else {
          clearInterval(window.reportadorInterval);
        }
      }, 300);
    }
    
    chrome.runtime.onMessage.addListener((msg) => {
        if (msg.action === 'START') {
            ReportadorState.isRunning = true;
            if (msg.targetMode) {
                ReportadorState.targetMode = msg.targetMode;
            }
            ReportadorState.log("INICIO");
            updateReportadorAssistant();
        }
        if (msg.action === 'TOGGLE_ASSISTANT') {
            ReportadorState.assistantVisible = msg.visible;
            updateReportadorAssistant();
        }
    });
    
    chrome.storage.onChanged.addListener((changes) => {
        if (changes.sriState) {
            Object.assign(ReportadorState, changes.sriState.newValue);
            updateReportadorAssistant();
        }
    });

    return; 
  }

  // AUTO-LOGIN ANTESALA SRI (.boton-ingresar-login) Y TARJETA DE 2 OPCIONES
  const loginSubmitBtn = document.querySelector('input.boton-ingresar-login, input[name="boton"][value="Ingresar"]');
  if (url.includes('login') || loginSubmitBtn || document.querySelector('form[action*="login"]')) {
    injectSRILoginAssistant();

    if (loginSubmitBtn) {
      chrome.storage.local.get(['cordova_imprenta_ruc', 'cordova_imprenta_pass', 'cordova_auto_login'], (creds) => {
        if (creds.cordova_auto_login && creds.cordova_imprenta_ruc) {
          const rucInput = document.querySelector('#userPri, input[name="j_username"], input[name="usuario"], input[name="ruc"], #usuario');
          const passInput = document.querySelector('#password, input[name="password"], input[type="password"], #pass');
          const passVal = creds.cordova_imprenta_pass || 'GrafiCoR8634@';
          if (rucInput && !rucInput.value) rucInput.value = creds.cordova_imprenta_ruc;
          if (passInput && !passInput.value) passInput.value = passVal;
          highlightSRIElement(loginSubmitBtn);
        }
      });
    }
  }

  // 0. Sugerencia Automática en la parte inferior en cada paso del avance del cliente
  if (!isImprenta && !config.cordova_suggestion_disabled && url.includes('facturacion-internet')) {
      showStepSuggestionBanner();
  }

  // Si el piloto automático está desactivado, salir inmediatamente para no interferir en absoluto
  if (!autoPilot) {
      return;
  }

  // Si estamos en inicio-contribuyente.jspa ya sugerido (Seleccionar Establecimiento)
  if (url.includes('inicio-contribuyente.jspa') && config.cordova_suggested) {
      try {
          // Extraer datos del cliente (RUC, Razón Social, Caducidad)
          const thElements = Array.from(document.querySelectorAll('th'));
          let rucText = '', razonText = '', caducidadText = '';
          thElements.forEach(th => {
              const text = th.textContent.trim();
              if (text === 'RUC:') rucText = th.nextElementSibling.textContent.trim();
              if (text === 'Razón Social:') razonText = th.nextElementSibling.textContent.trim();
              if (text === 'Fecha de Caducidad:') caducidadText = th.nextElementSibling.textContent.trim();
          });
          
          let vigencia = 'No definida';
          if (caducidadText) {
              const meses = {"Enero":0,"Febrero":1,"Marzo":2,"Abril":3,"Mayo":4,"Junio":5,"Julio":6,"Agosto":7,"Septiembre":8,"Octubre":9,"Noviembre":10,"Diciembre":11};
              const partes = caducidadText.split('/');
              if (partes.length === 3) {
                  const day = parseInt(partes[0]);
                  const monthStr = partes[1];
                  const year = parseInt(partes[2]);
                  let monthIndex = -1;
                  for (let m in meses) {
                      if (monthStr.toLowerCase() === m.toLowerCase()) monthIndex = meses[m];
                  }
                  if (monthIndex !== -1) {
                      const caducidadDate = new Date(year, monthIndex, day);
                      const hoy = new Date();
                      const diffTime = caducidadDate - hoy;
                      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                      if (diffDays <= 120) {
                          vigencia = '<span style="color:#e74c3c; font-weight:bold;">¡ATENCIÓN! 3 meses o menos</span>';
                      } else {
                          vigencia = '12 meses';
                      }
                  }
              }
          }

          let row = await waitForElement('tr.seleccion', 8000).catch(() => null);
          if (!row) {
              // Fallback robusto por si otra extensión cambia la clase
              const allRows = document.querySelectorAll('tr');
              row = Array.from(allRows).find(r => r.getAttribute('onClick') && r.getAttribute('onClick').includes('forma.numeroEstablecimiento.value'));
          }

          // Extraer Nombre Comercial
          let nombreComercial = '<span style="color:#e74c3c;">Sin nombre comercial</span>';
          if (row) {
              const tds = row.querySelectorAll('td');
              if (tds.length >= 2) {
                  const nom = tds[1].textContent.trim();
                  if (nom) nombreComercial = nom;
              }
          }

          // Guardar para el paso final
          chrome.storage.local.set({
              cordovaClientRuc: rucText,
              cordovaClientName: razonText,
              cordovaCaducidad: caducidadText,
              cordovaVigencia: vigencia,
              cordovaNombreComercial: nombreComercial
          });

          if (row && !config.cordova_est_selected) {
              chrome.storage.local.set({ cordova_est_selected: true });
              highlightSRIElement(row);
              // Click nativo directo (no requiere main world para los onClick de filas tr)
              row.click();
          }
      } catch (e) {
          console.error("Cordova SRI: Error al procesar inicio-contribuyente", e);
      }
  }

  // 3. SELECCIONAR ESTABLECIMIENTO CONTRIBUYENTE IMPRENTA (Inputs de cantidad)
  if (url.includes('seleccionar-establecimiento-contibuyente-imprenta.jspa')) {
    try {
      // Esperamos a que la tabla cargue buscando al menos un input de documento (cualquiera)
      await waitForElement('input[name^="documento0_"]', 8000);
      
      const docInput = document.querySelector(`input[name="documento0_${docType}"]`);
      
      if (!docInput) {
          chrome.storage.local.set({ cordovaAutoPilot: false }); // Detenemos el piloto
          if (docType === "1") {
              // No hay Notas de Venta
              showCordovaAlert(
                  'Régimen Diferente Detectado',
                  'Este contribuyente <b>NO</b> puede emitir Notas de Venta.<br><br>Solo puede mandar a imprimir <span style="color:#3498db;">Facturas (máx. 25h)</span> por contingencia y no debe superar el 1% de facturas emitidas el año anterior.<br><br><b>Lo que le corresponde es Facturar Electrónicamente.</b><br>¡Ofrécele nuestros planes electrónicos de facturación!',
                  true, null, false, true // isFinal=true, onConfirm=null, autoPilot=false, isError=true
              );
          } else {
              showCordovaAlert(
                  'Documento No Disponible', 
                  `El documento seleccionado (${docName}) no está habilitado para este contribuyente.`, 
                  true, null, false, true
              );
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
    } catch (e) {
      console.error("Cordova SRI: Error en Paso 3", e);
    }
  }

  // 4. AGREGAR CANTIDADES IMPRENTA (Página intermedia de confirmación)
  if (url.includes('agregar-cantidades-imprenta.jspa')) {
    try {
      const nextBtn = await waitForElement("a[href*='siguientePaso']", 8000);
      if (nextBtn) highlightSRIElement(nextBtn);
      showCordovaAlert('Confirmando', 'Validando cuadro de comprobantes...', false, () => {
         triggerMainWorldClick('', 'bypassAlertsAndNext');
      }, autoPilot);
    } catch (e) {
      console.error("Cordova SRI: Error en Paso 4", e);
    }
  }

  // 5. CONFIRMAR CANTIDADES (Página con dos posibles pantallas)
  if (url.includes('confirmar-cantidades.jspa')) {
    try {
      // Pantalla A: Confirmación de secuencias
      if (document.body.textContent.includes('secuencias solicitadas son las siguientes')) {
          const nextBtn = await waitForElement("a[href*='siguientePaso']", 5000);
          if (nextBtn) highlightSRIElement(nextBtn);
          showCordovaAlert('Confirmando', 'Aceptando secuencias tentativas...', false, () => {
              triggerMainWorldClick('', 'bypassAlertsAndNext');
          }, autoPilot);
          return;
      }

      // Pantalla B: Formulario de búsqueda (Radio button)
      const radioFR = await waitForElement('input[type="radio"][name="FR"][value="1"]', 5000);
      const inputNumero = await waitForElement('input[type="text"][name="numero"]', 5000);
      
      highlightSRIElement(radioFR);
      radioFR.checked = true;
      triggerMainWorldClick('', 'habilitar');
      
      // Asegurarse de que el input se habilite para escritura
      setTimeout(() => {
          inputNumero.disabled = false;
          inputNumero.value = '8634';
          highlightSRIElement(inputNumero);

          showCordovaAlert('Buscando Imprenta', 'Enviando solicitud a Cordova (Cód. 8634)...', false, () => {
             const nextBtn = document.querySelector("a[href*='nextPage']");
             if (nextBtn) highlightSRIElement(nextBtn);
             triggerMainWorldClick("a[href*='nextPage']", "nextPage");
          }, autoPilot);
      }, 300); // Pequeño retraso para que habilitar() haga su efecto

    } catch (e) {
      console.error("Cordova SRI: Error en Paso 5", e);
    }
  }

  // 6. SELECCIONAR IMPRENTA (Resultados de búsqueda)
  if (url.includes('seleccionar-imprenta.jspa')) {
      const trySelectImprenta = () => {
          const dataRows = Array.from(document.querySelectorAll('table:not(#anchoDoc) tbody tr'));
          const row = dataRows.find(tr => {
              const text = tr.textContent.toUpperCase();
              return text.includes('CORDOVA RODRIGUEZ PEDRO MANUEL') || 
                     text.includes('CORDOVARODRIGUEZ PEDRO MANUEL') ||
                     text.includes('0702065319001') || 
                     text.includes('8634') ||
                     text.includes('IMPRENTA CORDOVA');
          });

          if (row) {
              highlightSRIElement(row);
              const onclickStr = row.getAttribute('onclick') || '';
              const aLink = row.querySelector('a');
              
              showCordovaAlert('Imprenta Encontrada', 'Aceptando confirmación automáticamente...', false, () => {
                  let match = onclickStr.match(/siguientePaso\(['"]?(\d+)['"]?\)/);
                  if (!match && aLink) {
                      const hrefStr = aLink.getAttribute('href') || '';
                      match = hrefStr.match(/siguientePaso\(['"]?(\d+)['"]?\)/);
                  }
                  
                  const codeOverride = `
                      window.alert = function(){};
                      window.confirm = function(){ return true; };
                  `;
                  try {
                      const script = document.createElement('script');
                      script.textContent = codeOverride;
                      document.documentElement.appendChild(script);
                      script.remove();
                  } catch(e) {}

                  let param = null;
                  if (match) {
                      param = match[1];
                  } else if (aLink && aLink.getAttribute('href') && aLink.getAttribute('href').includes('siguientePaso')) {
                      const numMatch = aLink.getAttribute('href').match(/\d+/);
                      if (numMatch) {
                          param = numMatch[0];
                      }
                  }

                  if (param !== null) {
                      document.body.setAttribute('data-cordova-param', param);
                      triggerMainWorldClick('', 'siguientePaso');
                  } else if (aLink && aLink.getAttribute('href') && aLink.getAttribute('href').includes('siguientePaso')) {
                      triggerMainWorldClick('', 'siguientePaso');
                  } else {
                      row.click(); // Fallback
                  }
              }, autoPilot);
              return true;
          }
          return false;
      };

      if (!trySelectImprenta()) {
          const intervalId = setInterval(() => {
              if (trySelectImprenta()) clearInterval(intervalId);
          }, 500);
          
          setTimeout(() => clearInterval(intervalId), 15000);
      }
  }

  // 7. PDF Final
  if (url.includes('seleccionar-establecimiento-imprenta.jspa')) {
    chrome.storage.local.get(['cordovaClientRuc', 'cordovaClientName', 'cordovaCaducidad', 'cordovaVigencia', 'cordovaNombreComercial', 'cordovaDocType'], (finalData) => {
      chrome.storage.local.remove(['cordova_suggested', 'cordova_est_selected']);
      setTimeout(() => {
        showCordovaSuccessModal(finalData, blocks);
      }, 1500);
    });
  }
});

async function sendResendEmailNotification(orderData) {
  if (!orderData || !orderData.clientEmail) return;
  const resendKey = 're_MKsfBpR5_BwPGdreXmuGEW2MZrJFTdxz8';
  const docNames = { '0': 'Factura', '1': 'Nota de Venta', '5': 'Guía de Remisión' };
  const docName = docNames[orderData.docType] || 'Nota de Venta';

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${resendKey}`
      },
      body: JSON.stringify({
        from: 'Imprenta Córdova <onboarding@resend.dev>',
        to: [orderData.clientEmail],
        subject: `🖨️ Confirmación de Solicitud SRI - ${orderData.clientName || 'Cliente'}`,
        html: `
          <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 560px; margin: 0 auto; border: 1px solid #cbd5e1; border-radius: 12px; padding: 24px; background: #ffffff;">
            <div style="text-align: center; border-bottom: 2px solid #3b82f6; padding-bottom: 12px; margin-bottom: 16px;">
              <h2 style="color: #0f2b48; margin: 0;">IMPRENTA CÓRDOVA</h2>
              <span style="font-size: 11px; font-weight: bold; color: #3b82f6; text-transform: uppercase;">CÓDIGO DE AUTORIZACIÓN SRI: 8634</span>
            </div>
            <p style="color: #334155;">Estimado/a <strong>${orderData.clientName}</strong>,</p>
            <p style="color: #475569;">Su solicitud de impresión ante el SRI para <strong>${docName} (${orderData.blocks} comprobantes)</strong> ha sido autorizada y registrada exitosamente.</p>
            <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 14px; margin: 16px 0;">
              <div style="font-size: 12px; color: #64748b; font-weight: bold; margin-bottom: 8px;">DETALLES DEL PEDIDO:</div>
              <ul style="line-height: 1.8; color: #0f172a; margin: 0; padding-left: 20px; font-size: 13px;">
                <li><strong>RUC:</strong> ${orderData.clientRuc}</li>
                <li><strong>Tamaño:</strong> ${orderData.docSize}</li>
                <li><strong>Total:</strong> $${parseFloat(orderData.total).toFixed(2)}</li>
                <li><strong>Abono:</strong> $${parseFloat(orderData.abono).toFixed(2)}</li>
                <li><strong>Saldo Restante:</strong> $${parseFloat(orderData.saldo).toFixed(2)}</li>
              </ul>
            </div>
            <p style="text-align: center; margin-top: 20px;">
              <a href="https://www.imprentacordova.net/tracking" style="background: linear-gradient(135deg, #0f2b48 0%, #1e40af 100%); color: #ffffff; padding: 10px 20px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 13px; display: inline-block;">
                Rastrear Estado de Talonario
              </a>
            </p>
          </div>
        `
      })
    });
    if (res.ok) {
      console.log('⚡ [Resend Extension] Correo enviado exitosamente a:', orderData.clientEmail);
    }
  } catch(e) {
    console.error('⚠️ [Resend Extension Error]', e);
  }
}

async function autoSyncToSupabase(orderData) {
  const supabaseUrl = 'https://keilxgrrevfsvyxufecz.supabase.co/rest/v1/trabajos';
  const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtlaWx4Z3JyZXZmc3Z5eHVmZWN6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjM1NDI2NSwiZXhwIjoyMDkxOTMwMjY1fQ._-lyaAeKlLAh701R2h-KUbu3gxcSdcOIjATo8traqEQ';

  const docNames = { '0': 'Factura', '1': 'Nota de Venta', '5': 'Guía de Remisión' };
  const docName = docNames[orderData.docType] || 'Nota de Venta';

  const payload = {
    titular: (orderData.clientName || 'CLIENTE SRI').toUpperCase(),
    servicio: `${docName} (${orderData.blocks} Hojas)`,
    detalle: `Solicitud SRI Autorizada • RUC: ${orderData.clientRuc} • ${orderData.blocks} comprobantes (${orderData.docSize})`,
    cantidad: 1,
    precio: orderData.total || 13,
    abono: orderData.abono || 0,
    saldo: Math.max(0, (orderData.total || 13) - (orderData.abono || 0)),
    prioridad: 'Normal',
    estado: 'PENDIENTE',
    fecha_entrada: new Date().toISOString(),
    responsable: 'SRI Extension Auto Sync',
    origen: 'SRI Extension',
    es_sri: true,
    establecimiento: '001',
    punto_emision: '001',
    tamano: orderData.docSize || '1/4 Oficio',
    actividad_seleccionada: orderData.activity || 'Comercio / Servicios General',
    fecha_vencimiento: orderData.caducidad || null
  };

  try {
    const res = await fetch(supabaseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
        'Prefer': 'return=representation'
      },
      body: JSON.stringify(payload)
    });
    if (res.ok) {
      console.log('⚡ [SRI Extension] Orden sincronizada en Supabase Cloud exitosamente.');
      return true;
    }
  } catch(e) {
    console.error('⚠️ [SRI Extension] Error al sincronizar con Supabase Cloud:', e);
  }
  return false;
}

// ---------------------------------------------------------
// MODELO DE SOLICITUD EDITABLE MINIMALISTA & ELEGANTE
// ---------------------------------------------------------
function showCordovaSuccessModal(finalData, blocks) {
  chrome.storage.local.get(['cordova_activities', 'cordova_orders'], (result) => {
    const orders = result.cordova_orders || [];
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

    // Defaults & pre-fills
    let selectedSize = (lastOrder && lastOrder.docSize) ? lastOrder.docSize : "1/4 Oficio";
    let selectedAbonoVal = "5";
    let customAbonoVal = "";
    let selectedRenovacionVal = "NO";
    let selectedActivity = (lastOrder && lastOrder.activity) ? lastOrder.activity : "Comercio / Servicios General";
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

    const existingOverlay = document.querySelector('.cordova-alert-overlay');
    if (existingOverlay) existingOverlay.remove();

    const overlay = document.createElement('div');
    overlay.className = 'cordova-alert-overlay show';
    const logoUrl = chrome.runtime.getURL('icons/icon128.png');

    const docName = finalData.cordovaDocType === '0' ? 'Factura' : finalData.cordovaDocType === '5' ? 'Guía de Remisión' : 'Nota de Venta';

    overlay.innerHTML = `
      <div class="cordova-alert-box cordova-success-form-box" style="max-width: 480px; width: 94%; text-align: left; padding: 22px; border-radius: 18px; background: #ffffff; box-shadow: 0 25px 50px -12px rgba(15, 23, 42, 0.35); border: 1px solid rgba(52,152,219,0.3);">
        
        <!-- HEADER MINIMALIST -->
        <div style="display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-bottom: 14px; border-bottom: 1.5px solid #e2e8f0; padding-bottom: 10px;">
          <div style="display: flex; align-items: center; gap: 10px;">
            <img src="${logoUrl}" alt="Cordova" style="width: 38px; height: 38px; border-radius: 8px; border: 1.5px solid #3498db;">
            <div>
              <div style="font-size: 9px; font-weight: 800; color: #3498db; text-transform: uppercase; letter-spacing: 1.5px;">IMPRENTA CORDOVA • CÓD. 8634</div>
              <h2 class="cordova-title" style="font-size: 16px; margin: 2px 0 0 0; color: #0f172a; font-weight: 800;">Modelo de Solicitud de Impresión</h2>
            </div>
          </div>
          <button class="cordova-btn" id="cdv-btn-header-renovation" style="background: rgba(46, 204, 113, 0.12); border: 1px solid #2ecc71; color: #16a34a; padding: 4px 8px; font-size: 10px; font-weight: bold; border-radius: 6px; cursor: pointer; white-space: nowrap;">🔄 Renovación</button>
        </div>

        <!-- MODELO DE SOLICITUD CARD (EDITABLE INLINE) -->
        <div class="cdv-model-card" style="background: #f8fafc; border: 1.5px dashed #cbd5e1; border-radius: 12px; padding: 14px; margin-bottom: 14px;">
          
          <!-- MODEL CARD HEADER BADGE -->
          <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #e2e8f0; padding-bottom: 6px; margin-bottom: 10px;">
            <span style="font-size: 9px; font-weight: 800; color: #64748b; text-transform: uppercase; letter-spacing: 1px;">DATOS DE SOLICITUD (CONFIRMAR / EDITAR)</span>
            <span style="font-size: 10px; font-weight: 700; color: #2563eb; background: #eff6ff; padding: 2px 8px; border-radius: 10px; border: 1px solid #bfdbfe;">${docName} • ${blocks} Hojas</span>
          </div>

          <!-- CLIENT NAME INLINE INPUT -->
          <div style="margin-bottom: 8px;">
            <div style="font-size: 9px; font-weight: 700; color: #64748b; text-transform: uppercase;">Cliente / Razón Social:</div>
            <input type="text" id="cdv-edit-name" value="${finalData.cordovaClientName || 'Desconocido'}" style="width: 100%; border: none; border-bottom: 1.5px solid #3498db; background: transparent; font-size: 13px; font-weight: 700; color: #0f172a; padding: 3px 0; outline: none; box-sizing: border-box;">
          </div>

          <!-- RUC & CADUCIDAD -->
          <div style="display: flex; gap: 12px; margin-bottom: 8px; font-size: 11px;">
            <div style="flex: 1;">
              <span style="font-size: 9px; font-weight: 700; color: #64748b; text-transform: uppercase;">RUC: </span>
              <span style="font-family: monospace; font-weight: 700; color: #0f172a;">${finalData.cordovaClientRuc || ''}</span>
            </div>
            <div style="flex: 1;">
              <span style="font-size: 9px; font-weight: 700; color: #64748b; text-transform: uppercase;">Caducidad: </span>
              <span style="font-weight: 600; color: #0f172a;">${finalData.cordovaCaducidad || '12 Meses'}</span>
            </div>
          </div>

          <!-- ACTIVIDAD ECONÓMICA INLINE EDIT -->
          <div style="margin-bottom: 8px;">
            <div style="font-size: 9px; font-weight: 700; color: #64748b; text-transform: uppercase; margin-bottom: 3px;">Actividad Económica:</div>
            <input type="text" id="cdv-edit-activity" value="${selectedActivity}" placeholder="Ej. Comercio, Servicios..." style="width: 100%; border: 1px solid #cbd5e1; border-radius: 6px; background: #ffffff; font-size: 11px; color: #0f172a; padding: 5px 8px; outline: none; box-sizing: border-box;">
          </div>

          <!-- PHONE & EMAIL INLINE INPUTS -->
          <div style="display: flex; gap: 8px; margin-bottom: 8px;">
            <div style="flex: 1;">
              <div style="font-size: 9px; font-weight: 700; color: #64748b; text-transform: uppercase; margin-bottom: 3px;">Teléfono:</div>
              <input type="text" id="cdv-edit-phone" value="${selectedPhoneVal}" placeholder="Ej. 0993083943" style="width: 100%; border: 1px solid #cbd5e1; border-radius: 6px; background: #ffffff; font-size: 11px; color: #0f172a; padding: 5px 8px; outline: none; box-sizing: border-box;">
            </div>
            <div style="flex: 1;">
              <div style="font-size: 9px; font-weight: 700; color: #64748b; text-transform: uppercase; margin-bottom: 3px;">Correo (Opcional):</div>
              <input type="email" id="cdv-edit-email" value="${selectedEmailVal}" placeholder="cliente@correo.com" style="width: 100%; border: 1px solid #cbd5e1; border-radius: 6px; background: #ffffff; font-size: 11px; color: #0f172a; padding: 5px 8px; outline: none; box-sizing: border-box;">
            </div>
          </div>

          <!-- TAMAÑO SELECTOR -->
          <div style="margin-bottom: 8px;">
            <div style="font-size: 9px; font-weight: 700; color: #64748b; text-transform: uppercase; margin-bottom: 3px;">Tamaño de Comprobante:</div>
            <div class="cdv-segment-control" id="cdv-ctrl-size" style="display: flex; gap: 6px;">
              <button class="cdv-segment-btn ${selectedSize === '1/4 Oficio' ? 'active' : ''}" data-val="1/4 Oficio" style="flex: 1; padding: 5px 8px; border: 1px solid #cbd5e1; border-radius: 6px; background: #ffffff; color: #475569; cursor: pointer; font-size: 11px; font-weight: 600;">1/4 Oficio</button>
              <button class="cdv-segment-btn ${selectedSize === '1/2 Oficio' ? 'active' : ''}" data-val="1/2 Oficio" style="flex: 1; padding: 5px 8px; border: 1px solid #cbd5e1; border-radius: 6px; background: #ffffff; color: #475569; cursor: pointer; font-size: 11px; font-weight: 600;">1/2 Oficio</button>
            </div>
          </div>

          <!-- ABONO SELECTOR -->
          <div>
            <div style="font-size: 9px; font-weight: 700; color: #64748b; text-transform: uppercase; margin-bottom: 3px;">Abono ($):</div>
            <div class="cdv-abono-group" style="display: flex; gap: 6px; align-items: center;">
              <div class="cdv-segment-control" id="cdv-ctrl-abono" style="display: flex; gap: 6px; flex: 1;">
                <button class="cdv-segment-btn ${selectedAbonoVal === '5' ? 'active' : ''}" data-val="5" style="flex: 1; padding: 5px; border: 1px solid #cbd5e1; border-radius: 6px; background: #ffffff; color: #475569; cursor: pointer; font-size: 11px; font-weight: 600;">$5</button>
                <button class="cdv-segment-btn ${selectedAbonoVal === '10' ? 'active' : ''}" data-val="10" style="flex: 1; padding: 5px; border: 1px solid #cbd5e1; border-radius: 6px; background: #ffffff; color: #475569; cursor: pointer; font-size: 11px; font-weight: 600;">$10</button>
                <button class="cdv-segment-btn ${selectedAbonoVal === '15' ? 'active' : ''}" data-val="15" style="flex: 1; padding: 5px; border: 1px solid #cbd5e1; border-radius: 6px; background: #ffffff; color: #475569; cursor: pointer; font-size: 11px; font-weight: 600;">$15</button>
                <button class="cdv-segment-btn ${selectedAbonoVal === 'custom' ? 'active' : ''}" data-val="custom" style="flex: 1; padding: 5px; border: 1px solid #cbd5e1; border-radius: 6px; background: #ffffff; color: #475569; cursor: pointer; font-size: 11px; font-weight: 600;">Otro</button>
              </div>
              <input type="number" id="cdv-input-abono-manual" value="${customAbonoVal}" placeholder="$" style="width: 65px; display: ${selectedAbonoVal === 'custom' ? 'inline-block' : 'none'}; padding: 4px 6px; font-size: 11px; border-radius: 6px; border: 1px solid #3498db; background: #ffffff; color: #0f172a; outline: none; text-align: center;" min="1" step="0.01">
            </div>
          </div>
        </div>

        <!-- FINANCIAL LIVE SUMMARY -->
        <div class="cdv-live-financials" style="background: #f1f5f9; border: 1px solid #e2e8f0; padding: 8px 12px; border-radius: 8px; display: flex; justify-content: space-between; align-items: center; font-size: 12px; color: #475569; margin-bottom: 14px;">
          <div>Valor Total: <span id="cdv-live-total" style="font-weight: 700; color: #0f172a;">$${currentTotal.toFixed(2)}</span></div>
          <div style="font-size: 13px; font-weight: 800; color: #2563eb;">Saldo Deudor: <span id="cdv-live-saldo">$${currentTotal.toFixed(2)}</span></div>
        </div>

        <!-- PRIMARY 1-CLICK ACTION BUTTONS -->
        <div style="display: flex; flex-direction: column; gap: 8px;">
          <button class="cordova-btn" id="cdv-btn-web-platform" style="width: 100%; font-size: 13px; font-weight: 800; padding: 13px; background: linear-gradient(135deg, #0f2b48 0%, #1e40af 100%); border: 1.5px solid #3b82f6; color: #ffffff; border-radius: 10px; box-shadow: 0 6px 20px rgba(30, 64, 175, 0.4); cursor: pointer; transition: all 0.25s ease; text-align: center; text-transform: uppercase; letter-spacing: 0.8px;">
            🌐 ABRIR EN PLATAFORMA WEB (imprentacordova.net)
          </button>
          
          <div style="display: flex; gap: 8px;">
            <button class="cordova-btn" id="cdv-btn-direct-print" style="flex: 1; font-size: 11px; font-weight: 800; padding: 10px; background: linear-gradient(135deg, #16a34a 0%, #15803d 100%); border: none; color: #ffffff; border-radius: 8px; cursor: pointer; box-shadow: 0 4px 12px rgba(22, 163, 74, 0.3);">
              🖨️ Impresión Local A4
            </button>
            <button class="cordova-btn" id="cdv-btn-whatsapp" style="flex: 1; font-size: 11px; font-weight: 800; padding: 10px; background: linear-gradient(135deg, #25d366 0%, #128c7e 100%); border: none; color: #ffffff; border-radius: 8px; cursor: pointer; box-shadow: 0 4px 12px rgba(37, 211, 102, 0.3);">
              📱 Notificar WhatsApp
            </button>
          </div>
        </div>

        <!-- SECONDARY BUTTONS -->
        <div style="display: flex; gap: 8px; margin-top: 8px;">
          <button class="cordova-btn cordova-btn-secondary" id="cdv-btn-home" style="flex: 1; font-size: 11px; padding: 8px; border-color: #cbd5e1; color: #64748b; border-radius: 8px; cursor: pointer;">
            ✖ Cerrar
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);

    const liveTotalSpan = document.getElementById('cdv-live-total');
    const liveSaldoSpan = document.getElementById('cdv-live-saldo');
    const inputAbonoManual = document.getElementById('cdv-input-abono-manual');
    const inputEditName = document.getElementById('cdv-edit-name');
    const inputEditActivity = document.getElementById('cdv-edit-activity');
    const inputEditPhone = document.getElementById('cdv-edit-phone');
    const inputEditEmail = document.getElementById('cdv-edit-email');
    const btnWebPlatform = document.getElementById('cdv-btn-web-platform');
    const btnPrint = document.getElementById('cdv-btn-direct-print');
    const btnWhatsApp = document.getElementById('cdv-btn-whatsapp');

    const updateLiveFinancials = () => {
      currentTotal = getPrice(selectedSize, blocks);
      liveTotalSpan.textContent = `$${currentTotal.toFixed(2)}`;
      
      let abono = 0;
      if (selectedAbonoVal === "custom") {
        abono = parseFloat(inputAbonoManual.value) || 0;
      } else {
        abono = parseFloat(selectedAbonoVal) || 0;
      }
      
      const saldo = Math.max(0, currentTotal - abono);
      liveSaldoSpan.textContent = `$${saldo.toFixed(2)}`;
    };

    // 1. TAMAÑO CONTROL
    const sizeButtons = document.querySelectorAll('#cdv-ctrl-size .cdv-segment-btn');
    sizeButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        sizeButtons.forEach(b => {
          b.classList.remove('active');
          b.style.background = '#ffffff';
          b.style.borderColor = '#cbd5e1';
          b.style.color = '#475569';
        });
        btn.classList.add('active');
        btn.style.background = 'rgba(52,152,219,0.15)';
        btn.style.borderColor = '#3498db';
        btn.style.color = '#3498db';
        selectedSize = btn.dataset.val;
        updateLiveFinancials();
      });
    });

    const activeSizeBtn = document.querySelector('#cdv-ctrl-size .cdv-segment-btn.active');
    if (activeSizeBtn) {
      activeSizeBtn.style.background = 'rgba(52,152,219,0.15)';
      activeSizeBtn.style.borderColor = '#3498db';
      activeSizeBtn.style.color = '#3498db';
    }

    // 2. ABONO CONTROL
    const abonoButtons = document.querySelectorAll('#cdv-ctrl-abono .cdv-segment-btn');
    abonoButtons.forEach(btn => {
      if (btn.classList.contains('active')) {
        btn.style.background = 'rgba(52,152,219,0.15)';
        btn.style.borderColor = '#3498db';
        btn.style.color = '#3498db';
      }
      btn.addEventListener('click', () => {
        abonoButtons.forEach(b => {
          b.classList.remove('active');
          b.style.background = '#ffffff';
          b.style.borderColor = '#cbd5e1';
          b.style.color = '#475569';
        });
        btn.classList.add('active');
        btn.style.background = 'rgba(52,152,219,0.15)';
        btn.style.borderColor = '#3498db';
        btn.style.color = '#3498db';
        
        selectedAbonoVal = btn.dataset.val;
        if (selectedAbonoVal === 'custom') {
          inputAbonoManual.style.display = 'inline-block';
          inputAbonoManual.focus();
        } else {
          inputAbonoManual.style.display = 'none';
          inputAbonoManual.value = '';
        }
        updateLiveFinancials();
      });
    });

    if (inputAbonoManual) {
      inputAbonoManual.addEventListener('input', updateLiveFinancials);
    }

    // RENOVACIÓN TRIGGER
    const applyRenovation = () => {
      selectedRenovacionVal = "SÍ";
      const titleDiv = document.querySelector('.cordova-title');
      if (titleDiv) {
        titleDiv.textContent = "¡Modo Renovación Activado!";
        titleDiv.style.color = "#16a34a";
        setTimeout(() => {
          titleDiv.textContent = "Modelo de Solicitud de Impresión";
          titleDiv.style.color = "#0f172a";
        }, 1500);
      }
    };

    const headerRenovationBtn = document.getElementById('cdv-btn-header-renovation');
    if (headerRenovationBtn) {
      headerRenovationBtn.addEventListener('click', applyRenovation);
    }

    updateLiveFinancials();

    const savePendingAndRedirect = (autoPrintVal, callback) => {
      let finalAbono = 0;
      if (selectedAbonoVal === 'custom') {
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
        activity: editedActivity || "Comercio / Servicios General",
        clientPhone: editedPhone || "Dictado / Sin teléfono",
        clientEmail: editedEmail,
        phoneOpt: "Dictado",
        abono: finalAbono,
        total: currentTotal,
        saldo: finalSaldo,
        autoPrint: autoPrintVal,
        timestamp: Date.now(),
        renovacion: selectedRenovacionVal
      };

      // Sincronización automática directa en Supabase Cloud (Zero-Touch)
      autoSyncToSupabase(pendingOrder).catch(e => console.error(e));

      // Enviar correo de confirmación via Resend API si el cliente especificó correo
      if (pendingOrder.clientEmail) {
        sendResendEmailNotification(pendingOrder).catch(e => console.error(e));
      }

      chrome.storage.local.set({ cordova_pending_order: pendingOrder }, callback);
    };

    if (btnWebPlatform) {
      btnWebPlatform.addEventListener('click', () => {
        savePendingAndRedirect(false, () => {
          const ruc = finalData.cordovaClientRuc || '';
          const editedName = inputEditName ? inputEditName.value.trim().toUpperCase() : (finalData.cordovaClientName || '');
          const editedActivity = inputEditActivity ? inputEditActivity.value.trim() : selectedActivity;
          const editedPhone = inputEditPhone ? inputEditPhone.value.trim() : selectedPhoneVal;
          const editedEmail = inputEditEmail ? inputEditEmail.value.trim() : selectedEmailVal;
          
          let finalAbono = 0;
          if (selectedAbonoVal === 'custom') {
            finalAbono = parseFloat(inputAbonoManual.value) || 0;
          } else {
            finalAbono = parseFloat(selectedAbonoVal) || 0;
          }

          const params = new URLSearchParams({
            mode: 'sri',
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
            renovacion: selectedRenovacionVal
          });

          // Intentar comunicación local si la pestaña ya está abierta
          try {
            window.postMessage({
              type: 'CORDOVA_SRI_ORDER_EVENT',
              payload: Object.fromEntries(params)
            }, '*');
          } catch(e) {}

          const webUrl = `https://www.imprentacordova.net/nuevo-pedido?${params.toString()}`;
          window.open(webUrl, '_blank');
        });
      });
    }

    if (btnPrint) {
      btnPrint.addEventListener('click', () => {
        savePendingAndRedirect(true, () => {
          chrome.runtime.sendMessage({ action: "openRegistry" });
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
        let abonoVal = parseFloat(selectedAbonoVal) || 0;
        if (selectedAbonoVal === 'custom' && inputAbonoManual) {
          abonoVal = parseFloat(inputAbonoManual.value) || 0;
        }
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
          `Rastree el estado de su talonario en: https://www.imprentacordova.net/tracking`
        );

        const waUrl = cleanPhone.length >= 10 ? `https://wa.me/${cleanPhone}?text=${msg}` : `https://wa.me/?text=${msg}`;
        window.open(waUrl, '_blank');
      });
    }

    const closeBtn = document.getElementById('cdv-btn-home');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        overlay.classList.remove('show');
        setTimeout(() => overlay.remove(), 300);
      });
    }
  });
}

