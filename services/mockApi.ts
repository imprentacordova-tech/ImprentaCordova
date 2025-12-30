
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
 * TEST DE CONEXIÓN MAESTRO
 * Diagnostica exactamente por qué falla Google Apps Script
 */
export const testCloudConnection = async (customUrl?: string): Promise<{success: boolean, message: string}> => {
    const config = getConfig();
    const url = customUrl || config.googleScriptUrl;

    if (!url || !url.includes('macros')) {
        return { success: false, message: "La URL no parece ser de Google Apps Script. Debe contener '/macros/s/'." };
    }

    if (url.includes('/edit')) {
        return { success: false, message: "URL INCORRECTA: La URL termina en '/edit'. Debes publicar el script y usar la URL que termina en '/exec'." };
    }

    try {
        // Intento 1: Fetch estándar con seguimiento de redirección
        const response = await fetch(`${url}?action=TEST&ts=${Date.now()}`, {
            method: 'GET',
            redirect: 'follow'
        });

        if (response.ok) {
            try {
                const data = await response.json();
                if (data && data.success) {
                    return { success: true, message: "¡CONEXIÓN PERFECTA! Google Sheets respondió correctamente." };
                }
                return { success: true, message: "CONEXIÓN ESTABLECIDA, pero el script no devolvió el formato JSON esperado. Revisa tu código doGet en Google." };
            } catch (jsonErr) {
                // Si no es JSON, quizás es HTML (error de Google)
                const text = await response.text();
                if (text.includes("Google Drive -- Page Not Found")) {
                    return { success: false, message: "ERROR 404: La URL es válida pero el script no existe o fue borrado." };
                }
                return { success: true, message: "CONEXIÓN ESTABLECIDA, pero la respuesta no es JSON. El script está activo pero mal configurado." };
            }
        }

        if (response.status === 401 || response.status === 403) {
            return { success: false, message: "ERROR DE PERMISOS: Debes configurar 'Who has access' como 'Anyone' al implementar en Google." };
        }

        return { success: false, message: `Error del Servidor: Código ${response.status}.` };

    } catch (e: any) {
        console.error("Error de red en test:", e);
        // El error de Red en Google Apps Script suele ser CORS si no está configurado como 'Anyone'
        return { 
            success: false, 
            message: "BLOQUEO DE RED (CORS): Tu navegador bloqueó la respuesta. Esto sucede si el script NO está publicado para 'Anyone' (Cualquier persona, incluso anónimos)." 
        };
    }
};

const syncToCloud = async (action: string, data: any) => {
    const config = getConfig();
    if (!config.googleScriptUrl || !config.googleScriptUrl.includes('macros')) return;

    try {
        window.dispatchEvent(new CustomEvent('cloud-sync-active'));
        // Usamos mode: 'no-cors' para escritura ciega (evita errores de CORS en POST)
        await fetch(`${config.googleScriptUrl}?ts=${Date.now()}`, {
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
        setTimeout(() => window.dispatchEvent(new CustomEvent('cloud-sync-idle')), 1000);
    } catch (e) {
        window.dispatchEvent(new CustomEvent('cloud-sync-idle'));
    }
};

export const forcePushAllToCloud = async () => {
    const data = {
        trabajos: await getStoredData(TRABAJOS_KEY, []),
        clientes: await getStoredData(CLIENTES_KEY, []),
        productos: await getStoredData(PRODUCTOS_KEY, []),
        users: await getStoredData(USERS_KEY, []),
    };
    await syncToCloud('FULL_BACKUP', data);
    return true;
};

export const hydrateFromCloud = async (): Promise<boolean> => {
    const config = getConfig();
    if (!config.googleScriptUrl || !config.googleScriptUrl.includes('macros')) return false;

    try {
        window.dispatchEvent(new CustomEvent('cloud-sync-active'));
        const response = await fetch(`${config.googleScriptUrl}?action=GET_ALL_DATA&ts=${Date.now()}`, {
            method: 'GET',
            redirect: 'follow',
            cache: 'no-store'
        });
        const data = await response.json();
        if (data && data.success) {
            if (data.trabajos) localStorage.setItem(TRABAJOS_KEY, JSON.stringify(data.trabajos));
            if (data.clientes) localStorage.setItem(CLIENTES_KEY, JSON.stringify(data.clientes));
            if (data.productos) localStorage.setItem(PRODUCTOS_KEY, JSON.stringify(data.productos));
            if (data.users) localStorage.setItem(USERS_KEY, JSON.stringify(data.users));
            window.dispatchEvent(new CustomEvent('cloud-sync-idle'));
            return true;
        }
    } catch (e) {
        console.error(e);
    }
    window.dispatchEvent(new CustomEvent('cloud-sync-idle'));
    return false;
};

const getStoredData = async <T>(key: string, defaultValue: T): Promise<T> => {
    const item = localStorage.getItem(key);
    if (item) {
        try { return JSON.parse(item); } catch (e) { console.error(`Error parseando ${key}`); }
    }
    return defaultValue;
};

const setStoredData = async <T>(key: string, value: T): Promise<void> => {
    localStorage.setItem(key, JSON.stringify(value));
};

// --- PRODUCTOS ---
export const getProductos = async (): Promise<Producto[]> => getStoredData(PRODUCTOS_KEY, []);

export const seed50Products = async () => {
    const list: Partial<Producto>[] = [
        { nombre: 'FACTURAS (1/4 OFICIO - BLOCK X 50H - DUPLICADO)', categoria: 'SRI', precio: 15.00, esSRI: true },
        { nombre: 'NOTAS DE VENTA (1/4 OFICIO - BLOCK X 50H - ÚNICO)', categoria: 'SRI', precio: 10.00, esSRI: true },
        { nombre: 'TARJETAS PERSONALES (COUCHÉ 300G - BRILLO UV - X1000)', categoria: 'PUBLICIDAD', precio: 40.00, esSRI: false },
        { nombre: 'GIGANTOGRAFÍA LONA 13OZ (M2)', categoria: 'GRAN FORMATO', precio: 10.00, esSRI: false },
        { nombre: 'ROLL UP COMPLETO (80X200CM)', categoria: 'GRAN FORMATO', precio: 45.00, esSRI: false },
        { nombre: 'TAZA PERSONALIZADA BLANCA', categoria: 'MERCH', precio: 5.00, esSRI: false },
        { nombre: 'SELLO AUTOMÁTICO TRODAT 4911', categoria: 'OFICINA', precio: 15.00, esSRI: false },
        ...Array.from({ length: 43 }).map((_, i) => ({
            nombre: `SERVICIO DE IMPRESIÓN #${i + 8} (PERSONALIZADO)`,
            categoria: 'OTROS',
            precio: 5 + i,
            esSRI: false
        }))
    ];
    const finalProducts = list.map((p, idx) => ({ id: `p-auto-${idx}`, descripcion: `Producto catálogo Córdova 2025.`, ...p })) as Producto[];
    await setStoredData(PRODUCTOS_KEY, finalProducts);
    await syncToCloud('BULK_SEED_PRODUCTS', finalProducts);
    return finalProducts;
};

export const updateProducto = async (id: string, p: Partial<Producto>) => {
    const data = await getProductos();
    const idx = data.findIndex(i => i.id === id);
    if (idx > -1) {
        data[idx] = { ...data[idx], ...p };
        await setStoredData(PRODUCTOS_KEY, data);
        await syncToCloud('UPDATE_PRODUCT', data[idx]);
    }
};

export const createProducto = async (p: any) => {
    const data = await getProductos();
    const newP = { id: `p${Date.now()}`, ...p };
    data.push(newP);
    await setStoredData(PRODUCTOS_KEY, data);
    await syncToCloud('CREATE_PRODUCT', newP);
    return newP;
};

export const bulkCreateProductos = async (newProducts: Producto[]) => {
    const data = await getProductos();
    const withIds = newProducts.map(p => ({ ...p, id: `p${Date.now()}-${Math.random().toString(36).substring(2, 7)}` }));
    const updated = [...data, ...withIds];
    await setStoredData(PRODUCTOS_KEY, updated);
    await syncToCloud('BULK_CREATE_PRODUCTS', withIds);
};

export const deleteProducto = async (id: string) => {
    const data = await getProductos();
    const filtered = data.filter(i => i.id !== id);
    await setStoredData(PRODUCTOS_KEY, filtered);
    await syncToCloud('DELETE_PRODUCT', { id });
};

export const getClientes = async (): Promise<Cliente[]> => getStoredData(CLIENTES_KEY, []);
export const createCliente = async (clienteData: any): Promise<Cliente> => {
    const clientes = await getClientes();
    const newCliente = { id: `c${Date.now()}`, creadoEn: new Date().toISOString(), ...clienteData };
    clientes.unshift(newCliente);
    await setStoredData(CLIENTES_KEY, clientes);
    await syncToCloud('CREATE_CLIENT', newCliente);
    return newCliente;
};

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
    await syncToCloud('CREATE_WORK', newTrabajo);
    return newTrabajo;
};

export const updateTrabajoStatus = async (trabajoId: string, newStatus: TrabajoEstado, usuario: string): Promise<Trabajo> => {
    const trabajos = await getTrabajos();
    const index = trabajos.findIndex(t => t.id === trabajoId);
    if (index > -1) {
        trabajos[index].estado = newStatus;
        trabajos[index].actualizadoPor = usuario;
        trabajos[index].historial = [...(trabajos[index].historial || []), { estado: newStatus, fecha: new Date().toISOString(), usuario }];
        await setStoredData(TRABAJOS_KEY, trabajos);
        await syncToCloud('UPDATE_STATUS', trabajos[index]);
        return trabajos[index];
    }
    throw new Error("No encontrado");
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

export const getMasterActividades = async (): Promise<string[]> => getStoredData(ACTIVIDADES_MASTER_KEY, ["VENTA DE COMIDAS", "SERVICIOS PROFESIONALES"]);
export const getUsers = async (): Promise<User[]> => getStoredData(USERS_KEY, [{ id: 'u1', nombre: 'Pedro', email: 'imprentacordova@gmail.com', rol: 'Admin', estado: 'Activo', ultimoAcceso: new Date().toISOString() }]);
export const getInventario = async (): Promise<InventoryItem[]> => getStoredData(INVENTARIO_KEY, []);
export const getProveedores = async (): Promise<Proveedor[]> => getStoredData(PROVEEDORES_KEY, []);
export const getTareasProveedor = async (): Promise<TareaProveedor[]> => getStoredData(TAREAS_KEY, []);
export const getSriCredentials = async (): Promise<SriCredential[]> => getStoredData(SRI_KEYS_KEY, []);

export const updateCliente = async (id: string, data: any) => {
    const clientes = await getClientes();
    const index = clientes.findIndex(c => c.id === id);
    if (index > -1) {
        clientes[index] = { ...clientes[index], ...data };
        await setStoredData(CLIENTES_KEY, clientes);
        await syncToCloud('UPDATE_CLIENT', clientes[index]);
    }
};

export const bulkAddSriCredentials = async (creds: SriCredential[]) => {
    const data = await getSriCredentials();
    const updated = [...data];
    creds.forEach(newCred => {
        const idx = updated.findIndex(c => c.ruc === newCred.ruc);
        if (idx > -1) updated[idx] = { ...updated[idx], ...newCred };
        else updated.push(newCred);
    });
    await setStoredData(SRI_KEYS_KEY, updated);
    return updated;
};

export const deleteSriCredential = async (ruc: string) => {
    const data = await getSriCredentials();
    const filtered = data.filter(c => c.ruc !== ruc);
    await setStoredData(SRI_KEYS_KEY, filtered);
};

export const updateTrabajoPhoto = async (trabajoId: string, photoUrl: string): Promise<void> => {
    const trabajos = await getTrabajos();
    const index = trabajos.findIndex(t => t.id === trabajoId);
    if (index > -1) {
        trabajos[index].fotoOriginalUrl = photoUrl;
        await setStoredData(TRABAJOS_KEY, trabajos);
    }
};

export const createPublicPedido = async (clientData: any, cartItems: any[]): Promise<Trabajo> => {
    const total = cartItems.reduce((acc, item) => acc + (item.producto.precio * item.cantidad), 0);
    const subtipo = cartItems.map(item => `${item.cantidad}x ${item.producto.nombre}`).join(', ');
    return createTrabajo({ titular: clientData.nombre, tipo: TrabajoTipo.GENERAL, subtipo, cantidad: cartItems.length, total, abono: 0, estado: TrabajoEstado.PENDIENTE, origen: 'Web' }, 'Usuario Web');
};

export const updateUser = async (id: string, u: any) => {
    const data = await getUsers();
    const idx = data.findIndex(i => i.id === id);
    if (idx > -1) {
        data[idx] = { ...data[idx], ...u };
        await setStoredData(USERS_KEY, data);
    }
};

export const createInventarioItem = async (item: Omit<InventoryItem, 'id'>) => {
    const data = await getInventario();
    const newItem = { id: `inv${Date.now()}`, ...item };
    data.push(newItem);
    await setStoredData(INVENTARIO_KEY, data);
    await syncToCloud('CREATE_INVENTARIO', newItem);
    return newItem;
};

export const updateInventarioItem = async (id: string, item: Partial<InventoryItem>) => {
    const data = await getInventario();
    const idx = data.findIndex(i => i.id === id);
    if (idx > -1) {
        data[idx] = { ...data[idx], ...item };
        await setStoredData(INVENTARIO_KEY, data);
        await syncToCloud('UPDATE_INVENTARIO', data[idx]);
    }
};

export const deleteInventarioItem = async (id: string) => {
    const data = await getInventario();
    const filtered = data.filter(i => i.id !== id);
    await setStoredData(INVENTARIO_KEY, filtered);
};

export const setInventario = async (items: InventoryItem[]) => {
    await setStoredData(INVENTARIO_KEY, items);
};

export const createUser = async (u: any) => {
    const data = await getUsers();
    const newUser = { id: `u${Date.now()}`, estado: 'Activo' as const, ultimoAcceso: new Date().toISOString(), ...u };
    data.push(newUser);
    await setStoredData(USERS_KEY, data);
    return newUser;
};

export const addSriCredential = async (cred: SriCredential) => {
    const data = await getSriCredentials();
    const idx = data.findIndex(c => c.ruc === cred.ruc);
    if (idx > -1) data[idx] = { ...data[idx], ...cred };
    else data.push({ ...cred, updatedAt: new Date().toISOString() });
    await setStoredData(SRI_KEYS_KEY, data);
    return data;
};

export const createProveedor = async (p: Omit<Proveedor, 'id' | 'creadoEn'>) => {
    const data = await getProveedores();
    const newP: Proveedor = { id: `prov${Date.now()}`, creadoEn: new Date().toISOString(), ...p };
    data.unshift(newP);
    await setStoredData(PROVEEDORES_KEY, data);
    return newP;
};

export const updateProveedor = async (id: string, p: Partial<Proveedor>) => {
    const data = await getProveedores();
    const idx = data.findIndex(i => i.id === id);
    if (idx > -1) {
        data[idx] = { ...data[idx], ...p };
        await setStoredData(PROVEEDORES_KEY, data);
    }
};

export const deleteProveedor = async (id: string) => {
    const data = await getProveedores();
    const filtered = data.filter(i => i.id !== id);
    await setStoredData(PROVEEDORES_KEY, filtered);
};

export const createTareaProveedor = async (t: Omit<TareaProveedor, 'id' | 'completada'>) => {
    const data = await getTareasProveedor();
    const newT: TareaProveedor = { id: `task${Date.now()}`, completada: false, ...t };
    data.push(newT);
    await setStoredData(TAREAS_KEY, data);
    return newT;
};

export const updateTareaProveedor = async (id: string, t: Partial<TareaProveedor>) => {
    const data = await getTareasProveedor();
    const idx = data.findIndex(i => i.id === id);
    if (idx > -1) {
        data[idx] = { ...data[idx], ...t };
        await setStoredData(TAREAS_KEY, data);
    }
};
