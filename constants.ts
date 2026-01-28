
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
