
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { User, Cliente, TrabajoEstado, TrabajoTipo, Regimen } from '../types';
import { getClientes, createCliente, createTrabajo } from '../services/mockApi';
import { formatCurrency } from '../utils';
import { 
    SearchIcon, UserPlusIcon, ClockIcon, 
    UploadIcon, DollarIcon, SaveIcon, 
    CheckCircleIcon, FileTextIcon, 
    WrenchScrewdriverIcon, ShieldCheckIcon,
    PhoneIcon, EnvelopeIcon, MapPinIcon,
    Loader2Icon, CloseIcon
} from '../components/Icons';

// --- MOCK OPTIONS ---
const MATERIALS = [
    'Couché 150g (Volantes)', 'Couché 250g', 'Couché 300g (Rigido)',
    'Bond 75g (Copias)', 'Bond 90g (Membretes)', 'Químico (Facturas)',
    'Lona 13oz', 'Lona Blackout', 'Vinil Adhesivo', 'Vinil Transparente'
];

const PRODUCTS_LIST = [
    'Tarjetas de Presentación', 'Volantes / Flyers', 'Facturas SRI', 
    'Notas de Venta', 'Gigantografía (Lona)', 'Roll-up Banner', 
    'Etiquetas Adhesivas', 'Recetarios Médicos', 'Sobres', 'Carpetas'
];

const FINISHES_OPTS = [
    'Laminado Mate', 'Laminado Brillante', 'Troquelado', 
    'Puntillado', 'Numerado', 'Grapado', 'Doblado', 'Ojalillos'
];

// --- COMPONENTS ---

const SectionBlock: React.FC<{ title: string; icon: React.FC<any>; children: React.ReactNode; color?: string }> = ({ title, icon: Icon, children, color = "text-brand-blue" }) => (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 relative transition-all duration-200 hover:shadow-md">
        <div className="flex items-center gap-2 mb-5 border-b border-gray-100 dark:border-gray-700 pb-3">
            <div className={`p-1.5 rounded-lg bg-gray-50 dark:bg-gray-700`}>
                <Icon className={`w-5 h-5 ${color}`} />
            </div>
            <h3 className="font-bold text-gray-800 dark:text-white uppercase tracking-wide text-sm">{title}</h3>
        </div>
        {children}
    </div>
);

const FormLabel: React.FC<{ children: React.ReactNode; required?: boolean }> = ({ children, required }) => (
    <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1.5 tracking-wide">
        {children} {required && <span className="text-red-500">*</span>}
    </label>
);

const InputText: React.FC<React.InputHTMLAttributes<HTMLInputElement>> = (props) => (
    <input className="w-full p-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-brand-blue focus:border-brand-blue outline-none transition-all placeholder-gray-400 dark:text-white" {...props} />
);

const InputSelect: React.FC<React.SelectHTMLAttributes<HTMLSelectElement>> = (props) => (
    <div className="relative">
        <select className="w-full p-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-brand-blue focus:border-brand-blue outline-none transition-all appearance-none dark:text-white" {...props} />
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500">
            <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
        </div>
    </div>
);

// --- MAIN PAGE ---

const NuevoPedidoPage: React.FC = () => {
    const { currentUser } = useOutletContext<{ currentUser: User }>();
    const navigate = useNavigate();
    
    // --- DATA ---
    const [clients, setClients] = useState<Cliente[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // --- BLOCK 1: CLIENT DATA ---
    const [clientSearch, setClientSearch] = useState('');
    const [selectedClient, setSelectedClient] = useState<Cliente | null>(null);
    const [isCreateClientOpen, setIsCreateClientOpen] = useState(false);
    // New Client Form
    const [newClient, setNewClient] = useState({ nombre: '', ruc: '', telefono: '', email: '', direccion: '' });

    // --- BLOCK 2: LOGISTICS ---
    const [jobName, setJobName] = useState('');
    const [seller, setSeller] = useState(currentUser.nombre);
    const [deliveryDate, setDeliveryDate] = useState(() => {
        const d = new Date();
        d.setDate(d.getDate() + 2); // Default +2 days
        return d.toISOString().split('T')[0];
    });
    const [priority, setPriority] = useState<'Normal' | 'Urgente'>('Normal');
    const [initialStatus, setInitialStatus] = useState<TrabajoEstado>(TrabajoEstado.PENDIENTE);

    // --- BLOCK 3: SPECS ---
    const [productType, setProductType] = useState(PRODUCTS_LIST[0]);
    const [quantity, setQuantity] = useState<number>(1000);
    const [width, setWidth] = useState<string>('');
    const [height, setHeight] = useState<string>('');
    const [material, setMaterial] = useState(MATERIALS[0]);
    const [printSide, setPrintSide] = useState('4/0'); 
    const [finishes, setFinishes] = useState<string[]>([]);

    // --- BLOCK 4: DESIGN ---
    const [designSource, setDesignSource] = useState<'Cliente Provee' | 'Requiere Diseño'>('Cliente Provee');
    const [designer, setDesigner] = useState(currentUser.nombre);
    const [driveLink, setDriveLink] = useState('');

    // --- BLOCK 5: FINANCE ---
    const [unitPrice, setUnitPrice] = useState<number>(0);
    const [designCost, setDesignCost] = useState<number>(0);
    const [discountPct, setDiscountPct] = useState<number>(0);
    const [hasIva, setHasIva] = useState(false);
    const [abono, setAbono] = useState<number>(0);
    const [paymentMethod, setPaymentMethod] = useState<'Efectivo' | 'Transferencia' | 'Tarjeta'>('Efectivo');

    // --- CALCULATIONS ---
    const subtotal = useMemo(() => unitPrice * quantity, [unitPrice, quantity]);
    const subtotalWithDesign = subtotal + designCost;
    const discountVal = subtotalWithDesign * (discountPct / 100);
    const taxableBase = subtotalWithDesign - discountVal;
    const ivaVal = hasIva ? taxableBase * 0.15 : 0;
    const total = taxableBase + ivaVal;
    const pending = total - abono;

    // --- EFFECTS ---
    useEffect(() => {
        const load = async () => {
            const c = await getClientes();
            setClients(c);
            setLoading(false);
        };
        load();
    }, []);

    // Filter Clients
    const filteredClients = useMemo(() => {
        if (!clientSearch) return [];
        const lower = clientSearch.toLowerCase();
        return clients.filter(c => c.nombre.toLowerCase().includes(lower) || c.cedula.includes(lower));
    }, [clientSearch, clients]);

    // --- HANDLERS ---
    const handleClientSelect = (c: Cliente) => {
        setSelectedClient(c);
        setClientSearch(c.nombre);
    };

    const handleCreateClient = async () => {
        if (!newClient.nombre || !newClient.ruc) return;
        setLoading(true);
        const created = await createCliente({
            nombre: newClient.nombre,
            cedula: newClient.ruc,
            telefono: [newClient.telefono],
            email: newClient.email,
            direccion: newClient.direccion,
            regimen: Regimen.GENERAL
        });
        setClients(prev => [created, ...prev]);
        setSelectedClient(created);
        setIsCreateClientOpen(false);
        setLoading(false);
    };

    const handleSubmit = async () => {
        if (!selectedClient) {
            alert("Por favor selecciona un cliente.");
            return;
        }
        setSaving(true);
        
        try {
            await createTrabajo({
                clienteId: selectedClient.id,
                titular: jobName || productType,
                tipo: TrabajoTipo.GENERAL,
                subtipo: `${quantity}x ${productType}`,
                cantidad: quantity,
                tamano: width && height ? `${width}x${height}` : 'Estándar',
                total: total,
                abono: abono,
                saldo: pending,
                estado: initialStatus,
                fechaEntrega: deliveryDate,
                prioridad: priority,
                specs: {
                    producto: productType,
                    material,
                    medidas: `${width}x${height}`,
                    impresion: printSide,
                    acabados: finishes
                },
                diseno: {
                    estado: designSource,
                    designerId: designSource === 'Requiere Diseño' ? designer : undefined,
                    driveLink
                },
                metodoPago: paymentMethod,
                descuento: discountPct,
                costoDiseno: designCost,
                iva: hasIva
            }, currentUser.nombre);
            
            navigate('/kds');
        } catch (e) {
            console.error(e);
            alert("Error al guardar.");
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="pb-24 lg:pb-10 min-h-screen bg-gray-50 dark:bg-gray-900/50">
            {/* Header Title */}
            <div className="flex justify-between items-center mb-6 px-1">
                <div>
                    <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">Nueva Orden</h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Ingreso rápido de producción</p>
                </div>
                <div className="text-right hidden sm:block">
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Fecha Recepción</p>
                    <p className="text-lg font-bold text-gray-800 dark:text-white">{new Date().toLocaleDateString()}</p>
                </div>
            </div>

            <div className="flex flex-col lg:flex-row gap-6 items-start">
                
                {/* --- LEFT COLUMN (Blocks 1-4) --- */}
                <div className="w-full lg:w-3/4 space-y-6">
                    
                    {/* BLOCK 1: CLIENT DATA */}
                    <SectionBlock title="Datos del Cliente" icon={UserPlusIcon} color="text-brand-blue">
                        <div className="relative">
                            <FormLabel required>Búsqueda Inteligente (Nombre / RUC)</FormLabel>
                            <div className="relative">
                                <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                                <input 
                                    type="text" 
                                    value={clientSearch}
                                    onChange={e => { setClientSearch(e.target.value); if(e.target.value === '') setSelectedClient(null); }}
                                    className="w-full pl-10 p-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-brand-blue outline-none transition-all font-medium text-lg dark:text-white"
                                    placeholder="Buscar cliente..."
                                />
                                {clientSearch && !selectedClient && filteredClients.length > 0 && (
                                    <div className="absolute top-full left-0 w-full bg-white dark:bg-gray-800 shadow-xl rounded-lg mt-1 border border-gray-200 dark:border-gray-700 z-50 max-h-60 overflow-y-auto">
                                        {filteredClients.map(c => (
                                            <div key={c.id} onClick={() => handleClientSelect(c)} className="p-3 hover:bg-blue-50 dark:hover:bg-gray-700 cursor-pointer border-b border-gray-100 dark:border-gray-700 last:border-0">
                                                <p className="font-bold text-gray-800 dark:text-white">{c.nombre}</p>
                                                <p className="text-xs text-gray-500">{c.cedula}</p>
                                            </div>
                                        ))}
                                    </div>
                                )}
                                {clientSearch && !selectedClient && filteredClients.length === 0 && (
                                    <button 
                                        onClick={() => { setNewClient(prev => ({...prev, nombre: clientSearch})); setIsCreateClientOpen(true); }}
                                        className="absolute right-2 top-1/2 -translate-y-1/2 px-4 py-1.5 bg-green-500 text-white text-xs font-bold rounded-md hover:bg-green-600 shadow-sm transition-transform hover:scale-105"
                                    >
                                        + Crear Nuevo
                                    </button>
                                )}
                            </div>
                        </div>

                        {selectedClient && (
                            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl border border-blue-100 dark:border-blue-800 animate-fade-in">
                                <div>
                                    <p className="text-[10px] text-blue-500 font-bold uppercase mb-0.5">Razón Social</p>
                                    <p className="font-bold text-gray-800 dark:text-white truncate">{selectedClient.nombre}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] text-blue-500 font-bold uppercase mb-0.5">Identificación</p>
                                    <div className="flex items-center gap-1">
                                        <ShieldCheckIcon className="w-3 h-3 text-blue-400"/>
                                        <p className="text-gray-800 dark:text-white">{selectedClient.ruc || selectedClient.cedula}</p>
                                    </div>
                                </div>
                                <div>
                                    <p className="text-[10px] text-blue-500 font-bold uppercase mb-0.5">Contacto</p>
                                    <div className="flex items-center gap-1">
                                        <PhoneIcon className="w-3 h-3 text-blue-400"/>
                                        <p className="text-gray-800 dark:text-white">{selectedClient.telefono[0]}</p>
                                    </div>
                                </div>
                                <div>
                                    <p className="text-[10px] text-blue-500 font-bold uppercase mb-0.5">Email</p>
                                    <div className="flex items-center gap-1">
                                        <EnvelopeIcon className="w-3 h-3 text-blue-400"/>
                                        <p className="text-gray-800 dark:text-white truncate text-xs">{selectedClient.email || 'N/A'}</p>
                                    </div>
                                </div>
                                <div className="md:col-span-2 lg:col-span-4 border-t border-blue-200 dark:border-blue-800 pt-2 mt-1">
                                    <p className="text-[10px] text-blue-500 font-bold uppercase mb-0.5">Dirección de Entrega</p>
                                    <div className="flex items-center gap-2">
                                        <MapPinIcon className="w-3 h-3 text-blue-400"/>
                                        <input 
                                            type="text" 
                                            defaultValue={selectedClient.direccion} 
                                            className="w-full bg-transparent border-b border-blue-300 dark:border-blue-700 text-sm focus:outline-none dark:text-blue-100" 
                                        />
                                    </div>
                                </div>
                            </div>
                        )}
                    </SectionBlock>

                    {/* BLOCK 2: LOGISTICS */}
                    <SectionBlock title="Logística del Pedido" icon={ClockIcon} color="text-orange-500">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <FormLabel required>Nombre del Trabajo</FormLabel>
                                <InputText 
                                    placeholder="Ej: 5000 Volantes Inauguración" 
                                    value={jobName} 
                                    onChange={e => setJobName(e.target.value)} 
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <FormLabel required>Entrega Pactada</FormLabel>
                                    <input 
                                        type="date" 
                                        value={deliveryDate} 
                                        onChange={e => setDeliveryDate(e.target.value)} 
                                        className="w-full p-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm font-bold text-gray-800 dark:text-white focus:ring-2 focus:ring-orange-500"
                                    />
                                </div>
                                <div>
                                    <FormLabel>Prioridad</FormLabel>
                                    <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
                                        <button 
                                            onClick={() => setPriority('Normal')}
                                            className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all ${priority === 'Normal' ? 'bg-white dark:bg-gray-600 shadow text-gray-800 dark:text-white' : 'text-gray-500'}`}
                                        >
                                            Normal
                                        </button>
                                        <button 
                                            onClick={() => setPriority('Urgente')}
                                            className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all ${priority === 'Urgente' ? 'bg-red-500 text-white shadow' : 'text-gray-500'}`}
                                        >
                                            Urgente
                                        </button>
                                    </div>
                                </div>
                            </div>
                            <div>
                                <FormLabel>Vendedor</FormLabel>
                                <InputSelect value={seller} onChange={e => setSeller(e.target.value)} disabled>
                                    <option>{currentUser.nombre}</option>
                                </InputSelect>
                            </div>
                            <div>
                                <FormLabel>Estado Inicial</FormLabel>
                                <InputSelect value={initialStatus} onChange={e => setInitialStatus(e.target.value as TrabajoEstado)}>
                                    <option value={TrabajoEstado.PENDIENTE}>Pendiente</option>
                                    <option value={TrabajoEstado.EN_DISENO}>En Diseño</option>
                                    <option value={TrabajoEstado.PROCESO}>En Producción</option>
                                </InputSelect>
                            </div>
                        </div>
                    </SectionBlock>

                    {/* BLOCK 3: SPECS */}
                    <SectionBlock title="Especificaciones Técnicas" icon={WrenchScrewdriverIcon} color="text-purple-600">
                        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 mb-4">
                            <div className="md:col-span-5">
                                <FormLabel required>Producto</FormLabel>
                                <InputSelect value={productType} onChange={e => setProductType(e.target.value)}>
                                    {PRODUCTS_LIST.map(p => <option key={p} value={p}>{p}</option>)}
                                </InputSelect>
                            </div>
                            <div className="md:col-span-3">
                                <FormLabel required>Cantidad</FormLabel>
                                <InputText type="number" value={quantity} onChange={e => setQuantity(Number(e.target.value))} className="w-full p-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm font-bold text-brand-blue" />
                            </div>
                            <div className="md:col-span-4 grid grid-cols-2 gap-2">
                                <div>
                                    <FormLabel>Ancho (cm)</FormLabel>
                                    <InputText placeholder="0" value={width} onChange={e => setWidth(e.target.value)} />
                                </div>
                                <div>
                                    <FormLabel>Alto (cm)</FormLabel>
                                    <InputText placeholder="0" value={height} onChange={e => setHeight(e.target.value)} />
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
                            <div>
                                <FormLabel>Material / Papel</FormLabel>
                                <InputSelect value={material} onChange={e => setMaterial(e.target.value)}>
                                    {MATERIALS.map(m => <option key={m} value={m}>{m}</option>)}
                                </InputSelect>
                            </div>
                            <div>
                                <FormLabel>Impresión (Caras)</FormLabel>
                                <div className="flex gap-2">
                                    {['4/0', '4/4', '1/0', '1/1'].map(opt => (
                                        <label key={opt} className={`flex-1 flex items-center justify-center cursor-pointer border rounded-lg py-2 transition-all ${printSide === opt ? 'bg-purple-50 dark:bg-purple-900/30 border-purple-500 text-purple-700 dark:text-purple-300 font-bold' : 'border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'}`}>
                                            <input type="radio" name="printSide" checked={printSide === opt} onChange={() => setPrintSide(opt)} className="hidden"/>
                                            {opt}
                                        </label>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div>
                            <FormLabel>Acabados</FormLabel>
                            <div className="flex flex-wrap gap-2">
                                {FINISHES_OPTS.map(f => (
                                    <label key={f} className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-xs cursor-pointer transition-all select-none ${finishes.includes(f) ? 'bg-purple-600 text-white border-purple-600 shadow-sm' : 'bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-50'}`}>
                                        <input type="checkbox" checked={finishes.includes(f)} onChange={() => setFinishes(prev => prev.includes(f) ? prev.filter(i => i !== f) : [...prev, f])} className="hidden"/>
                                        {finishes.includes(f) && <CheckCircleIcon className="w-3 h-3"/>}
                                        {f}
                                    </label>
                                ))}
                            </div>
                        </div>
                    </SectionBlock>

                    {/* BLOCK 4: DESIGN */}
                    <SectionBlock title="Archivos y Diseño" icon={FileTextIcon} color="text-green-500">
                        <div className="flex flex-col sm:flex-row gap-6 mb-4">
                            <label className={`flex items-center gap-3 cursor-pointer p-3 rounded-xl border transition-all flex-1 ${designSource === 'Cliente Provee' ? 'bg-green-50 dark:bg-green-900/20 border-green-500 ring-1 ring-green-500' : 'border-gray-200 dark:border-gray-600'}`}>
                                <input type="radio" checked={designSource === 'Cliente Provee'} onChange={() => setDesignSource('Cliente Provee')} className="text-green-600 focus:ring-green-500 w-4 h-4"/>
                                <span className="font-bold text-sm text-gray-800 dark:text-white">Cliente Provee Archivo</span>
                            </label>
                            <label className={`flex items-center gap-3 cursor-pointer p-3 rounded-xl border transition-all flex-1 ${designSource === 'Requiere Diseño' ? 'bg-green-50 dark:bg-green-900/20 border-green-500 ring-1 ring-green-500' : 'border-gray-200 dark:border-gray-600'}`}>
                                <input type="radio" checked={designSource === 'Requiere Diseño'} onChange={() => setDesignSource('Requiere Diseño')} className="text-green-600 focus:ring-green-500 w-4 h-4"/>
                                <span className="font-bold text-sm text-gray-800 dark:text-white">Requiere Diseño Interno</span>
                            </label>
                        </div>

                        {designSource === 'Cliente Provee' ? (
                            <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-8 text-center hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors cursor-pointer group">
                                <UploadIcon className="w-10 h-10 text-gray-400 mx-auto mb-2 group-hover:text-green-500 transition-colors" />
                                <p className="text-sm text-gray-600 dark:text-gray-300 font-bold group-hover:text-green-600">Subir Archivo de Impresión</p>
                                <p className="text-xs text-gray-400 mt-1">PDF, AI, PSD, JPG (Max 50MB)</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50 dark:bg-gray-700/30 p-4 rounded-xl">
                                <div>
                                    <FormLabel>Diseñador Asignado</FormLabel>
                                    <InputSelect value={designer} onChange={e => setDesigner(e.target.value)}>
                                        <option>{currentUser.nombre}</option>
                                        <option>Equipo de Diseño</option>
                                        <option>Externo</option>
                                    </InputSelect>
                                </div>
                                <div className="flex items-center justify-center">
                                    <p className="text-xs text-green-600 dark:text-green-400 font-medium bg-green-100 dark:bg-green-900/30 px-3 py-1.5 rounded-full flex items-center gap-1">
                                        <ClockIcon className="w-3 h-3"/> Se agendará en cola de diseño
                                    </p>
                                </div>
                            </div>
                        )}
                        <div className="mt-4">
                            <FormLabel>Link Carpeta Producción (Drive/Dropbox)</FormLabel>
                            <InputText placeholder="https://..." value={driveLink} onChange={e => setDriveLink(e.target.value)} />
                        </div>
                    </SectionBlock>

                </div>

                {/* --- RIGHT COLUMN: FINANCIAL SIDEBAR (Sticky) --- */}
                <div className="w-full lg:w-1/4">
                    <div className="sticky top-6 space-y-4">
                        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                            <div className="bg-slate-900 p-4 text-white flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <DollarIcon className="w-5 h-5 text-green-400" />
                                    <h3 className="font-bold uppercase tracking-wider text-sm">Resumen</h3>
                                </div>
                                {loading && <Loader2Icon className="w-4 h-4 animate-spin text-white"/>}
                            </div>
                            
                            <div className="p-5 space-y-4">
                                {/* Unit Price */}
                                <div className="flex justify-between items-center">
                                    <label className="text-xs font-bold text-gray-500 uppercase">P. Unitario</label>
                                    <div className="w-24 relative">
                                        <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 text-xs">$</span>
                                        <input type="number" value={unitPrice} onChange={e => setUnitPrice(Number(e.target.value))} className="w-full p-1.5 pl-5 text-right bg-gray-50 border border-gray-200 rounded text-sm font-bold focus:ring-1 focus:ring-brand-blue" />
                                    </div>
                                </div>
                                
                                {/* Subtotal Auto */}
                                <div className="flex justify-between items-center py-2 border-t border-dashed border-gray-200 dark:border-gray-700">
                                    <span className="text-sm text-gray-600 dark:text-gray-400">Subtotal ({quantity} uds)</span>
                                    <span className="font-mono font-medium dark:text-white">{formatCurrency(subtotal)}</span>
                                </div>

                                {/* Design Cost */}
                                <div className="flex justify-between items-center">
                                    <label className="text-xs font-bold text-gray-500 uppercase">Costo Diseño</label>
                                    <div className="w-20 relative">
                                        <input type="number" value={designCost} onChange={e => setDesignCost(Number(e.target.value))} className="w-full p-1 text-right bg-gray-50 border border-gray-200 rounded text-xs" />
                                    </div>
                                </div>

                                {/* Discount */}
                                <div className="flex justify-between items-center">
                                    <label className="text-xs font-bold text-gray-500 uppercase">Descuento %</label>
                                    <div className="w-16 relative">
                                        <input type="number" value={discountPct} onChange={e => setDiscountPct(Number(e.target.value))} className="w-full p-1 text-right bg-gray-50 border border-gray-200 rounded text-xs text-red-500" />
                                    </div>
                                </div>

                                {/* VAT */}
                                <div className="flex justify-between items-center">
                                    <label className="flex items-center gap-2 text-xs font-bold text-gray-500 uppercase cursor-pointer">
                                        <input type="checkbox" checked={hasIva} onChange={e => setHasIva(e.target.checked)} className="rounded text-brand-blue focus:ring-0" />
                                        IVA (15%)
                                    </label>
                                    <span className="font-mono text-xs text-gray-400">{formatCurrency(ivaVal)}</span>
                                </div>

                                {/* TOTAL HUGE */}
                                <div className="bg-brand-blue/10 dark:bg-blue-900/30 p-4 rounded-xl text-center border border-brand-blue/20">
                                    <span className="block text-brand-blue text-xs font-bold uppercase mb-1">Total a Pagar</span>
                                    <span className="block text-3xl font-black text-brand-blue">{formatCurrency(total)}</span>
                                </div>

                                {/* Payment */}
                                <div className="border-t border-gray-200 dark:border-gray-700 pt-4 space-y-3">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">Abono / Anticipo</label>
                                        <div className="relative">
                                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold">$</span>
                                            <input type="number" value={abono} onChange={e => setAbono(Number(e.target.value))} className="w-full p-2 pl-6 text-right border-2 border-green-500/30 rounded-lg font-bold text-lg text-green-700 focus:border-green-500 focus:ring-0" />
                                        </div>
                                    </div>
                                    
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 mb-1">Método de Pago</label>
                                        <select value={paymentMethod} onChange={e => setPaymentMethod(e.target.value as any)} className="w-full p-1.5 border rounded text-xs bg-gray-50">
                                            <option>Efectivo</option>
                                            <option>Transferencia</option>
                                            <option>Tarjeta</option>
                                        </select>
                                    </div>

                                    <div className="flex justify-between items-center pt-2">
                                        <span className="text-xs font-bold text-red-500 uppercase">Pendiente</span>
                                        <span className="text-xl font-black text-red-600">{formatCurrency(pending)}</span>
                                    </div>
                                </div>

                                {/* Actions */}
                                <button 
                                    onClick={handleSubmit}
                                    disabled={saving}
                                    className="w-full py-4 bg-brand-blue text-white font-bold rounded-xl shadow-lg hover:bg-blue-700 transition-all transform active:scale-95 flex items-center justify-center gap-2 mt-2"
                                >
                                    {saving ? <Loader2Icon className="animate-spin w-5 h-5"/> : <SaveIcon className="w-5 h-5"/>}
                                    {saving ? 'Guardando...' : 'Confirmar Pedido'}
                                </button>
                                
                                <button className="w-full py-2 bg-white border border-gray-300 text-gray-600 text-xs font-bold rounded-lg hover:bg-gray-50">
                                    Exportar a Sheets
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

            </div>

            {/* Quick Create Client Modal */}
            {isCreateClientOpen && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex justify-center items-center p-4 animate-fade-in">
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-2xl max-w-md w-full border border-gray-100 dark:border-gray-700">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-bold dark:text-white flex items-center gap-2"><UserPlusIcon className="w-5 h-5 text-brand-blue"/> Nuevo Cliente</h2>
                            <button onClick={() => setIsCreateClientOpen(false)}><CloseIcon className="w-5 h-5 text-gray-400"/></button>
                        </div>
                        <div className="space-y-3">
                            <input type="text" placeholder="Nombre / Razón Social" value={newClient.nombre} onChange={e => setNewClient({...newClient, nombre: e.target.value})} className="w-full p-2.5 bg-gray-50 border rounded-lg focus:ring-brand-blue" autoFocus />
                            <div className="grid grid-cols-2 gap-3">
                                <input type="text" placeholder="RUC / Cédula" value={newClient.ruc} onChange={e => setNewClient({...newClient, ruc: e.target.value})} className="w-full p-2.5 bg-gray-50 border rounded-lg" />
                                <input type="text" placeholder="Teléfono" value={newClient.telefono} onChange={e => setNewClient({...newClient, telefono: e.target.value})} className="w-full p-2.5 bg-gray-50 border rounded-lg" />
                            </div>
                            <input type="email" placeholder="Email (Opcional)" value={newClient.email} onChange={e => setNewClient({...newClient, email: e.target.value})} className="w-full p-2.5 bg-gray-50 border rounded-lg" />
                            <input type="text" placeholder="Dirección" value={newClient.direccion} onChange={e => setNewClient({...newClient, direccion: e.target.value})} className="w-full p-2.5 bg-gray-50 border rounded-lg" />
                        </div>
                        <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-100">
                            <button onClick={() => setIsCreateClientOpen(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg text-sm font-bold">Cancelar</button>
                            <button onClick={handleCreateClient} className="px-6 py-2 bg-brand-blue text-white rounded-lg font-bold text-sm shadow-md hover:bg-blue-700">Guardar Cliente</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default NuevoPedidoPage;
