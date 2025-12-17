
import React, { useState, useRef, useEffect } from 'react';
import { CordovaLogo, UserPlusIcon, CheckCircleIcon, ArrowRightIcon, ShieldCheckIcon, PhoneIcon, EnvelopeIcon, Loader2Icon } from '../components/Icons';
import { createCliente } from '../services/mockApi';
import { Regimen } from '../types';

type Step = 'IDLE' | 'FORM' | 'SUCCESS';

const KioskInput: React.FC<{ 
    label: string; 
    icon: React.FC<any>; 
    value: string; 
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void; 
    placeholder?: string;
    type?: string;
    autoFocus?: boolean;
}> = ({ label, icon: Icon, value, onChange, placeholder, type = 'text', autoFocus }) => (
    <div className="space-y-2">
        <label className="text-gray-600 font-bold text-lg uppercase tracking-wide ml-1">{label}</label>
        <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-6 flex items-center pointer-events-none">
                <Icon className="h-8 w-8 text-gray-400 group-focus-within:text-brand-blue transition-colors" />
            </div>
            <input 
                type={type}
                value={value}
                onChange={onChange}
                placeholder={placeholder}
                autoFocus={autoFocus}
                className="block w-full pl-20 pr-6 py-6 bg-gray-50 border-2 border-gray-200 rounded-3xl text-2xl font-medium text-gray-900 placeholder-gray-300 focus:outline-none focus:border-brand-blue focus:bg-white focus:ring-4 focus:ring-blue-100 transition-all shadow-sm"
            />
        </div>
    </div>
);

const QuioscoPage: React.FC = () => {
    const [step, setStep] = useState<Step>('IDLE');
    const [loading, setLoading] = useState(false);
    
    // Form Data
    const [nombre, setNombre] = useState('');
    const [identificacion, setIdentificacion] = useState('');
    const [telefono, setTelefono] = useState('');
    const [email, setEmail] = useState('');

    const idleTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Auto-reset if inactive in Form mode
    useEffect(() => {
        const resetTimer = () => {
            if (idleTimeoutRef.current) clearTimeout(idleTimeoutRef.current);
            if (step === 'FORM') {
                idleTimeoutRef.current = setTimeout(() => {
                    resetForm();
                }, 60000); // 60s inactivity reset
            }
        };

        window.addEventListener('touchstart', resetTimer);
        window.addEventListener('click', resetTimer);
        window.addEventListener('keypress', resetTimer);

        return () => {
            window.removeEventListener('touchstart', resetTimer);
            window.removeEventListener('click', resetTimer);
            window.removeEventListener('keypress', resetTimer);
            if (idleTimeoutRef.current) clearTimeout(idleTimeoutRef.current);
        };
    }, [step]);

    const resetForm = () => {
        setStep('IDLE');
        setNombre('');
        setIdentificacion('');
        setTelefono('');
        setEmail('');
        setLoading(false);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!nombre || !identificacion) return;

        setLoading(true);
        
        try {
            await createCliente({
                nombre: nombre.toUpperCase(),
                cedula: identificacion,
                ruc: identificacion.length === 13 ? identificacion : undefined,
                telefono: [telefono || ''],
                email: email,
                regimen: Regimen.GENERAL,
                // Etiqueta especial para que el operador sepa que vino del quiosco
                notas: `🔴 REGISTRO DESDE QUIOSCO - ${new Date().toLocaleTimeString()}` 
            });

            setStep('SUCCESS');
            
            // Auto reset after success
            setTimeout(() => {
                resetForm();
            }, 6000);

        } catch (error) {
            console.error("Error creating client", error);
            // En caso de error, podríamos mostrar un mensaje, pero para el quiosco
            // es mejor simplemente resetear o intentar de nuevo silenciosamente para no trabar el flujo.
            alert("Hubo un problema al registrar. Por favor avise al operador.");
            setLoading(false);
        }
    };

    // --- IDLE SCREEN ---
    if (step === 'IDLE') {
        return (
            <div 
                onClick={() => setStep('FORM')}
                className="min-h-screen bg-brand-blue flex flex-col items-center justify-center p-8 text-center cursor-pointer relative overflow-hidden"
            >
                {/* Animated Background Blobs */}
                <div className="absolute top-0 left-0 w-96 h-96 bg-blue-500 rounded-full blur-3xl opacity-20 animate-blob"></div>
                <div className="absolute bottom-0 right-0 w-96 h-96 bg-purple-500 rounded-full blur-3xl opacity-20 animate-blob animation-delay-2000"></div>

                <div className="relative z-10 animate-fade-in-up">
                    <div className="bg-white/10 backdrop-blur-md p-8 rounded-3xl inline-block mb-12 shadow-2xl border border-white/10">
                        <CordovaLogo className="h-32 w-auto object-contain brightness-0 invert" />
                    </div>
                    
                    <h1 className="text-6xl font-black text-white mb-6 tracking-tight drop-shadow-lg">
                        BIENVENIDO
                    </h1>
                    <p className="text-2xl text-blue-100 font-light mb-16 max-w-lg mx-auto leading-relaxed">
                        Para agilizar su atención, por favor regístrese aquí.
                    </p>

                    <button className="bg-white text-brand-blue px-12 py-6 rounded-full font-black text-2xl shadow-[0_0_40px_rgba(255,255,255,0.4)] animate-pulse hover:scale-105 transition-transform flex items-center gap-4 mx-auto">
                        <span className="bg-brand-blue text-white rounded-full p-2">
                            <UserPlusIcon className="w-8 h-8" />
                        </span>
                        TOQUE PARA EMPEZAR
                    </button>
                </div>
                
                <div className="absolute bottom-8 text-white/40 font-bold text-sm uppercase tracking-[0.5em]">
                    Imprenta Córdova • Auto-Servicio
                </div>
            </div>
        );
    }

    // --- SUCCESS SCREEN ---
    if (step === 'SUCCESS') {
        return (
            <div className="min-h-screen bg-green-500 flex flex-col items-center justify-center p-8 text-center animate-fade-in">
                <div className="bg-white rounded-full p-8 shadow-2xl mb-8 animate-bounce-in">
                    <CheckCircleIcon className="w-40 h-40 text-green-500" />
                </div>
                <h2 className="text-6xl font-black text-white mb-6">¡REGISTRO EXITOSO!</h2>
                <p className="text-3xl text-green-100 font-medium max-w-2xl leading-relaxed">
                    Por favor tome asiento. <br/>
                    Su nombre ya aparece en nuestro sistema.
                </p>
                <div className="mt-16 w-full max-w-md bg-green-600/30 rounded-full h-2 overflow-hidden">
                    <div className="bg-white h-full animate-[width_6s_linear_forwards]" style={{ width: '0%' }}></div>
                </div>
            </div>
        );
    }

    // --- FORM SCREEN ---
    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            {/* Header */}
            <div className="bg-white p-6 shadow-sm flex justify-between items-center border-b border-gray-200">
                <div className="flex items-center gap-4">
                    <button 
                        onClick={resetForm}
                        className="p-4 bg-gray-100 rounded-2xl text-gray-500 hover:bg-gray-200 transition-colors"
                    >
                        <ArrowRightIcon className="w-8 h-8 transform rotate-180" />
                    </button>
                    <h2 className="text-3xl font-black text-gray-800">NUEVO CLIENTE</h2>
                </div>
                <CordovaLogo className="h-12 w-auto" />
            </div>

            {/* Form Content */}
            <div className="flex-grow p-8 overflow-y-auto">
                <form onSubmit={handleSubmit} className="max-w-3xl mx-auto space-y-8 bg-white p-10 rounded-3xl shadow-xl border border-gray-100">
                    
                    <KioskInput 
                        label="Nombre Completo / Razón Social" 
                        icon={UserPlusIcon} 
                        value={nombre} 
                        onChange={e => setNombre(e.target.value.toUpperCase())}
                        placeholder="Ej: JUAN PEREZ"
                        autoFocus
                    />

                    <KioskInput 
                        label="Cédula o RUC" 
                        icon={ShieldCheckIcon} 
                        value={identificacion} 
                        onChange={e => setIdentificacion(e.target.value.replace(/\D/g, ''))} // Solo números
                        placeholder="Ej: 0704..."
                        type="tel" // Teclado numérico
                    />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <KioskInput 
                            label="Celular (WhatsApp)" 
                            icon={PhoneIcon} 
                            value={telefono} 
                            onChange={e => setTelefono(e.target.value.replace(/\D/g, ''))}
                            placeholder="099..."
                            type="tel"
                        />
                        <KioskInput 
                            label="Correo Electrónico (Opcional)" 
                            icon={EnvelopeIcon} 
                            value={email} 
                            onChange={e => setEmail(e.target.value.toLowerCase())}
                            placeholder="usuario@email.com"
                            type="email"
                        />
                    </div>

                    <div className="pt-8">
                        <button 
                            type="submit" 
                            disabled={!nombre || !identificacion || loading}
                            className={`
                                w-full py-6 rounded-2xl font-black text-3xl text-white shadow-xl transition-all transform active:scale-95 flex items-center justify-center gap-4
                                ${!nombre || !identificacion ? 'bg-gray-300 cursor-not-allowed' : 'bg-brand-blue hover:bg-blue-800 hover:shadow-2xl'}
                            `}
                        >
                            {loading ? (
                                <>
                                    <Loader2Icon className="w-10 h-10 animate-spin" />
                                    GUARDANDO...
                                </>
                            ) : (
                                <>
                                    <CheckCircleIcon className="w-10 h-10" />
                                    TERMINAR REGISTRO
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
            
            <div className="p-6 text-center text-gray-400 font-medium uppercase tracking-widest">
                ¿Ya está registrado? Solo avise su nombre al operador.
            </div>
        </div>
    );
};

export default QuioscoPage;
