import React from 'react';
import { Loader, CheckCircle, XCircle } from 'lucide-react';

const RestoreProgress = ({ status, error, onReset }) => {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md">
            <div className="max-w-md w-full p-8 text-center">

                {status === 'restoring' && (
                    <div className="animate-in fade-in zoom-in duration-300">
                        <div className="mb-6 relative">
                             <div className="w-24 h-24 border-4 border-gray-800 rounded-full mx-auto" />
                             <div className="w-24 h-24 border-4 border-t-blue-500 border-r-transparent border-b-transparent border-l-transparent rounded-full mx-auto absolute inset-0 animate-spin" />
                             <Loader className="w-8 h-8 text-blue-500 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                        </div>
                        <h2 className="text-2xl font-bold text-white mb-2">Restaurando Base de Datos</h2>
                        <p className="text-gray-400 mb-8">Por favor no cierre esta ventana ni desconecte el dispositivo...</p>
                    </div>
                )}

                {status === 'success' && (
                    <div className="animate-in fade-in zoom-in duration-500">
                        <div className="w-24 h-24 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                            <CheckCircle className="w-12 h-12 text-green-500" />
                        </div>
                        <h2 className="text-2xl font-bold text-white mb-4">¡Restauración Exitosa!</h2>
                        <p className="text-gray-400 mb-8">El sistema ha sido restaurado correctamente. Es necesario reiniciar la sesión.</p>
                        <button
                            onClick={() => window.location.href = '/'}
                            className="px-8 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors shadow-lg shadow-green-900/30"
                        >
                            Volver al Inicio
                        </button>
                    </div>
                )}

                {status === 'error' && (
                    <div className="animate-in fade-in zoom-in duration-300">
                        <div className="w-24 h-24 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                            <XCircle className="w-12 h-12 text-red-500" />
                        </div>
                        <h2 className="text-2xl font-bold text-white mb-2">Error en la Restauración</h2>
                        <p className="text-red-400 mb-8 bg-red-950/30 p-4 rounded border border-red-900/50">
                            {error || "Ocurrió un error desconocido"}
                        </p>
                        <button
                            onClick={onReset}
                            className="px-8 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-medium transition-colors"
                        >
                            Cerrar y Reintentar
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default RestoreProgress;
