
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
    MonitorIcon, FingerPrintIcon,
    GlobeIcon, ChevronDownIcon, ChevronRightIcon,
    ReceiptIcon, HistoryIcon, BoltIcon
} from './Icons';
import { User, TrabajoEstado } from '../types';
import { useData } from '../contexts/DataContext';
import { SEO } from './SEO';
import { MobileFloatingNav } from './MobileFloatingNav';
import { SearchOmni } from './SearchOmni';
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts';

interface LayoutProps {
    children: React.ReactNode;
    onLogout: () => void;
    user: User;
}

// ─── NAV GROUPS ─────────────────────────────────────────────────────────────
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

// ─── ROLE BADGE ─────────────────────────────────────────────────────────────
const RoleBadge: React.FC<{ rol: string }> = ({ rol }) => {
    const config = {
        'Admin':     { bg: 'bg-amber-50 border-amber-200 text-amber-700' },
        'root':      { bg: 'bg-red-50 border-red-200 text-red-700' },
        'Operador':  { bg: 'bg-blue-50 border-blue-200 text-blue-700' },
        'Diseñador': { bg: 'bg-purple-50 border-purple-200 text-purple-700' },
    }[rol] ?? { bg: 'bg-slate-50 border-slate-200 text-slate-600' };

    return (
        <span className={`text-[7px] font-black uppercase tracking-[0.3em] px-2 py-0.5 rounded-full border ${config.bg}`}>
            {rol}
        </span>
    );
};

// ─── NAV ITEM ────────────────────────────────────────────────────────────────
const NavItem: React.FC<{
    item: { path: string; label: string; icon: any; badge: string | null };
    badges: Record<string, number>;
    onClick?: () => void;
}> = ({ item, badges, onClick }) => {
    const badgeCount = item.badge ? badges[item.badge] : 0;

    return (
        <NavLink
            to={item.path}
            onClick={onClick}
            className={({ isActive }) => `
                group flex items-center gap-3.5 px-4 py-2.5 rounded-xl transition-all duration-300 relative text-left w-full
                ${isActive
                    ? 'bg-brand-blue text-white shadow-blue-glow-sm'
                    : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'}
            `}
        >
            {({ isActive }) => (
                <>
                    <item.icon className={`w-4 h-4 shrink-0 transition-all duration-300 ${isActive ? 'text-white' : ''}`} />
                    <span className="text-[11px] font-bold tracking-wide flex-1 truncate">{item.label}</span>
                    {badgeCount > 0 && (
                        <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-full shrink-0 ${
                            isActive ? 'bg-white/20 text-white' : 'bg-brand-blue/10 text-brand-blue'
                        }`}>
                            {badgeCount}
                        </span>
                    )}
                </>
            )}
        </NavLink>
    );
};

// ─── NAV GROUP ───────────────────────────────────────────────────────────────
const NavGroup: React.FC<{
    group: ReturnType<typeof buildNavGroups>[number];
    badges: Record<string, number>;
    onNavClick?: () => void;
}> = ({ group, badges, onNavClick }) => {
    const location = useLocation();
    const isGroupActive = group.items.some(i => location.pathname === i.path);
    const [open, setOpen] = useState(true);

    // Load saved state
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
                    isGroupActive ? 'text-brand-blue' : 'text-slate-300 group-hover:text-slate-500'
                }`}>
                    {group.title}
                </span>
                <ChevronDownIcon className={`w-3 h-3 text-slate-300 transition-transform duration-300 ${open ? '' : '-rotate-90'}`} />
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
};

// ─── MAIN LAYOUT ─────────────────────────────────────────────────────────────
const Layout: React.FC<LayoutProps> = ({ children, onLogout, user }) => {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const location = useLocation();
    const navigate = useNavigate();
    const { trabajos, loading } = useData();
    useKeyboardShortcuts();

    const isAdmin = user.rol === 'Admin' || (user.rol as string) === 'root';
    const navGroups = useMemo(() => buildNavGroups(isAdmin), [isAdmin]);

    // Compute live badges from real data
    const badges = useMemo<Record<string, number>>(() => {
        if (!trabajos) return {};
        const activos = trabajos.filter(t => t.estado !== TrabajoEstado.ENTREGADO);
        return {
            ordenes: activos.length,
            cobrar: activos.filter(t => t.saldo > 0).length,
            stock:  0, // Inventory alerts would go here
        };
    }, [trabajos]);

    const pageTitle = useMemo(() => PAGE_TITLES[location.pathname] || 'Sistema Operativo', [location.pathname]);

    // Close sidebar on route change
    useEffect(() => { setSidebarOpen(false); }, [location.pathname]);

    // Current time display
    const [time, setTime] = useState(() => new Date().toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit' }));
    useEffect(() => {
        const timer = setInterval(() => {
            setTime(new Date().toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit' }));
        }, 30000);
        return () => clearInterval(timer);
    }, []);

    const userInitials = user.nombre.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();

    const SidebarContent = ({ onNavClick }: { onNavClick?: () => void }) => (
        <div className="h-full flex flex-col">

            {/* ── Brand ── */}
            <div className="px-5 pt-6 pb-4 border-b border-slate-100">
                <Link to="/" className="flex items-center gap-3 group">
                    <div className="relative w-9 h-9 shrink-0">
                        <CordovaLogo className="w-9 h-9 object-contain transition-transform duration-700 group-hover:scale-105" />
                        <div className="absolute -inset-1.5 bg-brand-blue/10 rounded-full blur-md opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                    <div className="flex flex-col leading-none min-w-0">
                        <span className="text-base font-black tracking-tighter text-slate-900 leading-none">
                            CÓRDOVA<span className="text-brand-blue">.</span>
                        </span>
                        <span className="text-[7px] font-bold text-slate-400 uppercase tracking-[0.45em] mt-0.5">
                            Centro de Producción
                        </span>
                    </div>
                </Link>
            </div>

            {/* ── Quick Action ── */}
            <div className="px-4 pt-4 pb-3">
                <button
                    onClick={() => { navigate('/nuevo'); onNavClick?.(); }}
                    className="w-full flex items-center justify-center gap-2.5 py-3 bg-brand-blue text-white rounded-xl text-[10px] font-black uppercase tracking-[0.25em] hover:bg-brand-blue/90 active:scale-95 transition-all shadow-blue-glow-sm"
                >
                    <SparklesIcon className="w-3.5 h-3.5" />
                    Nueva Orden
                </button>
            </div>

            {/* ── Navigation ── */}
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

            {/* ── User Footer ── */}
            <div className="px-4 pb-5 pt-3 border-t border-slate-100 space-y-3">
                {/* User info */}
                <div className="flex items-center gap-3 px-2 py-2 rounded-xl hover:bg-slate-50 transition-colors cursor-default">
                    <div className="w-9 h-9 rounded-xl bg-brand-blue/10 border border-brand-blue/15 flex items-center justify-center shrink-0">
                        <span className="text-[11px] font-black text-brand-blue">{userInitials}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="text-[11px] font-black text-slate-800 truncate">{user.nombre}</div>
                        <RoleBadge rol={user.rol} />
                    </div>
                </div>

                {/* Logout */}
                <button
                    onClick={onLogout}
                    className="w-full flex items-center justify-center gap-2.5 py-2.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl border border-transparent hover:border-red-100 transition-all text-[10px] font-black uppercase tracking-widest"
                >
                    <LogoutIcon className="w-3.5 h-3.5" />
                    Cerrar Sesión
                </button>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-slate-50 text-slate-900 font-sans flex overflow-hidden">
            <SEO title={`${pageTitle} · Imprenta Córdova`} />

            {/* ── SIDEBAR DESKTOP ── */}
            <aside className="hidden lg:flex flex-col w-[240px] shrink-0 bg-white border-r border-slate-200 h-screen sticky top-0 z-[100]">
                <SidebarContent />
            </aside>

            {/* ── SIDEBAR MOBILE OVERLAY ── */}
            <AnimatePresence>
                {sidebarOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 z-[140] bg-slate-900/40 backdrop-blur-sm lg:hidden"
                            onClick={() => setSidebarOpen(false)}
                        />
                        <motion.aside
                            initial={{ x: -280 }}
                            animate={{ x: 0 }}
                            exit={{ x: -280 }}
                            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
                            className="fixed inset-y-0 left-0 z-[150] w-[260px] bg-white border-r border-slate-200 lg:hidden"
                        >
                            <div className="absolute top-4 right-4 z-10">
                                <button
                                    onClick={() => setSidebarOpen(false)}
                                    className="p-2 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-all"
                                >
                                    <CloseIcon className="w-4 h-4" />
                                </button>
                            </div>
                            <SidebarContent onNavClick={() => setSidebarOpen(false)} />
                        </motion.aside>
                    </>
                )}
            </AnimatePresence>

            {/* ── MAIN CONTENT ── */}
            <main className="flex-1 flex flex-col min-w-0 overflow-hidden">

                {/* ── TOP HEADER ── */}
                <header className="h-[72px] bg-white/90 backdrop-blur-xl border-b border-slate-200 px-5 lg:px-8 flex items-center justify-between shrink-0 sticky top-0 z-[90]">
                    {/* Left: Menu + Title */}
                    <div className="flex items-center gap-4 min-w-0">
                        <button
                            onClick={() => setSidebarOpen(true)}
                            className="p-2 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-all lg:hidden shrink-0"
                            aria-label="Abrir menú"
                        >
                            <MenuIcon className="w-5 h-5" />
                        </button>

                        <div className="flex flex-col min-w-0">
                            {/* Breadcrumb */}
                            <div className="flex items-center gap-1.5 text-[9px] font-bold text-slate-400 uppercase tracking-[0.3em]">
                                <span>Imprenta Córdova</span>
                                <ChevronRightIcon className="w-2.5 h-2.5" />
                                <span className="text-brand-blue truncate">{pageTitle}</span>
                            </div>
                            {/* Sync indicator */}
                            <div className="flex items-center gap-1.5 mt-0.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                <span className="text-[8px] font-mono text-slate-400 uppercase tracking-[0.2em]">
                                    Sistema en línea · {time}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Right: Actions */}
                    <div className="flex items-center gap-2 shrink-0">
                        {/* Total pendientes badge */}
                        {badges.ordenes > 0 && (
                            <button
                                onClick={() => navigate('/trabajos')}
                                className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-amber-50 border border-amber-200 rounded-lg hover:bg-amber-100 transition-colors"
                            >
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                                <span className="text-[9px] font-black text-amber-700 uppercase tracking-wider">
                                    {badges.ordenes} activas
                                </span>
                            </button>
                        )}

                        <SearchOmni />

                        {/* User avatar */}
                        <div className="w-9 h-9 rounded-xl bg-brand-blue/10 border border-brand-blue/15 flex items-center justify-center cursor-default">
                            <span className="text-[10px] font-black text-brand-blue">{userInitials}</span>
                        </div>
                    </div>
                </header>

                {/* ── PAGE CONTENT ── */}
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
                            {children}
                        </motion.div>
                    </AnimatePresence>
                </div>
            </main>

            {/* Mobile Nav */}
            <MobileFloatingNav />
        </div>
    );
};

export default Layout;
