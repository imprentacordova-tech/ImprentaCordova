import React, { useState, useCallback } from 'react';
import { HashRouter, Routes, Route, Navigate, Outlet, useOutletContext } from 'react-router-dom';
import { Layout } from './components/Layout';
import { User } from './types';

// --- PÁGINAS PÚBLICAS ---
import LandingPage from './pages/Landing';
import Login from './pages/Login';
import ReciboAbonoPage from './pages/ReciboAbono';

// --- PÁGINAS DEL SISTEMA (PRIVADAS) ---
import DashboardPage from './pages/Dashboard';
import KDSPage from './pages/KDS';
import FinanzasPage from './pages/Finanzas';
import ClientesPage from './pages/Clientes';
import NuevoPedidoPage from './pages/NuevoPedido';
import InventarioPage from './pages/Inventario';
import NotaDeVentaPage from './pages/NotaDeVenta';
import ProductosPage from './pages/Productos';
import SolicitudImpresionPage from './pages/SolicitudImpresion';
import TrabajoDetallePage from './pages/TrabajoDetalle';
import TrabajosPage from './pages/Trabajos';
import GestionUsuariosPage from './pages/GestionUsuarios';
import RetirosPage from './pages/Retiros';
import ConfiguracionPage from './pages/Configuracion';
import ProveedoresPage from './pages/Proveedores';
import CalculadoraPreciosPage from './pages/CalculadoraPrecios';
import DisenoPage from './pages/Diseno';

// Componente para proteger las rutas de administrador
const AdminRoutes: React.FC = () => {
    const { currentUser } = useOutletContext<{ currentUser: User }>();
    if (currentUser.rol !== 'Admin') {
        return <Navigate to="/dashboard" replace />;
    }
    return <Outlet context={{ currentUser }} />;
};

// Componente para proteger las rutas que requieren autenticación
const ProtectedRoutes: React.FC<{ currentUser: User | null; onLogout: () => void }> = ({ currentUser, onLogout }) => {
    if (!currentUser) {
        return <Navigate to="/login" replace />;
    }
    return (
        <Layout onLogout={onLogout} user={currentUser}>
            <Outlet context={{ currentUser }} />
        </Layout>
    );
};

const App: React.FC = () => {
    const [currentUser, setCurrentUser] = useState<User | null>(() => {
        // Estrategia de recuperación de sesión: Persistente (Local) vs Temporal (Session)
        const localUser = localStorage.getItem('currentUser');
        const sessionUser = sessionStorage.getItem('currentUser');
        
        try {
            if (localUser) return JSON.parse(localUser);
            if (sessionUser) return JSON.parse(sessionUser);
            return null;
        } catch {
            localStorage.removeItem('currentUser');
            sessionStorage.removeItem('currentUser');
            return null;
        }
    });

    const handleLogin = useCallback((user: User, remember: boolean) => {
        if (remember) {
            localStorage.setItem('currentUser', JSON.stringify(user));
            sessionStorage.removeItem('currentUser');
        } else {
            sessionStorage.setItem('currentUser', JSON.stringify(user));
            localStorage.removeItem('currentUser');
        }
        setCurrentUser(user);
    }, []);

    const handleLogout = useCallback(() => {
        localStorage.removeItem('currentUser');
        sessionStorage.removeItem('currentUser');
        setCurrentUser(null);
    }, []);

    return (
        <HashRouter>
            <Routes>
                {/* 
                   ==================================================================
                   ZONA PÚBLICA (Acceso Libre)
                   - Landing Page (Tienda Virtual)
                   - Login (Acceso Personal)
                   - Recibos Digitales (Para compartir con clientes)
                   ==================================================================
                */}
                <Route path="/" element={<LandingPage />} />
                
                <Route 
                    path="/login" 
                    element={currentUser ? <Navigate to="/dashboard" replace /> : <Login onLoginSuccess={handleLogin} />} 
                />

                <Route path="/recibo-abono/:trabajoId" element={<ReciboAbonoPage />} />

                {/* 
                   ==================================================================
                   ZONA PRIVADA (Sistema de Gestión)
                   - Requiere Login
                   ==================================================================
                */}
                <Route element={<ProtectedRoutes currentUser={currentUser} onLogout={handleLogout} />}>
                    <Route path="/dashboard" element={<DashboardPage />} />
                    
                    {/* Flujo de Producción */}
                    <Route path="/nuevo" element={<NuevoPedidoPage />} />
                    <Route path="/diseno" element={<DisenoPage />} />
                    <Route path="/kds" element={<KDSPage />} />
                    <Route path="/trabajos" element={<TrabajosPage />} />
                    <Route path="/trabajos/:trabajoId" element={<TrabajoDetallePage />} />
                    <Route path="/retiros" element={<RetirosPage />} />
                    
                    {/* Gestión de Recursos */}
                    <Route path="/clientes" element={<ClientesPage />} />
                    <Route path="/productos" element={<ProductosPage />} />
                    <Route path="/proveedores" element={<ProveedoresPage />} />
                    <Route path="/inventario" element={<InventarioPage />} />
                    
                    {/* Herramientas */}
                    <Route path="/calculadora" element={<CalculadoraPreciosPage />} />
                    
                    {/* Finanzas */}
                    <Route path="/finanzas" element={<FinanzasPage />} />
                    
                    {/* Documentos Internos (Vistas de Impresión) */}
                    <Route path="/nota-de-venta/:trabajoId" element={<NotaDeVentaPage />} />
                    <Route path="/solicitud-impresion/:trabajoId" element={<SolicitudImpresionPage />} />

                    {/* Zona Admin */}
                    <Route element={<AdminRoutes />}>
                        <Route path="/usuarios" element={<GestionUsuariosPage />} />
                        <Route path="/configuracion" element={<ConfiguracionPage />} />
                    </Route>
                </Route>
                
                {/* Redirección por defecto */}
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </HashRouter>
    );
};

export default App;