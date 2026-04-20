
-- MIGRATION: LOGS AND LEDGER
-- FECHA: 2026-04-18
-- OBJETIVO: Persistencia de auditoría y finanzas en la nube

-- 0. Ajustes a tablas existentes
ALTER TABLE IF EXISTS users ADD COLUMN IF NOT EXISTS password TEXT;
ALTER TABLE IF EXISTS users ADD COLUMN IF NOT EXISTS avatar TEXT;
ALTER TABLE IF EXISTS users ADD COLUMN IF NOT EXISTS permisos TEXT[] DEFAULT '{}';

-- 1. Tabla de Registro de Actividad (Audit Trail)
CREATE TABLE IF NOT EXISTS activity_log (
    id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    timestamp TIMESTAMPTZ DEFAULT now(),
    user_name TEXT NOT NULL,
    action TEXT NOT NULL,
    details TEXT,
    module TEXT,
    hash TEXT, -- Para integridad estilo blockchain
    ip_address TEXT,
    user_agent TEXT
);

-- 2. Tabla de Libro Diario (Financial Ledger)
CREATE TABLE IF NOT EXISTS financial_ledger (
    id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    date DATE DEFAULT CURRENT_DATE,
    type TEXT CHECK (type IN ('income', 'expense')),
    category TEXT,
    description TEXT,
    amount NUMERIC(15, 2) NOT NULL,
    payment_method TEXT,
    reference_id TEXT, -- ID del trabajo o gasto relacionado
    user_name TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Habilitar RLS
ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE financial_ledger ENABLE ROW LEVEL SECURITY;

-- 4. Políticas Temporales (Velocidad sobre Burocracia)
CREATE POLICY "Allow everything for now" ON activity_log FOR ALL USING (true);
CREATE POLICY "Allow everything for now" ON financial_ledger FOR ALL USING (true);

-- 5. Índices para rendimiento
CREATE INDEX IF NOT EXISTS idx_activity_log_timestamp ON activity_log(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_financial_ledger_date ON financial_ledger(date DESC);
CREATE INDEX IF NOT EXISTS idx_financial_ledger_type ON financial_ledger(type);
