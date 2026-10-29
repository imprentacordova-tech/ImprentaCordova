-- ════════════════════════════════════════════════════════════════════════════
-- Recordatorio automático de rezagados
--
-- Guarda cuándo se le avisó por última vez al cliente que su pedido está listo.
-- El backend (cordova-sri-backend/index.js) lo usa para no repetir el correo antes
-- de una semana: sin esta marca, el cron diario le escribiría todos los días a la
-- misma persona hasta que marque el correo como spam.
--
-- Idempotente: se puede correr varias veces sin efecto y sin perder datos.
-- ════════════════════════════════════════════════════════════════════════════

ALTER TABLE trabajos
    ADD COLUMN IF NOT EXISTS recordatorio_enviado_at TIMESTAMPTZ;

COMMENT ON COLUMN trabajos.recordatorio_enviado_at IS
    'Última vez que se le envió al cliente el recordatorio de retiro (rezagado > 48 h).';

-- El cron filtra por estado y ordena por fecha de entrada; el índice parcial deja
-- esa consulta barata incluso cuando la tabla crezca.
CREATE INDEX IF NOT EXISTS idx_trabajos_vitrina_antiguos
    ON trabajos (fecha_entrada)
    WHERE estado = 'Vitrina';

-- Verificación rápida después de correr la migración:
--   SELECT count(*) FILTER (WHERE estado = 'Vitrina')                AS en_vitrina,
--          count(*) FILTER (WHERE recordatorio_enviado_at IS NOT NULL) AS ya_avisados
--     FROM trabajos;
