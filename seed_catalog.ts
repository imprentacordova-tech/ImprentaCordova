import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import { MASTER_CATALOG } from './services/catalogData';

const envFile = fs.readFileSync('.env.local', 'utf8');
const env: Record<string, string> = {};
envFile.split('\n').forEach(line => {
    const parts = line.split('=');
    if (parts.length >= 2) {
        env[parts[0].trim()] = parts.slice(1).join('=').trim();
    }
});

const supabaseUrl = env['VITE_SUPABASE_URL'];
const supabaseKey = env['VITE_SUPABASE_ANON_KEY'];

const supabase = createClient(supabaseUrl, supabaseKey);

async function seedCatalog() {
    console.log(`Iniciando inserción de ${MASTER_CATALOG.length} productos del catálogo...`);
    
    // Preparar datos para supabase: 
    // en TS es camelCase (esSRI), en DB es snake_case (es_sri)
    const catalogData = MASTER_CATALOG.map(p => ({
        nombre: p.nombre,
        precio: p.precio,
        categoria: p.categoria,
        es_sri: p.esSRI || false,
        // Añadir una URL de imagen genérica por categoría para que se vea mejor (McDonalds style)
        imagen_url: getPlaceholderImage(p.categoria)
    }));

    // Delete existing products to avoid duplicates during test
    await supabase.from('productos').delete().neq('id', '00000000-0000-0000-0000-000000000000');

    const { data, error } = await supabase
        .from('productos')
        .insert(catalogData)
        .select();

    if (error) {
        console.error("Error insertando catálogo:", error);
    } else {
        console.log(`¡Éxito! ${data.length} productos insertados en Supabase.`);
    }
}

function getPlaceholderImage(categoria?: string) {
    switch(categoria?.toLowerCase()) {
        case 'oficina': return 'https://images.unsplash.com/photo-1586281380349-632531db7ed4?w=500&q=80';
        case 'tarjetas': return 'https://images.unsplash.com/photo-1589829085413-56de8ae18c73?w=500&q=80';
        case 'publicidad': return 'https://images.unsplash.com/photo-1626379953822-ba319517117e?w=500&q=80';
        case 'etiquetas': return 'https://images.unsplash.com/photo-1581447109200-bf2769116351?w=500&q=80';
        case 'gran formato': return 'https://images.unsplash.com/photo-1561070791-2526d30994b5?w=500&q=80';
        case 'sublimación': return 'https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?w=500&q=80';
        case 'merch': return 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=500&q=80';
        default: return 'https://images.unsplash.com/photo-1562564055-71e051d33c19?w=500&q=80';
    }
}

seedCatalog().catch(console.error);
