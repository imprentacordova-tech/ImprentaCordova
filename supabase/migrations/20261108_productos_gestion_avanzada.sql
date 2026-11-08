-- =============================================================================
-- MIGRACIÓN: columnas de gestión avanzada del catálogo de productos
-- =============================================================================
-- `components/ProductManagementModal.tsx` tiene toggles para marcar un producto
-- como visible al público, que requiere diseño, que maneja inventario, activo/
-- inactivo, un código interno y etiquetas — pero la tabla `productos` nunca tuvo
-- esas columnas. El tipo `Producto` (types.ts) ya las declaraba desde antes, así
-- que el modal las mandaba igual: Supabase respondía "column not found" y el
-- guardado fallaba en silencio (el catch de `pages/Productos.tsx` solo loguea
-- a consola, no avisa al usuario).
--
-- `contexts/ProductosContext.tsx` (mapProductoToDB) ya filtraba estos campos
-- para que el guardado al menos no explote; esta migración agrega las columnas
-- reales para que esos toggles persistan de verdad.
--
-- `configCalculadora` / `configuracionBase` (types.ts) NO se migran acá: eran
-- de `PriceCalculatorDisplay.tsx`, que ya no existe (se borró como código
-- muerto), y ningún código vivo los lee ni los escribe.
--
-- SEGURIDAD DE LA MIGRACIÓN
-- Aditiva y con default. Los productos existentes quedan con los valores que
-- ya asume la UI hoy (visible, activo, sin diseño ni inventario) — ver los
-- defaults de `baseProduct` en ProductManagementModal.tsx.
-- =============================================================================

ALTER TABLE productos ADD COLUMN IF NOT EXISTS visible_publico BOOLEAN DEFAULT true;
ALTER TABLE productos ADD COLUMN IF NOT EXISTS requiere_diseno BOOLEAN DEFAULT false;
ALTER TABLE productos ADD COLUMN IF NOT EXISTS maneja_inventario BOOLEAN DEFAULT false;
ALTER TABLE productos ADD COLUMN IF NOT EXISTS es_activo BOOLEAN DEFAULT true;
ALTER TABLE productos ADD COLUMN IF NOT EXISTS codigo_interno TEXT;
ALTER TABLE productos ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';
ALTER TABLE productos ADD COLUMN IF NOT EXISTS configuracion_habilitada JSONB;

COMMENT ON COLUMN productos.visible_publico IS 'Si aparece en el catálogo público/vitrina.';
COMMENT ON COLUMN productos.requiere_diseno IS 'Si el paso de producción debe pedir arte/diseño.';
COMMENT ON COLUMN productos.maneja_inventario IS 'Si descuenta stock de InventarioContext al venderse.';
COMMENT ON COLUMN productos.es_activo IS 'Si se puede seguir vendiendo (false = descontinuado).';
COMMENT ON COLUMN productos.codigo_interno IS 'Código interno del taller, ej. variantes de matriz (talla/presentación).';
COMMENT ON COLUMN productos.tags IS 'Etiquetas libres para buscar/filtrar en el catálogo.';
COMMENT ON COLUMN productos.configuracion_habilitada IS 'Qué módulos del configurador (dimensiones, volumen, material, acabados, cromatismo, procesos mecánicos) aplican a este producto.';
