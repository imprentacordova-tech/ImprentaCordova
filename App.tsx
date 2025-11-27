import React, { useState, useCallback } from 'react';
import { HashRouter, Routes, Route, Navigate, Outlet, useOutletContext } from 'react-router-dom';
import { Layout } from './components/Layout';
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
            <Outlet context={{ currentUser }} />
        </Layout>
    );
};

const App: React.FC = () => {
    const [currentUser, setCurrentUser] = useState<User | null>(() => {
        const userJson = localStorage.getItem('currentUser');
        try {
            return userJson ? JSON.parse(userJson) : null;
        } catch {
            localStorage.removeItem('currentUser');
            return null;
        }
    });

    const handleLogin = useCallback((user: User) => {
        localStorage.setItem('currentUser', JSON.stringify(user));
        setCurrentUser(user);
    }, []);

    const handleLogout = useCallback(() => {
        localStorage.removeItem('currentUser');
        setCurrentUser(null);
    }, []);

    return (
        <HashRouter>
            <Routes>
                {/* Rutas Públicas */}
                <Route path="/" element={<LandingPage />} />
                <Route 
                    path="/login" 
                    element={currentUser ? <Navigate to="/dashboard" replace /> : <Login onLoginSuccess={handleLogin} />} 
                />
                 <Route path="/recibo-abono/:trabajoId" element={<ReciboAbonoPage />} />


                {/* Grupo de Rutas Protegidas */}
                <Route element={<ProtectedRoutes currentUser={currentUser} onLogout={handleLogout} />}>
                    <Route path="/dashboard" element={<DashboardPage />} />
                    <Route path="/trabajos" element={<TrabajosPage />} />
                    <Route path="/kds" element={<KDSPage />} />
                    <Route path="/finanzas" element={<FinanzasPage />} />
                    <Route path="/clientes" element={<ClientesPage />} />
                    <Route path="/proveedores" element={<ProveedoresPage />} />
                    <Route path="/nuevo" element={<NuevoPedidoPage />} />
                    <Route path="/calculadora" element={<CalculadoraPreciosPage />} />
                    <Route path="/inventario" element={<InventarioPage />} />
                    <Route path="/productos" element={<ProductosPage />} />
                    <Route path="/retiros" element={<RetirosPage />} />
                    <Route path="/nota-de-venta/:trabajoId" element={<NotaDeVentaPage />} />
                    <Route path="/solicitud-impresion/:trabajoId" element={<SolicitudImpresionPage />} />
                    <Route path="/trabajos/:trabajoId" element={<TrabajoDetallePage />} />

                    {/* Rutas solo para Admin */}
                    <Route element={<AdminRoutes />}>
                        <Route path="/usuarios" element={<GestionUsuariosPage />} />
                        <Route path="/configuracion" element={<ConfiguracionPage />} />
                    </Route>
                </Route>
                
                {/* Redirección para cualquier otra ruta no encontrada */}
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </HashRouter>
    );
};

export default App;