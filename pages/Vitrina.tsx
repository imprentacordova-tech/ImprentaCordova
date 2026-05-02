import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SEO } from '../components/SEO';
import PublicNavbar from '../components/PublicNavbar';
import { 
    SparklesIcon, ArrowRightIcon, 
    WhatsAppIcon
} from '../components/Icons';
import { Link } from 'react-router-dom';

const CATEGORIES = ['Todo', 'Gigantografía', 'SRI', 'Editorial', 'Comercial', 'Suministros'];

const PRODUCTS = [
    {
        id: 1,
        title: "Gigantografía Roland HD",
        category: "Gigantografía",
        description: "Impresión de alta resolución con tecnología japonesa Roland. Colores vibrantes y precisión micrométrica.",
        specs: ["Tinta Eco-Solvente", "Hasta 1440 DPI", "Resistente a Rayos UV"],
        image: "https://images.unsplash.com/photo-1598331668826-20cecc596b86?auto=format&fit=crop&q=80&w=1200",
        premium: true
    },
    {
        id: 2,
        title: "Comprobantes Autorizados SRI",
        category: "SRI",
        description: "Factureros y notas de venta con validez legal inmediata. Gestión directa y segura con el sistema SRI.",
        specs: ["Papel Químico Premium", "Folios Secuenciales", "Autorización Express"],
        image: "https://images.unsplash.com/photo-1554224155-1696413565d3?auto=format&fit=crop&q=80&w=1200",
        premium: true
    },
    {
        id: 3,
        title: "Empastados de Tesis Lujo",
        category: "Editorial",
        description: "Acabados de gala en cuero sintético y letras grabadas. El estándar supremo para proyectos académicos.",
        specs: ["Cosido Artesanal", "Grabado en Relieve", "Papel Bond de 90g"],
        image: "https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&q=80&w=1200",
        premium: true
    },
    {
        id: 4,
        title: "Tarjetas de Presentación Elite",
        category: "Comercial",
        description: "Impresión offset con acabados mate de tacto seda. Diseñadas para dejar una impresión duradera.",
        specs: ["Cartulina 300g", "Laminado Pro", "Corte de Precisión"],
        image: "https://images.unsplash.com/photo-1589118949245-7d38baf380d6?auto=format&fit=crop&q=80&w=1200",
        premium: false
    }
];

const Vitrina: React.FC = () => {
    const [selectedCategory, setSelectedCategory] = useState('Todo');

    const filteredProducts = PRODUCTS.filter(p => 
        selectedCategory === 'Todo' || p.category === selectedCategory
    );

    return (
        <div className="min-h-screen bg-brand-light text-slate-900 selection:bg-brand-blue/10 font-sans overflow-x-hidden">
            <SEO 
                title="Vitrina de Capacidades | Imprenta Córdova" 
                description="Explore nuestra selección de servicios de impresión de alta gama bajo un flujo de trabajo minimalista y eficiente." 
            />
            
            <PublicNavbar />

            {/* Cinematic Hero - Light Theme */}
            <section className="relative pt-40 pb-20 px-6 overflow-hidden">
                <div className="absolute inset-0 bg-architect-grid opacity-30" />
                <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-brand-blue/5 blur-[150px] rounded-full -translate-y-1/2 translate-x-1/3" />
                
                <div className="container mx-auto relative z-10">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="max-w-4xl"
                    >
                        <div className="flex items-center gap-4 mb-8">
                            <div className="h-[1.5px] w-12 bg-brand-blue" />
                            <span className="text-[10px] font-black tracking-[0.5em] text-slate-400 uppercase">Portafolio Industrial</span>
                        </div>
                        <h1 className="text-6xl md:text-8xl font-black tracking-tighter uppercase mb-8 leading-[0.9]">
                            VITRINA DE <br />
                            <span className="text-blue-gradient">CAPACIDADES.</span>
                        </h1>
                        <p className="text-slate-500 text-lg md:text-xl max-w-2xl leading-relaxed font-medium">
                            Donde la precisión tecnológica se encuentra con la pureza del diseño. Cada solución está optimizada para la excelencia visual.
                        </p>
                    </motion.div>
                </div>
            </section>

            {/* Categorization Hub - Minimalist Sticky */}
            <section className="sticky top-[88px] z-[100] bg-white/80 backdrop-blur-3xl border-y border-slate-100 py-6">
                <div className="container mx-auto px-6 overflow-x-auto no-scrollbar">
                    <div className="flex items-center gap-4 min-w-max">
                        {CATEGORIES.map(cat => (
                            <button
                                key={cat}
                                onClick={() => setSelectedCategory(cat)}
                                className={`px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all duration-500 ${
                                    selectedCategory === cat 
                                    ? 'bg-brand-blue text-white shadow-blue-glow-strong' 
                                    : 'bg-slate-50 text-slate-400 hover:text-slate-900 border border-slate-100'
                                }`}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>
                </div>
            </section>

            {/* Product Matrix */}
            <section className="py-24 px-6">
                <div className="container mx-auto">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                        <AnimatePresence mode='popLayout'>
                            {filteredProducts.map((product, idx) => (
                                <motion.div
                                    key={product.id}
                                    layout
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    transition={{ duration: 0.6, delay: idx * 0.1 }}
                                    className="group relative"
                                >
                                    <div className="elite-hud-card h-full p-8 lg:p-12 border border-slate-100 hover:border-brand-blue/30 transition-all duration-700 bg-white">
                                        
                                        <div className="flex justify-between items-start mb-12">
                                            <div className="flex flex-col gap-2">
                                                <span className="text-[10px] font-black text-brand-blue/60 uppercase tracking-widest">{product.category}</span>
                                                <h3 className="text-3xl md:text-4xl font-black text-slate-900 uppercase tracking-tighter group-hover:text-brand-blue transition-all duration-700">{product.title}</h3>
                                            </div>
                                            {product.premium && (
                                                <div className="px-4 py-2 bg-brand-blue/5 border border-brand-blue/10 rounded-xl flex items-center gap-3">
                                                    <SparklesIcon className="w-4 h-4 text-brand-blue" />
                                                    <span className="text-[10px] font-black text-brand-blue tracking-widest">PREMIUM</span>
                                                </div>
                                            )}
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
                                            <div className="relative aspect-square rounded-[2rem] overflow-hidden border border-slate-100 shadow-sm">
                                                <img 
                                                    src={product.image} 
                                                    alt={product.title}
                                                    className="w-full h-full object-cover transition-transform duration-[2000ms] group-hover:scale-110"
                                                />
                                                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/10 to-transparent" />
                                            </div>

                                            <div className="space-y-8">
                                                <p className="text-slate-500 text-base leading-relaxed font-medium">
                                                    {product.description}
                                                </p>
                                                
                                                <div className="space-y-4">
                                                    {product.specs.map(spec => (
                                                        <div key={spec} className="flex items-center gap-4 text-slate-700 group/spec">
                                                            <div className="w-2 h-2 rounded-full bg-brand-blue/40 group-hover/spec:bg-brand-blue transition-colors duration-500" />
                                                            <span className="text-[11px] font-black uppercase tracking-widest">{spec}</span>
                                                        </div>
                                                    ))}
                                                </div>

                                                <a 
                                                    href={`https://wa.me/593993083943?text=Hola,%20me%20interesa%20información%20sobre%20${encodeURIComponent(product.title)}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="w-full inline-flex items-center justify-center gap-4 px-8 py-5 bg-slate-50 border border-slate-200 rounded-2xl text-[10px] font-black tracking-[0.3em] uppercase hover:bg-brand-blue hover:text-white hover:border-brand-blue transition-all duration-500 group/btn shadow-sm"
                                                >
                                                    <WhatsAppIcon className="w-5 h-5" />
                                                    COTIZAR AHORA
                                                    <ArrowRightIcon className="w-4 h-4 transition-transform group-hover/btn:translate-x-2" />
                                                </a>
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                </div>
            </section>

            {/* CTA Ecosystem - Minimalist Light */}
            <section className="py-40 px-6 relative overflow-hidden bg-white border-t border-slate-100">
                <div className="absolute inset-0 bg-brand-blue/5 opacity-50" />
                <div className="container mx-auto text-center relative z-10">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        className="max-w-4xl mx-auto p-16 md:p-24 rounded-[4rem] bg-white border border-slate-100 shadow-luxury"
                    >
                        <h2 className="text-4xl md:text-7xl font-black uppercase tracking-tighter mb-8 leading-none">
                            ¿TIENE UNA <br />
                            <span className="text-blue-gradient">VISIÓN ÚNICA?</span>
                        </h2>
                        <p className="text-slate-500 text-lg md:text-xl mb-12 font-medium">
                            Transformamos sus requerimientos técnicos en productos de alta fidelidad con acabados de lujo.
                        </p>
                        <div className="flex flex-wrap justify-center gap-6">
                            <a href="tel:+593993083943" className="px-12 py-6 bg-brand-blue text-white rounded-2xl text-[12px] font-black tracking-widest hover:scale-105 transition-all shadow-blue-glow-strong">
                                LLAMADA_DIRECTA
                            </a>
                            <Link to="/tracking" className="px-12 py-6 bg-slate-50 border border-slate-200 text-slate-900 rounded-2xl text-[12px] font-black tracking-widest hover:bg-white transition-all shadow-sm">
                                RASTREAR_ORDEN
                            </Link>
                        </div>
                    </motion.div>
                </div>
            </section>

            <footer className="py-20 border-t border-slate-100 px-6 bg-brand-light">
                <div className="container mx-auto text-center">
                    <p className="text-[10px] font-black uppercase tracking-[0.8em] text-slate-300">
                        IMPRENTA CÓRDOVA &copy; 2024 &mdash; MINIMALIST FLOW v2.0
                    </p>
                </div>
            </footer>
        </div>
    );
};

export default Vitrina;
