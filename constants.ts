
import { TrabajoEstado } from './types';

export const APP_NAME = "Imprenta Cordova";
export const VALID_USERS = ['Pedro', 'Aleida', 'Roberto', 'Daniel', 'Dante'];

export const KANBAN_COLUMNS: TrabajoEstado[] = [
  TrabajoEstado.PENDIENTE,
  TrabajoEstado.EN_DISENO,
  TrabajoEstado.PROCESO,
  TrabajoEstado.VITRINA,
  TrabajoEstado.ENTREGADO
];

export const DEFAULT_IVA_RATE = 0.12;

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
    CONFIGURACION: "Configuracion",
    CERRAR_SESION: "Cerrar Sesion",
    BIENVENIDO: "Bienvenido",
    RESUMEN_DIARIO: "Resumen Diario",
    INGRESOS_HOY: "Ingresos (Hoy)",
    PEDIDOS_NUEVOS: "Pedidos Nuevos",
    SALDOS_PENDIENTES: "Saldos Pendientes",
    TOTAL_CLIENTES: "Total Clientes",
    INGRESOS_ULTIMOS_30_DIAS: "Ingresos en los ultimos 30 dias",
    TRABAJOS_POR_TIPO: "Trabajos por Tipo",
    CLIENTES_MAS_VALIOSOS: "Clientes Mas Valiosos (LTV)",
    PASO_1_TITLE: "Paso 1: Buscar o Crear Cliente",
    PASO_2_TITLE: "Paso 2: Detalles del Trabajo",
    BUSCAR_CLIENTE: "Buscar por cedula o nombre...",
    CREAR_CLIENTE_BTN: "Crear Nuevo Cliente",
    SIGUIENTE_PASO: "Siguiente",
    PASO_ANTERIOR: "Anterior",
    TIPO_TRABAJO_SRI: "Documento autorizado SRI?",
    CANTIDAD: "Cantidad",
    ABONO: "Abono",
    SALDO: "Saldo",
    FINALIZAR_PEDIDO: "Finalizar Pedido",
};

export const SOURCE_PAPERS = [
    { id: 'QUIMICO', nombre: 'Papel Quimico (Autocopiante)', ancho: 21.6, alto: 33, tipo: 'QUIMICO', costoBaseKey: 'COSTO_RESMA_QUIMICO_ORIG' },
    { id: 'BOND_75', nombre: 'Bond 75g (Estandar)', ancho: 21.6, alto: 33, tipo: 'RESMA', costoBaseKey: 'COSTO_RESMA_BOND' },
    { id: 'COUCHE_150', nombre: 'Couche 150g (Brillante)', ancho: 30.5, alto: 45.7, tipo: 'PLIEGO', costoBaseKey: 'COSTO_PLIEGO_COUCHE_150' },
    { id: 'COUCHE_300', nombre: 'Couche 300g (Premium)', ancho: 30.5, alto: 45.7, tipo: 'PLIEGO', costoBaseKey: 'COSTO_PLIEGO_COUCHE_300' },
    { id: 'ADHESIVO', nombre: 'Papel Adhesivo Glossy', ancho: 30.5, alto: 45.7, tipo: 'PLIEGO', costoBaseKey: 'COSTO_PLIEGO_ADHESIVO' },
];

export const DEFAULT_COSTS = {
    COSTO_RESMA_QUIMICO_ORIG: 14.50,
    COSTO_RESMA_QUIMICO_COPIA: 12.00,
    COSTO_RESMA_BOND: 4.50,
    COSTO_PLIEGO_COUCHE_150: 0.18,
    COSTO_PLIEGO_COUCHE_300: 0.28,
    COSTO_PLIEGO_ADHESIVO: 0.35,
    COSTO_DISENO_SRI: 5.00,
    COSTO_PLACA_CTP: 6.50,
    COSTO_PLACA_POLIESTER: 3.50,
    COSTO_ARRANQUE: 18.00,
    COSTO_MILLAR_IMPRESION: 3.50,
    CLICK_DIGITAL_A3: 0.22,
    CLICK_DIGITAL_BN: 0.04,
    COSTO_CORTE: 1.50,
    COSTO_BLOCK_ENCOLADO: 0.25,
    COSTO_NUMERACION: 4.50,
    MARGEN_GANANCIA: 0.45,
    proveedoresPredeterminados: {}
};
