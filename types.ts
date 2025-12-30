
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
  // Nuevos campos para automatización SRI
  establecimientoPredeterminado?: string; // Ej: 001
  puntoEmisionPredeterminado?: string;    // Ej: 001
  numEstablecimientosOpen?: number;
}

export interface Trabajo {
  id: string;
  orden: number;
  clienteId: string;
  titular: string;
  tipo: TrabajoTipo;
  subtipo: string;
  cantidad: number;
  tamano: string;
  total: number;
  abono: number;
  saldo: number;
  estado: TrabajoEstado;
  fechaEntrada: string;
  fechaEntrega?: string;
  caduco: boolean;
  fotoOriginalUrl?: string;
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
  email: string;
  rol: 'Admin' | 'Operador' | 'Diseñador';
  estado: 'Activo' | 'Inactivo';
  ultimoAcceso: string;
  password?: string;
  requirePassword?: boolean;
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
export interface InventoryItem { id: string; item: string; cantidad: number; unidad: string; costoUnitario: number; minimo: number; }
export interface Proveedor { id: string; nombre: string; categoria: string; tipo: 'Producto' | 'Servicio'; contacto: string; telefono: string; email?: string; website?: string; direccion?: string; ciudad?: string; productos?: string; notas?: string; estado: 'Activo' | 'Inactivo'; creadoEn: string; }
export interface TareaProveedor { id: string; proveedorId: string; titulo: string; tipo: 'General' | 'Mantenimiento'; descripcion?: string; fechaVencimiento: string; completada: boolean; }
