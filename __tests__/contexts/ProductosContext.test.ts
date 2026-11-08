/**
 * `mapProductoToDB` — contrato entre el tipo `Producto` (camelCase) y la
 * tabla `productos` (snake_case, solo 9 columnas, ver SCHEMA_COMPLETO.sql).
 *
 * Antes `addProducto`/`updateProducto` mandaban el objeto `Producto` tal cual
 * a Supabase: con columnas que coinciden por nombre (nombre, descripcion,
 * precio, categoria, unit) no pasaba nada, pero `esSRI`/`imagenUrl`/
 * `isPopular` no existen como tales en la base (son `es_sri`/`imagen_url`/
 * `is_popular`), y los campos de gestión avanzada del catálogo
 * (visiblePublico, requiereDiseno, codigoInterno, tags, etc.) no tienen
 * columna alguna. Supabase respondía "column not found" y el guardado
 * fallaba en silencio — el catch de `pages/Productos.tsx` solo loguea.
 */
import { describe, it, expect } from 'vitest';
import { mapProductoToDB } from '../../contexts/ProductosContext';

describe('mapProductoToDB', () => {
  it('traduce los campos camelCase a las columnas reales de la tabla', () => {
    const resultado = mapProductoToDB({
      nombre: 'Tarjetas de presentación',
      esSRI: true,
      imagenUrl: 'https://ejemplo.com/foto.jpg',
      isPopular: true,
    });

    expect(resultado.es_sri).toBe(true);
    expect(resultado.imagen_url).toBe('https://ejemplo.com/foto.jpg');
    expect(resultado.is_popular).toBe(true);
  });

  it('descarta los campos de gestión avanzada que no tienen columna en la base', () => {
    const resultado = mapProductoToDB({
      nombre: 'Volantes',
      visiblePublico: true,
      requiereDiseno: false,
      manejaInventario: true,
      codigoInterno: 'VOL-001',
      tags: ['promo'],
      esActivo: true,
      configuracionHabilitada: { dimensiones: true },
    });

    expect(resultado).not.toHaveProperty('visiblePublico');
    expect(resultado).not.toHaveProperty('requiereDiseno');
    expect(resultado).not.toHaveProperty('manejaInventario');
    expect(resultado).not.toHaveProperty('codigoInterno');
    expect(resultado).not.toHaveProperty('tags');
    expect(resultado).not.toHaveProperty('esActivo');
    expect(resultado).not.toHaveProperty('configuracionHabilitada');
  });

  it('no inventa columnas que no existen (solo las 9 reales)', () => {
    const resultado = mapProductoToDB({ nombre: 'Sellos', precio: 5 });
    const columnasReales = ['nombre', 'descripcion', 'precio', 'categoria', 'es_sri', 'imagen_url', 'specs', 'unit', 'is_popular'];

    expect(Object.keys(resultado).sort()).toEqual(columnasReales.sort());
  });
});
