-- =============================================================================
-- PRODUCCIÓN — Solicitudes en línea (formulario público /solicitar)
-- =============================================================================
-- El cliente pide sus comprobantes desde la web; la solicitud cae en la bandeja
-- "Solicitudes web" del panel y con un clic se convierte en orden.
--
-- CÓMO CORRERLO: Supabase → SQL Editor → pegar todo → Run. Es idempotente.
--
-- Seguridad: el público solo puede INSERTAR solicitudes nuevas (estado NUEVA, sin
-- orden vinculada). Leer y actualizar queda abierto igual que `trabajos` y
-- `clientes`, porque el panel usa la clave pública (no hay Supabase Auth). Cerrar
-- eso requiere el login validado en el backend: está en la lista de pendientes.
-- =============================================================================

CREATE TABLE IF NOT EXISTS solicitudes_web (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    codigo TEXT UNIQUE NOT NULL CHECK (char_length(codigo) BETWEEN 6 AND 16),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    estado TEXT NOT NULL DEFAULT 'NUEVA'
        CHECK (estado IN ('NUEVA', 'EN_PROCESO', 'CONVERTIDA', 'DESCARTADA')),

    -- Cliente
    ruc TEXT NOT NULL CHECK (ruc ~ '^[0-9]{10}([0-9]{3})?$'),
    razon_social TEXT NOT NULL CHECK (char_length(razon_social) BETWEEN 2 AND 200),
    nombre_comercial TEXT CHECK (char_length(nombre_comercial) <= 200),
    telefono TEXT NOT NULL CHECK (telefono ~ '^[0-9]{9,13}$'),
    email TEXT CHECK (char_length(email) <= 200),
    direccion TEXT CHECK (char_length(direccion) <= 300),
    actividad TEXT CHECK (char_length(actividad) <= 300),
    regimen TEXT CHECK (char_length(regimen) <= 60),

    -- Pedido
    documento TEXT NOT NULL CHECK (char_length(documento) <= 60),
    cantidad INTEGER NOT NULL CHECK (cantidad BETWEEN 1 AND 100000),
    copias TEXT CHECK (char_length(copias) <= 60),
    tamano TEXT CHECK (char_length(tamano) <= 40),
    establecimiento TEXT DEFAULT '001' CHECK (establecimiento ~ '^[0-9]{3}$'),
    punto_emision TEXT DEFAULT '001' CHECK (punto_emision ~ '^[0-9]{3}$'),
    tramite TEXT CHECK (tramite IN ('NUEVO', 'MISMO', 'CAMBIO', 'AUMENTO')),
    entrega TEXT CHECK (char_length(entrega) <= 60),
    notas TEXT CHECK (char_length(notas) <= 1000),
    acepta_datos BOOLEAN NOT NULL DEFAULT false,

    -- Gestión interna
    trabajo_id TEXT,
    atendido_por TEXT,
    nota_interna TEXT
);

CREATE INDEX IF NOT EXISTS idx_solicitudes_web_estado ON solicitudes_web(estado, created_at DESC);

ALTER TABLE solicitudes_web ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Publico crea solicitudes" ON solicitudes_web;
CREATE POLICY "Publico crea solicitudes" ON solicitudes_web
    FOR INSERT
    WITH CHECK (estado = 'NUEVA' AND trabajo_id IS NULL AND atendido_por IS NULL AND acepta_datos = true);

DROP POLICY IF EXISTS "Panel lee solicitudes" ON solicitudes_web;
CREATE POLICY "Panel lee solicitudes" ON solicitudes_web FOR SELECT USING (true);

DROP POLICY IF EXISTS "Panel gestiona solicitudes" ON solicitudes_web;
CREATE POLICY "Panel gestiona solicitudes" ON solicitudes_web FOR UPDATE USING (true) WITH CHECK (true);

NOTIFY pgrst, 'reload schema';
