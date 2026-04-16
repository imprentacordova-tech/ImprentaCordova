import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode, useRef } from 'react';
import { Cliente, Trabajo, Producto, User, InventoryItem, Proveedor, TareaProveedor, SriCredential } from '../types';
import { supabase } from '../services/supabase';

interface DataContextType {
    clientes: Cliente[];
    trabajos: Trabajo[];
    productos: Producto[];
    users: User[];
    inventario: InventoryItem[];
    proveedores: Proveedor[];
    tareas: TareaProveedor[];
    sriCredentials: SriCredential[];
    loading: boolean;
    syncing: boolean;
    error: string | null;
    refreshData: () => Promise<void>;
    addCliente: (c: any) => Promise<Cliente>;
    updateCliente: (id: string, c: any) => Promise<void>;
    addTrabajo: (t: any, user: string) => Promise<Trabajo>;
    updateTrabajoStatus: (id: string, status: any, user: string) => Promise<void>;
    addProducto: (p: any) => Promise<any>;
    updateProducto: (id: string, p: any) => Promise<void>;
    // Inventory
    addInventoryItem: (item: any) => Promise<void>;
    updateInventoryItem: (id: string, item: any) => Promise<void>;
    deleteInventoryItem: (id: string) => Promise<void>;
    // SRI Credentials
    upsertSriCredential: (cred: SriCredential) => Promise<void>;
    // Helpers
    createPublicOrder: (clientData: { nombre: string, telefono: string }, items: any[]) => Promise<Trabajo>;
    getClientDebt: (clienteId: string) => number;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

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
    
    const refreshData = useCallback(async () => {
        setSyncing(true);
        try {
            const [
                { data: cData }, { data: tData }, { data: pData }, 
                { data: provData }, { data: invData }, { data: sriData }
            ] = await Promise.all([
                supabase.from('clientes').select('*').order('creado_en', { ascending: false }),
                supabase.from('trabajos').select('*').order('fecha_entrada', { ascending: false }),
                supabase.from('productos').select('*').order('nombre'),
                supabase.from('proveedores').select('*').order('nombre'),
                supabase.from('inventario').select('*').order('item'),
                supabase.from('sri_credentials').select('*')
            ]);

            if (cData) setClientes(cData as any);
            if (tData) setTrabajos(tData as any);
            if (pData) setProductos(pData as any);
            if (provData) setProveedores(provData as any);
            if (invData) setInventario(invData as any);
            if (sriData) setSriCredentials(sriData as any);
            
            setError(null);
        } catch (err) {
            console.error("Supabase Sync Error:", err);
            setError("Error al sincronizar con la base de datos.");
        } finally {
            setLoading(false);
            setSyncing(false);
        }
    }, []);

    useEffect(() => {
        refreshData();

        // Suscripción en tiempo real para cambios globales
        const channel = supabase
            .channel('db-all-changes')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'trabajos' }, () => refreshData())
            .on('postgres_changes', { event: '*', schema: 'public', table: 'inventario' }, () => refreshData())
            .on('postgres_changes', { event: '*', schema: 'public', table: 'clientes' }, () => refreshData())
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
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
        const { data, error } = await supabase.from('trabajos').insert([{ ...trabajoData, creado_por: user }]).select().single();
        if (error) throw error;
        setTrabajos(prev => [data as any, ...prev]);
        return data as any;
    };

    const updateTrabajoStatus = async (id: string, status: any, user: string) => {
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

    const updateProducto = async (id: string, p: any) => {
        const { error } = await supabase.from('productos').update(p).eq('id', id);
        if (error) throw error;
        setProductos(prev => prev.map(prod => prod.id === id ? { ...prod, ...p } : prod));
    };

    // Inventory Handlers
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

    // SRI Handlers
    const upsertSriCredential = async (cred: SriCredential) => {
        const { error } = await supabase.from('sri_credentials').upsert(cred);
        if (error) throw error;
        refreshData();
    };

    const createPublicOrder = async (clientData: { nombre: string, telefono: string }, items: any[]) => {
        // 1. Buscar o Crear Cliente
        let cliente = clientes.find(c => c.telefono?.includes(clientData.telefono) || c.nombre.toLowerCase() === clientData.nombre.toLowerCase());
        
        if (!cliente) {
            cliente = await addCliente({
                nombre: clientData.nombre.toUpperCase(),
                telefono: [clientData.telefono],
                cedula: '9999999999',
                direccion: 'Pedido Web',
                regimen: 'General'
            });
        }

        // 2. Calcular Totales y Subtipo
        const total = items.reduce((acc, item) => acc + (item.producto.precio * item.cantidad), 0);
        const subtipo = items.map(item => `${item.cantidad}x ${item.producto.nombre}`).join(', ');

        // 3. Crear Trabajo como COTIZACIÓN (según requerimiento del usuario)
        const newJob = {
            cliente_id: cliente.id,
            titular: cliente.nombre,
            tipo: 'General',
            subtipo,
            cantidad: items.length,
            total,
            abono: 0,
            saldo: total,
            estado: 'Cotización',
            origen: 'Web',
            fecha_entrada: new Date().toISOString()
        };

        return await addTrabajo(newJob, 'Web/Cliente');
    };

    const getClientDebt = (clienteId: string) => {
        return trabajos
            .filter(t => t.cliente_id === clienteId && t.estado !== 'Entregado')
            .reduce((sum, t) => sum + (t.saldo || 0), 0);
    };

    const value = {
        clientes, trabajos, productos, users, inventario, proveedores, tareas, sriCredentials,
        loading, syncing, error,
        refreshData,
        addCliente,
        updateCliente,
        addTrabajo,
        updateTrabajoStatus,
        addProducto,
        updateProducto,
        addInventoryItem,
        updateInventoryItem,
        deleteInventoryItem,
        upsertSriCredential,
        createPublicOrder,
        getClientDebt
    };


    return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
};

export const useData = () => {
    const context = useContext(DataContext);
    if (!context) throw new Error('useData debe usarse dentro de DataProvider');
    return context;
};
