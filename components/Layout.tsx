
import React, { useState, useEffect } from 'react';
import { NavLink, useLocation, Link } from 'react-router-dom';
import { APP_NAME } from '../constants';
import { KdsIcon, FinanceIcon, ClientsIcon, AddIcon, LogoutIcon, MenuIcon, CloseIcon, InventoryIcon, BoxIcon, DocumentIcon, UsersIcon, ReceiptIcon, Cog8ToothIcon, BuildingStorefrontIcon, SolidBoxIcon, DashboardIcon, CalculatorIcon, GlobeAltIcon, PaletteIcon, SunIcon, MoonIcon, CordovaLogo, CloudIcon, CheckCircleIcon } from './Icons';
import { User, TrabajoEstado } from '../types';
import { getTrabajos } from '../services/mockApi';

interface LayoutProps {
  children: React.ReactNode;
  onLogout: () => void;
  user: User;
}

const navGroups = [
  {
    title: 'Principal',
    items: [
      { path: "/dashboard", label: "Dashboard", icon: DashboardIcon },
      { path: "/", label: "Sitio Público", icon: GlobeAltIcon },
    ]
  },
  {
    title: 'Producción',
    items: [
      { path: "/nuevo", label: "Nueva Orden", icon: AddIcon },
      { path: "/diseno", label: "Diseño", icon: PaletteIcon },
      { path: "/kds", label: "Taller (KDS)", icon: KdsIcon },
      { path: "/retiros", label: "Entregas", icon: ReceiptIcon },
    ]
  },
  {
    title: 'Gestión',
    items: [
      { path: "/clientes", label: "Clientes", icon: ClientsIcon },
      { path: "/trabajos", label: "Historial", icon: DocumentIcon },
      { path: "/productos", label: "Catálogo", icon: BoxIcon },
      { path: "/inventario", label: "Inventario", icon: SolidBoxIcon },
    ]
  },
  {
    title: 'Sistema',
    adminOnly: true,
    items: [
      { path: "/finanzas", label: "Finanzas IA", icon: FinanceIcon },
      { path: "/usuarios", label: "Usuarios", icon: UsersIcon },
      { path: "/configuracion", label: "Ajustes", icon: Cog8ToothIcon },
    ]
  },
];

const Sidebar: React.FC<{ user: User }> = ({ user }) => {
    const location = useLocation();
    const [counts, setCounts] = useState({ design: 0, retail: 0 });

    useEffect(() => {
        const fetchCount = async () => {
            const trabajos = await getTrabajos();
            setCounts({
                design: trabajos.filter(t => [TrabajoEstado.PENDIENTE, TrabajoEstado.EN_DISENO].includes(t.estado)).length,
                retail: trabajos.filter(t => t.estado === TrabajoEstado.VITRINA).length
            });
        };
        fetchCount();
        const interval = setInterval(fetchCount, 20000);
        return () => clearInterval(interval);
    }, []);

    return (
      <aside className="w-72 bg-surface-light/80 dark:bg-brand-dark/95 backdrop-blur-xl text-slate-800 dark:text-slate-200 flex flex-col h-full border-r border-slate-200/50 dark:border-white/5 z-20 transition-all duration-300">
        <div className="p-8 border-b border-slate-100 dark:border-white/5 flex items-center gap-4">
             <div className="w-10 h-10 bg-brand-blue rounded-xl flex items-center justify-center shadow-lg shadow-brand-blue/30 text-white">
                <CordovaLogo className="w-6 h-6 brightness-0 invert" />
             </div>
             <div>
                <h2 className="font-display font-bold text-lg leading-none tracking-tight text-slate-900 dark:text-white">CÓRDOVA</h2>
                <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest mt-1">Vision ERP</p>
             </div>
        </div>
        
        <nav className="flex-grow px-4 py-6 space-y-8 overflow-y-auto custom-scrollbar">
          {navGroups.map(group => {
            if (group.adminOnly && user.rol !== 'Admin') return null;
            return (
                <div key={group.title} className="space-y-1">
                    <h3 className="px-4 text-[10px] font-bold text-slate-400/80 uppercase tracking-widest mb-3 font-display">{group.title}</h3>
                    <div className="space-y-1">
                        {group.items.map(item => {
                            const isActive = location.pathname === item.path;
                            const badge = item.path === '/diseno' ? counts.design : item.path === '/retiros' ? counts.retail : 0;

                            return (
                                <NavLink
                                    key={item.path}
                                    to={item.path}
                                    className={
                                        `group w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium transition-all duration-300 ${
                                            isActive
                                                ? 'bg-white dark:bg-white/10 text-brand-blue dark:text-white shadow-soft dark:shadow-none'
                                                : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white'
                                        }`
                                    }
                                >
                                    <div className="flex items-center gap-3">
                                        <item.icon className={`h-4 w-4 transition-transform duration-300 group-hover:scale-110 ${isActive ? 'text-brand-blue dark:text-white' : 'text-slate-400'}`} />
                                        <span className={`${isActive ? 'font-bold' : ''}`}>{item.label}</span>
                                    </div>
                                    {badge > 0 && (
                                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold shadow-sm ${isActive ? 'bg-brand-blue text-white' : 'bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300'}`}>
                                            {badge}
                                        </span>
                                    )}
                                </NavLink>
                            );
                        })}
                    </div>
                </div>
            );
          })}
        </nav>
        
        <div className="p-4 border-t border-slate-100 dark:border-white/5">
            <div className="bg-white/50 dark:bg-white/5 p-3 rounded-2xl flex items-center gap-3 border border-slate-100 dark:border-white/5 backdrop-blur-sm">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-blue to-indigo-600 text-white flex items-center justify-center font-bold text-sm shadow-md">
                    {user.nombre.charAt(0)}
                </div>
                <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-900 dark:text-white truncate">{user.nombre}</p>
                    <p className="text-[10px] font-medium text-slate-500 dark:text-slate-400 uppercase">{user.rol}</p>
                </div>
            </div>
        </div>
      </aside>
    );
};

const Header: React.FC<{ onMenuClick: () => void, onLogout: () => void, user: User }> = ({ onMenuClick, onLogout, user }) => {
    const [isDark, setIsDark] = useState(() => localStorage.getItem('theme') === 'dark');
    const [isSyncing, setIsSyncing] = useState(false);

    useEffect(() => {
        if (isDark) {
            document.documentElement.classList.add('dark');
            localStorage.setItem('theme', 'dark');
        } else {
            document.documentElement.classList.remove('dark');
            localStorage.setItem('theme', 'light');
        }
    }, [isDark]);

    // Listener para el motor de sincronización
    useEffect(() => {
        const startSync = () => setIsSyncing(true);
        const endSync = () => setIsSyncing(false);
        window.addEventListener('cloud-sync-active', startSync);
        window.addEventListener('cloud-sync-idle', endSync);
        return () => {
            window.removeEventListener('cloud-sync-active', startSync);
            window.removeEventListener('cloud-sync-idle', endSync);
        };
    }, []);

    return (
        <header className="h-16 bg-white/80 dark:bg-brand-dark/80 backdrop-blur-md flex items-center justify-between px-6 border-b border-slate-200/50 dark:border-white/5 sticky top-0 z-30 transition-all duration-300">
            <div className="flex items-center gap-4">
                <button onClick={onMenuClick} className="lg:hidden p-2 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors">
                    <MenuIcon className="h-5 w-5" />
                </button>
                <div className="flex items-center gap-3">
                    <div className={`flex items-center gap-2 px-3 py-1 rounded-full border transition-all duration-500 ${isSyncing ? 'bg-blue-50/50 border-blue-100 dark:bg-blue-900/20 dark:border-blue-800' : 'bg-slate-50/50 border-slate-100 dark:bg-white/5 dark:border-white/5'}`}>
                        {isSyncing ? <CloudIcon className="w-3 h-3 text-brand-blue animate-bounce" /> : <CheckCircleIcon className="w-3 h-3 text-emerald-500" />}
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                            {isSyncing ? 'Sincronizando...' : 'Online'}
                        </span>
                    </div>
                </div>
            </div>

            <div className="flex items-center gap-4">
                <div className="hidden md:flex flex-col text-right mr-2">
                     <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Terminal</span>
                     <span className="text-xs font-bold text-slate-900 dark:text-white uppercase">{new Date().toLocaleDateString('es-EC', { weekday: 'short', day: 'numeric', month: 'short' })}</span>
                </div>
                
                <button 
                    onClick={() => setIsDark(!isDark)} 
                    className="p-2.5 rounded-xl bg-slate-50 dark:bg-white/5 text-slate-500 hover:text-brand-blue hover:bg-slate-100 dark:hover:bg-white/10 transition-all"
                    aria-label="Toggle Theme"
                >
                    {isDark ? <SunIcon className="h-4 w-4" /> : <MoonIcon className="h-4 w-4" />}
                </button>

                <button onClick={onLogout} className="p-2.5 rounded-xl text-slate-400 hover:text-brand-red hover:bg-red-50 dark:hover:bg-red-900/20 transition-all" title="Cerrar Sesión">
                    <LogoutIcon className="h-4 w-4" />
                </button>
            </div>
        </header>
    );
};

export const Layout: React.FC<LayoutProps> = ({ children, onLogout, user }) => {
    const [sidebarOpen, setSidebarOpen] = useState(false);

    return (
    <div className="flex h-screen bg-surface-light dark:bg-brand-dark overflow-hidden font-sans">
        {/* Mobile Sidebar */}
        <div className={`fixed inset-0 z-[100] lg:hidden transition-opacity duration-500 ${sidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setSidebarOpen(false)}></div>
            <div className={`relative w-72 h-full bg-white dark:bg-slate-900 shadow-2xl transition-transform duration-500 ease-out ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                <Sidebar user={user} />
                <button onClick={() => setSidebarOpen(false)} className="absolute top-4 right-4 p-2 text-slate-400 hover:text-brand-red"><CloseIcon className="h-5 w-5" /></button>
            </div>
        </div>

        {/* Desktop Sidebar */}
        <div className="hidden lg:flex lg:flex-shrink-0">
            <Sidebar user={user} />
        </div>

        <div className="flex flex-col flex-1 w-0 overflow-hidden">
            <Header onMenuClick={() => setSidebarOpen(true)} onLogout={onLogout} user={user} />
            <main className="flex-1 relative overflow-y-auto focus:outline-none p-6 lg:p-10 scroll-smooth custom-scrollbar">
                <div className="max-w-7xl mx-auto w-full animate-slide-up">
                    {children}
                </div>
            </main>
        </div>
    </div>
    );
};
