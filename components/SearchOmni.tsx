import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    SearchIcon, 
    XIcon,
    ArrowRightIcon,
    UserIcon, 
    FileTextIcon,
    PlusIcon,
    DashboardIcon,
    CalculatorIcon,
    WalletIcon
} from './Icons';
import { useData } from '../contexts/DataContext';
import { useNavigate } from 'react-router-dom';
import { C, DISPLAY, MONO } from './panelTheme';

export const SearchOmni: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [query, setQuery] = useState('');
    const [selectedIndex, setSelectedIndex] = useState(0);
    const { trabajos, clientes } = useData();
    const navigate = useNavigate();
    const inputRef = useRef<HTMLInputElement>(null);

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

    useEffect(() => {
        if (isOpen) {
            setSelectedIndex(0);
            setTimeout(() => inputRef.current?.focus(), 50);
        }
    }, [isOpen]);

    const accionesRapidas = useMemo(() => [
        { id: 'act-nueva', titulo: 'Crear Nueva Orden', subtitulo: 'Atajo rápido de mostrador', icono: PlusIcon, path: '/nuevo' },
        { id: 'act-kds', titulo: 'Monitor de Taller (KDS)', subtitulo: 'Control de prensa y acabados', icono: DashboardIcon, path: '/kds' },
        { id: 'act-calc', titulo: 'Calculadora de Precios', subtitulo: 'Cotizador de resmas y pliegos', icono: CalculatorIcon, path: '/calculadora' },
        { id: 'act-caja', titulo: 'Flujo de Caja y Abonos', subtitulo: 'Cuentas por cobrar y finanzas', icono: WalletIcon, path: '/cuentas' },
    ], []);

    const flatResults = useMemo(() => {
        const q = query.trim().toLowerCase();
        if (!q) return accionesRapidas.map(a => ({ ...a, type: 'accion' }));

        const matchedAcciones = accionesRapidas.filter(a =>
            a.titulo.toLowerCase().includes(q) || a.subtitulo.toLowerCase().includes(q)
        ).map(a => ({ ...a, type: 'accion' }));

        const filteredTrabajos = trabajos.filter(t => 
            t.orden.toString().includes(q) || 
            t.titular.toLowerCase().includes(q) ||
            (t.tipo || '').toLowerCase().includes(q) ||
            (t.subtipo && t.subtipo.toLowerCase().includes(q))
        ).slice(0, 5).map(t => ({
            id: `trab-${t.id}`,
            titulo: `Orden #${t.orden} · ${t.titular}`,
            subtitulo: `${t.tipo || 'Trabajo general'} · Saldo: $${(t.saldo || 0).toFixed(2)}`,
            path: `/nota-de-venta/${t.id}`,
            type: 'trabajo',
            icono: FileTextIcon
        }));

        const filteredClientes = clientes.filter(c => 
            c.nombre.toLowerCase().includes(q) || 
            (c.ruc && c.ruc.includes(q)) ||
            (c.cedula && c.cedula.includes(q)) ||
            c.telefono.some(tel => tel.includes(q))
        ).slice(0, 4).map(c => ({
            id: `cli-${c.id}`,
            titulo: c.nombre,
            subtitulo: `Cédula/RUC: ${c.ruc || c.cedula || 'S/N'} · ${c.telefono[0] || 'Sin telf.'}`,
            path: '/clientes',
            type: 'cliente',
            icono: UserIcon
        }));

        return [...matchedAcciones, ...filteredTrabajos, ...filteredClientes];
    }, [query, trabajos, clientes, accionesRapidas]);

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setSelectedIndex(prev => (prev + 1) % (flatResults.length || 1));
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setSelectedIndex(prev => (prev - 1 + (flatResults.length || 1)) % (flatResults.length || 1));
        } else if (e.key === 'Enter') {
            e.preventDefault();
            if (flatResults[selectedIndex]) {
                handleSelect(flatResults[selectedIndex].path);
            }
        }
    };

    const handleSelect = (path: string) => {
        navigate(path);
        setIsOpen(false);
        setQuery('');
    };

    return (
        <>
            {/* Header Trigger Button */}
            <button 
                onClick={() => setIsOpen(true)}
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: '8px 14px',
                    background: C.bg,
                    border: `1px solid ${C.borderStrong}`,
                    borderRadius: 10,
                    color: C.muted,
                    fontSize: 12.5,
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    fontFamily: 'inherit',
                }}
                onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = C.royal;
                    e.currentTarget.style.background = '#FFFFFF';
                }}
                onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = C.borderStrong;
                    e.currentTarget.style.background = C.bg;
                }}
            >
                <SearchIcon className="w-4 h-4" style={{ color: C.faint }} />
                <span className="hidden sm:inline" style={{ color: C.faint }}>Buscar orden, cliente o RUC…</span>
                <span className="sm:hidden" style={{ color: C.faint }}>Buscar…</span>
                <span style={{
                    fontFamily: MONO,
                    fontSize: 10.5,
                    padding: '2px 6px',
                    background: C.chipBlue,
                    borderRadius: 6,
                    color: C.royal,
                    fontWeight: 700,
                }}>
                    ⌘K
                </span>
            </button>

            <AnimatePresence>
                {isOpen && (
                    <div style={{
                        position: 'fixed',
                        inset: 0,
                        zIndex: 250,
                        display: 'flex',
                        alignItems: 'flex-start',
                        justifyContent: 'center',
                        padding: '16px',
                        paddingTop: 'clamp(40px, 12vh, 100px)',
                    }}>
                        {/* Backdrop Scrim */}
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsOpen(false)}
                            style={{
                                position: 'fixed',
                                inset: 0,
                                background: C.scrim,
                                backdropFilter: 'blur(4px)',
                            }}
                        />

                        {/* Modal Container */}
                        <motion.div
                            initial={{ scale: 0.96, opacity: 0, y: -12 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.96, opacity: 0, y: -12 }}
                            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                            style={{
                                position: 'relative',
                                width: '100%',
                                maxWidth: 640,
                                background: C.surface,
                                border: `1px solid ${C.border}`,
                                borderRadius: 18,
                                boxShadow: '0 25px 60px -15px rgba(10, 17, 64, 0.35)',
                                overflow: 'hidden',
                                display: 'flex',
                                flexDirection: 'column',
                            }}
                        >
                            {/* Search Input Bar */}
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 12,
                                padding: '14px 18px',
                                borderBottom: `1px solid ${C.border}`,
                                background: C.surfaceAlt,
                            }}>
                                <SearchIcon className="w-5 h-5" style={{ color: C.royal, flexShrink: 0 }} />
                                <input 
                                    ref={inputRef}
                                    placeholder="Escribe número de orden, nombre, RUC o servicio…"
                                    value={query}
                                    onChange={(e) => {
                                        setQuery(e.target.value);
                                        setSelectedIndex(0);
                                    }}
                                    onKeyDown={handleKeyDown}
                                    style={{
                                        flex: 1,
                                        background: 'transparent',
                                        border: 'none',
                                        fontSize: 14.5,
                                        color: C.ink,
                                        outline: 'none',
                                        fontFamily: 'inherit',
                                    }}
                                />
                                {query && (
                                    <button 
                                        onClick={() => setQuery('')}
                                        style={{ background: 'transparent', border: 'none', color: C.faint, cursor: 'pointer', padding: 4 }}
                                    >
                                        <XIcon className="w-4 h-4" />
                                    </button>
                                )}
                                <button 
                                    onClick={() => setIsOpen(false)}
                                    style={{
                                        padding: '4px 8px',
                                        background: C.softGray,
                                        border: `1px solid ${C.border}`,
                                        borderRadius: 6,
                                        fontSize: 11,
                                        fontFamily: MONO,
                                        color: C.faint,
                                        cursor: 'pointer',
                                    }}
                                >
                                    ESC
                                </button>
                            </div>

                            {/* Results List */}
                            <div style={{ maxHeight: 360, overflowY: 'auto', padding: '8px' }}>
                                {flatResults.length === 0 ? (
                                    <div style={{ padding: '36px 20px', textAlign: 'center', color: C.muted }}>
                                        <p style={{ margin: 0, fontSize: 13.5, fontWeight: 600 }}>
                                            No se encontraron coincidencias para "{query}"
                                        </p>
                                        <p style={{ margin: '6px 0 0', fontSize: 12, color: C.faint }}>
                                            Prueba buscando por número de orden (#1001), RUC o nombre de cliente.
                                        </p>
                                    </div>
                                ) : (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                                        {flatResults.map((item, idx) => {
                                            const isSelected = idx === selectedIndex;
                                            const IconComp = item.icono;
                                            return (
                                                <button
                                                    key={item.id}
                                                    type="button"
                                                    onClick={() => handleSelect(item.path)}
                                                    onMouseEnter={() => setSelectedIndex(idx)}
                                                    style={{
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'space-between',
                                                        padding: '10px 14px',
                                                        borderRadius: 10,
                                                        border: 'none',
                                                        background: isSelected ? C.chipBlue : 'transparent',
                                                        color: isSelected ? C.royal : C.ink,
                                                        cursor: 'pointer',
                                                        textAlign: 'left',
                                                        fontFamily: 'inherit',
                                                        transition: 'all 0.15s',
                                                    }}
                                                >
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
                                                        <div style={{
                                                            width: 32,
                                                            height: 32,
                                                            borderRadius: 8,
                                                            background: isSelected ? '#FFFFFF' : C.surfaceAlt,
                                                            border: `1px solid ${isSelected ? C.borderStrong : C.border}`,
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center',
                                                            color: isSelected ? C.royal : C.muted,
                                                            flexShrink: 0,
                                                        }}>
                                                            <IconComp className="w-4 h-4" />
                                                        </div>
                                                        <div style={{ minWidth: 0 }}>
                                                            <div style={{
                                                                fontSize: 13,
                                                                fontWeight: 700,
                                                                color: isSelected ? C.royal : C.ink,
                                                                whiteSpace: 'nowrap',
                                                                overflow: 'hidden',
                                                                textOverflow: 'ellipsis',
                                                            }}>
                                                                {item.titulo}
                                                            </div>
                                                            <div style={{ fontSize: 11.5, color: C.muted, marginTop: 1 }}>
                                                                {item.subtitulo}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <ArrowRightIcon className="w-4 h-4" style={{ color: isSelected ? C.royal : C.faint, flexShrink: 0 }} />
                                                </button>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>

                            {/* Footer Shortcuts */}
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                padding: '10px 16px',
                                background: C.surfaceAlt,
                                borderTop: `1px solid ${C.border}`,
                                fontSize: 11,
                                color: C.faint,
                            }}>
                                <div style={{ display: 'flex', gap: 14 }}>
                                    <span><kbd style={{ fontFamily: MONO, padding: '2px 5px', background: '#FFFFFF', border: `1px solid ${C.borderStrong}`, borderRadius: 4 }}>↑</kbd> <kbd style={{ fontFamily: MONO, padding: '2px 5px', background: '#FFFFFF', border: `1px solid ${C.borderStrong}`, borderRadius: 4 }}>↓</kbd> Navegar</span>
                                    <span><kbd style={{ fontFamily: MONO, padding: '2px 5px', background: '#FFFFFF', border: `1px solid ${C.borderStrong}`, borderRadius: 4 }}>↵</kbd> Abrir</span>
                                </div>
                                <span style={{ fontFamily: DISPLAY, fontWeight: 700, color: C.ink }}>
                                    Imprenta Córdova
                                </span>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </>
    );
};
