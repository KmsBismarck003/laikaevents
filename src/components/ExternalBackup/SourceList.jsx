import React, { useEffect } from 'react';
import { HardDrive, FolderKey, AlertTriangle } from 'lucide-react';

const SourceList = ({ sources, loading, error, onSelect, onRefresh }) => {

    useEffect(() => {
        onRefresh();
    }, [onRefresh]);

    if (loading && sources.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center p-8" style={{ color: 'var(--text-primary)', opacity: 0.7 }}>
                <p>Buscando fuentes externas...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-4 bg-red-900/20 border border-red-800 rounded-lg flex items-center gap-3 text-red-200">
                <AlertTriangle className="w-5 h-5" />
                <span>{error}</span>
                <button onClick={onRefresh} className="ml-auto text-sm underline hover:" style={{ color: 'var(--text-primary)' }}>
                    Reintentar
                </button>
            </div>
        );
    }

    if (sources.length === 0) {
        return (
            <div className="text-center p-8 border-2 border-dashed rounded-lg" style={{ border: '1px solid var(--border-color)', color: 'var(--text-primary)', opacity: 0.7 }}>
                <HardDrive className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No se detectaron dispositivos o carpetas de respaldo.</p>
                <button
                    onClick={onRefresh}
                    className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-md text-sm transition-colors" style={{ color: 'var(--text-primary)' }}
                >
                    Escanear nuevamente
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-3">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>Fuentes Disponibles</h3>
                <button
                    onClick={onRefresh}
                    className="text-sm text-blue-400 hover:text-blue-300"
                >
                    Actualizar lista
                </button>
            </div>

            <div className="grid gap-3">
                {sources.map((source) => (
                    <div
                        key={source.id}
                        className="hover: border rounded-lg p-4 transition-all" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)' }}
                    >
                        <div className="flex items-start gap-4">
                            <div className={`p-3 rounded-full ${source.type === 'usb' ? 'bg-orange-900/30 text-orange-400' : 'bg-blue-900/30 text-blue-400'}`}>
                                {source.type === 'usb' ? <HardDrive className="w-6 h-6" /> : <FolderKey className="w-6 h-6" />}
                            </div>

                            <div className="flex-1">
                                <h4 className="font-medium" style={{ color: 'var(--text-primary)' }}>{source.label}</h4>
                                <p className="text-xs font-mono mt-1" style={{ color: 'var(--text-primary)', opacity: 0.7 }}>{source.path}</p>

                                {source.preview_files && source.preview_files.length > 0 && (
                                    <div className="mt-3">
                                        <p className="text-xs mb-1" style={{ color: 'var(--text-primary)', opacity: 0.7 }}>Archivos detectados:</p>
                                        <div className="flex flex-wrap gap-2">
                                            {source.preview_files.map(file => (
                                                <button
                                                    key={file}
                                                    onClick={() => onSelect(source.path, file)}
                                                    className="px-2 py-1 bg-gray-700 hover:bg-gray-600 text-xs text-gray-300 rounded border border-gray-600 transition-colors"
                                                >
                                                    {file}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default SourceList;
