import React, { useEffect, useMemo, useState } from 'react';

/**
 * PanelInterno — implementación fiel de `Panel-Interno.dc.html`
 * (proyecto Claude Design "Obsidian & Gold", archivo Panel-Interno.dc.html).
 *
 * Es una pantalla autónoma con su propio shell (sidebar + header + barra móvil)
 * y navegación interna por estado. Datos de ejemplo, tal cual el mockup original.
 * Tema claro propio de este diseño; no usa el layout ni los tokens de la app.
 */

// ─────────────────────────────────────────────────────────────────────────────
// Iconos (paths de lucide, igual que el script del diseño)
// ─────────────────────────────────────────────────────────────────────────────
type IconPart = [string, Record<string, unknown>];
const ICONS: Record<string, IconPart[]> = {
  dashboard: [['rect', { width: 7, height: 9, x: 3, y: 3, rx: 1 }], ['rect', { width: 7, height: 5, x: 14, y: 3, rx: 1 }], ['rect', { width: 7, height: 9, x: 14, y: 12, rx: 1 }], ['rect', { width: 7, height: 5, x: 3, y: 16, rx: 1 }]],
  activity: [['path', { d: 'M22 12h-2.48a2 2 0 0 0-1.93 1.46l-2.35 8.36a.25.25 0 0 1-.48 0L9.24 2.18a.25.25 0 0 0-.48 0l-2.35 8.36A2 2 0 0 1 4.49 12H2' }]],
  sparkles: [['path', { d: 'M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z' }], ['path', { d: 'M20 3v4' }], ['path', { d: 'M22 5h-4' }]],
  rocket: [['path', { d: 'M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91 0z' }], ['path', { d: 'm12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z' }], ['path', { d: 'M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0' }], ['path', { d: 'M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5' }]],
  monitor: [['rect', { width: 20, height: 14, x: 2, y: 3, rx: 2 }], ['path', { d: 'M8 21h8' }], ['path', { d: 'M12 17v4' }]],
  palette: [['circle', { cx: 13.5, cy: 6.5, r: '.5' }], ['circle', { cx: 17.5, cy: 10.5, r: '.5' }], ['circle', { cx: 8.5, cy: 7.5, r: '.5' }], ['circle', { cx: 6.5, cy: 12.5, r: '.5' }], ['path', { d: 'M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z' }]],
  database: [['ellipse', { cx: 12, cy: 5, rx: 9, ry: 3 }], ['path', { d: 'M3 5V19A9 3 0 0 0 21 19V5' }], ['path', { d: 'M3 12A9 3 0 0 0 21 12' }]],
  wallet: [['path', { d: 'M19 7V4a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v4h-3a2 2 0 0 0 0 4h3a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1' }], ['path', { d: 'M3 5v14a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-4' }]],
  receipt: [['path', { d: 'M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1Z' }], ['path', { d: 'M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8' }], ['path', { d: 'M12 17.5v-11' }]],
  calculator: [['rect', { width: 16, height: 20, x: 4, y: 2, rx: 2 }], ['line', { x1: 8, x2: 16, y1: 6, y2: 6 }], ['line', { x1: 16, x2: 16, y1: 14, y2: 18 }], ['path', { d: 'M16 10h.01' }], ['path', { d: 'M12 10h.01' }], ['path', { d: 'M8 10h.01' }], ['path', { d: 'M12 14h.01' }], ['path', { d: 'M8 14h.01' }], ['path', { d: 'M12 18h.01' }], ['path', { d: 'M8 18h.01' }]],
  users: [['path', { d: 'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2' }], ['circle', { cx: 9, cy: 7, r: 4 }], ['path', { d: 'M22 21v-2a4 4 0 0 0-3-3.87' }], ['path', { d: 'M16 3.13a4 4 0 0 1 0 7.75' }]],
  globe: [['circle', { cx: 12, cy: 12, r: 10 }], ['path', { d: 'M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20' }], ['path', { d: 'M2 12h20' }]],
  shield: [['path', { d: 'M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z' }], ['path', { d: 'm9 12 2 2 4-4' }]],
  history: [['path', { d: 'M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8' }], ['path', { d: 'M3 3v5h5' }], ['path', { d: 'M12 7v5l4 2' }]],
  settings: [['path', { d: 'M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z' }], ['circle', { cx: 12, cy: 12, r: 3 }]],
  puzzle: [['path', { d: 'M15.39 4.39a1 1 0 0 0 1.68-.474 2.5 2.5 0 1 1 3.014 3.015 1 1 0 0 0-.474 1.68l1.683 1.682a2.414 2.414 0 0 1 0 3.414L19.61 19.61a2.414 2.414 0 0 1-3.414 0l-1.683-1.682a1 1 0 0 0-1.68.474 2.5 2.5 0 1 1-3.014-3.015 1 1 0 0 0 .474-1.68L8.61 12.025a2.414 2.414 0 0 1 0-3.414L12.025 5.2a2.414 2.414 0 0 1 3.414 0z' }]],
};

const Icon: React.FC<{ name: string; size?: number; color?: string }> = ({ name, size = 15, color }) =>
  React.createElement(
    'svg',
    { viewBox: '0 0 24 24', fill: 'none', stroke: color || 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round', style: { width: size, height: size, flexShrink: 0 } },
    ICONS[name]?.map((p, i) => React.createElement(p[0], { key: i, ...p[1] })),
  );

// ─────────────────────────────────────────────────────────────────────────────
// Datos de ejemplo
// ─────────────────────────────────────────────────────────────────────────────
type ViewKey =
  | 'dashboard' | 'trabajos' | 'nuevo' | 'retiros' | 'kds' | 'diseno' | 'inventario'
  | 'cuentas' | 'facturacion' | 'finanzas' | 'calculadora' | 'clientes' | 'proveedores'
  | 'usuarios' | 'registro' | 'configuracion' | 'extension';

const GROUPS: { id: string; title: string; items: { key: ViewKey; label: string; icon: string; badge?: number | string }[] }[] = [
  { id: 'operaciones', title: 'Operaciones', items: [
    { key: 'dashboard', label: 'Panel Principal', icon: 'dashboard' },
    { key: 'trabajos', label: 'Órdenes', icon: 'activity', badge: 14 },
    { key: 'nuevo', label: 'Nueva Orden', icon: 'sparkles' },
    { key: 'retiros', label: 'Despacho', icon: 'rocket' },
  ] },
  { id: 'taller', title: 'Taller', items: [
    { key: 'kds', label: 'Monitor de Taller', icon: 'monitor' },
    { key: 'diseno', label: 'Diseño Gráfico', icon: 'palette' },
    { key: 'inventario', label: 'Bodega de Insumos', icon: 'database', badge: 2 },
  ] },
  { id: 'finanzas', title: 'Finanzas', items: [
    { key: 'cuentas', label: 'Cuentas por Cobrar', icon: 'wallet', badge: 9 },
    { key: 'facturacion', label: 'Facturación SRI', icon: 'receipt' },
    { key: 'finanzas', label: 'Flujo de Caja', icon: 'receipt' },
    { key: 'calculadora', label: 'Calculadora', icon: 'calculator' },
  ] },
  { id: 'entidades', title: 'Entidades', items: [
    { key: 'clientes', label: 'Clientes', icon: 'users' },
    { key: 'proveedores', label: 'Proveedores', icon: 'globe' },
  ] },
  { id: 'sistema', title: 'Sistema', items: [
    { key: 'usuarios', label: 'Usuarios', icon: 'shield' },
    { key: 'registro', label: 'Auditoría', icon: 'history' },
    { key: 'configuracion', label: 'Configuración', icon: 'settings' },
    { key: 'extension', label: 'Descargar Extensión', icon: 'puzzle', badge: 'v2.1' },
  ] },
];

const TITLES: Record<ViewKey, string> = {
  dashboard: 'Panel Principal', trabajos: 'Órdenes de Producción', nuevo: 'Nueva Orden', retiros: 'Despacho y Entregas',
  kds: 'Monitor de Taller', diseno: 'Diseño Gráfico', inventario: 'Bodega de Insumos',
  cuentas: 'Cuentas por Cobrar', facturacion: 'Facturación Electrónica SRI', finanzas: 'Flujo de Caja', calculadora: 'Calculadora de Precios',
  clientes: 'Directorio de Clientes', proveedores: 'Gestión de Proveedores',
  usuarios: 'Gestión de Usuarios', registro: 'Auditoría del Sistema', configuracion: 'Configuración General', extension: 'Descargar Extensión',
};

type EstadoNombre = 'Pendiente' | 'En Diseño' | 'En Prensa' | 'Listo' | 'Entregado';
const ESTADOS: Record<EstadoNombre, { color: string; bg: string; border: string; dot: string }> = {
  'Pendiente': { color: '#B45309', bg: '#FFFBEB', border: '#F4E3A8', dot: '#FFC61A' },
  'En Diseño': { color: '#6D28D9', bg: '#F5F3FF', border: '#DDD3FE', dot: '#8B5CF6' },
  'En Prensa': { color: '#16309B', bg: '#EEF1FC', border: '#D7DDF0', dot: '#16309B' },
  'Listo': { color: '#1B6E3E', bg: '#F2F7F2', border: '#D8E8DC', dot: '#1B8A4B' },
  'Entregado': { color: '#5B6480', bg: '#F5F6FA', border: '#E4E8F4', dot: '#A6AFC8' },
};

const ORDERS: { id: string; cliente: string; trabajo: string; estado: EstadoNombre; saldo: string; entrega: string; urgente: boolean }[] = [
  { id: 'ORD-4821', cliente: 'Ferretería El Oro Cía.', trabajo: 'Talonario notas de venta · 100 juegos', estado: 'En Prensa', saldo: '78,40', entrega: 'hoy 17:00', urgente: true },
  { id: 'ORD-4820', cliente: 'Comercial Ana María', trabajo: 'Facturas SRI · 200 juegos', estado: 'En Diseño', saldo: '62,00', entrega: 'mañana', urgente: false },
  { id: 'ORD-4819', cliente: 'Distribuidora Sur', trabajo: 'Sello automático Trodat 4913', estado: 'Listo', saldo: '0,00', entrega: 'hoy', urgente: false },
  { id: 'ORD-4818', cliente: 'Panadería La Espiga', trabajo: 'Etiquetas adhesivas · 4 pliegos', estado: 'Pendiente', saldo: '34,00', entrega: '23 ago', urgente: true },
  { id: 'ORD-4817', cliente: 'Taller Mecánico Vera', trabajo: 'Guías de remisión · 50 juegos', estado: 'En Prensa', saldo: '0,00', entrega: 'hoy 18:00', urgente: false },
  { id: 'ORD-4816', cliente: 'Estudio Jurídico Peña', trabajo: 'Tarjetas soft touch · 200 u.', estado: 'En Diseño', saldo: '48,00', entrega: '24 ago', urgente: false },
  { id: 'ORD-4815', cliente: 'Farmacia Su Salud', trabajo: 'Recibos de caja · 100 juegos', estado: 'Pendiente', saldo: '29,50', entrega: '24 ago', urgente: false },
  { id: 'ORD-4814', cliente: 'Hotel Costa Azul', trabajo: 'Carpetas corporativas · 100 u.', estado: 'En Prensa', saldo: '186,00', entrega: '25 ago', urgente: true },
];

const FILTROS = ['Todas', 'Pendiente', 'En Diseño', 'En Prensa', 'Listo / Vitrina', 'Entregado'];
const esSRI = (t: string) => /factura|nota|guía/i.test(t);

// ─────────────────────────────────────────────────────────────────────────────
// Estilos base compartidos
// ─────────────────────────────────────────────────────────────────────────────
const S = {
  eyebrow: { margin: 0, fontSize: 10.5, fontWeight: 800, letterSpacing: '.32em', textTransform: 'uppercase', color: '#8A93AE' } as React.CSSProperties,
  h1: { margin: '5px 0 0', fontFamily: "'Outfit',sans-serif", fontSize: 27, fontWeight: 600, letterSpacing: '-.035em', color: '#0A1140' } as React.CSSProperties,
  h2: { margin: 0, fontFamily: "'Outfit',sans-serif", fontSize: 17, fontWeight: 600, letterSpacing: '-.03em', color: '#0A1140' } as React.CSSProperties,
  card: { background: '#fff', border: '1px solid #E4E8F4', borderRadius: 16 } as React.CSSProperties,
  colHead: { fontSize: 10, fontWeight: 700, letterSpacing: '.14em', textTransform: 'uppercase', color: '#8A93AE' } as React.CSSProperties,
  fieldLabel: { display: 'block', fontSize: 11, fontWeight: 700, letterSpacing: '.14em', textTransform: 'uppercase', color: '#8A93AE', marginBottom: 6 } as React.CSSProperties,
  input: { width: '100%', padding: '12px 14px', background: '#F7F9FF', border: '1px solid #D7DDF0', borderRadius: 10, fontSize: 13.5, color: '#0A1140', outline: 'none', fontFamily: 'inherit' } as React.CSSProperties,
  primaryBtn: { display: 'flex', alignItems: 'center', gap: 8, padding: '11px 18px', background: '#16309B', color: '#fff', border: 'none', borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' } as React.CSSProperties,
  softBtn: { padding: '8px 14px', background: '#F2F4FA', color: '#16309B', border: 'none', borderRadius: 9, fontSize: 12.5, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' } as React.CSSProperties,
  animRise: { animation: 'pi-rise .6s cubic-bezier(.2,.8,.2,1) both', display: 'flex', flexDirection: 'column', gap: 16 } as React.CSSProperties,
};

// Botón / caja con estado hover (equivalente a `style-hover` del runtime del diseño)
type HoverProps = React.HTMLAttributes<HTMLElement> & {
  as?: 'div' | 'button' | 'span' | 'a';
  baseStyle: React.CSSProperties;
  hoverStyle?: React.CSSProperties;
  href?: string;
  'data-r'?: string;
};
const Hover: React.FC<HoverProps> = ({ as = 'div', baseStyle, hoverStyle, children, ...rest }) => {
  const [h, setH] = useState(false);
  const Tag: any = as;
  return (
    <Tag
      {...rest}
      onMouseEnter={() => setH(true)}
      onMouseLeave={() => setH(false)}
      style={{ ...baseStyle, ...(h && hoverStyle ? hoverStyle : {}) }}
    >
      {children}
    </Tag>
  );
};

const dot = (bg: string, size = 8): React.CSSProperties => ({ width: size, height: size, borderRadius: 99, background: bg, flexShrink: 0 });
const estadoPill = (e: EstadoNombre): React.CSSProperties => ({
  display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 9px', borderRadius: 99, fontSize: 11.5, fontWeight: 600,
  background: ESTADOS[e].bg, border: `1px solid ${ESTADOS[e].border}`, color: ESTADOS[e].color,
});

const GLOBAL_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@100..900&family=Outfit:wght@100..900&family=JetBrains+Mono:wght@100..800&display=swap');
  .pi-root { background:#F7F9FF; color:#0A1140; font-family:'Inter',system-ui,sans-serif; -webkit-font-smoothing:antialiased; min-height:100vh; }
  .pi-root *, .pi-root *::before, .pi-root *::after { box-sizing:border-box; }
  .pi-root a { color:#16309B; text-decoration:none; }
  .pi-root a:hover { color:#2B62FF; }
  @keyframes pi-blink { 0%,100% { opacity:1; } 50% { opacity:.2; } }
  @keyframes pi-rise { from { opacity:0; transform:translateY(14px); } to { opacity:1; transform:translateY(0); } }
  .pi-root [data-r~="burger"], .pi-root [data-r~="tabbar"], .pi-root [data-r~="scrim"] { display:none; }
  @media (max-width: 1180px) {
    .pi-root [data-r~="tbl"] { overflow-x:auto; -webkit-overflow-scrolling:touch; }
    .pi-root [data-r~="tbl"] > div { min-width:820px; }
    .pi-root [data-r~="span2"] { grid-column:auto !important; }
  }
  @media (max-width: 1024px) {
    .pi-root [data-r~="side"] { position:fixed !important; z-index:80; left:0; top:0; bottom:0; height:100vh !important;
      transform:translateX(-100%); transition:transform .3s cubic-bezier(.2,.8,.2,1); box-shadow:0 0 60px rgba(10,17,64,.4); }
    .pi-root [data-r~="side"][data-open="true"] { transform:translateX(0); }
    .pi-root [data-r~="scrim"][data-open="true"] { display:block; position:fixed; inset:0; z-index:70; background:rgba(10,17,64,.45); backdrop-filter:blur(2px); }
    .pi-root [data-r~="burger"] { display:flex !important; }
    .pi-root [data-r~="hide-md"] { display:none !important; }
    .pi-root [data-r~="search"] { min-width:150px !important; }
  }
  @media (max-width: 780px) {
    .pi-root [data-r~="head"] { height:auto !important; min-height:62px; padding-top:10px !important; padding-bottom:10px !important; }
    .pi-root [data-r~="search"] { display:none !important; }
    .pi-root [data-r~="hide-sm"] { display:none !important; }
    .pi-root [data-r~="tabbar"] { display:flex !important; position:fixed; left:0; right:0; bottom:0; z-index:75;
      background:rgba(255,255,255,.97); backdrop-filter:blur(16px); border-top:1px solid #E4E8F4; padding:6px 8px 10px; gap:4px; }
    .pi-root [data-r~="body"] { padding-bottom:92px !important; }
    .pi-root [data-r~="sticky"] { position:static !important; }
    .pi-root [data-r~="tbl"] > div { min-width:700px; }
  }
  .pi-root ::-webkit-scrollbar { width:7px; height:7px; }
  .pi-root ::-webkit-scrollbar-track { background:transparent; }
  .pi-root ::-webkit-scrollbar-thumb { background:rgba(10,17,64,.18); border-radius:99px; }
`;

// ─────────────────────────────────────────────────────────────────────────────
// Componente principal
// ─────────────────────────────────────────────────────────────────────────────
const PanelInterno: React.FC = () => {
  const [active, setActive] = useState<ViewKey>('dashboard');
  const [filtro, setFiltro] = useState<string>('Todas');
  const [sideOpen, setSideOpen] = useState(false);
  const [clock, setClock] = useState('15:42');

  useEffect(() => {
    const tick = () => setClock(new Date().toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit' }));
    tick();
    const t = setInterval(tick, 30000);
    return () => clearInterval(t);
  }, []);

  const go = (k: ViewKey) => () => { setActive(k); setSideOpen(false); };
  const pageTitle = TITLES[active] || 'Sistema';

  // ── Derivados ──
  const counts: Record<EstadoNombre, number> = { 'Pendiente': 2, 'En Diseño': 3, 'En Prensa': 4, 'Listo': 3, 'Entregado': 2 };
  const maxCount = 4;

  const kpis = [
    { label: 'Órdenes activas', value: '14', hint: '7 en producción', color: '#16309B' },
    { label: 'Urgentes', value: '3', hint: 'con entrega hoy', color: '#E70101' },
    { label: 'Con saldo', value: '9', hint: '$ 1 842,60 por cobrar', color: '#FFC61A' },
    { label: 'Entregados hoy', value: '6', hint: 'de 8 programados', color: '#1B8A4B' },
    { label: 'Clientes', value: '812', hint: '+4 esta semana', color: '#A6AFC8' },
  ];

  const urgentes = [
    { cliente: 'Ferretería El Oro Cía.', id: 'ORD-4821', hora: '17:00', estado: 'En prensa' },
    { cliente: 'Panadería La Espiga', id: 'ORD-4818', hora: 'mañana', estado: 'Pendiente' },
    { cliente: 'Hotel Costa Azul', id: 'ORD-4814', hora: '25 ago', estado: 'En prensa' },
  ];

  const kdsColumns = (['Pendiente', 'En Diseño', 'En Prensa', 'Listo'] as EstadoNombre[]).map((name) => {
    const cfg = ESTADOS[name];
    const cards = ORDERS.filter((o) => o.estado === name).map((o) => ({
      id: o.id, cliente: o.cliente, trabajo: o.trabajo,
      tiempo: o.urgente ? 'urgente' : 'a tiempo',
      timeColor: o.urgente ? '#E70101' : '#8A93AE',
      accent: cfg.dot,
      operador: name === 'En Diseño' ? 'Diseño · Jorge' : name === 'En Prensa' ? 'Prensa · Luis' : 'Recepción · Andrea',
    }));
    return { label: name, count: cards.length, headBg: cfg.bg, headColor: cfg.color, dotColor: cfg.dot, cards };
  });

  const ordenesTabla = useMemo(
    () => ORDERS.filter((o) => filtro === 'Todas' || o.estado === filtro.replace(' / Vitrina', '')),
    [filtro],
  );

  const pasos = [
    { n: '1', label: 'Producto', hint: 'Servicio y variante', on: true },
    { n: '2', label: 'Detalles', hint: 'Cantidad, acabado, abono', on: false },
    { n: '3', label: 'Cliente', hint: 'Cédula, teléfono, nombre', on: false },
  ];
  const productos = [
    { label: 'Notas de venta', tipo: 'SRI · RIMPE Popular', on: true },
    { label: 'Facturas', tipo: 'SRI · Régimen General', on: false },
    { label: 'Talonarios', tipo: 'Autocopiativo', on: false },
    { label: 'Sellos', tipo: 'Trodat / Shiny', on: false },
    { label: 'Tarjetas', tipo: 'Couché 300 g', on: false },
    { label: 'Gigantografía', tipo: 'Lona 1440 dpi', on: false },
  ];
  const carrito = [
    { label: 'Notas de venta · 100 juegos', detail: 'Original + 2 copias · numeración 4901–5000', amount: '48,00' },
    { label: 'Sello automático Trodat 4913', detail: 'Tinta azul reponible', amount: '52,00' },
    { label: 'Diagramación y prueba digital', detail: 'Incluido', amount: '0,00' },
  ];

  const despachos = [
    { id: 'ORD-4819', cliente: 'Distribuidora Sur', trabajo: 'Sello automático Trodat 4913', listo: 'hoy 11:20', saldo: '0,00', avisado: true },
    { id: 'ORD-4812', cliente: 'Comercial Ana María', trabajo: 'Facturas SRI · 200 juegos', listo: 'ayer 16:40', saldo: '62,00', avisado: true },
    { id: 'ORD-4809', cliente: 'Panadería La Espiga', trabajo: 'Etiquetas adhesivas · 4 pliegos', listo: 'ayer 09:15', saldo: '34,00', avisado: false },
  ].map((d) => ({
    ...d,
    saldoLabel: d.saldo === '0,00' ? 'Pagado' : `$ ${d.saldo}`,
    saldoStyle: {
      padding: '4px 9px', borderRadius: 99, fontSize: 11.5, fontWeight: 700,
      ...(d.saldo === '0,00' ? { background: '#F2F7F2', color: '#1B6E3E' } : { background: '#FFFBEB', color: '#7A5A00' }),
    } as React.CSSProperties,
    avisoLabel: d.avisado ? 'Avisado por WhatsApp' : 'Sin avisar',
    avisoColor: d.avisado ? '#1B6E3E' : '#E70101',
  }));

  const disenoQueue = [
    { id: 'ORD-4820', cliente: 'Comercial Ana María', trabajo: 'Facturas SRI · 200 juegos', estado: 'Diagramando', operador: 'Jorge', prueba: 'pendiente' },
    { id: 'ORD-4816', cliente: 'Estudio Jurídico Peña', trabajo: 'Tarjetas soft touch · 200 u.', estado: 'Prueba enviada', operador: 'Jorge', prueba: 'esperando aprobación' },
    { id: 'ORD-4813', cliente: 'Hotel Costa Azul', trabajo: 'Carpetas corporativas', estado: 'Aprobada', operador: 'Andrea', prueba: 'lista para prensa' },
  ];

  const insumos = [
    { item: 'Papel químico 3 copias', unidad: 'Resmas', stock: 14, min: 10, costo: '8,40', valor: '117,60' },
    { item: 'Bond 75 g A4', unidad: 'Resmas', stock: 32, min: 12, costo: '4,10', valor: '131,20' },
    { item: 'Couché 300 g', unidad: 'Pliegos', stock: 180, min: 100, costo: '0,62', valor: '111,60' },
    { item: 'Lona eco-solvente 13 oz', unidad: 'Metros', stock: 6, min: 15, costo: '3,90', valor: '23,40' },
    { item: 'Caucho polímero láser', unidad: 'Unidades', stock: 9, min: 12, costo: '2,80', valor: '25,20' },
    { item: 'Tinta cian eco-solvente', unidad: 'Unidades', stock: 3, min: 4, costo: '26,00', valor: '78,00' },
  ].map((i) => {
    const low = i.stock < i.min;
    return {
      ...i, low,
      stockLabel: `${i.stock} ${i.unidad.toLowerCase()}`,
      badgeLabel: low ? 'Stock bajo' : 'Nominal',
      badgeStyle: {
        padding: '4px 10px', borderRadius: 99, fontSize: 11, fontWeight: 700,
        ...(low ? { background: '#FEF2F2', color: '#B91C1C', border: '1px solid #FBD5D5' } : { background: '#F2F7F2', color: '#1B6E3E', border: '1px solid #D8E8DC' }),
      } as React.CSSProperties,
      barWidth: `${Math.min(100, Math.round((i.stock / (i.min * 2)) * 100))}%`,
      barColor: low ? '#E70101' : '#1B8A4B',
    };
  });

  const movimientos = [
    { tipo: 'INGRESO', detalle: 'Abono ORD-4821 · Ferretería El Oro', monto: '40,00', hora: '14:22', hash: 'a91f7c2e' },
    { tipo: 'EGRESO', detalle: 'Compra papel químico · Distribuidora Gráfica', monto: '168,00', hora: '11:05', hash: '7d3b0f55' },
    { tipo: 'INGRESO', detalle: 'Pago total ORD-4819 · Distribuidora Sur', monto: '52,00', hora: '10:40', hash: '2c8e4a10' },
    { tipo: 'EGRESO', detalle: 'Mantenimiento plotter Roland', monto: '85,00', hora: '09:12', hash: '5f6a9d31' },
  ].map((m) => ({
    ...m,
    montoLabel: `${m.tipo === 'INGRESO' ? '+ $ ' : '− $ '}${m.monto}`,
    montoColor: m.tipo === 'INGRESO' ? '#1B6E3E' : '#B91C1C',
    tipoStyle: {
      padding: '3px 9px', borderRadius: 7, fontSize: 10.5, fontWeight: 800, letterSpacing: '.1em',
      ...(m.tipo === 'INGRESO' ? { background: '#F2F7F2', color: '#1B6E3E' } : { background: '#FEF2F2', color: '#B91C1C' }),
    } as React.CSSProperties,
  }));

  const secuencias = [
    { doc: 'Nota de venta', serie: '001-001', desde: '4901', hasta: '5000', estado: 'Autorizada', vence: '31 dic 2026' },
    { doc: 'Factura', serie: '001-001', desde: '2310', hasta: '2500', estado: 'Autorizada', vence: '31 dic 2026' },
    { doc: 'Guía de remisión', serie: '001-001', desde: '880', hasta: '1000', estado: 'Por renovar', vence: '30 sep 2026' },
    { doc: 'Comprobante de retención', serie: '001-001', desde: '410', hasta: '500', estado: 'Autorizada', vence: '31 dic 2026' },
  ].map((s) => ({
    ...s,
    rango: `${s.desde} – ${s.hasta}`,
    estadoStyle: {
      padding: '4px 10px', borderRadius: 99, fontSize: 11, fontWeight: 700,
      ...(s.estado === 'Autorizada' ? { background: '#F2F7F2', color: '#1B6E3E', border: '1px solid #D8E8DC' } : { background: '#FFFBEB', color: '#7A5A00', border: '1px solid #F4E3A8' }),
    } as React.CSSProperties,
  }));

  const semanas = [
    { label: 'Lun', ingreso: 186, egreso: 84 }, { label: 'Mar', ingreso: 242, egreso: 120 },
    { label: 'Mié', ingreso: 198, egreso: 62 }, { label: 'Jue', ingreso: 310, egreso: 168 },
    { label: 'Vie', ingreso: 274, egreso: 96 }, { label: 'Sáb', ingreso: 148, egreso: 40 },
  ].map((d) => ({
    label: d.label,
    ingresoLabel: `$ ${d.ingreso}`, egresoLabel: `$ ${d.egreso}`,
    ingresoH: Math.round((d.ingreso / 320) * 150), egresoH: Math.round((d.egreso / 320) * 150),
  }));

  const calcRows = [
    { k: 'Material · Papel químico 3 copias', v: '$ 18,90' },
    { k: 'Impresión offset · 100 juegos', v: '$ 14,00' },
    { k: 'Numeración secuencial', v: '$ 6,00' },
    { k: 'Guillotinado y perforado', v: '$ 5,10' },
    { k: 'Diagramación', v: 'incluido' },
  ];

  const clientesLista = [
    { nombre: 'Ferretería El Oro Cía.', id: '0791234567001', regimen: 'RIMPE Negocio Popular', tel: '099 308 3943', ultimo: 'Talonario notas de venta · ago 2026' },
    { nombre: 'Comercial Ana María', id: '0701122334001', regimen: 'RIMPE Emprendedor', tel: '098 771 2210', ultimo: 'Facturas SRI · ago 2026' },
    { nombre: 'Distribuidora Sur', id: '0790011223001', regimen: 'Régimen General', tel: '097 440 1188', ultimo: 'Sello automático · ago 2026' },
    { nombre: 'Panadería La Espiga', id: '0703344556', regimen: 'RIMPE Negocio Popular', tel: '096 220 7741', ultimo: 'Etiquetas adhesivas · jul 2026' },
    { nombre: 'Estudio Jurídico Peña', id: '0705566778001', regimen: 'Régimen General', tel: '099 112 3344', ultimo: 'Tarjetas soft touch · jul 2026' },
  ];

  const proveedoresLista = [
    { nombre: 'Distribuidora Gráfica del Pacífico', contacto: 'Guayaquil · 04 288 4410', insumos: 'Papel químico, bond, couché', saldo: '168,00' },
    { nombre: 'Insumos Roland Ecuador', contacto: 'Guayaquil · 04 260 1122', insumos: 'Tintas eco-solvente, lona', saldo: '0,00' },
    { nombre: 'Trodat Andina', contacto: 'Quito · 02 244 8899', insumos: 'Sellos, caucho, almohadillas', saldo: '54,00' },
  ].map((p) => ({
    ...p,
    saldoLabel: p.saldo === '0,00' ? 'Al día' : `$ ${p.saldo}`,
    saldoColor: p.saldo === '0,00' ? '#1B6E3E' : '#B91C1C',
  }));

  const usuariosLista = [
    { nombre: 'Marcelo Córdova', rol: 'Admin', correo: 'marcelo@imprentacordova.net', activo: 'ahora' },
    { nombre: 'Andrea Castro', rol: 'Operador', correo: 'andrea@imprentacordova.net', activo: 'hace 12 min' },
    { nombre: 'Jorge Vera', rol: 'Diseñador', correo: 'jorge@imprentacordova.net', activo: 'hace 3 min' },
    { nombre: 'Luis Mora', rol: 'Operador', correo: 'luis@imprentacordova.net', activo: 'hace 1 h' },
  ].map((u) => ({
    ...u,
    inicial: u.nombre.split(' ').map((n) => n[0]).join('').slice(0, 2),
    rolStyle: {
      padding: '4px 10px', borderRadius: 99, fontSize: 10.5, fontWeight: 800, letterSpacing: '.16em', textTransform: 'uppercase',
      ...(u.rol === 'Admin'
        ? { background: '#FFFBEB', color: '#7A5A00', border: '1px solid #F4E3A8' }
        : u.rol === 'Diseñador'
          ? { background: '#F5F3FF', color: '#6D28D9', border: '1px solid #DDD3FE' }
          : { background: '#EEF1FC', color: '#16309B', border: '1px solid #D7DDF0' }),
    } as React.CSSProperties,
  }));

  const auditoria = [
    { accion: 'Cambio de estado · ORD-4821 → En Prensa', usuario: 'Luis Mora', hora: '14:31', hash: 'a91f7c2e4b' },
    { accion: 'Abono registrado $ 40,00 · ORD-4821', usuario: 'Andrea Castro', hora: '14:22', hash: '7d3b0f5591' },
    { accion: 'Orden creada · ORD-4821', usuario: 'Andrea Castro', hora: '08:12', hash: '2c8e4a1073' },
    { accion: 'Inicio de sesión', usuario: 'Marcelo Córdova', hora: '07:58', hash: '5f6a9d3122' },
  ];

  const ajustes = [
    { title: 'Datos del establecimiento', desc: 'Razón social, RUC, dirección y autorización SRI N° 001-001.' },
    { title: 'Numeración y secuencias', desc: 'Rangos autorizados por tipo de comprobante y aviso de renovación.' },
    { title: 'WhatsApp y avisos', desc: 'Número emisor, plantillas de aviso de prueba y de pedido listo.' },
    { title: 'Impresión de documentos', desc: 'Formato de nota de venta, recibo de abono y orden de producción.' },
    { title: 'Respaldo y sincronización', desc: 'Copia en la nube y respaldo local del registro de actividad.' },
  ];

  const TAB_KEYS: { key: ViewKey; label: string; icon: string }[] = [
    { key: 'dashboard', label: 'Panel', icon: 'dashboard' },
    { key: 'nuevo', label: 'Nueva', icon: 'sparkles' },
    { key: 'kds', label: 'Taller', icon: 'monitor' },
    { key: 'trabajos', label: 'Órdenes', icon: 'activity' },
    { key: 'cuentas', label: 'Cobrar', icon: 'wallet' },
  ];

  // ── Bloques de vista ──
  const ViewHeader: React.FC<{ eyebrow: string; title: string; desc?: string; actions?: React.ReactNode }> = ({ eyebrow, title, desc, actions }) => (
    <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 20, flexWrap: 'wrap' }}>
      <div>
        <p style={S.eyebrow}>{eyebrow}</p>
        <h1 style={S.h1}>{title}</h1>
        {desc && <p style={{ margin: '6px 0 0', fontSize: 13.5, color: '#6B7590' }}>{desc}</p>}
      </div>
      {actions && <div style={{ display: 'flex', gap: 9, flexWrap: 'wrap' }}>{actions}</div>}
    </div>
  );

  return (
    <div className="pi-root">
      <style>{GLOBAL_CSS}</style>

      <div style={{ display: 'flex', minHeight: '100vh', alignItems: 'stretch' }}>
        {/* Scrim móvil */}
        <div data-r="scrim" data-open={sideOpen ? 'true' : 'false'} onClick={() => setSideOpen(false)} />

        {/* Sidebar */}
        <aside
          data-r="side"
          data-open={sideOpen ? 'true' : 'false'}
          style={{ width: 248, flexShrink: 0, background: '#0A1140', color: '#fff', display: 'flex', flexDirection: 'column', position: 'sticky', top: 0, height: '100vh' }}
        >
          <div style={{ padding: '20px 18px 16px', borderBottom: '1px solid rgba(255,255,255,.09)' }}>
            <a href="#/dashboard" onClick={(e) => { e.preventDefault(); go('dashboard')(); }} style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
              <img src="/LOGO.png" alt="Imprenta Córdova" style={{ width: 34, height: 34, objectFit: 'contain', background: '#fff', borderRadius: 7, padding: 2 }} />
              <span style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.15, minWidth: 0 }}>
                <span style={{ fontFamily: "'Outfit',sans-serif", fontSize: 16, fontWeight: 700, letterSpacing: '-.03em', color: '#fff' }}>CÓRDOVA<span style={{ color: '#FFC61A' }}>.</span></span>
                <span style={{ fontSize: 8, fontWeight: 700, letterSpacing: '.3em', textTransform: 'uppercase', color: '#7E8CBE', marginTop: 2 }}>Centro de Producción</span>
              </span>
            </a>
          </div>

          <div style={{ padding: '14px 14px 10px' }}>
            <Hover
              as="button"
              onClick={go('nuevo')}
              baseStyle={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 9, padding: 12, background: '#FFC61A', color: '#0A1140', border: 'none', borderRadius: 11, fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}
              hoverStyle={{ background: '#F0B400' }}
            >
              <span style={{ fontSize: 15, lineHeight: 1 }}>＋</span> Nueva Orden
            </Hover>
          </div>

          <nav style={{ flex: 1, overflowY: 'auto', padding: '4px 10px 16px', display: 'flex', flexDirection: 'column', gap: 16 }}>
            {GROUPS.map((g) => {
              const groupActive = g.items.some((i) => i.key === active);
              return (
                <div key={g.id}>
                  <div style={{ padding: '5px 12px 7px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 9, fontWeight: 800, letterSpacing: '.34em', textTransform: 'uppercase', color: groupActive ? '#FFC61A' : '#5C6892' }}>{g.title}</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {g.items.map((it) => {
                      const on = it.key === active;
                      return (
                        <Hover
                          key={it.key}
                          as="button"
                          onClick={go(it.key)}
                          baseStyle={{
                            width: '100%', display: 'flex', alignItems: 'center', gap: 11, padding: '9px 12px', borderRadius: 10, cursor: 'pointer',
                            fontFamily: 'inherit', transition: 'all .25s', border: 'none',
                            ...(on
                              ? { background: 'rgba(255,198,26,.1)', color: '#FFC61A', boxShadow: 'inset 2px 0 0 #FFC61A' }
                              : { background: 'transparent', color: '#C2CAE6' }),
                          }}
                          hoverStyle={on ? undefined : { background: 'rgba(255,255,255,.04)' }}
                        >
                          <span style={{ display: 'flex', alignItems: 'center', color: on ? '#FFC61A' : '#8E9AC4' }}><Icon name={it.icon} /></span>
                          <span style={{ flex: 1, textAlign: 'left', fontSize: 12, fontWeight: 600, letterSpacing: '.01em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{it.label}</span>
                          {it.badge !== undefined && (
                            <span style={{
                              flexShrink: 0, padding: '1px 7px', borderRadius: 99, fontSize: 9.5, fontWeight: 800,
                              ...(on ? { background: 'rgba(255,198,26,.22)', color: '#FFC61A' } : { background: 'rgba(255,255,255,.08)', color: '#9AA6CE' }),
                            }}>{it.badge}</span>
                          )}
                        </Hover>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </nav>

          <div style={{ padding: '12px 14px 16px', borderTop: '1px solid rgba(255,255,255,.09)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 11, padding: 8 }}>
              <span style={{ width: 34, height: 34, borderRadius: 10, background: 'rgba(255,198,26,.14)', border: '1px solid rgba(255,198,26,.32)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 11, fontWeight: 800, color: '#FFC61A' }}>MC</span>
              <span style={{ flex: 1, minWidth: 0 }}>
                <span style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>Marcelo Córdova</span>
                <span style={{ display: 'inline-block', marginTop: 3, padding: '2px 7px', borderRadius: 99, border: '1px solid rgba(255,198,26,.3)', background: 'rgba(255,198,26,.1)', fontSize: 7.5, fontWeight: 800, letterSpacing: '.24em', textTransform: 'uppercase', color: '#FFC61A' }}>Admin</span>
              </span>
            </div>
            <Hover
              as="button"
              baseStyle={{ width: '100%', marginTop: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 9, padding: 10, background: 'transparent', color: '#7E8CBE', border: '1px solid transparent', borderRadius: 10, fontSize: 10, fontWeight: 800, letterSpacing: '.2em', textTransform: 'uppercase', cursor: 'pointer', fontFamily: 'inherit', transition: 'all .3s' }}
              hoverStyle={{ color: '#FF6B6B', background: 'rgba(231,1,1,.1)', borderColor: 'rgba(231,1,1,.25)' }}
            >
              Cerrar Sesión
            </Hover>
          </div>
        </aside>

        {/* Main */}
        <main style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
          <header
            data-r="head"
            style={{ height: 70, background: 'rgba(255,255,255,.92)', backdropFilter: 'blur(16px)', borderBottom: '1px solid #E4E8F4', padding: '0 clamp(16px,2.4vw,32px)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 20, position: 'sticky', top: 0, zIndex: 40 }}
          >
            <Hover
              as="button"
              data-r="burger"
              onClick={() => setSideOpen((s) => !s)}
              baseStyle={{ width: 42, height: 42, flexShrink: 0, alignItems: 'center', justifyContent: 'center', background: '#F2F4FA', border: '1px solid #E4E8F4', borderRadius: 11, cursor: 'pointer', fontFamily: 'inherit', marginRight: 4 }}
              hoverStyle={{ background: '#EEF1FC' }}
            >
              <span style={{ display: 'flex', flexDirection: 'column', gap: 3.5, width: 17 }}>
                <span style={{ height: 2, background: '#0A1140', borderRadius: 2 }} />
                <span style={{ height: 2, background: '#0A1140', borderRadius: 2 }} />
                <span style={{ height: 2, background: '#0A1140', borderRadius: 2 }} />
              </span>
            </Hover>

            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 9.5, fontWeight: 700, letterSpacing: '.28em', textTransform: 'uppercase', color: '#8A93AE' }}>
                <span>Imprenta Córdova</span>
                <span style={{ color: '#C7CEE4' }}>›</span>
                <span style={{ color: '#16309B', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{pageTitle}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginTop: 4 }}>
                <span style={{ ...dot('#1B8A4B', 6), animation: 'pi-blink 2.4s ease-in-out infinite' }} />
                <span style={{ fontSize: 10, fontFamily: "'JetBrains Mono',monospace", letterSpacing: '.16em', textTransform: 'uppercase', color: '#8A93AE' }}>Sistema en línea · {clock}</span>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
              <Hover
                as="button"
                data-r="hide-sm"
                onClick={go('trabajos')}
                baseStyle={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 13px', background: '#FFFBEB', border: '1px solid #F4E3A8', borderRadius: 9, cursor: 'pointer', fontFamily: 'inherit' }}
                hoverStyle={{ background: '#FFF6D6' }}
              >
                <span style={{ ...dot('#FFC61A', 6), animation: 'pi-blink 2s ease-in-out infinite' }} />
                <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: '.1em', textTransform: 'uppercase', color: '#7A5A00' }}>14 activas</span>
              </Hover>
              <div data-r="search" style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 13px', background: '#F2F4FA', border: '1px solid #E4E8F4', borderRadius: 9, minWidth: 190 }}>
                <span style={{ color: '#8A93AE', fontSize: 13 }}>⌕</span>
                <input placeholder="Buscar orden, cliente, RUC…" style={{ flex: 1, minWidth: 0, background: 'transparent', border: 'none', outline: 'none', fontSize: 12.5, color: '#0A1140', fontFamily: 'inherit' }} />
                <span style={{ fontSize: 10, fontFamily: "'JetBrains Mono',monospace", color: '#A6AFC8', border: '1px solid #DDE2F0', borderRadius: 5, padding: '1px 5px' }}>⌘K</span>
              </div>
              <span data-r="hide-sm" style={{ width: 36, height: 36, borderRadius: 10, background: '#EEF1FC', border: '1px solid #D7DDF0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800, color: '#16309B' }}>MC</span>
            </div>
          </header>

          <div data-r="body" style={{ flex: 1, padding: 'clamp(18px,2.2vw,30px) clamp(16px,2.4vw,32px) 40px' }}>
            <div style={{ maxWidth: 1440, margin: '0 auto' }}>

              {/* ── PANEL ── */}
              {active === 'dashboard' && (
                <div style={{ ...S.animRise, gap: 20 }}>
                  <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 20, flexWrap: 'wrap' }}>
                    <div>
                      <p style={S.eyebrow}>Buenas tardes, Marcelo</p>
                      <h1 style={S.h1}>Panel de Control</h1>
                    </div>
                    <div style={{ display: 'flex', gap: 9, flexWrap: 'wrap' }}>
                      <Hover as="button" onClick={go('nuevo')} baseStyle={S.primaryBtn} hoverStyle={{ background: '#0F2280' }}>Nueva Orden</Hover>
                      <Hover as="button" onClick={go('kds')} baseStyle={{ ...S.primaryBtn, background: '#fff', color: '#16309B', border: '1px solid #D7DDF0' }} hoverStyle={{ borderColor: '#16309B' }}>Ver Taller</Hover>
                      <Hover as="button" onClick={go('cuentas')} baseStyle={{ ...S.primaryBtn, background: '#fff', color: '#16309B', border: '1px solid #D7DDF0' }} hoverStyle={{ borderColor: '#16309B' }}>Cobrar</Hover>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(190px,1fr))', gap: 14 }}>
                    {kpis.map((k) => (
                      <Hover key={k.label} baseStyle={{ background: '#fff', border: '1px solid #E4E8F4', borderRadius: 14, padding: '17px 19px', transition: 'box-shadow .3s' }} hoverStyle={{ boxShadow: '0 14px 28px -20px rgba(10,17,64,.4)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
                          <span style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: '.16em', textTransform: 'uppercase', color: '#8A93AE' }}>{k.label}</span>
                          <span style={dot(k.color)} />
                        </div>
                        <div style={{ fontFamily: "'Outfit',sans-serif", fontSize: 30, fontWeight: 600, letterSpacing: '-.04em', color: '#0A1140', marginTop: 8, lineHeight: 1 }}>{k.value}</div>
                        <div style={{ fontSize: 12, color: '#6B7590', marginTop: 6 }}>{k.hint}</div>
                      </Hover>
                    ))}
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(320px,1fr))', gap: 16, alignItems: 'start' }}>
                    <div data-r="tbl span2" style={{ gridColumn: 'span 2', minWidth: 0, ...S.card, overflow: 'hidden' }}>
                      <div style={{ padding: '17px 20px 14px', borderBottom: '1px solid #EEF0F8', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
                        <div>
                          <h2 style={S.h2}>Órdenes recientes</h2>
                          <p style={{ margin: '3px 0 0', fontSize: 12, color: '#8A93AE' }}>Últimas 8 órdenes sin entregar</p>
                        </div>
                        <Hover as="button" onClick={go('trabajos')} baseStyle={S.softBtn} hoverStyle={{ background: '#EEF1FC' }}>Ver todas →</Hover>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.4fr .9fr .8fr .8fr', padding: '10px 20px', background: '#FAFBFF', borderBottom: '1px solid #EEF0F8' }}>
                        <span style={S.colHead}>Orden</span>
                        <span style={S.colHead}>Cliente / trabajo</span>
                        <span style={S.colHead}>Estado</span>
                        <span style={{ ...S.colHead, textAlign: 'right' }}>Saldo</span>
                        <span style={{ ...S.colHead, textAlign: 'right' }}>Entrega</span>
                      </div>
                      {ORDERS.map((o) => (
                        <Hover key={o.id} baseStyle={{ display: 'grid', gridTemplateColumns: '1fr 1.4fr .9fr .8fr .8fr', alignItems: 'center', padding: '13px 20px', borderBottom: '1px solid #F2F4FA', transition: 'background .25s' }} hoverStyle={{ background: '#F7F9FF' }}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                            <span style={{ ...dot(o.urgente ? '#E70101' : '#D7DDF0', 6) }} />
                            <span style={{ fontSize: 12.5, fontFamily: "'JetBrains Mono',monospace", color: '#0A1140' }}>{o.id}</span>
                          </span>
                          <span style={{ minWidth: 0 }}>
                            <span style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#0A1140', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{o.cliente}</span>
                            <span style={{ display: 'block', fontSize: 11.5, color: '#8A93AE', marginTop: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{o.trabajo}</span>
                          </span>
                          <span><span style={estadoPill(o.estado)}><span style={dot(ESTADOS[o.estado].dot, 6)} />{o.estado}</span></span>
                          <span style={{ textAlign: 'right', fontSize: 12.5, fontFamily: "'JetBrains Mono',monospace", color: o.saldo === '0,00' ? '#8A93AE' : '#0A1140' }}>$ {o.saldo}</span>
                          <span style={{ textAlign: 'right', fontSize: 12, color: '#6B7590' }}>{o.entrega}</span>
                        </Hover>
                      ))}
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, minWidth: 0 }}>
                      <div style={{ ...S.card, padding: '18px 20px' }}>
                        <h2 style={{ ...S.h2, fontSize: 16, marginBottom: 14 }}>Carga por estado</h2>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 11 }}>
                          {(Object.keys(counts) as EstadoNombre[]).map((name) => (
                            <div key={name}>
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginBottom: 5 }}>
                                <span style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 12.5, fontWeight: 600, color: '#3C4763' }}>
                                  <span style={dot(ESTADOS[name].dot)} />{name}
                                </span>
                                <span style={{ fontSize: 12, fontFamily: "'JetBrains Mono',monospace", color: '#0A1140' }}>{counts[name]}</span>
                              </div>
                              <div style={{ height: 6, background: '#F2F4FA', borderRadius: 99, overflow: 'hidden' }}>
                                <div style={{ height: '100%', borderRadius: 99, background: ESTADOS[name].dot, width: `${Math.round((counts[name] / maxCount) * 100)}%` }} />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div style={{ background: '#0A1140', borderRadius: 16, padding: '18px 20px', color: '#fff' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ ...dot('#E70101', 7), animation: 'pi-blink 2.4s ease-in-out infinite' }} />
                          <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: '.22em', textTransform: 'uppercase', color: '#93A0C8' }}>Urgentes hoy</span>
                        </div>
                        <div style={{ fontFamily: "'Outfit',sans-serif", fontSize: 30, fontWeight: 600, letterSpacing: '-.04em', marginTop: 8, lineHeight: 1 }}>3</div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 9, marginTop: 14 }}>
                          {urgentes.map((u) => (
                            <div key={u.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, paddingTop: 9, borderTop: '1px solid rgba(255,255,255,.12)' }}>
                              <span style={{ minWidth: 0 }}>
                                <span style={{ display: 'block', fontSize: 12.5, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{u.cliente}</span>
                                <span style={{ display: 'block', fontSize: 11, color: '#93A0C8', fontFamily: "'JetBrains Mono',monospace", marginTop: 1 }}>{u.id} · {u.hora}</span>
                              </span>
                              <span style={{ flexShrink: 0, fontSize: 11, fontWeight: 700, color: '#FFC61A' }}>{u.estado}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div style={{ ...S.card, padding: '18px 20px' }}>
                        <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: '.22em', textTransform: 'uppercase', color: '#8A93AE' }}>Por cobrar</div>
                        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginTop: 8 }}>
                          <span style={{ fontFamily: "'Outfit',sans-serif", fontSize: 28, fontWeight: 600, letterSpacing: '-.04em', color: '#16309B' }}>$ 1 842,60</span>
                          <span style={{ fontSize: 12, color: '#8A93AE' }}>en 9 órdenes</span>
                        </div>
                        <Hover as="button" onClick={go('cuentas')} baseStyle={{ ...S.softBtn, width: '100%', marginTop: 14, padding: 11, borderRadius: 10, fontSize: 13 }} hoverStyle={{ background: '#EEF1FC' }}>Ir a cuentas por cobrar</Hover>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ── TALLER (KDS) ── */}
              {active === 'kds' && (
                <div style={{ ...S.animRise, gap: 18 }}>
                  <ViewHeader
                    eyebrow="Taller"
                    title="Monitor de Taller"
                    actions={
                      <div style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '9px 15px', background: '#fff', border: '1px solid #E4E8F4', borderRadius: 10 }}>
                        <span style={{ ...dot('#1B8A4B', 7), animation: 'pi-blink 2s ease-in-out infinite' }} />
                        <span style={{ fontSize: 12, color: '#3C4763' }}>Pantalla de taller · toque una tarjeta para avanzar de estado</span>
                      </div>
                    }
                  />
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(250px,1fr))', gap: 14, alignItems: 'start' }}>
                    {kdsColumns.map((c) => (
                      <div key={c.label} data-r="tbl" style={{ ...S.card, overflow: 'hidden' }}>
                        <div style={{ padding: '14px 16px', borderBottom: '1px solid #EEF0F8', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, background: c.headBg }}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 700, color: c.headColor }}>
                            <span style={dot(c.dotColor)} />{c.label}
                          </span>
                          <span style={{ fontSize: 12, fontFamily: "'JetBrains Mono',monospace", color: c.headColor }}>{c.count}</span>
                        </div>
                        <div style={{ padding: 12, display: 'flex', flexDirection: 'column', gap: 10, minHeight: 120 }}>
                          {c.cards.map((card) => (
                            <Hover key={card.id} baseStyle={{ border: '1px solid #E4E8F4', borderLeft: `3px solid ${card.accent}`, borderRadius: 11, padding: '12px 13px', cursor: 'pointer', transition: 'all .25s' }} hoverStyle={{ boxShadow: '0 12px 22px -18px rgba(10,17,64,.5)', transform: 'translateY(-2px)' }}>
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
                                <span style={{ fontSize: 11.5, fontFamily: "'JetBrains Mono',monospace", color: '#8A93AE' }}>{card.id}</span>
                                <span style={{ fontSize: 11, fontWeight: 700, color: card.timeColor }}>{card.tiempo}</span>
                              </div>
                              <div style={{ fontSize: 13.5, fontWeight: 600, color: '#0A1140', marginTop: 6 }}>{card.cliente}</div>
                              <div style={{ fontSize: 12, color: '#6B7590', marginTop: 3, lineHeight: 1.5 }}>{card.trabajo}</div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 9, paddingTop: 9, borderTop: '1px solid #F2F4FA' }}>
                                <span style={{ fontSize: 11, color: '#8A93AE' }}>{card.operador}</span>
                              </div>
                            </Hover>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ── ÓRDENES ── */}
              {active === 'trabajos' && (
                <div style={S.animRise}>
                  <ViewHeader
                    eyebrow="Operaciones"
                    title="Órdenes de Producción"
                    actions={<Hover as="button" onClick={go('nuevo')} baseStyle={S.primaryBtn} hoverStyle={{ background: '#0F2280' }}>Nueva Orden</Hover>}
                  />
                  <div style={{ ...S.card, borderRadius: 14, padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                    <div style={{ flex: 1, minWidth: 240, display: 'flex', alignItems: 'center', gap: 9, padding: '10px 13px', background: '#F7F9FF', border: '1px solid #D7DDF0', borderRadius: 10 }}>
                      <span style={{ color: '#8A93AE', fontSize: 13 }}>⌕</span>
                      <input placeholder="Buscar por cliente, N° orden, producto o tipo…" style={{ flex: 1, minWidth: 0, background: 'transparent', border: 'none', outline: 'none', fontSize: 13, color: '#0A1140', fontFamily: 'inherit' }} />
                    </div>
                    <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap' }}>
                      {FILTROS.map((f) => (
                        <button
                          key={f}
                          onClick={() => setFiltro(f)}
                          style={{
                            padding: '7px 13px', borderRadius: 99, fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
                            ...(filtro === f ? { background: '#16309B', color: '#fff', border: '1px solid #16309B' } : { background: '#fff', color: '#3C4763', border: '1px solid #D7DDF0' }),
                          }}
                        >{f}</button>
                      ))}
                    </div>
                  </div>

                  <div data-r="tbl" style={{ ...S.card, overflow: 'hidden' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '.9fr 1.4fr .7fr .9fr .7fr .7fr .8fr', padding: '11px 20px', background: '#FAFBFF', borderBottom: '1px solid #EEF0F8' }}>
                      <span style={S.colHead}>N° orden</span>
                      <span style={S.colHead}>Cliente / producto</span>
                      <span style={S.colHead}>Tipo</span>
                      <span style={S.colHead}>Estado</span>
                      <span style={{ ...S.colHead, textAlign: 'right' }}>Abono</span>
                      <span style={{ ...S.colHead, textAlign: 'right' }}>Saldo</span>
                      <span style={{ ...S.colHead, textAlign: 'right' }}>Entrega</span>
                    </div>
                    {ordenesTabla.map((o) => {
                      const sri = esSRI(o.trabajo);
                      return (
                        <Hover key={o.id} baseStyle={{ display: 'grid', gridTemplateColumns: '.9fr 1.4fr .7fr .9fr .7fr .7fr .8fr', alignItems: 'center', padding: '13px 20px', borderBottom: '1px solid #F2F4FA', transition: 'background .25s' }} hoverStyle={{ background: '#F7F9FF' }}>
                          <span style={{ fontSize: 12.5, fontFamily: "'JetBrains Mono',monospace", color: '#0A1140' }}>{o.id}</span>
                          <span style={{ minWidth: 0 }}>
                            <span style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#0A1140', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{o.cliente}</span>
                            <span style={{ display: 'block', fontSize: 11.5, color: '#8A93AE', marginTop: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{o.trabajo}</span>
                          </span>
                          <span><span style={{ padding: '3px 8px', borderRadius: 6, fontSize: 10.5, fontWeight: 700, ...(sri ? { background: '#EEF1FC', color: '#16309B' } : { background: '#FFFBEB', color: '#7A5A00' }) }}>{sri ? 'SRI' : 'Comercial'}</span></span>
                          <span><span style={estadoPill(o.estado)}><span style={dot(ESTADOS[o.estado].dot, 6)} />{o.estado}</span></span>
                          <span style={{ textAlign: 'right', fontSize: 12.5, color: '#6B7590' }}>{o.saldo === '0,00' ? 'pagado' : '$ 40,00'}</span>
                          <span style={{ textAlign: 'right', fontSize: 12.5, fontFamily: "'JetBrains Mono',monospace", color: o.saldo === '0,00' ? '#8A93AE' : '#0A1140' }}>$ {o.saldo}</span>
                          <span style={{ textAlign: 'right', fontSize: 12, color: '#6B7590' }}>{o.entrega}</span>
                        </Hover>
                      );
                    })}
                    <div style={{ padding: '14px 20px', background: '#FAFBFF', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
                      <span style={{ fontSize: 12.5, color: '#6B7590' }}>Mostrando {ordenesTabla.length} de 14 órdenes activas</span>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button style={{ padding: '8px 15px', background: '#fff', border: '1px solid #D7DDF0', borderRadius: 9, fontSize: 12.5, fontWeight: 600, color: '#8A93AE', cursor: 'pointer', fontFamily: 'inherit' }}>Anterior</button>
                        <Hover as="button" baseStyle={{ padding: '8px 15px', background: '#fff', border: '1px solid #D7DDF0', borderRadius: 9, fontSize: 12.5, fontWeight: 600, color: '#16309B', cursor: 'pointer', fontFamily: 'inherit' }} hoverStyle={{ borderColor: '#16309B' }}>Siguiente</Hover>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ── NUEVA ORDEN ── */}
              {active === 'nuevo' && (
                <div style={S.animRise}>
                  <div>
                    <p style={S.eyebrow}>Operaciones</p>
                    <h1 style={S.h1}>Nueva Orden</h1>
                    <p style={{ margin: '6px 0 0', fontSize: 13.5, color: '#6B7590' }}>Producto primero, cliente al final. La meta son 30 segundos por orden.</p>
                  </div>

                  <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                    {pasos.map((p) => (
                      <div key={p.n} style={{ flex: 1, minWidth: 150, padding: '13px 16px', borderRadius: 12, border: `1px solid ${p.on ? '#16309B' : '#E4E8F4'}`, background: p.on ? '#EEF1FC' : '#fff' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                          <span style={{ width: 22, height: 22, borderRadius: 99, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800, background: p.on ? '#16309B' : '#F2F4FA', color: p.on ? '#fff' : '#8A93AE' }}>{p.n}</span>
                          <span style={{ fontSize: 14, fontWeight: 700, color: '#0A1140' }}>{p.label}</span>
                        </div>
                        <div style={{ fontSize: 12, color: '#6B7590', marginTop: 5 }}>{p.hint}</div>
                      </div>
                    ))}
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(320px,1fr))', gap: 16, alignItems: 'start' }}>
                    <div data-r="span2" style={{ gridColumn: 'span 2', minWidth: 0, display: 'flex', flexDirection: 'column', gap: 16 }}>
                      <div style={{ ...S.card, padding: '18px 20px' }}>
                        <h2 style={{ ...S.h2, fontSize: 16, marginBottom: 13 }}>1 · Producto</h2>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))', gap: 9 }}>
                          {productos.map((p) => (
                            <Hover key={p.label} as="button" baseStyle={{ padding: '13px 14px', borderRadius: 12, textAlign: 'left', cursor: 'pointer', fontFamily: 'inherit', transition: 'all .25s', border: `1px solid ${p.on ? '#16309B' : '#E4E8F4'}`, background: p.on ? '#EEF1FC' : '#fff', color: '#0A1140' }} hoverStyle={p.on ? undefined : { borderColor: '#16309B' }}>
                              <span style={{ display: 'block', fontSize: 13.5, fontWeight: 600 }}>{p.label}</span>
                              <span style={{ display: 'block', fontSize: 11.5, color: '#6B7590', marginTop: 3 }}>{p.tipo}</span>
                            </Hover>
                          ))}
                        </div>
                      </div>

                      <div style={{ ...S.card, padding: '18px 20px' }}>
                        <h2 style={{ ...S.h2, fontSize: 16, marginBottom: 14 }}>2 · Detalles</h2>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: 12 }}>
                          <label style={{ display: 'block' }}><span style={S.fieldLabel}>Cantidad</span><input defaultValue="100 juegos" style={S.input} /></label>
                          <label style={{ display: 'block' }}><span style={S.fieldLabel}>Copias / acabado</span><input defaultValue="Original + 2 copias" style={S.input} /></label>
                          <label style={{ display: 'block' }}><span style={S.fieldLabel}>Precio</span><input defaultValue="48,00" style={{ ...S.input, fontFamily: "'JetBrains Mono',monospace" }} /></label>
                          <label style={{ display: 'block' }}><span style={S.fieldLabel}>Abono recibido</span><input defaultValue="40,00" style={{ ...S.input, background: '#FFFBEB', border: '1px solid #F4E3A8', fontFamily: "'JetBrains Mono',monospace" }} /></label>
                          <label style={{ display: 'block', gridColumn: '1 / -1' }}><span style={S.fieldLabel}>Notas para el taller</span><input placeholder="Ej. mismo diseño del talonario anterior, cambiar solo numeración" style={S.input} /></label>
                        </div>
                      </div>

                      <div style={{ ...S.card, padding: '18px 20px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 14, flexWrap: 'wrap', marginBottom: 14 }}>
                          <h2 style={{ ...S.h2, fontSize: 16 }}>3 · Cliente</h2>
                          <span style={{ padding: '4px 10px', background: '#EEF1FC', color: '#16309B', borderRadius: 7, fontSize: 11, fontWeight: 700 }}>Identidad express</span>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(170px,1fr))', gap: 12 }}>
                          <label style={{ display: 'block' }}><span style={S.fieldLabel}>Cédula / RUC</span><input defaultValue="0791234567001" style={{ ...S.input, fontFamily: "'JetBrains Mono',monospace" }} /></label>
                          <label style={{ display: 'block' }}><span style={S.fieldLabel}>Nombre / razón social</span><input defaultValue="Ferretería El Oro Cía." style={S.input} /></label>
                          <label style={{ display: 'block' }}><span style={S.fieldLabel}>Teléfono</span><input defaultValue="099 308 3943" style={S.input} /></label>
                        </div>
                      </div>
                    </div>

                    <div data-r="sticky" style={{ position: 'sticky', top: 88, ...S.card, overflow: 'hidden' }}>
                      <div style={{ padding: '16px 19px', borderBottom: '1px solid #EEF0F8' }}>
                        <h2 style={{ ...S.h2, fontSize: 16 }}>Resumen de la orden</h2>
                      </div>
                      {carrito.map((c) => (
                        <div key={c.label} style={{ padding: '14px 19px', borderBottom: '1px solid #F2F4FA', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 14 }}>
                          <span>
                            <span style={{ display: 'block', fontSize: 13.5, fontWeight: 600, color: '#0A1140' }}>{c.label}</span>
                            <span style={{ display: 'block', fontSize: 11.5, color: '#8A93AE', marginTop: 3 }}>{c.detail}</span>
                          </span>
                          <span style={{ fontSize: 13, fontFamily: "'JetBrains Mono',monospace", color: '#0A1140', whiteSpace: 'nowrap' }}>{c.amount}</span>
                        </div>
                      ))}
                      <div style={{ padding: '14px 19px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#FAFBFF' }}>
                        <span style={{ ...S.fieldLabel, marginBottom: 0 }}>Total</span>
                        <span style={{ fontFamily: "'Outfit',sans-serif", fontSize: 22, fontWeight: 700, color: '#16309B' }}>$ 100,00</span>
                      </div>
                      <div style={{ padding: '14px 19px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid #EEF0F8' }}>
                        <span style={{ ...S.fieldLabel, marginBottom: 0 }}>Saldo</span>
                        <span style={{ fontSize: 15, fontFamily: "'JetBrains Mono',monospace", color: '#0A1140' }}>$ 60,00</span>
                      </div>
                      <div style={{ padding: '16px 19px', display: 'flex', flexDirection: 'column', gap: 9, borderTop: '1px solid #EEF0F8' }}>
                        <Hover as="button" baseStyle={{ width: '100%', padding: 13, background: '#16309B', color: '#fff', border: 'none', borderRadius: 11, fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }} hoverStyle={{ background: '#0F2280' }}>Guardar e imprimir nota</Hover>
                        <Hover as="button" baseStyle={{ width: '100%', padding: 12, background: '#F2F4FA', color: '#16309B', border: 'none', borderRadius: 11, fontSize: 13.5, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }} hoverStyle={{ background: '#EEF1FC' }}>Guardar y seguir atendiendo</Hover>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ── DESPACHO ── */}
              {active === 'retiros' && (
                <div style={S.animRise}>
                  <div>
                    <p style={S.eyebrow}>Operaciones</p>
                    <h1 style={S.h1}>Despacho y Entregas</h1>
                    <p style={{ margin: '6px 0 0', fontSize: 13.5, color: '#6B7590' }}>Trabajos listos esperando retiro. Cobre el saldo y marque la entrega.</p>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {despachos.map((d) => (
                      <div key={d.id} style={{ ...S.card, padding: '18px 20px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: 16, alignItems: 'center' }}>
                        <div style={{ minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                            <span style={{ fontSize: 12, fontFamily: "'JetBrains Mono',monospace", color: '#8A93AE' }}>{d.id}</span>
                            <span style={d.saldoStyle}>{d.saldoLabel}</span>
                          </div>
                          <div style={{ fontSize: 15, fontWeight: 600, color: '#0A1140', marginTop: 6 }}>{d.cliente}</div>
                          <div style={{ fontSize: 12.5, color: '#6B7590', marginTop: 2 }}>{d.trabajo}</div>
                        </div>
                        <div>
                          <div style={S.fieldLabel}>Listo desde</div>
                          <div style={{ fontSize: 14, color: '#0A1140', marginTop: 4 }}>{d.listo}</div>
                        </div>
                        <div>
                          <div style={S.fieldLabel}>Aviso al cliente</div>
                          <div style={{ fontSize: 13.5, color: d.avisoColor, marginTop: 4, fontWeight: 600 }}>{d.avisoLabel}</div>
                        </div>
                        <div style={{ display: 'flex', gap: 9, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                          <Hover as="button" baseStyle={{ padding: '11px 16px', background: '#F2F4FA', color: '#16309B', border: 'none', borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }} hoverStyle={{ background: '#EEF1FC' }}>Avisar</Hover>
                          <Hover as="button" baseStyle={{ padding: '11px 18px', background: '#16309B', color: '#fff', border: 'none', borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }} hoverStyle={{ background: '#0F2280' }}>Entregar y cobrar</Hover>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ── DISEÑO ── */}
              {active === 'diseno' && (
                <div style={S.animRise}>
                  <div>
                    <p style={S.eyebrow}>Taller</p>
                    <h1 style={S.h1}>Diseño Gráfico</h1>
                    <p style={{ margin: '6px 0 0', fontSize: 13.5, color: '#6B7590' }}>Cola de diagramación. El arte maestro vive en CorelDRAW; aquí solo se controla el avance.</p>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(290px,1fr))', gap: 14 }}>
                    {disenoQueue.map((d) => (
                      <div key={d.id} data-r="tbl" style={{ ...S.card, overflow: 'hidden' }}>
                        <div style={{ height: 130, background: 'repeating-linear-gradient(45deg,#F5F7FD 0 12px,#EEF1FC 12px 24px)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#A6AFC8', fontSize: 12.5 }}>Vista previa del arte</div>
                        <div style={{ padding: '16px 18px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
                            <span style={{ fontSize: 12, fontFamily: "'JetBrains Mono',monospace", color: '#8A93AE' }}>{d.id}</span>
                            <span style={{ padding: '4px 10px', background: '#F5F3FF', color: '#6D28D9', border: '1px solid #DDD3FE', borderRadius: 99, fontSize: 11, fontWeight: 700 }}>{d.estado}</span>
                          </div>
                          <div style={{ fontSize: 14.5, fontWeight: 600, color: '#0A1140', marginTop: 8 }}>{d.cliente}</div>
                          <div style={{ fontSize: 12.5, color: '#6B7590', marginTop: 3 }}>{d.trabajo}</div>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginTop: 13, paddingTop: 12, borderTop: '1px solid #F2F4FA' }}>
                            <span style={{ fontSize: 12, color: '#8A93AE' }}>{d.operador} · prueba {d.prueba}</span>
                            <Hover as="button" baseStyle={{ ...S.softBtn, padding: '8px 13px' }} hoverStyle={{ background: '#EEF1FC' }}>Enviar prueba</Hover>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ── BODEGA DE INSUMOS ── */}
              {active === 'inventario' && (
                <div style={S.animRise}>
                  <ViewHeader
                    eyebrow="Taller"
                    title="Bodega de Insumos"
                    actions={<Hover as="button" baseStyle={S.primaryBtn} hoverStyle={{ background: '#0F2280' }}>Registrar insumo</Hover>}
                  />
                  <div data-r="tbl" style={{ ...S.card, overflow: 'hidden' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1.6fr .8fr 1fr .7fr .7fr', padding: '11px 20px', background: '#FAFBFF', borderBottom: '1px solid #EEF0F8' }}>
                      <span style={S.colHead}>Material</span>
                      <span style={S.colHead}>Estado</span>
                      <span style={S.colHead}>Existencias</span>
                      <span style={{ ...S.colHead, textAlign: 'right' }}>Costo unit.</span>
                      <span style={{ ...S.colHead, textAlign: 'right' }}>Valoración</span>
                    </div>
                    {insumos.map((i) => (
                      <Hover key={i.item} baseStyle={{ display: 'grid', gridTemplateColumns: '1.6fr .8fr 1fr .7fr .7fr', alignItems: 'center', padding: '14px 20px', borderBottom: '1px solid #F2F4FA', transition: 'background .25s' }} hoverStyle={{ background: '#F7F9FF' }}>
                        <span>
                          <span style={{ display: 'block', fontSize: 13.5, fontWeight: 600, color: '#0A1140' }}>{i.item}</span>
                          <span style={{ display: 'block', fontSize: 11.5, color: '#8A93AE', marginTop: 2 }}>mínimo {i.min} {i.unidad}</span>
                        </span>
                        <span><span style={i.badgeStyle}>{i.badgeLabel}</span></span>
                        <span>
                          <span style={{ display: 'block', fontSize: 12.5, color: '#0A1140', fontFamily: "'JetBrains Mono',monospace" }}>{i.stockLabel}</span>
                          <span style={{ display: 'block', height: 5, background: '#F2F4FA', borderRadius: 99, overflow: 'hidden', marginTop: 5, maxWidth: 130 }}>
                            <span style={{ display: 'block', height: '100%', borderRadius: 99, background: i.barColor, width: i.barWidth }} />
                          </span>
                        </span>
                        <span style={{ textAlign: 'right', fontSize: 12.5, fontFamily: "'JetBrains Mono',monospace", color: '#6B7590' }}>$ {i.costo}</span>
                        <span style={{ textAlign: 'right', fontSize: 12.5, fontFamily: "'JetBrains Mono',monospace", color: '#0A1140' }}>$ {i.valor}</span>
                      </Hover>
                    ))}
                  </div>
                </div>
              )}

              {/* ── CUENTAS POR COBRAR ── */}
              {active === 'cuentas' && (
                <div style={S.animRise}>
                  <ViewHeader
                    eyebrow="Finanzas"
                    title="Cuentas por Cobrar"
                    actions={<Hover as="button" baseStyle={S.primaryBtn} hoverStyle={{ background: '#0F2280' }}>Nueva operación</Hover>}
                  />
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(190px,1fr))', gap: 14 }}>
                    {[
                      { l: 'Cartera pendiente', v: '$ 1 842,60', h: '9 órdenes con saldo', c: '#16309B' },
                      { l: 'Ingresos de hoy', v: '$ 274,00', h: '6 abonos y 2 pagos totales', c: '#1B6E3E' },
                      { l: 'Egresos de hoy', v: '$ 253,00', h: 'insumos y mantenimiento', c: '#B91C1C' },
                    ].map((x) => (
                      <div key={x.l} style={{ ...S.card, borderRadius: 14, padding: '17px 19px' }}>
                        <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: '.16em', textTransform: 'uppercase', color: '#8A93AE' }}>{x.l}</div>
                        <div style={{ fontFamily: "'Outfit',sans-serif", fontSize: 28, fontWeight: 600, letterSpacing: '-.04em', color: x.c, marginTop: 8, lineHeight: 1 }}>{x.v}</div>
                        <div style={{ fontSize: 12, color: '#6B7590', marginTop: 6 }}>{x.h}</div>
                      </div>
                    ))}
                    <div style={{ background: '#0A1140', borderRadius: 14, padding: '17px 19px', color: '#fff' }}>
                      <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: '.16em', textTransform: 'uppercase', color: '#93A0C8' }}>Saldo en caja</div>
                      <div style={{ fontFamily: "'Outfit',sans-serif", fontSize: 28, fontWeight: 600, letterSpacing: '-.04em', marginTop: 8, lineHeight: 1 }}>$ 621,00</div>
                      <div style={{ fontSize: 12, color: '#93A0C8', marginTop: 6 }}>cierre estimado del día</div>
                    </div>
                  </div>

                  <div data-r="tbl" style={{ ...S.card, overflow: 'hidden' }}>
                    <div style={{ padding: '16px 20px 14px', borderBottom: '1px solid #EEF0F8', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 14, flexWrap: 'wrap' }}>
                      <h2 style={S.h2}>Movimientos del día</h2>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '9px 13px', background: '#F2F4FA', border: '1px solid #E4E8F4', borderRadius: 9, minWidth: 220 }}>
                        <span style={{ color: '#8A93AE', fontSize: 13 }}>⌕</span>
                        <input placeholder="Buscar transacción o usuario…" style={{ flex: 1, minWidth: 0, background: 'transparent', border: 'none', outline: 'none', fontSize: 12.5, color: '#0A1140', fontFamily: 'inherit' }} />
                      </div>
                    </div>
                    {movimientos.map((m) => (
                      <div key={m.hash} style={{ padding: '14px 20px', borderBottom: '1px solid #F2F4FA', display: 'grid', gridTemplateColumns: 'auto 1fr auto auto', gap: 14, alignItems: 'center' }}>
                        <span style={m.tipoStyle}>{m.tipo}</span>
                        <span style={{ minWidth: 0 }}>
                          <span style={{ display: 'block', fontSize: 13.5, fontWeight: 600, color: '#0A1140', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{m.detalle}</span>
                          <span style={{ display: 'block', fontSize: 11, color: '#A6AFC8', fontFamily: "'JetBrains Mono',monospace", marginTop: 2 }}>firma {m.hash}</span>
                        </span>
                        <span style={{ fontSize: 12, color: '#8A93AE', fontFamily: "'JetBrains Mono',monospace" }}>{m.hora}</span>
                        <span style={{ fontSize: 14, fontFamily: "'JetBrains Mono',monospace", fontWeight: 600, color: m.montoColor, whiteSpace: 'nowrap' }}>{m.montoLabel}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ── FACTURACIÓN SRI ── */}
              {active === 'facturacion' && (
                <div style={S.animRise}>
                  <div>
                    <p style={S.eyebrow}>Finanzas</p>
                    <h1 style={S.h1}>Facturación Electrónica SRI</h1>
                    <p style={{ margin: '6px 0 0', fontSize: 13.5, color: '#6B7590' }}>Secuencias autorizadas del establecimiento 001-001 y su vigencia.</p>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(300px,1fr))', gap: 16, alignItems: 'start' }}>
                    <div data-r="tbl span2" style={{ gridColumn: 'span 2', minWidth: 0, ...S.card, overflow: 'hidden' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: '1.3fr .7fr 1fr .9fr .9fr', padding: '11px 20px', background: '#FAFBFF', borderBottom: '1px solid #EEF0F8' }}>
                        <span style={S.colHead}>Comprobante</span>
                        <span style={S.colHead}>Serie</span>
                        <span style={S.colHead}>Rango</span>
                        <span style={S.colHead}>Estado</span>
                        <span style={{ ...S.colHead, textAlign: 'right' }}>Vence</span>
                      </div>
                      {secuencias.map((s) => (
                        <div key={s.doc} style={{ display: 'grid', gridTemplateColumns: '1.3fr .7fr 1fr .9fr .9fr', alignItems: 'center', padding: '14px 20px', borderBottom: '1px solid #F2F4FA' }}>
                          <span style={{ fontSize: 13.5, fontWeight: 600, color: '#0A1140' }}>{s.doc}</span>
                          <span style={{ fontSize: 12.5, fontFamily: "'JetBrains Mono',monospace", color: '#6B7590' }}>{s.serie}</span>
                          <span style={{ fontSize: 12.5, fontFamily: "'JetBrains Mono',monospace", color: '#0A1140' }}>{s.rango}</span>
                          <span><span style={s.estadoStyle}>{s.estado}</span></span>
                          <span style={{ textAlign: 'right', fontSize: 12.5, color: '#6B7590' }}>{s.vence}</span>
                        </div>
                      ))}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                      <div style={{ ...S.card, padding: '18px 20px' }}>
                        <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: '.16em', textTransform: 'uppercase', color: '#8A93AE' }}>Establecimiento</div>
                        <div style={{ fontFamily: "'Outfit',sans-serif", fontSize: 20, fontWeight: 600, letterSpacing: '-.03em', color: '#0A1140', marginTop: 7 }}>001-001</div>
                        <div style={{ fontSize: 13, color: '#6B7590', marginTop: 5, lineHeight: 1.6 }}>Imprenta Córdova · Machala<br />Autorización de gráficas vigente</div>
                      </div>
                      <div style={{ background: '#FFFBEB', border: '1px solid #F4E3A8', borderRadius: 16, padding: '18px 20px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                          <span style={dot('#FFC61A', 7)} />
                          <span style={{ fontSize: 10.5, fontWeight: 800, letterSpacing: '.18em', textTransform: 'uppercase', color: '#7A5A00' }}>Por renovar</span>
                        </div>
                        <p style={{ margin: '9px 0 0', fontSize: 13, lineHeight: 1.65, color: '#7A5A00' }}>La secuencia de guías de remisión vence el 30 de septiembre. Quedan 120 números disponibles.</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ── FLUJO DE CAJA ── */}
              {active === 'finanzas' && (
                <div style={S.animRise}>
                  <div>
                    <p style={S.eyebrow}>Finanzas</p>
                    <h1 style={S.h1}>Flujo de Caja</h1>
                    <p style={{ margin: '6px 0 0', fontSize: 13.5, color: '#6B7590' }}>Ingresos y egresos de la semana en curso.</p>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(300px,1fr))', gap: 16, alignItems: 'start' }}>
                    <div data-r="span2" style={{ gridColumn: 'span 2', minWidth: 0, ...S.card, padding: '20px 22px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 18, flexWrap: 'wrap', marginBottom: 18 }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 12.5, color: '#3C4763' }}><span style={{ width: 11, height: 11, borderRadius: 3, background: '#16309B' }} /> Ingresos</span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 12.5, color: '#3C4763' }}><span style={{ width: 11, height: 11, borderRadius: 3, background: '#FFC61A' }} /> Egresos</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 'clamp(10px,2vw,26px)', height: 190 }}>
                        {semanas.map((d) => (
                          <div key={d.label} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 5, width: '100%', height: 150 }}>
                              <div style={{ width: '100%', borderRadius: '6px 6px 0 0', background: '#16309B', height: d.ingresoH }} />
                              <div style={{ width: '100%', borderRadius: '6px 6px 0 0', background: '#FFC61A', height: d.egresoH }} />
                            </div>
                            <span style={{ fontSize: 12, fontWeight: 600, color: '#3C4763' }}>{d.label}</span>
                            <span style={{ fontSize: 11, color: '#8A93AE', fontFamily: "'JetBrains Mono',monospace" }}>{d.ingresoLabel}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                      <div style={{ ...S.card, padding: '18px 20px' }}>
                        <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: '.16em', textTransform: 'uppercase', color: '#8A93AE' }}>Ingresos de la semana</div>
                        <div style={{ fontFamily: "'Outfit',sans-serif", fontSize: 28, fontWeight: 600, letterSpacing: '-.04em', color: '#16309B', marginTop: 8 }}>$ 1 358,00</div>
                      </div>
                      <div style={{ ...S.card, padding: '18px 20px' }}>
                        <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: '.16em', textTransform: 'uppercase', color: '#8A93AE' }}>Egresos de la semana</div>
                        <div style={{ fontFamily: "'Outfit',sans-serif", fontSize: 28, fontWeight: 600, letterSpacing: '-.04em', color: '#B45309', marginTop: 8 }}>$ 570,00</div>
                      </div>
                      <div style={{ background: '#0A1140', borderRadius: 16, padding: '18px 20px', color: '#fff' }}>
                        <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: '.16em', textTransform: 'uppercase', color: '#93A0C8' }}>Resultado</div>
                        <div style={{ fontFamily: "'Outfit',sans-serif", fontSize: 28, fontWeight: 600, letterSpacing: '-.04em', marginTop: 8 }}>+ $ 788,00</div>
                        <div style={{ fontSize: 12.5, color: '#93A0C8', marginTop: 6 }}>58 % de margen sobre ingresos</div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ── CALCULADORA ── */}
              {active === 'calculadora' && (
                <div style={S.animRise}>
                  <div>
                    <p style={S.eyebrow}>Finanzas</p>
                    <h1 style={S.h1}>Calculadora de Precios</h1>
                    <p style={{ margin: '6px 0 0', fontSize: 13.5, color: '#6B7590' }}>Uso interno. El precio al cliente lo confirma quien atiende.</p>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(300px,1fr))', gap: 16, alignItems: 'start' }}>
                    <div style={{ ...S.card, padding: '20px 22px' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', gap: 13 }}>
                        <label style={{ display: 'block' }}><span style={S.fieldLabel}>Material</span><input defaultValue="Papel químico 3 copias" style={S.input} /></label>
                        <label style={{ display: 'block' }}><span style={S.fieldLabel}>Cantidad</span><input defaultValue="100 juegos" style={S.input} /></label>
                        <label style={{ display: 'block' }}><span style={S.fieldLabel}>Tintas</span><input defaultValue="1 tinta" style={S.input} /></label>
                        <label style={{ display: 'block' }}><span style={S.fieldLabel}>Acabado</span><input defaultValue="Numerado y perforado" style={S.input} /></label>
                        <label style={{ display: 'block' }}><span style={S.fieldLabel}>Margen</span><input defaultValue="35 %" style={{ ...S.input, background: '#FFFBEB', border: '1px solid #F4E3A8', fontFamily: "'JetBrains Mono',monospace" }} /></label>
                      </div>
                    </div>
                    <div data-r="tbl" style={{ ...S.card, overflow: 'hidden' }}>
                      <div style={{ padding: '16px 20px', borderBottom: '1px solid #EEF0F8' }}>
                        <h2 style={{ ...S.h2, fontSize: 16 }}>Desglose del costo</h2>
                      </div>
                      {calcRows.map((c) => (
                        <div key={c.k} style={{ padding: '13px 20px', borderBottom: '1px solid #F2F4FA', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 14 }}>
                          <span style={{ fontSize: 13.5, color: '#3C4763' }}>{c.k}</span>
                          <span style={{ fontSize: 13, fontFamily: "'JetBrains Mono',monospace", color: '#0A1140' }}>{c.v}</span>
                        </div>
                      ))}
                      <div style={{ padding: '14px 20px', background: '#FAFBFF', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{ ...S.fieldLabel, marginBottom: 0 }}>Costo</span>
                        <span style={{ fontSize: 15, fontFamily: "'JetBrains Mono',monospace", color: '#0A1140' }}>$ 44,00</span>
                      </div>
                      <div style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid #EEF0F8' }}>
                        <span style={{ ...S.fieldLabel, marginBottom: 0 }}>Precio sugerido</span>
                        <span style={{ fontFamily: "'Outfit',sans-serif", fontSize: 24, fontWeight: 700, color: '#16309B' }}>$ 59,40</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ── CLIENTES ── */}
              {active === 'clientes' && (
                <div style={S.animRise}>
                  <ViewHeader
                    eyebrow="Entidades"
                    title="Directorio de Clientes"
                    actions={<Hover as="button" baseStyle={S.primaryBtn} hoverStyle={{ background: '#0F2280' }}>Registrar cliente</Hover>}
                  />
                  <div style={{ ...S.card, borderRadius: 14, padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 9 }}>
                    <span style={{ color: '#8A93AE', fontSize: 13 }}>⌕</span>
                    <input placeholder="Buscar por nombre, RUC o cédula…" style={{ flex: 1, minWidth: 0, background: 'transparent', border: 'none', outline: 'none', fontSize: 13.5, color: '#0A1140', fontFamily: 'inherit' }} />
                  </div>
                  <div data-r="tbl" style={{ ...S.card, overflow: 'hidden' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr 1.1fr .9fr 1.3fr', padding: '11px 20px', background: '#FAFBFF', borderBottom: '1px solid #EEF0F8' }}>
                      <span style={S.colHead}>Cliente</span>
                      <span style={S.colHead}>RUC / cédula</span>
                      <span style={S.colHead}>Régimen</span>
                      <span style={S.colHead}>Teléfono</span>
                      <span style={S.colHead}>Último trabajo</span>
                    </div>
                    {clientesLista.map((c) => (
                      <Hover key={c.id} baseStyle={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr 1.1fr .9fr 1.3fr', alignItems: 'center', padding: '14px 20px', borderBottom: '1px solid #F2F4FA', transition: 'background .25s' }} hoverStyle={{ background: '#F7F9FF' }}>
                        <span style={{ fontSize: 13.5, fontWeight: 600, color: '#0A1140' }}>{c.nombre}</span>
                        <span style={{ fontSize: 12.5, fontFamily: "'JetBrains Mono',monospace", color: '#6B7590' }}>{c.id}</span>
                        <span style={{ fontSize: 12.5, color: '#3C4763' }}>{c.regimen}</span>
                        <span style={{ fontSize: 12.5, color: '#3C4763' }}>{c.tel}</span>
                        <span style={{ fontSize: 12.5, color: '#8A93AE' }}>{c.ultimo}</span>
                      </Hover>
                    ))}
                  </div>
                </div>
              )}

              {/* ── PROVEEDORES ── */}
              {active === 'proveedores' && (
                <div style={S.animRise}>
                  <div>
                    <p style={S.eyebrow}>Entidades</p>
                    <h1 style={S.h1}>Gestión de Proveedores</h1>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(290px,1fr))', gap: 14 }}>
                    {proveedoresLista.map((p) => (
                      <div key={p.nombre} style={{ ...S.card, padding: '18px 20px' }}>
                        <div style={{ fontSize: 15, fontWeight: 600, color: '#0A1140', lineHeight: 1.35 }}>{p.nombre}</div>
                        <div style={{ fontSize: 12.5, color: '#6B7590', marginTop: 5 }}>{p.contacto}</div>
                        <div style={{ fontSize: 12.5, color: '#8A93AE', marginTop: 10, lineHeight: 1.6 }}>{p.insumos}</div>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginTop: 14, paddingTop: 13, borderTop: '1px solid #F2F4FA' }}>
                          <span style={{ ...S.fieldLabel, marginBottom: 0 }}>Saldo</span>
                          <span style={{ fontSize: 14, fontFamily: "'JetBrains Mono',monospace", fontWeight: 600, color: p.saldoColor }}>{p.saldoLabel}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ── USUARIOS ── */}
              {active === 'usuarios' && (
                <div style={S.animRise}>
                  <ViewHeader
                    eyebrow="Sistema"
                    title="Gestión de Usuarios"
                    actions={<Hover as="button" baseStyle={S.primaryBtn} hoverStyle={{ background: '#0F2280' }}>Crear usuario</Hover>}
                  />
                  <div data-r="tbl" style={{ ...S.card, overflow: 'hidden' }}>
                    {usuariosLista.map((u) => (
                      <div key={u.correo} style={{ padding: '15px 20px', borderBottom: '1px solid #F2F4FA', display: 'grid', gridTemplateColumns: 'auto 1.3fr 1.4fr auto auto', gap: 14, alignItems: 'center' }}>
                        <span style={{ width: 36, height: 36, borderRadius: 10, background: '#EEF1FC', border: '1px solid #D7DDF0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11.5, fontWeight: 800, color: '#16309B' }}>{u.inicial}</span>
                        <span style={{ fontSize: 14, fontWeight: 600, color: '#0A1140' }}>{u.nombre}</span>
                        <span style={{ fontSize: 12.5, color: '#6B7590' }}>{u.correo}</span>
                        <span><span style={u.rolStyle}>{u.rol}</span></span>
                        <span style={{ fontSize: 12, color: '#8A93AE', textAlign: 'right' }}>activo {u.activo}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ── AUDITORÍA ── */}
              {active === 'registro' && (
                <div style={S.animRise}>
                  <div>
                    <p style={S.eyebrow}>Sistema</p>
                    <h1 style={S.h1}>Auditoría del Sistema</h1>
                    <p style={{ margin: '6px 0 0', fontSize: 13.5, color: '#6B7590' }}>Cada acción queda firmada. Los registros de más de 3 meses se purgan automáticamente.</p>
                  </div>
                  <div data-r="tbl" style={{ ...S.card, overflow: 'hidden' }}>
                    {auditoria.map((a) => (
                      <div key={a.hash} style={{ padding: '15px 20px', borderBottom: '1px solid #F2F4FA', display: 'grid', gridTemplateColumns: '1fr auto auto', gap: 16, alignItems: 'center' }}>
                        <span style={{ minWidth: 0 }}>
                          <span style={{ display: 'block', fontSize: 13.5, fontWeight: 600, color: '#0A1140' }}>{a.accion}</span>
                          <span style={{ display: 'block', fontSize: 11, color: '#A6AFC8', fontFamily: "'JetBrains Mono',monospace", marginTop: 3 }}>firma {a.hash}</span>
                        </span>
                        <span style={{ fontSize: 12.5, color: '#3C4763' }}>{a.usuario}</span>
                        <span style={{ fontSize: 12, color: '#8A93AE', fontFamily: "'JetBrains Mono',monospace" }}>{a.hora}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ── CONFIGURACIÓN ── */}
              {active === 'configuracion' && (
                <div style={S.animRise}>
                  <div>
                    <p style={S.eyebrow}>Sistema</p>
                    <h1 style={S.h1}>Configuración General</h1>
                  </div>
                  <div data-r="tbl" style={{ ...S.card, overflow: 'hidden' }}>
                    {ajustes.map((a) => (
                      <Hover key={a.title} baseStyle={{ padding: '17px 20px', borderBottom: '1px solid #F2F4FA', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 18, transition: 'background .25s' }} hoverStyle={{ background: '#F7F9FF' }}>
                        <span style={{ minWidth: 0 }}>
                          <span style={{ display: 'block', fontSize: 14.5, fontWeight: 600, color: '#0A1140' }}>{a.title}</span>
                          <span style={{ display: 'block', fontSize: 12.5, color: '#6B7590', marginTop: 3, lineHeight: 1.6 }}>{a.desc}</span>
                        </span>
                        <span style={{ flexShrink: 0, padding: '9px 15px', background: '#F2F4FA', color: '#16309B', borderRadius: 9, fontSize: 12.5, fontWeight: 600 }}>Editar</span>
                      </Hover>
                    ))}
                  </div>
                </div>
              )}

              {/* ── EXTENSIÓN ── */}
              {active === 'extension' && (
                <div style={{ animation: 'pi-rise .6s cubic-bezier(.2,.8,.2,1) both' }}>
                  <p style={S.eyebrow}>Sistema</p>
                  <h1 style={S.h1}>Descargar Extensión</h1>
                  <div style={{ marginTop: 18, maxWidth: 640, ...S.card, padding: '26px 28px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                      <span style={{ width: 44, height: 44, borderRadius: 12, background: '#F2F7F2', border: '1px solid #D8E8DC', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#1B6E3E', fontSize: 19 }}>↓</span>
                      <span>
                        <span style={{ display: 'block', fontFamily: "'Outfit',sans-serif", fontSize: 18, fontWeight: 600, letterSpacing: '-.03em', color: '#0A1140' }}>Extensión Córdova para el SRI</span>
                        <span style={{ display: 'block', fontSize: 12.5, color: '#6B7590', marginTop: 3 }}>Versión 2.1 · Chrome · archivo ZIP</span>
                      </span>
                    </div>
                    <p style={{ margin: '16px 0 0', fontSize: 14, lineHeight: 1.7, color: '#4A5470' }}>Autocompleta la solicitud de preimpresos en el portal del SRI con los datos de la orden. Descargue el ZIP y cárguelo en <b>chrome://extensions</b> con el modo de desarrollador activo.</p>
                    <Hover as="button" baseStyle={{ marginTop: 18, padding: '12px 20px', background: '#1B6E3E', color: '#fff', border: 'none', borderRadius: 10, fontSize: 13.5, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }} hoverStyle={{ background: '#155C33' }}>Descargar extensión-cordova.zip</Hover>
                  </div>
                </div>
              )}

            </div>
          </div>

          {/* Barra inferior móvil */}
          <div data-r="tabbar">
            {TAB_KEYS.map((t) => {
              const on = t.key === active;
              return (
                <button
                  key={t.key}
                  onClick={go(t.key)}
                  style={{ flex: 1, minWidth: 0, minHeight: 52, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4, padding: '7px 4px', border: 'none', borderRadius: 11, cursor: 'pointer', fontFamily: 'inherit', background: on ? '#EEF1FC' : 'transparent' }}
                >
                  <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: on ? '#16309B' : '#8A93AE' }}><Icon name={t.icon} /></span>
                  <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.02em', color: on ? '#16309B' : '#8A93AE' }}>{t.label}</span>
                </button>
              );
            })}
          </div>
        </main>
      </div>
    </div>
  );
};

export default PanelInterno;
