import React, { useState, useEffect, useMemo } from 'react';
import { Link, useLocation, useOutletContext } from 'react-router-dom';
import { logActivity } from '../services/activityLogService';
import { useData } from '../contexts/DataContext';
import { Cliente, Trabajo, TrabajoEstado, Regimen } from '../types';
import { UI_TEXT } from '../constants';
import { formatCurrency, formatDate } from '../utils';
import { 
    CloseIcon, PhoneIcon, EnvelopeIcon, DollarIcon, ClockIcon, PencilIcon, 
    TrashIcon, ExclamationTriangleIcon, Loader2Icon, CheckCircleIcon, 
    SparklesIcon, MessageCircleIcon, WhatsAppIcon, UserPlusIcon, 
    SearchIcon, ChevronRightIcon, ShieldCheckIcon, ActivityIcon,
    GlobeAltIcon, MapPinIcon, FilterIcon, InfoIcon, FileTextIcon,
    MonitorIcon
} from '../components/Icons';
import { generateMarketingPromotion } from '../services/geminiService';
import { sriLookupService } from '../services/sriLookupService';
import { validarIdentificacionEC } from '../utils';
import { motion, AnimatePresence } from 'framer-motion';
import { SEO } from '../components/SEO';

// --- MODAL DE MARKETING IA ---
const MarketingIAModal: React.FC<{ cliente: Cliente; trabajos: Trabajo[]; onClose: () => void }> = ({ cliente, trabajos, onClose }) => {
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState('');
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        const generate = async () => {
            const clientJobs = trabajos.filter(t => t.clienteId === cliente.id);
            const products = clientJobs.map(j => j.subtipo).slice(0, 3);
            const promo = await generateMarketingPromotion(cliente.nombre, products);
            setMessage(promo);
            setLoading(false);
        };
        generate();
    }, [cliente, trabajos]);

    const handleWhatsApp = () => {
        const tel = cliente.telefono[0].replace(/\D/g, '');
        const encoded = encodeURIComponent(message);
        window.open(`https://wa.me/593${tel.substring(tel.length - 9)}?text=${encoded}`, '_blank');
    };

    return (
        <div className="fixed inset-0 bg-brand-blue/90 backdrop-blur-2xl z-[150] flex justify-center items-center p-4 animate-fade-in" onClick={onClose}>
            <motion.div 
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="bg-brand-blue/60 border border-white/10 rounded-[3.5rem] shadow-3xl w-full max-w-xl overflow-hidden relative group" 
                onClick={e => e.stopPropagation()}
            >
                <div className="absolute top-0 right-0 w-80 h-80 bg-brand-red/5 rounded-full blur-[100px] -mr-40 -mt-40 pointer-events-none opacity-50" />
                
                <div className="p-10 border-b border-white/5 relative z-10 flex justify-between items-center bg-black/20 backdrop-blur-md">
                    <div className="space-y-2">
                        <span className="text-[10px] font-black uppercase tracking-[0.4em] text-brand-red italic">NÚCLEO_GÉMINIS_PROMO</span>
                        <h2 className="text-4xl font-black tracking-tighter uppercase italic leading-none text-white">RE-CAPTAR_CLIENTE</h2>
                    </div>
                    <button onClick={onClose} className="p-4 bg-white/5 hover:bg-brand-red/20 rounded-2xl transition-all group/close">
                        <CloseIcon className="w-6 h-6 text-slate-500 group-hover/close:text-white" />
                    </button>
                </div>
                
                <div className="p-10 space-y-8 relative z-10">
                    {loading ? (
                        <div className="py-20 text-center space-y-8">
                            <div className="relative inline-block">
                                <div className="absolute inset-0 bg-brand-red/20 blur-2xl animate-pulse rounded-full" />
                                <Loader2Icon className="animate-spin h-16 w-16 text-brand-red mx-auto relative z-10" />
                            </div>
                            <p className="text-[11px] font-black text-slate-500 uppercase tracking-[0.5em] animate-pulse italic">REDACTANDO_OFERTA_PERSONALIZADA...</p>
                        </div>
                    ) : (
                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
                            <div className="bg-black/40 p-10 rounded-[2.5rem] border border-white/10 relative group/msg shadow-inner overflow-hidden">
                                <div className="absolute top-0 left-0 w-full h-[1px] bg-brand-red/20 animate-scan-y" />
                                <SparklesIcon className="absolute top-8 right-8 w-6 h-6 text-brand-red animate-pulse" />
                                <p className="text-xl text-slate-300 leading-relaxed font-bold italic pr-12 font-serif">
                                    "{message}"
                                </p>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                <button onClick={handleWhatsApp} className="group flex items-center justify-center gap-4 bg-emerald-500 text-brand-blue px-8 py-5 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-emerald-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all italic">
                                    <WhatsAppIcon className="w-5 h-5 group-hover:rotate-12 transition-transform" /> ENVIAR_WHATSAPP
                                </button>
                                <button onClick={() => { navigator.clipboard.writeText(message); setCopied(true); setTimeout(()=>setCopied(false), 2000); }} className="bg-white text-brand-blue px-8 py-5 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-brand-red transition-all duration-500 italic">
                                    {copied ? "¡COPIADO!" : "COPIAR_TEXTO"}
                                </button>
                            </div>
                        </motion.div>
                    )}
                </div>
            </motion.div>
        </div>
    );
};

// --- FORMULARIO DE CLIENTE ELITE ---
const ClientFormModal: React.FC<{ isOpen: boolean; onClose: () => void; onSave: (c: Partial<Cliente>) => void; clientToEdit: Partial<Cliente> }> = ({ isOpen, onClose, onSave, clientToEdit }) => {
    const [formData, setFormData] = useState<Partial<Cliente>>(clientToEdit);
    const [rucCedula, setRucCedula] = useState(clientToEdit.ruc || clientToEdit.cedula || '');
    const [isScanning, setIsScanning] = useState(false);
    
    useEffect(() => {
        const performLookup = async () => {
            if (!clientToEdit.id && rucCedula.length === 13 && !formData.nombre) {
                const isValid = validarIdentificacionEC(rucCedula);
                if (isValid) {
                    setIsScanning(true);
                    try {
                        const result = await sriLookupService.lookupByRuc(rucCedula);
                        if (result) {
                            let regimenFinal = formData.regimen || Regimen.GENERAL;
                            if (typeof result.regimen === 'string') {
                                const raw = result.regimen.toUpperCase();
                                if (raw.includes('POPULAR')) regimenFinal = Regimen.NEGOCIO_POPULAR;
                                else if (raw.includes('EMPRENDEDOR')) regimenFinal = Regimen.EMPRENDEDOR;
                                else regimenFinal = Regimen.GENERAL;
                            }

                            setFormData(prev => ({
                                ...prev,
                                nombre: result.razon_social || prev.nombre,
                                direccion: result.direccion || `${result.parroquia}, ${result.canton}, ${result.provincia || 'EL ORO'}`,
                                regimen: regimenFinal,
                                actividades: result.actividad_economica || prev.actividades
                            }));
                        }
                    } catch (err) {
                        console.error("Error doing padron lookup:", err);
                    } finally {
                        setIsScanning(false);
                    }
                }
            }
        };
        performLookup();
    }, [rucCedula, clientToEdit.id, formData.nombre]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        if (name === 'telefono') setFormData({ ...formData, telefono: [value] });
        else setFormData({ ...formData, [name]: value });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const isRuc = rucCedula.length === 13;
        onSave({ 
            ...formData, 
            ruc: isRuc ? rucCedula : undefined,
            cedula: isRuc ? rucCedula.substring(0, 10) : rucCedula
        });
    };

    return (
        <div className="fixed inset-0 bg-brand-blue/95 backdrop-blur-3xl z-[200] flex justify-center items-center p-4 animate-fade-in" onClick={onClose}>
            <motion.div 
                initial={{ y: 50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="bg-brand-blue/50 border border-white/10 rounded-[4rem] shadow-4xl w-full max-w-4xl overflow-hidden relative max-h-[90vh] overflow-y-auto no-scrollbar" 
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="p-12 border-b border-white/5 flex justify-between items-center sticky top-0 bg-black/40 backdrop-blur-3xl z-30">
                    <div className="space-y-2">
                        <span className="text-[10px] font-black text-brand-red uppercase tracking-[0.5em] italic">PROTOCOLO_IDENTIDAD</span>
                        <h2 className="text-4xl font-black text-white uppercase italic tracking-tighter leading-none">{formData.id ? 'EDITAR' : 'NUEVO'} <span className="text-brand-red text-glow">CLIENTE</span></h2>
                    </div>
                    <button onClick={onClose} className="p-4 bg-white/5 hover:bg-brand-red/20 rounded-2xl transition-all group/close">
                        <CloseIcon className="w-6 h-6 text-slate-500 group-hover/close:text-white" />
                    </button>
                </div>

                {isScanning && (
                    <div className="absolute top-0 left-0 w-full h-[2px] bg-brand-red/50 animate-scan-y z-40 overflow-hidden">
                        <div className="w-1/3 h-full bg-brand-red shadow-[0_0_15px_#ff0033] animate-pulse" />
                    </div>
                )}

                <form onSubmit={handleSubmit} className="p-12 space-y-10 relative z-10">
                    
                    {/* Sección Principal: ID (Idea 1) */}
                    <div className="bg-black/20 p-8 rounded-[3rem] border border-white/5 space-y-6 relative overflow-hidden">
                        <div className="absolute -top-24 -right-24 w-48 h-48 bg-brand-red/10 rounded-full blur-3xl pointer-events-none" />
                        
                        <div className="relative group">
                            <ShieldCheckIcon className={`absolute left-8 top-1/2 -translate-y-1/2 w-6 h-6 transition-all duration-500 ${rucCedula.length >= 10 ? 'text-emerald-500 drop-shadow-[0_0_8px_rgba(16,185,129,0.8)] scale-110' : 'text-slate-600 group-focus-within:text-brand-red'}`} />
                            <input 
                                id="rucCedula"
                                value={rucCedula} 
                                onChange={e => setRucCedula(e.target.value.replace(/\D/g, '').slice(0, 13))} 
                                required 
                                className="peer w-full bg-white/[0.02] border border-white/10 p-8 pt-10 pb-4 pl-20 rounded-[2rem] text-white font-black text-2xl focus:ring-2 focus:ring-brand-red/30 focus:border-brand-red/50 transition-all tracking-[0.2em] italic placeholder-transparent" 
                                placeholder="ID Tributario" 
                            />
                            <label htmlFor="rucCedula" className="absolute left-20 top-4 text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] italic transition-all peer-placeholder-shown:top-8 peer-placeholder-shown:text-lg peer-placeholder-shown:text-slate-600 peer-focus:top-4 peer-focus:text-[10px] peer-focus:text-brand-red pointer-events-none">
                                ID_Tributario (RUC/Cédula)
                            </label>

                            <div className="absolute right-8 top-1/2 -translate-y-1/2 flex items-center gap-3">
                                {isScanning ? (
                                    <>
                                        <p className="text-[9px] text-brand-red font-black uppercase tracking-[0.3em] animate-pulse hidden sm:block">EXTRAYENDO_DATA...</p>
                                        <Loader2Icon className="w-5 h-5 text-brand-red animate-spin" />
                                    </>
                                ) : (
                                    <>
                                        <p className="text-[9px] text-emerald-500 font-black uppercase tracking-[0.3em] hidden sm:block">
                                            {rucCedula.length === 13 && validarIdentificacionEC(rucCedula) ? 'RUC_VÁLIDO' : rucCedula.length === 10 && validarIdentificacionEC(rucCedula) ? 'CÉDULA_VÁLIDA' : ''}
                                        </p>
                                        <div className={`w-2 h-2 rounded-full ${rucCedula.length >= 10 && validarIdentificacionEC(rucCedula) ? 'bg-emerald-500 shadow-[0_0_10px_#10b981]' : 'bg-slate-700'} transition-all duration-500`} />
                                    </>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Resto de campos con Idea 3 (Floating Labels & Glassmorphism) */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="relative group md:col-span-2">
                            <input name="nombre" id="nombre" value={formData.nombre || ''} onChange={handleChange} required className="peer w-full bg-white/[0.02] border border-white/5 p-6 pt-8 pb-4 rounded-[2rem] text-white font-black text-lg focus:ring-2 focus:ring-brand-red/30 focus:border-brand-red/50 transition-all uppercase italic placeholder-transparent" placeholder="NOMBRE COMPLETO" />
                            <label htmlFor="nombre" className="absolute left-6 top-3 text-[9px] font-black text-slate-500 uppercase tracking-[0.4em] italic transition-all peer-placeholder-shown:top-6 peer-placeholder-shown:text-sm peer-placeholder-shown:text-slate-600 peer-focus:top-3 peer-focus:text-[9px] peer-focus:text-brand-red pointer-events-none">Identificación_Maestra</label>
                        </div>

                        <div className="relative group">
                            <MonitorIcon className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-600 group-focus-within:text-brand-red transition-colors z-10" />
                            <input name="nombreComercial" id="nombreComercial" value={formData.nombreComercial || ''} onChange={handleChange} className="peer w-full bg-white/[0.02] border border-white/5 p-6 pt-8 pb-4 pl-16 rounded-[2rem] text-white font-black focus:ring-2 focus:ring-brand-red/30 focus:border-brand-red/50 transition-all uppercase italic placeholder-transparent" placeholder="Marca Comercial" />
                            <label htmlFor="nombreComercial" className="absolute left-16 top-3 text-[9px] font-black text-slate-500 uppercase tracking-[0.4em] italic transition-all peer-placeholder-shown:top-6 peer-placeholder-shown:text-sm peer-placeholder-shown:text-slate-600 peer-focus:top-3 peer-focus:text-[9px] peer-focus:text-brand-red pointer-events-none">Marca_Comercial (Opcional)</label>
                        </div>

                        <div className="relative group">
                            <FilterIcon className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-600 pointer-events-none z-10" />
                            <select name="regimen" id="regimen" value={formData.regimen} onChange={handleChange} className="peer w-full bg-white/[0.02] border border-white/5 p-6 pt-8 pb-4 pl-16 rounded-[2rem] text-white font-black focus:ring-2 focus:ring-brand-red/30 focus:border-brand-red/50 transition-all appearance-none uppercase italic cursor-pointer">
                                <option value={Regimen.GENERAL} className="bg-brand-blue">Régimen General</option>
                                <option value={Regimen.NEGOCIO_POPULAR} className="bg-brand-blue">Negocio Popular (RIMPE)</option>
                                <option value={Regimen.EMPRENDEDOR} className="bg-brand-blue">Emprendedor (RIMPE)</option>
                            </select>
                            <label htmlFor="regimen" className="absolute left-16 top-3 text-[9px] font-black text-slate-500 uppercase tracking-[0.4em] italic transition-all peer-focus:text-brand-red pointer-events-none">Régimen_Fiscal</label>
                        </div>

                        <div className="relative group">
                            <WhatsAppIcon className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-600 group-focus-within:text-emerald-500 transition-colors z-10" />
                            <input name="telefono" id="telefono" value={formData.telefono?.[0] || ''} onChange={handleChange} required className="peer w-full bg-white/[0.02] border border-white/5 p-6 pt-8 pb-4 pl-16 rounded-[2rem] text-white font-black focus:ring-2 focus:ring-brand-red/30 focus:border-brand-red/50 transition-all italic placeholder-transparent" placeholder="+593" />
                            <label htmlFor="telefono" className="absolute left-16 top-3 text-[9px] font-black text-slate-500 uppercase tracking-[0.4em] italic transition-all peer-placeholder-shown:top-6 peer-placeholder-shown:text-sm peer-placeholder-shown:text-slate-600 peer-focus:top-3 peer-focus:text-[9px] peer-focus:text-emerald-500 pointer-events-none">Enlace_Voz/Chat</label>
                        </div>

                        <div className="relative group">
                            <MapPinIcon className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-600 group-focus-within:text-brand-red transition-colors z-10" />
                            <input name="direccion" id="direccion" value={formData.direccion || ''} onChange={handleChange} className="peer w-full bg-white/[0.02] border border-white/5 p-6 pt-8 pb-4 pl-16 rounded-[2rem] text-white font-black focus:ring-2 focus:ring-brand-red/30 focus:border-brand-red/50 transition-all uppercase italic placeholder-transparent" placeholder="Dirección" />
                            <label htmlFor="direccion" className="absolute left-16 top-3 text-[9px] font-black text-slate-500 uppercase tracking-[0.4em] italic transition-all peer-placeholder-shown:top-6 peer-placeholder-shown:text-sm peer-placeholder-shown:text-slate-600 peer-focus:top-3 peer-focus:text-[9px] peer-focus:text-brand-red pointer-events-none">Geolocalización_Base</label>
                        </div>

                        <div className="relative group md:col-span-2">
                            <textarea name="actividades" id="actividades" value={formData.actividades || ''} onChange={handleChange} rows={3} className="peer w-full bg-white/[0.02] border border-white/5 p-6 pt-10 pb-4 rounded-[2rem] text-white font-bold focus:ring-2 focus:ring-brand-red/30 focus:border-brand-red/50 transition-all text-sm uppercase italic leading-relaxed placeholder-transparent" placeholder="Actividades" />
                            <label htmlFor="actividades" className="absolute left-6 top-4 text-[9px] font-black text-slate-500 uppercase tracking-[0.4em] italic transition-all peer-placeholder-shown:top-8 peer-placeholder-shown:text-sm peer-placeholder-shown:text-slate-600 peer-focus:top-4 peer-focus:text-[9px] peer-focus:text-brand-red pointer-events-none">Manifiesto_Económico (SRI)</label>
                        </div>
                    </div>

                    <div className="pt-10 flex flex-col sm:flex-row justify-end gap-6 border-t border-white/5">
                        <button type="button" onClick={onClose} className="px-10 py-5 text-slate-500 font-black text-[10px] uppercase tracking-widest hover:text-white transition-all italic">Descartar_Cambios</button>
                        <button type="submit" disabled={isScanning} className="px-12 py-5 bg-white text-brand-blue font-black text-[10px] uppercase tracking-[0.3em] rounded-2xl shadow-luxury hover:bg-brand-red hover:scale-105 disabled:opacity-50 disabled:pointer-events-none transition-all duration-700 italic">
                            {isScanning ? 'PROCESANDO...' : 'CONSOLIDAR_IDENTIDAD'}
                        </button>
                    </div>
                </form>
            </motion.div>
        </div>
    );
};

const ClientesPage: React.FC = () => {
    const { currentUser } = useOutletContext<{ currentUser: any }>();
    const { clientes, trabajos, loading, addCliente, updateCliente, deleteCliente } = useData();
    const [selectedClient, setSelectedClient] = useState<Cliente | null>(null);
    const [marketingClient, setMarketingClient] = useState<Cliente | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const location = useLocation();

    const filteredClientes = useMemo(() => {
        const lower = searchTerm.toLowerCase();
        return clientes.filter(c => 
            (c.nombre && c.nombre.toLowerCase().includes(lower)) ||
            (c.ruc && c.ruc.toLowerCase().includes(lower)) ||
            (c.cedula && c.cedula.toLowerCase().includes(lower))
        );
    }, [clientes, searchTerm]);

    useEffect(() => {
        const params = new URLSearchParams(location.search);
        if (params.get('action') === 'new' || params.get('reengage')) {
            const reengageId = params.get('reengage');
            if (reengageId) {
                const client = clientes.find(cl => cl.id === reengageId);
                if (client) setMarketingClient(client);
            } else {
                setSelectedClient({ id: '', nombre: '', email: '', telefono: [''], ruc: '', cedula: '', regimen: Regimen.GENERAL, creadoEn: new Date().toISOString() });
            }
        }
    }, [location.search, clientes]);

    const handleSaveClient = async (client: Partial<Cliente>) => {
        if (client.id) {
            await updateCliente(client.id, client);
            logActivity(currentUser.nombre, currentUser.rol || 'Operador', 'EDITAR_CLIENTE', `Cliente editado: ${client.nombre}`, 'Clientes');
        } else {
            await addCliente(client as any);
            logActivity(currentUser.nombre, currentUser.rol || 'Operador', 'CREAR_CLIENTE', `Nuevo cliente creado: ${client.nombre}`, 'Clientes');
        }
        setSelectedClient(null);
    };

    const handleDeleteClient = async (id: string, nombre: string) => {
        if (window.confirm(`¿ESTÁ SEGURO DE ELIMINAR AL CLIENTE ${nombre.toUpperCase()}?`)) {
            await deleteCliente(id);
            logActivity(currentUser.nombre, currentUser.rol || 'Operador', 'ELIMINAR_CLIENTE', `Cliente eliminado: ${nombre}`, 'Clientes');
        }
    };

    return (
        <div className="relative min-h-screen font-sans selection:bg-brand-red selection:text-white space-y-12 pb-20 animate-fade-in">
            <SEO title="Elite Directory | Imprenta Córdova" description="Gestión industrial avanzada de activos humanos y corporativos." />

            {/* --- ELITE HEADER HUD --- */}
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-10 p-10 lg:p-14 bg-white/[0.02] backdrop-blur-3xl border border-white/10 rounded-[4rem] shadow-2xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-96 h-96 bg-brand-red/5 rounded-full blur-[120px] -mr-48 -mt-48 pointer-events-none opacity-50 group-hover:opacity-100 transition-opacity duration-1000" />
                
                <div className="flex gap-10 relative z-10">
                    <div className="w-[1px] h-32 bg-gradient-to-b from-transparent via-brand-red/40 to-transparent hidden lg:block" />
                    <div className="space-y-4">
                        <div className="flex items-center gap-4 mb-2">
                            <div className="flex gap-1.5">
                                <div className="w-1.5 h-1.5 rounded-full bg-brand-red shadow-red-glow animate-pulse" />
                                <div className="w-1.5 h-1.5 rounded-full bg-brand-red/40 animate-pulse delay-75" />
                                <div className="w-1.5 h-1.5 rounded-full bg-brand-red/20 animate-pulse delay-150" />
                            </div>
                            <span className="text-[10px] font-black uppercase tracking-[0.5em] text-slate-500 italic">VÍNCULO_CORPORATIVO_ACTIVO</span>
                        </div>
                        <h1 className="text-5xl lg:text-7xl font-black text-white uppercase italic tracking-tighter leading-none">
                            GARANTÍA DE <span className="text-brand-red text-glow not-italic">CLIENTES</span>
                        </h1>
                        <p className="text-slate-500 text-xl font-medium tracking-tight italic opacity-60">Soberanía de datos para la elite comercial.</p>
                    </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-5 w-full lg:w-auto relative z-10">
                    <motion.button 
                        whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                        onClick={() => setSelectedClient({ id: '', nombre: '', email: '', telefono: [''], ruc: '', cedula: '', regimen: Regimen.GENERAL, creadoEn: new Date().toISOString() })} 
                        className="flex-1 lg:flex-none flex items-center justify-center gap-4 bg-brand-red text-brand-blue font-black py-5 px-10 rounded-2xl shadow-red-glow-soft hover:bg-white hover:text-brand-blue transition-all duration-700 text-[11px] uppercase tracking-widest italic"
                    >
                        <UserPlusIcon className="w-5 h-5" /> VINCULAR_NUEVO_ACTIVO
                    </motion.button>
                </div>
            </div>

            {/* --- INDUSTRIAL SEARCH CONSOLE --- */}
            <div className="flex flex-col md:flex-row gap-8 relative z-10 px-4 lg:px-0">
                <div className="relative group flex-grow">
                    <div className="absolute inset-0 bg-brand-red/5 blur-3xl opacity-0 group-focus-within:opacity-100 transition-opacity duration-700" />
                    <SearchIcon className="absolute left-8 top-1/2 -translate-y-1/2 w-6 h-6 text-slate-600 group-focus-within:text-brand-red transition-all duration-500" />
                    <input 
                        type="text" placeholder="BUSCAR POR NOMBRE, RUC O CÉDULA..." 
                        value={searchTerm} 
                        onChange={e => setSearchTerm(e.target.value)} 
                        className="w-full bg-white/[0.02] border border-white/10 p-7 pl-20 rounded-[2.5rem] text-white font-black focus:ring-4 focus:ring-brand-red/5 focus:border-brand-red/20 transition-all shadow-2xl text-base uppercase tracking-[0.2em] placeholder:text-slate-700 italic backdrop-blur-xl"
                    />
                </div>
            </div>

            {/* --- ELITE DIRECTORY HUD --- */}
            <div className="flex-grow bg-white/[0.01] backdrop-blur-3xl rounded-[4rem] shadow-4xl border border-white/10 overflow-hidden relative group/table">
                <div className="absolute inset-0 bg-gradient-to-b from-brand-red/[0.01] to-transparent pointer-events-none" />
                <div className="overflow-x-auto h-full no-scrollbar">
                    <table className="min-w-full divide-y divide-white/5">
                        <thead className="bg-black/40 sticky top-0 backdrop-blur-2xl z-20 border-b border-white/10">
                            <tr>
                                <th className="px-10 py-8 text-left text-[10px] font-black text-slate-500 uppercase tracking-[0.5em] italic">ACTIVO_CORPORATIVO</th>
                                <th className="px-10 py-8 text-left text-[10px] font-black text-slate-500 uppercase tracking-[0.5em] italic">ID_TRIBUTARIO</th>
                                <th className="px-10 py-8 text-left text-[10px] font-black text-slate-500 uppercase tracking-[0.5em] italic">RÉGIMEN_FISCAL</th>
                                <th className="px-10 py-8 text-right text-[10px] font-black text-slate-500 uppercase tracking-[0.5em] italic">OPERACIONES</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5 bg-transparent relative z-10">
                            {loading ? (
                                <tr><td colSpan={4} className="text-center py-40 text-xs font-black text-slate-500 uppercase tracking-[1em] animate-pulse italic">SINCRONIZANDO_NÚCLEO...</td></tr>
                            ) : filteredClientes.length === 0 ? (
                                <tr><td colSpan={4} className="text-center py-40 text-xs font-black text-slate-600 uppercase tracking-[1em] italic">SIN_REGISTROS_DETECTADOS</td></tr>
                            ) : filteredClientes.map((c, idx) => (
                                <motion.tr 
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: idx * 0.05 }}
                                    key={c.id} 
                                    className="hover:bg-white/[0.03] transition-all duration-700 group/row relative"
                                >
                                    <td className="px-10 py-8">
                                        <div className="flex items-center gap-6">
                                            <div className="w-14 h-14 rounded-2xl bg-brand-red/10 border border-brand-red/20 flex items-center justify-center font-black text-brand-red shadow-red-glow-soft transition-all group-hover/row:scale-110 group-hover/row:bg-brand-red group-hover/row:text-brand-blue group-hover/row:shadow-red-glow flex-shrink-0 italic">
                                                {(c.nombre || '?').charAt(0)}
                                            </div>
                                            <div className="flex flex-col gap-1">
                                                <span className="font-black text-white uppercase tracking-tight text-base group-hover/row:text-brand-red transition-colors italic leading-none">{c.nombre || 'SIN IDENTIFICAR'}</span>
                                                <span className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">{c.nombreComercial || 'ACTIVO_NOMINAL'}</span>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-10 py-8">
                                        <div className="flex items-center gap-3">
                                            <FileTextIcon className="w-4 h-4 text-slate-600 group-hover/row:text-brand-red transition-colors" />
                                            <span className="font-mono text-sm font-black text-slate-400 group-hover/row:text-white transition-colors tracking-widest">{c.ruc || c.cedula}</span>
                                        </div>
                                    </td>
                                    <td className="px-10 py-8">
                                        <span className={`px-5 py-2 inline-flex text-[10px] font-black uppercase tracking-widest rounded-xl border transition-all duration-700 ${
                                            c.regimen === Regimen.NEGOCIO_POPULAR 
                                            ? 'bg-orange-500/10 text-orange-400 border-orange-500/30 shadow-orange-500/5 group-hover/row:bg-orange-500 group-hover/row:text-brand-blue' 
                                            : c.regimen === Regimen.EMPRENDEDOR
                                            ? 'bg-blue-500/10 text-blue-400 border-blue-500/30 shadow-blue-500/5 group-hover/row:bg-blue-500 group-hover/row:text-brand-blue'
                                            : 'bg-white/5 text-slate-400 border-white/10 group-hover/row:bg-white group-hover/row:text-brand-blue'
                                        } italic`}>
                                            {c.regimen.replace('_', ' ')}
                                        </span>
                                    </td>
                                    <td className="px-10 py-8 text-right">
                                        <div className="flex justify-end gap-3 opacity-40 group-hover/row:opacity-100 transition-opacity duration-700">
                                            <button onClick={() => setMarketingClient(c)} className="p-4 text-brand-red hover:bg-brand-red/10 rounded-2xl transition-all border border-transparent hover:border-brand-red/20 shadow-sm hover:shadow-red-glow" title="Sincronizar IA">
                                                <SparklesIcon className="w-5 h-5" />
                                            </button>
                                            <button onClick={() => setSelectedClient(c)} className="p-4 text-white hover:bg-white/10 rounded-2xl transition-all border border-transparent hover:border-white/10" title="Reprogramar">
                                                <PencilIcon className="w-5 h-5" />
                                            </button>
                                            <button onClick={() => handleDeleteClient(c.id, c.nombre)} className="p-4 text-red-600 hover:bg-red-500/10 rounded-2xl transition-all border border-transparent hover:border-red-500/10" title="Eliminar Activo">
                                                <TrashIcon className="w-5 h-5" />
                                            </button>
                                        </div>
                                    </td>
                                </motion.tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* --- MODALES --- */}
            <AnimatePresence>
                {marketingClient && (
                    <MarketingIAModal 
                        cliente={marketingClient} 
                        trabajos={trabajos} 
                        onClose={() => setMarketingClient(null)} 
                    />
                )}
                {selectedClient && (
                    <ClientFormModal 
                        isOpen={!!selectedClient} 
                        onClose={() => setSelectedClient(null)} 
                        onSave={handleSaveClient} 
                        clientToEdit={selectedClient} 
                    />
                )}
            </AnimatePresence>

            <style>{`
                .no-scrollbar::-webkit-scrollbar { display: none; }
                .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
                .text-glow { text-shadow: 0 0 30px rgba(225,29,72,0.4); }
                .shadow-red-glow { box-shadow: 0 0 40px rgba(225,29,72,0.5); }
                .shadow-red-glow-soft { box-shadow: 0 0 20px rgba(225,29,72,0.2); }
                .shadow-4xl { box-shadow: 0 60px 120px -30px rgba(0,0,0,0.6); }
                .shadow-3xl { box-shadow: 0 50px 100px -20px rgba(0,0,0,0.5); }
                @keyframes scan-y { 0% { transform: translateY(-100%); } 100% { transform: translateY(800%); } }
                .animate-scan-y { animation: scan-y 10s linear infinite; }
            `}</style>
        </div>
    );
};

export default ClientesPage;