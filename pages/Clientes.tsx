
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Link } from 'react-router-dom';
import { getClientes, getTrabajos, updateCliente } from '../services/mockApi';
import { Cliente, Trabajo, TrabajoEstado, Regimen } from '../types';
import { UI_TEXT } from '../constants';
import { formatCurrency, formatDate } from '../utils';
import { CloseIcon, PhoneIcon, EnvelopeIcon, DollarIcon, ClockIcon, PencilIcon, ExclamationTriangleIcon, Loader2Icon, CheckCircleIcon } from '../components/Icons';

interface ClientKpiCardProps {
    title: string;
    value: string;
    variant: 'blue' | 'green' | 'red';
}

const ClientKpiCard: React.FC<ClientKpiCardProps> = ({ title, value, variant }) => {
    const variants = {
        blue: 'bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-200',
        green: 'bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-200',
        red: 'bg-red-100 dark:bg-red-900/50 text-red-800 dark:text-red-200',
    };
    return (
        <div className={`p-4 rounded-lg ${variants[variant]}`}>
            <p className="text-sm text-gray-600 dark:text-gray-400">{title}</p>
            <p className="text-2xl font-bold">{value}</p>
        </div>
    );
};

// Reusable Input Field Component
const InputField: React.FC<{ label: string; name: string; value: any; onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void; [key: string]: any; }> = ({ label, name, value, onChange, ...props }) => (
    <div>
        <label htmlFor={name} className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{label}</label>
        {props.as === 'textarea' ? (
             <textarea id={name} name={name} value={value} onChange={onChange} className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600" {...props} />
        ) : (
             <input id={name} name={name} value={value} onChange={onChange} className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600" {...props} />
        )}
    </div>
);

const ClientFormModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onSave: (client: Cliente) => void;
    clientToEdit: Cliente;
}> = ({ isOpen, onClose, onSave, clientToEdit }) => {
    const [formData, setFormData] = useState<Partial<Cliente>>({});
    const [telefonosStr, setTelefonosStr] = useState('');
    
    // UI States
    const [isSaving, setIsSaving] = useState(false);
    const [saveSuccess, setSaveSuccess] = useState(false);

    useEffect(() => {
        if (clientToEdit) {
            setFormData({ ...clientToEdit });
            setTelefonosStr(clientToEdit.telefono.join(', '));
            setIsSaving(false);
            setSaveSuccess(false);
        }
    }, [clientToEdit, isOpen]);

    if (!isOpen) return null;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);

        const updatedClient = {
            ...clientToEdit,
            ...formData,
            telefono: telefonosStr.split(',').map(t => t.trim()).filter(t => t.length > 0)
        } as Cliente;

        // Simular un pequeño delay para mejorar la sensación de proceso
        await new Promise(resolve => setTimeout(resolve, 600));

        setIsSaving(false);
        setSaveSuccess(true);

        setTimeout(() => {
            onSave(updatedClient);
        }, 1000);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-[60] flex justify-center items-center p-4 animate-fade-in">
            {/* Quitamos onClick={onClose} del div padre para evitar cierres accidentales */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-lg relative" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center p-5 border-b border-gray-200 dark:border-gray-700">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">Editar Cliente</h2>
                    <button onClick={onClose}><CloseIcon className="w-6 h-6 text-gray-500" /></button>
                </div>
                <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
                    <InputField label="Nombres/Razón Social" name="nombre" value={formData.nombre || ''} onChange={handleChange} required />
                    <InputField label="Nombre Comercial (Opcional)" name="nombreComercial" value={formData.nombreComercial || ''} onChange={handleChange} />
                    <div className="grid grid-cols-2 gap-4">
                        <InputField label="Cédula / RUC" name="cedula" value={formData.cedula || formData.ruc || ''} onChange={handleChange} disabled className="w-full p-2 border rounded-md dark:bg-gray-600 dark:border-gray-500 cursor-not-allowed opacity-70" />
                        <InputField label="Teléfonos (sep. por coma)" name="telefonosStr" value={telefonosStr} onChange={(e) => setTelefonosStr(e.target.value)} />
                    </div>
                    <InputField label="Email" name="email" value={formData.email || ''} onChange={handleChange} />
                    <InputField label="Dirección" name="direccion" value={formData.direccion || ''} onChange={handleChange} />
                    
                    <div>
                        <label htmlFor="regimen" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Régimen</label>
                        <select name="regimen" value={formData.regimen} onChange={handleChange} className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600">
                            <option value={Regimen.GENERAL}>{Regimen.GENERAL}</option>
                            <option value={Regimen.NEGOCIO_POPULAR}>{Regimen.NEGOCIO_POPULAR}</option>
                            <option value={Regimen.EMPRENDEDOR}>{Regimen.EMPRENDEDOR}</option>
                        </select>
                    </div>

                    <InputField label="Notas" name="notas" value={formData.notas || ''} onChange={handleChange} as="textarea" rows={3} />

                    <div className="flex justify-end pt-4 gap-3 border-t dark:border-gray-700">
                        <button type="button" onClick={onClose} disabled={isSaving || saveSuccess} className="px-4 py-2 bg-gray-200 text-gray-800 font-semibold rounded-lg hover:bg-gray-300 disabled:opacity-50">Cancelar</button>
                        
                        <button 
                            type="submit" 
                            disabled={isSaving || saveSuccess}
                            className={`px-4 py-2 text-white font-semibold rounded-lg transition-all transform flex items-center justify-center gap-2 min-w-[140px] ${
                                saveSuccess 
                                    ? 'bg-green-600 hover:bg-green-700 scale-105' 
                                    : 'bg-brand-blue hover:bg-blue-700'
                            }`}
                        >
                            {isSaving ? (
                                <><Loader2Icon className="animate-spin w-5 h-5"/> Guardando...</>
                            ) : saveSuccess ? (
                                <><CheckCircleIcon className="w-5 h-5"/> ¡Guardado!</>
                            ) : (
                                "Guardar Cambios"
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

interface ClienteDetailModalProps {
    cliente: Cliente;
    trabajos: Trabajo[];
    onClose: () => void;
    onEdit: () => void;
}

const ClienteDetailModal: React.FC<ClienteDetailModalProps> = ({ cliente, trabajos, onClose, onEdit }) => {
    const financialSummary = useMemo(() => {
        const clientJobs = trabajos.filter(t => t.clienteId === cliente.id);
        const totalGastado = clientJobs.reduce((sum, job) => sum + job.total, 0);
        const totalAbonado = clientJobs.reduce((sum, job) => sum + job.abono, 0);
        const saldoPendiente = totalGastado - totalAbonado;
        return { totalGastado, totalAbonado, saldoPendiente, jobCount: clientJobs.length, clientJobs };
    }, [cliente, trabajos]);

    const getStatusColor = (estado: TrabajoEstado) => {
        switch (estado) {
            case TrabajoEstado.PENDIENTE: return 'bg-yellow-100 text-yellow-800';
            case TrabajoEstado.PROCESO: return 'bg-blue-100 text-blue-800';
            case TrabajoEstado.VITRINA: return 'bg-purple-100 text-purple-800';
            case TrabajoEstado.ENTREGADO: return 'bg-green-100 text-green-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    }

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4 animate-fade-in" onClick={onClose}>
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
                <div className="relative p-6 bg-gradient-to-r from-blue-600 to-red-500 rounded-t-2xl text-white">
                    <div className="flex items-center gap-3 mb-1">
                        <h2 className="text-3xl font-bold">{cliente.nombre}</h2>
                        <button onClick={onEdit} className="p-1.5 bg-white/20 hover:bg-white/30 rounded-full transition-colors" title="Editar Cliente">
                            <PencilIcon className="w-5 h-5 text-white" />
                        </button>
                    </div>
                    <p className="opacity-80">Cédula: {cliente.ruc || cliente.cedula}</p>
                    <button onClick={onClose} className="absolute top-4 right-4 text-white/70 hover:text-white transition-colors">
                        <CloseIcon className="w-7 h-7" />
                    </button>
                </div>
                <div className="p-6 flex-grow overflow-y-auto">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                        <div className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                            <PhoneIcon className="h-6 w-6 text-brand-blue" />
                            <a href={`tel:${cliente.telefono[0]}`} className="text-gray-700 dark:text-gray-300 hover:underline">{cliente.telefono.join(', ')}</a>
                        </div>
                        <div className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                            <EnvelopeIcon className="h-6 w-6 text-brand-blue" />
                            <a href={`mailto:${cliente.email}`} className="text-gray-700 dark:text-gray-300 hover:underline truncate">{cliente.email || 'No registrado'}</a>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
                        <ClientKpiCard title="Total Gastado" value={formatCurrency(financialSummary.totalGastado)} variant="blue" />
                        <ClientKpiCard title="Total Abonado" value={formatCurrency(financialSummary.totalAbonado)} variant="green" />
                        <ClientKpiCard title="Saldo Pendiente" value={formatCurrency(financialSummary.saldoPendiente)} variant="red" />
                    </div>

                    <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-4">
                        Historial de Trabajos ({financialSummary.jobCount})
                    </h3>
                    <div className="space-y-3 pr-2">
                        {financialSummary.clientJobs.length > 0 ? (
                            financialSummary.clientJobs.map(job => (
                                <div key={job.id} className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg flex flex-wrap justify-between items-center">
                                    <div>
                                        <p className="font-bold text-gray-800 dark:text-white">#{job.orden} - {job.subtipo}</p>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">{formatDate(job.fechaEntrada)}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-semibold text-gray-800 dark:text-white">{formatCurrency(job.total)}</p>
                                        <span className={`text-xs font-semibold px-2 py-1 rounded-full ${getStatusColor(job.estado)}`}>{job.estado}</span>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <p className="text-center text-gray-500 dark:text-gray-400 py-4">Este cliente aún no tiene trabajos registrados.</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};


const ClientesPage: React.FC = () => {
    const [clientes, setClientes] = useState<Cliente[]>([]);
    const [trabajos, setTrabajos] = useState<Trabajo[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedClient, setSelectedClient] = useState<Cliente | null>(null);
    
    // Edit State
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [clientToEdit, setClientToEdit] = useState<Cliente | null>(null);

    const fetchData = async () => {
        setLoading(true);
        const [clientesData, trabajosData] = await Promise.all([getClientes(), getTrabajos()]);
        setClientes(clientesData);
        setTrabajos(trabajosData);
        setLoading(false);
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleClientClick = (cliente: Cliente) => {
        setSelectedClient(cliente);
    };

    const handleCloseModal = () => {
        setSelectedClient(null);
    };

    const handleEditClick = (e: React.MouseEvent, cliente: Cliente) => {
        e.stopPropagation();
        setClientToEdit(cliente);
        setIsEditModalOpen(true);
    };

    const handleSaveClient = async (updatedClient: Cliente) => {
        await updateCliente(updatedClient.id, updatedClient);
        setIsEditModalOpen(false);
        
        // Update local list
        setClientes(prev => prev.map(c => c.id === updatedClient.id ? updatedClient : c));
        
        // Update selected client if open
        if (selectedClient && selectedClient.id === updatedClient.id) {
            setSelectedClient(updatedClient);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-wrap justify-between items-center gap-4">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{UI_TEXT.CLIENTES}</h1>
                <Link
                    to="/nuevo"
                    className="flex items-center justify-center gap-2 bg-brand-blue text-white font-bold py-2 px-4 rounded-lg shadow-md hover:bg-blue-700 transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                    + crear nuevo cliente
                </Link>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md">
                <div className="hidden sm:grid grid-cols-5 gap-4 px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                    <div className="text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider col-span-2">Nombre</div>
                    <div className="text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Cédula/RUC</div>
                    <div className="text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Teléfono</div>
                    <div className="text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider text-right">Acciones</div>
                </div>
                <div>
                    {loading ? (
                        <p className="text-center py-8">Cargando clientes...</p>
                    ) : (
                        clientes.map((cliente) => (
                            <div key={cliente.id} onClick={() => handleClientClick(cliente)} className="grid grid-cols-2 sm:grid-cols-5 gap-4 px-6 py-4 border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer transition-colors group items-center">
                                <div className="font-medium text-gray-900 dark:text-white col-span-2">{cliente.nombre}</div>
                                <div className="text-sm text-gray-500 dark:text-gray-300">{cliente.ruc || cliente.cedula}</div>
                                <div className="text-sm text-gray-500 dark:text-gray-300">{cliente.telefono.join(', ')}</div>
                                <div className="text-right">
                                    <button 
                                        onClick={(e) => handleEditClick(e, cliente)} 
                                        className="p-2 text-gray-400 hover:text-brand-blue hover:bg-blue-50 rounded-full transition-colors opacity-0 group-hover:opacity-100"
                                    >
                                        <PencilIcon className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
            {selectedClient && (
                <ClienteDetailModal 
                    cliente={selectedClient} 
                    trabajos={trabajos} 
                    onClose={handleCloseModal}
                    onEdit={() => {
                        setClientToEdit(selectedClient);
                        setIsEditModalOpen(true);
                    }} 
                />
            )}
            {isEditModalOpen && clientToEdit && (
                <ClientFormModal 
                    isOpen={isEditModalOpen}
                    onClose={() => setIsEditModalOpen(false)}
                    onSave={handleSaveClient}
                    clientToEdit={clientToEdit}
                />
            )}
        </div>
    );
};

export default ClientesPage;
