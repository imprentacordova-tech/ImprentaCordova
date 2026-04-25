import React, { useState, useEffect } from 'react';
import { Link, useLocation, useOutletContext } from 'react-router-dom';
import { logActivity } from '../services/activityLogService';
import { useData } from '../contexts/DataContext';
import { Cliente, Trabajo, TrabajoEstado, Regimen } from '../types';
import { UI_TEXT } from '../constants';
import { formatCurrency, formatDate } from '../utils';
/* Added UserPlusIcon to the imports to fix the error on line 112 */
import { CloseIcon, PhoneIcon, EnvelopeIcon, DollarIcon, ClockIcon, PencilIcon, TrashIcon, ExclamationTriangleIcon, Loader2Icon, CheckCircleIcon, SparklesIcon, MessageCircleIcon, WhatsAppIcon, UserPlusIcon } from '../components/Icons';
import { generateMarketingPromotion } from '../services/geminiService';

// --- MODAL DE MARKETING IA ---
const MarketingIAModal: React.FC<{ cliente: Cliente; trabajos: Trabajo[]; onClose: () => void }> = ({ cliente, trabajos, onClose }) => {
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState('');
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        const generate = async () => {
            const clientJobs = trabajos.filter(t => t.clienteId === cliente.id);
            const products = clientJobs.map(j => j.subtipo).slice(0, 3);
            const promo = await generateMarketingPromotion(cliente.nombre, products);
            setMessage(promo);
            setLoading(false);
        };
        generate();
    }, [cliente, trabajos]);

    const handleWhatsApp = () => {
        const tel = cliente.telefono[0].replace(/\D/g, '');
        const encoded = encodeURIComponent(message);
        window.open(`https://wa.me/593${tel.substring(tel.length - 9)}?text=${encoded}`, '_blank');
    };

    return (
        <div className="fixed inset-0 bg-brand-dark/90 backdrop-blur-xl z-[100] flex justify-center items-center p-4 animate-fade-in" onClick={onClose}>
            <div className="bg-brand-dark/50 rounded-[3rem] shadow-luxury w-full max-w-lg overflow-hidden border border-white/10 relative group" onClick={e => e.stopPropagation()}>
                <div className="absolute top-0 right-0 w-64 h-64 bg-liquid-gold/5 rounded-full blur-[80px] -mr-32 -mt-32 pointer-events-none"></div>
                
                <div className="p-8 border-b border-white/5 relative z-10">
                    <div className="flex justify-between items-center mb-4">
                        <span className="text-[10px] font-black uppercase tracking-[0.4em] opacity-80 text-liquid-gold italic">Inteligencia Artificial</span>
                        <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors"><CloseIcon className="w-6 h-6" /></button>
                    </div>
                    <h2 className="text-4xl font-black tracking-tighter uppercase leading-none text-white">Re-captar Cliente</h2>
                </div>
                
                <div className="p-8 space-y-6 relative z-10">
                    {loading ? (
                        <div className="py-12 text-center space-y-6">
                            <Loader2Icon className="animate-spin h-12 w-12 text-liquid-gold mx-auto drop-shadow-lg" />
                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] font-inter">Redactando oferta personalizada...</p>
                        </div>
                    ) : (
                        <>
                            <div className="bg-white/5 p-8 rounded-[2rem] border border-white/10 relative group shadow-sm">
                                <SparklesIcon className="absolute top-6 right-6 w-6 h-6 text-liquid-gold animate-pulse drop-shadow-md" />
                                <p className="text-lg text-slate-300 leading-relaxed font-medium italic pr-8">
                                    "{message}"
                                </p>
                            </div>
                            <div className="flex flex-col gap-4">
                                <button onClick={handleWhatsApp} className="w-full py-5 bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 font-black text-[10px] uppercase tracking-[0.3em] rounded-2xl shadow-[0_0_15px_rgba(16,185,129,0.2)] hover:bg-emerald-500/30 hover:text-emerald-300 transition-all flex items-center justify-center gap-3">
                                    <WhatsAppIcon className="w-5 h-5" /> Enviar por WhatsApp
                                </button>
                                <button onClick={() => { navigator.clipboard.writeText(message); setCopied(true); setTimeout(()=>setCopied(false), 2000); }} className="w-full py-5 bg-white/5 border border-white/10 text-white font-black text-[10px] uppercase tracking-[0.3em] rounded-2xl hover:bg-white/10 transition-all">
                                    {copied ? "¡Copiado al Portapapeles!" : "Copiar Texto"}
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

// ... Rest of component uses useData state
const ClientesPage: React.FC = () => {
    const { currentUser } = useOutletContext<{ currentUser: any }>();
    const { clientes, trabajos, loading, addCliente, updateCliente, deleteCliente } = useData();
    const [selectedClient, setSelectedClient] = useState<Cliente | null>(null);
    const [marketingClient, setMarketingClient] = useState<Cliente | null>(null);
    
    const location = useLocation();

    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const reengageId = params.get('reengage');
        if (reengageId && clientes.length > 0) {
            const client = clientes.find(cl => cl.id === reengageId);
            if (client) setMarketingClient(client);
        }
    }, [location.search, clientes]);

    const handleSaveClient = async (client: Partial<Cliente>) => {
        if (client.id) {
            await updateCliente(client.id, client);
            logActivity(currentUser.nombre, currentUser.rol || 'Operador', 'EDITAR_CLIENTE', `Cliente editado: ${client.nombre}`, 'Clientes');
        } else {
            await addCliente(client as any);
            logActivity(currentUser.nombre, currentUser.rol || 'Operador', 'CREAR_CLIENTE', `Nuevo cliente creado: ${client.nombre}`, 'Clientes');
        }
        setSelectedClient(null);
    };

    const handleDeleteClient = async (id: string, nombre: string) => {
        if (window.confirm(`¿Está seguro de eliminar al cliente ${nombre}? Esta acción no se puede deshacer.`)) {
            await deleteCliente(id);
            logActivity(currentUser.nombre, currentUser.rol || 'Operador', 'ELIMINAR_CLIENTE', `Cliente eliminado: ${nombre}`, 'Clientes');
        }
    };

    return (
        <div className="space-y-8 animate-fade-in flex flex-col h-full pb-12">
            <div className="flex flex-wrap justify-between items-end gap-4 p-6 lg:p-8 bg-white/5 backdrop-blur-xl border border-white/5 rounded-[2.5rem] lg:rounded-[3rem] shadow-luxury relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-64 h-64 bg-liquid-gold/5 rounded-full blur-[80px] -mr-32 -mt-32 pointer-events-none transition-opacity group-hover:opacity-50"></div>
                <div className="relative z-10">
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] mb-2 font-inter italic">Directorio</p>
                    <h1 className="text-3xl lg:text-4xl font-black text-white uppercase tracking-tighter leading-tight">Clientes</h1>
                </div>
                <button onClick={() => setSelectedClient({ id: '', nombre: '', email: '', telefono: [''], ruc: '', cedula: '', regimen: Regimen.GENERAL, creadoEn: new Date().toISOString() })} className="relative z-10 flex items-center justify-center gap-3 bg-liquid-gold text-brand-dark font-black py-3.5 lg:py-4 px-6 lg:px-8 rounded-xl lg:rounded-2xl shadow-gold-glow hover:bg-white hover:text-brand-dark transition-all duration-500 text-[10px] uppercase tracking-[0.2em] overflow-hidden group/btn">
                    <div className="absolute inset-0 bg-white translate-y-full group-hover/btn:translate-y-0 transition-transform duration-500 ease-out"></div>
                    <span className="relative z-10 flex items-center gap-2"><UserPlusIcon className="w-4 h-4"/> Nuevo Cliente</span>
                </button>
            </div>

            <div className="flex-grow bg-white/5 backdrop-blur-xl rounded-[2rem] lg:rounded-[2.5rem] shadow-luxury border border-white/5 overflow-hidden">
                <div className="overflow-x-auto h-full styled-scrollbar">
                    <table className="min-w-full divide-y divide-white/5">
                        <thead className="bg-brand-dark/80 sticky top-0 backdrop-blur-md z-10 border-b border-white/5">
                            <tr>
                                <th className="px-5 lg:px-8 py-4 lg:py-6 text-left text-[9px] font-black text-slate-500 uppercase tracking-[0.3em]">Cliente</th>
                                <th className="px-5 lg:px-8 py-4 lg:py-6 text-left text-[9px] font-black text-slate-500 uppercase tracking-[0.3em]">RUC / Cédula</th>
                                <th className="px-5 lg:px-8 py-4 lg:py-6 text-left text-[9px] font-black text-slate-500 uppercase tracking-[0.3em]">Régimen</th>
                                <th className="px-5 lg:px-8 py-4 lg:py-6 text-right text-[9px] font-black text-slate-500 uppercase tracking-[0.3em]">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5 bg-transparent">
                            {loading ? (
                                <tr><td colSpan={4} className="text-center py-20 text-xs font-bold text-slate-500 uppercase tracking-widest animate-pulse">Cargando clientes...</td></tr>
                            ) : clientes.map(c => (
                                <tr key={c.id} className="hover:bg-white/[0.04] transition-all duration-300 group">
                                    <td className="px-5 lg:px-8 py-4 lg:py-6">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 lg:w-12 lg:h-12 rounded-xl lg:rounded-[1rem] bg-liquid-gold/10 border border-liquid-gold/20 flex items-center justify-center font-black text-liquid-gold shadow-gold-glow transition-transform group-hover:scale-105 flex-shrink-0">{(c.nombre || '?').charAt(0)}</div>
                                            <span className="font-bold text-white uppercase tracking-tight text-sm truncate max-w-[200px] lg:max-w-xs">{c.nombre || 'SIN NOMBRE'}</span>
                                        </div>
                                    </td>
                                    <td className="px-5 lg:px-8 py-4 lg:py-6 font-mono text-sm font-bold text-slate-400">{c.ruc || c.cedula}</td>
                                    <td className="px-5 lg:px-8 py-4 lg:py-6">
                                        <span className={`px-3 lg:px-4 py-1.5 inline-flex text-[9px] leading-5 font-black uppercase tracking-[0.2em] rounded-full border ${
                                            c.regimen === Regimen.NEGOCIO_POPULAR 
                                            ? 'bg-orange-500/10 text-orange-400 border-orange-500/30 shadow-[0_0_10px_rgba(249,115,22,0.1)]' 
                                            : c.regimen === Regimen.EMPRENDEDOR
                                            ? 'bg-blue-500/10 text-blue-400 border-blue-500/30 shadow-[0_0_10px_rgba(59,130,246,0.1)]'
                                            : 'bg-slate-500/10 text-slate-400 border-slate-500/30'
                                        }`}>
                                            {c.regimen}
                                        </span>
                                    </td>
                                    <td className="px-5 lg:px-8 py-4 lg:py-6 text-right">
                                        <div className="flex justify-end gap-2 lg:gap-3">
                                            <button onClick={() => setMarketingClient(c)} className="p-2.5 lg:p-3 text-liquid-gold hover:bg-liquid-gold/10 hover:text-white rounded-xl transition-all border border-transparent hover:border-liquid-gold/20 shadow-sm hover:shadow-gold-glow" title="IA Marketing">
                                                <SparklesIcon className="w-4 h-4" />
                                            </button>
                                            <button onClick={() => setSelectedClient(c)} className="p-2.5 lg:p-3 text-slate-400 hover:bg-white/10 hover:text-white rounded-xl transition-all border border-transparent hover:border-white/10" title="Editar">
                                                <PencilIcon className="w-4 h-4" />
                                            </button>
                                            <button onClick={() => handleDeleteClient(c.id, c.nombre)} className="p-2.5 lg:p-3 text-red-400 hover:bg-red-500/10 hover:text-red-500 rounded-xl transition-all border border-transparent hover:border-red-500/10" title="Eliminar">
                                                <TrashIcon className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {marketingClient && (
                <MarketingIAModal 
                    cliente={marketingClient} 
                    trabajos={trabajos} 
                    onClose={() => setMarketingClient(null)} 
                />
            )}

            {selectedClient && (
                <ClientFormModal 
                    isOpen={!!selectedClient} 
                    onClose={() => setSelectedClient(null)} 
                    onSave={handleSaveClient} 
                    clientToEdit={selectedClient} 
                />
            )}
        </div>
    );
};

const ClientFormModal: React.FC<{ isOpen: boolean; onClose: () => void; onSave: (c: Partial<Cliente>) => void; clientToEdit: Partial<Cliente> }> = ({ isOpen, onClose, onSave, clientToEdit }) => {
    const [formData, setFormData] = useState<Partial<Cliente>>(clientToEdit);
    
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        if (name === 'telefono') setFormData({ ...formData, telefono: [value] });
        else setFormData({ ...formData, [name]: value });
    };

    return (
        <div className="fixed inset-0 bg-brand-dark/95 backdrop-blur-2xl z-[150] flex justify-center items-center p-4 animate-fade-in" onClick={onClose}>
            <div className="bg-brand-dark/50 rounded-[3rem] shadow-luxury w-full max-w-xl overflow-hidden border border-white/10" onClick={e => e.stopPropagation()}>
                <div className="p-10 border-b border-white/5 flex justify-between items-center">
                    <h2 className="text-3xl font-black text-white uppercase tracking-tighter italic">{formData.id ? 'Editar' : 'Nuevo'} <span className="text-liquid-gold">Coleccionista</span></h2>
                    <button onClick={onClose} className="text-slate-500 hover:text-white"><CloseIcon className="w-6 h-6" /></button>
                </div>
                <form onSubmit={(e) => { e.preventDefault(); onSave(formData); }} className="p-10 space-y-6">
                    <div className="space-y-4">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] block">Nombre Completo / Razón Social</label>
                        <input name="nombre" value={formData.nombre} onChange={handleChange} required className="w-full bg-white/5 border border-white/10 p-5 rounded-2xl text-white font-bold focus:ring-2 focus:ring-liquid-gold transition-all" placeholder="EJ: SANTIAGO CORDOVA" />
                    </div>
                    <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-4">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] block">RUC / Cédula</label>
                            <input name="ruc" value={formData.ruc || formData.cedula} onChange={handleChange} required className="w-full bg-white/5 border border-white/10 p-5 rounded-2xl text-white font-bold focus:ring-2 focus:ring-liquid-gold transition-all" />
                        </div>
                        <div className="space-y-4">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] block">Régimen</label>
                            <select name="regimen" value={formData.regimen} onChange={handleChange} className="w-full bg-white/5 border border-white/10 p-5 rounded-2xl text-white font-bold focus:ring-2 focus:ring-liquid-gold transition-all appearance-none">
                                <option value={Regimen.GENERAL}>Régimen General</option>
                                <option value={Regimen.NEGOCIO_POPULAR}>Negocio Popular (RIMPE)</option>
                                <option value={Regimen.EMPRENDEDOR}>Emprendedor (RIMPE)</option>
                            </select>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-4">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] block">WhatsApp / Teléfono</label>
                            <input name="telefono" value={formData.telefono?.[0]} onChange={handleChange} required className="w-full bg-white/5 border border-white/10 p-5 rounded-2xl text-white font-bold focus:ring-2 focus:ring-liquid-gold transition-all" />
                        </div>
                        <div className="space-y-4">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] block">Email (Opcional)</label>
                            <input name="email" type="email" value={formData.email} onChange={handleChange} className="w-full bg-white/5 border border-white/10 p-5 rounded-2xl text-white font-bold focus:ring-2 focus:ring-liquid-gold transition-all" />
                        </div>
                    </div>
                    <div className="pt-6 flex justify-end gap-5">
                        <button type="button" onClick={onClose} className="px-8 py-5 text-slate-500 font-black text-[10px] uppercase tracking-[0.3em] hover:text-white transition-all">Descartar</button>
                        <button type="submit" className="px-10 py-5 bg-white text-brand-dark font-black text-[10px] uppercase tracking-[0.3em] rounded-2xl shadow-luxury hover:bg-liquid-gold transition-all duration-500">Consolidar Datos</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ClientesPage;