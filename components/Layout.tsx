import React, { useState } from 'react';
import { NavLink, useLocation, Link } from 'react-router-dom';
import { APP_NAME } from '../constants';
import { KdsIcon, FinanceIcon, ClientsIcon, AddIcon, LogoutIcon, MenuIcon, CloseIcon, InventoryIcon, BoxIcon, DocumentIcon, UsersIcon, ReceiptIcon, Cog8ToothIcon, BuildingStorefrontIcon, SolidBoxIcon, DashboardIcon, CalculatorIcon } from './Icons';
import { User } from '../types';

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
    ]
  },
  {
    title: 'OPERACIONES',
    items: [
      { path: "/nuevo", label: "Nuevo Pedido", icon: AddIcon },
      { path: "/calculadora", label: "Calculadora", icon: CalculatorIcon },
      { path: "/trabajos", label: "Trabajos", icon: DocumentIcon },
      { path: "/kds", label: "Taller", icon: KdsIcon },
      { path: "/retiros", label: "Nuevo Retiro", icon: ReceiptIcon },
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
                            return (
                                <NavLink
                                    key={item.path}
                                    to={item.path}
                                    className={
                                        `w-full flex items-center space-x-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 transform hover:translate-x-1 ${
                                            isActive
                                                ? 'bg-blue-50 text-brand-blue dark:bg-blue-900/50 shadow-sm'
                                                : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                                        }`
                                    }
                                >
                                    <item.icon className="h-5 w-5 flex-shrink-0" />
                                    <span>{item.label}</span>
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