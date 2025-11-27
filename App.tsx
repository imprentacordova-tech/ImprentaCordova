import React from 'react';
import { MessageCircle } from 'lucide-react';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import Services from './components/Services';
import Catalog from './components/Catalog';
import AIHelper from './components/AIHelper';
import Contact from './components/Contact';
import Footer from './components/Footer';

function App() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col relative">
      <Navbar />
      <main className="flex-grow">
        <Hero />
        <Services />
        <Catalog />
        <AIHelper />
        <Contact />
      </main>
      <Footer />
      
      {/* Floating WhatsApp Button */}
      <a 
        href="https://wa.me/593993083943?text=Hola%20Imprenta%20C%C3%B3rdova%2C%20quisiera%20m%C3%A1s%20informaci%C3%B3n" 
        target="_blank" 
        rel="noreferrer"
        className="fixed bottom-6 right-6 z-50 bg-green-500 hover:bg-green-600 text-white p-4 rounded-full shadow-2xl transition-all duration-300 hover:scale-110 flex items-center justify-center group"
        aria-label="Chatear por WhatsApp"
      >
        <MessageCircle className="w-8 h-8" />
        <span className="absolute right-full mr-3 bg-white text-slate-800 px-3 py-1 rounded-lg text-sm font-bold shadow-md opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap hidden md:block">
          ¡Chatea con nosotros!
        </span>
      </a>
    </div>
  );
}

export default App;