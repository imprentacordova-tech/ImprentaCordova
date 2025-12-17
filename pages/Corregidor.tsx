
import React, { useState, useRef } from 'react';
import { EyeIcon, UploadIcon, Loader2Icon, SparklesIcon, PaletteIcon, DocumentTextIcon, WrenchScrewdriverIcon, DollarIcon, TrashIcon } from '../components/Icons';
import { analyzeDesignWithSupervisor } from '../services/geminiService';
import { SupervisorAnalysis } from '../types';
import { useToast } from '../contexts/ToastContext';

// Helper to read file as Base64
const toBase64 = (file: File): Promise<string> => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
});

const AnalysisResult: React.FC<{ result: SupervisorAnalysis }> = ({ result }) => {
    const [expanded, setExpanded] = useState(false);

    const statusConfig = {
        VERDE: { color: 'text-green-600', bg: 'bg-green-100 border-green-200', icon: '🟢', label: 'IMPRIMIBLE' },
        AMARILLO: { color: 'text-yellow-600', bg: 'bg-yellow-100 border-yellow-200', icon: '🟡', label: 'REVISAR' },
        ROJO: { color: 'text-red-600', bg: 'bg-red-100 border-red-200', icon: '🔴', label: 'CRÍTICO' },
    };

    const config = statusConfig[result.estado];

    const getCategoryIcon = (tipo: string) => {
        switch(tipo) {
            case 'TECNICA': return <WrenchScrewdriverIcon className="w-4 h-4" />;
            case 'DISENO': return <PaletteIcon className="w-4 h-4" />;
            case 'COLOR': return <SparklesIcon className="w-4 h-4" />;
            case 'COMERCIAL': return <DollarIcon className="w-4 h-4" />;
            default: return <DocumentTextIcon className="w-4 h-4" />;
        }
    };

    return (
        <div className={`rounded-xl border-2 transition-all overflow-hidden ${config.bg} ${expanded ? 'shadow-lg' : 'shadow-sm'}`}>
            {/* Header (Always Visible - Minimalist) */}
            <div 
                className="p-4 flex flex-col md:flex-row md:items-center justify-between cursor-pointer gap-4"
                onClick={() => setExpanded(!expanded)}
            >
                <div className="flex items-center gap-4">
                    <div className="text-4xl animate-pulse">{config.icon}</div>
                    <div>
                        <h3 className={`font-black text-lg tracking-wider ${config.color}`}>{config.label}</h3>
                        <p className="text-gray-700 font-medium text-sm leading-tight max-w-xl">
                            "{result.resumen}"
                        </p>
                    </div>
                </div>
                <div className="text-xs font-bold text-gray-500 uppercase tracking-widest bg-white/50 px-3 py-1 rounded-full self-start md:self-center">
                    {expanded ? 'Ocultar Detalles' : 'Ver Informe Completo'}
                </div>
            </div>

            {/* Expanded Body (The Power) */}
            {expanded && (
                <div className="bg-white p-6 border-t border-gray-200 animate-fade-in">
                    <h4 className="text-sm font-bold text-gray-400 uppercase mb-4">Diagnóstico del Supervisor</h4>
                    <div className="space-y-4">
                        {result.detalles.length === 0 ? (
                            <p className="text-gray-500 italic">No se encontraron problemas significativos. ¡Buen trabajo!</p>
                        ) : (
                            result.detalles.map((detalle, idx) => (
                                <div key={idx} className="flex gap-4 p-3 rounded-lg hover:bg-gray-50 transition-colors border border-transparent hover:border-gray-100">
                                    <div className="p-2 rounded-full bg-blue-50 text-blue-600 h-fit">
                                        {getCategoryIcon(detalle.tipo)}
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="text-[10px] font-bold bg-gray-200 text-gray-600 px-2 py-0.5 rounded uppercase">
                                                {detalle.tipo}
                                            </span>
                                        </div>
                                        <p className="text-gray-800 font-medium text-sm mb-1">{detalle.descripcion}</p>
                                        <p className="text-blue-600 text-xs font-bold bg-blue-50/50 p-2 rounded-md border border-blue-100 inline-block">
                                            💡 Sugerencia: {detalle.sugerencia}
                                        </p>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

const CorregidorPage: React.FC = () => {
    const { addToast } = useToast();
    const [originalImage, setOriginalImage] = useState<string | null>(null);
    const [newDesignImage, setNewDesignImage] = useState<string | null>(null);
    const [context, setContext] = useState('');
    const [loading, setLoading] = useState(false);
    const [analysis, setAnalysis] = useState<SupervisorAnalysis | null>(null);

    const originalRef = useRef<HTMLInputElement>(null);
    const designRef = useRef<HTMLInputElement>(null);

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>, setter: (s: string | null) => void) => {
        if (e.target.files && e.target.files[0]) {
            const base64 = await toBase64(e.target.files[0]);
            setter(base64);
            setAnalysis(null); // Reset analysis on new upload
        }
    };

    const handleAnalyze = async () => {
        if (!newDesignImage) {
            addToast("Debes subir al menos el Diseño Nuevo.", "error");
            return;
        }

        setLoading(true);
        setAnalysis(null);

        const result = await analyzeDesignWithSupervisor(newDesignImage, originalImage || undefined, context);
        
        if (result) {
            setAnalysis(result);
            addToast("Análisis completado.", "success");
        } else {
            addToast("Hubo un error al analizar la imagen.", "error");
        }
        
        setLoading(false);
    };

    return (
        <div className="max-w-5xl mx-auto space-y-8 animate-fade-in pb-12">
            
            {/* Header */}
            <div className="flex items-center gap-4 border-b border-gray-200 dark:border-gray-700 pb-4">
                <div className="bg-brand-blue p-3 rounded-xl text-white shadow-lg">
                    <EyeIcon className="h-8 w-8"/>
                </div>
                <div>
                    <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">Corregidor de Imprenta</h1>
                    <p className="text-gray-500 dark:text-gray-400 text-sm">Tu supervisor experto con IA: ortografía, color, diseño y ventas.</p>
                </div>
            </div>

            {/* Workspace */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                
                {/* Inputs Column */}
                <div className="space-y-6">
                    
                    {/* Zone A: Original (Optional) */}
                    <div className="relative group">
                        <label className="block text-xs font-bold text-gray-400 uppercase mb-2 ml-1">Referencia / Original (Opcional)</label>
                        <div 
                            onClick={() => originalRef.current?.click()}
                            className={`
                                h-48 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-all relative overflow-hidden
                                ${originalImage ? 'border-brand-blue bg-blue-50' : 'border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100'}
                            `}
                        >
                            <input ref={originalRef} type="file" className="hidden" accept="image/*" onChange={(e) => handleUpload(e, setOriginalImage)} />
                            
                            {originalImage ? (
                                <>
                                    <img src={originalImage} alt="Original" className="h-full w-full object-contain p-2" />
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); setOriginalImage(null); }}
                                        className="absolute top-2 right-2 bg-red-100 text-red-600 p-1.5 rounded-full hover:bg-red-200"
                                    >
                                        <TrashIcon className="w-4 h-4" />
                                    </button>
                                </>
                            ) : (
                                <div className="text-center text-gray-400">
                                    <UploadIcon className="w-8 h-8 mx-auto mb-2 opacity-50" />
                                    <p className="text-sm font-medium">Subir Referencia</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Zone B: New Design (Required) */}
                    <div className="relative group">
                        <label className="block text-xs font-bold text-brand-blue uppercase mb-2 ml-1 flex items-center gap-2">
                            <SparklesIcon className="w-3 h-3"/> Diseño Nuevo (Obligatorio)
                        </label>
                        <div 
                            onClick={() => designRef.current?.click()}
                            className={`
                                h-64 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-all relative overflow-hidden shadow-sm
                                ${newDesignImage ? 'border-brand-blue bg-white' : 'border-brand-blue/30 bg-blue-50/30 hover:bg-blue-50 hover:border-brand-blue'}
                            `}
                        >
                            <input ref={designRef} type="file" className="hidden" accept="image/*" onChange={(e) => handleUpload(e, setNewDesignImage)} />
                            
                            {newDesignImage ? (
                                <>
                                    <img src={newDesignImage} alt="Diseño Nuevo" className="h-full w-full object-contain p-2" />
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); setNewDesignImage(null); setAnalysis(null); }}
                                        className="absolute top-2 right-2 bg-red-100 text-red-600 p-1.5 rounded-full hover:bg-red-200 shadow-sm"
                                    >
                                        <TrashIcon className="w-4 h-4" />
                                    </button>
                                </>
                            ) : (
                                <div className="text-center text-brand-blue/60">
                                    <PaletteIcon className="w-12 h-12 mx-auto mb-3" />
                                    <p className="font-bold text-lg">Subir Arte Final</p>
                                    <p className="text-xs opacity-70">JPG, PNG, WEBP</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Context Text */}
                    <div>
                        <label className="block text-xs font-bold text-gray-400 uppercase mb-2 ml-1">Contexto Extra</label>
                        <textarea
                            value={context}
                            onChange={(e) => setContext(e.target.value)}
                            placeholder="Ej: Es para una lona de 2x1 metros. El cliente quiere colores vibrantes."
                            className="w-full p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm focus:ring-2 focus:ring-brand-blue outline-none resize-none h-24"
                        />
                    </div>

                    <button
                        onClick={handleAnalyze}
                        disabled={loading || !newDesignImage}
                        className={`
                            w-full py-4 rounded-xl font-black text-lg shadow-lg flex items-center justify-center gap-3 transition-all transform active:scale-95
                            ${loading || !newDesignImage 
                                ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                                : 'bg-gradient-to-r from-brand-blue to-blue-700 text-white hover:shadow-blue-500/30 hover:-translate-y-1'}
                        `}
                    >
                        {loading ? (
                            <>
                                <Loader2Icon className="w-6 h-6 animate-spin" />
                                Escaneando Capas...
                            </>
                        ) : (
                            <>
                                <EyeIcon className="w-6 h-6" />
                                ANALIZAR DISEÑO
                            </>
                        )}
                    </button>

                </div>

                {/* Output Column */}
                <div className="flex flex-col justify-center">
                    {!analysis && !loading && (
                        <div className="text-center text-gray-400 p-12 border-2 border-dashed border-gray-200 rounded-3xl bg-gray-50/50">
                            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <DocumentTextIcon className="w-10 h-10 opacity-30" />
                            </div>
                            <h3 className="font-bold text-lg text-gray-500">Esperando Archivos</h3>
                            <p className="text-sm max-w-xs mx-auto mt-2">Sube tu diseño para que el Supervisor Maestro inicie el diagnóstico.</p>
                        </div>
                    )}

                    {loading && (
                        <div className="text-center p-12 space-y-6">
                            <div className="relative w-24 h-24 mx-auto">
                                <div className="absolute inset-0 border-4 border-gray-200 rounded-full"></div>
                                <div className="absolute inset-0 border-4 border-brand-blue rounded-full border-t-transparent animate-spin"></div>
                                <EyeIcon className="absolute inset-0 m-auto w-8 h-8 text-brand-blue animate-pulse" />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-brand-blue animate-pulse">Analizando...</h3>
                                <div className="text-sm text-gray-500 mt-2 space-y-1">
                                    <p>🔍 Revisando ortografía...</p>
                                    <p>🎨 Calibrando colores...</p>
                                    <p>⚖️ Midiendo composición...</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {analysis && !loading && (
                        <div className="animate-slide-in-up">
                            <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
                                Resultado del Análisis
                            </h2>
                            <AnalysisResult result={analysis} />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default CorregidorPage;
