import { useState, useMemo, useEffect, useCallback } from 'react';
import { Cliente, Producto, Trabajo, TrabajoTipo, TrabajoEstado, SriCredential, Regimen } from '../types';
import { useData } from '../contexts/DataContext';
import { getConfig } from '../services/configService';
import { logTransaction } from '../services/financialLedgerService';

export interface CartItem {
    producto: Producto;
    cantidad: number;
    surcharge?: number;
    surchargeLabel?: string;
    notas?: string;
    customPrice?: number;
}

export const useOrder = (user: string) => {
    const { addTrabajo, upsertSriCredential, addProducto, sriCredentials } = useData();
    const [selectedCliente, setSelectedCliente] = useState<Cliente | null>(null);
    const [tempClient, setTempClient] = useState({ nombre: '', telefono: '', cedula: '', regimen: Regimen.GENERAL });
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
        const checkSriKey = () => {
            if (selectedCliente) {
                const creds = sriCredentials;
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
    }, [selectedCliente, sriCredentials]);

    const orderTotal = useMemo(() => {
        return Array.from(selectedProductos.values()).reduce((total: number, item: CartItem) => {
            const unitPrice = item.customPrice !== undefined ? item.customPrice : (item.producto.precio + (item.surcharge || 0));
            return total + unitPrice * item.cantidad;
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

    const finalizeOrder = async (overrideClientData?: { nombre: string, telefono: string, cedula?: string }) => {
        try {
            const clientToUse = selectedCliente || (overrideClientData?.nombre ? { 
                id: 'temp-' + Date.now(), 
                nombre: overrideClientData.nombre.toUpperCase(), 
                telefono: [overrideClientData.telefono],
                cedula: overrideClientData.cedula || '9999999999999',
                direccion: 'PEDIDO EXPRESS',
                regimen: Regimen.GENERAL,
                creadoEn: new Date().toISOString()
            } as Cliente : null);

            if (!clientToUse || selectedProductos.size === 0) {
                console.warn('FinalizeOrder aborted: No client or empty cart', { clientToUse, productsSize: selectedProductos.size });
                return null;
            }

            setIsLoading(true);
            const items = Array.from(selectedProductos.values()) as CartItem[];
            
            // Calcular fecha de entrega real
            const deliveryDate = new Date();
            const hoursToAdd = tiempoEntrega === '24h' ? 24 : 48;
            deliveryDate.setHours(deliveryDate.getHours() + hoursToAdd);

            // MAESTRO UPDATE: Guardar clave SRI en base de datos si se ingresó una nueva
            if (sriData.claveAcceso && selectedCliente) {
                const ruc = (selectedCliente.ruc || selectedCliente.cedula).replace(/\D/g, '');
                try {
                    await upsertSriCredential({
                        ruc: ruc,
                        password: sriData.claveAcceso,
                        origen: selectedCliente.nombre
                    });
                } catch (sriError) {
                    console.error('Failed to sync SRI credentials', sriError);
                    // No bloqueamos el pedido por error en guardado de clave
                }
            }

            const newTrabajo = await addTrabajo({
                clienteId: clientToUse.id,
                titular: titular || clientToUse.nombre,
                tipo: jobType,
                subtipo: items.map(i => `${i.cantidad}x ${i.producto.nombre}${i.notas ? ` [${i.notas}]` : ''}`).join(', '),
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

            // REGISTRO EN LIBRO DIARIO (LEDGER)
            if (abono > 0) {
                logTransaction(
                    'INGRESO',
                    abono,
                    `ABONO INICIAL: ${clientToUse.nombre} - ORDEN #${newTrabajo.orden}`,
                    user,
                    newTrabajo.id
                );
            }
            
            setIsLoading(false);
            return newTrabajo;
        } catch (error) {
            setIsLoading(false);
            console.error('CRITICAL: Error in finalizeOrder', error);
            throw error; // Re-throw so the UI can handle it via the mutation's onError or catch
        }
    };

    return {
        selectedCliente, tempClient, cartItems: Array.from(selectedProductos.entries()), jobType, titular, abono, prioridad, tiempoEntrega, sriData, orderTotal, isLoading, imprimirClave, actividadSeleccionada,
        setSelectedCliente, setTempClient, setJobType, setTitular, setAbono, setPrioridad, setTiempoEntrega, setSriData, setImprimirClave, setActividadSeleccionada,
        addProduct, removeProduct: (id: string) => setSelectedProductos(prev => { const n = new Map(prev); n.delete(id); return n; }), 
        updateQuantity: (id: string, q: number) => setSelectedProductos(prev => { 
            const n = new Map(prev); 
            const i = n.get(id); 
            if (i) n.set(id, { ...(i as CartItem), cantidad: q }); 
            return n; 
        }),
        updateItemNotes: (id: string, notes: string) => setSelectedProductos(prev => {
            const n = new Map(prev);
            const i = n.get(id);
            if (i) n.set(id, { ...(i as CartItem), notas: notes });
            return n;
        }),
        updateItemPrice: (id: string, price: number) => setSelectedProductos(prev => {
            const n = new Map(prev);
            const i = n.get(id);
            if (i) n.set(id, { ...(i as CartItem), customPrice: price });
            return n;
        }),
        saveItemAsProduct: async (itemId: string) => {
            const item = selectedProductos.get(itemId);
            if (item) {
                let finalName = item.producto.nombre;
                // Si es un item libre, intentar usar la primera línea de las notas como nombre
                if (finalName === 'Ítem Personalizado' && item.notas) {
                    const firstLine = item.notas.split('\n')[0].trim();
                    if (firstLine) finalName = firstLine.substring(0, 40);
                }
                
                await addProducto({
                    nombre: finalName,
                    categoria: item.producto.categoria,
                    precio: item.customPrice !== undefined ? item.customPrice : (item.producto.precio + (item.surcharge || 0)),
                    descripcion: item.notas || item.producto.descripcion || 'Producto personalizado memorizado',
                    esSRI: item.producto.esSRI
                });
            }
        },
        finalizeOrder,
        resetOrder: () => { setSelectedCliente(null); setTempClient({ nombre: '', telefono: '', cedula: '', regimen: Regimen.GENERAL }); setSelectedProductos(new Map()); setAbono(0); setJobType(TrabajoTipo.SRI); }
    };
};
