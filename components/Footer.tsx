import React from 'react';
import { Facebook, Instagram, Twitter, MessageCircle } from 'lucide-react';

const Footer: React.FC = () => {
  return (
    <footer className="bg-slate-950 text-slate-300 border-t border-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
          
          {/* Brand */}
          <div className="col-span-1 md:col-span-2">
            <h3 className="text-white text-2xl font-black mb-4 tracking-tight">IMPRENTA <span className="text-orange-500">CÓRDOVA</span></h3>
            <p className="text-slate-400 leading-relaxed mb-6 max-w-sm">
              Más de una década brindando soluciones de impresión de calidad en Pasaje. 
              Tecnología Roland para gigantografías y gestión autorizada del SRI.
            </p>
            <div className="inline-block bg-slate-900 px-3 py-1 rounded text-xs text-slate-500 font-mono border border-slate-800">
              RUC: 0702065319001
            </div>
          </div>

          {/* Links */}
          <div>
            <h3 className="text-white text-lg font-bold mb-6 border-b-2 border-orange-500 inline-block pb-1">Menú</h3>
            <ul className="space-y-3 text-sm">
              <li><a href="#home" className="hover:text-orange-400 transition-colors flex items-center"><span className="w-1.5 h-1.5 bg-orange-500 rounded-full mr-2"></span>Inicio</a></li>
              <li><a href="#services" className="hover:text-orange-400 transition-colors flex items-center"><span className="w-1.5 h-1.5 bg-orange-500 rounded-full mr-2"></span>Servicios SRI</a></li>
              <li><a href="#catalog" className="hover:text-orange-400 transition-colors flex items-center"><span className="w-1.5 h-1.5 bg-orange-500 rounded-full mr-2"></span>Catálogo</a></li>
              <li><a href="#contact" className="hover:text-orange-400 transition-colors flex items-center"><span className="w-1.5 h-1.5 bg-orange-500 rounded-full mr-2"></span>Ubicación</a></li>
            </ul>
          </div>

          {/* Social */}
          <div>
            <h3 className="text-white text-lg font-bold mb-6 border-b-2 border-orange-500 inline-block pb-1">Contacto</h3>
            <p className="text-sm text-slate-400 mb-4">
              Colón e/ Sucre y Rocafuerte <br />
              Pasaje, El Oro
            </p>
            <div className="flex space-x-4">
              <a href="#" className="bg-slate-800 p-2 rounded-full text-white hover:bg-blue-600 transition-colors">
                <span className="sr-only">Facebook</span>
                <Facebook className="h-5 w-5" />
              </a>
              <a href="https://wa.me/593993083943" className="bg-slate-800 p-2 rounded-full text-white hover:bg-green-600 transition-colors">
                <span className="sr-only">WhatsApp</span>
                <MessageCircle className="h-5 w-5" />
              </a>
              <a href="#" className="bg-slate-800 p-2 rounded-full text-white hover:bg-pink-600 transition-colors">
                <span className="sr-only">Instagram</span>
                <Instagram className="h-5 w-5" />
              </a>
            </div>
          </div>
        </div>
        
        <div className="border-t border-slate-900 mt-12 pt-8 text-center md:text-left flex flex-col md:flex-row justify-between items-center text-sm text-slate-500">
          <p>&copy; {new Date().getFullYear()} Imprenta Córdova. Todos los derechos reservados.</p>
          <p className="mt-2 md:mt-0">Diseñado con tecnología AI</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;