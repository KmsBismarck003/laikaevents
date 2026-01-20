import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

/**
 * Hook personalizado para manejo de autenticación
 * Gestiona el estado del usuario, login, logout y verificación de token
 */
const useAuth = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  // Verificar si hay un usuario autenticado al cargar
  useEffect(() => {
    checkAuth();
  }, []);

  /**
   * Verificar autenticación actual
   */
  const checkAuth = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const userData = localStorage.getItem('user');

      if (token && userData) {
        // TODO: Verificar token con API
        // const response = await verifyToken(token);
        
        // Simulación de verificación
        await new Promise(resolve => setTimeout(resolve, 500));
        
        setUser(JSON.parse(userData));
      } else {
        setUser(null);
      }
    } catch (err) {
      console.error('Error al verificar autenticación:', err);
      setUser(null);
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Iniciar sesión
   * @param {Object} credentials - { email, password }
   * @returns {Object} - { success, user, error }
   */
  const login = async (credentials) => {
    setLoading(true);
    setError(null);

    try {
      // TODO: Integrar con API de FastAPI
      // const response = await api.post('/auth/login', credentials);
      
      // Simulación de login
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Datos de ejemplo
      const mockUser = {
        id: 1,
        firstName: 'Juan',
        lastName: 'Pérez',
        email: credentials.email,
        role: 'usuario', // 'admin', 'gestor', 'operador', 'usuario'
        avatar: null
      };
      
      const mockToken = 'mock-jwt-token-' + Date.now();

      // Guardar en localStorage
      localStorage.setItem('token', mockToken);
      localStorage.setItem('user', JSON.stringify(mockUser));

      setUser(mockUser);
      setLoading(false);

      return { success: true, user: mockUser };
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Error al iniciar sesión';
      setError(errorMessage);
      setLoading(false);

      return { success: false, error: errorMessage };
    }
  };

  /**
   * Registrar nuevo usuario
   * @param {Object} userData - Datos del usuario a registrar
   * @returns {Object} - { success, user, error }
   */
  const register = async (userData) => {
    setLoading(true);
    setError(null);

    try {
      // TODO: Integrar con API de FastAPI
      // const response = await api.post('/auth/register', userData);
      
      // Simulación de registro
      await new Promise(resolve => setTimeout(resolve, 2000));

      const newUser = {
        id: Date.now(),
        firstName: userData.firstName,
        lastName: userData.lastName,
        email: userData.email,
        role: 'usuario',
        avatar: null
      };

      const token = 'mock-jwt-token-' + Date.now();

      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(newUser));

      setUser(newUser);
      setLoading(false);

      return { success: true, user: newUser };
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Error al registrar usuario';
      setError(errorMessage);
      setLoading(false);

      return { success: false, error: errorMessage };
    }
  };

  /**
   * Cerrar sesión
   */
  const logout = useCallback(async () => {
    try {
      // TODO: Llamar API para invalidar token si es necesario
      // await api.post('/auth/logout');

      localStorage.removeItem('token');
      localStorage.removeItem('user');
      setUser(null);
      setError(null);

      navigate('/login');
    } catch (err) {
      console.error('Error al cerrar sesión:', err);
    }
  }, [navigate]);

  /**
   * Actualizar datos del usuario
   * @param {Object} updates - Datos a actualizar
   */
  const updateUser = async (updates) => {
    try {
      // TODO: Integrar con API
      // const response = await api.put('/user/profile', updates);

      await new Promise(resolve => setTimeout(resolve, 1000));

      const updatedUser = { ...user, ...updates };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      setUser(updatedUser);

      return { success: true, user: updatedUser };
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Error al actualizar usuario';
      return { success: false, error: errorMessage };
    }
  };

  /**
   * Verificar si el usuario tiene un rol específico
   * @param {string|string[]} roles - Rol o roles permitidos
   * @returns {boolean}
   */
  const hasRole = useCallback((roles) => {
    if (!user) return false;
    
    if (Array.isArray(roles)) {
      return roles.includes(user.role);
    }
    
    return user.role === roles;
  }, [user]);

  /**
   * Verificar si el usuario está autenticado
   * @returns {boolean}
   */
  const isAuthenticated = useCallback(() => {
    return !!user;
  }, [user]);

  return {
    user,
    loading,
    error,
    login,
    register,
    logout,
    updateUser,
    checkAuth,
    hasRole,
    isAuthenticated
  };
};

export default useAuth;
