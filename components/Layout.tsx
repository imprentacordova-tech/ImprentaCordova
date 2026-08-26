import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { NavLink, useLocation, Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { APP_NAME } from '../constants';
import {
    AddIcon, LogoutIcon, MenuIcon, CloseIcon,
    UsersIcon, Cog8ToothIcon,
    DashboardIcon, CalculatorIcon, PaletteIcon, CordovaLogo,
    SparklesIcon, RocketLaunchIcon,
    ActivityIcon, WalletIcon, CircleStackIcon, ShieldCheckIcon,
    MonitorIcon,
    GlobeIcon, ChevronDownIcon, ChevronRightIcon,
    ReceiptIcon, HistoryIcon, PuzzlePieceIcon
} from './Icons';
import { TrabajoEstado } from '../types';
import { useData } from '../contexts/DataContext';
import { useAuth } from '../contexts/AuthContext';
import { SEO } from './SEO';
import { MobileFloatingNav } from './MobileFloatingNav';
import { SearchOmni } from './SearchOmni';
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts';

interface LayoutProps {
    children: React.ReactNode;
}

const buildNavGroups = (isAdmin: boolean) => [
    {
        id: 'operaciones',
        title: 'Operaciones',
        items: [
            { path: '/dashboard',  label: 'Panel Principal',       icon: DashboardIcon,   badge: null },
            { path: '/trabajos',   label: 'Órdenes',               icon: ActivityIcon,    badge: 'ordenes' },
            { path: '/nuevo',      label: 'Nueva Orden',           icon: SparklesIcon,    badge: null },
            { path: '/retiros',    label: 'Despacho',              icon: RocketLaunchIcon, badge: null },
        ],
    },
    {
        id: 'taller',
        title: 'Taller',
        items: [
            { path: '/kds',        label: 'Monitor de Taller',     icon: MonitorIcon,     badge: null },
            { path: '/diseno',     label: 'Diseño Gráfico',        icon: PaletteIcon,     badge: null },
            { path: '/inventario', label: 'Bodega de Insumos',     icon: CircleStackIcon, badge: 'stock' },
        ],
    },
    {
        id: 'finanzas',
        title: 'Finanzas',
        items: [
            { path: '/cuentas',     label: 'Cuentas por Cobrar',  icon: WalletIcon,       badge: 'cobrar' },
            { path: '/facturacion', label: 'Facturación SRI',     icon: ReceiptIcon,      badge: null },
            { path: '/finanzas',    label: 'Flujo de Caja',        icon: ReceiptIcon,      badge: null },
            { path: '/calculadora', label: 'Calculadora',          icon: CalculatorIcon,   badge: null },
        ],
    },
    {
        id: 'entidades',
        title: 'Entidades',
        items: [
            { path: '/clientes',    label: 'Clientes',             icon: UsersIcon,        badge: null },
            { path: '/proveedores', label: 'Proveedores',          icon: GlobeIcon,        badge: null },
        ],
    },
    ...(isAdmin ? [{
        id: 'sistema',
        title: 'Sistema',
        items: [
            { path: '/usuarios',      label: 'Usuarios',           icon: ShieldCheckIcon,  badge: null },
            { path: '/registro',      label: 'Auditoría',          icon: HistoryIcon,      badge: null },
            { path: '/configuracion', label: 'Configuración',      icon: Cog8ToothIcon,    badge: null },
            { path: '/extension-cordova.zip', label: 'Descargar Extensión', icon: PuzzlePieceIcon, badge: 'v2.1' },
        ],
    }] : []),
];

const PAGE_TITLES: Record<string, string> = {
    '/dashboard':     'Panel Principal',
    '/trabajos':      'Órdenes de Producción',
    '/nuevo':         'Nueva Orden',
    '/retiros':       'Despacho y Entregas',
    '/kds':           'Monitor de Taller',
    '/diseno':        'Diseño Gráfico',
    '/inventario':    'Bodega de Insumos',
    '/cuentas':       'Cuentas por Cobrar',
    '/facturacion':   'Facturación Electrónica SRI',
    '/finanzas':      'Flujo de Caja',
    '/calculadora':   'Calculadora de Precios',
    '/clientes':      'Directorio de Clientes',
    '/proveedores':   'Gestión de Proveedores',
    '/usuarios':      'Gestión de Usuarios',
    '/registro':      'Auditoría del Sistema',
    '/configuracion': 'Configuración General',
};

const RoleBadge: React.FC<{ rol: string }> = React.memo(({ rol }) => {
    const config = {
        'Admin':     { bg: 'bg-amber-500/10 border-amber-500/20 text-amber-400' },
        'root':      { bg: 'bg-brand-red/10 border-brand-red/20 text-brand-red' },
        'Operador':  { bg: 'bg-brand-blue/10 border-brand-blue/20 text-brand-blue' },
        'Diseñador': { bg: 'bg-purple-500/10 border-purple-500/20 text-purple-400' },
    }[rol] ?? { bg: 'bg-white/5 border-white/10 text-slate-400' };

    return (
        <span className={`text-[7px] font-black uppercase tracking-[0.3em] px-2 py-0.5 rounded-full border ${config.bg}`}>
            {rol}
        </span>
    );
});

const NavItem: React.FC<{
    item: { path: string; label: string; icon: any; badge: string | null };
    badges: Record<string, number>;
    onClick?: () => void;
}> = React.memo(({ item, badges, onClick }) => {
    const badgeCount = item.badge ? (typeof item.badge === 'number' ? item.badge : badges[item.badge]) : 0;
    const isDownload = item.path.endsWith('.zip');

    if (isDownload) {
        return (
            <a
                href={item.path}
                download
                onClick={onClick}
                className="group flex items-center gap-3.5 px-4 py-2.5 rounded-xl transition-all duration-300 relative text-left w-full text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/5 border border-emerald-500/15 my-1"
            >
                <item.icon className="w-4 h-4 shrink-0 text-emerald-400" />
                <span className="text-[11px] font-bold tracking-wide flex-1 truncate">{item.label}</span>
                <span className="text-[8px] font-black px-1.5 py-0.5 rounded-full shrink-0 bg-emerald-500/20 text-emerald-300 uppercase tracking-wider">
                    {item.badge || 'ZIP'}
                </span>
            </a>
        );
    }

    return (
        <NavLink
            to={item.path}
            onClick={onClick}
            className={({ isActive }) => `
                group flex items-center gap-3.5 px-4 py-2.5 rounded-xl transition-all duration-300 relative text-left w-full
                ${isActive
                    ? 'bg-liquid-gold/10 text-liquid-gold border-l-2 border-liquid-gold'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]'}
            `}
        >
            {({ isActive }) => (
                <>
                    <item.icon className={`w-4 h-4 shrink-0 transition-all duration-300 ${isActive ? 'text-liquid-gold' : ''}`} />
                    <span className="text-[11px] font-bold tracking-wide flex-1 truncate">{item.label}</span>
                    {badgeCount > 0 && (
                        <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-full shrink-0 ${
                            isActive ? 'bg-liquid-gold/20 text-liquid-gold' : 'bg-liquid-gold/10 text-liquid-gold/60'
                        }`}>
                            {badgeCount}
                        </span>
                    )}
                </>
            )}
        </NavLink>
    );
});

const NavGroup: React.FC<{
    group: ReturnType<typeof buildNavGroups>[number];
    badges: Record<string, number>;
    onNavClick?: () => void;
}> = React.memo(({ group, badges, onNavClick }) => {
    const location = useLocation();
    const isGroupActive = group.items.some(i => location.pathname === i.path);
    const [open, setOpen] = useState(true);

    useEffect(() => {
        const saved = localStorage.getItem(`nav-group-${group.id}`);
        if (saved !== null) setOpen(saved === 'true');
    }, [group.id]);

    const toggle = useCallback(() => {
        const next = !open;
        setOpen(next);
        localStorage.setItem(`nav-group-${group.id}`, String(next));
    }, [open, group.id]);

    return (
        <div className="space-y-1">
            <button
                onClick={toggle}
                className="w-full flex items-center justify-between px-4 py-1.5 group"
            >
                <span className={`text-[9px] font-black uppercase tracking-[0.4em] transition-colors ${
                    isGroupActive ? 'text-liquid-gold' : 'text-slate-500 group-hover:text-slate-400'
                }`}>
                    {group.title}
                </span>
                <ChevronDownIcon className={`w-3 h-3 text-slate-500 transition-transform duration-300 ${open ? '' : '-rotate-90'}`} />
            </button>

            <AnimatePresence initial={false}>
                {open && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25, ease: [0.23, 1, 0.32, 1] }}
                        className="overflow-hidden space-y-0.5 pl-1"
                    >
                        {group.items.map(item => (
                            <NavItem key={item.path} item={item} badges={badges} onClick={onNavClick} />
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
});

const Layout: React.FC<LayoutProps> = ({ children }) => {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const location = useLocation();
    const navigate = useNavigate();
    const { trabajos } = useData();
    const { user, logout: authLogout } = useAuth();
    useKeyboardShortcuts();

    if (!user) return null;

    const isAdmin = user.rol === 'Admin' || (user.rol as string) === 'root';
    const navGroups = useMemo(() => buildNavGroups(isAdmin), [isAdmin]);

    const badges = useMemo<Record<string, number>>(() => {
        if (!trabajos) return {};
        const activos = trabajos.filter(t => t.estado !== TrabajoEstado.ENTREGADO);
        return {
            ordenes: activos.length,
            cobrar: activos.filter(t => t.saldo > 0).length,
            stock:  0,
        };
    }, [trabajos]);

    const pageTitle = useMemo(() => PAGE_TITLES[location.pathname] || 'Sistema', [location.pathname]);

    useEffect(() => { setSidebarOpen(false); }, [location.pathname]);

    const [time, setTime] = useState(() => new Date().toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit' }));
    useEffect(() => {
        const timer = setInterval(() => {
            setTime(new Date().toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit' }));
        }, 30000);
        return () => clearInterval(timer);
    }, []);

    const userInitials = user.nombre.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();

    const SidebarContent = ({ onNavClick }: { onNavClick?: () => void }) => (
        <div className="h-full flex flex-col bg-obsidian-mid">
            {/* Brand */}
            <div className="px-5 pt-6 pb-4 border-b border-white/[0.06]">
                <Link to="/" className="flex items-center gap-3 group">
                    <div className="relative w-9 h-9 shrink-0">
                        <CordovaLogo className="w-9 h-9 object-contain transition-transform duration-700 group-hover:scale-105" />
                        <div className="absolute -inset-1.5 bg-liquid-gold/10 rounded-full blur-md opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                    <div className="flex flex-col leading-none min-w-0">
                        <span className="text-base font-black tracking-tighter text-white leading-none">
                            CÓRDOVA<span className="text-liquid-gold">.</span>
                        </span>
                        <span className="text-[7px] font-bold text-slate-500 uppercase tracking-[0.45em] mt-0.5">
                            Centro de Producción
                        </span>
                    </div>
                </Link>
            </div>

            {/* Quick Action */}
            <div className="px-4 pt-4 pb-3">
                <button
                    onClick={() => { navigate('/nuevo'); onNavClick?.(); }}
                    className="w-full flex items-center justify-center gap-2.5 py-3 btn-gold rounded-xl"
                >
                    <SparklesIcon className="w-3.5 h-3.5" />
                    Nueva Orden
                </button>
            </div>

            {/* Navigation */}
            <nav className="flex-1 overflow-y-auto px-3 pb-4 space-y-5 no-scrollbar">
                {navGroups.map(group => (
                    <NavGroup
                        key={group.id}
                        group={group}
                        badges={badges}
                        onNavClick={onNavClick}
                    />
                ))}
            </nav>

            {/* User Footer */}
            <div className="px-4 pb-5 pt-3 border-t border-white/[0.06] space-y-3">
                <div className="flex items-center gap-3 px-2 py-2 rounded-xl hover:bg-white/[0.03] transition-colors cursor-default">
                    <div className="w-9 h-9 rounded-xl bg-liquid-gold/10 border border-liquid-gold/15 flex items-center justify-center shrink-0">
                        <span className="text-[11px] font-black text-liquid-gold">{userInitials}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="text-[11px] font-black text-white truncate">{user.nombre}</div>
                        <RoleBadge rol={user.rol} />
                    </div>
                </div>

                <button
                    onClick={authLogout}
                    className="w-full flex items-center justify-center gap-2.5 py-2.5 text-slate-500 hover:text-brand-red hover:bg-brand-red/5 rounded-xl border border-transparent hover:border-brand-red/10 transition-all text-[10px] font-black uppercase tracking-widest"
                >
                    <LogoutIcon className="w-3.5 h-3.5" />
                    Cerrar Sesión
                </button>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-brand-dark text-slate-200 font-sans flex overflow-hidden">
            <SEO title={`${pageTitle} · Imprenta Córdova`} />

            {/* SIDEBAR DESKTOP */}
            <aside className="hidden lg:flex flex-col w-[240px] shrink-0 bg-obsidian-mid border-r border-white/[0.06] h-screen sticky top-0 z-[100]">
                <SidebarContent />
            </aside>

            {/* SIDEBAR MOBILE */}
            <AnimatePresence>
                {sidebarOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 z-[140] bg-black/60 backdrop-blur-sm lg:hidden"
                            onClick={() => setSidebarOpen(false)}
                        />
                        <motion.aside
                            initial={{ x: -280 }}
                            animate={{ x: 0 }}
                            exit={{ x: -280 }}
                            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
                            className="fixed inset-y-0 left-0 z-[150] w-[260px] bg-obsidian-mid border-r border-white/[0.06] lg:hidden"
                        >
                            <div className="absolute top-4 right-4 z-10">
                                <button
                                    onClick={() => setSidebarOpen(false)}
                                    className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-all"
                                >
                                    <CloseIcon className="w-4 h-4" />
                                </button>
                            </div>
                            <SidebarContent onNavClick={() => setSidebarOpen(false)} />
                        </motion.aside>
                    </>
                )}
            </AnimatePresence>

            {/* MAIN CONTENT */}
            <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
                {/* TOP HEADER */}
                <header className="h-[72px] bg-obsidian-mid/90 backdrop-blur-xl border-b border-white/[0.06] px-5 lg:px-8 flex items-center justify-between shrink-0 sticky top-0 z-[90]">
                    <div className="flex items-center gap-4 min-w-0">
                        <button
                            onClick={() => setSidebarOpen(true)}
                            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-all lg:hidden shrink-0"
                            aria-label="Abrir menú"
                        >
                            <MenuIcon className="w-5 h-5" />
                        </button>

                        <div className="flex flex-col min-w-0">
                            <div className="flex items-center gap-1.5 text-[9px] font-bold text-slate-500 uppercase tracking-[0.3em]">
                                <span>Imprenta Córdova</span>
                                <ChevronRightIcon className="w-2.5 h-2.5" />
                                <span className="text-liquid-gold truncate">{pageTitle}</span>
                            </div>
                            <div className="flex items-center gap-1.5 mt-0.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                <span className="text-[8px] font-mono text-slate-500 uppercase tracking-[0.2em]">
                                    Sistema en línea · {time}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                        {badges.ordenes > 0 && (
                            <button
                                onClick={() => navigate('/trabajos')}
                                className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-amber-500/10 border border-amber-500/20 rounded-lg hover:bg-amber-500/15 transition-colors"
                            >
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                                <span className="text-[9px] font-black text-amber-400 uppercase tracking-wider">
                                    {badges.ordenes} activas
                                </span>
                            </button>
                        )}

                        <SearchOmni />

                        <div className="w-9 h-9 rounded-xl bg-liquid-gold/10 border border-liquid-gold/15 flex items-center justify-center cursor-default">
                            <span className="text-[10px] font-black text-liquid-gold">{userInitials}</span>
                        </div>
                    </div>
                </header>

                {/* PAGE CONTENT */}
                <div className="flex-1 overflow-y-auto custom-scrollbar">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={location.pathname}
                            initial={{ opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -8 }}
                            transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
                            className="min-h-full"
                        >
                            {React.cloneElement(children as React.ReactElement, { currentUser: user })}
                        </motion.div>
                    </AnimatePresence>
                </div>
            </main>

            <MobileFloatingNav />
        </div>
    );
};

export default Layout;
