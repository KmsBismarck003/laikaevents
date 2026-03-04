/**
 * API Service - Puente central para conexiones con FastAPI
 *
 * Este archivo centraliza todas las peticiones HTTP al backend.
 * FastAPI manejará las conexiones a MySQL y MongoDB.
 *
 * Configuración:
 * - MySQL: Datos relacionales (usuarios, eventos, boletos, transacciones)
 * - MongoDB: Logs, configuraciones, estadísticas, datos no estructurados
 */

const API_BASE_URL =
  process.env.REACT_APP_API_URL ||
  (window.location.hostname === 'localhost' ||
  window.location.hostname === '127.0.0.1'
    ? 'http://localhost:8000/api'
    : `http://${window.location.hostname}:8000/api`)

/**
 * Cliente HTTP base
 */
class ApiClient {
  constructor(baseURL) {
    this.baseURL = baseURL
  }

  /**
   * Obtener headers con autenticación
   */
  getHeaders() {
    const token = localStorage.getItem('token')
    const headers = {
      'Content-Type': 'application/json'
    }

    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }

    return headers
  }

  /**
   * Manejar respuesta
   */
  async handleResponse(response) {
    const contentType = response.headers.get('content-type')
    let data

    if (contentType && contentType.includes('application/json')) {
      data = await response.json()
    } else {
      data = await response.text()
    }

    if (!response.ok) {
      throw {
        status: response.status,
        message: data.message || data.detail || 'Error en la petición',
        data
      }
    }

    return data
  }

  /**
   * GET request
   */
  async get(endpoint, params = {}) {
    // Filtrar parámetros nulos o indefinidos
    const cleanParams = Object.fromEntries(
      Object.entries(params).filter(([_, v]) => v != null)
    )
    const queryString = new URLSearchParams(cleanParams).toString()
    const url = `${this.baseURL}${endpoint}${queryString ? `?${queryString}` : ''}`

    const response = await fetch(url, {
      method: 'GET',
      headers: this.getHeaders()
    })

    return this.handleResponse(response)
  }

  /**
   * POST request
   */
  async post(endpoint, data = {}) {
    const response = await fetch(`${this.baseURL}${endpoint}`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(data)
    })

    return this.handleResponse(response)
  }

  /**
   * PUT request
   */
  async put(endpoint, data = {}) {
    const response = await fetch(`${this.baseURL}${endpoint}`, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: JSON.stringify(data)
    })

    return this.handleResponse(response)
  }

  /**
   * PATCH request
   */
  async patch(endpoint, data = {}) {
    const response = await fetch(`${this.baseURL}${endpoint}`, {
      method: 'PATCH',
      headers: this.getHeaders(),
      body: JSON.stringify(data)
    })

    return this.handleResponse(response)
  }

  /**
   * DELETE request
   */
  async delete(endpoint) {
    const response = await fetch(`${this.baseURL}${endpoint}`, {
      method: 'DELETE',
      headers: this.getHeaders()
    })

    return this.handleResponse(response)
  }

  /**
   * Upload de archivos
   */
  async upload(endpoint, file, additionalData = {}) {
    const formData = new FormData()
    formData.append('file', file)

    Object.keys(additionalData).forEach(key => {
      formData.append(key, additionalData[key])
    })

    const token = localStorage.getItem('token')
    const headers = {}
    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }

    const response = await fetch(`${this.baseURL}${endpoint}`, {
      method: 'POST',
      headers,
      body: formData
    })

    return this.handleResponse(response)
  }
}

// Instancia del cliente
const apiClient = new ApiClient(API_BASE_URL)

/**
 * ============================================
 * AUTENTICACIÓN (MySQL)
 * ============================================
 */
export const authAPI = {
  /**
   * Iniciar sesión
   * @param {Object} credentials - { email, password }
   */
  login: credentials => {
    return apiClient.post('/auth/login', credentials)
  },

  /**
   * Registrar usuario
   * @param {Object} userData - Datos del nuevo usuario
   */
  register: userData => {
    return apiClient.post('/auth/register', userData)
  },

  /**
   * Cerrar sesión
   */
  logout: () => {
    return apiClient.post('/auth/logout')
  },

  /**
   * Verificar token
   */
  verifyToken: () => {
    return apiClient.get('/auth/verify')
  },

  /**
   * Refrescar token
   */
  refreshToken: () => {
    return apiClient.post('/auth/refresh')
  },

  /**
   * Recuperar contraseña
   * @param {string} email
   */
  forgotPassword: email => {
    return apiClient.post('/auth/forgot-password', { email })
  },

  /**
   * Restablecer contraseña
   * @param {string} token
   * @param {string} newPassword
   */
  resetPassword: (token, newPassword) => {
    return apiClient.post('/auth/reset-password', { token, newPassword })
  }
}

/**
 * ============================================
 * USUARIOS (MySQL)
 * ============================================
 */
export const userAPI = {
  /**
   * Obtener perfil del usuario actual
   */
  getProfile: () => {
    return apiClient.get('/users/me')
  },

  /**
   * Actualizar perfil
   * @param {Object} updates
   */
  updateProfile: updates => {
    return apiClient.put('/users/me', updates)
  },

  /**
   * Cambiar contraseña
   * @param {string} currentPassword
   * @param {string} newPassword
   */
  changePassword: (currentPassword, newPassword) => {
    return apiClient.post('/users/me/change-password', {
      currentPassword,
      newPassword
    })
  },

  /**
   * Obtener todos los usuarios (Admin)
   * @param {Object} params - { page, limit, search, role }
   */
  getAll: (params = {}) => {
    return apiClient.get('/users', params)
  },

  /**
   * Obtener usuario por ID (Admin)
   * @param {number} userId
   */
  getById: userId => {
    return apiClient.get(`/users/${userId}`)
  },

  /**
   * Crear usuario (Admin)
   * @param {Object} userData
   */
  create: userData => {
    return apiClient.post('/users', userData)
  },

  /**
   * Actualizar usuario (Admin)
   * @param {number} userId
   * @param {Object} updates
   */
  update: (userId, updates) => {
    return apiClient.put(`/users/${userId}`, updates)
  },

  /**
   * Eliminar usuario (Admin)
   * @param {number} userId
   */
  delete: userId => {
    return apiClient.delete(`/users/${userId}`)
  },

  /**
   * Asignar rol (Admin)
   * @param {number} userId
   * @param {string} role
   */
  assignRole: (userId, role) => {
    return apiClient.patch(`/users/${userId}/role`, { role })
  },

  /**
   * Subir foto de perfil
   * @param {File} file
   */
  uploadPhoto: file => {
    return apiClient.upload('/users/me/photo', file)
  },

  /**
   * Eliminar foto de perfil
   */
  deletePhoto: () => {
    return apiClient.delete('/users/me/photo')
  },

  getPermissions: userId => apiClient.get(`/users/${userId}/permissions`),
  updatePermissions: (userId, permissionsData) =>
    apiClient.put(`/users/${userId}/permissions`, permissionsData)
}

/**
 * ============================================
 * EVENTOS (MySQL)
 * ============================================
 */
export const eventAPI = {
  /**
   * Obtener eventos públicos
   * @param {Object} params - { page, limit, category, search, startDate, endDate }
   */
  getPublic: (params = {}) => {
    return apiClient.get('/events/public', params)
  },

  /**
   * Obtener TODOS los eventos (Admin)
   * @param {Object} params - { limit, status_filter }
   */
  getAll: (params = {}) => {
    return apiClient.get('/events/all', params)
  },

  /**
   * Obtener evento por ID
   * @param {number} eventId
   */
  getById: eventId => {
    return apiClient.get(`/events/${eventId}`)
  },

  /**
   * Crear evento (Gestor)
   * @param {Object} eventData
   */
  create: eventData => {
    return apiClient.post('/events', eventData)
  },

  /**
   * Actualizar evento (Gestor)
   * @param {number} eventId
   * @param {Object} updates
   */
  update: (eventId, updates) => {
    return apiClient.put(`/events/${eventId}`, updates)
  },

  /**
   * Eliminar evento (Gestor/Admin)
   * @param {number} eventId
   */
  delete: eventId => {
    return apiClient.delete(`/events/${eventId}`)
  },

  /**
   * Publicar evento (Gestor)
   * @param {number} eventId
   */
  publish: eventId => {
    return apiClient.patch(`/events/${eventId}/publish`)
  },

  /**
   * Despublicar evento (Gestor)
   * @param {number} eventId
   */
  unpublish: eventId => {
    return apiClient.patch(`/events/${eventId}/unpublish`)
  },

  /**
   * Obtener mis eventos (Gestor)
   */
  getMyEvents: () => {
    return apiClient.get('/events/my-events')
  },

  /**
   * Subir imagen del evento
   * @param {number} eventId
   * @param {File} file
   */
  uploadImage: (eventId, file) => {
    return apiClient.upload(`/events/${eventId}/image`, file)
  },

  /**
   * Buscar eventos
   * @param {string} query
   */
  search: query => {
    return apiClient.get('/events/search', { q: query })
  }
}

/**
 * ============================================
 * BOLETOS (MySQL)
 * ============================================
 */
export const ticketAPI = {
  /**
   * Comprar boletos
   * @param {Object} purchaseData - { eventId, quantity, paymentMethod }
   */
  purchase: purchaseData => {
    return apiClient.post('/tickets/purchase', purchaseData)
  },

  /**
   * Obtener mis boletos
   */
  getMyTickets: () => {
    return apiClient.get('/tickets/my-tickets')
  },

  /**
   * Verificar boleto (Operador)
   * @param {string} ticketCode
   */
  verify: ticketCode => {
    return apiClient.post('/tickets/verify', { ticketCode })
  },

  /**
   * Canjear boleto (Operador)
   * @param {string} ticketCode
   */
  redeem: ticketCode => {
    return apiClient.post('/tickets/redeem', { ticketCode })
  },

  /**
   * Obtener boleto por código
   * @param {string} ticketCode
   */
  getByCode: ticketCode => {
    return apiClient.get(`/tickets/${ticketCode}`)
  },

  /**
   * Cancelar boleto
   * @param {number} ticketId
   */
  cancel: ticketId => {
    return apiClient.delete(`/tickets/${ticketId}`)
  }
}

/**
 * ============================================
 * ESTADÍSTICAS (MongoDB)
 * ============================================
 */
export const statsAPI = {
  /**
   * Obtener dashboard del administrador
   */
  getAdminDashboard: () => {
    return apiClient.get('/stats/admin/dashboard')
  },

  /**
   * Obtener estadísticas de gestor
   */
  getManagerStats: () => {
    return apiClient.get('/stats/manager/dashboard')
  },

  /**
   * Obtener estadísticas de operador
   */
  getStaffStats: () => {
    return apiClient.get('/stats/staff/dashboard')
  },

  /**
   * Obtener estadísticas de evento
   * @param {number} eventId
   */
  getEventStats: eventId => {
    return apiClient.get(`/stats/events/${eventId}`)
  },

  /**
   * Obtener reporte de ventas
   * @param {Object} params - { startDate, endDate, eventId }
   */
  getSalesReport: (params = {}) => {
    return apiClient.get('/stats/sales/report', params)
  },

  /**
   * Obtener ventas por evento (Admin)
   */
  getSalesByEvent: () => {
    return apiClient.get('/stats/admin/sales-by-event')
  }
}

/**
 * ============================================
 * CONFIGURACIÓN DEL SISTEMA (MongoDB)
 * ============================================
 */
export const configAPI = {
  /**
   * Obtener configuración actual
   */
  getConfig: () => {
    return apiClient.get('/config')
  },

  /**
   * Actualizar configuración (Admin)
   * @param {Object} config
   */
  updateConfig: config => {
    return apiClient.put('/config', config)
  },

  /**
   * Obtener parámetros específicos
   * @param {string} key
   */
  getParameter: key => {
    return apiClient.get(`/config/${key}`)
  },

  /**
   * Actualizar parámetro específico
   * @param {string} key
   * @param {any} value
   */
  updateParameter: (key, value) => {
    return apiClient.patch(`/config/${key}`, { value })
  }
}

/**
 * ============================================
 * BASE DE DATOS (Admin) - VERSIÓN COMPLETA
 * ============================================
 */
export const databaseAPI = {
  /**
   * Crear respaldo
   * @param {string} type - 'completo' | 'incremental' | 'selectivo'
   * @param {Object} options - { tables: [], description: '' }
   */
  createBackup: (type, options = {}) => {
    return apiClient.post('/database/backup', { type, ...options })
  },

  /**
   * Listar respaldos disponibles
   */
  listBackups: () => {
    return apiClient.get('/database/backups')
  },

  /**
   * Restaurar base de datos
   * @param {string} backupId
   */
  restore: backupId => {
    return apiClient.post('/database/restore', { backup_id: backupId })
  },

  /**
   * Eliminar respaldo
   * @param {string} backupId
   */
  deleteBackup: backupId => {
    return apiClient.delete(`/database/backups/${backupId}`)
  },

  /**
   * Listar tablas disponibles
   */
  listTables: () => {
    return apiClient.get('/database/tables')
  },

  /**
   * Obtener estadísticas de BD
   */
  getStats: () => {
    return apiClient.get('/database/stats')
  },

  /**
   * Limpiar caché
   */
  clearCache: () => {
    return apiClient.post('/database/clear-cache')
  },

  /**
   * Optimizar base de datos
   */
  optimize: () => {
    return apiClient.post('/database/optimize')
  },
  getAutomaticBackupConfig: () =>
    apiClient.get('/database/automatic-backup/config'),
  updateAutomaticBackupConfig: config =>
    apiClient.put('/database/automatic-backup/config', config),
  getScheduledBackups: () =>
    apiClient.get('/database/automatic-backup/scheduled'),
  cancelScheduledBackup: scheduleId =>
    apiClient.delete(`/database/automatic-backup/scheduled/${scheduleId}`),
  triggerBackupNow: () => apiClient.post('/database/automatic-backup/trigger'),
  cleanupOldBackups: () => apiClient.post('/database/automatic-backup/cleanup')
}

/**
 * ============================================
 * MONITOREO (MongoDB - Logs)
 * ============================================
 */
export const monitoringAPI = {
  /**
   * Obtener estado del sistema
   */
  getSystemStatus: () => {
    return apiClient.get('/monitoring/status')
  },

  /**
   * Obtener logs del sistema
   * @param {Object} params - { limit, level }
   */
  getLogs: (params = {}) => {
    return apiClient.get('/monitoring/logs', params)
  },

  /**
   * Obtener métricas de rendimiento
   */
  getMetrics: () => {
    return apiClient.get('/monitoring/metrics')
  },

  /**
   * Obtener usuarios activos
   */
  getActiveUsers: () => {
    return apiClient.get('/monitoring/active-users')
  }
}

/**
 * ============================================
 * NOTIFICACIONES (MongoDB)
 * ============================================
 */
export const notificationAPI = {
  /**
   * Obtener notificaciones del usuario
   */
  getMyNotifications: () => {
    return apiClient.get('/notifications/me')
  },

  /**
   * Marcar notificación como leída
   * @param {string} notificationId
   */
  markAsRead: notificationId => {
    return apiClient.patch(`/notifications/${notificationId}/read`)
  },

  /**
   * Marcar todas como leídas
   */
  markAllAsRead: () => {
    return apiClient.patch('/notifications/mark-all-read')
  },

  /**
   * Eliminar notificación
   * @param {string} notificationId
   */
  delete: notificationId => {
    return apiClient.delete(`/notifications/${notificationId}`)
  }
}

/**
 * ============================================
 * PUBLICIDAD (MySQL)
 * ============================================
 */
export const adsAPI = {
  /**
   * Obtener anuncios públicos
   */
  getPublic: () => {
    return apiClient.get('/ads/public')
  },

  /**
   * Obtener todos los anuncios (Admin)
   */
  getAll: () => {
    return apiClient.get('/ads/admin')
  },

  /**
   * Crear anuncio
   * @param {Object} adData - { title, image_url, link_url, position, active }
   */
  create: adData => {
    return apiClient.post('/ads', adData)
  },

  /**
   * Actualizar anuncio
   * @param {number} id
   * @param {Object} updates
   */
  update: (id, updates) => {
    return apiClient.put(`/ads/${id}`, updates)
  },

  /**
   * Eliminar anuncio
   * @param {number} id
   */
  delete: id => {
    return apiClient.delete(`/ads/${id}`)
  },

  /**
   * Subir imagen de anuncio
   * @param {File} file
   */
  upload: file => {
    return apiClient.upload('/ads/upload', file)
  }
}

/**
 * ============================================
 * RECINTOS (MySQL - Admin Managed)
 * ============================================
 */
export const venueAPI = {
  /**
   * Obtener todos los recintos
   * @param {string} status - 'active' | 'inactive' | 'all'
   */
  getAll: (status = 'active') => {
    return apiClient.get('/venues', { status_filter: status })
  },

  /**
   * Obtener recinto por ID
   * @param {number} id
   */
  getById: id => {
    return apiClient.get(`/venues/${id}`)
  },

  /**
   * Crear recinto (Admin)
   * @param {Object} venueData
   */
  create: venueData => {
    return apiClient.post('/venues', venueData)
  },

  /**
   * Actualizar recinto (Admin)
   * @param {number} id
   * @param {Object} updates
   */
  update: (id, updates) => {
    return apiClient.put(`/venues/${id}`, updates)
  },

  /**
   * Eliminar recinto (Admin)
   * @param {number} id
   */
  delete: id => {
    return apiClient.delete(`/venues/${id}`)
  }
}

/**
 * ============================================
 * PÁGINAS (CMS)
 * ============================================
 */
export const pagesAPI = {
  /**
   * Obtener página por slug (Público)
   * @param {string} slug
   */
  getBySlug: slug => {
    return apiClient.get(`/pages/${slug}`)
  },

  /**
   * Obtener todas las páginas (Admin)
   * @param {string} section - Opcional: filtrar por sección
   */
  getAll: (section = null) => {
    return apiClient.get('/pages', { section })
  },

  /**
   * Crear página (Admin)
   * @param {Object} pageData
   */
  create: pageData => {
    return apiClient.post('/pages', pageData)
  },

  /**
   * Actualizar página (Admin)
   * @param {string} slug
   * @param {Object} pageData
   */
  update: (slug, pageData) => {
    return apiClient.put(`/pages/${slug}`, pageData)
  },

  /**
   * Eliminar página (Admin)
   * @param {string} slug
   */
  delete: slug => {
    return apiClient.delete(`/pages/${slug}`)
  }
}

/**
 * ============================================
 * LOGS DEL SISTEMA (MySQL)
 * ============================================
 */
export const logsAPI = {
  /**
   * Obtener logs de auditoría (Admin)
   * @param {Object} params - { limit, offset, user_id, action }
   */
  getAuditLogs: (params = {}) => {
    return apiClient.get('/logs/audit', params)
  },

  /**
   * Obtener logs de peticiones (Admin)
   * @param {Object} params - { limit, offset, status_code, method }
   */
  getRequestLogs: (params = {}) => {
    return apiClient.get('/logs/requests', params)
  }
}

/**
 * ============================================
 * PAGOS (MySQL)
 * ============================================
 */
export const paymentAPI = {
  /**
   * Crear intención de pago
   * @param {Object} paymentData - { amount, eventId, tickets }
   */
  createIntent: paymentData => {
    return apiClient.post('/payments/create-intent', paymentData)
  },

  /**
   * Confirmar pago
   * @param {string} paymentId
   */
  confirm: paymentId => {
    return apiClient.post(`/payments/${paymentId}/confirm`)
  },

  /**
   * Obtener historial de pagos
   */
  getHistory: () => {
    return apiClient.get('/payments/history')
  },

  /**
   * Reembolsar pago (Admin)
   * @param {string} paymentId
   */
  refund: paymentId => {
    return apiClient.post(`/payments/${paymentId}/refund`)
  }
}

/**
 * ============================================
 * RESTORE AUDIT API (Admin)
 * ============================================
 */
const restoreAuditAPI = {
  createEvent: data => apiClient.post('/restore-audit/events', data),
  getEvents: (params = {}) => apiClient.get('/restore-audit/events', params),
  getEvent: id => apiClient.get(`/restore-audit/events/${id}`),
  updateEvent: (id, data) => apiClient.put(`/restore-audit/events/${id}`, data),
  saveTechnicalChecks: (id, data) => apiClient.post(`/restore-audit/events/${id}/technical-checks`, data),
  saveFunctionalChecks: (id, data) => apiClient.post(`/restore-audit/events/${id}/functional-checks`, data),
  saveOperationalImpact: (id, data) => apiClient.post(`/restore-audit/events/${id}/operational-impact`, data),
  confirmEvent: (id, data) => apiClient.post(`/restore-audit/events/${id}/confirm`, data),
  getStats: () => apiClient.get('/restore-audit/stats'),
  exportHistory: (params = {}) => apiClient.get('/restore-audit/export', params)
}

/**
 * ============================================
 * ADMIN USERS MANAGEMENT (MySQL)
 * ============================================
 */
export const adminUsersAPI = {
  /** Listar con filtros: search, role, status, limit, offset */
  getAll: (params = {}) => apiClient.get('/admin/users', params),

  /** Crear usuario */
  create: userData => apiClient.post('/admin/users', userData),

  /** Detalle de usuario */
  getById: userId => apiClient.get(`/admin/users/${userId}`),

  /** Reset de contraseña por admin */
  resetPassword: (userId, newPassword) =>
    apiClient.patch(`/admin/users/${userId}/password`, { new_password: newPassword }),

  /** Cambiar estado (active / disabled) */
  changeStatus: (userId, status) =>
    apiClient.patch(`/admin/users/${userId}/status`, { status }),

  /** Desbloquear cuenta */
  unlock: userId => apiClient.patch(`/admin/users/${userId}/unlock`)
}

/**
 * ============================================
 * ACHIEVEMENTS / LOGROS (Modulo Aislado)
 * ============================================
 */
export const achievementsAPI = {
  /** Listar todos los logros con progreso del usuario */
  getAll: () => apiClient.get('/achievements'),

  /** Logros desbloqueados del usuario */
  getMy: () => apiClient.get('/achievements/my'),

  /** Cupones activos del usuario */
  getCoupons: () => apiClient.get('/achievements/coupons'),

  /** Verificar y desbloquear logros */
  check: () => apiClient.post('/achievements/check'),

  /** Validar cupon (calcula descuento sin consumir) */
  validateCoupon: (couponCode, subtotal, feePercent = 10) =>
    apiClient.post('/achievements/coupons/validate', {
      coupon_code: couponCode,
      subtotal,
      service_fee_percent: feePercent
    }),

  /** Consumir cupon (despues de compra exitosa) */
  consumeCoupon: (couponCode, subtotal, feePercent = 10) =>
    apiClient.post('/achievements/coupons/consume', {
      coupon_code: couponCode,
      subtotal,
      service_fee_percent: feePercent
    }),

  /** Verificar si el usuario tiene boleto premium */
  hasPremiumTicket: () => apiClient.get('/achievements/has-premium-ticket')
}

/**
 * ============================================
 * MANAGER DE EVENTOS (Gestor)
 * ============================================
 */
export const managerAPI = {
  /** Listar eventos del gestor autenticado */
  getMyEvents: () => apiClient.get('/manager/events'),

  /** Obtener detalle de un evento (con revenue y tickets) */
  getEventDetail: id => apiClient.get(`/manager/events/${id}`),

  /** Obtener analytics de tickets de un evento */
  getEventTickets: id => apiClient.get(`/manager/events/${id}/tickets`),

  /** Obtener revenue de un evento */
  getEventRevenue: id => apiClient.get(`/manager/events/${id}/revenue`),

  /** Crear evento nuevo (status: draft) */
  createEvent: eventData => apiClient.post('/manager/events', eventData),

  /** Actualizar configuracion de un evento */
  updateEvent: (id, updates) => apiClient.put(`/manager/events/${id}`, updates),

  /** Publicar un evento */
  publishEvent: id => apiClient.patch(`/manager/events/${id}/publish`),

  /** Despublicar un evento */
  unpublishEvent: id => apiClient.patch(`/manager/events/${id}/unpublish`),

  /** Cancelar un evento (motivo obligatorio) */
  cancelEvent: (id, reason) => apiClient.patch(`/manager/events/${id}/cancel`, { reason }),

  /** Eliminar un evento (solo borradores) */
  deleteEvent: id => apiClient.delete(`/manager/events/${id}`),

  /** Subir imagen de evento */
  uploadImage: (file) => {
    return apiClient.upload('/manager/events/upload-image', file)
  }
}

/**
 * ============================================
 * REEMBOLSOS
 * ============================================
 */
export const refundAPI = {
  /** Verificar politica de reembolso para un evento */
  checkPolicy: eventId => apiClient.get(`/refunds/policy/${eventId}`),

  /** Solicitar reembolso de un ticket */
  requestRefund: (ticketId, reason) =>
    apiClient.post('/refunds/request', { ticket_id: ticketId, reason }),

  /** Obtener historial de reembolsos del usuario */
  getMyRefunds: () => apiClient.get('/refunds/my-refunds')
}

/**
 * ============================================
 * EXPORTAR API COMPLETA
 * ============================================
 */
const api = {
  auth: authAPI,
  user: userAPI,
  event: eventAPI,
  ticket: ticketAPI,
  stats: statsAPI,
  config: configAPI,
  database: databaseAPI,
  monitoring: monitoringAPI,
  notification: notificationAPI,
  payment: paymentAPI,
  ads: adsAPI,
  pages: pagesAPI,
  restoreAudit: restoreAuditAPI,
  adminUsers: adminUsersAPI,
  achievements: achievementsAPI,
  manager: managerAPI,
  refund: refundAPI
}

export default api

