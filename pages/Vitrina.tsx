import React, { useState, useEffect } from 'react';
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
    const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            setMousePosition({ x: e.clientX, y: e.clientY });
        };
        window.addEventListener('mousemove', handleMouseMove);
        return () => window.removeEventListener('mousemove', handleMouseMove);
    }, []);

    const filteredProducts = PRODUCTS.filter(p => 
        selectedCategory === 'Todo' || p.category === selectedCategory
    );

    return (
        <div className="min-h-screen bg-[#020617] text-white font-sans selection:bg-liquid-gold/20 overflow-x-hidden relative">
            <SEO 
                title="Vitrina de Capacidades | Imprenta Córdova" 
                description="Explore nuestra selección de servicios de impresión de alta gama bajo un flujo de trabajo minimalista y eficiente." 
            />
            
            <PublicNavbar />

            {/* --- OBSIDIAN TECH BACKGROUND --- */}
            <div className="fixed inset-0 z-0 pointer-events-none">
                <div className="absolute top-[-10%] right-[-10%] w-[800px] h-[800px] bg-liquid-gold/5 blur-[120px] rounded-full animate-pulse" />
                <div className="absolute bottom-[-10%] left-[-10%] w-[1000px] h-[1000px] bg-yellow-600/5 blur-[150px] rounded-full" />
                <div className="absolute inset-0 bg-architect-grid opacity-10" />
                <div className="absolute inset-0 bg-noise opacity-[0.02] mix-blend-overlay" />
            </div>

            {/* --- GOLD PARTICLES --- */}
            <div className="fixed inset-0 z-0 pointer-events-none">
                {[...Array(15)].map((_, i) => (
                    <motion.div
                        key={i}
                        animate={{
                            y: [0, -100, 0],
                            x: [0, Math.random() * 40 - 20, 0],
                            opacity: [0.1, 0.3, 0.1],
                            scale: [1, 1.2, 1]
                        }}
                        transition={{
                            duration: 12 + Math.random() * 8,
                            repeat: Infinity,
                            ease: "easeInOut",
                            delay: Math.random() * 5
                        }}
                        className="absolute w-1 h-1 bg-liquid-gold rounded-full blur-[1px]"
                        style={{
                            top: `${Math.random() * 100}%`,
                            left: `${Math.random() * 100}%`
                        }}
                    />
                ))}
            </div>

            {/* --- PRECISION SCANNER --- */}
            <div 
                className="fixed w-[300px] h-[300px] pointer-events-none z-[110] border-[0.5px] border-white/10 rounded-full hidden lg:block transition-transform duration-700 ease-out"
                style={{ 
                    left: mousePosition.x - 150,
                    top: mousePosition.y - 150,
                    background: 'radial-gradient(circle, rgba(212,175,55,0.02) 0%, transparent 70%)',
                }}
            >
                <div className="absolute top-1/2 left-0 w-full h-[0.5px] bg-liquid-gold/10" />
                <div className="absolute top-0 left-1/2 w-[0.5px] h-full bg-liquid-gold/10" />
            </div>

            {/* Cinematic Hero */}
            <section className="relative pt-40 pb-20 px-6 overflow-hidden z-10">
                <div className="container mx-auto relative z-10">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="max-w-4xl"
                    >
                        <div className="flex items-center gap-4 mb-8">
                            <div className="h-[1.5px] w-12 bg-liquid-gold shadow-gold-glow" />
                            <span className="text-[10px] font-black tracking-[0.5em] text-liquid-gold uppercase">Portafolio Industrial</span>
                        </div>
                        <h1 className="text-6xl md:text-8xl font-black tracking-tighter uppercase mb-8 leading-[0.9]">
                            VITRINA DE <br />
                            <span className="bg-gradient-to-r from-[#D4AF37] via-[#F3E5AB] to-[#AA7C11] bg-clip-text text-transparent font-black drop-shadow-[0_0_15px_rgba(212,175,55,0.1)]">CAPACIDADES.</span>
                        </h1>
                        <p className="text-slate-400 text-lg md:text-xl max-w-2xl leading-relaxed font-medium">
                            Donde la precisión tecnológica se encuentra con la pureza del diseño. Cada solución está optimizada para la excelencia visual.
                        </p>
                    </motion.div>
                </div>
            </section>

            {/* Categorization Hub - Minimalist Sticky */}
            <section className="sticky top-[80px] z-[100] bg-[#020617]/80 backdrop-blur-3xl border-y border-white/5 py-6">
                <div className="container mx-auto px-6 overflow-x-auto no-scrollbar relative z-10">
                    <div className="flex items-center gap-4 min-w-max">
                        {CATEGORIES.map(cat => (
                            <button
                                key={cat}
                                onClick={() => setSelectedCategory(cat)}
                                className={`px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all duration-500 ${
                                    selectedCategory === cat 
                                    ? 'bg-liquid-gold text-slate-950 shadow-gold-glow' 
                                    : 'bg-white/5 text-slate-400 hover:text-white border border-white/5 hover:bg-white/10'
                                }`}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>
                </div>
            </section>

            {/* Product Matrix */}
            <section className="py-24 px-6 relative z-10">
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
                                    <div className="glass-card-luxury h-full p-8 lg:p-12 bg-white/5 backdrop-blur-xl border border-white/5 hover:border-liquid-gold/20 hover:-translate-y-2 transition-all duration-700 rounded-[2.5rem] shadow-luxury relative overflow-hidden group">
                                        <div className="absolute top-0 right-0 w-32 h-32 bg-liquid-gold/5 blur-3xl -mr-16 -mt-16 group-hover:bg-liquid-gold/10 transition-colors duration-500" />
                                        
                                        <div className="flex justify-between items-start mb-12">
                                            <div className="flex flex-col gap-2">
                                                <span className="text-[10px] font-black text-liquid-gold/60 uppercase tracking-widest">{product.category}</span>
                                                <h3 className="text-3xl md:text-4xl font-black text-white uppercase tracking-tighter group-hover:text-liquid-gold transition-all duration-700">{product.title}</h3>
                                            </div>
                                            {product.premium && (
                                                <div className="px-4 py-2 bg-liquid-gold/10 border border-liquid-gold/20 rounded-xl flex items-center gap-3 shadow-gold-glow-soft">
                                                    <SparklesIcon className="w-4 h-4 text-liquid-gold animate-pulse" />
                                                    <span className="text-[10px] font-black text-liquid-gold tracking-widest">PREMIUM</span>
                                                </div>
                                            )}
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
                                            <div className="relative aspect-square rounded-[2rem] overflow-hidden border border-white/10 shadow-luxury">
                                                <img 
                                                    src={product.image} 
                                                    alt={product.title}
                                                    className="w-full h-full object-cover transition-transform duration-[2000ms] group-hover:scale-110"
                                                />
                                                <div className="absolute inset-0 bg-gradient-to-t from-black/45 to-transparent" />
                                            </div>

                                            <div className="space-y-8">
                                                <p className="text-slate-400 text-base leading-relaxed font-medium">
                                                    {product.description}
                                                </p>
                                                
                                                <div className="space-y-4">
                                                    {product.specs.map(spec => (
                                                        <div key={spec} className="flex items-center gap-4 text-slate-300 group/spec">
                                                            <div className="w-2 h-2 rounded-full bg-liquid-gold/40 group-hover/spec:bg-liquid-gold transition-colors duration-500 shadow-gold-glow-soft" />
                                                            <span className="text-[11px] font-black uppercase tracking-widest">{spec}</span>
                                                        </div>
                                                    ))}
                                                </div>

                                                <a 
                                                    href={`https://wa.me/593993083943?text=Hola,%20me%20interesa%20información%20sobre%20${encodeURIComponent(product.title)}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="w-full inline-flex items-center justify-center gap-4 px-8 py-5 bg-white/5 border border-white/10 rounded-2xl text-[10px] font-black tracking-[0.3em] uppercase hover:bg-liquid-gold hover:text-slate-950 hover:border-liquid-gold transition-all duration-500 group/btn shadow-luxury"
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

            {/* CTA Ecosystem - Minimalist Dark */}
            <section className="py-40 px-6 relative overflow-hidden z-10 border-t border-white/5">
                <div className="absolute inset-0 bg-liquid-gold/[0.02] opacity-50" />
                <div className="container mx-auto text-center relative z-10">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        className="max-w-4xl mx-auto p-16 md:p-24 rounded-[4rem] bg-white/5 backdrop-blur-xl border border-white/5 shadow-luxury relative overflow-hidden"
                    >
                        <div className="absolute -top-10 -right-10 w-64 h-64 bg-liquid-gold/5 blur-[80px] rounded-full" />
                        <h2 className="text-4xl md:text-7xl font-black uppercase tracking-tighter mb-8 leading-none">
                            ¿TIENE UNA <br />
                            <span className="bg-gradient-to-r from-[#D4AF37] via-[#F3E5AB] to-[#AA7C11] bg-clip-text text-transparent font-black">VISIÓN ÚNICA?</span>
                        </h2>
                        <p className="text-slate-400 text-lg md:text-xl mb-12 font-medium">
                            Transformamos sus requerimientos técnicos en productos de alta fidelidad con acabados de lujo.
                        </p>
                        <div className="flex flex-wrap justify-center gap-6">
                            <a href="tel:+593993083943" className="px-12 py-6 bg-liquid-gold text-slate-950 rounded-2xl text-[12px] font-black tracking-widest hover:bg-white hover:scale-105 transition-all shadow-gold-glow">
                                LLAMADA_DIRECTA
                            </a>
                            <Link to="/tracking" className="px-12 py-6 bg-white/5 border border-white/10 text-white rounded-2xl text-[12px] font-black tracking-widest hover:bg-white/10 hover:border-liquid-gold/30 hover:scale-105 active:scale-95 transition-all shadow-luxury">
                                RASTREAR_ORDEN
                            </Link>
                        </div>
                    </motion.div>
                </div>
            </section>

            <footer className="py-20 border-t border-white/5 px-6 bg-transparent relative z-10">
                <div className="container mx-auto text-center">
                    <p className="text-[10px] font-black uppercase tracking-[0.8em] text-slate-500">
                        IMPRENTA CÓRDOVA &copy; 2024 &mdash; MINIMALIST FLOW v2.0
                    </p>
                </div>
            </footer>
        </div>
    );
};

export default Vitrina;
