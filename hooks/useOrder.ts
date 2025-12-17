
import { useState, useMemo, useEffect, useCallback } from 'react';
import { Cliente, Producto, Trabajo, TrabajoTipo, TrabajoEstado, SriCredential } from '../types';
import { createTrabajo, getSriCredentials } from '../services/mockApi';
import { getConfig } from '../services/configService';

export interface CartItem {
    producto: Producto;
    cantidad: number;
}

export const useOrder = (user: string) => {
    // Estado del Pedido
    const [selectedCliente, setSelectedCliente] = useState<Cliente | null>(null);
    const [selectedProductos, setSelectedProductos] = useState<Map<string, CartItem>>(new Map());
    const [jobType, setJobType] = useState<TrabajoTipo>(TrabajoTipo.GENERAL);
    const [titular, setTitular] = useState('');
    const [abono, setAbono] = useState(0);
    const [esRenovacion, setEsRenovacion] = useState(false);
    
    // Estado SRI
    const [sriData, setSriData] = useState({
        establecimiento: '',
        puntoEmision: '',
        claveAcceso: '',
        foundCredential: null as SriCredential | null,
        autoFilled: false
    });

    const [isLoading, setIsLoading] = useState(false);
    const [createdTrabajo, setCreatedTrabajo] = useState<Trabajo | null>(null);

    // Cargar Configuración Inicial
    useEffect(() => {
        const conf = getConfig();
        const [estab = '001', pto = '001'] = conf.numeracionPrefijo.split('-').map(s => s.trim()).filter(Boolean);
        setSriData(prev => ({ ...prev, establecimiento: estab, puntoEmision: pto }));
    }, []);

    // Lógica Inteligente SRI al seleccionar cliente
    useEffect(() => {
        const checkCredentials = async () => {
            if (selectedCliente) {
                const creds = await getSriCredentials();
                const ruc = selectedCliente.ruc || selectedCliente.cedula;
                const cred = creds.find(c => c.ruc === ruc || (ruc.length === 10 && c.ruc === ruc + '001'));
                
                if (cred && cred.password) {
                    setSriData(prev => ({ 
                        ...prev, 
                        claveAcceso: cred.password || '', 
                        foundCredential: cred,
                        autoFilled: true 
                    }));
                    // Resetear el efecto visual de "auto-fill"
                    setTimeout(() => setSriData(prev => ({ ...prev, autoFilled: false })), 2000);
                } else {
                    setSriData(prev => ({ ...prev, claveAcceso: '', foundCredential: null }));
                }
                setTitular(selectedCliente.nombre);
            } else {
                setSriData(prev => ({ ...prev, claveAcceso: '', foundCredential: null }));
                setTitular('');
            }
        };
        checkCredentials();
    }, [selectedCliente]);

    // Cálculos
    const orderTotal = useMemo(() => {
        return Array.from(selectedProductos.values()).reduce((total: number, item: CartItem) => total + (item.producto.precio * item.cantidad), 0);
    }, [selectedProductos]);

    const totalItems = useMemo(() => {
        return Array.from(selectedProductos.values()).reduce((total: number, item: CartItem) => total + item.cantidad, 0);
    }, [selectedProductos]);

    const saldo = orderTotal - abono;

    // Acciones del Carrito
    const addProduct = useCallback((producto: Producto) => {
        setSelectedProductos((prev: Map<string, CartItem>) => {
            const newMap = new Map<string, CartItem>(prev);
            const existing = newMap.get(producto.id);
            newMap.set(producto.id, { producto, cantidad: (existing?.cantidad || 0) + 1 });
            return newMap;
        });
    }, []);

    const removeProduct = useCallback((productId: string) => {
        setSelectedProductos((prev: Map<string, CartItem>) => {
            const newMap = new Map<string, CartItem>(prev);
            newMap.delete(productId);
            return newMap;
        });
    }, []);

    const updateQuantity = useCallback((productId: string, quantity: number) => {
        if (quantity < 1) return;
        setSelectedProductos((prev: Map<string, CartItem>) => {
            const newMap = new Map<string, CartItem>(prev);
            const item = newMap.get(productId);
            if (item) {
                newMap.set(productId, { ...item, cantidad: quantity });
            }
            return newMap;
        });
    }, []);

    const finalizeOrder = async () => {
        if (!selectedCliente || selectedProductos.size === 0) return null;
        setIsLoading(true);
        
        try {
            const items = Array.from(selectedProductos.values());
            const newTrabajo = await createTrabajo({
                clienteId: selectedCliente.id,
                titular: titular || selectedCliente.nombre,
                tipo: jobType,
                subtipo: items.map((i: CartItem) => `${i.cantidad}x ${i.producto.nombre}`).join(', '),
                cantidad: items.reduce((sum: number, i: CartItem) => sum + i.cantidad, 0),
                tamano: 'Varios',
                total: orderTotal,
                abono,
                estado: TrabajoEstado.PENDIENTE,
                establecimiento: jobType === TrabajoTipo.SRI ? sriData.establecimiento : undefined,
                puntoEmision: jobType === TrabajoTipo.SRI ? sriData.puntoEmision : undefined,
                claveAcceso: jobType === TrabajoTipo.SRI ? sriData.claveAcceso : undefined,
                esRenovacion,
            }, user);
            
            setCreatedTrabajo(newTrabajo);
            return newTrabajo;
        } catch (error) {
            console.error("Error creating order", error);
            return null;
        } finally {
            setIsLoading(false);
        }
    };

    const resetOrder = useCallback(() => {
        setSelectedCliente(null);
        setSelectedProductos(new Map());
        setTitular('');
        setAbono(0);
        setCreatedTrabajo(null);
        setJobType(TrabajoTipo.GENERAL);
        setEsRenovacion(false);
        setSriData(prev => ({ ...prev, claveAcceso: '', foundCredential: null }));
    }, []);

    return {
        // State
        selectedCliente,
        cartItems: Array.from(selectedProductos.values()), // Exportar como array para facilitar renderizado
        jobType,
        titular,
        abono,
        esRenovacion,
        sriData,
        orderTotal,
        totalItems,
        saldo,
        isLoading,
        createdTrabajo,

        // Setters
        setSelectedCliente,
        setJobType,
        setTitular,
        setAbono,
        setEsRenovacion,
        setSriData,

        // Actions
        addProduct,
        removeProduct,
        updateQuantity,
        finalizeOrder,
        resetOrder
    };
};
