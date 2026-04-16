/**
 * Activity Log Service — Sistema de Registro de Actividad tipo Blockchain
 * 
 * Registra TODOS los movimientos de usuarios en el sistema.
 * Auto-purga registros de más de 3 meses para no saturar almacenamiento.
 * 
 * Almacenamiento: localStorage bajo 'imprenta_activity_log'
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
  | 'ACCESO_MODULO';

const STORAGE_KEY = 'imprenta_activity_log';
const MAX_AGE_DAYS = 90; // 3 meses

/**
 * Genera un hash simple encadenado (simula blockchain).
 * Cada entry depende del hash de la anterior.
 */
function generateHash(data: string, previousHash: string): string {
  let hash = 0;
  const combined = previousHash + data;
  for (let i = 0; i < combined.length; i++) {
    const char = combined.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(16).padStart(8, '0');
}

/**
 * Genera un ID único para cada entrada
 */
function generateId(): string {
  return Date.now().toString(36) + '-' + Math.random().toString(36).substring(2, 8);
}

/**
 * Obtiene todas las entries del log
 */
export function getActivityLog(): ActivityEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

/**
 * Registra una nueva actividad en el log.
 * Se encadena con el hash anterior (blockchain-style).
 */
export function logActivity(
  usuario: string,
  rol: string, 
  accion: ActivityAction,
  detalle: string,
  modulo: string
): void {
  try {
    const log = getActivityLog();
    const previousHash = log.length > 0 ? log[log.length - 1].hash : '00000000';
    
    const entryData = `${usuario}|${accion}|${detalle}|${new Date().toISOString()}`;
    const hash = generateHash(entryData, previousHash);

    const entry: ActivityEntry = {
      id: generateId(),
      timestamp: new Date().toISOString(),
      usuario,
      rol,
      accion,
      detalle,
      modulo,
      hash,
    };

    log.push(entry);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(log));
  } catch (e) {
    console.warn('[ActivityLog] Error al registrar:', e);
  }
}

/**
 * Auto-purga: Elimina registros de más de 3 meses.
 * Debe ejecutarse al iniciar la app.
 */
export function purgeOldEntries(): number {
  try {
    const log = getActivityLog();
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - MAX_AGE_DAYS);
    
    const filtered = log.filter(entry => new Date(entry.timestamp) >= cutoff);
    const purged = log.length - filtered.length;
    
    if (purged > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
      console.log(`[ActivityLog] Purgados ${purged} registros antiguos (>90 días).`);
    }
    
    return purged;
  } catch {
    return 0;
  }
}

/**
 * Obtiene estadísticas del log
 */
export function getLogStats(): {
  totalEntries: number;
  uniqueUsers: number;
  todayEntries: number;
  storageUsedKB: number;
  oldestEntry: string | null;
  newestEntry: string | null;
} {
  const log = getActivityLog();
  const today = new Date().toISOString().split('T')[0];
  const todayEntries = log.filter(e => e.timestamp.startsWith(today)).length;
  const users = new Set(log.map(e => e.usuario));
  const raw = localStorage.getItem(STORAGE_KEY) || '';
  
  return {
    totalEntries: log.length,
    uniqueUsers: users.size,
    todayEntries,
    storageUsedKB: Math.round(new Blob([raw]).size / 1024),
    oldestEntry: log.length > 0 ? log[0].timestamp : null,
    newestEntry: log.length > 0 ? log[log.length - 1].timestamp : null,
  };
}

/**
 * Filtra el log por criterios
 */
export function filterLog(filters: {
  usuario?: string;
  accion?: ActivityAction;
  modulo?: string;
  desde?: string;
  hasta?: string;
}): ActivityEntry[] {
  let log = getActivityLog();
  
  if (filters.usuario) {
    log = log.filter(e => e.usuario.toLowerCase().includes(filters.usuario!.toLowerCase()));
  }
  if (filters.accion) {
    log = log.filter(e => e.accion === filters.accion);
  }
  if (filters.modulo) {
    log = log.filter(e => e.modulo === filters.modulo);
  }
  if (filters.desde) {
    log = log.filter(e => e.timestamp >= filters.desde!);
  }
  if (filters.hasta) {
    log = log.filter(e => e.timestamp <= filters.hasta!);
  }
  
  return log;
}

/**
 * Exporta el log como CSV
 */
export function exportLogAsCSV(): string {
  const log = getActivityLog();
  const header = 'Fecha,Hora,Usuario,Rol,Acción,Detalle,Módulo,Hash\n';
  const rows = log.map(e => {
    const date = new Date(e.timestamp);
    return `${date.toLocaleDateString('es-EC')},${date.toLocaleTimeString('es-EC')},${e.usuario},${e.rol},${e.accion},"${e.detalle}",${e.modulo},${e.hash}`;
  }).join('\n');
  return header + rows;
}

/**
 * Limpia todo el log (acción destructiva)
 */
export function clearLog(): void {
  localStorage.removeItem(STORAGE_KEY);
}
