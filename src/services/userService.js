/**
 * UserService - Manejo de usuarios
 */
import { apiClient } from './apiClient'

export const userAPI = {
    /**
     * Obtener perfil del usuario actual
     */
    getProfile: () => {
        return apiClient.get('/auth/users/me')
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
        return apiClient.upload('/auth/users/me/avatar', file)
    },

    /**
     * Eliminar foto de perfil
     */
    deletePhoto: () => {
        return apiClient.delete('/users/me/photo')
    },

    getPermissions: userId => apiClient.get(`/users/${userId}/permissions`),
    updatePermissions: (userId, permissionsData) =>
        apiClient.put(`/users/${userId}/permissions`, permissionsData),

    /**
     * Solicitar acceso a una sección protegida (Usuario)
     * @param {string} permissionName
     */
    requestPermission: (permissionName) =>
        apiClient.post('/users/me/permissions/request', { permissionName }),

    /**
     * Aprobar solicitud de acceso (Admin)
     * @param {number} userId
     * @param {string} permissionName
     */
    approvePermission: (userId, permissionName) =>
        apiClient.post(`/users/${userId}/permissions/approve`, { permissionName })
}

export default userAPI
