-- Add missing columns to trabajos table for SRI workflow and detail tracking
-- These columns were used in the application but not present in the initial schema

-- es_sri: Boolean flag to distinguish SRI orders from commercial ones
ALTER TABLE trabajos ADD COLUMN IF NOT EXISTS es_sri BOOLEAN DEFAULT false;

-- detalle: Free-text description of the work to be done
ALTER TABLE trabajos ADD COLUMN IF NOT EXISTS detalle TEXT;

-- observaciones: Internal notes about the order
ALTER TABLE trabajos ADD COLUMN IF NOT EXISTS observaciones TEXT;

-- responsable: Staff member responsible for the order
ALTER TABLE trabajos ADD COLUMN IF NOT EXISTS responsable TEXT;

-- foto_evidencia_url: Photo evidence of completed work
ALTER TABLE trabajos ADD COLUMN IF NOT EXISTS foto_evidencia_url TEXT;

-- foto_retiro_url: Photo of client pickup
ALTER TABLE trabajos ADD COLUMN IF NOT EXISTS foto_retiro_url TEXT;

-- Add nombre_comercial column to clientes if missing
ALTER TABLE clientes ADD COLUMN IF NOT EXISTS nombre_comercial TEXT;

-- Index for SRI-specific queries
CREATE INDEX IF NOT EXISTS idx_trabajos_es_sri ON trabajos(es_sri) WHERE es_sri = true;
