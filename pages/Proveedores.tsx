import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Proveedor, TareaProveedor } from '../types';
import { getProveedores, createProveedor, updateProveedor, deleteProveedor, getTareasProveedor, createTareaProveedor, updateTareaProveedor } from '../services/mockApi';
import { BuildingStorefrontIcon, UserPlusIcon, SearchIcon, CloseIcon, PencilIcon, TrashIcon, WhatsAppIcon, ExclamationTriangleIcon, PhoneIcon, CheckBadgeIcon, ClockIcon, WrenchScrewdriverIcon, CalendarDaysIcon, GlobeAltIcon, MapPinIcon, EnvelopeIcon } from '../components/Icons';
import { formatDate } from '../utils';

const formatWhatsAppLink = (phone: string) => {
    let cleanPhone = phone.replace(/\D/g, '');
    if (cleanPhone.startsWith('09')) {
        cleanPhone = '593' + cleanPhone.substring(1);
    } else if (cleanPhone.length === 9 && cleanPhone.startsWith('9')) {
        cleanPhone = '593' + cleanPhone;
    } else if (cleanPhone.length === 10 && cleanPhone.startsWith('0')) {
        cleanPhone = '593' + cleanPhone.substring(1);
    }
    return `https://wa.me/${cleanPhone}`;
};

const AgendaKpiCard: React.FC<{ title: string; value: string | number; icon: React.FC<any>; color: 'blue' | 'orange' | 'purple' }> = ({ title, value, icon: Icon }) => {
    return (
        <div className="bg-white/5 backdrop-blur-xl border border-white/5 rounded-2xl p-6 shadow-luxury hover:-translate-y-2 hover:border-liquid-gold/20 transition-all duration-500 group">
            <div className="flex justify-between items-start">
                <div>
                     <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">{title}</p>
                     <p className="text-3xl font-black text-white mt-2 group-hover:text-gold-gradient transition-all">{value}</p>
                </div>
                <div className="bg-white/5 p-3 rounded-full border border-white/5 group-hover:border-liquid-gold/30 transition-all">
                    <Icon className="h-6 w-6 text-liquid-gold" />
                </div>
            </div>
        </div>
    );
};

const ConfirmationModal: React.FC<{
    proveedor: Proveedor;
    onConfirm: () => void;
    onCancel: () => void;
}> = ({ proveedor, onConfirm, onCancel }) => (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-[100] flex justify-center items-center p-4 animate-fade-in" onClick={onCancel}>
        <div className="bg-brand-dark/95 backdrop-blur-xl rounded-[2.5rem] shadow-luxury border border-white/10 w-full max-w-sm animate-slide-up" onClick={e => e.stopPropagation()}>
            <div className="p-8 text-center">
                 <div className="mx-auto w-20 h-20 rounded-full flex items-center justify-center mb-6 shadow-gold-glow bg-brand-red/10 text-brand-red">
                     <ExclamationTriangleIcon className="h-10 w-10" />
                 </div>
                 <h3 className="text-2xl font-black text-white uppercase tracking-tighter">Confirmar Eliminación</h3>
                 <p className="mt-4 text-sm text-slate-400 font-bold uppercase tracking-wider">¿Estás seguro de que quieres eliminar a <strong className="text-liquid-gold">{proveedor.nombre}</strong>? Esta acción no se puede deshacer.</p>
            </div>
             <div className="p-6 bg-white/5 flex justify-center gap-4 border-t border-white/5 rounded-b-[2.5rem]">
                 <button onClick={onCancel} className="px-6 py-3 bg-white/10 text-white font-black text-[10px] uppercase tracking-[0.2em] rounded-2xl border border-white/10 hover:bg-white/20 transition-all">Cancelar</button>
                 <button onClick={onConfirm} className="px-6 py-3 bg-brand-red text-white font-black text-[10px] uppercase tracking-[0.2em] rounded-2xl shadow-gold-glow hover:bg-red-500 transition-all">Eliminar</button>
            </div>
        </div>
    </div>
);

const InputField: React.FC<{ label: string; name: string; value: any; onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void; [key: string]: any; }> = ({ label, name, value, onChange, ...props }) => (
    <div>
        <label htmlFor={name} className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-2">{label}</label>
        <input id={name} name={name} value={value} onChange={onChange} className="w-full p-4 bg-white/5 border border-white/10 rounded-2xl text-sm font-bold text-white uppercase focus:border-liquid-gold/50 focus:bg-white/10 outline-none transition-all" {...props} />
    </div>
);

const InfoItem: React.FC<{icon?: React.FC<any>, label: string, value: any, link?: string}> = ({ icon: Icon, label, value, link }) => (
    <div className="flex items-start">
        {Icon && <div className="p-2 bg-white/5 rounded-xl border border-white/5 mr-3 flex-shrink-0"><Icon className="h-4 w-4 text-liquid-gold" /></div>}
        <div>
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">{label}</p>
            {link ? (
                <a href={link} target="_blank" rel="noopener noreferrer" className="text-liquid-gold hover:text-white transition-colors font-bold text-sm uppercase break-words">{value || 'N/A'}</a>
            ) : (
                <p className="text-sm font-bold text-white uppercase break-words">{value || 'N/A'}</p>
            )}
        </div>
    </div>
);

const InfoBlock: React.FC<{label: string, value?: string}> = ({label, value}) => (
    <div>
        <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-2">{label}</p>
        <p className="text-sm font-bold text-slate-300 p-4 bg-white/5 border border-white/5 rounded-2xl leading-relaxed">{value || 'No hay información.'}</p>
    </div>
);

const ProveedorFormModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onSave: (proveedor: Partial<Proveedor>) => void;
    proveedorToEdit: Partial<Proveedor> | null;
}> = ({ isOpen, onClose, onSave, proveedorToEdit }) => {
    const [formData, setFormData] = useState<Partial<Proveedor>>({});

    useEffect(() => {
        setFormData(proveedorToEdit || { nombre: '', categoria: 'Papel y Cartulinas', tipo: 'Producto', contacto: '', telefono: '', estado: 'Activo' });
    }, [proveedorToEdit]);

    if (!isOpen) return null;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(formData);
    };

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-[100] flex justify-center items-center p-4 animate-fade-in" onClick={onClose}>
            <div className="bg-brand-dark/95 backdrop-blur-xl rounded-[2.5rem] shadow-luxury border border-white/10 w-full max-w-2xl max-h-[90vh] flex flex-col animate-slide-up" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center p-8 border-b border-white/5 bg-white/5">
                    <h2 className="text-2xl font-black text-white uppercase tracking-tighter">{formData.id ? 'Editar Proveedor' : 'Nuevo Proveedor'}</h2>
                    <button onClick={onClose} className="p-2 bg-white/5 hover:bg-brand-red/20 text-slate-400 hover:text-brand-red rounded-full transition-all border border-transparent hover:border-brand-red/30"><CloseIcon className="w-6 h-6" /></button>
                </div>
                <form onSubmit={handleSubmit} className="p-8 space-y-6 overflow-y-auto custom-scrollbar">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <InputField label="Nombre del Proveedor" name="nombre" value={formData.nombre || ''} onChange={handleChange} required />
                        <InputField label="Categoría" name="categoria" value={formData.categoria || ''} onChange={handleChange} required />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                         <InputField label="Persona de Contacto" name="contacto" value={formData.contacto || ''} onChange={handleChange} required />
                        <InputField label="Teléfono (para WhatsApp)" name="telefono" value={formData.telefono || ''} onChange={handleChange} required />
                    </div>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <InputField label="Ciudad" name="ciudad" value={formData.ciudad || ''} onChange={handleChange} />
                        <InputField label="Sitio Web (ej: dominio.com)" name="website" value={formData.website || ''} onChange={handleChange} />
                    </div>
                    <div>
                        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-2">Productos Principales</label>
                        <textarea name="productos" value={formData.productos || ''} onChange={handleChange} rows={2} className="w-full p-4 bg-white/5 border border-white/10 rounded-2xl text-sm font-bold text-white uppercase focus:border-liquid-gold/50 focus:bg-white/10 outline-none transition-all resize-none"></textarea>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-2">Tipo</label>
                            <select name="tipo" value={formData.tipo || 'Producto'} onChange={handleChange} className="w-full p-4 bg-white/5 border border-white/10 rounded-2xl text-sm font-bold text-white uppercase focus:border-liquid-gold/50 focus:bg-white/10 outline-none transition-all appearance-none cursor-pointer">
                                <option value="Producto" className="bg-brand-dark">Producto</option>
                                <option value="Servicio" className="bg-brand-dark">Servicio</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-2">Estado</label>
                            <select name="estado" value={formData.estado || 'Activo'} onChange={handleChange} className="w-full p-4 bg-white/5 border border-white/10 rounded-2xl text-sm font-bold text-white uppercase focus:border-liquid-gold/50 focus:bg-white/10 outline-none transition-all appearance-none cursor-pointer">
                                <option value="Activo" className="bg-brand-dark">Activo</option>
                                <option value="Inactivo" className="bg-brand-dark">Inactivo</option>
                            </select>
                        </div>
                    </div>
                    <div className="flex justify-end pt-6 gap-4 border-t border-white/5">
                        <button type="button" onClick={onClose} className="px-6 py-3 bg-white/5 text-white font-black text-[10px] uppercase tracking-[0.2em] rounded-2xl border border-white/5 hover:bg-white/10 transition-all">Cancelar</button>
                        <button type="submit" className="px-6 py-3 bg-liquid-gold text-brand-dark font-black text-[10px] uppercase tracking-[0.2em] rounded-2xl shadow-gold-glow hover:bg-white transition-all">Guardar Proveedor</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const ProveedorDetailModal: React.FC<{
    proveedor: Proveedor;
    onClose: () => void;
    onEdit: (p: Proveedor) => void;
    onDelete: (p: Proveedor) => void;
}> = ({ proveedor, onClose, onEdit, onDelete }) => {
     return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-[100] flex justify-center items-center p-4 animate-fade-in" onClick={onClose}>
            <div className="bg-brand-dark/95 backdrop-blur-xl rounded-[2.5rem] shadow-luxury border border-white/10 w-full max-w-2xl max-h-[90vh] flex flex-col animate-slide-up" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-start p-8 border-b border-white/5 bg-white/5">
                    <div>
                        <h2 className="text-3xl font-black text-white uppercase tracking-tighter">{proveedor.nombre}</h2>
                        <p className="mt-2 inline-block px-3 py-1 bg-liquid-gold/10 border border-liquid-gold/20 text-liquid-gold rounded-lg text-[9px] font-black uppercase tracking-widest">{proveedor.categoria}</p>
                    </div>
                    <button onClick={onClose} className="p-2 bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white rounded-full transition-all"><CloseIcon className="w-6 h-6" /></button>
                </div>
                <div className="p-8 overflow-y-auto space-y-8 custom-scrollbar">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-white/5 p-6 rounded-[2rem] border border-white/5">
                        <InfoItem icon={PhoneIcon} label="Teléfono" value={proveedor.telefono} link={`tel:${proveedor.telefono}`} />
                        <InfoItem icon={EnvelopeIcon} label="Email" value={proveedor.email} link={proveedor.email ? `mailto:${proveedor.email}`: undefined} />
                        <InfoItem icon={GlobeAltIcon} label="Sitio Web" value={proveedor.website} link={proveedor.website ? `http://${proveedor.website}`: undefined} />
                        <InfoItem icon={MapPinIcon} label="Ubicación" value={proveedor.direccion ? `${proveedor.direccion}, ${proveedor.ciudad}`: proveedor.ciudad} />
                    </div>
                    <InfoBlock label="Productos Principales" value={proveedor.productos} />
                    <InfoBlock label="Notas" value={proveedor.notas} />
                    <div className="grid grid-cols-2 gap-6 pt-4 border-t border-white/5">
                       <InfoItem label="Tipo" value={proveedor.tipo} />
                       <InfoItem label="Estado" value={<span className={`px-3 py-1 text-[9px] font-black uppercase tracking-widest rounded-lg border inline-block ${proveedor.estado === 'Activo' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-brand-red/10 text-brand-red border-brand-red/20'}`}>{proveedor.estado}</span>} />
                    </div>
                </div>
                <div className="flex justify-end gap-4 p-6 bg-white/5 border-t border-white/5 rounded-b-[2.5rem]">
                    <button onClick={() => onEdit(proveedor)} className="flex items-center gap-2 px-6 py-3 bg-white/10 text-white font-black text-[10px] uppercase tracking-[0.2em] rounded-2xl border border-white/10 hover:bg-white/20 transition-all">
                        <PencilIcon className="h-4 w-4"/> Editar
                    </button>
                    <button onClick={() => onDelete(proveedor)} className="flex items-center gap-2 px-6 py-3 bg-brand-red/10 border border-brand-red/20 text-brand-red font-black text-[10px] uppercase tracking-[0.2em] rounded-2xl hover:bg-brand-red hover:text-white transition-all shadow-gold-glow">
                        <TrashIcon className="h-4 w-4"/> Eliminar
                    </button>
                </div>
            </div>
        </div>
     );
};

const ProveedorCard: React.FC<{
    proveedor: Proveedor;
    onViewDetails: (p: Proveedor) => void;
    onAgendar: (id: string) => void;
}> = ({ proveedor, onViewDetails, onAgendar }) => {
    return (
        <div onClick={() => onViewDetails(proveedor)} className="bg-white/5 backdrop-blur-xl border border-white/5 rounded-[2rem] shadow-luxury p-6 flex flex-col h-full cursor-pointer hover:border-liquid-gold/30 hover:-translate-y-1 transition-all duration-300 group">
            <div className="flex-grow">
                <h3 className="font-black text-xl text-white pr-8 uppercase tracking-tight group-hover:text-liquid-gold transition-colors">{proveedor.nombre}</h3>
                <p className="text-[9px] font-black text-liquid-gold bg-liquid-gold/10 border border-liquid-gold/20 inline-block px-3 py-1 rounded-lg my-3 uppercase tracking-widest">{proveedor.categoria}</p>
                <p className="text-sm font-bold text-slate-400 mb-4 line-clamp-2 uppercase leading-relaxed">{proveedor.productos}</p>
            </div>
            <div className="mt-auto border-t border-white/5 pt-4 space-y-4">
                <div className="flex items-center gap-4 text-xs font-bold uppercase tracking-wider">
                    <a href={formatWhatsAppLink(proveedor.telefono)} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()} className="flex items-center gap-2 text-emerald-400 hover:text-emerald-300 transition-colors"><WhatsAppIcon className="w-4 h-4"/> <span>{proveedor.telefono}</span></a>
                    {proveedor.website && <a href={`http://${proveedor.website}`} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()} className="text-liquid-gold hover:text-white transition-colors truncate">Sitio Web</a>}
                </div>
                 <button onClick={(e) => { e.stopPropagation(); onAgendar(proveedor.id);}} className="w-full flex items-center justify-center gap-2 text-[10px] font-black px-4 py-3 bg-white/5 hover:bg-white/10 hover:border-white/20 border border-transparent rounded-xl text-white uppercase tracking-[0.2em] transition-all">
                    <CalendarDaysIcon className="w-4 h-4 text-liquid-gold"/> Agendar Tarea
                </button>
            </div>
        </div>
    );
};


const ProveedoresPage: React.FC = () => {
    const [proveedores, setProveedores] = useState<Proveedor[]>([]);
    const [tareas, setTareas] = useState<TareaProveedor[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('Todos');
    const [agendaSearch, setAgendaSearch] = useState('');
    const [agendaTab, setAgendaTab] = useState<'tareas' | 'mantenimiento'>('tareas');

    const [isFormModalOpen, setIsFormModalOpen] = useState(false);
    const [proveedorToEdit, setProveedorToEdit] = useState<Partial<Proveedor> | null>(null);
    const [proveedorToDelete, setProveedorToDelete] = useState<Proveedor | null>(null);
    const [viewingProveedor, setViewingProveedor] = useState<Proveedor | null>(null);
    
    const [newTarea, setNewTarea] = useState<Omit<TareaProveedor, 'id' | 'completada'>>({ proveedorId: '', titulo: '', tipo: 'General', descripcion: '', fechaVencimiento: '' });

    const agendaFormRef = useRef<HTMLFormElement>(null);

    const fetchData = async () => {
        setLoading(true);
        const [provData, tareasData] = await Promise.all([getProveedores(), getTareasProveedor()]);
        setProveedores(provData);
        setTareas(tareasData);
        setLoading(false);
    };

    useEffect(() => {
        fetchData();
    }, []);

    const kpis = useMemo(() => ({
        totalProveedores: proveedores.length,
        tareasPendientes: tareas.filter(t => !t.completada && t.tipo === 'General').length,
        mantenimientosPendientes: tareas.filter(t => !t.completada && t.tipo === 'Mantenimiento').length,
    }), [proveedores, tareas]);

    const categories = useMemo(() => ['Todos', ...Array.from(new Set(proveedores.map(p => p.categoria))).sort()], [proveedores]);

    const filteredProveedores = useMemo(() => {
        return proveedores
            .filter(p => categoryFilter === 'Todos' || p.categoria === categoryFilter)
            .filter(p => p.nombre.toLowerCase().includes(searchTerm.toLowerCase()) || p.contacto.toLowerCase().includes(searchTerm.toLowerCase()));
    }, [proveedores, searchTerm, categoryFilter]);


    const filteredAgendaItems = useMemo(() => {
        const lowerSearch = agendaSearch.toLowerCase();
        return tareas
            .filter(t => (agendaTab === 'tareas' ? t.tipo === 'General' : t.tipo === 'Mantenimiento'))
            .filter(t => {
                if (!agendaSearch) return true;
                const proveedor = proveedores.find(p => p.id === t.proveedorId);
                return proveedor?.nombre.toLowerCase().includes(lowerSearch) || 
                       t.titulo.toLowerCase().includes(lowerSearch);
            })
            .sort((a, b) => (a.completada ? 1 : -1) || new Date(a.fechaVencimiento).getTime() - new Date(b.fechaVencimiento).getTime());
    }, [tareas, agendaSearch, proveedores, agendaTab]);
    
    const handleAgendarParaProveedor = (proveedorId: string) => {
        setNewTarea(prev => ({ ...prev, proveedorId }));
        agendaFormRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    };

    const handleSaveProveedor = async (proveedor: Partial<Proveedor>) => {
        if (proveedor.id) await updateProveedor(proveedor.id, proveedor);
        else await createProveedor(proveedor as Omit<Proveedor, 'id' | 'creadoEn'>);
        setIsFormModalOpen(false);
        setProveedorToEdit(null);
        await fetchData();
    };
    
    const handleEditRequest = (proveedor: Proveedor) => {
        setViewingProveedor(null);
        setProveedorToEdit(proveedor);
        setIsFormModalOpen(true);
    };

    const handleDeleteRequest = (proveedor: Proveedor) => {
        setViewingProveedor(null);
        setProveedorToDelete(proveedor);
    };

    const handleDeleteConfirm = async () => {
        if (proveedorToDelete) {
            await deleteProveedor(proveedorToDelete.id);
            setProveedorToDelete(null);
            await fetchData();
        }
    };

    const handleAddTarea = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newTarea.proveedorId || !newTarea.titulo || !newTarea.fechaVencimiento) return;
        await createTareaProveedor(newTarea);
        setNewTarea({ proveedorId: '', titulo: '', tipo: 'General', descripcion: '', fechaVencimiento: '' });
        await fetchData();
    };

    const handleToggleTarea = async (tarea: TareaProveedor) => {
        await updateTareaProveedor(tarea.id, { completada: !tarea.completada });
        await fetchData();
    };
    
    const getProveedorNombre = (id: string) => proveedores.find(p => p.id === id)?.nombre || 'N/A';
    const isTareaVencida = (tarea: TareaProveedor) => !tarea.completada && new Date(tarea.fechaVencimiento) < new Date();

    return (
        <div className="space-y-10 animate-fade-in pb-20">
            <div className="p-6 lg:p-8 bg-white/5 backdrop-blur-xl border border-white/5 rounded-[2.5rem] lg:rounded-[3rem] shadow-luxury relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-liquid-gold/5 rounded-full blur-[80px] -mr-32 -mt-32 pointer-events-none"></div>
                <div className="flex flex-wrap justify-between items-end gap-6 relative z-10">
                    <div>
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] mb-2 italic">Directorio</p>
                        <h1 className="text-3xl lg:text-4xl font-black text-white uppercase tracking-tighter leading-tight">Red de <span className="text-gold-gradient italic">Proveedores</span></h1>
                    </div>
                    <button onClick={() => { setProveedorToEdit({}); setIsFormModalOpen(true); }} className="flex items-center gap-2 px-6 py-3 bg-liquid-gold text-brand-dark font-black text-[10px] uppercase tracking-[0.2em] rounded-2xl shadow-gold-glow hover:bg-white transition-all duration-500">
                        <UserPlusIcon className="h-5 w-5" />
                        <span>Nuevo Proveedor</span>
                    </button>
                </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <AgendaKpiCard title="Total Proveedores" value={kpis.totalProveedores} icon={BuildingStorefrontIcon} color="blue" />
                <AgendaKpiCard title="Tareas Pendientes" value={kpis.tareasPendientes} icon={CheckBadgeIcon} color="orange" />
                <AgendaKpiCard title="Mantenimientos Pend." value={kpis.mantenimientosPendientes} icon={WrenchScrewdriverIcon} color="purple" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Panel de Proveedores (Izquierda, más ancho) */}
                <div className="lg:col-span-7 bg-white/5 backdrop-blur-xl border border-white/5 rounded-[2.5rem] shadow-luxury p-8 flex flex-col h-full min-h-[600px]">
                    <div className="flex items-center gap-4 mb-6">
                        <div className="p-3 bg-white/5 rounded-xl border border-white/10"><BuildingStorefrontIcon className="w-6 h-6 text-liquid-gold" /></div>
                        <h2 className="text-2xl font-black text-white uppercase tracking-tighter">Directorio</h2>
                    </div>
                     <div className="flex flex-col md:flex-row gap-4 mb-8">
                        <div className="relative flex-grow">
                            <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500" />
                            <input type="text" placeholder="BUSCAR PROVEEDOR..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full pl-12 pr-4 py-4 bg-white/5 border border-white/10 rounded-2xl text-[11px] font-black text-white uppercase tracking-widest placeholder:text-slate-600 focus:border-liquid-gold/30 focus:bg-white/10 outline-none transition-all"/>
                        </div>
                        <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value as any)} className="py-4 px-6 bg-white/5 border border-white/10 rounded-2xl text-[11px] font-black text-white uppercase tracking-widest focus:border-liquid-gold/30 focus:bg-white/10 outline-none transition-all appearance-none cursor-pointer">
                            {categories.map(cat => <option key={cat} value={cat} className="bg-brand-dark">{cat}</option>)}
                        </select>
                    </div>
                     <div className="overflow-y-auto flex-grow grid grid-cols-1 md:grid-cols-2 gap-6 custom-scrollbar pr-2 pb-4">
                        {loading ? (
                            <div className="col-span-full flex flex-col items-center justify-center py-20 opacity-50">
                                <div className="w-12 h-12 border-4 border-liquid-gold/30 border-t-liquid-gold rounded-full animate-spin mb-4"></div>
                                <p className="text-[10px] font-black text-liquid-gold uppercase tracking-[0.2em]">Cargando Directorio...</p>
                            </div>
                        ) : filteredProveedores.map(p => (
                            <ProveedorCard 
                                key={p.id}
                                proveedor={p}
                                onViewDetails={setViewingProveedor}
                                onAgendar={handleAgendarParaProveedor}
                            />
                        ))}
                    </div>
                </div>

                {/* Panel de Agenda (Derecha) */}
                <div className="lg:col-span-5 bg-white/5 backdrop-blur-xl border border-white/5 rounded-[2.5rem] shadow-luxury flex flex-col h-full overflow-hidden">
                    <div className="p-8 border-b border-white/5 flex items-center gap-4">
                        <div className="p-3 bg-white/5 rounded-xl border border-white/10"><CalendarDaysIcon className="w-6 h-6 text-liquid-gold" /></div>
                        <h2 className="text-2xl font-black text-white uppercase tracking-tighter">Agenda Operativa</h2>
                    </div>

                    <form ref={agendaFormRef} onSubmit={handleAddTarea} className="p-6 m-6 bg-brand-dark/50 rounded-[2rem] border border-white/10 space-y-4">
                        <div className="flex items-center gap-2 mb-2">
                             <ClockIcon className="w-4 h-4 text-liquid-gold" />
                             <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Programar Nueva</h3>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                           <select value={newTarea.proveedorId} onChange={e => setNewTarea({...newTarea, proveedorId: e.target.value})} className="w-full p-3 bg-white/5 border border-white/10 rounded-xl text-xs font-bold text-white uppercase focus:border-liquid-gold/50 outline-none appearance-none" required><option value="" className="bg-brand-dark">PROVEEDOR...</option>{proveedores.map(p => <option key={p.id} value={p.id} className="bg-brand-dark">{p.nombre}</option>)}</select>
                           <select value={newTarea.tipo} onChange={e => setNewTarea({...newTarea, tipo: e.target.value as any})} className="w-full p-3 bg-white/5 border border-white/10 rounded-xl text-xs font-bold text-white uppercase focus:border-liquid-gold/50 outline-none appearance-none"><option value="General" className="bg-brand-dark">GENERAL</option><option value="Mantenimiento" className="bg-brand-dark">MANTENIMIENTO</option></select>
                        </div>
                        <input type="text" placeholder="TÍTULO DE LA TAREA..." value={newTarea.titulo} onChange={e => setNewTarea({...newTarea, titulo: e.target.value})} className="w-full p-3 bg-white/5 border border-white/10 rounded-xl text-xs font-bold text-white uppercase focus:border-liquid-gold/50 outline-none placeholder:text-slate-600" required/>
                        <textarea placeholder="DETALLES ADICIONALES..." value={newTarea.descripcion} onChange={e => setNewTarea({...newTarea, descripcion: e.target.value})} rows={2} className="w-full p-3 bg-white/5 border border-white/10 rounded-xl text-xs font-bold text-white uppercase focus:border-liquid-gold/50 outline-none placeholder:text-slate-600 resize-none" />
                        <div className="flex gap-4">
                            <input type="date" value={newTarea.fechaVencimiento} onChange={e => setNewTarea({...newTarea, fechaVencimiento: e.target.value})} className="flex-grow p-3 bg-white/5 border border-white/10 rounded-xl text-xs font-bold text-white uppercase focus:border-liquid-gold/50 outline-none [color-scheme:dark]" required/>
                            <button type="submit" className="px-6 py-3 bg-liquid-gold text-brand-dark font-black text-[10px] uppercase tracking-[0.2em] rounded-xl shadow-gold-glow hover:bg-white transition-all">Programar</button>
                        </div>
                    </form>
                    
                    <div className="px-8 border-b border-white/5">
                        <div className="flex gap-6">
                            <button onClick={() => setAgendaTab('tareas')} className={`py-4 font-black text-[10px] uppercase tracking-[0.2em] border-b-2 transition-all ${agendaTab==='tareas' ? 'border-liquid-gold text-liquid-gold' : 'border-transparent text-slate-500 hover:text-white'}`}>Generales</button>
                            <button onClick={() => setAgendaTab('mantenimiento')} className={`py-4 font-black text-[10px] uppercase tracking-[0.2em] border-b-2 transition-all ${agendaTab==='mantenimiento' ? 'border-liquid-gold text-liquid-gold' : 'border-transparent text-slate-500 hover:text-white'}`}>Mantenimientos</button>
                        </div>
                    </div>
                    
                    <div className="p-6">
                        <div className="relative">
                            <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                            <input type="text" placeholder="FILTRAR AGENDA..." value={agendaSearch} onChange={e => setAgendaSearch(e.target.value)} className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-[10px] font-black text-white uppercase tracking-widest placeholder:text-slate-600 focus:border-liquid-gold/30 outline-none"/>
                        </div>
                    </div>

                    <div className="overflow-y-auto px-6 pb-6 space-y-3 flex-grow custom-scrollbar">
                        {loading ? null : filteredAgendaItems.length > 0 ? filteredAgendaItems.map(t => (
                             <div key={t.id} className={`flex items-start gap-4 p-5 rounded-2xl border transition-all ${t.completada ? 'bg-white/5 border-transparent opacity-50 grayscale' : 'bg-brand-dark/50 border-white/10 hover:border-liquid-gold/30 shadow-luxury'}`}>
                                <label className="relative flex items-center cursor-pointer mt-1">
                                    <input type="checkbox" checked={t.completada} onChange={() => handleToggleTarea(t)} className="sr-only peer" />
                                    <div className="w-6 h-6 bg-white/5 border-2 border-white/20 rounded-md peer-checked:bg-liquid-gold peer-checked:border-liquid-gold transition-all flex items-center justify-center">
                                        <CheckBadgeIcon className={`w-4 h-4 text-brand-dark transition-opacity ${t.completada ? 'opacity-100' : 'opacity-0'}`} />
                                    </div>
                                </label>
                                <div className="flex-grow">
                                    <p className={`font-black text-sm uppercase mb-1 leading-tight ${t.completada ? 'line-through text-slate-500' : 'text-white'}`}>{t.titulo}</p>
                                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2">
                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest bg-white/5 px-2 py-0.5 rounded border border-white/5">{getProveedorNombre(t.proveedorId)}</p>
                                        <p className={`text-[9px] font-black uppercase tracking-widest flex items-center gap-1 ${isTareaVencida(t) ? 'text-brand-red bg-brand-red/10 px-2 py-0.5 rounded border border-brand-red/20' : t.completada ? 'text-slate-500' : 'text-liquid-gold'}`}>
                                            <CalendarDaysIcon className="w-3 h-3" /> VENCE: {formatDate(t.fechaVencimiento)}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )) : <div className="text-center py-10"><CheckBadgeIcon className="w-12 h-12 mx-auto mb-3 text-slate-600 opacity-50"/><p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Agenda Despejada.</p></div>}
                    </div>
                </div>
            </div>

            <ProveedorFormModal 
                isOpen={isFormModalOpen} 
                onClose={() => setIsFormModalOpen(false)} 
                onSave={handleSaveProveedor} 
                proveedorToEdit={proveedorToEdit} 
            />
             {viewingProveedor && (
                <ProveedorDetailModal 
                    proveedor={viewingProveedor}
                    onClose={() => setViewingProveedor(null)}
                    onEdit={handleEditRequest}
                    onDelete={handleDeleteRequest}
                />
            )}
            {proveedorToDelete && (
                <ConfirmationModal
                    proveedor={proveedorToDelete}
                    onConfirm={handleDeleteConfirm}
                    onCancel={() => setProveedorToDelete(null)}
                />
            )}
        </div>
    );
};

export default ProveedoresPage;