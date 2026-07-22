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

// --- PRECISION LIGHT COMPONENTS ---

const KpiCard: React.FC<{ title: string; value: string | number; icon: React.FC<any>; colorClass?: string }> = ({ title, value, icon: Icon, colorClass = "bg-brand-blue/10 text-brand-blue" }) => (
    <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={{ y: -5 }}
        className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm relative group transition-all"
    >
        <div className="flex justify-between items-start">
            <div className="space-y-2">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em]">{title}</p>
                <p className="text-4xl font-black text-slate-900 tracking-tighter">{value}</p>
            </div>
            <div className={`${colorClass} p-4 rounded-2xl border border-slate-100 shadow-sm`}>
                <Icon className="h-6 w-6" />
            </div>
        </div>
    </motion.div>
);

const InputField: React.FC<{ label: string; name: string; value: any; onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void; [key: string]: any; }> = ({ label, name, value, onChange, ...props }) => (
    <div className="space-y-3">
        <label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.4em] ml-2">{label}</label>
        {props.type === 'select' ? (
            <select name={name} value={value} onChange={onChange} className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:border-brand-blue outline-none transition-all font-bold text-slate-900 appearance-none cursor-pointer">
                {props.children}
            </select>
        ) : (
            <input name={name} value={value} onChange={onChange} className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:border-brand-blue outline-none transition-all font-bold text-slate-900" {...props} />
        )}
    </div>
);

const InfoItem: React.FC<{icon?: React.FC<any>, label: string, value: any, link?: string}> = ({ icon: Icon, label, value, link }) => (
    <div className="flex items-start gap-4 p-5 rounded-[2rem] bg-slate-50 border border-slate-200 group transition-all hover:border-brand-blue/30">
        {Icon && <div className="p-3 bg-white rounded-xl border border-slate-100 group-hover:text-brand-blue transition-colors shadow-sm"><Icon className="h-4 w-4" /></div>}
        <div className="min-w-0">
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">{label}</p>
            {link ? (
                <a href={link} target="_blank" rel="noopener noreferrer" className="text-sm font-black text-slate-900 hover:text-brand-blue transition-colors truncate block uppercase">{value || 'SIN VINCULO'}</a>
            ) : (
                <p className="text-sm font-black text-slate-900 truncate block uppercase">{value || 'N/A'}</p>
            )}
        </div>
    </div>
);

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
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />
                <motion.div 
                    initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 20 }}
                    className="bg-white w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col relative z-10 border border-slate-200 shadow-2xl rounded-[3rem]" 
                    onClick={e => e.stopPropagation()}
                >
                    <div className="p-10 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                        <div>
                            <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Registro de <span className="text-brand-blue">Aliado</span></h2>
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.4em] mt-1">Integración de Red Logística</p>
                        </div>
                        <button onClick={onClose} className="p-3 bg-white hover:bg-slate-50 text-slate-400 border border-slate-200 rounded-xl transition-all"><CloseIcon className="w-6 h-6"/></button>
                    </div>
                    
                    <form onSubmit={handleSubmit} className="p-10 space-y-8 overflow-y-auto custom-scrollbar">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <InputField label="Nombre de Entidad" name="nombre" value={formData.nombre || ''} onChange={e => setFormData({...formData, nombre: e.target.value.toUpperCase()})} required placeholder="Ej. PAPELERA NACIONAL" />
                            <InputField label="Rama Industrial" name="categoria" value={formData.categoria || ''} onChange={e => setFormData({...formData, categoria: e.target.value})} required placeholder="Ej. Insumos" />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <InputField label="Agente Principal" name="contacto" value={formData.contacto || ''} onChange={e => setFormData({...formData, contacto: e.target.value})} placeholder="Ej. Ing. Carlos Ruiz" />
                            <InputField label="Comunicación Directa (WA)" name="telefono" value={formData.telefono || ''} onChange={e => setFormData({...formData, telefono: e.target.value})} required placeholder="Ej. 0987654321" />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <InputField label="Tipo de Servicio" name="tipo" value={formData.tipo || 'Producto'} onChange={e => setFormData({...formData, tipo: e.target.value as any})} type="select">
                                <option value="Producto">SUMINISTRO DE PRODUCTO</option>
                                <option value="Servicio">PRESTACIÓN DE SERVICIO</option>
                            </InputField>
                            <InputField label="Estado de Alianza" name="estado" value={formData.estado || 'Activo'} onChange={e => setFormData({...formData, estado: e.target.value as any})} type="select">
                                <option value="Activo">ACTIVO / VINCULADO</option>
                                <option value="Inactivo">EN PAUSA / INACTIVO</option>
                            </InputField>
                        </div>
                        <div className="space-y-3">
                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.4em] ml-2">Portafolio de Productos</label>
                            <textarea value={formData.productos || ''} onChange={e => setFormData({...formData, productos: e.target.value})} rows={3} className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:border-brand-blue outline-none transition-all font-bold text-slate-900 uppercase tracking-widest min-h-[120px]" placeholder="DESCRIBA LOS PRODUCTOS O SERVICIOS QUE PROVEE..." />
                        </div>
                    </form>

                    <div className="p-10 border-t border-slate-100 bg-slate-50/50 flex justify-between items-center">
                        <button type="button" onClick={onClose} className="text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-slate-900 transition-colors">Cancelar</button>
                        <button onClick={handleSubmit} className="px-12 py-5 bg-brand-blue text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-lg shadow-brand-blue/20 active:scale-95 transition-all">Sincronizar Protocolo</button>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

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
    
    function getProveedorNombre(id: string) { return proveedores.find(p => p.id === id)?.nombre || 'SISTEMA_CENTRAL'; }

    return (
        <div className="max-w-[1600px] mx-auto space-y-12 pb-40 pt-6 px-6 sm:px-12 relative animate-fade-in">
            {/* --- HEADER --- */}
            <div className="flex flex-col xl:flex-row justify-between items-start xl:items-end gap-10 border-b border-slate-200 pb-10">
                <div>
                    <div className="flex items-center gap-4 mb-4">
                    <div className="flex items-center gap-2 mb-1">
                        <span className="w-2 h-2 rounded-full bg-brand-blue" />
                        <span className="text-[10px] font-black text-brand-blue uppercase tracking-widest">Red de Abastecimiento</span>
                    </div>
                    <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight uppercase">
                        Directorio de Proveedores <span className="text-brand-blue font-bold">• Insumos</span>
                    </h1>
                </div>
                <button 
                    onClick={() => { setProveedorToEdit({}); setIsFormModalOpen(true); }} 
                    className="px-10 py-5 bg-brand-blue text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl shadow-brand-blue/20 hover:bg-brand-blue/90 transition-all flex items-center gap-4"
                >
                    <UserPlusIcon className="w-5 h-5" />
                    Registrar Nodo
                </button>
            </div>

            {/* --- KPI SECTION --- */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <KpiCard title="Nodos Activos" value={kpis.total} icon={BuildingStorefrontIcon} />
                <KpiCard title="Protocolos Pendientes" value={kpis.pendientes} icon={ActivityIcon} colorClass="bg-amber-50 text-amber-500" />
                <KpiCard title="Ciclos de Servicio" value={kpis.mantenimientos} icon={WrenchScrewdriverIcon} colorClass="bg-indigo-50 text-indigo-500" />
            </div>

            {/* --- CONTENT GRID --- */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                
                {/* DIRECTORY PANEL */}
                <div className="lg:col-span-12 xl:col-span-7 space-y-10 flex flex-col min-h-[800px]">
                    <div className="bg-white rounded-[3rem] border border-slate-200 shadow-sm flex flex-col h-full overflow-hidden">
                        <div className="p-10 border-b border-slate-100 bg-slate-50/50 flex flex-col md:flex-row justify-between items-center gap-6">
                            <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Directorio <span className="text-brand-blue">Estratégico</span></h2>
                            <div className="flex gap-4 w-full md:w-auto">
                                <div className="relative group flex-1 md:w-64">
                                    <SearchIcon className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 w-5 h-5 group-focus-within:text-brand-blue transition-colors"/>
                                    <input type="text" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="RASTREAR..." className="w-full pl-16 pr-6 py-4 bg-white border border-slate-200 rounded-2xl text-[10px] font-black uppercase tracking-widest focus:border-brand-blue outline-none transition-all shadow-sm" />
                                </div>
                                <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)} className="px-6 py-4 bg-white border border-slate-200 rounded-2xl text-[10px] font-black uppercase tracking-widest outline-none transition-all shadow-sm appearance-none cursor-pointer">
                                    {categories.map(cat => <option key={cat} value={cat}>{cat.toUpperCase()}</option>)}
                                </select>
                            </div>
                        </div>

                        <div className="flex-grow overflow-y-auto grid grid-cols-1 md:grid-cols-2 gap-8 p-10 custom-scrollbar">
                            <AnimatePresence>
                                {filteredProveedores.map(p => (
                                    <motion.div 
                                        key={p.id} layout initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                                        onClick={() => setViewingProveedor(p)}
                                        className="bg-white border border-slate-100 rounded-[2.5rem] p-10 cursor-pointer group flex flex-col h-full hover:bg-slate-50 transition-all duration-500 hover:border-brand-blue/20 hover:shadow-xl hover:shadow-brand-blue/5"
                                    >
                                        <div className="flex-grow space-y-4">
                                            <div className="flex justify-between items-start">
                                                <h3 className="text-2xl font-black text-slate-900 group-hover:text-brand-blue transition-colors uppercase tracking-tight leading-none">{p.nombre}</h3>
                                                <div className={`w-3 h-3 rounded-full ${p.estado === 'Activo' ? 'bg-emerald-500' : 'bg-rose-500'} shadow-lg`}></div>
                                            </div>
                                            <span className="text-[10px] font-black text-brand-blue uppercase tracking-[0.4em] block">{p.categoria}</span>
                                            <p className="text-xs font-bold text-slate-400 h-10 line-clamp-2 uppercase leading-relaxed tracking-wider italic">{p.productos || 'SIN PORTAFOLIO REGISTRADO'}</p>
                                        </div>
                                        <div className="mt-10 pt-8 border-t border-slate-100 flex justify-between items-center">
                                            <a href={formatWhatsAppLink(p.telefono)} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()} className="px-5 py-3 bg-emerald-50 text-emerald-500 hover:bg-emerald-500 hover:text-white rounded-xl transition-all duration-500 flex items-center gap-3 text-[9px] font-black uppercase tracking-widest border border-emerald-100">
                                                <WhatsAppIcon className="w-4 h-4"/> Canal Directo
                                            </a>
                                            <div className="p-3 bg-slate-50 text-slate-300 group-hover:text-brand-blue rounded-xl transition-all">
                                                <ArrowRightIcon className="w-5 h-5"/>
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                            {filteredProveedores.length === 0 && (
                                <div className="col-span-full py-40 text-center opacity-20 uppercase font-black text-[10px] tracking-[0.5em]">Sin Coincidencias en Red</div>
                            )}
                        </div>
                    </div>
                </div>

                {/* AGENDA PANEL */}
                <div className="lg:col-span-12 xl:col-span-5 flex flex-col min-h-[800px]">
                    <div className="bg-white rounded-[3rem] border border-slate-200 shadow-sm flex flex-col h-full overflow-hidden">
                        <div className="p-10 border-b border-slate-100 bg-slate-50/50">
                            <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight flex items-center gap-4">
                                <CalendarDaysIcon className="w-7 h-7 text-brand-blue"/> Flujo Operativo
                            </h2>
                        </div>

                        {/* Program Form */}
                        <form ref={agendaFormRef} onSubmit={async (e) => {
                            e.preventDefault();
                            if (!newTarea.proveedorId || !newTarea.titulo) return;
                            await createTareaProveedor(newTarea);
                            setNewTarea({ proveedorId: '', titulo: '', tipo: 'General', descripcion: '', fechaVencimiento: '' });
                            logActivity(currentUser.nombre, currentUser.rol, 'GESTION_PROVEEDOR', `Tarea programada: ${newTarea.titulo}`, 'Proveedores');
                        }} className="p-10 space-y-6 bg-slate-50/30 border-b border-slate-100">
                            <div className="grid grid-cols-2 gap-4">
                                <select value={newTarea.proveedorId} onChange={e => setNewTarea({...newTarea, proveedorId: e.target.value})} className="px-5 py-4 bg-white border border-slate-200 rounded-2xl text-[10px] font-black tracking-widest outline-none transition-all shadow-sm cursor-pointer" required>
                                    <option value="">VINCULAR NODO</option>
                                    {proveedores.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
                                </select>
                                <select value={newTarea.tipo} onChange={e => setNewTarea({...newTarea, tipo: e.target.value as any})} className="px-5 py-4 bg-white border border-slate-200 rounded-2xl text-[10px] font-black tracking-widest outline-none transition-all shadow-sm cursor-pointer">
                                    <option value="General">OP. GENERAL</option>
                                    <option value="Mantenimiento">MANTENIMIENTO</option>
                                </select>
                            </div>
                            <input type="text" placeholder="OBJETIVO DE MISIÓN..." value={newTarea.titulo} onChange={e => setNewTarea({...newTarea, titulo: e.target.value.toUpperCase()})} className="w-full px-6 py-4 bg-white border border-slate-200 rounded-2xl text-xs font-black uppercase tracking-widest focus:border-brand-blue outline-none transition-all shadow-sm" required/>
                            <div className="flex gap-4">
                                <input type="date" value={newTarea.fechaVencimiento} onChange={e => setNewTarea({...newTarea, fechaVencimiento: e.target.value})} className="flex-grow px-6 py-4 bg-white border border-slate-200 rounded-2xl text-[10px] font-black uppercase tracking-widest outline-none transition-all shadow-sm" required/>
                                <button type="submit" className="p-4 bg-brand-blue text-white rounded-2xl shadow-lg shadow-brand-blue/20 active:scale-95 transition-all"><PlusIcon className="w-6 h-6"/></button>
                            </div>
                        </form>

                        <div className="flex-grow flex flex-col overflow-hidden">
                            <div className="flex border-b border-slate-100 bg-slate-50/50">
                                {(['tareas', 'mantenimiento'] as const).map(tab => (
                                    <button 
                                        key={tab} onClick={() => setAgendaTab(tab)}
                                        className={`flex-1 py-6 text-[10px] font-black uppercase tracking-[0.3em] transition-all border-b-2 ${agendaTab === tab ? 'text-brand-blue border-brand-blue bg-white' : 'text-slate-400 border-transparent hover:text-slate-900'}`}
                                    >
                                        {tab === 'tareas' ? 'Misiones Activas' : 'Ciclos de Servicio'}
                                    </button>
                                ))}
                            </div>

                            <div className="p-10 overflow-y-auto custom-scrollbar space-y-4 bg-white">
                                <AnimatePresence mode="popLayout">
                                    {filteredAgendaItems.map(t => (
                                        <motion.div 
                                            key={t.id} layout initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, scale: 0.9 }}
                                            className={`p-6 rounded-[2rem] border transition-all duration-500 ${t.completada ? 'bg-slate-50 border-transparent grayscale' : 'bg-white border-slate-100 hover:border-brand-blue/20 shadow-sm group'}`}
                                        >
                                            <div className="flex gap-5">
                                                <div className="relative pt-1">
                                                    <input 
                                                        type="checkbox" checked={t.completada} 
                                                        onChange={() => updateTareaProveedor(t.id, { completada: !t.completada })}
                                                        className="w-6 h-6 outline-none appearance-none border-2 border-slate-200 rounded-xl checked:bg-brand-blue checked:border-brand-blue transition-all cursor-pointer shadow-inner"
                                                    />
                                                    {t.completada && <CheckBadgeIcon className="absolute top-[2px] left-[2px] w-5 h-5 text-white pointer-events-none" />}
                                                </div>
                                                <div className="min-w-0 flex-grow">
                                                    <p className={`text-sm font-black uppercase tracking-tight transition-all ${t.completada ? 'line-through text-slate-300' : 'text-slate-900'}`}>{t.titulo}</p>
                                                    <div className="flex flex-wrap gap-4 mt-3">
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-1.5 h-1.5 rounded-full bg-brand-blue/30"></div>
                                                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{getProveedorNombre(t.proveedorId)}</span>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <ClockIcon className="w-3 h-3 text-slate-300" />
                                                            <span className={`text-[9px] font-black uppercase tracking-widest ${new Date(t.fechaVencimiento) < new Date() && !t.completada ? 'text-rose-500 animate-pulse' : 'text-slate-400'}`}>
                                                                {formatDate(t.fechaVencimiento)}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </motion.div>
                                    ))}
                                </AnimatePresence>
                                {filteredAgendaItems.length === 0 && <div className="py-20 text-center opacity-10 uppercase font-black text-[10px] tracking-[0.5em] italic">No hay eventos programados</div>}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <ProveedorFormModal isOpen={isFormModalOpen} onClose={() => setIsFormModalOpen(false)} onSave={async (data) => {
                if (data.id) await updateProveedor(data.id, data);
                else await addProveedor(data as any);
                setIsFormModalOpen(false);
            }} proveedorToEdit={proveedorToEdit} />

            <AnimatePresence>
                {viewingProveedor && (
                    <div className="fixed inset-0 z-[100] flex justify-center items-center p-6">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={() => setViewingProveedor(null)} />
                        <motion.div initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 20 }} className="bg-white w-full max-w-2xl overflow-hidden flex flex-col relative z-10 border border-slate-200 shadow-2xl rounded-[3rem]">
                            <div className="p-16 space-y-12">
                                <div className="flex justify-between items-start">
                                    <div className="space-y-4">
                                        <span className="text-[10px] font-black text-brand-blue uppercase tracking-[0.6em] bg-brand-blue/5 px-6 py-2 rounded-full inline-block border border-brand-blue/10">{viewingProveedor.categoria}</span>
                                        <h1 className="text-5xl font-black text-slate-900 tracking-tighter uppercase leading-none">{viewingProveedor.nombre}</h1>
                                    </div>
                                    <button onClick={() => setViewingProveedor(null)} className="p-4 hover:bg-slate-50 text-slate-300 hover:text-slate-900 rounded-full transition-all"><CloseIcon className="w-8 h-8"/></button>
                                </div>
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <InfoItem icon={PhoneIcon} label="Línea Directa" value={viewingProveedor.telefono} link={`tel:${viewingProveedor.telefono}`} />
                                    <InfoItem icon={WhatsAppIcon} label="Canal WhatsApp" value="Enlace de comunicación" link={formatWhatsAppLink(viewingProveedor.telefono)} />
                                    <InfoItem icon={MapPinIcon} label="Sede de Operaciones" value={viewingProveedor.ciudad || 'NODO GLOBAL'} />
                                    <InfoItem icon={GlobeAltIcon} label="Portal Digital" value={viewingProveedor.website} link={viewingProveedor.website ? `https://${viewingProveedor.website}` : undefined} />
                                </div>

                                <div className="space-y-4">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] ml-2">Mapa de Suministros</p>
                                    <div className="p-8 rounded-[2.5rem] bg-slate-50 border border-slate-200">
                                        <p className="text-sm font-bold text-slate-600 leading-relaxed uppercase tracking-wider italic">{viewingProveedor.productos || 'SIN PORTAFOLIO REGISTRADO'}</p>
                                    </div>
                                </div>

                                <div className="pt-10 border-t border-slate-100 flex justify-between items-center">
                                    <button onClick={() => { deleteProveedor(viewingProveedor.id); setViewingProveedor(null); }} className="text-[10px] font-black text-rose-500/40 hover:text-rose-500 transition-colors uppercase tracking-widest underline decoration-dashed">Protocolo: Anular Nodo</button>
                                    <div className="flex gap-4">
                                        <button onClick={() => { setProveedorToEdit(viewingProveedor); setViewingProveedor(null); setIsFormModalOpen(true); }} className="px-10 py-5 bg-brand-blue text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl shadow-brand-blue/20">Sincronizar Perfil</button>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
            <style>{`
                .custom-scrollbar::-webkit-scrollbar { width: 4px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #f1f5f9; border-radius: 10px; }
            `}</style>
        </div>
    );
};

export default ProveedoresPage;