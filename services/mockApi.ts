
import { Cliente, Producto, Regimen, Trabajo, TrabajoEstado, TrabajoTipo, User, InventoryItem, Proveedor, TareaProveedor, SriCredential, StatusLog } from '../types';
import { getConfig } from './configService';

// LLAVES DE LOCALSTORAGE
const DB_MAP = {
    trabajos: 'mockTrabajosData',
    clientes: 'mockClientesData',
    productos: 'mockProductosData',
    users: 'mockUsersData',
    inventario: 'mockInventarioData',
    proveedores: 'mockProveedoresData',
    sri: 'mockSriKeysData',
    tareas: 'mockTareasData'
};

/**
 * TEST DE CONEXIÓN
 */
export const testCloudConnection = async (customUrl?: string): Promise<{success: boolean, message: string}> => {
    const config = getConfig();
    const url = customUrl || config.googleScriptUrl;
    if (!url || !url.includes('macros')) return { success: false, message: "URL inválida." };

    try {
        const response = await fetch(`${url}?action=TEST&ts=${Date.now()}`, { method: 'GET', redirect: 'follow' });
        const data = await response.json();
        return data.success ? { success: true, message: "✅ ¡CONEXIÓN PERFECTA!" } : { success: false, message: "Error en el script." };
    } catch (e) {
        return { success: false, message: "Fallo de red o URL incorrecta." };
    }
};

/**
 * MOTOR DE SINCRONIZACIÓN AUTOMÁTICA
 * Envía todo el estado actual al Google Sheet
 */
export const forcePushAllToCloud = async () => {
    const config = getConfig();
    if (!config.googleScriptUrl || !config.googleScriptUrl.includes('macros')) return;

    try {
        window.dispatchEvent(new CustomEvent('cloud-sync-active'));
        
        const dataToExport = {
            trabajos: JSON.parse(localStorage.getItem(DB_MAP.trabajos) || '[]'),
            clientes: JSON.parse(localStorage.getItem(DB_MAP.clientes) || '[]'),
            productos: JSON.parse(localStorage.getItem(DB_MAP.productos) || '[]'),
            users: JSON.parse(localStorage.getItem(DB_MAP.users) || '[]'),
            inventario: JSON.parse(localStorage.getItem(DB_MAP.inventario) || '[]'),
            proveedores: JSON.parse(localStorage.getItem(DB_MAP.proveedores) || '[]'),
            tareas: JSON.parse(localStorage.getItem(DB_MAP.tareas) || '[]')
        };

        await fetch(config.googleScriptUrl, {
            method: 'POST',
            mode: 'no-cors',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                action: 'FULL_BACKUP', 
                payload: dataToExport,
                timestamp: new Date().toISOString() 
            })
        });

        setTimeout(() => window.dispatchEvent(new CustomEvent('cloud-sync-idle')), 800);
    } catch (e) {
        window.dispatchEvent(new CustomEvent('cloud-sync-idle'));
        console.error("Auto-sync failed", e);
    }
};

export const hydrateFromCloud = async (): Promise<boolean> => {
    const config = getConfig();
    if (!config.googleScriptUrl || !config.googleScriptUrl.includes('macros')) return false;

    try {
        window.dispatchEvent(new CustomEvent('cloud-sync-active'));
        const response = await fetch(`${config.googleScriptUrl}?action=GET_ALL_DATA&ts=${Date.now()}`, {
            method: 'GET',
            redirect: 'follow'
        });
        const data = await response.json();
        if (data && data.success) {
            if (data.trabajos) localStorage.setItem(DB_MAP.trabajos, JSON.stringify(data.trabajos));
            if (data.clientes) localStorage.setItem(DB_MAP.clientes, JSON.stringify(data.clientes));
            if (data.productos) localStorage.setItem(DB_MAP.productos, JSON.stringify(data.productos));
            if (data.users) localStorage.setItem(DB_MAP.users, JSON.stringify(data.users));
            if (data.inventario) localStorage.setItem(DB_MAP.inventario, JSON.stringify(data.inventario));
            if (data.proveedores) localStorage.setItem(DB_MAP.proveedores, JSON.stringify(data.proveedores));
            if (data.tareas) localStorage.setItem(DB_MAP.tareas, JSON.stringify(data.tareas));
            window.dispatchEvent(new CustomEvent('cloud-sync-idle'));
            return true;
        }
    } catch (e) {}
    window.dispatchEvent(new CustomEvent('cloud-sync-idle'));
    return false;
};

// Helpers de acceso
const getRaw = (key: string) => JSON.parse(localStorage.getItem(key) || '[]');
const setRaw = (key: string, data: any) => {
    localStorage.setItem(key, JSON.stringify(data));
    forcePushAllToCloud(); // <-- AQUÍ ESTÁ LA MAGIA: Guardado automático inmediato
};

// --- API IMPLEMENTATION CON AUTO-SAVE ---

export const getProductos = async (): Promise<Producto[]> => getRaw(DB_MAP.productos);
export const createProducto = async (p: any) => {
    const data = getRaw(DB_MAP.productos);
    const newP = { id: `p${Date.now()}`, ...p };
    data.push(newP);
    setRaw(DB_MAP.productos, data);
    return newP;
};
export const updateProducto = async (id: string, p: Partial<Producto>) => {
    const data = getRaw(DB_MAP.productos);
    const idx = data.findIndex((i: any) => i.id === id);
    if (idx > -1) { data[idx] = { ...data[idx], ...p }; setRaw(DB_MAP.productos, data); }
};
export const deleteProducto = async (id: string) => {
    const data = getRaw(DB_MAP.productos);
    setRaw(DB_MAP.productos, data.filter((i: any) => i.id !== id));
};
export const bulkCreateProductos = async (newProducts: Producto[]) => {
    const data = getRaw(DB_MAP.productos);
    const withIds = newProducts.map(p => ({ ...p, id: `p${Date.now()}-${Math.random().toString(36).substring(2, 7)}` }));
    setRaw(DB_MAP.productos, [...data, ...withIds]);
};

export const getClientes = async (): Promise<Cliente[]> => getRaw(DB_MAP.clientes);
export const createCliente = async (clienteData: any): Promise<Cliente> => {
    const clientes = getRaw(DB_MAP.clientes);
    const newCliente = { id: `c${Date.now()}`, creadoEn: new Date().toISOString(), ...clienteData };
    clientes.unshift(newCliente);
    setRaw(DB_MAP.clientes, clientes);
    return newCliente;
};
export const updateCliente = async (id: string, data: any) => {
    const clientes = getRaw(DB_MAP.clientes);
    const idx = clientes.findIndex((c: any) => c.id === id);
    if (idx > -1) { clientes[idx] = { ...clientes[idx], ...data }; setRaw(DB_MAP.clientes, clientes); }
};

export const getTrabajos = async (): Promise<Trabajo[]> => getRaw(DB_MAP.trabajos);
export const createTrabajo = async (trabajoData: any, usuario: string): Promise<Trabajo> => {
    const trabajos = getRaw(DB_MAP.trabajos);
    const config = getConfig();
    const lastSequence = trabajos.length > 0 ? Math.max(...trabajos.map((t: any) => t.orden)) : config.secuencialInicio - 1;
    const nextSequence = Math.max(lastSequence + 1, config.secuencialInicio);
    const newTrabajo = {
        id: String(Date.now()),
        orden: nextSequence,
        ...trabajoData,
        fechaEntrada: new Date().toISOString(),
        caduco: false,
        creadoPor: usuario,
        saldo: (trabajoData.total || 0) - (trabajoData.abono || 0),
        historial: [{ estado: TrabajoEstado.PENDIENTE, fecha: new Date().toISOString(), usuario }]
    };
    trabajos.unshift(newTrabajo);
    setRaw(DB_MAP.trabajos, trabajos);
    return newTrabajo;
};

export const updateTrabajoStatus = async (trabajoId: string, newStatus: TrabajoEstado, usuario: string): Promise<Trabajo> => {
    const trabajos = getRaw(DB_MAP.trabajos);
    const idx = trabajos.findIndex((t: any) => t.id === trabajoId);
    if (idx > -1) {
        trabajos[idx].estado = newStatus;
        trabajos[idx].actualizadoPor = usuario;
        trabajos[idx].historial = [...(trabajos[idx].historial || []), { estado: newStatus, fecha: new Date().toISOString(), usuario }];
        setRaw(DB_MAP.trabajos, trabajos);
        return trabajos[idx];
    }
    throw new Error("No encontrado");
};

export const registerRetiro = async (id: string, pago: number, user: string) => {
    const trabajos = getRaw(DB_MAP.trabajos);
    const idx = trabajos.findIndex((t: any) => t.id === id);
    if (idx > -1) {
        trabajos[idx].estado = TrabajoEstado.ENTREGADO;
        trabajos[idx].abono += pago;
        trabajos[idx].saldo = 0;
        setRaw(DB_MAP.trabajos, trabajos);
        return trabajos[idx];
    }
    throw new Error("No encontrado");
};

// Inventario, Usuarios y Proveedores con Auto-save
export const getUsers = async (): Promise<User[]> => getRaw(DB_MAP.users).length ? getRaw(DB_MAP.users) : [{ id: 'u1', nombre: 'Pedro', email: 'imprentacordova@gmail.com', rol: 'Admin', estado: 'Activo', ultimoAcceso: new Date().toISOString() }];
export const createUser = async (u: any) => {
    const data = getRaw(DB_MAP.users);
    const newUser = { id: `u${Date.now()}`, estado: 'Activo', ultimoAcceso: new Date().toISOString(), ...u };
    data.push(newUser);
    setRaw(DB_MAP.users, data);
    return newUser;
};
export const updateUser = async (id: string, u: any) => {
    const data = getRaw(DB_MAP.users);
    const idx = data.findIndex((i: any) => i.id === id);
    if (idx > -1) { data[idx] = { ...data[idx], ...u }; setRaw(DB_MAP.users, data); }
};

export const getInventario = async (): Promise<InventoryItem[]> => getRaw(DB_MAP.inventario);
export const createInventarioItem = async (item: any) => {
    const data = getRaw(DB_MAP.inventario);
    const newItem = { id: `inv${Date.now()}`, ...item };
    data.push(newItem);
    setRaw(DB_MAP.inventario, data);
    return newItem;
};
export const updateInventarioItem = async (id: string, item: any) => {
    const data = getRaw(DB_MAP.inventario);
    const idx = data.findIndex((i: any) => i.id === id);
    if (idx > -1) { data[idx] = { ...data[idx], ...item }; setRaw(DB_MAP.inventario, data); }
};
export const deleteInventarioItem = async (id: string) => {
    const data = getRaw(DB_MAP.inventario);
    setRaw(DB_MAP.inventario, data.filter((i: any) => i.id !== id));
};

export const getProveedores = async (): Promise<Proveedor[]> => getRaw(DB_MAP.proveedores);
export const createProveedor = async (p: any) => {
    const data = getRaw(DB_MAP.proveedores);
    const newP = { id: `prov${Date.now()}`, creadoEn: new Date().toISOString(), ...p };
    data.unshift(newP);
    setRaw(DB_MAP.proveedores, data);
    return newP;
};
export const updateProveedor = async (id: string, p: any) => {
    const data = getRaw(DB_MAP.proveedores);
    const idx = data.findIndex((i: any) => i.id === id);
    if (idx > -1) { data[idx] = { ...data[idx], ...p }; setRaw(DB_MAP.proveedores, data); }
};
export const deleteProveedor = async (id: string) => {
    const data = getRaw(DB_MAP.proveedores);
    setRaw(DB_MAP.proveedores, data.filter((i: any) => i.id !== id));
};

export const getTareasProveedor = async (): Promise<TareaProveedor[]> => getRaw(DB_MAP.tareas);
export const createTareaProveedor = async (t: any) => {
    const data = getRaw(DB_MAP.tareas);
    const newT = { id: `task${Date.now()}`, completada: false, ...t };
    data.push(newT);
    setRaw(DB_MAP.tareas, data);
    return newT;
};
export const updateTareaProveedor = async (id: string, t: any) => {
    const data = getRaw(DB_MAP.tareas);
    const idx = data.findIndex((i: any) => i.id === id);
    if (idx > -1) { data[idx] = { ...data[idx], ...t }; setRaw(DB_MAP.tareas, data); }
};

// SRI y Otros
export const getSriCredentials = async (): Promise<SriCredential[]> => getRaw(DB_MAP.sri);
export const addSriCredential = async (cred: SriCredential) => {
    const data = getRaw(DB_MAP.sri);
    const idx = data.findIndex((c: any) => c.ruc === cred.ruc);
    if (idx > -1) data[idx] = { ...data[idx], ...cred };
    else data.push({ ...cred, updatedAt: new Date().toISOString() });
    setRaw(DB_MAP.sri, data);
    return data;
};
export const bulkAddSriCredentials = async (creds: SriCredential[]) => {
    const data = getRaw(DB_MAP.sri);
    const updated = [...data];
    creds.forEach(newCred => {
        const idx = updated.findIndex((c: any) => c.ruc === newCred.ruc);
        if (idx > -1) updated[idx] = { ...updated[idx], ...newCred };
        else updated.push(newCred);
    });
    setRaw(DB_MAP.sri, updated);
    return updated;
};
export const deleteSriCredential = async (ruc: string) => {
    const data = getRaw(DB_MAP.sri);
    setRaw(DB_MAP.sri, data.filter((c: any) => c.ruc !== ruc));
};

export const updateTrabajoPhoto = async (trabajoId: string, photoUrl: string): Promise<void> => {
    const trabajos = getRaw(DB_MAP.trabajos);
    const idx = trabajos.findIndex((t: any) => t.id === trabajoId);
    if (idx > -1) { trabajos[idx].fotoOriginalUrl = photoUrl; setRaw(DB_MAP.trabajos, trabajos); }
};
export const createPublicPedido = async (clientData: any, cartItems: any[]): Promise<Trabajo> => {
    const total = cartItems.reduce((acc, item) => acc + (item.producto.precio * item.cantidad), 0);
    const subtipo = cartItems.map(item => `${item.cantidad}x ${item.producto.nombre}`).join(', ');
    return createTrabajo({ titular: clientData.nombre, tipo: TrabajoTipo.GENERAL, subtipo, cantidad: cartItems.length, total, abono: 0, estado: TrabajoEstado.PENDIENTE, origen: 'Web' }, 'Usuario Web');
};
export const getMasterActividades = async (): Promise<string[]> => ["VENTA DE COMIDAS", "SERVICIOS PROFESIONALES", "TRANSPORTE", "EDUCACION", "SALUD"];
export const setInventario = async (items: InventoryItem[]) => setRaw(DB_MAP.inventario, items);
export const seed50Products = async () => {
    const list = [
        { nombre: 'FACTURAS (1/4 OFICIO - BLOCK X 50H - DUPLICADO)', categoria: 'SRI', precio: 15.00, esSRI: true },
        { nombre: 'NOTAS DE VENTA (1/4 OFICIO - BLOCK X 50H - ÚNICO)', categoria: 'SRI', precio: 10.00, esSRI: true },
        { nombre: 'TARJETAS PERSONALES (COUCHÉ 300G - BRILLO UV - X1000)', categoria: 'PUBLICIDAD', precio: 40.00, esSRI: false }
    ];
    const final = list.map((p, idx) => ({ id: `p-auto-${idx}`, descripcion: `Producto Córdova 2025.`, ...p })) as Producto[];
    setRaw(DB_MAP.productos, final);
    return final;
};
