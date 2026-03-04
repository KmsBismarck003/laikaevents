import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Input, Button, Alert } from '../components'
import api from '../services/api' // ← IMPORTAR LA API
import './Register.css'

const Register = () => {
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: ''
  })
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [alert, setAlert] = useState(null)

  const handleChange = e => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }))
    }
  }

  const validateForm = () => {
    const newErrors = {}

    if (!formData.firstName.trim()) {
      newErrors.firstName = 'El nombre es requerido'
    }

    if (!formData.lastName.trim()) {
      newErrors.lastName = 'El apellido es requerido'
    }

    if (!formData.email) {
      newErrors.email = 'El email es requerido'
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email inválido'
    }

    if (!formData.phone) {
      newErrors.phone = 'El teléfono es requerido'
    } else if (!/^\d{10}$/.test(formData.phone.replace(/\s/g, ''))) {
      newErrors.phone = 'Teléfono inválido (10 dígitos)'
    }

    if (!formData.password) {
      newErrors.password = 'La contraseña es requerida'
    } else if (formData.password.length < 8) {
      newErrors.password = 'La contraseña debe tener al menos 8 caracteres'
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
      newErrors.password = 'Debe contener mayúsculas, minúsculas y números'
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Las contraseñas no coinciden'
    }

    return newErrors
  }

  const handleSubmit = async e => {
    e.preventDefault()

    const newErrors = validateForm()
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    setLoading(true)
    setAlert(null)

    console.log('Enviando datos de registro:', formData)

    try {
      // Usar la API real
      const response = await api.auth.register({
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        phone: formData.phone,
        password: formData.password
      })

      console.log('Respuesta del servidor:', response)

      // Verificar si la respuesta tiene token y user
      if (response.token && response.user) {
        // Guardar token y usuario en localStorage
        localStorage.setItem('token', response.token)
        localStorage.setItem('user', JSON.stringify(response.user))

        setAlert({
          type: 'success',
          message: `¡Registro exitoso! Bienvenido ${response.user.firstName}`
        })

        // Redirigir al home o login después de 1.5 segundos
        setTimeout(() => {
          navigate('/') // O puedes redirigir a '/login'
        }, 1500)
      } else {
        throw new Error('Respuesta del servidor incompleta')
      }
    } catch (error) {
      console.error('Error en registro:', error)

      // Manejar diferentes tipos de errores
      let errorMessage = 'Error al registrar usuario. Intenta nuevamente.'

      if (error.status === 400) {
        errorMessage = error.message || 'El email ya está registrado'
      } else if (error.status === 422) {
        errorMessage = 'Datos de registro inválidos'
      } else if (error.status >= 500) {
        errorMessage = 'Error del servidor. Intenta más tarde.'
      }

      setAlert({
        type: 'error',
        message: errorMessage
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className='register-page'>
      <div className='register-container'>
        <div className='register-card'>
          <div className='register-header'>
            <h1 className='register-title'>LAIKA Club</h1>
            <p className='register-subtitle'>Crea tu cuenta</p>
          </div>

          {alert && (
            <Alert
              type={alert.type}
              message={alert.message}
              closable
              onClose={() => setAlert(null)}
            />
          )}

          <form onSubmit={handleSubmit} className='register-form'>
            <div className='form-row'>
              <Input
                label='Nombre'
                type='text'
                name='firstName'
                value={formData.firstName}
                onChange={handleChange}
                placeholder='Juan'
                error={errors.firstName}
                icon={<svg width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round'><path d='M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2' /><circle cx='12' cy='7' r='4' /></svg>}
                fullWidth
                required
              />

              <Input
                label='Apellido'
                type='text'
                name='lastName'
                value={formData.lastName}
                onChange={handleChange}
                placeholder='Pérez'
                error={errors.lastName}
                fullWidth
                required
              />
            </div>

            <Input
              label='Email'
              type='email'
              name='email'
              value={formData.email}
              onChange={handleChange}
              placeholder='tu@email.com'
              error={errors.email}
              icon={<svg width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round'><rect x='2' y='4' width='20' height='16' rx='2' /><path d='M22 7l-10 7L2 7' /></svg>}
              fullWidth
              required
            />

            <Input
              label='Teléfono'
              type='tel'
              name='phone'
              value={formData.phone}
              onChange={handleChange}
              placeholder='55 1234 5678'
              error={errors.phone}
              icon={<svg width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round'><rect x='5' y='2' width='14' height='20' rx='2' ry='2' /><line x1='12' y1='18' x2='12.01' y2='18' /></svg>}
              fullWidth
              required
            />

            <Input
              label='Contraseña'
              type='password'
              name='password'
              value={formData.password}
              onChange={handleChange}
              placeholder='••••••••'
              error={errors.password}
              icon={<svg width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round'><rect x='3' y='11' width='18' height='11' rx='2' ry='2' /><path d='M7 11V7a5 5 0 0 1 10 0v4' /></svg>}
              helperText='Mínimo 8 caracteres, mayúsculas, minúsculas y números'
              fullWidth
              required
            />

            <Input
              label='Confirmar Contraseña'
              type='password'
              name='confirmPassword'
              value={formData.confirmPassword}
              onChange={handleChange}
              placeholder='••••••••'
              error={errors.confirmPassword}
              icon={<svg width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round'><rect x='3' y='11' width='18' height='11' rx='2' ry='2' /><path d='M7 11V7a5 5 0 0 1 10 0v4' /></svg>}
              fullWidth
              required
            />

            <div className='terms-section'>
              <label className='terms-label'>
                <input type='checkbox' required />
                <span>
                  Acepto los{' '}
                  <a href='/terms' target='_blank'>
                    términos y condiciones
                  </a>{' '}
                  y la{' '}
                  <a href='/privacy' target='_blank'>
                    política de privacidad
                  </a>
                </span>
              </label>
            </div>

            <Button
              type='submit'
              variant='primary'
              size='large'
              fullWidth
              loading={loading}
            >
              Crear Cuenta
            </Button>
          </form>

          <div className='register-footer'>
            <p>
              ¿Ya tienes una cuenta?{' '}
              <a href='/login' className='login-link'>
                Inicia sesión aquí
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Register
