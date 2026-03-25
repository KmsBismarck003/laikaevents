import React, { lazy } from 'react'

// Páginas Públicas
const Home = lazy(() => import('../pages/Home/Home'))
const Login = lazy(() => import('../pages/Login/Login'))
const Register = lazy(() => import('../pages/Register/Register'))
const UserProfile = lazy(() => import('../pages/UserProfile/UserProfile'))
const EventDetail = lazy(() => import('../pages/EventDetail/EventDetail'))
const Maintenance = lazy(() => import('../pages/Maintenance/Maintenance'))

// Dashboard de Organizador
const EventManagerDashboard = lazy(() => import('../pages/EventManagerDashboard/EventManagerDashboard'))
const ManagerAnalytics = lazy(() => import('../pages/manager/views/ManagerAnalytics'))
const ManagerTransactions = lazy(() => import('../pages/manager/views/ManagerTransactions'))
const ManagerAttendees = lazy(() => import('../pages/manager/views/ManagerAttendees'))
const CreateEventPage = lazy(() => import('../pages/manager/views/CreateEventPage'))

// Módulo de Staff
const StaffDashboard = lazy(() => import('../pages/staff/views/StaffTerminalDashboard'))
const StaffTerminal = lazy(() => import('../pages/staff/StaffTerminal'))
const StaffHistory = lazy(() => import('../pages/staff/StaffHistory'))
const StaffIncidents = lazy(() => import('../pages/staff/views/StaffIncidents'))
const AssignedEvents = lazy(() => import('../pages/staff/views/AssignedEvents'))

// Páginas de Información
const Nosotros = lazy(() => import('../pages/info/Nosotros'))
const Ayuda = lazy(() => import('../pages/info/Ayuda'))
const PreguntasFrecuentes = lazy(() => import('../pages/info/PreguntasFrecuentes'))
const Contacto = lazy(() => import('../pages/info/Contacto'))
const Soporte = lazy(() => import('../pages/info/Soporte'))
const Devoluciones = lazy(() => import('../pages/info/Devoluciones'))
const Terminos = lazy(() => import('../pages/info/Terminos'))
const Privacidad = lazy(() => import('../pages/info/Privacidad'))
const Cookies = lazy(() => import('../pages/info/Cookies'))
const Seguridad = lazy(() => import('../pages/info/Seguridad'))
const MapaDelSitio = lazy(() => import('../pages/info/MapaDelSitio'))
const Accesibilidad = lazy(() => import('../pages/info/Accesibilidad'))

// Sub-páginas de Usuario
const Achievements = lazy(() => import('../pages/user/Achievements'))
const RefundTracker = lazy(() => import('../pages/user/RefundTracker'))

// Otros
const UnifiedPage = lazy(() => import('../pages/content/UnifiedPage'))

// Módulo Admin
const AdminDashboard = lazy(() => import('../pages/admin/Dashboard/Dashboard'))
const Users = lazy(() => import('../pages/admin/Users/Users'))
const Events = lazy(() => import('../pages/admin/Events/Events'))
const Config = lazy(() => import('../pages/admin/Config/Config'))
const Database = lazy(() => import('../pages/admin/Database/Database'))
const Monitoring = lazy(() => import('../pages/admin/Monitoring/Monitoring'))
const Logs = lazy(() => import('../pages/admin/Logs/Logs'))
const Ads = lazy(() => import('../pages/admin/Ads/Ads'))
const CMS = lazy(() => import('../pages/admin/CMS/CMS'))
const SalesReports = lazy(() => import('../pages/admin/SalesReports/SalesReports'))
const RestoreAudit = lazy(() => import('../pages/admin/RestoreAudit/RestoreAudit'))
const AuthAudit = lazy(() => import('../pages/admin/AuthAudit/AuthAudit'))
const Venues = lazy(() => import('../pages/admin/Venues/Venues'))
const LaikaManager = lazy(() => import('../pages/admin/LaikaManager/LaikaManager'))
const EmailManager = lazy(() => import('../pages/admin/EmailManager/EmailManager'))
const NewsTickerAdmin = lazy(() => import('../pages/admin/NewsTicker/NewsTickerAdmin'))
const AdminVenueMap = lazy(() => import('../pages/admin/VenueMap/AdminVenueMap'))
const BigDataAnalytics = lazy(() => import('../pages/admin/BigDataAnalytics'))
const WelcomePortal = lazy(() => import('../pages/admin/Dashboard/WelcomePortal'))
const LuckySeatConfig = lazy(() => import('../pages/admin/Config/LuckySeatConfig'))
const TicketBuilder = lazy(() => import('../pages/admin/TicketBuilder/TicketBuilder'))

// Módulo Manager
const ManagerStatsPage = lazy(() => import('../pages/manager/ManagerStatsPage'))

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
    path: '/admin/ticket-builder',
    element: TicketBuilder,
    layout: 'dashboard',
    allowedRoles: ['admin'],
    title: 'Constructor de Boletos'
  },
  {
    path: '/admin/config/lucky-seat',
    element: LuckySeatConfig,
    layout: 'dashboard',
    allowedRoles: ['admin'],
    title: 'Monitor Lucky Seat'
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
    allowedRoles: ['admin', 'gestor'],
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
  },
  {
    path: '/admin/laika',
    element: LaikaManager,
    layout: 'dashboard',
    allowedRoles: ['admin'],
    title: 'Laika Agent'
  },
  {
    path: '/admin/auth-audit',
    element: AuthAudit,
    layout: 'dashboard',
    allowedRoles: ['admin'],
    title: 'Auditoría de Accesos'
  },
  {
    title: 'Email Marketing'
  },
  {
    path: '/admin/ticker',
    element: NewsTickerAdmin,
    layout: 'dashboard',
    allowedRoles: ['admin'],
    title: 'Cinta de Noticias'
  },
  {
    path: '/admin/venue-map',
    element: AdminVenueMap,
    layout: 'dashboard',
    allowedRoles: ['admin', 'gestor'],
    title: 'Mapa de Ventas'
  },
  {
    path: '/admin/big-data',
    element: BigDataAnalytics,
    layout: 'dashboard',
    allowedRoles: ['admin'],
    title: 'Análisis Big Data'
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
    path: '/manager/analytics',
    element: ManagerAnalytics,
    layout: 'dashboard',
    allowedRoles: ['gestor', 'admin'],
    title: 'Analíticas'
  },
  {
    path: '/manager/transactions',
    element: ManagerTransactions,
    layout: 'dashboard',
    allowedRoles: ['gestor', 'admin'],
    title: 'Transacciones'
  },
  {
    path: '/manager/attendees',
    element: ManagerAttendees,
    layout: 'dashboard',
    allowedRoles: ['gestor', 'admin'],
    title: 'Asistentes'
  },
  {
    path: '/events/create',
    element: CreateEventPage,
    layout: 'dashboard',
    allowedRoles: ['gestor', 'admin'],
    title: 'Crear Evento'
  },
  {
    path: '/events/statistics',
    element: ManagerStatsPage,
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
    path: '/staff/dashboard',
    element: StaffDashboard,
    layout: 'dashboard',
    allowedRoles: ['operador', 'admin'],
    title: 'Panel Control Staff'
  },
  {
    path: '/staff',
    element: StaffTerminal,
    layout: 'dashboard',
    allowedRoles: ['operador', 'admin'],
    title: 'Verificación de Boletos'
  },
  {
    path: '/staff/history',
    element: StaffHistory,
    layout: 'dashboard',
    allowedRoles: ['operador', 'admin'],
    title: 'Historial de Verificaciones'
  },
  {
    path: '/staff/incidents',
    element: StaffIncidents,
    layout: 'dashboard',
    allowedRoles: ['operador', 'admin'],
    title: 'Incidencias'
  },
  {
    path: '/staff/events',
    element: AssignedEvents, 
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
    admin: '/welcome',
    gestor: '/welcome',
    operador: '/welcome',
    usuario: '/'
  }

  return routeMap[role] || '/'
}

export default allRoutes
