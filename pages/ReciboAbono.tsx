
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useData } from '../contexts/DataContext';
import { Trabajo, Cliente } from '../types';
import { formatCurrency, generateWhatsAppLink } from '../utils';
import { MapPinIcon, PhoneIcon, PrinterIcon, CordovaLogo, ClockIcon, ReceiptIcon, WhatsAppIcon, QrCodeIcon } from '../components/Icons';

const ReciboAbonoPage: React.FC = () => {
    const { trabajoId } = useParams<{ trabajoId: string }>();
    const { trabajos, clientes, config: cloudConfig, loading: dataLoading } = useData();
    const [trabajo, setTrabajo] = useState<Trabajo | null>(null);
    const [cliente, setCliente] = useState<Cliente | null>(null);
    // Default to Thermal for quick receipts
    const [isThermal, setIsThermal] = useState(true);

    useEffect(() => {
        if (!trabajoId || dataLoading) return;
        const currentTrabajo = trabajos.find(t => t.id === trabajoId);
        if (currentTrabajo) {
            setTrabajo(currentTrabajo);
            setCliente(clientes.find(c => c.id === currentTrabajo.clienteId) || null);
        }
    }, [trabajoId, trabajos, clientes, dataLoading]);

    // Mapeo de config para los campos que la plantilla necesita
    const config = {
        emisorRuc: cloudConfig?.emisorRuc || cloudConfig?.imprentaRuc || '0702065319001',
        emisorDireccionMatriz: 'Colón y Sucre, Pasaje, El Oro',
        emisorTelefono: cloudConfig?.imprentaTelefono || '0993083943',
    };

    const handlePrint = () => {
        window.print();
    };

    const handleWhatsAppShare = () => {
        if (!trabajo || !cliente) return;
        const trackingUrl = `${window.location.origin}/#/tracking?q=${trabajo.id}`;
        const message = `🧾 *RECIBO DE CAJA - IMPRENTA CÓRDOVA*\n\nEstimado ${cliente.nombre},\nSu orden *#${trabajo.orden}* ha sido ingresada exitosamente.\n\n📝 *Detalle:* ${trabajo.subtipo}\n💰 *Total:* ${formatCurrency(trabajo.total)}\n✅ *Abono:* ${formatCurrency(trabajo.abono)}\n📉 *Saldo:* ${formatCurrency(trabajo.saldo)}\n\n🔍 *Rastree su pedido aquí:* ${trackingUrl}\n\nGracias por su preferencia.`;
        
        // Priorizar celular del cliente, sino usar el del sistema para demo
        const phone = cliente.telefono.length > 0 ? cliente.telefono[0] : '';
        if (phone) {
            window.open(generateWhatsAppLink(phone, message), '_blank');
        } else {
            alert("El cliente no tiene número de celular registrado.");
        }
    };

    if (dataLoading) {
        return <div className="text-center p-10 font-sans text-gray-500">Generando recibo...</div>;
    }

    if (!trabajo || !cliente) {
        return <div className="text-center p-10 font-sans text-red-500">No se encontró el trabajo o el cliente.</div>;
    }
    
    const emissionDate = new Date(trabajo.fechaEntrada);
    const trackingUrl = `${window.location.origin}/#/tracking?q=${trabajo.id}`;
    const qrSource = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&ecc=H&data=${encodeURIComponent(trackingUrl)}`;


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
                        padding: ${isThermal ? '0mm' : '8mm'} !important;
                        font-size: ${isThermal ? '11px' : 'inherit'} !important;
                    }
                    .thermal-cut { border-bottom: 1px dashed #000; margin-top: 10px; padding-bottom: 10px; }
                }
            `}</style>

            <div className="no-print mb-6 flex flex-col items-center gap-4">
                <div className="bg-white p-1 rounded-xl shadow-sm flex">
                    <button onClick={() => setIsThermal(true)} className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${isThermal ? 'bg-brand-blue text-white shadow-md' : 'text-gray-500'}`}>Ticket 80mm</button>
                    <button onClick={() => setIsThermal(false)} className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${!isThermal ? 'bg-brand-blue text-white shadow-md' : 'text-gray-500'}`}>Estándar A6</button>
                </div>
                <div className="flex gap-3">
                    <button 
                        onClick={handleWhatsAppShare}
                        className="flex items-center gap-2 bg-green-500 text-white px-6 py-2 rounded-full font-bold shadow-lg hover:bg-green-600 transition-all hover:-translate-y-0.5"
                    >
                        <WhatsAppIcon className="w-5 h-5" /> Enviar Digital
                    </button>
                    <button 
                        onClick={handlePrint}
                        className="flex items-center gap-2 bg-slate-900 text-white px-6 py-2 rounded-full font-bold shadow-lg hover:bg-slate-800 transition-all hover:-translate-y-0.5"
                    >
                        <PrinterIcon className="w-5 h-5" /> Imprimir
                    </button>
                </div>
            </div>

            {/* Container Dinámico */}
            <div 
                id="recibo-container" 
                className="bg-white shadow-2xl relative overflow-hidden flex flex-col"
                style={{ width: isThermal ? '72mm' : '105mm', minHeight: isThermal ? 'auto' : '148mm', padding: isThermal ? '4mm' : '8mm' }}
            >
                {/* Header */}
                <div className="flex flex-col mb-4 text-center border-b border-black pb-2">
                    <div className="flex justify-center mb-2">
                        <CordovaLogo className="h-8 w-auto grayscale contrast-200" />
                    </div>
                    <h1 className="text-sm font-black uppercase tracking-tight leading-none">IMPRENTA CÓRDOVA</h1>
                    <p className="text-[9px] font-bold mt-1 uppercase">RUC: {config.emisorRuc}</p>
                    <p className="text-[9px] font-bold uppercase">{config.emisorDireccionMatriz}</p>
                    <p className="text-[9px] font-bold">Telf: {config.emisorTelefono}</p>
                </div>

                {/* Título Recibo */}
                <div className="text-center mb-4">
                    <p className="text-xs font-black uppercase border-2 border-black inline-block px-2 py-0.5 rounded">RECIBO DE CAJA</p>
                    <p className="text-[10px] font-bold mt-1">ORDEN #{String(trabajo.orden).padStart(6, '0')}</p>
                </div>

                {/* Info Cliente */}
                <div className="mb-4 text-[10px] leading-tight">
                    <div className="flex mb-1">
                        <span className="font-bold w-12">FECHA:</span>
                        <span>{emissionDate.toLocaleDateString('es-EC')} {emissionDate.toLocaleTimeString('es-EC', {hour: '2-digit', minute:'2-digit'})}</span>
                    </div>
                    <div className="flex mb-1">
                        <span className="font-bold w-12">CLIENTE:</span>
                        <span className="uppercase font-bold">{cliente.nombre}</span>
                    </div>
                    <div className="flex">
                        <span className="font-bold w-12">RUC/CI:</span>
                        <span>{cliente.ruc || cliente.cedula}</span>
                    </div>
                </div>

                {/* Detalle Tabla */}
                <div className="border-t border-b border-dashed border-black py-2 mb-4">
                    <div className="flex text-[9px] font-black uppercase mb-1">
                        <span className="w-8 text-center">Cant</span>
                        <span className="flex-grow">Descripción</span>
                        <span className="w-12 text-right">Total</span>
                    </div>
                    <div className="flex text-[10px] items-start">
                        <span className="w-8 text-center font-bold">{trabajo.cantidad}</span>
                        <span className="flex-grow uppercase leading-tight pr-1">{trabajo.subtipo}</span>
                        <span className="w-12 text-right font-bold">{formatCurrency(trabajo.total)}</span>
                    </div>
                </div>

                {/* Totales */}
                <div className="flex flex-col items-end text-xs mb-6">
                    <div className="flex justify-between w-32">
                        <span className="font-bold">TOTAL:</span>
                        <span className="font-bold">{formatCurrency(trabajo.total)}</span>
                    </div>
                    <div className="flex justify-between w-32 mt-1">
                        <span className="font-bold">ABONO:</span>
                        <span className="font-bold">{formatCurrency(trabajo.abono)}</span>
                    </div>
                    <div className="flex justify-between w-32 mt-1 border-t border-black pt-1">
                        <span className="font-black">SALDO:</span>
                        <span className="font-black">{formatCurrency(trabajo.saldo)}</span>
                    </div>
                </div>

                {/* QR Rastreo */}
                <div className="text-center mb-4">
                    <p className="text-[9px] font-bold uppercase mb-1">Escanea para rastrear pedido</p>
                    <img src={qrSource} alt="QR Rastreo" className="w-32 h-32 mx-auto border border-black p-1 shadow-sm" />
                    <p className="text-[8px] font-mono mt-1">imprentacordova.com/tracking</p>
                </div>


                {/* Pie */}
                <div className="text-center text-[8px] font-bold uppercase border-t border-black pt-2">
                    <p>Documento sin validez tributaria</p>
                    <p>Revise su diseño antes de aprobar</p>
                    <p className="mt-2">*** Gracias por su compra ***</p>
                </div>
            </div>
        </div>
    );
};

export default ReciboAbonoPage;
