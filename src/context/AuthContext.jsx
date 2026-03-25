import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback
} from 'react'
import { useNavigate } from 'react-router-dom'
import api, { authAPI } from '../services'

const AuthContext = createContext(null)

export const AuthProvider = ({ children }) => {
  const standardizeUser = (u) => {
    if (!u) return null;
    return {
      ...u,
      firstName: u.firstName || u.first_name || '',
      lastName: u.lastName || u.last_name || '',
      avatarUrl: u.avatarUrl || u.avatar_url || '',
      laikaPoints: u.laikaPoints || u.laika_points || 0
    };
  };

  const [user, setUserState] = useState(() => {
    try {
      const savedUser = localStorage.getItem('user') || sessionStorage.getItem('user')
      return savedUser ? standardizeUser(JSON.parse(savedUser)) : null
    } catch (e) {
      return null
    }
  })

  // Helper para manejar persistencia
  const saveAuthData = (token, user, remember) => {
    const storage = remember ? localStorage : sessionStorage;
    const otherStorage = remember ? sessionStorage : localStorage;
    
    storage.setItem('token', token);
    storage.setItem('user', JSON.stringify(user));
    
    // Limpiar el otro storage para evitar conflictos
    otherStorage.removeItem('token');
    otherStorage.removeItem('user');
  };

  const setUser = (u) => {
    const std = standardizeUser(u);
    // Si estamos actualizando (como en updateUser), mantenemos el storage donde ya esté
    if (std) {
      if (localStorage.getItem('token')) localStorage.setItem('user', JSON.stringify(std));
      else sessionStorage.setItem('user', JSON.stringify(std));
    } else {
      localStorage.removeItem('user');
      sessionStorage.removeItem('user');
      localStorage.removeItem('token');
      sessionStorage.removeItem('token');
    }
    setUserState(std);
  };
  const [loading, setLoading] = useState(true)
  const [loggingOut, setLoggingOut] = useState(false)
  const [isGuestPreview, setIsGuestPreview] = useState(false)
  const [showGlobalWelcome, setShowGlobalWelcome] = useState(false) 
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false)
  const [onAuthSuccess, setOnAuthSuccess] = useState(null)
  
  const openAuthModal = (callback = null) => {
    setOnAuthSuccess(() => callback);
    setIsAuthModalOpen(true);
  };
  
  const closeAuthModal = () => {
    setIsAuthModalOpen(false);
    setOnAuthSuccess(null);
  };

  const navigate = useNavigate()

  // 1. Logout Function
  const logout = useCallback(async (redirect = true) => {
    if (redirect) {
      setLoggingOut(true)
      // Simular cierre de sesión premium (2 segundos)
      await new Promise(resolve => setTimeout(resolve, 2000))
    }

    try {
      // Registrar salida en el servidor si no es un cierre forzado/local
      await authAPI.logout()
    } catch (err) {
      console.warn('No se pudo registrar logout en servidor:', err)
    }

    localStorage.removeItem('token')
    localStorage.removeItem('user')
    sessionStorage.removeItem('token')
    sessionStorage.removeItem('user')
    setUserState(null)
    setIsGuestPreview(false)
    
    if (redirect) {
      setLoggingOut(false)
      navigate('/')
    }
  }, [navigate])

  // 2. Tab Synchronization
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === 'token' && e.newValue === null) {
        setUser(null)
        setIsGuestPreview(false)
      }
    }

    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [])

  // 3. Check Authentication
  const checkAuth = useCallback(async () => {
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token')
      const storedUser = localStorage.getItem('user') || sessionStorage.getItem('user')

      if (!token || !storedUser) {
        if (user) logout(false)
        setLoading(false)
        return
      }

      try {
        const data = await authAPI.verifyToken()
        if (data.valid && data.user) {
          // Comparar permisos para notificar "Sigue trabajando"
          const oldPermissions = user?.permissions || {}
          const newPermissions = data.user.permissions || {}

          const permissionGranted = Object.keys(newPermissions).some(
            key => newPermissions[key] && !oldPermissions[key]
          )

          setUser(data.user)
          localStorage.setItem('user', JSON.stringify(data.user))

          if (permissionGranted && user) {
            // Aquí se activaría la notificación de "Sigue trabajando"
            console.log("¡Acceso concedido! Sigue trabajando.")
          }
        } else {
          // Si el servidor responde pero dice que no es válido
          throw { status: 401, message: 'Token inválido' }
        }
      } catch (error) {
        // Si el error es de red (no tiene status) o es un 5xx, NO deslogueamos
        if (error.status === 401 || error.status === 403) {
          throw error
        }
        console.warn('Servidor no disponible o error interno. Manteniendo sesión local.')
      }
    } catch (error) {
      if (error.status === 401 || error.status === 403) {
        console.warn('Sesión expirada confirmada:', error.message)
        logout(false)
      }
    } finally {
      // Retirar el retraso artificial de 5 segundos para que los refrescos (F5) sean instantáneos.
      // El efecto cinematográfico se reserva para el Login y Logout explícitos.
      setLoading(false)
    }
  }, [user, logout])

  // Initial Check
  useEffect(() => {
    checkAuth()
  }, [])

  const login = async credentials => {
    try {
      const data = await authAPI.login(credentials)

      saveAuthData(data.token, data.user, credentials.rememberMe);
      setUserState(standardizeUser(data.user))
      setIsGuestPreview(false)

      return { success: true, user: data.user }
    } catch (error) {
      console.error('Error en login:', error)
      return {
        success: false,
        status: error.status,
        error: error.message || 'Error de conexión con el servidor'
      }
    }
  }

  const register = async userData => {
    try {
      const data = await authAPI.register(userData)

      localStorage.setItem('token', data.token)
      localStorage.setItem('user', JSON.stringify(data.user))
      setUser(data.user)
      setIsGuestPreview(false)

      return { success: true, user: data.user }
    } catch (error) {
      console.error('Error en register:', error)
      return {
        success: false,
        error: error.message || 'Error de conexión con el servidor'
      }
    }
  }

  const loginApple = async (email) => {
    try {
      const data = await authAPI.loginApple(email)
      localStorage.setItem('token', data.token)
      localStorage.setItem('user', JSON.stringify(data.user))
      setUser(data.user)
      setIsGuestPreview(false)
      return { success: true, user: data.user }
    } catch (error) {
      console.error('Error en Apple login:', error)
      return { success: false, error: error.message || 'Error de conexión' }
    }
  }

  const loginGoogle = async (token) => {
    try {
      const data = await authAPI.loginGoogle(token)
      localStorage.setItem('token', data.token)
      localStorage.setItem('user', JSON.stringify(data.user))
      setUser(data.user)
      setIsGuestPreview(false)
      return { success: true, user: data.user }
    } catch (error) {
      console.error('Error en Google login:', error)
      return { success: false, error: error.message || 'Error de conexión' }
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

  const triggerWelcomeModal = () => {
    // Desactivado a petición del usuario
    console.log("Welcome modal bypass")
  }

  const isAuthenticated = useCallback(() => !!user, [user])

  const value = {
    user,
    loading,
    login,
    loginGoogle,
    loginApple,
    register,
    logout,
    updateUser,
    hasRole,
    isAuthenticated,
    isGuestPreview,
    loggingOut,
    toggleGuestPreview,
    showGlobalWelcome,
    triggerWelcomeModal,
    setWelcomeVisibility: setShowGlobalWelcome,
    isAuthModalOpen,
    openAuthModal,
    closeAuthModal,
    onAuthSuccess
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
