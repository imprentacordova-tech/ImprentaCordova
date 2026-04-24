import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const envFile = fs.readFileSync('.env.local', 'utf8');
const env = {};
envFile.split('\n').forEach(line => {
    const parts = line.split('=');
    if (parts.length === 2) {
        env[parts[0].trim()] = parts[1].trim();
    }
});

const supabaseUrl = env['VITE_SUPABASE_URL'];
const supabaseKey = env['VITE_SUPABASE_ANON_KEY'];

const supabase = createClient(supabaseUrl, supabaseKey);

async function seed() {
    console.log("Iniciando inserción de datos...");

    // 1. Crear clientes de prueba
    const clientes = [
        {
            cedula: '1720000000',
            ruc: '1720000000001',
            nombre: 'Juan Perez',
            nombre_comercial: 'Ferreteria Perez',
            direccion: 'Av. Amazonas y Patria',
            telefono: ['0991234567'],
            email: 'juan@perez.com',
            regimen: 'RIMPE'
        },
        {
            cedula: '0910000000',
            ruc: '0910000000001',
            nombre: 'Maria Lopez',
            nombre_comercial: 'Papeleria Lopez',
            direccion: 'Av. 9 de Octubre',
            telefono: ['0987654321'],
            email: 'maria@lopez.com',
            regimen: 'General'
        }
    ];

    const { data: insertedClientes, error: clientesError } = await supabase
        .from('clientes')
        .insert(clientes)
        .select();

    if (clientesError) {
        console.error("Error insertando clientes:", clientesError);
        return;
    }
    console.log("Clientes creados:", insertedClientes.length);

    // 2. Crear trabajos (Pedidos) de prueba (1 Normal, 1 SRI)
    const trabajos = [
        {
            cliente_id: insertedClientes[0].id,
            titular: 'Juan Perez',
            tipo: 'Diseño',
            subtipo: 'Gigantografía',
            cantidad: 2,
            tamano: '2x1m',
            total: 35.00,
            abono: 15.00,
            saldo: 20.00,
            estado: 'En Proceso',
            origen: 'Interno'
        },
        {
            cliente_id: insertedClientes[1].id,
            titular: 'Maria Lopez',
            tipo: 'SRI',
            subtipo: 'Facturas',
            cantidad: 10,
            tamano: '1/2 Carta',
            total: 45.00,
            abono: 0.00,
            saldo: 45.00,
            estado: 'Pendiente',
            origen: 'SRI',
            actividad_seleccionada: 'Venta de Papelería',
            establecimiento: '001',
            punto_emision: '001',
            imprimir_clave: true
        }
    ];

    const { data: insertedTrabajos, error: trabajosError } = await supabase
        .from('trabajos')
        .insert(trabajos)
        .select();

    if (trabajosError) {
        console.error("Error insertando trabajos:", trabajosError);
        return;
    }
    console.log("Trabajos creados:", insertedTrabajos.length);
    console.log("Datos de prueba insertados con éxito.");
}

seed().catch(console.error);
