
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { getTrabajos, getClientes } from '../services/mockApi';
import { Cliente, Trabajo } from '../types';
import { PrinterIcon, AddIcon, TrashIcon, ArrowDownTrayIcon, ShieldCheckIcon, PhoneIcon, MapPinIcon, ClockIcon, BuildingStorefrontIcon } from '../components/Icons';
import { formatCurrency } from '../utils';
import { getConfig, NotaDeVentaConfig } from '../services/configService';

declare const html2pdf: any;

const DOCUMENT_TYPES = ['FACTURA', 'NOTAS DE VENTA', 'LIQUIDACION DE COMPRA', 'GUIAS DE REMISION'];
const SIZES = ['1/8 Oficio', '1/4 Oficio', '1/2 Oficio', 'Oficio', 'A4', 'A5'];
const QUANTITIES = ['1 Block (100H)', '2 Blocks', '3 Blocks', '5 Blocks', '10 Blocks'];

interface DocumentItem {
    tamano: string;
    tipo: string;
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

                const [estab, pto] = conf.numeracionPrefijo.split('-').map(s => s.trim());
                setItems([{
                    tamano: currentTrabajo.tamano === 'Varios' ? SIZES[1] : currentTrabajo.tamano,
                    tipo: DOCUMENT_TYPES.find(t => currentTrabajo.subtipo.toUpperCase().includes(t)) || DOCUMENT_TYPES[0],
                    establecimiento: currentTrabajo.establecimiento || estab || '001',
                    puntoEmision: currentTrabajo.puntoEmision || pto || '001',
                    cantidadTexto: QUANTITIES[0],
                    precio: currentTrabajo.total
                }]);
            }
            setLoading(false);
        };
        fetchData();
    }, [trabajoId]);

    if (loading || !config || !trabajo || !cliente) return <div className="p-10 text-center">Cargando...</div>;

    return (
        <div className="bg-gray-100 min-h-screen py-10 flex flex-col items-center font-sans">
            <div className="w-full max-w-[148mm] flex justify-end mb-6 no-print gap-4">
                <button onClick={() => window.print()} className="flex items-center gap-2 px-6 py-2.5 bg-brand-blue text-white font-black rounded-full shadow-lg text-xs uppercase tracking-widest">
                    <PrinterIcon className="w-4 h-4" /> Imprimir
                </button>
            </div>

            <div id="solicitud-impresion-content" className="bg-white shadow-2xl relative overflow-hidden flex flex-col border border-gray-200" style={{ width: '148mm', minHeight: '210mm', padding: '10mm' }}>
                <div className="relative z-10">
                    <div className="flex justify-between items-start mb-6 border-b-2 border-brand-blue pb-4">
                        <div className="w-2/3">
                            <h1 className="text-2xl font-black text-brand-blue tracking-tighter leading-none mb-1">IMPRENTA CÓRDOVA</h1>
                            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Servicios Gráficos Profesionales</p>
                            <div className="text-[9px] text-gray-600 mt-2 space-y-1">
                                <p className="flex items-center gap-2"><MapPinIcon className="w-3 h-3 text-brand-red"/> {config.emisorDireccionCompleta}</p>
                                <p className="flex items-center gap-2"><PhoneIcon className="w-3 h-3 text-brand-red"/> {config.emisorTelefono} | RUC: {config.emisorRuc}</p>
                            </div>
                        </div>
                        <div className="w-1/3 flex flex-col items-end">
                            <div className="bg-brand-blue text-white px-4 py-2 rounded-xl text-center shadow-lg">
                                <span className="text-[8px] font-black uppercase tracking-widest block mb-1">Orden SRI No.</span>
                                <span className="font-mono text-xl font-black">{String(trabajo.orden).padStart(6, '0')}</span>
                            </div>
                        </div>
                    </div>

                    <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200 mb-6 relative">
                        <div className="absolute top-4 right-4 bg-yellow-400 text-slate-900 text-[8px] font-black px-3 py-1 rounded-full uppercase tracking-widest">
                            {cliente.regimen}
                        </div>
                        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Información del Solicitante</h3>
                        <div className="grid grid-cols-12 gap-y-4 gap-x-6 text-[11px]">
                            <div className="col-span-8">
                                <p className="font-black text-slate-900 uppercase text-sm leading-tight">{cliente.nombre}</p>
                                <p className="text-[9px] text-brand-blue font-bold flex items-center gap-1 mt-1"><BuildingStorefrontIcon className="w-3 h-3"/> {cliente.nombreComercial || 'Sin Nombre Comercial'}</p>
                            </div>
                            <div className="col-span-4 text-right">
                                <p className="text-[9px] font-bold text-gray-400 uppercase">RUC / CI</p>
                                <p className="font-mono font-black text-slate-900">{cliente.ruc || cliente.cedula}</p>
                            </div>
                            <div className="col-span-12">
                                <p className="text-[9px] font-bold text-gray-400 uppercase mb-1">Actividad Económica Registrada</p>
                                <p className="font-bold text-slate-700 leading-tight bg-white p-2 rounded-lg border border-slate-100">{cliente.actividades || 'No especificada en ficha'}</p>
                            </div>
                            <div className="col-span-8">
                                <p className="text-[9px] font-bold text-gray-400 uppercase">Dirección Tributaria</p>
                                <p className="font-bold text-slate-700">{cliente.direccion}</p>
                            </div>
                            <div className="col-span-4 text-right">
                                <p className="text-[9px] font-bold text-gray-400 uppercase">Teléfonos talonario</p>
                                <p className="font-black text-slate-900">{cliente.telefono.join(' / ')}</p>
                            </div>
                        </div>
                    </div>

                    <table className="w-full text-[11px] border-collapse mb-8">
                        <thead>
                            <tr className="bg-brand-blue text-white uppercase text-[9px] tracking-widest">
                                <th className="py-2 px-3 text-left rounded-tl-xl">Tipo de Documento</th>
                                <th className="py-2 px-2 text-center">Tamaño</th>
                                <th className="py-2 px-2 text-center">Serie (Est-Pto)</th>
                                <th className="py-2 px-2 text-center">Cantidad</th>
                                <th className="py-2 px-3 text-right rounded-tr-xl">Total</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 border-x border-b border-gray-100 rounded-b-xl">
                            {items.map((item, idx) => (
                                <tr key={idx} className="font-bold text-slate-700">
                                    <td className="py-4 px-3 text-brand-blue uppercase">{item.tipo}</td>
                                    <td className="py-4 px-2 text-center">{item.tamano}</td>
                                    <td className="py-4 px-2 text-center font-mono">{item.establecimiento}-{item.puntoEmision}</td>
                                    <td className="py-4 px-2 text-center">{item.cantidadTexto}</td>
                                    <td className="py-4 px-3 text-right">{formatCurrency(item.precio)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    <div className="grid grid-cols-2 gap-10 mt-20">
                        <div className="text-center">
                            <div className="border-t border-gray-400 w-full mb-2"></div>
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Firma del Cliente</p>
                            <p className="text-[8px] text-slate-300 mt-1">Acepto condiciones de impresión y diseño</p>
                        </div>
                        <div className="text-center">
                            <div className="border-t border-gray-400 w-full mb-2"></div>
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Autorizado Por Imprenta</p>
                            <p className="text-[8px] text-slate-300 mt-1">Verificación SRI completa</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SolicitudImpresionPage;
