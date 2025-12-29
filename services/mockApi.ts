
import { Cliente, Producto, Regimen, Trabajo, TrabajoEstado, TrabajoTipo, User, InventoryItem, Proveedor, TareaProveedor, SriCredential, StatusLog } from '../types';

// La URL se obtiene de las variables de entorno o de la configuración del sistema
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

// --- PRODUCTOS PREDETERMINADOS (CATÁLOGO SRI ECUADOR) ---
const defaultProductos: Producto[] = [
  // FACTURAS
  { id: 'sri-f1', nombre: 'Facturas SRI (1/4 Oficio - 50 Juegos)', descripcion: 'Facturas autorizadas, Original y 1 Copia. Papel químico.', precio: 13.00, categoria: 'Documentos SRI', esSRI: true, isPopular: true, specs: ['Original/Copia', 'Numeradas', 'Papel Químico'], unit: 'block' },
  { id: 'sri-f2', nombre: 'Facturas SRI (1/4 Oficio - 100 Juegos)', descripcion: 'Facturas autorizadas, Original y 1 Copia. Papel químico.', precio: 18.00, categoria: 'Documentos SRI', esSRI: true, isPopular: true, specs: ['Original/Copia', 'Numeradas', 'Papel Químico'], unit: 'block' },
  { id: 'sri-f3', nombre: 'Facturas SRI (1/2 Oficio - 100 Juegos)', descripcion: 'Facturas autorizadas tamaño grande, Original y 1 Copia.', precio: 25.00, categoria: 'Documentos SRI', esSRI: true, specs: ['Original/Copia', 'Numeradas', 'Papel Químico'], unit: 'block' },
  
  // NOTAS DE VENTA (RIMPE POPULAR)
  { id: 'sri-nv1', nombre: 'Notas de Venta (1/4 Oficio - 50 Hojas)', descripcion: 'Para Contribuyente RIMPE Negocio Popular. Papel Bond.', precio: 10.00, categoria: 'Documentos SRI', esSRI: true, isPopular: true, specs: ['Original', 'Papel Bond 75g', 'Numeradas'], unit: 'block' },
  { id: 'sri-nv2', nombre: 'Notas de Venta (1/4 Oficio - 100 Hojas)', descripcion: 'Para Contribuyente RIMPE Negocio Popular. Papel Bond.', precio: 15.00, categoria: 'Documentos SRI', esSRI: true, isPopular: true, specs: ['Original', 'Papel Bond 75g', 'Numeradas'], unit: 'block' },
  
  // RETENCIONES
  { id: 'sri-r1', nombre: 'Comprobante de Retención (1/4 Oficio)', descripcion: 'Original y 1 Copia. Papel químico.', precio: 18.00, categoria: 'Documentos SRI', esSRI: true, specs: ['Original/Copia', 'Numeradas', 'Autorizado'], unit: 'block' },
  
  // LIQUIDACIONES
  { id: 'sri-lc1', nombre: 'Liquidación de Compra (1/2 Oficio)', descripcion: 'Para bienes o servicios específicos. Original y 1 Copia.', precio: 22.00, categoria: 'Documentos SRI', esSRI: true, specs: ['Original/Copia', 'Numeradas'], unit: 'block' },
  
  // GUÍAS
  { id: 'sri-gr1', nombre: 'Guía de Remisión (1/2 Oficio)', descripcion: 'Para transporte de mercaderías. Original y 2 Copias.', precio: 28.00, categoria: 'Documentos SRI', esSRI: true, specs: ['Original y 2 Copias', 'Numeradas'], unit: 'block' },
  
  // OTROS NO SRI
  { id: 'gen-g1', nombre: 'Gigantografía Publicitaria (m2)', descripcion: 'Impresión en lona 13oz HD.', precio: 10.00, categoria: 'Gran Formato', esSRI: false, isPopular: true, specs: ['HD 1440dpi', 'Ojalillos incluidos', 'Lona resistente'], unit: 'm2' },
  { id: 'gen-s1', nombre: 'Sello Automático Trodat', descripcion: 'Sello profesional para oficina.', precio: 15.00, categoria: 'Oficina', esSRI: false, isPopular: true, specs: ['Automático', 'Tinta incluida', 'Personalizado'], unit: 'unidad' }
];

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

// --- USUARIOS PREDETERMINADOS ---
const defaultUsers: User[] = [
  { id: 'u1', nombre: 'Pedro', email: 'pedro@imprentacordova.com', rol: 'Admin', estado: 'Activo', ultimoAcceso: new Date().toISOString(), requirePassword: false },
  { id: 'u2', nombre: 'Aleida', email: 'aleida@imprentacordova.com', rol: 'Operador', estado: 'Activo', ultimoAcceso: new Date().toISOString(), requirePassword: false },
  { id: 'u3', nombre: 'Roberto', email: 'roberto@imprentacordova.com', rol: 'Operador', estado: 'Activo', ultimoAcceso: new Date().toISOString(), requirePassword: false },
  { id: 'u4', nombre: 'Daniel', email: 'daniel@imprentacordova.com', rol: 'Diseñador', estado: 'Activo', ultimoAcceso: new Date().toISOString(), requirePassword: false },
  { id: 'u5', nombre: 'Dante', email: 'dante@imprentacordova.com', rol: 'Operador', estado: 'Activo', ultimoAcceso: new Date().toISOString(), requirePassword: false }
];

export const getTrabajos = async (): Promise<Trabajo[]> => getStoredData(TRABAJOS_KEY, []);
export const getClientes = async (): Promise<Cliente[]> => getStoredData(CLIENTES_KEY, []);
export const getProductos = async (): Promise<Producto[]> => getStoredData(PRODUCTOS_KEY, defaultProductos);
export const getUsers = async (): Promise<User[]> => getStoredData(USERS_KEY, defaultUsers);
export const getInventario = async (): Promise<InventoryItem[]> => getStoredData(INVENTARIO_KEY, []);
export const getProveedores = async (): Promise<Proveedor[]> => getStoredData(PROVEEDORES_KEY, []);
export const getSriCredentials = async (): Promise<SriCredential[]> => getStoredData(SRI_KEYS_KEY, []);
export const getTareasProveedor = async (): Promise<TareaProveedor[]> => getStoredData(TAREAS_KEY, []);

// --- MÉTODOS DE ESCRITURA ---

export const updateTrabajoPhoto = async (id: string, photoUrl: string): Promise<void> => {
    const trabajos = await getTrabajos();
    const idx = trabajos.findIndex(t => t.id === id);
    if (idx > -1) {
        trabajos[idx].fotoOriginalUrl = photoUrl;
        await setStoredData(TRABAJOS_KEY, trabajos);
    }
    await callGoogleScript('upload_to_drive', { id, fileData: photoUrl, folder: 'artes' });
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
        saldo: (trabajoData.total || 0) - (trabajoData.abono || 0),
        historial: [log]
    };
    trabajos.unshift(newTrabajo);
    await setStoredData(TRABAJOS_KEY, trabajos);
    await callGoogleScript('create_job', { data: newTrabajo });
    return newTrabajo;
};

export const createCliente = async (clienteData: any): Promise<Cliente> => {
    const clientes = await getClientes();
    const newCliente = { id: `c${Date.now()}`, creadoEn: new Date().toISOString(), ...clienteData };
    clientes.unshift(newCliente);
    await setStoredData(CLIENTES_KEY, clientes);
    await callGoogleScript('create_client', { data: newCliente });
    return newCliente;
};

export const addSriCredential = async (cred: SriCredential): Promise<SriCredential[]> => {
    const creds = await getSriCredentials();
    const updated = [...creds.filter(c => c.ruc !== cred.ruc), { ...cred, updatedAt: new Date().toISOString() }];
    await setStoredData(SRI_KEYS_KEY, updated);
    await callGoogleScript('save_sri_key', { data: cred });
    return updated;
};

export const deleteSriCredential = async (ruc: string): Promise<SriCredential[]> => {
    let creds = await getSriCredentials();
    creds = creds.filter(c => c.ruc !== ruc);
    await setStoredData(SRI_KEYS_KEY, creds);
    await callGoogleScript('delete_sri_key', { ruc });
    return creds;
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

export const createInventarioItem = async (item: Omit<InventoryItem, 'id'>): Promise<InventoryItem> => {
    const items = await getInventario();
    const newItem = { id: `i${Date.now()}`, ...item };
    items.push(newItem);
    await setStoredData(INVENTARIO_KEY, items);
    await callGoogleScript('create_inventory_item', { data: newItem });
    return newItem;
};

export const updateInventarioItem = async (id: string, data: Partial<InventoryItem>): Promise<void> => {
    const items = await getInventario();
    const idx = items.findIndex(i => i.id === id);
    if (idx > -1) {
        items[idx] = { ...items[idx], ...data };
        await setStoredData(INVENTARIO_KEY, items);
        await callGoogleScript('update_inventory_item', { id, data });
    }
};

export const deleteInventarioItem = async (id: string): Promise<void> => {
    let items = await getInventario();
    items = items.filter(i => i.id !== id);
    await setStoredData(INVENTARIO_KEY, items);
    await callGoogleScript('delete_inventory_item', { id });
};

export const setInventario = async (items: InventoryItem[]): Promise<void> => {
    await setStoredData(INVENTARIO_KEY, items);
    await callGoogleScript('sync_inventario', { data: items });
};

export const createPublicPedido = async (clientData: any, cartItems: any[]): Promise<void> => {
    await callGoogleScript('create_public_order', { client: clientData, items: cartItems });
};

export const createProducto = async (product: Partial<Producto>): Promise<Producto> => {
    const products = await getProductos();
    const newProduct = { id: `p${Date.now()}`, ...product } as Producto;
    products.push(newProduct);
    await setStoredData(PRODUCTOS_KEY, products);
    await callGoogleScript('create_product', { data: newProduct });
    return newProduct;
};

export const updateProducto = async (id: string, data: Partial<Producto>): Promise<void> => {
    const products = await getProductos();
    const idx = products.findIndex(p => p.id === id);
    if (idx > -1) {
        products[idx] = { ...products[idx], ...data };
        await setStoredData(PRODUCTOS_KEY, products);
        await callGoogleScript('update_product', { id, data });
    }
};

export const deleteProducto = async (id: string): Promise<void> => {
    let products = await getProductos();
    products = products.filter(p => p.id !== id);
    await setStoredData(PRODUCTOS_KEY, products);
    await callGoogleScript('delete_product', { id });
};

export const createUser = async (user: Omit<User, 'id'>): Promise<User> => {
    const users = await getUsers();
    const newUser = { id: `u${Date.now()}`, ...user, ultimoAcceso: new Date().toISOString() } as User;
    users.push(newUser);
    await setStoredData(USERS_KEY, users);
    await callGoogleScript('create_user', { data: newUser });
    return newUser;
};

export const updateUser = async (id: string, data: Partial<User>): Promise<void> => {
    const users = await getUsers();
    const idx = users.findIndex(u => u.id === id);
    if (idx > -1) {
        users[idx] = { ...users[idx], ...data };
        await setStoredData(USERS_KEY, users);
        await callGoogleScript('update_user', { id, data });
    }
};

export const bulkAddSriCredentials = async (newCreds: SriCredential[]): Promise<SriCredential[]> => {
    let creds = await getSriCredentials();
    const rucs = new Set(creds.map(c => c.ruc));
    newCreds.forEach(c => {
        if (!rucs.has(c.ruc)) {
            creds.push({ ...c, updatedAt: new Date().toISOString() });
            rucs.add(c.ruc);
        }
    });
    await setStoredData(SRI_KEYS_KEY, creds);
    await callGoogleScript('bulk_save_sri_keys', { data: newCreds });
    return creds;
};

export const createProveedor = async (proveedor: Omit<Proveedor, 'id' | 'creadoEn'>): Promise<Proveedor> => {
    const proveedores = await getProveedores();
    const newP = { id: `pr${Date.now()}`, creadoEn: new Date().toISOString(), ...proveedor } as Proveedor;
    proveedores.push(newP);
    await setStoredData(PROVEEDORES_KEY, proveedores);
    await callGoogleScript('create_provider', { data: newP });
    return newP;
};

export const updateProveedor = async (id: string, data: Partial<Proveedor>): Promise<void> => {
    const proveedores = await getProveedores();
    const idx = proveedores.findIndex(p => p.id === id);
    if (idx > -1) {
        proveedores[idx] = { ...proveedores[idx], ...data };
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
    const idx = tareas.findIndex(t => t.id === id);
    if (idx > -1) {
        tareas[idx] = { ...tareas[idx], ...data };
        await setStoredData(TAREAS_KEY, tareas);
        await callGoogleScript('update_provider_task', { id, data });
    }
};
