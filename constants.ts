
import { TrabajoEstado } from './types';

export const APP_NAME = "Imprenta Córdova";
export const VALID_USERS = ['Pedro', 'Aleida', 'Roberto', 'Daniel', 'Dante'];

export const KANBAN_COLUMNS: TrabajoEstado[] = [
  TrabajoEstado.PENDIENTE,
  TrabajoEstado.EN_DISENO,
  TrabajoEstado.PROCESO,
  TrabajoEstado.VITRINA,
  TrabajoEstado.ENTREGADO
];

export const UI_TEXT = {
    LOGIN_TITLE: "Acceso Profesional",
    LOGIN_SUBTITLE: "Ingrese su nombre de usuario para continuar",
    LOGIN_BUTTON: "Ingresar",
    INVALID_PIN: "Usuario incorrecto. Intente de nuevo.",
    DASHBOARD: "Dashboard",
    KDS: "KDS",
    FINANZAS: "Finanzas",
    CLIENTES: "Clientes",
    NUEVO_PEDIDO: "Nuevo Pedido",
    CONFIGURACION: "Configuración",
    CERRAR_SESION: "Cerrar Sesión",
    BIENVENIDO: "Bienvenido",
    RESUMEN_DIARIO: "Resumen Diario",
    INGRESOS_HOY: "Ingresos (Hoy)",
    PEDIDOS_NUEVOS: "Pedidos Nuevos",
    SALDOS_PENDIENTES: "Saldos Pendientes",
    TOTAL_CLIENTES: "Total Clientes",
    INGRESOS_ULTIMOS_30_DIAS: "Ingresos en los últimos 30 días",
    TRABAJOS_POR_TIPO: "Trabajos por Tipo",
    CLIENTES_MAS_VALIOSOS: "Clientes Más Valiosos (LTV)",
    PASO_1_TITLE: "Paso 1: Buscar o Crear Cliente",
    PASO_2_TITLE: "Paso 2: Detalles del Trabajo",
    BUSCAR_CLIENTE: "Buscar por cédula o nombre...",
    CREAR_CLIENTE_BTN: "Crear Nuevo Cliente",
    SIGUIENTE_PASO: "Siguiente",
    PASO_ANTERIOR: "Anterior",
    TIPO_TRABAJO_SRI: "¿Documento autorizado SRI?",
    CANTIDAD: "Cantidad",
    ABONO: "Abono",
    SALDO: "Saldo",
    FINALIZAR_PEDIDO: "Finalizar Pedido",
};

export const SOURCE_PAPERS = [
    { id: 'QUIMICO', nombre: 'Papel Químico (Autocopiante)', ancho: 21.6, alto: 33, tipo: 'QUIMICO', costoBaseKey: 'COSTO_RESMA_QUIMICO_ORIG' },
    { id: 'BOND_75', nombre: 'Bond 75g (Estándar)', ancho: 21.6, alto: 33, tipo: 'RESMA', costoBaseKey: 'COSTO_RESMA_BOND' },
    { id: 'COUCHE_150', nombre: 'Couché 150g (Brillante)', ancho: 30.5, alto: 45.7, tipo: 'PLIEGO', costoBaseKey: 'COSTO_PLIEGO_COUCHE_150' },
    { id: 'COUCHE_300', nombre: 'Couché 300g (Premium)', ancho: 30.5, alto: 45.7, tipo: 'PLIEGO', costoBaseKey: 'COSTO_PLIEGO_COUCHE_300' },
    { id: 'ADHESIVO', nombre: 'Papel Adhesivo Glossy', ancho: 30.5, alto: 45.7, tipo: 'PLIEGO', costoBaseKey: 'COSTO_PLIEGO_ADHESIVO' },
];

export const DEFAULT_COSTS = {
    // --- Papelería (Insumos) ---
    COSTO_RESMA_QUIMICO_ORIG: 14.50, // Precio promedio Ecuador resma original
    COSTO_RESMA_QUIMICO_COPIA: 12.00, // Precio promedio Ecuador resma copia
    COSTO_RESMA_BOND: 4.50,          // Resma Bond 75g A4/Oficio
    COSTO_PLIEGO_COUCHE_150: 0.18,   // Costo por pliego A3+ aprox
    COSTO_PLIEGO_COUCHE_300: 0.28,   // Costo por pliego A3+ aprox
    COSTO_PLIEGO_ADHESIVO: 0.35,     // Costo por pliego A3+ aprox

    // --- Pre-Prensa ---
    COSTO_DISENO_SRI: 5.00,          // Tasa estándar por diagramación facturas
    COSTO_PLACA_CTP: 6.50,           // Placa GTO/Heidelberg
    COSTO_PLACA_POLIESTER: 3.50,     // Placa económica
    
    // --- Impresión Offset ---
    COSTO_ARRANQUE: 18.00,           // Setup máquina por color
    COSTO_MILLAR_IMPRESION: 3.50,    // Mano de obra + tinta por millar
    
    // --- Impresión Digital ---
    CLICK_DIGITAL_A3: 0.22,          // Costo clic láser color (SRA3)
    CLICK_DIGITAL_BN: 0.04,          // Costo clic B/N

    // --- Acabados ---
    COSTO_CORTE: 1.50,               // Guillotina por trabajo
    COSTO_BLOCK_ENCOLADO: 0.25,      // Armado de block (50/100 hjs)
    COSTO_NUMERACION: 4.50,          // Numerado por cada 1000

    // --- Negocio ---
    MARGEN_GANANCIA: 0.45,           // 45% de utilidad base

    proveedoresPredeterminados: {}
};

