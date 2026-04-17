
import React from 'react';
import { Facebook, Instagram, Twitter, MessageCircle } from 'lucide-react';
import { CordovaLogo } from './Icons';

const Footer: React.FC = () => {
  return (
    <footer className="bg-slate-950 text-slate-300 border-t border-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
          
          {/* Brand */}
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center gap-3 mb-4">
                <div className="p-1.5 rounded-lg bg-white/5">
                    <CordovaLogo className="h-12 w-auto object-contain" />
                </div>
                <h3 className="text-white text-2xl font-black tracking-tight">IMPRENTA <span className="text-orange-500">CÓRDOVA</span></h3>
            </div>
            <p className="text-slate-400 leading-relaxed mb-6 max-w-sm">
              Más de una década brindando soluciones de impresión de calidad en Pasaje. 
              Tecnología Roland para gigantografías y gestión autorizada del SRI.
            </p>
            <div className="inline-block bg-slate-900 px-3 py-1 rounded-full text-xs font-semibold text-slate-300">
              Servicio Autorizado
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;