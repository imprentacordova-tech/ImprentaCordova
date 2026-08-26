-- =============================================================================
-- MIGRACIÓN: Row Level Security (RLS) por Rol para Imprenta Córdova
-- Ejecutar en Supabase SQL Editor después de crear la tabla `users` con columna `rol`
-- =============================================================================

-- 1. Asegurar que la tabla users tiene la columna rol
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'rol') THEN
    ALTER TABLE users ADD COLUMN rol text NOT NULL DEFAULT 'Operador';
  END IF;
END $$;

-- 2. Crear enum de roles si no existe
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
    CREATE TYPE user_role AS ENUM ('Admin', 'Operador', 'Disenador');
  END IF;
END $$;

-- 3. Actualizar la columna rol para usar el enum (con fallback a 'Operador')
ALTER TABLE users ALTER COLUMN rol DROP DEFAULT;
ALTER TABLE users ALTER COLUMN rol TYPE user_role USING rol::user_role;
ALTER TABLE users ALTER COLUMN rol SET DEFAULT 'Operador'::user_role;

-- =============================================================================
-- FUNCIÓN AUXILIAR: Obtener el rol del usuario actual
-- =============================================================================
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS user_role AS $$
  SELECT rol FROM users WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- =============================================================================
-- TABLA: trabajos
-- =============================================================================
ALTER TABLE trabajos ENABLE ROW LEVEL SECURITY;

-- Admin: acceso total
CREATE POLICY "trabajos_admin_all" ON trabajos
  FOR ALL
  USING (get_user_role() = 'Admin');

-- Operador: CRUD completo en trabajos
CREATE POLICY "trabajos_operador_all" ON trabajos
  FOR ALL
  USING (get_user_role() = 'Operador');

-- Diseñador: solo lectura + update de arteAprobado y fotoEvidenciaUrl
CREATE POLICY "trabajos_disenador_select" ON trabajos
  FOR SELECT
  USING (get_user_role() = 'Disenador');

CREATE POLICY "trabajos_disenador_update" ON trabajos
  FOR UPDATE
  USING (get_user_role() = 'Disenador')
  WITH CHECK (get_user_role() = 'Disenador');

-- =============================================================================
-- TABLA: clientes
-- =============================================================================
ALTER TABLE clientes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "clientes_admin_all" ON clientes
  FOR ALL
  USING (get_user_role() = 'Admin');

CREATE POLICY "clientes_operador_all" ON clientes
  FOR ALL
  USING (get_user_role() = 'Operador');

CREATE POLICY "clientes_disenador_select" ON clientes
  FOR SELECT
  USING (get_user_role() = 'Disenador');

-- =============================================================================
-- TABLA: inventario
-- =============================================================================
ALTER TABLE inventario ENABLE ROW LEVEL SECURITY;

CREATE POLICY "inventario_admin_all" ON inventario
  FOR ALL
  USING (get_user_role() = 'Admin');

CREATE POLICY "inventario_operador_all" ON inventario
  FOR ALL
  USING (get_user_role() = 'Operador');

CREATE POLICY "inventario_disenador_select" ON inventario
  FOR SELECT
  USING (get_user_role() = 'Disenador');

-- =============================================================================
-- TABLA: productos (catálogo)
-- =============================================================================
ALTER TABLE productos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "productos_admin_all" ON productos
  FOR ALL
  USING (get_user_role() = 'Admin');

CREATE POLICY "productos_operador_all" ON productos
  FOR ALL
  USING (get_user_role() = 'Operador');

CREATE POLICY "productos_disenador_select" ON productos
  FOR SELECT
  USING (get_user_role() = 'Disenador');

-- =============================================================================
-- TABLA: app_config (solo Admin)
-- =============================================================================
ALTER TABLE app_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "app_config_admin_all" ON app_config
  FOR ALL
  USING (get_user_role() = 'Admin');

CREATE POLICY "app_config_operador_select" ON app_config
  FOR SELECT
  USING (get_user_role() = 'Operador');

-- =============================================================================
-- TABLA: sri_credentials (solo Admin + Operador)
-- =============================================================================
ALTER TABLE sri_credentials ENABLE ROW LEVEL SECURITY;

CREATE POLICY "sri_credentials_admin_all" ON sri_credentials
  FOR ALL
  USING (get_user_role() = 'Admin');

CREATE POLICY "sri_credentials_operador_select" ON sri_credentials
  FOR SELECT
  USING (get_user_role() = 'Operador');

-- =============================================================================
-- TABLA: proveedores (solo Admin)
-- =============================================================================
ALTER TABLE proveedores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "proveedores_admin_all" ON proveedores
  FOR ALL
  USING (get_user_role() = 'Admin');

CREATE POLICY "proveedores_operador_select" ON proveedores
  FOR SELECT
  USING (get_user_role() = 'Operador');

-- =============================================================================
-- TABLA: tareas (solo Admin)
-- =============================================================================
ALTER TABLE tareas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tareas_admin_all" ON tareas
  FOR ALL
  USING (get_user_role() = 'Admin');

CREATE POLICY "tareas_operador_select" ON tareas
  FOR SELECT
  USING (get_user_role() = 'Operador');

-- =============================================================================
-- TABLA: activity_log (solo Admin lectura/escritura, otros solo append)
-- =============================================================================
ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "activity_log_admin_all" ON activity_log
  FOR ALL
  USING (get_user_role() = 'Admin');

CREATE POLICY "activity_log_operador_insert" ON activity_log
  FOR INSERT
  WITH CHECK (get_user_role() = 'Operador');

CREATE POLICY "activity_log_operador_select" ON activity_log
  FOR SELECT
  USING (get_user_role() = 'Operador');

-- =============================================================================
-- TABLA: financial_entries (solo Admin lectura/escritura)
-- =============================================================================
ALTER TABLE financial_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "financial_entries_admin_all" ON financial_entries
  FOR ALL
  USING (get_user_role() = 'Admin');

CREATE POLICY "financial_entries_operador_insert" ON financial_entries
  FOR INSERT
  WITH CHECK (get_user_role() = 'Operador');

-- =============================================================================
-- FUNCIÓN RPC: next_invoice_number (secuencia atómica)
-- =============================================================================
CREATE OR REPLACE FUNCTION next_invoice_number()
RETURNS integer AS $$
DECLARE
  current_year text;
  next_val integer;
BEGIN
  current_year := to_char(now(), 'YYYY');

  -- Crear secuencia si no existe para el año actual
  IF NOT EXISTS (SELECT 1 FROM pg_sequences WHERE sequencename = 'invoice_seq_' || current_year) THEN
    EXECUTE format('CREATE SEQUENCE invoice_seq_%s START 1', current_year);
  END IF;

  EXECUTE format('SELECT nextval(''invoice_seq_%s'')', current_year) INTO next_val;
  RETURN next_val;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
