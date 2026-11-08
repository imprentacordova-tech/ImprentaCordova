import { supabase } from './supabase';

/**
 * Financial Ledger Service — Sistema de Libro Diario Inmutable (Bitcoin-style)
 * 
 * Registra ingresos y egresos de dinero con integridad via hashes encadenados.
 * Persiste en Supabase para acceso global.
 * v2.0: Mejorado con retry queue y error reporting robusto.
 */

export type TransactionType = 'INGRESO' | 'EGRESO';

export interface FinancialEntry {
    id: string;
    timestamp: string;
    tipo: TransactionType;
    monto: number;
    detalle: string;
    referenciaId?: string;
    usuario: string;
    hash: string;
}

const PENDING_LEDGER_KEY = 'cordova_pending_ledger';
const MAX_RETRIES = 3;

interface PendingLedgerEntry {
    tipo: TransactionType;
    monto: number;
    detalle: string;
    usuario: string;
    referenciaId?: string;
    retries: number;
    timestamp?: number;
}

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

export const getFinancialLedger = async (limit = 100): Promise<FinancialEntry[]> => {
    try {
        const { data, error } = await supabase
            .from('financial_ledger')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(limit);

        if (error) throw error;

        return (data || []).map(row => ({
            id: row.id,
            timestamp: row.created_at,
            tipo: row.type === 'income' ? 'INGRESO' : 'EGRESO',
            monto: Number(row.amount),
            detalle: row.description,
            referenciaId: row.reference_id,
            usuario: row.user_name || 'Sistema',
            hash: row.hash || '00000000'
        }));
    } catch (err) {
        console.error('[FinancialLedger] Error fetching ledger:', err);
        return [];
    }
};

export const logTransaction = async (
    tipo: TransactionType,
    monto: number,
    detalle: string,
    usuario: string,
    referenciaId?: string
): Promise<boolean> => {
    try {
        const { data: lastEntry } = await supabase
            .from('financial_ledger')
            .select('hash')
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

        const previousHash = lastEntry?.hash || '00000000';
        const timestamp = new Date().toISOString();
        const entryData = `${tipo}|${monto}|${detalle}|${timestamp}|${usuario}`;
        const hash = generateHash(entryData, previousHash);

        const { error } = await supabase
            .from('financial_ledger')
            .insert([{
                type: tipo === 'INGRESO' ? 'income' : 'expense',
                amount: monto,
                description: detalle,
                user_name: usuario,
                reference_id: referenciaId,
                hash: hash,
                date: new Date().toISOString().split('T')[0]
            }]);

        if (error) throw error;
        return true;
    } catch (error) {
        console.error('[FinancialLedger] Error logging transaction:', error);
        // Queue for retry
        addToPendingQueue({ tipo, monto, detalle, usuario, referenciaId, retries: 0 });
        return false;
    }
};

function addToPendingQueue(entry: PendingLedgerEntry) {
    try {
        const queue: PendingLedgerEntry[] = JSON.parse(localStorage.getItem(PENDING_LEDGER_KEY) || '[]');
        queue.push({ ...entry, timestamp: Date.now() });
        localStorage.setItem(PENDING_LEDGER_KEY, JSON.stringify(queue));
    } catch {
        // localStorage unavailable, entry is lost
    }
}

async function retryPendingTransactions() {
    try {
        const queue: PendingLedgerEntry[] = JSON.parse(localStorage.getItem(PENDING_LEDGER_KEY) || '[]');
        if (queue.length === 0) return;

        const remaining: PendingLedgerEntry[] = [];
        for (const entry of queue) {
            if (entry.retries >= MAX_RETRIES) {
                console.warn(`[FinancialLedger] Dropping entry after ${MAX_RETRIES} retries:`, entry.detalle);
                continue;
            }
            const success = await logTransaction(entry.tipo, entry.monto, entry.detalle, entry.usuario, entry.referenciaId);
            if (!success) {
                remaining.push({ ...entry, retries: entry.retries + 1 });
            }
        }
        localStorage.setItem(PENDING_LEDGER_KEY, JSON.stringify(remaining));
    } catch {
        // ignore
    }
}

// Retry on app focus
if (typeof window !== 'undefined') {
    window.addEventListener('focus', retryPendingTransactions);
}

export const purgeOldTransactions = async (): Promise<number> => {
    return 0;
};

export const getLedgerBalance = async () => {
    try {
        const { data, error } = await supabase.rpc('get_ledger_balance');
        if (error) throw error;
        if (data && data.length > 0) {
            return {
                ingresos: Number(data[0].ingresos),
                egresos: Number(data[0].egresos),
                total: Number(data[0].total)
            };
        }
    } catch (err) {
        console.error('[FinancialLedger] Error getting balance via RPC:', err);
    }
    
    return { ingresos: 0, egresos: 0, total: 0 };
};
