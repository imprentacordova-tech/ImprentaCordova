
import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode, useRef } from 'react';
import { Cliente, Trabajo, Producto, User, InventoryItem, Proveedor, TareaProveedor, SriCredential } from '../types';
import * as api from '../services/mockApi';

interface DataContextType {
    // Data State
    clientes: Cliente[];
    trabajos: Trabajo[];
    productos: Producto[];
    users: User[];
    inventario: InventoryItem[];
    proveedores: Proveedor[];
    tareas: TareaProveedor[];
    sriCredentials: SriCredential[];
    
    // Meta State
    loading: boolean;
    syncing: boolean;
    error: string | null;
    lastUpdated: Date;

    // Actions
    refreshData: (fullReload?: boolean) => Promise<void>;
    addCliente: (c: any) => Promise<Cliente>;
    updateCliente: (id: string, c: any) => Promise<void>;
    addTrabajo: (t: any, user: string) => Promise<Trabajo>;
    updateTrabajoStatus: (id: string, status: any, user: string) => Promise<void>;
    addProducto: (p: any) => Promise<any>;
    updateProducto: (id: string, p: any) => Promise<void>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    // --- State Definitions ---
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
    const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

    // Ref to avoid closure stale state in intervals if needed, though simpler approach used here
    const isFirstLoad = useRef(true);

    // --- Core Data Fetching Logic ---

    const refreshData = useCallback(async (fullReload = false) => {
        setSyncing(true);
        try {
            // High frequency data (Always fetch)
            const tData = await api.getTrabajos();
            setTrabajos(tData);

            // Low frequency data (Fetch only on full reload or first load)
            if (fullReload || isFirstLoad.current) {
                const [
                    cData, pData, uData, iData, provData, taskData, sriData
                ] = await Promise.all([
                    api.getClientes(),
                    api.getProductos(),
                    api.getUsers(),
                    api.getInventario(),
                    api.getProveedores(),
                    api.getTareasProveedor(),
                    api.getSriCredentials()
                ]);

                setClientes(cData);
                setProductos(pData);
                setUsers(uData);
                setInventario(iData);
                setProveedores(provData);
                setTareas(taskData);
                setSriCredentials(sriData);
                isFirstLoad.current = false;
            }
            
            setLastUpdated(new Date());
            setError(null);
        } catch (err) {
            console.error("Error cargando datos:", err);
            // Don't set global error on background sync failure to avoid UI disruption
            if (isFirstLoad.current) {
                setError("Error de sincronización con la base de datos.");
            }
        } finally {
            setLoading(false);
            setSyncing(false);
        }
    }, []);

    // --- Lifecycle Effects ---

    // 1. Initial Load
    useEffect(() => {
        refreshData(true);
    }, [refreshData]);

    // 2. Smart Polling (Heartbeat) - Sync only high-frequency data (Trabajos) every 30s
    useEffect(() => {
        const heartbeat = setInterval(() => {
            if (!document.hidden) { // Only sync if tab is active
                refreshData(false);
            }
        }, 30000); 

        return () => clearInterval(heartbeat);
    }, [refreshData]);

    // --- Optimistic Actions Wrappers ---

    const addCliente = async (clienteData: any) => {
        // Optimistic UI could be applied here, but for creation IDs usually come from backend/service logic
        // For now, we wait for service but update local state immediately after
        const newCliente = await api.createCliente(clienteData);
        setClientes(prev => [newCliente, ...prev]);
        return newCliente;
    };

    const updateClienteState = async (id: string, data: any) => {
        // Optimistic
        setClientes(prev => prev.map(c => c.id === id ? { ...c, ...data } : c));
        // Background Sync
        await api.updateCliente(id, data);
    };

    const addTrabajo = async (trabajoData: any, user: string) => {
        const newTrabajo = await api.createTrabajo(trabajoData, user);
        setTrabajos(prev => [newTrabajo, ...prev]);
        return newTrabajo;
    };

    const updateTrabajoStatusState = async (id: string, status: any, user: string) => {
        // Optimistic Update
        setTrabajos(prev => prev.map(t => t.id === id ? { ...t, estado: status, actualizadoPor: user } : t));
        // Background API Call
        await api.updateTrabajoStatus(id, status, user);
    };

    const addProducto = async (p: any) => {
        const newP = await api.createProducto(p);
        setProductos(prev => [newP, ...prev]);
        return newP;
    };

    const updateProductoState = async (id: string, p: any) => {
        setProductos(prev => prev.map(prod => prod.id === id ? { ...prod, ...p } : prod));
        await api.updateProducto(id, p);
    };

    const value = {
        clientes, trabajos, productos, users, inventario, proveedores, tareas, sriCredentials,
        loading, syncing, error, lastUpdated,
        refreshData,
        addCliente,
        updateCliente: updateClienteState,
        addTrabajo,
        updateTrabajoStatus: updateTrabajoStatusState,
        addProducto,
        updateProducto: updateProductoState
    };

    return (
        <DataContext.Provider value={value}>
            {children}
        </DataContext.Provider>
    );
};

export const useData = () => {
    const context = useContext(DataContext);
    if (context === undefined) {
        throw new Error('useData debe ser usado dentro de un DataProvider');
    }
    return context;
};
