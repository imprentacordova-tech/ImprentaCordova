
import React, { useState, useEffect } from 'react';
import { NavLink, useLocation, Link } from 'react-router-dom';
import { APP_NAME } from '../constants';
import { KdsIcon, FinanceIcon, ClientsIcon, AddIcon, LogoutIcon, MenuIcon, CloseIcon, InventoryIcon, BoxIcon, DocumentIcon, UsersIcon, ReceiptIcon, Cog8ToothIcon, BuildingStorefrontIcon, SolidBoxIcon, DashboardIcon, CalculatorIcon, GlobeAltIcon, PaletteIcon, SunIcon, MoonIcon, EyeIcon, CordovaLogo } from './Icons';
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
      { path: "/dashboard", label: "Dashboard", icon: DashboardIcon },
      { path: "/", label: "Ver Tienda", icon: GlobeAltIcon },
    ]
  },
  {
    title: 'Producción',
    items: [
      { path: "/nuevo", label: "Nuevo Pedido", icon: AddIcon },
      { path: "/diseno", label: "Diseño & IA", icon: PaletteIcon },
      { path: "/kds", label: "Taller (KDS)", icon: KdsIcon },
      { path: "/trabajos", label: "Historial", icon: DocumentIcon },
    ]
  },
  {
    title: 'Gestión',
    items: [
      { path: "/retiros", label: "Caja y Retiros", icon: ReceiptIcon },
      { path: "/clientes", label: "Clientes CRM", icon: ClientsIcon },
      { path: "/inventario", label: "Inventario", icon: SolidBoxIcon },
      { path: "/proveedores", label: "Proveedores", icon: BuildingStorefrontIcon },
    ]
  },
  {
    title: 'Herramientas',
    items: [
      { path: "/calculadora", label: "Cotizador", icon: CalculatorIcon },
      { path: "/corregidor", label: "Supervisor IA", icon: EyeIcon },
      { path: "/finanzas", label: "Reportes", icon: FinanceIcon },
    ]
  },
  {
    title: 'Sistema',
    adminOnly: true,
    items: [
      { path: "/usuarios", label: "Usuarios", icon: UsersIcon },
      { path: "/configuracion", label: "Configuración", icon: Cog8ToothIcon },
    ]
  },
  {
    title: 'Productos',
    items: [
        { path: "/productos", label: "Catálogo", icon: BoxIcon },
    ]
  }
];


const Sidebar: React.FC<{ user: User, onCloseMobile?: () => void }> = ({ user, onCloseMobile }) => {
    const location = useLocation();
    const { trabajos } = useData(); 
    const [vitrinaCount, setVitrinaCount] = useState(0);
    const [designCount, setDesignCount] = useState(0);

    useEffect(() => {
        setVitrinaCount(trabajos.filter(t => t.estado === TrabajoEstado.VITRINA).length);
        setDesignCount(trabajos.filter(t => t.estado === TrabajoEstado.PENDIENTE || t.estado === TrabajoEstado.EN_DISENO).length);
    }, [trabajos]);

    return (
      <aside className="w-72 bg-slate-900 text-slate-300 flex flex-col h-full border-r border-slate-800 shadow-2xl relative overflow-hidden">
        {/* Brand Header */}
        <div className="p-6 flex items-center gap-3 border-b border-slate-800/50 bg-slate-900 z-10">
            <div className="bg-gradient-to-br from-brand-blue to-blue-600 p-2 rounded-xl shadow-lg shadow-blue-900/50">
                <CordovaLogo className="h-6 w-auto object-contain brightness-0 invert" />
            </div>
            <div>
                <h1 className="font-black text-white text-lg tracking-tight leading-none">IMP. CÓRDOVA</h1>
                <p className="text-[10px] text-slate-500 font-bold tracking-widest uppercase mt-1">Panel de Control</p>
            </div>
        </div>

        {/* User Profile Mini */}
        <div className="px-6 py-6">
            <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-800/50 border border-slate-700/50">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white font-bold shadow-md">
                    {user.nombre.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-white truncate">{user.nombre}</p>
                    <p className="text-xs text-slate-500 truncate">{user.rol}</p>
                </div>
            </div>
        </div>

        {/* Navigation */}
        <nav className="flex-grow px-4 pb-6 space-y-6 overflow-y-auto custom-scrollbar z-10">
          {navGroups.map(group => {
            if (group.adminOnly && user.rol !== 'Admin') return null;
            
            return (
                <div key={group.title} className="space-y-1">
                    <h3 className="px-4 text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">{group.title}</h3>
                    {group.items.map(item => {
                        const isActive = location.pathname === item.path || (item.path === '/configuracion' && location.pathname.startsWith('/configuracion'));
                        const showVitrinaBadge = item.path === '/retiros' && vitrinaCount > 0;
                        const showDesignBadge = item.path === '/diseno' && designCount > 0;

                        return (
                            <NavLink
                                key={item.path}
                                to={item.path}
                                onClick={onCloseMobile}
                                className={`
                                    group relative flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium transition-all duration-300
                                    ${isActive 
                                        ? 'bg-brand-blue text-white shadow-lg shadow-blue-900/40' 
                                        : 'text-slate-400 hover:text-white hover:bg-slate-800/80'}
                                `}
                            >
                                <div className="flex items-center gap-3 relative z-10">
                                    <item.icon className={`h-5 w-5 transition-colors ${isActive ? 'text-white' : 'text-slate-500 group-hover:text-white'}`} />
                                    <span>{item.label}</span>
                                </div>
                                
                                {showVitrinaBadge && (
                                    <span className="bg-purple-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm animate-pulse">
                                        {vitrinaCount}
                                    </span>
                                )}
                                {showDesignBadge && (
                                    <span className="bg-blue-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm">
                                        {designCount}
                                    </span>
                                )}
                            </NavLink>
                        );
                    })}
                </div>
            );
          })}
        </nav>

        {/* Decorative Blob */}
        <div className="absolute bottom-0 left-0 w-full h-32 bg-gradient-to-t from-brand-blue/10 to-transparent pointer-events-none"></div>
      </aside>
    );
};

const Header: React.FC<{ onMenuClick: () => void, onLogout: () => void }> = ({ onMenuClick, onLogout }) => {
    return (
        <header className="h-20 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md flex items-center justify-between px-6 border-b border-gray-200/50 dark:border-gray-700/50 flex-shrink-0 z-20 sticky top-0 transition-all">
            <div className="flex items-center gap-4">
                <button onClick={onMenuClick} className="lg:hidden p-2 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
                    <MenuIcon className="h-6 w-6" />
                </button>
                
                {/* Breadcrumbs or Page Title placeholder */}
                <div className="hidden md:block">
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Sistema de Gestión</span>
                </div>
            </div>

            <div className="flex items-center gap-4">
                <div className="h-8 w-px bg-gray-200 dark:bg-gray-700 mx-2 hidden sm:block"></div>
                
                <button 
                    onClick={onLogout} 
                    className="flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-brand-red transition-colors px-3 py-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20"
                >
                    <LogoutIcon className="h-5 w-5" />
                    <span className="hidden sm:inline">Cerrar Sesión</span>
                </button>
            </div>
        </header>
    );
};

export const Layout: React.FC<LayoutProps> = ({ children, onLogout, user }) => {
    const [sidebarOpen, setSidebarOpen] = useState(false);

    return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900 overflow-hidden font-sans">
        {/* Mobile Sidebar Overlay */}
        <div 
            className={`fixed inset-0 z-50 lg:hidden transition-all duration-300 ${sidebarOpen ? 'bg-black/60 backdrop-blur-sm' : 'bg-transparent pointer-events-none'}`}
            onClick={() => setSidebarOpen(false)}
        >
            <div 
                className={`fixed top-0 left-0 w-72 h-full bg-slate-900 shadow-2xl transition-transform duration-300 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}
                onClick={e => e.stopPropagation()}
            >
                <Sidebar user={user} onCloseMobile={() => setSidebarOpen(false)} />
            </div>
        </div>

        {/* Desktop Sidebar */}
        <div className="hidden lg:block h-full">
            <Sidebar user={user} />
        </div>

        <div className="flex flex-col flex-1 w-0 overflow-hidden relative">
            <Header onMenuClick={() => setSidebarOpen(true)} onLogout={onLogout} />
            <main className="flex-1 relative overflow-y-auto p-4 sm:p-6 lg:p-8 scroll-smooth">
                <div className="max-w-7xl mx-auto pb-10">
                    {children}
                </div>
            </main>
        </div>
    </div>
    );
};
