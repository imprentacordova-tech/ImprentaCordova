
import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { User } from './types';
import Layout from './components/Layout';
import { logActivity, purgeOldEntries } from './services/activityLogService';

// Pages
import VisualLanding from './pages/VisualLanding'; // Changed from LandingPage
import LoginPage from './pages/Login';
import DashboardPage from './pages/Dashboard';
import KDSPage from './pages/KDS';
import FinanzasPage from './pages/Finanzas';
import ClientesPage from './pages/Clientes';
import NuevoPedidoPage from './pages/NuevoPedido';
import ConfiguracionPage from './pages/Configuracion';
import ProductosPage from './pages/Productos';
import CalculadoraPreciosPage from './pages/CalculadoraPrecios';
import InventarioPage from './pages/Inventario';
import GestionUsuariosPage from './pages/GestionUsuarios';
import RetirosPage from './pages/Retiros';
import ProveedoresPage from './pages/Proveedores';
import DisenoPage from './pages/Diseno';
import ProduccionPage from './pages/Produccion';
import TrackingPage from './pages/Tracking';
import OrdenProduccionPage from './pages/OrdenProduccion';
import NotaDeVentaPage from './pages/NotaDeVenta';
import SolicitudImpresionPage from './pages/SolicitudImpresion';
import ReciboAbonoPage from './pages/ReciboAbono';
import ReciboEpsonPage from './pages/ReciboEpson';
import TrabajoDetallePage from './pages/TrabajoDetalle';
import TrabajosPage from './pages/Trabajos';
import RegistroActividadPage from './pages/RegistroActividad';
import CuentasPage from './pages/Cuentas';
import VitrinaPage from './pages/Vitrina';

/**
 * ProtectedRoute component to handle authenticated access.
 */
const ProtectedRoute = ({ user, onLogout }: { user: User | null, onLogout: () => void }) => {
  if (!user) return <Navigate to="/login" replace />;
  return (
    <Layout user={user} onLogout={onLogout}>
      <Outlet context={{ currentUser: user }} />
    </Layout>
  );
};

/**
 * Main App component with defined routing structure.
 */
const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('currentUser');
    return saved ? JSON.parse(saved) : null;
  });

  // Auto-purga de registros de actividad al iniciar la app
  useEffect(() => {
    purgeOldEntries();
  }, []);

  const handleLogin = (user: User, remember: boolean) => {
    setCurrentUser(user);
    localStorage.setItem('currentUser', JSON.stringify(user));
    logActivity(user.nombre, user.rol, 'LOGIN', `Inicio de sesión exitoso`, 'Sistema');
  };

  const handleLogout = () => {
    if (currentUser) {
      logActivity(currentUser.nombre, currentUser.rol, 'LOGOUT', `Cierre de sesión`, 'Sistema');
    }
    setCurrentUser(null);
    localStorage.removeItem('currentUser');
  };

  return (
      <HashRouter>
        <Routes>
          {/* Public Routes - NOW USING PREMIUM VISUAL LANDING */}
          <Route path="/" element={<VisualLanding />} />
          <Route path="/vitrina" element={<VitrinaPage />} />
          <Route path="/login" element={currentUser ? <Navigate to="/dashboard" replace /> : <LoginPage onLoginSuccess={handleLogin} />} />
          <Route path="/tracking" element={<TrackingPage />} />
          
          {/* Internal Print Views (No Navigation Layout) */}
          <Route path="/nota-de-venta/:trabajoId" element={<NotaDeVentaPage />} />
          <Route path="/solicitud-impresion/:trabajoId" element={<SolicitudImpresionPage />} />
          <Route path="/orden-produccion/:trabajoId" element={<OrdenProduccionPage />} />
          <Route path="/recibo-abono/:trabajoId" element={<ReciboAbonoPage />} />
          <Route path="/recibo-epson/:trabajoId" element={<ReciboEpsonPage />} />

          {/* Protected Administration Routes */}
          <Route element={<ProtectedRoute user={currentUser} onLogout={handleLogout} />}>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/nuevo" element={<NuevoPedidoPage />} />
            <Route path="/diseno" element={<DisenoPage />} />
            <Route path="/produccion" element={<ProduccionPage />} />
            <Route path="/kds" element={<KDSPage />} />
            <Route path="/retiros" element={<RetirosPage />} />
            <Route path="/clientes" element={<ClientesPage />} />
            <Route path="/trabajos" element={<TrabajosPage />} />
            <Route path="/trabajos/:trabajoId" element={<TrabajoDetallePage />} />
            <Route path="/productos" element={<ProductosPage />} />
            <Route path="/inventario" element={<InventarioPage />} />
            <Route path="/proveedores" element={<ProveedoresPage />} />
            <Route path="/finanzas" element={<FinanzasPage />} />
            <Route path="/usuarios" element={<GestionUsuariosPage />} />
            <Route path="/cuentas" element={<CuentasPage />} />
            <Route path="/registro" element={<RegistroActividadPage />} />
            <Route path="/calculadora" element={<CalculadoraPreciosPage />} />
            <Route path="/configuracion" element={<ConfiguracionPage />} />
          </Route>

          {/* Fallback to Home */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </HashRouter>
  );
};

export default App;
