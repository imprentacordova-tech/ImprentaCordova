
import React, { useState, useEffect, useMemo } from 'react';
import { useOutletContext } from 'react-router-dom';
import { getTrabajos, getClientes, registerRetiro } from '../services/mockApi';
import { Trabajo, Cliente, TrabajoEstado, User } from '../types';
import { formatCurrency } from '../utils';
import { 
    SearchIcon, CloseIcon, DocumentCheckIcon, PrinterIcon, ArrowDownTrayIcon, 
    ShieldCheckIcon, WhatsAppIcon, Loader2Icon, ArrowRightIcon, BoxIcon, 
    ExclamationTriangleIcon, CordovaLogo
} from '../components/Icons';
import { getConfig, NotaDeVentaConfig } from '../services/configService';

declare const html2pdf: any;

const ComprobantePreviewModal: React.FC<{
    data: { trabajo: Trabajo; cliente: Cliente; pagoFinal: number; usuario: string; };
    onClose: () => void;
}> = ({ data, onClose }) => {
    const { trabajo, cliente, pagoFinal, usuario } = data;
    const [config, setConfig] = useState<NotaDeVentaConfig | null>(null);

    useEffect(() => { setConfig(getConfig()); }, []);

    const handlePrint = () => window.print();

    const handleWhatsAppNotify = () => {
        const phone = cliente.telefono[0].replace(/\D/g, '');
        const msg = encodeURIComponent(`¡Hola ${cliente.nombre}! Tu pedido de "${trabajo.subtipo}" ya está listo en Imprenta Córdova. ¡Te esperamos en Pasaje!`);
        window.open(`https://wa.me/593${phone.substring(phone.length - 9)}?text=${msg}`, '_blank');
    };

    if (!config) return null;

    return (
        <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-md z-[100] flex justify-center items-center p-4 animate-fade-in">
            <div className="bg-white dark:bg-gray-900 w-full max-w-4xl h-[95vh] rounded-[3rem] shadow-3xl flex flex-col overflow-hidden border border-white/10">
                <div className="p-8 flex justify-between items-center bg-gray-50 dark:bg-slate-900/50 border-b dark:border-gray-800 no-print">
                    <div>
                        <h3 className="text-2xl font-black text-brand-blue dark:text-white uppercase tracking-tighter flex items-center gap-3">
                            <ShieldCheckIcon className="w-7 h-7 text-emerald-500"/> Registro Exitoso
                        </h3>
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.3em] mt-1">Trabajo entregado y cobrado</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <button onClick={handleWhatsAppNotify} className="flex items-center gap-3 px-6 py-3 bg-green-500 text-white font-black text-[10px] uppercase tracking-widest rounded-xl hover:bg-green-600 transition-all shadow-xl">
                            <WhatsAppIcon className="h-4 w-4" /> Notificar WhatsApp
                        </button>
                        <button onClick={handlePrint} className="flex items-center gap-3 px-6 py-3 bg-brand-blue text-white font-black text-[10px] uppercase tracking-widest rounded-xl hover:bg-slate-950 transition-all shadow-xl">
                            <PrinterIcon className="h-4 w-4" /> Imprimir
                        </button>
                        <button onClick={onClose} className="p-3 hover:bg-white dark:hover:bg-gray-800 rounded-full transition-all text-slate-400"><CloseIcon className="w-6 h-6" /></button>
                    </div>
                </div>
                <div className="flex-grow p-12 bg-slate-100 overflow-y-auto custom-scrollbar flex justify-center">
                    <div id="comprobante-preview-content" className="bg-white shadow-xl p-8" style={{ width: '148mm', minHeight: '210mm' }}>
                        <div className="text-center mb-8"><CordovaLogo className="h-16 mx-auto mb-4" /><h2 className="text-xl font-black uppercase">Nota de Entrega</h2></div>
                        <div className="grid grid-cols-2 gap-8 mb-8 border-b pb-8">
                            <div><p className="text-[10px] font-black text-slate-400 uppercase">Cliente</p><p className="font-black uppercase text-sm">{cliente.nombre}</p><p className="text-xs font-mono">{cliente.ruc || cliente.cedula}</p></div>
                            <div className="text-right"><p className="text-[10px] font-black text-slate-400 uppercase">Orden Nº</p><p className="text-2xl font-mono font-black text-brand-red">{String(trabajo.orden).padStart(6, '0')}</p></div>
                        </div>
                        <table className="w-full mb-8">
                            <thead className="bg-slate-50"><tr className="text-[10px] font-black text-slate-400 uppercase"><th className="py-2 text-left">Descripción</th><th className="py-2 text-right">Total</th></tr></thead>
                            <tbody className="divide-y"><tr><td className="py-4 text-sm font-bold uppercase">{trabajo.subtipo}</td><td className="py-4 text-right font-black">{formatCurrency(trabajo.total)}</td></tr></tbody>
                        </table>
                        <div className="flex justify-end pt-8 border-t"><div className="text-right"><p className="text-[10px] font-black text-slate-400 uppercase">Total Cancelado</p><p className="text-4xl font-black text-brand-blue tracking-tighter">{formatCurrency(trabajo.total)}</p></div></div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const RetiroModal: React.FC<{ trabajo: Trabajo; cliente: Cliente; onClose: () => void; onConfirm: (pagoFinal: number) => void; }> = ({ trabajo, cliente, onClose, onConfirm }) => (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-[100] flex justify-center items-center p-4 animate-fade-in" onClick={onClose}>
        <div className="bg-white dark:bg-gray-900 rounded-[2.5rem] shadow-3xl w-full max-w-lg overflow-hidden border border-white/10" onClick={e => e.stopPropagation()}>
             <div className="bg-brand-blue p-8 text-white flex justify-between items-center">
                <div><h2 className="text-2xl font-black uppercase tracking-tighter italic">Procesar Entrega</h2><p className="text-blue-200 text-[10px] font-black mt-1">Orden #{trabajo.orden}</p></div>
                <button onClick={onClose}><CloseIcon className="w-6 h-6"/></button>
            </div>
            <div className="p-8 space-y-6">
                <div className="flex items-center gap-4"><div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center font-black text-xl text-brand-blue">{cliente.nombre.charAt(0)}</div><div><h3 className="font-black uppercase text-slate-900 dark:text-white leading-none mb-1">{cliente.nombre}</h3><p className="text-[10px] font-bold text-slate-400 uppercase">{trabajo.subtipo}</p></div></div>
                <div className="grid grid-cols-2 gap-4"><div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl text-center"><span className="text-[9px] font-black text-slate-400 uppercase block mb-1">Abonado</span><span className="text-xl font-black text-emerald-500">{formatCurrency(trabajo.abono)}</span></div><div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-2xl text-center border border-red-100"><span className="text-[9px] font-black text-slate-400 uppercase block mb-1">Saldo a Cobrar</span><span className="text-xl font-black text-brand-red">{formatCurrency(trabajo.saldo)}</span></div></div>
                {trabajo.saldo > 0 && <div className="p-4 bg-amber-50 rounded-2xl flex items-center gap-3 border border-amber-100"><ExclamationTriangleIcon className="w-5 h-5 text-amber-600"/><p className="text-[10px] font-bold text-amber-800 uppercase leading-tight">IMPORTANTE: Verifique que el cliente cancele el saldo antes de la entrega física.</p></div>}
                <button onClick={() => onConfirm(trabajo.saldo)} className="w-full py-5 bg-brand-red text-white font-black text-xs uppercase tracking-[0.2em] rounded-2xl shadow-xl hover:bg-slate-950 transition-all flex items-center justify-center gap-3"><DocumentCheckIcon className="w-5 h-5"/> {trabajo.saldo > 0 ? 'Cobrar Saldo y Entregar' : 'Confirmar Entrega'}</button>
            </div>
        </div>
    </div>
);

const RetirosPage: React.FC = () => {
    const { currentUser } = useOutletContext<{ currentUser: User }>();
    const [allTrabajos, setAllTrabajos] = useState<Trabajo[]>([]);
    const [clientes, setClientes] = useState<Cliente[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedTrabajo, setSelectedTrabajo] = useState<Trabajo | null>(null);
    const [comprobanteData, setComprobanteData] = useState<any>(null);

    const fetchData = async () => {
        setLoading(true);
        const [t, c] = await Promise.all([getTrabajos(), getClientes()]);
        setAllTrabajos(t);
        setClientes(c);
        setLoading(false);
    };

    useEffect(() => { fetchData(); }, []);

    const filtered = useMemo(() => {
        const lower = searchTerm.toLowerCase();
        return allTrabajos.filter(t => t.estado === TrabajoEstado.VITRINA).filter(t => {
            const c = clientes.find(cl => cl.id === t.clienteId);
            return searchTerm === '' || String(t.orden).includes(lower) || c?.nombre.toLowerCase().includes(lower);
        });
    }, [allTrabajos, clientes, searchTerm]);

    const handleConfirm = async (pagoFinal: number) => {
        if (!selectedTrabajo) return;
        const updated = await registerRetiro(selectedTrabajo.id, pagoFinal, currentUser.nombre);
        const c = clientes.find(cl => cl.id === selectedTrabajo.clienteId);
        if (c) setComprobanteData({ trabajo: updated, cliente: c, pagoFinal, usuario: currentUser.nombre });
        setSelectedTrabajo(null);
    };

    // Fix: Added handleClosePreview to resolve "Cannot find name 'handleClosePreview'" error on line 149.
    const handleClosePreview = () => {
        setComprobanteData(null);
        fetchData();
    };

    return (
        <div className="space-y-10 animate-fade-in pb-20">
            <style>{`@media print { body * { visibility: hidden; } #comprobante-preview-content, #comprobante-preview-content * { visibility: visible; } #comprobante-preview-content { position: absolute; left: 0; top: 0; width: 100%; border: none; } .no-print { display: none !important; } }`}</style>
            <div className="flex justify-between items-center">
                <div><h1 className="text-4xl font-black text-slate-900 dark:text-white uppercase tracking-tighter italic">Vitrina de <span className="text-brand-red">Salidas</span></h1><p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Gestión de entregas y arqueo de caja</p></div>
                <div className="relative w-80"><SearchIcon className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300" /><input type="text" placeholder="Buscar por orden o cliente..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full pl-12 pr-6 py-4 bg-white dark:bg-slate-900 border-none rounded-[2rem] shadow-xl text-sm font-bold focus:ring-4 focus:ring-brand-blue/10 outline-none transition-all dark:text-white" /></div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {loading ? <div className="col-span-full py-20 text-center"><Loader2Icon className="animate-spin w-10 h-10 text-brand-blue mx-auto" /></div> : filtered.length > 0 ? filtered.map(t => {
                    const c = clientes.find(cl => cl.id === t.clienteId);
                    return (
                        <div key={t.id} className="bg-white dark:bg-gray-800 rounded-[3rem] p-8 shadow-xl border border-slate-100 dark:border-white/5 hover:-translate-y-2 transition-all duration-500 flex flex-col justify-between">
                            <div><div className="flex justify-between mb-6"><span className="text-[10px] font-black text-slate-400 bg-slate-50 px-3 py-1 rounded-full border">ORDEN #{t.orden}</span>{t.prioridad === 'Urgente' && <span className="text-[8px] font-black text-white bg-brand-red px-2 py-0.5 rounded-md animate-pulse">URGENTE</span>}</div><h3 className="text-xl font-black text-slate-900 dark:text-white uppercase truncate">{c?.nombre}</h3><p className="text-xs text-slate-500 font-bold uppercase mt-1 leading-relaxed">{t.subtipo}</p><div className="mt-8 p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl flex justify-between items-center"><span className="text-[10px] font-black text-slate-400 uppercase">Saldo Pendiente</span><span className={`text-xl font-black ${t.saldo > 0 ? 'text-brand-red' : 'text-emerald-500'}`}>{formatCurrency(t.saldo)}</span></div></div>
                            <button onClick={() => setSelectedTrabajo(t)} className="mt-8 w-full py-4 bg-brand-blue text-white font-black text-[10px] uppercase tracking-widest rounded-2xl shadow-xl hover:bg-slate-950 transition-all flex items-center justify-center gap-3">Entregar Trabajo <ArrowRightIcon className="w-4 h-4"/></button>
                        </div>
                    );
                }) : (
                    <div className="col-span-full py-32 bg-white dark:bg-slate-900/50 rounded-[4rem] border-2 border-dashed border-slate-200 text-center"><BoxIcon className="w-16 h-16 text-slate-300 mx-auto mb-6" /><h3 className="text-xl font-black text-slate-400 uppercase tracking-tighter">Sin productos listos</h3></div>
                )}
            </div>

            {selectedTrabajo && <RetiroModal trabajo={selectedTrabajo} cliente={clientes.find(c => c.id === selectedTrabajo.clienteId)!} onClose={() => setSelectedTrabajo(null)} onConfirm={handleConfirm} />}
            {comprobanteData && <ComprobantePreviewModal data={comprobanteData} onClose={handleClosePreview} />}
        </div>
    );
};

export default RetirosPage;
