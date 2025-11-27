import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { getTrabajos, getClientes } from '../services/mockApi';
import { Trabajo, Cliente, TrabajoEstado, TrabajoTipo } from '../types';
import { formatCurrency, formatDate } from '../utils';
import { AddIcon } from '../components/Icons';

const statusStyles: { [key in TrabajoEstado]: { text: string; classes: string } } = {
    [TrabajoEstado.PENDIENTE]: { text: 'Pendiente', classes: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300' },
    [TrabajoEstado.PROCESO]: { text: 'En Proceso', classes: 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300' },
    [TrabajoEstado.VITRINA]: { text: 'Vitrina', classes: 'bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-300' },
    [TrabajoEstado.ENTREGADO]: { text: 'Entregado', classes: 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300' },
};

const tipoStyles: { [key in TrabajoTipo]: string } = {
    [TrabajoTipo.SRI]: 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300',
    [TrabajoTipo.GENERAL]: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
};

const TrabajosPage: React.FC = () => {
    const [trabajos, setTrabajos] = useState<Trabajo[]>([]);
    const [clientes, setClientes] = useState<Cliente[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [tipoFilter, setTipoFilter] = useState<TrabajoTipo | 'Todos'>('Todos');
    const [estadoFilter, setEstadoFilter] = useState<TrabajoEstado | 'Todos'>('Todos');

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            const [trabajosData, clientesData] = await Promise.all([getTrabajos(), getClientes()]);
            setTrabajos(trabajosData);
            setClientes(clientesData);
            setLoading(false);
        };
        fetchData();
    }, []);

    const filteredTrabajos = useMemo(() => {
        const lowercasedSearchTerm = searchTerm.toLowerCase();
        return trabajos.filter(trabajo => {
            const cliente = clientes.find(c => c.id === trabajo.clienteId);
            const searchMatch = lowercasedSearchTerm === '' ||
                cliente?.nombre.toLowerCase().includes(lowercasedSearchTerm) ||
                String(trabajo.orden).includes(lowercasedSearchTerm) ||
                trabajo.subtipo.toLowerCase().includes(lowercasedSearchTerm);
            const tipoMatch = tipoFilter === 'Todos' || trabajo.tipo === tipoFilter;
            const estadoMatch = estadoFilter === 'Todos' || trabajo.estado === estadoFilter;

            return searchMatch && tipoMatch && estadoMatch;
        });
    }, [trabajos, clientes, searchTerm, tipoFilter, estadoFilter]);

    return (
        <div className="space-y-6 flex flex-col h-full">
            <div className="flex flex-wrap justify-between items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Trabajos</h1>
                    <p className="mt-1 text-gray-600 dark:text-gray-400">Gestión de órdenes de producción</p>
                </div>
                <Link
                    to="/nuevo"
                    className="flex items-center justify-center gap-2 bg-brand-blue text-white font-bold py-2 px-5 rounded-lg shadow-md hover:bg-blue-700 transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                    <AddIcon className="h-5 w-5"/>
                    <span>+ Crear trabajo</span>
                </Link>
            </div>

            <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <input
                        type="text"
                        placeholder="Buscar por cliente, #trabajo o producto..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full px-4 py-2.5 text-gray-900 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-brand-blue focus:border-brand-blue"
                    />
                    <select
                        value={tipoFilter}
                        onChange={(e) => setTipoFilter(e.target.value as TrabajoTipo | 'Todos')}
                        className="w-full px-4 py-2.5 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-brand-blue focus:border-brand-blue"
                    >
                        <option value="Todos">Todos los tipos</option>
                        <option value={TrabajoTipo.SRI}>SRI</option>
                        <option value={TrabajoTipo.GENERAL}>General</option>
                    </select>
                     <select
                        value={estadoFilter}
                        onChange={(e) => setEstadoFilter(e.target.value as TrabajoEstado | 'Todos')}
                        className="w-full px-4 py-2.5 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-brand-blue focus:border-brand-blue"
                    >
                        <option value="Todos">Todos los estados</option>
                        {Object.entries(statusStyles).map(([status, { text }]) => (
                            <option key={status} value={status}>{text}</option>
                        ))}
                    </select>
                </div>
            </div>

            <div className="flex-grow bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
                <div className="overflow-x-auto h-full">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                        <thead className="bg-gray-50 dark:bg-gray-700/50 sticky top-0">
                            <tr>
                                {['#', 'CLIENTE', 'TIPO', 'ESTADO', 'TOTAL', 'FECHA', 'CREADO POR', 'ACTUALIZADO POR'].map(header => (
                                    <th key={header} scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                        {header}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                            {loading ? (
                                <tr><td colSpan={8} className="text-center py-10">Cargando trabajos...</td></tr>
                            ) : filteredTrabajos.length > 0 ? (
                                filteredTrabajos.map(trabajo => {
                                    const cliente = clientes.find(c => c.id === trabajo.clienteId);
                                    return (
                                        <tr key={trabajo.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                                                <Link to={`/trabajos/${trabajo.id}`} className="hover:underline text-brand-blue">#{trabajo.orden}</Link>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800 dark:text-gray-200">{cliente?.nombre || 'N/A'}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                <span className={`px-2.5 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${tipoStyles[trabajo.tipo]}`}>
                                                    {trabajo.tipo.toUpperCase()}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                <span className={`px-2.5 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${statusStyles[trabajo.estado].classes}`}>
                                                    {statusStyles[trabajo.estado].text}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-800 dark:text-gray-200">{formatCurrency(trabajo.total)}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{formatDate(trabajo.fechaEntrada)}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{trabajo.creadoPor || 'N/A'}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{trabajo.actualizadoPor || 'N/A'}</td>
                                        </tr>
                                    )
                                })
                            ) : (
                                <tr><td colSpan={8} className="text-center py-10 text-gray-500">No se encontraron trabajos.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default TrabajosPage;