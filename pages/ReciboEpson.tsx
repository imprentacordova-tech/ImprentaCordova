
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useData } from '../contexts/DataContext';
import { Trabajo, Cliente } from '../types';
import { formatCurrency, generateWhatsAppLink } from '../utils';
import { ArrowLeftIcon, PrinterIcon, WhatsAppIcon, CordovaLogo, Loader2Icon, ArrowDownTrayIcon } from '../components/Icons';

declare const html2pdf: any;

/**
 * ReciboEpson — Comprobante de trabajo diseñado para impresora Epson de tinta
 * Formato: Media Carta (5.5" x 8.5" / 140mm x 216mm)
 * Estilo: Profesional, a color, con branding Córdova
 */
const ReciboEpsonPage: React.FC = () => {
    const { trabajoId } = useParams<{ trabajoId: string }>();
    const navigate = useNavigate();
    const { trabajos, clientes, config: cloudConfig, loading: dataLoading } = useData();
    const [trabajo, setTrabajo] = useState<Trabajo | null>(null);
    const [cliente, setCliente] = useState<Cliente | null>(null);
    const [isGenerating, setIsGenerating] = useState(false);

    useEffect(() => {
        if (!trabajoId || dataLoading) return;
        const current = trabajos.find(t => t.id === trabajoId);
        if (current) {
            setTrabajo(current);
            setCliente(clientes.find(c => c.id === current.clienteId) || null);
        }
    }, [trabajoId, trabajos, clientes, dataLoading]);

    const config = {
        nombre: cloudConfig?.imprentaNombre || 'IMPRENTA CÓRDOVA',
        ruc: cloudConfig?.emisorRuc || cloudConfig?.imprentaRuc || '0702065319001',
        direccion: 'Colón y Sucre, Pasaje, El Oro',
        telefono: cloudConfig?.imprentaTelefono || '0993083943',
    };

    const handlePrint = () => window.print();

    const handleDownloadPDF = async () => {
        const element = document.getElementById('recibo-epson-canvas');
        if (!element || !trabajo) return;
        setIsGenerating(true);
        try {
            await html2pdf().set({
                margin: 0,
                filename: `Recibo-${String(trabajo.orden).padStart(6, '0')}-${cliente?.nombre.split(' ')[0] || 'Cliente'}.pdf`,
                image: { type: 'jpeg', quality: 0.98 },
                html2canvas: { scale: 3, useCORS: true, scrollY: 0 },
                jsPDF: { unit: 'mm', format: [140, 216], orientation: 'portrait' }
            }).from(element).save();
        } catch (err) {
            console.error("Error generando PDF:", err);
            alert("Error al generar el PDF.");
        } finally {
            setIsGenerating(false);
        }
    };

    const handleWhatsApp = () => {
        if (!trabajo || !cliente) return;
        const trackingUrl = `${window.location.origin}/#/tracking?q=${trabajo.orden}`;
        const msg = `🧾 *COMPROBANTE - IMPRENTA CÓRDOVA*\n\n` +
            `Estimado/a *${cliente.nombre}*,\n` +
            `Su orden *#${trabajo.orden}* ha sido registrada.\n\n` +
            `📝 ${trabajo.subtipo}\n` +
            `💰 Total: ${formatCurrency(trabajo.total)}\n` +
            `✅ Abono: ${formatCurrency(trabajo.abono)}\n` +
            `📉 Saldo: ${formatCurrency(trabajo.saldo)}\n\n` +
            `🔍 Rastree aquí: ${trackingUrl}\n\n` +
            `Gracias por su preferencia. 🖨️`;
        const phone = cliente.telefono?.[0] || '';
        if (phone) window.open(generateWhatsAppLink(phone, msg), '_blank');
        else alert("El cliente no tiene teléfono registrado.");
    };

    if (dataLoading) return (
        <div className="min-h-screen flex items-center justify-center bg-slate-100">
            <Loader2Icon className="w-10 h-10 text-blue-600 animate-spin" />
        </div>
    );

    if (!trabajo || !cliente) return (
        <div className="min-h-screen flex items-center justify-center bg-slate-100">
            <p className="text-red-500 font-bold">No se encontró el trabajo o el cliente.</p>
        </div>
    );

    const fecha = new Date(trabajo.fechaEntrada);
    const trackingUrl = `${window.location.origin}/#/tracking?q=${trabajo.orden}`;
    const qrSrc = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&ecc=H&data=${encodeURIComponent(trackingUrl)}`;
    const ordenStr = String(trabajo.orden).padStart(6, '0');

    return (
        <div className="min-h-screen bg-slate-200 flex flex-col items-center py-8" style={{ fontFamily: "'Segoe UI', 'Arial', sans-serif" }}>
            {/* Print Styles */}
            <style>{`
                @media print {
                    @page { size: 140mm 216mm; margin: 0; }
                    body { margin: 0; background: white; }
                    .no-print { display: none !important; }
                    #recibo-epson-canvas { box-shadow: none !important; }
                }
            `}</style>

            {/* Toolbar */}
            <div className="no-print mb-6 flex flex-wrap items-center justify-center gap-3">
                <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-slate-600 hover:text-slate-900 font-bold text-xs uppercase tracking-widest transition-colors">
                    <ArrowLeftIcon className="w-4 h-4"/> Volver
                </button>
                <button onClick={handleWhatsApp} className="flex items-center gap-2 bg-green-500 text-white px-5 py-2.5 rounded-xl font-bold text-xs shadow-lg hover:bg-green-600 transition-all">
                    <WhatsAppIcon className="w-4 h-4"/> WhatsApp
                </button>
                <button onClick={handleDownloadPDF} disabled={isGenerating} className="flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-xl font-bold text-xs shadow-lg hover:bg-blue-700 transition-all disabled:opacity-60">
                    {isGenerating ? <Loader2Icon className="w-4 h-4 animate-spin"/> : <ArrowDownTrayIcon className="w-4 h-4"/>}
                    {isGenerating ? 'Generando...' : 'Descargar PDF'}
                </button>
                <button onClick={handlePrint} className="flex items-center gap-2 bg-slate-800 text-white px-5 py-2.5 rounded-xl font-bold text-xs shadow-lg hover:bg-slate-700 transition-all">
                    <PrinterIcon className="w-4 h-4"/> Imprimir
                </button>
            </div>

            {/* ========= CANVAS DEL RECIBO ========= */}
            <div 
                id="recibo-epson-canvas" 
                className="bg-white shadow-2xl overflow-hidden relative"
                style={{ width: '140mm', minHeight: '216mm', padding: '0' }}
            >
                {/* === HEADER BAND === */}
                <div style={{ background: 'linear-gradient(135deg, #0A1E40 0%, #1a3a6b 50%, #0A1E40 100%)', padding: '7mm 8mm', color: 'white', position: 'relative', overflow: 'hidden' }}>
                    {/* Decorative circles */}
                    <div style={{ position: 'absolute', top: '-20px', right: '-20px', width: '80px', height: '80px', borderRadius: '50%', background: 'rgba(212,175,55,0.1)' }}></div>
                    <div style={{ position: 'absolute', bottom: '-10px', left: '30px', width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(255,255,255,0.03)' }}></div>
                    
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'relative', zIndex: 10 }}>
                        <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                                <CordovaLogo className="h-7 w-auto" style={{ filter: 'brightness(10)' }} />
                                <div>
                                    <h1 style={{ fontSize: '15px', fontWeight: 900, letterSpacing: '-0.5px', margin: 0, lineHeight: 1 }}>{config.nombre}</h1>
                                    <p style={{ fontSize: '7px', fontWeight: 700, opacity: 0.6, letterSpacing: '2px', margin: 0, textTransform: 'uppercase' }}>Servicios Gráficos Profesionales</p>
                                </div>
                            </div>
                            <div style={{ fontSize: '7px', opacity: 0.5, fontWeight: 600, marginTop: '4px' }}>
                                RUC: {config.ruc} • {config.direccion} • Tel: {config.telefono}
                            </div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                            <div style={{ background: 'rgba(212,175,55,0.2)', border: '1px solid rgba(212,175,55,0.4)', borderRadius: '8px', padding: '4px 10px' }}>
                                <p style={{ fontSize: '7px', fontWeight: 800, color: '#D4AF37', letterSpacing: '2px', margin: 0, textTransform: 'uppercase' }}>Comprobante</p>
                                <p style={{ fontSize: '16px', fontWeight: 900, letterSpacing: '-1px', margin: 0, color: '#D4AF37' }}>#{ordenStr}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* === GOLD ACCENT LINE === */}
                <div style={{ height: '3px', background: 'linear-gradient(to right, #D4AF37, #f2ca50, #D4AF37)' }}></div>

                {/* === BODY === */}
                <div style={{ padding: '6mm 8mm' }}>
                    
                    {/* Client Info */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5mm', gap: '4mm' }}>
                        <div style={{ flex: 1 }}>
                            <p style={{ fontSize: '7px', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '3px' }}>Cliente</p>
                            <p style={{ fontSize: '12px', fontWeight: 900, color: '#0f172a', letterSpacing: '-0.3px', textTransform: 'uppercase' }}>{cliente.nombre}</p>
                            <p style={{ fontSize: '9px', color: '#64748b', fontWeight: 600, marginTop: '2px' }}>
                                {cliente.ruc || cliente.cedula || 'Consumidor Final'}
                            </p>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                            <p style={{ fontSize: '7px', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '3px' }}>Fecha</p>
                            <p style={{ fontSize: '10px', fontWeight: 700, color: '#0f172a' }}>
                                {fecha.toLocaleDateString('es-EC', { year: 'numeric', month: 'long', day: 'numeric' })}
                            </p>
                            <p style={{ fontSize: '8px', color: '#64748b', fontWeight: 600 }}>
                                {fecha.toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit' })}
                            </p>
                        </div>
                    </div>

                    {/* Divider */}
                    <div style={{ height: '1px', background: '#e2e8f0', margin: '3mm 0' }}></div>

                    {/* Detail Table */}
                    <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '5mm' }}>
                        <thead>
                            <tr style={{ background: '#f8fafc' }}>
                                <th style={{ fontSize: '7px', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '1px', padding: '4px 6px', textAlign: 'center', borderBottom: '2px solid #e2e8f0', width: '12%' }}>Cant.</th>
                                <th style={{ fontSize: '7px', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '1px', padding: '4px 6px', textAlign: 'left', borderBottom: '2px solid #e2e8f0', width: '58%' }}>Descripción</th>
                                <th style={{ fontSize: '7px', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '1px', padding: '4px 6px', textAlign: 'right', borderBottom: '2px solid #e2e8f0', width: '15%' }}>P.Unit</th>
                                <th style={{ fontSize: '7px', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '1px', padding: '4px 6px', textAlign: 'right', borderBottom: '2px solid #e2e8f0', width: '15%' }}>Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td style={{ fontSize: '10px', fontWeight: 700, padding: '6px', textAlign: 'center', color: '#0f172a' }}>{trabajo.cantidad}</td>
                                <td style={{ fontSize: '10px', fontWeight: 600, padding: '6px', color: '#0f172a', textTransform: 'uppercase', lineHeight: 1.3 }}>{trabajo.subtipo}</td>
                                <td style={{ fontSize: '10px', fontWeight: 600, padding: '6px', textAlign: 'right', color: '#475569' }}>{formatCurrency(trabajo.total / (trabajo.cantidad || 1))}</td>
                                <td style={{ fontSize: '10px', fontWeight: 800, padding: '6px', textAlign: 'right', color: '#0f172a' }}>{formatCurrency(trabajo.total)}</td>
                            </tr>
                        </tbody>
                    </table>

                    {/* Totals Box */}
                    <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                        <div style={{ width: '55%', background: '#f8fafc', borderRadius: '8px', padding: '4mm', border: '1px solid #e2e8f0' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
                                <span style={{ fontSize: '9px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Total</span>
                                <span style={{ fontSize: '9px', fontWeight: 800, color: '#0f172a' }}>{formatCurrency(trabajo.total)}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
                                <span style={{ fontSize: '9px', fontWeight: 700, color: '#22c55e', textTransform: 'uppercase' }}>Abono</span>
                                <span style={{ fontSize: '9px', fontWeight: 800, color: '#22c55e' }}>- {formatCurrency(trabajo.abono)}</span>
                            </div>
                            <div style={{ height: '1px', background: '#0A1E40', margin: '3px 0' }}></div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ fontSize: '10px', fontWeight: 900, color: '#0A1E40', textTransform: 'uppercase', letterSpacing: '-0.3px' }}>Saldo</span>
                                <span style={{ fontSize: '16px', fontWeight: 900, color: trabajo.saldo > 0 ? '#ef4444' : '#22c55e', letterSpacing: '-0.5px' }}>
                                    {formatCurrency(trabajo.saldo)}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Estado Badge */}
                    <div style={{ textAlign: 'center', margin: '5mm 0 3mm 0' }}>
                        <span style={{
                            display: 'inline-block',
                            fontSize: '8px',
                            fontWeight: 900,
                            textTransform: 'uppercase',
                            letterSpacing: '2px',
                            padding: '4px 16px',
                            borderRadius: '20px',
                            background: trabajo.saldo <= 0 ? '#dcfce7' : '#fef3c7',
                            color: trabajo.saldo <= 0 ? '#16a34a' : '#d97706',
                            border: `1px solid ${trabajo.saldo <= 0 ? '#86efac' : '#fde68a'}`
                        }}>
                            {trabajo.saldo <= 0 ? '✅ PAGADO EN SU TOTALIDAD' : '⏳ PENDIENTE DE PAGO'}
                        </span>
                    </div>

                    {/* QR + Tracking */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4mm', margin: '4mm 0', padding: '3mm', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                        <img src={qrSrc} alt="QR" style={{ width: '22mm', height: '22mm', border: '1px solid #e2e8f0', borderRadius: '4px' }} />
                        <div>
                            <p style={{ fontSize: '8px', fontWeight: 800, color: '#0f172a', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '2px' }}>Rastree su pedido</p>
                            <p style={{ fontSize: '7px', color: '#64748b', fontWeight: 600, lineHeight: 1.4 }}>
                                Escanee el código QR o visite nuestra web para conocer el estado actualizado de su orden en tiempo real.
                            </p>
                            <p style={{ fontSize: '7px', fontWeight: 700, color: '#0A1E40', marginTop: '2px' }}>imprentacordova.net/tracking</p>
                        </div>
                    </div>
                </div>

                {/* === FOOTER === */}
                <div style={{ 
                    borderTop: '1px solid #e2e8f0',
                    padding: '3mm 8mm 4mm 8mm',
                    marginTop: 'auto'
                }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                        <div>
                            <div style={{ borderTop: '1px solid #94a3b8', width: '35mm', marginBottom: '2px' }}></div>
                            <p style={{ fontSize: '6px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px' }}>Firma Autorizada</p>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                            <div style={{ borderTop: '1px solid #94a3b8', width: '35mm', marginBottom: '2px', marginLeft: 'auto' }}></div>
                            <p style={{ fontSize: '6px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px' }}>Recibí Conforme</p>
                        </div>
                    </div>
                    <div style={{ textAlign: 'center', marginTop: '4mm' }}>
                        <p style={{ fontSize: '6px', color: '#94a3b8', fontWeight: 600, lineHeight: 1.5, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                            Documento sin validez tributaria • Conserve este comprobante hasta retirar su pedido
                            <br/>Revise su diseño antes de aprobar la impresión • {config.nombre}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ReciboEpsonPage;
