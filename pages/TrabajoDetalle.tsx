import React from 'react';
import { useParams, Link } from 'react-router-dom';

const TrabajoDetallePage: React.FC = () => {
    const { trabajoId } = useParams<{ trabajoId: string }>();

    // In a real app, you would fetch the job details here using the trabajoId
    // const [trabajo, setTrabajo] = useState(null);
    // useEffect(() => { ... fetch logic ... }, [trabajoId]);

    return (
        <div className="p-8 bg-white dark:bg-gray-800 rounded-lg shadow-md">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Detalle del Trabajo
            </h1>
            <p className="mt-4 text-lg text-gray-700 dark:text-gray-300">
                Mostrando detalles para el trabajo con ID: <span className="font-mono bg-gray-100 dark:bg-gray-700 p-1 rounded">{trabajoId}</span>
            </p>
            <p className="mt-2 text-gray-500 dark:text-gray-400">
                Esta es una página de marcador de posición. La funcionalidad completa se implementará en el futuro.
            </p>
            <div className="mt-6">
                <Link
                    to="/kds"
                    className="text-brand-blue hover:underline font-semibold"
                >
                    &larr; Volver al tablero KDS
                </Link>
            </div>
        </div>
    );
};

export default TrabajoDetallePage;