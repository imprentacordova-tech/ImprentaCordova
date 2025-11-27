import React, { useState } from 'react';
import { Sparkles, Loader2, Copy, Check } from 'lucide-react';
import { generateMarketingCopy } from '../services/geminiService';
import { ToneType } from '../types';

const AIHelper: React.FC = () => {
  const [businessName, setBusinessName] = useState('');
  const [productType, setProductType] = useState('Tarjeta de Presentación');
  const [tone, setTone] = useState<string>(ToneType.PROFESSIONAL);
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!businessName) return;

    setLoading(true);
    setResult('');
    setCopied(false);

    const generatedText = await generateMarketingCopy({
      businessName,
      productType,
      tone
    });

    setResult(generatedText);
    setLoading(false);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(result);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <section id="ai-helper" className="py-20 bg-gradient-to-br from-blue-900 to-indigo-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          
          {/* Intro Text */}
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <Sparkles className="h-6 w-6 text-yellow-400" />
              <span className="text-yellow-400 font-bold uppercase tracking-wider text-sm">Impulsado por Gemini AI</span>
            </div>
            <h2 className="text-3xl md:text-5xl font-extrabold mb-6 leading-tight">
              ¿No sabes qué poner en tu diseño?
            </h2>
            <p className="text-lg text-blue-100 mb-8">
              Utiliza nuestro asistente gratuito de Inteligencia Artificial para crear frases creativas, slogans y textos vendedores para tus tarjetas, volantes o banners.
            </p>
            <ul className="space-y-4 mb-8">
              <li className="flex items-center">
                <div className="h-2 w-2 bg-cyan-400 rounded-full mr-3"></div>
                <span>Ideal para tarjetas de presentación y volantes</span>
              </li>
              <li className="flex items-center">
                <div className="h-2 w-2 bg-cyan-400 rounded-full mr-3"></div>
                <span>Genera ideas en segundos</span>
              </li>
              <li className="flex items-center">
                <div className="h-2 w-2 bg-cyan-400 rounded-full mr-3"></div>
                <span>Totalmente gratis para nuestros clientes</span>
              </li>
            </ul>
          </div>

          {/* Generator Card */}
          <div className="bg-white text-slate-900 rounded-2xl shadow-2xl p-6 md:p-8">
            <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center">
              <Sparkles className="h-5 w-5 text-purple-600 mr-2" />
              Generador de Texto Creativo
            </h3>
            
            <form onSubmit={handleGenerate} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Nombre de tu Negocio</label>
                <input 
                  type="text"
                  required
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  placeholder="Ej. Hamburguesas El Paisa"
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition-all"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Producto</label>
                  <select 
                    value={productType}
                    onChange={(e) => setProductType(e.target.value)}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                  >
                    <option>Tarjeta de Presentación</option>
                    <option>Volante / Flyer</option>
                    <option>Gigantografía</option>
                    <option>Invitación</option>
                    <option>Camiseta Personalizada</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Estilo / Tono</label>
                  <select 
                    value={tone}
                    onChange={(e) => setTone(e.target.value)}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                  >
                    {Object.values(ToneType).map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
              </div>

              <button 
                type="submit" 
                disabled={loading || !businessName}
                className={`w-full flex items-center justify-center py-3 rounded-lg font-bold text-white transition-all ${
                  loading || !businessName 
                    ? 'bg-slate-400 cursor-not-allowed' 
                    : 'bg-purple-600 hover:bg-purple-700 shadow-lg shadow-purple-200'
                }`}
              >
                {loading ? (
                  <>
                    <Loader2 className="animate-spin mr-2 h-5 w-5" />
                    Pensando Ideas...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-5 w-5" />
                    Generar Texto
                  </>
                )}
              </button>
            </form>

            {/* Results Area */}
            {result && (
              <div className="mt-6 pt-6 border-t border-slate-100 animate-fade-in">
                <div className="flex justify-between items-center mb-2">
                  <h4 className="font-semibold text-slate-700">Resultados Sugeridos:</h4>
                  <button 
                    onClick={copyToClipboard}
                    className="text-sm flex items-center text-purple-600 hover:text-purple-800 font-medium"
                  >
                    {copied ? <Check className="h-4 w-4 mr-1" /> : <Copy className="h-4 w-4 mr-1" />}
                    {copied ? 'Copiado' : 'Copiar'}
                  </button>
                </div>
                <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 text-slate-700 text-sm md:text-base whitespace-pre-wrap leading-relaxed">
                  {result}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export default AIHelper;