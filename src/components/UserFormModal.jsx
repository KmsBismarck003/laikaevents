import React, { useState } from 'react'
import { Modal, Input, Button } from './'

/**
 * Modal reutilizable para crear un usuario nuevo desde admin.
 * Usa los componentes existentes Modal, Input y Button.
 */
const UserFormModal = ({ isOpen, onClose, onSubmit }) => {
  const [form, setForm] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    role: 'usuario'
  })
  const [errors, setErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: null }))
  }

  const validate = () => {
    const errs = {}
    if (!form.first_name.trim()) errs.first_name = 'Nombre requerido'
    if (!form.last_name.trim()) errs.last_name = 'Apellido requerido'
    if (!form.email.trim()) errs.email = 'Email requerido'
    else if (!/\S+@\S+\.\S+/.test(form.email)) errs.email = 'Email inválido'
    if (!form.password) errs.password = 'Contraseña requerida'
    else if (form.password.length < 6) errs.password = 'Mínimo 6 caracteres'
    if (form.password !== form.confirmPassword) errs.confirmPassword = 'Las contraseñas no coinciden'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return

    setSubmitting(true)
    const { confirmPassword, ...userData } = form
    const ok = await onSubmit(userData)
    setSubmitting(false)

    if (ok) {
      // Resetear form
      setForm({ first_name: '', last_name: '', email: '', phone: '', password: '', confirmPassword: '', role: 'usuario' })
      setErrors({})
      onClose()
    }
  }

  const footer = (
    <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
      <Button variant="secondary" onClick={onClose} disabled={submitting}>
        Cancelar
      </Button>
      <Button variant="primary" onClick={handleSubmit} disabled={submitting}>
        {submitting ? 'Creando...' : 'Crear Usuario'}
      </Button>
    </div>
  )

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Nuevo Usuario" size="medium" footer={footer}>
      <form onSubmit={handleSubmit} className="user-form-modal">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <Input
            label="Nombre"
            name="first_name"
            value={form.first_name}
            onChange={handleChange}
            placeholder="Nombre"
            error={errors.first_name}
            required
            fullWidth
          />
          <Input
            label="Apellido"
            name="last_name"
            value={form.last_name}
            onChange={handleChange}
            placeholder="Apellido"
            error={errors.last_name}
            required
            fullWidth
          />
        </div>

        <Input
          label="Email"
          name="email"
          type="email"
          value={form.email}
          onChange={handleChange}
          placeholder="usuario@ejemplo.com"
          error={errors.email}
          required
          fullWidth
        />

        <Input
          label="Teléfono"
          name="phone"
          value={form.phone}
          onChange={handleChange}
          placeholder="(Opcional)"
          fullWidth
        />

        <div style={{ marginBottom: '12px' }}>
          <label className="input__label" htmlFor="role">
            Rol <span className="input__required">*</span>
          </label>
          <select
            id="role"
            name="role"
            value={form.role}
            onChange={handleChange}
            className="user-form-select"
          >
            <option value="usuario">Usuario</option>
            <option value="operador">Operador</option>
            <option value="gestor">Gestor</option>
            <option value="admin">Administrador</option>
          </select>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <Input
            label="Contraseña"
            name="password"
            type="password"
            value={form.password}
            onChange={handleChange}
            placeholder="Mínimo 6 caracteres"
            error={errors.password}
            required
            fullWidth
          />
          <Input
            label="Confirmar Contraseña"
            name="confirmPassword"
            type="password"
            value={form.confirmPassword}
            onChange={handleChange}
            placeholder="Repetir contraseña"
            error={errors.confirmPassword}
            required
            fullWidth
          />
        </div>
      </form>
    </Modal>
  )
}

export default UserFormModal
