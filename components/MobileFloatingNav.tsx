import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { DashboardIcon, SparklesIcon, MonitorIcon, ActivityIcon, MenuIcon } from './Icons';
import { useData } from '../contexts/DataContext';
import { TrabajoEstado } from '../types';

/**
 * MobileFloatingNav — Sistema "Marino & Oro Imperial"
 * Barra de navegación inferior nativa para celulares (Mobile-First de lujo):
 * - Frosted glassmorphism ultra translúcido (blur de 20px).
 * - Botón central flotante 'Nueva Orden' elevado en oro imperial con físicas spring.
 * - Pestaña 'Gestión' que activa el cajón completo de módulos administrativos.
 * - Indicador de tab activo con Framer Motion (layoutId="mobileActiveTabPill").
 * - Badges reactivos de órdenes vivas y cuentas por cobrar.
 * - Soporte total para Safe Area de iPhone (Home Indicator bar).
 */

const C = {
    royal: '#16309B',
    ink: '#0A1140',
    gold: '#FFC61A',
    faint: '#7E8CBE',
    chip: '#EEF1FC',
    border: '#E4E8F4',
    danger: '#E70101',
};

interface MobileFloatingNavProps {
    onOpenMenu?: () => void;
}

export const MobileFloatingNav: React.FC<MobileFloatingNavProps> = ({ onOpenMenu }) => {
    const location = useLocation();
    const { trabajos } = useData();

    // Badges en tiempo real
    const activos = (trabajos ?? []).filter(t => t.estado !== TrabajoEstado.ENTREGADO);
    const ordenesCount = activos.length;
    const conSaldoCount = activos.filter(t => t.saldo > 0).length;
    const urgentesCount = activos.filter(t => t.prioridad === 'Urgente').length;

    // Detectar si el usuario está en cualquiera de los módulos de gestión interna
    const isGestionRoute = [
        '/cuentas', '/retiros', '/clientes', '/inventario', '/diseno',
        '/facturacion', '/finanzas', '/usuarios', '/proveedores',
        '/configuracion', '/calculadora', '/registro', '/productos', '/produccion'
    ].some(p => location.pathname.startsWith(p));

    const navItems = [
        { path: '/dashboard', label: 'Panel', icon: DashboardIcon, badge: null },
        { path: '/trabajos', label: 'Órdenes', icon: ActivityIcon, badge: ordenesCount > 0 ? ordenesCount : null },
        { path: '/nuevo', label: 'Nueva', icon: SparklesIcon, isCenterHero: true },
        { path: '/kds', label: 'Taller', icon: MonitorIcon, hasAlert: urgentesCount > 0 },
        { path: '#gestion', label: 'Gestión', icon: MenuIcon, isMenuTrigger: true, badge: conSaldoCount > 0 ? conSaldoCount : null },
    ];

    return (
        <nav
            className="lg:hidden"
            style={{
                position: 'fixed',
                left: 0,
                right: 0,
                bottom: 0,
                zIndex: 120,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-around',
                padding: '6px 8px calc(7px + env(safe-area-inset-bottom))',
                background: 'rgba(255, 255, 255, 0.94)',
                backdropFilter: 'blur(22px) saturate(180%)',
                WebkitBackdropFilter: 'blur(22px) saturate(180%)',
                borderTop: `1px solid ${C.border}`,
                boxShadow: '0 -8px 26px -4px rgba(10, 17, 64, 0.08)',
            }}
        >
            {navItems.map(item => {
                const isActive = location.pathname === item.path || (item.path === '/nuevo' && location.pathname === '/nuevo-pedido');

                // Botón central flotante de "Nueva Orden" (Elevado con Resorte Oro)
                if (item.isCenterHero) {
                    return (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            style={{
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center',
                                textDecoration: 'none',
                                position: 'relative',
                                top: -14,
                                zIndex: 10,
                            }}
                        >
                            <motion.div
                                whileHover={{ scale: 1.08, y: -2 }}
                                whileTap={{ scale: 0.92 }}
                                transition={{ type: 'spring', stiffness: 450, damping: 22 }}
                                style={{
                                    width: 48,
                                    height: 48,
                                    borderRadius: '50%',
                                    background: `linear-gradient(135deg, ${C.gold} 0%, #F5B000 100%)`,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: C.ink,
                                    boxShadow: '0 8px 20px -3px rgba(255, 198, 26, 0.75), 0 0 0 4px #FFFFFF',
                                }}
                            >
                                <SparklesIcon className="w-5 h-5" />
                            </motion.div>
                            <span
                                style={{
                                    marginTop: 4,
                                    fontSize: 10,
                                    fontWeight: 800,
                                    letterSpacing: '.03em',
                                    color: isActive ? C.royal : C.ink,
                                }}
                            >
                                {item.label}
                            </span>
                        </NavLink>
                    );
                }

                // Pestaña de Gestión Interna (Abre el Cajón de Módulos)
                if (item.isMenuTrigger) {
                    const isActive = isGestionRoute;
                    return (
                        <button
                            key="btn-gestion-menu"
                            type="button"
                            onClick={(e) => {
                                e.preventDefault();
                                onOpenMenu?.();
                            }}
                            aria-label="Abrir menú de gestión interna"
                            style={{
                                flex: 1,
                                minWidth: 0,
                                minHeight: 46,
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: 3,
                                position: 'relative',
                                background: 'transparent',
                                border: 'none',
                                cursor: 'pointer',
                                padding: 0,
                                fontFamily: 'inherit',
                            }}
                        >
                            <motion.div
                                whileTap={{ scale: 0.88 }}
                                style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    width: '100%',
                                }}
                            >
                                {/* Píldora animada de tab activo */}
                                {isActive && (
                                    <motion.div
                                        layoutId="mobileActiveTabPill"
                                        transition={{ type: 'spring', stiffness: 420, damping: 30 }}
                                        style={{
                                            position: 'absolute',
                                            width: 42,
                                            height: 32,
                                            borderRadius: 10,
                                            background: C.chip,
                                            zIndex: 0,
                                        }}
                                    />
                                )}

                                {/* Ícono + Badge */}
                                <div style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <item.icon
                                        className="w-[18px] h-[18px]"
                                        style={{ color: isActive ? C.royal : C.faint, transition: 'color 0.2s' }}
                                    />

                                    {/* Badge numérico */}
                                    {item.badge !== null && (
                                        <span
                                            style={{
                                                position: 'absolute',
                                                top: -4,
                                                right: -9,
                                                minWidth: 14,
                                                height: 14,
                                                padding: '0 3px',
                                                borderRadius: 99,
                                                background: isActive ? C.royal : '#5C6892',
                                                color: '#FFFFFF',
                                                fontSize: 8.5,
                                                fontWeight: 800,
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                lineHeight: 1,
                                            }}
                                        >
                                            {item.badge}
                                        </span>
                                    )}
                                </div>

                                {/* Texto de la pestaña */}
                                <span
                                    style={{
                                        position: 'relative',
                                        zIndex: 1,
                                        fontSize: 9.5,
                                        fontWeight: isActive ? 800 : 600,
                                        letterSpacing: '.02em',
                                        color: isActive ? C.royal : C.faint,
                                        transition: 'color 0.2s',
                                        marginTop: 2,
                                    }}
                                >
                                    {item.label}
                                </span>
                            </motion.div>
                        </button>
                    );
                }

                return (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        style={{
                            flex: 1,
                            minWidth: 0,
                            minHeight: 46,
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: 3,
                            position: 'relative',
                            textDecoration: 'none',
                        }}
                    >
                        <motion.div
                            whileTap={{ scale: 0.88 }}
                            style={{
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center',
                                width: '100%',
                            }}
                        >
                            {/* Píldora animada de tab activo */}
                            {isActive && (
                                <motion.div
                                    layoutId="mobileActiveTabPill"
                                    transition={{ type: 'spring', stiffness: 420, damping: 30 }}
                                    style={{
                                        position: 'absolute',
                                        width: 42,
                                        height: 32,
                                        borderRadius: 10,
                                        background: C.chip,
                                        zIndex: 0,
                                    }}
                                />
                            )}

                            {/* Ícono + Badge */}
                            <div style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <item.icon
                                    className="w-[18px] h-[18px]"
                                    style={{ color: isActive ? C.royal : C.faint, transition: 'color 0.2s' }}
                                />

                                {/* Badge numérico */}
                                {item.badge !== null && (
                                    <span
                                        style={{
                                            position: 'absolute',
                                            top: -4,
                                            right: -9,
                                            minWidth: 14,
                                            height: 14,
                                            padding: '0 3px',
                                            borderRadius: 99,
                                            background: isActive ? C.royal : '#5C6892',
                                            color: '#FFFFFF',
                                            fontSize: 8.5,
                                            fontWeight: 800,
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            lineHeight: 1,
                                        }}
                                    >
                                        {item.badge}
                                    </span>
                                )}

                                {/* Alerta de urgencias en taller */}
                                {item.hasAlert && (
                                    <span
                                        style={{
                                            position: 'absolute',
                                            top: -2,
                                            right: -4,
                                            width: 7,
                                            height: 7,
                                            borderRadius: 99,
                                            background: C.danger,
                                            border: '1.5px solid #FFFFFF',
                                        }}
                                        className="animate-pulse"
                                    />
                                )}
                            </div>

                            {/* Texto de la pestaña */}
                            <span
                                style={{
                                    position: 'relative',
                                    zIndex: 1,
                                    fontSize: 9.5,
                                    fontWeight: isActive ? 800 : 600,
                                    letterSpacing: '.02em',
                                    color: isActive ? C.royal : C.faint,
                                    transition: 'color 0.2s',
                                    marginTop: 2,
                                }}
                            >
                                {item.label}
                            </span>
                        </motion.div>
                    </NavLink>
                );
            })}
        </nav>
    );
};

export default MobileFloatingNav;
