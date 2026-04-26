import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Proveedor, TareaProveedor, User } from '../types';
import { useData } from '../contexts/DataContext';
import { useOutletContext, useNavigate } from 'react-router-dom';
import { 
    BuildingStorefrontIcon, UserPlusIcon, SearchIcon, CloseIcon, PencilIcon, TrashIcon, 
    WhatsAppIcon, ExclamationTriangleIcon, PhoneIcon, CheckBadgeIcon, ClockIcon, 
    WrenchScrewdriverIcon, CalendarDaysIcon, GlobeAltIcon, MapPinIcon, EnvelopeIcon,
    LayersIcon, SparklesIcon, ActivityIcon, PlusIcon, ArrowRightIcon
} from '../components/Icons';
import { formatDate } from '../utils';
import { logActivity } from '../services/activityLogService';
import { motion, AnimatePresence } from 'framer-motion';

// --- HELPERS ---

const formatWhatsAppLink = (phone: string) => {
    let cleanPhone = phone.replace(/\D/g, '');
    if (cleanPhone.startsWith('09')) cleanPhone = '593' + cleanPhone.substring(1);
    else if (cleanPhone.length === 9 && cleanPhone.startsWith('9')) cleanPhone = '593' + cleanPhone;
    else if (cleanPhone.length === 10 && cleanPhone.startsWith('0')) cleanPhone = '593' + cleanPhone.substring(1);
    return `https://wa.me/${cleanPhone}`;
};

const fadeInUp = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, scale: 0.95 }
};

const containerVariants = {
    animate: { transition: { staggerChildren: 0.05 } }
};

// --- COMPONENTS ---

const KpiCard: React.FC<{ title: string; value: string | number; icon: React.FC<any>; color: string; border: string }> = ({ title, value, icon: Icon, color, border }) => (
    <motion.div 
        variants={fadeInUp}
        whileHover={{ y: -5 }}
        className={`glass-card-luxury p-10 relative group cursor-default border-t-2 ${border}`}
    >
        <div className="flex justify-between items-start">
            <div className="space-y-4">
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.5em]">{title}</p>
                <p className="text-5xl font-black text-white group-hover:text-gold-gradient transition-all italic tracking-tighter">{value}</p>
            </div>
            <div className={`p-5 rounded-2xl ${color} shadow-lg transition-transform group-hover:scale-110`}>
                <Icon className="h-6 w-6 text-black" />
            </div>
        </div>
        <div className="absolute inset-x-10 bottom-0 h-[1px] bg-gradient-to-r from-transparent via-white/5 to-transparent"></div>
    </motion.div>
);

const InputField: React.FC<{ label: string; name: string; value: any; onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void; [key: string]: any; }> = ({ label, name, value, onChange, ...props }) => (
    <div className="space-y-3">
        <label className="text-[9px] font-black text-slate-500 uppercase tracking-[0.4em] ml-2">{label}</label>
        <input name={name} value={value} onChange={onChange} className="input-atelier w-full py-4 px-6 text-xs" {...props} />
    </div>
);

const InfoItem: React.FC<{icon?: React.FC<any>, label: string, value: any, link?: string}> = ({ icon: Icon, label, value, link }) => (
    <div className="flex items-start gap-4 p-4 rounded-2xl bg-white/[0.02] border border-white/5 group transition-colors hover:border-liquid-gold/20">
        {Icon && <div className="p-3 bg-white/5 rounded-xl border border-white/5 group-hover:text-liquid-gold transition-colors"><Icon className="h-4 w-4" /></div>}
        <div className="min-w-0">
            <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest mb-1">{label}</p>
            {link ? (
                <a href={link} target="_blank" rel="noopener noreferrer" className="text-sm font-black text-white hover:text-liquid-gold transition-colors truncate block">{value || 'NOT_LINKED'}</a>
            ) : (
                <p className="text-sm font-black text-white truncate block">{value || 'N/A'}</p>
            )}
        </div>
    </div>
);

// --- MODALS ---

const ProveedorFormModal: React.FC<{ isOpen: boolean; onClose: () => void; onSave: (proveedor: Partial<Proveedor>) => void; proveedorToEdit: Partial<Proveedor> | null; }> = ({ isOpen, onClose, onSave, proveedorToEdit }) => {
    const [formData, setFormData] = useState<Partial<Proveedor>>({});

    useEffect(() => {
        setFormData(proveedorToEdit || { nombre: '', categoria: 'Papel y Cartulinas', tipo: 'Producto', contacto: '', telefono: '', estado: 'Activo' });
    }, [proveedorToEdit, isOpen]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(formData);
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[100] flex justify-center items-center p-6">
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/95 backdrop-blur-3xl" onClick={onClose} />
                <motion.div 
                    initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 20 }}
                    className="glass-card-luxury w-full max-w-2xl max-h-[90vh] flex flex-col relative z-10" 
                    onClick={e => e.stopPropagation()}
                >
                    <div className="p-10 border-b border-white/5 bg-white/[0.02] flex justify-between items-center">
                        <div>
                            <h2 className="text-3xl font-black text-white uppercase italic tracking-tighter">Alliance <span className="text-liquid-gold">Registration</span></h2>
                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] mt-1">Strategic Logistic Network Integration</p>
                        </div>
                        <button onClick={onClose} className="p-3 hover:bg-white/10 rounded-full text-slate-500 hover:text-white transition-all"><CloseIcon className="w-6 h-6"/></button>
                    </div>
                    
                    <form onSubmit={handleSubmit} className="p-10 space-y-10 overflow-y-auto custom-scrollbar">
                        <div className="grid grid-cols-2 gap-8">
                            <InputField label="Entity Designation" name="nombre" value={formData.nombre || ''} onChange={e => setFormData({...formData, nombre: e.target.value.toUpperCase()})} required />
                            <InputField label="Industrial Branch" name="categoria" value={formData.categoria || ''} onChange={e => setFormData({...formData, categoria: e.target.value})} required />
                        </div>
                        <div className="grid grid-cols-2 gap-8">
                            <InputField label="Primary Agent" name="contacto" value={formData.contacto || ''} onChange={e => setFormData({...formData, contacto: e.target.value})} />
                            <InputField label="Direct Comms (WA)" name="telefono" value={formData.telefono || ''} onChange={e => setFormData({...formData, telefono: e.target.value})} required />
                        </div>
                        <div className="grid grid-cols-2 gap-8">
                            <InputField label="Service Scope" name="tipo" value={formData.tipo || 'Producto'} onChange={e => setFormData({...formData, tipo: e.target.value as any})} type="select" />
                            <InputField label="Alliance Status" name="estado" value={formData.estado || 'Activo'} onChange={e => setFormData({...formData, estado: e.target.value as any})} type="select" />
                        </div>
                        <div className="space-y-3">
                            <label className="text-[9px] font-black text-slate-500 uppercase tracking-[0.4em] ml-2">Product Portfolio</label>
                            <textarea value={formData.productos || ''} onChange={e => setFormData({...formData, productos: e.target.value})} rows={3} className="input-atelier w-full text-xs py-4 px-6 uppercase tracking-widest leading-loose h-32" />
                        </div>
                    </form>

                    <div className="p-10 border-t border-white/5 flex gap-4 justify-end bg-white/[0.02]">
                        <button type="button" onClick={onClose} className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-8">Abort</button>
                        <button type="submit" onClick={handleSubmit} className="btn-luxury px-12 py-5">Sincronizar Protocolo</button>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

// --- MAIN PAGE ---

const ProveedoresPage: React.FC = () => {
    const { currentUser } = useOutletContext<{ currentUser: User }>();
    const { 
        proveedores, tareas, loading, addProveedor, updateProveedor, 
        deleteProveedor, createTareaProveedor, updateTareaProveedor 
    } = useData();
    
    const [searchTerm, setSearchTerm] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('Todos');
    const [agendaTab, setAgendaTab] = useState<'tareas' | 'mantenimiento'>('tareas');
    const [isFormModalOpen, setIsFormModalOpen] = useState(false);
    const [proveedorToEdit, setProveedorToEdit] = useState<Partial<Proveedor> | null>(null);
    const [viewingProveedor, setViewingProveedor] = useState<Proveedor | null>(null);
    const [newTarea, setNewTarea] = useState<Omit<TareaProveedor, 'id' | 'completada'>>({ proveedorId: '', titulo: '', tipo: 'General', descripcion: '', fechaVencimiento: '' });
    
    const agendaFormRef = useRef<HTMLFormElement>(null);

    const kpis = useMemo(() => ({
        total: proveedores.length,
        pendientes: tareas.filter(t => !t.completada && t.tipo === 'General').length,
        mantenimientos: tareas.filter(t => !t.completada && t.tipo === 'Mantenimiento').length,
    }), [proveedores, tareas]);

    const categories = useMemo(() => ['Todos', ...Array.from(new Set(proveedores.map(p => p.categoria))).sort()], [proveedores]);

    const filteredProveedores = useMemo(() => {
        const lower = searchTerm.toLowerCase();
        return proveedores
            .filter(p => categoryFilter === 'Todos' || p.categoria === categoryFilter)
            .filter(p => p.nombre.toLowerCase().includes(lower) || p.contacto.toLowerCase().includes(lower));
    }, [proveedores, searchTerm, categoryFilter]);

    const filteredAgendaItems = useMemo(() => {
        return tareas
            .filter(t => (agendaTab === 'tareas' ? t.tipo === 'General' : t.tipo === 'Mantenimiento'))
            .sort((a, b) => (a.completada ? 1 : -1) || new Date(a.fechaVencimiento).getTime() - new Date(b.fechaVencimiento).getTime());
    }, [tareas, agendaTab]);
    
    function getProveedorNombre(id: string) { return proveedores.find(p => p.id === id)?.nombre || 'LOG_NODE_ALPHA'; }

    return (
        <div className="max-w-7xl mx-auto space-y-20 pb-40 px-6 sm:px-12 relative overflow-hidden">
            <div className="absolute inset-0 bg-noise opacity-[0.02] pointer-events-none"></div>

            {/* --- HEADER --- */}
            <div className="flex flex-col xl:flex-row justify-between items-start xl:items-end gap-10 relative z-10">
                <div className="space-y-6">
                    <motion.h1 initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} className="text-7xl sm:text-8xl font-black text-white tracking-tighter uppercase italic leading-none">
                        Logistic <span className="text-gold-gradient drop-shadow-gold italic">Atlas</span>
                    </motion.h1>
                    <p className="text-[10px] font-black text-liquid-gold uppercase tracking-[0.8em] flex items-center gap-4">
                        <span className="w-16 h-[1px] bg-liquid-gold/30"></span> Supply Chain Integrity Console
                    </p>
                </div>
                <button 
                    onClick={() => { setProveedorToEdit({}); setIsFormModalOpen(true); }} 
                    className="btn-luxury px-12 py-6 text-sm flex items-center gap-4 group"
                >
                    <UserPlusIcon className="w-6 h-6 group-hover:scale-110 transition-transform duration-500" />
                    <span>Initialize Node</span>
                </button>
            </div>

            {/* --- KPI SECTION --- */}
            <motion.div variants={containerVariants} initial="initial" animate="animate" className="grid grid-cols-1 md:grid-cols-3 gap-8 relative z-10">
                <KpiCard title="Network Nodes" value={kpis.total} icon={BuildingStorefrontIcon} color="bg-liquid-gold" border="border-liquid-gold/30" />
                <KpiCard title="Active Protocols" value={kpis.pendientes} icon={ActivityIcon} color="bg-emerald-500" border="border-emerald-500/20" />
                <KpiCard title="Life Support" value={kpis.mantenimientos} icon={WrenchScrewdriverIcon} color="bg-indigo-500" border="border-indigo-500/20" />
            </motion.div>

            {/* --- CONTENT GRID --- */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 relative z-10">
                
                {/* DIRECTORY PANEL */}
                <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="lg:col-span-12 xl:col-span-7 space-y-10 flex flex-col h-[900px]">
                    <div className="glass-card-luxury p-12 flex flex-col h-full overflow-hidden relative">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-liquid-gold/5 rounded-full blur-[100px] pointer-events-none"></div>
                        
                        <div className="flex items-center justify-between mb-12">
                            <h2 className="text-3xl font-black text-white uppercase italic tracking-tighter">Strategic <span className="text-liquid-gold text-4xl">Alliances</span></h2>
                            <div className="flex gap-4">
                                <div className="relative group w-64">
                                    <SearchIcon className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-500 w-5 h-5 group-focus-within:text-liquid-gold transition-colors"/>
                                    <input type="text" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="QUERY..." className="input-atelier w-full pl-16 py-3 text-[10px] font-black uppercase tracking-widest" />
                                </div>
                                <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)} className="input-atelier py-3 px-8 text-[10px] font-black uppercase tracking-widest appearance-none cursor-pointer">
                                    {categories.map(cat => <option key={cat} value={cat} className="bg-brand-dark">{cat.toUpperCase()}</option>)}
                                </select>
                            </div>
                        </div>

                        <div className="flex-grow overflow-y-auto grid grid-cols-1 md:grid-cols-2 gap-8 custom-scrollbar pr-4 pb-10">
                            <AnimatePresence>
                                {filteredProveedores.map(p => (
                                    <motion.div 
                                        key={p.id} layout variants={fadeInUp}
                                        onClick={() => setViewingProveedor(p)}
                                        className="glass-card-luxury p-10 cursor-pointer group flex flex-col h-full bg-white/[0.01] hover:bg-white/[0.04] transition-all duration-700 hover:border-liquid-gold/30 hover:shadow-gold-glow-sm"
                                    >
                                        <div className="flex-grow space-y-4">
                                            <div className="flex justify-between items-start">
                                                <h3 className="text-2xl font-black text-white group-hover:text-liquid-gold transition-colors uppercase italic tracking-tighter leading-none">{p.nombre}</h3>
                                                <div className={`w-3 h-3 rounded-full ${p.estado === 'Activo' ? 'bg-emerald-500' : 'bg-red-500'} shadow-[0_0_10px_rgba(16,185,129,0.5)]`}></div>
                                            </div>
                                            <span className="text-[10px] font-black text-liquid-gold/40 uppercase tracking-[0.4em] block">{p.categoria}</span>
                                            <p className="text-xs font-bold text-slate-500 h-10 line-clamp-2 uppercase leading-relaxed tracking-wider italic">{p.productos || 'UNMAPPED_PORTFOLIO'}</p>
                                        </div>
                                        <div className="mt-10 pt-8 border-t border-white/5 flex justify-between items-center">
                                            <a href={formatWhatsAppLink(p.telefono)} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()} className="p-3 bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500 hover:text-black rounded-xl transition-all duration-500 flex items-center gap-3 text-[10px] font-black uppercase tracking-widest border border-emerald-500/20">
                                                <WhatsAppIcon className="w-5 h-5"/> COMM CHANNEL
                                            </a>
                                            <button className="p-3 hover:bg-white/5 rounded-full text-slate-600 hover:text-white transition-all"><ArrowRightIcon className="w-6 h-6"/></button>
                                        </div>
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                        </div>
                    </div>
                </motion.div>

                {/* AGENDA PANEL */}
                <motion.div initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} className="lg:col-span-12 xl:col-span-5 h-[900px] flex flex-col">
                    <div className="glass-card-luxury flex flex-col h-full overflow-hidden border-liquid-gold/10">
                        <div className="p-10 border-b border-white/5 bg-white/[0.01]">
                            <h2 className="text-3xl font-black text-white uppercase italic tracking-tighter flex items-center gap-6">
                                <CalendarDaysIcon className="w-8 h-8 text-liquid-gold"/> Operation Stream
                            </h2>
                        </div>

                        {/* Program Form */}
                        <form ref={agendaFormRef} onSubmit={async (e) => {
                            e.preventDefault();
                            if (!newTarea.proveedorId || !newTarea.titulo) return;
                            await createTareaProveedor(newTarea);
                            setNewTarea({ proveedorId: '', titulo: '', tipo: 'General', descripcion: '', fechaVencimiento: '' });
                            logActivity(currentUser.nombre, currentUser.rol, 'GESTION_PROVEEDOR', `Tarea programada: ${newTarea.titulo}`, 'Proveedores');
                        }} className="p-10 space-y-8 bg-black/40 border-b border-white/5">
                            <div className="grid grid-cols-2 gap-6">
                                <select value={newTarea.proveedorId} onChange={e => setNewTarea({...newTarea, proveedorId: e.target.value})} className="input-atelier py-4 text-[10px] font-black tracking-widest cursor-pointer" required>
                                    <option value="" className="bg-brand-dark">SELECT_PROVIDER</option>
                                    {proveedores.map(p => <option key={p.id} value={p.id} className="bg-brand-dark">{p.nombre}</option>)}
                                </select>
                                <select value={newTarea.tipo} onChange={e => setNewTarea({...newTarea, tipo: e.target.value as any})} className="input-atelier py-4 text-[10px] font-black tracking-widest cursor-pointer">
                                    <option value="General" className="bg-brand-dark">GENERAL_OP</option>
                                    <option value="Mantenimiento" className="bg-brand-dark">SUSTAINMENT</option>
                                </select>
                            </div>
                            <input type="text" placeholder="MISSION_OBJECTIVE..." value={newTarea.titulo} onChange={e => setNewTarea({...newTarea, titulo: e.target.value.toUpperCase()})} className="input-atelier w-full py-4 text-xs font-black" required/>
                            <div className="flex gap-4">
                                <input type="date" value={newTarea.fechaVencimiento} onChange={e => setNewTarea({...newTarea, fechaVencimiento: e.target.value})} className="input-atelier flex-grow py-4 text-[10px] [color-scheme:dark]" required/>
                                <button type="submit" className="btn-luxury px-10"><PlusIcon className="w-6 h-6"/></button>
                            </div>
                        </form>

                        <div className="flex-grow flex flex-col overflow-hidden">
                            <div className="flex border-b border-white/5 bg-black/20">
                                {(['tareas', 'mantenimiento'] as const).map(tab => (
                                    <button 
                                        key={tab} onClick={() => setAgendaTab(tab)}
                                        className={`flex-1 py-6 text-[10px] font-black uppercase tracking-[0.3em] transition-all border-b-2 ${agendaTab === tab ? 'text-liquid-gold border-liquid-gold bg-liquid-gold/5' : 'text-slate-600 border-transparent hover:text-white'}`}
                                    >
                                        {tab === 'tareas' ? 'Active Missions' : 'Service Cycles'}
                                    </button>
                                ))}
                            </div>

                            <div className="p-10 overflow-y-auto custom-scrollbar space-y-6 bg-white/[0.01]">
                                <AnimatePresence mode="popLayout">
                                    {filteredAgendaItems.map(t => (
                                        <motion.div 
                                            key={t.id} layout initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, scale: 0.9 }}
                                            className={`p-8 rounded-[2.5rem] border transition-all duration-500 ${t.completada ? 'bg-white/[0.01] border-transparent grayscale' : 'bg-white/[0.03] border-white/5 hover:border-liquid-gold/20 shadow-xl group'}`}
                                        >
                                            <div className="flex gap-6">
                                                <div className="relative pt-1">
                                                    <input 
                                                        type="checkbox" checked={t.completada} 
                                                        onChange={() => updateTareaProveedor(t.id, { completada: !t.completada })}
                                                        className="w-6 h-6 outline-none appearance-none border-2 border-white/10 rounded-xl checked:bg-liquid-gold checked:border-liquid-gold transition-all cursor-pointer shadow-inner"
                                                    />
                                                    {t.completada && <CheckBadgeIcon className="absolute top-[2px] left-[2px] w-5 h-5 text-black pointer-events-none" />}
                                                </div>
                                                <div className="min-w-0 flex-grow">
                                                    <p className={`text-md font-black uppercase tracking-tight italic transition-all ${t.completada ? 'line-through text-slate-700' : 'text-white'}`}>{t.titulo}</p>
                                                    <div className="flex flex-wrap gap-6 mt-4">
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-1.5 h-1.5 rounded-full bg-liquid-gold/40"></div>
                                                            <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">{getProveedorNombre(t.proveedorId)}</span>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <ClockIcon className="w-3 h-3 text-slate-600" />
                                                            <span className={`text-[9px] font-black uppercase tracking-widest ${new Date(t.fechaVencimiento) < new Date() && !t.completada ? 'text-red-500 animate-pulse' : 'text-white/40'}`}>
                                                                {formatDate(t.fechaVencimiento)}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </motion.div>
                                    ))}
                                </AnimatePresence>
                                {filteredAgendaItems.length === 0 && <div className="py-20 text-center opacity-10 uppercase font-black text-[10px] tracking-[0.5em] italic">No Events Scheduled</div>}
                            </div>
                        </div>
                    </div>
                </motion.div>
            </div>

            {/* --- MODALS --- */}
            <ProveedorFormModal isOpen={isFormModalOpen} onClose={() => setIsFormModalOpen(false)} onSave={async (data) => {
                if (data.id) await updateProveedor(data.id, data);
                else await addProveedor(data as any);
                setIsFormModalOpen(false);
            }} proveedorToEdit={proveedorToEdit} />

            <AnimatePresence>
                {viewingProveedor && (
                    <div className="fixed inset-0 z-[100] flex justify-center items-center p-6">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/98 backdrop-blur-3xl" onClick={() => setViewingProveedor(null)} />
                        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="glass-card-luxury w-full max-w-2xl overflow-hidden flex flex-col relative z-10 border border-white/10">
                            <div className="p-16 space-y-12">
                                <div className="flex justify-between items-start">
                                    <div className="space-y-4">
                                        <span className="text-[10px] font-black text-liquid-gold uppercase tracking-[0.6em] border border-liquid-gold/20 px-6 py-2 rounded-full inline-block">{viewingProveedor.categoria}</span>
                                        <h1 className="text-5xl font-black text-white italic tracking-tighter uppercase leading-none">{viewingProveedor.nombre}</h1>
                                    </div>
                                    <button onClick={() => setViewingProveedor(null)} className="p-4 hover:bg-white/10 rounded-full text-slate-500 transition-all"><CloseIcon className="w-8 h-8"/></button>
                                </div>
                                
                                <div className="grid grid-cols-2 gap-8">
                                    <InfoItem icon={PhoneIcon} label="Línea Directa" value={viewingProveedor.telefono} link={`tel:${viewingProveedor.telefono}`} />
                                    <InfoItem icon={WhatsAppIcon} label="WhatsApp Channel" value="Secured encrypted link" link={formatWhatsAppLink(viewingProveedor.telefono)} />
                                    <InfoItem icon={MapPinIcon} label="Operation Base" value={viewingProveedor.ciudad || 'GLOBAL_NODE'} />
                                    <InfoItem icon={GlobeAltIcon} label="Digital Frame" value={viewingProveedor.website} link={viewingProveedor.website ? `https://${viewingProveedor.website}` : undefined} />
                                </div>

                                <div className="space-y-4">
                                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] ml-2">Product Logic Map</p>
                                    <div className="p-8 rounded-[2.5rem] bg-white/[0.02] border border-white/5">
                                        <p className="text-sm font-bold text-slate-300 leading-relaxed italic uppercase tracking-wider">{viewingProveedor.productos || 'PORTFOLIO ARCHIVE SECURED'}</p>
                                    </div>
                                </div>

                                <div className="pt-10 border-t border-white/5 flex justify-between items-center">
                                    <button onClick={() => { deleteProveedor(viewingProveedor.id); setViewingProveedor(null); }} className="text-[10px] font-black text-red-500/40 hover:text-red-500 transition-colors uppercase tracking-widest underline decoration-dashed">Protocol: Nullify</button>
                                    <div className="flex gap-4">
                                        <button onClick={() => { setProveedorToEdit(viewingProveedor); setViewingProveedor(null); setIsFormModalOpen(true); }} className="btn-luxury px-10">Sync Profile</button>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default ProveedoresPage;