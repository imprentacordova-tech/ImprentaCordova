/**
 * Lógica del tablero de taller (KDS) — Imprenta Córdova
 * =====================================================
 *
 * Funciones puras del monitor de producción. Estaban dentro de `pages/KDS.tsx`, donde
 * no se podían testear; acá quedan verificables.
 *
 * IDEA CENTRAL: todas reciben `ahora` como parámetro en vez de leer `Date.now()` por
 * dentro. Eso permite que la pantalla avance con un reloj de React (cada 30 s) y que los
 * tiempos mostrados no se congelen cuando no llega ningún evento — antes una tarjeta
 * podía decir "2 h" durante horas sin que nadie lo note.
 *
 * Contexto: CONTINUITY_RULES.md exige que la interfaz del taller sea "libre de atascos"
 * y refleje "órdenes frescas al instante".
 */

import { Trabajo } from '../types';

const MS_DIA = 86400000;
const MS_HORA = 3600000;
const MS_MINUTO = 60000;

/** Momento de referencia de una orden: cuándo entró o cuándo se tocó por última vez. */
const baseTemporal = (t: Trabajo): number => {
  const raw = t.updated_at || t.fechaEntrada;
  if (!raw) return 0;
  const ts = new Date(raw).getTime();
  return Number.isNaN(ts) ? 0 : ts;
};

/**
 * ¿La orden exige atención inmediata?
 *
 * Es urgente si el operador la marcó como tal, o si vence en menos de 24 h. El segundo
 * criterio es el que evita que una orden se pase de fecha sin que nadie la mire.
 */
export const esUrgente = (t: Trabajo, ahora: number): boolean => {
  if (t.prioridad === 'Urgente') return true;
  const objetivo = t.fechaEntrega || t.fechaVencimiento;
  if (!objetivo) return false;
  const ts = new Date(objetivo).getTime();
  if (Number.isNaN(ts)) return false;
  return (ts - ahora) / MS_DIA < 1;
};

/** Tiempo transcurrido en la etapa actual, en formato corto ("3 h 12 m"). */
export const tiempoEnEtapa = (t: Trabajo, ahora: number, vacio = '—'): string => {
  const base = baseTemporal(t);
  if (!base) return vacio;
  const diff = ahora - base;
  // Reloj del equipo adelantado o fecha futura: no mostrar negativos.
  if (diff < 0) return vacio;
  const h = Math.floor(diff / MS_HORA);
  const m = Math.floor((diff % MS_HORA) / MS_MINUTO);
  return h > 0 ? `${h} h ${m} m` : `${m} m`;
};

/** Texto relativo para el indicador de frescura ("hace 12 s", "hace 4 min"). */
export const hace = (ts: number | null, ahora: number, sinDato = 'sin sincronizar'): string => {
  if (!ts) return sinDato;
  const s = Math.max(0, Math.floor((ahora - ts) / 1000));
  if (s < 60) return `hace ${s} s`;
  const m = Math.floor(s / 60);
  if (m < 60) return `hace ${m} min`;
  return `hace ${Math.floor(m / 60)} h`;
};

/**
 * Orden de las tarjetas dentro de una columna: primero lo urgente, después lo más
 * atascado (lo que lleva más tiempo sin moverse).
 *
 * Sin esto las tarjetas salían en el orden crudo de la tabla (fecha de entrada desc),
 * así que una orden urgente podía quedar enterrada debajo de veinte normales y una orden
 * frenada tres días no se distinguía de una recién creada.
 */
export const compararParaTaller = (a: Trabajo, b: Trabajo, ahora: number): number => {
  const urgA = esUrgente(a, ahora) ? 0 : 1;
  const urgB = esUrgente(b, ahora) ? 0 : 1;
  if (urgA !== urgB) return urgA - urgB;
  return baseTemporal(a) - baseTemporal(b);
};

export type SlaStatus = 'vencido' | 'alerta' | 'a_tiempo' | 'sin_fecha';

export interface SlaInfo {
  status: SlaStatus;
  label: string;
  detalle: string;
  horasRestantes: number | null;
  urgente: boolean;
  color: string;
  bg: string;
  border: string;
  dot: string;
}

/**
 * Semáforo de tiempos y SLA para monitoreo de compromisos en taller.
 *
 * Verde: > 4 horas hasta la fecha de entrega comprometida.
 * Amarillo: Menos de 4 horas para entrega (o vence hoy).
 * Rojo: Fecha de entrega vencida.
 */
export const calcularSla = (t: Trabajo, ahora: number): SlaInfo => {
  const objetivo = t.fechaEntrega || t.fechaVencimiento;
  if (!objetivo) {
    return {
      status: 'sin_fecha',
      label: 'Sin fecha límite',
      detalle: 'No especificada',
      horasRestantes: null,
      urgente: t.prioridad === 'Urgente',
      color: '#64748B',
      bg: '#F1F5F9',
      border: '#CBD5E1',
      dot: '#94A3B8',
    };
  }

  const ts = new Date(objetivo).getTime();
  if (Number.isNaN(ts)) {
    return {
      status: 'sin_fecha',
      label: 'Fecha inválida',
      detalle: 'Error de formato',
      horasRestantes: null,
      urgente: t.prioridad === 'Urgente',
      color: '#64748B',
      bg: '#F1F5F9',
      border: '#CBD5E1',
      dot: '#94A3B8',
    };
  }

  const diff = ts - ahora;
  const horas = Math.floor(Math.abs(diff) / MS_HORA);
  const minutos = Math.floor((Math.abs(diff) % MS_HORA) / MS_MINUTO);

  if (diff < 0) {
    return {
      status: 'vencido',
      label: 'RETRASADO',
      detalle: horas > 24 ? `Venció hace ${Math.floor(horas / 24)}d` : `Venció hace ${horas}h ${minutos}m`,
      horasRestantes: -(horas + minutos / 60),
      urgente: true,
      color: '#DC2626',
      bg: '#FEF2F2',
      border: '#FECACA',
      dot: '#EF4444',
    };
  }

  if (diff < 4 * MS_HORA || t.prioridad === 'Urgente') {
    return {
      status: 'alerta',
      label: 'ENTREGA HOY',
      detalle: horas > 0 ? `Quedan ${horas}h ${minutos}m` : `Quedan ${minutos} min`,
      horasRestantes: horas + minutos / 60,
      urgente: true,
      color: '#D97706',
      bg: '#FFFBEB',
      border: '#FDE68A',
      dot: '#F59E0B',
    };
  }

  return {
    status: 'a_tiempo',
    label: 'A TIEMPO',
    detalle: horas > 24 ? `En ${Math.floor(horas / 24)} días` : `En ${horas}h`,
    horasRestantes: horas + minutos / 60,
    urgente: false,
    color: '#16A34A',
    bg: '#F0FDF4',
    border: '#BBF7D0',
    dot: '#22C55E',
  };
};

/**
 * Extrae la numeración de una orden anterior y sugiere la siguiente secuencia correlativa
 * para renovaciones express (ej: "000501 al 000600" con 100 u. -> "000601 al 000700").
 */
export const sugerirSiguienteNumeracion = (
  numeracionAnterior?: string,
  cantidad: number = 100
): { inicio: number; fin: number; textoSugerido: string } => {
  const matches = (numeracionAnterior || '').match(/\d+/g);
  if (!matches || matches.length === 0) {
    return {
      inicio: 1,
      fin: cantidad,
      textoSugerido: `000001 al ${String(cantidad).padStart(6, '0')}`,
    };
  }

  // Tomamos el último número encontrado en la cadena
  const ultimoStr = matches[matches.length - 1];
  const ultimoNum = parseInt(ultimoStr, 10);

  if (isNaN(ultimoNum) || ultimoNum <= 0) {
    return {
      inicio: 1,
      fin: cantidad,
      textoSugerido: `000001 al ${String(cantidad).padStart(6, '0')}`,
    };
  }

  const inicio = ultimoNum + 1;
  const fin = ultimoNum + cantidad;
  const padLength = Math.max(ultimoStr.length, 6);

  return {
    inicio,
    fin,
    textoSugerido: `${String(inicio).padStart(padLength, '0')} al ${String(fin).padStart(padLength, '0')}`,
  };
};

/**
 * Tareas operativas recomendadas por fase para el monitor de taller.
 */
export interface ChecklistItem {
  id: string;
  label: string;
}

export const CHECKLIST_POR_FASE: Record<string, ChecklistItem[]> = {
  'En Diseño': [
    { id: 'diseno_montado', label: 'Montaje de arte listo' },
    { id: 'prueba_enviada', label: 'Prueba digital enviada por WhatsApp' },
    { id: 'arte_aprobado', label: 'Aprobación del cliente confirmada' },
  ],
  'En Proceso': [
    { id: 'papel_cortado', label: 'Corte de papel y sustratos' },
    { id: 'planchas_ctp', label: 'Planchas quemadas / CTP' },
    { id: 'impresion_ok', label: 'Impresión en máquina' },
    { id: 'numerado_acabado', label: 'Numerado, perforado o troquelado' },
    { id: 'encuadernacion', label: 'Encolado, engrapado y empacado' },
  ],
};
