import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SEO } from '../components/SEO';
import PublicNavbar from '../components/PublicNavbar';
import { 
    BoxIcon, SparklesIcon, ArrowRightIcon, 
    LayersIcon, ShieldCheckIcon, WhatsAppIcon,
    SearchIcon, GridIcon, LayoutIcon
} from '../components/Icons';

const CATEGORIES = ['Todo', 'Gigantografía', 'SRI', 'Editorial', 'Comercial', 'Suministros'];

const PRODUCTS = [
    {
        id: 1,
        title: "Gigantografía Roland HD",
        category: "Gigantografía",
        description: "Impresión de alta resolución con tecnología japonesa Roland. Colores vibrantes y durabilidad industrial.",
        specs: ["Tinta Eco-Solvente", "Hasta 1440 DPI", "Resistente a Rayos UV"],
        image: "https://images.unsplash.com/photo-1598331668826-20cecc596b86?auto=format&fit=crop&q=80&w=1200",
        premium: true
    },
    {
        id: 2,
        title: "Comprobantes Autorizados SRI",
        category: "SRI",
        description: "Factureros, notas de venta y retenciones con validez legal inmediata. Gestión directa con el sistema SRI.",
        specs: ["Papel Químico Premium", "Folios Secuenciales", "Autorización Express"],
        image: "https://images.unsplash.com/photo-1554224155-1696413565d3?auto=format&fit=crop&q=80&w=1200",
        premium: true
    },
    {
        id: 3,
        title: "Empastados de Tesis Lujo",
        category: "Editorial",
        description: "Acabados de gala en cuero sintético, letras doradas/plateadas en bajo relieve. El estándar de oro para tu grado.",
        specs: ["Cosido a Mano", "Hot Stamping", "Papel Bond de 90g"],
        image: "https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&q=80&w=1200",
        premium: true
    },
    {
        id: 4,
        title: "Tarjetas de Presentación Elite",
        category: "Comercial",
        description: "Impresión offset con acabados táctiles, laminados mate o brillantes y cortes de precisión.",
        specs: ["Cartulina 300g", "Laminado UV", "Corte Troquelado"],
        image: "https://images.unsplash.com/photo-1589118949245-7d38baf380d6?auto=format&fit=crop&q=80&w=1200",
        premium: false
    }
];

const Vitrina: React.FC = () => {
    const [selectedCategory, setSelectedCategory] = useState('Todo');
    const [hoveredProduct, setHoveredProduct] = useState<number | null>(null);

    const filteredProducts = PRODUCTS.filter(p => 
        selectedCategory === 'Todo' || p.category === selectedCategory
    );

    return (
        <div className="min-h-screen bg-brand-dark text-white selection:bg-liquid-gold selection:text-brand-dark font-sans overflow-x-hidden">
            <SEO 
                title="Vitrina de Productos Elite | Catálogo Industrial" 
                description="Explore nuestra selección de servicios de impresión de alta gama, desde gigantografías Roland HD hasta comprobantes autorizados SRI." 
            />
            
            <PublicNavbar />

            {/* Cinematic Hero */}
            <section className="relative pt-40 pb-20 px-6 overflow-hidden">
                <div className="absolute inset-0 bg-architect-grid opacity-10" />
                <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-liquid-gold/5 blur-[150px] rounded-full -translate-y-1/2 translate-x-1/3" />
                
                <div className="container mx-auto relative z-10">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="max-w-4xl"
                    >
                        <div className="flex items-center gap-4 mb-8">
                            <div className="h-[1px] w-12 bg-liquid-gold" />
                            <span className="text-[10px] font-black tracking-[0.5em] text-liquid-gold uppercase italic">Catálogo de Producción</span>
                        </div>
                        <h1 className="text-6xl md:text-8xl font-black italic tracking-tighter uppercase mb-8 leading-[0.9]">
                            Vitrina <br />
                            <span className="text-gold-gradient">Industrial</span>
                        </h1>
                        <p className="text-slate-400 text-lg md:text-xl max-w-2xl leading-relaxed font-medium">
                            Donde la precisión técnica se encuentra con el arte visual. Cada pieza es procesada bajo estándares industriales de clase mundial.
                        </p>
                    </motion.div>
                </div>
            </section>

            {/* Categorization Hub */}
            <section className="sticky top-[88px] z-[100] bg-brand-dark/80 backdrop-blur-2xl border-y border-white/5 py-6">
                <div className="container mx-auto px-6 overflow-x-auto no-scrollbar">
                    <div className="flex items-center gap-4 min-w-max">
                        {CATEGORIES.map(cat => (
                            <button
                                key={cat}
                                onClick={() => setSelectedCategory(cat)}
                                className={`px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-500 italic ${
                                    selectedCategory === cat 
                                    ? 'bg-liquid-gold text-brand-dark shadow-gold-glow' 
                                    : 'bg-white/5 text-slate-400 hover:bg-white/10 border border-white/5'
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
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.9 }}
                                    transition={{ duration: 0.6, delay: idx * 0.1 }}
                                    onMouseEnter={() => setHoveredProduct(product.id)}
                                    onMouseLeave={() => setHoveredProduct(null)}
                                    className="group relative"
                                >
                                    <div className="elite-hud-card h-full p-8 lg:p-12 border border-white/10 hover:border-liquid-gold/40 transition-all duration-700 bg-gradient-to-br from-white/[0.03] to-transparent">
                                        
                                        {/* Status HUD */}
                                        <div className="flex justify-between items-start mb-12">
                                            <div className="flex flex-col gap-2">
                                                <span className="text-[10px] font-black text-liquid-gold/60 uppercase tracking-widest italic">{product.category}</span>
                                                <h3 className="text-3xl md:text-4xl font-black text-white italic uppercase tracking-tighter group-hover:text-gold-gradient transition-all duration-700">{product.title}</h3>
                                            </div>
                                            {product.premium && (
                                                <div className="px-4 py-2 bg-liquid-gold/10 border border-liquid-gold/30 rounded-lg flex items-center gap-3 animate-pulse">
                                                    <SparklesIcon className="w-4 h-4 text-liquid-gold" />
                                                    <span className="text-[10px] font-black text-liquid-gold tracking-widest">ELITE</span>
                                                </div>
                                            )}
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
                                            {/* Visual Node */}
                                            <div className="relative aspect-square rounded-3xl overflow-hidden border border-white/10">
                                                <img 
                                                    src={product.image} 
                                                    alt={product.title}
                                                    className="w-full h-full object-cover transition-transform duration-[2000ms] group-hover:scale-110"
                                                />
                                                <div className="absolute inset-0 bg-gradient-to-t from-brand-dark via-transparent to-transparent opacity-60" />
                                                
                                                {/* Scan Effect */}
                                                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-liquid-gold/20 to-transparent h-1 w-full animate-scan pointer-events-none opacity-0 group-hover:opacity-100" />
                                            </div>

                                            {/* Info Node */}
                                            <div className="space-y-8">
                                                <p className="text-slate-400 text-base leading-relaxed italic">
                                                    {product.description}
                                                </p>
                                                
                                                <div className="space-y-4">
                                                    {product.specs.map(spec => (
                                                        <div key={spec} className="flex items-center gap-4 text-white/80 group/spec">
                                                            <div className="w-2 h-2 rounded-full bg-liquid-gold/40 group-hover/spec:scale-150 transition-transform duration-500" />
                                                            <span className="text-[11px] font-black uppercase tracking-widest italic">{spec}</span>
                                                        </div>
                                                    ))}
                                                </div>

                                                <a 
                                                    href={`https://wa.me/593993083943?text=Hola,%20me%20interesa%20información%20sobre%20${encodeURIComponent(product.title)}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="inline-flex items-center gap-4 px-10 py-5 bg-white/5 border border-white/10 rounded-2xl text-[10px] font-black tracking-[0.3em] uppercase hover:bg-liquid-gold hover:text-brand-dark transition-all duration-500 group/btn"
                                                >
                                                    <WhatsAppIcon className="w-5 h-5" />
                                                    COTIZACIÓN_INMEDIATA
                                                    <ArrowRightIcon className="w-4 h-4 transition-transform group-hover/btn:translate-x-2" />
                                                </a>
                                            </div>
                                        </div>

                                        {/* HUD Decorative */}
                                        <div className="absolute bottom-4 right-8 opacity-20 group-hover:opacity-100 transition-opacity">
                                            <span className="text-[8px] font-mono text-slate-500 uppercase tracking-[0.5em]">STATUS: AVAI_PRD_{product.id}</span>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                </div>
            </section>

            {/* CTA Ecosystem */}
            <section className="py-40 px-6 relative overflow-hidden">
                <div className="absolute inset-0 bg-liquid-gold/5" />
                <div className="container mx-auto text-center relative z-10">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        className="max-w-4xl mx-auto elite-hud-card p-16 md:p-24 border-liquid-gold/20"
                    >
                        <h2 className="text-4xl md:text-6xl font-black italic uppercase tracking-tighter mb-8 leading-none">
                            ¿Necesita un <br />
                            <span className="text-gold-gradient">Proyecto Especial?</span>
                        </h2>
                        <p className="text-slate-400 text-lg mb-12 italic">
                            Diseñamos soluciones personalizadas para su empresa. Gestión técnica, legal y creativa en un solo lugar.
                        </p>
                        <div className="flex flex-wrap justify-center gap-6">
                            <a href="tel:+593993083943" className="px-12 py-6 bg-liquid-gold text-brand-dark rounded-2xl text-[12px] font-black tracking-widest hover:scale-105 transition-all shadow-gold-glow">
                                LLAMAR_DIRECTO
                            </a>
                            <Link to="/tracking" className="px-12 py-6 bg-white/5 border border-white/10 text-white rounded-2xl text-[12px] font-black tracking-widest hover:bg-white/10 transition-all">
                                RASTREAR_ORDEN
                            </Link>
                        </div>
                    </motion.div>
                </div>
            </section>

            <footer className="py-20 border-t border-white/5 px-6">
                <div className="container mx-auto">
                    <div className="flex flex-col md:flex-row justify-between items-center gap-12 text-slate-500">
                        <div className="flex flex-col items-center md:items-start gap-4">
                            <span className="text-[10px] font-black uppercase tracking-[0.4em]">IMPRENTA CÓRDOVA © 2024</span>
                            <span className="text-[8px] font-mono">STABILITY_PROTOCOL_REV_9.0</span>
                        </div>
                        <div className="flex gap-8">
                            <a href="#" className="hover:text-liquid-gold transition-colors italic text-[10px] font-black uppercase tracking-widest">Facebook</a>
                            <a href="#" className="hover:text-liquid-gold transition-colors italic text-[10px] font-black uppercase tracking-widest">Instagram</a>
                            <a href="#" className="hover:text-liquid-gold transition-colors italic text-[10px] font-black uppercase tracking-widest">Behance</a>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default Vitrina;
