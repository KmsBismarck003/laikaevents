import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useNotification } from '../context/NotificationContext'
import { Input, Button } from '../components'
import './Login.css'

const Login = () => {
  const navigate = useNavigate()
  const { login } = useAuth()
  const { success, error: showError } = useNotification()

  const [formData, setFormData] = useState({
    email: '',
    password: ''
  })

  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)

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

    if (!formData.email) {
      newErrors.email = 'El email es requerido'
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email inválido'
    }

    if (!formData.password) {
      newErrors.password = 'La contraseña es requerida'
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
    console.log('🔵 Intentando login con:', formData)

    try {
      const result = await login(formData)
      console.log('🟢 Resultado del login:', result)

      if (result?.success) {
        success('Inicio de sesión exitoso')
        console.log('🟢 Usuario logueado:', result.user)
        console.log('🟢 Rol detectado:', result.user?.role)

        const role = result.user?.role

        if (role === 'admin') {
          navigate('/admin')
        } else if (role === 'gestor') {
          navigate('/events/manage')
        } else if (role === 'operador') {
          navigate('/staff')
        } else {
          navigate('/')
        }
      } else {
        showError(result?.error || 'Error al iniciar sesión')
      }
    } catch (err) {
      console.error('🔴 Error en login:', err)
      showError('Error al iniciar sesión. Intenta nuevamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className='login-page'>
      <div className='login-container'>
        <div className='login-card'>
          <div className='login-header'>
            <h1 className='login-title'>LAIKA Club</h1>
            <p className='login-subtitle'>Inicia sesión en tu cuenta</p>
          </div>

          <form onSubmit={handleSubmit} className='login-form'>
            <Input
              label='Email'
              type='email'
              name='email'
              value={formData.email}
              onChange={handleChange}
              placeholder='tu@email.com'
              error={errors.email}
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
              fullWidth
              required
            />

            <div className='login-options'>
              <label className='remember-me'>
                <input type='checkbox' />
                <span>Recordarme</span>
              </label>

              <a href='/forgot-password' className='forgot-password'>
                ¿Olvidaste tu contraseña?
              </a>
            </div>

            <Button
              type='submit'
              variant='primary'
              size='large'
              fullWidth
              loading={loading}
            >
              Iniciar Sesión
            </Button>
          </form>

          <div className='login-footer'>
            <p>
              ¿No tienes una cuenta?{' '}
              <a href='/register' className='register-link'>
                Regístrate aquí
              </a>
            </p>
          </div>
        </div>

        <div className='login-illustration'>
          <div className='illustration-content'>
            <h2>Bienvenido a LAIKA Club</h2>
            <p>Descubre los mejores eventos y experiencias</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Login
