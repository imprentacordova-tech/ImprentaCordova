import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { NavLink, useLocation, Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { APP_NAME } from '../constants';
import {
    HomeIcon, AddIcon, LogoutIcon, MenuIcon, CloseIcon,
    BoxIcon, DocumentIcon, UsersIcon, Cog8ToothIcon,
    DashboardIcon, CalculatorIcon, PaletteIcon, CordovaLogo, 
    SparklesIcon, BoltIcon, PrinterIcon, RocketLaunchIcon,
    ActivityIcon, WalletIcon, CircleStackIcon, ShieldCheckIcon,
    ArrowRightIcon, SearchIcon, MonitorIcon, FingerPrintIcon,
    LayersIcon, CpuIcon, GlobeIcon
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

// ── Grupos de Navegación Elite ────────────────────────────────────────────────
const navGroups = [
    {
        title: 'ESTRATEGIA',
        items: [
            { path: '/dashboard', label: 'Command Center', icon: DashboardIcon },
            { path: '/trabajos',  label: 'Misiones Activas', icon: ActivityIcon },
        ],
    },
    {
        title: 'PRODUCCIÓN',
        items: [
            { path: '/nuevo-pedido', label: 'Nueva Orden', icon: SparklesIcon },
            { path: '/retiros',      label: 'Despacho_Vitrina', icon: RocketLaunchIcon },
            { path: '/inventario',   label: 'Bóveda de Insumos', icon: CircleStackIcon },
        ],
    },
    {
        title: 'FINANZAS',
        items: [
            { path: '/cuentas', label: 'Libro Contable', icon: WalletIcon },
            { path: '/caja',    label: 'Control de Flujo', icon: CalculatorIcon },
        ],
    },
    {
        title: 'ENTIDADES',
        items: [
            { path: '/clientes',    label: 'Bóveda Clientes', icon: UsersIcon },
            { path: '/proveedores', label: 'Aliados Supply', icon: GlobeIcon },
        ],
    },
    {
        title: 'SISTEMA',
        adminOnly: true,
        items: [
            { path: '/registro-actividad', label: 'Telemetría Log', icon: MonitorIcon },
            { path: '/configuracion',      label: 'Core Config', icon: Cog8ToothIcon },
        ],
    },
];

const PAGE_TITLES: Record<string, string> = {
    '/dashboard':          'COMMAND_CENTER',
    '/trabajos':           'MISSION_TRACKER',
    '/nuevo-pedido':       'MISSION_INITIALIZATION',
    '/retiros':            'DISPATCH_PROTOCOL',
    '/inventario':         'ASSET_VAULT',
    '/cuentas':            'FINANCIAL_LEDGER',
    '/clientes':           'IDENTITY_VAULT',
    '/proveedores':        'SUPPLY_CHAIN_MONITOR',
    '/registro-actividad': 'FORENSIC_TELEMETRY',
    '/configuracion':      'SYSTEM_CORE_V4',
    '/caja':               'CASH_FLUX_CONTROL',
    '/nota-de-venta':      'ASSET_MANIFEST'
};

const Layout: React.FC<LayoutProps> = ({ children, onLogout, user }) => {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const location = useLocation();
    const navigate = useNavigate();
    const { syncing } = useData();

    const pageTitle = useMemo(() => {
        const path = location.pathname;
        return PAGE_TITLES[path] || 'OPERATIONAL_NODE';
    }, [location.pathname]);

    const isAdmin = user.rol === 'Admin' || (user.rol as string) === 'root';

    return (
        <div className="min-h-screen bg-brand-dark text-white selection:bg-liquid-gold selection:text-brand-dark flex flex-col lg:flex-row overflow-hidden font-sans">
            <SEO title={`${pageTitle} - Imprenta Córdova`} />
            
            {/* --- FONDO GLOBAL ELITE --- */}
            <div className="fixed inset-0 bg-architect-grid opacity-[0.03] pointer-events-none z-0" />
            <div className="fixed inset-0 bg-obsidian-liquid pointer-events-none z-0" />
            
            {/* --- SIDEBAR ELITE --- */}
            <aside className={`fixed lg:relative inset-y-0 left-0 z-[150] w-80 bg-brand-dark/40 backdrop-blur-3xl border-r border-white/5 transition-transform duration-700 lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                <div className="h-full flex flex-col p-8 space-y-12">
                    {/* Brand Header */}
                    <Link to="/" className="flex items-center gap-5 group py-4">
                        <div className="relative">
                            <CordovaLogo className="h-10 w-auto brightness-0 invert group-hover:scale-110 transition-transform duration-1000" />
                            <div className="absolute -inset-2 bg-liquid-gold/20 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                        <div className="flex flex-col leading-none">
                            <span className="text-xl font-black italic tracking-tighter">CÓRDOVA<span className="text-liquid-gold opacity-50">.</span></span>
                            <span className="text-[8px] font-black text-slate-500 uppercase tracking-[0.6em] italic mt-1">Industrial Hub</span>
                        </div>
                    </Link>

                    {/* Navigation Groups */}
                    <nav className="flex-1 overflow-y-auto space-y-12 custom-scrollbar pr-2">
                        {navGroups.map((group, idx) => (
                            (!group.adminOnly || isAdmin) && (
                                <div key={idx} className="space-y-4">
                                    <h4 className="text-[9px] font-black text-slate-700 uppercase tracking-[0.5em] italic px-4">{group.title}</h4>
                                    <div className="space-y-1">
                                        {group.items.map((item) => {
                                            const isActive = location.pathname === item.path;
                                            return (
                                                <NavLink
                                                    key={item.path}
                                                    to={item.path}
                                                    onClick={() => setSidebarOpen(false)}
                                                    className={({ isActive }) => `
                                                        group flex items-center gap-5 px-6 py-4 rounded-2xl transition-all duration-500 relative overflow-hidden
                                                        ${isActive 
                                                            ? 'bg-liquid-gold/5 text-liquid-gold border border-liquid-gold/10' 
                                                            : 'text-slate-500 hover:text-white hover:bg-white/[0.03] border border-transparent'}
                                                    `}
                                                >
                                                    <item.icon className={`w-5 h-5 transition-transform duration-500 ${isActive ? 'scale-110' : 'group-hover:scale-110'}`} />
                                                    <span className="text-[11px] font-black uppercase tracking-[0.2em] italic">{item.label}</span>
                                                    {isActive && (
                                                        <motion.div 
                                                            layoutId="sidebarActive"
                                                            className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-6 bg-liquid-gold rounded-r-full shadow-gold-glow"
                                                        />
                                                    )}
                                                </NavLink>
                                            );
                                        })}
                                    </div>
                                </div>
                            )
                        ))}
                    </nav>

                    {/* Footer / User Profile */}
                    <div className="pt-8 border-t border-white/5 space-y-8">
                        <div className="flex items-center gap-4 px-4 group">
                            <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center group-hover:border-liquid-gold/30 transition-all">
                                <FingerPrintIcon className="w-6 h-6 text-slate-500 group-hover:text-liquid-gold" />
                            </div>
                            <div className="flex flex-col leading-tight">
                                <span className="text-[10px] font-black text-white uppercase italic">{user.nombre}</span>
                                <span className="text-[8px] font-bold text-slate-600 uppercase tracking-widest">{user.rol}</span>
                            </div>
                        </div>
                        <button 
                            onClick={onLogout}
                            className="w-full flex items-center justify-center gap-4 py-5 bg-rose-500/5 hover:bg-rose-500/10 text-rose-500 rounded-2xl border border-rose-500/10 transition-all text-[10px] font-black uppercase tracking-widest italic"
                        >
                            <LogoutIcon className="w-4 h-4" /> TERMINAR_SESIÓN
                        </button>
                    </div>
                </div>
            </aside>

            {/* --- MAIN CONTENT ELITE --- */}
            <main className="flex-1 flex flex-col relative z-10 overflow-hidden">
                {/* Global Header HUD */}
                <header className="h-28 lg:h-32 bg-brand-dark/30 backdrop-blur-2xl border-b border-white/5 px-6 lg:px-14 flex items-center justify-between relative">
                    <div className="flex items-center gap-8">
                        <button 
                            onClick={() => setSidebarOpen(true)}
                            className="p-5 bg-white/5 border border-white/10 rounded-2xl text-slate-500 hover:text-white lg:hidden transition-all"
                        >
                            <MenuIcon className="w-6 h-6" />
                        </button>
                        <div className="space-y-2">
                            <div className="flex items-center gap-4">
                                <div className="w-1.5 h-1.5 rounded-full bg-liquid-gold animate-pulse shadow-gold-glow" />
                                <span className="text-[9px] font-black text-slate-500 uppercase tracking-[0.6em] italic">ACTIVE_NODE_PROTOCOL</span>
                            </div>
                            <h2 className="text-3xl lg:text-4xl font-black text-white italic tracking-tighter uppercase leading-none">
                                {pageTitle}
                            </h2>
                        </div>
                    </div>

                    <div className="flex items-center gap-4 md:gap-8">
                        <div className="hidden md:flex flex-col items-end gap-1 opacity-40">
                             <span className="text-[8px] font-mono uppercase tracking-[0.4em]">SYNC_NOMINAL: 100%</span>
                             <div className="w-32 h-[2px] bg-white/10 rounded-full overflow-hidden">
                                <motion.div 
                                    animate={{ x: ["-100%", "100%"] }}
                                    transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                                    className="w-full h-full bg-liquid-gold/40"
                                />
                             </div>
                        </div>
                        <SearchOmni />
                        <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center relative group cursor-pointer hover:border-liquid-gold/30 transition-all">
                            <div className="w-2 h-2 bg-emerald-500 rounded-full absolute top-2 right-2 shadow-[0_0_8px_#10b981] animate-pulse" />
                            <BoltIcon className="w-5 h-5 text-slate-500 group-hover:text-liquid-gold transition-colors" />
                        </div>
                    </div>
                </header>

                {/* Content Container */}
                <div className="flex-1 overflow-y-auto custom-scrollbar relative p-4 lg:p-0">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={location.pathname}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                            className="h-full"
                        >
                            {children}
                        </motion.div>
                    </AnimatePresence>
                </div>
            </main>

            {/* Mobile Navigation HUD */}
            <MobileFloatingNav />
            
            {/* Global Visual Overlays */}
            <div className="fixed inset-0 z-[500] pointer-events-none border-[20px] border-white/[0.01] opacity-50" />
        </div>
    );
};

export default Layout;
