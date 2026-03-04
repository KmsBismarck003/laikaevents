import React, { useState } from 'react';
import { Lock, AlertOctagon, X } from 'lucide-react';

const SecurityModal = ({ isOpen, onClose, onConfirm, loading, error }) => {
    const [password, setPassword] = useState('');

    if (!isOpen) return null;

    const handleSubmit = (e) => {
        e.preventDefault();
        onConfirm(password);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="bg-gray-900 border border-red-900/50 rounded-xl shadow-2xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in duration-200">

                {/* Header de Alerta */}
                <div className="bg-red-900/20 p-6 border-b border-red-900/30 flex items-start gap-4">
                    <div className="p-3 bg-red-900/40 rounded-full shrink-0">
                        <AlertOctagon className="w-8 h-8 text-red-500" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-white mb-2">Restauración Crítica</h2>
                        <p className="text-gray-400 text-sm">
                            Esta acción sobrescribirá TODA la base de datos actual.
                            Los datos no respaldados se perderán permanentemente.
                        </p>
                    </div>
                </div>

                {/* Formulario */}
                <form onSubmit={handleSubmit} className="p-6">
                    <div className="mb-6">
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                            Contraseña de Administrador
                        </label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full bg-gray-950 border border-gray-700 rounded-lg pl-10 pr-4 py-3 text-white focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none transition-all placeholder-gray-600"
                                placeholder="Ingrese su contraseña actual"
                                autoFocus
                            />
                        </div>
                    </div>

                    {error && (
                        <div className="mb-4 p-3 bg-red-950/50 border border-red-900/50 rounded text-red-400 text-sm">
                            {error}
                        </div>
                    )}

                    <div className="flex gap-3 justify-end">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
                            disabled={loading}
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={!password || loading}
                            className={`px-6 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg shadow-lg shadow-red-900/20 transition-all flex items-center gap-2 ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                            {loading ? 'Verificando...' : 'AUTORIZAR RESTAURACIÓN'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default SecurityModal;
