import React, { useState } from 'react';
import { useExternalBackup } from '../../hooks/useExternalBackup';
import SourceList from './SourceList';
import SecurityModal from './SecurityModal';
import RestoreProgress from './RestoreProgress';
import { Shield } from 'lucide-react';

const ExternalBackupRestore = () => {
    const {
        sources,
        loading,
        error,
        selectedSource,
        restoreStatus,
        fetchSources,
        validateSource,
        executeRestore,
        resetState
    } = useExternalBackup();

    const [isSecurityModalOpen, setIsSecurityModalOpen] = useState(false);

    const handleSourceSelect = (sourcePath, filename) => {
        validateSource(sourcePath, filename);
        setIsSecurityModalOpen(true);
    };

    const handleConfirmRestore = async (password) => {
        await executeRestore(password);
        if (restoreStatus !== 'error') {
            setIsSecurityModalOpen(false);
        }
    };

    const handleCloseModal = () => {
        setIsSecurityModalOpen(false);
        resetState();
    };

    // Show progress overlay if restoring, success, or critical error during restore
    const showProgress = ['restoring', 'success', 'error'].includes(restoreStatus) && !isSecurityModalOpen;

    return (
        <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
            <div className="p-6 border-b border-gray-800 flex items-center gap-3">
                <div className="p-2 bg-blue-900/30 rounded-lg text-blue-400">
                    <Shield className="w-6 h-6" />
                </div>
                <div>
                    <h2 className="text-xl font-bold text-white">Respaldo Externo</h2>
                    <p className="text-sm text-gray-400">Restaurar desde USB o almacenamiento local</p>
                </div>
            </div>

            <div className="p-6">
                <SourceList
                    sources={sources}
                    loading={loading && sources.length === 0}
                    error={error && restoreStatus === 'idle' ? error : null} // Only show list error if not in restore flow
                    onSelect={handleSourceSelect}
                    onRefresh={fetchSources}
                />
            </div>

            <SecurityModal
                isOpen={isSecurityModalOpen}
                onClose={handleCloseModal}
                onConfirm={handleConfirmRestore}
                loading={restoreStatus === 'restoring'} // Actually redundant since we close modal, but good for transition
                error={error}
            />

            {showProgress && (
                <RestoreProgress
                    status={restoreStatus}
                    error={error}
                    onReset={resetState}
                />
            )}
        </div>
    );
};

export default ExternalBackupRestore;
