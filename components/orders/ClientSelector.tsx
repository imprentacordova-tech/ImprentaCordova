import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Cliente, Regimen } from '../../types';
import { useData } from '../../contexts/DataContext';
import { useAuth } from '../../contexts/AuthContext';
import { extractDataFromSriPdf, fileToBase64 } from '../../services/pdfExtraction';
import { extractClientFromImage } from '../../services/geminiService';
import {
    establecimientoSugerido,
    establecimientosAbiertos,
    normalizarEstablecimientos,
} from '../../services/establecimientos';
import { sriLookupService } from '../../services/sriLookupService';
import { logActivity } from '../../services/activityLogService';
import { formatCurrency } from '../../utils';
import {
    SearchIcon, Loader2Icon,
    CheckCircleIcon, ArrowRightIcon,
    UploadIcon, PlusIcon
} from '../Icons';

const InputField: React.FC<{
    label: string;
    name: string;
    value: any;
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
    isHighlighted?: boolean;
    error?: string;
    required?: boolean;
    type?: string;
    placeholder?: string;
    maxLength?: number;
}> = ({ label, name, value, onChange, isHighlighted, error, required, type = "text", placeholder, maxLength }) => (
    <div className="space-y-1">
        <label htmlFor={name} className="block text-[10px] font-black uppercase tracking-wider text-slate-500">
            {label} {required && <span className="text-red-500">*</span>}
        </label>
        <input
            id={name}
            name={name}
            type={type}
            value={value}
            onChange={onChange}
            maxLength={maxLength}
            placeholder={placeholder}
            className={`w-full bg-slate-50 border px-4 py-3 rounded-xl text-slate-900 font-bold text-sm outline-none transition-all ${
                error
                    ? 'border-red-300 focus:border-red-500 focus:ring-2 focus:ring-red-100'
                    : isHighlighted
                    ? 'border-brand-blue bg-brand-blue/5 focus:ring-2 focus:ring-brand-blue/10'
                    : 'border-slate-200 focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/10'
            }`}
        />
        {error && <p className="text-[10px] text-red-500 font-bold mt-1">{error}</p>}
    </div>
);

type ClientMode = 'EXPRESS' | 'SRI';

export const CreateClientModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onClientCreated: (client: Cliente) => void;
    initialName?: string;
    initialCedulaRuc?: string;
    isLocked?: boolean;
}> = ({ isOpen, onClose, onClientCreated, initialName = '', initialCedulaRuc = '', isLocked = false }) => {
    const [mode, setMode] = useState<ClientMode>('SRI');
    const [isSaving, setIsSaving] = useState(false);
    const [, setSaveSuccess] = useState(false);
    const [isScanning, setIsScanning] = useState(false);
    const [, setHighlightFields] = useState<string[]>([]);
    const [rucError, setRucError] = useState<string | null>(null);
    const { addCliente, clientes: clientesRegistrados, trabajos, getClientDebt } = useData();
    const { user } = useAuth();

    const [newClienteData, setNewClienteData] = useState({
        nombre: initialName,
        nombreComercial: '',
        cedulaRuc: initialCedulaRuc,
        email: '',
        direccion: 'Pasaje, El Oro',
        regimen: Regimen.GENERAL,
        numEstablecimientosOpen: 1,
        establecimientoPredeterminado: '001',
        puntoEmisionPredeterminado: '001',
        fiscal_data: {} as any
    });

    /**
     * Cliente reconocido (paso 3 del handoff): si la cédula/RUC tecleada ya existe en el
     * padrón local, se ofrece reutilizar la ficha con su historial en vez de duplicarla.
     */
    const clienteReconocido = useMemo(() => {
        const val = (newClienteData.cedulaRuc || '').replace(/\D/g, '');
        if (val.length < 10) return null;
        return clientesRegistrados.find(c => c.cedula === val || c.ruc === val) || null;
    }, [newClienteData.cedulaRuc, clientesRegistrados]);

    const historialReconocido = useMemo(() => {
        if (!clienteReconocido) return null;
        const suyos = (trabajos ?? []).filter(t => t.clienteId === clienteReconocido.id);
        const ultima = suyos
            .slice()
            .sort((a, b) => +new Date(b.fechaEntrada) - +new Date(a.fechaEntrada))[0];
        return {
            ordenes: suyos.length,
            ultima: ultima ? `${ultima.tipo || 'Trabajo'} · ${new Date(ultima.fechaEntrada).toLocaleDateString('es-EC', { day: '2-digit', month: 'short', year: 'numeric' })}` : 'Sin órdenes previas',
            deuda: getClientDebt(clienteReconocido.id),
        };
    }, [clienteReconocido, trabajos, getClientDebt]);

    const [telefonos, setTelefonos] = useState<string[]>([]);
    const [currentTelefono, setCurrentTelefono] = useState('');
    const [actividades, setActividades] = useState<string[]>([]);

    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (isOpen) {
            setNewClienteData(prev => ({
                ...prev,
                nombre: initialName || prev.nombre,
                cedulaRuc: initialCedulaRuc || prev.cedulaRuc
            }));
        }
    }, [isOpen, initialName, initialCedulaRuc]);

    useEffect(() => {
        const performLookup = async () => {
            const val = newClienteData.cedulaRuc.trim();
            if (!val || val === '9999999999' || val === '9999999999999') {
                setRucError(null);
                return;
            }

            if (val.length < 10) {
                setRucError('El RUC o cédula debe tener al menos 10 dígitos.');
                return;
            }

            setRucError(null);
            /* Si ya es cliente nuestro, la ficha local manda: no se sobrescribe con el padrón. */
            if (clientesRegistrados.some(c => c.cedula === val || c.ruc === val)) return;
            const rucData = await sriLookupService.lookupByRuc(val);
            if (rucData) {
                applyExtractedData({
                    nombre: rucData.razon_social,
                    ruc: rucData.ruc,
                    direccion: rucData.direccion || `${rucData.canton}, ${rucData.parroquia}`,
                    regimen: rucData.regimen || 'GENERAL',
                    actividades: rucData.actividad_economica
                });
            }
        };

        performLookup();
    }, [newClienteData.cedulaRuc, mode, clientesRegistrados]);

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setIsScanning(true);
        try {
            /*
             * El input acepta "image/*,.pdf" desde siempre, pero acá se llamaba SIEMPRE al
             * parser de PDF: subir la FOTO del RUC (lo más común desde el celular) moría con
             * "Error al procesar PDF", porque pdfjs no puede abrir un JPEG.
             *
             * Para imágenes va la lectura con IA. Además de arreglar ese caso, es la única
             * fuente que devuelve la LISTA de establecimientos: el parser mecánico sólo
             * cuenta cuántos hay, así que sin este camino `fiscal_data.establecimientos`
             * nunca se llenaba.
             */
            if (file.type.startsWith('image/')) {
                const data = await extractClientFromImage(await fileToBase64(file));
                if (!data) {
                    setRucError('No se pudo leer la imagen del RUC. Probá con el PDF del SRI o completá la ficha a mano.');
                    return;
                }
                applyExtractedData({
                    nombre: data.nombre,
                    ruc: data.ruc,
                    direccion: data.direccion,
                    regimen: data.regimen,
                    email: data.email,
                    telefono: data.telefono,
                    numEstablecimientos: data.numEstablecimientos,
                    establecimientoPrincipal: data.establecimientoPrincipal,
                    establecimientos: data.establecimientos,
                    actividades: data.actividades,
                });
                setMode('SRI');
                return;
            }

            const result = await extractDataFromSriPdf(file);
            if (result) {
                applyExtractedData({
                    nombre: result.apellidos_nombres,
                    ruc: result.ruc,
                    direccion: result.direccion,
                    regimen: result.regimen,
                    email: result.contacto?.email,
                    telefono: result.contacto?.celular,
                    numEstablecimientos: result.cantidad_establecimientos,
                    establecimientoPrincipal: '001',
                    actividades: result.actividad_economica
                });
                setMode('SRI');
            }
        } catch (error) {
            console.error("Error al leer el certificado del SRI:", error);
            setRucError("Error al procesar el archivo. Asegúrese de que sea un certificado del SRI.");
        } finally {
            setIsScanning(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const applyExtractedData = (data: any) => {
        const fields = ['nombre', 'cedulaRuc', 'direccion', 'regimen', 'telefono'];
        setHighlightFields(fields);

        let regimenFinal = Regimen.GENERAL;
        if (typeof data.regimen === 'string') {
            const raw = data.regimen.toUpperCase();
            if (raw.includes('POPULAR')) regimenFinal = Regimen.NEGOCIO_POPULAR;
            else if (raw.includes('EMPRENDEDOR')) regimenFinal = Regimen.EMPRENDEDOR;
            else if (raw.includes('GENERAL')) regimenFinal = Regimen.GENERAL;
            else regimenFinal = data.regimen as Regimen;
        }

        /*
         * CONTINUITY_RULES.md §6: los establecimientos ABIERTOS son un dato fiscal, no un
         * detalle de pantalla. Se normalizan y se guardan en la ficha para que el talonario
         * pueda elegirlos después sin depender de que alguien los recuerde.
         *
         * Cuando la fuente no trae la lista (hoy: el parser mecánico del PDF, que sólo
         * devuelve un conteo) se conserva el comportamiento anterior en vez de inventar
         * filas: `fiscal_data.establecimientos` queda vacío y la ficha sigue siendo válida.
         */
        const establecimientos = normalizarEstablecimientos(data.establecimientos);
        const abiertos = establecimientosAbiertos(establecimientos);

        setNewClienteData({
            nombre: data.nombre || '',
            nombreComercial: data.nombreComercial || '',
            cedulaRuc: data.ruc || '',
            email: data.email || '',
            direccion: data.direccion || 'Pasaje, El Oro',
            regimen: regimenFinal,
            /*
             * Con lista manda la lista (y sólo cuentan los ABIERTOS); sin lista se usa el
             * conteo que ya traía la extracción.
             */
            numEstablecimientosOpen: establecimientos.length > 0
                ? abiertos.length
                : (data.numEstablecimientos || 1),
            establecimientoPredeterminado: establecimientoSugerido(establecimientos)
                || data.establecimientoPrincipal
                || '001',
            puntoEmisionPredeterminado: data.puntoEmisionPrincipal || '001',
            fiscal_data: {
                razon_social: data.nombre,
                nombre_comercial: data.nombreComercial || data.nombre,
                estado_contribuyente: 'ACTIVO',
                tipo_contribuyente: data.tipoPersona || 'PERSONA NATURAL',
                obligado_contabilidad: data.obligadoContabilidad || false,
                actividades: data.actividades ? data.actividades.split('|').map((a: string) => ({ descripcion: a.trim() })) : [],
                establecimientos,
                ultima_sincronizacion: new Date().toISOString()
            }
        });

        if (data.telefono) {
            const rawPhones = data.telefono.split(/[,;]/);
            const cleanPhones = rawPhones.map((p: string) => p.replace(/\D/g, '')).filter((p: string) => p.length >= 7);
            setTelefonos(Array.from(new Set([...cleanPhones])));
        }

        if (data.actividades) {
            const cleaned = data.actividades.split(/[|\n•]/)
                .map((a: string) => a.trim().toUpperCase())
                .filter((a: string) => a.length > 4);
            setActividades(cleaned.filter((item: string, index: number, self: string[]) => self.indexOf(item) === index));
        }
        setTimeout(() => setHighlightFields([]), 3000);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (mode === 'SRI' && rucError) return;

        const finalId = newClienteData.cedulaRuc || '9999999999';
        setIsSaving(true);

        try {
            const newCliente = await addCliente({
                ...newClienteData,
                cedula: finalId,
                ruc: mode === 'SRI' ? newClienteData.cedulaRuc : undefined,
                actividades: actividades.join(' • '),
                telefono: telefonos.length > 0 ? telefonos : (currentTelefono ? [currentTelefono] : ['0990000000']),
                regimen: mode === 'EXPRESS' ? Regimen.GENERAL : newClienteData.regimen,
                fiscal_data: mode === 'SRI' ? {
                    ...newClienteData.fiscal_data,
                    razon_social: newClienteData.nombre,
                    nombre_comercial: newClienteData.nombreComercial || newClienteData.nombre,
                    actividades: actividades.map(a => ({ codigo: '', descripcion: a })),
                    ultima_sincronizacion: new Date().toISOString()
                } : undefined
            });
            setSaveSuccess(true);

            /*
             * Auditoría obligatoria (CONTINUITY_RULES.md). De paso deja constancia de cuántos
             * establecimientos abiertos se registraron: si más adelante un talonario sale con
             * un código equivocado, acá está el dato con el que se dio de alta la ficha.
             */
            const registrados = establecimientosAbiertos(
                (newClienteData.fiscal_data as any)?.establecimientos,
            );
            logActivity(
                user?.nombre || 'Sistema',
                user?.rol || 'Operador',
                'CREAR_CLIENTE',
                registrados.length > 0
                    ? `Registrado: ${newCliente.nombre} · RUC con ${registrados.length} establecimiento(s) abierto(s)`
                    : `Registrado: ${newCliente.nombre}`,
                'Entidades',
            ).catch(() => {});

            setTimeout(() => onClientCreated(newCliente), 400);
        } catch (err: any) {
            console.error("Error al registrar cliente:", err);
            setIsSaving(false);
            setRucError(err.message || 'Error en la conexión con la base de datos');
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={onClose} />

            <div className="bg-white w-full max-w-4xl max-h-[90vh] rounded-3xl shadow-2xl relative z-10 flex flex-col overflow-hidden border border-slate-200">
                {/* Header */}
                <div className="p-6 border-b border-slate-200 flex items-center justify-between bg-slate-50">
                    <div>
                        <span className="text-[10px] font-black text-brand-blue uppercase tracking-widest block">Directorio de Clientes</span>
                        <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">
                            {mode === 'EXPRESS' ? 'Registrar Cliente General' : 'Registrar Cliente SRI Fiscal'}
                        </h2>
                    </div>

                    <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-700 rounded-xl transition-colors">
                        ✕
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 overflow-y-auto space-y-6 flex-1">
                    {/* Tabs Express vs SRI */}
                    {!isLocked && (
                        <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200 max-w-md">
                            <button
                                type="button"
                                onClick={() => setMode('EXPRESS')}
                                className={`flex-1 py-2 rounded-lg text-[10px] font-black uppercase transition-all ${
                                    mode === 'EXPRESS' ? 'bg-white text-slate-900 shadow-sm font-bold' : 'text-slate-500 hover:text-slate-800'
                                }`}
                            >
                                Cliente Comercial
                            </button>
                            <button
                                type="button"
                                onClick={() => setMode('SRI')}
                                className={`flex-1 py-2 rounded-lg text-[10px] font-black uppercase transition-all ${
                                    mode === 'SRI' ? 'bg-brand-blue text-white shadow-sm font-bold' : 'text-slate-500 hover:text-slate-800'
                                }`}
                            >
                                Cliente SRI (RUC)
                            </button>
                        </div>
                    )}

                    {/* Escaneo de PDF RUC opcional */}
                    {mode === 'SRI' && (
                        <div
                            onClick={() => fileInputRef.current?.click()}
                            className="p-4 bg-slate-50 border-2 border-dashed border-slate-300 hover:border-brand-blue rounded-xl text-center cursor-pointer transition-all space-y-1"
                        >
                            <UploadIcon className="w-5 h-5 text-brand-blue mx-auto" />
                            <span className="text-[11px] font-bold text-slate-800 uppercase block">
                                {isScanning ? 'Analizando el certificado del SRI...' : 'Auto-completar subiendo PDF o foto del RUC SRI'}
                            </span>
                            <input type="file" ref={fileInputRef} className="hidden" accept="image/*,.pdf" onChange={handleFileUpload} />
                        </div>
                    )}

                    <form id="create-client-form" onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <InputField
                                label="Nombre / Razón Social"
                                name="nombre"
                                value={newClienteData.nombre}
                                onChange={e => setNewClienteData({ ...newClienteData, nombre: e.target.value.toUpperCase() })}
                                required
                                placeholder="Ej. Juan Pérez / Empresa S.A."
                            />

                            {mode === 'SRI' && (
                                <InputField
                                    label="RUC / Cédula SRI"
                                    name="cedulaRuc"
                                    value={newClienteData.cedulaRuc}
                                    onChange={e => setNewClienteData({ ...newClienteData, cedulaRuc: e.target.value.replace(/\D/g, '').slice(0, 13) })}
                                    required
                                    error={rucError || undefined}
                                    placeholder="1720000000001"
                                />
                            )}
                        </div>

                        {clienteReconocido && historialReconocido && (
                            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 flex flex-col sm:flex-row sm:items-center gap-4">
                                <div className="flex-1 min-w-0">
                                    <span className="text-[10px] font-black uppercase tracking-[0.18em] text-emerald-700">Cliente reconocido</span>
                                    <p className="text-base font-bold text-slate-900 mt-1 truncate">{clienteReconocido.nombre}</p>
                                    <p className="text-xs text-emerald-800 mt-1">
                                        {historialReconocido.ordenes} {historialReconocido.ordenes === 1 ? 'orden' : 'órdenes'} · Última: {historialReconocido.ultima}
                                        {historialReconocido.deuda > 0 && <> · Saldo pendiente <strong>{formatCurrency(historialReconocido.deuda)}</strong></>}
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => onClientCreated(clienteReconocido)}
                                    className="shrink-0 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors"
                                >
                                    Usar esta ficha
                                </button>
                            </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <InputField
                                label="Teléfono / WhatsApp"
                                name="telefono"
                                value={currentTelefono}
                                onChange={e => setCurrentTelefono(e.target.value)}
                                placeholder="0991234567"
                            />

                            <InputField
                                label="Correo Electrónico"
                                name="email"
                                type="email"
                                value={newClienteData.email}
                                onChange={e => setNewClienteData({ ...newClienteData, email: e.target.value })}
                                placeholder="cliente@correo.com"
                            />
                        </div>

                        <InputField
                            label="Dirección Principal"
                            name="direccion"
                            value={newClienteData.direccion}
                            onChange={e => setNewClienteData({ ...newClienteData, direccion: e.target.value.toUpperCase() })}
                            placeholder="Calle, Ciudad, Provincia"
                        />
                    </form>
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-slate-200 flex justify-end gap-3 bg-slate-50">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-[11px] font-black uppercase transition-all"
                    >
                        Cancelar
                    </button>
                    <button
                        type="submit"
                        form="create-client-form"
                        disabled={isSaving}
                        className="flex items-center gap-2 px-6 py-2.5 bg-brand-blue text-white rounded-xl text-[11px] font-black uppercase tracking-wider hover:bg-brand-blue/90 shadow-blue-glow-sm transition-all"
                    >
                        {isSaving ? (
                            <>
                                <Loader2Icon className="w-4 h-4 animate-spin" /> Guardando...
                            </>
                        ) : (
                            <>
                                <CheckCircleIcon className="w-4 h-4" /> Guardar Cliente
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export interface ClientSelectorProps {
    onSelect: (client: Cliente) => void;
    onCancel?: () => void;
    hideQuickButtons?: boolean;
}

export const ClientSelector: React.FC<ClientSelectorProps> = ({ onSelect }) => {
    const { clientes } = useData();
    const [searchTerm, setSearchTerm] = useState('');
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

    const filtered = useMemo(() => {
        const lower = searchTerm.toLowerCase().trim();
        if (!lower) return clientes.slice(0, 10);
        return clientes.filter(c => 
            c.nombre.toLowerCase().includes(lower) ||
            (c.ruc || c.cedula || '').includes(lower) ||
            (c.telefono && Array.isArray(c.telefono) ? c.telefono.join(' ').includes(lower) : String(c.telefono || '').includes(lower))
        );
    }, [clientes, searchTerm]);

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="relative flex-1 w-full">
                    <SearchIcon className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        placeholder="Buscar por RUC, Cédula o Nombre..."
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-11 pr-4 py-3 text-[12px] font-bold text-slate-900 outline-none focus:border-brand-blue"
                    />
                </div>

                <button
                    type="button"
                    onClick={() => setIsCreateModalOpen(true)}
                    className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-3 bg-brand-blue text-white rounded-xl text-[11px] font-black uppercase tracking-wider hover:bg-brand-blue/90 shadow-blue-glow-sm transition-all shrink-0"
                >
                    <PlusIcon className="w-4 h-4" /> Nuevo Cliente
                </button>
            </div>

            {/* Listado de Clientes */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-80 overflow-y-auto pr-1">
                {filtered.map(c => (
                    <div
                        key={c.id}
                        onClick={() => onSelect(c)}
                        className="p-4 rounded-xl border border-slate-200 bg-white hover:border-brand-blue cursor-pointer transition-all flex items-center justify-between shadow-sm group"
                    >
                        <div className="space-y-0.5 min-w-0 pr-2">
                            <h4 className="text-sm font-black text-slate-900 truncate uppercase group-hover:text-brand-blue transition-colors">
                                {c.nombre}
                            </h4>
                            <div className="text-[10px] font-mono text-slate-500">
                                RUC/CI: {c.ruc || c.cedula || 'Sin número'}
                            </div>
                        </div>

                        <span className="text-[10px] font-black text-brand-blue uppercase shrink-0 group-hover:translate-x-0.5 transition-transform flex items-center gap-1">
                            Seleccionar <ArrowRightIcon className="w-3.5 h-3.5" />
                        </span>
                    </div>
                ))}
            </div>

            <CreateClientModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                onClientCreated={(c) => {
                    setIsCreateModalOpen(false);
                    onSelect(c);
                }}
            />
        </div>
    );
};

export default ClientSelector;
