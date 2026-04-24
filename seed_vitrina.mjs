import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const envFile = fs.readFileSync('.env.local', 'utf8');
const env = {};
envFile.split('\n').forEach(line => {
    const parts = line.split('=');
    if (parts.length >= 2) {
        env[parts[0].trim()] = parts.slice(1).join('=').trim();
    }
});

const supabase = createClient(env['VITE_SUPABASE_URL'], env['VITE_SUPABASE_ANON_KEY']);

async function seedVitrina() {
    console.log("Actualizando pedidos para la Vitrina de Retiros...");

    // Obtener los trabajos existentes
    const { data: trabajos, error } = await supabase
        .from('trabajos')
        .select('*')
        .order('fecha_entrada', { ascending: false });

    if (error || !trabajos?.length) {
        console.error("No se encontraron trabajos:", error);
        return;
    }

    console.log(`Encontrados ${trabajos.length} trabajos.`);

    // Poner el primer trabajo en Vitrina (listo para retiro)
    const { error: updateError } = await supabase
        .from('trabajos')
        .update({ estado: 'Vitrina' })
        .eq('id', trabajos[0].id);

    if (updateError) {
        console.error("Error actualizando a Vitrina:", updateError);
    } else {
        console.log(`✅ Trabajo #${trabajos[0].orden} (${trabajos[0].titular}) movido a VITRINA.`);
    }

    // Crear un tercer trabajo que ya esté en Vitrina
    const { data: clientes } = await supabase.from('clientes').select('*').limit(1);
    if (clientes?.length) {
        const { data: newTrabajo, error: insertError } = await supabase
            .from('trabajos')
            .insert([{
                cliente_id: clientes[0].id,
                titular: clientes[0].nombre,
                tipo: 'Diseño',
                subtipo: 'Tarjetas de Presentación x100 + Lona 2x1m',
                cantidad: 1,
                total: 55.00,
                abono: 20.00,
                saldo: 35.00,
                estado: 'Vitrina',
                origen: 'Interno',
                creado_por: 'Santiago',
                fecha_entrada: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
            }])
            .select()
            .single();

        if (insertError) {
            console.error("Error creando trabajo Vitrina:", insertError);
        } else {
            console.log(`✅ Nuevo trabajo #${newTrabajo.orden} creado directamente en VITRINA.`);
        }
    }

    console.log("Listo. Ve a 'Retiros' para probar el botón 'REGISTRAR Y GENERAR PDF'.");
}

seedVitrina().catch(console.error);
