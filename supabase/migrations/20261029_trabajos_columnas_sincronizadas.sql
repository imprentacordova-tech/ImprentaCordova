-- =============================================================================
-- MIGRACIÓN CONSOLIDADA: columnas de `trabajos` que el código ya escribe
-- =============================================================================
-- POR QUÉ EXISTE
-- El frontend (NuevoPedido) y la extensión de Chrome escriben `modelo_impresion`
-- y `tramite_sri` al crear una orden. Si la base no los tiene, Supabase responde:
--
--   Could not find the 'tramite_sri' column of 'trabajos' in the schema cache
--
-- y la orden NO se registra. Las migraciones 20260914_modelo_impresion.sql y
-- 20260914_tramite_sri.sql ya definían estas columnas, pero en producción no se
-- habían corrido. Esta migración las garantiza en un solo paso.
--
-- ES IDEMPOTENTE: se puede correr varias veces sin error.
-- ES ADITIVA Y NULLABLE: las órdenes existentes quedan en NULL y se comportan
-- igual que hoy (el código aplica el default de la familia / "MISMO").
-- =============================================================================

-- 1. Columnas que agregaron las migraciones 20260914_*
ALTER TABLE trabajos ADD COLUMN IF NOT EXISTS modelo_impresion TEXT;
ALTER TABLE trabajos ADD COLUMN IF NOT EXISTS tramite_sri TEXT;

-- 2. Defensivas: columnas que el frontend/la extensión también escriben.
--    (Si una instalación vieja no las tiene, esto evita el mismo error.)
ALTER TABLE trabajos ADD COLUMN IF NOT EXISTS tiempo_entrega_estimado TEXT;
ALTER TABLE trabajos ADD COLUMN IF NOT EXISTS detalle TEXT;
ALTER TABLE trabajos ADD COLUMN IF NOT EXISTS observaciones TEXT;
ALTER TABLE trabajos ADD COLUMN IF NOT EXISTS responsable TEXT;
ALTER TABLE trabajos ADD COLUMN IF NOT EXISTS fecha_entrega TIMESTAMPTZ;
ALTER TABLE trabajos ADD COLUMN IF NOT EXISTS es_renovacion BOOLEAN DEFAULT false;
ALTER TABLE trabajos ADD COLUMN IF NOT EXISTS es_sri BOOLEAN DEFAULT false;
ALTER TABLE trabajos ADD COLUMN IF NOT EXISTS establecimiento TEXT;
ALTER TABLE trabajos ADD COLUMN IF NOT EXISTS punto_emision TEXT;
ALTER TABLE trabajos ADD COLUMN IF NOT EXISTS estado_clave TEXT DEFAULT 'PENDIENTE';
ALTER TABLE trabajos ADD COLUMN IF NOT EXISTS actividad_seleccionada TEXT;
ALTER TABLE trabajos ADD COLUMN IF NOT EXISTS tamano TEXT;
ALTER TABLE trabajos ADD COLUMN IF NOT EXISTS clave_acceso TEXT;
ALTER TABLE trabajos ADD COLUMN IF NOT EXISTS autorizacion_sri TEXT;
ALTER TABLE trabajos ADD COLUMN IF NOT EXISTS numeracion TEXT;
ALTER TABLE trabajos ADD COLUMN IF NOT EXISTS fecha_vencimiento TIMESTAMPTZ;

-- 3. Índice de consulta por variante de impresión (taller).
CREATE INDEX IF NOT EXISTS idx_trabajos_modelo_impresion ON trabajos(modelo_impresion);

-- 4. Comentarios (documentan el dato).
COMMENT ON COLUMN trabajos.tramite_sri IS
  'Casilla marcada en la solicitud SRI: AUMENTO | CAMBIO | MISMO. NULL = MISMO. Ver services/printModels.ts.';
COMMENT ON COLUMN trabajos.modelo_impresion IS
  'Variante de producción física de la orden. Ver services/printModels.ts. NULL = default de la familia.';

-- 5. Forzar a PostgREST a recargar el schema cache (el error hablaba del cache).
NOTIFY pgrst, 'reload schema';
