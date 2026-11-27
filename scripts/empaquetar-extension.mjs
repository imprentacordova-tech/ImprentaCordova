/**
 * Empaqueta la extensión de Chrome en public/extension-cordova.zip (lo descarga el panel).
 *
 *   npm run ext:zip
 *
 * Antes el zip se armaba a mano en Windows y quedaba con rutas `content\content.js`,
 * que se rompen al descomprimir fuera de Windows. Acá las rutas siempre usan `/` y
 * manifest.json queda en la raíz (lo que Chrome espera al "Cargar descomprimida").
 */
import { readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { join, relative, sep, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { zipSync } from 'fflate';

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..');
export const DIR_EXTENSION = join(RAIZ, 'sri-chrome-extension', 'Solicitador de documentos', 'Extension_Imprenta_Cordova');
export const DESTINO = join(RAIZ, 'public', 'extension-cordova.zip');

// "Fotos referencia solicitud" son fotos de solicitudes reales usadas para maquetar:
// pueden tener datos de clientes y el zip se descarga desde el sitio público.
const IGNORAR = /(^|[\\/])(\.DS_Store|Thumbs\.db|desktop\.ini|\.git|node_modules|Fotos referencia[^\\/]*)$/i;

const listar = (dir) => readdirSync(dir).flatMap((nombre) => {
    const ruta = join(dir, nombre);
    if (IGNORAR.test(ruta)) return [];
    return statSync(ruta).isDirectory() ? listar(ruta) : [ruta];
});

/** @returns {Uint8Array} zip con rutas relativas a `dir`, separadas por `/`. */
export function armarZipExtension(dir) {
    const archivos = {};
    for (const ruta of listar(dir)) {
        archivos[relative(dir, ruta).split(sep).join('/')] = readFileSync(ruta);
    }
    return zipSync(archivos, { level: 9 });
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
    const version = JSON.parse(readFileSync(join(DIR_EXTENSION, 'manifest.json'), 'utf8')).version;
    const zip = armarZipExtension(DIR_EXTENSION);
    writeFileSync(DESTINO, zip);
    console.log(`Extensión v${version} → ${relative(RAIZ, DESTINO)} (${(zip.length / 1024).toFixed(0)} KB)`);
}
