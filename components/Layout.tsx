
import React, { useState, useEffect, useCallback } from 'react';
import { NavLink, useLocation, Link, useNavigate } from 'react-router-dom';
import { APP_NAME } from '../constants';
import {
    KdsIcon, FinanceIcon, ClientsIcon, AddIcon, LogoutIcon, MenuIcon, CloseIcon,
    InventoryIcon, BoxIcon, DocumentIcon, UsersIcon, ReceiptIcon, Cog8ToothIcon,
    BuildingStorefrontIcon, SolidBoxIcon, DashboardIcon, CalculatorIcon,
    GlobeAltIcon, PaletteIcon, CordovaLogo, CheckCircleIcon,
    ArrowPathIcon, SparklesIcon, BoltIcon, ChevronRightIcon,
} from './Icons';
import { User, TrabajoEstado } from '../types';
import { useData } from '../contexts/DataContext';
import { SEO } from './SEO';
import { MobileFloatingNav } from './MobileFloatingNav';

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
            { path: '/nuevo',    label: 'Nueva Orden',  icon: AddIcon    },
            { path: '/diseno',   label: 'Diseño',        icon: PaletteIcon },
            { path: '/kds',      label: 'Producción',    icon: KdsIcon     },
            { path: '/retiros',  label: 'Entregas',      icon: ReceiptIcon },
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
    '/kds':           'Control de Producción',
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
const Sidebar: React.FC<{
    user: User;
    onLogout: () => void;
    onClose?: () => void;
}> = ({ user, onLogout, onClose }) => {
    const location  = useLocation();
    const navigate  = useNavigate();
    const { trabajos } = useData();

    const counts = {
        design: trabajos.filter(t =>
            [TrabajoEstado.PENDIENTE, TrabajoEstado.EN_DISENO].includes(t.estado)
        ).length,
        retail: trabajos.filter(t => t.estado === TrabajoEstado.VITRINA).length,
    };

    const handleNuevaOrden = () => {
        navigate('/nuevo');
        onClose?.();
    };

    return (
        <aside className="w-72 bg-slate-950 flex flex-col h-full border-r border-white/5 z-20 transition-all duration-300">

            {/* ── Logo / Brand ── */}
            <div className="p-10 border-b border-white/5 flex flex-col items-center gap-5 bg-white/[0.01] shrink-0">
                <div className="w-16 h-16 bg-white text-black rounded-2xl flex items-center justify-center shadow-[0_0_40px_rgba(255,255,255,0.08)] cursor-pointer transition-transform hover:scale-105 duration-500">
                    <CordovaLogo className="w-10 h-10" />
                </div>
                <div className="text-center">
                    <h1 className="font-display font-black text-2xl leading-none tracking-[0.3em] text-white uppercase">Córdova</h1>
                    <p className="text-[9px] font-black text-slate-600 uppercase tracking-[0.5em] mt-2">Gestión Administrativa</p>
                </div>
            </div>

            {/* ── Quick action ── */}
            <div className="px-6 pt-8 pb-2 shrink-0">
                <button
                    onClick={handleNuevaOrden}
                    className="group w-full flex items-center justify-between px-5 py-4 rounded-2xl bg-liquid-gold/10 border border-liquid-gold/20 hover:bg-liquid-gold hover:border-liquid-gold transition-all duration-500 text-liquid-gold hover:text-brand-dark shadow-gold-glow"
                >
                    <div className="flex items-center gap-3">
                        <BoltIcon className="w-4 h-4" />
                        <span className="text-[11px] font-black uppercase tracking-widest">Nueva Orden</span>
                    </div>
                    <ChevronRightIcon className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                </button>
            </div>

            {/* ── Nav ── */}
            <nav className="flex-grow px-6 py-6 space-y-8 overflow-y-auto custom-scrollbar">
                {navGroups.map(group => {
                    if (group.adminOnly && user.rol !== 'Admin') return null;
                    return (
                        <div key={group.title} className="space-y-1.5">
                            <h3 className="px-5 pb-2 text-[10px] font-black text-slate-700 uppercase tracking-[0.4em] font-display">
                                {group.title}
                            </h3>
                            {group.items.map(item => {
                                const isActive = location.pathname === item.path;
                                const badge =
                                    item.path === '/diseno'  ? counts.design  :
                                    item.path === '/retiros' ? counts.retail  : 0;

                                return (
                                    <NavLink
                                        key={item.path}
                                        to={item.path}
                                        onClick={onClose}
                                        className={`group flex items-center justify-between px-5 py-3.5 rounded-2xl text-[11px] font-bold uppercase tracking-widest transition-all duration-400 border ${
                                            isActive
                                                ? 'bg-white/5 border-liquid-gold/20 text-white shadow-gold-glow'
                                                : 'border-transparent text-slate-500 hover:bg-white/[0.04] hover:text-white hover:border-white/5'
                                        }`}
                                    >
                                        <div className="flex items-center gap-4">
                                            <item.icon className={`h-4 w-4 transition-colors duration-400 ${isActive ? 'text-liquid-gold' : 'text-slate-600 group-hover:text-liquid-gold'}`} />
                                            <span>{item.label}</span>
                                        </div>
                                        {badge > 0 && (
                                            <span className={`px-2 py-0.5 rounded-lg text-[10px] font-black ${isActive ? 'bg-liquid-gold text-brand-dark' : 'bg-white/5 text-slate-500 border border-white/8'}`}>
                                                {badge}
                                            </span>
                                        )}
                                    </NavLink>
                                );
                            })}
                        </div>
                    );
                })}
            </nav>

            {/* ── User card + Logout ── */}
            <div className="p-6 border-t border-white/5 bg-black/20 shrink-0">
                <div className="p-4 rounded-2xl border border-white/5 bg-white/[0.03] backdrop-blur-md">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="w-10 h-10 rounded-xl bg-liquid-gold text-brand-dark flex items-center justify-center font-black text-sm shadow-gold-glow shrink-0">
                            {user.nombre.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0 flex-1">
                            <p className="text-[11px] font-black text-white truncate uppercase tracking-wider">{user.nombre}</p>
                            <p className="text-[9px] font-bold text-liquid-gold uppercase tracking-widest">
                                {user.rol === 'Admin' ? 'Administrador' : user.rol}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onLogout}
                        className="group w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-transparent border border-white/5 text-slate-600 hover:text-red-400 hover:bg-red-400/10 hover:border-red-400/20 transition-all duration-300"
                    >
                        <LogoutIcon className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
                        <span className="text-[10px] font-black uppercase tracking-[0.3em]">Cerrar Sesión</span>
                    </button>
                </div>
            </div>
        </aside>
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

    const [theme, setTheme] = useState<'dark' | 'light'>(() => {
        return (localStorage.getItem('theme') as 'dark' | 'light') || 'dark';
    });

    useEffect(() => {
        if (theme === 'dark') {
            document.documentElement.classList.add('dark');
            document.documentElement.classList.remove('light');
        } else {
            document.documentElement.classList.remove('dark');
            document.documentElement.classList.add('light');
        }
        localStorage.setItem('theme', theme);
    }, [theme]);

    const toggleTheme = () => {
        setTheme(prev => prev === 'dark' ? 'light' : 'dark');
    };

    const timeStr = now.toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
    const dateStr = now.toLocaleDateString('es-EC', { weekday: 'short', day: 'numeric', month: 'short' });

    return (
        <header className="h-20 bg-brand-dark/60 backdrop-blur-3xl flex items-center justify-between px-8 border-b border-white/5 sticky top-0 z-30 transition-all duration-300 shrink-0">

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
                    <p className="text-[9px] font-black text-slate-600 uppercase tracking-[0.4em] mb-0.5">Módulo Activo</p>
                    <h2 className="text-sm font-display font-black text-white tracking-tight leading-none">{pageTitle}</h2>
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
                    <span className="text-base font-black text-white tracking-wider tabular-nums leading-none">{timeStr}</span>
                    <span className="text-[9px] font-black text-slate-600 uppercase tracking-[0.3em]">{dateStr}</span>
                </div>

                {/* Theme Toggle */}
                <button
                    onClick={toggleTheme}
                    className="hidden md:flex items-center justify-center w-10 h-10 rounded-xl bg-white/5 border border-white/10 text-slate-400 hover:text-liquid-gold hover:border-liquid-gold/50 transition-all duration-300"
                    title={theme === 'dark' ? 'Cambiar a Modo Claro' : 'Cambiar a Modo Oscuro'}
                >
                    {theme === 'dark' ? <SparklesIcon className="w-5 h-5" /> : <SolidBoxIcon className="w-5 h-5" />}
                </button>

                <div className="h-8 w-px bg-white/5 hidden md:block" />

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
        <div className="flex h-screen bg-brand-dark overflow-hidden font-sans selection:bg-liquid-gold selection:text-brand-dark">
            <SEO title="Imprenta Córdova | Backend Administrativo" includeLocalBusiness={false} robots={false} />

            {/* ── Mobile Sidebar Overlay ── */}
            <div
                className={`fixed inset-0 z-[100] lg:hidden transition-all duration-500 ${sidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
                aria-hidden={!sidebarOpen}
            >
                <div
                    className="absolute inset-0 bg-black/80 backdrop-blur-md"
                    onClick={() => setSidebarOpen(false)}
                />
                <div className={`relative w-72 h-full transition-transform duration-500 ease-out ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                    <Sidebar user={user} onLogout={onLogout} onClose={() => setSidebarOpen(false)} />
                    <button
                        onClick={() => setSidebarOpen(false)}
                        className="absolute top-6 right-[-50px] p-3 text-white hover:text-liquid-gold transition-colors"
                        aria-label="Cerrar menú"
                    >
                        <CloseIcon className="h-6 w-6" />
                    </button>
                </div>
            </div>

            {/* ── Desktop Sidebar ── */}
            <div className="hidden lg:flex lg:flex-shrink-0">
                <Sidebar user={user} onLogout={onLogout} />
            </div>

            {/* ── Main content ── */}
            <div className="flex flex-col flex-1 w-0 overflow-hidden relative">
                {/* Ambient glow */}
                <div className="absolute top-0 left-0 w-[400px] h-[400px] bg-liquid-gold/4 rounded-full blur-[100px] -ml-48 -mt-48 pointer-events-none" />

                <Header onMenuClick={() => setSidebarOpen(true)} onLogout={onLogout} user={user} />

                <main className="flex-1 relative overflow-y-auto focus:outline-none p-8 lg:p-12 pb-40 lg:pb-12 scroll-smooth custom-scrollbar z-10">
                    <div className="max-w-[1600px] mx-auto w-full animate-slide-up">
                        {children}
                    </div>
                </main>

                <MobileFloatingNav />
            </div>
        </div>
    );
};
