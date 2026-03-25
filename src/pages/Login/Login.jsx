import React, { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useGoogleLogin } from '@react-oauth/google'
import { useAuth } from '../../context/AuthContext'
import { useNotification } from '../../context/NotificationContext'
import { Input, Button, LockoutOverlay, LoadingScreen } from '../../components'
import './Login.css'
import './LoginSocial.css'

// Mapa de redirección por rol (inline para evitar dependencia circular con routes.js)
const roleRedirectMap = {
  admin: '/welcome',
  gestor: '/welcome',
  operador: '/welcome',
  usuario: '/user/dashboard'
}

const Login = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, login, loginGoogle, loginApple, triggerWelcomeModal, loading: authLoading } = useAuth()

  const from = location.state?.from || null
  const { success, error: showError } = useNotification()

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: true
  })

  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [isAuthenticating, setIsAuthenticating] = useState(false)
  const [loggedInUser, setLoggedInUser] = useState(null)
  const [lockoutData, setLockoutData] = useState(null)
  const [failedAttempts, setFailedAttempts] = useState(0)
  const MAX_ATTEMPTS = 3
  const LOCKOUT_SECONDS = 10 * 60 // 10 minutos

  // 🛡️ Recuperar bloqueo al montar desde localStorage (mismo navegador)
  useEffect(() => {
    const saved = localStorage.getItem('laika_lockout')
    if (saved) {
      try {
        const { email, expiresAt } = JSON.parse(saved)
        const remaining = Math.floor((new Date(expiresAt) - new Date()) / 1000)
        if (remaining > 0) {
          setFormData(prev => ({ ...prev, email }))
          setLockoutData({ email, remainingSeconds: remaining })
        } else {
          localStorage.removeItem('laika_lockout')
          setFailedAttempts(0)
        }
      } catch { localStorage.removeItem('laika_lockout') }
    }
  }, [])

  // 🚀 Redirección si ya está autenticado (evita parpadeo del login)
  useEffect(() => {
    if (!authLoading && user) {
      const targetPath = ['admin', 'gestor', 'operador'].includes(user.role) 
        ? roleRedirectMap[user.role] 
        : (from || roleRedirectMap[user.role] || '/');
      navigate(targetPath)
    }
  }, [user, authLoading, navigate, from])

  // 🔍 Verifica en el servidor si ese email está bloqueado (solo cuando el usuario lo escribe)
  const checkEmailLockout = async (emailToCheck) => {
    if (!emailToCheck || !/\S+@\S+\.\S+/.test(emailToCheck)) return
    try {
      const API = process.env.REACT_APP_API_URL || 'http://localhost:8000'
      const res = await fetch(`${API}/api/auth/check-lockout?email=${encodeURIComponent(emailToCheck)}`)
      if (!res.ok) return
      const data = await res.json()
      if (data.locked && data.retry_after > 0) {
        const expiresAt = new Date(Date.now() + data.retry_after * 1000).toISOString()
        localStorage.setItem('laika_lockout', JSON.stringify({ email: emailToCheck, expiresAt }))
        setLockoutData({ remainingSeconds: data.retry_after })
        setFailedAttempts(MAX_ATTEMPTS)
      } else if (data.failed_attempts > 0) {
        setFailedAttempts(data.failed_attempts)
      }
    } catch { /* silencioso */ }
  }

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
    // Guardar email para verificar bloqueo en otro navegador
    localStorage.setItem('laika_last_email', formData.email)

    try {
      const result = await login(formData)

      if (result?.success) {
        localStorage.removeItem('laika_lockout')
        setFailedAttempts(0)
        setLoggedInUser(result.user)
        
        // Fase 2: Efecto de "Verificando" Premium (5 segundos)
        setIsAuthenticating(true)
        await new Promise(resolve => setTimeout(resolve, 5000))
        setIsAuthenticating(false)
        
        // Fase 3: Gatillar Bienvenida Global y Redirigir
        triggerWelcomeModal()
        const targetPath = ['admin', 'gestor', 'operador'].includes(result.user.role) 
          ? roleRedirectMap[result.user.role] 
          : (from || roleRedirectMap[result.user.role] || '/');
        navigate(targetPath)
      } else {
        if (result.status === 423) {
          // Bloqueado por el servidor
          const retryAfter = result.error?.retry_after || LOCKOUT_SECONDS
          const expiresAt = new Date(Date.now() + retryAfter * 1000).toISOString()
          localStorage.setItem('laika_lockout', JSON.stringify({ email: formData.email, expiresAt }))
          setLockoutData({ remainingSeconds: retryAfter })
          setFailedAttempts(MAX_ATTEMPTS)
        } else {
          // Contraseña incorrecta — leer intentos del servidor
          const detail = result.error // puede ser objeto o string
          const serverAttempts = detail?.attempts ?? (failedAttempts + 1)
          const maxAttempts = detail?.max_attempts ?? MAX_ATTEMPTS
          setFailedAttempts(serverAttempts)

          if (serverAttempts >= maxAttempts) {
            // El servidor ya bloqueó, pero no devuelvió 423 - bloquear frontend igual
            const expiresAt = new Date(Date.now() + LOCKOUT_SECONDS * 1000).toISOString()
            localStorage.setItem('laika_lockout', JSON.stringify({ email: formData.email, expiresAt }))
            setLockoutData({ remainingSeconds: LOCKOUT_SECONDS })
          } else {
            setErrors(prev => ({ ...prev, password: ' ' })) // clear input error, shown in indicator
          }
        }
      }
    } catch (err) {
      console.error('Error en login:', err)
      showError('Error al iniciar sesión. Intenta nuevamente.')
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleSuccess = async (tokenResponse) => {
    setLoading(true)
    try {
      const result = await loginGoogle(tokenResponse.credential || tokenResponse.access_token)
      if (result.success) {
        setLoggedInUser(result.user)
        
        // Fase 2: Efecto de "Verificando" Premium (4 segundos)
        setIsAuthenticating(true)
        await new Promise(resolve => setTimeout(resolve, 4000))
        setIsAuthenticating(false)
        
        // Fase 3: Gatillar Bienvenida Global y Redirigir
        triggerWelcomeModal()
        const targetPath = ['admin', 'gestor', 'operador'].includes(result.user.role) 
          ? roleRedirectMap[result.user.role] 
          : (from || roleRedirectMap[result.user.role] || '/');
        navigate(targetPath)
      } else {
        showError(result.error || 'Error al autenticar con Google')
      }
    } catch (err) {
      showError('Falla crítica en autenticación de Google')
    } finally {
      setLoading(false)
    }
  }

  const googleLogin = useGoogleLogin({
    onSuccess: handleGoogleSuccess,
    onError: () => showError('Inicio de sesión de Google fallido'),
    flow: 'implicit' // Usaremos el flujo implícito para obtener el token fácil
  });

  const handleLockoutComplete = () => {
    setLockoutData(null)
    localStorage.removeItem('laika_lockout')
  }

  return (
    <div className='login-page'>
      <div className='login-container'>
        <div className='login-card'>
          {lockoutData && (
            <LockoutOverlay
              remainingSeconds={lockoutData.remainingSeconds}
              email={formData.email}
              onComplete={handleLockoutComplete}
              onSwitchAccount={() => {
                setLockoutData(null)
                setFormData({ email: '', password: '' })
                localStorage.removeItem('laika_lockout')
              }}
            />
          )}
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
              onChange={e => {
                handleChange(e)
                // Si cambió el email y había bloqueo activo para otro correo, limpiar
                if (lockoutData && e.target.value !== formData.email) {
                  const saved = localStorage.getItem('laika_lockout')
                  if (saved) {
                    try {
                      const { email: lockedEmail } = JSON.parse(saved)
                      if (e.target.value.toLowerCase() !== lockedEmail?.toLowerCase()) {
                        setLockoutData(null)
                        setFailedAttempts(0)
                      }
                    } catch { /* ok */ }
                  }
                }
              }}
              onBlur={e => checkEmailLockout(e.target.value)}
              placeholder='tu@email.com'
              error={errors.email}
              fullWidth
              required
              disabled={!!lockoutData}
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
              disabled={!!lockoutData}
            />

            {/* — Indicador de intentos — */}
            {failedAttempts > 0 && failedAttempts < MAX_ATTEMPTS && (() => {
              const remaining = MAX_ATTEMPTS - failedAttempts
              const colors = [
                null,
                { bg: '#dcfce7', border: '#16a34a', text: '#15803d', bar: '#22c55e' }, // 1 intento
                { bg: '#fff7ed', border: '#ea580c', text: '#c2410c', bar: '#f97316' }, // 2 intentos
              ]
              const c = colors[failedAttempts] || colors[2]
              return (
                <div style={{
                  border: `1.5px solid ${c.border}`,
                  background: c.bg,
                  borderRadius: '10px',
                  padding: '10px 14px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.78rem', fontWeight: 700, color: c.text }}>
                      {failedAttempts === 1 ? '⚠️ Contraseña incorrecta' : '🔴 Último intento antes del bloqueo'}
                    </span>
                    <span style={{ fontSize: '0.7rem', fontWeight: 800, color: c.text }}>
                      {failedAttempts}/{MAX_ATTEMPTS}
                    </span>
                  </div>
                  {/* Barra de progreso */}
                  <div style={{ height: '4px', background: 'rgba(0,0,0,0.08)', borderRadius: '99px', overflow: 'hidden' }}>
                    <div style={{
                      height: '100%',
                      width: `${(failedAttempts / MAX_ATTEMPTS) * 100}%`,
                      background: c.bar,
                      borderRadius: '99px',
                      transition: 'width 0.4s ease'
                    }} />
                  </div>
                  <span style={{ fontSize: '0.7rem', color: c.text }}>
                    Te queda{remaining === 1 ? '' : 'n'} <strong>{remaining} intento{remaining === 1 ? '' : 's'}</strong> antes del bloqueo de 10 minutos.
                  </span>
                </div>
              )
            })()}

            <div className='login-options'>
              <label className='remember-me'>
                <input 
                  type='checkbox' 
                  name='rememberMe'
                  checked={formData.rememberMe}
                  onChange={e => setFormData(prev => ({ ...prev, rememberMe: e.target.checked }))}
                />
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
              disabled={!!lockoutData}
            >
              Iniciar Sesión
            </Button>
          </form>

          <div className="social-login-divider">
            <span>O continúa con</span>
          </div>

          <div className="social-login-grid">
            <button
              className="social-btn google"
              onClick={() => googleLogin()}
              type="button"
            >
              <svg className="social-svg" viewBox="0 0 24 24" width="20" height="20">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              Gmail
            </button>
          </div>

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

      {isAuthenticating && <LoadingScreen />}
    </div>
  )
}

export default Login
