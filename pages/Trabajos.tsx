import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useData } from '../contexts/DataContext';
import { Trabajo, Cliente, TrabajoEstado, TrabajoTipo } from '../types';
import { formatCurrency, formatDate } from '../utils';
import { AddIcon } from '../components/Icons';

const statusStyles: { [key in TrabajoEstado]: { text: string; classes: string } } = {
    [TrabajoEstado.PENDIENTE]: { text: 'Pendiente', classes: 'border-yellow-500/30 text-yellow-500 bg-yellow-500/10 shadow-[0_0_10px_rgba(234,179,8,0.2)]' },
    [TrabajoEstado.EN_DISENO]: { text: 'En Diseño', classes: 'border-blue-500/30 text-blue-400 bg-blue-500/10 shadow-[0_0_10px_rgba(59,130,246,0.2)]' },
    [TrabajoEstado.PROCESO]: { text: 'En Proceso', classes: 'border-indigo-500/30 text-indigo-400 bg-indigo-500/10 shadow-[0_0_10px_rgba(99,102,241,0.2)]' },
    [TrabajoEstado.VITRINA]: { text: 'Vitrina', classes: 'border-liquid-gold/30 text-liquid-gold bg-liquid-gold/10 shadow-gold-glow' },
    [TrabajoEstado.ENTREGADO]: { text: 'Entregado', classes: 'border-emerald-500/30 text-emerald-500 bg-emerald-500/10 shadow-[0_0_10px_rgba(16,185,129,0.2)]' },
};

const tipoStyles: { [key in TrabajoTipo]: string } = {
    [TrabajoTipo.SRI]: 'border-blue-500/30 text-blue-400 bg-blue-500/10',
    [TrabajoTipo.GENERAL]: 'border-slate-500/30 text-slate-400 bg-slate-500/10',
};

const TrabajosPage: React.FC = () => {
    const { trabajos, clientes, loading } = useData();
    const [searchTerm, setSearchTerm] = useState('');
    const [tipoFilter, setTipoFilter] = useState<TrabajoTipo | 'Todos'>('Todos');
    const [estadoFilter, setEstadoFilter] = useState<TrabajoEstado | 'Todos'>('Todos');

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
        <div className="space-y-8 flex flex-col h-full animate-fade-in pb-12">
            <div className="flex flex-wrap justify-between items-end gap-4 p-6 lg:p-8 bg-white/5 backdrop-blur-xl border border-white/5 rounded-[2.5rem] lg:rounded-[3rem] shadow-luxury relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-64 h-64 bg-liquid-gold/5 rounded-full blur-[80px] -mr-32 -mt-32 pointer-events-none transition-opacity group-hover:opacity-50"></div>
                <div className="relative z-10">
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] mb-2 font-inter italic">Gestión Operativa</p>
                    <h1 className="text-3xl lg:text-4xl font-black text-white uppercase tracking-tighter leading-tight">Órdenes de Trabajo</h1>
                </div>
                <Link
                    to="/nuevo"
                    className="relative z-10 flex items-center justify-center gap-3 bg-liquid-gold text-brand-dark font-black py-3.5 lg:py-4 px-6 lg:px-8 rounded-xl lg:rounded-2xl shadow-gold-glow hover:bg-white hover:text-brand-dark transition-all duration-500 text-[10px] uppercase tracking-[0.2em] overflow-hidden group/btn"
                >
                    <div className="absolute inset-0 bg-white translate-y-full group-hover/btn:translate-y-0 transition-transform duration-500 ease-out"></div>
                    <span className="relative z-10 flex items-center gap-2"><AddIcon className="h-4 w-4"/> CREAR NUEVA OBRA</span>
                </Link>
            </div>

            <div className="bg-brand-dark/50 backdrop-blur-md p-4 lg:p-6 rounded-[1.5rem] lg:rounded-[2rem] border border-white/5 shadow-luxury">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-6">
                    <input
                        type="text"
                        placeholder="Buscar por cliente, #obra o detalle..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="input-atelier w-full"
                    />
                    <select
                        value={tipoFilter}
                        onChange={(e) => setTipoFilter(e.target.value as TrabajoTipo | 'Todos')}
                        className="input-atelier w-full appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%2394a3b8%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E')] bg-[length:12px_12px] bg-[right_1.5rem_center] bg-no-repeat"
                    >
                        <option value="Todos">TODOS LOS TIPOS</option>
                        <option value={TrabajoTipo.SRI}>S.R.I.</option>
                        <option value={TrabajoTipo.GENERAL}>GENERALES</option>
                    </select>
                     <select
                        value={estadoFilter}
                        onChange={(e) => setEstadoFilter(e.target.value as TrabajoEstado | 'Todos')}
                        className="input-atelier w-full appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%2394a3b8%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E')] bg-[length:12px_12px] bg-[right_1.5rem_center] bg-no-repeat"
                    >
                        <option value="Todos">TODOS LOS ESTADOS</option>
                        {Object.entries(statusStyles).map(([status, { text }]) => (
                            <option key={status} value={status}>{text.toUpperCase()}</option>
                        ))}
                    </select>
                </div>
            </div>

            <div className="flex-grow bg-white/5 backdrop-blur-xl rounded-[2rem] lg:rounded-[2.5rem] shadow-luxury border border-white/5 overflow-hidden">
                <div className="overflow-x-auto h-full styled-scrollbar">
                    <table className="min-w-full divide-y divide-white/5">
                        <thead className="bg-brand-dark/80 sticky top-0 backdrop-blur-md z-10 border-b border-white/5">
                            <tr>
                                {['#Orden', 'Cliente', 'Tipo', 'Estado', 'Total', 'Fecha', 'Creador'].map(header => (
                                    <th key={header} scope="col" className="px-5 lg:px-8 py-4 lg:py-6 text-left text-[9px] font-black text-slate-500 uppercase tracking-[0.3em]">
                                        {header}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5 bg-transparent">
                            {loading ? (
                                <tr><td colSpan={7} className="text-center py-20 text-xs font-bold text-slate-500 uppercase tracking-widest animate-pulse">Desplegando obras...</td></tr>
                            ) : filteredTrabajos.length > 0 ? (
                                filteredTrabajos.map(trabajo => {
                                    const cliente = clientes.find(c => c.id === trabajo.clienteId);
                                    return (
                                        <tr key={trabajo.id} className="hover:bg-white/[0.04] transition-all duration-300 group cursor-pointer" onClick={() => window.location.href=`/#/trabajos/${trabajo.id}`}>
                                            <td className="px-5 lg:px-8 py-4 lg:py-5 whitespace-nowrap">
                                                <span className="text-lg lg:text-xl font-black text-white italic group-hover:text-liquid-gold transition-colors">
                                                    #{String(trabajo.orden).padStart(5, '0')}
                                                </span>
                                            </td>
                                            <td className="px-5 lg:px-8 py-4 lg:py-5 whitespace-nowrap">
                                                <div className="font-bold text-slate-300 uppercase tracking-tight text-sm">{cliente?.nombre || 'N/A'}</div>
                                            </td>
                                            <td className="px-5 lg:px-8 py-4 lg:py-5 whitespace-nowrap">
                                                <span className={`px-3 lg:px-4 py-1.5 inline-flex text-[9px] leading-5 font-black uppercase tracking-[0.2em] rounded-full border ${tipoStyles[trabajo.tipo]}`}>
                                                    {trabajo.tipo}
                                                </span>
                                            </td>
                                            <td className="px-5 lg:px-8 py-4 lg:py-5 whitespace-nowrap">
                                                <span className={`px-3 lg:px-4 py-1.5 inline-flex text-[9px] leading-5 font-black uppercase tracking-[0.2em] rounded-full border ${statusStyles[trabajo.estado].classes}`}>
                                                    {statusStyles[trabajo.estado].text}
                                                </span>
                                            </td>
                                            <td className="px-5 lg:px-8 py-4 lg:py-5 whitespace-nowrap">
                                                <div className="text-sm font-black text-white">{formatCurrency(trabajo.total)}</div>
                                            </td>
                                            <td className="px-5 lg:px-8 py-4 lg:py-5 whitespace-nowrap">
                                                <div className="text-xs text-slate-500 font-bold uppercase">{formatDate(trabajo.fechaEntrada)}</div>
                                            </td>
                                            <td className="px-5 lg:px-8 py-4 lg:py-5 whitespace-nowrap">
                                                <div className="text-xs text-slate-500 font-bold uppercase tracking-wider">{trabajo.creadoPor || 'N/A'}</div>
                                            </td>
                                        </tr>
                                    )
                                })
                            ) : (
                                <tr><td colSpan={7} className="text-center py-20 text-xs font-bold text-slate-500 uppercase tracking-widest">El catálogo está vacío.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default TrabajosPage;