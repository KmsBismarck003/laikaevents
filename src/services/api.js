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
  process.env.REACT_APP_API_URL || 'http://localhost:8000/api'

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
    const queryString = new URLSearchParams(params).toString()
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
  }
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
  }
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
   * @param {Object} params - { level, startDate, endDate, limit }
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
  payment: paymentAPI
}

export default api
