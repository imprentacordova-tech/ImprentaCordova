
import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    SearchIcon, 
    XIcon, 
    CommandIcon, 
    ArrowRightIcon, 
    UserIcon, 
    BriefcaseIcon,
    FileTextIcon,
    ClockIcon
} from './Icons';
import { useData } from '../contexts/DataContext';
import { useNavigate } from 'react-router-dom';

export const SearchOmni: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [query, setQuery] = useState('');
    const { trabajos, clientes } = useData();
    const navigate = useNavigate();

    // Keyboard shortcut CMD+K or CTRL+K
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                setIsOpen(true);
            }
            if (e.key === 'Escape') {
                setIsOpen(false);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    const results = useMemo(() => {
        if (!query.trim()) return { trabajos: [], clientes: [] };
        const q = query.toLowerCase();

        const filteredClientes = clientes.filter(c => 
            c.nombre.toLowerCase().includes(q) || 
            c.email?.toLowerCase().includes(q) ||
            c.telefono.some(t => t.includes(q))
        ).slice(0, 5);

        const filteredTrabajos = trabajos.filter(t => 
            t.orden.toString().includes(q) || 
            t.subtipo.toLowerCase().includes(q)
        ).slice(0, 5);

        return { trabajos: filteredTrabajos, clientes: filteredClientes };
    }, [query, trabajos, clientes]);

    const handleSelect = (path: string) => {
        navigate(path);
        setIsOpen(false);
        setQuery('');
    };

    return (
        <>
            {/* Trigger Button (Visible on Desktop Header) */}
            <button 
                onClick={() => setIsOpen(true)}
                className="hidden lg:flex items-center gap-4 px-4 py-2 bg-slate-100 border border-slate-200 rounded-xl text-slate-500 hover:bg-slate-200 transition-all group"
            >
                <SearchIcon className="w-4 h-4" />
                <span className="text-[10px] font-black uppercase tracking-widest">Búsqueda Rápida...</span>
                <div className="flex items-center gap-1 px-2 py-0.5 bg-slate-200 border border-slate-300 rounded-md text-[9px] font-mono">
                    <CommandIcon className="w-2 h-2" /> <span>K</span>
                </div>
            </button>

            {/* Mobile Trigger (Fab-like in header) */}
            <button 
                onClick={() => setIsOpen(true)}
                className="lg:hidden p-3 bg-brand-blue text-white rounded-full shadow-blue-glow-strong fixed top-4 right-4 z-50 scale-90"
            >
                <SearchIcon className="w-5 h-5" />
            </button>

            <AnimatePresence>
                {isOpen && (
                    <div className="fixed inset-0 z-[200] flex items-start justify-center pt-20 px-4 sm:pt-[15vh]">
                        {/* Backdrop */}
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsOpen(false)}
                            className="fixed inset-0 bg-slate-900/60 backdrop-blur-md"
                        />

                        {/* Modal Container */}
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0, y: -20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.95, opacity: 0, y: -20 }}
                            className="relative w-full max-w-2xl bg-white border border-slate-200 rounded-[2.2rem] shadow-[0_25px_100px_rgba(0,0,0,0.15)] overflow-hidden"
                        >
                            {/* Search Input Area */}
                            <div className="relative border-b border-slate-100 bg-slate-50 group">
                                {/* Scanner Beam Effect */}
                                <div className="absolute top-0 left-0 w-full h-[1px] bg-brand-blue/20 animate-scan pointer-events-none" />
                                
                                <div className="absolute left-8 top-1/2 -translate-y-1/2 flex items-center gap-3">
                                    <SearchIcon className="w-5 h-5 text-brand-blue animate-pulse" />
                                    <div className="w-[1px] h-6 bg-slate-200 hidden sm:block"></div>
                                </div>
                                
                                <input 
                                    autoFocus
                                    placeholder="BUSCAR PEDIDO #, CLIENTE O SERVICIO..."
                                    value={query}
                                    onChange={(e) => setQuery(e.target.value)}
                                    className="w-full bg-transparent pl-20 pr-20 py-10 text-lg font-black text-slate-900 uppercase tracking-[0.1em] placeholder:text-slate-300 outline-none"
                                />
                                
                                <div className="absolute right-8 top-1/2 -translate-y-1/2 flex items-center gap-4">
                                    {query && (
                                        <button 
                                            onClick={() => setQuery('')}
                                            className="p-2 hover:bg-slate-200 rounded-lg text-slate-400 hover:text-slate-600 transition-colors"
                                        >
                                            <XIcon className="w-4 h-4" />
                                        </button>
                                    )}
                                    <button 
                                        onClick={() => setIsOpen(false)}
                                        className="p-3 bg-white border border-slate-200 rounded-xl text-slate-500 hover:text-slate-900 transition-all group/close"
                                    >
                                        <kbd className="text-[10px] font-mono group-hover:text-brand-blue transition-colors">ESC</kbd>
                                    </button>
                                </div>
                            </div>

                            {/* Results Area */}
                            <div className="max-h-[60vh] overflow-y-auto p-4 custom-scrollbar">
                                {!query ? (
                                    <div className="p-8 text-center">
                                        <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                            <CommandIcon className="w-8 h-8 text-slate-300" />
                                        </div>
                                        <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Escribe algo para empezar a buscar...</p>
                                    </div>
                                ) : (results.trabajos.length === 0 && results.clientes.length === 0) ? (
                                    <div className="p-12 text-center">
                                        <p className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">No se encontraron resultados para "{query}"</p>
                                    </div>
                                ) : (
                                    <div className="space-y-8 p-4">
                                        {/* Trabajos Results */}
                                        {results.trabajos.length > 0 && (
                                            <div>
                                                <h4 className="px-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-4">Pedidos Encontrados</h4>
                                                <div className="space-y-2">
                                                    {results.trabajos.map(t => (
                                                        <button 
                                                            key={t.id}
                                                            onClick={() => handleSelect(`/nota-de-venta/${t.id}`)}
                                                            className="w-full flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100 hover:border-brand-blue/30 hover:bg-white hover:shadow-lg transition-all group"
                                                        >
                                                            <div className="flex items-center gap-4">
                                                                <div className="w-10 h-10 rounded-xl bg-brand-blue/10 flex items-center justify-center text-brand-blue group-hover:bg-brand-blue group-hover:text-white transition-colors">
                                                                    <FileTextIcon className="w-5 h-5" />
                                                                </div>
                                                                <div className="text-left">
                                                                    <p className="text-xs font-black text-slate-900 uppercase tracking-widest">ORDEN #{t.orden}</p>
                                                                    <p className="text-[10px] font-bold text-slate-500 uppercase">{t.subtipo}</p>
                                                                </div>
                                                            </div>
                                                            <ArrowRightIcon className="w-4 h-4 text-slate-300 group-hover:text-brand-blue transition-colors" />
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* Clientes Results */}
                                        {results.clientes.length > 0 && (
                                            <div>
                                                <h4 className="px-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-4">Clientes Registrados</h4>
                                                <div className="space-y-2">
                                                    {results.clientes.map(c => (
                                                        <button 
                                                            key={c.id}
                                                            onClick={() => handleSelect(`/clientes`)}
                                                            className="w-full flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100 hover:border-brand-blue/30 hover:bg-white hover:shadow-lg transition-all group"
                                                        >
                                                            <div className="flex items-center gap-4">
                                                                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-600 group-hover:bg-emerald-500 group-hover:text-white transition-colors">
                                                                    <UserIcon className="w-5 h-5" />
                                                                </div>
                                                                <div className="text-left">
                                                                    <p className="text-xs font-black text-slate-900 uppercase tracking-widest">{c.nombre}</p>
                                                                    <p className="text-[10px] font-bold text-slate-500 uppercase">{c.telefono[0]}</p>
                                                                </div>
                                                            </div>
                                                            <ArrowRightIcon className="w-4 h-4 text-slate-300 group-hover:text-brand-blue transition-colors" />
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Footer Help / Telemetry */}
                            <div className="bg-slate-50 px-8 py-5 flex items-center justify-between border-t border-slate-100 relative overflow-hidden">
                                <div className="absolute left-0 bottom-0 w-full h-[2px] bg-gradient-to-r from-transparent via-brand-blue/20 to-transparent"></div>
                                
                                <div className="flex items-center gap-8 relative z-10">
                                    <div className="flex items-center gap-3">
                                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">SYSLINK_STABLE</span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <kbd className="px-2 py-1 bg-white border border-slate-200 rounded text-[10px] text-slate-400 font-mono">↵</kbd>
                                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Select</span>
                                    </div>
                                </div>
                                <div className="text-[9px] font-black text-slate-400 uppercase tracking-[0.5em] flex items-center gap-3">
                                    <div className="w-4 h-[1px] bg-brand-blue/30"></div>
                                    CENTRO DE COMANDO <span className="text-brand-blue">CÓRDOVA v3.0</span>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </>
    );
};
