import fs from 'fs';
import readline from 'readline';
import { createClient } from '@supabase/supabase-js';

// Reemplazar con las credenciales reales
const SUPABASE_URL = 'https://keilxgrrevfsvyxufecz.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtlaWx4Z3JyZXZmc3Z5eHVmZWN6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjM1NDI2NSwiZXhwIjoyMDkxOTMwMjY1fQ._-lyaAeKlLAh701R2h-KUbu3gxcSdcOIjATo8traqEQ'; // Service Role
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const FILE_PATH = './SRI_RUC_El_Oro.csv';
const BATCH_SIZE = 1000;

async function importSRI() {
  const fileStream = fs.createReadStream(FILE_PATH);
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });

  let isFirstLine = true;
  let batch = [];
  let totalProcessed = 0;
  let totalInserted = 0;

  console.log('Iniciando importación...');

  for await (const line of rl) {
    if (isFirstLine) {
      isFirstLine = false;
      continue; // Skip headers
    }

    const parts = line.split('|');
    if (parts.length < 19) continue;

    // NUMERO_RUC|RAZON_SOCIAL|CODIGO_JURISDICCION|ESTADO_CONTRIBUYENTE|CLASE_CONTRIBUYENTE|...
    // 0: NUMERO_RUC, 1: RAZON_SOCIAL, 3: ESTADO, 10: TIPO_PERSONA, 14: PROVINCIA, 15: CANTON, 16: PARROQUIA, 18: ACTIVIDAD
    const ruc = parts[0]?.trim();
    const razon = parts[1]?.trim();
    
    if (!ruc || !razon) continue;

    batch.push({
      ruc: ruc,
      razon_social: razon,
      estado_contribuyente: parts[3]?.trim() || null,
      tipo_persona: parts[10]?.trim() || null,
      provincia: parts[14]?.trim() || null,
      canton: parts[15]?.trim() || null,
      parroquia: parts[16]?.trim() || null,
      actividad_economica: parts[18]?.trim() || null
    });

    if (batch.length >= BATCH_SIZE) {
      await insertBatch(batch);
      totalInserted += batch.length;
      console.log(`Insertados: ${totalInserted}`);
      batch = [];
    }
    
    totalProcessed++;
    // Opcional: Parar a los 10000 para no hacer esperar al usuario mientras programamos
    if (totalProcessed >= 10000) {
        console.log('Test run limited to 10000 rows for speed.');
        break;
    }
  }

  // Insertar resto
  if (batch.length > 0) {
    await insertBatch(batch);
    totalInserted += batch.length;
  }

  console.log(`¡Importación completada! Total: ${totalInserted}`);
}

async function insertBatch(records) {
  const { error } = await supabase
    .from('sri_padron_el_oro')
    .upsert(records, { onConflict: 'ruc' });
  
  if (error) {
    console.error('Error insertando batch:', error.message);
  }
}

importSRI().catch(console.error);
