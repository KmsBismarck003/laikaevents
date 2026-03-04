import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback
} from 'react'
import { useNavigate } from 'react-router-dom'

const AuthContext = createContext(null)

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [isGuestPreview, setIsGuestPreview] = useState(false)
  const navigate = useNavigate()

  // 1. Logout Function (Defined first to be used by checkAuth)
  const logout = useCallback((redirect = true) => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setUser(null)
    setIsGuestPreview(false)
    if (redirect) {
      navigate('/login')
    }
  }, [navigate])

  // 2. Tab Synchronization
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === 'token' && e.newValue === null) {
        // Si se borra el token en otra pestaña, cerrar sesión aquí también
        setUser(null)
        setIsGuestPreview(false)
      }
    }

    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [])

  // 3. Check Authentication (Backend Verification)
  const checkAuth = useCallback(async () => {
    try {
      const token = localStorage.getItem('token')
      const storedUser = localStorage.getItem('user')

      if (!token || !storedUser) {
        if (user) logout(false)
        setLoading(false)
        return
      }

      // Timeout Safety: 5 seconds
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 5000)

      try {
        const response = await fetch('http://localhost:8000/api/auth/verify', {
          headers: {
            'Authorization': `Bearer ${token}`
          },
          signal: controller.signal
        })
        clearTimeout(timeoutId)

        if (response.ok) {
          const data = await response.json()
          if (data.valid && data.user) {
            setUser(data.user)
            localStorage.setItem('user', JSON.stringify(data.user))
          } else {
            throw new Error('Datos de verificación inválidos')
          }
        } else {
          throw new Error('Sesión expirada')
        }
      } catch (networkError) {
        clearTimeout(timeoutId)
        console.warn('Network/Verify Error:', networkError)
        // If it's an abort error (timeout), valid assumption is backend might be down/slow
        // We should PROBABLY logout to be safe, or allow offline access?
        // User requested strict auth: so we logout.
        throw networkError
      }

    } catch (error) {
      console.warn('Sesión no válida:', error.message)
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      setUser(null)
    } finally {
      setLoading(false)
    }
  }, [user, logout])

  // Initial Check
  useEffect(() => {
    checkAuth()
  }, [])

  const login = async credentials => {
    try {
      const response = await fetch('http://localhost:8000/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(credentials)
      })

      const data = await response.json()

      if (!response.ok) {
        return {
          success: false,
          error: data.detail || 'Credenciales inválidas'
        }
      }

      localStorage.setItem('token', data.token)
      localStorage.setItem('user', JSON.stringify(data.user))
      setUser(data.user)
      setIsGuestPreview(false)

      return { success: true, user: data.user }
    } catch (error) {
      console.error('Error en login:', error)
      return {
        success: false,
        error: 'Error de conexión con el servidor'
      }
    }
  }

  const register = async userData => {
    try {
      const response = await fetch('http://localhost:8000/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(userData)
      })

      const data = await response.json()

      if (!response.ok) {
        return {
          success: false,
          error: data.detail || 'Error al registrar usuario'
        }
      }

      localStorage.setItem('token', data.token)
      localStorage.setItem('user', JSON.stringify(data.user))
      setUser(data.user)
      setIsGuestPreview(false)

      return { success: true, user: data.user }
    } catch (error) {
      console.error('Error en register:', error)
      return {
        success: false,
        error: 'Error de conexión con el servidor'
      }
    }
  }

  const updateUser = async updates => {
    try {
      const updatedUser = { ...user, ...updates }
      localStorage.setItem('user', JSON.stringify(updatedUser))
      setUser(updatedUser)
      return { success: true, user: updatedUser }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }

  const hasRole = useCallback(
    roles => {
      if (!user) return false
      if (Array.isArray(roles)) return roles.includes(user.role)
      return user.role === roles
    },
    [user]
  )

  const toggleGuestPreview = () => {
    setIsGuestPreview(prev => !prev)
  }

  const isAuthenticated = useCallback(() => !!user, [user])

  const value = {
    user,
    loading,
    login,
    register,
    logout,
    updateUser,
    hasRole,
    isAuthenticated,
    isGuestPreview,
    toggleGuestPreview
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth debe usarse dentro de AuthProvider')
  }
  return context
}

export default AuthContext
