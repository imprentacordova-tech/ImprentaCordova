
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { getTrabajos, getClientes } from '../services/mockApi';
import { Cliente, Trabajo } from '../types';
import { PrinterIcon, AddIcon, TrashIcon, ArrowDownTrayIcon, ShieldCheckIcon, PhoneIcon, EnvelopeIcon, MapPinIcon, ClockIcon } from '../components/Icons';
import { formatCurrency } from '../utils';
import { getConfig, NotaDeVentaConfig } from '../services/configService';

// Declare html2pdf for TypeScript
declare const html2pdf: any;

// Dropdown options
const DOCUMENT_TYPES = [
    'FACTURA', 'NOTAS DE VENTA', 'LIQUIDACION DE COMPRA',
    'NOTAS DE CREDITO', 'NOTAS DE DEBITO', 'GUIAS DE REMISION',
    'ACTA ENTREGA - RECEPCIÓN BOTELLAS PET',
    'LIQUIDACION DE COMPRA BIENES MUEBLES USADOS',
    'LIQUIDACION DE COMPRA VEHICULOS USADOS',
    'ACTA DE ENTREGA - RECEPCION VEHICULOS USADOS'
];

const SIZES = ['1/8 Oficio', '1/4 Oficio', '1/2 Oficio', 'Oficio', 'A4', 'A5'];

const QUANTITIES = [
    '25 Hojas', '50 Hojas', '100 Hojas (1 Block)', 
    '2 Blocks', '3 Blocks', '4 Blocks', '5 Blocks', 
    '10 Blocks', '20 Blocks', '25 Blocks'
];

const ECONOMIC_ACTIVITIES = [
    'Venta al por mayor de alimentos',
    'Venta al por menor de prendas de vestir',
    'Servicios diversos',
    'Actividades de construcción',
    'Transporte de carga',
    'Servicios profesionales',
    'Venta al por mayor de cacao'
];

interface DocumentItem {
    tamano: string;
    tipo: string;
    papelQuimico: boolean;
    establecimiento: string;
    puntoEmision: string;
    cantidadTexto: string;
    precio: number;
}

const SolicitudImpresionPage: React.FC = () => {
    const { trabajoId } = useParams<{ trabajoId: string }>();
    const [trabajo, setTrabajo] = useState<Trabajo | null>(null);
    const [cliente, setCliente] = useState<Cliente | null>(null);
    const [config, setConfig] = useState<NotaDeVentaConfig | null>(null);
    const [loading, setLoading] = useState(true);

    // Form State
    const [actividadEconomica, setActividadEconomica] = useState('');
    const [customActividad, setCustomActividad] = useState('');
    const [items, setItems] = useState<DocumentItem[]>([]);

    useEffect(() => {
        const fetchData = async () => {
            if (!trabajoId) return;
            setLoading(true);
            const conf = getConfig();
            setConfig(conf);
            const [trabajosData, clientesData] = await Promise.all([getTrabajos(), getClientes()]);
            const currentTrabajo = trabajosData.find(t => t.id === trabajoId);
            
            if (currentTrabajo) {
                setTrabajo(currentTrabajo);
                const currentCliente = clientesData.find(c => c.id === currentTrabajo.clienteId);
                setCliente(currentCliente || null);

                // Initialize form state
                const [estab, pto] = conf.numeracionPrefijo.split('-').map(s => s.trim());
                
                // Pre-fill logic for Renovation
                if (currentTrabajo.esRenovacion) {
                    setActividadEconomica('otra');
                    setCustomActividad('RENOVACIÓN / MISMA ACTIVIDAD');
                }

                const initialItem: DocumentItem = {
                    tamano: currentTrabajo.tamano === 'Varios' ? SIZES[1] : currentTrabajo.tamano,
                    tipo: DOCUMENT_TYPES.find(t => currentTrabajo.subtipo.toUpperCase().includes(t)) || DOCUMENT_TYPES[0],
                    papelQuimico: true,
                    establecimiento: currentTrabajo.establecimiento || estab || '001',
                    puntoEmision: currentTrabajo.puntoEmision || pto || '001',
                    cantidadTexto: QUANTITIES[2], // Default 1 Block
                    precio: currentTrabajo.total
                };
                setItems([initialItem]);
            }
            setLoading(false);
        };
        fetchData();
    }, [trabajoId]);
    
    const handlePrint = () => {
        window.print();
    };

    const handleGeneratePdf = () => {
        if (!trabajo) return;
        const element = document.getElementById('solicitud-impresion-content');
        const opt = {
          margin:       0,
          filename:     `Solicitud-SRI-${trabajo.orden}.pdf`,
          image:        { type: 'jpeg', quality: 0.98 },
          html2canvas:  { scale: 2, useCORS: true, scrollY: 0 },
          jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
        };
        html2pdf().from(element).set(opt).save();
    };

    const handleAddItem = () => {
        if (!config) return;
        const [estab, pto] = config.numeracionPrefijo.split('-').map(s => s.trim());
        setItems([...items, {
            tamano: SIZES[1],
            tipo: DOCUMENT_TYPES[0],
            papelQuimico: true,
            establecimiento: estab || '001',
            puntoEmision: pto || '001',
            cantidadTexto: QUANTITIES[2],
            precio: 0
        }]);
    };

    const handleRemoveItem = (index: number) => {
        setItems(items.filter((_, i) => i !== index));
    };

    const updateItem = (index: number, field: keyof DocumentItem, value: any) => {
        const newItems = [...items];
        newItems[index] = { ...newItems[index], [field]: value };
        setItems(newItems);
    };

    const totalCalculado = items.reduce((sum, item) => sum + item.precio, 0);
    const abonoCalculado = trabajo ? trabajo.abono : 0;
    const saldoCalculado = totalCalculado - abonoCalculado;


    if (loading || !config) {
        return <div className="text-center p-10 font-sans">Cargando solicitud...</div>;
    }

    if (!trabajo || !cliente) {
        return <div className="text-center p-10 font-sans text-red-500">No se encontró el trabajo o el cliente.</div>;
    }
    
    const emissionDate = new Date(trabajo.fechaEntrada);

    return (
        <>
            <style>{`
                @media print {
                    @page { size: A4; margin: 0; }
                    body { margin: 0; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                    body * { visibility: hidden; }
                    #solicitud-impresion-content, #solicitud-impresion-content * { visibility: visible; }
                    #solicitud-impresion-content { position: absolute; left: 0; top: 0; width: 100%; height: auto; margin: 0; padding: 0; border: none; box-shadow: none; }
                    .no-print { display: none !important; }
                    input, select, textarea { border: none; background: transparent; appearance: none; -webkit-appearance: none; padding: 0; margin: 0; font-family: inherit; font-size: inherit; color: inherit; width: auto; resize: none; }
                    select { background-image: none; }
                }
            `}</style>
            <div className="bg-gray-100 dark:bg-gray-900 p-4 font-sans min-h-screen flex flex-col items-center">
                <div className="w-full max-w-[210mm] flex justify-end mb-6 no-print gap-4">
                    <button onClick={handleAddItem} className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white font-semibold rounded-full shadow-lg hover:bg-green-700 transition-all hover:-translate-y-0.5">
                        <AddIcon className="h-5 w-5" />
                        <span>Añadir Ítem</span>
                    </button>
                    <button onClick={handleGeneratePdf} className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white font-semibold rounded-full shadow-lg hover:bg-gray-700 transition-all hover:-translate-y-0.5">
                        <ArrowDownTrayIcon className="h-5 w-5" />
                        <span>Guardar PDF</span>
                    </button>
                     <button onClick={handlePrint} className="flex items-center gap-2 px-4 py-2 bg-brand-blue text-white font-semibold rounded-full shadow-lg hover:bg-blue-700 transition-all hover:-translate-y-0.5">
                        <PrinterIcon className="h-5 w-5" />
                        <span>Imprimir</span>
                    </button>
                </div>

                <div id="solicitud-impresion-content" className="bg-white shadow-2xl text-black relative overflow-hidden" style={{ width: '210mm', minHeight: '297mm', padding: '12mm' }}>
                    {/* Background Pattern */}
                    <div className="absolute top-0 right-0 w-64 h-64 bg-blue-50 rounded-bl-full -z-0 opacity-50"></div>
                    
                    <div className="relative z-10 h-full flex flex-col">
                        
                        {/* Header Section */}
                        <div className="flex justify-between items-start mb-10 border-b border-gray-200 pb-6">
                            <div className="w-2/3">
                                <h1 className="text-4xl font-black text-brand-blue tracking-tight mb-2">IMPRENTA CÓRDOVA</h1>
                                <div className="text-xs text-gray-500 font-medium space-y-1">
                                    <p className="flex items-center gap-2"><MapPinIcon className="w-3 h-3 text-brand-red"/> {config.emisorDireccionCompleta}</p>
                                    <p className="flex items-center gap-2"><PhoneIcon className="w-3 h-3 text-brand-red"/> {config.emisorTelefono} <span className="text-gray-300">|</span> <EnvelopeIcon className="w-3 h-3 text-brand-red"/> {config.emisorEmail}</p>
                                    <p className="font-bold text-gray-700 mt-1">RUC: {config.emisorRuc} <span className="text-brand-red mx-1">•</span> AUT SRI: {config.reciboCodAuto}</p>
                                </div>
                            </div>
                            <div className="w-1/3 flex flex-col items-end">
                                <div className="bg-brand-blue text-white px-4 py-1 rounded-t-lg text-xs font-bold uppercase tracking-widest shadow-sm">
                                    Orden de Trabajo
                                </div>
                                <div className="border-2 border-brand-blue rounded-b-lg rounded-tl-lg px-6 py-2 bg-white shadow-sm">
                                    <span className="font-mono text-3xl font-black text-red-600 tracking-widest">
                                        {String(trabajo.orden).padStart(6, '0')}
                                    </span>
                                </div>
                                <div className="mt-2 text-right">
                                    <p className="text-[10px] font-bold text-gray-400 uppercase">Fecha de Emisión</p>
                                    <p className="font-medium text-gray-800">{emissionDate.toLocaleDateString('es-EC', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center justify-center mb-8 relative">
                            <h2 className="text-center text-lg font-bold text-gray-800 uppercase tracking-[0.2em] bg-white px-4 z-10">
                                Solicitud de Autorización SRI
                            </h2>
                            <div className="absolute inset-0 flex items-center z-0">
                                <div className="w-full h-px bg-gray-200"></div>
                            </div>
                            {trabajo.esRenovacion && (
                                <div className="absolute right-0 top-1/2 -translate-y-1/2 bg-purple-100 text-purple-800 text-xs font-bold px-3 py-1 rounded-full border border-purple-200 flex items-center gap-1">
                                    <ClockIcon className="w-3 h-3" /> RENOVACIÓN
                                </div>
                            )}
                        </div>

                        {/* Client Info Card */}
                        <div className="bg-gray-50 rounded-xl p-6 border border-gray-100 mb-8 relative overflow-hidden">
                            <div className="absolute left-0 top-0 bottom-0 w-1 bg-brand-blue"></div>
                            <div className="grid grid-cols-2 gap-x-8 gap-y-4 text-sm">
                                <div className="col-span-2 sm:col-span-1">
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">Razón Social / Nombres</p>
                                    <p className="font-bold text-gray-900 text-base">{cliente.nombreComercial || cliente.nombre}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">RUC / CI</p>
                                    <p className="font-mono font-bold text-gray-800 text-base">{cliente.ruc || cliente.cedula}</p>
                                </div>
                                
                                <div className="col-span-2">
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">Actividad Económica</p>
                                    <div className="flex gap-2 items-center">
                                        <select 
                                            value={actividadEconomica} 
                                            onChange={e => setActividadEconomica(e.target.value)}
                                            className="bg-transparent outline-none w-full font-medium text-gray-800"
                                        >
                                            <option value="">Seleccione...</option>
                                            {ECONOMIC_ACTIVITIES.map(act => <option key={act} value={act}>{act}</option>)}
                                            <option value="otra">Otra (Escribir)</option>
                                        </select>
                                        {actividadEconomica === 'otra' && (
                                            <input 
                                                type="text" 
                                                value={customActividad} 
                                                onChange={e => setCustomActividad(e.target.value)} 
                                                className="bg-white border-b border-gray-300 px-2 py-0.5 w-full font-medium" 
                                                placeholder="Especifique..."
                                            />
                                        )}
                                    </div>
                                </div>

                                <div className="col-span-2 sm:col-span-1">
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">Email</p>
                                    <p className="font-medium text-gray-800">{cliente.email || 'No registrado'}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">Teléfono</p>
                                    <p className="font-medium text-gray-800">{cliente.telefono.join(' / ')}</p>
                                </div>

                                {trabajo.claveAcceso && (
                                    <div className="col-span-2 mt-2 pt-2 border-t border-gray-200">
                                        <p className="text-[10px] font-bold text-brand-blue uppercase tracking-wider mb-0.5">Clave de Acceso / Autorización</p>
                                        <p className="font-mono font-bold text-gray-900 tracking-widest">{trabajo.claveAcceso}</p>
                                    </div>
                                )}
                            </div>
                        </div>
                        
                        {/* Renovacion Banner Alert */}
                        {trabajo.esRenovacion && (
                            <div className="mb-6 bg-purple-50 border border-purple-100 p-3 rounded-lg flex items-center justify-center text-purple-800 font-bold text-xs uppercase tracking-wider shadow-sm">
                                <ShieldCheckIcon className="w-4 h-4 mr-2" />
                                Archivo Existente - Renovación de Documentos
                            </div>
                        )}

                        {/* Items Table */}
                        <div className="mb-8">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b-2 border-gray-800 text-left">
                                        <th className="py-3 px-2 font-bold text-xs uppercase tracking-wider w-[12%]">Tamaño</th>
                                        <th className="py-3 px-2 font-bold text-xs uppercase tracking-wider w-[30%]">Descripción</th>
                                        <th className="py-3 px-2 font-bold text-[10px] uppercase tracking-wider w-[10%] text-center">Químico</th>
                                        <th className="py-3 px-2 font-bold text-xs uppercase tracking-wider w-[10%] text-center">Estab.</th>
                                        <th className="py-3 px-2 font-bold text-xs uppercase tracking-wider w-[10%] text-center">Pto. Emi</th>
                                        <th className="py-3 px-2 font-bold text-xs uppercase tracking-wider w-[15%] text-center">Cant.</th>
                                        <th className="py-3 px-2 font-bold text-xs uppercase tracking-wider w-[13%] text-right">Total</th>
                                        <th className="w-[5px] no-print"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {items.map((item, index) => (
                                        <tr key={index} className="group">
                                            <td className="py-3 px-2">
                                                <select value={item.tamano} onChange={e => updateItem(index, 'tamano', e.target.value)} className="w-full font-medium text-gray-700">
                                                    {SIZES.map(s => <option key={s} value={s}>{s}</option>)}
                                                </select>
                                            </td>
                                            <td className="py-3 px-2">
                                                <select value={item.tipo} onChange={e => updateItem(index, 'tipo', e.target.value)} className="w-full font-bold text-gray-900 uppercase text-xs">
                                                    {DOCUMENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                                                </select>
                                            </td>
                                            <td className="py-3 px-2 text-center">
                                                <input type="checkbox" checked={item.papelQuimico} onChange={e => updateItem(index, 'papelQuimico', e.target.checked)} className="accent-brand-blue"/>
                                            </td>
                                            <td className="py-3 px-2 text-center">
                                                <input type="text" value={item.establecimiento} onChange={e => updateItem(index, 'establecimiento', e.target.value)} className="w-full text-center font-mono" maxLength={3}/>
                                            </td>
                                            <td className="py-3 px-2 text-center">
                                                <input type="text" value={item.puntoEmision} onChange={e => updateItem(index, 'puntoEmision', e.target.value)} className="w-full text-center font-mono" maxLength={3}/>
                                            </td>
                                            <td className="py-3 px-2 text-center">
                                                 <select value={item.cantidadTexto} onChange={e => updateItem(index, 'cantidadTexto', e.target.value)} className="w-full text-center text-xs font-medium">
                                                    {QUANTITIES.map(q => <option key={q} value={q}>{q}</option>)}
                                                </select>
                                            </td>
                                            <td className="py-3 px-2 text-right font-bold">
                                                <input type="number" value={item.precio} onChange={e => updateItem(index, 'precio', parseFloat(e.target.value) || 0)} className="w-full text-right" step="0.01"/>
                                            </td>
                                            <td className="no-print pl-2">
                                                {items.length > 1 && <button onClick={() => handleRemoveItem(index)} className="text-red-400 hover:text-red-600"><TrashIcon className="w-4 h-4" /></button>}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        
                        <div className="mb-8">
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Notas Adicionales</p>
                            <textarea className="w-full bg-gray-50 rounded-lg p-3 text-sm text-gray-700 resize-none border-none" rows={2} placeholder="Instrucciones especiales..."></textarea>
                        </div>
                        
                        {/* Footer & Totals */}
                        <div className="mt-auto grid grid-cols-12 gap-8 items-end">
                            <div className="col-span-7 text-xs text-gray-500 space-y-4">
                                <div className="p-3 bg-yellow-50 border border-yellow-100 rounded-lg text-yellow-800 text-[10px] leading-relaxed text-justify">
                                    <strong>NOTA IMPORTANTE:</strong> PASADO EL MES DE NO HABER RETIRADO SUS DOCUMENTOS NO NOS HACEMOS RESPONSABLES DE SU ABONO. SIN RECIBO PIERDE EL DERECHO A RETIRAR SU TRABAJO.
                                </div>
                                <div className="flex items-center gap-2 pt-4">
                                    <div className="h-px bg-gray-300 flex-grow"></div>
                                    <span className="font-bold text-gray-400 uppercase text-[10px]">Firma Cliente</span>
                                    <div className="h-px bg-gray-300 flex-grow"></div>
                                </div>
                                <p className="text-center text-[10px] text-gray-400">C.I.: ...................................</p>
                            </div>

                            <div className="col-span-5">
                                <div className="bg-brand-blue text-white rounded-xl p-6 shadow-lg">
                                    <div className="flex justify-between items-center mb-3 text-blue-100 text-sm">
                                        <span>Subtotal</span>
                                        <span className="font-mono font-bold text-white">{formatCurrency(totalCalculado)}</span>
                                    </div>
                                    <div className="flex justify-between items-center mb-4 text-blue-100 text-sm border-b border-blue-700 pb-3">
                                        <span>Abono</span>
                                        <span className="font-mono font-bold text-white">{formatCurrency(abonoCalculado)}</span>
                                    </div>
                                    <div className="flex justify-between items-end">
                                        <span className="text-xs font-bold uppercase tracking-widest text-yellow-400">Saldo Pendiente</span>
                                        <span className="font-mono text-3xl font-black text-white leading-none">{formatCurrency(saldoCalculado)}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default SolicitudImpresionPage;
