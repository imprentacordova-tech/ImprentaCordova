import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../services/supabase';
import { User } from '../types';
import { useOutletContext } from 'react-router-dom';
import { logActivity } from '../services/activityLogService';
import { 
    UsersIcon, UserPlusIcon, ExclamationTriangleIcon, PencilIcon, SearchIcon, 
    CloseIcon, ArrowUpIcon, ArrowDownIcon, ShieldCheckIcon, SparklesIcon, KeyIcon,
    Loader2Icon
} from '../components/Icons';
import { formatDate } from '../utils';
import { motion, AnimatePresence } from 'framer-motion';

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

const UserFormModal: React.FC<{ user: Partial<User> | null; onClose: () => void; onSave: (user: Partial<User>) => void; }> = ({ user, onClose, onSave }) => {
    const [formData, setFormData] = useState<Partial<User>>({});
    useEffect(() => {
        setFormData(user || { nombre: '', email: '', rol: 'Operador', estado: 'Activo', requirePassword: false, password: '' });
    }, [user]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(formData);
    };

    if (!user) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[100] flex justify-center items-center p-6">
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />
                <motion.div 
                    initial={{ scale: 0.95, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.95, opacity: 0, y: 20 }}
                    className="bg-white w-full max-w-lg overflow-hidden flex flex-col relative z-10 border border-slate-200 shadow-2xl rounded-[3rem]" 
                    onClick={e => e.stopPropagation()}
                >
                    <div className="p-10 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                        <div>
                            <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight">{formData.id ? 'Editar' : 'Nuevo'} <span className="text-brand-blue">Perfil</span></h2>
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.4em] mt-1">Gstión de Accesos de Personal</p>
                        </div>
                        <button onClick={onClose} className="p-3 bg-white hover:bg-slate-50 text-slate-400 border border-slate-200 rounded-xl transition-all"><CloseIcon className="w-6 h-6"/></button>
                    </div>

                    <form onSubmit={handleSubmit} className="p-10 space-y-8 overflow-y-auto custom-scrollbar">
                        <div className="space-y-6">
                            <div className="group/field">
                                <label className="block text-[9px] font-black text-slate-400 uppercase tracking-[0.3em] mb-3 ml-1">Nombre Completo</label>
                                <input type="text" value={formData.nombre || ''} onChange={e => setFormData({...formData, nombre: e.target.value})} required className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:border-brand-blue outline-none transition-all font-bold text-slate-900" placeholder="Ej. Juan Pérez" />
                            </div>
                            <div className="group/field">
                                <label className="block text-[9px] font-black text-slate-400 uppercase tracking-[0.3em] mb-3 ml-1">Correo Electrónico</label>
                                <input type="email" value={formData.email || ''} onChange={e => setFormData({...formData, email: e.target.value})} required className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:border-brand-blue outline-none transition-all font-bold text-slate-900" placeholder="correo@ejemplo.com" />
                            </div>
                            <div className="group/field">
                                <label className="block text-[9px] font-black text-slate-400 uppercase tracking-[0.3em] mb-3 ml-1">Rol en el Sistema</label>
                                <select value={formData.rol || 'Operador'} onChange={e => setFormData({...formData, rol: e.target.value as any})} className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:border-brand-blue outline-none transition-all font-bold text-slate-900 appearance-none cursor-pointer">
                                    <option value="Admin">ADMINISTRADOR</option>
                                    <option value="Operador">OPERADOR</option>
                                    <option value="Diseñador">DISEÑADOR</option>
                                </select>
                            </div>
                        </div>

                        <div className="pt-8 border-t border-slate-100 space-y-6">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <KeyIcon className="w-5 h-5 text-brand-blue" />
                                    <span className="text-[10px] font-black text-slate-900 uppercase tracking-widest">Protección de Cuenta</span>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input 
                                        type="checkbox" 
                                        checked={formData.requirePassword || false} 
                                        onChange={e => setFormData({...formData, requirePassword: e.target.checked})} 
                                        className="sr-only peer" 
                                    />
                                    <div className="w-11 h-6 bg-slate-200 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-blue shadow-inner"></div>
                                </label>
                            </div>

                            {formData.requirePassword && (
                                <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-brand-blue/5 p-6 rounded-2xl border border-brand-blue/10">
                                    <label className="block text-[9px] font-black text-brand-blue uppercase tracking-[0.3em] mb-3">Establecer Contraseña</label>
                                    <input 
                                        type="text" value={formData.password || ''} 
                                        onChange={e => setFormData({...formData, password: e.target.value})} 
                                        placeholder="CONTRASEÑA MAESTRA"
                                        className="w-full p-4 bg-white border border-brand-blue/20 rounded-xl text-sm font-black text-slate-900 focus:border-brand-blue outline-none transition-all" 
                                    />
                                </motion.div>
                            )}
                        </div>
                    </form>

                    <div className="p-10 border-t border-slate-100 bg-slate-50/50 flex justify-between items-center">
                        <button type="button" onClick={onClose} className="text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-slate-900 transition-colors">Cancelar</button>
                        <button onClick={handleSubmit} className="px-12 py-5 bg-brand-blue text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-lg shadow-brand-blue/20 active:scale-95 transition-all">Sincronizar Perfil</button>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

const GestionUsuariosPage: React.FC = () => {
    const { currentUser } = useOutletContext<{ currentUser: User }>();
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [sortConfig, setSortConfig] = useState<{ key: keyof User; direction: 'asc' | 'desc' }>({ key: 'nombre', direction: 'asc' });
    
    const [editingUser, setEditingUser] = useState<Partial<User> | null>(null);

    const fetchUsers = async () => {
        setLoading(true);
        const { data, error } = await supabase.from('users').select('*').order('nombre', { ascending: true });
        if (!error && data) {
            const mappedUsers = data.map((u: any) => ({
                id: u.id,
                nombre: u.nombre,
                email: u.email,
                rol: u.rol,
                estado: u.estado,
                ultimoAcceso: u.ultimo_acceso,
                requirePassword: u.require_password,
                password: u.password
            }));
            setUsers(mappedUsers as User[]);
        }
        setLoading(false);
    };

    useEffect(() => { fetchUsers(); }, []);
    
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
        const dbUser = {
            nombre: user.nombre,
            email: user.email,
            rol: user.rol,
            estado: user.estado,
            require_password: user.requirePassword,
            password: user.password
        };

        if (user.id) {
            await supabase.from('users').update(dbUser).eq('id', user.id);
            logActivity(currentUser.nombre, currentUser.rol, 'USUARIO_MODIFICADO', `Modificó al usuario ${user.nombre}`, 'Seguridad');
        } else {
            await supabase.from('users').insert([dbUser]);
            logActivity(currentUser.nombre, currentUser.rol, 'USUARIO_CREADO', `Creó usuario: ${user.nombre}`, 'Seguridad');
        }
        setEditingUser(null);
        await fetchUsers();
    };

    return (
        <div className="max-w-[1600px] mx-auto space-y-12 pb-40 pt-6 px-6 sm:px-12 relative animate-fade-in">
            {/* --- HEADER --- */}
            <div className="flex flex-col xl:flex-row justify-between items-start xl:items-end gap-10 border-b border-slate-200 pb-10">
                <div>
                    <div className="flex items-center gap-4 mb-4">
                        <div className="flex gap-1.5">
                            <div className="w-1.5 h-1.5 rounded-full bg-brand-blue shadow-[0_0_8px_rgba(14,165,233,0.5)] animate-pulse" />
                            <div className="w-1.5 h-1.5 rounded-full bg-slate-200" />
                        </div>
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.6em]">Control de Acceso</span>
                    </div>
                    <h1 className="text-6xl font-black text-slate-900 tracking-[-0.04em] uppercase leading-none">
                        Gestión de <span className="text-brand-blue">Usuarios</span>
                    </h1>
                </div>
                <button 
                    onClick={() => setEditingUser({})} 
                    className="px-10 py-5 bg-brand-blue text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl shadow-brand-blue/20 hover:bg-brand-blue/90 transition-all flex items-center gap-4"
                >
                    <UserPlusIcon className="w-5 h-5" />
                    Nuevo Usuario
                </button>
            </div>

            {/* --- KPI SECTION --- */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <KpiCard title="Censo Total" value={users.length} icon={UsersIcon} />
                <KpiCard title="Portales Activos" value={users.filter(u => u.estado === 'Activo').length} icon={ShieldCheckIcon} colorClass="bg-emerald-50 text-emerald-500" />
                <KpiCard title="Protocolos en Pausa" value={users.filter(u => u.estado === 'Inactivo').length} icon={ExclamationTriangleIcon} colorClass="bg-rose-50 text-rose-500" />
            </div>

            {/* --- TABLE SECTION --- */}
            <motion.div 
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-[3rem] border border-slate-200 shadow-sm overflow-hidden"
            >
                <div className="p-8 border-b border-slate-100 flex flex-col md:flex-row justify-between items-center gap-6 bg-slate-50/50">
                    <div className="relative group w-full md:max-w-md">
                        <SearchIcon className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-focus-within:text-brand-blue transition-colors" />
                        <input 
                            type="text" placeholder="RASTREAR USUARIO O EMAIL..." value={searchTerm} 
                            onChange={e => setSearchTerm(e.target.value)} 
                            className="w-full pl-16 pr-6 py-4 bg-white border border-slate-200 rounded-2xl text-[10px] font-black uppercase tracking-widest focus:border-brand-blue focus:ring-4 focus:ring-brand-blue/5 outline-none transition-all shadow-sm"
                        />
                    </div>
                    <div className="flex items-center gap-4">
                        <SparklesIcon className="w-5 h-5 text-brand-blue animate-pulse" />
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">Base Sincronizada</span>
                    </div>
                </div>

                <div className="overflow-x-auto custom-scrollbar">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50/50 text-[9px] font-black text-slate-400 uppercase tracking-[0.4em] border-b border-slate-100">
                                <th className="px-10 py-6">Usuario Atelier</th>
                                <th className="px-10 py-6">Rango Operativo</th>
                                <th className="px-10 py-6">Seguridad</th>
                                <th className="px-10 py-6">Último Vínculo</th>
                                <th className="px-10 py-6">Estado</th>
                                <th className="px-10 py-6 text-right">Acción</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {loading ? (
                                <tr><td colSpan={6} className="py-40 text-center"><Loader2Icon className="w-10 h-10 text-brand-blue animate-spin mx-auto"/></td></tr>
                            ) : filteredAndSortedUsers.length === 0 ? (
                                <tr><td colSpan={6} className="py-40 text-center"><UsersIcon className="w-12 h-12 mx-auto mb-4 text-slate-100"/><p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Sin Coincidencias</p></td></tr>
                            ) : filteredAndSortedUsers.map((user) => (
                                <tr key={user.id} className="group hover:bg-slate-50 transition-all duration-300">
                                    <td className="px-10 py-8">
                                        <p className="text-slate-900 font-black uppercase tracking-tight text-lg group-hover:text-brand-blue transition-colors">{user.nombre}</p>
                                        <p className="text-[10px] font-black text-slate-400 mt-1 uppercase tracking-widest">{user.email}</p>
                                    </td>
                                    <td className="px-10 py-8">
                                        <span className={`px-4 py-1.5 rounded-xl text-[8px] font-black uppercase tracking-widest border ${user.rol === 'Admin' ? 'bg-brand-blue/5 text-brand-blue border-brand-blue/20' : 'bg-slate-50 text-slate-400 border-slate-100'}`}>{user.rol}</span>
                                    </td>
                                    <td className="px-10 py-8">
                                        {user.requirePassword ? (
                                            <div className="flex items-center gap-2 text-emerald-500">
                                                <ShieldCheckIcon className="w-4 h-4"/>
                                                <span className="text-[9px] font-black uppercase tracking-widest">ENCRIPTADO</span>
                                            </div>
                                        ) : (
                                            <span className="text-[9px] font-black text-slate-200 uppercase tracking-widest">ABIERTO</span>
                                        )}
                                    </td>
                                    <td className="px-10 py-8">
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{formatDate(user.ultimoAcceso)}</p>
                                    </td>
                                    <td className="px-10 py-8">
                                        <label className="relative inline-flex items-center cursor-pointer">
                                            <input type="checkbox" checked={user.estado === 'Activo'} onChange={async () => {
                                                const newStatus = user.estado === 'Activo' ? 'Inactivo' : 'Activo';
                                                await supabase.from('users').update({ estado: newStatus }).eq('id', user.id);
                                                logActivity(currentUser.nombre, currentUser.rol, 'USUARIO_MODIFICADO', `${newStatus === 'Activo' ? 'Activó' : 'Desactivó'} a ${user.nombre}`, 'Seguridad');
                                                fetchUsers();
                                            }} className="sr-only peer" />
                                            <div className="w-11 h-6 bg-slate-200 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-blue shadow-inner"></div>
                                        </label>
                                    </td>
                                    <td className="px-10 py-8 text-right">
                                        <button onClick={() => setEditingUser(user)} className="p-3 bg-white border border-slate-200 text-slate-400 hover:text-brand-blue hover:border-brand-blue/30 rounded-xl transition-all shadow-sm">
                                            <PencilIcon className="h-5 w-5" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </motion.div>

            <style>{`
                .custom-scrollbar::-webkit-scrollbar { width: 4px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #f1f5f9; border-radius: 10px; }
            `}</style>
        </div>
    );
};

export default GestionUsuariosPage;
