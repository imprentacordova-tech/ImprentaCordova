
export enum TrabajoTipo {
  SRI = 'sri',
  GENERAL = 'general'
}

export enum TrabajoEstado {
  PENDIENTE = 'Pendiente',
  EN_DISENO = 'En Diseño',
  PROCESO = 'En Proceso',
  VITRINA = 'Vitrina',
  ENTREGADO = 'Entregado'
}

export enum Regimen {
  NEGOCIO_POPULAR = 'Rimpe Negocio Popular',
  EMPRENDEDOR = 'Rimpe Emprendedor',
  GENERAL = 'General'
}

/**
 * Una fila de la sección "ESTABLECIMIENTOS REGISTRADOS" del certificado de RUC del SRI.
 *
 * `codigo` es el que va impreso en el talonario (3 dígitos: 001, 002...) y `estado` es
 * "ABIERTO" / "CERRADO" tal como lo publica el SRI. Ver `services/establecimientos.ts`
 * para la normalización de lo que llega desde el PDF o desde la lectura con IA.
 */
export interface EstablecimientoFiscal {
  codigo: string;
  nombre: string;
  direccion: string;
  tipo: string;
  estado: string;
}

export interface Cliente {
  id: string;
  cedula: string;
  ruc?: string;
  nombre: string;
  nombreComercial?: string;
  actividades?: string; 
  direccion?: string;
  notas?: string;
  telefono: string[];
  email?: string;
  creadoEn: string;
  regimen: Regimen;
  establecimientoPredeterminado?: string;
  puntoEmisionPredeterminado?: string;
  numEstablecimientosOpen?: number;
  fiscal_data?: {
    razon_social?: string;
    nombre_comercial?: string;
    estado_contribuyente?: string;
    clase_contribuyente?: string;
    tipo_contribuyente?: string;
    obligado_contabilidad?: boolean;
    actividades?: Array<{ codigo: string; descripcion: string }>;
    establecimientos?: EstablecimientoFiscal[];
    ultima_sincronizacion?: string;
  };
}

export interface Trabajo {
  id: string;
  orden: number;
  clienteId: string;
  titular: string;
  tipo: string;
  subtipo: string;
  cantidad: number;
  tamano: string;
  total: number;
  abono: number;
  saldo: number;
  estado: TrabajoEstado;
  fechaEntrada: string;
  fechaEntrega?: string;
  tiempoEntregaEstimado?: '24h' | '48h';
  caduco: boolean;
  fotoOriginalUrl?: string;
  fotoEvidenciaUrl?: string;
  fotoRetiroUrl?: string;
  creadoPor?: string;
  actualizadoPor?: string;
  establecimiento?: string;
  puntoEmision?: string;
  claveAcceso?: string;
  estadoClave: 'LISTA' | 'PENDIENTE' | 'ERROR'; 
  imprimirClave: boolean;
  origen?: 'Web' | 'Interno';
  esRenovacion?: boolean;
  prioridad?: 'Normal' | 'Urgente';
  historial?: StatusLog[];
  fechaVencimiento?: string;
  actividadSeleccionada?: string;
  arteAprobado?: boolean;
  esSRI?: boolean;
  responsable?: string;
  detalle?: string;
  observaciones?: string;
  numeracion?: string;
  autorizacion_sri?: string;
  /**
   * Modelo de impresión con el que se produce esta orden (ver `services/printModels.ts`).
   *
   * Se guarda como texto libre a propósito: el valor puede venir de una fila vieja o de la
   * extensión de Chrome, así que `resolverModelo()` lo valida y cae al default si no sirve.
   * Persistirlo es lo que hace que la variante sea un dato de la ORDEN y no de la pantalla:
   * la extensión y el documento de impresión hablan del mismo modo.
   */
  modeloImpresion?: string;
  /**
   * Marcado del trámite en la solicitud de autorización del SRI: `AUMENTO` | `CAMBIO` | `MISMO`
   * (ver `services/printModels.ts` → `marcadoTramite`).
   *
   * Lo declara el operador al tomar el pedido: NO se deduce de `esRenovacion`, porque una
   * renovación puede ser "Mismo" o "Aumento" según la cantidad pedida, y "Cambiar" si el
   * cliente modificó un dato. Texto libre a propósito, igual que `modeloImpresion`: puede
   * venir de una fila vieja o de la extensión, y `resolverTramite()` cae al default si no sirve.
   */
  tramiteSri?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Producto {
  id: string;
  nombre: string;
  descripcion: string;
  precio: number;
  categoria: string;
  esSRI?: boolean;
  imagenUrl?: string;
  specs?: string[];
  unit?: string;
  isPopular?: boolean;
  visiblePublico?: boolean;
  requiereDiseno?: boolean;
  manejaInventario?: boolean;
  codigoInterno?: string;
  tags?: string[];
  esActivo?: boolean;
  configCalculadora?: any;
  configuracionBase?: any;
  configuracionHabilitada?: {
      dimensiones?: boolean;
      volumen?: boolean;
      formato?: boolean;
      material?: boolean;
      acabados?: boolean;
      cromatismo?: boolean;
      procesosMecanicos?: boolean;
  };
}

export interface SriCredential {
  ruc: string;
  password?: string;
  origen?: string;
  updatedAt?: string;
}

export interface User {
  id: string;
  nombre: string;
  email?: string;
  rol: 'Admin' | 'Operador' | 'Diseñador';
  estado: 'Activo' | 'Inactivo';
  ultimoAcceso: string;
  password?: string;
  requirePassword?: boolean;
  avatar?: string;
}

export interface StatusLog {
  estado: TrabajoEstado;
  fecha: string;
  usuario: string;
}

export interface ChatMessage { role: 'user' | 'model'; text: string; }
export interface AIContentRequest { businessName: string; productType: string; tone: string; }
export interface DailySales { date: string; sales: number; }
export interface FinancialProjection { forecast: DailySales[]; lowTrafficDays: string[]; suggestion: string; }
export interface SupervisorAnalysis {
  estado: "VERDE" | "AMARILLO" | "ROJO";
  resumen: string;
  detalles: Array<{ tipo: "TECNICA" | "DISENO" | "COLOR" | "COMERCIAL"; descripcion: string; sugerencia: string; }>;
}
export interface ServiceItem { id: string; title: string; description: string; iconName: string; imageUrl: string; }
export enum ToneType { PROFESSIONAL = 'Profesional', CREATIVE = 'Creativo', PERSUASIVE = 'Persuasivo', FRIENDLY = 'Amigable' }
export interface ContactFormState { name: string; email: string; phone: string; message: string; }
export type ProductCategory = 'Todos' | 'Favoritos' | 'Oficina' | 'Gran Formato' | 'Merch' | 'Publicidad' | 'Tarjetas' | 'Sublimación' | 'Etiquetas';
export interface InventoryItem { id: string; item: string; cantidad: number; unidad: string; costoUnitario: number; minimo: number; proveedorId?: string; }
export interface Proveedor { id: string; nombre: string; categoria: string; tipo: 'Producto' | 'Servicio'; contacto: string; telefono: string; email?: string; website?: string; direccion?: string; ciudad?: string; productos?: string; notas?: string; estado: 'Activo' | 'Inactivo'; creadoEn: string; }
export interface TareaProveedor { id: string; proveedorId: string; titulo: string; tipo: 'General' | 'Mantenimiento'; descripcion?: string; fechaVencimiento: string; completada: boolean; }

export interface CostConfig {
  COSTO_RESMA_QUIMICO_ORIG: number;
  COSTO_RESMA_QUIMICO_COPIA: number;
  COSTO_RESMA_BOND: number;
  COSTO_PLIEGO_COUCHE_150: number;
  COSTO_PLIEGO_COUCHE_300: number;
  COSTO_PLIEGO_ADHESIVO: number;
  COSTO_DISENO_SRI: number;
  COSTO_PLACA_CTP: number;
  COSTO_PLACA_POLIESTER: number;
  COSTO_ARRANQUE: number;
  COSTO_MILLAR_IMPRESION: number;
  CLICK_DIGITAL_A3: number;
  CLICK_DIGITAL_BN: number;
  COSTO_CORTE: number;
  COSTO_BLOCK_ENCOLADO: number;
  COSTO_NUMERACION: number;
  MARGEN_GANANCIA: number;
  proveedoresPredeterminados: Record<string, string>;
}

export type EstadoFacturaSri = 'PENDIENTE' | 'PROCESANDO' | 'AUTORIZADO' | 'RECHAZADO' | 'ANULADO' | 'ERROR';

export interface FacturaDetalleItem {
  codigo: string;
  descripcion: string;
  cantidad: number;
  precioUnitario: number;
  descuento: number;
  precioTotal: number;
  iva: number;
}

export interface FacturaElectronica {
  id: string;
  trabajoId?: string;
  clienteId: string;
  claveAcceso: string;
  numeroFactura: string; // e.g. 001-001-000000123
  establecimiento: string; // 001
  puntoEmision: string; // 001
  secuencial: string; // 000000123
  fechaEmision: string;
  clienteNombre: string;
  clienteIdentificacion: string;
  clienteTipoId: 'RUC' | 'CEDULA' | 'PASAPORTE';
  clienteEmail?: string;
  clienteDireccion?: string;
  subtotalSinImpuestos: number;
  subtotal12: number;
  subtotal0: number;
  iva12: number;
  total: number;
  estado: EstadoFacturaSri;
  ambiente: 'PRUEBAS' | 'PRODUCCION';
  mensajesSri?: string[];
  fechaAutorizacion?: string;
  numeroAutorizacion?: string;
  xmlSignedUrl?: string;
  ridePdfUrl?: string;
  emailEnviado?: boolean;
  detalles: FacturaDetalleItem[];
  created_at?: string;
}

