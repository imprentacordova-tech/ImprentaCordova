/**
 * Financial Ledger Service — Sistema de Libro Diario Inmutable (Bitcoin-style)
 * 
 * Registra ingresos y egresos de dinero con integridad vía hashes encadenados.
 * Auto-purga registros de más de 3 meses para optimizar almacenamiento.
 */

export type TransactionType = 'INGRESO' | 'EGRESO';

export interface FinancialEntry {
    id: string;
    timestamp: string;
    tipo: TransactionType;
    monto: number;
    detalle: string;
    referenciaId?: string; // ID del pedido o gasto relacionado
    usuario: string;
    hash: string; // Hash encadenado
}

const STORAGE_KEY = 'imprenta_financial_ledger';
const MAX_AGE_DAYS = 90;

/**
 * Genera un hash simple para encadenar transacciones.
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

export const getFinancialLedger = (): FinancialEntry[] => {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        return raw ? JSON.parse(raw) : [];
    } catch {
        return [];
    }
};

/**
 * Registra un nuevo movimiento en el libro diario.
 */
export const logTransaction = (
    tipo: TransactionType,
    monto: number,
    detalle: string,
    usuario: string,
    referenciaId?: string
): void => {
    try {
        const ledger = getFinancialLedger();
        const previousHash = ledger.length > 0 ? ledger[ledger.length - 1].hash : '00000000';
        
        const timestamp = new Date().toISOString();
        const entryData = `${tipo}|${monto}|${detalle}|${timestamp}|${usuario}`;
        const hash = generateHash(entryData, previousHash);

        const newEntry: FinancialEntry = {
            id: Date.now().toString(36) + Math.random().toString(36).substring(2, 5),
            timestamp,
            tipo,
            monto,
            detalle,
            referenciaId,
            usuario,
            hash
        };

        ledger.push(newEntry);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(ledger));
        console.log(`[FinancialLedger] ${tipo} registrado: $${monto} - ${detalle}`);
    } catch (error) {
        console.error('[FinancialLedger] Error logging transaction:', error);
    }
};

/**
 * Limpia transacciones con más de 90 días de antigüedad.
 */
export const purgeOldTransactions = (): number => {
    try {
        const ledger = getFinancialLedger();
        const cutoff = new Date();
        cutoff.setDate(cutoff.getDate() - MAX_AGE_DAYS);
        
        const filtered = ledger.filter(entry => new Date(entry.timestamp) >= cutoff);
        const purged = ledger.length - filtered.length;
        
        if (purged > 0) {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
            console.log(`[FinancialLedger] Purga automática: ${purged} registros eliminados.`);
        }
        return purged;
    } catch {
        return 0;
    }
};

/**
 * Obtiene el balance actual (Ingresos - Egresos) de los datos en el ledger.
 */
export const getLedgerBalance = () => {
    const ledger = getFinancialLedger();
    const ingresos = ledger.filter(e => e.tipo === 'INGRESO').reduce((sum, e) => sum + e.monto, 0);
    const egresos = ledger.filter(e => e.tipo === 'EGRESO').reduce((sum, e) => sum + e.monto, 0);
    return {
        ingresos,
        egresos,
        total: ingresos - egresos
    };
};
