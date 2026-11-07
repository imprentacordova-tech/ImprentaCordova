import React, { Suspense, useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import Layout from './components/Layout';
import { purgeOldEntries } from './services/activityLogService';
import { Loader2Icon } from './components/Icons';

// ── Lazy-loaded Public Pages ─────────────────────────────────────────────
const VisualLanding = React.lazy(() => import('./pages/VisualLanding'));
const LoginPage = React.lazy(() => import('./pages/Login'));
const TrackingPage = React.lazy(() => import('./pages/Tracking'));
const VitrinaPage = React.lazy(() => import('./pages/Vitrina'));
const PanelInternoPage = React.lazy(() => import('./pages/PanelInterno'));
const RecuperarAccesoPage = React.lazy(() => import('./pages/RecuperarAcceso'));

// ── Lazy-loaded Printable Documents ──────────────────────────────────────
const OrdenProduccionPage = React.lazy(() => import('./pages/OrdenProduccion'));
const NotaDeVentaPage = React.lazy(() => import('./pages/NotaDeVenta'));
const SolicitudImpresionPage = React.lazy(() => import('./pages/SolicitudImpresion'));
const ReciboAbonoPage = React.lazy(() => import('./pages/ReciboAbono'));
const ReciboEpsonPage = React.lazy(() => import('./pages/ReciboEpson'));

// ── Lazy-loaded Admin Pages ──────────────────────────────────────────────
const DashboardPage = React.lazy(() => import('./pages/Dashboard'));
const NuevoPedidoPage = React.lazy(() => import('./pages/NuevoPedido'));
const KDSPage = React.lazy(() => import('./pages/KDS'));
const FinanzasPage = React.lazy(() => import('./pages/Finanzas'));
const ClientesPage = React.lazy(() => import('./pages/Clientes'));
const ConfiguracionPage = React.lazy(() => import('./pages/Configuracion'));
const ProductosPage = React.lazy(() => import('./pages/Productos'));
const CalculadoraPreciosPage = React.lazy(() => import('./pages/CalculadoraPrecios'));
const InventarioPage = React.lazy(() => import('./pages/Inventario'));
const GestionUsuariosPage = React.lazy(() => import('./pages/GestionUsuarios'));
const RetirosPage = React.lazy(() => import('./pages/Retiros'));
const ProveedoresPage = React.lazy(() => import('./pages/Proveedores'));
const DisenoPage = React.lazy(() => import('./pages/Diseno'));
const ProduccionPage = React.lazy(() => import('./pages/Produccion'));
const TrabajoDetallePage = React.lazy(() => import('./pages/TrabajoDetalle'));
const TrabajosPage = React.lazy(() => import('./pages/Trabajos'));
const RegistroActividadPage = React.lazy(() => import('./pages/RegistroActividad'));
const CuentasPage = React.lazy(() => import('./pages/Cuentas'));
const FacturacionElectronicaPage = React.lazy(() => import('./pages/FacturacionElectronica'));

// ── Loading Fallback ─────────────────────────────────────────────────────
const PageLoader = () => (
  <div className="min-h-screen bg-slate-50 flex items-center justify-center">
    <div className="flex flex-col items-center gap-4">
      <Loader2Icon className="w-8 h-8 text-brand-blue animate-spin" />
      <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Cargando modulo...</span>
    </div>
  </div>
);

// ── Protected Route ──────────────────────────────────────────────────────
const ProtectedRoute: React.FC = () => {
  const { user, loading } = useAuth();
  
  if (loading) return <PageLoader />;
  if (!user) return <Navigate to="/login" replace />;
  
  return (
    <Layout>
      <Outlet context={{ currentUser: user }} />
    </Layout>
  );
};

// ── Main App ─────────────────────────────────────────────────────────────
const App: React.FC = () => {
  const { user } = useAuth();

  useEffect(() => {
    purgeOldEntries();
  }, []);

  return (
    <HashRouter>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<VisualLanding />} />
          <Route path="/vitrina" element={<VitrinaPage />} />
          <Route path="/recuperar-acceso" element={<RecuperarAccesoPage />} />
          <Route path="/login" element={
            user ? <Navigate to="/dashboard" replace /> : <LoginPage />
          } />
          <Route path="/tracking" element={<TrackingPage />} />

          {/* Panel Interno — importado de Claude Design (Panel-Interno.dc.html) */}
          <Route path="/panel-interno" element={<PanelInternoPage />} />

          {/* Internal Print Views (No Layout) */}
          <Route path="/nota-de-venta/:trabajoId" element={<NotaDeVentaPage />} />
          <Route path="/solicitud-impresion/:trabajoId" element={<SolicitudImpresionPage />} />
          <Route path="/solicitud-impresion" element={<SolicitudImpresionPage />} />
          <Route path="/orden-produccion/:trabajoId" element={<OrdenProduccionPage />} />
          <Route path="/recibo-abono/:trabajoId" element={<ReciboAbonoPage />} />
          <Route path="/recibo-epson/:trabajoId" element={<ReciboEpsonPage />} />
          <Route path="/recibo-epson" element={<ReciboEpsonPage />} />
          <Route path="/recibo-comercial/:trabajoId" element={<ReciboEpsonPage />} />

          {/* Protected Administration Routes */}
          <Route element={<ProtectedRoute />}>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/nuevo" element={<NuevoPedidoPage />} />
            <Route path="/nuevo-pedido" element={<NuevoPedidoPage />} />
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
            <Route path="/facturacion" element={<FacturacionElectronicaPage />} />
            <Route path="/registro" element={<RegistroActividadPage />} />
            <Route path="/calculadora" element={<CalculadoraPreciosPage />} />
            <Route path="/configuracion" element={<ConfiguracionPage />} />
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </HashRouter>
  );
};

export default App;
