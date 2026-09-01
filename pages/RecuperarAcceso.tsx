import React from 'react';
import { Link } from 'react-router-dom';
import { SEO } from '../components/SEO';
import { C, S, DISPLAY, PANEL_KEYFRAMES } from '../components/panelTheme';
import { ArrowLeftIcon, WhatsAppIcon, ShieldCheckIcon, LockIcon } from '../components/Icons';

export const RecuperarAcceso: React.FC = () => {
  const adminPhone = '593993083943';
  const whatsappMessage = encodeURIComponent('Hola Administrador, necesito restablecer mi clave de acceso al sistema del taller Imprenta Córdova.');
  const whatsappUrl = `https://wa.me/${adminPhone}?text=${whatsappMessage}`;

  return (
    <div style={{
      minHeight: '100vh',
      background: C.bg,
      color: C.ink,
      fontFamily: "'Inter',system-ui,sans-serif",
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px clamp(16px, 3vw, 40px)',
    }}>
      <style>{PANEL_KEYFRAMES}</style>
      <SEO title="Recuperar Acceso · Imprenta Córdova" />

      <div style={{
        width: '100%',
        maxWidth: 580,
        background: C.surface,
        border: `1px solid ${C.border}`,
        borderRadius: 20,
        boxShadow: '0 24px 60px -20px rgba(10,17,64,.12)',
        padding: 'clamp(28px, 4vw, 44px)',
        animation: 'pi-rise .6s cubic-bezier(.2,.8,.2,1) both',
        display: 'flex',
        flexDirection: 'column',
        gap: 20,
      }}>
        {/* Header Icon + Brand */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <svg viewBox="0 0 34 34" style={{ width: 32, height: 32 }} aria-hidden="true">
              <path d="M29.1 10A14 14 0 1 0 29.1 24" fill="none" stroke={C.royal} strokeWidth="6.2" strokeLinecap="round" />
              <path d="M10.6 10.4h9v2.9h-3v7.4h3v2.9h-9v-2.9h3v-7.4h-3z" fill="#E70101" stroke={C.gold} strokeWidth="1.7" strokeLinejoin="round" />
            </svg>
            <span style={{ fontFamily: DISPLAY, fontSize: 16, fontWeight: 700, color: C.ink }}>
              CÓRDOVA<span style={{ color: C.gold }}>.</span>
            </span>
          </div>
          <div style={{
            width: 36,
            height: 36,
            borderRadius: 10,
            background: C.chipBlue,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: C.royal,
          }}>
            <LockIcon className="w-5 h-5" />
          </div>
        </div>

        {/* Main Text */}
        <div>
          <span style={S.eyebrow}>Soporte Interno</span>
          <h1 style={{ ...S.h1, fontSize: 24, marginTop: 4 }}>Recuperar o cambiar clave</h1>
          <p style={{ ...S.lead, fontSize: 13.5, marginTop: 8 }}>
            Por seguridad operacional del taller, las contraseñas no se envían por correo. Las claves son administradas directamente por la <b>Administración Central</b> desde el módulo de Usuarios.
          </p>
        </div>

        {/* Pasos */}
        <div style={{
          padding: '16px 18px',
          background: C.surfaceAlt,
          border: `1px solid ${C.border}`,
          borderRadius: 14,
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
        }}>
          <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
            <span style={{ width: 22, height: 22, borderRadius: 6, background: C.chipBlue, color: C.royal, fontSize: 11, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              1
            </span>
            <span style={{ fontSize: 12.5, color: C.body }}>
              Contacta al administrador del taller para que genere tu nueva clave en el sistema.
            </span>
          </div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
            <span style={{ width: 22, height: 22, borderRadius: 6, background: C.chipBlue, color: C.royal, fontSize: 11, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              2
            </span>
            <span style={{ fontSize: 12.5, color: C.body }}>
              El cambio toma menos de 1 minuto y se sincroniza en tiempo real en todos los dispositivos.
            </span>
          </div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
            <span style={{ width: 22, height: 22, borderRadius: 6, background: C.goldBg, color: C.goldTextStrong, fontSize: 11, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              ★
            </span>
            <span style={{ fontSize: 12.5, color: C.goldTextStrong, fontWeight: 600 }}>
              Si hay clientes en mostrador, puedes registrar la orden provisionalmente con el usuario de turno.
            </span>
          </div>
        </div>

        {/* Action Button */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              ...S.primaryBtn,
              background: '#1B6E3E',
              justifyContent: 'center',
              padding: '13px 18px',
              textDecoration: 'none',
            }}
          >
            <WhatsAppIcon className="w-4 h-4" />
            Solicitar Clave al Administrador (WhatsApp)
          </a>

          <Link
            to="/login"
            style={{
              ...S.outlineBtn,
              justifyContent: 'center',
              padding: '12px 18px',
              textDecoration: 'none',
            }}
          >
            <ArrowLeftIcon className="w-4 h-4" />
            Volver a Iniciar Sesión
          </Link>
        </div>

        {/* Footer info */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontSize: 11, color: C.faint, borderTop: `1px solid ${C.divider}`, paddingTop: 14 }}>
          <ShieldCheckIcon className="w-3.5 h-3.5" style={{ color: C.successDot }} />
          <span>Imprenta Córdova · Seguridad y Control de Acceso</span>
        </div>

      </div>
    </div>
  );
};

export default RecuperarAcceso;
