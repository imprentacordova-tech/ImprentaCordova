
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useData } from '../contexts/DataContext';
import { Trabajo, Cliente, TrabajoEstado } from '../types';
import { formatCurrency, numeroALetras } from '../utils';
import { 
    PrinterIcon, ArrowDownTrayIcon, ArrowLeftIcon, Loader2Icon, 
    CheckCircleIcon, SparklesIcon, TrophyIcon, ArrowRightIcon,
    HomeIcon, CordovaLogo, MapPinIcon, CheckBadgeIcon, 
    EnvelopeIcon, PhoneIcon, InfoIcon
} from '../components/Icons';
import { motion, AnimatePresence } from 'framer-motion';
import Confetti from 'react-confetti';
import { useWindowSize } from 'react-use';
import { supabase } from '../services/supabase';
import { AlertTriangleIcon } from '../components/Icons';

import html2pdf from 'html2pdf.js';

const mapDBTrabajo = (t: any): Trabajo => ({
    ...t,
    clienteId: t.cliente_id,
    fechaEntrada: t.fecha_entrada,
    fechaEntrega: t.fecha_entrega,
    creadoPor: t.creado_por,
    actualizadoPor: t.actualizado_por,
    fotoOriginalUrl: t.foto_original_url,
    fotoEvidenciaUrl: t.foto_evidencia_url,
    estadoClave: t.estado_clave,
    imprimirClave: t.imprimir_clave,
    esRenovacion: t.es_renovacion,
    esSRI: t.es_sri === true || t.tipo?.toLowerCase() === 'sri',
    tamano: t.tamano,
    establecimiento: t.establecimiento,
    puntoEmision: t.punto_emision,
    fechaVencimiento: t.fecha_vencimiento,
    actividadSeleccionada: t.actividad_seleccionada,
    claveAcceso: t.clave_acceso,
    arteAprobado: t.arte_aprobado,
    fotoRetiroUrl: t.foto_retiro_url,
    autorizacion_sri: t.autorizacion_sri,
    numeracion: t.numeracion
});

const NotaDeVentaPage: React.FC = () => {
    const { trabajoId } = useParams<{ trabajoId: string }>();
    const navigate = useNavigate();
    const { trabajos, clientes, config: cloudConfig, loading: dataLoading, refreshData } = useData();
    const [trabajo, setTrabajo] = useState<Trabajo | null>(null);
    const [cliente, setCliente] = useState<Cliente | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const [isConsumidorFinal, setIsConsumidorFinal] = useState(false);
    const [isRetrying, setIsRetrying] = useState(false);

    const { width, height } = useWindowSize();
    const [isCelebrationVisible, setIsCelebrationVisible] = useState(false);

    useEffect(() => {
        const fetchDirectly = async () => {
            if (!trabajoId) return;
            setIsRetrying(true);
            try {
                const { data: tData, error: tError } = await supabase
                    .from('trabajos')
                    .select('*')
                    .eq('id', trabajoId)
                    .single();
                
                if (tError) throw tError;
                if (tData) {
                    const mappedT = mapDBTrabajo(tData);
                    setTrabajo(mappedT);

                    const { data: cData, error: cError } = await supabase
                        .from('clientes')
                        .select('*')
                        .eq('id', mappedT.clienteId)
                        .single();
                    
                    if (!cError && cData) {
                        setCliente(cData);
                    }
                }
            } catch (err) {
                console.error("[NotaDeVenta] Error en fetch directo:", err);
                setError("No se pudo recuperar el documento desde la base de datos.");
            } finally {
                setIsRetrying(false);
            }
        };

        if (dataLoading) return;

        const currentTrabajo = trabajos.find(t => t.id === trabajoId);
        if (currentTrabajo) {
            setTrabajo(currentTrabajo);
            const foundCliente = clientes.find(c => c.id === currentTrabajo.clienteId) || null;
            if (foundCliente) {
                setCliente(foundCliente);
            } else {
                fetchDirectly();
            }
        } else {
            fetchDirectly();
        }

        // Trigger celebration if it's already delivered/finished
        if (currentTrabajo?.estado === TrabajoEstado.ENTREGADO) {
            const hasCelebrated = sessionStorage.getItem(`celebrated_${currentTrabajo.id}`);
            if (!hasCelebrated) {
                setIsCelebrationVisible(true);
                sessionStorage.setItem(`celebrated_${currentTrabajo.id}`, 'true');
            }
        }
    }, [trabajoId, trabajos, clientes, dataLoading]);

    // Mapear config de Supabase al formato esperado por la plantilla
    const config = {
        emisorNombreComercial: cloudConfig?.imprentaNombre || 'IMPRENTA CÓRDOVA',
        emisorRazonSocial: cloudConfig?.emisorRazonSocial || 'IMPRENTA CÓRDOVA',
        emisorRuc: cloudConfig?.emisorRuc || '1104212564001',
        emisorEstablecimiento: cloudConfig?.emisorEstablecimiento || '001',
        emisorPuntoEmision: cloudConfig?.emisorPuntoEmision || '001',
        emisorDireccionMatriz: 'Colón y Sucre, Pasaje, El Oro',
        emisorTelefono: cloudConfig?.imprentaTelefono || '',
        emisorEmail: '',
        autorizacionSRI: cloudConfig?.imprentaAutorizacion || '',
        emisorTipoContribuyente: 'CONTRIBUYENTE RIMPE',
        imprentaNombre: cloudConfig?.imprentaNombre || 'IMPRENTA CÓRDOVA',
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
        
        const opt = {
            margin: 0,
            filename: `NV-${String(trabajo.orden).padStart(6,'0')}-${cliente.nombre.split(' ')[0]}.pdf`,
            image: { type: 'jpeg' as const, quality: 0.98 },
            html2canvas: { 
                scale: 2,
                useCORS: true, 
                letterRendering: true,
                scrollY: 0,
                logging: false
            },
            jsPDF: { 
                unit: 'mm', 
                format: 'a5', 
                orientation: 'portrait' as const,
                compress: true
            }
        };

        try {
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

    if (dataLoading || (isRetrying && !trabajo)) return (
        <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 text-center">
            <div className="w-20 h-20 border-4 border-slate-100 border-t-brand-blue rounded-full animate-spin mb-8 shadow-sm"></div>
            <h2 className="text-2xl font-black text-slate-900 uppercase tracking-[0.3em] mb-4">Sincronizando Archivos</h2>
            <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest">Buscando registro en el núcleo de datos...</p>
        </div>
    );

    if (!trabajo || !cliente) return (
        <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 text-center">
            <div className="p-8 rounded-[3rem] bg-red-500/10 border border-red-500/20 mb-10 shadow-luxury animate-pulse">
                <AlertTriangleIcon className="w-16 h-16 text-red-500 mx-auto mb-6" />
                <h2 className="text-4xl font-black text-slate-900 uppercase tracking-tighter mb-4">Documento No Encontrado</h2>
                <p className="text-slate-500 font-bold text-sm max-w-md mx-auto leading-relaxed">
                    {error || "La orden solicitada no existe, el cliente está desvinculado o ha sido eliminada del sistema."}
                </p>
            </div>
            <div className="flex gap-4">
                <button 
                    onClick={() => navigate(-1)}
                    className="px-10 py-5 bg-white border border-slate-200 rounded-2xl text-[10px] font-black text-slate-400 uppercase tracking-widest hover:bg-slate-50 transition-all"
                >
                    Regresar
                </button>
                <button 
                    onClick={() => refreshData()}
                    className="px-10 py-5 bg-brand-blue rounded-2xl text-[10px] font-black text-white uppercase tracking-widest hover:scale-105 transition-all shadow-blue-glow-sm"
                >
                    Reintentar Sincronización
                </button>
            </div>
        </div>
    );

    const secuencial = String(trabajo.orden).padStart(9, '0');
    const fechaEmision = new Date().toLocaleDateString('es-EC', { year: 'numeric', month: 'long', day: 'numeric' });
    const totalEnLetras = numeroALetras(trabajo.total);

    return (
        <div className="bg-slate-500 min-h-screen py-8 flex flex-col items-center justify-start overflow-y-auto font-sans">
            <AnimatePresence>
                {isCelebrationVisible && (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-white/95 backdrop-blur-2xl"
                    >
                        <Confetti width={width} height={height} recycle={false} numberOfPieces={500} colors={['#3B82F6', '#1E293B', '#10B981']} />
                        
                        <motion.div 
                            initial={{ scale: 0.8, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            className="max-w-2xl w-full bg-white border border-slate-200 p-12 rounded-[3.5rem] shadow-2xl text-center relative overflow-hidden"
                        >
                            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-64 bg-brand-blue/10 rounded-full blur-[100px] -z-10" />
                            
                            <motion.div 
                                initial={{ rotate: -20, scale: 0 }}
                                animate={{ rotate: 0, scale: 1 }}
                                transition={{ type: "spring", damping: 12, delay: 0.2 }}
                                className="w-32 h-32 bg-brand-blue rounded-full mx-auto flex items-center justify-center mb-8 shadow-blue-glow"
                            >
                                <TrophyIcon className="w-16 h-16 text-white" />
                            </motion.div>

                            <h2 className="text-5xl font-black text-slate-900 uppercase tracking-tighter mb-4 leading-none">
                                ¡CIRCUITO CERRADO!
                            </h2>
                            <p className="text-slate-400 font-bold uppercase tracking-widest text-sm mb-10 max-w-md mx-auto">
                                El pedido ha sido entregado, el saldo liquidado y el dinero registrado en el sistema con éxito.
                            </p>

                            <div className="grid grid-cols-2 gap-4 mb-10">
                                <div className="bg-slate-50 border border-slate-200 p-6 rounded-3xl">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Orden Finalizada</p>
                                    <p className="text-2xl font-black text-slate-900">#{trabajo.orden}</p>
                                </div>
                                <div className="bg-emerald-500/10 border border-emerald-500/20 p-6 rounded-3xl">
                                    <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-1">Efectivo Recibido</p>
                                    <p className="text-2xl font-black text-emerald-600">{formatCurrency(trabajo.total)}</p>
                                </div>
                            </div>

                            <div className="flex flex-col sm:flex-row gap-4 justify-center">
                                <button 
                                    onClick={() => setIsCelebrationVisible(false)}
                                    className="px-10 py-5 bg-white hover:bg-slate-50 border border-slate-200 rounded-2xl font-black text-[10px] uppercase tracking-widest text-slate-900 transition-all flex items-center justify-center gap-3"
                                >
                                    Ver Comprobante
                                </button>
                                <button 
                                    onClick={() => navigate('/dashboard')}
                                    className="px-10 py-5 bg-brand-blue text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:scale-105 transition-all flex items-center justify-center gap-3 shadow-blue-glow"
                                >
                                    Ir al Dashboard <ArrowRightIcon className="w-4 h-4" />
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="w-full max-w-[210mm] flex justify-between items-center mb-10 no-print px-8 py-4 bg-white/90 backdrop-blur-xl rounded-[2.5rem] border border-slate-200 shadow-2xl relative z-50">
                <div className="flex gap-4">
                    <button onClick={() => navigate('/dashboard')} className="group flex items-center gap-3 text-slate-400 font-black text-[10px] uppercase tracking-widest hover:text-slate-900 transition-all">
                        <div className="w-8 h-8 rounded-full border border-slate-200 flex items-center justify-center group-hover:border-brand-blue transition-all">
                            <HomeIcon className="w-4 h-4" />
                        </div>
                        Dashboard
                    </button>
                    <button onClick={() => navigate(-1)} className="group flex items-center gap-3 text-slate-400 font-black text-[10px] uppercase tracking-widest hover:text-slate-900 transition-all">
                        <div className="w-8 h-8 rounded-full border border-slate-200 flex items-center justify-center group-hover:border-brand-blue transition-all">
                            <ArrowLeftIcon className="w-4 h-4" />
                        </div>
                        Atrás
                    </button>
                </div>
                <div className="flex gap-3">
                    <button 
                        onClick={generatePDF} 
                        disabled={isGenerating}
                        className="bg-white text-brand-blue px-6 py-2 rounded-lg font-bold text-xs uppercase tracking-widest shadow-lg hover:bg-slate-100 border border-slate-200 transition-all flex items-center gap-2 disabled:opacity-70"
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
                        className={`px-4 py-2 rounded-lg font-bold text-[10px] uppercase tracking-widest shadow-sm transition-all flex items-center gap-2 border ${isConsumidorFinal ? 'bg-brand-blue text-white border-brand-blue' : 'bg-transparent text-slate-500 border-slate-200 hover:bg-slate-100'}`}
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
                                <div className="flex flex-col">
                                    <div className="flex items-center gap-1 mb-0.5">
                                        <div className="w-1 h-1 rounded-full bg-printing-cyan" />
                                        <div className="w-1 h-1 rounded-full bg-printing-yellow" />
                                        <div className="w-1 h-1 rounded-full bg-printing-red" />
                                    </div>
                                    <h1 className="text-xl font-black text-slate-900 uppercase tracking-[-0.04em] leading-none">{config.emisorNombreComercial}</h1>
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
                                        <div className="text-[7px] text-slate-500 normal-case mt-0.5">{trabajo.subtipo}</div>
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
                                    <p className="text-[8px] text-slate-900 font-medium leading-tight">{totalEnLetras}</p>
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
                                <p className="text-[6px] font-black text-slate-400 tracking-[0.4em] uppercase">Imprenta Córdova</p>
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
