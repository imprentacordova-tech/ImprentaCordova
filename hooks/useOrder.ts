
import { useState, useMemo, useEffect, useCallback } from 'react';
import { Cliente, Producto, Trabajo, TrabajoTipo, TrabajoEstado, SriCredential, Regimen } from '../types';
import { createTrabajo, getSriCredentials } from '../services/mockApi';
import { getConfig } from '../services/configService';

export interface CartItem {
    producto: Producto;
    cantidad: number;
    surcharge?: number;
    surchargeLabel?: string;
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
            }
        };
        checkSriKey();
    }, [selectedCliente]);

    const orderTotal = useMemo(() => {
        return Array.from(selectedProductos.values()).reduce((total: number, item: CartItem) => {
            // Fix: Removing item.producto.price as it doesn't exist on Producto type. Using item.producto.precio.
            const base = item.producto.precio * item.cantidad;
            const extras = (item.surcharge || 0) * item.cantidad;
            return total + base + extras;
        }, 0);
    }, [selectedProductos]);

    const addProduct = useCallback((producto: Producto & { surcharge?: number, surchargeLabel?: string }) => {
        setSelectedProductos(prev => {
            const newMap = new Map<string, CartItem>(prev);
            // Identificador único incluyendo surcargos para que no se mezclen items perforados con no perforados
            const uniqueId = `${producto.id}-${producto.surcharge || 0}`;
            const existing = newMap.get(uniqueId);
            
            newMap.set(uniqueId, { 
                producto, 
                cantidad: (existing?.cantidad || 0) + 1,
                surcharge: producto.surcharge,
                surchargeLabel: producto.surchargeLabel
            });
            return newMap;
        });
    }, []);

    const removeProduct = useCallback((uniqueId: string) => {
        setSelectedProductos(prev => {
            const newMap = new Map<string, CartItem>(prev);
            newMap.delete(uniqueId);
            return newMap;
        });
    }, []);

    const updateQuantity = useCallback((uniqueId: string, quantity: number) => {
        if (quantity < 1) return;
        setSelectedProductos(prev => {
            const newMap = new Map<string, CartItem>(prev);
            const item = newMap.get(uniqueId);
            if (item) newMap.set(uniqueId, { ...item, cantidad: quantity });
            return newMap;
        });
    }, []);

    const finalizeOrder = async () => {
        if (!selectedCliente || selectedProductos.size === 0) return null;
        setIsLoading(true);
        const items: CartItem[] = Array.from(selectedProductos.values());
        
        const subTitles = items.map((i: CartItem) => {
            let label = `${i.cantidad}x ${i.producto.nombre}`;
            if (i.surchargeLabel) label += ` (${i.surchargeLabel})`;
            return label;
        }).join(', ');

        const newTrabajo = await createTrabajo({
            clienteId: selectedCliente.id,
            titular: titular || selectedCliente.nombre,
            tipo: jobType,
            subtipo: subTitles,
            cantidad: items.reduce((sum: number, i: CartItem) => sum + i.cantidad, 0),
            tamano: 'Varios',
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
        selectedCliente, cartItems: Array.from(selectedProductos.entries()), jobType, titular, abono, esRenovacion, sriData, orderTotal, isLoading, imprimirClave,
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
