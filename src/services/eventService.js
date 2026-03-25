/**
 * EventService - Manejo de eventos
 */
import { apiClient } from './apiClient'

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
        // Note: upload method should be implemented in apiClient if not there
        // For now assuming apiClient has it or we use regular post with FormData
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

export default eventAPI
