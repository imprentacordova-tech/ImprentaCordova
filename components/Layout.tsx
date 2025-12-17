
import React, { useState, useEffect } from 'react';
import { NavLink, useLocation, Link } from 'react-router-dom';
import { APP_NAME } from '../constants';
import { KdsIcon, FinanceIcon, ClientsIcon, AddIcon, LogoutIcon, MenuIcon, CloseIcon, InventoryIcon, BoxIcon, DocumentIcon, UsersIcon, ReceiptIcon, Cog8ToothIcon, BuildingStorefrontIcon, SolidBoxIcon, DashboardIcon, CalculatorIcon, GlobeAltIcon, PaletteIcon, SunIcon, MoonIcon } from './Icons';
import { User, TrabajoEstado } from '../types';
import { getTrabajos } from '../services/mockApi';

interface LayoutProps {
  children: React.ReactNode;
  onLogout: () => void;
  user: User;
}

const navGroups = [
  {
    title: 'INICIO',
    items: [
      { path: "/dashboard", label: "Panel", icon: DashboardIcon },
      { path: "/", label: "Ver Tienda", icon: GlobeAltIcon },
    ]
  },
  {
    title: 'OPERACIONES',
    items: [
      { path: "/nuevo", label: "Nuevo Pedido", icon: AddIcon },
      { path: "/diseno", label: "Estudio Diseño", icon: PaletteIcon }, // Added Design Link
      { path: "/kds", label: "Taller Producción", icon: KdsIcon },
      { path: "/trabajos", label: "Historial Trabajos", icon: DocumentIcon },
      { path: "/retiros", label: "Entregas", icon: ReceiptIcon },
    ]
  },
  {
    title: 'HERRAMIENTAS',
    items: [
      { path: "/calculadora", label: "Calculadora Offset", icon: CalculatorIcon },
    ]
  },
  {
    title: 'GESTIÓN',
    items: [
      { path: "/clientes", label: "Clientes", icon: ClientsIcon },
      { path: "/productos", label: "Productos", icon: BoxIcon },
      { path: "/proveedores", label: "Proveedores", icon: BuildingStorefrontIcon },
      { path: "/inventario", label: "Inventario", icon: SolidBoxIcon },
    ]
  },
  {
    title: 'ANÁLISIS',
    items: [
      { path: "/finanzas", label: "Reportes", icon: FinanceIcon },
    ]
  },
  {
    title: 'ADMINISTRACIÓN',
    adminOnly: true,
    items: [
      { path: "/usuarios", label: "Usuarios", icon: UsersIcon },
      { path: "/configuracion", label: "Configuración", icon: Cog8ToothIcon },
    ]
  },
];


const Sidebar: React.FC<{ user: User }> = ({ user }) => {
    const location = useLocation();
    const [vitrinaCount, setVitrinaCount] = useState(0);
    const [designCount, setDesignCount] = useState(0);

    // Fetch counts for badges
    useEffect(() => {
        const fetchCount = async () => {
            const trabajos = await getTrabajos();
            setVitrinaCount(trabajos.filter(t => t.estado === TrabajoEstado.VITRINA).length);
            setDesignCount(trabajos.filter(t => t.estado === TrabajoEstado.PENDIENTE || t.estado === TrabajoEstado.EN_DISENO).length);
        };
        
        fetchCount();
        const interval = setInterval(fetchCount, 10000);
        return () => clearInterval(interval);
    }, []);

    return (
      <aside className="w-64 bg-white dark:bg-gray-900 text-gray-900 dark:text-white flex flex-col h-full border-r border-gray-200 dark:border-gray-700">
        <nav className="flex-grow p-2 space-y-2 mt-4 overflow-y-auto">
          {navGroups.map(group => {
            if (group.adminOnly && user.rol !== 'Admin') {
                return null;
            }
            return (
                <div key={group.title}>
                    <h3 className="px-4 pt-4 pb-2 text-xs font-bold text-gray-400 uppercase tracking-wider">{group.title}</h3>
                    <div className="space-y-1">
                        {group.items.map(item => {
                            const isActive = location.pathname === item.path || (item.path === '/configuracion' && location.pathname.startsWith('/configuracion'));
                            const showVitrinaBadge = item.path === '/retiros' && vitrinaCount > 0;
                            const showDesignBadge = item.path === '/diseno' && designCount > 0;

                            return (
                                <NavLink
                                    key={item.path}
                                    to={item.path}
                                    className={
                                        `group w-full flex items-center justify-between px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 transform hover:translate-x-1 ${
                                            isActive
                                                ? 'bg-blue-50 text-brand-blue dark:bg-blue-900/50 shadow-sm'
                                                : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                                        }`
                                    }
                                >
                                    <div className="flex items-center space-x-3">
                                        <item.icon className="h-5 w-5 flex-shrink-0" />
                                        <span>{item.label}</span>
                                    </div>
                                    {showVitrinaBadge && (
                                        <span className="bg-purple-100 text-purple-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                                            {vitrinaCount}
                                        </span>
                                    )}
                                    {showDesignBadge && (
                                        <span className="bg-blue-100 text-brand-blue text-[10px] font-bold px-2 py-0.5 rounded-full">
                                            {designCount}
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
      </aside>
    );
};

const Header: React.FC<{ onMenuClick: () => void, onLogout: () => void }> = ({ onMenuClick, onLogout }) => {
    // Theme state initialized from localStorage
    const [isDark, setIsDark] = useState(() => {
        if (typeof window !== 'undefined') {
            return localStorage.getItem('theme') === 'dark' || 
                (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches);
        }
        return false;
    });

    useEffect(() => {
        if (isDark) {
            document.documentElement.classList.add('dark');
            localStorage.setItem('theme', 'dark');
        } else {
            document.documentElement.classList.remove('dark');
            localStorage.setItem('theme', 'light');
        }
    }, [isDark]);

    const toggleTheme = () => {
        setIsDark(!isDark);
    };

    return (
        <header className="h-16 bg-white dark:bg-gray-800 flex items-center justify-between px-6 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
            <div className="flex items-center">
                <button onClick={onMenuClick} className="lg:hidden p-2 -ml-2 mr-4 text-gray-600 dark:text-gray-300">
                    <MenuIcon className="h-6 w-6" />
                </button>
                 <Link to="/dashboard" className="text-2xl font-bold">
                    <span className="text-brand-blue">Imprenta</span>
                    <span className="text-brand-red"> Córdova</span>
                </Link>
            </div>
            <div className="flex items-center space-x-4">
                {/* Theme Toggle Button */}
                <button 
                    onClick={toggleTheme} 
                    className="p-2 rounded-full text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700 transition-colors"
                    aria-label="Alternar tema oscuro"
                >
                    {isDark ? <SunIcon className="h-5 w-5" /> : <MoonIcon className="h-5 w-5" />}
                </button>

                <button onClick={onLogout} className="flex items-center space-x-2 text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-brand-red dark:hover:text-brand-red transition-colors">
                    <LogoutIcon className="h-5 w-5" />
                    <span className="hidden sm:inline">Salir</span>
                </button>
            </div>
        </header>
    );
};

export const Layout: React.FC<LayoutProps> = ({ children, onLogout, user }) => {
    const [sidebarOpen, setSidebarOpen] = useState(false);

    return (
    <div className="flex h-screen bg-neutral-light dark:bg-neutral-dark overflow-hidden">
        {/* Mobile Sidebar */}
        <div className={`fixed inset-0 z-40 lg:hidden transition-opacity duration-300 ${sidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
            <div className="absolute inset-0 bg-black/60" onClick={() => setSidebarOpen(false)}></div>
            <div className={`relative w-64 h-full bg-white dark:bg-gray-900 transition-transform duration-300 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                <div className="absolute top-4 right-4">
                    <button onClick={() => setSidebarOpen(false)} className="p-2 text-gray-600 dark:text-gray-300">
                        <CloseIcon className="h-6 w-6" />
                    </button>
                </div>
                <Sidebar user={user} />
            </div>
        </div>

        {/* Desktop Sidebar */}
        <div className="hidden lg:flex lg:flex-shrink-0">
            <Sidebar user={user} />
        </div>

        <div className="flex flex-col flex-1 w-0 overflow-hidden">
            <Header onMenuClick={() => setSidebarOpen(true)} onLogout={onLogout} />
            <main className="flex-1 relative overflow-y-auto focus:outline-none p-4 sm:p-6 lg:p-8">
                {children}
            </main>
        </div>
    </div>
    );
};