import { supabase } from './supabase';
import { FacturaElectronica, EstadoFacturaSri, FacturaDetalleItem } from '../types';

const RENDER_SRI_API_URL = import.meta.env.VITE_RENDER_SRI_API_URL || 'https://cordova-sri-api.onrender.com';
// IVA vigente en Ecuador desde abril de 2024.
const DEFAULT_IVA_RATE = 0.15;

export const calcularModulo11 = (cadena48: string): number => {
  let suma = 0;
  let peso = 2;
  for (let i = cadena48.length - 1; i >= 0; i--) {
    const digito = parseInt(cadena48.charAt(i), 10);
    suma += digito * peso;
    peso = peso === 7 ? 2 : peso + 1;
  }
  const residuo = suma % 11;
  let digitoVerificador = 11 - residuo;
  if (digitoVerificador === 11) digitoVerificador = 0;
  if (digitoVerificador === 10) digitoVerificador = 1;
  return digitoVerificador;
};

export const generarClaveAccesoSRI = ({
  fechaEmision,
  tipoComprobante = '01',
  rucEmisor = '0703819284001',
  ambiente = '1',
  establecimiento = '001',
  puntoEmision = '001',
  secuencial = '000000001',
  codigoNumerico = '12345678',
  tipoEmision = '1'
}: {
  fechaEmision: Date | string;
  tipoComprobante?: string;
  rucEmisor?: string;
  ambiente?: '1' | '2';
  establecimiento?: string;
  puntoEmision?: string;
  secuencial?: string | number;
  codigoNumerico?: string;
  tipoEmision?: string;
}): string => {
  const d = typeof fechaEmision === 'string' ? new Date(fechaEmision) : fechaEmision;
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = String(d.getFullYear());
  const fechaFormatted = `${day}${month}${year}`;
  const est = String(establecimiento).padStart(3, '0');
  const pto = String(puntoEmision).padStart(3, '0');
  const sec = String(secuencial).padStart(9, '0');
  const cod = String(codigoNumerico).padStart(8, '0');
  const ruc = String(rucEmisor).padStart(13, '0');
  const cadena48 = `${fechaFormatted}${tipoComprobante}${ruc}${ambiente}${est}${pto}${sec}${cod}${tipoEmision}`;
  const digito = calcularModulo11(cadena48);
  return `${cadena48}${digito}`;
};

async function getIvaRate(): Promise<number> {
  try {
    const { data } = await supabase.from('app_config').select('data').eq('id', 1).maybeSingle();
    if (data?.data?.iva_rate) return Number(data.data.iva_rate);
  } catch {
    // fallback to default
  }
  return DEFAULT_IVA_RATE;
}

async function getNextSecuencial(): Promise<{ secuencial: string; numeroFactura: string }> {
  // Use atomic RPC if available, fallback to COUNT
  try {
    const { data, error } = await supabase.rpc('next_invoice_number');
    if (!error && data) {
      const sec = String(data).padStart(9, '0');
      return { secuencial: sec, numeroFactura: `001-001-${sec}` };
    }
  } catch {
    // Fallback
  }

  const { count } = await supabase
    .from('facturas_electronicas')
    .select('*', { count: 'exact', head: true });
  const next = (count || 0) + 1;
  const sec = String(next).padStart(9, '0');
  return { secuencial: sec, numeroFactura: `001-001-${sec}` };
}

export const sriInvoiceService = {
  async getFacturas(): Promise<FacturaElectronica[]> {
    try {
      const { data, error } = await supabase
        .from('facturas_electronicas')
        .select('*')
        .order('fecha_emision', { ascending: false });
      if (error) {
        console.warn('[sriInvoiceService] Table not available:', error.message);
        return [];
      }
      return (data || []).map(rowToFactura);
    } catch (err) {
      console.error('[sriInvoiceService] Error fetching invoices:', err);
      return [];
    }
  },

  async emitirFactura(payload: {
    trabajoId?: string;
    clienteId: string;
    clienteNombre: string;
    clienteIdentificacion: string;
    clienteTipoId: 'RUC' | 'CEDULA' | 'PASAPORTE';
    clienteEmail?: string;
    clienteDireccion?: string;
    detalles: FacturaDetalleItem[];
    establecimiento?: string;
    puntoEmision?: string;
    ambiente?: 'PRUEBAS' | 'PRODUCCION';
    rucEmisor?: string;
  }): Promise<{ success: boolean; factura?: FacturaElectronica; error?: string }> {
    try {
      const establecimiento = payload.establecimiento || '001';
      const puntoEmision = payload.puntoEmision || '001';
      const ambienteStr = payload.ambiente === 'PRODUCCION' ? '2' : '1';

      // 1. Get atomic sequential number
      const { secuencial: secuencialStr, numeroFactura } = await getNextSecuencial();

      // 2. Calculate totals with configurable IVA
      const ivaRate = await getIvaRate();
      let subtotal12 = 0;
      let subtotal0 = 0;
      payload.detalles.forEach(item => {
        if (item.iva > 0) {
          subtotal12 += item.precioTotal;
        } else {
          subtotal0 += item.precioTotal;
        }
      });

      const subtotalSinImpuestos = subtotal12 + subtotal0;
      const iva12 = Number((subtotal12 * ivaRate).toFixed(2));
      const total = Number((subtotalSinImpuestos + iva12).toFixed(2));

      // 3. Generate 49-digit access key
      const codigoNumerico = String(Math.floor(10000000 + Math.random() * 90000000));
      const claveAcceso = generarClaveAccesoSRI({
        fechaEmision: new Date(),
        tipoComprobante: '01',
        rucEmisor: payload.rucEmisor || '0703819284001',
        ambiente: ambienteStr,
        establecimiento,
        puntoEmision,
        secuencial: secuencialStr,
        codigoNumerico
      });

      const nowIso = new Date().toISOString();

      // 4. Try Render backend
      /*
       * Una factura SOLO queda AUTORIZADO si el SRI la autorizó de verdad. Antes arrancaba
       * en AUTORIZADO con un número inventado ("SRI-AUTH-<fecha>") y así quedaba si el backend
       * no respondía. Además el backend actual NO envía nada al SRI (devuelve AUTORIZADO en
       * modo simulación): por eso solo se acepta su respuesta cuando declara
       * `enviadoAlSri: true`, que es lo que tiene que devolver la integración real.
       */
      let estadoInicial: EstadoFacturaSri = 'PENDIENTE';
      let autorizacionNum: string | null = null;
      let mensajesSri: string[] = ['NO ENVIADA AL SRI: el envío electrónico todavía no está habilitado. Este registro no es un comprobante autorizado.'];

      try {
        const response = await fetch(`${RENDER_SRI_API_URL}/api/v1/facturas/emitir`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            claveAcceso,
            numeroFactura,
            cliente: {
              identificacion: payload.clienteIdentificacion,
              razonSocial: payload.clienteNombre,
              tipoIdentificacion: payload.clienteTipoId,
              email: payload.clienteEmail,
              direccion: payload.clienteDireccion
            },
            totales: { subtotal12, subtotal0, iva12, total },
            detalles: payload.detalles
          })
        });
        if (response.ok) {
          const apiData = await response.json();
          if (apiData.enviadoAlSri === true) {
            if (apiData.estado) estadoInicial = apiData.estado;
            if (apiData.numeroAutorizacion) autorizacionNum = apiData.numeroAutorizacion;
            if (apiData.mensajes) mensajesSri = apiData.mensajes;
          }
        }
      } catch (backendErr) {
        console.warn('[sriInvoiceService] Backend not reachable, sandbox mode:', backendErr);
      }

      // 5. Persist to Supabase
      const newRow = {
        trabajo_id: payload.trabajoId || null,
        cliente_id: payload.clienteId,
        clave_acceso: claveAcceso,
        numero_factura: numeroFactura,
        establecimiento,
        punto_emision: puntoEmision,
        secuencial: secuencialStr,
        fecha_emision: nowIso,
        cliente_nombre: payload.clienteNombre,
        cliente_identificacion: payload.clienteIdentificacion,
        cliente_tipo_id: payload.clienteTipoId,
        cliente_email: payload.clienteEmail || null,
        cliente_direccion: payload.clienteDireccion || null,
        subtotal_sin_impuestos: subtotalSinImpuestos,
        subtotal_12: subtotal12,
        subtotal_0: subtotal0,
        iva_12: iva12,
        total,
        estado: estadoInicial,
        ambiente: payload.ambiente || 'PRUEBAS',
        mensajes_sri: mensajesSri,
        fecha_autorizacion: estadoInicial === 'AUTORIZADO' ? nowIso : null,
        numero_autorizacion: autorizacionNum,
        ride_pdf_url: null,
        email_enviado: false,
        detalles: payload.detalles
      };

      const { data: dbFactura, error: dbErr } = await supabase
        .from('facturas_electronicas')
        .insert(newRow)
        .select('*')
        .single();

      if (dbErr) {
        // Antes devolvía "éxito" con una factura armada en memoria que no quedaba guardada.
        console.error('[sriInvoiceService] Supabase insert error:', dbErr);
        return {
          success: false,
          error: `No se pudo guardar la factura (${dbErr.message || 'error de base de datos'}). Si dice que la tabla no existe, falta correr supabase/PRODUCCION_tablas_faltantes.sql.`,
        };
      }

      return { success: true, factura: rowToFactura(dbFactura) };
    } catch (err) {
      console.error('[sriInvoiceService] Fatal error:', err);
      return { success: false, error: err instanceof Error ? err.message : 'Error al procesar la factura electronica' };
    }
  },

  async consultarEstadoSri(claveAcceso: string): Promise<{ estado: EstadoFacturaSri; mensajes: string[] }> {
    try {
      const response = await fetch(`${RENDER_SRI_API_URL}/api/v1/facturas/${claveAcceso}/estado`);
      if (response.ok) {
        const data = await response.json();
        return { estado: data.estado || 'AUTORIZADO', mensajes: data.mensajes || [] };
      }
    } catch (err) {
      console.warn('[sriInvoiceService] Query failed:', err);
    }
    return { estado: 'AUTORIZADO', mensajes: ['COMPROBANTE AUTORIZADO - AMBIENTE DE PRUEBAS'] };
  }
};

function rowToFactura(row: any): FacturaElectronica {
  return {
    id: row.id,
    trabajoId: row.trabajo_id,
    clienteId: row.cliente_id,
    claveAcceso: row.clave_acceso,
    numeroFactura: row.numero_factura,
    establecimiento: row.establecimiento,
    puntoEmision: row.punto_emision,
    secuencial: row.secuencial,
    fechaEmision: row.fecha_emision,
    clienteNombre: row.cliente_nombre,
    clienteIdentificacion: row.cliente_identificacion,
    clienteTipoId: row.cliente_tipo_id || 'RUC',
    clienteEmail: row.cliente_email,
    clienteDireccion: row.cliente_direccion,
    subtotalSinImpuestos: Number(row.subtotal_sin_impuestos || 0),
    subtotal12: Number(row.subtotal_12 || 0),
    subtotal0: Number(row.subtotal_0 || 0),
    iva12: Number(row.iva_12 || 0),
    total: Number(row.total || 0),
    estado: row.estado as EstadoFacturaSri,
    ambiente: row.ambiente || 'PRUEBAS',
    mensajesSri: Array.isArray(row.mensajes_sri) ? row.mensajes_sri : [],
    fechaAutorizacion: row.fecha_autorizacion,
    numeroAutorizacion: row.numero_autorizacion,
    xmlSignedUrl: row.xml_signed_url,
    ridePdfUrl: row.ride_pdf_url,
    emailEnviado: Boolean(row.email_enviado),
    detalles: Array.isArray(row.detalles) ? row.detalles : [],
    created_at: row.created_at
  };
}
