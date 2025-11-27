import React from 'react';
import { MapPin } from 'lucide-react';

const Hero: React.FC = () => {
  return (
    <section id="home" className="relative bg-blue-900 overflow-hidden">
      {/* Background Image Overlay */}
      <div className="absolute inset-0 opacity-20 bg-[url('https://images.unsplash.com/photo-1562654501-a0ccc0fc3fb1?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80')] bg-cover bg-center"></div>
      
      {/* Gradient Overlay - Strong Royal Blue branding */}
      <div className="absolute inset-0 bg-gradient-to-r from-blue-950 via-blue-900/95 to-blue-800/80"></div>
      
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 md:py-36 flex flex-col items-center text-center">
        
        {/* Location Badge */}
        <div className="inline-flex items-center bg-blue-800/50 rounded-full px-4 py-1.5 mb-6 border border-blue-700 backdrop-blur-sm">
          <MapPin className="w-4 h-4 text-orange-400 mr-2" />
          <span className="text-orange-400 font-bold tracking-wide uppercase text-xs md:text-sm">
            Pasaje, El Oro • Colón e/ Sucre y Rocafuerte
          </span>
        </div>

        <h1 className="text-5xl md:text-7xl font-black text-white tracking-tight mb-4 drop-shadow-lg">
          IMPRENTA <br className="hidden md:block" />
          <span className="text-orange-500">CÓRDOVA</span>
        </h1>
        
        <p className="text-2xl md:text-3xl font-light text-white mb-8 italic">
          "El mejor servicio, <span className="font-bold text-orange-400">al menor tiempo</span>"
        </p>

        <p className="mt-2 max-w-2xl text-lg text-slate-300 mb-10 leading-relaxed">
          Expertos en gigantografías de alta definición, papelería comercial autorizada por el SRI y soluciones publicitarias integrales.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-5">
          <a href="#contact" className="px-8 py-4 bg-orange-600 text-white rounded-lg font-bold text-lg hover:bg-orange-500 transition-all shadow-lg shadow-orange-600/30 transform hover:-translate-y-1">
            Cotizar Ahora
          </a>
          <a href="#services" className="px-8 py-4 bg-transparent border-2 border-white/20 text-white rounded-lg font-bold text-lg hover:bg-white hover:text-blue-900 transition-all backdrop-blur-sm">
            Ver Catálogo
          </a>
        </div>
      </div>
    </section>
  );
};

export default Hero;