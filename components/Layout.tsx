import React, { useState, useEffect, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { MenuIcon, Cog8ToothIcon, WalletIcon, ChevronRightIcon, LogoutIcon } from './Icons';
import { TrabajoEstado } from '../types';
import { useData } from '../contexts/DataContext';
import { useAuth } from '../contexts/AuthContext';
import { SEO } from './SEO';
import { MobileFloatingNav } from './MobileFloatingNav';
import { SearchOmni } from './SearchOmni';
import { ModalArqueoCaja } from './dashboard/ModalArqueoCaja';
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts';
import { C } from './panelTheme';
import { buildNavGroups, PAGE_TITLES } from './layout/navModel';
import { SidebarContent } from './layout/SidebarContent';
import { despertarBackend } from '../services/backendApi';
import { solicitudesWebService } from '../services/solicitudesWebService';

/**
 * Layout interno — Sistema "Marino & Oro" (tema claro).
 * Shell fiel a `Panel-Interno.dc.html` (Claude Design): sidebar marino,
 * header claro, barra móvil. Cableado real: rutas, badges de datos, auth.
 * Ver design_manifest.md §2.
 */

interface LayoutProps {
    children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const location = useLocation();
    const navigate = useNavigate();
    const { trabajos, clientes, updateTrabajoStatus } = useData();
    const { user, logout: authLogout } = useAuth();
    useKeyboardShortcuts();

    // Mantiene despierto el backend SRI (Render gratuito) mientras el panel esté abierto
    // y visible: la primera factura del día no espera 30-60 s de arranque en frío.
    useEffect(() => {
        if (!user) return;
        const tick = () => { if (document.visibilityState === 'visible') despertarBackend(); };
        tick();
        const id = setInterval(tick, 10 * 60 * 1000);
        document.addEventListener('visibilitychange', tick);
        return () => { clearInterval(id); document.removeEventListener('visibilitychange', tick); };
    }, [user]);

    // La extensión avisa cuando la imprenta acepta una solicitud SRI: la orden
    // pasa a "En Diseño" (el trámite ya arrancó).
    useEffect(() => {
        if (!user) return;
        const onMsg = (e: MessageEvent) => {
            // Mismo origen y misma ventana: este mensaje cambia el estado de una
            // orden, así que no se acepta de un iframe ajeno.
            if (e.source !== window || e.origin !== window.location.origin) return;
            if (!e.data || e.data.type !== 'CORDOVA_SRI_ACEPTADA') return;
            const ruc = String(e.data.data?.ruc || '').replace(/\D/g, '');
            if (!ruc) return;
            const pend = (trabajos || []).find(t => {
                if (!t.esSRI || t.estado !== TrabajoEstado.PENDIENTE) return false;
                const cli = (clientes || []).find(c => c.id === t.clienteId);
                return !!cli && (cli.ruc === ruc || cli.cedula === ruc);
            });
            if (pend) {
                updateTrabajoStatus(pend.id, TrabajoEstado.EN_DISENO, user?.nombre || 'Sistema')
                    .catch(err => console.warn('[Cordova] No se pudo pasar a Diseño:', err));
            }
        };
        window.addEventListener('message', onMsg);
        return () => window.removeEventListener('message', onMsg);
    }, [trabajos, clientes, updateTrabajoStatus, user]);

    // Solicitudes web sin atender: contador del menú, consultado cada 2 minutos.
    const [solicitudesNuevas, setSolicitudesNuevas] = useState(0);
    useEffect(() => {
        if (!user) return;
        let vivo = true;
        const tick = () => {
            if (document.visibilityState !== 'visible') return;
            solicitudesWebService.contarNuevas().then(n => { if (vivo) setSolicitudesNuevas(n); }).catch(() => {});
        };
        tick();
        const id = setInterval(tick, 2 * 60 * 1000);
        return () => { vivo = false; clearInterval(id); };
    }, [user, location.pathname]);

    // El backend respondió 401 con un token: la sesión venció. Se cierra y se vuelve a
    // esta misma pantalla después del login (Nueva Orden guarda su borrador antes).
    useEffect(() => {
        const alVencer = () => {
            const volver = location.pathname + location.search;
            authLogout().finally(() => navigate(`/login?volver=${encodeURIComponent(volver)}`, { replace: true }));
        };
        window.addEventListener('cordova:sesion-vencida', alVencer);
        return () => window.removeEventListener('cordova:sesion-vencida', alVencer);
    }, [authLogout, navigate, location.pathname, location.search]);

    const isAdmin = !!user && (user.rol === 'Admin' || (user.rol as string) === 'root');
    const navGroups = useMemo(() => buildNavGroups(isAdmin), [isAdmin]);

    const badges = useMemo<Record<string, number>>(() => {
        if (!trabajos) return {};
        const activos = trabajos.filter(t => t.estado !== TrabajoEstado.ENTREGADO);
        return {
            ordenes: activos.length,
            cobrar: activos.filter(t => t.saldo > 0).length,
            stock:  0,
            solicitudes: solicitudesNuevas,
        };
    }, [trabajos, solicitudesNuevas]);

    const pageTitle = useMemo(() => PAGE_TITLES[location.pathname] || 'Sistema', [location.pathname]);

    // Cerrar sidebar al navegar
    useEffect(() => { setSidebarOpen(false); }, [location.pathname]);

    // Bloquear scroll de la página de fondo cuando el drawer móvil está abierto
    useEffect(() => {
        if (sidebarOpen) {
            const originalOverflow = document.body.style.overflow;
            document.body.style.overflow = 'hidden';
            return () => {
                document.body.style.overflow = originalOverflow;
            };
        }
    }, [sidebarOpen]);

    const [time, setTime] = useState(() => new Date().toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit' }));
    useEffect(() => {
        const timer = setInterval(() => {
            setTime(new Date().toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit' }));
        }, 30000);
        return () => clearInterval(timer);
    }, []);

    const [userMenuOpen, setUserMenuOpen] = useState(false);
    const [arqueoModalOpen, setArqueoModalOpen] = useState(false);

    // ⚠️ NO mover hooks debajo de esta línea. Si `user` pasa a null (logout) con hooks
    // por debajo, React ve menos hooks que en el render anterior, lanza
    // "Rendered fewer hooks than expected" y la app queda en blanco.
    if (!user) return null;

    const userInitials = user.nombre.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();


    return (
        <div style={{ minHeight: '100vh', background: C.bg, color: C.ink, fontFamily: "'Inter',system-ui,sans-serif", display: 'flex' }}>
            <SEO title={`${pageTitle} · Imprenta Córdova`} />

            {/* SIDEBAR DESKTOP */}
            <aside
                className="hidden lg:flex"
                style={{ flexDirection: 'column', width: 248, flexShrink: 0, height: '100vh', position: 'sticky', top: 0, zIndex: 100 }}
            >
                <SidebarContent user={user} userInitials={userInitials} navGroups={navGroups} badges={badges} onAbrirArqueo={() => setArqueoModalOpen(true)} onLogout={authLogout} />
            </aside>

            {/* SIDEBAR MOBILE CON DISEÑO TÁCTIL ERGONÓMICO */}
            <AnimatePresence>
                {sidebarOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="lg:hidden"
                            style={{ position: 'fixed', inset: 0, zIndex: 140, background: 'rgba(10,17,64,.6)', backdropFilter: 'blur(5px)', WebkitBackdropFilter: 'blur(5px)', touchAction: 'none' }}
                            onClick={() => setSidebarOpen(false)}
                            onTouchEnd={() => setSidebarOpen(false)}
                        />
                        <motion.aside
                            initial={{ x: -340 }}
                            animate={{ x: 0 }}
                            exit={{ x: -340 }}
                            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
                            className="lg:hidden"
                            style={{
                                position: 'fixed',
                                insetBlock: 0,
                                left: 0,
                                zIndex: 150,
                                width: 'min(330px, 88vw)',
                                maxWidth: '88vw',
                                boxShadow: '0 0 60px rgba(10,17,64,.65)',
                                touchAction: 'pan-y',
                            }}
                        >
                            <SidebarContent user={user} userInitials={userInitials} navGroups={navGroups} badges={badges} onAbrirArqueo={() => setArqueoModalOpen(true)} onLogout={authLogout} onNavClick={() => setSidebarOpen(false)} isMobile />
                        </motion.aside>
                    </>
                )}
            </AnimatePresence>

            {/* MAIN CONTENT */}
            <main style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
                {/* TOP HEADER */}
                <header
                    style={{
                        minHeight: 70, background: 'rgba(255,255,255,.92)', backdropFilter: 'blur(16px)',
                        borderBottom: `1px solid ${C.border}`, padding: '0 clamp(16px,2.4vw,32px)',
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 20,
                        position: 'sticky', top: 0, zIndex: 90,
                    }}
                >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
                        <button
                            onClick={() => setSidebarOpen(true)}
                            className="lg:hidden"
                            style={{ width: 42, height: 42, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F2F4FA', border: `1px solid ${C.border}`, borderRadius: 11, cursor: 'pointer' }}
                            aria-label="Abrir menú"
                        >
                            <MenuIcon className="w-5 h-5" style={{ color: C.ink }} />
                        </button>

                        <div style={{ minWidth: 0 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 9.5, fontWeight: 700, letterSpacing: '.28em', textTransform: 'uppercase', color: C.faint }}>
                                <span>Imprenta Córdova</span>
                                <ChevronRightIcon className="w-2.5 h-2.5" style={{ color: '#C7CEE4' }} />
                                <span style={{ color: C.royal, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{pageTitle}</span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginTop: 4 }}>
                                <span style={{ position: 'relative', display: 'flex', width: 7, height: 7, alignItems: 'center', justifyContent: 'center' }}>
                                    <motion.span
                                        animate={{ scale: [1, 2.3], opacity: [0.7, 0] }}
                                        transition={{ repeat: Infinity, duration: 2, ease: 'easeOut' }}
                                        style={{ position: 'absolute', inset: 0, borderRadius: 99, background: '#1B8A4B' }}
                                    />
                                    <span style={{ position: 'relative', width: 6, height: 6, borderRadius: 99, background: '#1B8A4B' }} />
                                </span>
                                <span style={{ fontSize: 10, fontFamily: "'JetBrains Mono',monospace", letterSpacing: '.16em', textTransform: 'uppercase', color: C.faint }}>
                                    Sistema en línea · {time}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
                        {badges.ordenes > 0 && (
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => navigate('/trabajos')}
                                className="hidden md:flex"
                                style={{ alignItems: 'center', gap: 8, padding: '7px 13px', background: '#FFFBEB', border: '1px solid #F4E3A8', borderRadius: 9, cursor: 'pointer' }}
                            >
                                <motion.span
                                    animate={{ scale: [1, 1.4, 1] }}
                                    transition={{ repeat: Infinity, duration: 1.8 }}
                                    style={{ width: 6, height: 6, borderRadius: 99, background: C.gold }}
                                />
                                <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: '.1em', textTransform: 'uppercase', color: '#7A5A00' }}>
                                    {badges.ordenes} activas
                                </span>
                            </motion.button>
                        )}

                        <SearchOmni />

                        {/* User Avatar & Session Menu */}
                        <div style={{ position: 'relative' }}>
                            <button
                                type="button"
                                onClick={() => setUserMenuOpen(v => !v)}
                                aria-label="Menú de usuario"
                                style={{
                                    width: 38,
                                    height: 38,
                                    borderRadius: 10,
                                    background: C.chipBlue,
                                    border: `1px solid ${userMenuOpen ? C.royal : C.borderStrong}`,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: 12,
                                    fontWeight: 800,
                                    color: C.royal,
                                    cursor: 'pointer',
                                    transition: 'all 0.2s',
                                }}
                            >
                                {userInitials}
                            </button>

                            <AnimatePresence>
                                {userMenuOpen && (
                                    <>
                                        <div
                                            style={{ position: 'fixed', inset: 0, zIndex: 100 }}
                                            onClick={() => setUserMenuOpen(false)}
                                        />
                                        <motion.div
                                            initial={{ opacity: 0, scale: 0.95, y: 8 }}
                                            animate={{ opacity: 1, scale: 1, y: 0 }}
                                            exit={{ opacity: 0, scale: 0.95, y: 8 }}
                                            transition={{ duration: 0.15 }}
                                            style={{
                                                position: 'absolute',
                                                right: 0,
                                                top: 'calc(100% + 8px)',
                                                width: 260,
                                                maxWidth: 'calc(100vw - 32px)',
                                                background: '#FFFFFF',
                                                border: `1px solid ${C.border}`,
                                                borderRadius: 14,
                                                boxShadow: '0 18px 40px -10px rgba(10,17,64,.18)',
                                                padding: '8px',
                                                zIndex: 110,
                                                display: 'flex',
                                                flexDirection: 'column',
                                                gap: 4,
                                            }}
                                        >
                                            {/* Header de Usuario */}
                                            <div style={{ padding: '10px 12px 8px', borderBottom: `1px solid ${C.border}` }}>
                                                <div style={{ fontSize: 13, fontWeight: 700, color: C.ink }}>
                                                    {user.nombre}
                                                </div>
                                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 }}>
                                                    <span style={{ fontSize: 10.5, color: C.muted }}>Rol: <b>{user.rol}</b></span>
                                                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 10, color: '#1B6E3E', fontWeight: 600 }}>
                                                        <span style={{ width: 5, height: 5, borderRadius: 99, background: '#1B8A4B' }} />
                                                        Turno activo
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Acciones */}
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setUserMenuOpen(false);
                                                    setArqueoModalOpen(true);
                                                }}
                                                style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: 9,
                                                    padding: '9px 12px',
                                                    borderRadius: 8,
                                                    border: 'none',
                                                    background: 'transparent',
                                                    color: C.ink,
                                                    fontSize: 12.5,
                                                    fontWeight: 600,
                                                    cursor: 'pointer',
                                                    textAlign: 'left',
                                                    width: '100%',
                                                }}
                                                onMouseEnter={(e) => { e.currentTarget.style.background = C.chipBlue; e.currentTarget.style.color = C.royal; }}
                                                onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = C.ink; }}
                                            >
                                                <WalletIcon className="w-4 h-4" style={{ color: C.royal }} />
                                                Arqueo y Cierre de Caja
                                            </button>

                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setUserMenuOpen(false);
                                                    navigate('/configuracion');
                                                }}
                                                style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: 9,
                                                    padding: '9px 12px',
                                                    borderRadius: 8,
                                                    border: 'none',
                                                    background: 'transparent',
                                                    color: C.ink,
                                                    fontSize: 12.5,
                                                    fontWeight: 600,
                                                    cursor: 'pointer',
                                                    textAlign: 'left',
                                                    width: '100%',
                                                }}
                                                onMouseEnter={(e) => { e.currentTarget.style.background = C.chipBlue; e.currentTarget.style.color = C.royal; }}
                                                onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = C.ink; }}
                                            >
                                                <Cog8ToothIcon className="w-4 h-4" style={{ color: C.muted }} />
                                                Mi Cuenta / Ajustes
                                            </button>

                                            <div style={{ height: 1, background: C.border, margin: '4px 0' }} />

                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setUserMenuOpen(false);
                                                    authLogout();
                                                    navigate('/login');
                                                }}
                                                style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: 9,
                                                    padding: '9px 12px',
                                                    borderRadius: 8,
                                                    border: 'none',
                                                    background: 'transparent',
                                                    color: '#B91C1C',
                                                    fontSize: 12.5,
                                                    fontWeight: 600,
                                                    cursor: 'pointer',
                                                    textAlign: 'left',
                                                    width: '100%',
                                                }}
                                                onMouseEnter={(e) => { e.currentTarget.style.background = '#FDEEEE'; }}
                                                onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                                            >
                                                <LogoutIcon className="w-4 h-4" />
                                                Cerrar Sesión
                                            </button>
                                        </motion.div>
                                    </>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>
                </header>

                {/* MODAL DE ARQUEO DE CAJA */}
                <ModalArqueoCaja
                    isOpen={arqueoModalOpen}
                    onClose={() => setArqueoModalOpen(false)}
                    userName={user.nombre}
                />

                {/* PAGE CONTENT */}
                <div style={{ flex: 1, overflowY: 'auto' }}>
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={location.pathname}
                            initial={{ opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -8 }}
                            transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
                            style={{ minHeight: '100%' }}
                        >
                            {React.cloneElement(children as React.ReactElement, { currentUser: user })}
                        </motion.div>
                    </AnimatePresence>
                </div>
            </main>

            <MobileFloatingNav onOpenMenu={() => setSidebarOpen(true)} />
        </div>
    );
};

export default Layout;
