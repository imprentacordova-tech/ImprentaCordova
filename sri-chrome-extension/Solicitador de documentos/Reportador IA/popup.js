// popup.js - Professional Dashboard Logic
document.addEventListener('DOMContentLoaded', () => {
    // UI Elements
    const elCount = document.getElementById('countValue');
    const elT25 = document.getElementById('labelT25');
    const elT50 = document.getElementById('labelT50');
    const elT100 = document.getElementById('labelT100');
    const elT200 = document.getElementById('labelT200');
    const elTOther = document.getElementById('labelTOther');
    const elStatusText = document.getElementById('statusText');
    const elStatusPill = document.getElementById('statusPill');
    const elLogContainer = document.getElementById('logContainer');
    const btnStart = document.getElementById('btnStart');
    const btnAceptar = document.getElementById('btnAceptar');
    const btnStop = document.getElementById('btnStop');
    const btnReset = document.getElementById('btnReset');
    const chkAssistant = document.getElementById('chkAssistant');

    // --- VIEW HELPERS ---
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

        // Update Counters
        if (state.totalReported !== undefined) elCount.textContent = state.totalReported;
        if (state.t25 !== undefined) elT25.textContent = state.t25;
        if (state.t50 !== undefined) elT50.textContent = state.t50;
        if (state.t100 !== undefined) elT100.textContent = state.t100;
        if (state.t200 !== undefined) elT200.textContent = state.t200;
        if (state.tOther !== undefined) elTOther.textContent = state.tOther;

        // Update Status Bar
        if (state.currentStatus) {
            elStatusText.textContent = state.currentStatus;
        }

        // Visual Status Mode
        // Visual Status Mode
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

    // --- STORAGE SYNC ---
    function syncFromStorage() {
        chrome.storage.local.get(['sriState', 'sriLogs'], (result) => {
            if (result.sriState) {
                updateStatusUI(result.sriState);
            }
            // Limit log reload to last 20 for perf
            if (result.sriLogs && result.sriLogs.length > 0) {
                elLogContainer.innerHTML = '';
                result.sriLogs.slice(-20).forEach(log => appendLog(log));
            }
        });
    }

    // Listen for changes from Content Script
    chrome.storage.onChanged.addListener((changes, namespace) => {
        if (namespace === 'local') {
            if (changes.sriState) {
                updateStatusUI(changes.sriState.newValue);
            }
            if (changes.sriLogs) {
                // Just grab the last one to append to avoid flickering full redraw
                const newLogs = changes.sriLogs.newValue;
                if (newLogs && newLogs.length > 0) {
                    appendLog(newLogs[newLogs.length - 1]);
                }
            }
        }
    });

    // --- ACTIONS ---
    btnStart.addEventListener('click', () => {
        const newState = { isRunning: true, currentStatus: "Iniciando secuencia..." };
        // Update local UI immediately for responsiveness
        updateStatusUI(newState);
        
        // Notify Content Script via Storage (preferred for persistency)
        chrome.storage.local.set({ 
            sriState: { 
                ...newState, 
                command: 'START',
                targetMode: 'REPORTAR'
            } 
        });

        // Also try direct message for instant wakeup
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (tabs[0]?.id) {
                chrome.tabs.sendMessage(tabs[0].id, { action: 'START', targetMode: 'REPORTAR' }).catch(() => {});
            }
        });
    });

    btnAceptar.addEventListener('click', () => {
        const newState = { isRunning: true, currentStatus: "Navegando a solicitudes..." };
        updateStatusUI(newState);
        
        chrome.storage.local.set({ 
            sriState: { 
                ...newState, 
                command: 'START',
                targetMode: 'ACEPTAR'
            } 
        });

        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (tabs[0]?.id) {
                chrome.tabs.sendMessage(tabs[0].id, { action: 'START', targetMode: 'ACEPTAR' }).catch(() => {});
            }
        });
    });

    btnStop.addEventListener('click', () => {
        const newState = { isRunning: false, currentStatus: "Detenido por usuario." };
        updateStatusUI(newState);
        chrome.storage.local.set({ 
            sriState: { 
                ...newState, 
                command: 'STOP' 
            } 
        });
    });

    chkAssistant.addEventListener('change', () => {
        chrome.storage.local.set({ assistantVisible: chkAssistant.checked });
        // Notify Content Script directly
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (tabs[0]?.id) {
                chrome.tabs.sendMessage(tabs[0].id, { action: 'TOGGLE_ASSISTANT', visible: chkAssistant.checked }).catch(() => {});
            }
        });
    });

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

    // Init
    syncFromStorage();
});
