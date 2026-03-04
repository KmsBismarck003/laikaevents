/**
 * Definición de rutas de la aplicación
 * Centralizadas para fácil mantenimiento
 */

import {
  Home,
  Login,
  Register,
  UserProfile,
  EventManagerDashboard,
  StaffDashboard,
  UnifiedPage,
  Nosotros,
  Ayuda,
  PreguntasFrecuentes,
  Contacto,
  Soporte,
  Devoluciones,
  Terminos,
  Privacidad,
  Cookies,
  Seguridad,
  MapaDelSitio,
  Accesibilidad
} from './pages'

import AdminDashboard from './pages/admin/Dashboard'
import Users from './pages/admin/Users'
import Events from './pages/admin/Events'
import Config from './pages/admin/Config'
import Database from './pages/admin/Database'
import Monitoring from './pages/admin/Monitoring'
import Logs from './pages/admin/Logs'
import Ads from './pages/admin/Ads'
import CMS from './pages/admin/CMS'
import SalesReports from './pages/admin/SalesReports'
import RestoreAudit from './pages/admin/RestoreAudit'
import Venues from './pages/admin/Venues'

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
  },
  // Info Pages
  {
    path: '/info/nosotros',
    element: Nosotros,
    layout: 'main',
    title: 'Sobre Nosotros'
  },
  {
    path: '/info/contacto',
    element: Contacto,
    layout: 'main',
    title: 'Contacto'
  },
  {
    path: '/info/soporte',
    element: Soporte,
    layout: 'main',
    title: 'Soporte Técnico'
  },
  {
    path: '/info/devoluciones',
    element: Devoluciones,
    layout: 'main',
    title: 'Devoluciones'
  },
  {
    path: '/info/mapa-del-sitio',
    element: MapaDelSitio,
    layout: 'main',
    title: 'Mapa del Sitio'
  },
  {
    path: '/info/accesibilidad',
    element: Accesibilidad,
    layout: 'main',
    title: 'Accesibilidad'
  },
  {
    path: '/info/faq',
    element: PreguntasFrecuentes,
    layout: 'main',
    title: 'Preguntas Frecuentes'
  },
  // Legal Pages
  {
    path: '/legal/terminos',
    element: Terminos,
    layout: 'main',
    title: 'Términos y Condiciones'
  },
  {
    path: '/legal/privacidad',
    element: Privacidad,
    layout: 'main',
    title: 'Política de Privacidad'
  },
  {
    path: '/legal/cookies',
    element: Cookies,
    layout: 'main',
    title: 'Política de Cookies'
  },
  {
    path: '/legal/seguridad',
    element: Seguridad,
    layout: 'main',
    title: 'Seguridad'
  },
  // Fallback for dynamic info pages (if any)
  {
    path: '/info/:slug',
    element: UnifiedPage,
    layout: 'main',
    title: 'Información'
  },
  {
    path: '/ayuda',
    element: Ayuda,
    layout: 'main',
    title: 'Ayuda'
  },
  // Categorías (Landing Pages - Por ahora usan UnifiedPage, luego pueden tener uno propio si requieren diseño especial)
  {
    path: '/conciertos',
    element: UnifiedPage,
    layout: 'main',
    title: 'Conciertos'
  },
  {
    path: '/deportes',
    element: UnifiedPage,
    layout: 'main',
    title: 'Deportes'
  },
  {
    path: '/teatro',
    element: UnifiedPage,
    layout: 'main',
    title: 'Teatro'
  },
  {
    path: '/festivales',
    element: UnifiedPage,
    layout: 'main',
    title: 'Festivales'
  },
  {
    path: '/cultural',
    element: UnifiedPage,
    layout: 'main',
    title: 'Cultural'
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
    element: Users,
    layout: 'dashboard',
    allowedRoles: ['admin'],
    title: 'Gestión de Usuarios'
  },
  {
    path: '/admin/events',
    element: Events,
    layout: 'dashboard',
    allowedRoles: ['admin'],
    title: 'Gestión de Eventos'
  },
  {
    path: '/admin/config',
    element: Config,
    layout: 'dashboard',
    allowedRoles: ['admin'],
    title: 'Configuración del Sistema'
  },
  {
    path: '/admin/database',
    element: Database,
    layout: 'dashboard',
    allowedRoles: ['admin'],
    title: 'Gestión de Base de Datos'
  },
  {
    path: '/admin/monitoring',
    element: Monitoring,
    layout: 'dashboard',
    allowedRoles: ['admin'],
    title: 'Monitoreo del Sistema'
  },
  {
    path: '/admin/logs', // Added route
    element: Logs,
    layout: 'dashboard',
    allowedRoles: ['admin'],
    title: 'Logs del Sistema'
  },
  {
    path: '/admin/venues',
    element: Venues,
    layout: 'dashboard',
    allowedRoles: ['admin'],
    title: 'Gestión de Recintos'
  },
  {
    path: '/admin/ads',
    element: Ads,
    layout: 'dashboard',
    allowedRoles: ['admin'],
    title: 'Gestión de Publicidad'
  },
  {
    path: '/admin/cms',
    element: CMS,
    layout: 'dashboard',
    allowedRoles: ['admin'],
    title: 'Gestor de Contenidos'
  },
  {
    path: '/admin/sales',
    element: SalesReports,
    layout: 'dashboard',
    allowedRoles: ['admin'],
    title: 'Reporte de Ventas'
  },
  {
    path: '/admin/restore-audit',
    element: RestoreAudit,
    layout: 'dashboard',
    allowedRoles: ['admin'],
    title: 'Auditoría de Restauraciones'
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
