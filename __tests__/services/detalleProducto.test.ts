/**
 * Pruebas de los perfiles de detalle por producto.
 * ================================================
 *
 * Este módulo decide QUÉ le pregunta el Paso 2 de Nueva Orden a cada producto
 * y CUÁNTO suma al precio unitario cada opción elegida. Dos riesgos concretos:
 *
 *   • Un producto que cae al perfil equivocado pide datos que no existen
 *     (hojas y clave del SRI para un sello) o se le olvida pedir el papel.
 *   • Los `delta` son plata: un sello seco suma $25 y un "de mano" resta $5.
 *     Si `calcularDelta` ignora un campo o no aplica el valor por defecto,
 *     la orden se cotiza mal y el error se descubre en caja.
 *
 * Las expectativas usan las palabras del negocio (lona, empastado, talonario),
 * que es como escribe los productos quien carga el catálogo.
 */
import { describe, it, expect } from 'vitest';
import {
  PERFILES,
  PERFIL_GENERICO_ID,
  COPIAS_SRI,
  HOJAS_POR_COPIAS,
  perfilDe,
  calcularDelta,
  especificacionesPorDefecto,
  resumenPerfil,
  hojasPorTalonario,
} from '../../services/detalleProducto';

describe('perfilDe — a qué formulario va cada producto', () => {
  it('un documento del SRI va al perfil sri, aunque el nombre diga otra cosa', () => {
    // `esSRI` es la bandera fuerte: manda sobre el texto del nombre.
    expect(perfilDe({ esSRI: true, nombre: 'Sello automático' }).id).toBe('sri');
  });

  it('reconoce sellos por el nombre', () => {
    expect(perfilDe({ nombre: 'Sello automático 38x14' }).id).toBe('sello');
    expect(perfilDe({ categoria: 'Sellos' }).id).toBe('sello');
  });

  it('reconoce gran formato en todas sus variantes del taller', () => {
    for (const nombre of ['Lona 2x1', 'Roll Up', 'Rollup banner', 'Gigantografía fachada', 'Vinil adhesivo', 'Letrero backlight']) {
      expect(perfilDe({ nombre }).id, nombre).toBe('granFormato');
    }
  });

  it('reconoce empastados', () => {
    expect(perfilDe({ nombre: 'Empastado de tesis' }).id).toBe('empastado');
  });

  it('manda a láser/sublimación lo que se imprime una sola vez', () => {
    for (const nombre of ['Tarjetas de presentación', 'Volantes A5', 'Tríptico', 'Afiche', 'Carpeta institucional', 'Etiquetas', 'Jarro sublimado', 'Rifa', 'Recibo comercial']) {
      expect(perfilDe({ nombre }).id, nombre).toBe('laser');
    }
  });

  it('lo que no reconoce cae al perfil genérico con detalle libre', () => {
    const perfil = perfilDe({ nombre: 'Trabajo raro que nadie catalogó' });
    expect(perfil.id).toBe(PERFIL_GENERICO_ID);
    expect(perfil.campos.map((c) => c.key)).toEqual(['detalle']);
  });

  it('nunca lanza: ítem vacío o con campos undefined devuelve genérico', () => {
    expect(() => perfilDe({})).not.toThrow();
    expect(perfilDe({}).id).toBe(PERFIL_GENERICO_ID);
    expect(perfilDe({ nombre: undefined, categoria: undefined }).id).toBe(PERFIL_GENERICO_ID);
  });

  it('no le importan las mayúsculas', () => {
    expect(perfilDe({ nombre: 'LONA PUBLICITARIA' }).id).toBe('granFormato');
    expect(perfilDe({ nombre: 'sello DE MANO' }).id).toBe('sello');
  });
});

describe('calcularDelta — los modificadores de precio', () => {
  const sello = PERFILES.sello;

  it('suma los deltas de las opciones elegidas', () => {
    // Seco (relieve) +25, 52×35 mm +8, Bicolor +5, Diseño nuevo +8 = 46
    const delta = calcularDelta(sello, {
      tipoSello: 'Seco (relieve)',
      medidaSello: '52×35 mm',
      colorTinta: 'Bicolor',
      diseno: 'Diseño nuevo',
    });
    expect(delta).toBe(46);
  });

  it('con los valores por defecto el delta es cero (el precio de lista no se toca)', () => {
    expect(calcularDelta(sello, {})).toBe(0);
  });

  it('aplica el default de cada campo que el usuario no tocó', () => {
    // Solo cambia el tipo: el resto tiene que caer en su default (delta 0).
    expect(calcularDelta(sello, { tipoSello: 'Fechador' })).toBe(8);
  });

  it('acepta deltas negativos (un sello de mano es más barato)', () => {
    expect(calcularDelta(sello, { tipoSello: 'De mano' })).toBe(-5);
  });

  it('una opción inexistente no suma ni rompe', () => {
    expect(calcularDelta(sello, { tipoSello: 'Opción que ya no existe' })).toBe(0);
  });

  it('ignora los campos de texto: el texto a grabar no modifica el precio', () => {
    const conTexto = calcularDelta(sello, { textoSello: 'IMPRENTA CÓRDOVA · RUC 0702065319001' });
    expect(conTexto).toBe(0);
  });

  it('el perfil genérico (solo textarea) siempre da cero', () => {
    expect(calcularDelta(perfilDe({}), { detalle: 'cualquier cosa' })).toBe(0);
  });
});

describe('especificacionesPorDefecto', () => {
  it('guarda el id del perfil para poder reconstruir el formulario después', () => {
    expect(especificacionesPorDefecto(PERFILES.sello).perfil).toBe('sello');
  });

  it('completa todos los campos del perfil, sin dejar undefined', () => {
    const specs = especificacionesPorDefecto(PERFILES.sello);
    for (const campo of PERFILES.sello.campos) {
      expect(specs[campo.key], campo.key).toBeDefined();
    }
    expect(specs.tipoSello).toBe('Automático');
    expect(specs.textoSello).toBe('');
  });

  it('los defaults no cuestan plata: el delta inicial de cada perfil es cero', () => {
    // Si algún perfil tuviera por defecto una opción con delta, la orden
    // arrancaría más cara que el precio de lista sin que nadie lo eligiera.
    for (const [id, perfil] of Object.entries(PERFILES)) {
      expect(calcularDelta(perfil, especificacionesPorDefecto(perfil)), id).toBe(0);
    }
  });

  it('un campo chips sin default toma la primera opción', () => {
    const perfil = {
      id: 'x', label: 'X', unidadCantidad: 'u',
      campos: [{ key: 'a', label: 'A', tipo: 'chips' as const, opciones: [{ valor: 'uno', label: 'Uno' }, { valor: 'dos', label: 'Dos' }] }],
    };
    expect(especificacionesPorDefecto(perfil).a).toBe('uno');
  });
});

describe('hojasPorTalonario — los comprobantes que se le piden al SRI', () => {
  // Esto es lo que va en la solicitud de autorización, que es un acto legal:
  // pedir 100 cuando el cliente encargó un cuadruplicado de 200 obliga a
  // rehacer el trámite completo.

  it('cada opción de copias sabe cuántas hojas trae', () => {
    // Si alguien agrega una opción a COPIAS_SRI y se olvida del mapa, el SRI
    // recibiría la cantidad por defecto sin que nadie lo note.
    for (const opcion of COPIAS_SRI) {
      expect(HOJAS_POR_COPIAS[opcion.valor], opcion.valor).toBeGreaterThan(0);
    }
  });

  it('traduce la opción elegida en el Paso 2', () => {
    expect(hojasPorTalonario({ copias: 'Original (50 hojas)' })).toBe(50);
    expect(hojasPorTalonario({ copias: 'Original + 1 Copia (Duplicado 100h)' })).toBe(100);
    expect(hojasPorTalonario({ copias: 'Original + 2 Copias (Triplicado 150h)' })).toBe(150);
    expect(hojasPorTalonario({ copias: 'Original + 3 Copias (Cuadruplicado 200h)' })).toBe(200);
  });

  it('acepta `paginas`, que es como lo precarga la extensión al volver del SRI', () => {
    expect(hojasPorTalonario({ paginas: 150 })).toBe(150);
    expect(hojasPorTalonario({ paginas: '200' })).toBe(200);
  });

  it('`copias` manda sobre `paginas` cuando están los dos', () => {
    expect(hojasPorTalonario({ copias: 'Original (50 hojas)', paginas: 999 })).toBe(50);
  });

  it('sin datos usables cae en 100, que es el duplicado habitual', () => {
    expect(hojasPorTalonario({})).toBe(100);
    expect(hojasPorTalonario(null)).toBe(100);
    expect(hojasPorTalonario({ copias: 'Una opción que ya no existe' })).toBe(100);
    expect(hojasPorTalonario({ paginas: 0 })).toBe(100);
    expect(hojasPorTalonario({ paginas: 'abc' })).toBe(100);
  });

  it('las especificaciones por defecto del perfil SRI dan 100 hojas', () => {
    // El default del perfil es el duplicado: el ítem recién agregado ya tiene
    // una cantidad coherente que mandarle al portal.
    expect(hojasPorTalonario(especificacionesPorDefecto(PERFILES.sri))).toBe(100);
  });
});

describe('resumenPerfil', () => {
  it('resume solo los chips, que es lo que se muestra en la vista previa', () => {
    const resumen = resumenPerfil(PERFILES.sello, {
      tipoSello: 'Fechador',
      textoSello: 'esto no debería aparecer',
    });
    const textos = resumen.map((r) => r.texto);
    expect(textos).toContain('Fechador');
    expect(textos).not.toContain('esto no debería aparecer');
  });

  it('cada chip trae su ícono', () => {
    const resumen = resumenPerfil(PERFILES.sello, {});
    expect(resumen.every((r) => r.icono.length > 0)).toBe(true);
  });

  it('un perfil sin chips da un resumen vacío en vez de fallar', () => {
    expect(resumenPerfil(perfilDe({}), { detalle: 'algo' })).toEqual([]);
  });
});
