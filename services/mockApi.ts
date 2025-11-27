
import { Cliente, Producto, Regimen, Trabajo, TrabajoEstado, TrabajoTipo, User, InventoryItem, Proveedor, TareaProveedor } from '../types';
import { VALID_USERS } from '../constants';

// ============================================================================
// ☁️ CONFIGURACIÓN DE LA NUBE (GOOGLE SHEETS)
// ============================================================================

// URL DE RESPALDO DIRECTA (La proporcionada por el usuario)
// Esta se usará si fallan las variables de entorno o si no están configuradas en Vercel
const HARDCODED_URL = "https://script.google.com/macros/s/AKfycbz9BrIG8s1h5spiy3H2OQVInN4lODW6VJ50-SmGBajjIQ2jbgzBl-65-_6XF7IYRluM/exec";

const getScriptUrl = () => {
  try {
    // 1. Intentar acceder de forma segura a import.meta.env
    // @ts-ignore
    if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_URL_SCRIPT_DE_GOOGLE) {
        // @ts-ignore
        return import.meta.env.VITE_URL_SCRIPT_DE_GOOGLE;
    }
  } catch (e) {
    // Ignorar errores de acceso
  }
  
  // 2. Si falla lo anterior, devolver la URL hardcodeada garantizada
  return HARDCODED_URL;
};

const GOOGLE_SCRIPT_URL = getScriptUrl();

// ============================================================================
// 🔄 SISTEMA DE SINCRONIZACIÓN HÍBRIDO (CACHE + NUBE)
// ============================================================================

/**
 * Lee datos. Intenta leer de la Nube primero. Si falla, usa LocalStorage (caché).
 */
const getStoredData = async <T>(key: string, defaultValue: T): Promise<T> => {
    // 1. Intentar leer de LocalStorage primero para velocidad inmediata (Caché optimista)
    let localData = defaultValue;
    try {
        const item = localStorage.getItem(key);
        if (item) localData = JSON.parse(item);
    } catch (e) { console.warn("Error lectura local", e); }

    // 2. Validación básica
    if (!GOOGLE_SCRIPT_URL || !GOOGLE_SCRIPT_URL.startsWith('http')) {
        console.warn("⚠️ MODO OFFLINE: URL de Google Script no válida, usando caché local.");
        return localData;
    }

    // 3. Intentar obtener datos frescos de la Nube
    try {
        const response = await fetch(`${GOOGLE_SCRIPT_URL}?action=get&key=${key}`);
        
        // Verificamos si la respuesta es JSON válido antes de parsear
        const text = await response.text();
        let json;
        try {
            json = JSON.parse(text);
        } catch (e) {
            // Si falla el parseo (ej. Google devuelve HTML de error), fallamos silenciosamente al localData
            return localData;
        }
        
        if (json.status === 'success' && json.data) {
            // Actualizamos el caché local con lo nuevo de la nube
            localStorage.setItem(key, JSON.stringify(json.data));
            return json.data as T;
        }
    } catch (error) {
        // Error silencioso en consola para no saturar al usuario, se usa caché
        // console.error(`☁️ Error conectando con Google Cloud [${key}]:`, error);
    }

    return localData;
};

/**
 * Guarda datos. Guarda en LocalStorage (inmediato) y luego envía a la Nube (asíncrono).
 */
const setStoredData = async <T>(key: string, value: T): Promise<void> => {
    // 1. Guardar en LocalStorage inmediatamente (UI rápida)
    try {
        localStorage.setItem(key, JSON.stringify(value));
    } catch (e) { console.error("Error escritura local", e); }

    // 2. Validación básica de URL
    if (!GOOGLE_SCRIPT_URL || !GOOGLE_SCRIPT_URL.startsWith('http')) return;

    // 3. Enviar a la Nube en segundo plano (Fire and Forget)
    try {
        await fetch(GOOGLE_SCRIPT_URL, {
            method: 'POST',
            mode: 'no-cors', 
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'save', key: key, data: value })
        });
        console.log(`☁️ Datos enviados a Nube: ${key}`);
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

// --- DATOS POR DEFECTO (Para inicializar si está vacío) ---
const daysAgo = (days: number) => {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date.toISOString();
}
const getRandomUser = () => VALID_USERS[Math.floor(Math.random() * VALID_USERS.length)];

const defaultTrabajos: Trabajo[] = [
  { id: '1', orden: 1001, clienteId: 'c1', titular: 'Restaurante Sazón', tipo: TrabajoTipo.SRI, subtipo: 'Facturas', cantidad: 10, tamano: '1/2', total: 150.00, abono: 100.00, saldo: 50.00, estado: TrabajoEstado.PENDIENTE, fechaEntrada: daysAgo(1), fechaVencimiento: '2025-07-20T10:00:00Z', caduco: false, creadoPor: getRandomUser(), origen: 'Interno' },
  { id: '2', orden: 1002, clienteId: 'c2', titular: 'Ana Pérez', tipo: TrabajoTipo.GENERAL, subtipo: 'Tarjetas de Presentación', cantidad: 500, tamano: 'Estándar', total: 45.00, abono: 45.00, saldo: 0.00, estado: TrabajoEstado.ENTREGADO, fechaEntrada: new Date().toISOString(), caduco: false, creadoPor: getRandomUser(), origen: 'Interno' },
];
const defaultClientes: Cliente[] = [
  { id: 'c1', cedula: '1792233445001', ruc: '1792233445001', nombre: 'Restaurante Sazón', telefono: ['0987654321'], creadoEn: '2023-01-15T00:00:00Z', regimen: Regimen.NEGOCIO_POPULAR },
  { id: 'c2', cedula: '1712345678', nombre: 'Ana Pérez', telefono: ['0998765432'], creadoEn: '2023-02-20T00:00:00Z', regimen: Regimen.GENERAL },
];
const defaultProductos: Producto[] = [
  { id: 'p3', nombre: 'Facturas 1/4 Oficio (25H)', descripcion: 'Talonario de 25 hojas, tamaño 1/4 de oficio.', precio: 10.00, categoria: 'SRI', esSRI: true },
  { id: 'pi1', nombre: 'Volantes / flyers', descripcion: 'Impresión de volantes en diferentes tamaños y tipos de papel.', precio: 30.00, categoria: 'Publicidad Impresa' },
];
const defaultUsers: User[] = [
  { id: 'u1', nombre: 'Pedro', email: 'pedro@imprenta.com', rol: 'Admin', estado: 'Activo', ultimoAcceso: daysAgo(0) },
  { id: 'u2', nombre: 'Aleida', email: 'aleida@imprenta.com', rol: 'Operador', estado: 'Activo', ultimoAcceso: daysAgo(1) },
  { id: 'u3', nombre: 'Roberto', email: 'roberto@imprenta.com', rol: 'Operador', estado: 'Activo', ultimoAcceso: daysAgo(0) },
  { id: 'u4', nombre: 'Daniel', email: 'daniel@imprenta.com', rol: 'Operador', estado: 'Inactivo', ultimoAcceso: daysAgo(5) },
  { id: 'u5', nombre: 'Dante', email: 'dante@imprenta.com', rol: 'Operador', estado: 'Activo', ultimoAcceso: daysAgo(2) },
  { id: 'u6', nombre: 'Santiago', email: 'santiago@imprenta.com', rol: 'Operador', estado: 'Activo', ultimoAcceso: daysAgo(3) },
];
const defaultSriKeys: string[] = ["1234567890"];
const defaultInventario: InventoryItem[] = [];
const defaultProveedores: Proveedor[] = [];
const defaultTareasProveedor: TareaProveedor[] = [];

// --- API FUNCTIONS ---

export const getTrabajos = async (): Promise<Trabajo[]> => {
    return await getStoredData(TRABAJOS_KEY, defaultTrabajos);
};

export const getClientes = async (): Promise<Cliente[]> => {
    return await getStoredData(CLIENTES_KEY, defaultClientes);
};

export const getProductos = async (): Promise<Producto[]> => {
    return await getStoredData(PRODUCTOS_KEY, defaultProductos);
};

export const updateTrabajoStatus = async (trabajoId: string, newStatus: TrabajoEstado, usuario: string): Promise<Trabajo> => {
    const trabajos = await getStoredData(TRABAJOS_KEY, defaultTrabajos);
    const trabajoIndex = trabajos.findIndex(t => t.id === trabajoId);
    if (trabajoIndex > -1) {
        trabajos[trabajoIndex].estado = newStatus;
        trabajos[trabajoIndex].actualizadoPor = usuario;
        await setStoredData(TRABAJOS_KEY, trabajos);
        return trabajos[trabajoIndex];
    }
    throw new Error("Trabajo no encontrado");
};

export const createTrabajo = async (trabajoData: Omit<Trabajo, 'id' | 'orden' | 'fechaEntrada' | 'saldo' | 'caduco'>, usuario: string): Promise<Trabajo> => {
    const trabajos = await getStoredData(TRABAJOS_KEY, defaultTrabajos);
    const newTrabajo: Trabajo = {
        id: String(Date.now()),
        orden: Math.max(...trabajos.map(t => t.orden), 0) + 1,
        clienteId: trabajoData.clienteId,
        titular: trabajoData.titular,
        tipo: trabajoData.tipo,
        subtipo: trabajoData.subtipo,
        cantidad: trabajoData.cantidad,
        tamano: trabajoData.tamano,
        total: trabajoData.total,
        abono: trabajoData.abono,
        saldo: trabajoData.total - trabajoData.abono,
        estado: trabajoData.estado,
        fechaEntrada: new Date().toISOString(),
        fechaVencimiento: trabajoData.fechaVencimiento,
        caduco: false,
        creadoPor: usuario,
        establecimiento: trabajoData.establecimiento,
        puntoEmision: trabajoData.puntoEmision,
        claveAcceso: trabajoData.claveAcceso,
        origen: 'Interno',
        esRenovacion: trabajoData.esRenovacion,
    };
    trabajos.unshift(newTrabajo);
    await setStoredData(TRABAJOS_KEY, trabajos);
    return newTrabajo;
};

export const createPublicPedido = async (
    clienteInfo: { nombre: string; telefono: string; email: string; ruc?: string; direccion?: string; regimen?: Regimen; tipoDocumento: 'SRI' | 'Recibo'; },
    productos: { producto: Producto, cantidad: number }[]
): Promise<boolean> => {
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
    const total = productos.reduce((sum, item) => sum + (item.producto.precio * item.cantidad), 0);
    const descripcion = productos.map(p => `${p.cantidad}x ${p.producto.nombre}`).join(', ');

    const newTrabajo: Trabajo = {
        id: `web${Date.now()}`,
        orden: Math.max(...trabajos.map(t => t.orden), 0) + 1,
        clienteId: cliente.id,
        titular: `${clienteInfo.nombre} (WEB)`,
        tipo: clienteInfo.tipoDocumento === 'SRI' ? TrabajoTipo.SRI : TrabajoTipo.GENERAL,
        subtipo: descripcion,
        cantidad: productos.reduce((sum, p) => sum + p.cantidad, 0),
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

export const createCliente = async (clienteData: Omit<Cliente, 'id' | 'creadoEn'>): Promise<Cliente> => {
    const clientes = await getStoredData(CLIENTES_KEY, defaultClientes);
    const newCliente: Cliente = {
        id: `c${Date.now()}`,
        creadoEn: new Date().toISOString(),
        ...clienteData
    };
    clientes.unshift(newCliente);
    await setStoredData(CLIENTES_KEY, clientes);
    return newCliente;
};

export const updateCliente = async (clienteId: string, clienteData: Partial<Omit<Cliente, 'id' | 'creadoEn'>>): Promise<Cliente> => {
    const clientes = await getStoredData(CLIENTES_KEY, defaultClientes);
    const index = clientes.findIndex(c => c.id === clienteId);
    if (index > -1) {
        clientes[index] = { ...clientes[index], ...clienteData };
        await setStoredData(CLIENTES_KEY, clientes);
        return clientes[index];
    }
    throw new Error("Cliente no encontrado");
};

export const updateTrabajoPhoto = async (trabajoId: string, photoUrl: string): Promise<Trabajo> => {
    const trabajos = await getStoredData(TRABAJOS_KEY, defaultTrabajos);
    const trabajoIndex = trabajos.findIndex(t => t.id === trabajoId);
    if (trabajoIndex > -1) {
        trabajos[trabajoIndex].fotoOriginalUrl = photoUrl;
        await setStoredData(TRABAJOS_KEY, trabajos);
        return trabajos[trabajoIndex];
    }
    throw new Error("Trabajo no encontrado");
};

export const createProducto = async (productoData: Omit<Producto, 'id'>): Promise<Producto> => {
    const productos = await getStoredData(PRODUCTOS_KEY, defaultProductos);
    const newProducto: Producto = {
        id: `p${Date.now()}`,
        ...productoData
    };
    productos.unshift(newProducto);
    await setStoredData(PRODUCTOS_KEY, productos);
    return newProducto;
};

export const updateProducto = async (productoId: string, productoData: Partial<Omit<Producto, 'id'>>): Promise<Producto> => {
    const productos = await getStoredData(PRODUCTOS_KEY, defaultProductos);
    const index = productos.findIndex(p => p.id === productoId);
    if (index > -1) {
        productos[index] = { ...productos[index], ...productoData };
        await setStoredData(PRODUCTOS_KEY, productos);
        return productos[index];
    }
    throw new Error("Producto no encontrado");
};

export const deleteProducto = async (productoId: string): Promise<boolean> => {
    let productos = await getStoredData(PRODUCTOS_KEY, defaultProductos);
    const initialLength = productos.length;
    productos = productos.filter(p => p.id !== productoId);
    await setStoredData(PRODUCTOS_KEY, productos);
    return productos.length < initialLength;
};

export const getUsers = async (): Promise<User[]> => {
    return await getStoredData(USERS_KEY, defaultUsers);
};

export const createUser = async (userData: Omit<User, 'id' | 'ultimoAcceso'>): Promise<User> => {
    const users = await getStoredData(USERS_KEY, defaultUsers);
    const newUser: User = {
        id: `u${Date.now()}`,
        ultimoAcceso: new Date().toISOString(),
        ...userData
    };
    users.unshift(newUser);
    await setStoredData(USERS_KEY, users);
    return newUser;
};

export const updateUser = async (userId: string, userData: Partial<Omit<User, 'id'>>): Promise<User> => {
    const users = await getStoredData(USERS_KEY, defaultUsers);
    const index = users.findIndex(u => u.id === userId);
    if (index > -1) {
        users[index] = { ...users[index], ...userData };
        await setStoredData(USERS_KEY, users);
        return users[index];
    }
    throw new Error("Usuario no encontrado");
};

export const registerRetiro = async (trabajoId: string, pagoFinal: number, usuario: string): Promise<Trabajo> => {
    const trabajos = await getStoredData(TRABAJOS_KEY, defaultTrabajos);
    const trabajoIndex = trabajos.findIndex(t => t.id === trabajoId);
    if (trabajoIndex > -1) {
        const trabajo = trabajos[trabajoIndex];
        trabajo.estado = TrabajoEstado.ENTREGADO;
        trabajo.abono += pagoFinal;
        trabajo.saldo = parseFloat((trabajo.total - trabajo.abono).toFixed(2));
        if (trabajo.saldo < 0) trabajo.saldo = 0;
        trabajo.actualizadoPor = usuario;
        trabajos[trabajoIndex] = trabajo;
        await setStoredData(TRABAJOS_KEY, trabajos);
        return trabajo;
    }
    throw new Error("Trabajo no encontrado");
};

export const getInventario = async (): Promise<InventoryItem[]> => {
    return await getStoredData(INVENTARIO_KEY, defaultInventario);
};

export const createInventarioItem = async (itemData: Omit<InventoryItem, 'id'>): Promise<InventoryItem> => {
    const items = await getStoredData(INVENTARIO_KEY, defaultInventario);
    const newItem: InventoryItem = {
        id: `inv${Date.now()}`,
        ...itemData
    };
    items.unshift(newItem);
    await setStoredData(INVENTARIO_KEY, items);
    return newItem;
};

export const updateInventarioItem = async (itemId: string, itemData: Partial<Omit<InventoryItem, 'id'>>): Promise<InventoryItem> => {
    const items = await getStoredData(INVENTARIO_KEY, defaultInventario);
    const index = items.findIndex(i => i.id === itemId);
    if (index > -1) {
        items[index] = { ...items[index], ...itemData };
        await setStoredData(INVENTARIO_KEY, items);
        return items[index];
    }
    throw new Error("Item no encontrado");
};

export const deleteInventarioItem = async (itemId: string): Promise<boolean> => {
    let items = await getStoredData(INVENTARIO_KEY, defaultInventario);
    const initialLength = items.length;
    items = items.filter(i => i.id !== itemId);
    await setStoredData(INVENTARIO_KEY, items);
    return items.length < initialLength;
};

export const setInventario = async (items: InventoryItem[]): Promise<void> => {
    await setStoredData(INVENTARIO_KEY, items);
};

export const getProveedores = async (): Promise<Proveedor[]> => {
    return await getStoredData(PROVEEDORES_KEY, defaultProveedores);
};

export const createProveedor = async (proveedorData: Omit<Proveedor, 'id' | 'creadoEn'>): Promise<Proveedor> => {
    const proveedores = await getStoredData(PROVEEDORES_KEY, defaultProveedores);
    const newProveedor: Proveedor = {
        id: `prov${Date.now()}`,
        creadoEn: new Date().toISOString(),
        ...proveedorData
    };
    proveedores.unshift(newProveedor);
    await setStoredData(PROVEEDORES_KEY, proveedores);
    return newProveedor;
};

export const updateProveedor = async (proveedorId: string, proveedorData: Partial<Omit<Proveedor, 'id'>>): Promise<Proveedor> => {
    const proveedores = await getStoredData(PROVEEDORES_KEY, defaultProveedores);
    const index = proveedores.findIndex(p => p.id === proveedorId);
    if (index > -1) {
        proveedores[index] = { ...proveedores[index], ...proveedorData };
        await setStoredData(PROVEEDORES_KEY, proveedores);
        return proveedores[index];
    }
    throw new Error("Proveedor no encontrado");
};

export const deleteProveedor = async (proveedorId: string): Promise<boolean> => {
    let proveedores = await getStoredData(PROVEEDORES_KEY, defaultProveedores);
    proveedores = proveedores.filter(p => p.id !== proveedorId);
    await setStoredData(PROVEEDORES_KEY, proveedores);
    return true;
};

export const getTareasProveedor = async (): Promise<TareaProveedor[]> => {
    return await getStoredData(TAREAS_PROVEEDOR_KEY, defaultTareasProveedor);
};

export const createTareaProveedor = async (tareaData: Omit<TareaProveedor, 'id' | 'completada'>): Promise<TareaProveedor> => {
    const tareas = await getStoredData(TAREAS_PROVEEDOR_KEY, defaultTareasProveedor);
    const newTarea: TareaProveedor = {
        id: `tarea${Date.now()}`,
        completada: false,
        ...tareaData
    };
    tareas.unshift(newTarea);
    await setStoredData(TAREAS_PROVEEDOR_KEY, tareas);
    return newTarea;
};

export const updateTareaProveedor = async (tareaId: string, tareaData: Partial<Omit<TareaProveedor, 'id'>>): Promise<TareaProveedor> => {
    const tareas = await getStoredData(TAREAS_PROVEEDOR_KEY, defaultTareasProveedor);
    const index = tareas.findIndex(t => t.id === tareaId);
    if (index > -1) {
        tareas[index] = { ...tareas[index], ...tareaData };
        await setStoredData(TAREAS_PROVEEDOR_KEY, tareas);
        return tareas[index];
    }
    throw new Error("Tarea no encontrada");
};

export const getSriKeys = async (): Promise<string[]> => {
    return await getStoredData(SRI_KEYS_KEY, defaultSriKeys);
};

export const addSriKey = async (key: string): Promise<string[]> => {
    const keys = await getStoredData(SRI_KEYS_KEY, defaultSriKeys);
    if (!keys.includes(key)) {
        keys.push(key);
        await setStoredData(SRI_KEYS_KEY, keys);
    }
    return keys;
};

export const deleteSriKey = async (key: string): Promise<string[]> => {
    let keys = await getStoredData(SRI_KEYS_KEY, defaultSriKeys);
    keys = keys.filter(k => k !== key);
    await setStoredData(SRI_KEYS_KEY, keys);
    return keys;
};
