/**
 * Definición de rutas de la aplicación
 * Centralizadas para fácil mantenimiento
 */

import {
  Home,
  Login,
  Register,
  UserProfile,
  AdminDashboard,
  EventManagerDashboard,
  StaffDashboard
} from './pages'

/**
 * Rutas públicas (sin autenticación requerida)
 */
export const publicRoutes = [
  {
    path: '/',
    element: Home,
    layout: 'main',
    title: 'Inicio'
  },
  {
    path: '/login',
    element: Login,
    layout: 'auth',
    title: 'Iniciar Sesión'
  },
  {
    path: '/register',
    element: Register,
    layout: 'auth',
    title: 'Registrarse'
  }
]

/**
 * Rutas protegidas (requieren autenticación)
 */
export const protectedRoutes = [
  {
    path: '/profile',
    element: UserProfile,
    layout: 'main',
    allowedRoles: ['usuario', 'gestor', 'operador', 'admin'],
    title: 'Mi Perfil'
  }
]

/**
 * Rutas de administrador
 */
export const adminRoutes = [
  {
    path: '/admin',
    element: AdminDashboard,
    layout: 'dashboard',
    allowedRoles: ['admin'],
    title: 'Panel de Administración'
  },
  {
    path: '/admin/users',
    element: null, // Crear componente UserManagement
    layout: 'dashboard',
    allowedRoles: ['admin'],
    title: 'Gestión de Usuarios'
  },
  {
    path: '/admin/config',
    element: null, // Crear componente SystemConfig
    layout: 'dashboard',
    allowedRoles: ['admin'],
    title: 'Configuración del Sistema'
  },
  {
    path: '/admin/database',
    element: null, // Crear componente DatabaseManagement
    layout: 'dashboard',
    allowedRoles: ['admin'],
    title: 'Gestión de Base de Datos'
  },
  {
    path: '/admin/monitoring',
    element: null, // Crear componente SystemMonitoring
    layout: 'dashboard',
    allowedRoles: ['admin'],
    title: 'Monitoreo del Sistema'
  }
]

/**
 * Rutas de gestor de eventos
 */
export const managerRoutes = [
  {
    path: '/events/manage',
    element: EventManagerDashboard,
    layout: 'dashboard',
    allowedRoles: ['gestor', 'admin'],
    title: 'Gestión de Eventos'
  },
  {
    path: '/events/create',
    element: null, // Crear componente CreateEvent
    layout: 'dashboard',
    allowedRoles: ['gestor', 'admin'],
    title: 'Crear Evento'
  },
  {
    path: '/events/statistics',
    element: null, // Crear componente EventStatistics
    layout: 'dashboard',
    allowedRoles: ['gestor', 'admin'],
    title: 'Estadísticas'
  }
]

/**
 * Rutas de operador
 */
export const staffRoutes = [
  {
    path: '/staff',
    element: StaffDashboard,
    layout: 'dashboard',
    allowedRoles: ['operador', 'admin'],
    title: 'Verificación de Boletos'
  },
  {
    path: '/staff/history',
    element: null, // Crear componente VerificationHistory
    layout: 'dashboard',
    allowedRoles: ['operador', 'admin'],
    title: 'Historial de Verificaciones'
  },
  {
    path: '/staff/events',
    element: null, // Crear componente AssignedEvents
    layout: 'dashboard',
    allowedRoles: ['operador', 'admin'],
    title: 'Eventos Asignados'
  }
]

/**
 * Todas las rutas combinadas
 */
export const allRoutes = [
  ...publicRoutes,
  ...protectedRoutes,
  ...adminRoutes,
  ...managerRoutes,
  ...staffRoutes
]

/**
 * Obtener rutas por rol
 * @param {string} role - Rol del usuario
 * @returns {Array} Rutas permitidas para el rol
 */
export const getRoutesByRole = role => {
  if (!role) return publicRoutes

  return allRoutes.filter(route => {
    if (!route.allowedRoles) return true
    return route.allowedRoles.includes(role)
  })
}

/**
 * Obtener ruta de redirección por defecto según rol
 * @param {string} role - Rol del usuario
 * @returns {string} Path de redirección
 */
export const getDefaultRouteByRole = role => {
  const routeMap = {
    admin: '/admin',
    gestor: '/events/manage',
    operador: '/staff',
    usuario: '/'
  }

  return routeMap[role] || '/'
}

export default allRoutes
