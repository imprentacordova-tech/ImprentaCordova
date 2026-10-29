/**
 * DataContext Facade — Backward-compatible re-export
 * 
 * This file now acts as a thin facade that composes all domain-specific contexts.
 * Existing components can continue using `useData()` without modification.
 * New components should prefer domain-specific hooks: useTrabajos, useClientes, etc.
 */
import React, { createContext, useContext, ReactNode } from 'react';
import { Cliente, Trabajo, Producto, User, InventoryItem, Proveedor, TareaProveedor, SriCredential, TrabajoEstado } from '../types';
import { TrabajosProvider, useTrabajos, RealtimeEstado } from './TrabajosContext';
import { ClientesProvider, useClientes } from './ClientesContext';
import { InventarioProvider, useInventario } from './InventarioContext';
import { ProductosProvider, useProductos } from './ProductosContext';
import { ConfigProvider, useConfig } from './ConfigContext';
import { supabase } from '../services/supabase';

export const CATEGORY_EMOJIS: Record<string, string> = {
    'Todas': '✨',
    'SRI': '🏛️',
    'Documentos SRI': '🏛️',
    'Impresión': '🖨️',
    'Sellos': '📜',
    'Diseño': '🎨',
    'Publicidad': '📣',
    'Suministros': '📦',
    'Varias': '⚙️',
    'General': '📋',
    'Tarjetas': '💳',
    'Etiquetas': '🏷️',
    'Packaging': '📦',
    'Gran Formato': '🖼️',
    'Merch': '🎁',
    'Oficina': '📎',
    'Combos': '✨'
};

interface DataContextType {
    clientes: Cliente[];
    trabajos: Trabajo[];
    productos: Producto[];
    users: User[];
    inventario: InventoryItem[];
    proveedores: Proveedor[];
    tareas: TareaProveedor[];
    sriCredentials: SriCredential[];
    config: any;
    loading: boolean;
    syncing: boolean;
    error: string | null;
    refreshData: () => Promise<void>;
    addCliente: (c: any) => Promise<Cliente>;
    updateCliente: (id: string, c: any) => Promise<void>;
    deleteCliente: (id: string) => Promise<void>;
    addTrabajo: (t: any, user: string, imageFile?: File | null) => Promise<Trabajo>;
    updateTrabajoStatus: (id: string, status: TrabajoEstado, user: string) => Promise<void>;
    addProducto: (p: any) => Promise<any>;
    createProducto: (p: any) => Promise<any>;
    updateProducto: (id: string, p: any) => Promise<void>;
    deleteProducto: (id: string) => Promise<void>;
    bulkCreateProductos: (products: Partial<Producto>[]) => Promise<void>;
    seedCatalog: () => Promise<void>;
    addInventoryItem: (item: any) => Promise<void>;
    updateInventoryItem: (id: string, item: any) => Promise<void>;
    deleteInventoryItem: (id: string) => Promise<void>;
    upsertSriCredential: (cred: SriCredential) => Promise<void>;
    bulkAddSriCredentials: (creds: SriCredential[]) => Promise<void>;
    deleteSriCredential: (ruc: string) => Promise<void>;
    updateConfig: (data: any) => Promise<void>;
    updateTrabajoPhoto: (id: string, url: string) => Promise<void>;
    updateTrabajoEvidencia: (id: string, url: string) => Promise<void>;
    uploadFile: (file: File, bucket: string, path: string) => Promise<string>;
    registerRetiro: (id: string, pagoFinal: number, user: string, fotoRetiroUrl?: string, notasEntrega?: string) => Promise<Trabajo>;
    registrarAbono: (id: string, monto: number, user: string) => Promise<Trabajo>;
    aprobarArte: (id: string) => Promise<Trabajo>;
    createPublicOrder: (clientData: { nombre: string, telefono: string }, items: any[]) => Promise<Trabajo>;
    getClientDebt: (clienteId: string) => number;
    /** Salud del canal en vivo (Supabase Realtime) y momento del último dato recibido. */
    realtimeEstado: RealtimeEstado;
    ultimaSync: number | null;
    syncFromLocalStorage: () => Promise<void>;
    addProveedor: (p: any) => Promise<void>;
    updateProveedor: (id: string, p: any) => Promise<void>;
    deleteProveedor: (id: string) => Promise<void>;
    createTareaProveedor: (t: any) => Promise<void>;
    updateTareaProveedor: (id: string, t: any) => Promise<void>;
    deleteTareaProveedor: (id: string) => Promise<void>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

const DataContextFacade: React.FC<{ children: ReactNode }> = ({ children }) => {
    const { trabajos, loading: tLoading, fetchTrabajos, addTrabajo, updateTrabajoStatus, updateTrabajoPhoto, updateTrabajoEvidencia, registerRetiro, registrarAbono, aprobarArte, getClientDebt, realtimeEstado, ultimaSync } = useTrabajos();
    const { clientes, loading: cLoading, fetchClientes, addCliente, updateCliente, deleteCliente } = useClientes();
    const { inventario, loading: iLoading, fetchInventario, addItem: addInvItem, updateItem: updateInvItem, deleteItem: deleteInvItem } = useInventario();
    const { productos, loading: pLoading, fetchProductos, addProducto, updateProducto, deleteProducto, seedCatalog } = useProductos();
    const { config, loading: cfgLoading, updateConfig, sriCredentials, upsertSriCredential, deleteSriCredential, proveedores, tareas, addProveedor, updateProveedor, deleteProveedor, createTarea, updateTarea, deleteTarea, users } = useConfig();

    const loading = tLoading || cLoading || iLoading || pLoading || cfgLoading;

    const refreshData = async () => {
        await Promise.all([fetchTrabajos(), fetchClientes(), fetchInventario(), fetchProductos()]);
    };

    const uploadFile = async (file: File, bucket: string, path: string): Promise<string> => {
        const ext = file.name.split('.').pop();
        const fileName = `${path}.${ext}`;
        const { error } = await supabase.storage.from(bucket).upload(fileName, file);
        if (error) throw error;
        const { data: { publicUrl } } = supabase.storage.from(bucket).getPublicUrl(fileName);
        return publicUrl;
    };

    const addInventoryItem = addInvItem;
    const updateInventoryItem = updateInvItem;
    const deleteInventoryItem = deleteInvItem;

    const bulkCreateProductos = async (products: Partial<Producto>[]) => {
        const dbProducts = products.map(p => ({
            nombre: p.nombre,
            descripcion: p.descripcion,
            precio: p.precio,
            categoria: p.categoria,
            es_sri: (p as any).esSRI ?? false,
        }));
        const { error } = await supabase.from('productos').insert(dbProducts);
        if (error) throw error;
        await fetchProductos();
    };

    const bulkAddSriCredentials = async (creds: SriCredential[]) => {
        const { error } = await supabase.from('sri_credentials').upsert(creds);
        if (error) throw error;
    };

    const createProducto = addProducto;

    const syncFromLocalStorage = async () => {
        console.warn('[DataContext] syncFromLocalStorage is deprecated. Use Supabase directly.');
    };

    const createPublicOrder = async (clientData: { nombre: string, telefono: string }, items: any[]) => {
        let cliente = clientes.find(c => c.telefono?.includes(clientData.telefono));
        if (!cliente) {
            cliente = await addCliente({ ...clientData, cedula: '9999999999', regimen: 'General' });
        }
        const totalItems = items.reduce((acc, item) => acc + (item.total || 0), 0);
        return await addTrabajo({
            clienteId: cliente.id,
            titular: cliente.nombre,
            tipo: items.map(i => i.nombre).join(', ') || 'Pedido Web',
            subtipo: 'Orden Publica / Ecommerce',
            total: totalItems,
            abono: 0,
            saldo: totalItems,
            origen: 'Publico'
        }, 'Sistema');
    };

    const value: DataContextType = {
        clientes, trabajos, productos, users: users as any, inventario, proveedores: proveedores as any, tareas: tareas as any, sriCredentials, config,
        loading, syncing: false, error: null,
        refreshData, addCliente, updateCliente, deleteCliente, addTrabajo, updateTrabajoStatus,
        addProducto, createProducto, updateProducto, deleteProducto, bulkCreateProductos,
        seedCatalog, addInventoryItem, updateInventoryItem, deleteInventoryItem,
        upsertSriCredential, bulkAddSriCredentials, deleteSriCredential, updateConfig,
        updateTrabajoPhoto, updateTrabajoEvidencia, registerRetiro, registrarAbono, aprobarArte,
        uploadFile,
        createPublicOrder, getClientDebt, realtimeEstado, ultimaSync, syncFromLocalStorage,
        addProveedor, updateProveedor, deleteProveedor,
        createTareaProveedor: createTarea, updateTareaProveedor: updateTarea, deleteTareaProveedor: deleteTarea,
    };

    return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
};

export const DataProvider: React.FC<{ children: ReactNode }> = ({ children }) => (
    <TrabajosProvider>
        <ClientesProvider>
            <InventarioProvider>
                <ProductosProvider>
                    <ConfigProvider>
                        <DataContextFacade>
                            {children}
                        </DataContextFacade>
                    </ConfigProvider>
                </ProductosProvider>
            </InventarioProvider>
        </ClientesProvider>
    </TrabajosProvider>
);

export const useData = () => {
    const context = useContext(DataContext);
    if (!context) throw new Error('useData debe usarse dentro de DataProvider');
    return context;
};

// Re-export domain hooks for new components
export { useTrabajos } from './TrabajosContext';
export { useClientes } from './ClientesContext';
export { useInventario } from './InventarioContext';
export { useProductos } from './ProductosContext';
export { useConfig } from './ConfigContext';
