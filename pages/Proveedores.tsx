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

const AgendaKpiCard: React.FC<{ title: string; value: string | number; icon: React.FC<any>; color: 'blue' | 'orange' | 'purple' }> = ({ title, value, icon: Icon, color }) => {
    const colors = {
        blue: 'from-blue-500 to-blue-600',
        orange: 'from-orange-500 to-orange-600',
        purple: 'from-purple-500 to-purple-600',
    };
    return (
        <div className={`bg-gradient-to-br ${colors[color]} text-white p-5 rounded-xl shadow-lg`}>
            <div className="flex justify-between items-start">
                <div>
                    <p className="text-3xl font-bold">{value}</p>
                    <p className="text-sm opacity-80 mt-1">{title}</p>
                </div>
                <div className="bg-white/20 p-3 rounded-full">
                    <Icon className="h-6 w-6" />
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
    <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4" onClick={onCancel}>
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-sm" onClick={e => e.stopPropagation()}>
             <div className="p-6 text-center">
                 <ExclamationTriangleIcon className="mx-auto h-12 w-12 text-red-500" />
                 <h3 className="mt-4 text-lg font-bold text-gray-900 dark:text-white">Confirmar Eliminación</h3>
                 <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">¿Estás seguro de que quieres eliminar a <strong>{proveedor.nombre}</strong>? Esta acción no se puede deshacer.</p>
            </div>
             <div className="bg-gray-50 dark:bg-gray-700/50 px-6 py-4 flex justify-end gap-3 rounded-b-xl">
                 <button onClick={onCancel} className="px-4 py-2 bg-gray-200 text-gray-800 font-semibold rounded-lg hover:bg-gray-300">Cancelar</button>
                 <button onClick={onConfirm} className="px-4 py-2 bg-brand-red text-white font-semibold rounded-lg hover:bg-red-700">Eliminar</button>
            </div>
        </div>
    </div>
);

const InputField: React.FC<{ label: string; name: string; value: any; onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void; [key: string]: any; }> = ({ label, name, value, onChange, ...props }) => (
    <div>
        <label htmlFor={name} className="block text-sm font-medium text-gray-700 dark:text-gray-300">{label}</label>
        <input id={name} name={name} value={value} onChange={onChange} className="mt-1 block w-full p-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600" {...props} />
    </div>
);

const InfoItem: React.FC<{icon?: React.FC<any>, label: string, value: any, link?: string}> = ({ icon: Icon, label, value, link }) => (
    <div className="flex items-start">
        {Icon && <Icon className="h-5 w-5 text-gray-400 mr-3 mt-0.5 flex-shrink-0" />}
        <div>
            <p className="font-semibold text-gray-500 dark:text-gray-400">{label}</p>
            {link ? (
                <a href={link} target="_blank" rel="noopener noreferrer" className="text-brand-blue hover:underline break-words">{value || 'N/A'}</a>
            ) : (
                <p className="text-gray-800 dark:text-white break-words">{value || 'N/A'}</p>
            )}
        </div>
    </div>
);

const InfoBlock: React.FC<{label: string, value?: string}> = ({label, value}) => (
    <div>
        <p className="font-semibold text-gray-500 dark:text-gray-400 mb-1">{label}</p>
        <p className="text-gray-800 dark:text-white p-3 bg-gray-50 dark:bg-gray-700/50 rounded-md">{value || 'No hay información.'}</p>
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
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4 animate-fade-in" onClick={onClose}>
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center p-5 border-b border-gray-200 dark:border-gray-700">
                    <h2 className="text-xl font-bold">{formData.id ? 'Editar Proveedor' : 'Nuevo Proveedor'}</h2>
                    <button onClick={onClose}><CloseIcon className="w-6 h-6 text-gray-500" /></button>
                </div>
                <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <InputField label="Nombre del Proveedor" name="nombre" value={formData.nombre || ''} onChange={handleChange} required />
                        <InputField label="Categoría" name="categoria" value={formData.categoria || ''} onChange={handleChange} required />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                         <InputField label="Persona de Contacto" name="contacto" value={formData.contacto || ''} onChange={handleChange} required />
                        <InputField label="Teléfono (para WhatsApp)" name="telefono" value={formData.telefono || ''} onChange={handleChange} required />
                    </div>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <InputField label="Ciudad" name="ciudad" value={formData.ciudad || ''} onChange={handleChange} />
                        <InputField label="Sitio Web (ej: dominio.com)" name="website" value={formData.website || ''} onChange={handleChange} />
                    </div>
                    <div>
                        <label className="block text-sm font-medium">Productos Principales</label>
                        <textarea name="productos" value={formData.productos || ''} onChange={handleChange} rows={2} className="mt-1 w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"></textarea>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium">Tipo</label>
                            <select name="tipo" value={formData.tipo || 'Producto'} onChange={handleChange} className="mt-1 w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600">
                                <option value="Producto">Producto</option>
                                <option value="Servicio">Servicio</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium">Estado</label>
                            <select name="estado" value={formData.estado || 'Activo'} onChange={handleChange} className="mt-1 w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600">
                                <option value="Activo">Activo</option>
                                <option value="Inactivo">Inactivo</option>
                            </select>
                        </div>
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

const ProveedorDetailModal: React.FC<{
    proveedor: Proveedor;
    onClose: () => void;
    onEdit: (p: Proveedor) => void;
    onDelete: (p: Proveedor) => void;
}> = ({ proveedor, onClose, onEdit, onDelete }) => {
     return (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4 animate-fade-in" onClick={onClose}>
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-start p-6 border-b dark:border-gray-700">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{proveedor.nombre}</h2>
                        <p className="text-sm font-semibold text-purple-600">{proveedor.categoria}</p>
                    </div>
                    <button onClick={onClose}><CloseIcon className="w-6 h-6 text-gray-500 hover:text-gray-800" /></button>
                </div>
                <div className="p-6 overflow-y-auto space-y-4 text-sm">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <InfoItem icon={PhoneIcon} label="Teléfono" value={proveedor.telefono} link={`tel:${proveedor.telefono}`} />
                        <InfoItem icon={EnvelopeIcon} label="Email" value={proveedor.email} link={proveedor.email ? `mailto:${proveedor.email}`: undefined} />
                        <InfoItem icon={GlobeAltIcon} label="Sitio Web" value={proveedor.website} link={proveedor.website ? `http://${proveedor.website}`: undefined} />
                        <InfoItem icon={MapPinIcon} label="Ubicación" value={proveedor.direccion ? `${proveedor.direccion}, ${proveedor.ciudad}`: proveedor.ciudad} />
                    </div>
                    <InfoBlock label="Productos Principales" value={proveedor.productos} />
                    <InfoBlock label="Notas" value={proveedor.notas} />
                    <div className="grid grid-cols-2 gap-4 pt-2">
                       <InfoItem label="Tipo" value={proveedor.tipo} />
                       <InfoItem label="Estado" value={<span className={`px-2 py-1 text-xs font-semibold rounded-full ${proveedor.estado === 'Activo' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{proveedor.estado}</span>} />
                    </div>
                </div>
                <div className="flex justify-end gap-3 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-b-xl mt-auto">
                    <button onClick={() => onEdit(proveedor)} className="flex items-center gap-2 px-4 py-2 bg-gray-200 text-gray-800 font-semibold rounded-lg hover:bg-gray-300">
                        <PencilIcon className="h-5 w-5"/> Editar
                    </button>
                    <button onClick={() => onDelete(proveedor)} className="flex items-center gap-2 px-4 py-2 bg-red-100 text-brand-red font-semibold rounded-lg hover:bg-red-200">
                        <TrashIcon className="h-5 w-5"/> Eliminar
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
        <div onClick={() => onViewDetails(proveedor)} className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-5 flex flex-col h-full cursor-pointer hover:shadow-lg hover:-translate-y-1 transition-all duration-200">
            <div className="flex-grow">
                <h3 className="font-bold text-lg text-gray-900 dark:text-white pr-8">{proveedor.nombre}</h3>
                <p className="text-xs font-semibold text-purple-600 bg-purple-100 dark:bg-purple-900/50 dark:text-purple-300 inline-block px-2 py-0.5 rounded-full my-2">{proveedor.categoria}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">{proveedor.productos}</p>
            </div>
            <div className="mt-auto border-t dark:border-gray-700 pt-3 space-y-3">
                <div className="flex items-center gap-3 text-sm">
                    <a href={formatWhatsAppLink(proveedor.telefono)} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()} className="flex items-center gap-1.5 text-green-600 hover:underline"><WhatsAppIcon className="w-4 h-4"/> <span>{proveedor.telefono}</span></a>
                    {proveedor.website && <a href={`http://${proveedor.website}`} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()} className="text-blue-600 hover:underline truncate">Website</a>}
                </div>
                 <button onClick={(e) => { e.stopPropagation(); onAgendar(proveedor.id);}} className="w-full flex items-center justify-center gap-1.5 text-sm px-3 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-md font-semibold text-gray-700 dark:text-gray-200 transition-colors">
                    <CalendarDaysIcon className="w-4 h-4"/> Agendar Tarea
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
        <div className="space-y-8">
            <div className="flex flex-wrap justify-between items-center gap-4">
                <h1 className="text-3xl font-bold">Gestión de Proveedores</h1>
                <button onClick={() => { setProveedorToEdit({}); setIsFormModalOpen(true); }} className="flex items-center gap-2 px-4 py-2 bg-brand-blue text-white font-semibold rounded-lg shadow-md hover:bg-blue-700">
                    <UserPlusIcon className="h-5 w-5" />
                    <span>Nuevo Proveedor</span>
                </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <AgendaKpiCard title="Total Proveedores" value={kpis.totalProveedores} icon={BuildingStorefrontIcon} color="blue" />
                <AgendaKpiCard title="Tareas Pendientes" value={kpis.tareasPendientes} icon={CheckBadgeIcon} color="orange" />
                <AgendaKpiCard title="Mantenimientos Pend." value={kpis.mantenimientosPendientes} icon={WrenchScrewdriverIcon} color="purple" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 space-y-4 flex flex-col">
                    <h2 className="text-xl font-bold">Lista de Proveedores</h2>
                     <div className="flex flex-col md:flex-row gap-4">
                        <input type="text" placeholder="Buscar..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="flex-grow p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"/>
                        <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value as any)} className="p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600">
                            {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                        </select>
                    </div>
                     <div className="overflow-auto max-h-[70vh] flex-grow grid grid-cols-1 md:grid-cols-2 gap-4 -mr-2 pr-2">
                        {loading ? <p>Cargando...</p> : filteredProveedores.map(p => (
                            <ProveedorCard 
                                key={p.id}
                                proveedor={p}
                                onViewDetails={setViewingProveedor}
                                onAgendar={handleAgendarParaProveedor}
                            />
                        ))}
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 space-y-4 flex flex-col">
                    <h2 className="text-xl font-bold">Agenda y Mantenimiento</h2>
                    <form ref={agendaFormRef} onSubmit={handleAddTarea} className="space-y-3 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg border-2 border-dashed dark:border-gray-600">
                        <div className="grid grid-cols-2 gap-3">
                           <select value={newTarea.proveedorId} onChange={e => setNewTarea({...newTarea, proveedorId: e.target.value})} className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600" required><option value="">Seleccionar Proveedor</option>{proveedores.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}</select>
                           <select value={newTarea.tipo} onChange={e => setNewTarea({...newTarea, tipo: e.target.value as any})} className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"><option value="General">Tarea General</option><option value="Mantenimiento">Mantenimiento</option></select>
                        </div>
                        <input type="text" placeholder="Título de la tarea..." value={newTarea.titulo} onChange={e => setNewTarea({...newTarea, titulo: e.target.value})} className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600" required/>
                        <textarea placeholder="Descripción adicional..." value={newTarea.descripcion} onChange={e => setNewTarea({...newTarea, descripcion: e.target.value})} rows={2} className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600" />
                        <div className="flex gap-3"><input type="date" value={newTarea.fechaVencimiento} onChange={e => setNewTarea({...newTarea, fechaVencimiento: e.target.value})} className="flex-grow p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600" required/><button type="submit" className="px-4 py-2 bg-brand-red text-white font-semibold rounded-lg hover:bg-red-700">Agregar</button></div>
                    </form>
                    
                    <div className="border-b border-gray-200 dark:border-gray-700"><div className="flex -mb-px"><button onClick={() => setAgendaTab('tareas')} className={`py-2 px-4 font-semibold text-sm border-b-2 ${agendaTab==='tareas' ? 'border-brand-blue text-brand-blue' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>Tareas Generales</button><button onClick={() => setAgendaTab('mantenimiento')} className={`py-2 px-4 font-semibold text-sm border-b-2 ${agendaTab==='mantenimiento' ? 'border-brand-blue text-brand-blue' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>Mantenimientos</button></div></div>
                    <input type="text" placeholder="Buscar en agenda..." value={agendaSearch} onChange={e => setAgendaSearch(e.target.value)} className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"/>

                    <div className="overflow-auto max-h-[40vh] space-y-2 flex-grow">
                        {loading ? <p>Cargando...</p> : filteredAgendaItems.length > 0 ? filteredAgendaItems.map(t => (
                             <div key={t.id} className={`flex items-start gap-3 p-3 rounded-md ${t.completada ? 'bg-gray-100 dark:bg-gray-800 opacity-60' : 'bg-blue-50 dark:bg-blue-900/40'}`}>
                                <input type="checkbox" checked={t.completada} onChange={() => handleToggleTarea(t)} className="h-5 w-5 mt-1 rounded text-brand-blue focus:ring-brand-blue flex-shrink-0"/>
                                <div className="flex-grow"><p className={`font-semibold ${t.completada ? 'line-through text-gray-500' : ''}`}>{t.titulo}</p><p className={`text-xs ${t.completada ? 'text-gray-400' : 'text-gray-500'}`}><span className="font-semibold">{getProveedorNombre(t.proveedorId)}</span> -<span className={isTareaVencida(t) ? 'text-red-500 font-bold' : ''}> Vence: {formatDate(t.fechaVencimiento)}</span></p></div>
                            </div>
                        )) : <p className="text-center text-gray-500 py-4">No hay {agendaTab === 'tareas' ? 'tareas' : 'mantenimientos'} que coincidan.</p>}
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