
import React, { useState, useEffect } from 'react';
import { NavLink, useLocation, Link } from 'react-router-dom';
import { APP_NAME } from '../constants';
// Fixed: Removed duplicate alias for GlobeAltIcon as CloudIcon is now exported directly from Icons.tsx
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
    title: 'Navegación',
    items: [
      { path: "/dashboard", label: "Panel Principal", icon: DashboardIcon },
      { path: "/", label: "Vista Pública", icon: GlobeAltIcon },
    ]
  },
  {
    title: 'Producción',
    items: [
      { path: "/nuevo", label: "Nueva Orden", icon: AddIcon },
      { path: "/diseno", label: "Área de Diseño", icon: PaletteIcon },
      { path: "/kds", label: "Taller en Vivo", icon: KdsIcon },
      { path: "/retiros", label: "Entregas / Caja", icon: ReceiptIcon },
    ]
  },
  {
    title: 'Administración',
    items: [
      { path: "/clientes", label: "Contribuyentes", icon: ClientsIcon },
      { path: "/trabajos", label: "Historial", icon: DocumentIcon },
      { path: "/productos", label: "Catálogo", icon: BoxIcon },
      { path: "/inventario", label: "Insumos", icon: SolidBoxIcon },
    ]
  },
  {
    title: 'Sistema',
    adminOnly: true,
    items: [
      { path: "/finanzas", label: "Reportes IA", icon: FinanceIcon },
      { path: "/usuarios", label: "Personal", icon: UsersIcon },
      { path: "/configuracion", label: "Configuración", icon: Cog8ToothIcon },
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
      <aside className="w-72 bg-white dark:bg-slate-950 text-slate-900 dark:text-white flex flex-col h-full border-r border-slate-100 dark:border-slate-800 shadow-2xl z-20">
        <div className="p-8 border-b border-slate-50 dark:border-slate-800 flex items-center gap-4">
             <div className="w-12 h-12 bg-brand-blue rounded-2xl flex items-center justify-center shadow-lg shadow-brand-blue/20">
                <CordovaLogo className="w-8 h-8 brightness-0 invert" />
             </div>
             <div>
                <h2 className="text-xl font-black tracking-tighter leading-none">CÓRDOVA</h2>
                <p className="text-[9px] font-black text-brand-red uppercase tracking-[0.3em] mt-1">E.R.P. Vision</p>
             </div>
        </div>
        
        <nav className="flex-grow p-4 space-y-8 overflow-y-auto custom-scrollbar pt-8">
          {navGroups.map(group => {
            if (group.adminOnly && user.rol !== 'Admin') return null;
            return (
                <div key={group.title} className="space-y-2">
                    <h3 className="px-4 text-[9px] font-black text-slate-400 uppercase tracking-[0.3em] mb-4">{group.title}</h3>
                    <div className="space-y-1">
                        {group.items.map(item => {
                            const isActive = location.pathname === item.path;
                            const badge = item.path === '/diseno' ? counts.design : item.path === '/retiros' ? counts.retail : 0;

                            return (
                                <NavLink
                                    key={item.path}
                                    to={item.path}
                                    className={
                                        `group w-full flex items-center justify-between px-4 py-3.5 rounded-2xl text-xs font-bold transition-all duration-300 ${
                                            isActive
                                                ? 'bg-brand-blue text-white shadow-xl shadow-brand-blue/20 translate-x-2'
                                                : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-white/5 hover:text-brand-blue'
                                        }`
                                    }
                                >
                                    <div className="flex items-center gap-4">
                                        <item.icon className={`h-5 w-5 transition-transform group-hover:scale-110 ${isActive ? 'text-white' : 'text-slate-400 dark:text-slate-500'}`} />
                                        <span className="tracking-wide">{item.label}</span>
                                    </div>
                                    {badge > 0 && (
                                        <span className={`px-2 py-0.5 rounded-lg text-[9px] font-black ${isActive ? 'bg-white text-brand-blue' : 'bg-brand-red text-white'}`}>
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
        
        <div className="p-6 border-t border-slate-50 dark:border-slate-800">
            <div className="bg-slate-50 dark:bg-white/5 p-4 rounded-3xl flex items-center gap-4">
                <div className="w-10 h-10 rounded-2xl bg-brand-blue text-white flex items-center justify-center font-black text-sm">
                    {user.nombre.charAt(0)}
                </div>
                <div className="min-w-0">
                    <p className="text-xs font-black text-slate-900 dark:text-white truncate uppercase">{user.nombre}</p>
                    <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">{user.rol}</p>
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
        <header className="h-20 bg-white/80 dark:bg-slate-950/80 backdrop-blur-xl flex items-center justify-between px-8 border-b border-slate-100 dark:border-slate-800 flex-shrink-0 sticky top-0 z-30">
            <div className="flex items-center gap-6">
                <button onClick={onMenuClick} className="lg:hidden p-3 bg-slate-100 dark:bg-white/5 rounded-xl text-slate-600 dark:text-slate-300">
                    <MenuIcon className="h-6 w-6" />
                </button>
                <div className="flex items-center gap-4">
                    <div className="hidden sm:flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]"></div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Cerebro Online</p>
                    </div>
                    {/* Indicador Cloud */}
                    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border transition-all duration-500 ${isSyncing ? 'bg-blue-50 border-blue-200 animate-pulse' : 'bg-slate-50 border-slate-100'}`}>
                        {isSyncing ? <CloudIcon className="w-3 h-3 text-brand-blue animate-bounce" /> : <CheckCircleIcon className="w-3 h-3 text-emerald-500" />}
                        <span className="text-[8px] font-black uppercase tracking-widest text-slate-500">
                            {isSyncing ? 'Sincronizando Nube...' : 'Nube Actualizada'}
                        </span>
                    </div>
                </div>
            </div>

            <div className="flex items-center gap-6">
                <div className="hidden md:flex flex-col text-right mr-4 leading-none">
                     <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Terminal {user.nombre.toUpperCase()}</span>
                     <span className="text-xs font-bold text-slate-900 dark:text-white uppercase">{new Date().toLocaleDateString('es-EC', { weekday: 'long', day: 'numeric', month: 'long' })}</span>
                </div>
                
                <button 
                    onClick={() => setIsDark(!isDark)} 
                    className="p-3 rounded-2xl bg-slate-50 dark:bg-white/5 text-slate-500 hover:text-brand-blue transition-all"
                    aria-label="Toggle Theme"
                >
                    {isDark ? <SunIcon className="h-5 w-5" /> : <MoonIcon className="h-5 w-5" />}
                </button>

                <button onClick={onLogout} className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white transition-all group flex items-center gap-2">
                    <LogoutIcon className="h-5 w-5" />
                    <span className="hidden xl:inline text-[10px] font-black uppercase tracking-widest">Salir</span>
                </button>
            </div>
        </header>
    );
};

export const Layout: React.FC<LayoutProps> = ({ children, onLogout, user }) => {
    const [sidebarOpen, setSidebarOpen] = useState(false);

    return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-950 overflow-hidden font-sans selection:bg-brand-blue selection:text-white">
        {/* Mobile Sidebar */}
        <div className={`fixed inset-0 z-[100] lg:hidden transition-opacity duration-500 ${sidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
            <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm" onClick={() => setSidebarOpen(false)}></div>
            <div className={`relative w-72 h-full bg-white dark:bg-slate-900 shadow-3xl transition-transform duration-500 ease-in-out ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                <Sidebar user={user} />
                <button onClick={() => setSidebarOpen(false)} className="absolute top-6 right-6 p-2 text-slate-400 hover:text-brand-red"><CloseIcon className="h-6 w-6" /></button>
            </div>
        </div>

        {/* Desktop Sidebar */}
        <div className="hidden lg:flex lg:flex-shrink-0">
            <Sidebar user={user} />
        </div>

        <div className="flex flex-col flex-1 w-0 overflow-hidden">
            <Header onMenuClick={() => setSidebarOpen(true)} onLogout={onLogout} user={user} />
            <main className="flex-1 relative overflow-y-auto focus:outline-none p-6 lg:p-10 scroll-smooth custom-scrollbar">
                {children}
            </main>
        </div>
    </div>
    );
};
