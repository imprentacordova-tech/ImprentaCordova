import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Cliente, Regimen } from '../../types';
import { useData } from '../../contexts/DataContext';
import { sriLookupService, SriRucData } from '../../services/sriLookupService';
import { extractDataFromSriPdf } from '../../services/pdfExtraction';
import { validarIdentificacionEC } from '../../utils';
import {
    SearchIcon, UserIcon, ShieldCheckIcon, CloseIcon, Loader2Icon,
    CheckCircleIcon, SparklesIcon, ArrowRightIcon, PhoneIcon,
    UploadIcon, DocumentTextIcon, IdentificationIcon, MapPinIcon
} from '../Icons';

export const SriIdentityFlow: React.FC<{
    onComplete: (cliente: Cliente) => void;
    onCancel: () => void;
}> = ({ onComplete, onCancel }) => {
    const { clientes, addCliente } = useData();
    
    const [rucSearch, setRucSearch] = useState('');
    const [isSearching, setIsSearching] = useState(false);
    const [searchStatus, setSearchStatus] = useState<'idle' | 'searching' | 'found_local' | 'found_sri' | 'not_found'>('idle');
    const [error, setError] = useState('');

    // Form state
    const [formData, setFormData] = useState({
        nombre: '',
        nombreComercial: '',
        email: '',
        telefono: '',
        direccion: 'Pasaje, El Oro',
        regimen: Regimen.GENERAL,
        establecimientoPredeterminado: '001',
        puntoEmisionPredeterminado: '001',
    });
    
    // Si ya es un cliente existente en nuestra BD, lo guardamos aquí
    const [existingCliente, setExistingCliente] = useState<Cliente | null>(null);

    const [isScanningPdf, setIsScanningPdf] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleSearch = async (ruc: string) => {
        if (!ruc || ruc.length < 10) return;
        
        const isRuc = ruc.length === 13;
        if (isRuc && !validarIdentificacionEC(ruc)) {
            setError('El RUC ingresado no es válido.');
            setSearchStatus('idle');
            return;
        }

        setIsSearching(true);
        setError('');
        setSearchStatus('searching');
        setExistingCliente(null);
        
        try {
            // Nivel 1: Buscar en clientes locales
            const localClient = clientes.find(c => c.ruc === ruc || c.cedula === ruc);
            if (localClient) {
                setExistingCliente(localClient);
                setFormData({
                    nombre: localClient.nombre,
                    nombreComercial: localClient.nombreComercial || '',
                    email: localClient.email || '',
                    telefono: localClient.telefono?.[0] || '',
                    direccion: localClient.direccion || 'Pasaje, El Oro',
                    regimen: localClient.regimen || Regimen.GENERAL,
                    establecimientoPredeterminado: localClient.establecimientoPredeterminado || '001',
                    puntoEmisionPredeterminado: localClient.puntoEmisionPredeterminado || '001',
                });
                setSearchStatus('found_local');
                return;
            }

            // Nivel 2: Buscar en Padrón SRI
            if (isRuc) {
                const padronData = await sriLookupService.lookupByRuc(ruc);
                if (padronData) {
                    setFormData(prev => ({
                        ...prev,
                        nombre: padronData.razon_social,
                        direccion: padronData.direccion || `${padronData.parroquia}, ${padronData.canton}, ${padronData.provincia || 'EL ORO'}`,
                        regimen: (Object.values(Regimen).includes(padronData.regimen as Regimen) ? padronData.regimen as Regimen : Regimen.GENERAL),
                    }));
                    setSearchStatus('found_sri');
                    return;
                }
            }

            // Nivel 3: No encontrado
            setSearchStatus('not_found');
            
        } catch (err) {
            console.error(err);
            setError('Error al conectar con la base de datos.');
            setSearchStatus('not_found');
        } finally {
            setIsSearching(false);
        }
    };

    // Auto-buscar cuando llegue a 13
    useEffect(() => {
        if (rucSearch.length === 13 && /^\d+$/.test(rucSearch)) {
            handleSearch(rucSearch);
        } else if (rucSearch.length < 10) {
            setSearchStatus('idle');
            setError('');
        }
    }, [rucSearch]);

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setIsScanningPdf(true);
        try {
            const result = await extractDataFromSriPdf(file);
            if (result) {
                setRucSearch(result.ruc);
                setFormData(prev => ({
                    ...prev,
                    nombre: result.apellidos_nombres,
                    direccion: result.direccion,
                    regimen: result.regimen,
                    email: result.contacto?.email || '',
                    telefono: result.contacto?.celular || '',
                }));
                setSearchStatus('found_sri'); // Tratamos el PDF como fuente SRI confiable
            } else {
                setError('No se pudo extraer información del PDF.');
            }
        } catch (err: any) {
            setError(err.message || 'Error al procesar el PDF');
        } finally {
            setIsScanningPdf(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const handleSubmit = async () => {
        if (existingCliente) {
            onComplete(existingCliente);
            return;
        }

        if (!formData.nombre.trim()) {
            setError('El nombre / razón social es requerido.');
            return;
        }

        setIsSearching(true);
        try {
            const newClient = await addCliente({
                nombre: formData.nombre,
                nombreComercial: formData.nombreComercial,
                cedula: rucSearch.length === 10 ? rucSearch : '',
                ruc: rucSearch.length === 13 ? rucSearch : '',
                email: formData.email,
                telefono: formData.telefono ? [formData.telefono] : [],
                direccion: formData.direccion,
                regimen: formData.regimen,
                establecimientoPredeterminado: formData.establecimientoPredeterminado,
                puntoEmisionPredeterminado: formData.puntoEmisionPredeterminado
            });
            onComplete(newClient);
        } catch (err: any) {
            setError(err.message || 'Error al guardar el cliente');
            setIsSearching(false);
        }
    };

    return (
        <div className="w-full space-y-4 md:space-y-8 animate-fade-in px-1">
            {/* Buscador Principal */}
            <div className="relative group">
                <div className={`absolute inset-0 blur-2xl rounded-full opacity-0 group-focus-within:opacity-100 transition-opacity pointer-events-none ${searchStatus === 'found_local' ? 'bg-liquid-gold/20' : searchStatus === 'found_sri' ? 'bg-white/10' : 'bg-liquid-gold/5'}`} />
                
                <div className="relative flex flex-col md:flex-row items-center gap-3 md:gap-4">
                    <div className="relative w-full">
                        <div className="absolute left-4 md:left-6 text-liquid-gold/50 top-1/2 -translate-y-1/2">
                            {isSearching ? <Loader2Icon className="w-5 h-5 md:w-8 md:h-8 animate-spin" /> : <SearchIcon className="w-5 h-5 md:w-8 md:h-8" />}
                        </div>
                        <input 
                            type="text" 
                            inputMode="numeric"
                            value={rucSearch}
                            onChange={(e) => setRucSearch(e.target.value.replace(/\D/g, '').slice(0, 13))}
                            placeholder="RUC / CÉDULA..." 
                            className={`w-full py-4 md:py-6 pl-12 md:pl-20 pr-6 md:pr-8 bg-white/5 border-2 rounded-2xl md:rounded-[2rem] text-xl md:text-3xl font-black text-white placeholder:text-slate-700 outline-none transition-all shadow-luxury italic uppercase tracking-[0.1em] md:tracking-[0.2em]
                                ${searchStatus === 'found_local' ? 'border-liquid-gold/50 bg-liquid-gold/5 text-liquid-gold' : 
                                  searchStatus === 'found_sri' ? 'border-white/30 bg-white/10 text-white' : 
                                  error ? 'border-rose-500/50 bg-rose-500/5 text-rose-100' :
                                  'border-white/10 focus:border-liquid-gold/50 focus:bg-white/10'}
                            `}
                        />
                    </div>
                    <button 
                        onClick={() => handleSearch(rucSearch)}
                        disabled={rucSearch.length < 10 || isSearching}
                        className="w-full md:w-auto bg-liquid-gold text-black px-8 py-4 md:py-5 rounded-2xl font-black uppercase tracking-widest disabled:opacity-50 md:disabled:opacity-0 transition-all shadow-gold-glow hover:scale-105 active:scale-95 flex-shrink-0 text-xs md:text-base h-14 md:h-auto"
                    >
                        Buscar Cliente
                    </button>
                </div>
                {error && (
                    <p className="mt-2 text-[8px] md:text-xs text-rose-500 font-black uppercase tracking-widest bg-rose-500/10 px-3 py-1.5 rounded-lg border border-rose-500/20 w-fit">{error}</p>
                )}
            </div>

            <AnimatePresence mode="wait">
                {searchStatus !== 'idle' && searchStatus !== 'searching' && (
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
                        className="bg-black/40 backdrop-blur-3xl rounded-[1.5rem] md:rounded-[2.5rem] border border-white/10 p-5 md:p-10 shadow-2xl relative overflow-hidden"
                    >
                        {/* Status Badge */}
                        <div className="flex justify-between items-center mb-6 md:mb-10">
                            <h3 className="text-white font-black uppercase italic tracking-[-0.04em] text-sm md:text-2xl">Perfil de Identidad</h3>
                            <div className="flex gap-2">
                                {searchStatus === 'found_local' && (
                                    <div className="bg-liquid-gold/20 border border-liquid-gold/50 text-liquid-gold px-3 md:px-5 py-1.5 md:py-2.5 rounded-xl flex items-center gap-2 shadow-gold-glow-sm">
                                        <SparklesIcon className="w-3.5 h-3.5 md:w-5 md:h-5" />
                                        <span className="text-[8px] md:text-[11px] font-black uppercase tracking-widest">Habitual</span>
                                    </div>
                                )}
                                {searchStatus === 'found_sri' && (
                                    <div className="bg-white/10 border border-white/30 text-white px-3 md:px-5 py-1.5 md:py-2.5 rounded-xl flex items-center gap-2">
                                        <ShieldCheckIcon className="w-3.5 h-3.5 md:w-5 md:h-5" />
                                        <span className="text-[8px] md:text-[11px] font-black uppercase tracking-widest">Oficial SRI</span>
                                    </div>
                                )}
                                {searchStatus === 'not_found' && (
                                    <div className="bg-rose-500/10 border border-rose-500/30 text-rose-300 px-3 md:px-5 py-1.5 md:py-2.5 rounded-xl flex items-center gap-2">
                                        <UserIcon className="w-3.5 h-3.5 md:w-5 md:h-5" />
                                        <span className="text-[8px] md:text-[11px] font-black uppercase tracking-widest">Prospecto</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {searchStatus === 'not_found' && (
                            <div className="mb-6 md:mb-10 p-5 md:p-8 bg-white/5 border border-white/10 rounded-2xl md:rounded-3xl flex flex-col md:flex-row items-center justify-between gap-5 md:gap-8 group hover:bg-white/10 transition-colors relative z-10 overflow-hidden">
                                <div className="absolute top-0 left-0 w-1 h-full bg-liquid-gold/30" />
                                <div className="text-center md:text-left">
                                    <h4 className="text-white font-black uppercase italic tracking-[-0.04em] text-base md:text-2xl">Lector de Padrón PDF</h4>
                                    <p className="text-slate-400 text-[8px] md:text-xs font-bold uppercase tracking-widest mt-1 md:mt-2">Extracción instantánea de datos SRI</p>
                                </div>
                                <input type="file" accept="application/pdf" className="hidden" ref={fileInputRef} onChange={handleFileUpload} />
                                <button 
                                    onClick={() => fileInputRef.current?.click()}
                                    disabled={isScanningPdf}
                                    className="w-full md:w-auto bg-white/10 text-white px-6 md:px-10 py-4 md:py-5 rounded-2xl font-black uppercase tracking-widest hover:bg-liquid-gold hover:text-black transition-all flex items-center justify-center gap-3 md:gap-4 whitespace-nowrap text-[10px] md:text-sm active:scale-95"
                                >
                                    {isScanningPdf ? <Loader2Icon className="w-5 h-5 animate-spin" /> : <UploadIcon className="w-5 h-5" />}
                                    {isScanningPdf ? 'Sincronizando...' : 'Subir Documento'}
                                </button>
                            </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8 relative z-10">
                            <div className="space-y-2 md:space-y-3 col-span-1 md:col-span-2">
                                <label className="text-[9px] md:text-[11px] text-slate-500 font-black uppercase tracking-widest ml-2">Nombre o Razón Social *</label>
                                <input 
                                    value={formData.nombre}
                                    onChange={e => setFormData(f => ({ ...f, nombre: e.target.value.toUpperCase() }))}
                                    readOnly={searchStatus === 'found_local'}
                                    placeholder="NOMBRE COMPLETO..."
                                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 md:px-6 py-4 md:py-6 text-white font-black text-base md:text-2xl focus:border-liquid-gold/50 outline-none transition-all placeholder:text-white/10 uppercase italic"
                                />
                            </div>

                            <div className="space-y-2 md:space-y-3">
                                <label className="text-[9px] md:text-[11px] text-slate-500 font-black uppercase tracking-widest ml-2">Contacto Móvil</label>
                                <div className="relative">
                                    <PhoneIcon className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 md:w-5 md:h-5 text-liquid-gold/50" />
                                    <input 
                                        type="tel"
                                        value={formData.telefono}
                                        onChange={e => setFormData(f => ({ ...f, telefono: e.target.value }))}
                                        placeholder="09XXXXXXXX"
                                        className="w-full bg-white/5 border border-white/10 rounded-2xl pl-12 md:pl-16 pr-5 md:pr-6 py-4 md:py-5 text-white font-bold text-base md:text-xl focus:border-liquid-gold/50 outline-none transition-all placeholder:text-white/10"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2 md:space-y-3">
                                <label className="text-[9px] md:text-[11px] text-slate-500 font-black uppercase tracking-widest ml-2">Email Corporativo</label>
                                <input 
                                    type="email"
                                    value={formData.email}
                                    onChange={e => setFormData(f => ({ ...f, email: e.target.value.toLowerCase() }))}
                                    placeholder="CLIENTE@EMAIL.COM"
                                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 md:px-6 py-4 md:py-5 text-white font-bold text-base md:text-xl focus:border-liquid-gold/50 outline-none transition-all placeholder:text-white/10"
                                />
                            </div>

                            <div className="space-y-2 md:space-y-3 col-span-1 md:col-span-2">
                                <label className="text-[9px] md:text-[11px] text-slate-500 font-black uppercase tracking-widest ml-2">Ubicación de Facturación *</label>
                                <div className="relative">
                                    <MapPinIcon className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 md:w-5 md:h-5 text-liquid-gold/50" />
                                    <input 
                                        value={formData.direccion}
                                        onChange={e => setFormData(f => ({ ...f, direccion: e.target.value.toUpperCase() }))}
                                        placeholder="CIUDAD, CALLE..."
                                        className="w-full bg-white/5 border border-white/10 rounded-2xl pl-12 md:pl-16 pr-5 md:pr-6 py-4 md:py-5 text-white font-bold text-base md:text-xl focus:border-liquid-gold/50 outline-none transition-all placeholder:text-white/10 uppercase"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-col sm:flex-row justify-between items-center mt-8 md:mt-12 pt-6 md:pt-10 border-t border-white/5 relative z-10 gap-4 md:gap-8">
                            <button onClick={onCancel} className="text-slate-500 hover:text-white text-[10px] md:text-xs font-black uppercase tracking-widest transition-colors w-full sm:w-auto py-4 md:py-0 order-2 sm:order-1 active:scale-95">
                                Abandonar Proceso
                            </button>
                            <button 
                                onClick={handleSubmit}
                                disabled={isSearching || !formData.nombre.trim()}
                                className="w-full sm:w-auto bg-liquid-gold text-black px-10 md:px-16 py-5 md:py-7 rounded-2xl font-black uppercase tracking-[0.2em] flex items-center justify-center gap-4 md:gap-6 hover:scale-105 active:scale-95 transition-all disabled:opacity-50 shadow-gold-glow text-xs md:text-lg order-1 sm:order-2"
                            >
                                {isSearching ? <Loader2Icon className="w-5 h-5 md:w-7 md:h-7 animate-spin" /> : <CheckCircleIcon className="w-5 h-5 md:w-7 md:h-7" />}
                                Confirmar Cliente
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>

    );
};
