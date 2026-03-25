import React, { useState, useEffect } from 'react'
import { Modal, Input, Button, Icon } from './'

/**
 * ConfirmationModal - Modal de seguridad estilo GitHub.
 * Requiere que el usuario escriba una frase específica para confirmar.
 */
const ConfirmationModal = ({
    isOpen,
    onClose,
    onConfirm,
    title = "Confirmar Acción",
    message = "¿Estás seguro de realizar esta acción?",
    confirmText = "ELIMINAR",
    placeholder = "Escribe el texto de confirmación",
    variant = "danger",
    loading = false
}) => {
    const [inputValue, setInputValue] = useState('')
    const isMatch = inputValue.trim() === confirmText

    useEffect(() => {
        if (!isOpen) {
            setInputValue('')
        }
    }, [isOpen])

    const handleConfirm = () => {
        if (isMatch) {
            onConfirm()
        }
    }

    const footer = (
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', width: '100%' }}>
            <Button variant="secondary" onClick={onClose} disabled={loading}>
                Cancelar
            </Button>
            <Button
                variant={variant}
                onClick={handleConfirm}
                disabled={!isMatch || loading}
                fullWidth={false}
            >
                {loading ? 'Procesando...' : (
                    <>
                        <Icon name={variant === 'danger' ? 'trash' : 'check'} size={14} className="mr-1" />
                        Confirmar
                    </>
                )}
            </Button>
        </div>
    )

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={title} size="small" footer={footer}>
            <div className="confirmation-modal__content" style={{ padding: '0 4px' }}>
                <p style={{
                    marginBottom: '20px',
                    fontSize: '0.95rem',
                    color: 'var(--text-primary)',
                    lineHeight: '1.5'
                }}>
                    {message}
                </p>

                <div style={{
                    background: 'rgba(255, 0, 0, 0.05)',
                    border: '1px solid rgba(255, 0, 0, 0.1)',
                    padding: '12px',
                    borderRadius: '6px',
                    marginBottom: '20px'
                }}>
                    <p style={{ fontSize: '0.85rem', margin: 0, color: 'var(--error, #ff4d4d)' }}>
                        Para confirmar, escribe: <strong style={{ userSelect: 'all' }}>{confirmText}</strong>
                    </p>
                </div>

                <Input
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    placeholder={placeholder}
                    fullWidth
                    autoFocus={true}
                />
            </div>
        </Modal>
    )
}

export default ConfirmationModal
