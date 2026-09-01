import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { NavLink, useLocation, Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    LogoutIcon, MenuIcon, CloseIcon,
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
import { ModalArqueoCaja } from './dashboard/ModalArqueoCaja';
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts';

/**
 * Layout interno — Sistema "Marino & Oro" (tema claro).
 * Shell fiel a `Panel-Interno.dc.html` (Claude Design): sidebar marino,
 * header claro, barra móvil. Cableado real: rutas, badges de datos, auth.
 * Ver design_manifest.md §2.
 */

interface LayoutProps {
    children: React.ReactNode;
}

// ── Paleta ──────────────────────────────────────────────────────────────────
const C = {
    bg: '#F7F9FF', ink: '#0A1140', royal: '#16309B', royalHover: '#0F2280',
    gold: '#FFC61A', border: '#E4E8F4', borderStrong: '#D7DDF0',
    faint: '#8A93AE', muted: '#6B7590', chipBlue: '#EEF1FC',
};

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

const ROLE_STYLE: Record<string, React.CSSProperties> = {
    'Admin':     { background: 'rgba(255,198,26,.1)', color: C.gold, borderColor: 'rgba(255,198,26,.3)' },
    'root':      { background: 'rgba(231,1,1,.1)', color: '#FF6B6B', borderColor: 'rgba(231,1,1,.25)' },
    'Operador':  { background: 'rgba(43,98,255,.12)', color: '#9DB4FF', borderColor: 'rgba(43,98,255,.25)' },
    'Diseñador': { background: 'rgba(139,92,246,.14)', color: '#C4B0FF', borderColor: 'rgba(139,92,246,.3)' },
};

const RoleBadge: React.FC<{ rol: string }> = React.memo(({ rol }) => (
    <span
        style={{
            display: 'inline-block', marginTop: 3, padding: '2px 7px', borderRadius: 99, border: '1px solid transparent',
            fontSize: 7.5, fontWeight: 800, letterSpacing: '.24em', textTransform: 'uppercase',
            ...(ROLE_STYLE[rol] ?? { background: 'rgba(255,255,255,.06)', color: '#9AA6CE', borderColor: 'rgba(255,255,255,.12)' }),
        }}
    >
        {rol}
    </span>
));

const NavItem: React.FC<{
    item: { path: string; label: string; icon: any; badge: string | null };
    badges: Record<string, number>;
    onClick?: () => void;
}> = React.memo(({ item, badges, onClick }) => {
    const [hover, setHover] = useState(false);
    const badgeCount = item.badge ? (typeof item.badge === 'number' ? item.badge : badges[item.badge]) : 0;
    const isDownload = item.path.endsWith('.zip');

    const rowBase: React.CSSProperties = {
        width: '100%', display: 'flex', alignItems: 'center', gap: 11, padding: '9px 12px',
        borderRadius: 10, cursor: 'pointer', border: 'none', fontFamily: 'inherit', transition: 'all .25s',
        textAlign: 'left',
    };

    if (isDownload) {
        return (
            <a
                href={item.path}
                download
                onClick={onClick}
                onMouseEnter={() => setHover(true)}
                onMouseLeave={() => setHover(false)}
                style={{ ...rowBase, color: '#7FD3A6', background: hover ? 'rgba(27,110,62,.16)' : 'rgba(27,110,62,.08)' }}
            >
                <PuzzlePieceIcon className="w-[15px] h-[15px] shrink-0" />
                <span style={{ flex: 1, fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.label}</span>
                <span style={{ flexShrink: 0, padding: '1px 7px', borderRadius: 99, fontSize: 9.5, fontWeight: 800, background: 'rgba(127,211,166,.18)', color: '#7FD3A6' }}>
                    {item.badge || 'ZIP'}
                </span>
            </a>
        );
    }

    return (
        <NavLink
            to={item.path}
            onClick={onClick}
            onMouseEnter={() => setHover(true)}
            onMouseLeave={() => setHover(false)}
            style={({ isActive }) => ({
                ...rowBase,
                ...(isActive
                    ? { background: 'rgba(255,198,26,.1)', color: C.gold, boxShadow: 'inset 2px 0 0 #FFC61A' }
                    : { background: hover ? 'rgba(255,255,255,.04)' : 'transparent', color: '#C2CAE6' }),
            })}
        >
            {({ isActive }) => (
                <>
                    <span style={{ display: 'flex', alignItems: 'center', color: isActive ? C.gold : '#8E9AC4' }}>
                        <item.icon className="w-[15px] h-[15px] shrink-0" />
                    </span>
                    <span style={{ flex: 1, fontSize: 12, fontWeight: 600, letterSpacing: '.01em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.label}</span>
                    {badgeCount > 0 && (
                        <span style={{
                            flexShrink: 0, padding: '1px 7px', borderRadius: 99, fontSize: 9.5, fontWeight: 800,
                            ...(isActive ? { background: 'rgba(255,198,26,.22)', color: C.gold } : { background: 'rgba(255,255,255,.08)', color: '#9AA6CE' }),
                        }}>
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
        <div>
            <button
                onClick={toggle}
                style={{
                    width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '5px 12px 7px', background: 'transparent', border: 'none', cursor: 'pointer', fontFamily: 'inherit',
                }}
            >
                <span style={{
                    fontSize: 9, fontWeight: 800, letterSpacing: '.34em', textTransform: 'uppercase',
                    color: isGroupActive ? C.gold : '#5C6892',
                }}>
                    {group.title}
                </span>
                <ChevronDownIcon className={`w-3 h-3 transition-transform duration-300 ${open ? '' : '-rotate-90'}`} style={{ color: '#5C6892' }} />
            </button>

            <AnimatePresence initial={false}>
                {open && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25, ease: [0.23, 1, 0.32, 1] }}
                        style={{ overflow: 'hidden', display: 'flex', flexDirection: 'column', gap: 2 }}
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

    const [userMenuOpen, setUserMenuOpen] = useState(false);
    const [arqueoModalOpen, setArqueoModalOpen] = useState(false);
    const [nuevaHover, setNuevaHover] = useState(false);
    const [logoutHover, setLogoutHover] = useState(false);

    const SidebarContent = ({ onNavClick }: { onNavClick?: () => void }) => (
        <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: C.ink, color: '#fff' }}>
            {/* Brand */}
            <div style={{ padding: '20px 18px 16px', borderBottom: '1px solid rgba(255,255,255,.09)' }}>
                <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 11, textDecoration: 'none' }}>
                    <CordovaLogo className="w-[34px] h-[34px] object-contain" style={{ background: '#fff', borderRadius: 7, padding: 2 }} />
                    <span style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.15, minWidth: 0 }}>
                        <span style={{ fontFamily: "'Outfit',sans-serif", fontSize: 16, fontWeight: 700, letterSpacing: '-.03em', color: '#fff' }}>
                            CÓRDOVA<span style={{ color: C.gold }}>.</span>
                        </span>
                        <span style={{ fontSize: 8, fontWeight: 700, letterSpacing: '.3em', textTransform: 'uppercase', color: '#7E8CBE', marginTop: 2 }}>
                            Centro de Producción
                        </span>
                    </span>
                </Link>
            </div>

            {/* Quick Action */}
            <div style={{ padding: '14px 14px 10px' }}>
                <button
                    onClick={() => { navigate('/nuevo'); onNavClick?.(); }}
                    onMouseEnter={() => setNuevaHover(true)}
                    onMouseLeave={() => setNuevaHover(false)}
                    style={{
                        width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 9, padding: 12,
                        background: nuevaHover ? '#F0B400' : C.gold, color: C.ink, border: 'none', borderRadius: 11,
                        fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
                    }}
                >
                    <SparklesIcon className="w-3.5 h-3.5" />
                    Nueva Orden
                </button>
            </div>

            {/* Navigation */}
            <nav style={{ flex: 1, overflowY: 'auto', padding: '4px 10px 16px', display: 'flex', flexDirection: 'column', gap: 16 }}>
                {navGroups.map(group => (
                    <NavGroup key={group.id} group={group} badges={badges} onNavClick={onNavClick} />
                ))}
            </nav>

            {/* User Footer */}
            <div style={{ padding: '12px 14px 16px', borderTop: '1px solid rgba(255,255,255,.09)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 11, padding: 8 }}>
                    <span style={{
                        width: 34, height: 34, borderRadius: 10, background: 'rgba(255,198,26,.14)', border: '1px solid rgba(255,198,26,.32)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 11, fontWeight: 800, color: C.gold,
                    }}>{userInitials}</span>
                    <span style={{ flex: 1, minWidth: 0 }}>
                        <span style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user.nombre}</span>
                        <RoleBadge rol={user.rol} />
                    </span>
                </div>
                <button
                    onClick={authLogout}
                    onMouseEnter={() => setLogoutHover(true)}
                    onMouseLeave={() => setLogoutHover(false)}
                    style={{
                        width: '100%', marginTop: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 9, padding: 10,
                        borderRadius: 10, fontSize: 10, fontWeight: 800, letterSpacing: '.2em', textTransform: 'uppercase',
                        cursor: 'pointer', fontFamily: 'inherit', transition: 'all .3s',
                        background: logoutHover ? 'rgba(231,1,1,.1)' : 'transparent',
                        color: logoutHover ? '#FF6B6B' : '#7E8CBE',
                        border: `1px solid ${logoutHover ? 'rgba(231,1,1,.25)' : 'transparent'}`,
                    }}
                >
                    <LogoutIcon className="w-3.5 h-3.5" />
                    Cerrar Sesión
                </button>
            </div>
        </div>
    );

    return (
        <div style={{ minHeight: '100vh', background: C.bg, color: C.ink, fontFamily: "'Inter',system-ui,sans-serif", display: 'flex' }}>
            <SEO title={`${pageTitle} · Imprenta Córdova`} />

            {/* SIDEBAR DESKTOP */}
            <aside
                className="hidden lg:flex"
                style={{ flexDirection: 'column', width: 248, flexShrink: 0, height: '100vh', position: 'sticky', top: 0, zIndex: 100 }}
            >
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
                            className="lg:hidden"
                            style={{ position: 'fixed', inset: 0, zIndex: 140, background: 'rgba(10,17,64,.45)', backdropFilter: 'blur(2px)' }}
                            onClick={() => setSidebarOpen(false)}
                        />
                        <motion.aside
                            initial={{ x: -280 }}
                            animate={{ x: 0 }}
                            exit={{ x: -280 }}
                            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
                            className="lg:hidden"
                            style={{ position: 'fixed', insetBlock: 0, left: 0, zIndex: 150, width: 260, boxShadow: '0 0 60px rgba(10,17,64,.4)' }}
                        >
                            <div style={{ position: 'absolute', top: 14, right: 14, zIndex: 10 }}>
                                <button
                                    onClick={() => setSidebarOpen(false)}
                                    style={{ padding: 8, borderRadius: 8, background: 'rgba(255,255,255,.06)', border: 'none', color: '#C2CAE6', cursor: 'pointer' }}
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
            <main style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
                {/* TOP HEADER */}
                <header
                    style={{
                        minHeight: 70, background: 'rgba(255,255,255,.92)', backdropFilter: 'blur(16px)',
                        borderBottom: `1px solid ${C.border}`, padding: '0 clamp(16px,2.4vw,32px)',
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 20,
                        position: 'sticky', top: 0, zIndex: 90,
                    }}
                >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
                        <button
                            onClick={() => setSidebarOpen(true)}
                            className="lg:hidden"
                            style={{ width: 42, height: 42, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F2F4FA', border: `1px solid ${C.border}`, borderRadius: 11, cursor: 'pointer' }}
                            aria-label="Abrir menú"
                        >
                            <MenuIcon className="w-5 h-5" style={{ color: C.ink }} />
                        </button>

                        <div style={{ minWidth: 0 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 9.5, fontWeight: 700, letterSpacing: '.28em', textTransform: 'uppercase', color: C.faint }}>
                                <span>Imprenta Córdova</span>
                                <ChevronRightIcon className="w-2.5 h-2.5" style={{ color: '#C7CEE4' }} />
                                <span style={{ color: C.royal, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{pageTitle}</span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginTop: 4 }}>
                                <span className="animate-pulse" style={{ width: 6, height: 6, borderRadius: 99, background: '#1B8A4B' }} />
                                <span style={{ fontSize: 10, fontFamily: "'JetBrains Mono',monospace", letterSpacing: '.16em', textTransform: 'uppercase', color: C.faint }}>
                                    Sistema en línea · {time}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
                        {badges.ordenes > 0 && (
                            <button
                                onClick={() => navigate('/trabajos')}
                                className="hidden md:flex"
                                style={{ alignItems: 'center', gap: 8, padding: '7px 13px', background: '#FFFBEB', border: '1px solid #F4E3A8', borderRadius: 9, cursor: 'pointer' }}
                            >
                                <span className="animate-pulse" style={{ width: 6, height: 6, borderRadius: 99, background: C.gold }} />
                                <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: '.1em', textTransform: 'uppercase', color: '#7A5A00' }}>
                                    {badges.ordenes} activas
                                </span>
                            </button>
                        )}

                        <SearchOmni />

                        {/* User Avatar & Session Menu */}
                        <div style={{ position: 'relative' }}>
                            <button
                                type="button"
                                onClick={() => setUserMenuOpen(v => !v)}
                                aria-label="Menú de usuario"
                                style={{
                                    width: 38,
                                    height: 38,
                                    borderRadius: 10,
                                    background: C.chipBlue,
                                    border: `1px solid ${userMenuOpen ? C.royal : C.borderStrong}`,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: 12,
                                    fontWeight: 800,
                                    color: C.royal,
                                    cursor: 'pointer',
                                    transition: 'all 0.2s',
                                }}
                            >
                                {userInitials}
                            </button>

                            <AnimatePresence>
                                {userMenuOpen && (
                                    <>
                                        <div
                                            style={{ position: 'fixed', inset: 0, zIndex: 100 }}
                                            onClick={() => setUserMenuOpen(false)}
                                        />
                                        <motion.div
                                            initial={{ opacity: 0, scale: 0.95, y: 8 }}
                                            animate={{ opacity: 1, scale: 1, y: 0 }}
                                            exit={{ opacity: 0, scale: 0.95, y: 8 }}
                                            transition={{ duration: 0.15 }}
                                            style={{
                                                position: 'absolute',
                                                right: 0,
                                                top: 'calc(100% + 8px)',
                                                width: 260,
                                                background: '#FFFFFF',
                                                border: `1px solid ${C.border}`,
                                                borderRadius: 14,
                                                boxShadow: '0 18px 40px -10px rgba(10,17,64,.18)',
                                                padding: '8px',
                                                zIndex: 110,
                                                display: 'flex',
                                                flexDirection: 'column',
                                                gap: 4,
                                            }}
                                        >
                                            {/* Header de Usuario */}
                                            <div style={{ padding: '10px 12px 8px', borderBottom: `1px solid ${C.border}` }}>
                                                <div style={{ fontSize: 13, fontWeight: 700, color: C.ink }}>
                                                    {user.nombre}
                                                </div>
                                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 }}>
                                                    <span style={{ fontSize: 10.5, color: C.muted }}>Rol: <b>{user.rol}</b></span>
                                                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 10, color: '#1B6E3E', fontWeight: 600 }}>
                                                        <span style={{ width: 5, height: 5, borderRadius: 99, background: '#1B8A4B' }} />
                                                        Turno activo
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Acciones */}
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setUserMenuOpen(false);
                                                    setArqueoModalOpen(true);
                                                }}
                                                style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: 9,
                                                    padding: '9px 12px',
                                                    borderRadius: 8,
                                                    border: 'none',
                                                    background: 'transparent',
                                                    color: C.ink,
                                                    fontSize: 12.5,
                                                    fontWeight: 600,
                                                    cursor: 'pointer',
                                                    textAlign: 'left',
                                                    width: '100%',
                                                }}
                                                onMouseEnter={(e) => { e.currentTarget.style.background = C.chipBlue; e.currentTarget.style.color = C.royal; }}
                                                onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = C.ink; }}
                                            >
                                                <WalletIcon className="w-4 h-4" style={{ color: C.royal }} />
                                                Arqueo y Cierre de Caja
                                            </button>

                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setUserMenuOpen(false);
                                                    navigate('/configuracion');
                                                }}
                                                style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: 9,
                                                    padding: '9px 12px',
                                                    borderRadius: 8,
                                                    border: 'none',
                                                    background: 'transparent',
                                                    color: C.ink,
                                                    fontSize: 12.5,
                                                    fontWeight: 600,
                                                    cursor: 'pointer',
                                                    textAlign: 'left',
                                                    width: '100%',
                                                }}
                                                onMouseEnter={(e) => { e.currentTarget.style.background = C.chipBlue; e.currentTarget.style.color = C.royal; }}
                                                onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = C.ink; }}
                                            >
                                                <Cog8ToothIcon className="w-4 h-4" style={{ color: C.muted }} />
                                                Mi Cuenta / Ajustes
                                            </button>

                                            <div style={{ height: 1, background: C.border, margin: '4px 0' }} />

                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setUserMenuOpen(false);
                                                    authLogout();
                                                    navigate('/login');
                                                }}
                                                style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: 9,
                                                    padding: '9px 12px',
                                                    borderRadius: 8,
                                                    border: 'none',
                                                    background: 'transparent',
                                                    color: '#B91C1C',
                                                    fontSize: 12.5,
                                                    fontWeight: 600,
                                                    cursor: 'pointer',
                                                    textAlign: 'left',
                                                    width: '100%',
                                                }}
                                                onMouseEnter={(e) => { e.currentTarget.style.background = '#FDEEEE'; }}
                                                onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                                            >
                                                <LogoutIcon className="w-4 h-4" />
                                                Cerrar Sesión
                                            </button>
                                        </motion.div>
                                    </>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>
                </header>

                {/* MODAL DE ARQUEO DE CAJA */}
                <ModalArqueoCaja
                    isOpen={arqueoModalOpen}
                    onClose={() => setArqueoModalOpen(false)}
                    userName={user.nombre}
                />

                {/* PAGE CONTENT */}
                <div style={{ flex: 1, overflowY: 'auto' }}>
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={location.pathname}
                            initial={{ opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -8 }}
                            transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
                            style={{ minHeight: '100%' }}
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
