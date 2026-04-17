
import React, { useState, useEffect } from 'react';
import { NavLink, useLocation, Link } from 'react-router-dom';
import { APP_NAME } from '../constants';
import { KdsIcon, FinanceIcon, ClientsIcon, AddIcon, LogoutIcon, MenuIcon, CloseIcon, InventoryIcon, BoxIcon, DocumentIcon, UsersIcon, ReceiptIcon, Cog8ToothIcon, BuildingStorefrontIcon, SolidBoxIcon, DashboardIcon, CalculatorIcon, GlobeAltIcon, PaletteIcon, SunIcon, MoonIcon, CordovaLogo, CloudIcon, CheckCircleIcon } from './Icons';
import { User, TrabajoEstado } from '../types';
import { useData } from '../contexts/DataContext';

interface LayoutProps {
  children: React.ReactNode;
  onLogout: () => void;
  user: User;
}

const navGroups = [
  {
    title: 'Principal',
    items: [
      { path: "/dashboard", label: "Panel Principal", icon: DashboardIcon },
      { path: "/", label: "Vista Pública", icon: GlobeAltIcon },
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
      { path: "/cuentas", label: "Cuentas", icon: FinanceIcon },
      { path: "/proveedores", label: "Proveedores", icon: UsersIcon },
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
      { path: "/registro", label: "Auditoría", icon: DocumentIcon },
      { path: "/configuracion", label: "Ajustes", icon: Cog8ToothIcon },
    ]
  },
];

const Sidebar: React.FC<{ user: User }> = ({ user }) => {
    const location = useLocation();
    const { trabajos } = useData();

    const counts = {
        design: trabajos.filter(t => [TrabajoEstado.PENDIENTE, TrabajoEstado.EN_DISENO].includes(t.estado)).length,
        retail: trabajos.filter(t => t.estado === TrabajoEstado.VITRINA).length,
    };

    return (
      <aside className="w-72 bg-slate-950 flex flex-col h-full border-r border-white/5 z-20 transition-all duration-300">
        <div className="p-12 border-b border-white/5 flex flex-col items-center gap-6 bg-white/[0.01]">
             <div className="w-16 h-16 bg-white text-black rounded-2xl flex items-center justify-center shadow-[0_0_40px_rgba(255,255,255,0.1)] group cursor-pointer transition-transform hover:scale-105 duration-500">
                <CordovaLogo className="w-10 h-10" />
             </div>
             <div className="text-center">
                <h1 className="font-display font-black text-2xl leading-none tracking-[0.3em] text-white">ATELIER</h1>
                <p className="text-[9px] font-black text-slate-600 uppercase tracking-[0.5em] mt-3">CÓRDOVA VISION</p>
             </div>
        </div>
        
        <nav className="flex-grow px-6 py-10 space-y-10 overflow-y-auto custom-scrollbar">
          {navGroups.map(group => {
            if (group.adminOnly && user.rol !== 'Admin') return null;
            return (
                <div key={group.title} className="space-y-6">
                    <h3 className="px-5 text-[10px] font-black text-slate-700 uppercase tracking-[0.4em] font-display">{group.title}</h3>
                    <div className="space-y-2">
                        {group.items.map(item => {
                            const isActive = location.pathname === item.path;
                            const badge = item.path === '/diseno' ? counts.design : item.path === '/retiros' ? counts.retail : 0;

                            return (
                                <NavLink
                                    key={item.path}
                                    to={item.path}
                                    className={
                                        `group w-full flex items-center justify-between px-5 py-3.5 rounded-2xl text-[11px] font-bold uppercase tracking-widest transition-all duration-500 border border-transparent ${
                                            isActive
                                                ? 'bg-white/5 border-liquid-gold/20 text-white shadow-gold-glow'
                                                : 'text-slate-500 hover:bg-white/5 hover:text-white'
                                        }`
                                    }
                                >
                                    <div className="flex items-center gap-4">
                                        <item.icon className={`h-4 w-4 transition-all duration-500 group-hover:text-liquid-gold ${isActive ? 'text-liquid-gold' : 'text-slate-600'}`} />
                                        <span>{item.label}</span>
                                    </div>
                                    {badge > 0 && (
                                        <span className={`px-2 py-0.5 rounded-lg text-[10px] font-black ${isActive ? 'bg-liquid-gold text-brand-dark' : 'bg-white/5 text-slate-500 border border-white/5'}`}>
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
        
        <div className="p-6 border-t border-white/5 bg-black/20">
            <div className="p-4 rounded-2xl flex items-center gap-4 border border-white/5 bg-white/5 backdrop-blur-md">
                <div className="w-10 h-10 rounded-xl bg-liquid-gold text-brand-dark flex items-center justify-center font-black text-sm shadow-gold-glow">
                    {user.nombre.charAt(0)}
                </div>
                <div className="min-w-0">
                    <p className="text-[11px] font-black text-white truncate uppercase tracking-wider">{user.nombre}</p>
                    <p className="text-[9px] font-bold text-liquid-gold uppercase tracking-widest">{user.rol === 'Admin' ? 'Administrador' : user.rol}</p>
                </div>
            </div>
        </div>
      </aside>
    );
};

const Header: React.FC<{ onMenuClick: () => void, onLogout: () => void, user: User }> = ({ onMenuClick, onLogout, user }) => {
    const [isSyncing, setIsSyncing] = useState(false);

    useEffect(() => {
        document.documentElement.classList.add('dark');
        localStorage.setItem('theme', 'dark');
    }, []);

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
        <header className="h-24 bg-brand-dark/40 backdrop-blur-3xl flex items-center justify-between px-10 border-b border-white/5 sticky top-0 z-30 transition-all duration-300">
            <div className="flex items-center gap-6">
                <button onClick={onMenuClick} className="lg:hidden p-3 rounded-xl text-slate-400 hover:bg-white/5 transition-colors border border-white/5">
                    <MenuIcon className="h-5 w-5" />
                </button>
                <div className="flex items-center gap-4">
                    <div className={`flex items-center gap-4 px-6 py-2.5 rounded-full border transition-all duration-700 backdrop-blur-md ${isSyncing ? 'bg-brand-blue/10 border-brand-blue/20 shadow-[0_0_20px_rgba(59,130,246,0.1)]' : 'bg-emerald-500/10 border-emerald-500/20 shadow-[0_0_20px_rgba(16,185,129,0.1)]'}`}>
                        <div className="relative">
                            <div className={`w-2 h-2 rounded-full ${isSyncing ? 'bg-brand-blue animate-ping' : 'bg-emerald-500'} shadow-[0_0_10px_currentColor]`} />
                            {!isSyncing && <div className="absolute inset-0 w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />}
                        </div>
                        <span className={`text-[10px] font-black uppercase tracking-[0.3em] ${isSyncing ? 'text-brand-blue' : 'text-emerald-500'}`}>
                            {isSyncing ? 'Sincronizando Atelier' : 'Protocolo Seguro'}
                        </span>
                    </div>
                </div>
            </div>

            <div className="flex items-center gap-8">
                <div className="hidden md:flex flex-col text-right mr-4">
                     <span className="text-[9px] font-black text-slate-500 uppercase tracking-[0.3em]">Hora del Servidor</span>
                     <span className="text-xs font-black text-white uppercase tracking-wider">{new Date().toLocaleDateString('es-EC', { weekday: 'short', day: 'numeric', month: 'short' })}</span>
                </div>
                
                <div className="h-10 w-[1px] bg-white/5"></div>

                <button onClick={onLogout} className="group p-3 rounded-xl text-slate-500 hover:text-red-400 hover:bg-red-400/10 transition-all border border-transparent hover:border-red-400/20" title="Cerrar Sesión">
                    <LogoutIcon className="h-5 w-5 transition-transform group-hover:scale-110" />
                </button>
            </div>
        </header>
    );
};

export const Layout: React.FC<LayoutProps> = ({ children, onLogout, user }) => {
    const [sidebarOpen, setSidebarOpen] = useState(false);

    return (
    <div className="flex h-screen bg-brand-dark overflow-hidden font-sans selection:bg-liquid-gold selection:text-brand-dark">
        {/* Mobile Sidebar */}
        <div className={`fixed inset-0 z-[100] lg:hidden transition-opacity duration-700 ${sidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
            <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={() => setSidebarOpen(false)}></div>
            <div className={`relative w-72 h-full transition-transform duration-700 ease-out ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                <Sidebar user={user} />
                <button onClick={() => setSidebarOpen(false)} className="absolute top-6 right-[-50px] p-3 text-white hover:text-liquid-gold"><CloseIcon className="h-6 w-6" /></button>
            </div>
        </div>

        {/* Desktop Sidebar */}
        <div className="hidden lg:flex lg:flex-shrink-0">
            <Sidebar user={user} />
        </div>

        <div className="flex flex-col flex-1 w-0 overflow-hidden relative">
            {/* Ambient Background Glows */}
            <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-liquid-gold/5 rounded-full blur-[120px] -ml-64 -mt-64 pointer-events-none"></div>
            
            <Header onMenuClick={() => setSidebarOpen(true)} onLogout={onLogout} user={user} />
            
            <main className="flex-1 relative overflow-y-auto focus:outline-none p-8 lg:p-12 scroll-smooth custom-scrollbar z-10">
                <div className="max-w-[1600px] mx-auto w-full animate-slide-up">
                    {children}
                </div>
            </main>
        </div>
    </div>
    );
};
