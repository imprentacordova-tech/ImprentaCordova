
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { getTrabajos, getClientes } from '../services/mockApi';
import { Trabajo, Cliente } from '../types';
import { formatCurrency } from '../utils';
import { getConfig, NotaDeVentaConfig } from '../services/configService';
import { MapPinIcon, PhoneIcon, EnvelopeIcon, PrinterIcon, CordovaLogo, ClockIcon, ReceiptIcon } from '../components/Icons';

const ReciboAbonoPage: React.FC = () => {
    const { trabajoId } = useParams<{ trabajoId: string }>();
    const [trabajo, setTrabajo] = useState<Trabajo | null>(null);
    const [cliente, setCliente] = useState<Cliente | null>(null);
    const [config, setConfig] = useState<NotaDeVentaConfig | null>(null);
    const [loading, setLoading] = useState(true);
    const [isThermal, setIsThermal] = useState(false);

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
                    @page { size: ${isThermal ? '80mm auto' : 'A6'}; margin: 0; }
                    body { margin: 0; background: white; }
                    .no-print { display: none !important; }
                    #recibo-container { 
                        box-shadow: none !important; 
                        border: none !important;
                        width: ${isThermal ? '72mm' : '105mm'} !important;
                        min-height: ${isThermal ? 'auto' : '148mm'} !important;
                        margin: 0 auto !important;
                        padding: ${isThermal ? '2mm' : '8mm'} !important;
                        font-size: ${isThermal ? '10px' : 'inherit'} !important;
                    }
                    ${isThermal ? '.thermal-hide { display: none; }' : ''}
                }
            `}</style>

            <div className="no-print mb-6 flex flex-col items-center gap-4">
                <div className="bg-white p-1 rounded-xl shadow-sm flex">
                    <button onClick={() => setIsThermal(false)} className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${!isThermal ? 'bg-brand-blue text-white shadow-md' : 'text-gray-500'}`}>Estándar A6</button>
                    <button onClick={() => setIsThermal(true)} className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${isThermal ? 'bg-brand-blue text-white shadow-md' : 'text-gray-500'}`}>Ticket 80mm</button>
                </div>
                <button 
                    onClick={handlePrint}
                    className="flex items-center gap-2 bg-slate-900 text-white px-6 py-2 rounded-full font-bold shadow-lg hover:bg-slate-800 transition-all hover:-translate-y-0.5"
                >
                    <PrinterIcon className="w-5 h-5" /> Imprimir
                </button>
            </div>

            {/* Container Dinámico */}
            <div 
                id="recibo-container" 
                className="bg-white shadow-2xl relative overflow-hidden flex flex-col"
                style={{ width: isThermal ? '72mm' : '105mm', minHeight: isThermal ? 'auto' : '148mm', padding: isThermal ? '2mm' : '8mm' }}
            >
                {/* Background Pattern (Only A6) */}
                {!isThermal && <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-bl-full z-0 opacity-50"></div>}

                {/* Header */}
                <div className="relative z-10 flex flex-col mb-4 text-center">
                    <h1 className="text-lg font-black text-brand-blue uppercase tracking-tight leading-none">IMPRENTA CÓRDOVA</h1>
                    <p className="text-[9px] text-gray-500 font-medium mt-1">{config.emisorDireccionMatriz}</p>
                    <p className="text-[9px] text-gray-500 font-medium">Telf: {config.emisorTelefono}</p>
                    
                    <div className="mt-3 border-b border-dashed border-gray-300 pb-2">
                        <span className="bg-slate-900 text-white text-[9px] font-bold px-2 py-0.5 rounded shadow-sm">RECIBO DE CAJA</span>
                        <p className="text-sm font-mono font-black text-gray-800 mt-1">ORDEN #{String(trabajo.orden).padStart(6, '0')}</p>
                        <p className="text-[9px] text-gray-500">{emissionDate.toLocaleString('es-EC')}</p>
                    </div>
                </div>

                {/* Info Cliente */}
                <div className="relative z-10 mb-4 text-[10px]">
                    <div className="flex justify-between">
                        <span className="font-bold text-gray-500 uppercase">Cliente:</span>
                    </div>
                    <p className="font-bold text-slate-900 uppercase truncate">{cliente.nombre}</p>
                    <p className="font-mono text-gray-600">{cliente.ruc || cliente.cedula}</p>
                </div>

                {/* Detalle */}
                <div className="relative z-10 flex-grow border-t border-b border-dashed border-gray-300 py-2 mb-4">
                    <div className="flex justify-between items-start text-[10px] mb-1 font-bold text-gray-400 uppercase">
                        <span>Cant.</span>
                        <span>Descripción</span>
                        <span>Total</span>
                    </div>
                    <div className="flex justify-between items-start text-[11px]">
                        <span className="font-bold text-gray-800 w-[10%] text-center">{trabajo.cantidad}</span>
                        <span className="text-gray-700 w-[60%] uppercase leading-tight">{trabajo.subtipo}</span>
                        <span className="font-bold text-gray-900 w-[20%] text-right">{formatCurrency(trabajo.total)}</span>
                    </div>
                </div>

                {/* Footer Totals */}
                <div className="relative z-10 mt-auto">
                    <div className="flex justify-between items-center text-[10px] mb-1">
                        <span className="uppercase font-bold text-gray-500">Total Orden</span>
                        <span className="font-mono font-bold">{formatCurrency(trabajo.total)}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm font-black border-t border-gray-200 pt-1 mb-1">
                        <span className="uppercase text-brand-blue">Abono Hoy</span>
                        <span className="font-mono">{formatCurrency(trabajo.abono)}</span>
                    </div>
                    <div className="flex justify-between items-center text-[10px]">
                        <span className="uppercase font-bold text-gray-500">Saldo Pendiente</span>
                        <span className="font-mono font-bold text-brand-red">{formatCurrency(trabajo.saldo)}</span>
                    </div>

                    <div className="text-center mt-6">
                        <p className="text-[8px] text-gray-400 italic">
                            * Documento interno. No válido como factura. <br/>
                            Conserve este ticket para retirar su trabajo.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ReciboAbonoPage;
