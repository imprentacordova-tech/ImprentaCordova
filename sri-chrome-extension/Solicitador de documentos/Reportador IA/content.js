// content.js - SRI Turbo Elite - Pueblo Edition
// Author: Santiago Cordova / Antigravity AI
// Ultra-Minimalist Autonomous Assistant

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

const CONFIG = {
    selectors: {
        btnImprenta: "//a[contains(@href, 'enviar(19)')] | //div[@id='cuadroAplicacion']//a[contains(., 'Imprenta')] | //a[contains(@href, 'enviar(19)') and contains(., 'Imprenta')]",
        linkManejoAutorizaciones: "//a[contains(., 'Manejo de Autorizaciones')]",
        linkPendientesReportar: "//a[contains(., 'Autorizaciones Pendientes de Reportar')]",
        linkSolicitudesAutorizacion: "//a[contains(., 'Solicitudes de autorización')] | //a[contains(@href, 'solicitudes-autorizacion')]",
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
            position: fixed; bottom: 20px; right: 20px; height: 42px; min-width: 170px;
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

const State = {
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
    
    log(msg) {
        this.lastAction = msg;
        updateAssistant();
        this.save();
    }
};

// --- DOM UTILS ---
function getX(xpath) {
    return document.evaluate(xpath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
}

function getXPath(element) {
    if (element.id !== "") return 'id("' + element.id + '")';
    if (element === document.body) return element.tagName;
    let ix = 0;
    const siblings = element.parentNode.childNodes;
    for (let i = 0; i < siblings.length; i++) {
        const sibling = siblings[i];
        if (sibling === element) return getXPath(element.parentNode) + '/' + element.tagName + '[' + (ix + 1) + ']';
        if (sibling.nodeType === 1 && sibling.tagName === element.tagName) ix++;
    }
}

function click(xpath, purpose) {
    const el = getX(xpath);
    if (!el) return false;
    
    if (!window.location.href.includes("facturacion-internet")) return false;
    
    State.lastAction = purpose;
    updateAssistant();
    
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

// --- ASSISTANT UI ---
function injectAssistant() {
    if (window.self !== window.top) return;
    if (document.getElementById('sri-assistant')) return;
    
    const styleSheet = document.createElement("style");
    styleSheet.innerText = CONFIG.styles;
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
    asst.className = State.assistantVisible ? '' : 'hidden';
    asst.innerHTML = `
        <div class="sri-asst-dot"></div>
        <div class="sri-asst-label" id="asst-step">${State.currentStep}</div>
        <div class="sri-asst-btns">
            <button class="sri-asst-btn" id="asst-btn-restart" title="Reiniciar">🔄</button>
            <button class="sri-asst-btn" id="asst-btn-play">▶</button>
            <button class="sri-asst-btn stop" id="asst-btn-stop">■</button>
        </div>
    `;
    document.body.appendChild(asst);
    
    document.getElementById('asst-btn-play').onclick = () => {
        State.isRunning = !State.isRunning;
        State.log(State.isRunning ? "AVANZANDO..." : "PAUSA");
        State.save(); 
        updateAssistant();
    };
    
    document.getElementById('asst-btn-stop').onclick = () => {
        State.isRunning = false;
        State.log("STOP");
        State.save(); 
        updateAssistant();
    };

    document.getElementById('asst-btn-restart').onclick = () => {
        State.log("REINICIANDO...");
        window.location.href = "https://srienlinea.sri.gob.ec/facturacion-internet/preimpresos/pendientes-reportar-busqueda.jsp";
    };
    
    updateAssistant();
}

function updateAssistant() {
    if (window.self !== window.top) return;
    const asst = document.getElementById('sri-assistant');
    if (!asst) return;
    
    if (!window.location.href.includes("facturacion-internet")) {
        asst.classList.add('hidden');
        return;
    }
    
    asst.classList.toggle('hidden', !State.assistantVisible);
    asst.classList.toggle('running', State.isRunning && !State.lastAction.includes("COMPLETADO"));
    asst.classList.toggle('finished', State.lastAction.includes("COMPLETADO"));
    
    const stepLabel = document.getElementById('asst-step');
    if (stepLabel) {
        if (State.lastAction.includes("COMPLETADO")) {
            stepLabel.innerText = "✓ TODO REPORTADO";
        } else {
            stepLabel.innerText = State.isRunning ? State.lastAction : State.currentStep;
        }
    }
    
    const playBtn = document.getElementById('asst-btn-play');
    if (playBtn) playBtn.innerText = State.isRunning ? '⏸' : '▶';
    
    // CONTROLAR EL OVERLAY DEL COHETE
    const loader = document.getElementById('sri-loading-overlay');
    if (loader) {
        const shouldShow = State.isRunning && !State.lastAction.includes("COMPLETADO") && !State.lastAction.includes("STOP") && !State.lastAction.includes("PAUSA");
        loader.classList.toggle('show', !!shouldShow);
        
        const loaderText = document.getElementById('sri-loader-status-text');
        if (loaderText && shouldShow) {
            let stepName = "Petición...";
            if (State.currentStep === "Perfil") stepName = "Seleccionando Perfil Imprenta...";
            else if (State.currentStep === "Menú") stepName = "Accediendo a Autorizaciones...";
            else if (State.currentStep === "Local") stepName = "Cargando Establecimiento Gráfico...";
            else if (State.currentStep === "Opciones") stepName = "Entrando a Bandeja de Pendientes...";
            else if (State.currentStep === "Filtro") stepName = "Buscando Autorizaciones Activas...";
            else if (State.currentStep === "Listado") stepName = "Procesando Lista de Clientes...";
            else if (State.currentStep === "Reporte") stepName = "Calculando y Reportando Secuencias...";
            else if (State.currentStep === "Final") stepName = "Guardando Reporte de Autorización...";
            
            loaderText.innerText = stepName;
        }
    }
}

// --- AUTOMATION ENGINE ---
async function runWorkflow() {
    const url = window.location.href;
    const bodyText = document.body.innerText || "";
    
    if (State.isRunning) console.log(`[Elite Debug] URL: ${url} | Step: ${State.currentStep}`);
    
    // --- 0. LIMPIEZA DE MODALES ---
    const modalAceptar = getX("//div[contains(@class, 'modal') or contains(@class, 'dialog')]//button[contains(., 'Aceptar')] | //span[contains(., 'Aceptar')]/parent::button[not(contains(@class, 'home'))]");
    if (modalAceptar && modalAceptar.offsetParent !== null) {
        modalAceptar.click();
        return; 
    }

    // --- 1. INICIO / TIPO CONTRIBUYENTE ---
    if (url.includes("revisar-tipo-contribuyente.jspa") || bodyText.includes("Seleccione el Tipo de Contribuyente")) {
        State.currentStep = "Perfil";
        if (State.isRunning) click(CONFIG.selectors.btnImprenta, "Seleccionando Perfil...");
        return;
    }

    // --- 2. MENU PRINCIPAL ---
    if (url.includes("seleccionar-tipo-contribuyente.jspa") || (bodyText.includes("Menú Principal") && bodyText.includes("Manejo de Autorizaciones"))) {
        State.currentStep = "Menú";
        if (State.isRunning) click(CONFIG.selectors.linkManejoAutorizaciones, "Entrando...");
        return;
    }

    // --- 3. SELECCION ESTABLECIMIENTO ---
    if (url.includes("establecimientos-imprenta.jspa") || bodyText.includes("Selección de Establecimientos de Imprenta")) {
        State.currentStep = "Local";
        if (State.isRunning) click(CONFIG.selectors.rowEstablishment, "Local...");
        return;
    }
    
    // --- 4. ACCESO A REPORTES O SOLICITUDES ---
    if (url.includes("menu-preimpresos.jspa") && !url.includes("busqueda") && !url.includes("listado")) {
        State.currentStep = "Opciones";
        if (State.isRunning) {
            if (State.targetMode === 'ACEPTAR') {
                click(CONFIG.selectors.linkSolicitudesAutorizacion, "Ir a Solicitudes...");
            } else {
                click(CONFIG.selectors.linkPendientesReportar, "Reportes...");
            }
        }
        return;
    }

    // --- 4.1 DESTINO SOLICITUDES ALCANZADO ---
    if (url.includes("solicitudes-autorizacion") || bodyText.includes("Solicitudes de autorización")) {
        State.currentStep = "Solicitudes";
        if (State.isRunning && State.targetMode === 'ACEPTAR') {
            State.isRunning = false;
            State.log("✓ SOLICITUDES CARGADAS");
            State.save();
        }
        return;
    }
    
    // --- 6. LISTADO DE TRABAJOS ---
    if (url.includes("pendientes-reportar-listado") || bodyText.includes("Autorizaciones a ser Reportadas")) {
        State.currentStep = "Listado";
        
        const noData = bodyText.includes("No existen datos") || bodyText.includes("No se encontraron registros") || (bodyText.includes("Total de registros") && bodyText.includes(" 0"));
        if (noData) {
            State.isRunning = false;
            State.log("✓ REPORTE COMPLETADO");
            return;
        }
        
        if (State.isRunning) {
            const firstRow = getX(CONFIG.selectors.firstClientRow);
            const btnNext = getX(CONFIG.selectors.btnSiguiente);
            if (firstRow) {
                click(CONFIG.selectors.firstClientRow, "Cliente...");
                if (btnNext) setTimeout(() => click(CONFIG.selectors.btnSiguiente, "Siguiente..."), 1000);
            } else if (btnNext) {
                click(CONFIG.selectors.btnSiguiente, "Siguiente...");
            }
        }
        return;
    }

    // --- 5. BUSQUEDA DE CLIENTES ---
    if (url.includes("pendientes-reportar-busqueda") || bodyText.includes("Búsqueda de Autorizaciones Pendientes")) {
        State.currentStep = "Filtro";
        const radio = getX(CONFIG.selectors.radioTodas);
        if (radio && !radio.checked) {
            if (State.isRunning) click(CONFIG.selectors.radioTodas, "Fijando Todas...");
            return;
        }
        const btnB = getX(CONFIG.selectors.btnBuscar);
        if (State.isRunning && btnB) click(CONFIG.selectors.btnBuscar, "Buscando...");
        return;
    }
    
    // --- 7. EXTRACCION Y REPORTE ---
    if (url.includes("reporte-autorizacion") || url.includes("pendiente-reportar-autorizacion")) {
        State.currentStep = "Reporte";
        
        if (!State.lastAction.includes("Hojas:")) {
            try {
                let sheets = 0;
                // Metodo 1: Tabla
                const table = getX(CONFIG.selectors.sequenceTable);
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
                // Metodo 2: Inputs (Pueblo Request)
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
                State.totalReported = (State.totalReported || 0) + sheets;
                if (sheets === 25) State.t25 = (State.t25 || 0) + 1;
                else if (sheets === 50) State.t50 = (State.t50 || 0) + 1;
                else if (sheets === 100) State.t100 = (State.t100 || 0) + 1;
                else if (sheets === 200) State.t200 = (State.t200 || 0) + 1;
                else State.tOther = (State.tOther || 0) + 1;
                
                State.log("Hojas: " + sheets);
            } catch(e) { console.error(e); }
        }
        
        if (State.isRunning) click(CONFIG.selectors.btnSiguiente, "Enviando...");
        return;
    }
    
    // --- 8. FIRMA Y REINICIO ---
    if (url.includes("pendiente-reportar-informacion.jspa") || bodyText.includes("Firma de Autorización") || bodyText.includes("comprobante ha sido reportado")) {
        State.currentStep = "Final";
        if (State.isRunning) {
            State.log("LOOP...");
            const checkAndClick = () => {
                const lb = getX(CONFIG.selectors.linkReturn) || getX("//a[contains(@href, 'busqueda')]");
                if (lb) {
                    const path = getXPath(lb);
                    if (path) click(path, "Reset...");
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

// --- INIT ---
(async () => {
    await State.load();
    injectAssistant();
    
    // Ejecución inmediata al cargar la página
    runWorkflow().catch(e => console.error(e));
    
    setInterval(() => {
        runWorkflow().catch(e => console.error(e));
    }, 700);
    
    chrome.storage.onChanged.addListener((changes) => {
        if (changes.sriState) {
            Object.assign(State, changes.sriState.newValue);
            updateAssistant();
        }
    });

    chrome.runtime.onMessage.addListener((msg) => {
        if (msg.action === 'START') {
            State.isRunning = true;
            if (msg.targetMode) {
                State.targetMode = msg.targetMode;
            }
            State.log("INICIO");
            updateAssistant();
        }
        if (msg.action === 'TOGGLE_ASSISTANT') {
            State.assistantVisible = msg.visible;
            updateAssistant();
        }
    });
})();
