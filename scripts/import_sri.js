import fs from 'fs';
import readline from 'readline';
import { createClient } from '@supabase/supabase-js';

// Read from environment variables or .env file
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error('ERROR: Missing environment variables SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
    console.error('Usage: SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... node import_sri.js');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const FILE_PATH = './SRI_RUC_El_Oro.csv';
const BATCH_SIZE = 1000;

async function importSRI() {
  if (!fs.existsSync(FILE_PATH)) {
    console.error(`File not found: ${FILE_PATH}`);
    process.exit(1);
  }

  const fileStream = fs.createReadStream(FILE_PATH);
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });

  let isFirstLine = true;
  let batch = [];
  let totalProcessed = 0;
  let totalInserted = 0;

  console.log('Starting SRI padron import...');

  for await (const line of rl) {
    if (isFirstLine) {
      isFirstLine = false;
      continue;
    }

    const parts = line.split('|');
    if (parts.length < 19) continue;

    const ruc = parts[0]?.trim();
    const razon = parts[1]?.trim();
    
    if (ruc && razon) {
        if (!batch.some(item => item.ruc === ruc)) {
            batch.push({
                ruc: ruc,
                razon_social: razon,
                provincia: parts[14]?.trim() || null,
                canton: parts[15]?.trim() || null,
                parroquia: parts[16]?.trim() || null,
                estado_contribuyente: parts[3]?.trim() || null,
                tipo_persona: parts[10]?.trim() || null,
                actividad_economica: parts[18]?.trim() || null
            });
        }
    }

    if (batch.length >= BATCH_SIZE) {
      await insertBatch(batch);
      totalInserted += batch.length;
      console.log(`Inserted: ${totalInserted}`);
      batch = [];
    }
    
    totalProcessed++;
    if (totalProcessed % 10000 === 0) {
        console.log(`Progress: ${totalProcessed} rows processed...`);
    }
  }

  if (batch.length > 0) {
    await insertBatch(batch);
    totalInserted += batch.length;
  }

  console.log(`Import completed! Total: ${totalInserted}`);
}

async function insertBatch(records) {
  const { error } = await supabase
    .from('sri_padron_el_oro')
    .upsert(records, { onConflict: 'ruc' });
  
  if (error) {
    console.error('Batch insert error:', error.message);
  }
}

importSRI().catch(console.error);
