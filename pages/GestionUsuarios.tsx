import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../services/supabase';
import { User } from '../types';
import { useOutletContext } from 'react-router-dom';
import { logActivity } from '../services/activityLogService';
import { 
    UsersIcon, UserPlusIcon, ExclamationTriangleIcon, PencilIcon, SearchIcon, 
    CloseIcon, ArrowUpIcon, ArrowDownIcon, ShieldCheckIcon, SparklesIcon, KeyIcon
} from '../components/Icons';
import { formatDate } from '../utils';
import { motion, AnimatePresence } from 'framer-motion';

// --- ATELIER COMPONENTS ---

const KpiCard: React.FC<{ title: string; value: string | number; icon: React.FC<any>; colorClass?: string }> = ({ title, value, icon: Icon, colorClass = "bg-liquid-gold" }) => (
    <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={{ y: -10, borderColor: 'rgba(212, 175, 55, 0.3)' }}
        className="glass-card-luxury p-8 relative group"
    >
        <div className="flex justify-between items-start">
            <div className="space-y-2">
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em]">{title}</p>
                <p className="text-4xl font-black text-white group-hover:text-gold-gradient transition-all italic tracking-tighter">{value}</p>
            </div>
            <div className={`${colorClass} p-4 rounded-2xl text-black shadow-gold-glow`}>
                <Icon className="h-6 w-6" />
            </div>
        </div>
    </motion.div>
);

const fadeInUp = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, scale: 0.95 }
};

// --- MODALS ---

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
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/90 backdrop-blur-xl" onClick={onClose} />
                <motion.div 
                    initial={{ scale: 0.95, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.95, opacity: 0, y: 20 }}
                    className="glass-boutique w-full max-w-lg overflow-hidden flex flex-col relative z-10 border border-white/10 shadow-gold-glow-strong" 
                    onClick={e => e.stopPropagation()}
                >
                    <div className="p-10 border-b border-white/5 bg-white/[0.02] flex justify-between items-center">
                        <div>
                            <h2 className="text-3xl font-black text-white uppercase tracking-tighter italic">{formData.id ? 'Editar' : 'Nuevo'} <span className="text-liquid-gold">Perfil</span></h2>
                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.4em] mt-1">Protocolo de Acceso Atelier</p>
                        </div>
                        <button onClick={onClose} className="p-3 bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white rounded-2xl transition-all"><CloseIcon className="w-6 h-6"/></button>
                    </div>

                    <form onSubmit={handleSubmit} className="p-10 space-y-8 overflow-y-auto custom-scrollbar">
                        <div className="space-y-6">
                            <div className="group/field">
                                <label className="block text-[9px] font-black text-slate-500 uppercase tracking-[0.3em] mb-3 ml-1 group-focus-within/field:text-liquid-gold transition-colors">Identidad Nomimal</label>
                                <input type="text" value={formData.nombre || ''} onChange={e => setFormData({...formData, nombre: e.target.value})} required className="input-atelier w-full" placeholder="NOMBRE COMPLETO" />
                            </div>
                            <div className="group/field">
                                <label className="block text-[9px] font-black text-slate-500 uppercase tracking-[0.3em] mb-3 ml-1 group-focus-within/field:text-liquid-gold transition-colors">Enlace Digital</label>
                                <input type="email" value={formData.email || ''} onChange={e => setFormData({...formData, email: e.target.value})} required className="input-atelier w-full" placeholder="CORREO ELECTRÓNICO" />
                            </div>
                            <div className="group/field">
                                <label className="block text-[9px] font-black text-slate-500 uppercase tracking-[0.3em] mb-3 ml-1 group-focus-within/field:text-liquid-gold transition-colors">Rango Operativo</label>
                                <select value={formData.rol || 'Operador'} onChange={e => setFormData({...formData, rol: e.target.value as any})} className="input-atelier w-full appearance-none cursor-pointer">
                                    <option value="Admin" className="bg-brand-dark">ADMINISTRADOR</option>
                                    <option value="Operador" className="bg-brand-dark">OPERADOR</option>
                                    <option value="Diseñador" className="bg-brand-dark">DISEÑADOR</option>
                                </select>
                            </div>
                        </div>

                        <div className="pt-8 border-t border-white/5 space-y-6">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <KeyIcon className="w-5 h-5 text-liquid-gold shadow-gold-glow" />
                                    <span className="text-[10px] font-black text-white uppercase tracking-widest">Protección de Cuenta</span>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input 
                                        type="checkbox" 
                                        checked={formData.requirePassword || false} 
                                        onChange={e => setFormData({...formData, requirePassword: e.target.checked})} 
                                        className="sr-only peer" 
                                    />
                                    <div className="w-11 h-6 bg-white/10 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-brand-dark after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-slate-500 peer-checked:after:bg-black after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-liquid-gold shadow-inner border border-white/5"></div>
                                </label>
                            </div>

                            {formData.requirePassword && (
                                <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-liquid-gold/5 p-6 rounded-2xl border border-liquid-gold/20">
                                    <label className="block text-[9px] font-black text-liquid-gold uppercase tracking-[0.3em] mb-3">Establecer Credencial</label>
                                    <input 
                                        type="text" value={formData.password || ''} 
                                        onChange={e => setFormData({...formData, password: e.target.value})} 
                                        placeholder="CONTRASEÑA MAESTRA"
                                        className="w-full p-4 bg-black/60 border border-liquid-gold/30 rounded-xl text-sm font-black text-white focus:border-liquid-gold outline-none transition-all" 
                                    />
                                </motion.div>
                            )}
                        </div>
                    </form>

                    <div className="p-10 border-t border-white/5 bg-white/[0.02] flex justify-between items-center">
                        <button type="button" onClick={onClose} className="text-[10px] font-black text-slate-500 uppercase tracking-widest hover:text-white transition-colors">Cancelar</button>
                        <button onClick={handleSubmit} className="btn-luxury px-12 py-5">Sincronizar Perfil</button>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

// --- MAIN PAGE ---

const GestionUsuariosPage: React.FC = () => {
    const { currentUser } = useOutletContext<{ currentUser: User }>();
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [sortConfig, setSortConfig] = useState<{ key: keyof User; direction: 'asc' | 'desc' }>({ key: 'nombre', direction: 'asc' });
    
    const [editingUser, setEditingUser] = useState<Partial<User> | null>(null);
    const [userToToggle, setUserToToggle] = useState<User | null>(null);

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
    
    const requestSort = (key: keyof User) => {
        let direction: 'asc' | 'desc' = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') direction = 'desc';
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
        <div className="max-w-7xl mx-auto space-y-16 pb-40 px-6 sm:px-12 relative overflow-hidden">
            <div className="absolute inset-0 bg-noise opacity-[0.02] pointer-events-none"></div>

            {/* --- HEADER --- */}
            <div className="flex flex-col xl:flex-row justify-between items-start xl:items-end gap-10 relative z-10">
                <div>
                    <motion.h1 initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} className="text-6xl sm:text-7xl font-black text-white tracking-[-0.04em] uppercase italic leading-none">
                        Access <span className="text-gold-gradient">Portal</span>
                    </motion.h1>
                    <div className="flex items-center gap-4 mt-6">
                        <div className="flex gap-1.5">
                            <div className="w-1.5 h-1.5 rounded-full bg-cyan-500 shadow-[0_0_8px_rgba(6,182,212,0.5)] animate-pulse" />
                            <div className="w-1.5 h-1.5 rounded-full bg-yellow-400 shadow-[0_0_8px_rgba(250,204,21,0.5)] animate-pulse" style={{ animationDelay: '0.2s' }} />
                            <div className="w-1.5 h-1.5 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)] animate-pulse" style={{ animationDelay: '0.4s' }} />
                        </div>
                        <p className="text-[10px] font-black text-liquid-gold uppercase tracking-[0.6em]">Protocolo de Identidad Atelier</p>
                    </div>
                </div>
                <button 
                    onClick={() => setEditingUser({})} 
                    className="btn-luxury px-12 py-6 flex items-center gap-4 group"
                >
                    <UserPlusIcon className="w-5 h-5 group-hover:scale-110 transition-transform" />
                    <span>Vincular Usuario</span>
                </button>
            </div>

            {/* --- KPI SECTION --- */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative z-10">
                <KpiCard title="Censo Total" value={kpis.total} icon={UsersIcon} />
                <KpiCard title="Portales Activos" value={kpis.activos} icon={ShieldCheckIcon} colorClass="bg-emerald-500" />
                <KpiCard title="Protocolos en Pausa" value={kpis.inactivos} icon={ExclamationTriangleIcon} colorClass="bg-red-500" />
            </div>

            {/* --- TABLE SECTION --- */}
            <motion.div 
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                className="glass-card-luxury overflow-hidden relative z-10"
            >
                <div className="p-10 border-b border-white/5 flex flex-col md:flex-row justify-between items-center gap-6 bg-white/[0.01]">
                    <div className="relative group w-full md:max-w-md">
                        <SearchIcon className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-liquid-gold transition-colors" />
                        <input 
                            type="text" placeholder="RASTREAR USUARIO..." value={searchTerm} 
                            onChange={e => setSearchTerm(e.target.value)} 
                            className="input-atelier w-full pl-16 text-[10px] font-black uppercase tracking-widest"
                        />
                    </div>
                    <div className="flex items-center gap-4">
                        <SparklesIcon className="w-5 h-5 text-liquid-gold animate-pulse" />
                        <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Base de Datos Sincronizada</span>
                    </div>
                </div>

                <div className="overflow-x-auto custom-scrollbar">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-white/[0.03] text-[9px] font-black text-slate-500 uppercase tracking-[0.4em] border-b border-white/5">
                                <th className="px-10 py-6">Usuario Atelier</th>
                                <th className="px-10 py-6">Rango</th>
                                <th className="px-10 py-6">Seguridad</th>
                                <th className="px-10 py-6">Último Vínculo</th>
                                <th className="px-10 py-6">Estado</th>
                                <th className="px-10 py-6 text-right">Acción</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {loading ? (
                                <tr><td colSpan={6} className="py-40 text-center"><div className="w-12 h-12 border-4 border-liquid-gold/20 border-t-liquid-gold rounded-full animate-spin mx-auto"></div></td></tr>
                            ) : filteredAndSortedUsers.length === 0 ? (
                                <tr><td colSpan={6} className="py-40 text-center opacity-20 grayscale"><UsersIcon className="w-12 h-12 mx-auto mb-4"/><p className="text-[10px] font-black uppercase tracking-widest">Sin Coincidencias</p></td></tr>
                            ) : filteredAndSortedUsers.map((user) => (
                                <tr key={user.id} className="group hover:bg-white/[0.02] transition-colors">
                                    <td className="px-10 py-8">
                                        <p className="text-white font-black uppercase tracking-tight italic text-lg group-hover:text-liquid-gold transition-colors">{user.nombre}</p>
                                        <p className="text-[10px] font-black text-slate-600 mt-1 uppercase tracking-widest">{user.email}</p>
                                    </td>
                                    <td className="px-10 py-8">
                                        <span className={`px-3 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest border ${user.rol === 'Admin' ? 'bg-liquid-gold/10 text-liquid-gold border-liquid-gold/20' : 'bg-white/5 text-slate-400 border-white/10'}`}>{user.rol}</span>
                                    </td>
                                    <td className="px-10 py-8">
                                        {user.requirePassword ? (
                                            <div className="flex items-center gap-2 text-emerald-500">
                                                <ShieldCheckIcon className="w-4 h-4"/>
                                                <span className="text-[9px] font-black uppercase tracking-widest">ENCRIPTADO</span>
                                            </div>
                                        ) : (
                                            <span className="text-[9px] font-bold text-slate-700 uppercase">ACCESO ABIERTO</span>
                                        )}
                                    </td>
                                    <td className="px-10 py-8">
                                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{formatDate(user.ultimoAcceso)}</p>
                                    </td>
                                    <td className="px-10 py-8">
                                        <label className="relative inline-flex items-center cursor-pointer">
                                            <input type="checkbox" checked={user.estado === 'Activo'} onChange={async () => {
                                                const newStatus = user.estado === 'Activo' ? 'Inactivo' : 'Activo';
                                                await supabase.from('users').update({ estado: newStatus }).eq('id', user.id);
                                                logActivity(currentUser.nombre, currentUser.rol, 'USUARIO_MODIFICADO', `${newStatus === 'Activo' ? 'Activó' : 'Desactivó'} a ${user.nombre}`, 'Seguridad');
                                                fetchUsers();
                                            }} className="sr-only peer" />
                                            <div className="w-11 h-6 bg-white/10 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-brand-dark after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-slate-500 peer-checked:after:bg-black after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-liquid-gold shadow-inner border border-white/5"></div>
                                        </label>
                                    </td>
                                    <td className="px-10 py-8 text-right">
                                        <button onClick={() => setEditingUser(user)} className="p-3 bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white rounded-xl transition-all border border-transparent hover:border-white/10">
                                            <PencilIcon className="h-5 w-5" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </motion.div>

            {editingUser && <UserFormModal user={editingUser} onClose={() => setEditingUser(null)} onSave={handleSaveUser} />}
        </div>
    );
};

export default GestionUsuariosPage;
