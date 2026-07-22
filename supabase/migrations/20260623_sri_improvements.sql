-- Migration: SRI Improvements & Financial Ledger Optimization
-- Fecha: 2026-06-23
-- Autor: Antigravity AI

-- 1. Agregar columnas faltantes en la tabla trabajos para el flujo SRI y facturación
ALTER TABLE trabajos ADD COLUMN IF NOT EXISTS autorizacion_sri TEXT;
ALTER TABLE trabajos ADD COLUMN IF NOT EXISTS numeracion TEXT;

-- 2. Crear función de base de datos para calcular balance consolidado en el servidor
CREATE OR REPLACE FUNCTION get_ledger_balance()
RETURNS TABLE (ingresos NUMERIC, egresos NUMERIC, total NUMERIC) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COALESCE(SUM(amount) FILTER (WHERE type = 'income'), 0.00)::NUMERIC AS ingresos,
    COALESCE(SUM(amount) FILTER (WHERE type = 'expense'), 0.00)::NUMERIC AS egresos,
    (COALESCE(SUM(amount) FILTER (WHERE type = 'income'), 0.00) - COALESCE(SUM(amount) FILTER (WHERE type = 'expense'), 0.00))::NUMERIC AS total
  FROM financial_ledger;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
