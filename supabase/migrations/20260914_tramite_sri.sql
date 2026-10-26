-- =============================================================================
-- MIGRACIÓN: marcado del trámite SRI por orden
-- =============================================================================
-- Guarda cuál de las tres casillas del formulario de autorización va marcada:
-- Aument. / Cambiar. / Mismo.  (Ver services/printModels.ts → marcadoTramite().)
--
-- POR QUÉ EXISTE
-- Ese tilde es lo que la imprenta DECLARA ante el SRI: qué se está pidiendo respecto de la
-- autorización anterior. Hasta ahora estaba hardcodeado en el documento, así que siempre
-- salía "Mismo" — incluso en un talonario nuevo — y la casilla "Cambiar" ni se imprimía,
-- aunque el preimpreso la tiene.
--
-- POR QUÉ NO SE DEDUCE DE es_renovacion
-- Una renovación puede ser "Mismo" o "Aument." según la cantidad pedida, y "Cambiar" si el
-- cliente modificó un dato. Lo declara el operador al tomar el pedido, no se adivina.
--
-- VALORES ESPERADOS (texto libre; el código valida y cae al default si no sirve)
--   'AUMENTO'  se pide más cantidad que en la autorización anterior
--   'CAMBIO'   se modifica algún dato de la autorización anterior
--   'MISMO'    se repite igual que la autorización anterior
--   NULL       sin definir: se imprime MISMO, que es lo que salía por el hardcodeo
--
-- SEGURIDAD DE LA MIGRACIÓN
-- Aditiva y nullable. Las órdenes existentes quedan en NULL y se comportan IGUAL que hoy.
-- `addTrabajo()` descarta columnas inexistentes, así que el código puede desplegarse ANTES
-- de correr esto sin romper nada.
-- =============================================================================

ALTER TABLE trabajos ADD COLUMN IF NOT EXISTS tramite_sri TEXT;

COMMENT ON COLUMN trabajos.tramite_sri IS
  'Casilla marcada en la solicitud SRI: AUMENTO | CAMBIO | MISMO. NULL = MISMO. Ver services/printModels.ts.';
