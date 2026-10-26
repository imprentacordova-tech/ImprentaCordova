-- =============================================================================
-- MIGRACIÓN: modelo de impresión por orden
-- =============================================================================
-- Guarda CON QUÉ VARIANTE se produce físicamente la orden (ver services/printModels.ts).
--
-- POR QUÉ EXISTE
-- La imprenta tiene más de 5000 formularios de solicitud SRI ya impresos en offset. Mientras
-- dure ese stock hay que imprimir SOLO los datos encima del formulario; cuando se acabe, se
-- imprime el formulario entero sobre hoja en blanco. Son resultados distintos y hay que saber
-- cuál se usó.
--
-- POR QUÉ SE PERSISTE Y NO VIAJA EN LA URL
-- El modelo es un dato de la ORDEN, no de la pantalla. La extensión de Chrome llena la
-- solicitud en el portal del SRI y registra la orden: tiene que imprimir la misma variante que
-- el sistema, sin depender de un parámetro de consulta.
--
-- VALORES ESPERADOS (texto libre a propósito; el código valida y cae al default si no sirve)
--   'sri-sobre-preimpreso'  solo los datos, sobre el formulario ya impreso
--   'sri-arte-completo'     el formulario entero con los datos, sobre hoja en blanco
--   'sri-pc'                solicitud completa en A4, para gestionar desde la PC
--   'comercial-recibo'      recibo sobre su formulario de 1/4 de oficio
--   NULL                    sin definir: se aplica el default de la familia
--
-- SEGURIDAD DE LA MIGRACIÓN
-- Es aditiva y nullable: las órdenes existentes quedan en NULL y siguen funcionando. Además
-- `addTrabajo()` ya tiene un bucle que descarta columnas inexistentes, así que el código puede
-- desplegarse ANTES de correr esto sin romper nada.
-- =============================================================================

ALTER TABLE trabajos ADD COLUMN IF NOT EXISTS modelo_impresion TEXT;

COMMENT ON COLUMN trabajos.modelo_impresion IS
  'Variante de producción física de la orden. Ver services/printModels.ts. NULL = default de la familia.';

-- Índice para poder listar/filtrar por variante (útil para el taller: "qué hay que imprimir
-- sobre preimpreso hoy").
CREATE INDEX IF NOT EXISTS idx_trabajos_modelo_impresion ON trabajos(modelo_impresion);
