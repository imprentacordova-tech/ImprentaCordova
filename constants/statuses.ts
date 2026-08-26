import { TrabajoEstado } from '../types';

export interface StatusConfig {
  label: string;
  color: string;
  bg: string;
  border: string;
  dot: string;
}

export const STATUS_CONFIG: Record<string, StatusConfig> = {
  [TrabajoEstado.PENDIENTE]: {
    label: 'Pendiente',
    color: 'text-amber-400',
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/20',
    dot: 'bg-amber-400',
  },
  [TrabajoEstado.EN_DISENO]: {
    label: 'En Diseño',
    color: 'text-purple-400',
    bg: 'bg-purple-500/10',
    border: 'border-purple-500/20',
    dot: 'bg-purple-400',
  },
  [TrabajoEstado.PROCESO]: {
    label: 'En Proceso',
    color: 'text-brand-blue',
    bg: 'bg-brand-blue/10',
    border: 'border-brand-blue/20',
    dot: 'bg-brand-blue',
  },
  [TrabajoEstado.VITRINA]: {
    label: 'Vitrina',
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/20',
    dot: 'bg-emerald-400',
  },
  [TrabajoEstado.ENTREGADO]: {
    label: 'Entregado',
    color: 'text-slate-500',
    bg: 'bg-slate-500/10',
    border: 'border-slate-500/20',
    dot: 'bg-slate-500',
  },
};

export const SRI_KEY_STATUS: Record<string, { label: string; color: string; bg: string; border: string }> = {
  'LISTA':     { label: 'Lista',     color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
  'PENDIENTE': { label: 'Pendiente', color: 'text-amber-400',   bg: 'bg-amber-500/10',   border: 'border-amber-500/20' },
  'ERROR':     { label: 'Error',     color: 'text-brand-red',   bg: 'bg-brand-red/10',   border: 'border-brand-red/20' },
};

export const TRABAJO_TIPO_LABELS: Record<string, string> = {
  'sri':    'SRI',
  'general': 'Comercial',
};
