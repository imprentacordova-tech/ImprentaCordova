export interface ServiceItem {
  id: string;
  title: string;
  description: string;
  iconName: string; // Mapping to Lucide icons string
  imageUrl: string;
}

export interface AIContentRequest {
  businessName: string;
  productType: string;
  tone: string;
}

export enum ToneType {
  PROFESSIONAL = 'Profesional',
  CREATIVE = 'Creativo',
  URGENT = 'Urgente (Promoción)',
  ELEGANT = 'Elegante'
}

export interface ContactFormState {
  name: string;
  email: string;
  phone: string;
  message: string;
}

export type ProductCategory = 'Todos' | 'Tarjetas' | 'Publicidad' | 'Gran Formato' | 'Oficina' | 'Merch';

export interface Product {
  id: string;
  name: string;
  category: ProductCategory;
  price: number;
  unit: string; // e.g., "x 1000", "unidad", "m2"
  description: string;
  specs: string[];
  imageUrl: string;
  isPopular?: boolean;
}