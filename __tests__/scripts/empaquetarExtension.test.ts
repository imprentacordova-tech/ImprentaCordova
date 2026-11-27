import { describe, it, expect } from 'vitest';
import { unzipSync } from 'fflate';
import { armarZipExtension, DIR_EXTENSION } from '../../scripts/empaquetar-extension.mjs';

describe('empaquetar extensión', () => {
  const zip = armarZipExtension(DIR_EXTENSION);
  const nombres = Object.keys(unzipSync(zip));

  it('manifest.json va en la raíz del zip', () => {
    expect(nombres).toContain('manifest.json');
  });

  it('ninguna ruta usa barra invertida (se rompía al descomprimir fuera de Windows)', () => {
    expect(nombres.some(n => n.includes('\\'))).toBe(false);
    expect(nombres).toContain('content/content.js');
  });

  it('incluye docTypes.js y deja afuera basura del sistema', () => {
    expect(nombres).toContain('docTypes.js');
    expect(nombres.some(n => /(^|\/)(\.DS_Store|Thumbs\.db)$/.test(n))).toBe(false);
  });

  it('no publica material de referencia interno (fotos de solicitudes reales)', () => {
    expect(nombres.some(n => n.startsWith('Fotos referencia'))).toBe(false);
  });
});
