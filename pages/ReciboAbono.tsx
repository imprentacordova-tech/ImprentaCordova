
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { getTrabajos, getClientes } from '../services/mockApi';
import { Trabajo, Cliente } from '../types';
import { formatCurrency } from '../utils';
import { getConfig, NotaDeVentaConfig } from '../services/configService';
import { MapPinIcon, PhoneIcon, EnvelopeIcon, PrinterIcon, CordovaLogo, ClockIcon } from '../components/Icons';

const ReciboAbonoPage: React.FC = () => {
    const { trabajoId } = useParams<{ trabajoId: string }>();
    const [trabajo, setTrabajo] = useState<Trabajo | null>(null);
    const [cliente, setCliente] = useState<Cliente | null>(null);
    const [config, setConfig] = useState<NotaDeVentaConfig | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            if (!trabajoId) return;
            setLoading(true);
            setConfig(getConfig());
            const [trabajosData, clientesData] = await Promise.all([getTrabajos(), getClientes()]);
            const currentTrabajo = trabajosData.find(t => t.id === trabajoId);
            if (currentTrabajo) {
                setTrabajo(currentTrabajo);
                const currentCliente = clientesData.find(c => c.id === currentTrabajo.clienteId);
                setCliente(currentCliente || null);
            }
            setLoading(false);
        };
        fetchData();
    }, [trabajoId]);

    const handlePrint = () => {
        window.print();
    };

    if (loading || !config) {
        return <div className="text-center p-10 font-sans text-gray-500">Generando recibo...</div>;
    }

    if (!trabajo || !cliente) {
        return <div className="text-center p-10 font-sans text-red-500">No se encontró el trabajo o el cliente.</div>;
    }
    
    const emissionDate = new Date(trabajo.fechaEntrada);

    return (
        <div className="min-h-screen bg-gray-100 flex flex-col items-center py-8 font-sans">
            <style>{`
                @media print {
                    @page { size: A6; margin: 0; }
                    body { margin: 0; background: white; }
                    .no-print { display: none !important; }
                    #recibo-container { 
                        box-shadow: none !important; 
                        border: none !important;
                        width: 100% !important;
                        height: 100vh !important;
                        margin: 0 !important;
                        padding: 5mm !important;
                    }
                }
            `}</style>

            <div className="no-print mb-6 flex gap-4">
                <button 
                    onClick={handlePrint}
                    className="flex items-center gap-2 bg-brand-blue text-white px-6 py-2 rounded-full font-bold shadow-lg hover:bg-blue-700 transition-all hover:-translate-y-0.5"
                >
                    <PrinterIcon className="w-5 h-5" /> Imprimir Recibo
                </button>
            </div>

            {/* A6 Container (105mm x 148mm) */}
            <div 
                id="recibo-container" 
                className="bg-white shadow-2xl relative overflow-hidden flex flex-col"
                style={{ width: '105mm', minHeight: '148mm', padding: '8mm' }}
            >
                {/* Background Pattern */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-bl-full z-0 opacity-50"></div>

                {/* Header */}
                <div className="relative z-10 flex flex-col mb-4">
                    <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 text-brand-blue">
                                <CordovaLogo className="w-full h-full object-contain" />
                            </div>
                            <div>
                                <h1 className="text-sm font-black text-brand-blue uppercase tracking-tight leading-none">IMPRENTA<br/>CÓRDOVA</h1>
                            </div>
                        </div>
                        <div className="text-right">
                            <div className="bg-brand-red text-white text-[9px] font-bold px-2 py-0.5 rounded shadow-sm inline-block mb-1">
                                RECIBO DE CAJA
                            </div>
                            <p className="text-sm font-mono font-black text-gray-800">#{String(trabajo.orden).padStart(6, '0')}</p>
                        </div>
                    </div>

                    <div className="text-[8px] text-gray-500 font-medium space-y-0.5 pl-1 border-l-2 border-brand-blue">
                        <p className="flex items-center gap-1"><MapPinIcon className="w-2.5 h-2.5 text-brand-red"/> {config.emisorDireccionCompleta}</p>
                        <p className="flex items-center gap-1"><PhoneIcon className="w-2.5 h-2.5 text-brand-red"/> {config.emisorTelefono}</p>
                        <p className="flex items-center gap-1"><EnvelopeIcon className="w-2.5 h-2.5 text-brand-red"/> {config.emisorEmail}</p>
                    </div>
                </div>

                {/* Info Cliente Box */}
                <div className="relative z-10 bg-gray-50 rounded-lg p-3 border border-gray-100 mb-4">
                    <div className="grid grid-cols-1 gap-1">
                        <div className="flex justify-between items-baseline border-b border-gray-200 pb-1 mb-1">
                            <span className="text-[9px] font-bold text-gray-400 uppercase">Fecha</span>
                            <span className="text-[10px] font-bold text-gray-800 flex items-center gap-1">
                                <ClockIcon className="w-3 h-3 text-gray-400"/>
                                {emissionDate.toLocaleDateString('es-EC', { year: 'numeric', month: 'short', day: '2-digit' })}
                            </span>
                        </div>
                        <div>
                            <p className="text-[8px] font-bold text-gray-400 uppercase">Recibí de</p>
                            <p className="text-[11px] font-bold text-brand-blue uppercase leading-tight">{cliente.nombre}</p>
                        </div>
                        <div className="flex gap-4 mt-1">
                            <div>
                                <p className="text-[8px] font-bold text-gray-400 uppercase">RUC / CI</p>
                                <p className="text-[10px] font-mono text-gray-700">{cliente.ruc || cliente.cedula}</p>
                            </div>
                            <div>
                                <p className="text-[8px] font-bold text-gray-400 uppercase">Teléfono</p>
                                <p className="text-[10px] font-mono text-gray-700">{cliente.telefono[0] || '-'}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Detalle */}
                <div className="relative z-10 flex-grow">
                    <p className="text-[9px] font-bold text-gray-400 uppercase mb-1 border-b border-gray-200">Por concepto de</p>
                    <div className="py-2">
                        <div className="flex justify-between items-start text-[11px]">
                            <span className="font-bold text-gray-800 w-1/6">{trabajo.cantidad} x</span>
                            <span className="text-gray-700 w-3/6 uppercase">{trabajo.subtipo}</span>
                            <span className="font-bold text-gray-900 w-2/6 text-right">{formatCurrency(trabajo.total)}</span>
                        </div>
                        {trabajo.esRenovacion && (
                            <p className="text-[9px] text-purple-600 mt-1 italic">* Renovación de archivo</p>
                        )}
                    </div>
                </div>

                {/* Footer Totals */}
                <div className="relative z-10 mt-auto">
                    <div className="bg-brand-blue text-white rounded-lg p-3 shadow-md mb-4">
                        <div className="flex justify-between items-center text-[10px] mb-1 opacity-90">
                            <span>TOTAL TRABAJO</span>
                            <span className="font-mono">{formatCurrency(trabajo.total)}</span>
                        </div>
                        <div className="flex justify-between items-center text-[11px] font-bold border-b border-blue-400/50 pb-1 mb-1">
                            <span>ABONO HOY</span>
                            <span className="font-mono text-yellow-300">{formatCurrency(trabajo.abono)}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-[10px] font-bold uppercase tracking-wider opacity-80">Saldo Pendiente</span>
                            <span className="text-sm font-black font-mono">{formatCurrency(trabajo.saldo)}</span>
                        </div>
                    </div>

                    <div className="text-center">
                        <div className="border-t border-dashed border-gray-400 w-2/3 mx-auto mb-1"></div>
                        <p className="text-[8px] font-bold text-gray-500 uppercase">Firma Cliente / Conforme</p>
                        <p className="text-[7px] text-gray-400 mt-2 italic">
                            * Sin recibo no hay reclamo. Pasado los 30 días no nos responsabilizamos por el trabajo.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ReciboAbonoPage;
