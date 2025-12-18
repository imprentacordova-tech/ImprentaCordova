
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
import TrackingPage from './pages/Tracking'; // Nueva ruta
import { User } from './types';

const AdminRoutes: React.FC = () => {
    const { currentUser } = useOutletContext<{ currentUser: User }>();
    if (currentUser.rol !== 'Admin') {
        return <Navigate to="/dashboard" replace />;
    }
    return <Outlet context={{ currentUser }} />;
};

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
        const localUser = localStorage.getItem('currentUser');
        const sessionUser = sessionStorage.getItem('currentUser');
        try {
            if (localUser) return JSON.parse(localUser);
            if (sessionUser) return JSON.parse(sessionUser);
            return null;
        } catch {
            return null;
        }
    });

    const handleLogin = useCallback((user: User, remember: boolean) => {
        if (remember) {
            localStorage.setItem('currentUser', JSON.stringify(user));
        } else {
            sessionStorage.setItem('currentUser', JSON.stringify(user));
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
            <DataProvider>
                <Routes>
                    <Route path="/" element={<LandingPage />} />
                    <Route path="/tracking" element={<TrackingPage />} />
                    <Route path="/login" element={currentUser ? <Navigate to="/dashboard" replace /> : <Login onLoginSuccess={handleLogin} />} />
                    <Route path="/recibo-abono/:trabajoId" element={<ReciboAbonoPage />} />

                    <Route element={<ProtectedRoutes currentUser={currentUser} onLogout={handleLogout} />}>
                        <Route path="/dashboard" element={<DashboardPage />} />
                        <Route path="/nuevo" element={<NuevoPedidoPage />} />
                        <Route path="/diseno" element={<DisenoPage />} />
                        <Route path="/kds" element={<KDSPage />} />
                        <Route path="/trabajos" element={<TrabajosPage />} />
                        <Route path="/trabajos/:trabajoId" element={<TrabajoDetallePage />} />
                        <Route path="/retiros" element={<RetirosPage />} />
                        <Route path="/clientes" element={<ClientesPage />} />
                        <Route path="/productos" element={<ProductosPage />} />
                        <Route path="/proveedores" element={<ProveedoresPage />} />
                        <Route path="/inventario" element={<InventarioPage />} />
                        <Route path="/calculadora" element={<CalculadoraPreciosPage />} />
                        <Route path="/finanzas" element={<FinanzasPage />} />
                        <Route path="/nota-de-venta/:trabajoId" element={<NotaDeVentaPage />} />
                        <Route path="/solicitud-impresion/:trabajoId" element={<SolicitudImpresionPage />} />
                        <Route element={<AdminRoutes />}>
                            <Route path="/usuarios" element={<GestionUsuariosPage />} />
                            <Route path="/configuracion" element={<ConfiguracionPage />} />
                        </Route>
                    </Route>
                    <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
            </DataProvider>
        </HashRouter>
    );
};

export default App;
