
import { Cliente, Producto, Regimen, Trabajo, TrabajoEstado, TrabajoTipo, User, InventoryItem, Proveedor, TareaProveedor, SriCredential } from '../types';
import { VALID_USERS } from '../constants';

// ============================================================================
// ☁️ CONFIGURACIÓN DE LA NUBE (GOOGLE SHEETS)
// ============================================================================

const HARDCODED_URL = "https://script.google.com/macros/s/AKfycbz9BrIG8s1h5spiy3H2OQVInN4lODW6VJ50-SmGBajjIQ2jbgzBl-65-_6XF7IYRluM/exec";

const getScriptUrl = () => {
  try {
    // @ts-ignore
    if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_URL_SCRIPT_DE_GOOGLE) {
        // @ts-ignore
        return import.meta.env.VITE_URL_SCRIPT_DE_GOOGLE;
    }
  } catch (e) {}
  return HARDCODED_URL;
};

const GOOGLE_SCRIPT_URL = getScriptUrl();

// ============================================================================
// 🔄 SISTEMA DE SINCRONIZACIÓN HÍBRIDO (CACHE + NUBE)
// ============================================================================

const getStoredData = async <T>(key: string, defaultValue: T): Promise<T> => {
    let localData = defaultValue;
    try {
        const item = localStorage.getItem(key);
        if (item) localData = JSON.parse(item);
    } catch (e) { console.warn("Error lectura local", e); }

    if (!GOOGLE_SCRIPT_URL || !GOOGLE_SCRIPT_URL.startsWith('http')) {
        return localData;
    }

    try {
        const response = await fetch(`${GOOGLE_SCRIPT_URL}?action=get&key=${key}`);
        const text = await response.text();
        let json;
        try {
            json = JSON.parse(text);
        } catch (e) {
            return localData;
        }
        
        if (json.status === 'success' && json.data) {
            localStorage.setItem(key, JSON.stringify(json.data));
            return json.data as T;
        }
    } catch (error) { }

    return localData;
};

const setStoredData = async <T>(key: string, value: T): Promise<void> => {
    try {
        localStorage.setItem(key, JSON.stringify(value));
    } catch (e) { console.error("Error escritura local", e); }

    if (!GOOGLE_SCRIPT_URL || !GOOGLE_SCRIPT_URL.startsWith('http')) return;

    try {
        await fetch(GOOGLE_SCRIPT_URL, {
            method: 'POST',
            mode: 'no-cors', 
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'save', key: key, data: value })
        });
    } catch (error) {
        console.error(`☁️ Error guardando en Google Cloud [${key}]:`, error);
    }
};

// --- KEYS DE BASE DE DATOS ---
const TRABAJOS_KEY = 'mockTrabajosData';
const CLIENTES_KEY = 'mockClientesData';
const PRODUCTOS_KEY = 'mockProductosData';
const USERS_KEY = 'mockUsersData';
const INVENTARIO_KEY = 'mockInventarioData';
const PROVEEDORES_KEY = 'mockProveedoresData';
const TAREAS_PROVEEDOR_KEY = 'mockTareasProveedorData';
const SRI_KEYS_KEY = 'mockSriKeysData';

// --- DATOS POR DEFECTO (CATÁLOGO MEJORADO IMPRENTA CÓRDOVA) ---
const daysAgo = (days: number) => {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date.toISOString();
}

const defaultProductos: Producto[] = [
  // --- SRI: FACTURAS (Solo Régimen General / Emprendedor) ---
  { id: 'sri_fac_1', nombre: 'Facturas (1/4 Oficio - 1 Block 100h)', descripcion: 'Autocopiativo Original y Copia', precio: 18.00, categoria: 'SRI - Facturación', esSRI: true },
  { id: 'sri_fac_2', nombre: 'Facturas (1/2 Oficio - 1 Block 100h)', descripcion: 'Autocopiativo Original y Copia', precio: 25.00, categoria: 'SRI - Facturación', esSRI: true },
  { id: 'sri_fac_3', nombre: 'Facturas (A4 - 1 Block 100h)', descripcion: 'Autocopiativo Original y Copia', precio: 35.00, categoria: 'SRI - Facturación', esSRI: true },
  { id: 'sri_fac_4', nombre: 'Facturas (Oficio - 1 Block 100h)', descripcion: 'Autocopiativo Original y Copia', precio: 38.00, categoria: 'SRI - Facturación', esSRI: true },

  // --- SRI: NOTAS DE VENTA (Solo RIMPE Popular) ---
  { id: 'sri_nv_1', nombre: 'Notas de Venta (1/4 Oficio - 1 Block 100h)', descripcion: 'Autocopiativo. Exclusivo RIMPE Popular', precio: 18.00, categoria: 'SRI - Notas Venta', esSRI: true },
  { id: 'sri_nv_2', nombre: 'Notas de Venta (1/2 Oficio - 1 Block 100h)', descripcion: 'Autocopiativo. Exclusivo RIMPE Popular', precio: 25.00, categoria: 'SRI - Notas Venta', esSRI: true },

  // --- SRI: OTROS DOCUMENTOS ---
  { id: 'sri_ret_1', nombre: 'Retenciones (A5 - 1 Block 100h)', descripcion: 'Autocopiativo', precio: 22.00, categoria: 'SRI - Otros', esSRI: true },
  { id: 'sri_guia_1', nombre: 'Guías de Remisión (1/2 Oficio - 1 Block)', descripcion: 'Autocopiativo', precio: 25.00, categoria: 'SRI - Otros', esSRI: true },
  { id: 'sri_liq_1', nombre: 'Liquidación de Compra (A4 - 1 Block)', descripcion: 'Autocopiativo', precio: 35.00, categoria: 'SRI - Otros', esSRI: true },

  // --- TARJETERÍA ---
  { id: 'tar_1', nombre: 'Tarjetas de Presentación (1000 u. Couché Brillante)', descripcion: 'Impresión ambos lados, UV Total', precio: 35.00, categoria: 'Tarjetería', esSRI: false },
  { id: 'tar_2', nombre: 'Tarjetas de Presentación (1000 u. Mate + UV)', descripcion: 'Laminado mate con reserva UV', precio: 45.00, categoria: 'Tarjetería', esSRI: false },
  { id: 'tar_3', nombre: 'Tarjetas de Presentación (100 u. Digital Express)', descripcion: 'Entrega mismo día. Cartulina 300g', precio: 15.00, categoria: 'Tarjetería', esSRI: false },
  { id: 'tar_4', nombre: 'Tarjetas de Invitación (Boda/Evento - Lujo)', descripcion: 'Papel fino, relieve, sobre personalizado', precio: 1.50, categoria: 'Tarjetería', esSRI: false },
  
  // --- PUBLICIDAD Y PROMOCIÓN ---
  { id: 'pub_1', nombre: 'Volantes (A6 1000 u. Couché 115g)', descripcion: 'Full color ambos lados', precio: 30.00, categoria: 'Publicidad', esSRI: false },
  { id: 'pub_2', nombre: 'Volantes (A5 1000 u. Couché 115g)', descripcion: 'Full color ambos lados', precio: 55.00, categoria: 'Publicidad', esSRI: false },
  { id: 'pub_3', nombre: 'Trípticos (1000 u. A4 Abierto)', descripcion: 'Couché 150g, doblados', precio: 120.00, categoria: 'Publicidad', esSRI: false },
  { id: 'pub_4', nombre: 'Etiquetas Adhesivas (Pliego A3)', descripcion: 'Troqueladas listas para usar', precio: 1.50, categoria: 'Publicidad', esSRI: false },

  // --- GRAN FORMATO ---
  { id: 'gf_1', nombre: 'Lona Publicitaria (Metro Cuadrado)', descripcion: 'Impresión Roland 1440dpi', precio: 10.00, categoria: 'Gran Formato', esSRI: false },
  { id: 'gf_2', nombre: 'Roll Up Banner (85x200cm)', descripcion: 'Estructura aluminio + Lona instalada', precio: 65.00, categoria: 'Gran Formato', esSRI: false },
  { id: 'gf_3', nombre: 'Vinil Adhesivo (Metro Cuadrado)', descripcion: 'Laminado Mate o Brillo opcional', precio: 12.00, categoria: 'Gran Formato', esSRI: false },
  { id: 'gf_4', nombre: 'Microperforado (Metro Cuadrado)', descripcion: 'Para vidrios y vehículos', precio: 15.00, categoria: 'Gran Formato', esSRI: false },

  // --- SUBLIMACIÓN Y TEXTIL ---
  { id: 'sub_1', nombre: 'Taza (Blanca Personalizada)', descripcion: 'Cerámica AAA', precio: 6.00, categoria: 'Sublimación', esSRI: false },
  { id: 'sub_2', nombre: 'Taza (Mágica Negra a Color)', descripcion: 'Revela imagen con calor', precio: 8.00, categoria: 'Sublimación', esSRI: false },
  { id: 'sub_3', nombre: 'Gorra (Camionera Logo Full Color)', descripcion: 'Varios colores disponibles', precio: 7.00, categoria: 'Sublimación', esSRI: false },
  { id: 'sub_4', nombre: 'Camiseta (Publicitaria Poliester)', descripcion: 'Blanca, tacto algodón', precio: 9.00, categoria: 'Sublimación', esSRI: false },

  // --- OFICINA Y VARIOS ---
  { id: 'ofi_1', nombre: 'Recibos de Caja (Block 100h)', descripcion: 'Papel bond, 1 color', precio: 4.50, categoria: 'Oficina', esSRI: false },
  { id: 'ofi_2', nombre: 'Sellos (Automáticos Trodat/Shiny)', descripcion: 'Personalizado con logo', precio: 15.00, categoria: 'Oficina', esSRI: false },
  { id: 'ofi_3', nombre: 'Empastado Tesis (Tapa Dura)', descripcion: 'Letras doradas/plateadas', precio: 25.00, categoria: 'Oficina', esSRI: false },
  { id: 'ofi_4', nombre: 'Sobres Membretados (Oficio - 100 u.)', descripcion: 'Papel bond 90g full color', precio: 25.00, categoria: 'Oficina', esSRI: false },
  
  // --- JUEGOS Y EVENTOS ---
  { id: 'ev_1', nombre: 'Tablas de Bingo (Ciento)', descripcion: 'Papel bond color o cartulina', precio: 8.00, categoria: 'Eventos', esSRI: false },
  { id: 'ev_2', nombre: 'Rifas Numeradas (Millar)', descripcion: 'Talonario con numeración y troquel', precio: 35.00, categoria: 'Eventos', esSRI: false },
  { id: 'ev_3', nombre: 'Tickets Evento (Millar)', descripcion: 'Papel seguridad o couché', precio: 40.00, categoria: 'Eventos', esSRI: false },
  { id: 'ev_4', nombre: 'Calendarios (Pared 30x40cm)', descripcion: 'Varilla metálica, Full Color', precio: 1.50, categoria: 'Eventos', esSRI: false },
  { id: 'ev_5', nombre: 'Calendarios (Mesa Triangular)', descripcion: 'Base dura, anillado', precio: 3.50, categoria: 'Eventos', esSRI: false },
];

const defaultClientes: Cliente[] = [
  { id: 'c1', cedula: '1792233445001', ruc: '1792233445001', nombre: 'Comercial La Ganga', telefono: ['0991234567'], creadoEn: '2023-01-15T00:00:00Z', regimen: Regimen.GENERAL },
];

const defaultTrabajos: Trabajo[] = [];

const defaultUsers: User[] = [
  { id: 'u1', nombre: 'Pedro', email: 'pedro@imprenta.com', rol: 'Admin', estado: 'Activo', ultimoAcceso: daysAgo(0), requirePassword: true, password: 'admin' },
];

const defaultSriCredentials: SriCredential[] = [
    { ruc: "1234567890001", password: "ClaveSegura123", origen: "Manual" },
];

const defaultInventario: InventoryItem[] = [];
const defaultProveedores: Proveedor[] = [];
const defaultTareasProveedor: TareaProveedor[] = [];

// --- API FUNCTIONS ---

export const getTrabajos = async (): Promise<Trabajo[]> => getStoredData(TRABAJOS_KEY, defaultTrabajos);
export const getClientes = async (): Promise<Cliente[]> => getStoredData(CLIENTES_KEY, defaultClientes);
export const getProductos = async (): Promise<Producto[]> => getStoredData(PRODUCTOS_KEY, defaultProductos);
export const getUsers = async (): Promise<User[]> => getStoredData(USERS_KEY, defaultUsers);
export const getInventario = async (): Promise<InventoryItem[]> => getStoredData(INVENTARIO_KEY, defaultInventario);
export const getProveedores = async (): Promise<Proveedor[]> => getStoredData(PROVEEDORES_KEY, defaultProveedores);
export const getTareasProveedor = async (): Promise<TareaProveedor[]> => getStoredData(TAREAS_PROVEEDOR_KEY, defaultTareasProveedor);

// SRI CREDENTIALS FUNCTIONS
export const getSriCredentials = async (): Promise<SriCredential[]> => {
    const rawData = await getStoredData(SRI_KEYS_KEY, defaultSriCredentials);
    if (rawData.length > 0 && typeof rawData[0] === 'string') {
        const migrated = (rawData as unknown as string[]).map(k => ({ ruc: k, password: '', origen: 'Legacy' }));
        await setStoredData(SRI_KEYS_KEY, migrated);
        return migrated;
    }
    return rawData as SriCredential[];
};

export const addSriCredential = async (cred: SriCredential): Promise<SriCredential[]> => {
    const creds = await getSriCredentials();
    const index = creds.findIndex(c => c.ruc === cred.ruc);
    if (index > -1) {
        creds[index] = { ...creds[index], ...cred, updatedAt: new Date().toISOString() };
    } else {
        creds.push({ ...cred, updatedAt: new Date().toISOString() });
    }
    await setStoredData(SRI_KEYS_KEY, creds);
    return creds;
};

export const bulkAddSriCredentials = async (newCreds: SriCredential[]): Promise<SriCredential[]> => {
    const currentCreds = await getSriCredentials();
    const credMap = new Map(currentCreds.map(c => [c.ruc, c]));
    newCreds.forEach(cred => {
        credMap.set(cred.ruc, { ...cred, updatedAt: new Date().toISOString() });
    });
    const updatedList = Array.from(credMap.values());
    await setStoredData(SRI_KEYS_KEY, updatedList);
    return updatedList;
};

export const deleteSriCredential = async (ruc: string): Promise<SriCredential[]> => {
    let creds = await getSriCredentials();
    creds = creds.filter(c => c.ruc !== ruc);
    await setStoredData(SRI_KEYS_KEY, creds);
    return creds;
};

export const updateTrabajoStatus = async (trabajoId: string, newStatus: TrabajoEstado, usuario: string): Promise<Trabajo> => {
    const trabajos = await getStoredData(TRABAJOS_KEY, defaultTrabajos);
    const index = trabajos.findIndex(t => t.id === trabajoId);
    if (index > -1) {
        trabajos[index].estado = newStatus;
        trabajos[index].actualizadoPor = usuario;
        await setStoredData(TRABAJOS_KEY, trabajos);
        return trabajos[index];
    }
    throw new Error("Trabajo no encontrado");
};

export const createTrabajo = async (trabajoData: any, usuario: string): Promise<Trabajo> => {
    const trabajos = await getStoredData(TRABAJOS_KEY, defaultTrabajos);
    const newTrabajo: Trabajo = {
        id: String(Date.now()),
        orden: Math.max(...trabajos.map(t => t.orden), 1000) + 1,
        ...trabajoData,
        fechaEntrada: new Date().toISOString(),
        caduco: false,
        creadoPor: usuario,
        origen: 'Interno',
        saldo: trabajoData.total - trabajoData.abono
    };
    trabajos.unshift(newTrabajo);
    await setStoredData(TRABAJOS_KEY, trabajos);
    return newTrabajo;
};

export const createPublicPedido = async (clienteInfo: any, productos: any): Promise<boolean> => {
     const clientes = await getStoredData(CLIENTES_KEY, defaultClientes);
    let cliente = clientes.find(c => 
        (clienteInfo.ruc && c.ruc === clienteInfo.ruc) || 
        (clienteInfo.ruc && c.cedula === clienteInfo.ruc) ||
        c.telefono.includes(clienteInfo.telefono)
    );
    
    if (!cliente) {
        cliente = {
            id: `c${Date.now()}`,
            cedula: clienteInfo.ruc || '9999999999',
            ruc: clienteInfo.ruc,
            nombre: clienteInfo.nombre,
            telefono: [clienteInfo.telefono],
            email: clienteInfo.email,
            direccion: clienteInfo.direccion,
            creadoEn: new Date().toISOString(),
            regimen: clienteInfo.regimen || Regimen.GENERAL
        };
        clientes.unshift(cliente);
        await setStoredData(CLIENTES_KEY, clientes);
    }

    const trabajos = await getStoredData(TRABAJOS_KEY, defaultTrabajos);
    const total = productos.reduce((sum: number, item: any) => sum + (item.producto.precio * item.cantidad), 0);
    const descripcion = productos.map((p: any) => `${p.cantidad}x ${p.producto.nombre}`).join(', ');

    const newTrabajo: Trabajo = {
        id: `web${Date.now()}`,
        orden: Math.max(...trabajos.map(t => t.orden), 1000) + 1,
        clienteId: cliente.id,
        titular: `${clienteInfo.nombre} (WEB)`,
        tipo: clienteInfo.tipoDocumento === 'SRI' ? TrabajoTipo.SRI : TrabajoTipo.GENERAL,
        subtipo: descripcion,
        cantidad: productos.reduce((sum: number, p: any) => sum + p.cantidad, 0),
        tamano: 'Varios',
        total: total,
        abono: 0, 
        saldo: total,
        estado: TrabajoEstado.PENDIENTE,
        fechaEntrada: new Date().toISOString(),
        caduco: false,
        creadoPor: 'Cliente Web',
        origen: 'Web'
    };
    
    trabajos.unshift(newTrabajo);
    await setStoredData(TRABAJOS_KEY, trabajos);
    return true;
};

export const createCliente = async (clienteData: any): Promise<Cliente> => {
    const clientes = await getStoredData(CLIENTES_KEY, defaultClientes);
    const newCliente = { id: `c${Date.now()}`, creadoEn: new Date().toISOString(), ...clienteData };
    clientes.unshift(newCliente);
    await setStoredData(CLIENTES_KEY, clientes);
    return newCliente;
};

export const updateCliente = async (id: string, data: any) => {
    const clientes = await getStoredData(CLIENTES_KEY, defaultClientes);
    const index = clientes.findIndex(c => c.id === id);
    if (index > -1) {
        clientes[index] = { ...clientes[index], ...data };
        await setStoredData(CLIENTES_KEY, clientes);
    }
};

export const updateTrabajoPhoto = async (id: string, url: string) => {
    const trabajos = await getStoredData(TRABAJOS_KEY, defaultTrabajos);
    const index = trabajos.findIndex(t => t.id === id);
    if(index > -1) {
        trabajos[index].fotoOriginalUrl = url;
        await setStoredData(TRABAJOS_KEY, trabajos);
        return trabajos[index];
    }
    throw new Error("Trabajo no encontrado");
};

export const createProducto = async (p: any) => {
    const prods = await getStoredData(PRODUCTOS_KEY, defaultProductos);
    const newP = { id: `p${Date.now()}`, ...p };
    prods.unshift(newP);
    await setStoredData(PRODUCTOS_KEY, prods);
    return newP;
};

export const updateProducto = async (id: string, p: any) => {
     const prods = await getStoredData(PRODUCTOS_KEY, defaultProductos);
     const idx = prods.findIndex(pr => pr.id === id);
     if(idx > -1) {
         prods[idx] = { ...prods[idx], ...p };
         await setStoredData(PRODUCTOS_KEY, prods);
     }
};

export const deleteProducto = async (id: string) => {
    let prods = await getStoredData(PRODUCTOS_KEY, defaultProductos);
    prods = prods.filter(p => p.id !== id);
    await setStoredData(PRODUCTOS_KEY, prods);
    return true;
};

export const createUser = async (u: any) => {
    const users = await getStoredData(USERS_KEY, defaultUsers);
    const newU = { id: `u${Date.now()}`, ultimoAcceso: new Date().toISOString(), ...u };
    users.unshift(newU);
    await setStoredData(USERS_KEY, users);
    return newU;
};

export const updateUser = async (id: string, u: any) => {
    const users = await getStoredData(USERS_KEY, defaultUsers);
    const idx = users.findIndex(us => us.id === id);
    if (idx > -1) {
        users[idx] = { ...users[idx], ...u };
        await setStoredData(USERS_KEY, users);
    }
};

export const registerRetiro = async (id: string, pago: number, user: string) => {
    const trabajos = await getTrabajos();
    const idx = trabajos.findIndex(t => t.id === id);
    if (idx > -1) {
        trabajos[idx].estado = TrabajoEstado.ENTREGADO;
        trabajos[idx].abono += pago;
        trabajos[idx].saldo = 0;
        trabajos[idx].actualizadoPor = user;
        await setStoredData(TRABAJOS_KEY, trabajos);
        return trabajos[idx];
    }
    throw new Error("Trabajo no encontrado");
}

export const createInventarioItem = async (i: any) => {
    const items = await getInventario();
    const newI = { id: `inv${Date.now()}`, ...i };
    items.unshift(newI);
    await setStoredData(INVENTARIO_KEY, items);
    return newI;
}

export const updateInventarioItem = async (id: string, data: any) => {
    const items = await getInventario();
    const idx = items.findIndex(i => i.id === id);
    if (idx > -1) {
        items[idx] = { ...items[idx], ...data };
        await setStoredData(INVENTARIO_KEY, items);
    }
}

export const deleteInventarioItem = async (id: string) => {
    let items = await getInventario();
    items = items.filter(i => i.id !== id);
    await setStoredData(INVENTARIO_KEY, items);
}

export const setInventario = async (items: InventoryItem[]) => {
    await setStoredData(INVENTARIO_KEY, items);
}

export const createProveedor = async (p: any) => {
    const provs = await getProveedores();
    const newP = { id: `prov${Date.now()}`, creadoEn: new Date().toISOString(), ...p };
    provs.unshift(newP);
    await setStoredData(PROVEEDORES_KEY, provs);
    return newP;
}

export const updateProveedor = async (id: string, p: any) => {
    const provs = await getProveedores();
    const idx = provs.findIndex(pr => pr.id === id);
    if (idx > -1) {
        provs[idx] = { ...provs[idx], ...p };
        await setStoredData(PROVEEDORES_KEY, provs);
    }
}

export const deleteProveedor = async (id: string) => {
    let provs = await getProveedores();
    provs = provs.filter(p => p.id !== id);
    await setStoredData(PROVEEDORES_KEY, provs);
    return true;
}

export const createTareaProveedor = async (t: any) => {
    const tareas = await getTareasProveedor();
    const newT = { id: `t${Date.now()}`, completada: false, ...t };
    tareas.unshift(newT);
    await setStoredData(TAREAS_PROVEEDOR_KEY, tareas);
    return newT;
}

export const updateTareaProveedor = async (id: string, t: any) => {
    const tareas = await getTareasProveedor();
    const idx = tareas.findIndex(ta => ta.id === id);
    if (idx > -1) {
        tareas[idx] = { ...tareas[idx], ...t };
        await setStoredData(TAREAS_PROVEEDOR_KEY, tareas);
    }
}
