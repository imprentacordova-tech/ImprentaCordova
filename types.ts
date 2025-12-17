
import React from 'react';

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

export interface SriCredential {
  ruc: string;
  password?: string;
  origen?: string; // 'Manual', 'Chrome', etc.
  updatedAt?: string;
}

export interface Cliente {
  id: string;
  cedula: string;
  ruc?: string;
  nombre: string;
  nombreComercial?: string;
  direccion?: string;
  notas?: string;
  telefono: string[];
  email?: string;
  creadoEn: string;
  regimen: Regimen;
}

export interface TrabajoSpecs {
  producto?: string;
  material?: string;
  medidas?: string; // "10x15 cm"
  impresion?: string; // "4/0", "4/4"
  acabados?: string[]; // ["Laminado", "Troquelado"]
}

export interface TrabajoDiseno {
  estado: 'Cliente Provee' | 'Requiere Diseño';
  archivoUrl?: string;
  designerId?: string;
  driveLink?: string;
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
  fechaEntrega?: string; // Fecha PACTADA
  fechaVencimiento?: string; // Legacy support (alias for fechaEntrega)
  caduco: boolean;
  fotoOriginalUrl?: string;
  creadoPor?: string;
  actualizadoPor?: string;
  establecimiento?: string;
  puntoEmision?: string;
  claveAcceso?: string;
  origen?: 'Web' | 'Interno';
  esRenovacion?: boolean;
  
  // New Fields for Enhanced Order Management
  prioridad?: 'Normal' | 'Urgente';
  specs?: TrabajoSpecs;
  diseno?: TrabajoDiseno;
  metodoPago?: 'Efectivo' | 'Transferencia' | 'Tarjeta';
  descuento?: number;
  costoDiseno?: number;
  iva?: boolean;
}

export interface Kpi {
    title: string;
    metric: string;
    tag?: string;
    icon: React.ComponentType<{ className?: string }>;
    variant: 'blue' | 'green' | 'purple' | 'red' | 'gray' | 'orange';
}

export interface Producto {
  id: string;
  nombre: string;
  descripcion: string;
  precio: number;
  categoria: string;
  esSRI?: boolean;
  imagenUrl?: string;
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

export interface InventoryItem {
  id: string;
  item: string;
  cantidad: number;
  unidad: string;
  costoUnitario: number;
  minimo: number;
}

export interface Proveedor {
  id: string;
  nombre: string;
  categoria: string;
  tipo: 'Producto' | 'Servicio';
  productos?: string;
  ciudad?: string;
  website?: string;
  contacto: string;
  telefono: string;
  email?: string;
  direccion?: string;
  notas?: string;
  estado: 'Activo' | 'Inactivo';
  creadoEn: string;
}

export interface TareaProveedor {
  id: string;
  proveedorId: string;
  titulo: string;
  tipo: 'General' | 'Mantenimiento';
  descripcion: string;
  fechaVencimiento: string;
  completada: boolean;
}

export interface AIContentRequest {
  businessName: string;
  productType: string;
  tone: string;
}

export interface ServiceItem {
  id: string;
  title: string;
  description: string;
  iconName: string;
  imageUrl: string;
}

export enum ToneType {
  PROFESSIONAL = 'Profesional',
  FRIENDLY = 'Amigable',
  CREATIVE = 'Creativo',
  URGENT = 'Urgente',
  FORMAL = 'Formal'
}

export interface ContactFormState {
  name: string;
  email: string;
  phone: string;
  message: string;
}

export type ProductCategory = string;

export interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  unit: string;
  description: string;
  specs: string[];
  imageUrl: string;
  isPopular?: boolean;
}

export interface DailySales {
    date: string; // YYYY-MM-DD
    sales: number;
}

export interface FinancialProjection {
    forecast: DailySales[];
    lowTrafficDays: string[];
    suggestion: string;
}
