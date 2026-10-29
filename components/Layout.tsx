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
    ReceiptIcon, HistoryIcon, PuzzlePieceIcon, FileTextIcon,
    Box, Layers
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

const MONO = "'JetBrains Mono',monospace";

/**
 * Atajos globales, espejo de `hooks/useKeyboardShortcuts.ts`.
 *
 * El sistema YA tenía atajos (Alt+D, Alt+N, Alt+C…) pero eran completamente invisibles:
 * nadie los descubre. Mostrarlos en el menú es lo que los convierte en una herramienta.
 * Si agregás un atajo en el hook, agregalo acá.
 */
const ATAJOS: Record<string, string> = {
    '/dashboard':   'D',
    '/trabajos':    'T',
    '/nuevo':       'N',
    '/retiros':     'R',
    '/kds':         'K',
    '/inventario':  'I',
    '/clientes':    'C',
    '/facturacion': 'F',
};

/**
 * La acción más frecuente del negocio (tomar un pedido en el mostrador) se destaca como
 * botón principal, no como una fila más del menú: es lo que Pedro hace decenas de veces
 * por día y tenía el mismo peso visual que "Descargar Extensión".
 */
const RUTA_CTA = '/nuevo';

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
            { path: '/produccion', label: 'Flujo de Producción',   icon: Layers,          badge: null },
            { path: '/inventario', label: 'Bodega de Insumos',     icon: CircleStackIcon, badge: 'stock' },
            { path: '/productos',  label: 'Catálogo de Productos', icon: Box,             badge: null },
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
            { path: '/extension-cordova.zip', label: 'Descargar Extensión', icon: PuzzlePieceIcon, badge: 'v2.3' },
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
    '/productos':     'Catálogo de Productos',
    '/produccion':    'Flujo de Producción',
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
    isMobile?: boolean;
}> = React.memo(({ item, badges, onClick, isMobile }) => {
    const [hover, setHover] = useState(false);
    const badgeCount = item.badge ? (typeof item.badge === 'number' ? item.badge : badges[item.badge]) : 0;
    const isDownload = item.path.endsWith('.zip');

    const rowBase: React.CSSProperties = {
        width: '100%', display: 'flex', alignItems: 'center', gap: isMobile ? 12 : 11,
        padding: isMobile ? '10px 12px' : '9px 12px',
        minHeight: isMobile ? 48 : 38,
        borderRadius: 11, cursor: 'pointer', border: 'none', fontFamily: 'inherit', transition: 'all .2s',
        textAlign: 'left',
        WebkitTapHighlightColor: 'transparent',
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
                <div style={{
                    width: isMobile ? 32 : 24, height: isMobile ? 32 : 24,
                    borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: 'rgba(27,110,62,.2)', flexShrink: 0
                }}>
                    <PuzzlePieceIcon className={isMobile ? "w-4 h-4" : "w-[15px] h-[15px]"} />
                </div>
                <span style={{ flex: 1, fontSize: isMobile ? 13 : 12, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.label}</span>
                <span style={{ flexShrink: 0, padding: isMobile ? '2px 8px' : '1px 7px', borderRadius: 99, fontSize: 9.5, fontWeight: 800, background: 'rgba(127,211,166,.18)', color: '#7FD3A6' }}>
                    {item.badge || 'ZIP'}
                </span>
            </a>
        );
    }

    const atajo = ATAJOS[item.path];
    const esCTA = item.path === RUTA_CTA;

    return (
        <NavLink
            to={item.path}
            onClick={onClick}
            onMouseEnter={() => setHover(true)}
            onMouseLeave={() => setHover(false)}
            style={({ isActive }) => ({
                ...rowBase,
                position: 'relative',
                overflow: 'hidden',
                ...(esCTA
                    ? {
                        background: C.gold, color: C.ink, fontWeight: 700,
                        boxShadow: isActive ? '0 0 0 2px rgba(255,198,26,.45)' : '0 6px 16px -10px rgba(255,198,26,.9)',
                    }
                    : { background: isActive ? (isMobile ? 'rgba(255,198,26,.14)' : 'rgba(255,198,26,.12)') : (hover ? 'rgba(255,255,255,.05)' : 'transparent'), color: isActive ? C.gold : '#C2CAE6' }),
            })}
        >
            {({ isActive }) => (
                <>
                    {isActive && !esCTA && (
                        <motion.div
                            layoutId={isMobile ? "sidebarMobileActivePill" : "sidebarActivePill"}
                            transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                            style={{
                                position: 'absolute',
                                inset: 0,
                                background: isMobile ? 'rgba(255,198,26,.14)' : 'rgba(255,198,26,.12)',
                                borderLeft: '3px solid #FFC61A',
                                borderRadius: 10,
                                zIndex: 0,
                            }}
                        />
                    )}
                    {/* Contenedor de ícono nítido y ergonómico */}
                    <span style={{
                        position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
                        width: isMobile ? 32 : 22, height: isMobile ? 32 : 22,
                        borderRadius: isMobile ? 8 : 6,
                        background: esCTA ? 'transparent' : (isActive ? 'rgba(255,198,26,.18)' : (isMobile ? 'rgba(255,255,255,.05)' : 'transparent')),
                        color: esCTA ? C.ink : isActive ? C.gold : (isMobile ? '#A8B3D8' : '#8E9AC4'),
                        flexShrink: 0
                    }}>
                        <item.icon className={isMobile ? "w-[17px] h-[17px] shrink-0" : "w-[15px] h-[15px] shrink-0"} />
                    </span>
                    <span style={{
                        position: 'relative', zIndex: 1, flex: 1,
                        fontSize: isMobile ? 13 : 12,
                        fontWeight: esCTA ? 800 : (isActive ? 700 : 600),
                        letterSpacing: '.01em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'
                    }}>
                        {item.label}
                    </span>
                    {badgeCount > 0 ? (
                        <span style={{
                            position: 'relative', zIndex: 1, flexShrink: 0, padding: isMobile ? '2px 8px' : '1px 7px', borderRadius: 99,
                            fontSize: isMobile ? 10.5 : 9.5, fontWeight: 800,
                            ...(esCTA
                                ? { background: 'rgba(10,17,64,.16)', color: C.ink }
                                : isActive ? { background: 'rgba(255,198,26,.26)', color: C.gold } : { background: 'rgba(255,255,255,.1)', color: '#CBD5E1' }),
                        }}>
                            {badgeCount}
                        </span>
                    ) : (
                        isMobile && !esCTA && (
                            <ChevronRightIcon
                                className="w-3.5 h-3.5 shrink-0"
                                style={{
                                    position: 'relative', zIndex: 1,
                                    color: isActive ? C.gold : 'rgba(255,255,255,.2)',
                                    opacity: isActive ? 1 : 0.6
                                }}
                            />
                        )
                    )}
                    {/* Atajo de teclado sólo en computadoras de escritorio */}
                    {!isMobile && atajo && (
                        <span
                            title={`Atajo: Alt + ${atajo}`}
                            style={{
                                position: 'relative', zIndex: 1, flexShrink: 0, padding: '1px 5px', borderRadius: 5, fontFamily: MONO, fontSize: 9,
                                fontWeight: 700, letterSpacing: '.04em',
                                border: `1px solid ${esCTA ? 'rgba(10,17,64,.22)' : 'rgba(255,255,255,.14)'}`,
                                background: esCTA ? 'rgba(255,255,255,.28)' : 'transparent',
                                color: esCTA ? 'rgba(10,17,64,.75)' : isActive ? C.gold : '#6E7A9E',
                            }}
                        >⌥{atajo}</span>
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
    isMobile?: boolean;
}> = React.memo(({ group, badges, onNavClick, isMobile }) => {
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
        <div style={isMobile ? {
            background: 'rgba(255,255,255,.025)',
            border: '1px solid rgba(255,255,255,.05)',
            borderRadius: 14,
            padding: '5px 6px 7px',
        } : undefined}>
            <button
                onClick={toggle}
                style={{
                    width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: isMobile ? '7px 10px 8px' : '5px 12px 7px',
                    minHeight: isMobile ? 36 : undefined,
                    background: 'transparent', border: 'none', cursor: 'pointer', fontFamily: 'inherit',
                }}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                    <span style={{
                        width: 5, height: 5, borderRadius: '50%',
                        background: isGroupActive ? C.gold : '#5C6892',
                        transition: 'background 0.2s',
                    }} />
                    <span style={{
                        fontSize: isMobile ? 10 : 9, fontWeight: 800, letterSpacing: '.28em', textTransform: 'uppercase',
                        color: isGroupActive ? C.gold : '#7B88B2',
                    }}>
                        {group.title}
                    </span>
                </div>
                <ChevronDownIcon className={`w-3.5 h-3.5 transition-transform duration-300 ${open ? '' : '-rotate-90'}`} style={{ color: isGroupActive ? C.gold : '#5C6892' }} />
            </button>

            <AnimatePresence initial={false}>
                {open && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25, ease: [0.23, 1, 0.32, 1] }}
                        style={{ overflow: 'hidden', display: 'flex', flexDirection: 'column', gap: isMobile ? 4 : 2 }}
                    >
                        {group.items.map(item => (
                            <NavItem key={item.path} item={item} badges={badges} onClick={onNavClick} isMobile={isMobile} />
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

    // Cerrar sidebar al navegar
    useEffect(() => { setSidebarOpen(false); }, [location.pathname]);

    // Bloquear scroll de la página de fondo cuando el drawer móvil está abierto
    useEffect(() => {
        if (sidebarOpen) {
            const originalOverflow = document.body.style.overflow;
            document.body.style.overflow = 'hidden';
            return () => {
                document.body.style.overflow = originalOverflow;
            };
        }
    }, [sidebarOpen]);

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

    const SidebarContent = ({ onNavClick, isMobile }: { onNavClick?: () => void; isMobile?: boolean }) => (
        <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: C.ink, color: '#fff', position: 'relative' }}>
            {/* Header de Marca */}
            <div style={{
                padding: isMobile ? '16px 16px 14px' : '20px 18px 16px',
                borderBottom: '1px solid rgba(255,255,255,.09)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 12,
            }}>
                <Link to="/" onClick={() => onNavClick?.()} style={{ display: 'flex', alignItems: 'center', gap: 11, textDecoration: 'none', minWidth: 0 }}>
                    <CordovaLogo className="w-[34px] h-[34px] object-contain shrink-0" style={{ background: '#fff', borderRadius: 8, padding: 2 }} />
                    <span style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.15, minWidth: 0 }}>
                        <span style={{ fontFamily: "'Outfit',sans-serif", fontSize: 16, fontWeight: 700, letterSpacing: '-.03em', color: '#fff' }}>
                            CÓRDOVA<span style={{ color: C.gold }}>.</span>
                        </span>
                        <span style={{ fontSize: 8.5, fontWeight: 800, letterSpacing: '.24em', textTransform: 'uppercase', color: '#8A99C7', marginTop: 3, display: 'flex', alignItems: 'center', gap: 5 }}>
                            <span style={{ width: 5, height: 5, borderRadius: 99, background: '#10B981', display: 'inline-block' }} />
                            {isMobile ? 'Gestión Interna · Zaruma' : 'Centro de Producción'}
                        </span>
                    </span>
                </Link>

                {/* Botón cerrar integrado y táctil para celulares */}
                {isMobile && (
                    <button
                        type="button"
                        onClick={() => onNavClick?.()}
                        style={{
                            width: 38,
                            height: 38,
                            borderRadius: 10,
                            background: 'rgba(255,255,255,.08)',
                            border: '1px solid rgba(255,255,255,.14)',
                            color: '#E2E8F0',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            flexShrink: 0,
                            WebkitTapHighlightColor: 'transparent',
                        }}
                        aria-label="Cerrar menú de gestión"
                    >
                        <CloseIcon className="w-4 h-4" />
                    </button>
                )}
            </div>

            {/* Accesos rápidos táctiles */}
            <div style={{ padding: isMobile ? '12px 14px 10px' : '14px 14px 10px' }}>
                {isMobile ? (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 9 }}>
                        <button
                            type="button"
                            onClick={() => { navigate('/nuevo'); onNavClick?.(); }}
                            style={{
                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, padding: '11px 8px',
                                background: C.gold, color: C.ink, border: 'none', borderRadius: 11,
                                fontSize: 12.5, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit',
                                boxShadow: '0 4px 14px -3px rgba(255,198,26,.65)',
                                WebkitTapHighlightColor: 'transparent',
                            }}
                        >
                            <SparklesIcon className="w-3.5 h-3.5 shrink-0" />
                            <span>Nueva Orden</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => { navigate('/nuevo?cat=sri&es_sri=true'); onNavClick?.(); }}
                            style={{
                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, padding: '11px 8px',
                                background: 'rgba(255,198,26,.12)', color: C.gold, border: '1px solid rgba(255,198,26,.35)',
                                borderRadius: 11, fontSize: 12.5, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit',
                                WebkitTapHighlightColor: 'transparent',
                            }}
                        >
                            <FileTextIcon className="w-3.5 h-3.5 shrink-0" />
                            <span>SRI Fiscal</span>
                        </button>
                    </div>
                ) : (
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
                )}
            </div>

            {/* Lista navegable de módulos internos */}
            <nav
                style={{
                    flex: 1,
                    overflowY: 'auto',
                    WebkitOverflowScrolling: 'touch',
                    overscrollBehavior: 'contain',
                    touchAction: 'pan-y',
                    padding: isMobile ? '4px 12px 16px' : '4px 10px 16px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: isMobile ? 12 : 16
                }}
            >
                {navGroups.map(group => (
                    <NavGroup key={group.id} group={group} badges={badges} onNavClick={onNavClick} isMobile={isMobile} />
                ))}
            </nav>

            {/* Footer de Usuario & Turno Activo */}
            <div style={{
                padding: isMobile ? '12px 14px calc(14px + env(safe-area-inset-bottom, 12px))' : '12px 14px 16px',
                borderTop: '1px solid rgba(255,255,255,.09)',
                background: isMobile ? 'rgba(7,11,38,.98)' : 'transparent',
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '6px 4px' }}>
                    <span style={{
                        width: 36, height: 36, borderRadius: 10, background: 'rgba(255,198,26,.14)', border: '1px solid rgba(255,198,26,.32)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 11.5, fontWeight: 800, color: C.gold,
                    }}>{userInitials}</span>
                    <span style={{ flex: 1, minWidth: 0 }}>
                        <span style={{ display: 'block', fontSize: 12.5, fontWeight: 700, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user.nombre}</span>
                        <RoleBadge rol={user.rol} />
                    </span>
                </div>

                {isMobile ? (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 10 }}>
                        <button
                            type="button"
                            onClick={() => {
                                setArqueoModalOpen(true);
                                onNavClick?.();
                            }}
                            style={{
                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '9px 8px',
                                borderRadius: 10, fontSize: 11, fontWeight: 700,
                                cursor: 'pointer', fontFamily: 'inherit',
                                background: 'rgba(255,255,255,.07)',
                                color: '#E0E7FF',
                                border: '1px solid rgba(255,255,255,.12)',
                                WebkitTapHighlightColor: 'transparent',
                            }}
                        >
                            <WalletIcon className="w-3.5 h-3.5 shrink-0" style={{ color: C.gold }} />
                            <span>Arqueo</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => {
                                authLogout();
                                onNavClick?.();
                            }}
                            style={{
                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '9px 8px',
                                borderRadius: 10, fontSize: 11, fontWeight: 700,
                                cursor: 'pointer', fontFamily: 'inherit',
                                background: 'rgba(231,1,1,.12)',
                                color: '#FF8080',
                                border: '1px solid rgba(231,1,1,.28)',
                                WebkitTapHighlightColor: 'transparent',
                            }}
                        >
                            <LogoutIcon className="w-3.5 h-3.5 shrink-0" />
                            <span>Salir</span>
                        </button>
                    </div>
                ) : (
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
                )}
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

            {/* SIDEBAR MOBILE CON DISEÑO TÁCTIL ERGONÓMICO */}
            <AnimatePresence>
                {sidebarOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="lg:hidden"
                            style={{ position: 'fixed', inset: 0, zIndex: 140, background: 'rgba(10,17,64,.6)', backdropFilter: 'blur(5px)', WebkitBackdropFilter: 'blur(5px)', touchAction: 'none' }}
                            onClick={() => setSidebarOpen(false)}
                            onTouchEnd={() => setSidebarOpen(false)}
                        />
                        <motion.aside
                            initial={{ x: -340 }}
                            animate={{ x: 0 }}
                            exit={{ x: -340 }}
                            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
                            className="lg:hidden"
                            style={{
                                position: 'fixed',
                                insetBlock: 0,
                                left: 0,
                                zIndex: 150,
                                width: 'min(330px, 88vw)',
                                maxWidth: '88vw',
                                boxShadow: '0 0 60px rgba(10,17,64,.65)',
                                touchAction: 'pan-y',
                            }}
                        >
                            <SidebarContent onNavClick={() => setSidebarOpen(false)} isMobile />
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
                                <span style={{ position: 'relative', display: 'flex', width: 7, height: 7, alignItems: 'center', justifyContent: 'center' }}>
                                    <motion.span
                                        animate={{ scale: [1, 2.3], opacity: [0.7, 0] }}
                                        transition={{ repeat: Infinity, duration: 2, ease: 'easeOut' }}
                                        style={{ position: 'absolute', inset: 0, borderRadius: 99, background: '#1B8A4B' }}
                                    />
                                    <span style={{ position: 'relative', width: 6, height: 6, borderRadius: 99, background: '#1B8A4B' }} />
                                </span>
                                <span style={{ fontSize: 10, fontFamily: "'JetBrains Mono',monospace", letterSpacing: '.16em', textTransform: 'uppercase', color: C.faint }}>
                                    Sistema en línea · {time}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
                        {badges.ordenes > 0 && (
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => navigate('/trabajos')}
                                className="hidden md:flex"
                                style={{ alignItems: 'center', gap: 8, padding: '7px 13px', background: '#FFFBEB', border: '1px solid #F4E3A8', borderRadius: 9, cursor: 'pointer' }}
                            >
                                <motion.span
                                    animate={{ scale: [1, 1.4, 1] }}
                                    transition={{ repeat: Infinity, duration: 1.8 }}
                                    style={{ width: 6, height: 6, borderRadius: 99, background: C.gold }}
                                />
                                <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: '.1em', textTransform: 'uppercase', color: '#7A5A00' }}>
                                    {badges.ordenes} activas
                                </span>
                            </motion.button>
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
                                                maxWidth: 'calc(100vw - 32px)',
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

            <MobileFloatingNav onOpenMenu={() => setSidebarOpen(true)} />
        </div>
    );
};

export default Layout;
