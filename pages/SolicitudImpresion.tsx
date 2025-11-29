
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
          margin:       0, // We control margins via CSS padding for exact A5 fit
          filename:     `Orden-SRI-${trabajo.orden}.pdf`,
          image:        { type: 'jpeg', quality: 0.98 },
          html2canvas:  { scale: 2, useCORS: true, scrollY: 0 },
          jsPDF:        { unit: 'mm', format: 'a5', orientation: 'portrait' }
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
                    @page { size: A5; margin: 0; }
                    body { margin: 0; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                    body * { visibility: hidden; }
                    #solicitud-impresion-content, #solicitud-impresion-content * { visibility: visible; }
                    #solicitud-impresion-content { 
                        position: absolute; left: 0; top: 0; 
                        width: 148mm !important; height: 210mm !important; 
                        margin: 0; padding: 8mm !important; 
                        border: none; box-shadow: none; box-sizing: border-box;
                    }
                    .no-print { display: none !important; }
                    input, select, textarea { border: none; background: transparent; appearance: none; -webkit-appearance: none; padding: 0; margin: 0; font-family: inherit; font-size: inherit; color: inherit; width: auto; resize: none; }
                    select { background-image: none; }
                }
            `}</style>
            <div className="bg-gray-100 dark:bg-gray-900 p-4 font-sans min-h-screen flex flex-col items-center">
                <div className="w-full max-w-[148mm] flex justify-end mb-6 no-print gap-4">
                    <button onClick={handleAddItem} className="flex items-center gap-2 px-3 py-1.5 bg-green-600 text-white text-sm font-semibold rounded-full shadow-lg hover:bg-green-700 transition-all hover:-translate-y-0.5">
                        <AddIcon className="h-4 w-4" />
                        <span>Ítem</span>
                    </button>
                    <button onClick={handleGeneratePdf} className="flex items-center gap-2 px-3 py-1.5 bg-gray-600 text-white text-sm font-semibold rounded-full shadow-lg hover:bg-gray-700 transition-all hover:-translate-y-0.5">
                        <ArrowDownTrayIcon className="h-4 w-4" />
                        <span>PDF A5</span>
                    </button>
                     <button onClick={handlePrint} className="flex items-center gap-2 px-3 py-1.5 bg-brand-blue text-white text-sm font-semibold rounded-full shadow-lg hover:bg-blue-700 transition-all hover:-translate-y-0.5">
                        <PrinterIcon className="h-4 w-4" />
                        <span>Imprimir</span>
                    </button>
                </div>

                {/* A5 Container: 148mm Width x 210mm Height */}
                <div id="solicitud-impresion-content" className="bg-white shadow-2xl text-black relative overflow-hidden flex flex-col" style={{ width: '148mm', minHeight: '210mm', padding: '8mm' }}>
                    
                    {/* Background Pattern */}
                    <div className="absolute top-0 right-0 w-48 h-48 bg-blue-50 rounded-bl-full -z-0 opacity-40"></div>
                    
                    <div className="relative z-10 h-full flex flex-col">
                        
                        {/* Header Section */}
                        <div className="flex justify-between items-start mb-4 border-b-2 border-brand-blue pb-2">
                            <div className="w-3/5">
                                <h1 className="text-2xl font-black text-brand-blue tracking-tighter leading-none mb-1">IMPRENTA CÓRDOVA</h1>
                                <div className="text-[9px] text-gray-600 font-medium leading-tight space-y-0.5">
                                    <p className="flex items-center gap-1"><MapPinIcon className="w-2.5 h-2.5 text-brand-red"/> {config.emisorDireccionCompleta}</p>
                                    <div className="flex gap-2">
                                        <p className="flex items-center gap-1"><PhoneIcon className="w-2.5 h-2.5 text-brand-red"/> {config.emisorTelefono}</p>
                                        <p className="flex items-center gap-1"><EnvelopeIcon className="w-2.5 h-2.5 text-brand-red"/> {config.emisorEmail}</p>
                                    </div>
                                    <p className="font-bold text-gray-800">RUC: {config.emisorRuc} • AUT SRI: {config.reciboCodAuto}</p>
                                </div>
                            </div>
                            <div className="w-2/5 flex flex-col items-end">
                                <div className="border-2 border-brand-blue rounded-lg overflow-hidden text-center shadow-sm">
                                    <div className="bg-brand-blue text-white px-4 py-0.5 text-[9px] font-bold uppercase tracking-widest">
                                        Orden de Trabajo
                                    </div>
                                    <div className="bg-white px-4 py-1">
                                        <span className="font-mono text-2xl font-black text-red-600 tracking-widest">
                                            {String(trabajo.orden).padStart(6, '0')}
                                        </span>
                                    </div>
                                </div>
                                <div className="mt-1 text-right flex flex-col">
                                    <span className="text-[8px] font-bold text-gray-400 uppercase tracking-wide">Fecha de Emisión</span>
                                    <span className="text-xs font-bold text-gray-800">{emissionDate.toLocaleDateString('es-EC', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center justify-center mb-3 relative">
                            <div className="absolute inset-0 flex items-center z-0">
                                <div className="w-full h-px bg-gray-300"></div>
                            </div>
                            <span className="bg-white px-3 z-10 text-xs font-bold text-gray-500 uppercase tracking-widest">
                                Solicitud de Autorización SRI
                            </span>
                            {trabajo.esRenovacion && (
                                <div className="absolute right-0 top-1/2 -translate-y-1/2 bg-purple-100 text-purple-700 text-[9px] font-bold px-2 py-0.5 rounded border border-purple-200 flex items-center gap-1 z-20">
                                    <ClockIcon className="w-3 h-3" /> RENOVACIÓN
                                </div>
                            )}
                        </div>

                        {/* Client Info Card */}
                        <div className="bg-gray-50 rounded-lg p-3 border border-gray-200 mb-4 relative">
                            <div className="grid grid-cols-12 gap-y-2 gap-x-4 text-xs">
                                <div className="col-span-8">
                                    <p className="text-[9px] font-bold text-gray-400 uppercase">Razón Social</p>
                                    <p className="font-bold text-gray-900 uppercase truncate">{cliente.nombreComercial || cliente.nombre}</p>
                                </div>
                                <div className="col-span-4 text-right">
                                    <p className="text-[9px] font-bold text-gray-400 uppercase">RUC / CI</p>
                                    <p className="font-mono font-bold text-gray-900">{cliente.ruc || cliente.cedula}</p>
                                </div>
                                
                                <div className="col-span-12 flex gap-4">
                                     <div className="flex-grow">
                                        <p className="text-[9px] font-bold text-gray-400 uppercase">Actividad Económica</p>
                                        <select 
                                            value={actividadEconomica} 
                                            onChange={e => setActividadEconomica(e.target.value)}
                                            className="bg-transparent border-b border-gray-300 w-full font-medium text-gray-800 text-[11px] py-0.5 focus:border-brand-blue outline-none"
                                        >
                                            <option value="">Seleccione actividad...</option>
                                            {ECONOMIC_ACTIVITIES.map(act => <option key={act} value={act}>{act}</option>)}
                                            <option value="otra">Otra especifica...</option>
                                        </select>
                                        {actividadEconomica === 'otra' && (
                                            <input 
                                                type="text" 
                                                value={customActividad} 
                                                onChange={e => setCustomActividad(e.target.value)} 
                                                className="w-full bg-white border border-gray-300 rounded px-1 py-0.5 text-[10px] mt-1" 
                                                placeholder="Especifique..."
                                            />
                                        )}
                                     </div>
                                     <div className="w-1/3 text-right">
                                        <p className="text-[9px] font-bold text-gray-400 uppercase">Teléfono</p>
                                        <p className="font-medium text-gray-800">{cliente.telefono[0]}</p>
                                     </div>
                                </div>

                                {trabajo.claveAcceso && (
                                    <div className="col-span-12 pt-1 border-t border-gray-200 mt-1">
                                        <p className="text-[9px] font-bold text-gray-400 uppercase">Clave de Acceso / Autorización</p>
                                        <p className="font-mono font-bold text-gray-800 text-[10px] break-all">{trabajo.claveAcceso}</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Items Table */}
                        <div className="flex-grow">
                            <table className="w-full text-xs border-collapse">
                                <thead>
                                    <tr className="border-b-2 border-brand-blue text-left">
                                        <th className="py-1 px-1 font-black text-[10px] uppercase text-brand-blue w-[15%]">Tamaño</th>
                                        <th className="py-1 px-1 font-black text-[10px] uppercase text-brand-blue w-[35%]">Tipo Documento</th>
                                        <th className="py-1 px-1 font-black text-[10px] uppercase text-brand-blue w-[10%] text-center">Quim.</th>
                                        <th className="py-1 px-1 font-black text-[10px] uppercase text-brand-blue w-[15%] text-center">Num. (Est-Pto)</th>
                                        <th className="py-1 px-1 font-black text-[10px] uppercase text-brand-blue w-[12%] text-center">Cant.</th>
                                        <th className="py-1 px-1 font-black text-[10px] uppercase text-brand-blue w-[13%] text-right">Total</th>
                                        <th className="w-[1px] no-print"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {items.map((item, index) => (
                                        <tr key={index}>
                                            <td className="py-2 px-1 align-top">
                                                <select value={item.tamano} onChange={e => updateItem(index, 'tamano', e.target.value)} className="w-full text-xs font-medium text-gray-700 bg-transparent">
                                                    {SIZES.map(s => <option key={s} value={s}>{s}</option>)}
                                                </select>
                                            </td>
                                            <td className="py-2 px-1 align-top">
                                                <select value={item.tipo} onChange={e => updateItem(index, 'tipo', e.target.value)} className="w-full text-[10px] font-bold text-gray-900 uppercase bg-transparent leading-tight">
                                                    {DOCUMENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                                                </select>
                                            </td>
                                            <td className="py-2 px-1 text-center align-top">
                                                <input type="checkbox" checked={item.papelQuimico} onChange={e => updateItem(index, 'papelQuimico', e.target.checked)} className="accent-brand-blue w-3.5 h-3.5"/>
                                            </td>
                                            <td className="py-2 px-1 text-center align-top">
                                                <div className="flex items-center justify-center gap-1 font-mono text-[10px]">
                                                    <input type="text" value={item.establecimiento} onChange={e => updateItem(index, 'establecimiento', e.target.value)} className="w-8 text-center border-b border-gray-300" maxLength={3}/>
                                                    <span>-</span>
                                                    <input type="text" value={item.puntoEmision} onChange={e => updateItem(index, 'puntoEmision', e.target.value)} className="w-8 text-center border-b border-gray-300" maxLength={3}/>
                                                </div>
                                            </td>
                                            <td className="py-2 px-1 align-top">
                                                 <select value={item.cantidadTexto} onChange={e => updateItem(index, 'cantidadTexto', e.target.value)} className="w-full text-[10px] text-center font-medium bg-transparent">
                                                    {QUANTITIES.map(q => <option key={q} value={q}>{q}</option>)}
                                                </select>
                                            </td>
                                            <td className="py-2 px-1 text-right font-bold align-top">
                                                <input type="number" value={item.precio} onChange={e => updateItem(index, 'precio', parseFloat(e.target.value) || 0)} className="w-full text-right bg-transparent" step="0.01"/>
                                            </td>
                                            <td className="no-print pl-1 align-top">
                                                <button onClick={() => handleRemoveItem(index)} className="text-red-400 hover:text-red-600"><TrashIcon className="w-4 h-4" /></button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        
                        <div className="mb-4 bg-yellow-50 p-2 rounded border border-yellow-200">
                            <p className="text-[10px] font-bold text-yellow-700 uppercase mb-1">Notas Internas</p>
                            <textarea className="w-full bg-transparent text-xs text-gray-700 resize-none outline-none" rows={2} placeholder="Escriba observaciones aquí..."></textarea>
                        </div>
                        
                        {/* Footer & Totals */}
                        <div className="mt-auto">
                            <div className="flex items-end justify-between gap-6">
                                <div className="w-2/3">
                                    <div className="border-t border-gray-400 pt-1">
                                        <div className="flex justify-between text-[10px] font-bold text-gray-500 uppercase">
                                            <span>Firma Cliente (Autorización)</span>
                                            <span>C.I. ____________________</span>
                                        </div>
                                    </div>
                                    <p className="text-[9px] text-gray-400 mt-2 text-justify leading-tight">
                                        Nota: Al firmar este documento, el cliente autoriza la impresión según los datos consignados y se responsabiliza por la veracidad de la información tributaria proporcionada. Pasados 30 días laborables no se aceptan reclamos ni devoluciones de anticipos.
                                    </p>
                                </div>

                                <div className="w-1/3 bg-gray-100 rounded-lg p-3 border border-gray-200 shadow-sm">
                                    <div className="flex justify-between items-center text-xs mb-1">
                                        <span className="text-gray-500 font-bold">SUBTOTAL</span>
                                        <span className="font-mono font-bold text-gray-900">{formatCurrency(totalCalculado)}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-xs mb-2 pb-2 border-b border-gray-300">
                                        <span className="text-gray-500 font-bold">ABONO</span>
                                        <span className="font-mono font-bold text-green-600">{formatCurrency(abonoCalculado)}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm font-black text-brand-blue uppercase">Saldo</span>
                                        <span className="text-xl font-black text-brand-red">{formatCurrency(saldoCalculado)}</span>
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
