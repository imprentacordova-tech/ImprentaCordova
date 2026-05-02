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
        <div className="fixed inset-0 bg-black/95 backdrop-blur-2xl z-[200] flex justify-center items-center p-6 animate-fade-in" onClick={onClose}>
            <motion.div 
                initial={{ scale: 0.9, opacity: 0, y: 30 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                className="bg-brand-dark border border-white/10 rounded-[3.5rem] shadow-luxury w-full max-w-2xl overflow-hidden relative group" 
                onClick={e => e.stopPropagation()}
            >
                <div className="absolute inset-0 bg-architect-grid opacity-[0.03] pointer-events-none" />
                <div className="absolute top-0 right-0 w-96 h-96 bg-liquid-gold/5 rounded-full blur-[120px] -mr-48 -mt-48 pointer-events-none group-hover:bg-liquid-gold/10 transition-all duration-1000" />
                
                <div className="p-12 border-b border-white/5 relative z-10 flex justify-between items-center bg-white/[0.01]">
                    <div className="space-y-4">
                        <div className="flex items-center gap-4">
                            <div className="w-2 h-2 rounded-full bg-liquid-gold animate-pulse shadow-gold-glow" />
                            <span className="text-[10px] font-black uppercase tracking-[0.6em] text-liquid-gold italic">GÉMINIS_INTELLIGENCE_PROTOCOL</span>
                        </div>
                        <h2 className="text-4xl md:text-5xl font-black tracking-tighter uppercase italic leading-none text-white">RE-ENGAGE_<span className="text-gold-gradient">ASSET</span></h2>
                    </div>
                    <button onClick={onClose} className="p-5 bg-white/5 hover:bg-rose-500/20 text-slate-500 hover:text-rose-500 rounded-2xl transition-all border border-white/5 group/close">
                        <CloseIcon className="w-6 h-6 group-hover/close:rotate-90 transition-transform duration-500" />
                    </button>
                </div>
                
                <div className="p-12 space-y-10 relative z-10">
                    {loading ? (
                        <div className="py-24 text-center space-y-10">
                            <div className="relative inline-block">
                                <div className="absolute inset-0 bg-liquid-gold/20 blur-3xl animate-pulse rounded-full" />
                                <Loader2Icon className="animate-spin h-20 w-20 text-liquid-gold mx-auto relative z-10" />
                            </div>
                            <div className="space-y-3">
                                <p className="text-[11px] font-black text-slate-500 uppercase tracking-[0.8em] animate-pulse italic">SYNTHESIZING_STRATEGIC_PROMOTION...</p>
                                <div className="h-[1px] w-48 bg-gradient-to-r from-transparent via-liquid-gold/30 to-transparent mx-auto" />
                            </div>
                        </div>
                    ) : (
                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-10">
                            <div className="bg-black/60 p-12 rounded-[3rem] border border-white/10 relative group/msg shadow-inner overflow-hidden">
                                <div className="absolute top-0 left-0 w-full h-[2px] bg-liquid-gold/20 animate-scan-y" />
                                <SparklesIcon className="absolute top-10 right-10 w-8 h-8 text-liquid-gold/20 group-hover:text-liquid-gold animate-pulse transition-colors" />
                                <p className="text-2xl text-slate-300 leading-relaxed font-black italic pr-14 font-serif group-hover:text-white transition-colors">
                                    "{message}"
                                </p>
                            </div>
                            
                            <div className="flex flex-col sm:flex-row gap-6">
                                <button 
                                    onClick={handleWhatsApp} 
                                    className="flex-1 flex items-center justify-center gap-5 bg-emerald-500 text-brand-dark px-10 py-7 rounded-[2rem] text-[12px] font-black uppercase tracking-[0.4em] shadow-emerald-500/20 hover:scale-[1.02] active:scale-95 transition-all italic"
                                >
                                    <WhatsAppIcon className="w-6 h-6" /> UPLINK_WHATSAPP
                                </button>
                                <button 
                                    onClick={() => { navigator.clipboard.writeText(message); setCopied(true); setTimeout(()=>setCopied(false), 2000); }} 
                                    className={`flex-1 px-10 py-7 rounded-[2rem] text-[12px] font-black uppercase tracking-[0.4em] border-2 transition-all duration-700 italic ${copied ? 'bg-liquid-gold border-liquid-gold text-brand-dark' : 'bg-white/5 border-white/10 text-white hover:border-liquid-gold hover:text-liquid-gold'}`}
                                >
                                    {copied ? "ENCRYPTED_TO_CLIPBOARD" : "COPY_ARTIFACT"}
                                </button>
                            </div>
                            
                            <div className="text-center">
                                <p className="text-[9px] font-black text-slate-700 uppercase tracking-[0.5em] italic">Propulsado por el Núcleo Géminis de Google DeepMind</p>
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
        <div className="fixed inset-0 bg-black/98 backdrop-blur-3xl z-[200] flex justify-center items-center p-6" onClick={onClose}>
            <motion.div 
                initial={{ scale: 0.9, opacity: 0, y: 50 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                className="bg-brand-dark border border-white/10 w-full max-w-2xl overflow-hidden relative z-10 shadow-luxury rounded-[4rem]" 
                onClick={e => e.stopPropagation()}
            >
                <div className="absolute inset-0 bg-architect-grid opacity-[0.03] pointer-events-none" />
                
                <div className="p-14 border-b border-white/5 bg-white/[0.01] flex justify-between items-center relative">
                    <div className="space-y-4">
                        <h2 className="text-4xl font-black text-white uppercase tracking-tighter italic leading-none">Identity <span className="text-gold-gradient">Protocol</span></h2>
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.5em] italic">Registro Centralizado de Entidades</p>
                    </div>
                    <button onClick={onClose} className="p-5 bg-white/5 hover:bg-rose-500/20 text-slate-500 hover:text-rose-500 rounded-2xl transition-all border border-white/5 group">
                        <CloseIcon className="w-6 h-6 group-hover:rotate-90 transition-transform duration-500"/>
                    </button>
                </div>

                <form onSubmit={e => { e.preventDefault(); onSave(formData); }} className="p-14 space-y-10 max-h-[75vh] overflow-y-auto custom-scrollbar relative">
                    <div className="space-y-10">
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
                                className={`w-full bg-white/[0.02] border p-8 pt-10 pb-5 rounded-[2.5rem] text-white font-black text-xl focus:ring-4 transition-all uppercase italic outline-none ${idError ? 'border-rose-500/40 focus:ring-rose-500/10' : 'border-white/5 focus:ring-liquid-gold/10 focus:border-liquid-gold/30'}`}
                            />
                            <label className={`absolute left-8 top-5 text-[10px] font-black uppercase tracking-[0.5em] italic transition-all ${idError ? 'text-rose-500' : 'text-slate-500'}`}>IDENTIFICACIÓN_ID</label>
                            {isLookingUp && <div className="absolute right-8 top-1/2 -translate-y-1/2"><Loader2Icon className="animate-spin w-6 h-6 text-liquid-gold" /></div>}
                            {idError && <p className="text-[9px] font-black text-rose-500 mt-3 ml-4 uppercase tracking-widest">{idError}</p>}
                        </div>

                        <div className="relative group">
                            <input 
                                type="text"
                                value={formData.nombre || ''}
                                onChange={e => setFormData({...formData, nombre: e.target.value})}
                                placeholder="RAZÓN SOCIAL / NOMBRE"
                                className="w-full bg-white/[0.02] border border-white/5 p-8 pt-10 pb-5 rounded-[2.5rem] text-white font-black text-xl focus:ring-4 focus:ring-liquid-gold/10 focus:border-liquid-gold/30 transition-all uppercase italic outline-none"
                            />
                            <label className="absolute left-8 top-5 text-[10px] font-black text-slate-500 uppercase tracking-[0.5em] italic transition-all">ASSET_IDENTITY</label>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="relative group">
                                <input 
                                    type="text"
                                    value={formData.telefono?.[0] || ''}
                                    onChange={e => setFormData({...formData, telefono: [e.target.value]})}
                                    placeholder="TELÉFONO"
                                    className="w-full bg-white/[0.02] border border-white/5 p-8 pt-10 pb-5 rounded-[2.5rem] text-white font-black text-lg focus:ring-4 focus:ring-liquid-gold/10 focus:border-liquid-gold/30 transition-all uppercase italic outline-none"
                                />
                                <label className="absolute left-8 top-5 text-[10px] font-black text-slate-500 uppercase tracking-[0.5em] italic transition-all">COMM_UPLINK</label>
                            </div>
                            <div className="relative group">
                                <input 
                                    type="email"
                                    value={formData.email || ''}
                                    onChange={e => setFormData({...formData, email: e.target.value})}
                                    placeholder="EMAIL"
                                    className="w-full bg-white/[0.02] border border-white/5 p-8 pt-10 pb-5 rounded-[2.5rem] text-white font-black text-lg focus:ring-4 focus:ring-liquid-gold/10 focus:border-liquid-gold/30 transition-all uppercase italic outline-none"
                                />
                                <label className="absolute left-8 top-5 text-[10px] font-black text-slate-500 uppercase tracking-[0.5em] italic transition-all">VIRTUAL_ADDRESS</label>
                            </div>
                        </div>

                        <div className="relative group">
                            <select 
                                value={formData.regimen || Regimen.NEGOCIO_POPULAR}
                                onChange={e => setFormData({...formData, regimen: e.target.value as Regimen})}
                                className="w-full bg-white/[0.02] border border-white/5 p-8 pt-10 pb-5 rounded-[2.5rem] text-white font-black text-lg focus:ring-4 focus:ring-liquid-gold/10 focus:border-liquid-gold/30 transition-all uppercase italic outline-none appearance-none"
                            >
                                {Object.values(Regimen).map(r => <option key={r} value={r} className="bg-slate-900">{r.replace(/_/g, ' ')}</option>)}
                            </select>
                            <label className="absolute left-8 top-5 text-[10px] font-black text-slate-500 uppercase tracking-[0.5em] italic transition-all">FISCAL_REGIME</label>
                            <ArrowRightIcon className="absolute right-8 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-700 rotate-90 pointer-events-none" />
                        </div>
                    </div>

                    <div className="flex gap-6 pt-12">
                        <button type="button" onClick={onClose} className="flex-1 py-7 text-[11px] font-black text-slate-600 uppercase tracking-[0.4em] hover:text-white transition-all italic">Abortar</button>
                        <button type="submit" className="flex-[2.5] bg-liquid-gold text-brand-dark py-7 rounded-[2rem] font-black uppercase text-[12px] tracking-[0.4em] hover:scale-[1.02] active:scale-95 transition-all shadow-gold-glow italic">
                            {formData.id ? 'ACTUALIZAR_IDENTIDAD' : 'REGISTRAR_NUEVA_ENTIDAD'}
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
        <div className="max-w-[1600px] mx-auto space-y-16 pb-40 pt-10 px-4 sm:px-14 animate-fade-in">
            <SEO title="Bóveda de Identidades - Imprenta Córdova" description="Gestión centralizada de clientes y aliados estratégicos." />
            
            {/* --- CABECERA ELITE --- */}
            <div className="flex flex-col gap-12">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-8">
                    <div className="flex items-center gap-10">
                        <button 
                            onClick={() => navigate('/dashboard')}
                            className="p-6 bg-white/5 hover:bg-white/10 border border-white/10 rounded-[2rem] transition-all group shadow-2xl backdrop-blur-xl"
                        >
                            <HomeIcon className="w-6 h-6 text-slate-500 group-hover:text-liquid-gold transition-colors" />
                        </button>
                        <div className="w-[1px] h-28 bg-gradient-to-b from-transparent via-liquid-gold/40 to-transparent hidden md:block"></div>
                        <div className="space-y-5">
                            <div className="flex items-center gap-6">
                                <div className="h-[2px] w-16 bg-liquid-gold rounded-full shadow-gold-glow"></div>
                                <p className="text-[11px] font-black text-liquid-gold uppercase tracking-[0.6em] italic">CONTROL CENTRALIZADO DE ENTIDADES</p>
                            </div>
                            <h1 className="text-6xl md:text-8xl font-black text-white tracking-tighter uppercase italic leading-none">
                                IDENTITY <span className="text-gold-gradient">VAULT</span>
                            </h1>
                        </div>
                    </div>

                    <button 
                        onClick={() => { setClientToEdit({}); setIsFormOpen(true); }} 
                        className="flex items-center justify-center gap-6 px-14 py-7 bg-liquid-gold text-brand-dark font-black rounded-[2rem] shadow-gold-glow uppercase text-[11px] tracking-[0.4em] group hover:scale-[1.05] transition-all duration-500 italic"
                    >
                        <UserPlusIcon className="w-7 h-7 group-hover:rotate-12 transition-transform duration-500" />
                        <span>REGISTRAR_CLIENTE</span>
                    </button>
                </div>

                <div className="relative group max-w-4xl">
                    <div className="absolute inset-0 bg-liquid-gold/5 blur-3xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    <SearchIcon className="absolute left-8 top-1/2 -translate-y-1/2 w-7 h-7 text-liquid-gold/40 group-focus-within:text-liquid-gold transition-colors" />
                    <input 
                        type="text" 
                        placeholder="IDENTIFICAR ENTIDAD: RAZÓN SOCIAL // CÉDULA // RUC..." 
                        value={searchTerm} 
                        onChange={e => setSearchTerm(e.target.value)} 
                        className="w-full pl-20 pr-10 py-8 bg-white/[0.02] border border-white/10 focus:border-liquid-gold/40 rounded-[2.5rem] text-[14px] font-black text-white uppercase tracking-[0.3em] placeholder:text-slate-800 outline-none focus:bg-white/[0.05] transition-all duration-700 backdrop-blur-md shadow-inner italic"
                    />
                </div>
            </div>

            {/* --- LISTADO DE ENTIDADES --- */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-10">
                <AnimatePresence mode="popLayout">
                    {loading ? (
                        <div className="col-span-full py-60 flex flex-col items-center justify-center gap-10 bg-white/[0.01] rounded-[5rem] border-4 border-dashed border-white/5">
                            <Loader2Icon className="w-20 h-20 text-liquid-gold animate-spin" />
                            <p className="text-[12px] font-black text-slate-700 uppercase tracking-[1em] animate-pulse italic">DECRYPTING_IDENTITY_RECORDS...</p>
                        </div>
                    ) : filtered.length > 0 ? filtered.map((c, idx) => {
                        const clientJobs = trabajos.filter(t => t.clienteId === c.id);
                        const lastJob = clientJobs.sort((a, b) => new Date(b.fechaEntrada).getTime() - new Date(a.fechaEntrada).getTime())[0];
                        
                        return (
                            <motion.div 
                                initial={{ opacity: 0, y: 30 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: idx * 0.03 }}
                                key={c.id}
                                className="group relative bg-white/[0.02] backdrop-blur-3xl p-12 border border-white/5 hover:border-liquid-gold/30 transition-all duration-700 rounded-[3.5rem] overflow-hidden shadow-luxury"
                            >
                                <div className="absolute inset-0 bg-architect-grid opacity-[0.02] pointer-events-none" />
                                
                                <div className="flex justify-between items-start relative z-10">
                                    <div className="space-y-6">
                                        <div className="flex items-center gap-4">
                                            <div className="px-5 py-2 rounded-full border border-liquid-gold/20 bg-liquid-gold/5 text-liquid-gold text-[9px] font-black uppercase tracking-[0.4em] italic shadow-gold-glow-soft">IDENTITY_CONFIRMED</div>
                                            <span className="text-[10px] font-black text-slate-700 uppercase tracking-widest bg-white/5 px-4 py-2 rounded-xl italic">#{c.id}</span>
                                        </div>
                                        <div className="space-y-1">
                                            <h3 className="text-4xl font-black text-white uppercase italic tracking-tighter group-hover:text-liquid-gold transition-colors duration-500 leading-none">{c.nombre}</h3>
                                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.5em] italic mt-4">{c.direccion || 'UBICACIÓN NO REGISTRADA'}</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-4">
                                        <button 
                                            onClick={() => setMarketingClient(c)}
                                            className="p-5 bg-white/5 hover:bg-liquid-gold text-slate-500 hover:text-brand-dark rounded-2xl transition-all border border-white/5 group-hover:border-liquid-gold/20 shadow-2xl"
                                            title="Núcleo Géminis IA"
                                        >
                                            <SparklesIcon className="w-6 h-6 animate-pulse" />
                                        </button>
                                        <button 
                                            onClick={() => { setClientToEdit(c); setIsFormOpen(true); }}
                                            className="p-5 bg-white/5 hover:bg-white text-slate-500 hover:text-brand-dark rounded-2xl transition-all border border-white/5 shadow-2xl"
                                        >
                                            <PencilIcon className="w-6 h-6" />
                                        </button>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-10 mt-12 relative z-10">
                                    <div className="space-y-6">
                                        <p className="text-[10px] font-black text-slate-700 uppercase tracking-[0.4em] italic leading-none">COMMUNICATION_CHANNELS</p>
                                        <div className="flex flex-col gap-4">
                                            {c.telefono.map((tel, i) => (
                                                <div key={i} className="flex items-center gap-5 text-white/90 group/tel">
                                                    <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 group-hover/tel:bg-emerald-500 group-hover/tel:text-brand-dark transition-all">
                                                        <PhoneIcon className="w-4 h-4" />
                                                    </div>
                                                    <span className="text-lg font-black italic tracking-tighter">{tel}</span>
                                                </div>
                                            ))}
                                            {c.email && (
                                                <div className="flex items-center gap-5 text-white/90 group/email">
                                                    <div className="w-10 h-10 rounded-2xl bg-liquid-gold/10 flex items-center justify-center border border-liquid-gold/20 group-hover/email:bg-liquid-gold group-hover/email:text-brand-dark transition-all">
                                                        <EnvelopeIcon className="w-4 h-4" />
                                                    </div>
                                                    <span className="text-lg font-black italic tracking-tighter lowercase truncate">{c.email}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="bg-black/20 p-8 rounded-[2.5rem] border border-white/5 space-y-8 group-hover:border-liquid-gold/10 transition-all">
                                        <div className="flex justify-between items-center">
                                            <p className="text-[9px] font-black text-slate-700 uppercase tracking-[0.4em] italic">MISSION_HISTORY</p>
                                            <div className="px-4 py-1.5 rounded-full bg-white/5 text-[9px] font-black text-white italic">{clientJobs.length} ORDENES</div>
                                        </div>
                                        {lastJob ? (
                                            <div className="space-y-4">
                                                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest leading-relaxed">ÚLTIMA_ ACTIVIDAD: <span className="text-white italic">{lastJob.subtipo}</span></p>
                                                <div className="flex justify-between items-end">
                                                    <p className="text-[10px] font-black text-slate-700 uppercase tracking-widest italic">{formatDate(lastJob.fechaEntrada)}</p>
                                                    <p className="text-3xl font-black text-emerald-500 italic tracking-tighter">{formatCurrency(lastJob.total)}</p>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="h-full flex items-center justify-center py-4">
                                                <p className="text-[10px] font-black text-slate-800 uppercase tracking-[0.5em] italic">NO_HISTORY_DETECTED</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </motion.div>
                        );
                    }) : (
                        <div className="col-span-full py-60 bg-white/[0.01] border-4 border-dashed border-white/5 rounded-[5rem] text-center flex flex-col items-center justify-center">
                            <FingerPrintIcon className="w-32 h-32 text-slate-900 mb-12" />
                            <h3 className="text-4xl font-black text-slate-800 uppercase tracking-[0.6em] italic">VAULT_VACANT</h3>
                            <p className="text-slate-900 text-xs font-black uppercase mt-6 tracking-[1em] italic opacity-30">NO_IDENTITY_ENTITIES_DETECTED_IN_DATABASE</p>
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