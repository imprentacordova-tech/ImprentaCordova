
import { Cliente, Producto, Regimen, Trabajo, TrabajoEstado, TrabajoTipo, User, InventoryItem, Proveedor, TareaProveedor, SriCredential, StatusLog } from '../types';

const HARDCODED_URL = "https://script.google.com/macros/s/AKfycbz9BrIG8s1h5spiy3H2OQVInN4lODW6VJ50-SmGBajjIQ2jbgzBl-65-_6XF7IYRluM/exec";

const getStoredData = async <T>(key: string, defaultValue: T): Promise<T> => {
    let localData = defaultValue;
    try {
        const item = localStorage.getItem(key);
        if (item) {
            const parsed = JSON.parse(item);
            if (parsed) localData = parsed;
        }
    } catch (e) { 
        console.warn(`Error parsing local storage for key: ${key}. Resetting to default.`);
        localStorage.removeItem(key);
    }

    if (!HARDCODED_URL.startsWith('http')) return localData;

    try {
        const response = await fetch(`${HARDCODED_URL}?action=get&key=${key}`);
        if (!response.ok) return localData;
        const json = await response.json();
        if (json.status === 'success' && json.data) {
            localStorage.setItem(key, JSON.stringify(json.data));
            return json.data as T;
        }
    } catch (error) {
        console.debug(`Cloud sync failed for ${key}, using local data.`);
    }

    return localData;
};

const setStoredData = async <T>(key: string, value: T): Promise<void> => {
    try {
        localStorage.setItem(key, JSON.stringify(value));
    } catch (e) { console.error("Local Write Error:", e); }

    try {
        await fetch(HARDCODED_URL, {
            method: 'POST',
            mode: 'no-cors', 
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'save', key: key, data: value })
        });
    } catch (error) { }
};

const TRABAJOS_KEY = 'mockTrabajosData';
const CLIENTES_KEY = 'mockClientesData';
const PRODUCTOS_KEY = 'mockProductosData';
const USERS_KEY = 'mockUsersData';
const INVENTARIO_KEY = 'mockInventarioData';
const PROVEEDORES_KEY = 'mockProveedoresData';
const TAREAS_PROVEEDOR_KEY = 'mockTareasProveedorData';
const SRI_KEYS_KEY = 'mockSriKeysData';

/* Fix: Removed non-existent 'price' property from defaultProductos */
const defaultProductos: Producto[] = [
  { id: 'sri_fac_1', nombre: 'Facturas (1/4 Oficio)', descripcion: 'Autocopiativo', precio: 18.00, categoria: 'SRI', esSRI: true },
  { id: 'gf_1', nombre: 'Lona HD', descripcion: '1440dpi', precio: 10.00, categoria: 'Gran Formato', esSRI: false },
];

export const getTrabajos = async (): Promise<Trabajo[]> => getStoredData(TRABAJOS_KEY, []);
export const getClientes = async (): Promise<Cliente[]> => getStoredData(CLIENTES_KEY, []);
export const getProductos = async (): Promise<Producto[]> => getStoredData(PRODUCTOS_KEY, defaultProductos);
export const getUsers = async (): Promise<User[]> => getStoredData(USERS_KEY, []);
export const getInventario = async (): Promise<InventoryItem[]> => getStoredData(INVENTARIO_KEY, []);
export const getProveedores = async (): Promise<Proveedor[]> => getStoredData(PROVEEDORES_KEY, []);
export const getTareasProveedor = async (): Promise<TareaProveedor[]> => getStoredData(TAREAS_PROVEEDOR_KEY, []);
export const getSriCredentials = async (): Promise<SriCredential[]> => getStoredData(SRI_KEYS_KEY, []);

export const updateTrabajoStatus = async (trabajoId: string, newStatus: TrabajoEstado, usuario: string): Promise<Trabajo> => {
    const trabajos = await getTrabajos();
    const index = trabajos.findIndex(t => t.id === trabajoId);
    if (index > -1) {
        const log: StatusLog = { estado: newStatus, fecha: new Date().toISOString(), usuario };
        trabajos[index].estado = newStatus;
        trabajos[index].actualizadoPor = usuario;
        /* Fix: Accessing 'historial' property which is now added to Trabajo type */
        trabajos[index].historial = [...(trabajos[index].historial || []), log];
        await setStoredData(TRABAJOS_KEY, trabajos);
        return trabajos[index];
    }
    throw new Error("No encontrado");
};

export const createTrabajo = async (trabajoData: any, usuario: string): Promise<Trabajo> => {
    const trabajos = await getTrabajos();
    const log: StatusLog = { estado: TrabajoEstado.PENDIENTE, fecha: new Date().toISOString(), usuario };
    const newTrabajo: Trabajo = {
        id: String(Date.now()),
        orden: Math.max(...trabajos.map(t => t.orden), 1000) + 1,
        ...trabajoData,
        fechaEntrada: new Date().toISOString(),
        caduco: false,
        creadoPor: usuario,
        origen: 'Interno',
        saldo: trabajoData.total - trabajoData.abono,
        /* Fix: Initializing 'historial' property */
        historial: [log]
    };
    trabajos.unshift(newTrabajo);
    await setStoredData(TRABAJOS_KEY, trabajos);
    return newTrabajo;
};

export const createCliente = async (clienteData: any): Promise<Cliente> => {
    const clientes = await getClientes();
    const newCliente = { id: `c${Date.now()}`, creadoEn: new Date().toISOString(), ...clienteData };
    clientes.unshift(newCliente);
    await setStoredData(CLIENTES_KEY, clientes);
    return newCliente;
};

export const updateCliente = async (id: string, data: any) => {
    const clientes = await getClientes();
    const index = clientes.findIndex(c => c.id === id);
    if (index > -1) {
        clientes[index] = { ...clientes[index], ...data };
        await setStoredData(CLIENTES_KEY, clientes);
    }
};

export const updateTrabajoPhoto = async (id: string, url: string) => {
    const trabajos = await getTrabajos();
    const index = trabajos.findIndex(t => t.id === id);
    if(index > -1) {
        trabajos[index].fotoOriginalUrl = url;
        await setStoredData(TRABAJOS_KEY, trabajos);
        return trabajos[index];
    }
    throw new Error("No encontrado");
};

export const createProducto = async (p: any) => {
    const prods = await getProductos();
    const newP = { id: `p${Date.now()}`, ...p };
    prods.unshift(newP);
    await setStoredData(PRODUCTOS_KEY, prods);
    return newP;
};

export const updateProducto = async (id: string, p: any) => {
     const prods = await getProductos();
     const idx = prods.findIndex(pr => pr.id === id);
     if(idx > -1) {
         prods[idx] = { ...prods[idx], ...p };
         await setStoredData(PRODUCTOS_KEY, prods);
     }
};

export const deleteProducto = async (id: string) => {
    let prods = await getProductos();
    prods = prods.filter(p => p.id !== id);
    await setStoredData(PRODUCTOS_KEY, prods);
    return true;
};

export const createUser = async (u: any) => {
    const users = await getUsers();
    const newU = { id: `u${Date.now()}`, ultimoAcceso: new Date().toISOString(), ...u };
    users.unshift(newU);
    await setStoredData(USERS_KEY, users);
    return newU;
};

export const updateUser = async (id: string, u: any) => {
    const users = await getUsers();
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
        const log: StatusLog = { estado: TrabajoEstado.ENTREGADO, fecha: new Date().toISOString(), usuario: user };
        trabajos[idx].estado = TrabajoEstado.ENTREGADO;
        trabajos[idx].abono += pago;
        trabajos[idx].saldo = 0;
        trabajos[idx].actualizadoPor = user;
        /* Fix: Accessing 'historial' property which is now added to Trabajo type */
        trabajos[idx].historial = [...(trabajos[idx].historial || []), log];
        await setStoredData(TRABAJOS_KEY, trabajos);
        return trabajos[idx];
    }
    throw new Error("No encontrado");
};

export const createInventarioItem = async (i: any) => {
    const items = await getInventario();
    const newI = { id: `inv${Date.now()}`, ...i };
    items.unshift(newI);
    await setStoredData(INVENTARIO_KEY, items);
    return newI;
};

export const updateInventarioItem = async (id: string, data: any) => {
    const items = await getInventario();
    const idx = items.findIndex(i => i.id === id);
    if (idx > -1) {
        items[idx] = { ...items[idx], ...data };
        await setStoredData(INVENTARIO_KEY, items);
    }
};

export const deleteInventarioItem = async (id: string) => {
    let items = await getInventario();
    items = items.filter(i => i.id !== id);
    await setStoredData(INVENTARIO_KEY, items);
};

export const setInventario = async (items: InventoryItem[]) => {
    await setStoredData(INVENTARIO_KEY, items);
};

export const createProveedor = async (p: any) => {
    const provs = await getProveedores();
    const newP = { id: `prov${Date.now()}`, creadoEn: new Date().toISOString(), ...p };
    provs.unshift(newP);
    await setStoredData(PROVEEDORES_KEY, provs);
    return newP;
};

export const updateProveedor = async (id: string, p: any) => {
    const provs = await getProveedores();
    const idx = provs.findIndex(pr => pr.id === id);
    if (idx > -1) {
        provs[idx] = { ...provs[idx], ...p };
        await setStoredData(PROVEEDORES_KEY, provs);
    }
};

export const deleteProveedor = async (id: string) => {
    let provs = await getProveedores();
    provs = provs.filter(p => p.id !== id);
    await setStoredData(PROVEEDORES_KEY, provs);
    return true;
};

export const createTareaProveedor = async (t: any) => {
    const tareas = await getTareasProveedor();
    const newT = { id: `t${Date.now()}`, completada: false, ...t };
    tareas.unshift(newT);
    await setStoredData(TAREAS_PROVEEDOR_KEY, tareas);
    return newT;
};

export const updateTareaProveedor = async (id: string, t: any) => {
    const tareas = await getTareasProveedor();
    const idx = tareas.findIndex(ta => ta.id === id);
    if (idx > -1) {
        tareas[idx] = { ...tareas[idx], ...t };
        await setStoredData(TAREAS_PROVEEDOR_KEY, tareas);
    }
};

export const addSriCredential = async (cred: SriCredential): Promise<SriCredential[]> => {
    const creds = await getSriCredentials();
    creds.push({ ...cred, updatedAt: new Date().toISOString() });
    await setStoredData(SRI_KEYS_KEY, creds);
    return creds;
};

export const bulkAddSriCredentials = async (newCreds: SriCredential[]): Promise<SriCredential[]> => {
    const currentCreds = await getSriCredentials();
    const updated = [...currentCreds, ...newCreds];
    await setStoredData(SRI_KEYS_KEY, updated);
    return updated;
};

export const deleteSriCredential = async (ruc: string): Promise<SriCredential[]> => {
    let creds = await getSriCredentials();
    creds = creds.filter(c => c.ruc !== ruc);
    await setStoredData(SRI_KEYS_KEY, creds);
    return creds;
};

export const createPublicPedido = async (clienteInfo: any, productos: any): Promise<boolean> => {
    const clientes = await getClientes();
    let cliente = clientes.find(c => (clienteInfo.ruc && c.ruc === clienteInfo.ruc) || c.telefono.includes(clienteInfo.telefono));
    
    if (!cliente) {
        cliente = {
            id: `c${Date.now()}`,
            cedula: clienteInfo.ruc || '9999999999',
            ruc: clienteInfo.ruc,
            nombre: clienteInfo.nombre,
            telefono: [clienteInfo.telefono],
            creadoEn: new Date().toISOString(),
            regimen: clienteInfo.regimen || Regimen.GENERAL
        };
        clientes.unshift(cliente);
        await setStoredData(CLIENTES_KEY, clientes);
    }

    const trabajos = await getTrabajos();
    const total = productos.reduce((sum: number, item: any) => sum + (item.producto.precio * item.cantidad), 0);
    const initialLog: StatusLog = { estado: TrabajoEstado.PENDIENTE, fecha: new Date().toISOString(), usuario: 'Portal Web' };

    const newTrabajo: Trabajo = {
        id: `web${Date.now()}`,
        orden: Math.max(...trabajos.map(t => t.orden), 1000) + 1,
        clienteId: cliente.id,
        titular: `${clienteInfo.nombre} (WEB)`,
        tipo: clienteInfo.tipoDocumento === 'SRI' ? TrabajoTipo.SRI : TrabajoTipo.GENERAL,
        subtipo: productos.map((p: any) => `${p.cantidad}x ${p.producto.nombre}`).join(', '),
        cantidad: productos.reduce((sum: number, p: any) => sum + p.cantidad, 0),
        tamano: 'Varios',
        total: total,
        abono: 0, 
        saldo: total,
        estado: TrabajoEstado.PENDIENTE,
        fechaEntrada: new Date().toISOString(),
        caduco: false,
        creadoPor: 'Portal Web',
        origen: 'Web',
        /* Fix: Initializing 'historial' property */
        historial: [initialLog]
    };
    
    trabajos.unshift(newTrabajo);
    await setStoredData(TRABAJOS_KEY, trabajos);
    return true;
};
