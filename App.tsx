
import React, { useState, useCallback } from 'react';
import { HashRouter, Routes, Route, Navigate, Outlet, useOutletContext } from 'react-router-dom';
import { Layout } from './components/Layout';
import { DataProvider } from './contexts/DataContext';
import Login from './pages/Login';
import DashboardPage from './pages/Dashboard';
import KDSPage from './pages/KDS';
import FinanzasPage from './pages/Finanzas';
import ClientesPage from './pages/Clientes';
import NuevoPedidoPage from './pages/NuevoPedido';
import InventarioPage from './pages/Inventario';
import LandingPage from './pages/Landing';
import NotaDeVentaPage from './pages/NotaDeVenta';
import ProductosPage from './pages/Productos';
import SolicitudImpresionPage from './pages/SolicitudImpresion';
import TrabajoDetallePage from './pages/TrabajoDetalle';
import TrabajosPage from './pages/Trabajos';
import GestionUsuariosPage from './pages/GestionUsuarios';
import RetirosPage from './pages/Retiros';
import ConfiguracionPage from './pages/Configuracion';
import ReciboAbonoPage from './pages/ReciboAbono';
import ProveedoresPage from './pages/Proveedores';
import CalculadoraPreciosPage from './pages/CalculadoraPrecios';
import DisenoPage from './pages/Diseno';
import { User } from './types';

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
            {/* El Outlet ahora tiene acceso al DataProvider padre */}
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
            {/* DataProvider envuelve toda la app para que el estado esté disponible globalmente */}
            <DataProvider>
                <Routes>
                    {/* ==================================================================
                        ZONA PÚBLICA (Acceso libre)
                       ================================================================== */}
                    <Route path="/" element={<LandingPage />} />
                    
                    {/* Login: Redirige al Dashboard si ya está autenticado */}
                    <Route 
                        path="/login" 
                        element={currentUser ? <Navigate to="/dashboard" replace /> : <Login onLoginSuccess={handleLogin} />} 
                    />

                    {/* Recibos digitales compartibles (Solo lectura, sin auth requerida para el cliente final) */}
                    <Route path="/recibo-abono/:trabajoId" element={<ReciboAbonoPage />} />


                    {/* ==================================================================
                        ZONA PRIVADA (Requiere Autenticación)
                       ================================================================== */}
                    <Route element={<ProtectedRoutes currentUser={currentUser} onLogout={handleLogout} />}>
                        <Route path="/dashboard" element={<DashboardPage />} />
                        
                        {/* -- Operaciones & Producción -- */}
                        <Route path="/nuevo" element={<NuevoPedidoPage />} />
                        <Route path="/diseno" element={<DisenoPage />} />
                        <Route path="/kds" element={<KDSPage />} />
                        <Route path="/trabajos" element={<TrabajosPage />} />
                        <Route path="/trabajos/:trabajoId" element={<TrabajoDetallePage />} />
                        <Route path="/retiros" element={<RetirosPage />} />
                        
                        {/* -- Gestión de Recursos -- */}
                        <Route path="/clientes" element={<ClientesPage />} />
                        <Route path="/productos" element={<ProductosPage />} />
                        <Route path="/proveedores" element={<ProveedoresPage />} />
                        <Route path="/inventario" element={<InventarioPage />} />
                        
                        {/* -- Herramientas -- */}
                        <Route path="/calculadora" element={<CalculadoraPreciosPage />} />
                        
                        {/* -- Finanzas & Reportes -- */}
                        <Route path="/finanzas" element={<FinanzasPage />} />
                        
                        {/* -- Documentos Internos (Protegidos) -- */}
                        <Route path="/nota-de-venta/:trabajoId" element={<NotaDeVentaPage />} />
                        <Route path="/solicitud-impresion/:trabajoId" element={<SolicitudImpresionPage />} />

                        {/* -- Zona Admin (Solo Rol Admin) -- */}
                        <Route element={<AdminRoutes />}>
                            <Route path="/usuarios" element={<GestionUsuariosPage />} />
                            <Route path="/configuracion" element={<ConfiguracionPage />} />
                        </Route>
                    </Route>
                    
                    {/* Fallback global: Cualquier ruta desconocida va al inicio */}
                    <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
            </DataProvider>
        </HashRouter>
    );
};

export default App;
