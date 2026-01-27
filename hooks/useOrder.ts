
import { useState, useMemo, useEffect, useCallback } from 'react';
import { Cliente, Producto, Trabajo, TrabajoTipo, TrabajoEstado, SriCredential, Regimen } from '../types';
import { createTrabajo, getSriCredentials, addSriCredential } from '../services/mockApi';
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
    const [prioridad, setPrioridad] = useState<'Normal' | 'Urgente'>('Normal');
    const [tiempoEntrega, setTiempoEntrega] = useState<'24h' | '48h'>('48h');
    const [imprimirClave, setImprimirClave] = useState(false);
    const [actividadSeleccionada, setActividadSeleccionada] = useState<string>('');
    
    const [sriData, setSriData] = useState({
        establecimiento: '001',
        puntoEmision: '001',
        claveAcceso: '',
        estadoClave: 'PENDIENTE' as 'LISTA' | 'PENDIENTE' | 'ERROR',
        hasKey: false
    });

    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        const checkSriKey = async () => {
            if (selectedCliente) {
                const creds = await getSriCredentials();
                const ruc = (selectedCliente.ruc || selectedCliente.cedula).replace(/\D/g, '');
                const cred = creds.find(c => c.ruc === ruc);
                
                if (cred) {
                    setSriData(prev => ({ ...prev, claveAcceso: cred.password || '', hasKey: true, estadoClave: 'LISTA' }));
                } else {
                    setSriData(prev => ({ ...prev, claveAcceso: '', hasKey: false, estadoClave: 'PENDIENTE' }));
                }
                setTitular(selectedCliente.nombre);
                if (selectedCliente.actividades) setActividadSeleccionada(selectedCliente.actividades.split('|')[0]);
                
                // Por defecto, SRI suele ser 48h por autorización, pero permitimos 24h
                setTiempoEntrega('48h');
            }
        };
        checkSriKey();
    }, [selectedCliente]);

    const orderTotal = useMemo(() => {
        return Array.from(selectedProductos.values()).reduce((total: number, item: CartItem) => {
            return total + (item.producto.precio + (item.surcharge || 0)) * item.cantidad;
        }, 0);
    }, [selectedProductos]);

    const addProduct = useCallback((producto: Producto & { surcharge?: number, surchargeLabel?: string }) => {
        setSelectedProductos(prev => {
            const newMap = new Map<string, CartItem>(prev);
            const id = `${producto.id}-${producto.surcharge || 0}`;
            const existing = newMap.get(id);
            newMap.set(id, { producto, cantidad: (existing?.cantidad || 0) + 1, surcharge: producto.surcharge, surchargeLabel: producto.surchargeLabel });
            return newMap;
        });
    }, []);

    const finalizeOrder = async () => {
        if (!selectedCliente || selectedProductos.size === 0) return null;
        setIsLoading(true);
        const items = Array.from(selectedProductos.values()) as CartItem[];
        
        // Calcular fecha de entrega real
        const deliveryDate = new Date();
        const hoursToAdd = tiempoEntrega === '24h' ? 24 : 48;
        deliveryDate.setHours(deliveryDate.getHours() + hoursToAdd);

        // MAESTRO UPDATE: Guardar clave SRI en base de datos si se ingresó una nueva
        if (sriData.claveAcceso && selectedCliente) {
            const ruc = (selectedCliente.ruc || selectedCliente.cedula).replace(/\D/g, '');
            // Si no tenía clave (hasKey false) o si la clave cambió
            if (!sriData.hasKey) { // Simple check, ideally check if changed
                 await addSriCredential({
                     ruc: ruc,
                     password: sriData.claveAcceso,
                     origen: selectedCliente.nombre,
                     updatedAt: new Date().toISOString()
                 });
                 // No necesitamos esperar confirmación visual, es background process
            }
        }

        const newTrabajo = await createTrabajo({
            clienteId: selectedCliente.id,
            titular: titular || selectedCliente.nombre,
            tipo: jobType,
            subtipo: items.map(i => `${i.cantidad}x ${i.producto.nombre}`).join(', '),
            cantidad: items.reduce((sum, i) => sum + i.cantidad, 0),
            total: orderTotal,
            abono,
            prioridad,
            estado: TrabajoEstado.PENDIENTE,
            fechaEntrega: deliveryDate.toISOString(),
            tiempoEntregaEstimado: tiempoEntrega,
            establecimiento: sriData.establecimiento,
            puntoEmision: sriData.puntoEmision,
            claveAcceso: sriData.claveAcceso,
            estadoClave: sriData.claveAcceso ? 'LISTA' : 'PENDIENTE',
            imprimirClave,
            actividadSeleccionada
        }, user);
        
        setIsLoading(false);
        return newTrabajo;
    };

    return {
        selectedCliente, cartItems: Array.from(selectedProductos.entries()), jobType, titular, abono, prioridad, tiempoEntrega, sriData, orderTotal, isLoading, imprimirClave, actividadSeleccionada,
        setSelectedCliente, setJobType, setTitular, setAbono, setPrioridad, setTiempoEntrega, setSriData, setImprimirClave, setActividadSeleccionada,
        addProduct, removeProduct: (id: string) => setSelectedProductos(prev => { const n = new Map(prev); n.delete(id); return n; }), 
        updateQuantity: (id: string, q: number) => setSelectedProductos(prev => { 
            const n = new Map(prev); 
            const i = n.get(id); 
            if (i) n.set(id, { ...(i as CartItem), cantidad: q }); 
            return n; 
        }),
        finalizeOrder,
        resetOrder: () => { setSelectedCliente(null); setSelectedProductos(new Map()); setAbono(0); setJobType(TrabajoTipo.SRI); }
    };
};
