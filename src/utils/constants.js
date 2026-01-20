/**
 * Constantes globales de la aplicación
 */

// Roles de usuario
export const USER_ROLES = {
  ADMIN: 'admin',
  GESTOR: 'gestor',
  OPERADOR: 'operador',
  USUARIO: 'usuario'
};

// Estados de usuario
export const USER_STATUS = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  SUSPENDED: 'suspended'
};

// Categorías de eventos
export const EVENT_CATEGORIES = {
  CONCERT: 'concert',
  SPORT: 'sport',
  THEATER: 'theater',
  FESTIVAL: 'festival',
  OTHER: 'other'
};

// Labels de categorías
export const EVENT_CATEGORY_LABELS = {
  concert: 'Concierto',
  sport: 'Deporte',
  theater: 'Teatro',
  festival: 'Festival',
  other: 'Otro'
};

// Estados de eventos
export const EVENT_STATUS = {
  DRAFT: 'draft',
  PUBLISHED: 'published',
  CANCELLED: 'cancelled',
  COMPLETED: 'completed'
};

// Estados de boletos
export const TICKET_STATUS = {
  ACTIVE: 'active',
  USED: 'used',
  CANCELLED: 'cancelled',
  REFUNDED: 'refunded'
};

// Tipos de boletos
export const TICKET_TYPES = {
  GENERAL: 'general',
  VIP: 'vip',
  EARLY_BIRD: 'early_bird'
};

// Métodos de pago
export const PAYMENT_METHODS = {
  CARD: 'card',
  TRANSFER: 'transfer',
  CASH: 'cash',
  OTHER: 'other'
};

// Estados de pago
export const PAYMENT_STATUS = {
  PENDING: 'pending',
  COMPLETED: 'completed',
  FAILED: 'failed',
  REFUNDED: 'refunded'
};

// Tipos de notificación
export const NOTIFICATION_TYPES = {
  INFO: 'info',
  SUCCESS: 'success',
  WARNING: 'warning',
  ERROR: 'error'
};

// Niveles de log
export const LOG_LEVELS = {
  INFO: 'info',
  WARNING: 'warning',
  ERROR: 'error',
  CRITICAL: 'critical'
};

// Tipos de respaldo
export const BACKUP_TYPES = {
  COMPLETE: 'completo',
  INCREMENTAL: 'incremental',
  SELECTIVE: 'selectivo'
};

// Límites de paginación
export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 10,
  MAX_LIMIT: 100
};

// Configuración de tiempo
export const TIME_CONFIG = {
  SESSION_TIMEOUT: 30, // minutos
  TICKET_RESERVATION_TIME: 5, // minutos
  PASSWORD_RESET_EXPIRY: 60, // minutos
  MAX_LOGIN_ATTEMPTS: 5
};

// Regex patterns
export const REGEX_PATTERNS = {
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PHONE: /^\d{10}$/,
  PASSWORD: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/,
  TICKET_CODE: /^TKT-[A-Z0-9]{9}$/,
  CREDIT_CARD: /^\d{13,19}$/,
  CVV: /^\d{3,4}$/
};

// Mensajes de error comunes
export const ERROR_MESSAGES = {
  REQUIRED: 'Este campo es requerido',
  INVALID_EMAIL: 'Email inválido',
  INVALID_PHONE: 'Teléfono inválido (10 dígitos)',
  INVALID_PASSWORD: 'La contraseña debe tener al menos 8 caracteres, una mayúscula, una minúscula y un número',
  PASSWORDS_NO_MATCH: 'Las contraseñas no coinciden',
  INVALID_DATE: 'Fecha inválida',
  FUTURE_DATE_REQUIRED: 'La fecha debe ser futura',
  MIN_AGE: 'Debes ser mayor de 18 años',
  INVALID_TICKET_CODE: 'Código de boleto inválido',
  NETWORK_ERROR: 'Error de conexión. Intenta nuevamente.',
  SERVER_ERROR: 'Error del servidor. Intenta más tarde.',
  UNAUTHORIZED: 'No tienes permisos para esta acción',
  NOT_FOUND: 'Recurso no encontrado'
};

// Mensajes de éxito
export const SUCCESS_MESSAGES = {
  LOGIN: 'Inicio de sesión exitoso',
  REGISTER: 'Registro exitoso',
  UPDATE: 'Actualización exitosa',
  DELETE: 'Eliminación exitosa',
  CREATE: 'Creación exitosa',
  SAVE: 'Guardado exitoso',
  PURCHASE: 'Compra realizada exitosamente',
  VERIFICATION: 'Verificación exitosa'
};

// Breakpoints para responsive
export const BREAKPOINTS = {
  MOBILE: 640,
  TABLET: 768,
  DESKTOP: 1024,
  WIDE: 1280
};

// Colores del tema
export const THEME_COLORS = {
  PRIMARY: '#667eea',
  SECONDARY: '#764ba2',
  SUCCESS: '#10b981',
  ERROR: '#ef4444',
  WARNING: '#f59e0b',
  INFO: '#3b82f6',
  DARK: '#1f2937',
  LIGHT: '#f9fafb'
};

// Rutas públicas (sin autenticación)
export const PUBLIC_ROUTES = [
  '/',
  '/login',
  '/register',
  '/forgot-password',
  '/reset-password',
  '/about',
  '/contact',
  '/terms',
  '/privacy'
];

// Rutas protegidas por rol
export const ROLE_ROUTES = {
  admin: ['/admin', '/admin/users', '/admin/config', '/admin/database', '/admin/monitoring'],
  gestor: ['/events/manage', '/events/create', '/events/statistics'],
  operador: ['/staff', '/staff/history', '/staff/events'],
  usuario: ['/profile', '/my-tickets', '/settings']
};

// Archivos permitidos
export const ALLOWED_FILE_TYPES = {
  IMAGES: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  DOCUMENTS: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
};

// Tamaños máximos de archivo (en bytes)
export const MAX_FILE_SIZES = {
  IMAGE: 5 * 1024 * 1024, // 5MB
  DOCUMENT: 10 * 1024 * 1024 // 10MB
};

// URLs de redes sociales
export const SOCIAL_LINKS = {
  FACEBOOK: 'https://facebook.com/laikaclub',
  INSTAGRAM: 'https://instagram.com/laikaclub',
  TWITTER: 'https://twitter.com/laikaclub',
  YOUTUBE: 'https://youtube.com/laikaclub'
};

// Información de contacto
export const CONTACT_INFO = {
  EMAIL: 'contacto@laikaclub.com',
  PHONE: '55 1234 5678',
  ADDRESS: 'Ocoyoacac, Estado de México',
  SUPPORT_HOURS: 'Lunes a Viernes, 9:00 - 18:00'
};

export default {
  USER_ROLES,
  USER_STATUS,
  EVENT_CATEGORIES,
  EVENT_CATEGORY_LABELS,
  EVENT_STATUS,
  TICKET_STATUS,
  TICKET_TYPES,
  PAYMENT_METHODS,
  PAYMENT_STATUS,
  NOTIFICATION_TYPES,
  LOG_LEVELS,
  BACKUP_TYPES,
  PAGINATION,
  TIME_CONFIG,
  REGEX_PATTERNS,
  ERROR_MESSAGES,
  SUCCESS_MESSAGES,
  BREAKPOINTS,
  THEME_COLORS,
  PUBLIC_ROUTES,
  ROLE_ROUTES,
  ALLOWED_FILE_TYPES,
  MAX_FILE_SIZES,
  SOCIAL_LINKS,
  CONTACT_INFO
};
