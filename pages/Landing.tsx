
import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { 
    ShieldCheckIcon, BoxIcon, PhoneIcon, ShoppingCartIcon, 
    CloseIcon, TrashIcon, AddIcon, ArrowRightIcon, MapPinIcon, 
    CordovaLogo, StarIcon, CheckBadgeIcon, ClockIcon, 
    SparklesIcon, PrinterIcon, MessageCircleIcon, SendIcon, GlobeAltIcon, 
    FileTextIcon, BuildingStorefrontIcon, SearchIcon, MonitorIcon, CheckCircleIcon,
    CalculatorIcon, UsersIcon, EnvelopeIcon, InfoIcon, PaletteIcon, DocumentTextIcon, ReceiptIcon
} from '../components/Icons';
import { getProductos, createPublicPedido } from '../services/mockApi';
import { Producto, Regimen } from '../types';
import { formatCurrency } from '../utils';

const LOGO_URL = "https://i.imgur.com/kzhXFkE.png";

// Scroll Suave
const scrollToSection = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault();
    const element = document.getElementById(id);
    if (element) {
        window.scrollTo({
            top: element.offsetTop - 80,
            behavior: 'smooth'
        });
    }
};

// --- COMPONENTES ADICIONALES PARA PAGINA COMPLETA ---

const PortfolioSection: React.FC = () => {
    const projects = [
        { id: 1, title: "Identidad Corporativa", category: "Branding", img: "https://images.unsplash.com/photo-1626785774573-4b7993143a2d?auto=format&fit=crop&q=80&w=600" },
        { id: 2, title: "Campaña Publicitaria", category: "Gigantografías", img: "https://images.unsplash.com/photo-1562564055-71e051d33c19?auto=format&fit=crop&q=80&w=600" },
        { id: 3, title: "Packaging Premium", category: "Etiquetas", img: "https://images.unsplash.com/photo-1586717791821-3f44a5638d0f?auto=format&fit=crop&q=80&w=600" },
        { id: 4, title: "Material P.O.P.", category: "Exhibidores", img: "https://images.unsplash.com/photo-1544982503-9f984c14501a?auto=format&fit=crop&q=80&w=600" }
    ];

    return (
        <section id="portfolio" className="py-24 bg-white dark:bg-slate-950">
            <div className="container mx-auto px-6">
                <div className="flex flex-col items-center text-center mb-16">
                    <span className="text-brand-red font-black tracking-[0.4em] uppercase text-[10px] mb-4 block">Nuestro Trabajo</span>
                    <h2 className="text-4xl font-black text-brand-navy dark:text-white uppercase tracking-tighter italic">GALERÍA DE <span className="text-brand-red">ÉXITO</span></h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                    {projects.map(p => (
                        <div key={p.id} className="group relative overflow-hidden rounded-[2.5rem] shadow-xl aspect-square">
                            <img src={p.img} alt={p.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                            <div className="absolute inset-0 bg-gradient-to-t from-brand-navy/90 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex flex-col justify-end p-8">
                                <span className="text-[10px] font-black text-brand-red uppercase tracking-widest mb-1">{p.category}</span>
                                <h3 className="text-white font-black uppercase tracking-tight">{p.title}</h3>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

const TestimonialsSection: React.FC = () => {
    const reviews = [
        { name: "Juan Pérez", role: "Comerciante", text: "Excelente atención y los talonarios del SRI siempre a tiempo. Totalmente recomendado.", rating: 5 },
        { name: "María Auxiliadora", role: "Empresaria", text: "La calidad de las gigantografías es impresionante. El color es exacto a lo que pedí.", rating: 5 },
        { name: "Roberto Sánchez", role: "Administrador", text: "Precios competitivos y un servicio al cliente excepcional en Pasaje.", rating: 5 }
    ];

    return (
        <section id="testimonials" className="py-24 bg-slate-50 dark:bg-slate-900">
            <div className="container mx-auto px-6">
                <div className="text-center mb-16">
                    <h2 className="text-3xl font-black uppercase tracking-tighter">Voces de Confianza</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {reviews.map((r, i) => (
                        <div key={i} className="bg-white dark:bg-slate-800 p-8 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700">
                            <div className="flex gap-1 mb-4">
                                {[...Array(r.rating)].map((_, i) => <StarIcon key={i} className="w-4 h-4 text-yellow-400 fill-current" />)}
                            </div>
                            <p className="text-slate-600 dark:text-slate-300 italic mb-6">"{r.text}"</p>
                            <p className="font-bold text-slate-900 dark:text-white">{r.name}</p>
                            <p className="text-xs text-slate-400 uppercase font-black">{r.role}</p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

const LandingPage: React.FC = () => {
    return (
        <div className="min-h-screen bg-white dark:bg-slate-950 font-sans">
            {/* Simple Navbar */}
            <nav className="fixed top-0 w-full z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-100 dark:border-slate-800 py-4 px-6">
                <div className="container mx-auto flex justify-between items-center">
                    <div className="flex items-center gap-2">
                        <CordovaLogo className="h-8 w-auto" />
                        <span className="text-xl font-black text-brand-navy dark:text-white uppercase tracking-tighter">Imprenta <span className="text-brand-red">Córdova</span></span>
                    </div>
                    <div className="flex gap-6 items-center">
                         <Link to="/tracking" className="text-xs font-black uppercase tracking-widest text-slate-500 hover:text-brand-blue transition-colors">Seguimiento</Link>
                         <Link to="/login" className="bg-brand-blue text-white px-6 py-2 rounded-full font-bold text-sm hover:bg-brand-navy transition-all">Acceso Personal</Link>
                    </div>
                </div>
            </nav>

            {/* Hero Lite */}
            <section className="pt-32 pb-20 bg-brand-blue text-white text-center">
                <div className="container mx-auto px-6">
                    <h1 className="text-5xl lg:text-7xl font-black mb-6 uppercase tracking-tighter italic">Excelencia en <br/><span className="text-brand-red">Impresión</span></h1>
                    <p className="text-xl text-blue-100 max-w-2xl mx-auto mb-10 font-light">Líderes en Pasaje para gigantografías, facturación autorizada SRI y material corporativo de alto nivel.</p>
                    <div className="flex justify-center gap-4">
                        <Link to="/tracking" className="bg-white text-brand-blue px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl hover:bg-slate-100 transition-all">Rastrear Pedido</Link>
                        <a href="#portfolio" onClick={(e) => scrollToSection(e, 'portfolio')} className="bg-brand-red text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl hover:bg-red-700 transition-all">Ver Galería</a>
                    </div>
                </div>
            </section>

            <PortfolioSection />
            <TestimonialsSection />

            <footer className="bg-slate-900 text-white py-12 border-t border-slate-800">
                <div className="container mx-auto px-6 text-center">
                    <p className="text-slate-500 text-sm font-bold uppercase tracking-[0.3em]">Imprenta Córdova &copy; 2025</p>
                    <p className="text-slate-600 text-[10px] mt-2 uppercase tracking-widest">Pasaje, El Oro, Ecuador</p>
                </div>
            </footer>
        </div>
    );
};

// Fix: Adding the missing default export to resolve error in App.tsx
export default LandingPage;
