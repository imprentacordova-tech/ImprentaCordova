import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { 
    ChevronRightIcon, WhatsAppIcon, 
    ShieldCheckIcon, ActivityIcon,
    RocketLaunchIcon, CpuIcon,
    HomeIcon
} from '../components/Icons';
import { generateWhatsAppLink } from '../utils';
import { SEO } from '../components/SEO';
import PublicNavbar from '../components/PublicNavbar';

const VisualLanding: React.FC = () => {
    const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            setMousePosition({ x: e.clientX, y: e.clientY });
        };
        window.addEventListener('mousemove', handleMouseMove);
        return () => window.removeEventListener('mousemove', handleMouseMove);
    }, []);

    return (
        <div className="min-h-screen bg-brand-light text-slate-900 font-sans selection:bg-brand-blue/10 overflow-x-hidden relative">
            <SEO 
                title="IMPRENTA CÓRDOVA | Excelencia Visual & Minimalismo Industrial"
                description="Liderando la manufactura gráfica en Ecuador con un enfoque minimalista y tecnológico. Precisión absoluta para marcas modernas."
            />
            
            <PublicNavbar />
            
            {/* --- LIGHT TECH BACKGROUND --- */}
            <div className="fixed inset-0 z-0 pointer-events-none">
                <div className="absolute top-[-10%] right-[-10%] w-[800px] h-[800px] bg-brand-blue/5 blur-[120px] rounded-full animate-pulse" />
                <div className="absolute bottom-[-10%] left-[-10%] w-[1000px] h-[1000px] bg-sky-400/5 blur-[150px] rounded-full" />
                <div className="absolute inset-0 bg-architect-grid opacity-30" />
            </div>

            {/* --- DYNAMIC SCANNER (LIGHT THEME) --- */}
            <div 
                className="fixed w-[400px] h-[400px] pointer-events-none z-[60] border-[0.5px] border-slate-200 rounded-full hidden lg:block transition-transform duration-700 ease-out"
                style={{ 
                    left: mousePosition.x - 200,
                    top: mousePosition.y - 200,
                    background: 'radial-gradient(circle, rgba(14,165,233,0.05) 0%, transparent 70%)',
                }}
            >
                <div className="absolute top-1/2 left-0 w-full h-[0.5px] bg-brand-blue/20" />
                <div className="absolute top-0 left-1/2 w-[0.5px] h-full bg-brand-blue/20" />
            </div>

            <main className="relative z-10 pt-32">
                {/* --- HERO: MINIMALIST MONOLITH --- */}
                <header className="relative min-h-[90vh] flex items-center justify-center overflow-hidden">
                    <div className="container mx-auto px-6 lg:px-14 text-center">
                        <motion.div
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 1, ease: "easeOut" }}
                        >
                            <div className="inline-flex items-center gap-4 px-6 py-2.5 rounded-full bg-white border border-slate-200 mb-12 shadow-sm">
                                <div className="w-2 h-2 rounded-full bg-brand-blue animate-ping" />
                                <span className="text-[10px] font-black uppercase tracking-[0.5em] text-slate-400">
                                    Manufactura de Precisión
                                </span>
                            </div>

                            <div className="mb-16">
                                <h1 className="text-6xl md:text-8xl lg:text-[11rem] font-black leading-[0.8] tracking-[-0.05em] mb-4">
                                    EXCELENCIA<br />
                                    <span className="text-blue-gradient">VISUAL.</span>
                                </h1>
                                <p className="text-slate-400 font-medium text-lg md:text-2xl max-w-2xl mx-auto tracking-wide leading-relaxed">
                                    Redefiniendo el estándar gráfico industrial a través de un flujo de trabajo minimalista y tecnológico.
                                </p>
                            </div>

                            <div className="flex flex-col sm:flex-row items-center justify-center gap-8">
                                <Link
                                    to="/vitrina"
                                    className="w-full sm:w-auto px-12 py-6 bg-brand-blue text-white rounded-[2rem] font-black uppercase tracking-[0.3em] text-[11px] shadow-blue-glow-strong hover:scale-105 active:scale-95 transition-all"
                                >
                                    Explorar Capacidades
                                </Link>

                                <Link
                                    to="/tracking"
                                    className="w-full sm:w-auto px-12 py-6 bg-white border border-slate-200 text-slate-900 rounded-[2rem] font-black uppercase tracking-[0.3em] text-[11px] hover:border-brand-blue/30 transition-all flex items-center justify-center gap-4 shadow-sm"
                                >
                                    <ActivityIcon className="w-5 h-5 text-brand-blue" /> Rastreo IA
                                </Link>
                            </div>
                        </motion.div>
                    </div>
                </header>

                {/* --- WORKFLOW: THE GRID --- */}
                <section className="py-40 bg-white border-y border-slate-100">
                    <div className="container mx-auto px-6 lg:px-14">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                            {[
                                { title: "Diseño Técnico", desc: "Conceptualización de alta fidelidad para marcas que exigen perfección." },
                                { title: "Manufactura", desc: "Producción industrial con tecnología de vanguardia y cero errores." },
                                { title: "Logística Inteligente", desc: "Entrega optimizada y seguimiento en tiempo real vía Gemini IA." }
                            ].map((item, idx) => (
                                <motion.div 
                                    key={idx}
                                    whileHover={{ y: -10 }}
                                    className="p-12 bg-slate-50 rounded-[3rem] border border-slate-100 group transition-all"
                                >
                                    <div className="text-5xl font-black text-brand-blue/10 mb-8 italic">0{idx + 1}</div>
                                    <h3 className="text-2xl font-black mb-4 text-slate-900">{item.title}</h3>
                                    <p className="text-slate-500 leading-relaxed font-medium">{item.desc}</p>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* --- CONVERSION CENTER --- */}
                <section className="py-40 relative">
                    <div className="container mx-auto px-6 lg:px-14 text-center">
                        <div className="max-w-4xl mx-auto p-16 md:p-32 rounded-[4rem] bg-brand-light border border-slate-200 shadow-luxury relative overflow-hidden">
                            <div className="absolute -top-10 -right-10 w-64 h-64 bg-brand-blue/5 blur-[80px] rounded-full" />
                            
                            <h2 className="text-5xl md:text-7xl font-black mb-10 leading-none">
                                ¿LISTO PARA EL<br />
                                <span className="text-blue-gradient">SIGUIENTE NIVEL?</span>
                            </h2>
                            <p className="text-slate-500 text-lg md:text-xl mb-16 font-medium max-w-xl mx-auto">
                                Nuestro equipo industrial está listo para procesar sus requerimientos con la máxima prioridad.
                            </p>
                            
                            <a 
                                href={generateWhatsAppLink("593993083943", "Consulta Industrial Córdova.")}
                                className="inline-flex items-center gap-6 px-16 py-8 bg-brand-blue text-white rounded-3xl font-black uppercase tracking-[0.4em] text-xs shadow-blue-glow-strong hover:scale-105 active:scale-95 transition-all"
                            >
                                <WhatsAppIcon className="w-6 h-6" /> CANAL DIRECTO
                            </a>
                        </div>
                    </div>
                </section>
            </main>

            <footer className="py-32 bg-brand-light border-t border-slate-200">
                <div className="container mx-auto px-6 lg:px-14 text-center">
                    <div className="flex justify-center gap-12 mb-16 opacity-40 grayscale">
                        <HomeIcon className="w-6 h-6" />
                        <ShieldCheckIcon className="w-6 h-6" />
                        <CpuIcon className="w-6 h-6" />
                    </div>
                    <p className="text-[10px] font-black uppercase tracking-[0.8em] text-slate-300">
                        Imprenta Córdova &copy; {new Date().getFullYear()} &mdash; Visual Excellence Hub
                    </p>
                </div>
            </footer>

            {/* --- FLOATING WHATSAPP (LIGHT) --- */}
            <motion.a 
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                whileHover={{ scale: 1.1 }}
                href={generateWhatsAppLink("593993083943", "Atención inmediata.")}
                className="fixed bottom-10 right-10 z-[200] w-16 h-16 bg-brand-blue text-white rounded-2xl flex items-center justify-center shadow-blue-glow-strong"
            >
                <WhatsAppIcon className="w-8 h-8" />
            </motion.a>
        </div>
    );
};

export default VisualLanding;
