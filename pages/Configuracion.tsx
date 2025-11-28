
import React, { useState, useEffect, useRef } from 'react';
import { getConfig, saveConfig, NotaDeVentaConfig } from '../services/configService';
import { getSriKeys, addSriKey, deleteSriKey } from '../services/mockApi';
import { 
    Cog8ToothIcon, CheckCircleIcon, ShieldCheckIcon, AddIcon, 
    TrashIcon, ArrowDownTrayIcon, PrinterIcon, DocumentCheckIcon, 
    ReceiptIcon, MapPinIcon, PhoneIcon, EnvelopeIcon, CordovaLogo
} from '../components/Icons';

// --- Sub-Componentes de UI ---

const InputField: React.FC<{label: string, name: string, value: string, onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void, type?: string, placeholder?: string, className?: string}> = ({ label, name, value, onChange, type = "text", placeholder, className }) => (
    <div className={className}>
        <label htmlFor={name} className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1 uppercase tracking-wide">{label}</label>
        {type === 'textarea' ? (
            <textarea
                id={name}
                name={name}
                value={value}
                onChange={onChange}
                rows={3}
                placeholder={placeholder}
                className="block w-full p-2.5 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-brand-blue focus:border-brand-blue transition-all dark:bg-gray-700 dark:border-gray-600 dark:text-white text-sm"
            />
        ) : (
            <input
                id={name}
                name={name}
                type={type}
                value={value}
                onChange={onChange}
                placeholder={placeholder}
                className="block w-full p-2.5 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-brand-blue focus:border-brand-blue transition-all dark:bg-gray-700 dark:border-gray-600 dark:text-white text-sm"
            />
        )}
    </div>
);

const SectionTab: React.FC<{ active: boolean, onClick: () => void, icon: any, label: string }> = ({ active, onClick, icon: Icon, label }) => (
    <button
        onClick={onClick}
        className={`flex items-center gap-2 px-4 py-3 text-sm font-bold rounded-lg transition-all duration-200 w-full md:w-auto justify-center md:justify-start ${
            active 
            ? 'bg-brand-blue text-white shadow-md' 
            : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 border border-transparent'
        }`}
    >
        <Icon className={`w-5 h-5 ${active ? 'text-white' : 'text-gray-400'}`} />
        <span>{label}</span>
    </button>
);

// --- Componentes de Vista Previa (Mocks Visuales) ---

const PreviewNotaVenta: React.FC<{ config: NotaDeVentaConfig }> = ({ config }) => {
    // Datos Dummy para visualización
    const dummyClient = { nombre: "CONSUMIDOR FINAL", ruc: "9999999999999" };
    const dummyJob = { fecha: new Date() };

    return (
        <div className="bg-white text-gray-900 shadow-xl mx-auto overflow-hidden text-[10px] leading-tight relative border border-gray-200" style={{ width: '100%', maxWidth: '380px', aspectRatio: '1/1.41' }}>
            <div className="p-4 h-full flex flex-col relative z-10">
                {/* Header */}
                <div className="flex justify-between gap-2 mb-3">
                    <div className="w-3/5">
                        <h1 className="font-black text-sm uppercase text-brand-blue mb-1">{config.emisorNombreComercial || "NOMBRE COMERCIAL"}</h1>
                        <p className="font-bold text-[9px] mb-1">{config.emisorRazonSocial}</p>
                        <div className="text-[8px] text-gray-500 space-y-0.5">
                            <p className="font-bold text-gray-700">{config.emisorTipoContribuyente}</p>
                            <p>{config.emisorDireccionMatriz}</p>
                            <p>{config.emisorDireccionSucursal}</p>
                        </div>
                    </div>
                    <div className="w-2/5 border border-gray-800 rounded p-2 bg-gray-50">
                        <p className="font-bold text-[9px]">R.U.C. {config.emisorRuc}</p>
                        <div className="bg-brand-blue text-white text-center text-[9px] font-bold py-0.5 my-1">NOTA DE VENTA</div>
                        <p className="font-mono text-center text-red-600 font-bold">{config.numeracionPrefijo}000012345</p>
                        <div className="text-[7px] mt-1 text-gray-500">
                            <p>Aut. SRI: {config.autorizacionSRI}</p>
                            <p>Fecha Aut: {config.fechaAutorizacion}</p>
                        </div>
                    </div>
                </div>

                {/* Cliente */}
                <div className="border-t border-b border-gray-800 py-1 mb-2 bg-blue-50/50 space-y-1">
                    <div className="flex justify-between"><span className="font-bold">Cliente:</span> <span>{dummyClient.nombre}</span></div>
                    <div className="flex justify-between"><span className="font-bold">RUC/CI:</span> <span>{dummyClient.ruc}</span></div>
                    <div className="flex justify-between"><span className="font-bold">Fecha:</span> <span>{dummyJob.fecha.toLocaleDateString()}</span></div>
                </div>

                {/* Tabla Mock */}
                <div className="flex-grow border border-gray-300 rounded mb-2">
                    <div className="bg-gray-100 font-bold flex p-1 border-b border-gray-300">
                        <div className="w-10 text-center">Cant.</div>
                        <div className="flex-grow px-1">Descripción</div>
                        <div className="w-12 text-right">Total</div>
                    </div>
                    <div className="p-1 flex border-b border-gray-100">
                        <div className="w-10 text-center">1000</div>
                        <div className="flex-grow px-1">Volantes A6 Full Color</div>
                        <div className="w-12 text-right">$30.00</div>
                    </div>
                    <div className="p-1 flex text-gray-300 text-[8px] justify-center pt-4">
                        (Espacio para detalle de ítems...)
                    </div>
                </div>

                {/* Footer */}
                <div className="mt-auto">
                    <div className="flex justify-between items-end border-t border-gray-800 pt-1 mb-2">
                        <div className="text-[7px] text-gray-500 w-1/2">
                            <p className="font-bold text-gray-700">{config.imprentaNombre}</p>
                            <p>RUC: {config.imprentaRuc} • Aut. {config.imprentaAutorizacion}</p>
                            <p>Válido hasta: {config.fechaCaducidad}</p>
                        </div>
                        <div className="w-1/3">
                            <div className="flex justify-between font-bold bg-brand-blue text-white px-2 py-0.5 rounded">
                                <span>TOTAL</span>
                                <span>$30.00</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const PreviewRecibo: React.FC<{ config: NotaDeVentaConfig }> = ({ config }) => {
    return (
        <div className="bg-white text-gray-900 shadow-xl mx-auto overflow-hidden text-[10px] leading-tight relative flex flex-col border border-gray-200" style={{ width: '100%', maxWidth: '300px', aspectRatio: '105/148' }}>
            <div className="absolute top-0 right-0 w-24 h-24 bg-blue-50 rounded-bl-full z-0 opacity-50"></div>
            <div className="p-4 relative z-10 h-full flex flex-col">
                <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-1">
                        <CordovaLogo className="w-6 h-6 text-brand-blue" />
                        <div>
                            <h1 className="text-xs font-black text-brand-blue uppercase leading-none">IMPRENTA<br/>CÓRDOVA</h1>
                        </div>
                    </div>
                    <div className="text-right">
                        <div className="bg-brand-red text-white text-[7px] font-bold px-1.5 py-0.5 rounded mb-0.5 inline-block">RECIBO DE CAJA</div>
                        <p className="font-mono font-bold">#001234</p>
                    </div>
                </div>

                <div className="text-[7px] text-gray-500 pl-1 border-l-2 border-brand-blue mb-3 space-y-0.5">
                    <p className="flex items-center gap-1"><MapPinIcon className="w-2 h-2 text-brand-red"/> {config.emisorDireccionCompleta}</p>
                    <p className="flex items-center gap-1"><PhoneIcon className="w-2 h-2 text-brand-red"/> {config.emisorTelefono}</p>
                    <p className="flex items-center gap-1"><EnvelopeIcon className="w-2 h-2 text-brand-red"/> {config.emisorEmail}</p>
                </div>

                <div className="bg-gray-50 rounded p-2 border border-gray-100 mb-2 space-y-1">
                    <div className="flex justify-between border-b border-gray-200 pb-0.5">
                        <span className="font-bold text-gray-400 uppercase text-[7px]">Fecha</span>
                        <span className="font-bold">{new Date().toLocaleDateString()}</span>
                    </div>
                    <div>
                        <p className="font-bold text-gray-400 uppercase text-[7px]">Recibí de</p>
                        <p className="font-bold text-brand-blue">CLIENTE EJEMPLO</p>
                    </div>
                </div>

                <div className="flex-grow">
                    <p className="font-bold text-gray-400 uppercase text-[7px] border-b border-gray-200 mb-1">Concepto</p>
                    <div className="flex justify-between items-start">
                        <span className="font-bold">100 x</span>
                        <span className="text-gray-600 uppercase flex-grow px-2">Tarjetas de Presentación</span>
                        <span className="font-bold">$15.00</span>
                    </div>
                </div>

                <div className="mt-auto">
                    <div className="bg-brand-blue text-white rounded p-2 shadow-sm mb-2">
                        <div className="flex justify-between text-[8px] opacity-80"><span>TOTAL</span> <span>$15.00</span></div>
                        <div className="flex justify-between text-[9px] font-bold border-b border-white/20 pb-0.5 mb-0.5"><span>ABONO</span> <span className="text-yellow-300">$10.00</span></div>
                        <div className="flex justify-between font-black"><span>SALDO</span> <span>$5.00</span></div>
                    </div>
                    <p className="text-[6px] text-center text-gray-400 italic">
                        {config.reciboServicios ? config.reciboServicios.substring(0, 100) + '...' : "Servicios de Imprenta..."}
                    </p>
                </div>
            </div>
        </div>
    );
};

// --- Página Principal ---

const ConfiguracionPage: React.FC = () => {
    const [config, setConfig] = useState<NotaDeVentaConfig>(getConfig());
    const [activeTab, setActiveTab] = useState<'nota' | 'recibo' | 'sri'>('nota');
    const [showSuccess, setShowSuccess] = useState(false);
    
    // Estados para SRI
    const [sriKeys, setSriKeys] = useState<string[]>([]);
    const [newSriKey, setNewSriKey] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        const fetchKeys = async () => {
            const keys = await getSriKeys();
            setSriKeys(keys);
        };
        fetchKeys();
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setConfig(prev => {
            const newConfig = { ...prev, [name]: value };
            return newConfig;
        });
    };

    const handleSaveAll = (e: React.FormEvent) => {
        e.preventDefault();
        saveConfig(config);
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 3000);
    };

    // Handlers para SRI
    const handleAddKey = async () => {
        if (newSriKey.trim() && !sriKeys.includes(newSriKey.trim())) {
            const updatedKeys = await addSriKey(newSriKey.trim());
            setSriKeys(updatedKeys);
            setNewSriKey('');
        }
    };
    const handleDeleteKey = async (key: string) => {
        setSriKeys(await deleteSriKey(key));
    };
    const handleImportClick = () => fileInputRef.current?.click();
    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if(!file) return;
        try {
            const text = await file.text();
            const lines = text.split('\n');
            const keyPattern = /^\d{10,49}$/;
            const newKeys = [];
            for(const line of lines) {
                const parts = line.split(',');
                for(const part of parts) {
                    const clean = part.trim().replace(/['"]/g, '');
                    if(keyPattern.test(clean)) newKeys.push(clean);
                }
            }
            if(newKeys.length > 0) {
                for(const k of newKeys) await addSriKey(k);
                setSriKeys(await getSriKeys());
                alert(`Importadas ${newKeys.length} claves.`);
            }
        } catch(err) { console.error(err); alert("Error al importar"); }
        if(e.target) e.target.value = '';
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-12">
            
            {/* Header Sticky */}
            <div className="sticky top-0 z-30 bg-white/80 dark:bg-gray-800/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex justify-between items-center shadow-sm">
                <div className="flex items-center gap-3">
                    <div className="bg-brand-blue text-white p-2 rounded-lg shadow-lg shadow-blue-500/30">
                        <Cog8ToothIcon className="h-6 w-6"/>
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-gray-900 dark:text-white leading-none">Configuración</h1>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Personaliza documentos y datos.</p>
                    </div>
                </div>
                <button 
                    onClick={handleSaveAll} 
                    className="flex items-center gap-2 px-6 py-2 bg-green-600 text-white font-bold rounded-full shadow-lg hover:bg-green-700 transition-all hover:-translate-y-0.5 active:translate-y-0"
                >
                    {showSuccess ? <CheckCircleIcon className="h-5 w-5"/> : <ArrowDownTrayIcon className="h-5 w-5"/>}
                    <span>{showSuccess ? '¡Guardado!' : 'Guardar Cambios'}</span>
                </button>
            </div>

            <div className="container mx-auto px-4 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    
                    {/* Columna Izquierda: Menú y Formularios */}
                    <div className="lg:col-span-7 space-y-6">
                        
                        {/* Tabs de Navegación */}
                        <div className="flex flex-wrap gap-2 p-1 bg-gray-200 dark:bg-gray-700 rounded-xl">
                            <SectionTab active={activeTab === 'nota'} onClick={() => setActiveTab('nota')} icon={DocumentCheckIcon} label="Nota de Venta" />
                            <SectionTab active={activeTab === 'recibo'} onClick={() => setActiveTab('recibo')} icon={ReceiptIcon} label="Recibo Caja" />
                            <SectionTab active={activeTab === 'sri'} onClick={() => setActiveTab('sri')} icon={ShieldCheckIcon} label="Base de Datos SRI" />
                        </div>

                        {/* Contenido del Formulario */}
                        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 animate-fade-in">
                            
                            {/* FORMULARIO NOTA DE VENTA */}
                            {activeTab === 'nota' && (
                                <div className="space-y-6">
                                    <div>
                                        <h3 className="text-sm font-bold text-brand-blue uppercase tracking-widest mb-4 border-b pb-2">Datos del Emisor (Encabezado)</h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                            <InputField label="Nombre Comercial" name="emisorNombreComercial" value={config.emisorNombreComercial} onChange={handleChange} placeholder="Ej: IMPRENTA CÓRDOVA" />
                                            <InputField label="Razón Social" name="emisorRazonSocial" value={config.emisorRazonSocial} onChange={handleChange} placeholder="Nombre del dueño" />
                                            <InputField label="RUC Emisor" name="emisorRuc" value={config.emisorRuc} onChange={handleChange} />
                                            <InputField label="Tipo Contribuyente" name="emisorTipoContribuyente" value={config.emisorTipoContribuyente} onChange={handleChange} placeholder="Ej: RIMPE Negocio Popular" />
                                            <InputField label="Dirección Matriz" name="emisorDireccionMatriz" value={config.emisorDireccionMatriz} onChange={handleChange} className="md:col-span-2" />
                                            <InputField label="Dirección Sucursal" name="emisorDireccionSucursal" value={config.emisorDireccionSucursal} onChange={handleChange} className="md:col-span-2" />
                                        </div>
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-bold text-brand-blue uppercase tracking-widest mb-4 border-b pb-2 mt-6">Detalles del Documento</h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                            <InputField label="Prefijo Numeración" name="numeracionPrefijo" value={config.numeracionPrefijo} onChange={handleChange} placeholder="001-001-" />
                                            <InputField label="Autorización SRI" name="autorizacionSRI" value={config.autorizacionSRI} onChange={handleChange} />
                                            <InputField label="Fecha Autorización" name="fechaAutorizacion" type="date" value={config.fechaAutorizacion} onChange={handleChange} />
                                            <InputField label="Fecha Caducidad" name="fechaCaducidad" type="date" value={config.fechaCaducidad} onChange={handleChange} />
                                        </div>
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-bold text-brand-blue uppercase tracking-widest mb-4 border-b pb-2 mt-6">Pie de Imprenta</h3>
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                                            <InputField label="Nombre Imprenta" name="imprentaNombre" value={config.imprentaNombre} onChange={handleChange} />
                                            <InputField label="RUC Imprenta" name="imprentaRuc" value={config.imprentaRuc} onChange={handleChange} />
                                            <InputField label="No. Autorización" name="imprentaAutorizacion" value={config.imprentaAutorizacion} onChange={handleChange} />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* FORMULARIO RECIBO */}
                            {activeTab === 'recibo' && (
                                <div className="space-y-6">
                                    <div>
                                        <h3 className="text-sm font-bold text-brand-blue uppercase tracking-widest mb-4 border-b pb-2">Datos Generales</h3>
                                        <div className="grid grid-cols-1 gap-5">
                                            <InputField label="Código Interno / Autorización" name="reciboCodAuto" value={config.reciboCodAuto} onChange={handleChange} placeholder="Ej: 8634" />
                                            <InputField label="Dirección Completa (Una línea)" name="emisorDireccionCompleta" value={config.emisorDireccionCompleta} onChange={handleChange} placeholder="Calle Principal y Secundaria, Ciudad" />
                                            <div className="grid grid-cols-2 gap-5">
                                                <InputField label="Email Contacto" name="emisorEmail" value={config.emisorEmail} onChange={handleChange} />
                                                <InputField label="Teléfono Contacto" name="emisorTelefono" value={config.emisorTelefono} onChange={handleChange} />
                                            </div>
                                        </div>
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-bold text-brand-blue uppercase tracking-widest mb-4 border-b pb-2 mt-6">Pie de Página</h3>
                                        <InputField 
                                            label="Lista de Servicios (Texto pequeño al final)" 
                                            name="reciboServicios" 
                                            value={config.reciboServicios} 
                                            onChange={handleChange} 
                                            type="textarea"
                                            placeholder="Describa sus servicios aquí..."
                                        />
                                        <p className="text-xs text-gray-400 mt-2">Este texto aparecerá en letra pequeña al final del recibo.</p>
                                    </div>
                                </div>
                            )}

                            {/* FORMULARIO SRI KEYS */}
                            {activeTab === 'sri' && (
                                <div className="space-y-6">
                                    <div className="bg-blue-50 dark:bg-gray-700/50 p-4 rounded-xl border border-blue-100 dark:border-gray-600 flex items-start gap-3">
                                        <ShieldCheckIcon className="w-6 h-6 text-brand-blue mt-1 flex-shrink-0" />
                                        <div>
                                            <h4 className="font-bold text-gray-900 dark:text-white">Base de Datos de Autorizaciones</h4>
                                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                                Estas claves se usarán para el autocompletado inteligente al llenar facturas electrónicas.
                                                Actualmente hay <strong>{sriKeys.length}</strong> registros.
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex gap-2">
                                        <input 
                                            type="text" 
                                            value={newSriKey} 
                                            onChange={(e) => setNewSriKey(e.target.value.replace(/\D/g, ''))} 
                                            placeholder="Ingresar clave o autorización (10-49 dígitos)" 
                                            className="flex-grow p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-brand-blue outline-none font-mono text-sm"
                                        />
                                        <button onClick={handleAddKey} disabled={!newSriKey} className="px-4 bg-brand-blue text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 font-bold transition-colors">
                                            <AddIcon className="w-5 h-5" />
                                        </button>
                                    </div>

                                    <div className="flex justify-between items-center border-b pb-2">
                                        <span className="text-xs font-bold uppercase text-gray-400">Registros Recientes</span>
                                        <div>
                                            <input type="file" ref={fileInputRef} onChange={handleFileChange} accept=".csv,.txt" className="hidden" />
                                            <button onClick={handleImportClick} className="text-xs text-brand-blue hover:underline font-bold flex items-center gap-1">
                                                <ArrowDownTrayIcon className="w-3 h-3"/> Importar CSV
                                            </button>
                                        </div>
                                    </div>

                                    <div className="bg-gray-50 dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 max-h-64 overflow-y-auto p-2">
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                            {sriKeys.slice().reverse().map((key) => (
                                                <div key={key} className="flex justify-between items-center p-2 bg-white dark:bg-gray-800 rounded border border-gray-100 dark:border-gray-700 group hover:border-brand-blue transition-colors">
                                                    <span className="font-mono text-xs text-gray-600 dark:text-gray-300 truncate select-all">{key}</span>
                                                    <button onClick={() => handleDeleteKey(key)} className="text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <TrashIcon className="w-4 h-4"/>
                                                    </button>
                                                </div>
                                            ))}
                                            {sriKeys.length === 0 && <p className="text-center text-gray-400 text-xs py-4 col-span-full">Sin datos.</p>}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Columna Derecha: Vista Previa Sticky */}
                    <div className="lg:col-span-5">
                        <div className="sticky top-28 space-y-4">
                            <div className="flex items-center justify-between">
                                <h2 className="text-lg font-bold text-gray-700 dark:text-gray-200 flex items-center gap-2">
                                    <PrinterIcon className="w-5 h-5"/> Vista Previa
                                </h2>
                                <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full font-bold">Modo Edición</span>
                            </div>
                            
                            <div className="bg-gray-200 dark:bg-gray-800 p-6 rounded-3xl flex items-center justify-center min-h-[400px] border-4 border-dashed border-gray-300 dark:border-gray-700 relative overflow-hidden group">
                                <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(#cbd5e1 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>
                                
                                <div className="transform transition-transform duration-500 hover:scale-[1.02] shadow-2xl relative z-10 w-full flex justify-center">
                                    {activeTab === 'recibo' ? (
                                        <PreviewRecibo config={config} />
                                    ) : (
                                        <PreviewNotaVenta config={config} />
                                    )}
                                </div>

                                {/* Floating Label */}
                                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/70 text-white px-3 py-1 rounded-full text-xs backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                                    Vista aproximada A5 / A6
                                </div>
                            </div>

                            <p className="text-center text-xs text-gray-400 max-w-xs mx-auto">
                                * Esta es una representación visual aproximada. El PDF final puede variar ligeramente en márgenes de impresión.
                            </p>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default ConfiguracionPage;
