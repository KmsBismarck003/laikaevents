import React, { useState } from 'react';
import Button from '../../components/Button';
import Modal from '../../components/Modal';
import api from '../../services/api';
import { useNotification } from '../../context/NotificationContext';

const CancelEventModal = ({ isOpen, onClose, eventId, onCancelSuccess }) => {
    const { success, error, warning, info } = useNotification();
    const showNotification = (message, type = 'info') => {
        if (type === 'success') success(message);
        else if (type === 'error') error(message);
        else if (type === 'warning') warning(message);
        else info(message);
    };

    const [reason, setReason] = useState('');
    const [loading, setLoading] = useState(false);
    const [confirmText, setConfirmText] = useState('');

    const handleCancel = async () => {
        if (confirmText !== 'CANCELAR') {
            showNotification('Escribe CANCELAR para confirmar', 'warning');
            return;
        }

        if (!reason || reason.trim().length < 10) {
            showNotification('El motivo debe tener al menos 10 caracteres', 'warning');
            return;
        }

        setLoading(true);
        try {
            const result = await api.manager.cancelEvent(eventId, reason);
            showNotification('El evento ha sido cancelado', 'success');
            if (onCancelSuccess) onCancelSuccess(result);
            onClose();
        } catch (error) {
            console.error('Error cancelling event:', error);
            showNotification(error.userMessage || 'Error al cancelar el evento', 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="⚠️ Cancelar Evento de Emergencia"
            size="medium"
        >
            <div className="text-center" style={{ padding: '1.5rem' }}>
                <div style={{ backgroundColor: '#fff3cd', color: '#856404', padding: '1rem', border: '1px solid #ffeeba', borderRadius: '0.25rem', marginBottom: '1.5rem' }}>
                    <strong style={{ fontWeight: 'bold' }}>¡ADVERTENCIA!</strong>
                    <span> Esta acción es irreversible. Se suspenderá la venta de boletos y se reembolsará automáticamente a todos los usuarios con boletos activos.</span>
                </div>

                <p style={{ color: '#6c757d', marginBottom: '1rem', textAlign: 'left' }}>
                    Por favor, explica el motivo de la cancelación. Este mensaje será visible en los registros de auditoría.
                </p>

                <textarea
                    rows="3"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="Motivo de la cancelación (mínimo 10 caracteres)..."
                    style={{ width: '100%', padding: '0.75rem', border: '1px solid #ced4da', borderRadius: '0.375rem', marginBottom: '1rem' }}
                />

                <p style={{ textAlign: 'left', fontWeight: 'bold', fontSize: '0.875rem', marginBottom: '0.5rem' }}>
                    Escribe "CANCELAR" para confirmar:
                </p>
                <input
                    type="text"
                    value={confirmText}
                    onChange={(e) => setConfirmText(e.target.value)}
                    placeholder="CANCELAR"
                    style={{ width: '100%', padding: '0.75rem', border: '1px solid #ced4da', borderRadius: '0.375rem', marginBottom: '1.5rem' }}
                />

                <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem' }}>
                    <Button variant="outline" onClick={onClose} disabled={loading}>
                        Volver
                    </Button>
                    <button
                         onClick={handleCancel}
                         disabled={loading || confirmText !== 'CANCELAR' || reason.length < 10}
                         style={{
                             backgroundColor: '#dc3545',
                             borderColor: '#dc3545',
                             color: 'white',
                             padding: '0.5rem 1rem',
                             borderRadius: '0.25rem',
                             fontWeight: '600',
                             cursor: loading || confirmText !== 'CANCELAR' ? 'not-allowed' : 'pointer',
                             opacity: loading || confirmText !== 'CANCELAR' ? 0.65 : 1
                         }}
                    >
                        {loading ? 'Cancelando...' : 'Confirmar Cancelación'}
                    </button>
                </div>
            </div>
        </Modal>
    );
};

export default CancelEventModal;
