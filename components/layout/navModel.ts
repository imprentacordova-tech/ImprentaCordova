/**
 * Modelo de navegación del panel interno — Imprenta Córdova
 * =========================================================
 *
 * Qué módulos existen, en qué grupo van, qué atajo tienen y cómo se titula cada
 * pantalla. Es DATO, no interfaz: vivía dentro de `components/Layout.tsx` (956
 * líneas) mezclado con el JSX del sidebar, así que agregar un módulo obligaba a
 * abrir el archivo más grande del shell y nadie podía probar el menú sin montar
 * React. Separado, se puede verificar con una prueba de lógica pura
 * (`__tests__/components/navModel.test.ts`).
 *
 * Si agregás una ruta: sumala al grupo que corresponda Y a `PAGE_TITLES`.
 */
import {
    UsersIcon, Cog8ToothIcon,
    DashboardIcon, CalculatorIcon, PaletteIcon,
    SparklesIcon, RocketLaunchIcon,
    ActivityIcon, WalletIcon, CircleStackIcon, ShieldCheckIcon,
    MonitorIcon,
    GlobeIcon,
    ReceiptIcon, HistoryIcon, PuzzlePieceIcon,
    Box, Layers, GlobeAltIcon
} from '../Icons';
import manifestExtension from '../../sri-chrome-extension/Solicitador de documentos/Extension_Imprenta_Cordova/manifest.json';

/** Una fila del menú. `badge` es la CLAVE del contador, no el número. */
export interface NavItemModel {
    path: string;
    label: string;
    icon: any;
    badge: string | null;
}

export interface NavGroupModel {
    id: string;
    title: string;
    items: NavItemModel[];
}

/**
 * Atajos globales, espejo de `hooks/useKeyboardShortcuts.ts`.
 *
 * El sistema YA tenía atajos (Alt+D, Alt+N, Alt+C…) pero eran completamente invisibles:
 * nadie los descubre. Mostrarlos en el menú es lo que los convierte en una herramienta.
 * Si agregás un atajo en el hook, agregalo acá.
 */
export const ATAJOS: Record<string, string> = {
    '/dashboard':   'D',
    '/trabajos':    'T',
    '/nuevo':       'N',
    '/retiros':     'R',
    '/kds':         'K',
    '/inventario':  'I',
    '/clientes':    'C',
    '/facturacion': 'F',
};

/**
 * La acción más frecuente del negocio (tomar un pedido en el mostrador) se destaca como
 * botón principal, no como una fila más del menú: es lo que Pedro hace decenas de veces
 * por día y tenía el mismo peso visual que "Descargar Extensión".
 */
export const RUTA_CTA = '/nuevo';

export const buildNavGroups = (isAdmin: boolean): NavGroupModel[] => [
    {
        id: 'operaciones',
        title: 'Operaciones',
        items: [
            { path: '/dashboard',  label: 'Panel Principal',       icon: DashboardIcon,   badge: null },
            { path: '/trabajos',   label: 'Órdenes',               icon: ActivityIcon,    badge: 'ordenes' },
            { path: '/nuevo',      label: 'Nueva Orden',           icon: SparklesIcon,    badge: null },
            { path: '/solicitudes', label: 'Solicitudes Web',      icon: GlobeAltIcon,    badge: 'solicitudes' },
            { path: '/retiros',    label: 'Despacho',              icon: RocketLaunchIcon, badge: null },
        ],
    },
    {
        id: 'taller',
        title: 'Taller',
        items: [
            { path: '/kds',        label: 'Monitor de Taller',     icon: MonitorIcon,     badge: null },
            { path: '/diseno',     label: 'Diseño Gráfico',        icon: PaletteIcon,     badge: null },
            { path: '/produccion', label: 'Flujo de Producción',   icon: Layers,          badge: null },
            { path: '/inventario', label: 'Bodega de Insumos',     icon: CircleStackIcon, badge: 'stock' },
            { path: '/productos',  label: 'Catálogo de Productos', icon: Box,             badge: null },
        ],
    },
    {
        id: 'finanzas',
        title: 'Finanzas',
        items: [
            { path: '/cuentas',     label: 'Cuentas por Cobrar',  icon: WalletIcon,       badge: 'cobrar' },
            { path: '/facturacion', label: 'Facturación SRI',     icon: ReceiptIcon,      badge: null },
            { path: '/finanzas',    label: 'Flujo de Caja',        icon: ReceiptIcon,      badge: null },
            { path: '/calculadora', label: 'Calculadora',          icon: CalculatorIcon,   badge: null },
        ],
    },
    {
        id: 'entidades',
        title: 'Entidades',
        items: [
            { path: '/clientes',    label: 'Clientes',             icon: UsersIcon,        badge: null },
            { path: '/proveedores', label: 'Proveedores',          icon: GlobeIcon,        badge: null },
        ],
    },
    ...(isAdmin ? [{
        id: 'sistema',
        title: 'Sistema',
        items: [
            { path: '/usuarios',      label: 'Usuarios',           icon: ShieldCheckIcon,  badge: null },
            { path: '/registro',      label: 'Auditoría',          icon: HistoryIcon,      badge: null },
            { path: '/configuracion', label: 'Configuración',      icon: Cog8ToothIcon,    badge: null },
            { path: '/extension-cordova.zip', label: 'Descargar Extensión', icon: PuzzlePieceIcon, badge: `v${manifestExtension.version}` },
        ],
    }] : []),
];

export const PAGE_TITLES: Record<string, string> = {
    '/dashboard':     'Panel Principal',
    '/trabajos':      'Órdenes de Producción',
    '/nuevo':         'Nueva Orden',
    '/retiros':       'Despacho y Entregas',
    '/solicitudes':   'Solicitudes Web',
    '/kds':           'Monitor de Taller',
    '/diseno':        'Diseño Gráfico',
    '/inventario':    'Bodega de Insumos',
    '/cuentas':       'Cuentas por Cobrar',
    '/facturacion':   'Facturación Electrónica SRI',
    '/finanzas':      'Flujo de Caja',
    '/calculadora':   'Calculadora de Precios',
    '/clientes':      'Directorio de Clientes',
    '/proveedores':   'Gestión de Proveedores',
    '/productos':     'Catálogo de Productos',
    '/produccion':    'Flujo de Producción',
    '/usuarios':      'Gestión de Usuarios',
    '/registro':      'Auditoría del Sistema',
    '/configuracion': 'Configuración General',
};
