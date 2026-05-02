import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useData } from '../contexts/DataContext';
import { Cliente, Trabajo, Regimen } from '../types';
import { 
    PrinterIcon, ArrowDownTrayIcon, ArrowLeftIcon, 
    Loader2Icon, MapPinIcon, ExclamationTriangleIcon, ShieldCheckIcon,
    FingerPrintIcon, CpuIcon, ActivityIcon, LockIcon, HomeIcon,
    AlertTriangleIcon
} from '../components/Icons';
import { formatCurrency } from '../utils';
import { supabase } from '../services/supabase';

declare const html2pdf: any;

const DigitalSeal = () => (
    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-[0.04] pointer-events-none select-none z-0">
        <div className="w-[600px] h-[600px] border-[12px] border-black rounded-full flex items-center justify-center rotate-12 relative">
            <div className="absolute inset-4 border-2 border-black rounded-full border-dashed animate-reverse-spin" style={{ animationDuration: '60s' }} />
            <div className="text-[50px] font-black text-center leading-tight uppercase tracking-tighter">
                CORDOVA ELITE PROTOCOL<br/>
                <span className="text-[70px]">SRI_AUTH_2026</span><br/>
                SECURE_INDUSTRIAL_INTAKE
            </div>
        </div>
    </div>
);

const SecurityWatermark = () => (
    <div className="absolute inset-0 overflow-hidden pointer-events-none select-none opacity-[0.02] z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[120%] h-[120%] flex flex-wrap gap-20 rotate-[-25deg]">
            {Array.from({ length: 40 }).map((_, i) => (
                <div key={i} className="text-[10px] font-mono font-black whitespace-nowrap tracking-[0.5em]">
                    CORDOVA_ELITE_SYSTEM_INTEGRITY_VERIFIED_AUTHENTIC_DOCUMENT_NO_COPIES
                </div>
            ))}
        </div>
    </div>
);

const TacticalStatusBar = ({ id }: { id: string }) => (
    <div className="w-full flex justify-between items-center px-4 py-1.5 bg-slate-100 border-t border-slate-300 font-mono text-[7px] text-slate-500 font-black uppercase tracking-[0.2em] relative z-20">
        <div className="flex gap-4">
            <span className="flex items-center gap-1"><CpuIcon className="w-2.5 h-2.5" /> SYSTEM_HASH: {id.substring(0, 12)}</span>
            <span className="flex items-center gap-1"><ActivityIcon className="w-2.5 h-2.5" /> LATENCY: 12ms</span>
        </div>
        <div className="flex gap-4">
            <span className="flex items-center gap-1"><LockIcon className="w-2.5 h-2.5" /> ENCRYPTION: AES_256_GCM</span>
            <span>BUILD_v2.0.26_STABLE</span>
        </div>
    </div>
);

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

const SolicitudImpresionPage: React.FC = () => {
    const { trabajoId } = useParams<{ trabajoId: string }>();
    const navigate = useNavigate();
    const location = useLocation();
    const queryParams = new URLSearchParams(location.search);
    const format = queryParams.get('format') || 'a4'; 
    const { trabajos, clientes, sriCredentials, config: cloudConfig, loading: dataLoading } = useData();
    const [trabajo, setTrabajo] = useState<Trabajo | null>(null);
    const [cliente, setCliente] = useState<Cliente | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isRetrying, setIsRetrying] = useState(false);

    useEffect(() => {
        if (!trabajoId) return;

        const fetchDirectly = async () => {
            console.log("[SolicitudImpresion] Iniciando búsqueda directa...");
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
                console.error("[SolicitudImpresion] Error en fetch directo:", err);
                setError("Documento no encontrado en la base de datos.");
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
    }, [trabajoId, trabajos, clientes, dataLoading]);

    const getEstablecimientoAddress = () => {
        if (!cliente || !trabajo) return '';
        if (cliente.fiscal_data?.establecimientos) {
            const est = cliente.fiscal_data.establecimientos.find(e => e.codigo === trabajo.establecimiento);
            if (est) return est.direccion;
        }
        return cliente.direccion;
    };

    const config = {
        emisorDireccionMatriz: cloudConfig?.direccion || 'Colón e/ Sucre y Av. Rocafuerte',
        emisorTelefono: cloudConfig?.imprentaTelefono || '0993083943 • 0962585172',
        emisorRuc: cloudConfig?.emisorRuc || cloudConfig?.imprentaRuc || '0702065319001',
        imprentaAutorizacion: cloudConfig?.imprentaAutorizacion || '8634',
        emisorEmail: 'imprentacordova@gmail.com',
    };

    const handleDownloadPdf = () => {
        const element = document.getElementById('documento-maestro-sri');
        if (!element || !trabajo) return;
        const opt = {
            margin: 0,
            filename: `Elite-SRI-${trabajo.orden}-${cliente?.ruc || cliente?.cedula}.pdf`,
            image: { type: 'jpeg', quality: 1 },
            html2canvas: { scale: 3, useCORS: true, letterRendering: true, backgroundColor: '#ffffff' },
            jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
        };
        html2pdf().from(element).set(opt).save();
    };

    if (dataLoading || isRetrying) return (
        <div className="min-h-screen flex items-center justify-center bg-[#0a0a0b]">
            <div className="flex flex-col items-center gap-4">
                <Loader2Icon className="w-12 h-12 text-amber-500 animate-spin" />
                <span className="text-amber-500 font-mono text-xs uppercase tracking-[0.3em] animate-pulse">Initializing Elite Protocol...</span>
            </div>
        </div>
    );

    if (error || !trabajo || !cliente) return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-[#0a0a0b] p-6 text-center">
            <div className="p-8 rounded-[3rem] bg-red-500/10 border border-red-500/20 mb-10 shadow-luxury">
                <AlertTriangleIcon className="w-16 h-16 text-red-500 mx-auto mb-6" />
                <h2 className="text-center font-black text-sm uppercase tracking-widest mb-1">IMPRENTA CÓRDOVA</h2>
                <p className="text-center text-[10px] font-bold uppercase mb-4 tracking-tighter">SOLICITUD DE PRODUCCIÓN</p>
                <p className="text-slate-400 font-bold text-sm max-w-md mx-auto leading-relaxed uppercase">
                    {error || "El registro solicitado no está disponible en la base de datos local ni remota."}
                </p>
            </div>
            <button 
                onClick={() => navigate('/dashboard')}
                className="px-10 py-5 bg-amber-500 rounded-2xl text-[10px] font-black text-black uppercase tracking-widest hover:scale-105 transition-all shadow-gold-glow"
            >
                Volver al Centro de Mando
            </button>
        </div>
    );

    const fechaHoy = new Date();
    const dia = fechaHoy.getDate().toString().padStart(2, '0');
    const mes = (fechaHoy.getMonth() + 1).toString().padStart(2, '0');
    const anio = fechaHoy.getFullYear().toString();
    const hora = fechaHoy.toLocaleTimeString('es-EC', {hour: '2-digit', minute:'2-digit'});

    const rawSubtipo = trabajo.subtipo || '';
    const parsedJobItems = rawSubtipo.split(',').map(part => {
        const trimmed = part.trim();
        const match = trimmed.match(/^(\d+)x\s+(.*)$/i);
        return {
            cantidad: match ? match[1] : trabajo.cantidad.toString(),
            descripcion: (match ? match[2] : trimmed).toLowerCase()
        };
    });

    const isRimpe = cliente.regimen === Regimen.NEGOCIO_POPULAR;

    const standardTypes = [
        { key: 'factura', label: 'Facturas' },
        { key: 'nota de venta', label: 'Nota de Venta' },
        { key: 'liquidacion de compra de bienes muebles', label: 'Liq. Compra Bienes Muebles Usados' },
        { key: 'credito', label: 'Notas de Crédito' },
        { key: 'debito', label: 'Notas de Débito' },
        { key: 'guia', label: 'Guías de Remisión' },
        { key: 'boleto', label: 'Boletos / Entradas Espectáculos' },
        { key: 'vehiculo', label: 'Liq. Compra Vehículos Usados' },
        { key: 'acta', label: 'Acta Entrega-Recepción Vehículos' },
        { key: 'servicios', label: 'Liq. Compra Bienes o Prest. Servicios' },
        { key: 'retencion', label: 'Comprobante de Retención' },
        { key: 'recibo', label: 'Recibos (No SRI)' }
    ];

    const hasSriKey = sriCredentials.some(c => c.ruc === cliente.ruc);

    const mappedItems = standardTypes.map(st => {
        const match = parsedJobItems.find(pj => pj.descripcion.includes(st.key));
        if (match) {
            return { 
                tipo: st.label, 
                cant: match.cantidad, 
                estab: trabajo.establecimiento || '001', 
                punto: trabajo.puntoEmision || '001', 
                isChecked: true,
                precio: (trabajo.total / (parsedJobItems.length || 1)).toFixed(2)
            };
        }
        return { tipo: st.label, cant: '', estab: '', punto: '', isChecked: false, precio: '' };
    });

    const RucArray = (cliente.ruc || cliente.cedula || '9999999999001').split('').slice(0, 13);
    while (RucArray.length < 13) RucArray.push('');

    const renderFormulario = (variant: 'cliente' | 'imprenta' | 'full') => {
        const isClient = variant === 'cliente';
        const isA5 = format === 'a5';
        const isOperator = variant === 'imprenta';
        
        const headerBg = isClient ? 'bg-slate-50' : 'bg-slate-50';
        const headerBorder = isClient ? 'border-slate-300' : 'border-slate-300';
        const headerText = isClient ? 'text-slate-900' : 'text-slate-900';
        const tableHeaderBg = isClient ? 'bg-slate-800' : 'bg-slate-900';
        const checkboxActive = isClient ? 'bg-slate-100 text-slate-900' : 'bg-slate-100 text-slate-900';
        
        const paddingClass = isA5 ? 'p-5' : 'p-10';
        const titleSize = isA5 ? 'text-2xl' : 'text-4xl';
        const tableTextSize = isA5 ? 'text-[9px]' : 'text-[11px]';

        return (
            <div className={`relative flex flex-col box-border text-black ${paddingClass} h-full bg-white overflow-hidden`}>
                
                <div className="absolute inset-0 opacity-[0.02] pointer-events-none select-none z-0" style={{ backgroundImage: 'radial-gradient(circle, #000 1px, transparent 1px)', backgroundSize: '16px 16px' }} />
                <SecurityWatermark />
                <DigitalSeal />

                <div className={`${headerBg} ${headerText} rounded-3xl overflow-hidden border-2 ${headerBorder} flex flex-col shadow-2xl relative z-10 mb-6`}>
                    <div className={`flex justify-between items-center px-8 py-3 ${isClient ? 'bg-slate-50 border-b border-slate-200' : 'bg-slate-50'}`}>
                        <div className="flex items-center gap-6">
                            <div className="flex flex-col">
                                <h1 className={`${titleSize} font-black tracking-[-0.04em] leading-none flex items-center gap-2`} style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
                                    IMPRENTA CÓRDOVA <span className="text-brand-blue">ELITE</span>
                                </h1>
                            </div>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                            <div className="bg-slate-900/10 border border-slate-900/20 px-4 py-1 rounded-lg">
                                <span className="text-[12px] font-black text-slate-900 uppercase tracking-widest">ORDEN #{trabajo.orden}</span>
                            </div>
                        </div>
                    </div>
                    
                    <div className={`px-8 ${isA5?'py-2':'py-4'} flex justify-between items-center border-t ${isClient ? 'border-slate-200' : 'border-slate-200'}`}>
                        <div className={`flex gap-8 ${isA5?'text-[10px]':'text-[12px]'} font-bold`}>
                            <div className="flex flex-col">
                                <span className="text-[8px] uppercase opacity-40 mb-0.5 tracking-widest">Matriz_Location</span>
                                <span className="flex items-center gap-2"><MapPinIcon className="w-3.5 h-3.5 text-brand-blue"/> {config.emisorDireccionMatriz}</span>
                            </div>
                            <div className="flex flex-col border-l border-slate-200 pl-8">
                                <span className="text-[8px] uppercase opacity-40 mb-0.5 tracking-widest">Comm_Link</span>
                                <span className="flex items-center gap-2"><PrinterIcon className="w-3.5 h-3.5 text-brand-blue"/> {config.emisorTelefono}</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-4 mb-6 relative z-10">
                    <div className="flex-grow h-px bg-slate-200" />
                    <div className="flex items-center gap-3 bg-white border-2 border-slate-800 px-8 py-2 rounded-2xl shadow-xl transform rotate-[-0.5deg]">
                        <h2 className={`${isA5?'text-xs':'text-sm'} font-black text-slate-800 uppercase tracking-[0.3em]`}>
                            Solicitud de Autorización de Impresión
                        </h2>
                    </div>
                    <div className="flex-grow h-px bg-slate-200" />
                </div>

                <div className={`grid grid-cols-12 gap-8 ${isA5?'mb-6':'mb-10'} relative z-10`}>
                    <div className="col-span-7 space-y-4">
                        <div className="bg-slate-50 border border-slate-200 p-6 rounded-[2rem] shadow-sm relative overflow-hidden group">
                            <div className="flex flex-col gap-4">
                                <div className="flex flex-col">
                                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-[0.5em] mb-1">Subject_Identification</span>
                                    <span className="text-xl font-black text-slate-900 uppercase leading-none tracking-tight">{cliente.nombre}</span>
                                    <div className="flex justify-between items-end mt-1">
                                        <p className="text-[10px] font-bold text-slate-800 leading-tight flex-1">{cliente.nombreComercial || 'No_Brand_Name'}</p>
                                        <span className="text-[9px] font-mono text-slate-400 uppercase tracking-tighter max-w-[200px] truncate">{getEstablecimientoAddress()}</span>
                                    </div>
                                </div>
                                <div className="h-px bg-slate-200 w-full" />
                                <div className="flex gap-10">
                                    <div className="flex flex-col">
                                        <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Regimen_Mode</span>
                                        <span className={`text-[10px] font-black px-3 py-1 rounded-lg uppercase tracking-widest shadow-sm ${isRimpe ? 'bg-slate-900 text-white' : 'bg-slate-200 text-slate-800'}`}>
                                            {cliente.regimen || 'GENERAL_STANDARD'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-col gap-2">
                            <span className="text-[8px] font-black text-slate-400 uppercase tracking-[0.5em] px-4">RUC_National_Registry</span>
                            <div className="flex gap-1.5 p-1.5 bg-slate-100 border-2 border-slate-800 rounded-2xl shadow-xl">
                                {RucArray.map((digit, i) => (
                                    <div key={i} className="flex-grow h-12 bg-white flex items-center justify-center font-mono font-black text-xl text-slate-900 border border-slate-200 rounded-xl shadow-inner">
                                        {digit}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="col-span-5 flex flex-col gap-4">
                        <div className="bg-slate-50 text-slate-900 p-6 rounded-[2.5rem] shadow-2xl relative overflow-hidden border-2 border-slate-200 flex flex-col justify-between h-full">
                            <div className="flex justify-between items-start relative z-10">
                                <div className="flex flex-col">
                                    <span className="text-[7px] font-black text-brand-blue uppercase tracking-widest mb-0.5">SALDO PENDIENTE</span>
                                    {hasSriKey || trabajo.estadoClave === 'LISTA' ? (
                                        <span className="text-xl font-black text-slate-900 flex items-center gap-3">
                                            <ShieldCheckIcon className="w-7 h-7 text-emerald-600" /> SECURE_OK
                                        </span>
                                    ) : (
                                        <span className="text-xl font-black text-slate-400">UNVERIFIED_PENDING</span>
                                    )}
                                </div>
                                <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center border border-slate-200">
                                    <LockIcon className="w-6 h-6 text-brand-blue" />
                                </div>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4 mt-6 relative z-10">
                                <div className="bg-white border border-slate-200 rounded-2xl p-3 flex flex-col items-center">
                                    <span className="text-[6px] font-black uppercase tracking-widest">VALOR TOTAL</span>
                                    <span className="font-mono text-sm font-black tracking-widest">{hora}</span>
                                </div>
                                <div className="bg-white border border-slate-200 rounded-2xl p-3 flex flex-col items-center">
                                    <span className="text-[7px] font-black opacity-40 uppercase tracking-widest mb-1">Cycle_Date</span>
                                    <span className="font-mono text-sm font-black tracking-widest">{dia}.{mes}.{anio}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex-grow border-2 border-slate-900 rounded-[2.5rem] overflow-hidden flex flex-col shadow-[0_30px_60px_-15px_rgba(0,0,0,0.15)] relative z-10 bg-white mb-6">
                    <div className={`${tableHeaderBg} text-white flex justify-between items-center px-10 py-3.5 font-black uppercase tracking-[0.4em] relative overflow-hidden`}>
                        <span className="text-[10px] relative z-10 flex items-center gap-3">
                            <ActivityIcon className="w-4 h-4 text-brand-blue" /> Industrial_Production_Matrix_v2
                        </span>
                    </div>
                    
                    <div className="flex-grow overflow-hidden">
                        <table className={`w-full text-center ${tableTextSize} font-bold text-slate-800 border-collapse h-full`}>
                            <thead>
                                <tr className="border-b-2 border-slate-900 bg-slate-50">
                                    <th className="py-2.5 border-r border-slate-200 w-[12%] uppercase tracking-widest text-[8px] text-slate-400">Spec_Size</th>
                                    <th className="py-2.5 px-6 border-r border-slate-200 w-[40%] text-left uppercase tracking-widest text-[8px] text-slate-400">Category_Descriptor</th>
                                    <th className="py-2.5 border-r border-slate-200 w-[10%] text-[8px] text-slate-400 uppercase tracking-widest">Estab</th>
                                    <th className="py-2.5 border-r border-slate-200 w-[10%] text-[8px] text-slate-400 uppercase tracking-widest">Pnt_Em</th>
                                    <th className="py-2.5 border-r border-slate-200 w-[12%] text-[8px] text-slate-400 uppercase tracking-widest">Quantity</th>
                                    <th className="py-2.5 w-[16%] text-[8px] text-slate-400 uppercase tracking-widest">Unit_Value</th>
                                </tr>
                            </thead>
                            <tbody>
                                {mappedItems.map((item, idx) => (
                                    <tr key={idx} className={`border-b border-slate-100 last:border-0 ${item.isChecked ? checkboxActive : 'opacity-[0.15]'}`}>
                                        <td className="py-1 font-mono text-[9px] border-r border-slate-100">{item.isChecked ? (trabajo.tamano || 'A5') : ''}</td>
                                        <td className={`text-left pl-8 uppercase ${isA5?'text-[10px]':'text-[12px]'} ${isA5?'h-7':'h-9'} border-r border-slate-100 font-black tracking-tighter relative`}>
                                            {item.isChecked && <div className="absolute left-3 top-1/2 -translate-y-1/2 w-2 h-2 bg-brand-blue rounded-full" />}
                                            {item.tipo}
                                        </td>
                                        <td className="py-1 font-mono border-r border-slate-100">{item.isChecked?item.estab:''}</td>
                                        <td className="py-1 font-mono border-r border-slate-100">{item.isChecked?item.punto:''}</td>
                                        <td className={`py-1 ${isA5?'text-sm':'text-xl'} font-black border-r border-slate-100 text-slate-900`}>{item.isChecked?item.cant:''}</td>
                                        <td className="py-1 font-mono font-black text-slate-700">{item.isChecked ? `$${item.precio}` : ''}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="grid grid-cols-12 gap-8 items-stretch relative z-10 mb-6">
                    <div className="col-span-8 flex flex-col gap-6">
                        <div className="bg-slate-50 text-slate-900 rounded-3xl p-6 border-2 border-slate-200 shadow-sm flex items-center gap-8 relative overflow-hidden group">
                            <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-brand-blue border border-slate-200 shrink-0">
                                <LockIcon className="w-7 h-7" />
                            </div>
                            <div className="flex flex-col">
                                <span className="text-[10px] font-black text-brand-blue uppercase tracking-[0.4em] mb-1">Safety_Notice_Protocol</span>
                                <p className="text-[9px] font-bold uppercase tracking-wider leading-relaxed opacity-80">
                                    Este documento constituye una orden de producción vinculante. La custodia de los comprobantes autorizados es responsabilidad exclusiva del sujeto pasivo según normativa vigente del SRI.
                                </p>
                            </div>
                        </div>
                        
                        <div className="flex gap-6">
                            <div className="flex-grow bg-slate-50 border-2 border-slate-200 rounded-[2rem] p-8 h-36 flex flex-col justify-end items-center relative group">
                                <div className="w-[80%] h-px bg-slate-400 mb-3" />
                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.4em]">Auth_Contributor_Signature</span>
                            </div>
                            <div className="w-32 bg-slate-100 rounded-[2rem] border-2 border-slate-200 flex flex-col items-center justify-center p-4">
                                <div className="w-14 h-14 bg-white rounded-xl border border-slate-300 flex flex-center items-center justify-center mb-2 shadow-inner">
                                    <span className="text-[7px] font-black text-slate-300 uppercase tracking-widest text-center">Digit_Stamp</span>
                                </div>
                                <p className="text-[6px] font-black text-slate-400 mt-1 uppercase tracking-widest">{isOperator ? 'COPIA OPERADOR' : 'ORIGINAL CLIENTE'}</p>
                            </div>
                        </div>
                    </div>

                    <div className="col-span-4 flex flex-col gap-3">
                            
                            <div className="space-y-4">
                                <div className="flex justify-between items-center border-b border-white/5 pb-3">
                                    <span className="text-[10px] font-black opacity-30 uppercase tracking-[0.3em]">Gross_Value</span>
                                    <span className="font-mono text-lg font-bold">{formatCurrency(trabajo.total)}</span>
                                </div>
                                <div className="flex justify-between items-center border-b border-white/5 pb-3">
                                    <span className="text-[10px] font-black opacity-30 uppercase tracking-[0.3em]">Initial_Credit</span>
                                    <span className="font-mono text-lg font-bold text-emerald-400">-{formatCurrency(trabajo.abono)}</span>
                                </div>
                            </div>
                            
                            <div className="pt-6 flex flex-col items-end relative z-10">
                                <div className="flex items-center gap-3 mb-1">
                                    <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse" />
                                    <span className="text-[11px] font-black text-amber-500 uppercase tracking-[0.5em]">Net_Balance</span>
                                </div>
                                <span className="text-5xl font-black tracking-tighter leading-none shadow-sm">{formatCurrency(trabajo.saldo)}</span>
                            </div>
                        </div>
                        <div className="bg-slate-100 rounded-2xl p-2.5 text-center border border-slate-200">
                            <span className="text-[8px] font-mono text-slate-500 font-black uppercase tracking-[0.5em]">SRI_VERIFIED_PROTOCOL_v2.0.26</span>
                        </div>
                    </div>
                </div>

                <TacticalStatusBar id={trabajo.id} />
            </div>
        );
    };

    return (
        <div className="bg-[#0f1113] min-h-screen py-16 flex flex-col items-center overflow-y-auto font-sans relative">
            <style>{`
                @media print {
                    .no-print { display: none !important; }
                    body { background: white !important; margin: 0 !important; }
                    .page-container { 
                        box-shadow: none !important; 
                        margin: 0 !important;
                        padding: 0 !important;
                        border: none !important;
                        width: 210mm !important;
                        height: 297mm !important;
                    }
                }
                .page-container {
                    width: 210mm;
                    height: 297mm;
                    background: white;
                    position: relative;
                }
                .web-shadow {
                    box-shadow: 0 60px 150px -30px rgba(0,0,0,0.8);
                }
                @keyframes reverse-spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(-360deg); }
                }
                .animate-reverse-spin {
                    animation: reverse-spin linear infinite;
                }
                .shadow-gold-glow-text {
                    text-shadow: 0 0 20px rgba(245, 158, 11, 0.3);
                }
            `}</style>

            <div className="w-full max-w-[210mm] flex justify-between items-center mb-12 no-print px-10 py-6 bg-white/5 backdrop-blur-2xl rounded-[3rem] border border-white/10 shadow-2xl relative z-50">
                <div className="flex gap-6">
                    <button onClick={() => navigate('/dashboard')} className="group flex items-center gap-4 text-white/40 font-black text-[10px] uppercase tracking-widest hover:text-white transition-all">
                        <div className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center group-hover:border-white/40 transition-all">
                            <HomeIcon className="w-5 h-5" />
                        </div>
                        Dashboard
                    </button>
                    <button onClick={() => navigate(-1)} className="group flex items-center gap-4 text-white/40 font-black text-[10px] uppercase tracking-widest hover:text-white transition-all">
                        <div className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center group-hover:border-white/40 transition-all">
                            <ArrowLeftIcon className="w-5 h-5" />
                        </div>
                        Volver
                    </button>
                </div>
                
                <div className="flex gap-5">
                    <div className="hidden md:flex flex-col items-end justify-center mr-6 border-r border-white/10 pr-10">
                        <span className="text-[8px] font-black text-amber-500/50 uppercase tracking-[0.5em] mb-1">Target_Format</span>
                        <span className="text-[12px] font-black text-white uppercase tracking-widest">
                            {format === 'a5' ? 'Dual Industrial (A5)' : 'Master Protocol (A4)'}
                        </span>
                    </div>
                    
                    <button onClick={handleDownloadPdf} className="bg-white/5 hover:bg-white/10 border border-white/10 px-8 py-4 rounded-[2rem] font-black text-[10px] uppercase tracking-widest text-white transition-all flex items-center gap-4 active:scale-95">
                        <ArrowDownTrayIcon className="w-6 h-6 text-amber-500" /> Exportar PDF
                    </button>
                    
                    <button onClick={() => window.print()} className="bg-amber-500 text-black px-12 py-4 rounded-[2rem] font-black text-[10px] uppercase tracking-widest shadow-[0_20px_40px_-10px_rgba(245,158,11,0.5)] hover:shadow-amber-500/40 flex items-center gap-4 hover:scale-105 transition-all active:scale-95">
                        <PrinterIcon className="w-6 h-6"/> Ejecutar Impresión
                    </button>
                </div>
            </div>

            <div id="documento-maestro-sri" className="page-container web-shadow rounded-[0.5rem] relative z-10 scale-[0.95] origin-top">
                {format === 'a5' ? (
                    <div className="flex flex-col h-[297mm]">
                        <div className="h-[148.5mm] overflow-hidden">
                            {renderFormulario('cliente')}
                        </div>
                        <div className="w-full h-0 border-t-4 border-dashed border-slate-300 my-0 relative z-50">
                            <div className="absolute left-1/2 -translate-x-1/2 -top-5 bg-white border-2 border-slate-800 px-8 py-2 rounded-full text-[9px] text-slate-800 font-black flex items-center gap-4 shadow-2xl">
                                <span className="rotate-90 text-[12px]">✂</span> PERFORADO DE SEGURIDAD / LÍNEA DE CORTE INDUSTRIAL
                            </div>
                        </div>
                        <div className="h-[148.5mm] overflow-hidden">
                            {renderFormulario('imprenta')}
                        </div>
                    </div>
                ) : (
                    <div className="h-[297mm]">
                        {renderFormulario('full')}
                    </div>
                )}
            </div>
            
            <div className="fixed inset-0 pointer-events-none z-0">
                <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-amber-500/5 rounded-full blur-[120px]" />
                <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-blue-500/5 rounded-full blur-[150px]" />
            </div>
        </div>
    );
};

export default SolicitudImpresionPage;
