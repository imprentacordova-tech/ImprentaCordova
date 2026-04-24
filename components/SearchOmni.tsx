
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
                className="hidden lg:flex items-center gap-4 px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-slate-500 hover:bg-white/10 transition-all group"
            >
                <SearchIcon className="w-4 h-4" />
                <span className="text-[10px] font-black uppercase tracking-widest">Búsqueda Rápida...</span>
                <div className="flex items-center gap-1 px-2 py-0.5 bg-black/50 border border-white/10 rounded-md text-[9px] font-mono">
                    <CommandIcon className="w-2 h-2" /> <span>K</span>
                </div>
            </button>

            {/* Mobile Trigger (Fab-like in header) */}
            <button 
                onClick={() => setIsOpen(true)}
                className="lg:hidden p-3 bg-liquid-gold text-black rounded-full shadow-gold-glow fixed top-4 right-4 z-50 scale-90"
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
                            className="fixed inset-0 bg-black/80 backdrop-blur-md"
                        />

                        {/* Modal Container */}
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0, y: -20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.95, opacity: 0, y: -20 }}
                            className="relative w-full max-w-2xl bg-[#0c1324] border border-white/10 rounded-[2rem] shadow-[0_0_100px_rgba(0,0,0,0.8)] overflow-hidden"
                        >
                            {/* Search Input */}
                            <div className="relative border-b border-white/5">
                                <SearchIcon className="absolute left-8 top-1/2 -translate-y-1/2 w-5 h-5 text-liquid-gold" />
                                <input 
                                    autoFocus
                                    placeholder="BUSCAR PEDIDO #, CLIENTE O SERVICIO..."
                                    value={query}
                                    onChange={(e) => setQuery(e.target.value)}
                                    className="w-full bg-transparent pl-16 pr-20 py-8 text-lg font-black text-white uppercase tracking-widest placeholder:text-slate-700 outline-none"
                                />
                                <button 
                                    onClick={() => setIsOpen(false)}
                                    className="absolute right-8 top-1/2 -translate-y-1/2 p-2 bg-white/5 rounded-full text-slate-500 hover:text-white transition-colors"
                                >
                                    <XIcon className="w-4 h-4" />
                                </button>
                            </div>

                            {/* Results Area */}
                            <div className="max-h-[60vh] overflow-y-auto p-4 custom-scrollbar">
                                {!query ? (
                                    <div className="p-8 text-center">
                                        <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
                                            <CommandIcon className="w-8 h-8 text-slate-700" />
                                        </div>
                                        <p className="text-xs font-black text-slate-500 uppercase tracking-widest">Escribe algo para empezar a buscar...</p>
                                    </div>
                                ) : (results.trabajos.length === 0 && results.clientes.length === 0) ? (
                                    <div className="p-12 text-center">
                                        <p className="text-xs font-black text-slate-600 uppercase tracking-[0.2em]">No se encontraron resultados para "{query}"</p>
                                    </div>
                                ) : (
                                    <div className="space-y-8 p-4">
                                        {/* Trabajos Results */}
                                        {results.trabajos.length > 0 && (
                                            <div>
                                                <h4 className="px-4 text-[10px] font-black text-liquid-gold/50 uppercase tracking-[0.3em] mb-4">Pedidos Encontrados</h4>
                                                <div className="space-y-2">
                                                    {results.trabajos.map(t => (
                                                        <button 
                                                            key={t.id}
                                                            onClick={() => handleSelect(`/nota-de-venta/${t.id}`)}
                                                            className="w-full flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5 hover:border-liquid-gold/30 hover:bg-white/10 transition-all group"
                                                        >
                                                            <div className="flex items-center gap-4">
                                                                <div className="w-10 h-10 rounded-xl bg-liquid-gold/10 flex items-center justify-center text-liquid-gold group-hover:bg-liquid-gold group-hover:text-black transition-colors">
                                                                    <FileTextIcon className="w-5 h-5" />
                                                                </div>
                                                                <div className="text-left">
                                                                    <p className="text-xs font-black text-white uppercase tracking-widest">ORDEN #{t.orden}</p>
                                                                    <p className="text-[10px] font-bold text-slate-500 uppercase">{t.subtipo}</p>
                                                                </div>
                                                            </div>
                                                            <ArrowRightIcon className="w-4 h-4 text-slate-700 group-hover:text-liquid-gold transition-colors" />
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* Clientes Results */}
                                        {results.clientes.length > 0 && (
                                            <div>
                                                <h4 className="px-4 text-[10px] font-black text-liquid-gold/50 uppercase tracking-[0.3em] mb-4">Clientes Registrados</h4>
                                                <div className="space-y-2">
                                                    {results.clientes.map(c => (
                                                        <button 
                                                            key={c.id}
                                                            onClick={() => handleSelect(`/clientes`)}
                                                            className="w-full flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5 hover:border-liquid-gold/30 hover:bg-white/10 transition-all group"
                                                        >
                                                            <div className="flex items-center gap-4">
                                                                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400 group-hover:bg-emerald-500 group-hover:text-white transition-colors">
                                                                    <UserIcon className="w-5 h-5" />
                                                                </div>
                                                                <div className="text-left">
                                                                    <p className="text-xs font-black text-white uppercase tracking-widest">{c.nombre}</p>
                                                                    <p className="text-[10px] font-bold text-slate-500 uppercase">{c.telefono[0]}</p>
                                                                </div>
                                                            </div>
                                                            <ArrowRightIcon className="w-4 h-4 text-slate-700 group-hover:text-liquid-gold transition-colors" />
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Footer Help */}
                            <div className="bg-black/40 px-8 py-4 flex items-center justify-between border-t border-white/5">
                                <div className="flex items-center gap-6">
                                    <div className="flex items-center gap-2">
                                        <kbd className="px-2 py-1 bg-white/5 rounded text-[10px] text-slate-500 font-mono">↵</kbd>
                                        <span className="text-[9px] font-bold text-slate-600 uppercase">Seleccionar</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <kbd className="px-2 py-1 bg-white/5 rounded text-[10px] text-slate-500 font-mono">↑↓</kbd>
                                        <span className="text-[9px] font-bold text-slate-600 uppercase">Navegar</span>
                                    </div>
                                </div>
                                <div className="text-[9px] font-black text-slate-700 uppercase tracking-widest">
                                    CORDOVA COMMAND CENTER
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </>
    );
};
