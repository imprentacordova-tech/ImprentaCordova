import React, { useState, useEffect, useMemo } from 'react';
import { getUsers, updateUser, createUser } from '../services/mockApi';
import { User } from '../types';
import { UsersIcon, UserPlusIcon, ExclamationTriangleIcon, PencilIcon, SearchIcon, CloseIcon, ArrowUpIcon, ArrowDownIcon, ShieldCheckIcon } from '../components/Icons';
import { formatDate } from '../utils';

type SortKey = keyof User;

const KpiCard: React.FC<{ title: string; value: string | number; icon: React.FC<any>; color: 'blue' | 'green' | 'red' }> = ({ title, value, icon: Icon, color }) => {
    // Override color parameter to match Obsidian & Gold unified theme
    // We use subtle luxury gradients or simple glass backgrounds based on the design system
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

const ConfirmationModal: React.FC<{ user: User; onConfirm: () => void; onCancel: () => void; }> = ({ user, onConfirm, onCancel }) => {
    const isActivating = user.estado === 'Inactivo';
    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-[100] flex justify-center items-center p-4 animate-fade-in" onClick={onCancel}>
            <div className="bg-brand-dark/95 backdrop-blur-xl rounded-[2.5rem] shadow-luxury border border-white/10 w-full max-w-md animate-slide-up" onClick={e => e.stopPropagation()}>
                <div className="p-8 text-center">
                    <div className={`mx-auto w-20 h-20 rounded-full flex items-center justify-center mb-6 shadow-gold-glow ${isActivating ? 'bg-emerald-500/10 text-emerald-400' : 'bg-brand-red/10 text-brand-red'}`}>
                        <ExclamationTriangleIcon className="h-10 w-10" />
                    </div>
                    <h3 className="text-2xl font-black text-white uppercase tracking-tighter">
                        ¿Estás seguro?
                    </h3>
                    <p className="mt-4 text-sm text-slate-400 font-bold uppercase tracking-wider">
                        Vas a {isActivating ? 'activar' : 'desactivar'} al usuario <span className="text-liquid-gold">{user.nombre}</span>.
                    </p>
                </div>
                <div className="p-6 bg-white/5 flex justify-center gap-4 border-t border-white/5 rounded-b-[2.5rem]">
                    <button onClick={onCancel} className="px-6 py-3 bg-white/10 text-white font-black text-[10px] uppercase tracking-[0.2em] rounded-2xl border border-white/10 hover:bg-white/20 transition-all">Cancelar</button>
                    <button onClick={onConfirm} className={`px-6 py-3 font-black text-[10px] uppercase tracking-[0.2em] rounded-2xl shadow-gold-glow transition-all ${isActivating ? 'bg-emerald-500 text-white hover:bg-emerald-400' : 'bg-brand-red text-white hover:bg-red-500'}`}>
                        Confirmar
                    </button>
                </div>
            </div>
        </div>
    );
};

const UserFormModal: React.FC<{
    user: Partial<User> | null;
    onClose: () => void;
    onSave: (user: Partial<User>) => void;
}> = ({ user, onClose, onSave }) => {
    const [formData, setFormData] = useState<Partial<User>>({});
    useEffect(() => {
        setFormData(user || { nombre: '', email: '', rol: 'Operador', estado: 'Activo', requirePassword: false, password: '' });
    }, [user]);

    if (!user) return null;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        if (type === 'checkbox') {
             setFormData({ ...formData, [name]: (e.target as HTMLInputElement).checked });
        } else {
             setFormData({ ...formData, [name]: value });
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(formData);
    };

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-[100] flex justify-center items-center p-4 animate-fade-in" onClick={onClose}>
            <div className="bg-brand-dark/95 backdrop-blur-xl rounded-[2.5rem] shadow-luxury border border-white/10 w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh] animate-slide-up" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center p-8 border-b border-white/5 bg-white/5">
                    <h2 className="text-2xl font-black text-white uppercase tracking-tighter">{formData.id ? 'Editar Usuario' : 'Crear Usuario'}</h2>
                    <button onClick={onClose} className="p-2 bg-white/5 hover:bg-brand-red/20 text-slate-400 hover:text-brand-red rounded-full transition-all border border-transparent hover:border-brand-red/30"><CloseIcon className="w-6 h-6" /></button>
                </div>
                <form onSubmit={handleSubmit} className="p-8 space-y-6 overflow-y-auto custom-scrollbar">
                    <div>
                        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-2">Nombre</label>
                        <input type="text" name="nombre" value={formData.nombre || ''} onChange={handleChange} required className="w-full p-4 bg-white/5 border border-white/10 rounded-2xl text-sm font-bold text-white uppercase focus:border-liquid-gold/50 focus:bg-white/10 outline-none transition-all" />
                    </div>
                    <div>
                        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-2">Email</label>
                        <input type="email" name="email" value={formData.email || ''} onChange={handleChange} required className="w-full p-4 bg-white/5 border border-white/10 rounded-2xl text-sm font-bold text-white uppercase focus:border-liquid-gold/50 focus:bg-white/10 outline-none transition-all" />
                    </div>
                    <div>
                        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-2">Rol</label>
                        <select name="rol" value={formData.rol || 'Operador'} onChange={handleChange} className="w-full p-4 bg-white/5 border border-white/10 rounded-2xl text-sm font-bold text-white uppercase focus:border-liquid-gold/50 focus:bg-white/10 outline-none transition-all appearance-none cursor-pointer">
                            <option value="Admin" className="bg-brand-dark">Admin</option>
                            <option value="Operador" className="bg-brand-dark">Operador</option>
                            <option value="Diseñador" className="bg-brand-dark">Diseñador</option>
                        </select>
                    </div>

                    <div className="pt-6 border-t border-white/5">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-[10px] font-black text-liquid-gold uppercase tracking-[0.2em] flex items-center gap-2">
                                <ShieldCheckIcon className="w-4 h-4"/> Seguridad
                            </h3>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input 
                                    type="checkbox" 
                                    name="requirePassword" 
                                    checked={formData.requirePassword || false} 
                                    onChange={handleChange} 
                                    className="sr-only peer" 
                                />
                                <div className="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-brand-dark after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-slate-400 peer-checked:after:bg-brand-dark after:border-transparent after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-liquid-gold shadow-inner border border-white/5"></div>
                                <span className="ml-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Habilitar Contraseña</span>
                            </label>
                        </div>

                        {formData.requirePassword && (
                            <div className="animate-fade-in bg-liquid-gold/5 p-5 rounded-2xl border border-liquid-gold/20">
                                <label className="block text-[10px] font-black text-liquid-gold uppercase tracking-[0.2em] mb-2">Contraseña de Acceso</label>
                                <input 
                                    type="text"
                                    name="password" 
                                    value={formData.password || ''} 
                                    onChange={handleChange} 
                                    placeholder="ESTABLECER CONTRASEÑA"
                                    className="w-full p-4 bg-brand-dark border border-liquid-gold/30 rounded-xl text-sm font-bold text-white focus:border-liquid-gold focus:bg-brand-dark outline-none transition-all" 
                                />
                                <p className="text-[9px] text-liquid-gold/70 font-bold uppercase mt-3 tracking-widest leading-relaxed">
                                    Este usuario deberá ingresar esta contraseña al iniciar sesión en el taller o dashboard.
                                </p>
                            </div>
                        )}
                    </div>

                    <div className="flex justify-end pt-6 gap-4 border-t border-white/5">
                        <button type="button" onClick={onClose} className="px-6 py-3 bg-white/5 text-white font-black text-[10px] uppercase tracking-[0.2em] rounded-2xl hover:bg-white/10 transition-all border border-white/5">Cancelar</button>
                        <button type="submit" className="px-6 py-3 bg-liquid-gold text-brand-dark font-black text-[10px] uppercase tracking-[0.2em] rounded-2xl shadow-gold-glow hover:bg-white transition-all">Guardar Usuario</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const SortableHeader: React.FC<{
    column: SortKey;
    label: string;
    sortConfig: { key: SortKey; direction: 'asc' | 'desc' };
    requestSort: (key: SortKey) => void;
    className?: string;
}> = ({ column, label, sortConfig, requestSort, className = '' }) => {
    const isSorted = sortConfig.key === column;
    const directionIcon = isSorted ? (
        sortConfig.direction === 'asc' ? <ArrowUpIcon className="h-4 w-4 ml-2 transition-transform text-liquid-gold" /> : <ArrowDownIcon className="h-4 w-4 ml-2 transition-transform text-liquid-gold" />
    ) : <div className="h-4 w-4 ml-2 opacity-0"></div>;

    return (
        <th scope="col" className={`px-6 py-5 text-left text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] bg-white/5 border-b border-white/5 ${className}`}>
            <button onClick={() => requestSort(column)} className="flex items-center group focus:outline-none w-full">
                <span className="group-hover:text-white transition-colors">{label}</span>
                <span className={`transition-opacity ${isSorted ? 'opacity-100' : 'opacity-0 group-hover:opacity-50'}`}>
                    {directionIcon}
                </span>
            </button>
        </th>
    );
};


const GestionUsuariosPage: React.FC = () => {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [sortConfig, setSortConfig] = useState<{ key: SortKey; direction: 'asc' | 'desc' }>({ key: 'nombre', direction: 'asc' });
    
    const [editingUser, setEditingUser] = useState<Partial<User> | null>(null);
    const [userToToggle, setUserToToggle] = useState<User | null>(null);

    const fetchUsers = async () => {
        setLoading(true);
        const usersData = await getUsers();
        setUsers(usersData);
        setLoading(false);
    };

    useEffect(() => {
        fetchUsers();
    }, []);
    
    const requestSort = (key: SortKey) => {
        let direction: 'asc' | 'desc' = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    const kpis = useMemo(() => ({
        total: users.length,
        activos: users.filter(u => u.estado === 'Activo').length,
        inactivos: users.filter(u => u.estado === 'Inactivo').length,
    }), [users]);

    const filteredAndSortedUsers = useMemo(() => {
        return [...users]
            .filter(u => u.nombre.toLowerCase().includes(searchTerm.toLowerCase()) || u.email.toLowerCase().includes(searchTerm.toLowerCase()))
            .sort((a, b) => {
                const aVal = a[sortConfig.key] ?? '';
                const bVal = b[sortConfig.key] ?? '';
                if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
                if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
                return 0;
            });
    }, [users, searchTerm, sortConfig]);

    const handleSaveUser = async (user: Partial<User>) => {
        if (user.id) {
            await updateUser(user.id, user);
        } else {
            await createUser(user as any);
        }
        setEditingUser(null);
        await fetchUsers();
    };

    const handleToggleStatus = async () => {
        if (!userToToggle) return;
        const newStatus = userToToggle.estado === 'Activo' ? 'Inactivo' : 'Activo';
        await updateUser(userToToggle.id, { estado: newStatus });
        setUserToToggle(null);
        await fetchUsers();
    };
    
    return (
        <div className="space-y-10 animate-fade-in pb-20">
            <div className="p-6 lg:p-8 bg-white/5 backdrop-blur-xl border border-white/5 rounded-[2.5rem] lg:rounded-[3rem] shadow-luxury relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-liquid-gold/5 rounded-full blur-[80px] -mr-32 -mt-32 pointer-events-none"></div>
                <div className="flex flex-wrap justify-between items-end gap-6 relative z-10">
                    <div>
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] mb-2 italic">Administración</p>
                        <h1 className="text-3xl lg:text-4xl font-black text-white uppercase tracking-tighter leading-tight">Gestión de <span className="text-gold-gradient italic">Usuarios</span></h1>
                    </div>
                    <button onClick={() => setEditingUser({})} className="flex items-center gap-2 px-6 py-3 bg-liquid-gold text-brand-dark font-black text-[10px] uppercase tracking-[0.2em] rounded-2xl shadow-gold-glow hover:bg-white transition-all duration-500">
                        <UserPlusIcon className="h-5 w-5" />
                        <span>Nuevo Usuario</span>
                    </button>
                </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <KpiCard title="Total Usuarios" value={kpis.total} icon={UsersIcon} color="blue" />
                <KpiCard title="Usuarios Activos" value={kpis.activos} icon={ShieldCheckIcon} color="green" />
                <KpiCard title="Usuarios Inactivos" value={kpis.inactivos} icon={ExclamationTriangleIcon} color="red" />
            </div>

            <div className="bg-white/5 backdrop-blur-xl border border-white/5 rounded-[2.5rem] shadow-luxury overflow-hidden">
                <div className="p-6 border-b border-white/5">
                    <div className="relative max-w-md">
                        <SearchIcon className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500" />
                        <input type="text" placeholder="BUSCAR USUARIOS..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full pl-12 pr-6 py-4 bg-white/5 border border-white/5 rounded-2xl text-[11px] font-black text-white uppercase tracking-widest placeholder:text-slate-600 focus:border-liquid-gold/30 focus:bg-white/10 outline-none transition-all duration-500" />
                    </div>
                </div>
                <div className="overflow-x-auto custom-scrollbar">
                    <table className="min-w-full">
                        <thead>
                             <tr>
                                <SortableHeader column="nombre" label="Nombre" sortConfig={sortConfig} requestSort={requestSort} />
                                <SortableHeader column="email" label="Email" sortConfig={sortConfig} requestSort={requestSort} />
                                <SortableHeader column="rol" label="Rol" sortConfig={sortConfig} requestSort={requestSort} />
                                <th scope="col" className="px-6 py-5 text-left text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] bg-white/5 border-b border-white/5">Seguridad</th>
                                <SortableHeader column="ultimoAcceso" label="Último Acceso" sortConfig={sortConfig} requestSort={requestSort} />
                                <th scope="col" className="px-6 py-5 text-left text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] bg-white/5 border-b border-white/5">Estado</th>
                                <th scope="col" className="px-6 py-5 text-right text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] bg-white/5 border-b border-white/5">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {loading ? (
                                <tr><td colSpan={7} className="text-center py-20 text-slate-500 font-bold uppercase tracking-widest"><div className="w-8 h-8 border-4 border-liquid-gold/30 border-t-liquid-gold rounded-full animate-spin mx-auto mb-4"></div>Cargando usuarios...</td></tr>
                            ) : filteredAndSortedUsers.length === 0 ? (
                                <tr><td colSpan={7} className="text-center py-20 text-slate-500 font-bold uppercase tracking-widest">No se encontraron usuarios.</td></tr>
                            ) : filteredAndSortedUsers.map((user, idx) => (
                                <tr key={user.id} className="hover:bg-white/5 transition-colors group">
                                    <td className="px-6 py-5 whitespace-nowrap text-sm font-black text-white">{user.nombre}</td>
                                    <td className="px-6 py-5 whitespace-nowrap text-xs font-bold text-slate-400 uppercase tracking-wider">{user.email}</td>
                                    <td className="px-6 py-5 whitespace-nowrap">
                                        <span className={`px-3 py-1 text-[9px] font-black uppercase tracking-widest rounded-lg border ${user.rol === 'Admin' ? 'bg-liquid-gold/10 text-liquid-gold border-liquid-gold/20' : 'bg-white/5 text-slate-300 border-white/10'}`}>{user.rol}</span>
                                    </td>
                                    <td className="px-6 py-5 whitespace-nowrap text-sm">
                                        {user.requirePassword ? (
                                            <span className="flex items-center gap-2 text-emerald-400 font-black text-[10px] uppercase tracking-widest bg-emerald-500/10 px-3 py-1 rounded-lg border border-emerald-500/20 w-max">
                                                <ShieldCheckIcon className="w-4 h-4"/> Protegido
                                            </span>
                                        ) : (
                                            <span className="text-slate-600 font-bold text-[10px] uppercase tracking-widest">Sin contraseña</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-5 whitespace-nowrap text-xs font-bold text-slate-400 uppercase tracking-widest">{formatDate(user.ultimoAcceso)}</td>
                                    <td className="px-6 py-5 whitespace-nowrap">
                                        <label className="relative inline-flex items-center cursor-pointer">
                                            <input type="checkbox" checked={user.estado === 'Activo'} onChange={() => setUserToToggle(user)} className="sr-only peer" />
                                            <div className="w-11 h-6 bg-white/10 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-brand-dark after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-slate-400 peer-checked:after:bg-brand-dark after:border-transparent after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-liquid-gold shadow-inner border border-white/5"></div>
                                        </label>
                                    </td>
                                    <td className="px-6 py-5 whitespace-nowrap text-right">
                                        <button onClick={() => setEditingUser(user)} className="p-3 text-slate-400 hover:text-liquid-gold hover:bg-liquid-gold/10 rounded-xl transition-all border border-transparent hover:border-liquid-gold/20 mr-2"><PencilIcon className="h-5 w-5" /></button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {editingUser && <UserFormModal user={editingUser} onClose={() => setEditingUser(null)} onSave={handleSaveUser} />}
            {userToToggle && <ConfirmationModal user={userToToggle} onConfirm={handleToggleStatus} onCancel={() => setUserToToggle(null)} />}
        </div>
    );
};

export default GestionUsuariosPage;
