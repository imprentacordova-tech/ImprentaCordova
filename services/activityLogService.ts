import { supabase } from './supabase';

/**
 * Activity Log Service — Sistema de Registro de Actividad tipo Blockchain
 * 
 * Registra TODOS los movimientos de usuarios en el sistema.
 * Ahora persiste en Supabase para acceso global.
 */

export interface ActivityEntry {
  id: string;
  timestamp: string;
  usuario: string;
  rol: string;
  accion: ActivityAction;
  detalle: string;
  modulo: string;
  ip?: string;
  hash: string; // Hash encadenado tipo blockchain
}

export type ActivityAction = 
  | 'LOGIN'
  | 'LOGOUT'
  | 'CREAR_ORDEN'
  | 'EDITAR_ORDEN'
  | 'CAMBIO_ESTADO'
  | 'RETIRO_PROCESADO'
  | 'CREAR_CLIENTE'
  | 'EDITAR_CLIENTE'
  | 'CREAR_USUARIO'
  | 'EDITAR_USUARIO'
  | 'TOGGLE_USUARIO'
  | 'CAMBIO_CONFIG'
  | 'SYNC_CLOUD'
  | 'SEED_CATALOGO'
  | 'EXPORTAR_PDF'
  | 'ENVIAR_WHATSAPP'
  | 'ABONO_REGISTRADO'
  | 'ARTE_APROBADO'
  | 'FOTO_CAPTURADA'
  | 'CREAR_PROVEEDOR'
  | 'EDITAR_PROVEEDOR'
  | 'BORRAR_PROVEEDOR'
  | 'AGENDAR_TAREA'
  | 'COMPLETAR_TAREA'
  | 'ACCESO_MODULO'
  | 'FINALIZADO_DIRECTO'
  | 'SRI_SCAN_FAILURE'
  | 'ALERTA_STOCK'
  | 'SOLICITUD_WEB'
  | (string & {});

/**
 * Genera un hash simple encadenado (simula blockchain).
 */
function generateHash(data: string, previousHash: string): string {
  let hash = 0;
  const combined = previousHash + data;
  for (let i = 0; i < combined.length; i++) {
    const char = combined.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return Math.abs(hash).toString(16).padStart(8, '0');
}

/**
 * Obtiene las entradas del log desde Supabase
 */
export async function getActivityLog(limit = 100): Promise<ActivityEntry[]> {
  try {
    const { data, error } = await supabase
      .from('activity_log')
      .select('*')
      .order('timestamp', { ascending: false })
      .limit(limit);

    if (error) throw error;

    return (data || []).map(row => ({
      id: row.id,
      timestamp: row.timestamp,
      usuario: row.user_name,
      rol: row.rol || 'Operador', // Campo opcional en DB
      accion: row.action as ActivityAction,
      detalle: row.details,
      modulo: row.module,
      ip: row.ip_address,
      hash: row.hash,
    }));
  } catch (err) {
    console.error('[ActivityLog] Error al obtener logs:', err);
    return [];
  }
}

/**
 * Registra una nueva actividad.
 */
export async function logActivity(
  usuario: string,
  rol: string, 
  accion: ActivityAction,
  detalle: string,
  modulo: string
): Promise<void> {
  try {
    // Para el hash blockchain, necesitamos el último hash registrado
    const { data: lastEntry } = await supabase
      .from('activity_log')
      .select('hash')
      .order('timestamp', { ascending: false })
      .limit(1)
      .single();

    const previousHash = lastEntry?.hash || '00000000';
    const timestamp = new Date().toISOString();
    const entryData = `${usuario}|${accion}|${detalle}|${timestamp}`;
    const hash = generateHash(entryData, previousHash);

    const { error } = await supabase
      .from('activity_log')
      .insert([{
        user_name: usuario,
        rol: rol,
        action: accion,
        details: detalle,
        module: modulo,
        hash: hash,
        timestamp: timestamp
      }]);

    if (error) throw error;
  } catch (e) {
    console.warn('[ActivityLog] Error al registrar:', e);
  }
}

/**
 * Auto-purga: Ahora manejado opcionalmente o por cron en Supabase.
 * Aquí mantenemos la compatibilidad de firma.
 */
export async function purgeOldEntries(): Promise<number> {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 90);
  
  const { count, error } = await supabase
    .from('activity_log')
    .delete({ count: 'exact' })
    .lt('timestamp', cutoff.toISOString());

  if (error) return 0;
  return count || 0;
}

/**
 * Filtra el log por criterios en Supabase
 */
export async function filterLog(filters: {
  usuario?: string;
  accion?: ActivityAction;
  modulo?: string;
  desde?: string;
  hasta?: string;
}): Promise<ActivityEntry[]> {
  let query = supabase.from('activity_log').select('*');
  
  if (filters.usuario) query = query.ilike('user_name', `%${filters.usuario}%`);
  if (filters.accion) query = query.eq('action', filters.accion);
  if (filters.modulo) query = query.eq('module', filters.modulo);
  if (filters.desde) query = query.gte('timestamp', filters.desde);
  if (filters.hasta) query = query.lte('timestamp', filters.hasta);
  
  const { data, error } = await query.order('timestamp', { ascending: false });

  if (error) return [];
  
  return (data || []).map(row => ({
    id: row.id,
    timestamp: row.timestamp,
    usuario: row.user_name,
    rol: row.rol || 'Operador',
    accion: row.action as ActivityAction,
    detalle: row.details,
    modulo: row.module,
    hash: row.hash,
  }));
}

/**
 * Obtiene estadísticas básicas
 */
export async function getLogStats() {
  const { count: total } = await supabase.from('activity_log').select('*', { count: 'exact', head: true });
  
  const today = new Date();
  today.setHours(0,0,0,0);
  const { count: todayEntries } = await supabase
    .from('activity_log')
    .select('*', { count: 'exact', head: true })
    .gte('timestamp', today.toISOString());

  return {
    totalEntries: total || 0,
    uniqueUsers: 0, // Requeriría un query más complejo para contar distintos
    todayEntries: todayEntries || 0,
    storageUsedKB: 0, // No aplicable directamente a Supabase storage
    oldestEntry: null,
    newestEntry: null,
  };
}

/**
 * Convierte un array de entradas a formato CSV.
 */
export function exportLogAsCSV(entries: ActivityEntry[]): string {
  if (!entries || entries.length === 0) return 'Fecha,Usuario,Acción,Detalle,Módulo,Hash';
  
  const headers = ['Fecha', 'Usuario', 'Acción', 'Detalle', 'Módulo', 'Hash'];
  const rows = entries.map(e => [
    new Date(e.timestamp).toLocaleString('es-EC'),
    e.usuario,
    e.accion,
    `"${e.detalle.replace(/"/g, '""')}"`,
    e.modulo,
    e.hash
  ]);
  
  return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
}

export async function clearLog(): Promise<void> {
  await supabase.from('activity_log').delete().neq('id', '0'); // Dangerous but requested
}
