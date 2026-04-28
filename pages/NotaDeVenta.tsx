
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useData } from '../contexts/DataContext';
import { Trabajo, Cliente } from '../types';
import { formatCurrency, numeroALetras } from '../utils';
import { 
    PrinterIcon, ArrowLeftIcon, CordovaLogo, 
    MapPinIcon, WhatsAppIcon, CheckBadgeIcon, 
    EnvelopeIcon, PhoneIcon, ArrowDownTrayIcon, Loader2Icon, InfoIcon
} from '../components/Icons';

// Declaración para TypeScript ya que html2pdf se carga vía CDN en index.html
declare const html2pdf: any;

const NotaDeVentaPage: React.FC = () => {
    const { trabajoId } = useParams<{ trabajoId: string }>();
    const navigate = useNavigate();
    const { trabajos, clientes, config: cloudConfig, loading: dataLoading } = useData();
    const [trabajo, setTrabajo] = useState<Trabajo | null>(null);
    const [cliente, setCliente] = useState<Cliente | null>(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const [isConsumidorFinal, setIsConsumidorFinal] = useState(false);

    useEffect(() => {
        if (!trabajoId || dataLoading) return;
        const current = trabajos.find(t => t.id === trabajoId);
        if (current) {
            setTrabajo(current);
            setCliente(clientes.find(c => c.id === current.clienteId) || null);
        }
    }, [trabajoId, trabajos, clientes, dataLoading]);

    // Mapear config de Supabase al formato esperado por la plantilla
    const config = {
        emisorNombreComercial: cloudConfig?.imprentaNombre || 'IMPRENTA CORDOVA',
        emisorRazonSocial: cloudConfig?.emisorRazonSocial || 'IMPRENTA CORDOVA',
        emisorRuc: cloudConfig?.emisorRuc || '1104212564001',
        emisorEstablecimiento: cloudConfig?.emisorEstablecimiento || '001',
        emisorPuntoEmision: cloudConfig?.emisorPuntoEmision || '001',
        emisorDireccionMatriz: 'Colón y Sucre, Pasaje, El Oro',
        emisorTelefono: cloudConfig?.imprentaTelefono || '',
        emisorEmail: '',
        autorizacionSRI: cloudConfig?.imprentaAutorizacion || '',
        emisorTipoContribuyente: 'CONTRIBUYENTE RIMPE',
        imprentaNombre: cloudConfig?.imprentaNombre || 'IMPRENTA CORDOVA',
        imprentaRuc: cloudConfig?.imprentaRuc || '',
        imprentaAutorizacion: cloudConfig?.imprentaAutorizacion || '',
        fechaAutorizacion: cloudConfig?.imprentaFechaAut || '01/01/20--',
        fechaCaducidad: cloudConfig?.imprentaFechaCaducidad || '31/12/20--',
    };

    const generatePDF = async () => {
        const element = document.getElementById('nota-venta-canvas');
        if (!element || !trabajo || !cliente) return;

        if (typeof html2pdf === 'undefined') {
            alert("El motor de PDF aún se está cargando. Por favor, espere un segundo e intente de nuevo.");
            return;
        }

        setIsGenerating(true);
        
        // Configuración optimizada para rendimiento y calidad (Escala 2 es suficiente para nitidez)
        const opt = {
            margin: 0,
            filename: `NV-${String(trabajo.orden).padStart(6,'0')}-${cliente.nombre.split(' ')[0]}.pdf`,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { 
                scale: 2, // Reducido de 3 a 2 para mayor velocidad en móviles sin perder nitidez
                useCORS: true, 
                letterRendering: true,
                scrollY: 0,
                logging: false
            },
            jsPDF: { 
                unit: 'mm', 
                format: 'a5', 
                orientation: 'portrait',
                compress: true
            }
        };

        try {
            // Pequeño delay para asegurar que el DOM esté estable
            await new Promise(resolve => setTimeout(resolve, 100));
            await html2pdf().set(opt).from(element).save();
        } catch (error) {
            console.error("Error generando PDF", error);
            alert("Hubo un error al generar el PDF. El sistema intentará abrir la ventana de impresión del navegador.");
            window.print();
        } finally {
            setIsGenerating(false);
        }
    };

    if (dataLoading) return (
        <div className="min-h-screen flex items-center justify-center bg-slate-900">
            <Loader2Icon className="w-10 h-10 text-brand-blue animate-spin" />
        </div>
    );

    if (!trabajo || !cliente) return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-slate-900 gap-6 p-8 text-center">
            <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mb-4">
                <InfoIcon className="w-10 h-10 text-liquid-gold opacity-50" />
            </div>
            <h2 className="text-white font-black text-2xl uppercase tracking-tighter italic">Documento No Encontrado</h2>
            <p className="text-slate-400 text-sm max-w-xs italic">La orden solicitada no existe o ha sido eliminada del sistema.</p>
            <button 
                onClick={() => navigate('/trabajos')} 
                className="bg-liquid-gold text-brand-dark px-8 py-3 rounded-2xl font-black uppercase text-[11px] tracking-widest italic shadow-lg"
            >
                Volver a Trabajos
            </button>
        </div>
    );

    const secuencial = String(trabajo.orden).padStart(9, '0');
    const fechaEmision = new Date().toLocaleDateString('es-EC', { year: 'numeric', month: 'long', day: 'numeric' });
    const totalEnLetras = numeroALetras(trabajo.total);

    return (
        <div className="bg-slate-800 min-h-screen py-8 flex flex-col items-center justify-start overflow-y-auto font-sans">
            {/* BARRA DE HERRAMIENTAS SUPERIOR (No sale en impresión) */}
            <div className="w-full max-w-[148mm] flex justify-between mb-6 px-4 md:px-0 z-50">
                <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-white/70 hover:text-white font-bold text-xs uppercase tracking-widest transition-colors">
                    <ArrowLeftIcon className="w-4 h-4"/> Volver
                </button>
                <div className="flex gap-3">
                    <button 
                        onClick={generatePDF} 
                        disabled={isGenerating}
                        className="bg-white text-brand-blue px-6 py-2 rounded-lg font-bold text-xs uppercase tracking-widest shadow-lg hover:bg-slate-100 transition-all flex items-center gap-2 disabled:opacity-70"
                    >
                        {isGenerating ? <Loader2Icon className="w-4 h-4 animate-spin"/> : <ArrowDownTrayIcon className="w-4 h-4"/>}
                        {isGenerating ? 'Generando...' : 'Descargar PDF'}
                    </button>
                    <button 
                        onClick={() => window.print()} 
                        className="bg-brand-blue text-white px-6 py-2 rounded-lg font-bold text-xs uppercase tracking-widest shadow-lg hover:bg-blue-600 transition-all flex items-center gap-2"
                    >
                        <PrinterIcon className="w-4 h-4"/> Imprimir
                    </button>
                    <button 
                        onClick={() => setIsConsumidorFinal(!isConsumidorFinal)} 
                        className={`px-4 py-2 rounded-lg font-bold text-[10px] uppercase tracking-widest shadow-sm transition-all flex items-center gap-2 border ${isConsumidorFinal ? 'bg-liquid-gold text-brand-dark border-liquid-gold' : 'bg-transparent text-white/70 border-white/20 hover:bg-white/10'}`}
                    >
                        {isConsumidorFinal ? 'Restaurar Datos Cliente' : 'Emitir como Consumidor Final'}
                    </button>
                </div>
            </div>

            {/* --- LIENZO DEL DOCUMENTO (A5 EXACTO) --- */}
            {/* Usamos dimensiones fijas en mm para asegurar que html2pdf capture exactamente lo que queremos */}
            <div 
                id="nota-venta-canvas" 
                className="bg-white relative flex flex-col box-border overflow-hidden shadow-2xl" 
                style={{ 
                    width: '148mm', 
                    height: '210mm', 
                    padding: '10mm', 
                    fontFamily: "'Plus Jakarta Sans', sans-serif" 
                }}
            >
                
                {/* MARCA DE AGUA SUTIL */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.04] z-0">
                    <CordovaLogo className="w-64 h-64 grayscale" />
                </div>

                <div className="relative z-10 flex flex-col h-full">
                    
                    {/* ENCABEZADO */}
                    <div className="flex justify-between items-start mb-6 border-b-2 border-slate-900 pb-4">
                        <div className="flex flex-col gap-2 w-[60%]">
                            <div className="flex items-center gap-3">
                                <CordovaLogo className="h-10 w-auto" />
                                <div>
                                    <h1 className="text-xl font-black text-slate-900 uppercase tracking-tighter leading-none">{config.emisorNombreComercial}</h1>
                                    <p className="text-[8px] text-slate-500 font-bold uppercase tracking-[0.2em]">Servicios Gráficos</p>
                                </div>
                            </div>
                            <div className="text-[7px] text-slate-600 space-y-0.5 mt-2 font-medium leading-tight">
                                <p className="uppercase font-bold">{config.emisorRazonSocial}</p>
                                <p className="flex items-center gap-1"><MapPinIcon className="w-2 h-2 text-brand-red"/> {config.emisorDireccionMatriz}</p>
                                <p className="flex items-center gap-1"><PhoneIcon className="w-2 h-2 text-brand-red"/> {config.emisorTelefono}</p>
                                <p className="flex items-center gap-1"><EnvelopeIcon className="w-2 h-2 text-brand-red"/> {config.emisorEmail}</p>
                            </div>
                        </div>

                        <div className="w-[40%] text-right">
                            <div className="border border-slate-300 rounded-lg p-2 bg-slate-50 mb-1">
                                <p className="text-[8px] font-bold text-slate-500 uppercase">R.U.C. {config.emisorRuc}</p>
                                <h2 className="text-sm font-black text-brand-red uppercase my-0.5">Nota de Venta</h2>
                                <p className="text-[11px] font-mono text-slate-900 font-bold tracking-widest">N° {config.emisorEstablecimiento}-{config.emisorPuntoEmision}-{secuencial}</p>
                            </div>
                            <p className="text-[6px] text-slate-400 uppercase font-bold tracking-wider">AUT. SRI: {config.autorizacionSRI}</p>
                            <p className="text-[6px] text-slate-400 uppercase font-bold tracking-wider">{config.emisorTipoContribuyente}</p>
                        </div>
                    </div>

                    {/* DATOS DEL CLIENTE */}
                    <div className="bg-slate-50 rounded-lg p-3 mb-4 border border-slate-200 text-[8px]">
                        <div className="grid grid-cols-12 gap-y-1">
                            <div className="col-span-2 text-slate-500 font-bold uppercase">Cliente:</div>
                            <div className="col-span-10 text-slate-900 font-bold uppercase truncate">{isConsumidorFinal ? 'CONSUMIDOR FINAL' : cliente.nombre}</div>
                            
                            <div className="col-span-2 text-slate-500 font-bold uppercase">RUC/CI:</div>
                            <div className="col-span-4 text-slate-900 font-mono font-bold">{isConsumidorFinal ? '9999999999999' : (cliente.ruc || cliente.cedula)}</div>
                            
                            <div className="col-span-2 text-slate-500 font-bold uppercase text-right pr-2">Fecha:</div>
                            <div className="col-span-4 text-slate-900 font-bold">{fechaEmision}</div>

                            <div className="col-span-2 text-slate-500 font-bold uppercase">Dirección:</div>
                            <div className="col-span-10 text-slate-700 uppercase truncate">{isConsumidorFinal ? 'CIUDAD' : (cliente.direccion || 'Ciudad')}</div>
                        </div>
                    </div>

                    {/* TABLA DE DETALLES */}
                    <div className="flex-grow">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-900 text-white">
                                    <th className="py-1 px-2 text-[7px] font-bold uppercase w-[10%] text-center rounded-tl-md">Cant.</th>
                                    <th className="py-1 px-2 text-[7px] font-bold uppercase w-[60%]">Descripción</th>
                                    <th className="py-1 px-2 text-[7px] font-bold uppercase w-[15%] text-right">P. Unit</th>
                                    <th className="py-1 px-2 text-[7px] font-bold uppercase w-[15%] text-right rounded-tr-md">Total</th>
                                </tr>
                            </thead>
                            <tbody className="text-[9px] text-slate-700">
                                <tr className="border-b border-slate-100">
                                    <td className="py-2 text-center font-bold align-top">{trabajo.cantidad}</td>
                                    <td className="py-2 px-2 uppercase font-medium leading-tight align-top">
                                        <div className="font-bold text-slate-900">{trabajo.tipo}</div>
                                        <div className="text-[7px] text-slate-500 normal-case italic mt-0.5">{trabajo.subtipo}</div>
                                    </td>
                                    <td className="py-2 px-2 text-right align-top tabular-nums">{formatCurrency(trabajo.total / trabajo.cantidad)}</td>
                                    <td className="py-2 px-2 text-right font-bold align-top tabular-nums text-slate-900">{formatCurrency(trabajo.total)}</td>
                                </tr>
                                {/* Relleno para mantener estructura visual si hay poco contenido */}
                                {[...Array(8)].map((_, i) => (
                                    <tr key={i}>
                                        <td className="py-2">&nbsp;</td><td></td><td></td><td></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* PIE DE PÁGINA */}
                    <div className="mt-auto">
                        <div className="flex justify-between items-end mb-6">
                            <div className="w-[60%] pr-4">
                                <div className="border-t border-slate-300 pt-1 mb-2">
                                    <p className="text-[7px] text-slate-500 uppercase font-bold">Son:</p>
                                    <p className="text-[8px] text-slate-900 font-medium italic leading-tight">{totalEnLetras}</p>
                                </div>
                                <div className="flex gap-2 items-center text-[6px] text-slate-400 uppercase font-bold bg-slate-50 p-1.5 rounded border border-slate-100">
                                    <CheckBadgeIcon className="w-3 h-3 text-emerald-500"/>
                                    <span>Documento Categorizado: NO</span>
                                </div>
                            </div>
                            
                            <div className="w-[40%]">
                                <div className="flex justify-between items-center text-[8px] font-bold text-slate-500 mb-1">
                                    <span>SUBTOTAL</span>
                                    <span>{formatCurrency(trabajo.total)}</span>
                                </div>
                                <div className="flex justify-between items-center text-[8px] font-bold text-slate-500 mb-1">
                                    <span>IVA 0%</span>
                                    <span>$0.00</span>
                                </div>
                                <div className="flex justify-between items-center text-sm font-black text-slate-900 border-t border-slate-900 pt-1 mt-1">
                                    <span>TOTAL USD</span>
                                    <span>{formatCurrency(trabajo.total)}</span>
                                </div>
                            </div>
                        </div>

                        {/* FIRMAS */}
                        <div className="grid grid-cols-2 gap-8 mb-4">
                            <div className="text-center">
                                <div className="border-t border-slate-400 w-3/4 mx-auto mb-1"></div>
                                <p className="text-[6px] font-black text-slate-300 tracking-[0.4em] uppercase italic">Imprenta Córdova</p>
                                <p className="text-[7px] font-bold text-slate-500 uppercase tracking-widest">Firma Autorizada</p>
                            </div>
                            <div className="text-center">
                                <div className="border-t border-slate-400 w-3/4 mx-auto mb-1"></div>
                                <p className="text-[7px] font-bold text-slate-500 uppercase tracking-widest">Recibí Conforme</p>
                            </div>
                        </div>

                        {/* LEGAL */}
                        <div className="text-center border-t border-slate-200 pt-1">
                            <p className="text-[5px] text-slate-400 uppercase tracking-[0.1em] font-medium leading-tight">
                                {config.imprentaNombre} • RUC {config.imprentaRuc} • Aut. {config.imprentaAutorizacion} • F. Autorización {config.fechaAutorizacion} • F. Caducidad {config.fechaCaducidad}
                                <br/> Original: Adquirente / Copia: Emisor
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default NotaDeVentaPage;
