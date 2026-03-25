/**
 * ManagerService - Operaciones para gestores de eventos
 */
import { apiClient } from './apiClient'

export const managerAPI = {
    getMyEvents: () => apiClient.get('/manager/events'),
    getEventDetail: id => apiClient.get(`/manager/events/${id}`),
    getEventTickets: id => apiClient.get(`/manager/events/${id}/tickets`),
    getEventRevenue: id => apiClient.get(`/manager/events/${id}/revenue`),
    getAnalytics: () => apiClient.get('/stats/manager/dashboard'),
    getTransactionHistory: (params) => apiClient.get('/manager/transactions', params),
    getAttendees: (eventId) => apiClient.get(`/manager/events/${eventId}/attendees`),
    createEvent: eventData => apiClient.post('/manager/events', eventData),
    updateEvent: (id, updates) => apiClient.put(`/manager/events/${id}`, updates),
    publishEvent: id => apiClient.patch(`/manager/events/${id}/publish`),
    unpublishEvent: id => apiClient.patch(`/manager/events/${id}/unpublish`),
    cancelEvent: (id, reason) => apiClient.patch(`/manager/events/${id}/cancel`, { reason }),
    deleteEvent: id => apiClient.delete(`/manager/events/${id}`),
    uploadImage: (file) => apiClient.upload('/manager/events/upload-image', file),
    issueCourtesy: (eventId, courtesyData) => apiClient.post(`/manager/events/${eventId}/courtesy`, courtesyData)
}

export const venueAPI = {
    getAll: (status = 'active') => apiClient.get('/venues', { status_filter: status }),
    getById: id => apiClient.get(`/venues/${id}`),
    create: venueData => apiClient.post('/venues', venueData),
    update: (id, updates) => apiClient.put(`/venues/${id}`, updates),
    delete: id => apiClient.delete(`/venues/${id}`)
}
