
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
    tareas: 'mockTareasData',
    movimientos: 'mockMovimientosInv'
};

/**
 * LÓGICA DE DESCUENTO AUTOMÁTICO DE INVENTARIO
 */
const deductInventoryFromJob = async (trabajo: Trabajo) => {
    const inv = JSON.parse(localStorage.getItem(DB_MAP.inventario) || '[]');
    if (!inv.length) return;

    const esQuimico = trabajo.subtipo.toUpperCase().includes('FACTURA') || trabajo.subtipo.toUpperCase().includes('NOTA DE VENTA');
    
    if (esQuimico) {
        const matchBlocks = trabajo.subtipo.match(/^(\d+)x/);
        const numBlocks = matchBlocks ? parseInt(matchBlocks[1]) : 1;
        
        const matchHojas = trabajo.subtipo.match(/(\d+)H/i);
        const hojasPorBlock = matchHojas ? parseInt(matchHojas[1]) : 50;
        
        const esDuplicado = trabajo.subtipo.toUpperCase().includes('DUPLICADO');
        const esTriplicado = trabajo.subtipo.toUpperCase().includes('TRIPLICADO');
        const numPartes = esTriplicado ? 3 : (esDuplicado ? 2 : 1);

        let cortes = 4; 
        if (trabajo.subtipo.includes('1/8')) cortes = 8;
        if (trabajo.subtipo.includes('1/2')) cortes = 2;
        if (trabajo.subtipo.includes('OFICIO') && !trabajo.subtipo.includes('/')) cortes = 1;

        const hojasConsumidas = (numBlocks * hojasPorBlock) / cortes;
        const fraccionResma = hojasConsumidas / 500;

        let actualizo = false;
        const newInv = inv.map((item: InventoryItem) => {
            const name = item.item.toUpperCase();
            if (name.includes('QUIMICO') && (name.includes('ORIGINAL') || name.includes('CB'))) {
                item.cantidad = Math.max(0, item.cantidad - fraccionResma);
                actualizo = true;
            }
            if (numPartes > 1 && name.includes('QUIMICO') && (name.includes('COPIA') || name.includes('CF') || name.includes('CFB'))) {
                item.cantidad = Math.max(0, item.cantidad - (fraccionResma * (numPartes - 1)));
                actualizo = true;
            }
            return item;
        });

        if (actualizo) {
            localStorage.setItem(DB_MAP.inventario, JSON.stringify(newInv));
        }
    }
};

export const createTrabajo = async (trabajoData: any, usuario: string): Promise<Trabajo> => {
    const trabajos = JSON.parse(localStorage.getItem(DB_MAP.trabajos) || '[]');
    const clientes = JSON.parse(localStorage.getItem(DB_MAP.clientes) || '[]');
    const config = getConfig();

    // VALIDACIÓN DE SEGURIDAD SRI (SOLIDIFICACIÓN)
    if (trabajoData.tipo === TrabajoTipo.SRI) {
        const cliente = clientes.find((c: any) => c.id === trabajoData.clienteId);
        if (cliente) {
            const isNotaVenta = trabajoData.subtipo.toUpperCase().includes('NOTA DE VENTA');
            if (cliente.regimen === Regimen.NEGOCIO_POPULAR && !isNotaVenta) {
                throw new Error("ERROR LEGAL: Un Negocio Popular solo puede emitir Notas de Venta.");
            }
            if (cliente.regimen !== Regimen.NEGOCIO_POPULAR && isNotaVenta) {
                throw new Error("ERROR LEGAL: Los regímenes Emprendedor/General no emiten Notas de Venta.");
            }
        }
    }

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
    localStorage.setItem(DB_MAP.trabajos, JSON.stringify(trabajos));
    
    await deductInventoryFromJob(newTrabajo);
    forcePushAllToCloud(); 
    return newTrabajo;
};

export const getProductos = async (): Promise<Producto[]> => JSON.parse(localStorage.getItem(DB_MAP.productos) || '[]');
export const createProducto = async (p: any) => {
    const data = JSON.parse(localStorage.getItem(DB_MAP.productos) || '[]');
    const newP = { id: `p${Date.now()}`, ...p };
    data.push(newP);
    localStorage.setItem(DB_MAP.productos, JSON.stringify(data));
    forcePushAllToCloud();
    return newP;
};
export const updateProducto = async (id: string, p: Partial<Producto>) => {
    const data = JSON.parse(localStorage.getItem(DB_MAP.productos) || '[]');
    const idx = data.findIndex((i: any) => i.id === id);
    if (idx > -1) { data[idx] = { ...data[idx], ...p }; localStorage.setItem(DB_MAP.productos, JSON.stringify(data)); forcePushAllToCloud(); }
};
export const deleteProducto = async (id: string) => {
    const data = JSON.parse(localStorage.getItem(DB_MAP.productos) || '[]');
    localStorage.setItem(DB_MAP.productos, JSON.stringify(data.filter((i: any) => i.id !== id)));
    forcePushAllToCloud();
};
export const bulkCreateProductos = async (newProducts: Producto[]) => {
    const data = JSON.parse(localStorage.getItem(DB_MAP.productos) || '[]');
    const withIds = newProducts.map(p => ({ ...p, id: `p${Date.now()}-${Math.random().toString(36).substring(2, 7)}` }));
    localStorage.setItem(DB_MAP.productos, JSON.stringify([...data, ...withIds]));
    forcePushAllToCloud();
};

export const getClientes = async (): Promise<Cliente[]> => JSON.parse(localStorage.getItem(DB_MAP.clientes) || '[]');
export const createCliente = async (clienteData: any): Promise<Cliente> => {
    const clientes = JSON.parse(localStorage.getItem(DB_MAP.clientes) || '[]');
    const newCliente = { id: `c${Date.now()}`, creadoEn: new Date().toISOString(), ...clienteData };
    clientes.unshift(newCliente);
    localStorage.setItem(DB_MAP.clientes, JSON.stringify(clientes));
    forcePushAllToCloud();
    return newCliente;
};
export const updateCliente = async (id: string, data: any) => {
    const clientes = JSON.parse(localStorage.getItem(DB_MAP.clientes) || '[]');
    const idx = clientes.findIndex((c: any) => c.id === id);
    if (idx > -1) { clientes[idx] = { ...clientes[idx], ...data }; localStorage.setItem(DB_MAP.clientes, JSON.stringify(clientes)); forcePushAllToCloud(); }
};

export const getTrabajos = async (): Promise<Trabajo[]> => JSON.parse(localStorage.getItem(DB_MAP.trabajos) || '[]');

export const updateTrabajoStatus = async (trabajoId: string, newStatus: TrabajoEstado, usuario: string): Promise<Trabajo> => {
    const trabajos = JSON.parse(localStorage.getItem(DB_MAP.trabajos) || '[]');
    const idx = trabajos.findIndex((t: any) => t.id === trabajoId);
    if (idx > -1) {
        trabajos[idx].estado = newStatus;
        trabajos[idx].actualizadoPor = usuario;
        trabajos[idx].historial = [...(trabajos[idx].historial || []), { estado: newStatus, fecha: new Date().toISOString(), usuario }];
        localStorage.setItem(DB_MAP.trabajos, JSON.stringify(trabajos));
        forcePushAllToCloud();
        return trabajos[idx];
    }
    throw new Error("No encontrado");
};

export const registerRetiro = async (id: string, pago: number, user: string) => {
    const trabajos = JSON.parse(localStorage.getItem(DB_MAP.trabajos) || '[]');
    const idx = trabajos.findIndex((t: any) => t.id === id);
    if (idx > -1) {
        trabajos[idx].estado = TrabajoEstado.ENTREGADO;
        trabajos[idx].abono += pago;
        trabajos[idx].saldo = 0;
        localStorage.setItem(DB_MAP.trabajos, JSON.stringify(trabajos));
        forcePushAllToCloud();
        return trabajos[idx];
    }
    throw new Error("No encontrado");
};

export const getUsers = async (): Promise<User[]> => {
    const data = JSON.parse(localStorage.getItem(DB_MAP.users) || '[]');
    return data.length ? data : [{ id: 'u1', nombre: 'Pedro', email: 'imprentacordova@gmail.com', rol: 'Admin', estado: 'Activo', ultimoAcceso: new Date().toISOString() }];
};
export const createUser = async (u: any) => {
    const data = JSON.parse(localStorage.getItem(DB_MAP.users) || '[]');
    const newUser = { id: `u${Date.now()}`, estado: 'Activo', ultimoAcceso: new Date().toISOString(), ...u };
    data.push(newUser);
    localStorage.setItem(DB_MAP.users, JSON.stringify(data));
    forcePushAllToCloud();
    return newUser;
};
export const updateUser = async (id: string, u: any) => {
    const data = JSON.parse(localStorage.getItem(DB_MAP.users) || '[]');
    const idx = data.findIndex((i: any) => i.id === id);
    if (idx > -1) { data[idx] = { ...data[idx], ...u }; localStorage.setItem(DB_MAP.users, JSON.stringify(data)); forcePushAllToCloud(); }
};

export const getInventario = async (): Promise<InventoryItem[]> => JSON.parse(localStorage.getItem(DB_MAP.inventario) || '[]');
export const createInventarioItem = async (item: any) => {
    const data = JSON.parse(localStorage.getItem(DB_MAP.inventario) || '[]');
    const newItem = { id: `inv${Date.now()}`, ...item };
    data.push(newItem);
    localStorage.setItem(DB_MAP.inventario, JSON.stringify(data));
    forcePushAllToCloud();
    return newItem;
};
export const updateInventarioItem = async (id: string, item: any) => {
    const data = JSON.parse(localStorage.getItem(DB_MAP.inventario) || '[]');
    const idx = data.findIndex((i: any) => i.id === id);
    if (idx > -1) { data[idx] = { ...data[idx], ...item }; localStorage.setItem(DB_MAP.inventario, JSON.stringify(data)); forcePushAllToCloud(); }
};
export const deleteInventarioItem = async (id: string) => {
    const data = JSON.parse(localStorage.getItem(DB_MAP.inventario) || '[]');
    localStorage.setItem(DB_MAP.inventario, JSON.stringify(data.filter((i: any) => i.id !== id)));
    forcePushAllToCloud();
};

export const getProveedores = async (): Promise<Proveedor[]> => JSON.parse(localStorage.getItem(DB_MAP.proveedores) || '[]');
export const createProveedor = async (p: any) => {
    const data = JSON.parse(localStorage.getItem(DB_MAP.proveedores) || '[]');
    const newP = { id: `prov${Date.now()}`, creadoEn: new Date().toISOString(), ...p };
    data.unshift(newP);
    localStorage.setItem(DB_MAP.proveedores, JSON.stringify(data));
    forcePushAllToCloud();
    return newP;
};
export const updateProveedor = async (id: string, p: any) => {
    const data = JSON.parse(localStorage.getItem(DB_MAP.proveedores) || '[]');
    const idx = data.findIndex((i: any) => i.id === id);
    if (idx > -1) { data[idx] = { ...data[idx], ...p }; localStorage.setItem(DB_MAP.proveedores, JSON.stringify(data)); forcePushAllToCloud(); }
};
export const deleteProveedor = async (id: string) => {
    const data = JSON.parse(localStorage.getItem(DB_MAP.proveedores) || '[]');
    localStorage.setItem(DB_MAP.proveedores, JSON.stringify(data.filter((i: any) => i.id !== id)));
    forcePushAllToCloud();
};

export const getTareasProveedor = async (): Promise<TareaProveedor[]> => JSON.parse(localStorage.getItem(DB_MAP.tareas) || '[]');
export const createTareaProveedor = async (t: any) => {
    const data = JSON.parse(localStorage.getItem(DB_MAP.tareas) || '[]');
    const newT = { id: `task${Date.now()}`, completada: false, ...t };
    data.push(newT);
    localStorage.setItem(DB_MAP.tareas, JSON.stringify(data));
    forcePushAllToCloud();
    return newT;
};
export const updateTareaProveedor = async (id: string, t: any) => {
    const data = JSON.parse(localStorage.getItem(DB_MAP.tareas) || '[]');
    const idx = data.findIndex((i: any) => i.id === id);
    if (idx > -1) { data[idx] = { ...data[idx], ...t }; localStorage.setItem(DB_MAP.tareas, JSON.stringify(data)); forcePushAllToCloud(); }
};

export const getSriCredentials = async (): Promise<SriCredential[]> => JSON.parse(localStorage.getItem(DB_MAP.sri) || '[]');

export const addSriCredential = async (cred: SriCredential) => {
    const data = JSON.parse(localStorage.getItem(DB_MAP.sri) || '[]');
    const idx = data.findIndex((c: any) => c.ruc === cred.ruc);
    if (idx > -1) data[idx] = { ...data[idx], ...cred };
    else data.push({ ...cred, updatedAt: new Date().toISOString() });
    localStorage.setItem(DB_MAP.sri, JSON.stringify(data));
    forcePushAllToCloud();
    return data;
};

export const updateTrabajoPhoto = async (trabajoId: string, photoUrl: string): Promise<void> => {
    const trabajos = JSON.parse(localStorage.getItem(DB_MAP.trabajos) || '[]');
    const idx = trabajos.findIndex((t: any) => t.id === trabajoId);
    if (idx > -1) { trabajos[idx].fotoOriginalUrl = photoUrl; localStorage.setItem(DB_MAP.trabajos, JSON.stringify(trabajos)); forcePushAllToCloud(); }
};

export const createPublicPedido = async (clientData: any, cartItems: any[]): Promise<Trabajo> => {
    const total = cartItems.reduce((acc, item) => acc + (item.producto.precio * item.cantidad), 0);
    const subtipo = cartItems.map(item => `${item.cantidad}x ${item.producto.nombre}`).join(', ');
    return createTrabajo({ titular: clientData.nombre, tipo: TrabajoTipo.GENERAL, subtipo, cantidad: cartItems.length, total, abono: 0, estado: TrabajoEstado.PENDIENTE, origen: 'Web' }, 'Usuario Web');
};

export const testCloudConnection = async (customUrl?: string): Promise<{success: boolean, message: string}> => {
    const config = getConfig();
    const url = customUrl || config.googleScriptUrl;
    if (!url || !url.includes('macros')) return { success: false, message: "URL inválida." };
    try {
        const response = await fetch(`${url}?action=TEST&ts=${Date.now()}`, { method: 'GET', redirect: 'follow' });
        const data = await response.json();
        return data.success ? { success: true, message: "✅ ¡CONEXIÓN PERFECTA!" } : { success: false, message: "Error en el script." };
    } catch (e) { return { success: false, message: "Fallo de red o URL incorrecta." }; }
};

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
            body: JSON.stringify({ action: 'FULL_BACKUP', payload: dataToExport, timestamp: new Date().toISOString() })
        });
        setTimeout(() => window.dispatchEvent(new CustomEvent('cloud-sync-idle')), 800);
    } catch (e) { window.dispatchEvent(new CustomEvent('cloud-sync-idle')); }
};

export const hydrateFromCloud = async (): Promise<boolean> => {
    const config = getConfig();
    if (!config.googleScriptUrl || !config.googleScriptUrl.includes('macros')) return false;
    try {
        window.dispatchEvent(new CustomEvent('cloud-sync-active'));
        const response = await fetch(`${config.googleScriptUrl}?action=GET_ALL_DATA&ts=${Date.now()}`, { method: 'GET', redirect: 'follow' });
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

export const seed50Products = async () => {
    const list = [
        { nombre: 'FACTURAS (1/4 OFICIO - BLOCK X 50H - DUPLICADO)', categoria: 'SRI', precio: 15.00, esSRI: true },
        { nombre: 'NOTAS DE VENTA (1/4 OFICIO - BLOCK X 50H - ÚNICO)', categoria: 'SRI', precio: 10.00, esSRI: true }
    ];
    const final = list.map((p, idx) => ({ id: `p-auto-${idx}`, descripcion: `Producto Córdova 2025.`, ...p })) as Producto[];
    localStorage.setItem(DB_MAP.productos, JSON.stringify(final));
    forcePushAllToCloud();
    return final;
};
export const getMasterActividades = async (): Promise<string[]> => ["VENTA DE COMIDAS", "SERVICIOS PROFESIONALES", "TRANSPORTE", "EDUCACION", "SALUD"];
export const setInventario = async (items: InventoryItem[]) => { localStorage.setItem(DB_MAP.inventario, JSON.stringify(items)); forcePushAllToCloud(); };
export const deleteSriCredential = async (ruc: string) => {
    const data = JSON.parse(localStorage.getItem(DB_MAP.sri) || '[]');
    localStorage.setItem(DB_MAP.sri, JSON.stringify(data.filter((c: any) => c.ruc !== ruc)));
    forcePushAllToCloud();
};
export const bulkAddSriCredentials = async (creds: SriCredential[]) => {
    const data = JSON.parse(localStorage.getItem(DB_MAP.sri) || '[]');
    const updated = [...data];
    creds.forEach(newCred => {
        const idx = updated.findIndex((c: any) => c.ruc === newCred.ruc);
        if (idx > -1) updated[idx] = { ...updated[idx], ...newCred };
        else updated.push(newCred);
    });
    localStorage.setItem(DB_MAP.sri, JSON.stringify(updated));
    forcePushAllToCloud();
    return updated;
};
