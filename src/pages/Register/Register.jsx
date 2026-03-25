import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useGoogleLogin } from '@react-oauth/google'
import { Input, Button, Alert } from '../../components'
import api from '../../services/api'
import { useNotification } from '../../context/NotificationContext'
import { useAuth } from '../../context/AuthContext'
import './Register.css'
import '../Login/LoginSocial.css'

const roleRedirectMap = {
  admin: '/admin',
  gestor: '/events/manage',
  operador: '/staff',
  usuario: '/user/dashboard'
}

const Register = () => {
  const navigate = useNavigate()
  const { loginGoogle } = useAuth()
  const { error: showError } = useNotification()
  const [formData, setFormData] = useState({
    email: '',
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
    if (!formData.email) {
      newErrors.email = 'El email es requerido'
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email inválido'
    }
    if (!formData.password) {
      newErrors.password = 'La contraseña es requerida'
    } else if (formData.password.length < 8) {
      newErrors.password = 'Mínimo 8 caracteres'
    }
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'No coinciden'
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
    try {
      // Simplificado: solo email y password
      const response = await api.auth.register({
        email: formData.email,
        password: formData.password
      })
      if (response.token && response.user) {
        localStorage.setItem('token', response.token)
        localStorage.setItem('user', JSON.stringify(response.user))
        setAlert({ type: 'success', message: '¡Bienvenido a LAIKA Club!' })
        setTimeout(() => navigate('/'), 1500)
      }
    } catch (error) {
      setAlert({ type: 'error', message: error.message || 'Error en el registro' })
    } finally {
      setLoading(false)
    }
  }

  const googleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setLoading(true)
      try {
        const result = await loginGoogle(tokenResponse.credential || tokenResponse.access_token)
        if (result.success) {
          navigate(roleRedirectMap[result.user.role] || '/')
        } else {
          showError(result.error || 'Error con Google')
        }
      } catch (err) {
        showError('Falla en Google login')
      } finally {
        setLoading(false)
      }
    },
    onError: () => showError('Error al conectar con Google'),
    flow: 'implicit'
  })

  return (
    <div className='register-page'>
      <div className='register-container'>
        <div className='register-card'>
          <div className='register-header'>
            <h1 className='register-title'>Únete a LAIKA</h1>
            <p className='register-subtitle'>Crea tu cuenta premium en segundos</p>
          </div>

          {alert && <Alert type={alert.type} message={alert.message} closable onClose={() => setAlert(null)} />}

          <form onSubmit={handleSubmit} className='register-form'>
            <Input
              label='Email'
              type='email'
              name='email'
              value={formData.email}
              onChange={handleChange}
              error={errors.email}
              fullWidth
              required
            />

            <div className="password-field-container">
              <Input
                label='Contraseña'
                type='password'
                name='password'
                value={formData.password}
                onChange={handleChange}
                error={errors.password}
                fullWidth
                required
              />
              <div className="password-strength">
                <div className="strength-bar">
                  <div className="strength-fill" style={{
                    width: `${(Object.values({ l: formData.password.length >= 8, u: /[A-Z]/.test(formData.password), d: /\d/.test(formData.password) }).filter(Boolean).length / 3) * 100}%`,
                    backgroundColor: '#10b981'
                  }} />
                </div>
                <div className="strength-requirements">
                  <span className={formData.password.length >= 8 ? 'valid' : ''}>8+ carac</span>
                  <span className={/[A-Z]/.test(formData.password) ? 'valid' : ''}>Mayús</span>
                  <span className={/\d/.test(formData.password) ? 'valid' : ''}>Núm</span>
                </div>
              </div>
            </div>

            <Input
              label='Confirmar Contraseña'
              type='password'
              name='confirmPassword'
              value={formData.confirmPassword}
              onChange={handleChange}
              error={errors.confirmPassword}
              fullWidth
              required
            />

            <Button type='submit' variant='primary' size='large' fullWidth loading={loading}>
              CREAR CUENTA
            </Button>
          </form>

          <div className="social-login-divider"><span>O continúa con</span></div>
          <div className="social-login-grid">
            <button className="social-btn google" onClick={() => googleLogin()} type="button">
              <svg className="social-svg" viewBox="0 0 24 24" width="20" height="20">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              Gmail
            </button>
          </div>

          <div className='register-footer'>
            <p>¿Ya tienes cuenta? <a href='/login' className='login-link'>Inicia sesión</a></p>
          </div>
        </div>

        <div className='register-illustration'>
          <div className='illustration-content'>
            <h2>Registro Instantáneo</h2>
            <p>Accede a la plataforma más potente de eventos sin complicaciones.</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Register
