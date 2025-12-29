
import { Cliente, Producto, Regimen, Trabajo, TrabajoEstado, TrabajoTipo, User, InventoryItem, Proveedor, TareaProveedor, SriCredential, StatusLog } from '../types';

// URL del Google Apps Script configurado por el usuario
const getScriptUrl = () => {
    const savedConfig = localStorage.getItem('appConfig');
    if (savedConfig) {
        const config = JSON.parse(savedConfig);
        if (config.googleScriptUrl) return config.googleScriptUrl;
    }
    return "https://script.google.com/macros/s/AKfycbz9BrIG8s1h5spiy3H2OQVInN4lODW6VJ50-SmGBajjIQ2jbgzBl-65-_6XF7IYRluM/exec";
};

const callGoogleScript = async (action: string, payload?: any) => {
    const url = getScriptUrl();
    try {
        await fetch(url, {
            method: 'POST',
            mode: 'no-cors', 
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action, ...payload })
        });
        return true;
    } catch (e) {
        console.error("Error al sincronizar con Google Sheets:", e);
        return false;
    }
};

const getStoredData = async <T>(key: string, defaultValue: T): Promise<T> => {
    let localData = defaultValue;
    const item = localStorage.getItem(key);
    if (item) {
        try {
            const parsed = JSON.parse(item);
            if (parsed && (!Array.isArray(parsed) || parsed.length > 0)) {
                localData = parsed;
            }
        } catch (e) {
            console.error(`Error al parsear ${key}`, e);
        }
    }
    return localData;
};

const setStoredData = async <T>(key: string, value: T): Promise<void> => {
    localStorage.setItem(key, JSON.stringify(value));
};

const TRABAJOS_KEY = 'mockTrabajosData';
const CLIENTES_KEY = 'mockClientesData';
const PRODUCTOS_KEY = 'mockProductosData';
const USERS_KEY = 'mockUsersData';
const INVENTARIO_KEY = 'mockInventarioData';
const PROVEEDORES_KEY = 'mockProveedoresData';
const SRI_KEYS_KEY = 'mockSriKeysData';
const TAREAS_KEY = 'mockTareasData';

export const getTrabajos = async (): Promise<Trabajo[]> => getStoredData(TRABAJOS_KEY, []);
export const getClientes = async (): Promise<Cliente[]> => getStoredData(CLIENTES_KEY, []);
export const getProductos = async (): Promise<Producto[]> => getStoredData(PRODUCTOS_KEY, []);
export const getUsers = async (): Promise<User[]> => getStoredData(USERS_KEY, []);
export const getInventario = async (): Promise<InventoryItem[]> => getStoredData(INVENTARIO_KEY, []);
export const getProveedores = async (): Promise<Proveedor[]> => getStoredData(PROVEEDORES_KEY, []);
export const getSriCredentials = async (): Promise<SriCredential[]> => getStoredData(SRI_KEYS_KEY, []);
export const getTareasProveedor = async (): Promise<TareaProveedor[]> => getStoredData(TAREAS_KEY, []);

export const addSriCredential = async (cred: SriCredential): Promise<SriCredential[]> => {
    const creds = await getSriCredentials();
    const updated = [...creds.filter(c => c.ruc !== cred.ruc), { ...cred, updatedAt: new Date().toISOString() }];
    await setStoredData(SRI_KEYS_KEY, updated);
    await callGoogleScript('save_sri_key', { data: cred });
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
    await callGoogleScript('bulk_save_sri_keys', { data: newCreds });
    return updated;
};

export const deleteSriCredential = async (ruc: string): Promise<SriCredential[]> => {
    let creds = await getSriCredentials();
    creds = creds.filter(c => c.ruc !== ruc);
    await setStoredData(SRI_KEYS_KEY, creds);
    await callGoogleScript('delete_sri_key', { ruc });
    return creds;
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
        await callGoogleScript('update_job_status', { id: trabajoId, status: newStatus, user: usuario });
        return trabajos[index];
    }
    throw new Error("No encontrado");
};

/**
 * Fix: Added updateTrabajoPhoto to handle visual reference attachments in KDS.
 */
export const updateTrabajoPhoto = async (id: string, photoUrl: string): Promise<void> => {
    const trabajos = await getTrabajos();
    const index = trabajos.findIndex(t => t.id === id);
    if (index > -1) {
        trabajos[index].fotoOriginalUrl = photoUrl;
        await setStoredData(TRABAJOS_KEY, trabajos);
        await callGoogleScript('update_job_photo', { id, photoUrl });
    }
};

export const createTrabajo = async (trabajoData: any, usuario: string): Promise<Trabajo> => {
    const trabajos = await getTrabajos();
    const log: StatusLog = { estado: TrabajoEstado.PENDIENTE, fecha: new Date().toISOString(), usuario };
    const newTrabajo: Trabajo = {
        id: String(Date.now()),
        orden: (trabajos.length > 0 ? Math.max(...trabajos.map(t => t.orden)) : 1000) + 1,
        ...trabajoData,
        fechaEntrada: new Date().toISOString(),
        caduco: false,
        creadoPor: usuario,
        origen: 'Interno',
        estadoClave: trabajoData.estadoClave || 'PENDIENTE',
        imprimirClave: trabajoData.imprimirClave || false,
        saldo: (trabajoData.total || 0) - (trabajoData.abono || 0),
        historial: [log]
    };
    trabajos.unshift(newTrabajo);
    await setStoredData(TRABAJOS_KEY, trabajos);
    await callGoogleScript('create_job', { data: newTrabajo });
    return newTrabajo;
};

/**
 * Fix: Added createPublicPedido to handle orders from the landing page.
 */
export const createPublicPedido = async (clientData: any, cartItems: any[]): Promise<void> => {
    const cliente = await createCliente(clientData);
    const total = cartItems.reduce((acc, item) => acc + (item.producto.price || item.producto.precio) * item.cantidad, 0);
    await createTrabajo({
        clienteId: cliente.id,
        titular: cliente.nombre,
        tipo: clientData.tipoDocumento === 'SRI' ? TrabajoTipo.SRI : TrabajoTipo.GENERAL,
        subtipo: cartItems.map(i => `${i.cantidad}x ${i.producto.nombre}`).join(', '),
        cantidad: cartItems.reduce((acc, i) => acc + i.cantidad, 0),
        total: total,
        abono: 0,
        estado: TrabajoEstado.PENDIENTE,
        origen: 'Web'
    }, 'Cliente Web');
};

export const createCliente = async (clienteData: any): Promise<Cliente> => {
    const clientes = await getClientes();
    const newCliente = { id: `c${Date.now()}`, creadoEn: new Date().toISOString(), ...clienteData };
    clientes.unshift(newCliente);
    await setStoredData(CLIENTES_KEY, clientes);
    await callGoogleScript('create_client', { data: newCliente });
    return newCliente;
};

export const updateCliente = async (id: string, data: any) => {
    const clientes = await getClientes();
    const index = clientes.findIndex(c => c.id === id);
    if (index > -1) {
        clientes[index] = { ...clientes[index], ...data };
        await setStoredData(CLIENTES_KEY, clientes);
        await callGoogleScript('update_client', { id, data });
    }
};

export const registerRetiro = async (id: string, pago: number, user: string) => {
    const trabajos = await getTrabajos();
    const idx = trabajos.findIndex(t => t.id === id);
    if (idx > -1) {
        trabajos[idx].estado = TrabajoEstado.ENTREGADO;
        trabajos[idx].abono += pago;
        trabajos[idx].saldo = 0;
        await setStoredData(TRABAJOS_KEY, trabajos);
        await callGoogleScript('register_payment', { id, amount: pago, user });
        return trabajos[idx];
    }
    throw new Error("No encontrado");
};

/**
 * Fix: Added Inventory CRUD functions to resolve errors in Inventario.tsx.
 */
export const createInventarioItem = async (item: Omit<InventoryItem, 'id'>): Promise<InventoryItem> => {
    const inventario = await getInventario();
    const newItem = { id: `i${Date.now()}`, ...item };
    inventario.push(newItem);
    await setStoredData(INVENTARIO_KEY, inventario);
    await callGoogleScript('create_inventory_item', { data: newItem });
    return newItem;
};

export const updateInventarioItem = async (id: string, data: Partial<InventoryItem>): Promise<void> => {
    const inventario = await getInventario();
    const index = inventario.findIndex(i => i.id === id);
    if (index > -1) {
        inventario[index] = { ...inventario[index], ...data };
        await setStoredData(INVENTARIO_KEY, inventario);
        await callGoogleScript('update_inventory_item', { id, data });
    }
};

export const deleteInventarioItem = async (id: string): Promise<void> => {
    let inventario = await getInventario();
    inventario = inventario.filter(i => i.id !== id);
    await setStoredData(INVENTARIO_KEY, inventario);
    await callGoogleScript('delete_inventory_item', { id });
};

export const setInventario = async (items: InventoryItem[]): Promise<void> => {
    await setStoredData(INVENTARIO_KEY, items);
    await callGoogleScript('set_inventory', { data: items });
};

/**
 * Fix: Added Product CRUD functions to resolve errors in Productos.tsx.
 */
export const createProducto = async (producto: Omit<Producto, 'id'>): Promise<Producto> => {
    const productos = await getProductos();
    const newP = { id: `p${Date.now()}`, ...producto };
    productos.push(newP);
    await setStoredData(PRODUCTOS_KEY, productos);
    await callGoogleScript('create_product', { data: newP });
    return newP;
};

export const updateProducto = async (id: string, data: Partial<Producto>): Promise<void> => {
    const productos = await getProductos();
    const index = productos.findIndex(p => p.id === id);
    if (index > -1) {
        productos[index] = { ...productos[index], ...data };
        await setStoredData(PRODUCTOS_KEY, productos);
        await callGoogleScript('update_product', { id, data });
    }
};

export const deleteProducto = async (id: string): Promise<void> => {
    let productos = await getProductos();
    productos = productos.filter(p => p.id !== id);
    await setStoredData(PRODUCTOS_KEY, productos);
    await callGoogleScript('delete_product', { id });
};

/**
 * Fix: Added User CRUD functions to resolve errors in GestionUsuarios.tsx.
 */
export const createUser = async (user: Omit<User, 'id' | 'ultimoAcceso'>): Promise<User> => {
    const users = await getUsers();
    const newUser = { id: `u${Date.now()}`, ultimoAcceso: new Date().toISOString(), ...user } as User;
    users.push(newUser);
    await setStoredData(USERS_KEY, users);
    await callGoogleScript('create_user', { data: newUser });
    return newUser;
};

export const updateUser = async (id: string, data: Partial<User>): Promise<void> => {
    const users = await getUsers();
    const index = users.findIndex(u => u.id === id);
    if (index > -1) {
        users[index] = { ...users[index], ...data };
        await setStoredData(USERS_KEY, users);
        await callGoogleScript('update_user', { id, data });
    }
};

/**
 * Fix: Added Provider CRUD functions to resolve errors in Proveedores.tsx.
 */
export const createProveedor = async (prov: Omit<Proveedor, 'id' | 'creadoEn'>): Promise<Proveedor> => {
    const proveedores = await getProveedores();
    const newProv = { id: `prov${Date.now()}`, creadoEn: new Date().toISOString(), ...prov } as Proveedor;
    proveedores.push(newProv);
    await setStoredData(PROVEEDORES_KEY, proveedores);
    await callGoogleScript('create_provider', { data: newProv });
    return newProv;
};

export const updateProveedor = async (id: string, data: Partial<Proveedor>): Promise<void> => {
    const proveedores = await getProveedores();
    const index = proveedores.findIndex(p => p.id === id);
    if (index > -1) {
        proveedores[index] = { ...proveedores[index], ...data };
        await setStoredData(PROVEEDORES_KEY, proveedores);
        await callGoogleScript('update_provider', { id, data });
    }
};

export const deleteProveedor = async (id: string): Promise<void> => {
    let proveedores = await getProveedores();
    proveedores = proveedores.filter(p => p.id !== id);
    await setStoredData(PROVEEDORES_KEY, proveedores);
    await callGoogleScript('delete_provider', { id });
};

/**
 * Fix: Added Provider Task functions to resolve errors in Proveedores.tsx.
 */
export const createTareaProveedor = async (tarea: Omit<TareaProveedor, 'id' | 'completada'>): Promise<TareaProveedor> => {
    const tareas = await getTareasProveedor();
    const newT = { id: `t${Date.now()}`, completada: false, ...tarea };
    tareas.push(newT);
    await setStoredData(TAREAS_KEY, tareas);
    await callGoogleScript('create_provider_task', { data: newT });
    return newT;
};

export const updateTareaProveedor = async (id: string, data: Partial<TareaProveedor>): Promise<void> => {
    const tareas = await getTareasProveedor();
    const index = tareas.findIndex(t => t.id === id);
    if (index > -1) {
        tareas[index] = { ...tareas[index], ...data };
        await setStoredData(TAREAS_KEY, tareas);
        await callGoogleScript('update_provider_task', { id, data });
    }
};
