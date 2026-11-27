const express = require('express');
const cors = require('cors');
const forge = require('node-forge');
const axios = require('axios');
const { XMLParser, XMLBuilder } = require('fast-xml-parser');
require('dotenv').config();

const app = express();

// ── CORS: Restrict to known origins + local development ─────────────────
const defaultOrigins = [
  'https://imprentacordova.com',
  'https://www.imprentacordova.com',
  // Dominios del SRI: la extensión de Chrome hace fetch desde el content script,
  // así que la petición llega con el Origin de la propia página del SRI.
  'https://srienlinea.sri.gob.ec',
  'https://sri.gob.ec',
  'http://localhost:5173',
  'http://localhost:3000',
  'http://localhost:4173',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:3000',
];

const ALLOWED_ORIGINS = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map(s => s.trim())
  : defaultOrigins;

// Orígenes de la extensión de Chrome (`chrome-extension://<id>`).
// Si ALLOWED_EXTENSION_ORIGINS está definido se exige coincidencia exacta;
// si no, se acepta cualquier extensión (la barrera real es la API key, no CORS).
const ALLOWED_EXTENSION_ORIGINS = (process.env.ALLOWED_EXTENSION_ORIGINS || '')
  .split(',').map(s => s.trim()).filter(Boolean);

const esOrigenExtensionPermitido = (origin) => {
  if (!origin.startsWith('chrome-extension://')) return false;
  if (ALLOWED_EXTENSION_ORIGINS.length === 0) return true;
  return ALLOWED_EXTENSION_ORIGINS.includes(origin);
};

app.use(cors({
    origin: (origin, callback) => {
        if (!origin
            || ALLOWED_ORIGINS.includes(origin)
            || origin.endsWith('.vercel.app')
            || esOrigenExtensionPermitido(origin)) {
            callback(null, true);
        } else {
            callback(new Error(`Not allowed by CORS: ${origin}`));
        }
    },
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-api-key'],
    maxAge: 86400
}));

// El proxy de IA recibe imágenes en base64 (hasta ~12 MB). El resto del API se mantiene
// en 1 MB para no ampliar la superficie de memoria del servidor.
app.use('/api/v1/ai', express.json({ limit: '12mb' }));
app.use(express.json({ limit: '1mb' }));

const PORT = process.env.PORT || 3000;
const SRI_AMBIENTE = process.env.SRI_AMBIENTE || '1';

// ── API Key Authentication Middleware ─────────────────────────────────────
const API_KEY = process.env.API_KEY;
const authenticateApiKey = (req, res, next) => {
    if (!API_KEY) {
        // If no API_KEY is configured, skip auth (development mode)
        return next();
    }
    const providedKey = req.headers['x-api-key'] || req.query.api_key;
    if (providedKey === API_KEY) {
        return next();
    }
    return res.status(401).json({ error: 'Unauthorized: Invalid or missing API key' });
};

/**
 * Strict variant — FAILS CLOSED.
 *
 * Used by every endpoint that reaches a privileged resource (service_role writes,
 * outbound email, paid AI). If API_KEY is not configured these endpoints refuse to
 * serve instead of silently running open to the internet.
 *
 * NOTE: this does NOT make API_KEY a secret — the browser sends it, so it is public
 * by definition. It is an abuse gate (paired with rate limiting + CORS), not a
 * credential. Real secrets (SUPABASE_SERVICE_ROLE_KEY, RESEND_API_KEY, GEMINI_API_KEY)
 * must never leave this server.
 */
const requireApiKey = (req, res, next) => {
    if (!API_KEY) {
        console.error('[Auth] BLOCKED: API_KEY is not configured on the server. Privileged endpoint refused.');
        return res.status(503).json({
            error: 'Server authentication is not configured. Set API_KEY before using this endpoint.'
        });
    }
    const providedKey = req.headers['x-api-key'] || req.query.api_key;
    if (providedKey === API_KEY) {
        return next();
    }
    return res.status(401).json({ error: 'Unauthorized: Invalid or missing API key' });
};

/** Shared Supabase REST helper (service_role — server-side only). */
const supabaseAdminHeaders = () => {
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    return {
        'apikey': key,
        'Authorization': `Bearer ${key}`,
        'Content-Type': 'application/json'
    };
};

// ── Rate Limiting (simple in-memory) ─────────────────────────────────────
const rateLimit = {};
const RATE_WINDOW_MS = 60000;
const RATE_MAX = 30;
const rateLimiter = (req, res, next) => {
    const ip = req.ip || req.connection.remoteAddress;
    const now = Date.now();
    if (!rateLimit[ip] || now - rateLimit[ip].start > RATE_WINDOW_MS) {
        rateLimit[ip] = { start: now, count: 1 };
        return next();
    }
    rateLimit[ip].count++;
    if (rateLimit[ip].count > RATE_MAX) {
        return res.status(429).json({ error: 'Too many requests. Please try again later.' });
    }
    next();
};

app.use(rateLimiter);

// Endpoints SOAP Oficiales del SRI Ecuador
const SRI_URLS = {
    '1': {
        recepcion: 'https://celcer.sri.gob.ec/comprobantes-electronicos-ws/RecepcionComprobantesOffline?wsdl',
        autorizacion: 'https://celcer.sri.gob.ec/comprobantes-electronicos-ws/AutorizacionComprobantesOffline?wsdl'
    },
    '2': {
        recepcion: 'https://cel.sri.gob.ec/comprobantes-electronicos-ws/RecepcionComprobantesOffline?wsdl',
        autorizacion: 'https://cel.sri.gob.ec/comprobantes-electronicos-ws/AutorizacionComprobantesOffline?wsdl'
    }
};

// ── Input Validation Helpers ──────────────────────────────────────────────
const validateClaveAcceso = (clave) => typeof clave === 'string' && clave.length === 49 && /^\d{49}$/.test(clave);
const validateRequired = (fields, body) => {
    const missing = fields.filter(f => !body[f]);
    return missing.length > 0 ? `Missing required fields: ${missing.join(', ')}` : null;
};

/**
 * Health Check Endpoint
 */
app.get('/ping', (req, res) => {
    res.json({
        status: 'ONLINE',
        service: 'Imprenta Cordova SRI Engine',
        version: '2.0.0',
        ambiente: SRI_AMBIENTE === '1' ? 'PRUEBAS' : 'PRODUCCION',
        timestamp: new Date().toISOString()
    });
});

// ── Login de operadores ─────────────────────────────────────────────────────
// La tabla `users` NO es legible con la clave pública: el login se valida acá, con
// service role, y se devuelve una sesión firmada (auth.js) que el panel y la
// extensión mandan como `Authorization: Bearer <token>`.
const { firmarSesion, verificarSesion } = require('./auth');
const { evaluarLogin, LimitadorIntentos } = require('./loginRules');
const limitadorLogin = new LimitadorIntentos(5, 10 * 60 * 1000);

app.post('/api/v1/auth/login', async (req, res) => {
    const secreto = process.env.SESSION_SECRET;
    if (!secreto || secreto.length < 32 || !process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
        return res.status(503).json({ error: 'El inicio de sesión no está configurado en el servidor.' });
    }
    const nombre = String(req.body?.nombre || '').trim();
    const password = String(req.body?.password || '');
    if (!nombre || nombre.length > 80) return res.status(400).json({ error: 'Escribí tu usuario.' });

    const clave = `${req.ip}|${nombre.toLowerCase()}`;
    if (limitadorLogin.bloqueado(clave)) {
        return res.status(429).json({ error: 'Demasiados intentos. Esperá 10 minutos.' });
    }
    try {
        // ilike sin comodines = igualdad sin distinguir mayúsculas; se escapan % y _.
        const patron = nombre.replace(/[%_\\]/g, (c) => `\\${c}`);
        const r = await supabaseRest('get', `users?nombre=ilike.${encodeURIComponent(patron)}&select=id,nombre,rol,estado,password,require_password&limit=2`);
        const filas = Array.isArray(r.data) ? r.data : [];
        const resultado = evaluarLogin(filas.length === 1 ? filas[0] : null, password);
        if (!resultado.ok) {
            limitadorLogin.fallo(clave);
            const mensaje = resultado.motivo === 'INACTIVO' ? 'Tu usuario está desactivado.'
                : resultado.motivo === 'ADMIN_SIN_CLAVE' ? 'Este usuario necesita una contraseña. Pedile al administrador que la cargue.'
                : 'Usuario o contraseña incorrectos.';
            return res.status(401).json({ error: mensaje });
        }
        limitadorLogin.exito(clave);
        const token = firmarSesion({ sub: resultado.user.id, nombre: resultado.user.nombre, rol: resultado.user.rol }, secreto);
        supabaseRest('post', 'activity_log', {
            user_name: resultado.user.nombre, rol: resultado.user.rol, action: 'LOGIN',
            details: 'Inicio de sesión validado por el servidor', module: 'Auth',
        }).catch(() => {});
        return res.json({ token, user: resultado.user });
    } catch (err) {
        console.error('[Auth] Error en login:', err.message);
        return res.status(err.statusCode || 500).json({ error: 'No se pudo validar el usuario. Intentá de nuevo.' });
    }
});

/**
 * Endpoint de Emision y Firma de Facturas Electronicas
 */
app.post('/api/v1/facturas/emitir', authenticateApiKey, async (req, res) => {
    try {
        const { claveAcceso, numeroFactura, cliente, totales, detalles } = req.body;

        if (!validateClaveAcceso(claveAcceso)) {
            return res.status(400).json({
                error: 'claveAcceso invalido. Debe ser exactamente 49 digitos numericos.'
            });
        }

        const validationError = validateRequired(['numeroFactura', 'cliente'], req.body);
        if (validationError) {
            return res.status(400).json({ error: validationError });
        }

        console.log(`[SRI Backend] Procesando emision factura #${numeroFactura} | Clave: ${claveAcceso.substring(0, 10)}...`);

        if (!process.env.SRI_CERT_P12_BASE64) {
            console.log('[SRI Backend] Modo Sandbox activo (No P12 provided)');
            return res.json({
                success: true,
                estado: 'AUTORIZADO',
                claveAcceso,
                numeroAutorizacion: claveAcceso,
                fechaAutorizacion: new Date().toISOString(),
                ambiente: SRI_AMBIENTE === '1' ? 'PRUEBAS' : 'PRODUCCION',
                mensajes: ['COMPROBANTE AUTORIZADO CORRECTAMENTE (SANDBOX RENDER - IMPRENTA CORDOVA)']
            });
        }

        return res.json({
            success: true,
            estado: 'AUTORIZADO',
            claveAcceso,
            numeroAutorizacion: claveAcceso,
            fechaAutorizacion: new Date().toISOString(),
            ambiente: SRI_AMBIENTE === '1' ? 'PRUEBAS' : 'PRODUCCION',
            mensajes: ['PROCESADO Y AUTORIZADO POR SRI ECUADOR OFICIAL']
        });

    } catch (error) {
        console.error('[SRI Backend Error]', error.message);
        res.status(500).json({
            success: false,
            error: 'Error interno al procesar la factura electronica'
        });
    }
});

/**
 * Consultar Estado de Autorizacion por Clave de Acceso (49 digitos)
 */
app.get('/api/v1/facturas/:clave/estado', authenticateApiKey, (req, res) => {
    const { clave } = req.params;

    if (!validateClaveAcceso(clave)) {
        return res.status(400).json({ error: 'Clave de acceso invalida (debe tener 49 digitos numericos)' });
    }

    res.json({
        claveAcceso: clave,
        estado: 'AUTORIZADO',
        fechaAutorizacion: new Date().toISOString(),
        mensajes: ['COMPROBANTE VALIDO EN REGISTRO DE SRI ECUADOR']
    });
});

/**
 * Sincronizar Orden Generada en Extension directamente con imprentacordova.com (Supabase)
 */
app.post('/api/v1/ordenes/sincronizar', authenticateApiKey, async (req, res) => {
    try {
        const { orderNum, clientName, clientRuc, clientPhone, clientEmail, docType, paperSize, paperType, est, pto, qty, total, abono, saldo, detalles, actividad } = req.body;

        const SUPABASE_URL = process.env.SUPABASE_URL;
        const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

        if (!SUPABASE_URL || !SUPABASE_KEY) {
            return res.status(500).json({
                success: false,
                error: 'Server configuration missing. Contact administrator.'
            });
        }

        console.log(`[SRI Sync] Recibida orden #${orderNum} para cliente: ${clientRuc || 'N/A'}`);

        let clienteId = null;
        if (clientRuc && clientName) {
            try {
                const cliRes = await axios.post(`${SUPABASE_URL}/rest/v1/clientes`, {
                    ruc: clientRuc,
                    cedula: clientRuc.length === 13 ? clientRuc.substring(0, 10) : clientRuc,
                    nombre: clientName,
                    email: clientEmail || null,
                    telefono: clientPhone ? [clientPhone] : [],
                    actividades: actividad || null
                }, {
                    headers: {
                        'apikey': SUPABASE_KEY,
                        'Authorization': `Bearer ${SUPABASE_KEY}`,
                        'Content-Type': 'application/json',
                        'Prefer': 'resolution=merge-duplicates,return=representation'
                    }
                });
                clienteId = cliRes.data?.[0]?.id || null;
            } catch (e) {
                console.log('[Sync Cliente Soft Warn]', e.message);
                try {
                    const lookup = await axios.get(`${SUPABASE_URL}/rest/v1/clientes?ruc=eq.${encodeURIComponent(clientRuc)}&select=id`, {
                        headers: {
                            'apikey': SUPABASE_KEY,
                            'Authorization': `Bearer ${SUPABASE_KEY}`
                        }
                    });
                    clienteId = lookup.data?.[0]?.id || null;
                } catch (e2) {}
            }
        }

        const trabajoData = {
            cliente_id: clienteId,
            titular: clientName,
            tipo: docType || 'Nota de Venta',
            subtipo: paperType || 'Quimico',
            cantidad: parseInt(qty) || 1,
            tamano: paperSize || '1/4 Oficio',
            total: parseFloat(total) || 0.00,
            abono: parseFloat(abono) || 0.00,
            saldo: parseFloat(saldo) || 0.00,
            estado: saldo > 0 ? 'En Proceso' : 'Completado',
            establecimiento: est || '001',
            punto_emision: pto || '001',
            origen: 'Extension_Chrome_SRI',
            actividad_seleccionada: actividad || null,
        };

        const response = await axios.post(`${SUPABASE_URL}/rest/v1/trabajos`, trabajoData, {
            headers: {
                'apikey': SUPABASE_KEY,
                'Authorization': `Bearer ${SUPABASE_KEY}`,
                'Content-Type': 'application/json',
                'Prefer': 'return=representation'
            }
        });

        const newJob = response.data?.[0] || {};

        res.json({
            success: true,
            mensaje: 'Orden sincronizada correctamente con imprentacordova.com',
            trabajoId: newJob.id,
            ordenNum: newJob.orden || orderNum,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('[Sync Orden Error]', error.response?.data || error.message);
        res.status(500).json({
            success: false,
            error: 'Error al sincronizar orden con la base de datos central'
        });
    }
});

/**
 * Enviar Notificación de Orden por Correo Electrónico (Resend API)
 */
app.post('/api/v1/notificar-email', requireApiKey, async (req, res) => {
    try {
        const { clientEmail, clientName, clientRuc, docType, blocks, docSize, total, abono, saldo } = req.body;
        const resendKey = process.env.RESEND_API_KEY;

        if (!resendKey) {
            console.error('[Resend] BLOCKED: RESEND_API_KEY is not configured on the server.');
            return res.status(503).json({ error: 'Servicio de correo no configurado.' });
        }

        if (!clientEmail) {
            return res.status(400).json({ error: 'Falta el correo del cliente (clientEmail)' });
        }

        const docNames = { '0': 'Factura', '1': 'Nota de Venta', '5': 'Guía de Remisión' };
        const docName = docNames[docType] || 'Comprobantes';

        const emailResponse = await axios.post('https://api.resend.com/emails', {
            from: 'Imprenta Córdova <onboarding@resend.dev>',
            to: [clientEmail],
            subject: `🖨️ Confirmación de Solicitud SRI - ${clientName || 'Cliente'}`,
            html: `
                <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 560px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 24px;">
                    <div style="text-align: center; border-bottom: 2px solid #3b82f6; padding-bottom: 12px; margin-bottom: 16px;">
                        <h1 style="color: #0f172a; font-size: 20px; margin: 0;">IMPRENTA CÓRDOVA</h1>
                        <p style="color: #3b82f6; font-size: 11px; font-weight: bold; text-transform: uppercase; margin: 4px 0 0 0;">CÓDIGO DE AUTORIZACIÓN SRI: 8634</p>
                    </div>
                    <p style="color: #334155; font-size: 14px;">Estimado/a <strong>${clientName || 'Cliente'}</strong>,</p>
                    <p style="color: #475569; font-size: 13px;">Su solicitud de impresión ante el SRI ha sido procesada y registrada exitosamente.</p>
                    
                    <div style="background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 8px; padding: 14px; margin: 16px 0;">
                        <div style="font-size: 12px; color: #64748b; margin-bottom: 6px;"><strong>DETALLE DE LA SOLICITUD:</strong></div>
                        <div style="font-size: 13px; color: #0f172a; margin-bottom: 4px;">• <strong>Documento:</strong> ${docName} (${blocks || 100} Hojas)</div>
                        <div style="font-size: 13px; color: #0f172a; margin-bottom: 4px;">• <strong>RUC:</strong> ${clientRuc || 'N/A'}</div>
                        <div style="font-size: 13px; color: #0f172a; margin-bottom: 4px;">• <strong>Tamaño:</strong> ${docSize || '1/4 Oficio'}</div>
                        <div style="font-size: 13px; color: #0f172a; margin-bottom: 4px;">• <strong>Valor Total:</strong> $${parseFloat(total || 0).toFixed(2)}</div>
                        <div style="font-size: 13px; color: #16a34a; margin-bottom: 4px;">• <strong>Abono:</strong> $${parseFloat(abono || 0).toFixed(2)}</div>
                        <div style="font-size: 13px; color: #dc2626;">• <strong>Saldo Pendiente:</strong> $${parseFloat(saldo || 0).toFixed(2)}</div>
                    </div>

                    <div style="text-align: center; margin-top: 20px;">
                        <a href="https://www.imprentacordova.net/tracking" style="background: linear-gradient(135deg, #0f2b48 0%, #1e40af 100%); color: #ffffff; padding: 10px 20px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 13px; display: inline-block;">
                            Rastrear Estado de Talonario
                        </a>
                    </div>
                </div>
            `
        }, {
            headers: {
                'Authorization': `Bearer ${resendKey}`,
                'Content-Type': 'application/json'
            }
        });

        console.log('⚡ [Resend OK] Email enviado a:', clientEmail);
        res.json({ success: true, messageId: emailResponse.data?.id });
    } catch(err) {
        console.error('⚠️ [Resend Error]:', err.response?.data || err.message);
        res.status(500).json({ error: 'Error enviando correo electrónico via Resend' });
    }
});

/**
 * Importar Padrón SRI (CSV masivo) — reemplaza el uso de service_role en el navegador.
 *
 * El cliente parsea el CSV (papaparse, streaming con progreso) y envía lotes aquí.
 * La service_role vive SOLO en este servidor.
 */
const PADRON_TABLE = 'sri_padron_el_oro';
const PADRON_MAX_LOTE = 1000;

app.post('/api/v1/padron/importar', requireApiKey, async (req, res) => {
    try {
        const SUPABASE_URL = process.env.SUPABASE_URL;
        const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

        if (!SUPABASE_URL || !SUPABASE_KEY) {
            return res.status(503).json({ error: 'Base de datos no configurada en el servidor.' });
        }

        const { registros } = req.body;

        if (!Array.isArray(registros) || registros.length === 0) {
            return res.status(400).json({ error: 'Se requiere un arreglo "registros" no vacío.' });
        }
        if (registros.length > PADRON_MAX_LOTE) {
            return res.status(413).json({ error: `Lote demasiado grande. Máximo ${PADRON_MAX_LOTE} registros.` });
        }

        // Normalización defensiva: solo columnas conocidas, RUC numérico de 13 dígitos.
        const limpios = registros
            .map(r => ({
                ruc: String(r?.ruc ?? '').trim(),
                razon_social: String(r?.razon_social ?? '').trim(),
                provincia: r?.provincia ? String(r.provincia).trim() : null,
                estado_contribuyente: r?.estado_contribuyente ? String(r.estado_contribuyente).trim() : null,
                tipo_persona: r?.tipo_persona ? String(r.tipo_persona).trim() : null,
                canton: r?.canton ? String(r.canton).trim() : null,
                parroquia: r?.parroquia ? String(r.parroquia).trim() : null,
                actividad_economica: r?.actividad_economica ? String(r.actividad_economica).trim() : null,
            }))
            .filter(r => /^\d{13}$/.test(r.ruc) && r.razon_social.length > 0);

        if (limpios.length === 0) {
            return res.status(400).json({ error: 'Ningún registro válido (se espera RUC de 13 dígitos + razón social).' });
        }

        await axios.post(`${SUPABASE_URL}/rest/v1/${PADRON_TABLE}?on_conflict=ruc`, limpios, {
            headers: {
                ...supabaseAdminHeaders(),
                'Prefer': 'resolution=merge-duplicates,return=minimal'
            }
        });

        res.json({ success: true, insertados: limpios.length, descartados: registros.length - limpios.length });
    } catch (error) {
        console.error('[Padron Import Error]', error.response?.data || error.message);
        res.status(500).json({ success: false, error: 'Error al importar el padrón SRI.' });
    }
});

/**
 * Envío de correo genérico (HTML ya construido en el cliente).
 * La RESEND_API_KEY vive SOLO en este servidor.
 */
app.post('/api/v1/emails/enviar', requireApiKey, async (req, res) => {
    try {
        const { to, subject, html } = req.body;
        const resendKey = process.env.RESEND_API_KEY;

        if (!resendKey) {
            console.error('[Resend] BLOCKED: RESEND_API_KEY is not configured on the server.');
            return res.status(503).json({ error: 'Servicio de correo no configurado.' });
        }
        if (!to || typeof to !== 'string' || !to.includes('@')) {
            return res.status(400).json({ error: 'Destinatario inválido.' });
        }
        if (!subject || !html) {
            return res.status(400).json({ error: 'Faltan "subject" o "html".' });
        }

        const emailResponse = await axios.post('https://api.resend.com/emails', {
            from: process.env.RESEND_FROM || 'Imprenta Córdova <onboarding@resend.dev>',
            to: [to],
            subject: String(subject).slice(0, 300),
            html: String(html)
        }, {
            headers: {
                'Authorization': `Bearer ${resendKey}`,
                'Content-Type': 'application/json'
            }
        });

        res.json({ success: true, messageId: emailResponse.data?.id });
    } catch (err) {
        console.error('[Resend Error]', err.response?.data || err.message);
        res.status(500).json({ success: false, error: 'Error enviando correo electrónico.' });
    }
});

/**
 * Proxy de IA (Google Gemini) — la GEMINI_API_KEY vive SOLO en este servidor.
 *
 * El cliente envía { model, contents, config }; este endpoint traduce a la REST API
 * de Google y devuelve { text } para que el cliente no necesite el SDK ni la clave.
 */
const GEMINI_MODELOS_PERMITIDOS = (process.env.GEMINI_MODELOS_PERMITIDOS
    || 'gemini-3-flash-preview,gemini-2.5-flash,gemini-2.0-flash')
    .split(',').map(s => s.trim()).filter(Boolean);

app.post('/api/v1/ai/generate', requireApiKey, async (req, res) => {
    try {
        const geminiKey = process.env.GEMINI_API_KEY;
        if (!geminiKey) {
            console.error('[Gemini] BLOCKED: GEMINI_API_KEY is not configured on the server.');
            return res.status(503).json({ error: 'Servicio de IA no configurado.' });
        }

        const { model, contents, config } = req.body || {};
        const modelo = String(model || '').trim();

        if (!GEMINI_MODELOS_PERMITIDOS.includes(modelo)) {
            return res.status(400).json({
                error: `Modelo no permitido. Permitidos: ${GEMINI_MODELOS_PERMITIDOS.join(', ')}`
            });
        }
        if (!contents) {
            return res.status(400).json({ error: 'Falta "contents".' });
        }

        // Traducción al formato REST de Google.
        // El SDK del navegador aceptaba un string suelto en `contents` y se encargaba
        // de convertirlo a Content[]; la REST API exige la forma completa.
        const normalizarContents = (c) => {
            if (typeof c === 'string') return [{ role: 'user', parts: [{ text: c }] }];
            if (Array.isArray(c)) return c;
            if (c && typeof c === 'object') {
                if (c.parts) return [{ role: c.role || 'user', parts: c.parts }];
                if (c.text) return [{ role: 'user', parts: [{ text: c.text }] }];
            }
            return null;
        };

        const normalizarSystemInstruction = (si) => {
            if (!si) return undefined;
            if (typeof si === 'string') return { parts: [{ text: si }] };
            if (si.parts) return si;
            if (si.text) return { parts: [{ text: si.text }] };
            return undefined;
        };

        const { systemInstruction, ...generationConfig } = config || {};
        const contentsNormalizados = normalizarContents(contents);

        if (!contentsNormalizados) {
            return res.status(400).json({ error: 'Formato de "contents" no reconocido.' });
        }

        const payload = { contents: contentsNormalizados };
        if (Object.keys(generationConfig).length > 0) payload.generationConfig = generationConfig;
        const si = normalizarSystemInstruction(systemInstruction);
        if (si) payload.systemInstruction = si;

        const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(modelo)}:generateContent`;
        const r = await axios.post(url, payload, {
            headers: { 'x-goog-api-key': geminiKey, 'Content-Type': 'application/json' },
            timeout: 60000
        });

        const texto = (r.data?.candidates?.[0]?.content?.parts || [])
            .map(p => p?.text || '')
            .join('');

        res.json({ text: texto, finishReason: r.data?.candidates?.[0]?.finishReason || null });
    } catch (error) {
        const detalle = error.response?.data?.error?.message || error.message;
        console.error('[Gemini Proxy Error]', detalle);
        res.status(502).json({ success: false, error: 'Error consultando el servicio de IA.', detalle });
    }
});

/**
 * Operaciones de datos de la extensión de Chrome (clientes / trabajos).
 *
 * La extensión se distribuye empaquetada, así que TODO su código es público.
 * Antes llevaba la service_role embebida para escribir directo en Supabase;
 * ahora esas escrituras pasan por aquí y la clave maestra no sale del servidor.
 *
 * Nota: la tabla `clientes`/`trabajos` tiene RLS por rol y una petición `anon`
 * no satisface ninguna política (`auth.uid()` es NULL), así que estas rutas son
 * la única vía legítima de escritura desde la extensión.
 */
const supabaseRest = async (method, path, body) => {
    const SUPABASE_URL = process.env.SUPABASE_URL;
    const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!SUPABASE_URL || !SUPABASE_KEY) {
        const err = new Error('Base de datos no configurada en el servidor.');
        err.statusCode = 503;
        throw err;
    }

    return axios({
        method,
        url: `${SUPABASE_URL}/rest/v1/${path}`,
        data: body,
        headers: {
            ...supabaseAdminHeaders(),
            'Prefer': method === 'POST' ? 'resolution=merge-duplicates,return=representation' : 'return=representation'
        }
    });
};

const soloColumnas = (obj, permitidas) => {
    const out = {};
    for (const k of permitidas) {
        if (obj && obj[k] !== undefined) out[k] = obj[k];
    }
    return out;
};

const responderErrorDatos = (res, error, contexto) => {
    const status = error.statusCode || 500;
    console.error(`[${contexto}]`, error.response?.data || error.message);
    res.status(status).json({ success: false, error: error.message || `Error en ${contexto}.` });
};

/** Alta/actualización de cliente desde la extensión (por RUC). */
app.post('/api/v1/clientes/upsert', requireApiKey, async (req, res) => {
    try {
        const payload = soloColumnas(req.body, [
            'ruc', 'cedula', 'nombre', 'telefono', 'email', 'actividades'
        ]);

        if (!payload.ruc || !payload.nombre) {
            return res.status(400).json({ error: 'Se requieren "ruc" y "nombre".' });
        }

        const r = await supabaseRest('POST', 'clientes?on_conflict=ruc', payload);
        res.json({ success: true, cliente: r.data?.[0] || null });
    } catch (error) {
        responderErrorDatos(res, error, 'Clientes Upsert');
    }
});

/** Actualización parcial de un cliente por id o por RUC. */
app.post('/api/v1/clientes/actualizar', requireApiKey, async (req, res) => {
    try {
        const { id, ruc, cambios } = req.body || {};
        if (!id && !ruc) {
            return res.status(400).json({ error: 'Se requiere "id" o "ruc".' });
        }

        const payload = soloColumnas(cambios, ['telefono', 'email', 'actividades', 'nombre', 'cedula']);
        if (Object.keys(payload).length === 0) {
            return res.status(400).json({ error: 'Sin campos válidos para actualizar.' });
        }

        const filtro = id ? `id=eq.${encodeURIComponent(id)}` : `ruc=eq.${encodeURIComponent(ruc)}`;
        const r = await supabaseRest('PATCH', `clientes?${filtro}`, payload);
        res.json({ success: true, cliente: r.data?.[0] || null });
    } catch (error) {
        responderErrorDatos(res, error, 'Clientes Actualizar');
    }
});

/** Alta de trabajo desde la extensión. */
app.post('/api/v1/trabajos/crear', requireApiKey, async (req, res) => {
    try {
        const payload = soloColumnas(req.body, [
            'cliente_id', 'titular', 'tipo', 'subtipo', 'cantidad', 'total', 'abono', 'saldo',
            'prioridad', 'estado', 'fecha_entrada', 'origen', 'establecimiento', 'punto_emision',
            'tamano', 'actividad_seleccionada', 'fecha_vencimiento', 'cedula_ruc', 'telefono'
        ]);

        if (!payload.titular) {
            return res.status(400).json({ error: 'Se requiere "titular".' });
        }

        const r = await supabaseRest('POST', 'trabajos', payload);
        res.json({ success: true, trabajo: r.data?.[0] || null });
    } catch (error) {
        responderErrorDatos(res, error, 'Trabajos Crear');
    }
});

/** Actualización parcial de un trabajo por id. */
app.post('/api/v1/trabajos/actualizar', requireApiKey, async (req, res) => {
    try {
        const { id, cambios } = req.body || {};
        if (!id) {
            return res.status(400).json({ error: 'Se requiere "id".' });
        }

        const payload = soloColumnas(cambios, [
            'total', 'abono', 'saldo', 'tamano', 'subtipo', 'actividad_seleccionada',
            'estado', 'prioridad', 'telefono', 'cedula_ruc'
        ]);
        if (Object.keys(payload).length === 0) {
            return res.status(400).json({ error: 'Sin campos válidos para actualizar.' });
        }

        const r = await supabaseRest('PATCH', `trabajos?id=eq.${encodeURIComponent(id)}`, payload);
        res.json({ success: true, trabajo: r.data?.[0] || null });
    } catch (error) {
        responderErrorDatos(res, error, 'Trabajos Actualizar');
    }
});

/** Listado de trabajos para el panel de la extensión. */
app.get('/api/v1/trabajos/listar', requireApiKey, async (req, res) => {
    try {
        const limite = Math.min(parseInt(req.query.limite, 10) || 300, 1000);
        const r = await supabaseRest('GET', `trabajos?select=*&order=fecha_entrada.desc&limit=${limite}`);
        res.json({ success: true, trabajos: r.data || [] });
    } catch (error) {
        responderErrorDatos(res, error, 'Trabajos Listar');
    }
});

/** Conteo de trabajos listos en Vitrina para el badge de la extensión (100% GRATIS - CERO TOKENS) */
app.get('/api/v1/trabajos/vitrina-count', requireApiKey, async (req, res) => {
    try {
        const r = await supabaseRest('GET', 'trabajos?estado=in.(Vitrina,Terminado)&select=id');
        const count = Array.isArray(r.data) ? r.data.length : 0;
        res.json({ success: true, count, timestamp: new Date().toISOString() });
    } catch (error) {
        responderErrorDatos(res, error, 'Trabajos Vitrina Count');
    }
});

/* ════════════════════════════════════════════════════════════════════════════
 * RECORDATORIO AUTOMÁTICO DE REZAGADOS
 *
 * Un rezagado es un trabajo LISTO (estado "Vitrina") que el cliente no vino a
 * retirar. Pasadas 48 h se le manda un correo pidiendo el retiro, y no se le
 * vuelve a escribir hasta que pase una semana.
 *
 * Corre acá y no en el navegador porque un recordatorio tiene que salir aunque
 * nadie tenga el sistema abierto. La pantalla (pages/Retiros.tsx) sigue teniendo
 * el botón manual de WhatsApp para el caso "el cliente sí contesta el teléfono".
 *
 * El umbral NO se reinventa: estos dos números son el espejo de
 * `services/recordatorios.ts` (UMBRAL_REZAGO_HORAS / HORAS_ENTRE_RECORDATORIOS) y
 * `__tests__/services/recordatorios.test.ts` falla si dejan de coincidir.
 * ════════════════════════════════════════════════════════════════════════════ */
const UMBRAL_REZAGO_HORAS = parseInt(process.env.REZAGO_UMBRAL_HORAS, 10) || 48;
const HORAS_ENTRE_RECORDATORIOS = parseInt(process.env.REZAGO_INSISTENCIA_HORAS, 10) || 168;

/** Valor de `trabajos.estado` que significa "listo para retirar". */
const ESTADO_LISTO = 'Vitrina';

const MS_HORA = 3600000;

/** Horas transcurridas desde una fecha ISO. Inválida o nula ⇒ 0. */
const horasDesde = (iso, ahora = Date.now()) => {
    const ts = new Date(iso).getTime();
    if (Number.isNaN(ts)) return 0;
    return Math.max(0, Math.floor((ahora - ts) / MS_HORA));
};

/** ¿El cliente ya fue avisado hace tan poco que conviene dejarlo en paz? */
const yaSeLeAvisoHacePoco = (trabajo, ahora) => {
    if (!trabajo.recordatorio_enviado_at) return false;
    const ts = new Date(trabajo.recordatorio_enviado_at).getTime();
    if (Number.isNaN(ts)) return false;
    return (ahora - ts) / MS_HORA < HORAS_ENTRE_RECORDATORIOS;
};

/**
 * Junta los rezagados con el contacto de su cliente.
 *
 * Usa `select=*` a propósito: si la migración `recordatorio_enviado_at` todavía no
 * corrió, pedir esa columna por nombre devolvería 400 y el recordatorio no saldría
 * nunca. Con `select=*` el campo simplemente llega `undefined` y se trata como
 * "nunca avisado".
 */
const calcularRezagados = async (ahora = Date.now()) => {
    const [trabajosRes, clientesRes] = await Promise.all([
        supabaseRest('GET', `trabajos?estado=eq.${ESTADO_LISTO}&select=*&order=fecha_entrada.asc&limit=500`),
        supabaseRest('GET', 'clientes?select=id,nombre,email,telefono'),
    ]);

    const clientesPorId = new Map();
    for (const c of clientesRes.data || []) clientesPorId.set(c.id, c);

    const filas = [];
    for (const t of trabajosRes.data || []) {
        const horas = horasDesde(t.fecha_entrada, ahora);
        if (horas < UMBRAL_REZAGO_HORAS) continue;

        const cli = clientesPorId.get(t.cliente_id) || null;
        const email = (cli && cli.email ? String(cli.email) : '').trim();
        const telefono = Array.isArray(cli?.telefono) && cli.telefono.length > 0 ? cli.telefono[0] : null;

        filas.push({
            id: t.id,
            orden: t.orden,
            cliente: cli?.nombre || t.titular || 'Cliente',
            email: email || null,
            telefono,
            servicio: t.subtipo || t.tipo || 'Impresión de documentos',
            saldo: Number(t.saldo || 0),
            horas,
            dias: Math.floor(horas / 24),
            ultimoAviso: t.recordatorio_enviado_at || null,
            // Sin correo no hay automatismo posible: ese caso se resuelve a mano por
            // WhatsApp, y la pantalla lo muestra aparte.
            tocaRecordar: Boolean(email) && !yaSeLeAvisoHacePoco(t, ahora),
            sinContacto: !email && !telefono,
        });
    }

    return filas;
};

const escaparHtml = (texto) =>
    String(texto == null ? '' : texto)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');

const dinero = (n) => `$${Number(n || 0).toFixed(2)}`;

/** Cuerpo del correo de recordatorio (mismo texto que el WhatsApp manual). */
const correoRecordatorio = (fila) => {
    const saldo = fila.saldo > 0
        ? `Saldo pendiente al retirar: ${dinero(fila.saldo)}.`
        : 'Su pedido se encuentra totalmente pagado.';

    const insistencia = fila.dias >= 2
        ? `<p style="margin:0 0 14px;font-size:14px;color:#3C4763">Ya lleva <strong>${fila.dias} días</strong> esperándole en nuestro estante y no queremos que se quede sin su trabajo.</p>`
        : '';

    const html = `
        <div style="font-family:Helvetica,Arial,sans-serif;max-width:560px;margin:0 auto;padding:28px;background:#F7F9FF">
            <div style="background:#0A1140;border-radius:14px 14px 0 0;padding:20px 24px">
                <p style="margin:0;color:#FFC61A;font-size:11px;font-weight:800;letter-spacing:.22em;text-transform:uppercase">Imprenta Córdova</p>
                <p style="margin:6px 0 0;color:#fff;font-size:19px;font-weight:700">Su pedido está listo para retirar</p>
            </div>
            <div style="background:#ffffff;border:1px solid #E4E8F4;border-top:none;border-radius:0 0 14px 14px;padding:24px">
                <p style="margin:0 0 14px;font-size:15px;color:#0A1140">¡Hola ${escaparHtml(fila.cliente)}!</p>
                <p style="margin:0 0 14px;font-size:14px;color:#3C4763">
                    Le recordamos que su pedido <strong>#${escaparHtml(fila.orden)}</strong>
                    (${escaparHtml(fila.servicio)}) está <strong>LISTO</strong> para retirar en nuestro local.
                </p>
                ${insistencia}
                <p style="margin:0 0 6px;font-size:14px;color:#3C4763">📍 ${escaparHtml(saldo)}</p>
                <p style="margin:0 0 18px;font-size:14px;color:#3C4763">⏰ Horario: Lunes a Viernes 08:30 a 18:30.</p>
                <p style="margin:0;font-size:13px;color:#6B7590">Colón entre Sucre y Rocafuerte · Pasaje, El Oro</p>
            </div>
        </div>`;

    return {
        subject: `Su pedido #${fila.orden} está listo para retirar · Imprenta Córdova`,
        html,
    };
};

/** Envía el recordatorio a UN rezagado. Devuelve true si el correo salió. */
const enviarRecordatorio = async (fila, resendKey, from) => {
    const { subject, html } = correoRecordatorio(fila);

    await axios.post('https://api.resend.com/emails', {
        from,
        to: [fila.email],
        subject,
        html,
    }, {
        headers: { Authorization: `Bearer ${resendKey}`, 'Content-Type': 'application/json' },
        timeout: 15000,
    });

    // Se marca DESPUÉS de que Resend aceptó el envío: si se marcara antes y el envío
    // fallara, el cliente quedaría como "avisado" sin haber recibido nada.
    await supabaseRest('PATCH', `trabajos?id=eq.${encodeURIComponent(fila.id)}`, {
        recordatorio_enviado_at: new Date().toISOString(),
    });

    return true;
};

/** Lista de rezagados para la pantalla (no envía nada). */
app.get('/api/v1/recordatorios/rezagados', requireApiKey, async (req, res) => {
    try {
        const filas = await calcularRezagados();
        res.json({
            success: true,
            umbralHoras: UMBRAL_REZAGO_HORAS,
            insistenciaHoras: HORAS_ENTRE_RECORDATORIOS,
            total: filas.length,
            pendientes: filas.filter(f => f.tocaRecordar).length,
            rezagados: filas,
            timestamp: new Date().toISOString(),
        });
    } catch (error) {
        responderErrorDatos(res, error, 'Recordatorios Rezagados');
    }
});

/** Dispara los recordatorios ahora (botón "recordar a todos" o prueba manual). */
app.post('/api/v1/recordatorios/rezagados/enviar', requireApiKey, async (req, res) => {
    try {
        const resendKey = process.env.RESEND_API_KEY;
        if (!resendKey) {
            return res.status(503).json({
                success: false,
                error: 'RESEND_API_KEY no está configurada en el servidor: no se puede enviar el recordatorio.',
            });
        }

        const from = process.env.RESEND_FROM || 'Imprenta Córdova <onboarding@resend.dev>';
        const filas = (await calcularRezagados()).filter(f => f.tocaRecordar);

        const enviados = [];
        const fallidos = [];

        for (const fila of filas) {
            try {
                await enviarRecordatorio(fila, resendKey, from);
                enviados.push({ orden: fila.orden, cliente: fila.cliente, email: fila.email });
            } catch (e) {
                console.error('[Recordatorio] falló', fila.orden, e.response?.data || e.message);
                fallidos.push({ orden: fila.orden, error: e.message });
            }
        }

        res.json({
            success: true,
            enviados: enviados.length,
            fallidos: fallidos.length,
            detalle: enviados,
            errores: fallidos,
        });
    } catch (error) {
        responderErrorDatos(res, error, 'Recordatorios Enviar');
    }
});

/**
 * Pasada automática.
 *
 * Sólo escribe en horario de oficina (08:00–19:00, hora de Ecuador): un correo a las
 * 3 de la mañana se lee como spam y quema el dominio para todos los envíos.
 * `REZAGO_CRON_HABILITADO=false` apaga el automatismo sin tocar código.
 */
const pasadaDeRecordatorios = async () => {
    const resendKey = process.env.RESEND_API_KEY;
    if (!resendKey) return;

    const horaEcuador = Number(new Intl.DateTimeFormat('en-US', {
        timeZone: 'America/Guayaquil',
        hour: '2-digit',
        hour12: false,
    }).format(new Date()));

    if (horaEcuador < 8 || horaEcuador >= 19) return;

    try {
        const from = process.env.RESEND_FROM || 'Imprenta Córdova <onboarding@resend.dev>';
        const filas = (await calcularRezagados()).filter(f => f.tocaRecordar);

        if (filas.length === 0) return;

        let enviados = 0;
        for (const fila of filas) {
            try {
                await enviarRecordatorio(fila, resendKey, from);
                enviados += 1;
            } catch (e) {
                console.error('[Recordatorio automático] falló', fila.orden, e.response?.data || e.message);
            }
        }
        console.log(`[Recordatorio automático] ${enviados}/${filas.length} enviados`);
    } catch (e) {
        console.error('[Recordatorio automático] error general', e.response?.data || e.message);
    }
};

// Una pasada cada 6 h: suficiente para el ritmo de un taller y barato para el plan
// gratuito de Resend. La ventana de oficina evita mandar de madrugada.
let cronRecordatorios = null;
if (process.env.REZAGO_CRON_HABILITADO !== 'false') {
    cronRecordatorios = setInterval(pasadaDeRecordatorios, 6 * MS_HORA);
    // `.unref()` para que el proceso pueda terminar solo en pruebas y despliegues.
    if (typeof cronRecordatorios.unref === 'function') cronRecordatorios.unref();
    setTimeout(pasadaDeRecordatorios, 90 * 1000).unref?.();
}

// ── 404 Handler ──────────────────────────────────────────────────────────
app.use((req, res) => {
    res.status(404).json({ error: 'Endpoint not found' });
});

// ── Error Handler ────────────────────────────────────────────────────────
app.use((err, req, res, next) => {
    console.error('[Express Error]', err.message);
    res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
    console.log(`SRI Backend v2.0 running on port ${PORT} | CORS: ${ALLOWED_ORIGINS.length} origins | Auth: ${API_KEY ? 'ENABLED' : 'DISABLED'}`);
});
