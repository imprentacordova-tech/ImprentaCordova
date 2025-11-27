
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { getTrabajos, getClientes } from '../services/mockApi';
import { Trabajo, Cliente } from '../types';
import { formatCurrency, numeroALetras } from '../utils';
import { getConfig, NotaDeVentaConfig } from '../services/configService';

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

    useEffect(() => {
        if (!loading && trabajo && cliente && config) {
            setTimeout(() => window.print(), 500);
        }
    }, [loading, trabajo, cliente, config]);

    if (loading || !config) {
        return <div className="text-center p-10 font-sans">Cargando recibo...</div>;
    }

    if (!trabajo || !cliente) {
        return <div className="text-center p-10 font-sans text-red-500">No se encontró el trabajo o el cliente.</div>;
    }
    
    const emissionDate = new Date(trabajo.fechaEntrada);

    return (
        <>
            <style>{`
                @media print {
                    @page { size: 80mm auto; margin: 0; }
                    body { width: 80mm; margin: 0 auto; }
                }
            `}</style>
            <div className="bg-gray-100 flex items-start justify-center min-h-screen p-4 font-sans">
                <div id="recibo-imprimible" className="bg-white shadow-lg p-4" style={{ width: '80mm', fontFamily: "'Courier New', Courier, monospace" }}>
                    <div className="text-center border-b border-dashed border-black pb-4 mb-4">
                        <h1 className="text-xl font-bold uppercase leading-tight mb-1">Imprenta Córdova</h1>
                        <p className="text-[10px]">{config.emisorDireccionCompleta}</p>
                        <p className="text-[10px]">RUC: {config.emisorRuc}</p>
                        <p className="text-[10px]">Telf: {config.emisorTelefono}</p>
                    </div>

                    <div className="mb-4 text-xs">
                        <div className="flex justify-between mb-1">
                            <span>Fecha:</span>
                            <span>{emissionDate.toLocaleDateString('es-EC')}</span>
                        </div>
                        <div className="flex justify-between mb-1">
                            <span>Hora:</span>
                            <span>{new Date().toLocaleTimeString('es-EC', {hour: '2-digit', minute:'2-digit'})}</span>
                        </div>
                        <div className="flex justify-between font-bold">
                            <span>Orden #:</span>
                            <span>{String(trabajo.orden).padStart(6, '0')}</span>
                        </div>
                    </div>

                    <div className="border-b border-dashed border-black pb-4 mb-4 text-xs">
                        <p className="mb-1"><span className="font-bold">Cliente:</span> {cliente.nombre}</p>
                        <p><span className="font-bold">CI/RUC:</span> {cliente.ruc || cliente.cedula}</p>
                    </div>

                    <div className="mb-4 text-xs">
                        <p className="font-bold mb-1">DETALLE DEL TRABAJO:</p>
                        <p className="mb-2">{trabajo.cantidad} x {trabajo.subtipo}</p>
                        
                        <div className="flex justify-between font-bold text-sm mt-4 pt-2 border-t border-black">
                            <span>TOTAL:</span>
                            <span>{formatCurrency(trabajo.total)}</span>
                        </div>
                        <div className="flex justify-between mt-1">
                            <span>Abono Recibido:</span>
                            <span>{formatCurrency(trabajo.abono)}</span>
                        </div>
                        <div className="flex justify-between font-bold mt-2">
                            <span>SALDO PENDIENTE:</span>
                            <span>{formatCurrency(trabajo.saldo)}</span>
                        </div>
                    </div>

                    <div className="text-[10px] text-center border-t border-dashed border-black pt-4 mt-6">
                        <p className="mb-4">Firma Cliente</p>
                        <p className="font-bold">¡GRACIAS POR SU PREFERENCIA!</p>
                        <p className="mt-1">Nota: Sin recibo no hay reclamo.</p>
                    </div>
                </div>
            </div>
        </>
    );
};

export default ReciboAbonoPage;
