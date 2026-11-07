/**
 * Servicio de Notificaciones por Correo Electrónico — Imprenta Córdova
 * ====================================================================
 *
 * El HTML de cada plantilla se arma acá (no es secreto y así el diseño vive
 * junto a la UI). El ENVÍO lo hace el backend en Render, porque la
 * RESEND_API_KEY no puede estar en el navegador: cualquier variable `VITE_`
 * termina incrustada en el bundle público.
 */

import { backendFetch, BackendError } from './backendApi';

export interface EmailOrderDetails {
  clienteNombre: string;
  clienteEmail: string;
  ordenNumero: string | number;
  servicioNombre: string;
  montoTotal: number;
  montoAbono: number;
  montoSaldo: number;
  trackingUrl?: string;
  fechaRetiro?: string;
}

/**
 * Función genérica de envío. Devuelve `false` en vez de lanzar para no romper
 * el flujo del operador: una notificación fallida no debe bloquear una venta.
 */
export async function sendResendEmail(to: string, subject: string, htmlContent: string): Promise<boolean> {
  if (!to || !to.includes('@')) return false;

  try {
    await backendFetch(
      '/api/v1/emails/enviar',
      { to, subject, html: htmlContent },
      { etiqueta: 'Correo' }
    );
    return true;
  } catch (err) {
    if (err instanceof BackendError && err.status === 503) {
      console.warn('⚠️ [Correo] El servidor no tiene configurada la clave de Resend.');
    }
    return false;
  }
}

/**
 * 1. Correo de Notificación: Pedido Creado / Registrado
 */
export async function notifyOrderCreatedEmail(data: EmailOrderDetails): Promise<boolean> {
  const trackingLink = data.trackingUrl || 'https://www.imprentacordova.net/tracking';
  
  const html = `
    <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 580px; margin: 0 auto; background: #ffffff; border: 1px solid #cbd5e1; border-radius: 14px; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.05);">
      <div style="background: linear-gradient(135deg, #0f2b48 0%, #1e40af 100%); padding: 24px; text-align: center; color: #ffffff;">
        <h1 style="margin: 0; font-size: 22px; font-weight: 800; letter-spacing: 1px;">IMPRENTA CÓRDOVA</h1>
        <p style="margin: 4px 0 0 0; font-size: 11px; text-transform: uppercase; letter-spacing: 2px; color: #93c5fd;">CÓDIGO DE AUTORIZACIÓN SRI: 8634</p>
      </div>

      <div style="padding: 24px;">
        <h2 style="color: #0f172a; font-size: 18px; margin-top: 0;">¡Hola, ${data.clienteNombre}! 👋</h2>
        <p style="color: #475569; font-size: 14px; line-height: 1.6;">
          Tu solicitud de trabajo de imprenta <strong>Orden #${data.ordenNumero}</strong> ha sido recibida e ingresada en nuestro sistema de producción.
        </p>

        <div style="background: #f8fafc; border: 1.5px dashed #cbd5e1; border-radius: 10px; padding: 16px; margin: 20px 0;">
          <div style="font-size: 11px; font-weight: 800; color: #3b82f6; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 10px;">RESUMEN DE LA ORDEN</div>
          <table style="width: 100%; font-size: 13px; color: #1e293b; border-collapse: collapse;">
            <tr><td style="padding: 4px 0; color: #64748b;">Trabajo:</td><td style="font-weight: 700; text-align: right;">${data.servicioNombre}</td></tr>
            <tr><td style="padding: 4px 0; color: #64748b;">Valor Total:</td><td style="font-weight: 700; text-align: right;">$${data.montoTotal.toFixed(2)}</td></tr>
            <tr><td style="padding: 4px 0; color: #16a34a;">Abono Ingresado:</td><td style="font-weight: 700; color: #16a34a; text-align: right;">$${data.montoAbono.toFixed(2)}</td></tr>
            <tr><td style="padding: 4px 0; color: #dc2626; border-top: 1px solid #e2e8f0;">Saldo Pendiente:</td><td style="font-weight: 800; color: #dc2626; text-align: right; border-top: 1px solid #e2e8f0;">$${data.montoSaldo.toFixed(2)}</td></tr>
          </table>
        </div>

        <div style="text-align: center; margin-top: 24px;">
          <a href="${trackingLink}" style="background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%); color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: 800; font-size: 13px; display: inline-block; box-shadow: 0 4px 12px rgba(37, 99, 235, 0.35);">
            🔍 RASTREAR ESTADO DE PRODUCCIÓN
          </a>
        </div>
      </div>

      <div style="background: #f1f5f9; padding: 14px; text-align: center; font-size: 11px; color: #64748b; border-top: 1px solid #e2e8f0;">
        Imprenta Córdova &bull; Santiago Córdova &bull; 0993083943
      </div>
    </div>
  `;

  return sendResendEmail(data.clienteEmail, `🖨️ Orden #${data.ordenNumero} Registrada - Imprenta Córdova`, html);
}

/**
 * 2. Correo de Notificación: Pedido LISTO PARA RETIRO 🎉
 */
export async function notifyOrderReadyForPickupEmail(data: EmailOrderDetails): Promise<boolean> {
  const trackingLink = data.trackingUrl || 'https://www.imprentacordova.net/tracking';

  const html = `
    <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 580px; margin: 0 auto; background: #ffffff; border: 1px solid #cbd5e1; border-radius: 14px; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.05);">
      <div style="background: linear-gradient(135deg, #16a34a 0%, #15803d 100%); padding: 24px; text-align: center; color: #ffffff;">
        <h1 style="margin: 0; font-size: 22px; font-weight: 800; letter-spacing: 1px;">🎉 ¡TU TRABAJO ESTÁ LISTO!</h1>
        <p style="margin: 4px 0 0 0; font-size: 11px; text-transform: uppercase; letter-spacing: 2px; color: #bbf7d0;">IMPRENTA CÓRDOVA &bull; RETIRO EN LOCAL</p>
      </div>

      <div style="padding: 24px;">
        <h2 style="color: #0f172a; font-size: 18px; margin-top: 0;">Estimado/a ${data.clienteNombre},</h2>
        <p style="color: #475569; font-size: 14px; line-height: 1.6;">
          Nos complace informarte que tu pedido <strong>Orden #${data.ordenNumero} (${data.servicioNombre})</strong> ha finalizado el proceso de impresión y control de calidad. 
        </p>

        <div style="background: #f0fdf4; border: 1.5px solid #86efac; border-radius: 10px; padding: 16px; margin: 20px 0;">
          <div style="font-size: 12px; font-weight: 800; color: #15803d; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px;">📍 INFORMACIÓN PARA RETIRO:</div>
          <p style="margin: 0 0 6px 0; font-size: 13px; color: #166534;">• Puedes acercarte a nuestro local a retirar tus talonarios/comprobantes en nuestro horario de atención habitual.</p>
          ${data.montoSaldo > 0 
            ? `<p style="margin: 0; font-size: 13px; color: #dc2626; font-weight: 700;">• Saldo pendiente a cancelar al retirar: $${data.montoSaldo.toFixed(2)}</p>` 
            : `<p style="margin: 0; font-size: 13px; color: #16a34a; font-weight: 700;">• Estado de pago: PAGADO TOTALMENTE ✓</p>`
          }
        </div>

        <div style="text-align: center; margin-top: 24px;">
          <a href="${trackingLink}" style="background: linear-gradient(135deg, #16a34a 0%, #15803d 100%); color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: 800; font-size: 13px; display: inline-block; box-shadow: 0 4px 12px rgba(22, 163, 74, 0.35);">
            📦 VER DETALLE EN TRACKING EN LÍNEA
          </a>
        </div>
      </div>

      <div style="background: #f1f5f9; padding: 14px; text-align: center; font-size: 11px; color: #64748b; border-top: 1px solid #e2e8f0;">
        Imprenta Córdova &bull; Santiago Córdova &bull; 0993083943
      </div>
    </div>
  `;

  return sendResendEmail(data.clienteEmail, `📦 ¡Tu pedido #${data.ordenNumero} está Listo para Retirar! - Imprenta Córdova`, html);
}

/**
 * 3. Correo de Notificación: Pedido ENTREGADO / RETIRADO 📦
 */
export async function notifyOrderDeliveredEmail(data: EmailOrderDetails): Promise<boolean> {
  const html = `
    <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 580px; margin: 0 auto; background: #ffffff; border: 1px solid #cbd5e1; border-radius: 14px; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.05);">
      <div style="background: linear-gradient(135deg, #0f2b48 0%, #1e40af 100%); padding: 24px; text-align: center; color: #ffffff;">
        <h1 style="margin: 0; font-size: 22px; font-weight: 800; letter-spacing: 1px;">✅ ¡ENTREGA REGISTRADA!</h1>
        <p style="margin: 4px 0 0 0; font-size: 11px; text-transform: uppercase; letter-spacing: 2px; color: #93c5fd;">IMPRENTA CÓRDOVA &bull; DESPACHO Y RECEPCIÓN</p>
      </div>

      <div style="padding: 24px;">
        <h2 style="color: #0f172a; font-size: 18px; margin-top: 0;">Estimado/a ${data.clienteNombre},</h2>
        <p style="color: #475569; font-size: 14px; line-height: 1.6;">
          Confirmamos que tu <strong>Orden #${data.ordenNumero} (${data.servicioNombre})</strong> ha sido entregada y retirada satisfactoriamente.
        </p>

        <div style="background: #eff6ff; border: 1.5px solid #93c5fd; border-radius: 10px; padding: 16px; margin: 20px 0;">
          <div style="font-size: 12px; font-weight: 800; color: #1e40af; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 6px;">COMPROBANTE DE ENTREGA:</div>
          <div style="font-size: 13px; color: #1e3a8a;">• Valor Cancelado al Retiro: <strong>$${data.montoSaldo.toFixed(2)}</strong></div>
          <div style="font-size: 13px; color: #1e3a8a;">• Estado Final de Orden: <strong>COMPLETADO Y ENTREGADO</strong></div>
          ${data.fechaRetiro ? `<div style="font-size: 12px; color: #3b82f6; margin-top: 4px;">• Fecha de entrega: ${data.fechaRetiro}</div>` : ''}
        </div>

        <p style="color: #64748b; font-size: 13px; text-align: center; margin-top: 20px;">
          ¡Agradecemos tu confianza en <strong>Imprenta Córdova</strong>! Estamos para servirte en tus próximos trabajos gráficos y autorizaciones SRI.
        </p>
      </div>

      <div style="background: #f1f5f9; padding: 14px; text-align: center; font-size: 11px; color: #64748b; border-top: 1px solid #e2e8f0;">
        Imprenta Córdova &bull; Santiago Córdova &bull; 0993083943
      </div>
    </div>
  `;

  return sendResendEmail(data.clienteEmail, `✅ Confirmación de Entrega Orden #${data.ordenNumero} - Imprenta Córdova`, html);
}
