import React, { useState, useEffect } from 'react';
import { Menu, X, Printer } from 'lucide-react';

const Navbar: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  const toggleMenu = () => setIsOpen(!isOpen);

  // Add shadow on scroll
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { name: 'Inicio', href: '#home' },
    { name: 'Servicios', href: '#services' },
    { name: 'Catálogo', href: '#catalog' },
    { name: 'Asistente IA', href: '#ai-helper' },
    { name: 'Contacto', href: '#contact' },
  ];

  return (
    <nav className={`fixed w-full top-0 z-50 transition-all duration-300 ${scrolled ? 'bg-white/90 backdrop-blur-md shadow-md border-b border-slate-200/50' : 'bg-white border-b border-slate-100'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-20">
          <div className="flex items-center">
            <div className="flex-shrink-0 flex items-center cursor-pointer group" onClick={() => window.location.hash = '#home'}>
              <div className="bg-blue-900 p-2 rounded-lg mr-3 group-hover:bg-blue-800 transition-colors shadow-sm">
                <Printer className="h-6 w-6 text-white" />
              </div>
              <div className="flex flex-col">
                <span className="text-blue-900 font-black text-xl leading-none tracking-tight">IMPRENTA</span>
                <span className="text-orange-600 font-bold text-sm tracking-widest">CÓRDOVA</span>
              </div>
            </div>
          </div>
          
          {/* Desktop Menu */}
          <div className="hidden md:flex items-center space-x-8">
            {navLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                className="text-slate-600 hover:text-blue-900 font-medium transition-colors text-sm uppercase tracking-wide relative after:content-[''] after:absolute after:w-0 after:h-0.5 after:bg-orange-500 after:left-0 after:-bottom-1 after:transition-all hover:after:w-full"
              >
                {link.name}
              </a>
            ))}
            <a href="#contact" className="bg-orange-500 text-white px-5 py-2.5 rounded-full hover:bg-orange-600 transition-all font-bold shadow-md hover:shadow-lg transform hover:-translate-y-0.5 text-sm flex items-center">
              Cotizar Ahora
            </a>
          </div>

          {/* Mobile Menu Button */}
          <div className="flex items-center md:hidden">
            <button
              onClick={toggleMenu}
              className="inline-flex items-center justify-center p-2 rounded-md text-slate-400 hover:text-blue-900 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
            >
              <span className="sr-only">Abrir menú</span>
              {isOpen ? <X className="block h-6 w-6" /> : <Menu className="block h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="md:hidden bg-white border-t border-slate-200 shadow-xl">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            {navLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                onClick={() => setIsOpen(false)}
                className="block px-3 py-2 rounded-md text-base font-medium text-slate-700 hover:text-orange-600 hover:bg-slate-50 border-l-4 border-transparent hover:border-orange-500 transition-all"
              >
                {link.name}
              </a>
            ))}
            <a 
              href="#contact"
              onClick={() => setIsOpen(false)}
              className="block w-full text-center mt-4 bg-orange-500 text-white px-4 py-3 rounded-md font-bold hover:bg-orange-600 shadow-sm"
            >
              Cotizar Ahora
            </a>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;