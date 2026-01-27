
import React, { useState } from 'react';
import { HashRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { User } from './types';
import { DataProvider } from './contexts/DataContext';
import { Layout } from './components/Layout';

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
import InventarioPage from './pages/Inventario';
import GestionUsuariosPage from './pages/GestionUsuarios';
import RetirosPage from './pages/Retiros';
import DisenoPage from './pages/Diseno';
import TrackingPage from './pages/Tracking';
import OrdenProduccionPage from './pages/OrdenProduccion';
import NotaDeVentaPage from './pages/NotaDeVenta';
import SolicitudImpresionPage from './pages/SolicitudImpresion';
import ReciboAbonoPage from './pages/ReciboAbono';
import TrabajoDetallePage from './pages/TrabajoDetalle';
import TrabajosPage from './pages/Trabajos';

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

  const handleLogin = (user: User, remember: boolean) => {
    setCurrentUser(user);
    if (remember) {
      localStorage.setItem('currentUser', JSON.stringify(user));
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('currentUser');
  };

  return (
    <DataProvider>
      <HashRouter>
        <Routes>
          {/* Public Routes - NOW USING PREMIUM VISUAL LANDING */}
          <Route path="/" element={<VisualLanding />} />
          <Route path="/login" element={<LoginPage onLoginSuccess={handleLogin} />} />
          <Route path="/tracking" element={<TrackingPage />} />
          
          {/* Internal Print Views (No Navigation Layout) */}
          <Route path="/nota-de-venta/:trabajoId" element={<NotaDeVentaPage />} />
          <Route path="/solicitud-impresion/:trabajoId" element={<SolicitudImpresionPage />} />
          <Route path="/orden-produccion/:trabajoId" element={<OrdenProduccionPage />} />
          <Route path="/recibo-abono/:trabajoId" element={<ReciboAbonoPage />} />

          {/* Protected Administration Routes */}
          <Route element={<ProtectedRoute user={currentUser} onLogout={handleLogout} />}>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/nuevo" element={<NuevoPedidoPage />} />
            <Route path="/diseno" element={<DisenoPage />} />
            <Route path="/kds" element={<KDSPage />} />
            <Route path="/retiros" element={<RetirosPage />} />
            <Route path="/clientes" element={<ClientesPage />} />
            <Route path="/trabajos" element={<TrabajosPage />} />
            <Route path="/trabajos/:trabajoId" element={<TrabajoDetallePage />} />
            <Route path="/productos" element={<ProductosPage />} />
            <Route path="/inventario" element={<InventarioPage />} />
            <Route path="/finanzas" element={<FinanzasPage />} />
            <Route path="/usuarios" element={<GestionUsuariosPage />} />
            <Route path="/configuracion" element={<ConfiguracionPage />} />
          </Route>

          {/* Fallback to Home */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </HashRouter>
    </DataProvider>
  );
};

export default App;
