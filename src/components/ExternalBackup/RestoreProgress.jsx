import React from 'react';
import { CheckCircle, XCircle } from 'lucide-react';

const RestoreProgress = ({ status, error, onReset }) => {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md">
            <div className="max-w-md w-full p-8 text-center">

                {status === 'restoring' && (
                    <div className="animate-in fade-in zoom-in duration-300">
                        <div className="mb-6 relative">
                            <div className="w-24 h-24 border-4 border-blue-500 rounded-full mx-auto" />
                        </div>
                        <h2 className="text-2xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>Restaurando Base de Datos</h2>
                        <p className="mb-8" style={{ color: 'var(--text-primary)', opacity: 0.7 }}>Por favor no cierre esta ventana ni desconecte el dispositivo...</p>
                    </div>
                )}

                {status === 'success' && (
                    <div className="animate-in fade-in zoom-in duration-500">
                        <div className="w-24 h-24 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                            <CheckCircle className="w-12 h-12 text-green-500" />
                        </div>
                        <h2 className="text-2xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>¡Restauración Exitosa!</h2>
                        <p className="mb-8" style={{ color: 'var(--text-primary)', opacity: 0.7 }}>El sistema ha sido restaurado correctamente. Es necesario reiniciar la sesión.</p>
                        <button
                            onClick={() => window.location.href = '/'}
                            className="px-8 py-3 bg-green-600 hover:bg-green-700 rounded-lg font-medium transition-colors shadow-lg shadow-green-900/30" style={{ color: 'var(--text-primary)' }}
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
                        <h2 className="text-2xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>Error en la Restauración</h2>
                        <p className="text-red-400 mb-8 bg-red-950/30 p-4 rounded border border-red-900/50">
                            {error || "Ocurrió un error desconocido"}
                        </p>
                        <button
                            onClick={onReset}
                            className="px-8 py-3 bg-gray-700 hover:bg-gray-600 rounded-lg font-medium transition-colors" style={{ color: 'var(--text-primary)' }}
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
