
import { useState, useMemo, useEffect, useCallback } from 'react';
import { Cliente, Producto, Trabajo, TrabajoTipo, TrabajoEstado, SriCredential, Regimen } from '../types';
import { createTrabajo, getSriCredentials } from '../services/mockApi';
import { getConfig } from '../services/configService';

export interface CartItem {
    producto: Producto;
    cantidad: number;
}

export const useOrder = (user: string) => {
    const [selectedCliente, setSelectedCliente] = useState<Cliente | null>(null);
    const [selectedProductos, setSelectedProductos] = useState<Map<string, CartItem>>(new Map());
    const [jobType, setJobType] = useState<TrabajoTipo>(TrabajoTipo.SRI);
    const [titular, setTitular] = useState('');
    const [abono, setAbono] = useState(0);
    const [esRenovacion, setEsRenovacion] = useState(false);
    const [imprimirClave, setImprimirClave] = useState(false);
    
    const [sriData, setSriData] = useState({
        establecimiento: '001',
        puntoEmision: '001',
        claveAcceso: '',
        estadoClave: 'PENDIENTE' as 'LISTA' | 'PENDIENTE' | 'ERROR',
        hasKey: false,
        autoFilled: false
    });

    const [isLoading, setIsLoading] = useState(false);

    // Buscar clave SRI automáticamente al seleccionar cliente
    useEffect(() => {
        const checkSriKey = async () => {
            if (selectedCliente) {
                const creds = await getSriCredentials();
                const ruc = (selectedCliente.ruc || selectedCliente.cedula).replace(/\D/g, '');
                
                // Buscar por RUC completo o Cédula + 001
                const cred = creds.find(c => 
                    c.ruc === ruc || 
                    (ruc.length === 10 && c.ruc === ruc + '001') ||
                    (ruc.length === 13 && c.ruc === ruc.substring(0, 10))
                );
                
                if (cred) {
                    setSriData(prev => ({ 
                        ...prev, 
                        claveAcceso: cred.password || '', 
                        hasKey: true, 
                        autoFilled: true,
                        estadoClave: 'LISTA' 
                    }));
                } else {
                    setSriData(prev => ({ 
                        ...prev, 
                        claveAcceso: '', 
                        hasKey: false, 
                        autoFilled: false,
                        estadoClave: 'PENDIENTE' 
                    }));
                }
                setTitular(selectedCliente.nombre);
                
                if (selectedCliente.regimen === Regimen.NEGOCIO_POPULAR) {
                    setSelectedProductos(prev => {
                        const newMap = new Map<string, CartItem>(prev);
                        Array.from(newMap.keys()).forEach((id: string) => {
                            const item = newMap.get(id);
                            if (item && item.producto.nombre.toLowerCase().includes('factura')) {
                                newMap.delete(id);
                            }
                        });
                        return newMap;
                    });
                }
            }
        };
        checkSriKey();
    }, [selectedCliente]);

    const orderTotal = useMemo(() => {
        return Array.from(selectedProductos.values()).reduce((total: number, item: CartItem) => total + (item.producto.precio * item.cantidad), 0);
    }, [selectedProductos]);

    const addProduct = useCallback((producto: Producto) => {
        setSelectedProductos(prev => {
            const newMap = new Map<string, CartItem>(prev);
            const existing = newMap.get(producto.id);
            newMap.set(producto.id, { producto, cantidad: (existing?.cantidad || 0) + 1 });
            return newMap;
        });
    }, []);

    const removeProduct = useCallback((productId: string) => {
        setSelectedProductos(prev => {
            const newMap = new Map<string, CartItem>(prev);
            newMap.delete(productId);
            return newMap;
        });
    }, []);

    const updateQuantity = useCallback((productId: string, quantity: number) => {
        if (quantity < 1) return;
        setSelectedProductos(prev => {
            const newMap = new Map<string, CartItem>(prev);
            const item = newMap.get(productId);
            if (item) newMap.set(productId, { ...item, cantidad: quantity });
            return newMap;
        });
    }, []);

    const finalizeOrder = async () => {
        if (!selectedCliente || selectedProductos.size === 0) return null;
        setIsLoading(true);
        const items: CartItem[] = Array.from(selectedProductos.values());
        
        const newTrabajo = await createTrabajo({
            clienteId: selectedCliente.id,
            titular: titular || selectedCliente.nombre,
            tipo: jobType,
            subtipo: items.map((i: CartItem) => `${i.cantidad}x ${i.producto.nombre}`).join(', '),
            cantidad: items.reduce((sum: number, i: CartItem) => sum + i.cantidad, 0),
            tamano: '1/4 Oficio',
            total: orderTotal,
            abono,
            estado: TrabajoEstado.PENDIENTE,
            establecimiento: sriData.establecimiento,
            puntoEmision: sriData.puntoEmision,
            claveAcceso: sriData.claveAcceso,
            estadoClave: sriData.estadoClave,
            imprimirClave,
            esRenovacion
        }, user);
        
        setIsLoading(false);
        return newTrabajo;
    };

    return {
        selectedCliente, cartItems: Array.from(selectedProductos.values()), jobType, titular, abono, esRenovacion, sriData, orderTotal, isLoading, imprimirClave,
        setSelectedCliente, setJobType, setTitular, setAbono, setEsRenovacion, setSriData, setImprimirClave,
        addProduct, removeProduct, updateQuantity, finalizeOrder,
        resetOrder: () => {
            setSelectedCliente(null);
            setSelectedProductos(new Map());
            setAbono(0);
            setJobType(TrabajoTipo.SRI);
        }
    };
};
