import React, { useState, useEffect, useMemo } from 'react';
import { Link, useLocation, useOutletContext, useNavigate } from 'react-router-dom';
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
    MonitorIcon, HomeIcon, ArrowRightIcon, TrophyIcon, UserIcon,
    FingerPrintIcon
} from '../components/Icons';
import { generateMarketingPromotion } from '../services/geminiService';
import { sriLookupService } from '../services/sriLookupService';
import { validarIdentificacionEC } from '../utils';
import { motion, AnimatePresence } from 'framer-motion';
import { SEO } from '../components/SEO';

// --- MODAL DE MARKETING IA ELITE ---
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
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[200] flex justify-center items-center p-6 animate-fade-in" onClick={onClose}>
            <motion.div 
                initial={{ scale: 0.9, opacity: 0, y: 30 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                className="bg-obsidian-card border border-white/[0.06] rounded-[3rem] shadow-2xl w-full max-w-2xl overflow-hidden relative group" 
                onClick={e => e.stopPropagation()}
            >
                <div className="absolute inset-0 bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] [background-size:20px_20px] opacity-[0.3] pointer-events-none" />
                <div className="absolute top-0 right-0 w-96 h-96 bg-brand-blue/5 rounded-full blur-[100px] -mr-48 -mt-48 pointer-events-none" />
                
                <div className="p-10 border-b border-white/[0.06] relative z-10 flex justify-between items-center bg-white/[0.04]">
                    <div className="space-y-2">
                        <div className="flex items-center gap-3">
                            <div className="w-2 h-2 rounded-full bg-brand-blue animate-pulse shadow-[0_0_10px_rgba(14,165,233,0.5)]" />
                            <span className="text-[10px] font-bold uppercase tracking-[0.4em] text-brand-blue">GÉMINIS_AI_PROTOCOL</span>
                        </div>
                        <h2 className="text-3xl font-black tracking-tight uppercase leading-none text-white">RE-ENGAGE_<span className="text-brand-blue">STRATEGY</span></h2>
                    </div>
                    <button onClick={onClose} className="p-4 bg-obsidian-card hover:bg-rose-50 text-slate-400 hover:text-rose-500 rounded-2xl transition-all border border-white/[0.06] group/close">
                        <CloseIcon className="w-6 h-6 group-hover/close:rotate-90 transition-transform duration-500" />
                    </button>
                </div>
                
                <div className="p-10 space-y-8 relative z-10">
                    {loading ? (
                        <div className="py-20 text-center space-y-8">
                            <div className="relative inline-block">
                                <div className="absolute inset-0 bg-brand-blue/20 blur-3xl animate-pulse rounded-full" />
                                <Loader2Icon className="animate-spin h-16 w-16 text-brand-blue mx-auto relative z-10" />
                            </div>
                            <div className="space-y-2">
                                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.6em] animate-pulse">SYNTHESIZING_STRATEGIC_PROMOTION...</p>
                            </div>
                        </div>
                    ) : (
                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
                            <div className="bg-white/[0.04] p-10 rounded-[2.5rem] border border-white/[0.06] relative group/msg shadow-inner overflow-hidden">
                                <div className="absolute top-0 left-0 w-full h-[1px] bg-brand-blue/20 animate-scan-y" />
                                <SparklesIcon className="absolute top-8 right-8 w-6 h-6 text-brand-blue/20 group-hover:text-brand-blue transition-colors" />
                                <p className="text-xl text-slate-200 leading-relaxed font-medium pr-10">
                                    "{message}"
                                </p>
                            </div>
                            
                            <div className="flex flex-col sm:flex-row gap-4">
                                <button 
                                    onClick={handleWhatsApp} 
                                    className="flex-1 flex items-center justify-center gap-4 bg-emerald-500 text-white px-8 py-5 rounded-2xl text-[12px] font-black uppercase tracking-[0.2em] shadow-lg shadow-emerald-500/20 hover:scale-[1.02] active:scale-95 transition-all"
                                >
                                    <WhatsAppIcon className="w-5 h-5" /> UPLINK_WHATSAPP
                                </button>
                                <button 
                                    onClick={() => { navigator.clipboard.writeText(message); setCopied(true); setTimeout(()=>setCopied(false), 2000); }} 
                                    className={`flex-1 px-8 py-5 rounded-2xl text-[12px] font-black uppercase tracking-[0.2em] border-2 transition-all duration-300 ${copied ? 'bg-brand-blue border-brand-blue text-white' : 'bg-obsidian-card border-white/[0.06] text-slate-300 hover:border-brand-blue hover:text-brand-blue'}`}
                                >
                                    {copied ? "COPIED_TO_CLIPBOARD" : "COPY_CONTENT"}
                                </button>
                            </div>
                            
                            <div className="text-center pt-2">
                                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.5em]">Powered by Google Gemini Enterprise AI</p>
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
    const [formData, setFormData] = useState<Partial<Cliente>>({});
    const [isLookingUp, setIsLookingUp] = useState(false);
    const [idError, setIdError] = useState('');

    useEffect(() => {
        if (clientToEdit) {
            setFormData(clientToEdit);
            setIdError('');
        }
    }, [clientToEdit]);

    const handleIdLookup = async (id: string) => {
        if (id.length < 10) return;
        
        if (!validarIdentificacionEC(id)) {
            setIdError('IDENTIFICACIÓN INVÁLIDA');
            return;
        }
        
        setIdError('');
        setIsLookingUp(true);
        try {
            const data = await sriLookupService.lookupByRuc(id);
            if (data) {
                setFormData(prev => ({
                    ...prev,
                    nombre: data.razon_social,
                    email: prev.email,
                    direccion: data.direccion || prev.direccion,
                    regimen: (data.regimen as Regimen) || prev.regimen
                }));
            }
        } catch (e) {
            console.error("Lookup error", e);
        } finally {
            setIsLookingUp(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[200] flex justify-center items-center p-6" onClick={onClose}>
            <motion.div 
                initial={{ scale: 0.9, opacity: 0, y: 50 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                className="bg-obsidian-card border border-white/[0.06] w-full max-w-2xl overflow-hidden relative z-10 shadow-2xl rounded-[3rem]" 
                onClick={e => e.stopPropagation()}
            >
                <div className="absolute inset-0 bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] [background-size:24px_24px] opacity-[0.2] pointer-events-none" />
                
                <div className="p-10 border-b border-white/[0.06] bg-white/[0.04] flex justify-between items-center relative">
                    <div className="space-y-1">
                        <h2 className="text-3xl font-black text-white uppercase tracking-tight leading-none">Identity <span className="text-brand-blue">Protocol</span></h2>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.4em]">REGISTRO CENTRALIZADO DE ENTIDADES</p>
                    </div>
                    <button onClick={onClose} className="p-4 bg-obsidian-card hover:bg-rose-50 text-slate-400 hover:text-rose-500 rounded-2xl transition-all border border-white/[0.06] group">
                        <CloseIcon className="w-6 h-6 group-hover:rotate-90 transition-transform duration-500"/>
                    </button>
                </div>

                <form onSubmit={e => { e.preventDefault(); onSave(formData); }} className="p-10 space-y-8 max-h-[75vh] overflow-y-auto custom-scrollbar relative">
                    <div className="space-y-6">
                        <div className="relative group">
                            <input 
                                type="text"
                                value={formData.id || ''}
                                onChange={e => {
                                    const val = e.target.value;
                                    setFormData({...formData, id: val});
                                    if (val.length >= 10) handleIdLookup(val);
                                }}
                                placeholder="IDENTIFICACIÓN (RUC/CÉDULA)"
                                className={`w-full bg-white/[0.04] border p-6 pt-10 pb-4 rounded-2xl text-white font-bold text-lg focus:ring-4 transition-all uppercase outline-none ${idError ? 'border-rose-300 focus:ring-rose-100' : 'border-white/[0.06] focus:ring-brand-blue/5 focus:border-brand-blue/30'}`}
                            />
                            <label className={`absolute left-6 top-4 text-[9px] font-black uppercase tracking-[0.4em] transition-all ${idError ? 'text-rose-500' : 'text-slate-400'}`}>IDENTIFICACIÓN_ID</label>
                            {isLookingUp && <div className="absolute right-6 top-1/2 -translate-y-1/2"><Loader2Icon className="animate-spin w-5 h-5 text-brand-blue" /></div>}
                            {idError && <p className="text-[9px] font-bold text-rose-500 mt-2 ml-2 uppercase tracking-widest">{idError}</p>}
                        </div>

                        <div className="relative group">
                            <input 
                                type="text"
                                value={formData.nombre || ''}
                                onChange={e => setFormData({...formData, nombre: e.target.value})}
                                placeholder="RAZÓN SOCIAL / NOMBRE"
                                className="w-full bg-white/[0.04] border border-white/[0.06] p-6 pt-10 pb-4 rounded-2xl text-white font-bold text-lg focus:ring-4 focus:ring-brand-blue/5 focus:border-brand-blue/30 transition-all uppercase outline-none"
                            />
                            <label className="absolute left-6 top-4 text-[9px] font-black text-slate-400 uppercase tracking-[0.4em]">ASSET_IDENTITY</label>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="relative group">
                                <input 
                                    type="text"
                                    value={formData.telefono?.[0] || ''}
                                    onChange={e => setFormData({...formData, telefono: [e.target.value]})}
                                    placeholder="TELÉFONO"
                                    className="w-full bg-white/[0.04] border border-white/[0.06] p-6 pt-10 pb-4 rounded-2xl text-white font-bold text-lg focus:ring-4 focus:ring-brand-blue/5 focus:border-brand-blue/30 transition-all uppercase outline-none"
                                />
                                <label className="absolute left-6 top-4 text-[9px] font-black text-slate-400 uppercase tracking-[0.4em]">COMM_UPLINK</label>
                            </div>
                            <div className="relative group">
                                <input 
                                    type="email"
                                    value={formData.email || ''}
                                    onChange={e => setFormData({...formData, email: e.target.value})}
                                    placeholder="EMAIL"
                                    className="w-full bg-white/[0.04] border border-white/[0.06] p-6 pt-10 pb-4 rounded-2xl text-white font-bold text-lg focus:ring-4 focus:ring-brand-blue/5 focus:border-brand-blue/30 transition-all uppercase outline-none"
                                />
                                <label className="absolute left-6 top-4 text-[9px] font-black text-slate-400 uppercase tracking-[0.4em]">VIRTUAL_ADDRESS</label>
                            </div>
                        </div>

                        <div className="relative group">
                            <select 
                                value={formData.regimen || Regimen.NEGOCIO_POPULAR}
                                onChange={e => setFormData({...formData, regimen: e.target.value as Regimen})}
                                className="w-full bg-white/[0.04] border border-white/[0.06] p-6 pt-10 pb-4 rounded-2xl text-white font-bold text-lg focus:ring-4 focus:ring-brand-blue/5 focus:border-brand-blue/30 transition-all uppercase outline-none appearance-none"
                            >
                                {Object.values(Regimen).map(r => <option key={r} value={r}>{r.replace(/_/g, ' ')}</option>)}
                            </select>
                            <label className="absolute left-6 top-4 text-[9px] font-black text-slate-400 uppercase tracking-[0.4em]">FISCAL_REGIME</label>
                            <ArrowRightIcon className="absolute right-6 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 rotate-90 pointer-events-none" />
                        </div>
                    </div>

                    <div className="flex gap-4 pt-6">
                        <button type="button" onClick={onClose} className="flex-1 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] hover:text-white transition-all">ABORT_MISSION</button>
                        <button type="submit" className="flex-[2] bg-brand-blue text-white py-5 rounded-2xl font-black uppercase text-[11px] tracking-[0.3em] hover:scale-[1.02] active:scale-95 transition-all shadow-lg shadow-brand-blue/20">
                            {formData.id ? 'UPDATE_IDENTITY' : 'REGISTER_ENTIDAD'}
                        </button>
                    </div>
                </form>
            </motion.div>
        </div>
    );
};

const ClientesPage: React.FC = () => {
    const navigate = useNavigate();
    const { currentUser } = useOutletContext<{ currentUser: any }>();
    const { clientes, trabajos, loading, addCliente, updateCliente } = useData();
    const [searchTerm, setSearchTerm] = useState('');
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [clientToEdit, setClientToEdit] = useState<Partial<Cliente>>({});
    const [marketingClient, setMarketingClient] = useState<Cliente | null>(null);

    const filtered = useMemo(() => {
        const lower = searchTerm.toLowerCase();
        return clientes.filter(c => 
            c.nombre.toLowerCase().includes(lower) || 
            c.id.includes(lower)
        ).sort((a, b) => b.id.localeCompare(a.id));
    }, [clientes, searchTerm]);

    const handleSaveClient = async (c: Partial<Cliente>) => {
        const existing = clientes.find(client => client.id === c.id);
        if (existing) {
            await updateCliente(c.id!, c);
            logActivity(currentUser.nombre, currentUser.rol, 'EDITAR_CLIENTE', `Identidad actualizada: ${c.nombre}`, 'Entidades');
        } else {
            await addCliente(c as Cliente);
            logActivity(currentUser.nombre, currentUser.rol, 'CREAR_CLIENTE', `Nueva entidad registrada: ${c.nombre}`, 'Entidades');
        }
        setIsFormOpen(false);
    };

    return (
        <div className="max-w-[1600px] mx-auto space-y-12 pb-32 pt-8 px-4 sm:px-10 animate-fade-in min-h-screen">
            <SEO title="Bóveda de Identidades - Imprenta Córdova" description="Gestión centralizada de clientes y aliados estratégicos." />
            
            {/* --- CABECERA ELITE --- */}
            <div className="flex flex-col gap-10">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
                    <div className="flex items-center gap-8">
                        <button 
                            onClick={() => navigate('/dashboard')}
                            className="p-5 bg-obsidian-card hover:bg-white/[0.04] border border-white/[0.06] rounded-2xl transition-all group shadow-sm"
                        >
                            <HomeIcon className="w-5 h-5 text-slate-400 group-hover:text-brand-blue transition-colors" />
                        </button>
                        <div className="w-[1px] h-16 bg-white/[0.06] hidden md:block"></div>
                        <div className="space-y-1">
                            <div className="flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-brand-blue" />
                                <p className="text-[10px] font-black text-brand-blue uppercase tracking-widest">Base de Datos de Clientes</p>
                            </div>
                            <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight uppercase">
                                Directorio de Clientes <span className="text-brand-blue font-bold">• SRI</span>
                            </h1>
                        </div>
                    </div>

                    <button 
                        onClick={() => { setClientToEdit({}); setIsFormOpen(true); }} 
                        className="flex items-center justify-center gap-4 px-10 py-5 bg-brand-blue text-white font-black rounded-2xl shadow-lg shadow-brand-blue/20 uppercase text-[11px] tracking-[0.3em] group hover:scale-[1.05] transition-all duration-300"
                    >
                        <UserPlusIcon className="w-6 h-6 group-hover:rotate-12 transition-transform duration-300" />
                        <span>REGISTRAR_CLIENTE</span>
                    </button>
                </div>

                <div className="relative group max-w-3xl">
                    <div className="absolute inset-0 bg-brand-blue/5 blur-2xl opacity-0 group-focus-within:opacity-100 transition-opacity"></div>
                    <SearchIcon className="absolute left-6 top-1/2 -translate-y-1/2 w-6 h-6 text-slate-300 group-focus-within:text-brand-blue transition-colors" />
                    <input 
                        type="text" 
                        placeholder="BUSCAR ENTIDAD: NOMBRE // RUC // CÉDULA..." 
                        value={searchTerm} 
                        onChange={e => setSearchTerm(e.target.value)} 
                        className="w-full pl-16 pr-8 py-6 bg-obsidian-card border border-white/[0.06] focus:border-brand-blue/40 rounded-2xl text-[14px] font-bold text-white uppercase tracking-widest placeholder:text-slate-300 outline-none focus:ring-4 focus:ring-brand-blue/5 transition-all duration-300 shadow-sm"
                    />
                </div>
            </div>

            {/* --- LISTADO DE ENTIDADES --- */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                <AnimatePresence mode="popLayout">
                    {loading ? (
                        <div className="col-span-full py-40 bg-obsidian-card/50 rounded-[3rem] border-2 border-dashed border-white/[0.06]">
                            <Loader2Icon className="w-16 h-16 text-brand-blue animate-spin" />
                            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.8em] animate-pulse">DECRYPTING_IDENTITY_RECORDS...</p>
                        </div>
                    ) : filtered.length > 0 ? filtered.map((c, idx) => {
                        const clientJobs = trabajos.filter(t => t.clienteId === c.id);
                        const lastJob = clientJobs.sort((a, b) => new Date(b.fechaEntrada).getTime() - new Date(a.fechaEntrada).getTime())[0];
                        
                        return (
                            <motion.div 
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: idx * 0.02 }}
                                key={c.id}
                                className="group relative bg-obsidian-card p-10 border border-white/[0.06] hover:border-brand-blue/30 transition-all duration-300 rounded-[2.5rem] shadow-sm hover:shadow-xl overflow-hidden"
                            >
                                <div className="absolute inset-0 bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] [background-size:20px_20px] opacity-[0.1] pointer-events-none" />
                                
                                <div className="flex justify-between items-start relative z-10">
                                    <div className="space-y-5">
                                        <div className="flex items-center gap-3">
                                            <div className="px-4 py-1.5 rounded-full border border-brand-blue/20 bg-brand-blue/5 text-brand-blue text-[9px] font-black uppercase tracking-[0.3em]">IDENTITY_VERIFIED</div>
                                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest bg-white/[0.04] px-3 py-1.5 rounded-xl">#{c.id}</span>
                                        </div>
                                        <div className="space-y-1">
                                            <h3 className="text-3xl font-black text-white uppercase tracking-tight group-hover:text-brand-blue transition-colors duration-300 leading-none">{c.nombre}</h3>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.3em] mt-3">{c.direccion || 'UBICACIÓN NO REGISTRADA'}</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-3">
                                        <button 
                                            onClick={() => setMarketingClient(c)}
                                            className="p-4 bg-white/[0.04] hover:bg-brand-blue text-slate-400 hover:text-white rounded-xl transition-all border border-white/[0.06] shadow-sm"
                                            title="Géminis AI Strategy"
                                        >
                                            <SparklesIcon className="w-5 h-5" />
                                        </button>
                                        <button 
                                            onClick={() => { setClientToEdit(c); setIsFormOpen(true); }}
                                            className="p-4 bg-white/[0.04] hover:bg-slate-900 text-slate-400 hover:text-white rounded-xl transition-all border border-white/[0.06] shadow-sm"
                                        >
                                            <PencilIcon className="w-5 h-5" />
                                        </button>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-10 relative z-10">
                                    <div className="space-y-5">
                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.4em]">CONTACT_CHANNELS</p>
                                        <div className="flex flex-col gap-3">
                                            {c.telefono.map((tel, i) => (
                                                <div key={i} className="flex items-center gap-4 text-slate-300 group/tel">
                                                    <div className="w-9 h-9 rounded-xl bg-white/[0.04] flex items-center justify-center border border-white/[0.06] group-hover/tel:bg-brand-blue/10 group-hover/tel:text-brand-blue transition-all">
                                                        <PhoneIcon className="w-3.5 h-3.5" />
                                                    </div>
                                                    <span className="text-base font-bold tracking-tight text-slate-200">{tel}</span>
                                                </div>
                                            ))}
                                            {c.email && (
                                                <div className="flex items-center gap-4 text-slate-300 group/email">
                                                    <div className="w-9 h-9 rounded-xl bg-white/[0.04] flex items-center justify-center border border-white/[0.06] group-hover/email:bg-brand-blue/10 group-hover/email:text-brand-blue transition-all">
                                                        <EnvelopeIcon className="w-3.5 h-3.5" />
                                                    </div>
                                                    <span className="text-base font-bold tracking-tight text-slate-200 lowercase truncate">{c.email}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="bg-white/[0.04] p-6 rounded-3xl border border-white/[0.06] space-y-6 group-hover:border-brand-blue/10 transition-all shadow-inner">
                                        <div className="flex justify-between items-center">
                                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.4em]">MISSION_LOGS</p>
                                            <div className="px-3 py-1 rounded-full bg-obsidian-card text-[9px] font-black text-slate-400 shadow-sm border border-white/[0.06]">{clientJobs.length} ORDENES</div>
                                        </div>
                                        {lastJob ? (
                                            <div className="space-y-3">
                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">ÚLTIMA_ACTIVA: <span className="text-white">{lastJob.subtipo}</span></p>
                                                <div className="flex justify-between items-end">
                                                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{formatDate(lastJob.fechaEntrada)}</p>
                                                    <p className="text-2xl font-black text-brand-blue tracking-tighter">{formatCurrency(lastJob.total)}</p>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="h-full flex items-center justify-center py-2">
                                                <p className="text-[9px] font-black text-slate-300 uppercase tracking-[0.5em]">NO_RECORDS_DETECTED</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </motion.div>
                        );
                    }) : (
                        <div className="col-span-full py-40 bg-obsidian-card/50 border-2 border-dashed border-white/[0.06] rounded-[3rem] text-center flex flex-col items-center justify-center shadow-inner">
                            <FingerPrintIcon className="w-24 h-24 text-slate-100 mb-8" />
                            <h3 className="text-3xl font-black text-slate-200 uppercase tracking-[0.5em]">VAULT_VACANT</h3>
                            <p className="text-slate-300 text-[10px] font-black uppercase mt-4 tracking-[0.8em]">NO_IDENTITY_ENTITIES_DETECTED_IN_DATABASE</p>
                        </div>
                    )}
                </AnimatePresence>
            </div>

            <ClientFormModal 
                isOpen={isFormOpen} 
                onClose={() => setIsFormOpen(false)} 
                onSave={handleSaveClient} 
                clientToEdit={clientToEdit} 
            />

            <AnimatePresence>
                {marketingClient && (
                    <MarketingIAModal 
                        cliente={marketingClient} 
                        trabajos={trabajos} 
                        onClose={() => setMarketingClient(null)} 
                    />
                )}
            </AnimatePresence>
        </div>
    );
};

export default ClientesPage;