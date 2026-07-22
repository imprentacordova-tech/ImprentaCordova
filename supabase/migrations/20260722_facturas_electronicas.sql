-- Migration: Tabla de Facturas Electrónicas SRI Ecuador
-- Fecha: 2026-07-22
-- Descripción: Módulo completo de Facturación Electrónica para Imprenta Córdova con soporte para Render.com API / Supabase Realtime

CREATE TABLE IF NOT EXISTS facturas_electronicas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trabajo_id UUID REFERENCES trabajos(id) ON DELETE SET NULL,
  cliente_id UUID REFERENCES clientes(id) ON DELETE SET NULL,
  clave_acceso VARCHAR(49) UNIQUE NOT NULL,
  numero_factura VARCHAR(20) NOT NULL, -- Format: 001-001-000000123
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
  estado VARCHAR(20) DEFAULT 'PENDIENTE', -- PENDIENTE, PROCESANDO, AUTORIZADO, RECHAZADO, ANULADO, ERROR
  ambiente VARCHAR(15) DEFAULT 'PRUEBAS', -- PRUEBAS o PRODUCCION
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

-- Indices para búsquedas rápidas
CREATE INDEX IF NOT EXISTS idx_facturas_clave_acceso ON facturas_electronicas(clave_acceso);
CREATE INDEX IF NOT EXISTS idx_facturas_cliente ON facturas_electronicas(cliente_id);
CREATE INDEX IF NOT EXISTS idx_facturas_trabajo ON facturas_electronicas(trabajo_id);
CREATE INDEX IF NOT EXISTS idx_facturas_estado ON facturas_electronicas(estado);
CREATE INDEX IF NOT EXISTS idx_facturas_fecha ON facturas_electronicas(fecha_emision DESC);

-- Enable RLS
ALTER TABLE facturas_electronicas ENABLE ROW LEVEL SECURITY;

-- Allow all authenticated/anon read & write for app context
CREATE POLICY "Allow public read facturas_electronicas" ON facturas_electronicas FOR SELECT USING (true);
CREATE POLICY "Allow public insert facturas_electronicas" ON facturas_electronicas FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update facturas_electronicas" ON facturas_electronicas FOR UPDATE USING (true);
CREATE POLICY "Allow public delete facturas_electronicas" ON facturas_electronicas FOR DELETE USING (true);
