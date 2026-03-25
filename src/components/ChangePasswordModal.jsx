import React, { useState } from 'react'
import { Modal, Input, Button } from './'

/**
 * Modal reutilizable para que un admin cambie la contraseña de un usuario.
 */
const ChangePasswordModal = ({ isOpen, onClose, user, onSubmit }) => {
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [errors, setErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)

  const validate = () => {
    const errs = {}
    if (!newPassword) errs.newPassword = 'Contraseña requerida'
    else if (newPassword.length < 6) errs.newPassword = 'Mínimo 6 caracteres'
    if (newPassword !== confirmPassword) errs.confirmPassword = 'Las contraseñas no coinciden'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return

    setSubmitting(true)
    const ok = await onSubmit(user.id, newPassword)
    setSubmitting(false)

    if (ok) {
      setNewPassword('')
      setConfirmPassword('')
      setErrors({})
      onClose()
    }
  }

  const userName = user
    ? `${user.first_name || user.firstName || ''} ${user.last_name || user.lastName || ''}`.trim() || user.email
    : ''

  const footer = (
    <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
      <Button variant="secondary" onClick={onClose} disabled={submitting}>
        Cancelar
      </Button>
      <Button variant="primary" onClick={handleSubmit} disabled={submitting}>
        {submitting ? 'Guardando...' : 'Cambiar Contraseña'}
      </Button>
    </div>
  )

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Cambiar Contraseña" size="small" footer={footer}>
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '16px', padding: '10px', background: 'rgba(255,255,255,0.05)', borderRadius: '8px' }}>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary, #aaa)' }}>Usuario:</span>
          <strong style={{ display: 'block', marginTop: '2px' }}>{userName}</strong>
          {user?.email && <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary, #888)' }}>{user.email}</span>}
        </div>

        <Input
          label="Nueva Contraseña"
          name="newPassword"
          type="password"
          value={newPassword}
          onChange={(e) => { setNewPassword(e.target.value); if (errors.newPassword) setErrors(prev => ({ ...prev, newPassword: null })) }}
          placeholder="Mínimo 6 caracteres"
          error={errors.newPassword}
          required
          fullWidth
        />

        <Input
          label="Confirmar Contraseña"
          name="confirmPassword"
          type="password"
          value={confirmPassword}
          onChange={(e) => { setConfirmPassword(e.target.value); if (errors.confirmPassword) setErrors(prev => ({ ...prev, confirmPassword: null })) }}
          placeholder="Repetir contraseña"
          error={errors.confirmPassword}
          required
          fullWidth
        />
      </form>
    </Modal>
  )
}

export default ChangePasswordModal
