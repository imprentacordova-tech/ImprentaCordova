
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { getClientes, createCliente, createTrabajo, getProductos, createProducto, getSriCredentials } from '../services/mockApi';
import { Cliente, Trabajo, TrabajoEstado, TrabajoTipo, Regimen, Producto, User, SriCredential } from '../types';
import { formatCurrency } from '../utils';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { CloseIcon, SearchIcon, CheckCircleIcon, UserPlusIcon, PrinterIcon, KdsIcon, TrashIcon, ShieldCheckIcon, DocumentIcon, FolderIcon, ArrowLeftIcon, ArrowRightIcon, ShoppingCartIcon, ExclamationTriangleIcon, ReceiptIcon, DocumentCheckIcon, ClientsIcon, BoxIcon, AddIcon, DollarIcon, ClockIcon, StarIcon, MapPinIcon, Loader2Icon, KeyIcon, CopyIcon } from '../components/Icons';
import { getConfig } from '../services/configService';

// Declare html2pdf for TypeScript
declare const html2pdf: any;

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

// Estructura Inteligente de Categorías
const SMART_CATEGORIES: Record<string, string[]> = {
    'SRI': ['Facturas', 'Notas de Venta', 'Retenciones', 'Guías de Remisión', 'Liquidaciones de Compra', 'Notas de Crédito'],
    'Publicidad': ['Volantes / Flyers', 'Trípticos', 'Dípticos', 'Afiches', 'Carpetas Corporativas'],
    'Tarjetería': ['Tarjetas de Presentación', 'Invitación Matrimonio', 'Invitación 15 Años', 'Invitación Bautizo', 'Tarjetas de Agradecimiento'],
    'Calendarios': ['Calendario de Pared', 'Calendario de Escritorio', 'Calendario de Bolsillo', 'Almanaque Bristol'],
    'Gran Formato': ['Lona Front', 'Vinil Adhesivo', 'Vinil Microperforado', 'Roll Up', 'Banner'],
    'Oficina': ['Recibos de Caja', 'Sellos Automáticos', 'Sellos de Madera', 'Sobres Membretados', 'Hojas Membretadas', 'Etiquetas Adhesivas'],
    'Acabados': ['Empastado de Tesis', 'Anillado', 'Laminado', 'Troquelado']
};

// Componente de Input reutilizable
const InputField: React.FC<{ label: string; name: string; value: any; onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void; [key: string]: any; }> = ({ label, name, value, onChange, ...props }) => (
    <div className="group">
        <label htmlFor={name} className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 transition-colors group-focus-within:text-brand-blue">{label}</label>
        <input id={name} name={name} value={value} onChange={onChange} className="w-full p-2.5 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600 focus:ring-2 focus:ring-brand-blue focus:border-transparent transition-all shadow-sm" {...props} />
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
    const [errors, setErrors] = useState<{ nombre?: string; cedulaRuc?: string; telefono?: string }>({});
    
    const [isSaving, setIsSaving] = useState(false);
    const [saveSuccess, setSaveSuccess] = useState(false);

    const nombreRef = useRef<HTMLInputElement>(null);
    const nombreComercialRef = useRef<HTMLInputElement>(null);
    const cedulaRef = useRef<HTMLInputElement>(null);
    const telefonoRef = useRef<HTMLInputElement>(null);
    const emailRef = useRef<HTMLInputElement>(null);
    const direccionRef = useRef<HTMLInputElement>(null);
    const notasRef = useRef<HTMLTextAreaElement>(null);
    const saveButtonRef = useRef<HTMLButtonElement>(null);
    
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
            setErrors({});
            setIsSaving(false);
            setSaveSuccess(false);
            setTimeout(() => nombreRef.current?.focus(), 100);
        }
    }, [isOpen, initialName, initialCedulaRuc]);

    if (!isOpen) return null;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        setNewClienteData(prev => ({ ...prev, [e.target.name]: e.target.value }));
        if (errors[e.target.name as keyof typeof errors]) {
            setErrors(prev => ({ ...prev, [e.target.name]: undefined }));
        }
    };

    const handleEnterNavigation = (e: React.KeyboardEvent, nextRef: React.RefObject<HTMLElement>) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            nextRef.current?.focus();
        }
    };
    
    const handleTelefonoKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            const val = currentTelefono.trim();
            if (val.length === 10 && /^\d+$/.test(val)) {
                 if (!telefonos.includes(val)) {
                    setTelefonos(prev => [...prev, val]);
                    if (errors.telefono) setErrors(prev => ({ ...prev, telefono: undefined }));
                }
                setCurrentTelefono('');
            } else if (val === '') {
                emailRef.current?.focus();
            }
        }
    };

    const removeTelefono = (index: number) => {
        setTelefonos(prev => prev.filter((_, i) => i !== index));
    };
    
    const handleAddressFocus = (e: React.FocusEvent<HTMLInputElement>) => {
        e.target.select();
    };

    const handleCedulaRucChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        let value = e.target.value.replace(/\D/g, '');
        if (newClienteData.cedulaRuc.length === 10 && value.length === 11 && value.endsWith('0')) {
             const baseCedula = newClienteData.cedulaRuc;
             if(value.startsWith(baseCedula)) value = baseCedula + '001';
        }
        setNewClienteData(prev => ({ ...prev, cedulaRuc: value }));
        if (errors.cedulaRuc) setErrors(prev => ({ ...prev, cedulaRuc: undefined }));
    };

    const validateForm = () => {
        const newErrors: { nombre?: string; cedulaRuc?: string; telefono?: string } = {};
        let isValid = true;

        if (!newClienteData.nombre.trim()) { newErrors.nombre = 'Obligatorio'; isValid = false; }
        if (!newClienteData.cedulaRuc || (newClienteData.cedulaRuc.length !== 10 && newClienteData.cedulaRuc.length !== 13)) { newErrors.cedulaRuc = 'Inválido'; isValid = false; }
        const currentTelValid = currentTelefono.trim().length === 10 && /^\d+$/.test(currentTelefono.trim());
        if (telefonos.length === 0 && !currentTelValid) { newErrors.telefono = 'Requerido'; isValid = false; }

        setErrors(newErrors);
        return isValid;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validateForm()) return;

        setIsSaving(true);

        const { nombre, cedulaRuc, email, regimen, nombreComercial, direccion, notas } = newClienteData;
        const finalTelefonos = [...telefonos];
        if (currentTelefono.trim().length === 10 && /^\d+$/.test(currentTelefono.trim()) && !finalTelefonos.includes(currentTelefono.trim())) {
            finalTelefonos.push(currentTelefono.trim());
        }

        await new Promise(resolve => setTimeout(resolve, 600));

        const newCliente = await createCliente({ 
            nombre, cedula: cedulaRuc, ruc: cedulaRuc.length === 13 ? cedulaRuc : undefined, telefono: finalTelefonos, email: email || undefined, regimen, nombreComercial: nombreComercial || undefined, direccion: direccion || undefined, notas: notas || undefined
        });

        setIsSaving(false);
        setSaveSuccess(true);

        setTimeout(() => {
            onClientCreated(newCliente);
        }, 1200);
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex justify-center items-center p-4 animate-fade-in">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-lg transform transition-all scale-100 relative">
                <div className="flex justify-between items-center p-5 border-b border-gray-100 dark:border-gray-700 bg-gradient-to-r from-gray-50 to-white dark:from-gray-800 dark:to-gray-700 rounded-t-2xl">
                    <h2 className="text-xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
                        <div className="bg-brand-blue text-white p-1.5 rounded-lg"><UserPlusIcon className="h-5 w-5" /></div>
                        Nuevo Cliente
                    </h2>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-full transition-colors"><CloseIcon className="w-5 h-5 text-gray-500" /></button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div>
                            <InputField ref={nombreRef} label="Nombres/Razón Social" name="nombre" value={newClienteData.nombre} onChange={handleChange} onKeyDown={(e: React.KeyboardEvent) => handleEnterNavigation(e, nombreComercialRef)} required placeholder="Ej: Juan Pérez" />
                            {errors.nombre && <p className="text-red-500 text-xs mt-1 flex items-center gap-1"><ExclamationTriangleIcon className="w-3 h-3"/>{errors.nombre}</p>}
                        </div>
                        <InputField ref={nombreComercialRef} label="Nombre Comercial (Opc)" name="nombreComercial" value={newClienteData.nombreComercial} onChange={handleChange} onKeyDown={(e: React.KeyboardEvent) => handleEnterNavigation(e, cedulaRef)} placeholder="Ej: Tienda La Esquina" />
                    </div>
                     <div>
                        <label htmlFor="cedulaRuc" className="block text-sm font-medium dark:text-gray-300 mb-1">Cédula / RUC</label>
                        <div className="relative group">
                            <input ref={cedulaRef} type="text" pattern="[0-9]*" maxLength={13} name="cedulaRuc" id="cedulaRuc" value={newClienteData.cedulaRuc} onChange={handleCedulaRucChange} onKeyDown={(e) => handleEnterNavigation(e, telefonoRef)} required placeholder="10 o 13 dígitos" className={`w-full p-2.5 pl-3 pr-10 border rounded-lg dark:bg-gray-700 dark:border-gray-600 focus:ring-2 focus:ring-brand-blue focus:border-transparent transition-all shadow-sm ${errors.cedulaRuc ? 'border-red-500 ring-1 ring-red-500' : 'border-gray-300'}`} />
                            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-gray-400 group-focus-within:text-brand-blue transition-colors">
                                <ShieldCheckIcon className="h-5 w-5" />
                            </div>
                        </div>
                        {errors.cedulaRuc && <p className="text-red-500 text-xs mt-1 flex items-center gap-1"><ExclamationTriangleIcon className="w-3 h-3"/>{errors.cedulaRuc}</p>}
                    </div>
                    <div>
                        <label htmlFor="telefono" className="block text-sm font-medium dark:text-gray-300 mb-1">Teléfono(s)</label>
                        <div className={`flex flex-wrap items-center gap-2 p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 focus-within:ring-2 focus-within:ring-brand-blue transition-all bg-white dark:bg-gray-800 shadow-sm ${errors.telefono ? 'border-red-500' : 'border-gray-300'}`}>
                            {telefonos.map((tel, index) => (
                                <div key={index} className="flex items-center gap-1 bg-blue-50 dark:bg-blue-900/50 text-brand-blue dark:text-blue-300 rounded-md px-2 py-1 text-sm font-bold border border-blue-100 dark:border-blue-800">
                                    <span>{tel}</span>
                                    <button type="button" onClick={() => removeTelefono(index)} className="hover:text-red-500 transition-colors text-lg leading-none ml-1">&times;</button>
                                </div>
                            ))}
                            <input ref={telefonoRef} type="tel" id="telefono" value={currentTelefono} onChange={e => setCurrentTelefono(e.target.value.replace(/\D/g, ''))} onKeyDown={handleTelefonoKeyDown} placeholder={telefonos.length > 0 ? "Otro..." : "Ej: 0991234567"} className="flex-grow bg-transparent outline-none p-1 min-w-[100px] text-gray-700 dark:text-white" maxLength={10} />
                        </div>
                        {errors.telefono && <p className="text-red-500 text-xs mt-1 flex items-center gap-1"><ExclamationTriangleIcon className="w-3 h-3"/>{errors.telefono}</p>}
                    </div>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <InputField ref={emailRef} label="Email (Opcional)" name="email" type="email" value={newClienteData.email} onChange={handleChange} onKeyDown={(e: React.KeyboardEvent) => handleEnterNavigation(e, direccionRef)} placeholder="correo@ejemplo.com" />
                        <InputField ref={direccionRef} label="Dirección" name="direccion" value={newClienteData.direccion} onChange={handleChange} onFocus={handleAddressFocus} onKeyDown={(e: React.KeyboardEvent) => handleEnterNavigation(e, notasRef)} />
                    </div>
                    <div>
                        <label htmlFor="notas" className="block text-sm font-medium dark:text-gray-300 mb-1">Notas</label>
                        <textarea ref={notasRef} name="notas" id="notas" value={newClienteData.notas} onChange={handleChange} onKeyDown={(e) => handleEnterNavigation(e, saveButtonRef)} rows={2} className="w-full p-2.5 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600 focus:ring-2 focus:ring-brand-blue focus:border-transparent transition-all shadow-sm" placeholder="Preferencias..."></textarea>
                    </div>
                    <div className="flex justify-end pt-4 gap-3 border-t dark:border-gray-700">
                        <button type="button" onClick={onClose} disabled={isSaving || saveSuccess} className="px-5 py-2.5 text-gray-700 font-semibold rounded-lg hover:bg-gray-100 transition-colors dark:text-gray-300 dark:hover:bg-gray-700 disabled:opacity-50">Cancelar</button>
                        
                        <button 
                            ref={saveButtonRef} 
                            type="submit" 
                            disabled={isSaving || saveSuccess}
                            className={`px-6 py-2.5 text-white font-bold rounded-lg shadow-lg transition-all transform flex items-center gap-2 min-w-[140px] justify-center ${
                                saveSuccess 
                                    ? 'bg-green-500 hover:bg-green-600 scale-105' 
                                    : 'bg-brand-blue hover:bg-blue-800 hover:-translate-y-0.5 active:translate-y-0'
                            }`}
                        >
                            {isSaving ? (
                                <><Loader2Icon className="animate-spin w-5 h-5"/> Guardando...</>
                            ) : saveSuccess ? (
                                <><CheckCircleIcon className="w-5 h-5"/> ¡Guardado!</>
                            ) : (
                                "Guardar Cliente"
                            )}
                        </button>
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

const getDocumentIcon = (name: string) => {
    const lower = name.toLowerCase();
    if (lower.includes('nota de venta')) return <ReceiptIcon className="w-8 h-8 text-green-600" />;
    if (lower.includes('factura')) return <DocumentCheckIcon className="w-8 h-8 text-blue-600" />;
    if (lower.includes('guía') || lower.includes('guia')) return <ArrowRightIcon className="w-8 h-8 text-orange-500" />;
    if (lower.includes('crédito')) return <ExclamationTriangleIcon className="w-8 h-8 text-red-500" />;
    return <FolderIcon className="w-8 h-8 text-gray-400" />;
}

// --- Main Page Component ---
const NuevoPedidoPage: React.FC = () => {
    const { currentUser } = useOutletContext<{ currentUser: User }>();
    const navigate = useNavigate();

    // State
    const [step, setStep] = useState<Step>('cliente');
    const [clientes, setClientes] = useState<Cliente[]>([]);
    const [allProductos, setAllProductos] = useState<Producto[]>([]);
    const [sriCredentials, setSriCredentials] = useState<SriCredential[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [createdTrabajo, setCreatedTrabajo] = useState<Trabajo | null>(null);
    const [isClientModalOpen, setIsClientModalOpen] = useState(false);
    const [isProductModalOpen, setIsProductModalOpen] = useState(false);
    const [newClientInitialData, setNewClientInitialData] = useState<{ name?: string, cedulaRuc?: string }>({});
    const [viewingGroup, setViewingGroup] = useState<ProductGroup | null>(null);
    const [isSummaryOpen, setIsSummaryOpen] = useState(false);
    const [activeClientIndex, setActiveClientIndex] = useState(-1);
    const [foundSriCredential, setFoundSriCredential] = useState<SriCredential | null>(null);
    const [keyAutoFilled, setKeyAutoFilled] = useState(false);

    // Order State
    const [selectedCliente, setSelectedCliente] = useState<Cliente | null>(null);
    const [selectedProductos, setSelectedProductos] = useState<Map<string, { producto: Producto; cantidad: number }>>(new Map());
    const [titular, setTitular] = useState('');
    const [abono, setAbono] = useState(5);
    const [esRenovacion, setEsRenovacion] = useState(false);

    // SRI Fields
    const [establecimiento, setEstablecimiento] = useState('');
    const [puntoEmision, setPuntoEmision] = useState('');
    const [claveAcceso, setClaveAcceso] = useState('');

    // Search & Filter State
    const [clientSearchTerm, setClientSearchTerm] = useState('');
    const debouncedClientSearchTerm = useDebounce(clientSearchTerm, 300);
    
    const [jobType, setJobType] = useState<TrabajoTipo>(TrabajoTipo.SRI);
    const [productSearchTerm, setProductSearchTerm] = useState('');
    const [tempRegimen, setTempRegimen] = useState<Regimen | null>(null);
    const [pdfConfig, setPdfConfig] = useState<any>(null);

    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            const [clientesData, productosData, credsData] = await Promise.all([getClientes(), getProductos(), getSriCredentials()]);
            const config = getConfig();
            setPdfConfig(config);
            setClientes(clientesData);
            setAllProductos(productosData);
            setSriCredentials(credsData);
            
            const [estab = '001', pto = '001'] = config.numeracionPrefijo.split('-').map(s => s.trim()).filter(Boolean);
            setEstablecimiento(estab);
            setPuntoEmision(pto);
            
            setIsLoading(false);
        };
        fetchData();
    }, []);

    // MAGIC: Check for SRI Credential when client is selected and AUTO-FILL
    useEffect(() => {
        if (selectedCliente) {
            const ruc = selectedCliente.ruc || selectedCliente.cedula;
            // Try exact match or RUC (CEDULA + 001)
            const cred = sriCredentials.find(c => c.ruc === ruc || (ruc.length === 10 && c.ruc === ruc + '001'));
            setFoundSriCredential(cred || null);
            
            if (cred && cred.password) {
                setClaveAcceso(cred.password);
                setKeyAutoFilled(true);
                // Reset visual flash effect after 2s
                setTimeout(() => setKeyAutoFilled(false), 2000);
            } else {
                setKeyAutoFilled(false);
                setClaveAcceso('');
            }
        } else {
            setFoundSriCredential(null);
            setKeyAutoFilled(false);
        }
    }, [selectedCliente, sriCredentials]);
    
    // Auto PDF Generation Logic
    useEffect(() => {
        if (createdTrabajo && createdTrabajo.tipo === TrabajoTipo.GENERAL && selectedCliente) {
            const timer = setTimeout(() => {
                generateReceiptPdf();
            }, 800);
            return () => clearTimeout(timer);
        }
    }, [createdTrabajo, selectedCliente]);

    const generateReceiptPdf = () => {
        const element = document.getElementById('hidden-receipt-template');
        if (element && createdTrabajo) {
            const opt = {
                margin: 0,
                filename: `Recibo-${createdTrabajo.orden}.pdf`,
                image: { type: 'jpeg', quality: 0.98 },
                html2canvas: { scale: 2, useCORS: true },
                jsPDF: { unit: 'mm', format: [80, 200], orientation: 'portrait' }
            };
            html2pdf().from(element).set(opt).save();
        }
    };
    
    useEffect(() => {
        if (selectedCliente) {
            if (jobType === TrabajoTipo.SRI) {
                setTempRegimen(selectedCliente.regimen === Regimen.EMPRENDEDOR ? Regimen.EMPRENDEDOR : Regimen.NEGOCIO_POPULAR);
            } else {
                setTempRegimen(selectedCliente.regimen);
            }
        }
    }, [selectedCliente, jobType]);
    
    useEffect(() => {
      setActiveClientIndex(-1);
    }, [debouncedClientSearchTerm]);

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

    const recentClients = useMemo(() => {
        return [...clientes].sort((a, b) => new Date(b.creadoEn).getTime() - new Date(a.creadoEn).getTime()).slice(0, 4);
    }, [clientes]);

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
    
    const filteredDisplayItems = useMemo(() => {
        let items: DisplayableProduct[] = productGroupsAndItems.filter(p =>
            (jobType === TrabajoTipo.SRI ? !!p.esSRI : !p.esSRI) &&
            ('groupName' in p ? p.groupName : p.nombre).toLowerCase().includes(productSearchTerm.toLowerCase())
        );

        if (jobType === TrabajoTipo.SRI && tempRegimen) {
            const regimen = tempRegimen;
            const processedItems = items.map(item => {
                let currentItem: DisplayableProduct | null = item;
                const itemName = 'groupName' in currentItem ? currentItem.groupName : currentItem.nombre;
                const nameLower = itemName.toLowerCase();
                const isFactura = nameLower.includes('factura');
                const isNotaVenta = nameLower.includes('nota de venta') || nameLower.includes('notas de venta');
                
                if (regimen === Regimen.NEGOCIO_POPULAR) {
                    if (isFactura) return null; 
                } else { 
                    if (isNotaVenta) return null;
                    if (isFactura && 'groupName' in currentItem) {
                        const filteredVariations = currentItem.variations.filter(v => v.variationName.includes('25H') || v.variationName.toLowerCase().includes('25 hojas'));
                        if (filteredVariations.length > 0) currentItem = { ...currentItem, variations: filteredVariations };
                        else return null;
                    }
                }
                return currentItem;
            });
            items = processedItems.filter((p): p is DisplayableProduct => p !== null);
        }
        return items;
    }, [productGroupsAndItems, jobType, productSearchTerm, tempRegimen]);

    // Handlers
    const resetOrderState = () => {
        setStep('cliente');
        setSelectedCliente(null);
        setSelectedProductos(new Map());
        setTitular('');
        setAbono(5);
        setCreatedTrabajo(null);
        setTempRegimen(null);
        setJobType(TrabajoTipo.SRI);
        setClaveAcceso('');
        setEsRenovacion(false);
        setFoundSriCredential(null);
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

    const handleProductCreated = (newProduct: Producto) => {
        setAllProductos(prev => [newProduct, ...prev]);
        handleProductAction('add', newProduct);
        setIsProductModalOpen(false);
        setProductSearchTerm('');
    };

    const handleOpenCreateClientModal = () => {
        const isNumeric = /^\d+$/.test(debouncedClientSearchTerm);
        if (isNumeric) setNewClientInitialData({ cedulaRuc: debouncedClientSearchTerm });
        else setNewClientInitialData({ name: debouncedClientSearchTerm });
        setIsClientModalOpen(true);
    };

    const handleClientSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setActiveClientIndex(prev => (prev < filteredClientes.length - 1 ? prev + 1 : prev));
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setActiveClientIndex(prev => (prev > 0 ? prev - 1 : 0));
        } else if (e.key === 'Enter') {
            e.preventDefault();
            if (activeClientIndex > -1 && filteredClientes[activeClientIndex]) {
                handleSelectClient(filteredClientes[activeClientIndex]);
            } else if (debouncedClientSearchTerm && filteredClientes.length === 0) {
                handleOpenCreateClientModal();
            }
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
            establecimiento: jobType === TrabajoTipo.SRI ? establecimiento : undefined,
            puntoEmision: jobType === TrabajoTipo.SRI ? puntoEmision : undefined,
            claveAcceso: jobType === TrabajoTipo.SRI ? claveAcceso : undefined,
            esRenovacion,
        }, currentUser.nombre);
        
        if (jobType === TrabajoTipo.SRI) {
            navigate(`/solicitud-impresion/${newTrabajo.id}`);
        } else {
            setCreatedTrabajo(newTrabajo);
        }
        setIsLoading(false);
    };
    
    const StepIndicator: React.FC<{ currentStep: Step }> = ({ currentStep }) => {
        const steps: { id: Step, title: string }[] = [{ id: 'cliente', title: 'Cliente' }, { id: 'productos', title: 'Productos' }, { id: 'resumen', title: 'Resumen' }];
        const currentIdx = steps.findIndex(s => s.id === currentStep);
        return (
            <nav className="flex items-center justify-center mb-8">
                {steps.map((step, idx) => (
                    <React.Fragment key={step.id}>
                        <div className="flex items-center">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${idx <= currentIdx ? 'bg-brand-blue text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-500'}`}>
                                {idx < currentIdx ? '✓' : idx + 1}
                            </div>
                            <span className={`ml-3 font-semibold ${idx <= currentIdx ? 'text-brand-blue' : 'text-gray-500 dark:text-gray-400'}`}>{step.title}</span>
                        </div>
                        {idx < steps.length - 1 && <div className={`flex-auto border-t-2 mx-4 ${idx < currentIdx ? 'border-brand-blue' : 'border-gray-200 dark:border-gray-700'}`}></div>}
                    </React.Fragment>
                ))}
            </nav>
        );
    };

    const renderStepContent = () => {
        switch (step) {
            case 'cliente':
                return (
                    <div className="animate-fade-in max-w-3xl mx-auto">
                        <div className="text-center mb-8">
                            <h2 className="text-4xl font-extrabold text-gray-900 dark:text-white mb-3">¿Quién es el cliente?</h2>
                            <p className="text-gray-500 dark:text-gray-400 text-lg">Busca por nombre, cédula o RUC para comenzar.</p>
                        </div>
                        
                        <div className="relative shadow-xl rounded-2xl bg-white dark:bg-gray-800 transform transition-transform focus-within:scale-[1.02] duration-300 z-10">
                            <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                                <SearchIcon className="h-7 w-7 text-gray-400" />
                            </div>
                            <input 
                                type="text" 
                                value={clientSearchTerm} 
                                onChange={e => setClientSearchTerm(e.target.value)} 
                                onKeyDown={handleClientSearchKeyDown} 
                                placeholder="Ej: Juan Pérez o 1712..." 
                                className="block w-full pl-14 pr-6 py-5 bg-transparent border-none rounded-2xl text-xl text-gray-900 dark:text-white placeholder-gray-400 focus:ring-0" 
                                autoFocus
                            />
                        </div>
                         <div className="mt-6">
                            {debouncedClientSearchTerm ? (
                                filteredClientes.length > 0 ? (
                                    <div className="grid gap-3">
                                        {filteredClientes.map((c, index) => (
                                            <div 
                                                key={c.id} 
                                                onClick={() => handleSelectClient(c)}
                                                onMouseEnter={() => setActiveClientIndex(index)}
                                                className={`p-4 rounded-xl cursor-pointer transition-all flex items-center justify-between group border ${
                                                    activeClientIndex === index 
                                                    ? 'bg-blue-50 dark:bg-blue-900/30 border-brand-blue shadow-md translate-x-1' 
                                                    : 'bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700 hover:border-brand-blue/50'
                                                }`}
                                            >
                                                <div className="flex items-center gap-4">
                                                    <div className={`h-12 w-12 rounded-full flex items-center justify-center font-bold text-lg transition-colors ${activeClientIndex === index ? 'bg-brand-blue text-white' : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'}`}>
                                                        {c.nombre.charAt(0).toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-gray-900 dark:text-white text-lg">{c.nombre}</p>
                                                        <p className="text-sm text-gray-500 flex items-center gap-1"><ShieldCheckIcon className="w-3 h-3"/> {c.cedula}</p>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <span className="inline-block px-2 py-1 text-xs font-medium bg-gray-100 text-gray-600 rounded-md">{c.regimen}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-700">
                                        <p className="text-gray-500 text-lg mb-4">No encontramos a nadie con esos datos.</p>
                                        <button onClick={handleOpenCreateClientModal} className="inline-flex items-center gap-2 mx-auto px-8 py-3 bg-brand-blue text-white font-bold rounded-full shadow-lg hover:bg-blue-700 hover:shadow-xl transition-all transform hover:-translate-y-1">
                                            <UserPlusIcon className="h-5 w-5"/> Crear Cliente Nuevo
                                        </button>
                                    </div>
                                )
                            ) : (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="col-span-full text-sm font-bold text-gray-400 uppercase tracking-wider mb-2">Clientes Recientes</div>
                                    {recentClients.map(c => (
                                        <div key={c.id} onClick={() => handleSelectClient(c)} className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-100 dark:border-gray-700 hover:shadow-md cursor-pointer transition-all hover:border-brand-blue/30 group">
                                            <div className="flex items-center gap-3">
                                                <div className="h-10 w-10 rounded-full bg-blue-50 text-brand-blue flex items-center justify-center font-bold group-hover:bg-brand-blue group-hover:text-white transition-colors">{c.nombre.charAt(0)}</div>
                                                <div className="overflow-hidden">
                                                    <p className="font-semibold truncate">{c.nombre}</p>
                                                    <p className="text-xs text-gray-500">{c.cedula}</p>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                    <button onClick={handleOpenCreateClientModal} className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-600 hover:border-brand-blue text-gray-500 hover:text-brand-blue flex items-center justify-center gap-2 transition-all font-bold">
                                        <UserPlusIcon className="w-5 h-5"/> Nuevo Cliente
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                );
            case 'productos':
                return (
                    <div className="animate-fade-in flex flex-col h-full">
                         <div className="sticky top-0 z-20 bg-neutral-light/95 dark:bg-gray-900/95 backdrop-blur-md pb-4 border-b dark:border-gray-700 mb-4 -mx-4 px-4 pt-2">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-3">
                                <div className="flex items-center gap-2 bg-white dark:bg-gray-800 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-600 shadow-sm">
                                    <span className="text-xs font-bold text-gray-400 uppercase">Cliente</span>
                                    <span className="font-bold text-brand-blue">{selectedCliente?.nombre}</span>
                                    <button onClick={() => { setStep('cliente'); setSelectedCliente(null); }} className="ml-2 p-1 bg-gray-100 hover:bg-red-100 hover:text-red-600 rounded-full transition-colors"><CloseIcon className="w-3 h-3"/></button>
                                </div>
                                <div className="flex bg-gray-200 dark:bg-gray-700 p-1 rounded-lg self-start">
                                    <button onClick={() => setJobType(TrabajoTipo.GENERAL)} className={`px-4 py-1.5 text-sm font-bold rounded-md flex items-center gap-2 transition-all ${jobType === TrabajoTipo.GENERAL ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700'}`}>General</button>
                                    <button onClick={() => setJobType(TrabajoTipo.SRI)} className={`px-4 py-1.5 text-sm font-bold rounded-md flex items-center gap-2 transition-all ${jobType === TrabajoTipo.SRI ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700'}`}>SRI</button>
                                </div>
                            </div>

                            <div className="flex flex-col md:flex-row gap-3">
                                <div className="relative flex-grow">
                                    <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400"/>
                                    <input type="text" value={productSearchTerm} onChange={e => setProductSearchTerm(e.target.value)} placeholder="Buscar productos..." className="w-full pl-10 p-2.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:ring-2 focus:ring-brand-blue"/>
                                </div>
                                {jobType === TrabajoTipo.SRI && (
                                    <div className="flex flex-wrap items-center gap-2 bg-yellow-50 dark:bg-yellow-900/20 px-3 py-2 rounded-lg border border-yellow-200 dark:border-yellow-800">
                                        <span className="text-xs font-bold text-yellow-800 dark:text-yellow-500 uppercase">Facturación:</span>
                                        <input className="w-10 p-1 text-center bg-white border rounded text-sm" maxLength={3} value={establecimiento} onChange={e => setEstablecimiento(e.target.value)} placeholder="001" />
                                        <span className="text-gray-400">-</span>
                                        <input className="w-10 p-1 text-center bg-white border rounded text-sm" maxLength={3} value={puntoEmision} onChange={e => setPuntoEmision(e.target.value)} placeholder="001" />
                                        
                                        <div className="relative">
                                            <input 
                                                className={`w-48 p-1 text-sm border rounded ml-2 pr-8 transition-all duration-500 ${keyAutoFilled ? 'bg-green-100 border-green-400 ring-2 ring-green-400' : 'bg-white'}`}
                                                value={claveAcceso} 
                                                onChange={e => setClaveAcceso(e.target.value)} 
                                                placeholder="Autorización"
                                            />
                                            {/* Key Status Indicator */}
                                            {foundSriCredential ? (
                                                <div className="absolute right-2 top-1/2 -translate-y-1/2 group cursor-pointer">
                                                    <KeyIcon className={`w-4 h-4 ${keyAutoFilled ? 'text-green-600 scale-110' : 'text-green-500'}`} />
                                                    <div className="absolute top-full right-0 mt-2 w-56 bg-white dark:bg-gray-800 shadow-xl rounded-lg p-3 border border-green-200 dark:border-green-800 z-50 hidden group-hover:block">
                                                        <p className="text-[10px] font-bold text-gray-500 uppercase mb-1 flex items-center gap-1"><CheckCircleIcon className="w-3 h-3 text-green-500"/> Clave Encontrada</p>
                                                        <div className="flex items-center justify-between bg-green-50 dark:bg-green-900/20 p-2 rounded border border-green-100 dark:border-green-800">
                                                            <span className="font-mono text-xs font-bold text-gray-800 dark:text-white truncate">{foundSriCredential.password}</span>
                                                            <button 
                                                                onClick={() => {
                                                                    navigator.clipboard.writeText(foundSriCredential.password || '');
                                                                    setKeyAutoFilled(true);
                                                                    setTimeout(() => setKeyAutoFilled(false), 1000);
                                                                }}
                                                                className="ml-2 text-blue-600 hover:text-blue-800"
                                                                title="Copiar"
                                                            >
                                                                <CopyIcon className="w-3 h-3" />
                                                            </button>
                                                        </div>
                                                        <p className="text-[9px] text-gray-400 mt-1">Origen: {foundSriCredential.origen || 'Manual'}</p>
                                                    </div>
                                                </div>
                                            ) : (
                                                 <div className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-300">
                                                    <KeyIcon className="w-4 h-4" />
                                                 </div>
                                            )}
                                        </div>

                                        {/* Renovation Checkbox */}
                                        <div className="flex items-center ml-2 pl-2 border-l border-yellow-200 dark:border-yellow-700">
                                            <label className="flex items-center gap-2 cursor-pointer">
                                                <input 
                                                    type="checkbox" 
                                                    checked={esRenovacion} 
                                                    onChange={(e) => setEsRenovacion(e.target.checked)} 
                                                    className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500 border-gray-300"
                                                />
                                                <span className="text-xs font-bold text-purple-700 dark:text-purple-400 flex items-center gap-1">
                                                    <ClockIcon className="w-3 h-3"/> Renovación
                                                </span>
                                            </label>
                                        </div>

                                        <select value={tempRegimen || ''} onChange={e => setTempRegimen(e.target.value as Regimen)} className="text-xs p-1 border rounded bg-white ml-2"><option value={Regimen.NEGOCIO_POPULAR}>Negocio Popular</option><option value={Regimen.EMPRENDEDOR}>Emprendedor</option><option value={Regimen.GENERAL}>General</option></select>
                                    </div>
                                )}
                            </div>
                        </div>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 pb-24">
                             {filteredDisplayItems.map(item => {
                                if (!item) return null;
                                const isGroup = 'groupName' in item;
                                const name = isGroup ? item.groupName : item.nombre;
                                const price = isGroup && item.variations[0] ? item.variations[0].price : (item as Producto).precio;
                                const qtyInCart = !isGroup && selectedProductos.get((item as Producto).id)?.cantidad || 0;

                                return (
                                    <div 
                                        key={isGroup ? item.groupName : item.id}
                                        onClick={() => isGroup ? setViewingGroup(item as ProductGroup) : handleProductAction('add', item as Producto)}
                                        className={`relative bg-white dark:bg-gray-800 p-4 rounded-xl border-2 transition-all cursor-pointer group flex flex-col h-full ${qtyInCart > 0 ? 'border-brand-blue ring-1 ring-brand-blue bg-blue-50/30' : 'border-transparent hover:border-brand-blue/30 shadow-sm hover:shadow-lg'}`}
                                    >
                                        <div className="absolute top-3 right-3">
                                            {qtyInCart > 0 && <span className="bg-brand-blue text-white text-xs font-bold px-2 py-1 rounded-full shadow-sm">{qtyInCart}</span>}
                                        </div>
                                        <div className="mb-3 self-center p-3 bg-gray-50 dark:bg-gray-700 rounded-full group-hover:scale-110 transition-transform">
                                            {getDocumentIcon(name)}
                                        </div>
                                        <div className="text-center mt-auto">
                                            <h3 className="font-bold text-gray-800 dark:text-white text-sm leading-tight mb-1">{name}</h3>
                                            <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">{isGroup ? item.categoria : (item as Producto).categoria}</p>
                                            <p className="text-brand-blue font-bold bg-blue-50 dark:bg-blue-900/30 inline-block px-2 py-0.5 rounded text-sm">
                                                {isGroup ? 'Ver opciones' : formatCurrency(price)}
                                            </p>
                                        </div>
                                    </div>
                                );
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
        <div className="h-full flex flex-col relative">
            <StepIndicator currentStep={step} />
            
            <div className="flex-grow bg-neutral-light dark:bg-gray-900 p-4 sm:p-6 overflow-y-auto">
                <div className="max-w-7xl mx-auto h-full">
                    {renderStepContent()}
                </div>
            </div>
            
             {step !== 'cliente' && (
                <div className="p-4 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 flex justify-between items-center sticky bottom-0 z-30 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)]">
                    <button onClick={() => setStep(step === 'resumen' ? 'productos' : 'cliente')} className="flex items-center gap-2 px-6 py-3 text-gray-600 dark:text-gray-300 font-bold hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors">
                        <ArrowLeftIcon className="h-5 w-5"/> <span className="hidden sm:inline">Anterior</span>
                    </button>
                    {step === 'productos' && (
                        <button 
                            onClick={() => setStep('resumen')} 
                            disabled={selectedProductos.size === 0} 
                            className="flex items-center gap-3 px-8 py-3 bg-brand-blue text-white font-bold rounded-xl shadow-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform active:scale-95"
                        >
                            <span>Revisar Pedido</span>
                            <span className="bg-white/20 px-2 py-0.5 rounded text-sm">{totalItemsInCart}</span>
                            <ArrowRightIcon className="h-5 w-5"/>
                        </button>
                    )}
                    {step === 'resumen' && (
                        <button 
                            onClick={handleFinalizeOrder} 
                            disabled={isLoading} 
                            className="flex items-center gap-2 px-8 py-3 bg-green-600 text-white font-bold rounded-xl shadow-lg hover:bg-green-700 transition-all transform active:scale-95"
                        >
                            {isLoading ? 'Procesando...' : 'Confirmar Pedido'} <CheckCircleIcon className="w-5 h-5"/>
                        </button>
                    )}
                </div>
            )}

            {/* ... Cart and Modals ... */}
             {step === 'productos' && totalItemsInCart > 0 && (
                <button 
                    onClick={() => setIsSummaryOpen(true)} 
                    className="fixed bottom-24 right-6 md:bottom-28 z-40 bg-brand-red text-white px-4 py-3 rounded-full shadow-2xl flex items-center gap-3 hover:bg-red-700 transition-all hover:scale-105 group"
                >
                    <ShoppingCartIcon className="h-6 w-6"/>
                    <div className="flex flex-col items-start leading-none">
                        <span className="text-xs font-bold opacity-90">{totalItemsInCart} items</span>
                        <span className="font-extrabold text-sm">{formatCurrency(orderTotal)}</span>
                    </div>
                </button>
            )}

            <div className={`fixed inset-y-0 right-0 w-full sm:w-96 bg-white dark:bg-gray-800 shadow-2xl transform transition-transform duration-300 z-50 ${isSummaryOpen ? 'translate-x-0' : 'translate-x-full'}`}>
                <div className="p-6 flex flex-col h-full">
                    <div className="p-5 border-b dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-700/50">
                        <h2 className="text-xl font-bold flex items-center gap-2"><ShoppingCartIcon className="h-6 w-6 text-brand-blue"/> Tu Carrito</h2>
                        <button onClick={() => setIsSummaryOpen(false)} className="p-2 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-full"><CloseIcon className="w-6 h-6"/></button>
                    </div>
                    <div className="flex-grow overflow-y-auto p-4 space-y-3">
                        {(Array.from(selectedProductos.values()) as { producto: Producto; cantidad: number }[]).map(({ producto, cantidad }) => (
                            <div key={producto.id} className="flex items-center gap-3 bg-white dark:bg-gray-700/30 p-3 rounded-xl border border-gray-100 dark:border-gray-600 shadow-sm">
                                <div className="flex flex-col items-center gap-1">
                                    <input type="number" value={cantidad} onChange={(e) => handleProductAction('update', producto, parseInt(e.target.value) || 1)} className="w-12 h-8 text-center font-bold border rounded-md bg-gray-50 dark:bg-gray-600 border-gray-200 dark:border-gray-500 focus:ring-brand-blue focus:border-brand-blue text-sm"/>
                                </div>
                                <div className="flex-grow min-w-0">
                                    <p className="font-bold text-sm truncate text-gray-800 dark:text-gray-200">{producto.nombre}</p>
                                    <p className="text-xs text-brand-blue font-semibold">{formatCurrency(producto.precio * cantidad)}</p>
                                </div>
                                <button onClick={() => handleProductAction('remove', producto)} className="text-red-400 hover:text-red-600 p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full transition-colors"><TrashIcon className="w-4 h-4"/></button>
                            </div>
                        ))}
                    </div>
                    <div className="p-5 border-t dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
                        <div className="flex justify-between items-end mb-4">
                            <span className="text-gray-500 dark:text-gray-400 font-medium">Total Estimado</span>
                            <span className="text-3xl font-bold text-brand-blue">{formatCurrency(orderTotal)}</span>
                        </div>
                        <button onClick={() => { setStep('resumen'); setIsSummaryOpen(false); }} className="w-full py-3.5 bg-brand-blue text-white font-bold rounded-xl shadow-md hover:bg-blue-700 transition-all active:scale-95">
                            Finalizar Compra
                        </button>
                    </div>
                </div>
            </div>
            
            <CreateClientModal isOpen={isClientModalOpen} onClose={() => setIsClientModalOpen(false)} onClientCreated={handleClientCreated} initialName={newClientInitialData.name} initialCedulaRuc={newClientInitialData.cedulaRuc} />
            <ProductGroupModal group={viewingGroup} onClose={() => setViewingGroup(null)} onAddProduct={(p) => handleProductAction('add', p)} />
        </div>
    );
};

export default NuevoPedidoPage;
