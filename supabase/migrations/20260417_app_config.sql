
-- ADD APP_CONFIG TABLE FOR SYSTEM SETTINGS
CREATE TABLE IF NOT EXISTS app_config (
    id INTEGER PRIMARY KEY CHECK (id = 1), -- Ensure only one row
    data JSONB NOT NULL DEFAULT '{}'::jsonb,
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- INITIAL CONFIG SEED (Based on configService.ts defaults)
INSERT INTO app_config (id, data)
VALUES (1, '{
    "emisorEstablecimiento": "001",
    "emisorPuntoEmision": "001",
    "secuencialInicio": 1,
    "autorizacionSRI": "1234567890",
    "fechaAutorizacion": "2024-01-15",
    "fechaCaducidad": "2025-01-15",
    "imprentaNombre": "Carlos Ángel Bolívar Mora / Imprenta Bolívar",
    "imprentaRuc": "1709876543001",
    "imprentaAutorizacion": "1234",
    "imprentaTelefono": "096 258 5172",
    "emisorNombreComercial": "Imprenta Córdova",
    "emisorRazonSocial": "Pedro Manuel Cordova Rodriguez",
    "emisorTipoContribuyente": "Contribuyente Negocio Popular - Régimen RIMPE",
    "emisorDireccionMatriz": "Calle Colón Ej. Sucre y Rocafuerte - Pasaje El Oro",
    "emisorDireccionSucursal": "Pasaje - El Oro - Ecuador",
    "emisorRuc": "0702065319001",
    "emisorActividades": "SERVICIOS GRÁFICOS Y PUBLICITARIOS",
    "reciboCodAuto": "8634",
    "emisorDireccionCompleta": "Colón Ej. Sucre y Rocafuerte • Pasaje - El Oro - Ecuador",
    "emisorEmail": "imprentacordova@gmail.com",
    "emisorTelefono": "0993083943",
    "reciboServicios": "DOCUMENTOS AUTORIZADOS POR EL SRI; FACTURAS, NOTAS DE VENTA ETC...",
    "costoPerforado": 2.00,
    "googleScriptUrl": "https://script.google.com/macros/s/AKfycbz9BrIG8s1h5spiy3H2OQVInN4lODW6VJ50-SmGBajjIQ2jbgzBl-65-_6XF7IYRluM/exec"
}'::jsonb)
ON CONFLICT (id) DO NOTHING;

-- RLS for app_config
ALTER TABLE app_config ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow everything for now" ON app_config FOR ALL USING (true);
