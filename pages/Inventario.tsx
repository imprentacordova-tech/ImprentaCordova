
import React, { useState, useEffect, useMemo } from 'react';
import { BoxIcon, InventoryIcon, ExclamationTriangleIcon, AddIcon, PencilIcon, ArrowUpIcon, ArrowDownIcon, SearchIcon, TrashIcon, CloseIcon } from '../components/Icons';
import { formatCurrency } from '../utils';
import { InventoryItem } from '../types';
import { getInventario, createInventarioItem, updateInventarioItem, deleteInventarioItem, setInventario as saveInventarioOrder } from '../services/mockApi';
import QRScannerModal from '../components/QRScannerModal';
import { useToast } from '../contexts/ToastContext';

type SortKey = keyof InventoryItem | 'valorTotal';

interface KpiCardProps {
    title: string;
    value: string;
    icon: React.ComponentType<{ className?: string }>;
    color: 'blue' | 'green' | 'red';
}

const KpiCard: React.FC<KpiCardProps> = ({ title, value, icon: Icon, color }) => {
    const colorClasses = {
        blue: { bg: 'bg-kpi-blue-bg', text: 'text-brand-blue' },
        green: { bg: 'bg-kpi-green-bg', text: 'text-green-600' },
        red: { bg: 'bg-kpi-red-bg', text: 'text-brand-red' },
    };
    const classes = colorClasses[color];

    return (
        <div className={`p-5 rounded-lg shadow-sm ${classes.bg} flex items-center`}>
            <div className={`p-3 rounded-lg bg-white mr-4`}>
                <Icon className={`h-8 w-8 ${classes.text}`} />
            </div>
            <div>
                <p className="text-sm text-gray-700 dark:text-gray-300">{title}</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">{value}</p>
            </div>
        </div>
    );
};

const SortableHeader: React.FC<{
    column: SortKey;
    label: string;
    sortConfig: { key: SortKey; direction: 'asc' | 'desc' };
    requestSort: (key: SortKey) => void;
    className?: string;
}> = ({ column, label, sortConfig, requestSort, className = '' }) => {
    const isSorted = sortConfig.key === column;
    const directionIcon = isSorted ? (
        sortConfig.direction === 'asc' ? <ArrowUpIcon className="h-4 w-4 ml-1 transition-transform" /> : <ArrowDownIcon className="h-4 w-4 ml-1 transition-transform" />
    ) : <div className="h-4 w-4 ml-1"></div>; // Placeholder for alignment

    return (
        <th scope="col" className={`px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider ${className}`}>
            <button onClick={() => requestSort(column)} className="flex items-center group focus:outline-none">
                <span>{label}</span>
                <span className={`transition-opacity ${isSorted ? 'opacity-100' : 'opacity-50 group-hover:opacity-100'}`}>
                    {directionIcon}
                </span>
            </button>
        </th>
    );
};

const InputField: React.FC<{ label: string; name: string; value: any; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void; [key: string]: any; }> = ({ label, name, value, onChange, ...props }) => (
    <div>
        <label htmlFor={name} className="block text-sm font-medium text-gray-700 dark:text-gray-300">{label}</label>
        <input id={name} name={name} value={value} onChange={onChange} className="mt-1 block w-full p-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600" {...props} />
    </div>
);

const ItemFormModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onSave: (item: Partial<InventoryItem>) => void;
    itemToEdit: Partial<InventoryItem> | null;
}> = ({ isOpen, onClose, onSave, itemToEdit }) => {
    const [formData, setFormData] = useState<Partial<InventoryItem>>({});

    useEffect(() => {
        setFormData(itemToEdit || { item: '', cantidad: 0, unidad: '', costoUnitario: 0, minimo: 0 });
    }, [itemToEdit]);

    if (!isOpen) return null;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value, type } = e.target;
        setFormData({
            ...formData,
            [name]: type === 'number' ? parseFloat(value) : value,
        });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(formData);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4" onClick={onClose}>
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-lg" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center p-5 border-b border-gray-200 dark:border-gray-700">
                    <h2 className="text-xl font-bold">{formData.id ? 'Editar Item' : 'Agregar Item'}</h2>
                    <button onClick={onClose}><CloseIcon className="w-6 h-6 text-gray-500" /></button>
                </div>
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <InputField label="Nombre del Item" name="item" value={formData.item || ''} onChange={handleChange} required />
                    <div className="grid grid-cols-2 gap-4">
                        <InputField label="Cantidad" name="cantidad" type="number" value={formData.cantidad || ''} onChange={handleChange} required />
                        <InputField label="Unidad (ej: resma, metro, litro)" name="unidad" value={formData.unidad || ''} onChange={handleChange} required />
                    </div>
                     <div className="grid grid-cols-2 gap-4">
                        <InputField label="Costo Unitario" name="costoUnitario" type="number" step="0.01" value={formData.costoUnitario || ''} onChange={handleChange} required />
                        <InputField label="Mínimo en Stock" name="minimo" type="number" value={formData.minimo || ''} onChange={handleChange} required />
                    </div>
                    <div className="flex justify-end pt-4 gap-3">
                        <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 font-semibold rounded-lg hover:bg-gray-300">Cancelar</button>
                        <button type="submit" className="px-4 py-2 bg-brand-blue text-white font-semibold rounded-lg hover:bg-blue-700">Guardar</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const ConfirmationModal: React.FC<{
    item: InventoryItem;
    onConfirm: () => void;
    onCancel: () => void;
}> = ({ item, onConfirm, onCancel }) => (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4" onClick={onCancel}>
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-sm" onClick={e => e.stopPropagation()}>
             <div className="p-6 text-center">
                 <ExclamationTriangleIcon className="mx-auto h-12 w-12 text-red-500" />
                 <h3 className="mt-4 text-lg font-bold text-gray-900 dark:text-white">Confirmar Eliminación</h3>
                 <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">¿Estás seguro de que quieres eliminar <strong>{item.item}</strong>? Esta acción no se puede deshacer.</p>
            </div>
             <div className="bg-gray-50 dark:bg-gray-700/50 px-6 py-4 flex justify-end gap-3 rounded-b-xl">
                 <button onClick={onCancel} className="px-4 py-2 bg-gray-200 text-gray-800 font-semibold rounded-lg hover:bg-gray-300">Cancelar</button>
                 <button onClick={onConfirm} className="px-4 py-2 bg-brand-red text-white font-semibold rounded-lg hover:bg-red-700">Eliminar</button>
            </div>
        </div>
    </div>
);


const InventarioPage: React.FC = () => {
    const { addToast } = useToast();
    const [inventario, setInventario] = useState<InventoryItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [sortConfig, setSortConfig] = useState<{ key: SortKey; direction: 'asc' | 'desc' }>({ key: 'item', direction: 'asc' });
    const [currentPage, setCurrentPage] = useState(1);
    const [itemToEdit, setItemToEdit] = useState<Partial<InventoryItem> | null>(null);
    const [itemToDelete, setItemToDelete] = useState<InventoryItem | null>(null);
    const [draggedItemId, setDraggedItemId] = useState<string | null>(null);
    const [draggedOverItemId, setDraggedOverItemId] = useState<string | null>(null);
    const [showScanner, setShowScanner] = useState(false);
    const ITEMS_PER_PAGE = 5;

    const fetchInventario = async () => {
        setLoading(true);
        const data = await getInventario();
        setInventario(data);
        setLoading(false);
    };

    useEffect(() => {
        fetchInventario();
    }, []);

    const kpis = useMemo(() => {
        const valorTotal = inventario.reduce((sum, item) => sum + (item.cantidad * item.costoUnitario), 0);
        const bajoStock = inventario.filter(item => item.cantidad <= item.minimo).length;
        return { valorTotal, totalItems: inventario.length, bajoStock };
    }, [inventario]);

    const processedItems = useMemo(() => {
        let filteredItems = inventario.filter(item =>
            item.item.toLowerCase().includes(searchTerm.toLowerCase())
        );

        if (sortConfig.key !== 'item') { // Don't sort if we are dragging, let manual order prevail
            filteredItems.sort((a, b) => {
                let aValue: string | number;
                let bValue: string | number;

                if (sortConfig.key === 'valorTotal') {
                    aValue = a.cantidad * a.costoUnitario;
                    bValue = b.cantidad * b.costoUnitario;
                } else {
                    aValue = a[sortConfig.key as keyof InventoryItem];
                    bValue = b[sortConfig.key as keyof InventoryItem];
                }
                
                if (aValue < bValue) {
                    return sortConfig.direction === 'asc' ? -1 : 1;
                }
                if (aValue > bValue) {
                    return sortConfig.direction === 'asc' ? 1 : -1;
                }
                return 0;
            });
        }
        
        return filteredItems;
    }, [inventario, searchTerm, sortConfig]);

    const paginatedItems = useMemo(() => {
         const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
        return processedItems.slice(startIndex, startIndex + ITEMS_PER_PAGE);
    }, [processedItems, currentPage]);

    const totalPages = Math.ceil(processedItems.length / ITEMS_PER_PAGE);

    const requestSort = (key: SortKey) => {
        let direction: 'asc' | 'desc' = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    const handleSaveItem = async (item: Partial<InventoryItem>) => {
        if (item.id) {
            await updateInventarioItem(item.id, item);
        } else {
            await createInventarioItem(item as Omit<InventoryItem, 'id'>);
        }
        setItemToEdit(null);
        await fetchInventario();
    };

    const handleDeleteConfirm = async () => {
        if (itemToDelete) {
            await deleteInventarioItem(itemToDelete.id);
            setItemToDelete(null);
            await fetchInventario();
        }
    };

    const handleDragStart = (e: React.DragEvent<HTMLTableRowElement>, id: string) => {
        e.dataTransfer.setData('inventory_item_id', id);
        setDraggedItemId(id);
    };

    const handleDragOver = (e: React.DragEvent<HTMLTableRowElement>) => {
        e.preventDefault();
    };

    const handleDragEnter = (id: string) => {
        if (id !== draggedItemId) {
            setDraggedOverItemId(id);
        }
    };

    const handleDragLeave = () => {
        setDraggedOverItemId(null);
    };

    const handleDrop = async (e: React.DragEvent<HTMLTableRowElement>, dropTargetId: string) => {
        e.preventDefault();
        const draggedId = e.dataTransfer.getData('inventory_item_id');
        
        setDraggedItemId(null);
        setDraggedOverItemId(null);

        if (draggedId === dropTargetId) return;
        
        const newInventario = [...inventario];
        const draggedIndex = newInventario.findIndex(i => i.id === draggedId);
        const targetIndex = newInventario.findIndex(i => i.id === dropTargetId);

        if (draggedIndex === -1 || targetIndex === -1) return;

        const [draggedItem] = newInventario.splice(draggedIndex, 1);
        newInventario.splice(targetIndex, 0, draggedItem);
        
        setInventario(newInventario);
        await saveInventarioOrder(newInventario);
    };

    const handleDragEnd = () => {
        setDraggedItemId(null);
        setDraggedOverItemId(null);
    };

    const handleScanResult = (decodedText: string) => {
        // Assume QR contains Item ID directly
        const item = inventario.find(i => i.id === decodedText || i.item.toLowerCase() === decodedText.toLowerCase());
        
        if (item) {
            setItemToEdit(item);
            addToast(`Producto "${item.item}" encontrado`, 'success');
        } else {
            addToast('Producto no encontrado en inventario', 'error');
        }
    };


    return (
        <div className="space-y-8">
            <div className="flex flex-wrap justify-between items-center gap-4">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Inventario</h1>
                <div className="flex gap-3">
                    <button 
                        onClick={() => setShowScanner(true)}
                        className="flex items-center justify-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 rounded-lg text-sm font-bold text-gray-700 dark:text-gray-200 transition-colors"
                    >
                        <div className="w-5 h-5 flex items-center justify-center border-2 border-current rounded-sm">
                            <div className="w-2 h-2 bg-current rounded-full"></div>
                        </div>
                        Escanear QR
                    </button>
                    <button
                        onClick={() => setItemToEdit({})}
                        className="flex items-center justify-center gap-2 bg-brand-blue text-white font-bold py-2 px-5 rounded-lg shadow-md hover:bg-blue-700 transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                    >
                        <AddIcon className="h-5 w-5"/>
                        <span>Agregar Item</span>
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <KpiCard title="Valor Total" value={formatCurrency(kpis.valorTotal)} icon={BoxIcon} color="blue" />
                <KpiCard title="Total Items" value={String(kpis.totalItems)} icon={InventoryIcon} color="green" />
                <KpiCard title="Bajo Stock" value={String(kpis.bajoStock)} icon={ExclamationTriangleIcon} color="red" />
            </div>
            
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden">
                 <div className="p-6 flex flex-col md:flex-row justify-between items-center gap-4">
                     <h2 className="text-xl font-bold text-gray-800 dark:text-white self-start">Items de Inventario</h2>
                     <div className="relative w-full md:w-auto md:min-w-[300px]">
                        <SearchIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400"/>
                        <input
                            type="text"
                            placeholder="Buscar item..."
                            value={searchTerm}
                            onChange={(e) => {
                                setSearchTerm(e.target.value);
                                setCurrentPage(1); // Reset page on new search
                            }}
                            className="w-full pl-11 pr-4 py-2.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-brand-blue focus:border-brand-blue"
                        />
                     </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                        <thead className="bg-gray-50 dark:bg-gray-700/50">
                            <tr>
                                <SortableHeader column="item" label="ITEM" sortConfig={sortConfig} requestSort={requestSort} />
                                <SortableHeader column="cantidad" label="CANTIDAD" sortConfig={sortConfig} requestSort={requestSort} />
                                <SortableHeader column="unidad" label="UNIDAD" sortConfig={sortConfig} requestSort={requestSort} />
                                <SortableHeader column="costoUnitario" label="COSTO UNITARIO" sortConfig={sortConfig} requestSort={requestSort} />
                                <SortableHeader column="valorTotal" label="VALOR TOTAL" sortConfig={sortConfig} requestSort={requestSort} />
                                <SortableHeader column="minimo" label="MÍNIMO" sortConfig={sortConfig} requestSort={requestSort} />
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">ESTADO</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">ACCIONES</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                            {loading ? (
                                <tr><td colSpan={8} className="text-center py-10">Cargando inventario...</td></tr>
                            ) : paginatedItems.map((item) => {
                                const isLowStock = item.cantidad <= item.minimo;
                                const isDragged = draggedItemId === item.id;
                                const isDraggedOver = draggedOverItemId === item.id && !isDragged;

                                return (
                                    <tr 
                                        key={item.id} 
                                        draggable
                                        onDragStart={(e) => handleDragStart(e, item.id)}
                                        onDragOver={handleDragOver}
                                        onDragEnter={() => handleDragEnter(item.id)}
                                        onDragLeave={handleDragLeave}
                                        onDrop={(e) => handleDrop(e, item.id)}
                                        onDragEnd={handleDragEnd}
                                        className={`
                                            transition-all duration-200
                                            ${isDragged ? 'opacity-30 cursor-grabbing' : 'opacity-100 cursor-grab'}
                                            ${isDraggedOver ? 'outline outline-2 outline-brand-blue outline-offset-[-2px]' : ''}
                                        `}
                                    >
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">{item.item}</td>
                                        <td className={`px-6 py-4 whitespace-nowrap text-sm font-semibold ${isLowStock ? 'text-red-500' : 'text-gray-700 dark:text-gray-200'}`}>{item.cantidad}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{item.unidad}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{formatCurrency(item.costoUnitario)}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-700 dark:text-gray-200">{formatCurrency(item.cantidad * item.costoUnitario)}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{item.minimo}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                                            <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${isLowStock ? 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300' : 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300'}`}>
                                                {isLowStock ? 'Bajo' : 'OK'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium flex items-center gap-2">
                                            <button onClick={() => setItemToEdit(item)} className="text-brand-blue hover:text-blue-700 dark:hover:text-blue-400 p-1">
                                                <PencilIcon className="h-5 w-5" />
                                            </button>
                                            <button onClick={() => setItemToDelete(item)} className="text-red-500 hover:text-red-700 dark:hover:text-red-400 p-1">
                                                <TrashIcon className="h-5 w-5" />
                                            </button>
                                        </td>
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>
                </div>

                <div className="p-4 flex flex-col sm:flex-row items-center justify-between text-sm text-gray-600 dark:text-gray-400">
                    <span>
                        Página {currentPage} de {totalPages}
                    </span>
                    <div className="inline-flex items-center mt-2 sm:mt-0">
                        <button 
                            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} 
                            disabled={currentPage === 1}
                            className="px-4 py-2 border rounded-l-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 dark:hover:bg-gray-700"
                        >
                            Anterior
                        </button>
                        <button 
                            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                            disabled={currentPage === totalPages}
                            className="px-4 py-2 border-t border-b border-r rounded-r-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 dark:hover:bg-gray-700"
                        >
                            Siguiente
                        </button>
                    </div>
                </div>
            </div>

            <ItemFormModal isOpen={!!itemToEdit} onClose={() => setItemToEdit(null)} onSave={handleSaveItem} itemToEdit={itemToEdit} />
            {itemToDelete && <ConfirmationModal item={itemToDelete} onConfirm={handleDeleteConfirm} onCancel={() => setItemToDelete(null)} />}
            {showScanner && (
                <QRScannerModal 
                    onClose={() => setShowScanner(false)} 
                    onScan={handleScanResult} 
                    title="Escanear Producto"
                />
            )}
        </div>
    );
};

export default InventarioPage;
