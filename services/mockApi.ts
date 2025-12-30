
import { Cliente, Producto, Regimen, Trabajo, TrabajoEstado, TrabajoTipo, User, InventoryItem, Proveedor, TareaProveedor, SriCredential, StatusLog } from '../types';
import { getConfig } from './configService';

// LLAVES DE LOCALSTORAGE
const TRABAJOS_KEY = 'mockTrabajosData';
const CLIENTES_KEY = 'mockClientesData';
const PRODUCTOS_KEY = 'mockProductosData';
const USERS_KEY = 'mockUsersData';
const INVENTARIO_KEY = 'mockInventarioData';
const PROVEEDORES_KEY = 'mockProveedoresData';
const SRI_KEYS_KEY = 'mockSriKeysData';
const TAREAS_KEY = 'mockTareasData';
const ACTIVIDADES_MASTER_KEY = 'mockActividadesMaster';

/**
 * MOTOR DE SINCRONIZACIÓN NUBE (Google Sheets / Drive)
 * Envía cada operación al script de Google configurado.
 */
const syncToCloud = async (action: string, data: any) => {
    const config = getConfig();
    // Validamos que exista una URL configurada
    if (config.googleScriptUrl && config.googleScriptUrl.includes('macros')) {
        try {
            // No-cors es necesario para evitar bloqueos del navegador al redirigir a Google
            await fetch(config.googleScriptUrl, {
                method: 'POST',
                mode: 'no-cors',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    action, 
                    payload: data, 
                    source: 'ERP_CORDOVA_2025',
                    timestamp: new Date().toISOString() 
                })
            });
            console.log(`☁️ Cloud Sync [${action}]: Éxito.`);
        } catch (e) {
            console.warn("⚠️ Error en Sincronización Nube. Datos guardados solo localmente.", e);
        }
    }
};

const getStoredData = async <T>(key: string, defaultValue: T): Promise<T> => {
    const item = localStorage.getItem(key);
    if (item) {
        try {
            return JSON.parse(item);
        } catch (e) {
            console.error(`Error al parsear ${key}`, e);
        }
    }
    return defaultValue;
};

const setStoredData = async <T>(key: string, value: T): Promise<void> => {
    localStorage.setItem(key, JSON.stringify(value));
};

// --- GESTIÓN DE ACTIVIDADES MAESTRAS (DATABASE) ---
export const getMasterActividades = async (): Promise<string[]> => {
    return getStoredData(ACTIVIDADES_MASTER_KEY, [
        "VENTA DE ROPA", 
        "SERVICIOS PROFESIONALES", 
        "TRANSPORTE DE CARGA",
        "VENTA DE COMIDAS Y BEBIDAS",
        "ALQUILER DE BIENES INMUEBLES",
        "SERVICIOS DE DISEÑO GRÁFICO"
    ]);
};

export const addMasterActividades = async (nuevas: string[]) => {
    const actuales = await getMasterActividades();
    const limpias = nuevas.map(a => a.toUpperCase().trim()).filter(a => a.length > 3);
    const unicas = Array.from(new Set([...actuales, ...limpias]));
    await setStoredData(ACTIVIDADES_MASTER_KEY, unicas);
};

// --- API DE TRABAJOS ---
export const getTrabajos = async (): Promise<Trabajo[]> => getStoredData(TRABAJOS_KEY, []);

export const createTrabajo = async (trabajoData: any, usuario: string): Promise<Trabajo> => {
    const trabajos = await getTrabajos();
    const config = getConfig();
    const lastSequence = trabajos.length > 0 ? Math.max(...trabajos.map(t => t.orden)) : config.secuencialInicio - 1;
    const nextSequence = Math.max(lastSequence + 1, config.secuencialInicio);

    const newTrabajo: Trabajo = {
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
    await setStoredData(TRABAJOS_KEY, trabajos);
    
    // Sync Nube
    await syncToCloud('CREATE_WORK', newTrabajo);
    
    return newTrabajo;
};

export const updateTrabajoStatus = async (trabajoId: string, newStatus: TrabajoEstado, usuario: string): Promise<Trabajo> => {
    const trabajos = await getTrabajos();
    const index = trabajos.findIndex(t => t.id === trabajoId);
    if (index > -1) {
        const log: StatusLog = { estado: newStatus, fecha: new Date().toISOString(), usuario };
        trabajos[index].estado = newStatus;
        trabajos[index].actualizadoPor = usuario;
        trabajos[index].historial = [...(trabajos[index].historial || []), log];
        await setStoredData(TRABAJOS_KEY, trabajos);
        
        await syncToCloud('UPDATE_STATUS', trabajos[index]);
        return trabajos[index];
    }
    throw new Error("No encontrado");
};

// --- API DE CLIENTES ---
export const getClientes = async (): Promise<Cliente[]> => getStoredData(CLIENTES_KEY, []);

export const createCliente = async (clienteData: any): Promise<Cliente> => {
    const clientes = await getClientes();
    const newCliente = { id: `c${Date.now()}`, creadoEn: new Date().toISOString(), ...clienteData };
    clientes.unshift(newCliente);
    await setStoredData(CLIENTES_KEY, clientes);
    
    // Coleccionamos las actividades detectadas para la base de datos global
    if (clienteData.actividades) {
        const tags = clienteData.actividades.split('|');
        await addMasterActividades(tags);
    }
    
    await syncToCloud('CREATE_CLIENT', newCliente);
    return newCliente;
};

export const registerRetiro = async (id: string, pago: number, user: string) => {
    const trabajos = await getTrabajos();
    const idx = trabajos.findIndex(t => t.id === id);
    if (idx > -1) {
        trabajos[idx].estado = TrabajoEstado.ENTREGADO;
        trabajos[idx].abono += pago;
        trabajos[idx].saldo = 0;
        await setStoredData(TRABAJOS_KEY, trabajos);
        
        await syncToCloud('REGISTER_RETIRE', trabajos[idx]);
        return trabajos[idx];
    }
    throw new Error("No encontrado");
};

// --- RESTO DE FUNCIONES MANTENIDAS ---
export const getProductos = async (): Promise<Producto[]> => getStoredData(PRODUCTOS_KEY, []);
export const getUsers = async (): Promise<User[]> => getStoredData(USERS_KEY, []);
export const getInventario = async (): Promise<InventoryItem[]> => getStoredData(INVENTARIO_KEY, []);
export const getProveedores = async (): Promise<Proveedor[]> => getStoredData(PROVEEDORES_KEY, []);
export const getSriCredentials = async (): Promise<SriCredential[]> => getStoredData(SRI_KEYS_KEY, []);
export const getTareasProveedor = async (): Promise<TareaProveedor[]> => getStoredData(TAREAS_KEY, []);

export const updateCliente = async (id: string, data: any) => {
    const clientes = await getClientes();
    const index = clientes.findIndex(c => c.id === id);
    if (index > -1) {
        clientes[index] = { ...clientes[index], ...data };
        await setStoredData(CLIENTES_KEY, clientes);
        await syncToCloud('UPDATE_CLIENT', clientes[index]);
    }
};

export const updateTrabajoPhoto = async (trabajoId: string, photoUrl: string): Promise<void> => {
    const trabajos = await getTrabajos();
    const index = trabajos.findIndex(t => t.id === trabajoId);
    if (index > -1) {
        trabajos[index].fotoOriginalUrl = photoUrl;
        await setStoredData(TRABAJOS_KEY, trabajos);
        await syncToCloud('UPDATE_PHOTO', trabajos[index]);
    }
};

export const createPublicPedido = async (clientData: any, cartItems: { producto: Producto; cantidad: number }[]): Promise<Trabajo> => {
    const total = cartItems.reduce((acc, item) => acc + (item.producto.precio * item.cantidad), 0);
    const subtipo = cartItems.map(item => `${item.cantidad}x ${item.producto.nombre}`).join(', ');
    const quantity = cartItems.reduce((acc, item) => acc + item.cantidad, 0);

    const newTrabajo = await createTrabajo({
        titular: clientData.nombre,
        tipo: clientData.tipoDocumento === 'SRI' ? TrabajoTipo.SRI : TrabajoTipo.GENERAL,
        subtipo,
        cantidad: quantity,
        total,
        abono: 0,
        estado: TrabajoEstado.PENDIENTE,
        origen: 'Web'
    }, 'Usuario Web');

    return newTrabajo;
};

// ... Resto de la API mantenida igual ...
export const createInventarioItem = async (item: any) => {
    const data = await getInventario();
    const newItem = { id: `i${Date.now()}`, ...item };
    data.push(newItem);
    await setStoredData(INVENTARIO_KEY, data);
    return newItem;
};
export const updateInventarioItem = async (id: string, item: any) => {
    const data = await getInventario();
    const idx = data.findIndex(i => i.id === id);
    if (idx > -1) {
        data[idx] = { ...data[idx], ...item };
        await setStoredData(INVENTARIO_KEY, data);
    }
};
export const deleteInventarioItem = async (id: string) => {
    let data = await getInventario();
    data = data.filter(i => i.id !== id);
    await setStoredData(INVENTARIO_KEY, data);
};
export const setInventario = async (items: any[]) => {
    await setStoredData(INVENTARIO_KEY, items);
};
export const createProducto = async (p: any) => {
    const data = await getProductos();
    const newP = { id: `p${Date.now()}`, ...p };
    data.push(newP);
    await setStoredData(PRODUCTOS_KEY, data);
    return newP;
};
export const bulkCreateProductos = async (products: any[]) => {
    const data = await getProductos();
    const newProducts = products.map((p, idx) => ({ id: `p${Date.now()}-${idx}`, ...p }));
    const updated = [...data, ...newProducts];
    await setStoredData(PRODUCTOS_KEY, updated);
    return newProducts;
};
export const updateProducto = async (id: string, p: any) => {
    const data = await getProductos();
    const idx = data.findIndex(i => i.id === id);
    if (idx > -1) {
        data[idx] = { ...data[idx], ...p };
        await setStoredData(PRODUCTOS_KEY, data);
    }
};
export const deleteProducto = async (id: string) => {
    let data = await getProductos();
    data = data.filter(i => i.id !== id);
    await setStoredData(PRODUCTOS_KEY, data);
};
export const createUser = async (u: any) => {
    const data = await getUsers();
    const newU = { id: `u${Date.now()}`, ...u };
    data.push(newU);
    await setStoredData(USERS_KEY, data);
    return newU;
};
export const updateUser = async (id: string, u: any) => {
    const data = await getUsers();
    const idx = data.findIndex(i => i.id === id);
    if (idx > -1) {
        data[idx] = { ...data[idx], ...u };
        await setStoredData(USERS_KEY, data);
    }
};
export const createProveedor = async (p: any) => {
    const data = await getProveedores();
    const newP = { id: `prov${Date.now()}`, creadoEn: new Date().toISOString(), ...p };
    data.push(newP);
    await setStoredData(PROVEEDORES_KEY, data);
    return newP;
};
export const updateProveedor = async (id: string, p: any) => {
    const data = await getProveedores();
    const idx = data.findIndex(i => i.id === id);
    if (idx > -1) {
        data[idx] = { ...data[idx], ...p };
        await setStoredData(PROVEEDORES_KEY, data);
    }
};
export const deleteProveedor = async (id: string) => {
    let data = await getProveedores();
    data = data.filter(i => i.id !== id);
    await setStoredData(PROVEEDORES_KEY, data);
};
export const createTareaProveedor = async (t: any) => {
    const data = await getTareasProveedor();
    const newT = { id: `t${Date.now()}`, completada: false, ...t };
    data.push(newT);
    await setStoredData(TAREAS_KEY, data);
    return newT;
};
export const updateTareaProveedor = async (id: string, t: any) => {
    const data = await getTareasProveedor();
    const idx = data.findIndex(i => i.id === id);
    if (idx > -1) {
        data[idx] = { ...data[idx], ...t };
        await setStoredData(TAREAS_KEY, data);
    }
};
export const addSriCredential = async (cred: SriCredential): Promise<SriCredential[]> => {
    const creds = await getSriCredentials();
    const updated = [...creds.filter(c => c.ruc !== cred.ruc), { ...cred, updatedAt: new Date().toISOString() }];
    await setStoredData(SRI_KEYS_KEY, updated);
    return updated;
};
export const bulkAddSriCredentials = async (newCreds: SriCredential[]): Promise<SriCredential[]> => {
    let creds = await getSriCredentials();
    const rucMap = new Map(creds.map(c => [c.ruc, c]));
    newCreds.forEach(c => {
        rucMap.set(c.ruc, { ...c, updatedAt: new Date().toISOString() });
    });
    const updated = Array.from(rucMap.values());
    await setStoredData(SRI_KEYS_KEY, updated);
    return updated;
};
export const deleteSriCredential = async (ruc: string): Promise<SriCredential[]> => {
    let creds = await getSriCredentials();
    creds = creds.filter(c => c.ruc !== ruc);
    await setStoredData(SRI_KEYS_KEY, creds);
    return creds;
};
