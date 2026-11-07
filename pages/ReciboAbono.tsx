
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useData } from '../contexts/DataContext';
import { Trabajo, Cliente } from '../types';
import { formatCurrency, generateWhatsAppLink } from '../utils';
import { PrinterIcon, CordovaLogo, WhatsAppIcon, CloseIcon, ArrowLeftIcon } from '../components/Icons';

const ReciboAbonoPage: React.FC = () => {
    const { trabajoId } = useParams<{ trabajoId: string }>();
    const navigate = useNavigate();
    const { trabajos, clientes, config: cloudConfig, loading: dataLoading } = useData();
    const [trabajo, setTrabajo] = useState<Trabajo | null>(null);
    const [cliente, setCliente] = useState<Cliente | null>(null);
    // Default to Thermal for quick receipts
    const [isThermal, setIsThermal] = useState(true);
    const [isConsumidorFinal, setIsConsumidorFinal] = useState(false);

    useEffect(() => {
        if (!trabajoId || dataLoading) return;
        const currentTrabajo = trabajos.find(t => t.id === trabajoId);
        if (currentTrabajo) {
            setTrabajo(currentTrabajo);
            setCliente(clientes.find(c => c.id === currentTrabajo.clienteId) || null);
        }
    }, [trabajoId, trabajos, clientes, dataLoading]);

    const handleCerrar = () => {
        if (window.opener && window.history.length <= 1) {
            window.close();
        } else if (window.history.length > 1) {
            navigate(-1);
        } else {
            navigate('/dashboard');
        }
    };

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                handleCerrar();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

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
        return (
            <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center gap-4 text-white">
                <div className="text-xl font-black">404_RECIBO_NO_ENCONTRADO</div>
                <button onClick={handleCerrar} className="px-5 py-2 rounded-xl bg-slate-800 text-xs font-bold hover:bg-slate-700">
                    ← Regresar
                </button>
            </div>
        );
    }
    
    const emissionDate = new Date(trabajo.fechaEntrada);
    const trackingUrl = `${window.location.origin}/#/tracking?q=${trabajo.id}`;
    const qrSource = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&ecc=H&data=${encodeURIComponent(trackingUrl)}`;


    return (
        <div className="min-h-screen bg-[#F7F9FF] flex flex-col items-center py-8 font-sans">
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

            {/* Botón flotante accesible de cierre rápido */}
            <button
                onClick={handleCerrar}
                className="no-print fixed top-4 right-4 z-[999] flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-xl shadow-red-500/30 transition-all active:scale-95 border border-red-500 cursor-pointer"
                title="Cerrar vista de recibo (Esc)"
            >
                <CloseIcon className="w-4 h-4" />
                <span className="hidden sm:inline">Cerrar (Esc)</span>
            </button>

            <div className="no-print mb-6 flex flex-col gap-3 bg-white border border-slate-200 rounded-2xl p-4 shadow-sm w-full max-w-xl">
                {/* Cabecera con navegación y botón de cerrar */}
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <div className="flex items-center gap-2">
                        <button 
                            onClick={handleCerrar} 
                            className="p-1.5 hover:bg-slate-100 rounded-xl transition-all text-slate-600"
                            title="Regresar"
                        >
                            <ArrowLeftIcon className="w-4 h-4"/>
                        </button>
                        <div>
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block">Recibo de Caja / Abono</span>
                            <span className="text-xs font-bold text-slate-800">Orden #{String(trabajo.orden).padStart(6, '0')}</span>
                        </div>
                    </div>
                    <button 
                        onClick={handleCerrar} 
                        className="flex items-center gap-1.5 px-3 py-1 rounded-xl border border-red-200 bg-red-50 hover:bg-red-100 text-red-700 text-xs font-bold transition-all"
                        title="Cerrar vista (Esc)"
                    >
                        <CloseIcon className="w-3.5 h-3.5" /> Cerrar
                    </button>
                </div>

                {/* Selector de formato con etiquetas claras */}
                <div className="bg-slate-100 p-1 rounded-xl flex gap-1.5 border border-slate-200">
                    <button 
                        onClick={() => setIsThermal(true)} 
                        className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition-all flex flex-col items-center justify-center gap-0.5 ${
                            isThermal ? 'bg-white text-[#16309B] shadow-sm font-black' : 'text-slate-600 hover:text-slate-900'
                        }`}
                    >
                        <span>🧾 Ticket 80mm</span>
                        <span className="text-[10px] font-medium text-blue-700 bg-blue-100/70 px-2 py-0.5 rounded-full">Térmica POS • Rápido</span>
                    </button>
                    <button 
                        onClick={() => setIsThermal(false)} 
                        className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition-all flex flex-col items-center justify-center gap-0.5 ${
                            !isThermal ? 'bg-white text-[#16309B] shadow-sm font-black' : 'text-slate-600 hover:text-slate-900'
                        }`}
                    >
                        <span>📄 Estándar A6</span>
                        <span className="text-[10px] font-medium text-emerald-700 bg-emerald-100/70 px-2 py-0.5 rounded-full">Media Hoja • Papel Bond</span>
                    </button>
                </div>

                <div className="flex gap-2 flex-wrap justify-center pt-1">
                    <button 
                        onClick={handleWhatsAppShare}
                        className="flex items-center gap-2 bg-[#1B6E3E] hover:bg-[#155C33] text-white px-4 py-2 rounded-xl text-xs font-bold shadow-sm transition-all"
                    >
                        <WhatsAppIcon className="w-4 h-4" /> Enviar WhatsApp
                    </button>
                    <button 
                        onClick={handlePrint}
                        className="flex items-center gap-2 bg-[#16309B] hover:bg-[#0F2280] text-white px-5 py-2 rounded-xl text-xs font-bold shadow-sm transition-all"
                    >
                        <PrinterIcon className="w-4 h-4" /> Imprimir Recibo
                    </button>
                    <button 
                        onClick={() => setIsConsumidorFinal(!isConsumidorFinal)}
                        className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all border ${isConsumidorFinal ? 'bg-[#16309B] border-[#16309B] text-white' : 'bg-transparent text-slate-600 border-slate-200 hover:bg-slate-50'}`}
                    >
                        {isConsumidorFinal ? 'Restaurar Cliente' : 'Consumidor Final'}
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
                        <span className="uppercase font-bold">{isConsumidorFinal ? 'CONSUMIDOR FINAL' : cliente.nombre}</span>
                    </div>
                    <div className="flex">
                        <span className="font-bold w-12">RUC/CI:</span>
                        <span>{isConsumidorFinal ? '9999999999999' : (cliente.ruc || cliente.cedula || '9999999999')}</span>
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
                        <span className="flex-grow uppercase leading-tight pr-1">
                            <div className="font-bold">{trabajo.tipo}</div>
                            <div className="text-[7px] font-medium normal-case italic">
                                {trabajo.subtipo ? trabajo.subtipo.split(/\|\s*(?:ESPECIFICACIONES|SPECS):/i)[0].trim() : ''}
                            </div>
                        </span>
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
