
import React, { useState } from 'react';
import { GoogleGenAI } from "@google/genai";
import { 
    Wand2Icon, ScanEyeIcon, UploadCloudIcon, CheckCircleIcon, 
    ExclamationTriangleIcon, Loader2Icon, SparklesIcon, FileSearchIcon,
    ArrowDownIcon
} from '../components/Icons';

// --- CONFIGURACIÓN GEMINI ---
const apiKey = process.env.API_KEY || '';
const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

// --- TIPOS ---
type Tab = 'corrector' | 'creativo';

interface AnalysisResult {
    status: 'success' | 'error' | 'warning';
    message: string;
    differences?: string[];
    originalText?: string;
    proofText?: string;
}

interface CreativeResult {
    extractedText: string;
    suggestions: string[];
    designPreview: {
        title: string;
        subtitle: string;
        body: string;
        contact: string;
        colorScheme: 'modern' | 'classic' | 'bold';
    };
}

// --- UTILIDADES ---
const fileToGenerativePart = async (file: File) => {
    const base64EncodedDataPromise = new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => {
            if (typeof reader.result === 'string') {
                resolve(reader.result.split(',')[1]);
            } else {
                resolve('');
            }
        };
        reader.readAsDataURL(file);
    });
    return {
        inlineData: { data: await base64EncodedDataPromise, mimeType: file.type },
    };
};

// Componente FileUploader extraído para mejor rendimiento
const FileUploader = ({ label, file, setFile }: { label: string, file: File | null, setFile: (f: File | null) => void }) => (
    <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-6 text-center hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors relative group">
        <input 
            type="file" 
            accept="image/*" 
            onChange={(e) => e.target.files && setFile(e.target.files[0])} 
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
        />
        {file ? (
            <div className="relative z-0">
                <img src={URL.createObjectURL(file)} alt="Preview" className="h-32 mx-auto object-contain mb-2 rounded shadow-sm" />
                <p className="text-sm font-bold text-brand-blue truncate">{file.name}</p>
                <p className="text-xs text-gray-500">Clic para cambiar</p>
            </div>
        ) : (
            <div className="py-4">
                <UploadCloudIcon className="w-10 h-10 text-gray-400 mx-auto mb-3 group-hover:text-brand-blue transition-colors" />
                <p className="text-sm font-medium text-gray-600 dark:text-gray-300">{label}</p>
                <p className="text-xs text-gray-400 mt-1">Arrastra o clic aquí</p>
            </div>
        )}
    </div>
);

const HerramientasIA: React.FC = () => {
    const [activeTab, setActiveTab] = useState<Tab>('corrector');
    const [loading, setLoading] = useState(false);

    // Estado Corrector
    const [sourceFile, setSourceFile] = useState<File | null>(null);
    const [proofFile, setProofFile] = useState<File | null>(null);
    const [correctionResult, setCorrectionResult] = useState<AnalysisResult | null>(null);

    // Estado Creativo
    const [creativeFile, setCreativeFile] = useState<File | null>(null);
    const [creativeResult, setCreativeResult] = useState<CreativeResult | null>(null);

    // --- LÓGICA DEL CORRECTOR ---
    const handleAnalyzeProof = async () => {
        if (!ai) {
            alert("API Key no configurada. Verifica las variables de entorno.");
            return;
        }
        if (!sourceFile || !proofFile) return;
        
        setLoading(true);
        setCorrectionResult(null);

        try {
            const sourcePart = await fileToGenerativePart(sourceFile);
            const proofPart = await fileToGenerativePart(proofFile);

            const prompt = `
                Actúa como un corrector de pruebas experto en una imprenta. Tu trabajo es CRÍTICO para evitar errores de impresión.
                
                Tienes dos imágenes:
                1. La "FUENTE ORIGINAL" (lo que pidió el cliente, puede ser manuscrito o digital).
                2. La "PRUEBA DE IMPRESIÓN" (el diseño final hecho por el diseñador).

                TAREA:
                Compara meticulosamente el texto de ambas imágenes. Busca errores ortográficos, números de teléfono mal copiados, fechas incorrectas, nombres mal escritos o información faltante.
                
                Responde EXCLUSIVAMENTE en formato JSON con esta estructura:
                {
                    "status": "success" (si todo coincide) o "warning" (si hay errores),
                    "message": "Resumen breve de 1 frase",
                    "differences": ["Lista de errores específicos encontrados (ej: El teléfono termina en 89, no 98)", "Falta la tilde en 'Canción'"],
                    "originalText": "Texto extraído de la fuente",
                    "proofText": "Texto extraído de la prueba"
                }
            `;

            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: [
                    { role: 'user', parts: [{ text: "Esta es la FUENTE ORIGINAL:" }, sourcePart] },
                    { role: 'user', parts: [{ text: "Esta es la PRUEBA DE IMPRESIÓN:" }, proofPart] },
                    { role: 'user', parts: [{ text: prompt }] }
                ],
                config: { responseMimeType: "application/json" }
            });

            if (response.text) {
                try {
                    const result = JSON.parse(response.text);
                    setCorrectionResult(result);
                } catch (e) {
                    console.error("Error parsing JSON", e);
                    setCorrectionResult({ status: 'error', message: "Error al interpretar la respuesta de la IA." });
                }
            }
        } catch (error) {
            console.error(error);
            setCorrectionResult({ status: 'error', message: "Ocurrió un error en la conexión con Gemini." });
        } finally {
            setLoading(false);
        }
    };

    // --- LÓGICA CREATIVA ---
    const handleGenerateCreative = async () => {
        if (!ai) {
            alert("API Key no configurada.");
            return;
        }
        if (!creativeFile) return;
        
        setLoading(true);
        setCreativeResult(null);

        try {
            const imagePart = await fileToGenerativePart(creativeFile);
            const prompt = `
                Eres un diseñador gráfico experto y redactor publicitario.
                Analiza la imagen proporcionada (una tarjeta, volante o diploma viejo).
                
                1. Extrae todo el texto útil.
                2. Mejora el texto: Corrige ortografía y sugiere 3 frases de marketing (slogans) cortas y atractivas relacionadas con el negocio.
                3. Estructura un diseño moderno para una "Tarjeta de Presentación" o "Volante" basado en el contenido.
                
                Responde EXCLUSIVAMENTE en formato JSON:
                {
                    "extractedText": "Texto crudo extraído...",
                    "suggestions": ["Slogan 1", "Slogan 2", "Slogan 3"],
                    "designPreview": {
                        "title": "Nombre del Negocio o Persona principal",
                        "subtitle": "Cargo o Slogan seleccionado",
                        "body": "Lista de servicios o dirección",
                        "contact": "Teléfonos y redes",
                        "colorScheme": "modern" (blue/gray) o "classic" (gold/black) o "bold" (red/black) - elige el mejor según el rubro detectado.
                    }
                }
            `;

            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: [
                    { role: 'user', parts: [imagePart, { text: prompt }] }
                ],
                config: { responseMimeType: "application/json" }
            });

            if (response.text) {
                try {
                    setCreativeResult(JSON.parse(response.text));
                } catch (e) {
                    console.error("Error parsing creative JSON", e);
                }
            }
        } catch (error) {
            console.error("Error generating creative content", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-8 pb-12">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <SparklesIcon className="text-purple-500 w-8 h-8" /> Estudio Inteligente
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400">Herramientas de IA para corrección y diseño automatizado.</p>
                </div>
                
                {/* Tabs */}
                <div className="bg-gray-200 dark:bg-gray-700 p-1 rounded-xl flex">
                    <button 
                        onClick={() => setActiveTab('corrector')}
                        className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${activeTab === 'corrector' ? 'bg-white dark:bg-gray-800 text-brand-blue shadow-md' : 'text-gray-600 dark:text-gray-300 hover:text-gray-900'}`}
                    >
                        <ScanEyeIcon className="w-4 h-4" /> Auditor de Calidad
                    </button>
                    <button 
                        onClick={() => setActiveTab('creativo')}
                        className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${activeTab === 'creativo' ? 'bg-white dark:bg-gray-800 text-purple-600 shadow-md' : 'text-gray-600 dark:text-gray-300 hover:text-gray-900'}`}
                    >
                        <Wand2Icon className="w-4 h-4" /> Diseñador Express
                    </button>
                </div>
            </div>

            {/* --- CONTENIDO CORRECTOR --- */}
            {activeTab === 'corrector' && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-fade-in">
                    {/* Inputs */}
                    <div className="lg:col-span-5 space-y-6">
                        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
                            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                                <FileSearchIcon className="w-5 h-5 text-blue-500" /> Cargar Documentos
                            </h3>
                            <div className="space-y-4">
                                <FileUploader label="1. Fuente Original (Cliente)" file={sourceFile} setFile={setSourceFile} />
                                <div className="flex justify-center -my-2 relative z-10">
                                    <div className="bg-gray-100 dark:bg-gray-700 rounded-full p-1 border-4 border-white dark:border-gray-800">
                                        <ArrowDownIcon className="w-5 h-5 text-gray-400" />
                                    </div>
                                </div>
                                <FileUploader label="2. Prueba de Impresión (Diseño)" file={proofFile} setFile={setProofFile} />
                            </div>
                            
                            <button 
                                onClick={handleAnalyzeProof}
                                disabled={loading || !sourceFile || !proofFile}
                                className={`w-full mt-6 py-4 rounded-xl font-bold text-white shadow-lg transition-all flex items-center justify-center gap-2 ${loading || !sourceFile || !proofFile ? 'bg-gray-400 cursor-not-allowed' : 'bg-brand-blue hover:bg-blue-700 hover:-translate-y-1'}`}
                            >
                                {loading ? <Loader2Icon className="animate-spin w-5 h-5" /> : <ScanEyeIcon className="w-5 h-5" />}
                                {loading ? 'Analizando diferencias...' : 'Auditar Diseño'}
                            </button>
                        </div>
                    </div>

                    {/* Resultados */}
                    <div className="lg:col-span-7">
                        {correctionResult ? (
                            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                                <div className={`p-6 border-b ${correctionResult.status === 'success' ? 'bg-green-50 border-green-100' : 'bg-red-50 border-red-100'}`}>
                                    <div className="flex items-center gap-4">
                                        <div className={`p-3 rounded-full ${correctionResult.status === 'success' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                                            {correctionResult.status === 'success' ? <CheckCircleIcon className="w-8 h-8" /> : <ExclamationTriangleIcon className="w-8 h-8" />}
                                        </div>
                                        <div>
                                            <h3 className={`text-xl font-black uppercase ${correctionResult.status === 'success' ? 'text-green-800' : 'text-red-800'}`}>
                                                {correctionResult.status === 'success' ? 'Aprobado para Impresión' : 'Atención: Errores Detectados'}
                                            </h3>
                                            <p className={`text-sm ${correctionResult.status === 'success' ? 'text-green-700' : 'text-red-700'}`}>
                                                {correctionResult.message}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                                
                                {correctionResult.differences && correctionResult.differences.length > 0 && (
                                    <div className="p-6">
                                        <h4 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4">Lista de Discrepancias</h4>
                                        <ul className="space-y-3">
                                            {correctionResult.differences.map((diff, i) => (
                                                <li key={i} className="flex items-start gap-3 p-3 bg-red-50 dark:bg-red-900/10 rounded-lg border border-red-100 dark:border-red-900/30">
                                                    <span className="bg-red-200 text-red-800 text-xs font-bold w-5 h-5 flex items-center justify-center rounded-full mt-0.5">{i+1}</span>
                                                    <span className="text-gray-800 dark:text-gray-200 text-sm">{diff}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}

                                <div className="p-6 bg-gray-50 dark:bg-gray-900/50 border-t dark:border-gray-700 grid grid-cols-2 gap-6">
                                    <div>
                                        <p className="text-xs font-bold text-gray-400 uppercase mb-2">Texto Original Detectado</p>
                                        <div className="text-xs text-gray-600 dark:text-gray-400 bg-white dark:bg-gray-800 p-3 rounded border dark:border-gray-700 h-32 overflow-y-auto">
                                            {correctionResult.originalText}
                                        </div>
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold text-gray-400 uppercase mb-2">Texto Prueba Detectado</p>
                                        <div className="text-xs text-gray-600 dark:text-gray-400 bg-white dark:bg-gray-800 p-3 rounded border dark:border-gray-700 h-32 overflow-y-auto">
                                            {correctionResult.proofText}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center text-center p-12 bg-gray-50 dark:bg-gray-800/50 rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-700">
                                <ScanEyeIcon className="w-16 h-16 text-gray-300 mb-4" />
                                <h3 className="text-lg font-bold text-gray-500">Esperando imágenes</h3>
                                <p className="text-sm text-gray-400 max-w-sm mt-2">
                                    Sube la foto del pedido y la foto del diseño final. La IA comparará ambos para asegurar que no falte nada.
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* --- CONTENIDO CREATIVO --- */}
            {activeTab === 'creativo' && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-fade-in">
                    <div className="lg:col-span-4 space-y-6">
                        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
                            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                                <Wand2Icon className="w-5 h-5 text-purple-500" /> Fuente de Inspiración
                            </h3>
                            <FileUploader label="Foto de tarjeta, volante o boceto" file={creativeFile} setFile={setCreativeFile} />
                            
                            <button 
                                onClick={handleGenerateCreative}
                                disabled={loading || !creativeFile}
                                className={`w-full mt-6 py-4 rounded-xl font-bold text-white shadow-lg transition-all flex items-center justify-center gap-2 ${loading || !creativeFile ? 'bg-gray-400 cursor-not-allowed' : 'bg-purple-600 hover:bg-purple-700 hover:-translate-y-1'}`}
                            >
                                {loading ? <Loader2Icon className="animate-spin w-5 h-5" /> : <SparklesIcon className="w-5 h-5" />}
                                {loading ? 'Generando Magia...' : 'Crear Propuesta'}
                            </button>
                        </div>

                        {creativeResult && (
                            <div className="bg-purple-50 dark:bg-purple-900/20 p-5 rounded-2xl border border-purple-100 dark:border-purple-800">
                                <h4 className="text-sm font-bold text-purple-800 dark:text-purple-300 uppercase mb-3 flex items-center gap-2">
                                    <SparklesIcon className="w-4 h-4"/> Slogans Sugeridos
                                </h4>
                                <ul className="space-y-2">
                                    {creativeResult.suggestions.map((s, i) => (
                                        <li key={i} className="text-sm text-gray-700 dark:text-gray-300 italic bg-white dark:bg-gray-800 p-2 rounded shadow-sm">
                                            "{s}"
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>

                    <div className="lg:col-span-8">
                        {creativeResult ? (
                            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden border border-gray-200 dark:border-gray-700 h-full flex flex-col">
                                <div className="p-4 border-b dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 flex justify-between items-center">
                                    <h3 className="font-bold text-gray-700 dark:text-gray-200">Vista Previa Generada</h3>
                                    <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded-full font-bold uppercase">AI Design</span>
                                </div>
                                
                                <div className="p-10 flex-grow flex items-center justify-center bg-gray-200 dark:bg-gray-900 overflow-hidden relative">
                                    <div className="absolute inset-0 pattern-grid opacity-10 pointer-events-none"></div>
                                    
                                    {/* VISUAL PREVIEW CARD */}
                                    <div 
                                        className={`w-full max-w-md aspect-[1.58] shadow-2xl rounded-xl overflow-hidden relative flex flex-col transition-all transform hover:scale-105 duration-500
                                            ${creativeResult.designPreview.colorScheme === 'modern' ? 'bg-white' : 
                                              creativeResult.designPreview.colorScheme === 'bold' ? 'bg-zinc-900 text-white' : 
                                              'bg-[#fcfbf4] border-4 border-double border-yellow-600'}
                                        `}
                                    >
                                        {/* Background Decor */}
                                        {creativeResult.designPreview.colorScheme === 'modern' && <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500 rounded-bl-full opacity-20"></div>}
                                        {creativeResult.designPreview.colorScheme === 'bold' && <div className="absolute bottom-0 left-0 w-full h-2 bg-red-600"></div>}
                                        
                                        <div className="p-8 h-full flex flex-col relative z-10">
                                            <div className="mb-4">
                                                <h2 className={`text-2xl font-black uppercase tracking-tight leading-none ${
                                                    creativeResult.designPreview.colorScheme === 'modern' ? 'text-brand-blue' :
                                                    creativeResult.designPreview.colorScheme === 'bold' ? 'text-white' : 'text-gray-800 serif'
                                                }`}>
                                                    {creativeResult.designPreview.title}
                                                </h2>
                                                <p className={`text-sm font-medium mt-1 ${
                                                    creativeResult.designPreview.colorScheme === 'bold' ? 'text-red-500' : 'text-gray-500'
                                                }`}>
                                                    {creativeResult.designPreview.subtitle}
                                                </p>
                                            </div>
                                            
                                            <div className="flex-grow">
                                                <p className={`text-xs whitespace-pre-wrap leading-relaxed ${
                                                    creativeResult.designPreview.colorScheme === 'bold' ? 'text-gray-300' : 'text-gray-600'
                                                }`}>
                                                    {creativeResult.designPreview.body}
                                                </p>
                                            </div>

                                            <div className={`mt-auto pt-4 border-t ${
                                                creativeResult.designPreview.colorScheme === 'bold' ? 'border-gray-800' : 'border-gray-100'
                                            }`}>
                                                <p className="text-xs font-bold flex items-center gap-2">
                                                    {creativeResult.designPreview.contact}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="p-6 bg-white dark:bg-gray-800 border-t dark:border-gray-700">
                                    <p className="text-xs font-bold text-gray-400 uppercase mb-2">Texto Extraído</p>
                                    <p className="text-sm text-gray-600 dark:text-gray-300">{creativeResult.extractedText}</p>
                                </div>
                            </div>
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center text-center p-12 bg-gray-50 dark:bg-gray-800/50 rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-700">
                                <Wand2Icon className="w-16 h-16 text-gray-300 mb-4" />
                                <h3 className="text-lg font-bold text-gray-500">El lienzo está vacío</h3>
                                <p className="text-sm text-gray-400 max-w-sm mt-2">
                                    Sube una imagen para que la IA extraiga el texto, genere ideas y cree un boceto visual instantáneo.
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default HerramientasIA;
