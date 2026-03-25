/**
 * AuthService - Manejo de autenticación
 */
import { apiClient } from './apiClient'

export const authAPI = {
    /**
     * Iniciar sesión
     * @param {Object} credentials - { email, password }
     */
    login: credentials => {
        return apiClient.post('/auth/login', credentials)
    },

    loginGoogle: (token) => {
        return apiClient.post('/auth/login/google', { token })
    },

    loginApple: (email) => {
        return apiClient.post('/auth/login/apple', { email })
    },

    broadcastAnnouncement: (content) => {
        return apiClient.post('/auth/admin/broadcast', { content })
    },

    testEmail: (email) => {
        return apiClient.post('/auth/admin/test-email', { email })
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
    },

    uploadAvatar: (file) => {
        return apiClient.upload('/auth/users/me/avatar', file)
    },

    /**
     * Obtener logs reales de auditoría de autenticación
     * @param {Object} params - { limit, role, event_type }
     */
    getAuditLogs: (params = {}) => {
        const qs = new URLSearchParams(
            Object.entries(params).filter(([, v]) => v != null && v !== '')
        ).toString()
        return apiClient.get(`/auth/audit${qs ? `?${qs}` : ''}`)
    }
}

export default authAPI
