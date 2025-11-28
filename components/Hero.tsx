
import React from 'react';
import { MapPin, Clock } from 'lucide-react';
import { WhatsAppIcon, ArrowRightIcon } from './Icons';

const Hero: React.FC = () => {
  return (
    <section id="home" className="relative bg-blue-900 overflow-hidden min-h-[90vh] flex items-center">
      {/* Background Image Overlay */}
      <div className="absolute inset-0 opacity-20 bg-[url('https://images.unsplash.com/photo-1562654501-a0ccc0fc3fb1?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80')] bg-cover bg-center animate-pulse-slow"></div>
      
      {/* Gradient Overlay - Optimized for readability */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-950 via-blue-900/95 to-indigo-900/90"></div>
      
      {/* Decorative Circles */}
      <div className="absolute top-0 right-0 -mt-20 -mr-20 w-96 h-96 bg-orange-500 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob"></div>
      <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob animation-delay-2000"></div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 flex flex-col items-center text-center">
        
        {/* Badges */}
        <div className="flex flex-col sm:flex-row gap-3 mb-8 animate-fade-in-down">
          <div className="inline-flex items-center bg-blue-800/60 rounded-full px-4 py-1.5 border border-blue-700/50 backdrop-blur-sm">
            <MapPin className="w-4 h-4 text-orange-400 mr-2" />
            <span className="text-slate-100 font-medium tracking-wide text-xs md:text-sm">
              Pasaje, El Oro • Colón e/ Sucre
            </span>
          </div>
          <div className="hidden sm:inline-flex items-center bg-blue-800/60 rounded-full px-4 py-1.5 border border-blue-700/50 backdrop-blur-sm">
            <Clock className="w-4 h-4 text-orange-400 mr-2" />
            <span className="text-slate-100 font-medium tracking-wide text-xs md:text-sm">
              Entrega Rápida Garantizada
            </span>
          </div>
        </div>

        <h1 className="text-5xl md:text-7xl lg:text-8xl font-black text-white tracking-tight mb-6 drop-shadow-2xl">
          IMPRENTA <br className="hidden md:block" />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-orange-600">CÓRDOVA</span>
        </h1>
        
        <p className="text-2xl md:text-4xl font-light text-white mb-8 italic">
          "El mejor servicio, <span className="font-bold text-orange-400 border-b-2 border-orange-500/50">al menor tiempo</span>"
        </p>

        <p className="mt-4 max-w-2xl text-lg md:text-xl text-slate-300 mb-12 leading-relaxed">
          Especialistas en gigantografías HD, facturación SRI y material publicitario que hace destacar tu negocio en Pasaje.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-5 w-full sm:w-auto">
          <a 
            href="#contact" 
            className="group px-8 py-4 bg-orange-600 text-white rounded-xl font-bold text-lg hover:bg-orange-500 transition-all duration-300 shadow-lg shadow-orange-600/30 transform hover:-translate-y-1 hover:scale-105 hover:shadow-orange-500/50 flex items-center justify-center active:scale-95"
          >
            <WhatsAppIcon className="w-5 h-5 mr-2 transition-transform duration-300 group-hover:rotate-12" />
            Cotizar por WhatsApp
          </a>
          <a 
            href="#catalog" 
            className="group px-8 py-4 bg-white/10 border border-white/20 text-white rounded-xl font-bold text-lg hover:bg-white hover:text-blue-900 transition-all duration-300 backdrop-blur-sm flex items-center justify-center transform hover:-translate-y-1 hover:scale-105 hover:shadow-lg active:scale-95"
          >
            Ver Catálogo
            <ArrowRightIcon className="w-5 h-5 ml-2 transition-transform duration-300 group-hover:translate-x-1" />
          </a>
        </div>
      </div>
    </section>
  );
};

export default Hero;
