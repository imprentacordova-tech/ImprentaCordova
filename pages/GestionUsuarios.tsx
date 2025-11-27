import React, { useState, useEffect, useMemo } from 'react';
import { getUsers, updateUser, createUser } from '../services/mockApi';
import { User } from '../types';
import { UsersIcon, UserPlusIcon, ExclamationTriangleIcon, PencilIcon, SearchIcon, CloseIcon, ArrowUpIcon, ArrowDownIcon } from '../components/Icons';
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
    const isActivating = user.estado === 'Inactivo';
    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4" onClick={onCancel}>
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-md" onClick={e => e.stopPropagation()}>
                <div className="p-6 text-center">
                    <ExclamationTriangleIcon className={`mx-auto h-12 w-12 ${isActivating ? 'text-green-500' : 'text-red-500'}`} />
                    <h3 className="mt-4 text-xl font-bold text-gray-900 dark:text-white">
                        ¿Estás seguro?
                    </h3>
                    <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                        Vas a {isActivating ? 'activar' : 'desactivar'} al usuario <span className="font-semibold">{user.nombre}</span>.
                    </p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700/50 px-6 py-4 flex justify-center gap-4 rounded-b-xl">
                    <button onClick={onCancel} className="px-4 py-2 bg-gray-200 text-gray-800 font-semibold rounded-lg hover:bg-gray-300">Cancelar</button>
                    <button onClick={onConfirm} className={`px-4 py-2 text-white font-semibold rounded-lg ${isActivating ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}`}>
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
        setFormData(user || { nombre: '', email: '', rol: 'Operador', estado: 'Activo' });
    }, [user]);

    if (!user) return null;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(formData);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4" onClick={onClose}>
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-lg" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center p-5 border-b border-gray-200 dark:border-gray-700">
                    <h2 className="text-xl font-bold">{user.id ? 'Editar Usuario' : 'Crear Usuario'}</h2>
                    <button onClick={onClose}><CloseIcon className="w-6 h-6 text-gray-500" /></button>
                </div>
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Nombre</label>
                        <input type="text" name="nombre" value={formData.nombre || ''} onChange={handleChange} required className="mt-1 w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Email</label>
                        <input type="email" name="email" value={formData.email || ''} onChange={handleChange} required className="mt-1 w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Rol</label>
                        <select name="rol" value={formData.rol || 'Operador'} onChange={handleChange} className="mt-1 w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white">
                            <option value="Admin">Admin</option>
                            <option value="Operador">Operador</option>
                        </select>
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
                if (a[sortConfig.key] < b[sortConfig.key]) return sortConfig.direction === 'asc' ? -1 : 1;
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
                <h1 className="text-3xl font-bold">Gestión de Usuarios</h1>
                <button onClick={() => setEditingUser({})} className="flex items-center gap-2 px-4 py-2 bg-brand-blue text-white font-semibold rounded-lg shadow-md hover:bg-blue-700">
                    <UserPlusIcon className="h-5 w-5" />
                    <span>Nuevo Usuario</span>
                </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <KpiCard title="Total Usuarios" value={kpis.total} icon={UsersIcon} color="blue" />
                <KpiCard title="Usuarios Activos" value={kpis.activos} icon={UsersIcon} color="green" />
                <KpiCard title="Usuarios Inactivos" value={kpis.inactivos} icon={UsersIcon} color="red" />
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden">
                <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                    <div className="relative">
                        <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <input type="text" placeholder="Buscar por nombre o email..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full pl-10 p-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white" />
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="min-w-full">
                        <thead className="bg-gray-50 dark:bg-gray-700/50">
                             <tr>
                                <SortableHeader column="nombre" label="Nombre" sortConfig={sortConfig} requestSort={requestSort} />
                                <SortableHeader column="email" label="Email" sortConfig={sortConfig} requestSort={requestSort} />
                                <SortableHeader column="rol" label="Rol" sortConfig={sortConfig} requestSort={requestSort} />
                                <SortableHeader column="ultimoAcceso" label="Último Acceso" sortConfig={sortConfig} requestSort={requestSort} />
                                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Estado</th>
                                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                            {loading ? (
                                <tr><td colSpan={6} className="text-center py-10">Cargando usuarios...</td></tr>
                            ) : filteredAndSortedUsers.map(user => (
                                <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                    <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">{user.nombre}</td>
                                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{user.email}</td>
                                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{user.rol}</td>
                                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{formatDate(user.ultimoAcceso)}</td>
                                    <td className="px-4 py-4 whitespace-nowrap">
                                        <label className="relative inline-flex items-center cursor-pointer">
                                            <input type="checkbox" checked={user.estado === 'Activo'} onChange={() => setUserToToggle(user)} className="sr-only peer" />
                                            <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                                        </label>
                                    </td>
                                    <td className="px-4 py-4 whitespace-nowrap text-sm">
                                        <button onClick={() => setEditingUser(user)} className="p-1 text-brand-blue hover:text-blue-700"><PencilIcon className="h-5 w-5" /></button>
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