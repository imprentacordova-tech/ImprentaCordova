
import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
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
    
    // Loading States
    loading: boolean;
    syncing: boolean;
    error: string | null;

    // Actions
    refreshData: () => Promise<void>;
    addCliente: (c: any) => Promise<Cliente>;
    updateCliente: (id: string, c: any) => Promise<void>;
    addTrabajo: (t: any, user: string) => Promise<Trabajo>;
    updateTrabajoStatus: (id: string, status: any, user: string) => Promise<void>;
    addProducto: (p: any) => Promise<any>;
    updateProducto: (id: string, p: any) => Promise<void>;
    // ... se pueden añadir más acciones específicas según necesidad
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
            // Carga paralela para eficiencia
            const [
                cData, tData, pData, uData, iData, provData, taskData, sriData
            ] = await Promise.all([
                api.getClientes(),
                api.getTrabajos(),
                api.getProductos(),
                api.getUsers(),
                api.getInventario(),
                api.getProveedores(),
                api.getTareasProveedor(),
                api.getSriCredentials()
            ]);

            setClientes(cData);
            setTrabajos(tData);
            setProductos(pData);
            setUsers(uData);
            setInventario(iData);
            setProveedores(provData);
            setTareas(taskData);
            setSriCredentials(sriData);
            setError(null);
        } catch (err) {
            console.error("Error cargando datos:", err);
            setError("Error de sincronización con la base de datos.");
        } finally {
            setLoading(false);
            setSyncing(false);
        }
    }, []);

    // Carga inicial
    useEffect(() => {
        refreshData();
    }, [refreshData]);

    // --- Wrappers para acciones que actualizan el estado local optimísticamente o recargan ---

    const addCliente = async (clienteData: any) => {
        const newCliente = await api.createCliente(clienteData);
        setClientes(prev => [newCliente, ...prev]);
        return newCliente;
    };

    const updateClienteState = async (id: string, data: any) => {
        await api.updateCliente(id, data);
        setClientes(prev => prev.map(c => c.id === id ? { ...c, ...data } : c));
    };

    const addTrabajo = async (trabajoData: any, user: string) => {
        const newTrabajo = await api.createTrabajo(trabajoData, user);
        setTrabajos(prev => [newTrabajo, ...prev]);
        return newTrabajo;
    };

    const updateTrabajoStatusState = async (id: string, status: any, user: string) => {
        await api.updateTrabajoStatus(id, status, user);
        setTrabajos(prev => prev.map(t => t.id === id ? { ...t, estado: status, actualizadoPor: user } : t));
    };

    const addProducto = async (p: any) => {
        const newP = await api.createProducto(p);
        setProductos(prev => [newP, ...prev]);
        return newP;
    };

    const updateProductoState = async (id: string, p: any) => {
        await api.updateProducto(id, p);
        setProductos(prev => prev.map(prod => prod.id === id ? { ...prod, ...p } : prod));
    };

    const value = {
        clientes, trabajos, productos, users, inventario, proveedores, tareas, sriCredentials,
        loading, syncing, error,
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
