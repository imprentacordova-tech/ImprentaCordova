
-- TABLA DE PADRON SRI (LOCAL CACHE)
-- Esta tabla se alimenta del CSV SRI_RUC_El_Oro.csv
CREATE TABLE IF NOT EXISTS sri_padron_el_oro (
    ruc TEXT PRIMARY KEY,
    razon_social TEXT NOT NULL,
    provincia TEXT,
    estado_contribuyente TEXT,
    tipo_persona TEXT,
    canton TEXT,
    parroquia TEXT,
    actividad_economica TEXT
);

-- Índices para búsquedas ultra rápidas
CREATE INDEX IF NOT EXISTS idx_sri_padron_ruc ON sri_padron_el_oro(ruc);
CREATE INDEX IF NOT EXISTS idx_sri_padron_razon_social ON sri_padron_el_oro USING btree (razon_social);

-- Habilitar RLS para seguridad
ALTER TABLE sri_padron_el_oro ENABLE ROW LEVEL SECURITY;

-- Política de lectura pública (ya que son datos abiertos)
CREATE POLICY "Allow public read on SRI Padron" ON sri_padron_el_oro FOR SELECT USING (true);
