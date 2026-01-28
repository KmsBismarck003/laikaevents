import { useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'

export const useSessionTimeout = (timeoutMinutes = 30) => {
  const navigate = useNavigate()
  const timeoutRef = useRef(null)
  const warningRef = useRef(null)

  const resetTimeout = useCallback(() => {
    // Limpiar timeouts existentes
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }
    if (warningRef.current) {
      clearTimeout(warningRef.current)
      warningRef.current = null
    }

    // Si timeout es 0, no hacer nada (deshabilitado)
    if (timeoutMinutes === 0) return

    const user = JSON.parse(localStorage.getItem('user') || '{}')

    // No aplicar timeout a administradores
    if (user.role === 'admin') return

    const timeoutMs = timeoutMinutes * 60 * 1000
    const warningMs = Math.max((timeoutMinutes - 2) * 60 * 1000, 60000)

    // Advertencia
    warningRef.current = setTimeout(() => {
      const shouldContinue = window.confirm(
        'Tu sesión expirará en 2 minutos por inactividad. ¿Deseas continuar?'
      )

      if (shouldContinue) {
        resetTimeout()
      }
    }, warningMs)

    // Cerrar sesión
    timeoutRef.current = setTimeout(async () => {
      try {
        await api.auth.logout()
      } catch (error) {
        console.error('Error al cerrar sesión:', error)
      } finally {
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        alert('Tu sesión ha expirado por inactividad')
        navigate('/login')
      }
    }, timeoutMs)
  }, [timeoutMinutes, navigate])

  useEffect(() => {
    // Si timeout es 0, no configurar nada
    if (timeoutMinutes === 0) return

    const events = [
      'mousedown',
      'mousemove',
      'keypress',
      'scroll',
      'touchstart',
      'click'
    ]

    const handleActivity = () => resetTimeout()

    events.forEach(event =>
      window.addEventListener(event, handleActivity, { passive: true })
    )
    resetTimeout()

    return () => {
      events.forEach(event => window.removeEventListener(event, handleActivity))
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
      if (warningRef.current) clearTimeout(warningRef.current)
    }
  }, [timeoutMinutes, resetTimeout])

  return { resetTimeout }
}
