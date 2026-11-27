-- =============================================================================
-- PRODUCCIÓN — tablas que el código usa y que NO existen en la base real
-- =============================================================================
-- Verificado el 2026-11-24 contra el proyecto de producción: `activity_log`,
-- `financial_ledger` y `facturas_electronicas` responden 404. Sin ellas:
--   · Registro de Actividad queda vacío (logActivity falla en silencio).
--   · Cuentas (libro diario) no guarda ni muestra movimientos.
--   · Facturación Electrónica no puede guardar comprobantes.
--
-- CÓMO CORRERLO: Supabase → SQL Editor → pegar todo → Run. Es idempotente
-- (se puede correr más de una vez sin romper nada) y no toca tablas existentes.
--
-- Diferencias con SCHEMA_COMPLETO.sql, a propósito:
--   · `activity_log.rol`: el código la escribe (services/activityLogService.ts).
--   · Sin claves foráneas a trabajos/clientes: el tipo de sus `id` en producción
--     no está verificado y un FK con tipo distinto haría fallar todo el script.
--   · gen_random_uuid() (nativo) en vez de uuid_generate_v4() (requiere extensión).
-- =============================================================================

CREATE TABLE IF NOT EXISTS activity_log (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    timestamp TIMESTAMPTZ DEFAULT now(),
    user_name TEXT NOT NULL,
    rol TEXT,
    action TEXT NOT NULL,
    details TEXT,
    module TEXT,
    hash TEXT,
    ip_address TEXT,
    user_agent TEXT
);
ALTER TABLE activity_log ADD COLUMN IF NOT EXISTS rol TEXT;

CREATE TABLE IF NOT EXISTS financial_ledger (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    date DATE DEFAULT CURRENT_DATE,
    type TEXT CHECK (type IN ('income', 'expense')),
    category TEXT,
    description TEXT,
    amount NUMERIC(15, 2) NOT NULL,
    payment_method TEXT,
    reference_id TEXT,
    user_name TEXT,
    hash TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE financial_ledger ADD COLUMN IF NOT EXISTS hash TEXT;

CREATE TABLE IF NOT EXISTS facturas_electronicas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    trabajo_id TEXT,
    cliente_id TEXT,
    clave_acceso VARCHAR(49) UNIQUE NOT NULL,
    numero_factura VARCHAR(20) NOT NULL,
    establecimiento VARCHAR(3) DEFAULT '001',
    punto_emision VARCHAR(3) DEFAULT '001',
    secuencial VARCHAR(9) NOT NULL,
    fecha_emision TIMESTAMPTZ DEFAULT now(),
    cliente_nombre TEXT NOT NULL,
    cliente_identificacion VARCHAR(20) NOT NULL,
    cliente_tipo_id VARCHAR(10) DEFAULT 'RUC',
    cliente_email TEXT,
    cliente_direccion TEXT,
    subtotal_sin_impuestos NUMERIC(12,2) DEFAULT 0.00,
    subtotal_12 NUMERIC(12,2) DEFAULT 0.00,
    subtotal_0 NUMERIC(12,2) DEFAULT 0.00,
    iva_12 NUMERIC(12,2) DEFAULT 0.00,
    total NUMERIC(12,2) NOT NULL,
    estado VARCHAR(20) DEFAULT 'PENDIENTE',
    ambiente VARCHAR(15) DEFAULT 'PRUEBAS',
    mensajes_sri JSONB DEFAULT '[]'::jsonb,
    fecha_autorizacion TIMESTAMPTZ,
    numero_autorizacion TEXT,
    xml_signed_url TEXT,
    ride_pdf_url TEXT,
    email_enviado BOOLEAN DEFAULT FALSE,
    detalles JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_activity_log_timestamp ON activity_log(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_financial_ledger_date ON financial_ledger(date DESC);
CREATE INDEX IF NOT EXISTS idx_financial_ledger_type ON financial_ledger(type);
CREATE INDEX IF NOT EXISTS idx_facturas_cliente ON facturas_electronicas(cliente_id);
CREATE INDEX IF NOT EXISTS idx_facturas_estado ON facturas_electronicas(estado);

-- RPCs que usa el código (Cuentas y Facturación).
CREATE OR REPLACE FUNCTION get_ledger_balance()
RETURNS TABLE (ingresos NUMERIC, egresos NUMERIC, total NUMERIC) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COALESCE(SUM(amount) FILTER (WHERE type = 'income'), 0.00)::NUMERIC,
    COALESCE(SUM(amount) FILTER (WHERE type = 'expense'), 0.00)::NUMERIC,
    (COALESCE(SUM(amount) FILTER (WHERE type = 'income'), 0.00)
      - COALESCE(SUM(amount) FILTER (WHERE type = 'expense'), 0.00))::NUMERIC
  FROM financial_ledger;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION next_invoice_number()
RETURNS integer AS $$
DECLARE
  current_year text;
  next_val integer;
BEGIN
  current_year := to_char(now(), 'YYYY');
  IF NOT EXISTS (SELECT 1 FROM pg_sequences WHERE sequencename = 'invoice_seq_' || current_year) THEN
    EXECUTE format('CREATE SEQUENCE invoice_seq_%s START 1', current_year);
  END IF;
  EXECUTE format('SELECT nextval(''invoice_seq_%s'')', current_year) INTO next_val;
  RETURN next_val;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Mismo criterio de acceso que el resto de las tablas operativas (la app usa la
-- clave pública; el login no pasa por Supabase Auth). Endurecerlo es un trabajo
-- aparte: requiere login validado en el backend.
ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE financial_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE facturas_electronicas ENABLE ROW LEVEL SECURITY;

DO $$
DECLARE tbl text;
BEGIN
  FOR tbl IN SELECT unnest(ARRAY['activity_log', 'financial_ledger', 'facturas_electronicas'])
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS "Allow all app operations" ON %I;', tbl);
    EXECUTE format('CREATE POLICY "Allow all app operations" ON %I FOR ALL USING (true) WITH CHECK (true);', tbl);
  END LOOP;
END $$;

-- Recarga el caché de PostgREST para que la API vea las tablas nuevas al instante.
NOTIFY pgrst, 'reload schema';
