import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback
} from 'react'

const AuthContext = createContext(null)

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    try {
      const token = localStorage.getItem('token')
      const userData = localStorage.getItem('user')

      if (token && userData) {
        setUser(JSON.parse(userData))
      }
    } catch (error) {
      console.error('Error al verificar autenticación:', error)
      localStorage.removeItem('token')
      localStorage.removeItem('user')
    } finally {
      setLoading(false)
    }
  }

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

      // Guardar token y usuario
      localStorage.setItem('token', data.token)
      localStorage.setItem('user', JSON.stringify(data.user))
      setUser(data.user)

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

      return { success: true, user: data.user }
    } catch (error) {
      console.error('Error en register:', error)
      return {
        success: false,
        error: 'Error de conexión con el servidor'
      }
    }
  }

  // ✅ CORRECCIÓN: Sin useNavigate, solo limpiar estado
  const logout = useCallback(() => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setUser(null)
    // El componente que llame logout debe manejar la navegación
  }, [])

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

  const isAuthenticated = useCallback(() => !!user, [user])

  const value = {
    user,
    loading,
    login,
    register,
    logout,
    updateUser,
    hasRole,
    isAuthenticated
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
