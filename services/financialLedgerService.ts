import { supabase } from './supabase';

/**
 * Financial Ledger Service — Sistema de Libro Diario Inmutable (Bitcoin-style)
 * 
 * Registra ingresos y egresos de dinero con integridad vía hashes encadenados.
 * Ahora persiste en Supabase para acceso global.
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
    } catch {
        return [];
    }
};

/**
 * Registra un nuevo movimiento en el libro diario.
 */
export const logTransaction = async (
    tipo: TransactionType,
    monto: number,
    detalle: string,
    usuario: string,
    referenciaId?: string
): Promise<void> => {
    try {
        // Obtener el último hash para el encadenamiento
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
        console.log(`[FinancialLedger] ${tipo} registrado en la nube: $${monto}`);
    } catch (error) {
        console.error('[FinancialLedger] Error logging transaction:', error);
    }
};

/**
 * Purga automática no es necesaria con Supabase Cloud, 
 * pero mantenemos la firma para compatibilidad.
 */
export const purgeOldTransactions = async (): Promise<number> => {
    return 0;
};

/**
 * Obtiene el balance actual (Ingresos - Egresos) de Supabase.
 */
export const getLedgerBalance = async () => {
    const { data: ingresosData } = await supabase.from('financial_ledger').select('amount').eq('type', 'income');
    const { data: egresosData } = await supabase.from('financial_ledger').select('amount').eq('type', 'expense');

    const ingresos = (ingresosData || []).reduce((sum, e) => sum + Number(e.amount), 0);
    const egresos = (egresosData || []).reduce((sum, e) => sum + Number(e.amount), 0);
    
    return {
        ingresos,
        egresos,
        total: ingresos - egresos
    };
};
