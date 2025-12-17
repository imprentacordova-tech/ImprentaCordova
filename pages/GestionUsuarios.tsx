
import React, { useState, useEffect, useMemo } from 'react';
import { getUsers, updateUser, createUser } from '../services/mockApi';
import { User, UserRole } from '../types';
import { UsersIcon, UserPlusIcon, ExclamationTriangleIcon, PencilIcon, SearchIcon, CloseIcon, ArrowUpIcon, ArrowDownIcon, ShieldCheckIcon } from '../components/Icons';
import { formatDate } from '../utils';

type SortKey = keyof User;

const KpiCard: React.FC<{ title: string; value: string | number; icon: React.FC<any>; color: 'blue' | 'green' | 'red' }> = ({ title, value, icon: Icon, color }) => {
    const colors = {
        blue: 'from-blue-500 to-blue-600',
        green: 'from-green-500 to-green-600',
        red: 'from-red-500 to-red-600',
    };
    return (
        <div className={`bg-gradient-to-br ${colors[color]} text-white p-6 rounded-xl shadow-lg`}>
            <div className="flex justify-between items-start">
                <div>
                    <p className="text-4xl font-bold">{value}</p>
                    <p className="text-blue-100">{title}</p>
                </div>
                <div className="bg-white/20 p-3 rounded-full">
                    <Icon className="h-6 w-6" />
                </div>
            </div>
        </div>
    );
};

const ConfirmationModal: React.FC<{ user: User; onConfirm: () => void; onCancel: () => void; }> = ({ user, onConfirm, onCancel }) => {
    const isActivating = user.estado === 'Activo'; // Fix logic: if user is active, we are deactivating, if inactive we are activating. Wait, logic was reversed in previous code.
    // Logic: button action. If user.estado === 'Inactivo', we want to Activate.
    const actionLabel = user.estado === 'Inactivo' ? 'activar' : 'desactivar';
    const confirmColor = user.estado === 'Inactivo' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700';

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4" onClick={onCancel}>
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-md" onClick={e => e.stopPropagation()}>
                <div className="p-6 text-center">
                    <ExclamationTriangleIcon className={`mx-auto h-12 w-12 ${user.estado === 'Inactivo' ? 'text-green-500' : 'text-red-500'}`} />
                    <h3 className="mt-4 text-xl font-bold text-gray-900 dark:text-white">
                        ¿Estás seguro?
                    </h3>
                    <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                        Vas a {actionLabel} al usuario <span className="font-semibold">{user.nombre}</span>.
                    </p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700/50 px-6 py-4 flex justify-center gap-4 rounded-b-xl">
                    <button onClick={onCancel} className="px-4 py-2 bg-gray-200 text-gray-800 font-semibold rounded-lg hover:bg-gray-300">Cancelar</button>
                    <button onClick={onConfirm} className={`px-4 py-2 text-white font-semibold rounded-lg ${confirmColor}`}>
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
        setFormData(user || { nombre: '', email: '', rol: 'Atención al Cliente', estado: 'Activo', requirePassword: false, password: '' });
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
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4" onClick={onClose}>
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center p-5 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
                    <h2 className="text-xl font-bold text-gray-800 dark:text-white">{formData.id ? 'Editar Usuario' : 'Crear Usuario'}</h2>
                    <button onClick={onClose}><CloseIcon className="w-6 h-6 text-gray-500" /></button>
                </div>
                <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Nombre</label>
                        <input type="text" name="nombre" value={formData.nombre || ''} onChange={handleChange} required className="mt-1 w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-brand-blue" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Email</label>
                        <input type="email" name="email" value={formData.email || ''} onChange={handleChange} required className="mt-1 w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-brand-blue" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Rol</label>
                        <select name="rol" value={formData.rol || 'Atención al Cliente'} onChange={handleChange} className="mt-1 w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-brand-blue">
                            <optgroup label="Administración">
                                <option value="Admin">Administrador</option>
                            </optgroup>
                            <optgroup label="Atención & Ventas">
                                <option value="Atención al Cliente">Atención al Cliente</option>
                            </optgroup>
                            <optgroup label="Producción">
                                <option value="Diseñador">Diseñador Gráfico</option>
                                <option value="Prensista">Prensista (Maquinista)</option>
                                <option value="Encuadernador">Encuadernador / Acabados</option>
                                <option value="Operador">Operador General</option>
                            </optgroup>
                            <optgroup label="Logística">
                                <option value="Instalador">Instalador / Motorizado</option>
                            </optgroup>
                        </select>
                    </div>

                    <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider flex items-center gap-2">
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
                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                                <span className="ml-3 text-sm font-medium text-gray-700 dark:text-gray-300">Habilitar Contraseña</span>
                            </label>
                        </div>

                        {formData.requirePassword && (
                            <div className="animate-fade-in bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-100 dark:border-blue-800">
                                <label className="block text-sm font-medium text-blue-800 dark:text-blue-300 mb-1">Contraseña de Acceso</label>
                                <input 
                                    type="text" // Visible for admin convenience as requested in typical small ERPs
                                    name="password" 
                                    value={formData.password || ''} 
                                    onChange={handleChange} 
                                    placeholder="Establecer contraseña"
                                    className="w-full p-2.5 border border-blue-300 dark:border-blue-700 rounded-lg bg-white dark:bg-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500" 
                                />
                                <p className="text-xs text-blue-600 dark:text-blue-400 mt-2">
                                    Este usuario deberá ingresar esta contraseña al iniciar sesión.
                                </p>
                            </div>
                        )}
                    </div>

                    <div className="flex justify-end pt-4 gap-3">
                        <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 font-semibold rounded-lg hover:bg-gray-300 transition-colors">Cancelar</button>
                        <button type="submit" className="px-4 py-2 bg-brand-blue text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors shadow-md">Guardar</button>
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
        sortConfig.direction === 'asc' ? <ArrowUpIcon className="h-4 w-4 ml-1 transition-transform" /> : <ArrowDownIcon className="h-4 w-4 ml-1 transition-transform" />
    ) : <div className="h-4 w-4 ml-1"></div>; // Placeholder for alignment

    return (
        <th scope="col" className={`px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider ${className}`}>
            <button onClick={() => requestSort(column)} className="flex items-center group focus:outline-none">
                <span>{label}</span>
                <span className={`transition-opacity ${isSorted ? 'opacity-100' : 'opacity-50 group-hover:opacity-100'}`}>
                    {directionIcon}
                </span>
            </button>
        </th>
    );
};

// --- RENDERIZADO DE ROLES CON COLORES ---
const RoleBadge: React.FC<{ role: UserRole }> = ({ role }) => {
    let classes = "";
    switch (role) {
        case 'Admin':
            classes = "bg-purple-100 text-purple-800 border-purple-200";
            break;
        case 'Atención al Cliente':
            classes = "bg-blue-100 text-blue-800 border-blue-200";
            break;
        case 'Diseñador':
            classes = "bg-pink-100 text-pink-800 border-pink-200";
            break;
        case 'Prensista':
            classes = "bg-orange-100 text-orange-800 border-orange-200";
            break;
        case 'Encuadernador':
            classes = "bg-teal-100 text-teal-800 border-teal-200";
            break;
        case 'Instalador':
            classes = "bg-gray-100 text-gray-800 border-gray-200";
            break;
        default: // Operador y otros
            classes = "bg-gray-100 text-gray-600 border-gray-200";
            break;
    }

    return (
        <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${classes}`}>
            {role}
        </span>
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
                // @ts-ignore
                if (a[sortConfig.key] < b[sortConfig.key]) return sortConfig.direction === 'asc' ? -1 : 1;
                // @ts-ignore
                if (a[sortConfig.key] > b[sortConfig.key]) return sortConfig.direction === 'asc' ? 1 : -1;
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
        <div className="space-y-8">
            <div className="flex flex-wrap justify-between items-center gap-4">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Gestión de Usuarios</h1>
                <button onClick={() => setEditingUser({})} className="flex items-center gap-2 px-4 py-2 bg-brand-blue text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 transition-colors">
                    <UserPlusIcon className="h-5 w-5" />
                    <span>Nuevo Usuario</span>
                </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <KpiCard title="Total Usuarios" value={kpis.total} icon={UsersIcon} color="blue" />
                <KpiCard title="Usuarios Activos" value={kpis.activos} icon={UsersIcon} color="green" />
                <KpiCard title="Usuarios Inactivos" value={kpis.inactivos} icon={UsersIcon} color="red" />
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden border border-gray-100 dark:border-gray-700">
                <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
                    <div className="relative max-w-md">
                        <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <input type="text" placeholder="Buscar por nombre o email..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full pl-10 p-2.5 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-brand-blue transition-shadow" />
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="min-w-full">
                        <thead className="bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-700">
                             <tr>
                                <SortableHeader column="nombre" label="Nombre" sortConfig={sortConfig} requestSort={requestSort} />
                                <SortableHeader column="email" label="Email" sortConfig={sortConfig} requestSort={requestSort} />
                                <SortableHeader column="rol" label="Rol" sortConfig={sortConfig} requestSort={requestSort} />
                                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Seguridad</th>
                                <SortableHeader column="ultimoAcceso" label="Último Acceso" sortConfig={sortConfig} requestSort={requestSort} />
                                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Estado</th>
                                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                            {loading ? (
                                <tr><td colSpan={7} className="text-center py-10 text-gray-500">Cargando usuarios...</td></tr>
                            ) : filteredAndSortedUsers.map(user => (
                                <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                    <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">{user.nombre}</td>
                                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{user.email}</td>
                                    <td className="px-4 py-4 whitespace-nowrap text-sm">
                                        <RoleBadge role={user.rol} />
                                    </td>
                                    <td className="px-4 py-4 whitespace-nowrap text-sm">
                                        {user.requirePassword ? (
                                            <span className="flex items-center gap-1 text-green-600 font-medium text-xs">
                                                <ShieldCheckIcon className="w-4 h-4"/> Protegido
                                            </span>
                                        ) : (
                                            <span className="text-gray-400 italic text-xs">Sin contraseña</span>
                                        )}
                                    </td>
                                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{formatDate(user.ultimoAcceso)}</td>
                                    <td className="px-4 py-4 whitespace-nowrap">
                                        <label className="relative inline-flex items-center cursor-pointer">
                                            <input type="checkbox" checked={user.estado === 'Activo'} onChange={() => setUserToToggle(user)} className="sr-only peer" />
                                            <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                                        </label>
                                    </td>
                                    <td className="px-4 py-4 whitespace-nowrap text-sm">
                                        <button onClick={() => setEditingUser(user)} className="p-2 text-brand-blue hover:bg-blue-50 rounded-full transition-colors"><PencilIcon className="h-5 w-5" /></button>
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
