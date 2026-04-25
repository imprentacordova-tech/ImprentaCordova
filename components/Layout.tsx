import React, { useState, useEffect, useCallback } from 'react';
import { NavLink, useLocation, Link, useNavigate } from 'react-router-dom';
import { APP_NAME } from '../constants';
import {
    KdsIcon, FinanceIcon, ClientsIcon, AddIcon, LogoutIcon, MenuIcon, CloseIcon,
    InventoryIcon, BoxIcon, DocumentIcon, UsersIcon, ReceiptIcon, Cog8ToothIcon,
    BuildingStorefrontIcon, SolidBoxIcon, DashboardIcon, CalculatorIcon,
    GlobeAltIcon, PaletteIcon, CordovaLogo, CheckCircleIcon,
    ArrowPathIcon, SparklesIcon, BoltIcon, ChevronRightIcon, PrinterIcon,
} from './Icons';
import { User, TrabajoEstado } from '../types';
import { useData } from '../contexts/DataContext';
import { SEO } from './SEO';
import { MobileFloatingNav } from './MobileFloatingNav';
import { SearchOmni } from './SearchOmni';

interface LayoutProps {
    children: React.ReactNode;
    onLogout: () => void;
    user: User;
}

// ── Navegación ────────────────────────────────────────────────────────────────
const navGroups = [
    {
        title: 'Principal',
        items: [
            { path: '/dashboard', label: 'Panel de Control', icon: DashboardIcon },
        ],
    },
    {
        title: 'Taller',
        items: [
            { path: '/nuevo',      label: 'Nueva Orden',   icon: AddIcon    },
            { path: '/diseno',     label: 'Diseño',        icon: PaletteIcon },
            { path: '/produccion', label: 'Impresión',     icon: PrinterIcon },
            { path: '/kds',        label: 'Control KDS',   icon: KdsIcon     },
            { path: '/retiros',    label: 'Entregas',      icon: ReceiptIcon },
        ],
    },
    {
        title: 'Gestión',
        items: [
            { path: '/clientes',    label: 'Clientes',      icon: ClientsIcon   },
            { path: '/trabajos',    label: 'Historial',     icon: DocumentIcon  },
            { path: '/cuentas',     label: 'Por Cobrar',    icon: FinanceIcon   },
            { path: '/proveedores', label: 'Proveedores',   icon: UsersIcon     },
            { path: '/productos',   label: 'Catálogo',      icon: BoxIcon       },
            { path: '/inventario',  label: 'Insumos',       icon: SolidBoxIcon  },
        ],
    },
    {
        title: 'Administración',
        adminOnly: true,
        items: [
            { path: '/finanzas',       label: 'Finanzas',      icon: FinanceIcon   },
            { path: '/usuarios',       label: 'Usuarios',      icon: UsersIcon     },
            { path: '/registro',       label: 'Auditoría',     icon: DocumentIcon  },
            { path: '/configuracion',  label: 'Ajustes',       icon: Cog8ToothIcon },
        ],
    },
];

// Map de rutas → título legible para el breadcrumb del header
const PAGE_TITLES: Record<string, string> = {
    '/dashboard':     'Panel de Control',
    '/':              'Vista Pública',
    '/nuevo':         'Nueva Orden de Trabajo',
    '/diseno':        'Estación de Diseño',
    '/produccion':    'Estación de Impresión',
    '/kds':           'Control de Flujo',
    '/retiros':       'Entregas y Retiros',
    '/clientes':      'Directorio de Clientes',
    '/trabajos':      'Historial de Órdenes',
    '/cuentas':       'Gestión de Cartera',
    '/proveedores':   'Gestión de Proveedores',
    '/productos':     'Catálogo de Servicios',
    '/inventario':    'Gestión de Insumos',
    '/finanzas':      'Análisis Financiero',
    '/usuarios':      'Control de Accesos',
    '/registro':      'Registro de Actividad',
    '/configuracion': 'Ajustes del Sistema',
};

// ── Hook: reloj en tiempo real ────────────────────────────────────────────────
function useLiveClock() {
    const [now, setNow] = useState(new Date());
    useEffect(() => {
        const id = setInterval(() => setNow(new Date()), 1000);
        return () => clearInterval(id);
    }, []);
    return now;
}

// ── Sidebar ───────────────────────────────────────────────────────────────────
// ── Floating Dock (Desktop Elite) ─────────────────────────────────────────────
const FloatingDock: React.FC<{
    user: User;
    onLogout: () => void;
    onMoreClick: () => void;
}> = ({ user, onLogout, onMoreClick }) => {
    const location = useLocation();
    const navigate = useNavigate();
    const { trabajos } = useData();

    const counts = {
        design: trabajos.filter(t => [TrabajoEstado.PENDIENTE, TrabajoEstado.EN_DISENO].includes(t.estado)).length,
        produccion: trabajos.filter(t => t.estado === TrabajoEstado.PROCESO).length,
        retail: trabajos.filter(t => t.estado === TrabajoEstado.VITRINA).length,
    };

    const dockItems = [
        { path: '/dashboard', label: 'Inicio', icon: DashboardIcon },
        { path: '/nuevo', label: 'Nuevo', icon: AddIcon, primary: true },
        { path: '/diseno', label: 'Diseño', icon: PaletteIcon, badge: counts.design },
        { path: '/produccion', label: 'Taller', icon: PrinterIcon, badge: counts.produccion },
        { path: '/kds', label: 'Flujo', icon: KdsIcon },
        { path: '/retiros', label: 'Entregas', icon: ReceiptIcon, badge: counts.retail },
    ];

    return (
        <div className="floating-dock">
            <div 
                className="w-10 h-10 bg-white dark:bg-liquid-gold text-black rounded-xl flex items-center justify-center mb-4 cursor-pointer hover:rotate-12 transition-transform shadow-xl"
                onClick={() => navigate('/dashboard')}
            >
                <CordovaLogo className="w-6 h-6" />
            </div>

            {dockItems.map(item => {
                const isActive = location.pathname === item.path;
                return (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        className={`dock-item group ${isActive ? 'dock-item-active' : 'dock-item-inactive'}`}
                    >
                        <item.icon className="w-5 h-5" />
                        <span className="dock-tooltip">{item.label}</span>
                        {item.badge ? (
                            <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[8px] font-black rounded-full flex items-center justify-center border border-white dark:border-brand-dark animate-pulse">
                                {item.badge}
                            </span>
                        ) : null}
                    </NavLink>
                );
            })}

            <div className="w-8 h-[1px] bg-slate-200 dark:bg-white/10 my-2" />

            <button onClick={onMoreClick} className="dock-item dock-item-inactive group">
                <ChevronRightIcon className="w-5 h-5 group-hover:translate-x-0.5 transition-transform" />
                <span className="dock-tooltip">Más Módulos</span>
            </button>

            <div className="mt-auto flex flex-col gap-4">
                <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-white/5 border border-slate-300 dark:border-white/10 flex items-center justify-center text-[10px] font-black text-slate-500 dark:text-slate-400 group relative">
                    {user.nombre.charAt(0).toUpperCase()}
                    <span className="dock-tooltip">{user.nombre}</span>
                </div>
                <button onClick={onLogout} className="dock-item group dock-item-inactive hover:text-red-500">
                    <LogoutIcon className="w-5 h-5" />
                    <span className="dock-tooltip">Salir</span>
                </button>
            </div>
        </div>
    );
};

// ── Header ────────────────────────────────────────────────────────────────────
const Header: React.FC<{
    onMenuClick: () => void;
    onLogout: () => void;
    user: User;
}> = ({ onMenuClick, onLogout, user }) => {
    const { syncing: isSyncing } = useData();
    const location = useLocation();
    const now = useLiveClock();

    const pageTitle = PAGE_TITLES[location.pathname] ?? 'Atelier';

    const [theme, setTheme] = useState<'dark' | 'light' | 'cordova'>(() => {
        return (localStorage.getItem('theme') as 'dark' | 'light' | 'cordova') || 'dark';
    });

    useEffect(() => {
        document.documentElement.classList.remove('dark', 'light', 'cordova');
        document.documentElement.classList.add(theme);
        localStorage.setItem('theme', theme);
    }, [theme]);

    const nextTheme = () => {
        if (theme === 'dark') setTheme('light');
        else if (theme === 'light') setTheme('cordova');
        else setTheme('dark');
    };

    const timeStr = now.toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
    const dateStr = now.toLocaleDateString('es-EC', { weekday: 'short', day: 'numeric', month: 'short' });

    return (
        <header className="h-20 bg-white/80 dark:bg-brand-dark/60 cordova:bg-brand-dark/90 backdrop-blur-3xl flex items-center justify-between px-8 border-b border-slate-200 dark:border-white/5 sticky top-0 z-30 transition-all duration-300 shrink-0">

            {/* LEFT: hamburger + page title */}
            <div className="flex items-center gap-5">
                <button
                    onClick={onMenuClick}
                    className="lg:hidden p-2.5 rounded-xl text-slate-400 hover:bg-white/5 hover:text-white transition-colors border border-white/5"
                    aria-label="Abrir menú"
                >
                    <MenuIcon className="h-5 w-5" />
                </button>

                <div className="hidden sm:block">
                    <p className="text-[9px] font-black text-slate-500 dark:text-slate-600 uppercase tracking-[0.4em] mb-0.5">Módulo Activo</p>
                    <h2 className="text-sm font-display font-black text-slate-900 dark:text-white tracking-tight leading-none">{pageTitle}</h2>
                </div>
            </div>

            {/* CENTER: sync status */}
            <div className="absolute left-1/2 -translate-x-1/2 hidden md:flex">
                <div className={`flex items-center gap-3 px-5 py-2 rounded-full border transition-all duration-700 backdrop-blur-md ${
                    isSyncing
                        ? 'bg-blue-500/10 border-blue-500/20 shadow-[0_0_20px_rgba(59,130,246,0.1)]'
                        : 'bg-emerald-500/10 border-emerald-500/20 shadow-[0_0_20px_rgba(16,185,129,0.1)]'
                }`}>
                    <div className="relative flex items-center justify-center w-2 h-2">
                        {isSyncing
                            ? <div className="w-2 h-2 rounded-full bg-blue-400 animate-ping" />
                            : <>
                                <div className="absolute w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                <div className="w-2 h-2 rounded-full bg-emerald-500" />
                              </>
                        }
                    </div>
                    <span className={`text-[10px] font-black uppercase tracking-[0.3em] ${isSyncing ? 'text-blue-400' : 'text-emerald-400'}`}>
                        {isSyncing ? 'Sincronizando…' : 'Protocolo Seguro'}
                    </span>
                    {isSyncing && <ArrowPathIcon className="w-3 h-3 text-blue-400 animate-spin" />}
                </div>
            </div>

            {/* RIGHT: clock + logout */}
            <div className="flex items-center gap-5">
                {/* Live clock */}
                <div className="hidden md:flex flex-col items-end gap-0.5">
                    <span className="text-base font-black text-slate-900 dark:text-white tracking-wider tabular-nums leading-none">{timeStr}</span>
                    <span className="text-[9px] font-black text-slate-500 dark:text-slate-600 uppercase tracking-[0.3em]">{dateStr}</span>
                </div>

                {/* Quick Search Trigger */}
                <SearchOmni />

                <div className="h-8 w-px bg-slate-200 dark:bg-white/5 hidden md:block" />

                {/* Theme Toggle (3 Steps) */}
                <button
                    onClick={nextTheme}
                    className={`flex items-center justify-center w-10 h-10 rounded-xl border transition-all duration-300 ${
                        theme === 'dark' ? 'bg-white/5 border-white/10 text-liquid-gold' :
                        theme === 'light' ? 'bg-slate-100 border-slate-200 text-slate-600' :
                        'bg-blue-900 border-yellow-500/50 text-yellow-400'
                    }`}
                    title={`Tema Actual: ${theme}`}
                >
                    {theme === 'dark' && <SparklesIcon className="w-5 h-5" />}
                    {theme === 'light' && <SolidBoxIcon className="w-5 h-5" />}
                    {theme === 'cordova' && <CordovaLogo className="w-5 h-5" />}
                </button>

                <div className="h-8 w-px bg-slate-200 dark:bg-white/5 hidden md:block" />

                {/* Logout (visible en header solo en mobile) */}
                <button
                    onClick={onLogout}
                    className="lg:hidden group p-2.5 rounded-xl text-slate-500 hover:text-red-400 hover:bg-red-400/10 transition-all border border-transparent hover:border-red-400/20"
                    title="Cerrar Sesión"
                >
                    <LogoutIcon className="h-4 w-4 transition-transform group-hover:scale-110" />
                </button>
            </div>
        </header>
    );
};

// ── Layout principal ──────────────────────────────────────────────────────────
export const Layout: React.FC<LayoutProps> = ({ children, onLogout, user }) => {
    const [sidebarOpen, setSidebarOpen] = useState(false);

    // Cerrar sidebar con tecla Esc
    const handleKeyDown = useCallback((e: KeyboardEvent) => {
        if (e.key === 'Escape') setSidebarOpen(false);
    }, []);

    useEffect(() => {
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [handleKeyDown]);

    // Bloquear scroll del body cuando el sidebar móvil está abierto
    useEffect(() => {
        document.body.style.overflow = sidebarOpen ? 'hidden' : '';
        return () => { document.body.style.overflow = ''; };
    }, [sidebarOpen]);

    return (
        <div className="flex h-screen bg-slate-50 dark:bg-brand-dark overflow-hidden font-sans selection:bg-liquid-gold selection:text-brand-dark transition-colors duration-500">
            <SEO title="Imprenta Córdova | Backend Administrativo" includeLocalBusiness={false} robots={false} />

            {/* ── Desktop/Mobile Sidebar Drawer Overlay ── */}
            <div
                className={`fixed inset-0 z-[100] transition-all duration-500 ${sidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
                aria-hidden={!sidebarOpen}
            >
                <div
                    className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                    onClick={() => setSidebarOpen(false)}
                />
                <div className={`absolute left-0 top-0 w-80 h-full transition-transform duration-500 cubic-bezier(0.4, 0, 0.2, 1) ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                    <aside className="w-80 bg-white dark:bg-slate-950 flex flex-col h-full border-r border-slate-200 dark:border-white/5 shadow-2xl relative">
                        {/* ── Drawer Header ── */}
                        <div className="p-8 border-b border-slate-100 dark:border-white/5 flex flex-col items-center gap-4 bg-slate-50/50 dark:bg-white/[0.01] shrink-0">
                            <div className="w-14 h-14 bg-white dark:bg-liquid-gold text-black rounded-2xl flex items-center justify-center shadow-lg transform rotate-3">
                                <CordovaLogo className="w-8 h-8" />
                            </div>
                            <div className="text-center">
                                <h1 className="font-display font-black text-xl leading-none tracking-widest text-slate-900 dark:text-white uppercase">Módulos</h1>
                                <p className="text-[8px] font-black text-slate-500 dark:text-slate-600 uppercase tracking-[0.4em] mt-2">Gestión Administrativa</p>
                            </div>
                        </div>

                        {/* ── Nav Items ── */}
                        <nav className="flex-grow px-4 py-8 space-y-8 overflow-y-auto custom-scrollbar scroll-smooth">
                            {navGroups.map(group => (
                                <div key={group.title} className="space-y-2">
                                    <h3 className="px-4 pb-2 text-[9px] font-black text-slate-400 dark:text-slate-600 uppercase tracking-[0.2em] flex items-center gap-2">
                                        <span className="w-1.5 h-1.5 bg-liquid-gold rounded-full" />
                                        {group.title}
                                    </h3>
                                    <div className="grid gap-1">
                                         {group.items.map(item => (
                                            <NavLink 
                                                key={item.path} 
                                                to={item.path} 
                                                onClick={() => setSidebarOpen(false)}
                                                className={({isActive}) => `
                                                    flex items-center gap-4 px-4 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-300 group
                                                    ${isActive 
                                                        ? 'bg-slate-900 dark:bg-white text-white dark:text-brand-dark shadow-lg scale-[1.02]' 
                                                        : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-white/5 hover:translate-x-1'}
                                                `}
                                            >
                                                {({ isActive }) => (
                                                    <>
                                                        <item.icon className={`w-4 h-4 transition-transform group-hover:rotate-12 ${isActive ? 'text-liquid-gold' : ''}`} />
                                                        {item.label}
                                                    </>
                                                )}
                                            </NavLink>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </nav>

                        {/* Close button inside for desktop feel */}
                        <button
                            onClick={() => setSidebarOpen(false)}
                            className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
                        >
                            <CloseIcon className="w-5 h-5" />
                        </button>
                    </aside>
                </div>
            </div>

            {/* ── Desktop Floating Dock ── */}
            <div className="hidden lg:flex lg:flex-shrink-0 w-24 relative">
                <FloatingDock user={user} onLogout={onLogout} onMoreClick={() => setSidebarOpen(true)} />
            </div>

            {/* ── Main content ── */}
            <div className="flex flex-col flex-1 w-0 overflow-hidden relative lg:pl-4 transition-all duration-500">
                {/* Ambient glow */}
                <div className="absolute top-0 left-0 w-[400px] h-[400px] bg-liquid-gold/5 rounded-full blur-[100px] -ml-48 -mt-48 pointer-events-none" />

                <Header onMenuClick={() => setSidebarOpen(true)} onLogout={onLogout} user={user} />

                <main className="flex-1 relative overflow-y-auto focus:outline-none p-6 lg:p-10 pb-40 lg:pb-12 scroll-smooth custom-scrollbar z-10">
                    <div className="max-w-[1600px] mx-auto w-full animate-slide-up">
                        {children}
                    </div>
                </main>

                <MobileFloatingNav />
            </div>
        </div>
    );
};
