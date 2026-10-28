import React, { useState, useMemo, useEffect } from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence, type Variants } from 'framer-motion';
import { useData } from '../contexts/DataContext';
import { useAuth } from '../contexts/AuthContext';
import { Trabajo, TrabajoEstado, User } from '../types';
import { formatCurrency, generateWhatsAppLink } from '../utils';
import { C, S, MONO, DISPLAY, estadoCfg, dot, estadoPill } from '../components/panelTheme';
import { ModalArqueoCaja } from '../components/dashboard/ModalArqueoCaja';
import { calcularSla, tiempoEnEtapa } from '../services/tallerBoard';
import {
    SparklesIcon,
    WalletIcon,
    DashboardIcon,
    CalculatorIcon,
    RocketLaunchIcon,
    MonitorIcon,
    WhatsAppIcon,
    ArrowRightIcon,
    CheckCircleIcon,
    AlertTriangleIcon,
    ChevronRightIcon,
    ReceiptIcon,
    FileTextIcon,
    DollarIcon,
    UsersIcon,
    PlusIcon,
    SearchIcon,
    PrinterIcon,
    BoxIcon,
    SlidersIcon,
} from '../components/Icons';

/**
 * Panel de Control Ejecutivo — Sistema "Marino & Oro Imperial"
 * Optimizado "PEPA" para Móvil y Desktop (Mobile-First Ergonomics):
 * - KPIs en cuadrícula adaptativa (2 columnas compactas en móvil, 4 en desktop).
 * - Power Strip con swipe horizontal en celular y auto-grid en escritorio.
 * - Tarjetas táctiles nativas en móvil (sin scroll horizontal de tabla forzado).
 * - Pestañas deslizantes de resorte con layoutId y scroll táctil.
 * - Botones de WhatsApp y Notas de Venta con tamaño táctil optimizado (min 44px).
 * - Safe Area insets completos para iPhone y Android.
 */

const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.05,
            delayChildren: 0.02,
        },
    },
};

const itemVariants: Variants = {
    hidden: { opacity: 0, y: 14 },
    visible: {
        opacity: 1,
        y: 0,
        transition: { type: 'spring', stiffness: 340, damping: 26 },
    },
};

type FilterTab = 'todas' | 'urgentes' | 'con_saldo' | 'sri' | 'prensa';

const DashboardPage: React.FC = () => {
    const auth = useAuth();
    const outletContext = useOutletContext<{ currentUser?: User }>() || {};
    const currentUser = outletContext.currentUser || auth.user;
    const isAdmin = auth.isAdmin || currentUser?.rol === 'Admin' || (currentUser?.rol as string) === 'root';
    const { trabajos, clientes, loading, realtimeEstado, ultimaSync } = useData();
    const navigate = useNavigate();

    const [activeTab, setActiveTab] = useState<FilterTab>('todas');
    const [searchQuery, setSearchQuery] = useState('');
    const [arqueoOpen, setArqueoOpen] = useState(false);
    const [currentTime, setCurrentTime] = useState(() => new Date());

    // Reloj reactivo para tiempos vivos en taller (cada 30 seg)
    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 30000);
        return () => clearInterval(timer);
    }, []);

    const ahoraMs = currentTime.getTime();

    // Órdenes activas (no entregadas)
    const activos = useMemo(
        () => (trabajos ?? []).filter(t => t.estado !== TrabajoEstado.ENTREGADO),
        [trabajos],
    );

    // Mapeo rápido de clientes para O(1) lookups
    const clientesMap = useMemo(() => {
        const map = new Map<string, (typeof clientes)[0]>();
        (clientes ?? []).forEach(c => map.set(c.id, c));
        return map;
    }, [clientes]);

    // Métricas del Administrador
    const metrics = useMemo(() => {
        if (!trabajos || !clientes) return null;
        // Fecha local YYYY-MM-DD para evitar desfase de huso horario en Ecuador (UTC-5)
        const year = currentTime.getFullYear();
        const month = String(currentTime.getMonth() + 1).padStart(2, '0');
        const day = String(currentTime.getDate()).padStart(2, '0');
        const todayStr = `${year}-${month}-${day}`;

        // Órdenes entregadas/retiradas hoy
        const entregadosHoy = (trabajos || []).filter(t => {
            if (t.estado !== TrabajoEstado.ENTREGADO) return false;
            const fEntrega = (t.fechaEntrega || t.updated_at || '')?.slice(0, 10);
            return fEntrega === todayStr;
        });

        // Cobranza por liquidaciones de saldo cobradas al momento de retirar hoy
        const cobradoPorRetirosHoy = entregadosHoy.reduce((acc, t) => {
            const liquidado = (t.total || 0) - (t.abono || 0);
            return acc + (liquidado > 0 ? liquidado : 0);
        }, 0);

        // Órdenes que ingresaron hoy al taller
        const ordenesEntradasHoy = (trabajos || []).filter(t => {
            const fEntrada = (t.fechaEntrada || t.created_at || '')?.slice(0, 10);
            return fEntrada === todayStr;
        });

        // Abonos cobrados hoy al ingresar pedidos nuevos
        const abonosHoy = ordenesEntradasHoy.reduce((acc, t) => acc + (t.abono || 0), 0);

        // Dinero total en caja hoy: Abonos de nuevas órdenes + Cobros en mostrador al retirar
        const cajaActualHoy = abonosHoy + cobradoPorRetirosHoy;

        // Dinero en la calle (cuentas por cobrar)
        const conSaldo = activos.filter(t => t.saldo > 0);
        const totalPorCobrar = conSaldo.reduce((acc, t) => acc + t.saldo, 0);

        // Taller & SLA
        const urgentes = activos.filter(t => {
            const sla = calcularSla(t, ahoraMs);
            return sla.status === 'vencido' || sla.status === 'alerta' || t.prioridad === 'Urgente';
        });

        // Vitrina (pedidos listos para retirar)
        const enVitrina = activos.filter(t => t.estado === TrabajoEstado.VITRINA);

        // Vitrina con > 48 horas sin retirar
        const vitrinaEstancada = enVitrina.filter(t => {
            const entrada = new Date(t.updated_at || t.fechaEntrada).getTime();
            return (ahoraMs - entrada) / (1000 * 60 * 60 * 24) >= 2;
        });

        // En producción física (diseño o prensa)
        const enProduccion = activos.filter(
            t => t.estado === TrabajoEstado.PROCESO || t.estado === TrabajoEstado.EN_DISENO,
        );

        return {
            activosCount: activos.length,
            cajaActualHoy,
            abonosHoy,
            cobradoPorRetirosHoy,
            entregadosHoy,
            entregadosHoyCount: entregadosHoy.length,
            ordenesEntradasHoyCount: ordenesEntradasHoy.length,
            cobranzaHoy: cajaActualHoy,
            totalPorCobrar,
            conSaldoCount: conSaldo.length,
            urgentesCount: urgentes.length,
            urgentesList: urgentes.slice(0, 4),
            enVitrinaCount: enVitrina.length,
            vitrinaEstancada,
            enProduccionCount: enProduccion.length,
            totalClientes: clientes.length,
        };
    }, [trabajos, clientes, activos, ahoraMs, currentTime]);

    // Pipeline de producción por estados
    const pipeline = useMemo(() => {
        const fases = [
            { estado: TrabajoEstado.PENDIENTE, label: 'Pendiente', color: '#B45309', bg: '#FFFBEB', dot: '#FFC61A' },
            { estado: TrabajoEstado.EN_DISENO, label: 'En Diseño', color: '#6D28D9', bg: '#F5F3FF', dot: '#8B5CF6' },
            { estado: TrabajoEstado.PROCESO, label: 'En Prensa', color: '#16309B', bg: '#EEF1FC', dot: '#16309B' },
            { estado: TrabajoEstado.VITRINA, label: 'En Vitrina', color: '#1B6E3E', bg: '#F2F7F2', dot: '#1B8A4B' },
        ];

        return fases.map(f => {
            const count = activos.filter(t => t.estado === f.estado).length;
            const pct = activos.length > 0 ? Math.round((count / activos.length) * 100) : 0;
            return { ...f, count, pct };
        });
    }, [activos]);

    // Filtrado de órdenes en el Bento principal
    const filteredOrders = useMemo(() => {
        let list = [...activos];

        // Filtro por Tab
        if (activeTab === 'urgentes') {
            list = list.filter(t => {
                const sla = calcularSla(t, ahoraMs);
                return sla.status === 'vencido' || sla.status === 'alerta' || t.prioridad === 'Urgente';
            });
        } else if (activeTab === 'con_saldo') {
            list = list.filter(t => t.saldo > 0);
        } else if (activeTab === 'sri') {
            list = list.filter(t => !!t.esSRI);
        } else if (activeTab === 'prensa') {
            list = list.filter(t => t.estado === TrabajoEstado.PROCESO);
        }

        // Búsqueda en vivo
        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase().trim();
            list = list.filter(t => {
                const cli = clientesMap.get(t.clienteId);
                const nombre = (cli ? cli.nombre : t.titular).toLowerCase();
                const ordStr = String(t.orden);
                return (
                    nombre.includes(q) ||
                    ordStr.includes(q) ||
                    (t.tipo || '').toLowerCase().includes(q) ||
                    (t.subtipo || '').toLowerCase().includes(q)
                );
            });
        }

        // Ordenar: primero los más recientes
        return list.sort((a, b) => new Date(b.fechaEntrada).getTime() - new Date(a.fechaEntrada).getTime()).slice(0, 10);
    }, [activos, activeTab, searchQuery, clientesMap, ahoraMs]);

    // Top 3 deudores prioritarios para cobro rápido
    const topDeudores = useMemo(() => {
        return [...activos]
            .filter(t => t.saldo > 0)
            .sort((a, b) => b.saldo - a.saldo)
            .slice(0, 3);
    }, [activos]);

    if (loading || !metrics) {
        return (
            <div style={{ minHeight: '65vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ textAlign: 'center' }}>
                    <div
                        style={{
                            width: 44,
                            height: 44,
                            border: '3px solid #E4E8F4',
                            borderTopColor: C.royal,
                            borderRadius: '50%',
                            animation: 'spin 0.9s linear infinite',
                            margin: '0 auto',
                        }}
                    />
                    <p
                        style={{
                            marginTop: 14,
                            fontSize: 11,
                            fontWeight: 700,
                            color: C.faint,
                            textTransform: 'uppercase',
                            letterSpacing: '.24em',
                            fontFamily: MONO,
                        }}
                    >
                        Sincronizando Centro de Producción…
                    </p>
                </div>
            </div>
        );
    }

    const hour = currentTime.getHours();
    const saludo = hour < 12 ? 'Buenos días' : hour < 19 ? 'Buenas tardes' : 'Buenas noches';
    const nombreAdmin = (currentUser?.nombre ?? 'Don Pedro').split(' ')[0];

    return (
        <div style={{ padding: 'clamp(14px, 2.5vw, 28px) clamp(12px, 2vw, 32px) calc(96px + env(safe-area-inset-bottom))' }}>
            <style>{`
                @keyframes spin{to{transform:rotate(360deg)}}
                .bento-hover{transition:transform .22s cubic-bezier(.2,1,.3,1),box-shadow .22s cubic-bezier(.2,1,.3,1),border-color .22s;}
                .bento-hover:hover{transform:translateY(-3px);box-shadow:0 14px 34px -10px rgba(10,17,64,.12);border-color:#CBD5E1;}
                .hide-scrollbar::-webkit-scrollbar { display: none; }
                .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
            `}</style>

            <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                style={{ maxWidth: 1440, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 16 }}
            >
                {/* ── 1. HEADER EJECUTIVO RESPONSIVE ─────────────────────────────── */}
                <motion.div
                    variants={itemVariants}
                    style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        justifyContent: 'space-between',
                        gap: 14,
                        flexWrap: 'wrap',
                    }}
                >
                    <div style={{ minWidth: 0, flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                            <p style={S.eyebrow}>Centro de Mando · Zaruma</p>
                            <span
                                style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: 5,
                                    padding: '2px 8px',
                                    borderRadius: 99,
                                    fontSize: 9.5,
                                    fontWeight: 700,
                                    background: 'rgba(27,110,62,0.1)',
                                    color: '#1B6E3E',
                                    border: '1px solid rgba(27,110,62,0.2)',
                                }}
                            >
                                <span style={{ position: 'relative', display: 'flex', width: 6, height: 6 }}>
                                    <motion.span
                                        animate={{ scale: [1, 2.4], opacity: [0.7, 0] }}
                                        transition={{ repeat: Infinity, duration: 1.8, ease: 'easeOut' }}
                                        style={{ position: 'absolute', inset: 0, borderRadius: 99, background: '#1B8A4B' }}
                                    />
                                    <span style={{ position: 'relative', width: 6, height: 6, borderRadius: 99, background: '#1B8A4B' }} />
                                </span>
                                En vivo
                            </span>
                        </div>
                        <h1 style={{ ...S.h1, fontSize: 'clamp(21px, 4.5vw, 28px)', marginTop: 2 }}>
                            {saludo}, {nombreAdmin}
                        </h1>
                        <p style={{ margin: '3px 0 0', fontSize: 12.5, color: C.muted }}>
                            {metrics.activosCount} órdenes en curso · {metrics.urgentesCount > 0 ? (
                                <span style={{ color: C.danger, fontWeight: 700 }}>
                                    ⚠️ {metrics.urgentesCount} en riesgo
                                </span>
                            ) : (
                                <span style={{ color: '#1B6E3E', fontWeight: 600 }}>
                                    ✓ Taller al día
                                </span>
                            )}
                        </p>
                    </div>

                    {/* Botones de acción rápida en cabecera */}
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', width: 'auto' }}>
                        <motion.button
                            whileHover={{ scale: 1.03, y: -2 }}
                            whileTap={{ scale: 0.96 }}
                            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                            style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 6,
                                padding: '8px 14px',
                                background: C.gold,
                                color: C.ink,
                                border: 'none',
                                borderRadius: 10,
                                fontSize: 12.5,
                                fontWeight: 800,
                                cursor: 'pointer',
                                boxShadow: '0 6px 16px -6px rgba(255,198,26,.85)',
                            }}
                            onClick={() => navigate('/nuevo')}
                        >
                            <SparklesIcon className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">Nueva Orden</span>
                            <span className="sm:hidden">Nueva</span>
                        </motion.button>

                        <motion.button
                            whileHover={{ scale: 1.03, y: -2 }}
                            whileTap={{ scale: 0.96 }}
                            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                            style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 6,
                                padding: '8px 12px',
                                background: '#EEF1FC',
                                color: C.royal,
                                border: '1px solid rgba(22,48,155,0.25)',
                                borderRadius: 10,
                                fontSize: 12.5,
                                fontWeight: 800,
                                cursor: 'pointer',
                            }}
                            onClick={() => navigate('/nuevo?cat=sri&es_sri=true')}
                        >
                            <FileTextIcon className="w-3.5 h-3.5" style={{ color: C.royal }} />
                            <span className="hidden sm:inline">Solicitud SRI</span>
                            <span className="sm:hidden">SRI</span>
                        </motion.button>

                        <motion.button
                            whileHover={{ scale: 1.03, y: -2 }}
                            whileTap={{ scale: 0.96 }}
                            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                            style={{
                                ...S.outlineBtn,
                                padding: '8px 12px',
                                borderRadius: 10,
                                background: '#FFFFFF',
                                fontSize: 12.5,
                            }}
                            onClick={() => setArqueoOpen(true)}
                        >
                            <WalletIcon className="w-3.5 h-3.5" style={{ color: C.royal }} />
                            <span className="hidden sm:inline">Arqueo</span>
                        </motion.button>

                        <motion.button
                            whileHover={{ scale: 1.03, y: -2 }}
                            whileTap={{ scale: 0.96 }}
                            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                            style={{
                                ...S.outlineBtn,
                                padding: '8px 12px',
                                borderRadius: 10,
                                background: '#FFFFFF',
                                fontSize: 12.5,
                            }}
                            onClick={() => navigate('/kds')}
                        >
                            <MonitorIcon className="w-3.5 h-3.5" style={{ color: C.royal }} />
                            <span className="hidden sm:inline">KDS</span>
                        </motion.button>
                    </div>
                </motion.div>

                {/* ── 1.5. BANNER EXCLUSIVO ADMINISTRADOR: CAJA ACTUAL & CONTROL DE RETIROS HOY ── */}
                {isAdmin && (
                    <motion.div
                        variants={itemVariants}
                        style={{
                            background: 'linear-gradient(135deg, #0A1140 0%, #101E66 55%, #16309B 100%)',
                            border: '1px solid rgba(255, 198, 26, 0.45)',
                            borderRadius: 16,
                            padding: 'clamp(14px, 2vw, 20px)',
                            color: '#FFFFFF',
                            boxShadow: '0 12px 30px -8px rgba(10, 17, 64, 0.35)',
                            position: 'relative',
                            overflow: 'hidden',
                        }}
                    >
                        {/* Glow de fondo */}
                        <div
                            style={{
                                position: 'absolute',
                                top: -30,
                                right: -30,
                                width: 140,
                                height: 140,
                                borderRadius: '50%',
                                background: 'radial-gradient(circle, rgba(255,198,26,0.2) 0%, rgba(255,198,26,0) 70%)',
                                pointerEvents: 'none',
                            }}
                        />

                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10, marginBottom: 14 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                                <span
                                    style={{
                                        padding: '3px 9px',
                                        borderRadius: 99,
                                        fontSize: 10,
                                        fontWeight: 800,
                                        letterSpacing: '.12em',
                                        textTransform: 'uppercase',
                                        background: 'rgba(255, 198, 26, 0.2)',
                                        color: C.gold,
                                        border: '1px solid rgba(255, 198, 26, 0.5)',
                                    }}
                                >
                                    👑 Control Administrador · Corte en Vivo
                                </span>
                                <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.75)' }}>
                                    Flujo de caja hoy (Abonos nuevos + Retiros liquidados)
                                </span>
                            </div>

                            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                                <motion.button
                                    whileHover={{ scale: 1.03 }}
                                    whileTap={{ scale: 0.97 }}
                                    onClick={() => setArqueoOpen(true)}
                                    style={{
                                        padding: '6px 14px',
                                        background: C.gold,
                                        color: C.ink,
                                        border: 'none',
                                        borderRadius: 8,
                                        fontSize: 11.5,
                                        fontWeight: 800,
                                        cursor: 'pointer',
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: 5,
                                        boxShadow: '0 4px 12px -2px rgba(255,198,26,0.5)',
                                    }}
                                >
                                    <WalletIcon className="w-3.5 h-3.5" />
                                    <span>Cuadrar Caja (Arqueo)</span>
                                </motion.button>

                                <motion.button
                                    whileHover={{ scale: 1.03 }}
                                    whileTap={{ scale: 0.97 }}
                                    onClick={() => navigate('/retiros')}
                                    style={{
                                        padding: '6px 14px',
                                        background: 'rgba(255,255,255,0.12)',
                                        color: '#FFFFFF',
                                        border: '1px solid rgba(255,255,255,0.25)',
                                        borderRadius: 8,
                                        fontSize: 11.5,
                                        fontWeight: 700,
                                        cursor: 'pointer',
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: 5,
                                    }}
                                >
                                    <BoxIcon className="w-3.5 h-3.5" />
                                    <span>Ver Retiros</span>
                                </motion.button>
                            </div>
                        </div>

                        {/* Indicadores en cuadrícula */}
                        <div
                            style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 190px), 1fr))',
                                gap: 10,
                            }}
                        >
                            {/* 1. Caja Total Actual Hoy */}
                            <div
                                style={{
                                    background: 'rgba(255, 255, 255, 0.08)',
                                    backdropFilter: 'blur(10px)',
                                    border: '1px solid rgba(255, 255, 255, 0.14)',
                                    borderRadius: 12,
                                    padding: '12px 14px',
                                    cursor: 'pointer',
                                }}
                                onClick={() => setArqueoOpen(true)}
                            >
                                <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: '.1em', textTransform: 'uppercase', color: C.gold }}>
                                    💵 Caja Actual en Mostrador
                                </div>
                                <div style={{ fontFamily: DISPLAY, fontSize: 'clamp(22px, 3.5vw, 28px)', fontWeight: 800, color: '#FFFFFF', marginTop: 4, letterSpacing: '-.02em', lineHeight: 1.1 }}>
                                    {formatCurrency(metrics.cajaActualHoy)}
                                </div>
                                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)', marginTop: 4 }}>
                                    Efectivo total recaudado hoy
                                </div>
                            </div>

                            {/* 2. Cobrado por Retiros Hoy */}
                            <div
                                style={{
                                    background: 'rgba(255, 255, 255, 0.08)',
                                    backdropFilter: 'blur(10px)',
                                    border: '1px solid rgba(255, 255, 255, 0.14)',
                                    borderRadius: 12,
                                    padding: '12px 14px',
                                    cursor: 'pointer',
                                }}
                                onClick={() => navigate('/retiros')}
                            >
                                <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: '.1em', textTransform: 'uppercase', color: '#6EE7B7' }}>
                                    📦 Retirados Hoy
                                </div>
                                <div style={{ fontFamily: DISPLAY, fontSize: 'clamp(22px, 3.5vw, 28px)', fontWeight: 800, color: '#FFFFFF', marginTop: 4, letterSpacing: '-.02em', lineHeight: 1.1 }}>
                                    {metrics.entregadosHoyCount} <span style={{ fontSize: 14, fontWeight: 500, color: 'rgba(255,255,255,0.6)' }}>entregados</span>
                                </div>
                                <div style={{ fontSize: 11, color: '#6EE7B7', marginTop: 4, fontWeight: 600 }}>
                                    +{formatCurrency(metrics.cobradoPorRetirosHoy)} liquidado al retirar
                                </div>
                            </div>

                            {/* 3. Abonos de Pedidos Nuevos Hoy */}
                            <div
                                style={{
                                    background: 'rgba(255, 255, 255, 0.08)',
                                    backdropFilter: 'blur(10px)',
                                    border: '1px solid rgba(255, 255, 255, 0.14)',
                                    borderRadius: 12,
                                    padding: '12px 14px',
                                    cursor: 'pointer',
                                }}
                                onClick={() => navigate('/nuevo')}
                            >
                                <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: '.1em', textTransform: 'uppercase', color: '#93C5FD' }}>
                                    ⚡ Abonos Pedidos Nuevos
                                </div>
                                <div style={{ fontFamily: DISPLAY, fontSize: 'clamp(22px, 3.5vw, 28px)', fontWeight: 800, color: '#FFFFFF', marginTop: 4, letterSpacing: '-.02em', lineHeight: 1.1 }}>
                                    {formatCurrency(metrics.abonosHoy)}
                                </div>
                                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)', marginTop: 4 }}>
                                    de {metrics.ordenesEntradasHoyCount} órdenes tomadas hoy
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}

                {/* ── 2. HERO BENTO GRID (2 COLUMNAS EN MÓVIL, 4 EN DESKTOP) ─────── */}
                <motion.div
                    variants={itemVariants}
                    style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 140px), 1fr))',
                        gap: 10,
                    }}
                >
                    {/* Tarjeta 1: Caja Actual Hoy */}
                    <motion.div
                        whileHover={{ y: -4, scale: 1.015 }}
                        whileTap={{ scale: 0.98 }}
                        transition={{ type: 'spring', stiffness: 350, damping: 25 }}
                        className="bento-hover"
                        style={{
                            ...S.card,
                            padding: 'clamp(12px, 2vw, 18px)',
                            borderRadius: 14,
                            position: 'relative',
                            overflow: 'hidden',
                            cursor: 'pointer',
                        }}
                        onClick={() => setArqueoOpen(true)}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6 }}>
                            <span style={{ fontSize: 9.5, fontWeight: 800, letterSpacing: '.14em', textTransform: 'uppercase', color: C.faint }}>
                                Caja Actual Hoy
                            </span>
                            <div style={{ width: 28, height: 28, borderRadius: 8, background: '#EEF1FC', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <WalletIcon className="w-3.5 h-3.5" style={{ color: C.royal }} />
                            </div>
                        </div>
                        <div style={{ fontFamily: DISPLAY, fontSize: 'clamp(20px, 4.2vw, 28px)', fontWeight: 700, letterSpacing: '-.03em', color: C.ink, marginTop: 6, lineHeight: 1 }}>
                            {formatCurrency(metrics.cajaActualHoy)}
                        </div>
                        <div style={{ fontSize: 11, color: C.muted, marginTop: 6, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            <span style={{ color: '#1B6E3E', fontWeight: 700 }}>+{formatCurrency(metrics.cobradoPorRetirosHoy)}</span> en {metrics.entregadosHoyCount} retiros
                        </div>
                    </motion.div>

                    {/* Tarjeta 2: Cuentas por Cobrar */}
                    <motion.div
                        whileHover={{ y: -4, scale: 1.015 }}
                        whileTap={{ scale: 0.98 }}
                        transition={{ type: 'spring', stiffness: 350, damping: 25 }}
                        className="bento-hover"
                        style={{
                            ...S.card,
                            padding: 'clamp(12px, 2vw, 18px)',
                            borderRadius: 14,
                            borderLeft: `4px solid ${C.gold}`,
                            cursor: 'pointer',
                        }}
                        onClick={() => navigate('/cuentas')}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6 }}>
                            <span style={{ fontSize: 9.5, fontWeight: 800, letterSpacing: '.14em', textTransform: 'uppercase', color: C.faint }}>
                                Por Cobrar
                            </span>
                            <div style={{ width: 28, height: 28, borderRadius: 8, background: '#FFFBEB', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <DollarIcon className="w-3.5 h-3.5" style={{ color: '#B45309' }} />
                            </div>
                        </div>
                        <div style={{ fontFamily: DISPLAY, fontSize: 'clamp(20px, 4.2vw, 28px)', fontWeight: 700, letterSpacing: '-.03em', color: '#B45309', marginTop: 6, lineHeight: 1 }}>
                            {formatCurrency(metrics.totalPorCobrar)}
                        </div>
                        <div style={{ fontSize: 11, color: C.muted, marginTop: 6, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            en <b>{metrics.conSaldoCount}</b> órdenes
                        </div>
                    </motion.div>

                    {/* Tarjeta 3: Taller & Urgencias con halo aura */}
                    <motion.div
                        whileHover={{ y: -4, scale: 1.015 }}
                        whileTap={{ scale: 0.98 }}
                        transition={{ type: 'spring', stiffness: 350, damping: 25 }}
                        className="bento-hover"
                        style={{
                            ...S.card,
                            padding: 'clamp(12px, 2vw, 18px)',
                            borderRadius: 14,
                            borderLeft: metrics.urgentesCount > 0 ? `4px solid ${C.danger}` : `4px solid ${C.borderStrong}`,
                            cursor: 'pointer',
                            position: 'relative',
                        }}
                        onClick={() => navigate('/kds')}
                    >
                        {metrics.urgentesCount > 0 && (
                            <motion.div
                                animate={{
                                    boxShadow: [
                                        '0 0 0 0px rgba(231,1,1,0)',
                                        '0 0 0 3px rgba(231,1,1,0.14)',
                                        '0 0 0 0px rgba(231,1,1,0)',
                                    ],
                                }}
                                transition={{ repeat: Infinity, duration: 2.2, ease: 'easeInOut' }}
                                style={{ position: 'absolute', inset: 0, borderRadius: 14, pointerEvents: 'none' }}
                            />
                        )}

                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6 }}>
                            <span style={{ fontSize: 9.5, fontWeight: 800, letterSpacing: '.14em', textTransform: 'uppercase', color: C.faint }}>
                                Taller Activo
                            </span>
                            <div style={{ width: 28, height: 28, borderRadius: 8, background: metrics.urgentesCount > 0 ? '#FDEEEE' : '#EEF1FC', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <PrinterIcon className="w-3.5 h-3.5" style={{ color: metrics.urgentesCount > 0 ? C.danger : C.royal }} />
                            </div>
                        </div>
                        <div style={{ fontFamily: DISPLAY, fontSize: 'clamp(20px, 4.2vw, 28px)', fontWeight: 700, letterSpacing: '-.03em', color: C.ink, marginTop: 6, lineHeight: 1 }}>
                            {metrics.enProduccionCount}
                        </div>
                        <div style={{ fontSize: 11, color: metrics.urgentesCount > 0 ? C.danger : C.muted, marginTop: 6, fontWeight: metrics.urgentesCount > 0 ? 700 : 400, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {metrics.urgentesCount > 0 ? `⚠️ ${metrics.urgentesCount} urgentes` : 'En plazo'}
                        </div>
                    </motion.div>

                    {/* Tarjeta 4: Listos en Vitrina */}
                    <motion.div
                        whileHover={{ y: -4, scale: 1.015 }}
                        whileTap={{ scale: 0.98 }}
                        transition={{ type: 'spring', stiffness: 350, damping: 25 }}
                        className="bento-hover"
                        style={{
                            ...S.card,
                            padding: 'clamp(12px, 2vw, 18px)',
                            borderRadius: 14,
                            borderLeft: `4px solid #1B8A4B`,
                            cursor: 'pointer',
                        }}
                        onClick={() => navigate('/retiros')}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6 }}>
                            <span style={{ fontSize: 9.5, fontWeight: 800, letterSpacing: '.14em', textTransform: 'uppercase', color: C.faint }}>
                                En Vitrina
                            </span>
                            <div style={{ width: 28, height: 28, borderRadius: 8, background: '#F2F7F2', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <BoxIcon className="w-3.5 h-3.5" style={{ color: '#1B8A4B' }} />
                            </div>
                        </div>
                        <div style={{ fontFamily: DISPLAY, fontSize: 'clamp(20px, 4.2vw, 28px)', fontWeight: 700, letterSpacing: '-.03em', color: '#1B6E3E', marginTop: 6, lineHeight: 1 }}>
                            {metrics.enVitrinaCount}
                        </div>
                        <div style={{ fontSize: 11, color: C.muted, marginTop: 6, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {metrics.entregadosHoyCount > 0 ? (
                                <span style={{ color: '#1B6E3E', fontWeight: 600 }}>
                                    ✓ {metrics.entregadosHoyCount} retirados hoy
                                </span>
                            ) : metrics.vitrinaEstancada.length > 0 ? (
                                <span style={{ color: '#B45309', fontWeight: 600 }}>
                                    {metrics.vitrinaEstancada.length} &gt; 48h
                                </span>
                            ) : (
                                'Para retiro'
                            )}
                        </div>
                    </motion.div>
                </motion.div>

                {/* ── 2.5. POWER STRIP: SWIPE HORIZONTAL EN MÓVIL / GRID EN PC ──── */}
                <motion.div
                    variants={itemVariants}
                    className="hide-scrollbar"
                    style={{
                        display: 'flex',
                        overflowX: 'auto',
                        scrollSnapType: 'x mandatory',
                        gap: 10,
                        paddingBottom: 2,
                    }}
                >
                    {/* 1. Mostrador Directo */}
                    <motion.button
                        whileHover={{ y: -2, scale: 1.02 }}
                        whileTap={{ scale: 0.96 }}
                        transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                        onClick={() => navigate('/nuevo')}
                        style={{
                            flexShrink: 0,
                            minWidth: 155,
                            scrollSnapAlign: 'start',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 10,
                            padding: '10px 14px',
                            borderRadius: 12,
                            border: '1px solid #F4E3A8',
                            background: '#FFFDF5',
                            cursor: 'pointer',
                            textAlign: 'left',
                            boxShadow: '0 3px 10px -4px rgba(255,198,26,.3)',
                        }}
                    >
                        <div style={{ width: 32, height: 32, borderRadius: 8, background: C.gold, display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.ink, flexShrink: 0 }}>
                            <SparklesIcon className="w-3.5 h-3.5" />
                        </div>
                        <div style={{ minWidth: 0 }}>
                            <div style={{ fontSize: 12, fontWeight: 800, color: C.ink, whiteSpace: 'nowrap' }}>Nueva Orden</div>
                            <div style={{ fontSize: 10, color: C.muted, whiteSpace: 'nowrap' }}>Mostrador</div>
                        </div>
                    </motion.button>

                    {/* 2. Solicitud SRI Rápida Destacada */}
                    <motion.button
                        whileHover={{ y: -2, scale: 1.02 }}
                        whileTap={{ scale: 0.96 }}
                        transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                        onClick={() => navigate('/nuevo?cat=sri&es_sri=true')}
                        style={{
                            flexShrink: 0,
                            minWidth: 175,
                            scrollSnapAlign: 'start',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 10,
                            padding: '10px 14px',
                            borderRadius: 12,
                            border: '1.5px solid rgba(22, 48, 155, 0.35)',
                            background: 'linear-gradient(135deg, #F0F4FE 0%, #EEF2FC 100%)',
                            cursor: 'pointer',
                            textAlign: 'left',
                            position: 'relative',
                            boxShadow: '0 4px 14px -3px rgba(22, 48, 155, 0.2)',
                        }}
                    >
                        <div style={{ width: 34, height: 34, borderRadius: 8, background: C.royal, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FFFFFF', flexShrink: 0, boxShadow: '0 4px 10px -2px rgba(22,48,155,0.4)' }}>
                            <FileTextIcon className="w-4 h-4" />
                        </div>
                        <div style={{ minWidth: 0, flex: 1 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                                <div style={{ fontSize: 12, fontWeight: 800, color: C.ink, whiteSpace: 'nowrap' }}>Solicitud SRI</div>
                                <span style={{ fontSize: 9, fontWeight: 900, background: C.gold, color: C.ink, padding: '1px 5px', borderRadius: 4, letterSpacing: '.05em' }}>TAX</span>
                            </div>
                            <div style={{ fontSize: 10, color: C.royal, fontWeight: 600, whiteSpace: 'nowrap', marginTop: 1 }}>Comprobantes & Talonarios</div>
                        </div>
                    </motion.button>

                    {/* 3. Despacho Vitrina Express */}
                    <motion.button
                        whileHover={{ y: -2, scale: 1.02 }}
                        whileTap={{ scale: 0.96 }}
                        transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                        onClick={() => navigate('/retiros')}
                        style={{
                            flexShrink: 0,
                            minWidth: 155,
                            scrollSnapAlign: 'start',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 10,
                            padding: '10px 14px',
                            borderRadius: 12,
                            border: `1px solid ${C.border}`,
                            background: '#FFFFFF',
                            cursor: 'pointer',
                            textAlign: 'left',
                        }}
                    >
                        <div style={{ width: 32, height: 32, borderRadius: 8, background: '#F2F7F2', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#1B8A4B', flexShrink: 0 }}>
                            <BoxIcon className="w-3.5 h-3.5" />
                        </div>
                        <div style={{ minWidth: 0 }}>
                            <div style={{ fontSize: 12, fontWeight: 700, color: C.ink, whiteSpace: 'nowrap' }}>Despacho</div>
                            <div style={{ fontSize: 10, color: C.muted, whiteSpace: 'nowrap' }}>Entrega Express</div>
                        </div>
                    </motion.button>

                    {/* 4. Arqueo de Turno */}
                    <motion.button
                        whileHover={{ y: -2, scale: 1.02 }}
                        whileTap={{ scale: 0.96 }}
                        transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                        onClick={() => setArqueoOpen(true)}
                        style={{
                            flexShrink: 0,
                            minWidth: 155,
                            scrollSnapAlign: 'start',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 10,
                            padding: '10px 14px',
                            borderRadius: 12,
                            border: `1px solid ${C.border}`,
                            background: '#FFFFFF',
                            cursor: 'pointer',
                            textAlign: 'left',
                        }}
                    >
                        <div style={{ width: 32, height: 32, borderRadius: 8, background: '#FFFBEB', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#B45309', flexShrink: 0 }}>
                            <WalletIcon className="w-3.5 h-3.5" />
                        </div>
                        <div style={{ minWidth: 0 }}>
                            <div style={{ fontSize: 12, fontWeight: 700, color: C.ink, whiteSpace: 'nowrap' }}>Arqueo Caja</div>
                            <div style={{ fontSize: 10, color: C.muted, whiteSpace: 'nowrap' }}>Cuadre de plata</div>
                        </div>
                    </motion.button>

                    {/* 5. Calculadora de Precios */}
                    <motion.button
                        whileHover={{ y: -2, scale: 1.02 }}
                        whileTap={{ scale: 0.96 }}
                        transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                        onClick={() => navigate('/calculadora')}
                        style={{
                            flexShrink: 0,
                            minWidth: 155,
                            scrollSnapAlign: 'start',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 10,
                            padding: '10px 14px',
                            borderRadius: 12,
                            border: `1px solid ${C.border}`,
                            background: '#FFFFFF',
                            cursor: 'pointer',
                            textAlign: 'left',
                        }}
                    >
                        <div style={{ width: 32, height: 32, borderRadius: 8, background: '#F5F3FF', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6D28D9', flexShrink: 0 }}>
                            <CalculatorIcon className="w-3.5 h-3.5" />
                        </div>
                        <div style={{ minWidth: 0 }}>
                            <div style={{ fontSize: 12, fontWeight: 700, color: C.ink, whiteSpace: 'nowrap' }}>Cotizador</div>
                            <div style={{ fontSize: 10, color: C.muted, whiteSpace: 'nowrap' }}>Pliegos y Resmas</div>
                        </div>
                    </motion.button>
                </motion.div>

                {/* ── 3. BENTO PRINCIPAL (ADAPTATIVO MÓVIL Y ESCRITORIO) ─────────── */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 340px), 1fr))', gap: 16, alignItems: 'start' }}>
                    {/* ── COLUMNA IZQUIERDA: ÓRDENES VIVAS ────────────────────────── */}
                    <motion.div
                        variants={itemVariants}
                        style={{
                            gridColumn: 'span 2',
                            minWidth: 0,
                            ...S.card,
                            borderRadius: 16,
                            overflow: 'hidden',
                        }}
                    >
                        {/* Cabecera con pestañas y buscador */}
                        <div style={{ padding: '14px 16px 12px', borderBottom: `1px solid ${C.divider}` }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap', marginBottom: 10 }}>
                                <div>
                                    <h2 style={{ ...S.h2, fontSize: 17 }}>Órdenes de Producción</h2>
                                    <p style={{ margin: '1px 0 0', fontSize: 11.5, color: C.faint }}>
                                        {metrics.activosCount} órdenes en flujo activo
                                    </p>
                                </div>
                                <motion.button
                                    whileHover={{ scale: 1.03 }}
                                    whileTap={{ scale: 0.97 }}
                                    style={{ ...S.softBtn, fontSize: 11.5, padding: '6px 11px', borderRadius: 8 }}
                                    onClick={() => navigate('/trabajos')}
                                >
                                    Ver todas →
                                </motion.button>
                            </div>

                            {/* Pestañas de filtrado scrollables en móvil sin scrollbar */}
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
                                <div className="hide-scrollbar" style={{ position: 'relative', display: 'flex', gap: 4, padding: 3, background: '#EEF1F8', borderRadius: 9, overflowX: 'auto', maxWidth: '100%' }}>
                                    {[
                                        { id: 'todas', label: `Todas (${activos.length})` },
                                        { id: 'urgentes', label: `Urgentes (${metrics.urgentesCount})`, alert: metrics.urgentesCount > 0 },
                                        { id: 'con_saldo', label: `Con Saldo (${metrics.conSaldoCount})` },
                                        { id: 'sri', label: 'SRI' },
                                        { id: 'prensa', label: 'En Prensa' },
                                    ].map(tab => {
                                        const isSelected = activeTab === tab.id;
                                        return (
                                            <button
                                                key={tab.id}
                                                onClick={() => setActiveTab(tab.id as FilterTab)}
                                                style={{
                                                    position: 'relative',
                                                    zIndex: 1,
                                                    padding: '5px 10px',
                                                    borderRadius: 7,
                                                    border: 'none',
                                                    background: 'transparent',
                                                    color: isSelected ? '#FFFFFF' : C.body,
                                                    fontSize: 11.5,
                                                    fontWeight: isSelected ? 700 : 600,
                                                    cursor: 'pointer',
                                                    display: 'inline-flex',
                                                    alignItems: 'center',
                                                    gap: 5,
                                                    whiteSpace: 'nowrap',
                                                    transition: 'color 0.2s',
                                                }}
                                            >
                                                {isSelected && (
                                                    <motion.div
                                                        layoutId="dashboardTab"
                                                        transition={{ type: 'spring', stiffness: 420, damping: 32 }}
                                                        style={{
                                                            position: 'absolute',
                                                            inset: 0,
                                                            background: C.royal,
                                                            borderRadius: 7,
                                                            zIndex: -1,
                                                            boxShadow: '0 2px 8px rgba(22,48,155,0.25)',
                                                        }}
                                                    />
                                                )}
                                                {tab.alert && (
                                                    <span style={{ width: 5, height: 5, borderRadius: 99, background: isSelected ? C.gold : C.danger }} />
                                                )}
                                                {tab.label}
                                            </button>
                                        );
                                    })}
                                </div>

                                {/* Buscador rápido */}
                                <div
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 6,
                                        padding: '5px 10px',
                                        background: C.bg,
                                        border: `1px solid ${C.borderStrong}`,
                                        borderRadius: 8,
                                        width: '100%',
                                        maxWidth: 200,
                                    }}
                                >
                                    <SearchIcon className="w-3.5 h-3.5" style={{ color: C.faint }} />
                                    <input
                                        type="text"
                                        placeholder="Buscar orden…"
                                        value={searchQuery}
                                        onChange={e => setSearchQuery(e.target.value)}
                                        style={{
                                            border: 'none',
                                            background: 'transparent',
                                            fontSize: 11.5,
                                            color: C.ink,
                                            outline: 'none',
                                            width: '100%',
                                        }}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* ── MODO MÓVIL: TARJETAS TÁCTILES PEPA (md:hidden) ─────────── */}
                        <div className="md:hidden" style={{ padding: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
                            {filteredOrders.length === 0 ? (
                                <div style={{ padding: '30px 10px', textAlign: 'center', color: C.faint, fontSize: 12.5 }}>
                                    Sin órdenes en este filtro.{' '}
                                    <button
                                        style={{ ...S.softBtn, marginTop: 8 }}
                                        onClick={() => {
                                            setActiveTab('todas');
                                            setSearchQuery('');
                                        }}
                                    >
                                        Ver todas
                                    </button>
                                </div>
                            ) : (
                                <AnimatePresence mode="popLayout">
                                    {filteredOrders.map((t, idx) => {
                                        const cfg = estadoCfg(t.estado);
                                        const sla = calcularSla(t, ahoraMs);
                                        const cli = clientesMap.get(t.clienteId);
                                        const telefono = cli?.telefono?.[0] || '';
                                        const tieneSaldo = t.saldo > 0;

                                        const msgCobro = `Estimado(a) ${cli?.nombre || t.titular}, le saludamos de Imprenta Córdova. Le recordamos que su orden #${String(t.orden).padStart(4, '0')} (${t.tipo}) tiene un saldo pendiente de ${formatCurrency(t.saldo)}. Puede cancelar al retirar o por transferencia. ¡Muchas gracias!`;
                                        const waCobroUrl = telefono ? generateWhatsAppLink(telefono, msgCobro) : '';

                                        return (
                                            <motion.div
                                                key={t.id}
                                                layout
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, scale: 0.95 }}
                                                transition={{ duration: 0.2, delay: idx * 0.02 }}
                                                whileTap={{ scale: 0.98 }}
                                                onClick={() => navigate(`/trabajos/${t.id}`)}
                                                style={{
                                                    background: '#FFFFFF',
                                                    borderRadius: 14,
                                                    border: `1px solid ${C.border}`,
                                                    borderLeft: `4px solid ${sla.status === 'vencido' ? C.danger : cfg.dot}`,
                                                    padding: '13px 14px',
                                                    boxShadow: '0 2px 8px rgba(10,17,64,0.03)',
                                                    cursor: 'pointer',
                                                }}
                                            >
                                                {/* Top row: Orden + Estado + SLA */}
                                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6 }}>
                                                    <span style={{ fontSize: 12.5, fontFamily: MONO, fontWeight: 800, color: C.ink }}>
                                                        #{String(t.orden).padStart(4, '0')}
                                                    </span>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                                        <span style={estadoPill(cfg)}>
                                                            <span style={dot(cfg.dot, 5)} />
                                                            {cfg.label}
                                                        </span>
                                                        {sla.status !== 'sin_fecha' && (
                                                            <span style={{ fontSize: 10, fontWeight: 700, color: sla.color, background: sla.bg, padding: '2px 6px', borderRadius: 5, border: `1px solid ${sla.border}` }}>
                                                                {sla.detalle}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Title & Product */}
                                                <div style={{ marginTop: 7 }}>
                                                    <div style={{ fontSize: 13.5, fontWeight: 700, color: C.ink, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                        {t.titular}
                                                    </div>
                                                    <div style={{ fontSize: 11.5, color: C.muted, marginTop: 1 }}>
                                                        {t.tipo} {t.subtipo ? `· ${t.subtipo}` : ''} {t.cantidad ? `(${t.cantidad} u.)` : ''}
                                                    </div>
                                                </div>

                                                {/* Bottom Action Bar */}
                                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 11, paddingTop: 9, borderTop: `1px solid ${C.rowLine}` }}>
                                                    <div>
                                                        <span style={{ fontSize: 10, fontWeight: 800, textTransform: 'uppercase', color: C.faint, letterSpacing: '.08em' }}>Saldo: </span>
                                                        <span style={{ fontSize: 13.5, fontFamily: MONO, fontWeight: 800, color: tieneSaldo ? '#B45309' : '#1B8A4B' }}>
                                                            {tieneSaldo ? formatCurrency(t.saldo) : 'Pagado'}
                                                        </span>
                                                    </div>

                                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }} onClick={e => e.stopPropagation()}>
                                                        {tieneSaldo && waCobroUrl && (
                                                            <motion.a
                                                                whileHover={{ scale: 1.08 }}
                                                                whileTap={{ scale: 0.9 }}
                                                                href={waCobroUrl}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                style={{
                                                                    display: 'inline-flex',
                                                                    alignItems: 'center',
                                                                    gap: 5,
                                                                    padding: '7px 11px',
                                                                    borderRadius: 8,
                                                                    background: '#25D366',
                                                                    color: '#FFFFFF',
                                                                    fontSize: 11,
                                                                    fontWeight: 700,
                                                                    textDecoration: 'none',
                                                                    boxShadow: '0 3px 8px -2px rgba(37,211,102,.4)',
                                                                }}
                                                            >
                                                                <WhatsAppIcon className="w-3.5 h-3.5" /> Cobrar
                                                            </motion.a>
                                                        )}

                                                        <motion.button
                                                            whileHover={{ scale: 1.08 }}
                                                            whileTap={{ scale: 0.9 }}
                                                            type="button"
                                                            title="Ver Nota"
                                                            onClick={() => window.open(`/#/nota-de-venta/${t.id}`, '_blank')}
                                                            style={{
                                                                padding: '7px 9px',
                                                                borderRadius: 8,
                                                                background: '#EEF1FC',
                                                                border: 'none',
                                                                color: C.royal,
                                                                cursor: 'pointer',
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                justifyContent: 'center',
                                                            }}
                                                        >
                                                            <ReceiptIcon className="w-4 h-4" />
                                                        </motion.button>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        );
                                    })}
                                </AnimatePresence>
                            )}
                        </div>

                        {/* ── MODO ESCRITORIO: TABLA GRID DE ALTA DENSIDAD (hidden md:block) ── */}
                        <div className="hidden md:block" style={{ overflowX: 'auto' }}>
                            <div style={{ minWidth: 680 }}>
                                <div
                                    style={{
                                        display: 'grid',
                                        gridTemplateColumns: '95px 1.5fr 1fr .85fr 1fr 90px',
                                        padding: '10px 22px',
                                        background: C.surfaceAlt,
                                        borderBottom: `1px solid ${C.divider}`,
                                        fontSize: 10,
                                        fontWeight: 800,
                                        letterSpacing: '.14em',
                                        textTransform: 'uppercase',
                                        color: C.faint,
                                    }}
                                >
                                    <span>Orden</span>
                                    <span>Cliente / Trabajo</span>
                                    <span>Estado</span>
                                    <span style={{ textAlign: 'right' }}>Saldo</span>
                                    <span style={{ textAlign: 'right' }}>Compromiso</span>
                                    <span style={{ textAlign: 'center' }}>Acción</span>
                                </div>

                                {filteredOrders.length === 0 ? (
                                    <div style={{ padding: '48px 20px', textAlign: 'center', color: C.faint, fontSize: 13 }}>
                                        No hay órdenes para el filtro seleccionado.{' '}
                                        <button
                                            style={{ ...S.softBtn, marginLeft: 8 }}
                                            onClick={() => {
                                                setActiveTab('todas');
                                                setSearchQuery('');
                                            }}
                                        >
                                            Restablecer filtros
                                        </button>
                                    </div>
                                ) : (
                                    <AnimatePresence mode="popLayout">
                                        {filteredOrders.map((t, idx) => {
                                            const cfg = estadoCfg(t.estado);
                                            const sla = calcularSla(t, ahoraMs);
                                            const cli = clientesMap.get(t.clienteId);
                                            const telefono = cli?.telefono?.[0] || '';
                                            const tieneSaldo = t.saldo > 0;

                                            const msgCobro = `Estimado(a) ${cli?.nombre || t.titular}, le saludamos de Imprenta Córdova. Le recordamos que su orden #${String(t.orden).padStart(4, '0')} (${t.tipo}) tiene un saldo pendiente de ${formatCurrency(t.saldo)}. Puede cancelar al retirar o por transferencia. ¡Muchas gracias!`;
                                            const waCobroUrl = telefono ? generateWhatsAppLink(telefono, msgCobro) : '';

                                            return (
                                                <motion.div
                                                    key={t.id}
                                                    layout
                                                    initial={{ opacity: 0, y: 12, scale: 0.98 }}
                                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                                    exit={{ opacity: 0, scale: 0.96 }}
                                                    transition={{ duration: 0.22, delay: idx * 0.025 }}
                                                    whileHover={{
                                                        x: 5,
                                                        backgroundColor: '#F7FAFF',
                                                        transition: { duration: 0.15 },
                                                    }}
                                                    style={{
                                                        display: 'grid',
                                                        gridTemplateColumns: '95px 1.5fr 1fr .85fr 1fr 90px',
                                                        alignItems: 'center',
                                                        padding: '13px 22px',
                                                        borderBottom: `1px solid ${C.rowLine}`,
                                                        cursor: 'pointer',
                                                    }}
                                                    onClick={() => navigate(`/trabajos/${t.id}`)}
                                                >
                                                    {/* Número de orden con indicador urgente */}
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                                                        <span
                                                            style={{
                                                                width: 7,
                                                                height: 7,
                                                                borderRadius: 99,
                                                                background: sla.status === 'vencido' ? C.danger : t.prioridad === 'Urgente' ? C.danger : C.borderStrong,
                                                            }}
                                                            className={t.prioridad === 'Urgente' ? 'animate-pulse' : ''}
                                                        />
                                                        <span style={{ fontSize: 13, fontFamily: MONO, fontWeight: 700, color: C.ink }}>
                                                            #{String(t.orden).padStart(4, '0')}
                                                        </span>
                                                    </div>

                                                    {/* Cliente y producto */}
                                                    <div style={{ minWidth: 0, paddingRight: 10 }}>
                                                        <div style={{ fontSize: 13, fontWeight: 700, color: C.ink, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                            {t.titular}
                                                        </div>
                                                        <div style={{ fontSize: 11.5, color: C.muted, marginTop: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                            {t.tipo} {t.subtipo ? `· ${t.subtipo}` : ''} {t.cantidad ? `(${t.cantidad} u.)` : ''}
                                                        </div>
                                                    </div>

                                                    {/* Estado */}
                                                    <div>
                                                        <span style={estadoPill(cfg)}>
                                                            <span style={dot(cfg.dot, 6)} />
                                                            {cfg.label}
                                                        </span>
                                                    </div>

                                                    {/* Saldo con color vivo */}
                                                    <div style={{ textAlign: 'right' }}>
                                                        <span
                                                            style={{
                                                                fontSize: 13,
                                                                fontFamily: MONO,
                                                                fontWeight: tieneSaldo ? 700 : 500,
                                                                color: tieneSaldo ? '#B45309' : '#1B8A4B',
                                                            }}
                                                        >
                                                            {tieneSaldo ? formatCurrency(t.saldo) : 'Pagado'}
                                                        </span>
                                                    </div>

                                                    {/* Compromiso / SLA */}
                                                    <div style={{ textAlign: 'right' }}>
                                                        {sla.status !== 'sin_fecha' ? (
                                                            <span
                                                                style={{
                                                                    display: 'inline-flex',
                                                                    alignItems: 'center',
                                                                    gap: 4,
                                                                    padding: '2px 8px',
                                                                    borderRadius: 6,
                                                                    fontSize: 10.5,
                                                                    fontWeight: 700,
                                                                    background: sla.bg,
                                                                    color: sla.color,
                                                                    border: `1px solid ${sla.border}`,
                                                                }}
                                                            >
                                                                <span style={{ width: 5, height: 5, borderRadius: 99, background: sla.dot }} />
                                                                {sla.detalle}
                                                            </span>
                                                        ) : (
                                                            <span style={{ fontSize: 11.5, color: C.faint }}>
                                                                {tiempoEnEtapa(t, ahoraMs)}
                                                            </span>
                                                        )}
                                                    </div>

                                                    {/* Acciones directas (WhatsApp con resorte o Recibo) */}
                                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }} onClick={e => e.stopPropagation()}>
                                                        {tieneSaldo && waCobroUrl ? (
                                                            <motion.a
                                                                whileHover={{ scale: 1.25, rotate: [0, -10, 10, 0] }}
                                                                whileTap={{ scale: 0.88 }}
                                                                href={waCobroUrl}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                title="Cobrar saldo por WhatsApp"
                                                                style={{
                                                                    width: 32,
                                                                    height: 32,
                                                                    borderRadius: 9,
                                                                    background: '#25D366',
                                                                    display: 'flex',
                                                                    alignItems: 'center',
                                                                    justifyContent: 'center',
                                                                    color: '#FFFFFF',
                                                                    textDecoration: 'none',
                                                                    boxShadow: '0 4px 10px -2px rgba(37,211,102,.4)',
                                                                }}
                                                            >
                                                                <WhatsAppIcon className="w-4 h-4" />
                                                            </motion.a>
                                                        ) : null}

                                                        <motion.button
                                                            whileHover={{ scale: 1.2 }}
                                                            whileTap={{ scale: 0.88 }}
                                                            type="button"
                                                            title="Ver Nota de Venta"
                                                            onClick={() => window.open(`/#/nota-de-venta/${t.id}`, '_blank')}
                                                            style={{
                                                                width: 32,
                                                                height: 32,
                                                                borderRadius: 9,
                                                                background: '#EEF1FC',
                                                                border: 'none',
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                justifyContent: 'center',
                                                                color: C.royal,
                                                                cursor: 'pointer',
                                                            }}
                                                        >
                                                            <ReceiptIcon className="w-4 h-4" />
                                                        </motion.button>
                                                    </div>
                                                </motion.div>
                                            );
                                        })}
                                    </AnimatePresence>
                                )}
                            </div>
                        </div>
                    </motion.div>

                    {/* ── COLUMNA DERECHA: PIPELINE & COBRANZA ─────────────────────── */}
                    <motion.div
                        variants={itemVariants}
                        style={{ display: 'flex', flexDirection: 'column', gap: 14, minWidth: 0 }}
                    >
                        {/* 1. Embudo de Producción (Pipeline KDS) */}
                        <motion.div
                            whileHover={{ y: -3 }}
                            transition={{ type: 'spring', stiffness: 350, damping: 25 }}
                            style={{ ...S.card, padding: '16px 18px', borderRadius: 16 }}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                                <h2 style={{ ...S.h2, fontSize: 15 }}>Embudo de Taller</h2>
                                <span style={{ fontSize: 11, fontFamily: MONO, fontWeight: 700, color: C.royal }}>
                                    {activos.length} activas
                                </span>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                                {pipeline.map(f => (
                                    <motion.div
                                        key={f.estado}
                                        whileHover={{ x: 3 }}
                                        transition={{ duration: 0.15 }}
                                        style={{ cursor: 'pointer' }}
                                        onClick={() => {
                                            if (f.estado === TrabajoEstado.VITRINA) navigate('/retiros');
                                            else navigate('/kds');
                                        }}
                                    >
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                                            <span style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 12, fontWeight: 600, color: C.body }}>
                                                <span style={dot(f.dot, 6)} />
                                                {f.label}
                                            </span>
                                            <span style={{ fontSize: 11.5, fontFamily: MONO, fontWeight: 700, color: C.ink }}>
                                                {f.count}
                                            </span>
                                        </div>
                                        <div style={{ height: 6, background: '#EEF1F8', borderRadius: 99, overflow: 'hidden' }}>
                                            <motion.div
                                                initial={{ width: 0 }}
                                                animate={{ width: `${f.pct}%` }}
                                                transition={{ type: 'spring', damping: 18, stiffness: 85 }}
                                                style={{ height: '100%', borderRadius: 99, background: f.dot }}
                                            />
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        </motion.div>

                        {/* 2. Top Deudores Prioritarios (WhatsApp 1-clic) */}
                        <motion.div
                            whileHover={{ y: -3 }}
                            transition={{ type: 'spring', stiffness: 350, damping: 25 }}
                            style={{ ...S.card, padding: '16px 18px', borderRadius: 16 }}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 11 }}>
                                <div style={{ fontSize: 10.5, fontWeight: 800, letterSpacing: '.14em', textTransform: 'uppercase', color: C.faint }}>
                                    Cobro Prioritario
                                </div>
                                <button
                                    style={{ border: 'none', background: 'transparent', color: C.royal, fontSize: 11, fontWeight: 700, cursor: 'pointer' }}
                                    onClick={() => navigate('/cuentas')}
                                >
                                    Ver todos →
                                </button>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
                                {topDeudores.length === 0 ? (
                                    <div style={{ fontSize: 11.5, color: C.muted, padding: '6px 0' }}>
                                        Sin saldos pendientes en este momento.
                                    </div>
                                ) : (
                                    topDeudores.map(t => {
                                        const cli = clientesMap.get(t.clienteId);
                                        const telefono = cli?.telefono?.[0] || '';
                                        const msgCobro = `Estimado(a) ${cli?.nombre || t.titular}, le saludamos de Imprenta Córdova. Su trabajo #${String(t.orden).padStart(4, '0')} tiene un saldo pendiente de ${formatCurrency(t.saldo)}. ¿Desea coordinar el pago y retiro? Muchas gracias.`;
                                        const waCobroUrl = telefono ? generateWhatsAppLink(telefono, msgCobro) : '';

                                        return (
                                            <motion.div
                                                key={t.id}
                                                whileHover={{ x: 3 }}
                                                transition={{ duration: 0.15 }}
                                                style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'space-between',
                                                    gap: 8,
                                                    padding: '8px 10px',
                                                    background: C.surfaceAlt,
                                                    borderRadius: 10,
                                                    border: `1px solid ${C.border}`,
                                                }}
                                            >
                                                <div style={{ minWidth: 0, flex: 1 }}>
                                                    <div style={{ fontSize: 12, fontWeight: 700, color: C.ink, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                        {t.titular}
                                                    </div>
                                                    <div style={{ fontSize: 10.5, color: C.faint, fontFamily: MONO }}>
                                                        #{String(t.orden).padStart(4, '0')} · {t.tipo}
                                                    </div>
                                                </div>

                                                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                                                    <div style={{ fontSize: 12.5, fontFamily: MONO, fontWeight: 800, color: '#B45309' }}>
                                                        {formatCurrency(t.saldo)}
                                                    </div>
                                                </div>

                                                {waCobroUrl && (
                                                    <motion.a
                                                        whileHover={{ scale: 1.25, rotate: [0, -10, 10, 0] }}
                                                        whileTap={{ scale: 0.88 }}
                                                        href={waCobroUrl}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        title="Cobrar por WhatsApp"
                                                        style={{
                                                            width: 28,
                                                            height: 28,
                                                            borderRadius: 7,
                                                            background: '#25D366',
                                                            color: '#fff',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center',
                                                            textDecoration: 'none',
                                                            flexShrink: 0,
                                                            boxShadow: '0 3px 8px -1px rgba(37,211,102,.4)',
                                                        }}
                                                    >
                                                        <WhatsAppIcon className="w-3.5 h-3.5" />
                                                    </motion.a>
                                                )}
                                            </motion.div>
                                        );
                                    })
                                )}
                            </div>
                        </motion.div>

                        {/* 3. Vitrina Estancada (> 48 horas listas) con borde reactivo */}
                        {metrics.vitrinaEstancada.length > 0 && (
                            <motion.div
                                animate={{
                                    borderColor: [
                                        'rgba(255,198,26,0.3)',
                                        'rgba(255,198,26,0.7)',
                                        'rgba(255,198,26,0.3)',
                                    ],
                                }}
                                transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
                                style={{
                                    background: C.ink,
                                    borderRadius: 16,
                                    padding: '16px 18px',
                                    color: '#FFFFFF',
                                    border: '1px solid rgba(255,198,26,0.3)',
                                }}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                        <span style={{ width: 6, height: 6, borderRadius: 99, background: C.gold }} className="animate-pulse" />
                                        <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: '.18em', textTransform: 'uppercase', color: C.gold }}>
                                            Vitrina por Despachar
                                        </span>
                                    </div>
                                    <span style={{ fontSize: 10.5, fontFamily: MONO, color: '#C2CAE6' }}>
                                        {metrics.vitrinaEstancada.length} listos
                                    </span>
                                </div>

                                <p style={{ margin: '6px 0 10px', fontSize: 11.5, color: '#C2CAE6', lineHeight: 1.4 }}>
                                    Hay pedidos listos ocupando vitrina. Avisar por WhatsApp:
                                </p>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                                    {metrics.vitrinaEstancada.slice(0, 3).map(t => {
                                        const cli = clientesMap.get(t.clienteId);
                                        const telefono = cli?.telefono?.[0] || '';
                                        const msgRetiro = `Estimado(a) ${cli?.nombre || t.titular}, le saludamos de Imprenta Córdova para informarle que su orden #${String(t.orden).padStart(4, '0')} (${t.tipo}) ya está LISTA en vitrina para retiro en nuestro local. ¡Le esperamos!`;
                                        const waUrl = telefono ? generateWhatsAppLink(telefono, msgRetiro) : '';

                                        return (
                                            <motion.div
                                                key={t.id}
                                                whileHover={{ x: 3 }}
                                                transition={{ duration: 0.15 }}
                                                style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'space-between',
                                                    padding: '7px 9px',
                                                    borderRadius: 8,
                                                    background: 'rgba(255,255,255,0.07)',
                                                    border: '1px solid rgba(255,255,255,0.1)',
                                                }}
                                            >
                                                <div style={{ minWidth: 0, flex: 1 }}>
                                                    <div style={{ fontSize: 11.5, fontWeight: 700, color: '#FFFFFF', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                        {t.titular}
                                                    </div>
                                                    <div style={{ fontSize: 10, color: '#9AA6CE', fontFamily: MONO }}>
                                                        #{String(t.orden).padStart(4, '0')}
                                                    </div>
                                                </div>

                                                {waUrl && (
                                                    <motion.a
                                                        whileHover={{ scale: 1.15, x: 2 }}
                                                        whileTap={{ scale: 0.9 }}
                                                        href={waUrl}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        style={{
                                                            fontSize: 10.5,
                                                            fontWeight: 700,
                                                            color: C.gold,
                                                            textDecoration: 'none',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            gap: 3,
                                                        }}
                                                    >
                                                        Avisar <ArrowRightIcon className="w-3 h-3" />
                                                    </motion.a>
                                                )}
                                            </motion.div>
                                        );
                                    })}
                                </div>

                                <motion.button
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    style={{
                                        width: '100%',
                                        marginTop: 10,
                                        padding: '8px',
                                        borderRadius: 8,
                                        border: '1px solid rgba(255,198,26,0.4)',
                                        background: 'rgba(255,198,26,0.15)',
                                        color: C.gold,
                                        fontSize: 11.5,
                                        fontWeight: 700,
                                        cursor: 'pointer',
                                    }}
                                    onClick={() => navigate('/retiros')}
                                >
                                    Ir a Módulo de Despacho
                                </motion.button>
                            </motion.div>
                        )}
                    </motion.div>
                </div>
            </motion.div>

            {/* Modal de Arqueo de Caja flotante */}
            <ModalArqueoCaja
                isOpen={arqueoOpen}
                onClose={() => setArqueoOpen(false)}
                userName={currentUser?.nombre || 'Don Pedro'}
            />
        </div>
    );
};

export default DashboardPage;
