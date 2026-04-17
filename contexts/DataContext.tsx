import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { Cliente, Trabajo, Producto, User, InventoryItem, Proveedor, TareaProveedor, SriCredential, TrabajoEstado } from '../types';
import { supabase } from '../services/supabase';
import { MASTER_CATALOG } from '../services/catalogData';

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
    addTrabajo: (t: any, user: string) => Promise<Trabajo>;
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
    registerRetiro: (id: string, pagoFinal: number, user: string) => Promise<Trabajo>;
    aprobarArte: (id: string) => Promise<Trabajo>;
    createPublicOrder: (clientData: { nombre: string, telefono: string }, items: any[]) => Promise<Trabajo>;
    getClientDebt: (clienteId: string) => number;
    syncFromLocalStorage: () => Promise<void>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

// Helper para mapear snake_case (DB) a camelCase (UI) si es necesario, 
// o simplemente asegurar que la UI reciba lo que espera.
const mapDBTrabajo = (t: any): Trabajo => ({
    ...t,
    clienteId: t.cliente_id,
    fechaEntrada: t.fecha_entrada,
    fechaEntrega: t.fecha_entrega,
    creadoPor: t.creado_por,
    actualizadoPor: t.actualizado_por,
    fotoOriginalUrl: t.foto_original_url,
    estadoClave: t.estado_clave,
    imprimirClave: t.imprimir_clave,
    esRenovacion: t.es_renovacion,
    fechaVencimiento: t.fecha_vencimiento,
    actividadSeleccionada: t.actividad_seleccionada,
    arteAprobado: t.arte_aprobado
});

export const DataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [clientes, setClientes] = useState<Cliente[]>([]);
    const [trabajos, setTrabajos] = useState<Trabajo[]>([]);
    const [productos, setProductos] = useState<Producto[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const [inventario, setInventario] = useState<InventoryItem[]>([]);
    const [proveedores, setProveedores] = useState<Proveedor[]>([]);
    const [tareas, setTareas] = useState<TareaProveedor[]>([]);
    const [sriCredentials, setSriCredentials] = useState<SriCredential[]>([]);

    const [loading, setLoading] = useState(true);
    const [syncing, setSyncing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [config, setConfig] = useState<any>(null);
    
    const refreshData = useCallback(async (isAutoSeed = false) => {
        setSyncing(true);
        try {
            const [
                { data: cData }, { data: tData }, { data: pData }, 
                { data: provData }, { data: invData }, { data: sriData },
                { data: uData }, { data: configData }
            ] = await Promise.all([
                supabase.from('clientes').select('*').order('creado_en', { ascending: false }),
                supabase.from('trabajos').select('*').order('fecha_entrada', { ascending: false }),
                supabase.from('productos').select('*').order('nombre'),
                supabase.from('proveedores').select('*').order('nombre'),
                supabase.from('inventario').select('*').order('item'),
                supabase.from('sri_credentials').select('*').order('ruc'),
                supabase.from('users').select('*'),
                supabase.from('app_config').select('data').eq('id', 1).maybeSingle()
            ]);

            if (cData) setClientes(cData as any);
            if (tData) setTrabajos(tData.map(mapDBTrabajo) as any);
            if (pData) {
                setProductos(pData as any);
                // Auto-seed if empty and not already seeding
                if (pData.length === 0 && !isAutoSeed) {
                    console.log("📦 Catálogo vacío detectado. Sincronizando catálogo maestro...");
                    await seedCatalog(true);
                    return; 
                }
            }
            if (provData) setProveedores(provData as any);
            if (invData) setInventario(invData as any);
            if (sriData) setSriCredentials(sriData as any);
            if (uData) setUsers(uData as any);
            if (configData) setConfig(configData.data);
            
            setError(null);
        } catch (err) {
            console.error("Supabase Sync Error:", err);
            setError("Error al sincronizar con la base de datos.");
        } finally {
            setLoading(false);
            setSyncing(false);
        }
    }, [seedCatalog]);

    const deductInventory = async (trabajo: any) => {
        const subtipo = (trabajo.subtipo || "").toUpperCase();
        if (subtipo.includes('FACTURA') || subtipo.includes('NOTA DE VENTA')) {
             const { data: inv } = await supabase.from('inventario').select('*');
             if (!inv) return;
             const matchBlocks = subtipo.match(/^(\d+)X/);
             const numBlocks = matchBlocks ? parseInt(matchBlocks[1]) : 1;
             const hojasConsumidas = numBlocks * 0.1;
             for (const item of inv) {
                 if (item.item.toUpperCase().includes('QUIMICO')) {
                     const newCant = Math.max(0, item.cantidad - hojasConsumidas);
                     await supabase.from('inventario').update({ cantidad: newCant }).eq('id', item.id);
                 }
             }
        }
    };

    const syncFromLocalStorage = async () => {
        setSyncing(true);
        try {
            const keys = { trabajos: 'mockTrabajosData', clientes: 'mockClientesData', productos: 'mockProductosData', inventario: 'mockInventarioData' };
            const localClientes = JSON.parse(localStorage.getItem(keys.clientes) || '[]');
            const localTrabajos = JSON.parse(localStorage.getItem(keys.trabajos) || '[]');
            if (localClientes.length > 0) {
                const upsertData = localClientes.map((c: any) => ({ id: c.id, cedula: c.cedula, nombre: c.nombre, telefono: c.telefono, regimen: c.regimen, direccion: c.direccion }));
                await supabase.from('clientes').upsert(upsertData);
            }
            if (localTrabajos.length > 0) {
                const upsertTrabajos = localTrabajos.map((t: any) => ({ cliente_id: t.clienteId, titular: t.titular, tipo: t.tipo, subtipo: t.subtipo, total: t.total, abono: t.abono, saldo: t.saldo, estado: t.estado, creado_por: t.creadoPor }));
                await supabase.from('trabajos').insert(upsertTrabajos);
            }
            Object.values(keys).forEach(k => localStorage.removeItem(k));
            await refreshData();
        } catch (err) { console.error("Migration Error:", err); } finally { setSyncing(false); }
    };

    useEffect(() => {
        refreshData();
        const channels = [
            supabase.channel('db-trabajos').on('postgres_changes', { event: '*', schema: 'public', table: 'trabajos' }, () => refreshData()).subscribe(),
            supabase.channel('db-inventario').on('postgres_changes', { event: '*', schema: 'public', table: 'inventario' }, () => refreshData()).subscribe(),
            supabase.channel('db-clientes').on('postgres_changes', { event: '*', schema: 'public', table: 'clientes' }, () => refreshData()).subscribe(),
            supabase.channel('db-config').on('postgres_changes', { event: '*', schema: 'public', table: 'app_config' }, () => refreshData()).subscribe(),
            supabase.channel('db-sri').on('postgres_changes', { event: '*', schema: 'public', table: 'sri_credentials' }, () => refreshData()).subscribe()
        ];
        return () => { channels.forEach(c => supabase.removeChannel(c)); };
    }, [refreshData]);

    const addCliente = async (clienteData: any) => {
        const { data, error } = await supabase.from('clientes').insert([clienteData]).select().single();
        if (error) throw error;
        setClientes(prev => [data as any, ...prev]);
        return data as any;
    };

    const updateCliente = async (id: string, data: any) => {
        const { error } = await supabase.from('clientes').update(data).eq('id', id);
        if (error) throw error;
        setClientes(prev => prev.map(c => c.id === id ? { ...c, ...data } : c));
    };

    const addTrabajo = async (trabajoData: any, user: string) => {
        const dbData = {
            cliente_id: trabajoData.clienteId || trabajoData.cliente_id,
            titular: trabajoData.titular,
            tipo: trabajoData.tipo,
            subtipo: trabajoData.subtipo,
            cantidad: trabajoData.cantidad,
            total: trabajoData.total,
            abono: trabajoData.abono,
            saldo: trabajoData.saldo,
            estado: trabajoData.estado || TrabajoEstado.PENDIENTE,
            creado_por: user,
            origen: trabajoData.origen || 'Interno'
        };
        const { data, error } = await supabase.from('trabajos').insert([dbData]).select().single();
        if (error) throw error;
        await deductInventory(dbData);
        setTrabajos(prev => [mapDBTrabajo(data), ...prev]);
        return mapDBTrabajo(data);
    };

    const updateTrabajoStatus = async (id: string, status: TrabajoEstado, user: string) => {
        const { error } = await supabase.from('trabajos').update({ estado: status, actualizado_por: user }).eq('id', id);
        if (error) throw error;
        setTrabajos(prev => prev.map(t => t.id === id ? { ...t, estado: status, actualizado_por: user } : t));
    };

    const addProducto = async (p: any) => {
        const { data, error } = await supabase.from('productos').insert([p]).select().single();
        if (error) throw error;
        setProductos(prev => [data as any, ...prev]);
        return data as any;
    };

    // Alias semántico para mayor claridad en los componentes
    const createProducto = async (p: any) => addProducto(p);

    const updateProducto = async (id: string, p: any) => {
        const { error } = await supabase.from('productos').update(p).eq('id', id);
        if (error) throw error;
        setProductos(prev => prev.map(prod => prod.id === id ? { ...prod, ...p } : prod));
    };

    const deleteProducto = async (id: string) => {
        const { error } = await supabase.from('productos').delete().eq('id', id);
        if (error) throw error;
        setProductos(prev => prev.filter(p => p.id !== id));
    };

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
        await refreshData();
    };

    const seedCatalog = useCallback(async (isAuto = false) => {
        setSyncing(true);
        try {
            const dbCatalog = MASTER_CATALOG.map(p => ({
                nombre: p.nombre,
                descripcion: p.descripcion,
                precio: p.precio,
                categoria: p.categoria,
                es_sri: p.esSRI ?? false,
                imagen_url: p.imagenUrl ?? null,
                unit: p.unit ?? null,
                is_popular: p.isPopular ?? false
            }));
            // upsert con ON CONFLICT en 'nombre' para evitar duplicados al re-sync
            const { error } = await supabase.from('productos').upsert(dbCatalog, { onConflict: 'nombre' });
            if (error) throw error;
            await refreshData(true);
        } catch (err) { 
            console.error("Seed Error:", err);
            setError("Error al cargar el catálogo."); 
        } finally { 
            setSyncing(false); 
        }
    }, [refreshData]);

    const addInventoryItem = async (item: any) => {
        const { error } = await supabase.from('inventario').insert([item]);
        if (error) throw error;
        refreshData();
    };

    const updateInventoryItem = async (id: string, item: any) => {
        const { error } = await supabase.from('inventario').update(item).eq('id', id);
        if (error) throw error;
        refreshData();
    };

    const deleteInventoryItem = async (id: string) => {
        const { error } = await supabase.from('inventario').delete().eq('id', id);
        if (error) throw error;
        refreshData();
    };

    const upsertSriCredential = async (cred: SriCredential) => {
        const { error } = await supabase.from('sri_credentials').upsert(cred);
        if (error) throw error;
        // La suscripción se encarga del refresh
    };

    const bulkAddSriCredentials = async (creds: SriCredential[]) => {
        const { error } = await supabase.from('sri_credentials').upsert(creds);
        if (error) throw error;
    };

    const deleteSriCredential = async (ruc: string) => {
        const { error } = await supabase.from('sri_credentials').delete().eq('ruc', ruc);
        if (error) throw error;
    };

    const updateTrabajoPhoto = async (id: string, url: string) => {
        const { error } = await supabase.from('trabajos').update({ foto_original_url: url }).eq('id', id);
        if (error) throw error;
    };

    const registerRetiro = async (id: string, pagoFinal: number, user: string): Promise<Trabajo> => {
        const { data, error } = await supabase.from('trabajos')
            .update({ 
                pago_final: pagoFinal, 
                estado: TrabajoEstado.ENTREGADO, 
                actualizado_por: user 
            })
            .eq('id', id)
            .select()
            .single();
        if (error) throw error;
        const mapped = mapDBTrabajo(data);
        setTrabajos(prev => prev.map(t => t.id === id ? mapped : t));
        return mapped;
    };

    const aprobarArte = async (id: string): Promise<Trabajo> => {
        const { data, error } = await supabase.from('trabajos')
            .update({ arte_aprobado: true })
            .eq('id', id)
            .select()
            .single();
        if (error) throw error;
        const mapped = mapDBTrabajo(data);
        setTrabajos(prev => prev.map(t => t.id === id ? mapped : t));
        return mapped;
    };

    const getClientDebt = (clienteId: string) => {
        return trabajos
            .filter(t => t.clienteId === clienteId)
            .reduce((acc, t) => acc + (t.saldo || 0), 0);
    };

    const createPublicOrder = async (clientData: { nombre: string, telefono: string }, items: any[]) => {
        // Buscar o crear cliente
        let cliente = clientes.find(c => c.telefono === clientData.telefono);
        if (!cliente) {
            cliente = await addCliente({ ...clientData, cedula: '9999999999', regimen: 'General' });
        }

        const totalItems = items.reduce((acc, item) => acc + (item.total || 0), 0);
        
        return await addTrabajo({
            clienteId: cliente.id,
            titular: cliente.nombre,
            tipo: TrabajoTipo.GENERAL,
            subtipo: items.map(i => i.nombre).join(', '),
            total: totalItems,
            abono: 0,
            saldo: totalItems,
            origen: 'Publico'
        }, 'Sistema');
    };

    const updateConfig = async (data: any) => {
        const { error } = await supabase.from('app_config').upsert({ id: 1, data });
        if (error) throw error;
        setConfig(data);
    };

    const value = {
        clientes, trabajos, productos, users, inventario, proveedores, tareas, sriCredentials, config,
        loading, syncing, error,
        refreshData, addCliente, updateCliente, addTrabajo, updateTrabajoStatus,
        addProducto, createProducto, updateProducto, deleteProducto, bulkCreateProductos,
        seedCatalog, addInventoryItem, updateInventoryItem, deleteInventoryItem, 
        upsertSriCredential, bulkAddSriCredentials, deleteSriCredential, updateConfig,
        updateTrabajoPhoto, registerRetiro, aprobarArte,
        createPublicOrder, getClientDebt, syncFromLocalStorage
    };

    return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
};

export const useData = () => {
    const context = useContext(DataContext);
    if (!context) throw new Error('useData debe usarse dentro de DataProvider');
    return context;
};

