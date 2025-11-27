
import React, { useState, useEffect, useMemo } from 'react';
import { getClientes, createCliente, createTrabajo, getProductos } from '../services/mockApi';
import { Cliente, Trabajo, TrabajoEstado, TrabajoTipo, Regimen, Producto, User } from '../types';
import { formatCurrency } from '../utils';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { CloseIcon, SearchIcon, CheckCircleIcon, UserPlusIcon, PrinterIcon, KdsIcon, TrashIcon, ShieldCheckIcon, DocumentIcon, FolderIcon, ArrowLeftIcon, ArrowRightIcon, ShoppingCartIcon } from '../components/Icons';

// Custom hook for debouncing
function useDebounce<T>(value: T, delay: number): T {
    const [debouncedValue, setDebouncedValue] = useState<T>(value);
    useEffect(() => {
        const handler = setTimeout(() => setDebouncedValue(value), delay);
        return () => clearTimeout(handler);
    }, [value, delay]);
    return debouncedValue;
}

// --- Local Interfaces for Product Grouping ---
interface ProductVariation { id: string; variationName: string; price: number; producto: Producto; }
interface ProductGroup { groupName: string; categoria: string; esSRI: boolean; variations: ProductVariation[]; isGroup: true; imagenUrl?: string; }
type DisplayableProduct = ProductGroup | (Producto & { isGroup?: false });
type Step = 'cliente' | 'productos' | 'resumen';

// FIX: Define InputField at the top level so it can be used by CreateClientModal.
const InputField: React.FC<{ label: string; name: string; value: any; onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void; [key: string]: any; }> = ({ label, name, value, onChange, ...props }) => (
    <div>
        <label htmlFor={name} className="block text-sm font-medium dark:text-gray-300">{label}</label>
        <input id={name} name={name} value={value} onChange={onChange} className="mt-1 w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600" {...props} />
    </div>
);

// --- Modals ---
const CreateClientModal: React.FC<{
    isOpen: boolean; onClose: () => void; onClientCreated: (client: Cliente) => void; initialName?: string; initialCedulaRuc?: string;
}> = ({ isOpen, onClose, onClientCreated, initialName, initialCedulaRuc }) => {
    
    const [newClienteData, setNewClienteData] = useState({ 
        nombre: '', 
        nombreComercial: '',
        cedulaRuc: '', 
        email: '', 
        direccion: 'Pasaje, El Oro',
        notas: '',
        regimen: Regimen.GENERAL 
    });
    const [telefonos, setTelefonos] = useState<string[]>([]);
    const [currentTelefono, setCurrentTelefono] = useState('');
    
    useEffect(() => {
        if (isOpen) {
            setNewClienteData({ 
                nombre: initialName || '', 
                nombreComercial: '', 
                cedulaRuc: initialCedulaRuc || '', 
                email: '', 
                direccion: 'Pasaje, El Oro',
                notas: '',
                regimen: Regimen.GENERAL 
            });
            setTelefonos([]);
            setCurrentTelefono('');
        }
    }, [isOpen, initialName, initialCedulaRuc]);

    if (!isOpen) return null;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        setNewClienteData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };
    
    const handleTelefonoKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && currentTelefono.trim().length === 10 && /^\d+$/.test(currentTelefono.trim())) {
            e.preventDefault();
            if (!telefonos.includes(currentTelefono.trim())) {
                setTelefonos(prev => [...prev, currentTelefono.trim()]);
            }
            setCurrentTelefono('');
        }
    };

    const removeTelefono = (index: number) => {
        setTelefonos(prev => prev.filter((_, i) => i !== index));
    };
    
    const handleAddressFocus = (e: React.FocusEvent<HTMLInputElement>) => {
        e.target.select();
    };

    const handleCedulaRucChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        let value = e.target.value.replace(/\D/g, ''); // Allow only numbers

        // Autocomplete '001'
        if (newClienteData.cedulaRuc.length === 10 && value.length === 11 && value.endsWith('0')) {
             const baseCedula = newClienteData.cedulaRuc;
             if(value.startsWith(baseCedula)) {
                 value = baseCedula + '001';
             }
        }
        
        setNewClienteData(prev => ({ ...prev, cedulaRuc: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const { nombre, cedulaRuc, email, regimen, nombreComercial, direccion, notas } = newClienteData;
        
        const finalTelefonos = [...telefonos];
        if (currentTelefono.trim().length === 10 && /^\d+$/.test(currentTelefono.trim()) && !finalTelefonos.includes(currentTelefono.trim())) {
            finalTelefonos.push(currentTelefono.trim());
        }

        if (!nombre || !cedulaRuc || finalTelefonos.length === 0) return;

        const newCliente = await createCliente({ 
            nombre, 
            cedula: cedulaRuc, 
            ruc: cedulaRuc.length === 13 ? cedulaRuc : undefined, 
            telefono: finalTelefonos,
            email: email || undefined, 
            regimen,
            nombreComercial: nombreComercial || undefined,
            direccion: direccion || undefined,
            notas: notas || undefined
        });
        onClientCreated(newCliente);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4 animate-fade-in" onClick={onClose}>
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-lg" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center p-5 border-b border-gray-200 dark:border-gray-700">
                    <h2 className="text-xl font-bold">Crear Nuevo Cliente</h2>
                    <button onClick={onClose}><CloseIcon className="w-6 h-6 text-gray-500" /></button>
                </div>
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <InputField label="Nombres/Razón Social" name="nombre" value={newClienteData.nombre} onChange={handleChange} required />
                        <InputField label="Nombre Comercial (Opcional)" name="nombreComercial" value={newClienteData.nombreComercial} onChange={handleChange} />
                    </div>
                     <div>
                        <label htmlFor="cedulaRuc" className="block text-sm font-medium dark:text-gray-300">Cédula / RUC</label>
                        <input type="text" pattern="[0-9]*" maxLength={13} name="cedulaRuc" id="cedulaRuc" value={newClienteData.cedulaRuc} onChange={handleCedulaRucChange} required className="mt-1 w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"/>
                    </div>
                    <div>
                        <label htmlFor="telefono" className="block text-sm font-medium dark:text-gray-300">Teléfono(s)</label>
                        <div className="mt-1 flex flex-wrap items-center gap-2 p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 focus-within:ring-2 focus-within:ring-brand-blue">
                            {telefonos.map((tel, index) => (
                                <div key={index} className="flex items-center gap-1.5 bg-blue-100 dark:bg-blue-900/50 text-brand-blue rounded-full px-2 py-0.5 text-sm font-medium">
                                    <span>{tel}</span>
                                    <button type="button" onClick={() => removeTelefono(index)} className="font-bold text-lg leading-none">&times;</button>
                                </div>
                            ))}
                            <input 
                                type="tel" 
                                id="telefono"
                                value={currentTelefono}
                                onChange={e => setCurrentTelefono(e.target.value.replace(/\D/g, ''))}
                                onKeyDown={handleTelefonoKeyDown}
                                placeholder="Añadir tel..."
                                className="flex-grow bg-transparent outline-none p-0.5 min-w-[120px]"
                                maxLength={10}
                            />
                        </div>
                        <p className="text-xs text-gray-500 mt-1">Ingrese un número de 10 dígitos y presione Enter.</p>
                    </div>
                     <div>
                        <label htmlFor="email" className="block text-sm font-medium dark:text-gray-300">Email (Opcional)</label>
                        <input type="email" name="email" id="email" value={newClienteData.email} onChange={handleChange} className="mt-1 w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"/>
                    </div>
                    <div>
                        <label htmlFor="direccion" className="block text-sm font-medium dark:text-gray-300">Dirección</label>
                        <input type="text" name="direccion" id="direccion" value={newClienteData.direccion} onChange={handleChange} onFocus={handleAddressFocus} className="mt-1 w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"/>
                    </div>
                    <div>
                        <label htmlFor="notas" className="block text-sm font-medium dark:text-gray-300">Notas</label>
                        <textarea name="notas" id="notas" value={newClienteData.notas} onChange={handleChange} rows={2} className="mt-1 w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"></textarea>
                    </div>
                    <div className="flex justify-end pt-4 gap-3">
                        <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 font-semibold rounded-lg hover:bg-gray-300">Cancelar</button>
                        <button type="submit" className="px-4 py-2 bg-brand-blue text-white font-semibold rounded-lg hover:bg-blue-700">Guardar</button>
                    </div>
                </form>
            </div>
        </div>
    );
};


const ProductGroupModal: React.FC<{ group: ProductGroup | null; onClose: () => void; onAddProduct: (product: Producto) => void; }> = ({ group, onClose, onAddProduct }) => {
    if (!group) return null;
    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4 animate-fade-in" onClick={onClose}>
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-lg" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center p-5 border-b"><h2 className="text-xl font-bold">{group.groupName}</h2><button onClick={onClose}><CloseIcon className="w-6 h-6" /></button></div>
                <ul className="p-4 max-h-96 overflow-y-auto space-y-2">
                    {group.variations.map(v => <li key={v.id} onClick={() => { onAddProduct(v.producto); onClose(); }} className="flex justify-between p-3 hover:bg-blue-50 rounded-lg cursor-pointer"><span className="font-semibold">{v.variationName}</span><span className="font-bold text-brand-blue">{formatCurrency(v.price)}</span></li>)}
                </ul>
            </div>
        </div>
    );
};

// --- Main Page Component ---
const NuevoPedidoPage: React.FC = () => {
    const { currentUser } = useOutletContext<{ currentUser: User }>();
    const navigate = useNavigate();

    // State
    const [step, setStep] = useState<Step>('cliente');
    const [clientes, setClientes] = useState<Cliente[]>([]);
    const [allProductos, setAllProductos] = useState<Producto[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [createdTrabajo, setCreatedTrabajo] = useState<Trabajo | null>(null);
    const [isClientModalOpen, setIsClientModalOpen] = useState(false);
    const [newClientInitialData, setNewClientInitialData] = useState<{ name?: string, cedulaRuc?: string }>({});
    const [viewingGroup, setViewingGroup] = useState<ProductGroup | null>(null);
    const [isSummaryOpen, setIsSummaryOpen] = useState(false);

    // Order State
    const [selectedCliente, setSelectedCliente] = useState<Cliente | null>(null);
    const [selectedProductos, setSelectedProductos] = useState<Map<string, { producto: Producto; cantidad: number }>>(new Map());
    const [titular, setTitular] = useState('');
    const [abono, setAbono] = useState(0);

    // Search & Filter State
    const [clientSearchTerm, setClientSearchTerm] = useState('');
    const debouncedClientSearchTerm = useDebounce(clientSearchTerm, 300);
    const [jobType, setJobType] = useState<TrabajoTipo>(TrabajoTipo.GENERAL);
    const [productSearchTerm, setProductSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('Todas');
    
    // Data Fetch
    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            const [clientesData, productosData] = await Promise.all([getClientes(), getProductos()]);
            setClientes(clientesData);
            setAllProductos(productosData);
            setIsLoading(false);
        };
        fetchData();
    }, []);

    // Memos
    const orderTotal = useMemo(() => {
        return Array.from(selectedProductos.values()).reduce((total: number, item: { producto: Producto; cantidad: number }) => total + (item.producto.precio * item.cantidad), 0);
    }, [selectedProductos]);

    const totalItemsInCart = useMemo(() => {
        return Array.from(selectedProductos.values()).reduce((total: number, item: { producto: Producto; cantidad: number }) => total + item.cantidad, 0);
    }, [selectedProductos]);

    const filteredClientes = useMemo(() => {
        if (!debouncedClientSearchTerm) return [];
        const lower = debouncedClientSearchTerm.toLowerCase();
        return clientes.filter(c => c.nombre.toLowerCase().includes(lower) || c.cedula.includes(lower) || (c.ruc && c.ruc.includes(lower)));
    }, [debouncedClientSearchTerm, clientes]);

    const productGroupsAndItems = useMemo((): DisplayableProduct[] => {
        const groups = new Map<string, ProductGroup>();
        const singleItems: DisplayableProduct[] = [];
        const regex = /^(.*?) \((.*?)\)$/;
        for (const p of allProductos) {
            const match = p.nombre.match(regex);
            if (match) {
                const [, groupName, variationName] = match;
                const key = `${groupName}-${p.esSRI}`;
                if (!groups.has(key)) groups.set(key, { groupName, categoria: p.categoria, esSRI: !!p.esSRI, variations: [], isGroup: true, imagenUrl: p.imagenUrl });
                groups.get(key)!.variations.push({ id: p.id, variationName, price: p.precio, producto: p });
            } else {
                singleItems.push(p);
            }
        }
        return [...groups.values(), ...singleItems];
    }, [allProductos]);

    const productCategories = useMemo(() => ['Todas', ...new Set(productGroupsAndItems.filter(p => (jobType === TrabajoTipo.SRI ? p.esSRI : !p.esSRI)).map(p => p.categoria))], [productGroupsAndItems, jobType]);
    
    const filteredDisplayItems = useMemo(() => {
        let items: DisplayableProduct[] = productGroupsAndItems.filter(p =>
            (jobType === TrabajoTipo.SRI ? !!p.esSRI : !p.esSRI) &&
            (selectedCategory === 'Todas' || p.categoria === selectedCategory) &&
            ('groupName' in p ? p.groupName : p.nombre).toLowerCase().includes(productSearchTerm.toLowerCase())
        );

        if (jobType === TrabajoTipo.SRI && selectedCliente) {
            const regimen = selectedCliente.regimen;
            
            const processedItems = items.map(item => {
                let currentItem: DisplayableProduct | null = item;

                // Rule: Filter Facturas to only 25H
                if (currentItem) {
                    if ('groupName' in currentItem && currentItem.groupName.toLowerCase().includes('facturas')) {
                        const filteredVariations = currentItem.variations.filter(v => v.variationName.includes('25H'));
                        if (filteredVariations.length > 0) {
                            currentItem = { ...currentItem, variations: filteredVariations };
                        } else {
                            currentItem = null;
                        }
                    } else if (!('groupName' in currentItem) && currentItem.nombre.toLowerCase().includes('facturas') && !currentItem.nombre.includes('25H')) {
                        currentItem = null;
                    }
                }

                // Rule: Filter by Regimen
                if (currentItem) {
                    const itemName = 'groupName' in currentItem ? currentItem.groupName : currentItem.nombre;
                    const nameLower = itemName.toLowerCase();
                    const isNotaVenta = nameLower.includes('notas de venta');
                    const isNotaCredito = nameLower.includes('notas de crédito');

                    if (regimen === Regimen.NEGOCIO_POPULAR) {
                        if (!isNotaVenta && !isNotaCredito) {
                            currentItem = null;
                        }
                    } else { // Emprendedor or General
                        if (isNotaVenta) {
                            currentItem = null;
                        }
                    }
                }
                
                return currentItem;
            });
            
            items = processedItems.filter((p): p is DisplayableProduct => p !== null);
        }

        return items;
    }, [productGroupsAndItems, jobType, selectedCategory, productSearchTerm, selectedCliente]);


    // Handlers
    const resetOrderState = () => {
        setStep('cliente');
        setSelectedCliente(null);
        setSelectedProductos(new Map());
        setTitular('');
        setAbono(0);
        setCreatedTrabajo(null);
    };
    
    const handleSelectClient = (cliente: Cliente) => {
        setSelectedCliente(cliente);
        setTitular(cliente.nombre);
        setClientSearchTerm('');
        setStep('productos');
    };

    const handleClientCreated = (newCliente: Cliente) => {
        setClientes(prev => [newCliente, ...prev]);
        handleSelectClient(newCliente);
        setIsClientModalOpen(false);
    };

    const handleOpenCreateClientModal = () => {
        const isNumeric = /^\d+$/.test(debouncedClientSearchTerm);
        if (isNumeric) {
            setNewClientInitialData({ cedulaRuc: debouncedClientSearchTerm });
        } else {
            setNewClientInitialData({ name: debouncedClientSearchTerm });
        }
        setIsClientModalOpen(true);
    };

    const handleClientSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && debouncedClientSearchTerm && filteredClientes.length === 0) {
            e.preventDefault();
            handleOpenCreateClientModal();
        }
    };

    const handleProductAction = (action: 'add' | 'remove' | 'update', producto: Producto, cantidad?: number) => {
        setSelectedProductos(prev => {
            const newMap = new Map<string, { producto: Producto; cantidad: number }>(prev);
            const existing = newMap.get(producto.id);
            switch (action) {
                case 'add':
                    newMap.set(producto.id, { producto, cantidad: (existing?.cantidad || 0) + 1 });
                    break;
                case 'remove':
                    newMap.delete(producto.id);
                    break;
                case 'update':
                    if (existing && cantidad && cantidad >= 1) newMap.set(producto.id, { producto: existing.producto, cantidad: cantidad });
                    break;
            }
            return newMap;
        });
    };

    const handleFinalizeOrder = async () => {
        if (!selectedCliente || selectedProductos.size === 0) return;
        setIsLoading(true);
        const items = Array.from(selectedProductos.values()) as { producto: Producto; cantidad: number }[];
        const newTrabajo = await createTrabajo({
            clienteId: selectedCliente.id,
            titular: titular || selectedCliente.nombre,
            tipo: jobType,
            subtipo: items.map((i: { producto: Producto; cantidad: number }) => `${i.cantidad}x ${i.producto.nombre}`).join(', '),
            cantidad: items.reduce((sum: number, i: { producto: Producto; cantidad: number }) => sum + i.cantidad, 0),
            tamano: 'Varios',
            total: orderTotal,
            abono,
            estado: TrabajoEstado.PENDIENTE,
        }, currentUser.nombre);
        
        if (jobType === TrabajoTipo.SRI) {
            navigate(`/solicitud-impresion/${newTrabajo.id}`);
        } else {
            setCreatedTrabajo(newTrabajo);
        }
        setIsLoading(false);
    };

    // --- Render Logic ---
    if (isLoading && !createdTrabajo) return <div className="text-center p-10">Cargando...</div>;

    if (createdTrabajo) {
        return (
            <div className="text-center p-8 bg-white rounded-xl shadow-lg animate-fade-in max-w-2xl mx-auto">
                <CheckCircleIcon className="h-20 w-20 text-green-500 mx-auto mb-4" />
                <h2 className="text-3xl font-bold">¡Pedido Creado!</h2>
                <p className="mt-2 text-lg">Se ha generado la orden de trabajo <span className="font-bold text-brand-blue">#{createdTrabajo.orden}</span>.</p>
                {createdTrabajo.abono > 0 && <button onClick={() => window.open(`/#/recibo-abono/${createdTrabajo.id}`, '_blank')} className="mt-6 inline-flex items-center gap-2 px-6 py-3 bg-brand-blue text-white font-bold rounded-lg"><PrinterIcon className="h-5 w-5" /> Imprimir Recibo</button>}
                <div className="mt-8 flex justify-center gap-4">
                     <button onClick={resetOrderState} className="px-6 py-2 bg-gray-200 text-gray-800 font-bold rounded-lg">Crear Nuevo Pedido</button>
                    <button onClick={() => navigate('/kds')} className="flex items-center gap-2 px-6 py-2 bg-gray-600 text-white font-bold rounded-lg"><KdsIcon className="h-5 w-5" /> Ir al Taller</button>
                </div>
            </div>
        );
    }
    
    const StepIndicator: React.FC<{ currentStep: Step }> = ({ currentStep }) => {
        const steps: { id: Step, title: string }[] = [{ id: 'cliente', title: 'Cliente' }, { id: 'productos', title: 'Productos' }, { id: 'resumen', title: 'Resumen' }];
        const currentIdx = steps.findIndex(s => s.id === currentStep);
        return (
            <nav className="flex items-center justify-center mb-8">
                {steps.map((step, idx) => (
                    <React.Fragment key={step.id}>
                        <div className="flex items-center">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${idx <= currentIdx ? 'bg-brand-blue text-white' : 'bg-gray-200 text-gray-500'}`}>
                                {idx < currentIdx ? '✓' : idx + 1}
                            </div>
                            <span className={`ml-3 font-semibold ${idx <= currentIdx ? 'text-brand-blue' : 'text-gray-500'}`}>{step.title}</span>
                        </div>
                        {idx < steps.length - 1 && <div className={`flex-auto border-t-2 mx-4 ${idx < currentIdx ? 'border-brand-blue' : 'border-gray-200'}`}></div>}
                    </React.Fragment>
                ))}
            </nav>
        );
    };
    
    const renderStepContent = () => {
        switch (step) {
            case 'cliente':
                return (
                    <div className="animate-fade-in">
                        <h2 className="text-2xl font-bold mb-4 text-center">Paso 1: Seleccionar Cliente</h2>
                        <div className="relative max-w-2xl mx-auto">
                            <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                            <input type="text" value={clientSearchTerm} onChange={e => setClientSearchTerm(e.target.value)} onKeyDown={handleClientSearchKeyDown} placeholder="Buscar por cédula, RUC o nombre..." className="w-full pl-12 p-4 border rounded-lg dark:bg-gray-700 dark:border-gray-600 text-lg" />
                        </div>
                        {debouncedClientSearchTerm && (
                            <div className="mt-4 max-w-2xl mx-auto max-h-60 overflow-y-auto bg-white dark:bg-gray-800 rounded-lg shadow-lg">
                                {filteredClientes.length > 0 ? filteredClientes.map(c => <div key={c.id} onClick={() => handleSelectClient(c)} className="p-4 hover:bg-blue-50 dark:hover:bg-blue-900/50 rounded-lg cursor-pointer animate-fade-in"><p className="font-semibold">{c.nombre}</p><p className="text-sm text-gray-500">{c.cedula}</p></div>) : <div className="text-center p-6"><p>No se encontraron clientes.</p><button onClick={handleOpenCreateClientModal} className="mt-4 flex items-center gap-2 mx-auto px-4 py-2 bg-brand-blue text-white rounded-lg"><UserPlusIcon className="h-5 w-5"/> Crear Cliente</button></div>}
                            </div>
                        )}
                    </div>
                );
            case 'productos':
                return (
                    <div className="animate-fade-in flex flex-col h-full">
                        <h2 className="text-2xl font-bold mb-4">Paso 2: Agregar Productos</h2>
                        <p className="mb-4">Pedido para: <span className="font-bold text-brand-blue">{selectedCliente?.nombre}</span> <button onClick={() => { setStep('cliente'); setSelectedCliente(null); }} className="text-xs text-red-500 hover:underline ml-2">(Cambiar)</button></p>
                         <div className="flex flex-col sm:flex-row gap-4 mb-4">
                            <div className="flex-grow relative"><SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" /><input type="text" value={productSearchTerm} onChange={e => setProductSearchTerm(e.target.value)} placeholder="Buscar producto..." className="w-full pl-10 p-2.5 border rounded-lg dark:bg-gray-700 dark:border-gray-600"/></div>
                             <div className="flex-shrink-0 grid grid-cols-2 gap-2 p-1 bg-gray-100 dark:bg-gray-700 rounded-lg">
                                <button onClick={() => { setJobType(TrabajoTipo.GENERAL); setSelectedCategory('Todas'); }} className={`px-4 py-1.5 text-sm font-semibold rounded-md flex items-center gap-2 ${jobType === TrabajoTipo.GENERAL ? 'bg-white dark:bg-gray-600 shadow' : ''}`}><DocumentIcon className="w-4 h-4"/> General</button>
                                <button onClick={() => { setJobType(TrabajoTipo.SRI); setSelectedCategory('Todas'); }} className={`px-4 py-1.5 text-sm font-semibold rounded-md flex items-center gap-2 ${jobType === TrabajoTipo.SRI ? 'bg-white dark:bg-gray-600 shadow' : ''}`}><ShieldCheckIcon className="w-4 h-4"/> SRI</button>
                            </div>
                        </div>
                        <div className="flex flex-wrap gap-2 mb-4 border-b dark:border-gray-700 pb-4">
                            {productCategories.map(cat => <button key={cat} onClick={() => setSelectedCategory(cat)} className={`px-3 py-1 text-sm rounded-full ${selectedCategory === cat ? 'bg-brand-blue text-white' : 'bg-gray-100 dark:bg-gray-700'}`}>{cat}</button>)}
                        </div>
                        <div className="flex-grow overflow-y-auto grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 -mr-2 pr-2">
                             {filteredDisplayItems.map(item => {
                                if (!item) return null;
                                // Determine if item is "blocked" for display purposes
                                const itemName = 'groupName' in item ? item.groupName : item.nombre;
                                const isFactura = itemName.toLowerCase().includes('factura');
                                const isBlocked = selectedCliente?.regimen === Regimen.NEGOCIO_POPULAR && isFactura;

                                if ('groupName' in item) {
                                    return (
                                        <div 
                                            key={item.groupName} 
                                            onClick={() => {
                                                if (isBlocked) {
                                                    alert("Los contribuyentes RIMPE Negocio Popular no pueden emitir Facturas, solo Notas de Venta.");
                                                } else {
                                                    setViewingGroup(item);
                                                }
                                            }} 
                                            className={`p-4 rounded-lg bg-gray-50 dark:bg-gray-700/50 hover:bg-blue-50 cursor-pointer flex flex-col items-center justify-center text-center relative ${isBlocked ? 'opacity-60 cursor-not-allowed' : ''}`}
                                        >
                                            {isBlocked && <ShieldCheckIcon className="absolute top-2 right-2 w-5 h-5 text-gray-500" />}
                                            <FolderIcon className="w-12 h-12 text-brand-blue mb-2"/>
                                            <h3 className="font-bold text-sm">{item.groupName}</h3>
                                        </div>
                                    );
                                } else {
                                    return (
                                        <div 
                                            key={item.id} 
                                            onClick={() => handleProductAction('add', item)} 
                                            className={`p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50 hover:bg-blue-50 cursor-pointer relative ${isBlocked ? 'opacity-60 cursor-not-allowed' : ''}`}
                                        >
                                            {isBlocked && <ShieldCheckIcon className="absolute top-2 right-2 w-5 h-5 text-gray-500" />}
                                            <h3 className="font-bold text-sm truncate">{item.nombre}</h3>
                                            <p className="text-xs text-gray-500">{item.categoria}</p>
                                            <p className="text-right font-bold text-brand-blue mt-1">{formatCurrency(item.precio)}</p>
                                        </div>
                                    );
                                }
                             })}
                        </div>
                    </div>
                );
            case 'resumen':
                return (
                    <div className="animate-fade-in max-w-2xl mx-auto">
                        <h2 className="text-2xl font-bold mb-4 text-center">Paso 3: Resumen y Finalización</h2>
                        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
                            <div className="border-b dark:border-gray-700 pb-4 mb-4">
                                <h3 className="font-bold">Cliente: {selectedCliente?.nombre}</h3>
                                <p className="text-sm text-gray-500">{selectedCliente?.cedula}</p>
                            </div>
                            <div className="space-y-2 mb-4">
                                {[...selectedProductos.values()].map(({ producto, cantidad }) => <div key={producto.id} className="flex justify-between items-center"><p>{cantidad}x {producto.nombre}</p><p className="font-semibold">{formatCurrency(producto.precio * cantidad)}</p></div>)}
                            </div>
                             <div className="border-t dark:border-gray-700 mt-4 pt-4 space-y-3">
                                <div className="flex justify-between text-lg font-bold"><span>Total:</span><span>{formatCurrency(orderTotal)}</span></div>
                                <div className="flex justify-between items-center"><label htmlFor="abono" className="font-semibold">Abono:</label><input id="abono" type="number" value={abono} onChange={e => setAbono(parseFloat(e.target.value) || 0)} className="w-32 p-2 border rounded-md text-right font-semibold dark:bg-gray-700 dark:border-gray-600"/></div>
                                <div className="flex justify-between text-xl font-bold text-brand-red"><span>Saldo:</span><span>{formatCurrency(orderTotal - abono)}</span></div>
                            </div>
                        </div>
                    </div>
                );
        }
    };
    
    return (
        <div className="h-full flex flex-col">
            <StepIndicator currentStep={step} />
            <div className="flex-grow bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md">
                {renderStepContent()}
            </div>
            
            {step !== 'cliente' && (
                <div className="mt-6 flex justify-between">
                    <button onClick={() => setStep(step === 'resumen' ? 'productos' : 'cliente')} className="flex items-center gap-2 px-6 py-3 bg-gray-200 text-gray-800 font-bold rounded-lg"><ArrowLeftIcon className="h-5 w-5"/> Anterior</button>
                    {step === 'productos' && <button onClick={() => setStep('resumen')} disabled={selectedProductos.size === 0} className="flex items-center gap-2 px-6 py-3 bg-brand-blue text-white font-bold rounded-lg disabled:bg-gray-400">Revisar Pedido <ArrowRightIcon className="h-5 w-5"/></button>}
                    {step === 'resumen' && <button onClick={handleFinalizeOrder} disabled={isLoading} className="px-6 py-3 bg-green-600 text-white font-bold rounded-lg">{isLoading ? 'Procesando...' : 'Finalizar Pedido'}</button>}
                </div>
            )}

            {step !== 'cliente' && (
                <button onClick={() => setIsSummaryOpen(!isSummaryOpen)} className="fixed bottom-8 right-8 bg-brand-red text-white w-16 h-16 rounded-full shadow-lg flex items-center justify-center animate-pulse-slow">
                    <ShoppingCartIcon className="h-7 w-7"/>
                    {totalItemsInCart > 0 && <span className="absolute -top-1 -right-1 bg-white text-brand-red text-xs font-bold rounded-full h-6 w-6 flex items-center justify-center">{totalItemsInCart}</span>}
                </button>
            )}

            <div className={`fixed top-0 right-0 h-full w-full max-w-sm bg-white dark:bg-gray-800 shadow-2xl transform transition-transform duration-300 z-40 ${isSummaryOpen ? 'translate-x-0' : 'translate-x-full'}`}>
                <div className="p-6 flex flex-col h-full">
                    <div className="flex justify-between items-center mb-4"><h2 className="text-2xl font-bold">Resumen de Pedido</h2><button onClick={() => setIsSummaryOpen(false)}><CloseIcon className="w-6 h-6"/></button></div>
                    <div className="flex-grow overflow-y-auto space-y-2 pr-2 -mr-2">{(Array.from(selectedProductos.values()) as { producto: Producto; cantidad: number }[]).map(({ producto, cantidad }) => <div key={producto.id} className="flex items-center gap-3"><input type="number" value={cantidad} onChange={(e) => handleProductAction('update', producto, parseInt(e.target.value) || 1)} className="w-16 p-1.5 border rounded-md text-center"/><div className="flex-grow"><p className="font-semibold text-sm truncate">{producto.nombre}</p></div><button onClick={() => handleProductAction('remove', producto)}><TrashIcon className="w-4 h-4 text-gray-400"/></button></div>)}</div>
                    <div className="border-t mt-4 pt-4"><div className="flex justify-between text-lg font-bold"><span>Total:</span><span>{formatCurrency(orderTotal)}</span></div></div>
                </div>
            </div>
            
            <CreateClientModal isOpen={isClientModalOpen} onClose={() => setIsClientModalOpen(false)} onClientCreated={handleClientCreated} initialName={newClientInitialData.name} initialCedulaRuc={newClientInitialData.cedulaRuc} />
            <ProductGroupModal group={viewingGroup} onClose={() => setViewingGroup(null)} onAddProduct={(p) => handleProductAction('add', p)} />
        </div>
    );
};

export default NuevoPedidoPage;
