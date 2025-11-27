import React from 'react';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import Services from './components/Services';
import Catalog from './components/Catalog';
import AIHelper from './components/AIHelper';
import Contact from './components/Contact';
import Footer from './components/Footer';

function App() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar />
      <main className="flex-grow">
        <Hero />
        <Services />
        <Catalog />
        <AIHelper />
        <Contact />
      </main>
      <Footer />
    </div>
  );
}

export default App;