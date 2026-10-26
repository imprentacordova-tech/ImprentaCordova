// Lógica de Negocio para Registro de Órdenes y PDF - Imprenta Cordova

// Mock chrome storage for non-extension environment (local testing)
if (typeof chrome === 'undefined' || !chrome.storage || !chrome.storage.local) {
  window.chrome = {
    storage: {
      local: {
        get: (keys, callback) => {
          const result = {};
          const keysArr = Array.isArray(keys) ? keys : [keys];
          keysArr.forEach(key => {
            const val = localStorage.getItem(key);
            result[key] = val ? JSON.parse(val) : undefined;
          });
          callback(result);
        },
        set: (items, callback) => {
          Object.entries(items).forEach(([key, val]) => {
            localStorage.setItem(key, JSON.stringify(val));
          });
          if (callback) callback();
        },
        remove: (keys, callback) => {
          const keysArr = Array.isArray(keys) ? keys : [keys];
          keysArr.forEach(key => localStorage.removeItem(key));
          if (callback) callback();
        }
      }
    },
    runtime: {
      getURL: (path) => path,
      sendMessage: (msg) => console.log("Sent message to runtime:", msg)
    }
  };
}

document.addEventListener('DOMContentLoaded', () => {
  // Navigation elements
  const tabButtons = document.querySelectorAll('.tab-btn');
  const tabPanels = document.querySelectorAll('.tab-panel');

  // Form elements
  const orderForm = document.getElementById('order-form');
  const orderSeqNumSpan = document.getElementById('order-seq-num');
  
  const clientNameInput = document.getElementById('client-name');
  const clientRucInput = document.getElementById('client-ruc');
  const clientClaveInput = document.getElementById('client-clave');
  const clientActivityInput = document.getElementById('client-activity');
  const clientPhoneInput = document.getElementById('client-phone');
  const clientRenovacionInput = document.getElementById('client-renovacion');
  
  const optSame = document.getElementById('opt-same');
  const optChange = document.getElementById('opt-change');
  const optDictated = document.getElementById('opt-dictated');
  let selectedPhoneOpt = 'Dictado'; // Default

  const paperSizeSelect = document.getElementById('paper-size');
  const paperTypeSelect = document.getElementById('paper-type');
  const docTypeSelect = document.getElementById('doc-type-sel');

  const tblSizeSpan = document.getElementById('tbl-size');
  const tblDocSpan = document.getElementById('tbl-doc');
  const tblPaperSpan = document.getElementById('tbl-paper');
  const tblEstInput = document.getElementById('tbl-est');
  const tblPtoInput = document.getElementById('tbl-pto');
  const tblQtyInput = document.getElementById('tbl-qty');
  const tblPriceInput = document.getElementById('tbl-price');

  const deliveryDateInput = document.getElementById('delivery-date');
  const caducidadDateInput = document.getElementById('caducidad-date');
  const vigenciaLabelInput = document.getElementById('vigencia-label');
  const orderNotesTextarea = document.getElementById('order-notes');

  const finTotalSpan = document.getElementById('fin-total');
  const finAbonoInput = document.getElementById('fin-abono-input');
  const finSaldoSpan = document.getElementById('fin-saldo');
  const abonoWarningDetail = document.getElementById('abono-warning-detail');
  const btnSavePrint = document.getElementById('btn-save-print');

  const btnReset = document.getElementById('btn-reset');

  // Registry elements
  const registrySearchInput = document.getElementById('registry-search');
  const ordersListBody = document.getElementById('orders-list-body');

  // New Registry elements for KPIs, Filters & Modal
  const kpiTotalPending = document.getElementById('kpi-total-pending');
  const kpiTotalCollected = document.getElementById('kpi-total-collected');
  const kpiActiveOrders = document.getElementById('kpi-active-orders');
  const filterPills = document.querySelectorAll('.filter-pill');
  let currentFilter = 'all'; // 'all', 'pending', 'delivered'

  // Modal elements
  const pickupModal = document.getElementById('pickup-modal');
  const modalCloseBtn = document.getElementById('modal-close-btn');
  const modalCancelBtn = document.getElementById('modal-cancel-btn');
  const modalOrderNum = document.getElementById('modal-order-num');
  const modalClientName = document.getElementById('modal-client-name');
  const modalClientRuc = document.getElementById('modal-client-ruc');
  const modalOrderDetail = document.getElementById('modal-order-detail');
  const modalTotalVal = document.getElementById('modal-total-val');
  const modalAbonoPrev = document.getElementById('modal-abono-prev');
  const modalSaldoPend = document.getElementById('modal-saldo-pend');
  const modalPaymentInput = document.getElementById('modal-payment-input');
  const modalPrintReceipt = document.getElementById('modal-print-receipt');
  const modalPickupForm = document.getElementById('modal-pickup-form');
  let orderNumToPickup = null;

  // Prices Database
  const referencePrices = {
    "1/4 Oficio": {
      25: 9.00,
      50: 10.00,
      100: 13.00,
      200: 20.00,
      300: 30.00,
      400: 36.00,
      500: 40.00,
      1000: 65.00
    },
    "1/2 Oficio": {
      25: 12.00,
      50: 14.00,
      100: 18.00,
      200: 32.00,
      300: 48.00,
      400: 60.00,
      500: 65.00,
      1000: 100.00
    }
  };

  // State
  let allOrders = [];
  let currentEditingOrderNum = null; // To track if we are editing an existing order
  let isAutoPrinting = false;

  // -------------------------------------------------------------
  // TAB NAVIGATION LÓGICA
  // -------------------------------------------------------------
  tabButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      tabButtons.forEach(b => b.classList.remove('active'));
      tabPanels.forEach(p => p.classList.remove('active'));

      btn.classList.add('active');
      const targetPanel = document.getElementById(btn.dataset.tab);
      if (targetPanel) {
        targetPanel.classList.add('active');
      }

      if (btn.dataset.tab === 'tab-registry') {
        loadOrdersFromStorage();
      }
    });
  });

  // -------------------------------------------------------------
  // HELPER DE FECHA DE ENTREGA AUTOMÁTICA
  // -------------------------------------------------------------
  function getNextBusinessDayAfternoon() {
    const now = new Date();
    let daysToAdd = 1;
    const dayOfWeek = now.getDay(); // 0: Dom, 1: Lun, ... 5: Vie, 6: Sab
    
    if (dayOfWeek === 5) { // Viernes -> Lunes
      daysToAdd = 3;
    } else if (dayOfWeek === 6) { // Sábado -> Lunes
      daysToAdd = 2;
    }
    
    const nextDate = new Date(now);
    nextDate.setDate(now.getDate() + daysToAdd);
    nextDate.setHours(16, 0, 0, 0); // 4:00 PM
    
    // Format to YYYY-MM-DDThh:mm for datetime-local input
    const year = nextDate.getFullYear();
    const month = String(nextDate.getMonth() + 1).padStart(2, '0');
    const day = String(nextDate.getDate()).padStart(2, '0');
    const hours = String(nextDate.getHours()).padStart(2, '0');
    const minutes = String(nextDate.getMinutes()).padStart(2, '0');
    
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  }

  // Set default delivery date
  deliveryDateInput.value = getNextBusinessDayAfternoon();

  // -------------------------------------------------------------
  // PHONE OPTION SELECTORS & AUTO-FILL HISTORY
  // -------------------------------------------------------------
  const phoneOpts = [optSame, optChange, optDictated];
  
  const updatePhoneFromHistory = () => {
    if (selectedPhoneOpt === 'Mismo') {
      const ruc = clientRucInput.value.trim();
      if (ruc) {
        const clientOrders = allOrders.filter(o => o.clientRuc === ruc);
        if (clientOrders.length > 0) {
          const lastOrder = clientOrders[clientOrders.length - 1];
          if (lastOrder && lastOrder.clientPhone) {
            clientPhoneInput.value = lastOrder.clientPhone;
          } else {
            clientPhoneInput.value = '';
          }
        } else {
          clientPhoneInput.value = '';
        }
      } else {
        clientPhoneInput.value = '';
      }
    }
  };

  phoneOpts.forEach(opt => {
    opt.addEventListener('click', () => {
      phoneOpts.forEach(o => o.classList.remove('active'));
      opt.classList.add('active');
      selectedPhoneOpt = opt.textContent.trim();
      updatePhoneFromHistory();
    });
  });

  clientRucInput.addEventListener('input', updatePhoneFromHistory);

  // -------------------------------------------------------------
  // CALCULO AUTOMATICO DE PRECIOS E INTERFAZ
  // -------------------------------------------------------------
  function updatePrice() {
    const size = paperSizeSelect.value;
    const qty = parseInt(tblQtyInput.value, 10) || 100;
    
    // Update live text labels
    tblSizeSpan.textContent = size;
    tblDocSpan.textContent = docTypeSelect.value;
    tblPaperSpan.textContent = paperTypeSelect.value;

    // Search reference price
    let calculatedPrice = 13.00; // default for 1/4 Oficio 100h
    if (referencePrices[size] && referencePrices[size][qty] !== undefined) {
      calculatedPrice = referencePrices[size][qty];
    } else {
      // Linear interpolation / guess if not exact key
      const baseSize = size === "1/2 Oficio" ? 18.00 : 13.00;
      calculatedPrice = (qty / 100) * baseSize;
    }

    tblPriceInput.value = calculatedPrice.toFixed(2);
    updateFinancialSummary();
  }

  function updateFinancialSummary() {
    const price = parseFloat(tblPriceInput.value) || 0;
    const abono = parseFloat(finAbonoInput.value) || 0;
    const total = price;
    const saldo = Math.max(0, total - abono);

    finTotalSpan.textContent = total.toFixed(2);
    finSaldoSpan.textContent = saldo.toFixed(2);
    validateAbonoDetail();
  }

  function validateAbonoDetail() {
    const abono = parseFloat(finAbonoInput.value) || 0;
    if (abono < 5) {
      if (abonoWarningDetail) {
        abonoWarningDetail.style.display = 'block';
        abonoWarningDetail.textContent = 'ℹ️ Abono menor a $5.00 (Pendiente de cobro total al entregar)';
      }
    } else {
      if (abonoWarningDetail) abonoWarningDetail.style.display = 'none';
    }
    if (btnSavePrint) {
      btnSavePrint.disabled = false;
      btnSavePrint.style.opacity = '1';
      btnSavePrint.style.pointerEvents = 'auto';
    }
    return true;
  }

  // Bind change events
  paperSizeSelect.addEventListener('change', updatePrice);
  paperTypeSelect.addEventListener('change', updatePrice);
  docTypeSelect.addEventListener('change', updatePrice);
  tblQtyInput.addEventListener('input', updatePrice);
  tblPriceInput.addEventListener('input', updateFinancialSummary);
  finAbonoInput.addEventListener('input', updateFinancialSummary);

  clientClaveInput.addEventListener('input', () => {
    tblEstInput.value = clientClaveInput.value;
  });

  // -------------------------------------------------------------
  // CARGA DE CAPTURA PENDIENTE (AUTOMATIZADA DESDE SRI)
  // -------------------------------------------------------------
  function checkPendingOrder() {
    chrome.storage.local.get(['cordova_pending_order', 'cordova_orders'], (result) => {
      const orders = result.cordova_orders || [];
      allOrders = orders;
      
      // Calculate next order sequence number
      generateNextOrderNumber();

      const pending = result.cordova_pending_order;
      if (pending) {
        // Prefill form
        clientNameInput.value = pending.clientName || '';
        clientRucInput.value = pending.clientRuc || '';
        caducidadDateInput.value = pending.caducidad || '';
        vigenciaLabelInput.value = pending.vigencia || '';
        
        let displayDoc = "Nota de Venta";
        if (pending.docType === "0") displayDoc = "Factura";
        if (pending.docType === "5") displayDoc = "Guía de Remisión";
        docTypeSelect.value = displayDoc;

        tblQtyInput.value = pending.blocks || 100;
        
        // Custom fields from SRI quick form
        if (pending.docSize) paperSizeSelect.value = pending.docSize;
        if (pending.activity) clientActivityInput.value = pending.activity;
        if (pending.clientPhone) clientPhoneInput.value = pending.clientPhone;
        if (clientRenovacionInput) {
          clientRenovacionInput.value = pending.renovacion || 'NO';
        }
        
        if (pending.phoneOpt) {
          selectedPhoneOpt = pending.phoneOpt;
          phoneOpts.forEach(o => o.classList.remove('active'));
          const matchOpt = phoneOpts.find(o => o.textContent.trim() === pending.phoneOpt);
          if (matchOpt) matchOpt.classList.add('active');
        }

        if (pending.abono !== undefined) {
          finAbonoInput.value = pending.abono;
        }

        // Default values
        paperTypeSelect.value = "Químico";
        tblEstInput.value = "001";
        tblPtoInput.value = "001";
        clientClaveInput.value = "001";

        // Calculate and prefill price
        updatePrice();

        // Clear the pending order so it does not prefill again
        chrome.storage.local.remove(['cordova_pending_order']);

        // Check if we need to auto-submit and print
        if (pending.autoPrint) {
          isAutoPrinting = true;
          setTimeout(() => {
            orderForm.dispatchEvent(new Event('submit'));
          }, 150);
        }
      }
    });
  }

  function generateNextOrderNumber() {
    if (currentEditingOrderNum) {
      orderSeqNumSpan.textContent = currentEditingOrderNum;
      return;
    }
    
    let nextNum = 1;
    if (allOrders.length > 0) {
      // Find highest order number
      const numbers = allOrders.map(o => {
        const parsed = parseInt(o.orderNum, 10);
        return isNaN(parsed) ? 0 : parsed;
      });
      nextNum = Math.max(...numbers) + 1;
    } else {
      nextNum = 1001; // Start at 1001 for a professional look
    }
    
    // Format to 4 digits at least (e.g. 1001)
    const formatted = String(nextNum).padStart(4, '0');
    orderSeqNumSpan.textContent = formatted;
  }

  // -------------------------------------------------------------
  // STORAGE & DATABASE ACTIONS
  // -------------------------------------------------------------
  // SINCRONIZACIÓN AUTOMÁTICA CON IMPRENTACORDOVA.COM (SUPABASE & BACKEND)
  // -------------------------------------------------------------
  function syncOrderToBackend(order) {
    if (!order) return;

    console.log('[Sync Auto] Enviando orden a imprentacordova.com...', order.orderNum);

    // SEGURIDAD: antes esto apuntaba a http://localhost:3000 (roto en producción) y, si
    // fallaba, escribía directo en Supabase con la service_role hardcodeada — una clave
    // que saltea toda la Row Level Security y que quedaba publicada dentro del .crx.
    // Ahora todo pasa por el backend, único que conoce la clave maestra.
    CordovaApi.post('/api/v1/ordenes/sincronizar', order)
      .then(data => {
        console.log('✅ [Sync Backend OK]', data);
      })
      .catch(err => {
        console.error('❌ [Sync Backend] No se pudo sincronizar la orden #' + order.orderNum + ':', err.message);
      });
  }

  function loadOrdersFromStorage() {
    chrome.storage.local.get(['cordova_orders'], (result) => {
      const localOrders = result.cordova_orders || [];
      allOrders = localOrders;
      filterAndRender();

      // Sincronización Bidireccional en Tiempo Real con imprentacordova.net
      // (vía backend: la service_role ya no vive dentro de la extensión)
      CordovaApi.get('/api/v1/trabajos/listar?limite=300')
      .then(resp => {
        const data = resp && resp.trabajos;
        if (Array.isArray(data) && data.length > 0) {
          const remoteMapped = data.map(t => ({
            orderNum: String(t.orden || t.id).padStart(4, '0'),
            timestamp: t.fecha_entrada ? new Date(t.fecha_entrada).getTime() : Date.now(),
            clientName: t.titular || 'CONSUMIDOR FINAL',
            clientRuc: t.cedula_ruc || t.ruc || '',
            clave: t.establecimiento || '001',
            activity: t.actividad_seleccionada || 'Comercio / Servicios General',
            clientPhone: t.telefono || '',
            phoneOpt: 'Dictado',
            docSize: t.tamano || '1/4 Oficio',
            docPaper: t.subtipo || 'Químico',
            docName: t.tipo || 'Nota de Venta',
            docEst: t.establecimiento || '001',
            docPto: t.punto_emision || '001',
            docQty: t.cantidad || 100,
            total: parseFloat(t.total) || 0,
            abono: parseFloat(t.abono) || 0,
            saldo: parseFloat(t.saldo) || 0,
            deliveryDate: t.fecha_entrega || '',
            caducidad: t.fecha_vencimiento || '',
            vigencia: '12 meses',
            notes: t.observaciones || '',
            renovacion: t.es_renovacion ? 'SÍ' : 'NO',
            // Marcado del trámite declarado por el operador en el sistema (AUMENTO|CAMBIO|MISMO).
            // Viaja con la orden: la extensión y el documento tienen que imprimir lo mismo.
            tramiteSri: t.tramite_sri || null
          }));

          const orderMap = new Map();
          localOrders.forEach(o => orderMap.set(o.orderNum, o));
          remoteMapped.forEach(o => {
            if (!orderMap.has(o.orderNum)) {
              orderMap.set(o.orderNum, o);
            }
          });

          allOrders = Array.from(orderMap.values()).sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
          chrome.storage.local.set({ cordova_orders: allOrders });
          filterAndRender();
        }
      })
      .catch(err => console.warn('⚠️ [Sync Cloud] No se pudo cargar desde el backend:', err.message));
    });
  }

  function saveOrdersToStorage() {
    chrome.storage.local.set({ cordova_orders: allOrders }, () => {
      filterAndRender();
      if (allOrders.length > 0) {
        syncOrderToBackend(allOrders[0]);
      }
    });
  }

  // -------------------------------------------------------------
  // BACKUP & RESTORE DATA MANAGEMENT (ENTERPRISE RESILIENCE)
  // -------------------------------------------------------------
  const btnExportJson = document.getElementById('btn-export-json');
  const btnImportJson = document.getElementById('btn-import-json');
  const fileImportJson = document.getElementById('file-import-json');

  if (btnExportJson) {
    btnExportJson.addEventListener('click', () => {
      chrome.storage.local.get(['cordova_orders'], (result) => {
        const orders = result.cordova_orders || [];
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(orders, null, 2));
        const downloadAnchor = document.createElement('a');
        const nowStr = new Date().toISOString().slice(0, 10);
        downloadAnchor.setAttribute("href", dataStr);
        downloadAnchor.setAttribute("download", `Backup_ImprentaCordova_Orders_${nowStr}.json`);
        document.body.appendChild(downloadAnchor);
        downloadAnchor.click();
        downloadAnchor.remove();
      });
    });
  }

  if (btnImportJson && fileImportJson) {
    btnImportJson.addEventListener('click', () => fileImportJson.click());
    fileImportJson.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const importedOrders = JSON.parse(event.target.result);
          if (!Array.isArray(importedOrders)) {
            alert("El archivo de respaldo no contiene una lista válida de órdenes.");
            return;
          }
          if (confirm(`¿Desea importar ${importedOrders.length} órdenes? Esto fusionará los registros existentes.`)) {
            chrome.storage.local.get(['cordova_orders'], (res) => {
              const current = res.cordova_orders || [];
              const map = new Map();
              current.forEach(o => map.set(o.orderNum, o));
              importedOrders.forEach(o => map.set(o.orderNum, o));
              const merged = Array.from(map.values());
              chrome.storage.local.set({ cordova_orders: merged }, () => {
                allOrders = merged;
                filterAndRender();
                alert("¡Base de datos de órdenes restaurada con éxito!");
              });
            });
          }
        } catch (err) {
          alert("Error al leer el archivo JSON: " + err.message);
        }
      };
      reader.readAsText(file);
    });
  }

  // -------------------------------------------------------------
  // REGISTRY RENDER & FILTER (BANDEJA DE RETIROS TOP 10,000)
  // -------------------------------------------------------------
  const kpiOverdueOrders = document.getElementById('kpi-overdue-orders');
  const registrySearchSummary = document.getElementById('registry-search-summary');

  function updateKPIs() {
    let totalPending = 0;
    let totalCollected = 0;
    let activeOrders = 0;
    let overdueOrders = 0;

    allOrders.forEach(o => {
      const total = parseFloat(o.total) || 0;
      const saldo = parseFloat(o.saldo) || 0;
      const abono = parseFloat(o.abono) || (total - saldo);
      
      totalPending += saldo;
      totalCollected += abono;
      
      if (saldo > 0) {
        activeOrders++;
        if (o.deliveryDate) {
          const delivTime = new Date(o.deliveryDate).getTime();
          if (delivTime < Date.now()) {
            overdueOrders++;
          }
        }
      }
    });

    if (kpiTotalPending) kpiTotalPending.textContent = totalPending.toFixed(2);
    if (kpiTotalCollected) kpiTotalCollected.textContent = totalCollected.toFixed(2);
    if (kpiActiveOrders) kpiActiveOrders.textContent = activeOrders;
    if (kpiOverdueOrders) kpiOverdueOrders.textContent = overdueOrders;
  }

  function filterAndRender() {
    const q = registrySearchInput.value.toLowerCase().trim();
    let filtered = allOrders;

    // Apply state filter
    if (currentFilter === 'pending') {
      filtered = filtered.filter(o => parseFloat(o.saldo) > 0);
    } else if (currentFilter === 'delivered') {
      filtered = filtered.filter(o => parseFloat(o.saldo) === 0);
    } else if (currentFilter === 'overdue') {
      filtered = filtered.filter(o => {
        const isPending = parseFloat(o.saldo) > 0;
        if (!isPending || !o.deliveryDate) return false;
        return new Date(o.deliveryDate).getTime() < Date.now();
      });
    }

    // Apply search query across multiple fields
    if (q) {
      filtered = filtered.filter(o => 
        (o.orderNum && o.orderNum.toLowerCase().includes(q)) ||
        (o.clientName && o.clientName.toLowerCase().includes(q)) ||
        (o.clientRuc && o.clientRuc.toLowerCase().includes(q)) ||
        (o.clientPhone && o.clientPhone.toLowerCase().includes(q)) ||
        (o.docName && o.docName.toLowerCase().includes(q)) ||
        (o.activity && o.activity.toLowerCase().includes(q))
      );
    }

    // Update search summary line
    if (registrySearchSummary) {
      const viewTotal = filtered.reduce((acc, o) => acc + (parseFloat(o.total) || 0), 0);
      const viewSaldo = filtered.reduce((acc, o) => acc + (parseFloat(o.saldo) || 0), 0);
      registrySearchSummary.textContent = `Mostrando ${filtered.length} de ${allOrders.length} órdenes • Valor Total en vista: $${viewTotal.toFixed(2)} | Saldo Pendiente: $${viewSaldo.toFixed(2)}`;
    }

    renderRegistryTable(filtered);
    updateKPIs();
  }

  function cloneOrderForRenovacion(orderNum) {
    const order = allOrders.find(o => o.orderNum === orderNum);
    if (!order) return;

    // Switch to Form tab
    tabButtons.forEach(b => b.classList.remove('active'));
    tabPanels.forEach(p => p.classList.remove('active'));
    
    const formTabBtn = document.querySelector('.tab-btn[data-tab="tab-form"]');
    const formPanel = document.getElementById('tab-form');
    if (formTabBtn) formTabBtn.classList.add('active');
    if (formPanel) formPanel.classList.add('active');

    // Fill form with order details for renewal
    clientNameInput.value = order.clientName || '';
    clientRucInput.value = order.clientRuc || '';
    clientClaveInput.value = order.clave || '001';
    clientActivityInput.value = order.activity || '';
    clientPhoneInput.value = order.clientPhone || '';
    if (clientRenovacionInput) clientRenovacionInput.value = "SÍ";

    paperSizeSelect.value = order.docSize || "1/4 Oficio";
    paperTypeSelect.value = order.docPaper || "Químico";
    docTypeSelect.value = order.docName || "Nota de Venta";

    tblEstInput.value = order.docEst || "001";
    tblPtoInput.value = order.docPto || "001";
    tblQtyInput.value = order.docQty || 100;
    
    currentEditingOrderNum = null;
    generateNextOrderNumber();
    updatePrice();

    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function renderRegistryTable(ordersList) {
    ordersListBody.innerHTML = '';
    
    if (ordersList.length === 0) {
      ordersListBody.innerHTML = `
        <tr>
          <td colspan="11" style="text-align: center; color: var(--text-muted); padding: 35px; font-size: 13px;">
            🔍 No se encontraron órdenes registradas para esta búsqueda o filtro.
          </td>
        </tr>`;
      return;
    }

    // Sort descending by order number (latest first)
    const sorted = [...ordersList].sort((a, b) => b.orderNum.localeCompare(a.orderNum));

    const nowTime = Date.now();
    const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;

    sorted.forEach(order => {
      const dateFormatted = new Date(order.timestamp).toLocaleDateString('es-EC', {
        day: '2-digit', month: '2-digit', year: 'numeric'
      });
      const deliveryFormatted = new Date(order.deliveryDate).toLocaleDateString('es-EC', {
        day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit'
      });
      
      const isPending = parseFloat(order.saldo) > 0;
      const statusClass = isPending ? 'pending' : 'delivered';
      const statusText = isPending ? 'Pendiente' : 'Retirado';

      // Check overdue and aged order badges
      let isOverdue = false;
      let isAged = false;
      
      if (isPending && order.deliveryDate) {
        if (new Date(order.deliveryDate).getTime() < nowTime) {
          isOverdue = true;
        }
      }
      if (isPending && (nowTime - order.timestamp) > thirtyDaysMs) {
        isAged = true;
      }

      const tr = document.createElement('tr');
      if (isOverdue) tr.classList.add('row-overdue');

      const jobDetail = `${order.docQty || 100} ${order.docName || 'Nota de Venta'} (${order.docSize || '1/4 Oficio'})`;

      tr.innerHTML = `
        <td style="font-weight: 800; color: #2563eb;">#${order.orderNum}</td>
        <td style="font-size: 11px; color: #64748b;">${dateFormatted}</td>
        <td style="font-weight: 700; color: #0f172a;">${order.clientName}</td>
        <td class="font-mono" style="font-size: 11px;">${order.clientRuc}</td>
        <td style="font-size: 11px; font-weight: 600; color: #334155;">${jobDetail}</td>
        <td style="font-weight: 800; color: #0f172a;">$${parseFloat(order.total).toFixed(2)}</td>
        <td style="color: #16a34a; font-weight: 600;">$${parseFloat(order.abono).toFixed(2)}</td>
        <td style="font-weight: 800; color: ${isPending ? '#dc2626' : '#16a34a'}; font-size: 13px;">$${parseFloat(order.saldo).toFixed(2)}</td>
        <td style="font-size: 10.5px; color: #475569;">${deliveryFormatted}</td>
        <td>
          <span class="status-chip ${statusClass}">${statusText}</span>
          ${isOverdue ? '<span class="overdue-badge" style="background: rgba(239,68,68,0.15); color: #dc2626; border: 1px solid rgba(239,68,68,0.3); font-size: 9px; padding: 2px 6px; border-radius: 4px; font-weight: bold; margin-left: 3px;">🚨 Atrasado</span>' : ''}
          ${isAged ? '<span style="background: rgba(245,158,11,0.15); color: #d97706; border: 1px solid rgba(245,158,11,0.3); font-size: 9px; padding: 2px 6px; border-radius: 4px; font-weight: bold; margin-left: 3px;">⚠️ +30d</span>' : ''}
        </td>
        <td style="text-align: center; white-space: nowrap;">
          ${isPending ? `<button class="reg-action-btn reg-btn-pickup" data-num="${order.orderNum}" style="background: #2563eb; color: #fff; font-weight: 700; padding: 5px 10px; border-radius: 6px; border: none; cursor: pointer; box-shadow: 0 2px 6px rgba(37,99,235,0.3);">💵 Retirar</button>` : ''}
          <button class="reg-action-btn reg-btn-renovacion" data-num="${order.orderNum}" title="Repetir orden para este cliente" style="background: #f1f5f9; color: #16a34a; font-weight: 700; padding: 5px 8px; border-radius: 6px; border: 1px solid #2ecc71; cursor: pointer;">🔄 Renovación</button>
          <button class="reg-action-btn reg-btn-print" data-num="${order.orderNum}" title="Ver e imprimir PDF" style="background: #f1f5f9; color: #2563eb; font-weight: 600; padding: 5px 8px; border-radius: 6px; border: 1px solid #cbd5e1; cursor: pointer;">📄 PDF</button>
          <button class="reg-action-btn reg-btn-delete" data-num="${order.orderNum}" title="Eliminar orden" style="background: transparent; color: #ef4444; border: none; cursor: pointer; font-size: 13px; padding: 4px 6px;">🗑️</button>
        </td>
      `;
      ordersListBody.appendChild(tr);
    });

    // Add listeners to dynamic action buttons
    document.querySelectorAll('.reg-btn-pickup').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const num = e.currentTarget.dataset.num;
        openPickupModal(num);
      });
    });

    document.querySelectorAll('.reg-btn-renovacion').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const num = e.currentTarget.dataset.num;
        cloneOrderForRenovacion(num);
      });
    });

    document.querySelectorAll('.reg-btn-print').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const num = e.currentTarget.dataset.num;
        loadOrderIntoForm(num);
      });
    });

    document.querySelectorAll('.reg-btn-delete').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const num = e.currentTarget.dataset.num;
        deleteOrder(num);
      });
    });
  }

  // Search filter
  registrySearchInput.addEventListener('input', filterAndRender);

  // Bind state filter pills
  filterPills.forEach(pill => {
    pill.addEventListener('click', () => {
      filterPills.forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      currentFilter = pill.dataset.filter;
      filterAndRender();
    });
  });

  // -------------------------------------------------------------
  // MODAL DE COBRO / RETIRO ACCIONES
  // -------------------------------------------------------------
  function closePickupModal() {
    if (pickupModal) pickupModal.classList.remove('active');
    orderNumToPickup = null;
  }

  if (modalCloseBtn) modalCloseBtn.addEventListener('click', closePickupModal);
  if (modalCancelBtn) modalCancelBtn.addEventListener('click', closePickupModal);

  // Close clicking outside content box
  if (pickupModal) {
    pickupModal.addEventListener('click', (e) => {
      if (e.target === pickupModal) {
        closePickupModal();
      }
    });
  }

  function openPickupModal(orderNum) {
    const order = allOrders.find(o => o.orderNum === orderNum);
    if (!order) return;

    orderNumToPickup = orderNum;
    
    // Populate modal texts
    if (modalOrderNum) modalOrderNum.textContent = order.orderNum;
    if (modalClientName) modalClientName.textContent = order.clientName;
    if (modalClientRuc) modalClientRuc.textContent = order.clientRuc;
    if (modalOrderDetail) {
      modalOrderDetail.textContent = `${order.docQty} ${order.docName} (${order.docSize}, Papel ${order.docPaper})`;
    }

    // Set prices
    const total = parseFloat(order.total) || 0;
    const abono = parseFloat(order.abono) || 0;
    const saldo = parseFloat(order.saldo) || 0;

    if (modalTotalVal) modalTotalVal.textContent = `$${total.toFixed(2)}`;
    if (modalAbonoPrev) modalAbonoPrev.textContent = `$${abono.toFixed(2)}`;
    if (modalSaldoPend) modalSaldoPend.textContent = `$${saldo.toFixed(2)}`;

    // Set default cobro input to exact pending balance
    if (modalPaymentInput) {
      modalPaymentInput.value = saldo.toFixed(2);
      modalPaymentInput.max = saldo.toFixed(2);
    }

    // Quick cash action chips
    const btnPayFull = document.getElementById('modal-btn-pay-full');
    if (btnPayFull) {
      btnPayFull.onclick = () => {
        if (modalPaymentInput) modalPaymentInput.value = saldo.toFixed(2);
      };
    }

    document.querySelectorAll('.modal-chip-val').forEach(chip => {
      chip.onclick = () => {
        const val = parseFloat(chip.dataset.val) || 0;
        if (modalPaymentInput) modalPaymentInput.value = Math.min(val, saldo).toFixed(2);
      };
    });

    if (pickupModal) pickupModal.classList.add('active');
  }

  if (modalPickupForm) {
    modalPickupForm.addEventListener('submit', (e) => {
      e.preventDefault();
      
      const paymentAmount = parseFloat(modalPaymentInput.value) || 0;
      if (paymentAmount < 0) {
        alert("Por favor ingrese un monto de cobro válido.");
        return;
      }

      const payMethodSelect = document.getElementById('modal-pay-method');
      const payMethod = payMethodSelect ? payMethodSelect.value : 'Efectivo';

      const idx = allOrders.findIndex(o => o.orderNum === orderNumToPickup);
      if (idx === -1) return;

      const order = allOrders[idx];
      const prevAbono = parseFloat(order.abono) || 0;
      const total = parseFloat(order.total) || 0;

      // Calculate new figures
      const newAbono = prevAbono + paymentAmount;
      const newSaldo = Math.max(0, total - newAbono);

      order.abono = newAbono;
      order.saldo = newSaldo;
      order.lastPaymentMethod = payMethod;
      order.lastPaymentTimestamp = Date.now();

      chrome.storage.local.set({ cordova_orders: allOrders }, () => {
        closePickupModal();
        filterAndRender();

        // Notificación de entrega/cobro.
        // El envío lo hace el backend: la API key de Resend estaba hardcodeada aquí
        // y la extensión se distribuye empaquetada, así que cualquiera podía extraerla.
        if (order.clientEmail) {
          CordovaApi.post('/api/v1/emails/enviar', {
            to: order.clientEmail,
            subject: `✅ Confirmación de Entrega Orden #${order.orderNum} - Imprenta Córdova`,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto; border: 1px solid #cbd5e1; border-radius: 12px; padding: 24px; background: #ffffff;">
                  <div style="text-align: center; border-bottom: 2px solid #16a34a; padding-bottom: 12px; margin-bottom: 16px;">
                    <h2 style="color: #0f2b48; margin: 0;">IMPRENTA CÓRDOVA</h2>
                    <span style="font-size: 11px; font-weight: bold; color: #16a34a; text-transform: uppercase;">ENTREGA Y RECEPCIÓN COMPLETADA</span>
                  </div>
                  <p style="color: #334155;">Estimado/a <strong>${order.clientName}</strong>,</p>
                  <p style="color: #475569;">Confirmamos que su <strong>Orden #${order.orderNum} (${order.docQty} ${order.docName})</strong> ha sido cobrada y retirada satisfactoriamente en nuestra imprenta.</p>
                  <ul style="line-height: 1.8; color: #0f172a; font-size: 13px;">
                    <li><strong>Monto Cancelado Hoy:</strong> $${paymentAmount.toFixed(2)} (${payMethod})</li>
                    <li><strong>Saldo Pendiente Restante:</strong> $${newSaldo.toFixed(2)}</li>
                    <li><strong>Estado Final:</strong> ${newSaldo === 0 ? 'PAGADO Y RETIRADO ✓' : 'ENTREGADO CON SALDO'}</li>
                  </ul>
                  <p style="text-align: center; margin-top: 20px; font-size: 12px; color: #64748b;">
                    ¡Gracias por su preferencia! Imprenta Córdova &bull; Tel: 0993083943
                  </p>
                </div>
              `
          }).catch(err => console.error("Error enviando email de retiro:", err.message));
        }

        const shouldPrint = modalPrintReceipt ? modalPrintReceipt.checked : false;

        if (shouldPrint) {
          // Populate print receipt view
          document.querySelectorAll('.class-rec-order-num').forEach(el => el.textContent = order.orderNum.padStart(8, '0'));
          
          const now = new Date();
          document.querySelectorAll('.class-rec-date').forEach(el => el.textContent = now.toLocaleDateString('es-EC', {
            day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
          }));
          
          document.querySelectorAll('.class-rec-client-name').forEach(el => el.textContent = order.clientName);
          document.querySelectorAll('.class-rec-client-ruc').forEach(el => el.textContent = order.clientRuc);
          document.querySelectorAll('.class-rec-detail').forEach(el => el.textContent = `${order.docSize} - ${order.docName} (${order.docPaper || 'Químico'})`);
          document.querySelectorAll('.class-rec-qty').forEach(el => el.textContent = order.docQty || 100);
          document.querySelectorAll('.class-rec-total').forEach(el => el.textContent = `$${total.toFixed(2)}`);
          document.querySelectorAll('.class-rec-abono-prev').forEach(el => el.textContent = `$${prevAbono.toFixed(2)}`);
          document.querySelectorAll('.class-rec-pago-ahora').forEach(el => el.textContent = `$${paymentAmount.toFixed(2)} (${payMethod})`);
          document.querySelectorAll('.class-rec-saldo-rest').forEach(el => el.textContent = `$${newSaldo.toFixed(2)}`);

          // Trigger receipt print layout rules
          document.body.classList.remove('print-mode-order');
          document.body.classList.add('print-mode-receipt');

          setTimeout(() => {
            window.print();
            document.body.classList.remove('print-mode-receipt');
          }, 300);
        }
      });
    });
  }

  // Action: Load Order into form to edit / print again
  function loadOrderIntoForm(orderNum) {
    const order = allOrders.find(o => o.orderNum === orderNum);
    if (order) {
      currentEditingOrderNum = order.orderNum;
      orderSeqNumSpan.textContent = order.orderNum;

      clientNameInput.value = order.clientName;
      clientRucInput.value = order.clientRuc;
      clientClaveInput.value = order.clave || '001';
      clientActivityInput.value = order.activity || '';
      clientPhoneInput.value = order.clientPhone || '';
      if (clientRenovacionInput) {
        clientRenovacionInput.value = order.renovacion || 'NO';
      }
      
      // Selected phone opt
      phoneOpts.forEach(o => o.classList.remove('active'));
      const matchOpt = phoneOpts.find(o => o.textContent.trim() === (order.phoneOpt || 'Dictado'));
      if (matchOpt) {
        matchOpt.classList.add('active');
        selectedPhoneOpt = order.phoneOpt || 'Dictado';
      }

      paperSizeSelect.value = order.docSize;
      paperTypeSelect.value = order.docPaper;
      docTypeSelect.value = order.docName;

      tblEstInput.value = order.docEst || '001';
      tblPtoInput.value = order.docPto || '001';
      tblQtyInput.value = order.docQty;
      tblPriceInput.value = order.total;

      deliveryDateInput.value = order.deliveryDate;
      caducidadDateInput.value = order.caducidad || '';
      vigenciaLabelInput.value = order.vigencia || '12 meses';
      orderNotesTextarea.value = order.notes || '';

      finAbonoInput.value = order.abono;

      updatePrice();
      updateFinancialSummary();

      // Switch to form tab
      document.querySelector('.tab-btn[data-tab="tab-form"]').click();
    }
  }

  // Action: Delete Order
  function deleteOrder(orderNum) {
    if (confirm(`¿Está seguro de eliminar la orden N° ${orderNum} del registro?`)) {
      allOrders = allOrders.filter(o => o.orderNum !== orderNum);
      saveOrdersToStorage();
    }
  }

  // -------------------------------------------------------------
  // FORM RESET
  // -------------------------------------------------------------
  btnReset.addEventListener('click', () => {
    currentEditingOrderNum = null;
    orderForm.reset();
    selectedPhoneOpt = 'Dictado';
    phoneOpts.forEach(o => o.classList.remove('active'));
    optDictated.classList.add('active');
    if (clientRenovacionInput) {
      clientRenovacionInput.value = 'NO';
    }
    
    deliveryDateInput.value = getNextBusinessDayAfternoon();
    generateNextOrderNumber();
    updatePrice();
  });

  // -------------------------------------------------------------
  // SUBMIT FORM: SAVE & PRINT PDF
  // -------------------------------------------------------------
  orderForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const orderNum = orderSeqNumSpan.textContent;
    const clientName = clientNameInput.value.trim().toUpperCase();
    const clientRuc = clientRucInput.value.trim();
    const clientClave = clientClaveInput.value.trim() || '001';
    const clientActivity = clientActivityInput.value.trim().toUpperCase();
    const clientPhone = clientPhoneInput.value.trim();
    const clientRenovacion = clientRenovacionInput ? clientRenovacionInput.value.trim() : 'NO';

    const docSize = paperSizeSelect.value;
    const docPaper = paperTypeSelect.value;
    const docName = docTypeSelect.value;

    const docEst = tblEstInput.value.trim() || '001';
    const docPto = tblPtoInput.value.trim() || '001';
    const docQty = parseInt(tblQtyInput.value, 10) || 100;
    const total = parseFloat(tblPriceInput.value) || 0;
    const abono = parseFloat(finAbonoInput.value) || 0;
    const saldo = Math.max(0, total - abono);

    const deliveryDate = deliveryDateInput.value;
    const caducidad = caducidadDateInput.value.trim();
    const vigencia = vigenciaLabelInput.value.trim();
    const notes = orderNotesTextarea.value.trim();

    // 1. Compile order object
    const newOrderObj = {
      orderNum,
      timestamp: Date.now(),
      clientName,
      clientRuc,
      clave: clientClave,
      activity: clientActivity,
      clientPhone,
      phoneOpt: selectedPhoneOpt,
      docSize,
      docPaper,
      docName,
      docEst,
      docPto,
      docQty,
      total,
      abono,
      saldo,
      deliveryDate,
      caducidad,
      vigencia,
      notes,
      renovacion: clientRenovacion
    };

    // 2. Save order in storage list
    if (currentEditingOrderNum) {
      // Editing existing order
      const idx = allOrders.findIndex(o => o.orderNum === currentEditingOrderNum);
      if (idx !== -1) {
        allOrders[idx] = newOrderObj;
      }
    } else {
      // New order
      allOrders.push(newOrderObj);
    }
    
    chrome.storage.local.set({ cordova_orders: allOrders }, () => {
      // Reset current editing tracking
      currentEditingOrderNum = null;
      
      // Helper to set text content on all elements matching a class selector
      const setPrtText = (className, text) => {
        document.querySelectorAll('.' + className).forEach(el => el.textContent = text);
      };

      const setPrtHtml = (className, html) => {
        document.querySelectorAll('.' + className).forEach(el => el.innerHTML = html);
      };

      // 3. Populate Print Layout elements (Physical Reference Solicitud Model)
      setPrtText('class-prt-order-num', orderNum.padStart(8, '0'));
      setPrtText('class-prt-client-name', clientName);
      setPrtText('class-prt-clave', clientClave);
      setPrtText('class-prt-activity', clientActivity || 'NINGUNA');
      setPrtText('class-prt-phone', clientPhone ? `${clientPhone} (${selectedPhoneOpt})` : 'S/N');
      setPrtText('class-prt-email', (newOrderObj && newOrderObj.clientEmail) || (typeof order !== 'undefined' && order.clientEmail) || 'S/N');
      setPrtText('class-prt-notes-content', notes || '');

      // Format RUC digit boxes
      const rucClean = clientRuc.padStart(13, '0');
      const rucBoxesHtml = rucClean.split('').map(d => `<span>${d}</span>`).join('');
      setPrtHtml('class-prt-ruc-boxes', rucBoxesHtml);

      // Emision and Delivery times & dates
      const emisionDate = new Date();
      const delivDateParsed = new Date(deliveryDate);
      
      setPrtText('class-prt-time-emision', emisionDate.toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit' }));
      setPrtText('class-prt-time-entrega', delivDateParsed.toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit' }));

      const dayStr = String(emisionDate.getDate()).padStart(2, '0');
      const monthStr = String(emisionDate.getMonth() + 1).padStart(2, '0');
      const yearStr = String(emisionDate.getFullYear()).slice(-2);
      setPrtHtml('class-prt-date-boxes', `${dayStr} | ${monthStr} | ${yearStr}`);

      // Solicitud Document Table Populator
      const solTableBodies = document.querySelectorAll('.class-prt-solicitud-table-body');
      const isQuimico = docPaper === 'Químico';
      const quimicoChk = isQuimico ? '( [✓] [ ] )' : '( [ ] [✓] )';

      const docRowsDef = [
        { key: "Nota de Venta", label: "Nota de Venta", fontBold: true },
        { key: "Guía de Remisión", label: "Guia de Remision", fontBold: false },
        { key: "Nota de Crédito", label: "Nota de Credito", fontBold: false },
        { key: "Liquidación de Compras", label: "Liquidacion de Compras o Prestacion de Servicios", fontBold: false },
        { key: "Recibos", label: "RECIBOS", fontBold: false }
      ];

      solTableBodies.forEach(tbody => {
        let htmlRows = '';
        let matched = false;

        docRowsDef.forEach(item => {
          const isCurrentDoc = docName.toLowerCase().includes(item.key.toLowerCase()) || item.key.toLowerCase().includes(docName.toLowerCase());
          
          if (isCurrentDoc && !matched) {
            matched = true;
            htmlRows += `
              <tr>
                <td class="cell-size" style="font-weight: bold;">${docSize}</td>
                <td class="cell-doc ${item.fontBold ? 'bold' : ''}">${item.label}</td>
                <td class="cell-paper"><span class="capsule-chk">${quimicoChk}</span></td>
                <td class="cell-est">${docEst}</td>
                <td class="cell-pto">${docPto}</td>
                <td class="cell-qty" style="font-weight: bold;">${docQty}</td>
                <td class="cell-price" style="font-weight: bold;">$${total.toFixed(2)}</td>
              </tr>`;
          } else {
            htmlRows += `
              <tr>
                <td class="cell-size"></td>
                <td class="cell-doc ${item.fontBold ? 'bold' : ''}">${item.label}</td>
                <td class="cell-paper"><span class="capsule-chk">( [ ] [ ] )</span></td>
                <td class="cell-est"></td>
                <td class="cell-pto"></td>
                <td class="cell-qty"></td>
                <td class="cell-price"></td>
              </tr>`;
          }
        });

        // Add custom row if doc type didn't match preprinted list
        if (!matched) {
          htmlRows += `
            <tr>
              <td class="cell-size" style="font-weight: bold;">${docSize}</td>
              <td class="cell-doc bold">${docName}</td>
              <td class="cell-paper"><span class="capsule-chk">${quimicoChk}</span></td>
              <td class="cell-est">${docEst}</td>
              <td class="cell-pto">${docPto}</td>
              <td class="cell-qty" style="font-weight: bold;">${docQty}</td>
              <td class="cell-price" style="font-weight: bold;">$${total.toFixed(2)}</td>
            </tr>
            <tr><td></td><td></td><td><span class="capsule-chk">( [ ] [ ] )</span></td><td></td><td></td><td></td><td></td></tr>`;
        } else {
          // 2 blank fallback rows
          htmlRows += `
            <tr><td></td><td></td><td><span class="capsule-chk">( [ ] [ ] )</span></td><td></td><td></td><td></td><td></td></tr>
            <tr><td></td><td></td><td><span class="capsule-chk">( [ ] [ ] )</span></td><td></td><td></td><td></td><td></td></tr>`;
        }

        tbody.innerHTML = htmlRows;
      });

      // Financial display
      setPrtText('class-prt-val-total', `$${total.toFixed(2)}`);
      setPrtText('class-prt-val-abono', `$${abono.toFixed(2)}`);
      setPrtText('class-prt-val-saldo', `$${saldo.toFixed(2)}`);

      // 4. Open Modern A4 Print Selector Modal
      openPrintSelectorModal({
        orderNum: orderNum.padStart(4, '0'),
        clientName: clientName,
        clientRuc: clientRuc,
        clientPhone: clientPhone,
        clientEmail: clientEmail,
        clientActivity: clientActivity,
        clave: clientClave,
        docType: docName,
        paperSize: docSize,
        paperType: docPaper,
        est: docEst,
        pto: docPto,
        qty: docQty,
        price: docPrice,
        total: total,
        abono: abono,
        saldo: saldo,
        detalles: document.getElementById('delivery-date')?.value || ''
      });
    });
  });

  // =================================================================
  // LÓGICA DEL CENTRO DE IMPRESIÓN Y SELECTOR DE 4 FORMATOS A4
  // =================================================================
  const printModal = document.getElementById('print-selector-modal');
  const printCloseX = document.getElementById('print-modal-close-x');
  const printCancelBtn = document.getElementById('print-modal-cancel-btn');
  const printTriggerBtn = document.getElementById('print-modal-trigger-btn');
  const livePreviewContainer = document.getElementById('print-live-preview-container');
  const optionCards = document.querySelectorAll('.print-option-card');
  const orientationRadios = document.querySelectorAll('input[name="print-orientation"]');

  let activePrintFormat = 'recibo';
  let activeOrientation = 'portrait';
  let currentPrintData = null;

  function openPrintSelectorModal(data) {
    currentPrintData = data;
    populateAllPrintTargets(data);
    updateLivePreview();
    if (printModal) printModal.classList.add('active');
  }

  function closePrintSelectorModal() {
    if (printModal) printModal.classList.remove('active');
  }

  if (printCloseX) printCloseX.addEventListener('click', closePrintSelectorModal);
  if (printCancelBtn) printCancelBtn.addEventListener('click', closePrintSelectorModal);

  const printOpenWebBtn = document.getElementById('print-modal-open-web-btn');
  if (printOpenWebBtn) {
    printOpenWebBtn.addEventListener('click', () => {
      if (!currentPrintData) return;
      const params = new URLSearchParams({
        mode: 'sri-moderno',
        orderNum: currentPrintData.orderNum || '',
        ruc: currentPrintData.clientRuc || '',
        name: currentPrintData.clientName || '',
        doc: currentPrintData.docType || '',
        blocks: String(currentPrintData.qty || '100'),
        docSize: currentPrintData.paperSize || '1/4 Oficio',
        est: currentPrintData.est || '001',
        pto: currentPrintData.pto || '001',
        total: String(currentPrintData.total || 0),
        abono: String(currentPrintData.abono || 0),
        saldo: String(currentPrintData.saldo || 0),
        phone: currentPrintData.clientPhone || '',
        actividad: currentPrintData.clientActivity || ''
      });
      window.open(`https://www.imprentacordova.net/#/solicitud-impresion/directo?${params.toString()}`, '_blank');
    });
  }

  const printOpenReciboBtn = document.getElementById('print-modal-open-recibo-btn');
  if (printOpenReciboBtn) {
    printOpenReciboBtn.addEventListener('click', () => {
      if (!currentPrintData) return;
      const params = new URLSearchParams({
        mode: 'comercial-moderno',
        orderNum: currentPrintData.orderNum || '',
        ruc: currentPrintData.clientRuc || '',
        name: currentPrintData.clientName || '',
        doc: currentPrintData.docType || 'Recibo Comercial',
        blocks: String(currentPrintData.qty || '1'),
        docSize: currentPrintData.paperSize || '1/4 Oficio',
        est: currentPrintData.est || '001',
        pto: currentPrintData.pto || '001',
        total: String(currentPrintData.total || 0),
        abono: String(currentPrintData.abono || 0),
        saldo: String(currentPrintData.saldo || 0),
        phone: currentPrintData.clientPhone || '',
        actividad: currentPrintData.clientActivity || ''
      });
      window.open(`https://www.imprentacordova.net/#/recibo-epson/directo?${params.toString()}`, '_blank');
    });
  }

  const printOpenNotaBtn = document.getElementById('print-modal-open-nota-btn');
  if (printOpenNotaBtn) {
    printOpenNotaBtn.addEventListener('click', () => {
      if (!currentPrintData) return;
      const params = new URLSearchParams({
        mode: 'nota-sobre-preimpreso',
        orderNum: currentPrintData.orderNum || '',
        ruc: currentPrintData.clientRuc || '',
        name: currentPrintData.clientName || '',
        doc: currentPrintData.docType || 'Trabajo de Imprenta',
        qty: String(currentPrintData.qty || '1'),
        total: String(currentPrintData.total || 0),
        abono: String(currentPrintData.total || 0),
        saldo: '0.00',
        phone: currentPrintData.clientPhone || '',
        address: currentPrintData.clientAddress || 'Pasaje, El Oro'
      });
      window.open(`https://www.imprentacordova.net/#/nota-de-venta/directo?${params.toString()}`, '_blank');
    });
  }

  // Selector de opciones (chips)
  optionCards.forEach(card => {
    card.addEventListener('click', () => {
      optionCards.forEach(c => c.classList.remove('active'));
      card.classList.add('active');
      activePrintFormat = card.dataset.format;
      const radio = card.querySelector('input[type="radio"]');
      if (radio) radio.checked = true;
      updateLivePreview();
    });
  });

  // Selector de orientación
  orientationRadios.forEach(radio => {
    radio.addEventListener('change', (e) => {
      activeOrientation = e.target.value;
      updateLivePreview();
    });
  });

  // Rellenar datos en todos los contenedores de impresión
  function populateAllPrintTargets(d) {
    if (!d) return;

    const formattedDate = new Date().toLocaleDateString('es-EC', {
      day: '2-digit', month: '2-digit', year: 'numeric'
    });

    const now = new Date();
    const formattedHora = `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;

    // Rellenar textos generales
    document.querySelectorAll('.prt-val-order-num').forEach(el => el.textContent = d.orderNum);
    document.querySelectorAll('.prt-val-date').forEach(el => el.textContent = formattedDate);
    document.querySelectorAll('.prt-val-client-name').forEach(el => el.textContent = d.clientName || 'CONSUMIDOR FINAL');
    document.querySelectorAll('.prt-val-client-ruc').forEach(el => el.textContent = d.clientRuc || '9999999999999');
    document.querySelectorAll('.prt-val-client-phone').forEach(el => el.textContent = d.clientPhone || 'N/A');
    document.querySelectorAll('.prt-val-client-email').forEach(el => el.textContent = d.clientEmail || 'sin_correo@ejemplo.com'); // CORRECCIÓN: EMAIL DEL CLIENTE
    document.querySelectorAll('.prt-val-activity').forEach(el => el.textContent = d.clientActivity || 'COMERCIO Y SERVICIOS');
    document.querySelectorAll('.prt-val-clave').forEach(el => el.textContent = d.clave || '001');

    document.querySelectorAll('.prt-val-doc-type').forEach(el => el.textContent = d.docType || 'Nota de Venta');
    document.querySelectorAll('.prt-val-qty').forEach(el => el.textContent = d.qty || '100');
    document.querySelectorAll('.prt-val-paper-size').forEach(el => el.textContent = d.paperSize || '1/4 Oficio');
    document.querySelectorAll('.prt-val-size-paper').forEach(el => el.textContent = `${d.paperSize || '1/4 Oficio'} / ${d.paperType || 'Químico'}`);
    document.querySelectorAll('.prt-val-est-pto').forEach(el => el.textContent = `${d.est || '001'} - ${d.pto || '001'}`);
    document.querySelectorAll('.prt-val-est').forEach(el => el.textContent = d.est || '001');
    document.querySelectorAll('.prt-val-pto').forEach(el => el.textContent = d.pto || '001');

    document.querySelectorAll('.prt-val-total').forEach(el => el.textContent = parseFloat(d.total || 0).toFixed(2));
    document.querySelectorAll('.prt-val-abono').forEach(el => el.textContent = parseFloat(d.abono || 0).toFixed(2));
    document.querySelectorAll('.prt-val-abono-prev').forEach(el => el.textContent = parseFloat(d.abono || 0).toFixed(2));
    document.querySelectorAll('.prt-val-saldo').forEach(el => el.textContent = parseFloat(d.saldo || 0).toFixed(2));
    document.querySelectorAll('.prt-val-pago-ahora').forEach(el => el.textContent = parseFloat(d.pagoAhora || d.abono || 0).toFixed(2));

    document.querySelectorAll('.prt-val-hora').forEach(el => el.textContent = formattedHora);
    document.querySelectorAll('.prt-val-entrega').forEach(el => el.textContent = '24h Tarde');
    document.querySelectorAll('.prt-val-detalles').forEach(el => el.textContent = d.detalles || 'Ninguno');

    /*
     * Marcado del trámite: Aument. / Cambiar. / Mismo.
     *
     * Antes estaba HARDCODEADO en el HTML, así que SIEMPRE salía "Mismo[✓]", incluso en un
     * talonario nuevo. En la solicitud de autorización ante el SRI ese tilde es lo que declara
     * qué se está pidiendo, así que no puede ser fijo.
     *
     * Ahora el valor viene de la ORDEN: el operador lo declara en el sistema (Nuevo Pedido) y
     * viaja en `tramite_sri`, así que la extensión y el documento imprimen lo mismo.
     *
     * Espejo de `marcadoTramite()` en services/printModels.ts — si cambia uno, cambia el otro.
     * Sin dato → MISMO, que es exactamente lo que el formulario imprimía por el hardcodeo.
     */
    const TRAMITES = [
      { id: 'AUMENTO', label: 'Aument.' },
      { id: 'CAMBIO',  label: 'Cambiar.' },
      { id: 'MISMO',   label: 'Mismo' },
    ];
    const tramiteElegido = TRAMITES.some(t => t.id === d.tramiteSri) ? d.tramiteSri : 'MISMO';
    document.querySelectorAll('.prt-check-tramite').forEach(el => {
      el.textContent = TRAMITES
        .map(t => t.label + (t.id === tramiteElegido ? '[✓]' : '[ ]'))
        .join(' ');
    });

    // Rellenar 13 casillas de RUC
    const rucStr = (d.clientRuc || '0000000000001').padStart(13, '0');
    const rucBoxes = document.querySelectorAll('.prt-ruc-boxes span');
    if (rucBoxes.length >= 13) {
      for (let i = 0; i < 13; i++) {
        rucBoxes[i].textContent = rucStr[i] || '0';
      }
    }

    // Rellenar casillas de fecha (DD / MM / YY)
    const dayStr = String(now.getDate()).padStart(2, '0');
    const monthStr = String(now.getMonth() + 1).padStart(2, '0');
    const yearStr = String(now.getFullYear()).slice(-2);

    const d1 = document.querySelector('.prt-date-boxes .d1');
    const d2 = document.querySelector('.prt-date-boxes .d2');
    const m1 = document.querySelector('.prt-date-boxes .m1');
    const m2 = document.querySelector('.prt-date-boxes .m2');
    const a1 = document.querySelector('.prt-date-boxes .a1');
    const a2 = document.querySelector('.prt-date-boxes .a2');

    if (d1) d1.textContent = dayStr[0];
    if (d2) d2.textContent = dayStr[1];
    if (m1) m1.textContent = monthStr[0];
    if (m2) m2.textContent = monthStr[1];
    if (a1) a1.textContent = yearStr[0];
    if (a2) a2.textContent = yearStr[1];

    // Rellenar QR dinámico de rastreo
    const trackingUrl = `https://www.imprentacordova.net/tracking?orden=${d.orderNum || ''}`;
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(trackingUrl)}`;
    document.querySelectorAll('.prt-qr-img').forEach(el => {
      el.src = qrUrl;
    });
  }

  // Renderizar la vista previa en vivo
  function updateLivePreview() {
    if (!livePreviewContainer) return;

    let targetEl = null;
    if (activePrintFormat === 'recibo') {
      targetEl = document.getElementById('print-target-recibo');
    } else if (activePrintFormat === 'actual') {
      targetEl = document.getElementById('print-target-actual');
    } else if (activePrintFormat === 'formato-llenado') {
      targetEl = document.getElementById('print-target-formato-llenado');
    } else if (activePrintFormat === 'solo-llenado') {
      targetEl = document.getElementById('print-target-solo-llenado');
    }

    if (targetEl) {
      livePreviewContainer.innerHTML = targetEl.innerHTML;
      if (activeOrientation === 'landscape') {
        livePreviewContainer.style.maxWidth = '780px';
        livePreviewContainer.style.transform = 'scale(0.85)';
        livePreviewContainer.style.transformOrigin = 'top center';
      } else {
        livePreviewContainer.style.maxWidth = '680px';
        livePreviewContainer.style.transform = 'scale(0.95)';
        livePreviewContainer.style.transformOrigin = 'top center';
      }
    }
  }

  // Ejecutar impresión física o exportar PDF
  if (printTriggerBtn) {
    printTriggerBtn.addEventListener('click', () => {
      // Limpiar clases previas
      document.body.classList.remove(
        'print-active-recibo',
        'print-active-actual',
        'print-active-formato-llenado',
        'print-active-solo-llenado',
        'print-landscape'
      );

      // Aplicar clases activas
      document.body.classList.add(`print-active-${activePrintFormat}`);
      if (activeOrientation === 'landscape') {
        document.body.classList.add('print-landscape');
      }

      // Disparar diálogo nativo de impresión A4
      setTimeout(() => {
        window.print();
        // Limpiar después de imprimir
        document.body.classList.remove(
          'print-active-recibo',
          'print-active-actual',
          'print-active-formato-llenado',
          'print-active-solo-llenado',
          'print-landscape'
        );
      }, 200);
    });
  }

  // Vincular los botones "📄 PDF" de la tabla de órdenes al nuevo modal
  document.addEventListener('click', (e) => {
    if (e.target && e.target.classList.contains('reg-btn-print')) {
      const orderNum = e.target.dataset.num;
      const orders = JSON.parse(localStorage.getItem('cordova_orders') || '[]');
      const targetOrder = orders.find(o => String(o.orderNum) === String(orderNum));
      
      if (targetOrder) {
        openPrintSelectorModal({
          orderNum: String(targetOrder.orderNum).padStart(4, '0'),
          clientName: targetOrder.clientName,
          clientRuc: targetOrder.clientRuc,
          clientPhone: targetOrder.clientPhone,
          clientEmail: targetOrder.clientEmail,
          clientActivity: targetOrder.activity,
          clave: targetOrder.clave || '001',
          docType: targetOrder.docType || 'Nota de Venta',
          paperSize: targetOrder.paperSize || '1/4 Oficio',
          paperType: targetOrder.paperType || 'Químico',
          est: targetOrder.est || '001',
          pto: targetOrder.pto || '001',
          qty: targetOrder.qty || '100',
          total: targetOrder.total,
          abono: targetOrder.abono,
          saldo: targetOrder.saldo,
          detalles: targetOrder.details || ''
        });
      }
    }
  });

  // Init checking
  checkPendingOrder();
});

