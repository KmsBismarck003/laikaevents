/**
 * ContentService - Manejo de contenido (páginas, publicidad, notificaciones)
 */
import { apiClient } from './apiClient'

export const pagesAPI = {
    getBySlug: slug => apiClient.get(`/pages/${slug}`),
    getAll: (section = null) => apiClient.get('/pages', { section }),
    create: pageData => apiClient.post('/pages', pageData),
    update: (slug, pageData) => apiClient.put(`/pages/${slug}`, pageData),
    delete: slug => apiClient.delete(`/pages/${slug}`)
}

export const adsAPI = {
    getPublic: () => apiClient.get('/ads/public'),
    getAll: () => apiClient.get('/ads/admin'),
    create: adData => apiClient.post('/ads', adData),
    update: (id, updates) => apiClient.put(`/ads/${id}`, updates),
    delete: id => apiClient.delete(`/ads/${id}`),
    upload: file => apiClient.upload('/ads/upload', file),
    registerClick: (id, userId = null) => apiClient.post(`/ads/${id}/click`, { user_id: userId }),
    getClicks: id => apiClient.get(`/ads/${id}/clicks`)
}

export const notificationAPI = {
    getMyNotifications: () => apiClient.get('/notifications/me'),
    markAsRead: notificationId => apiClient.patch(`/notifications/${notificationId}/read`),
    markAllAsRead: () => apiClient.patch('/notifications/mark-all-read'),
    delete: notificationId => apiClient.delete(`/notifications/${notificationId}`)
}

export const tickerAPI = {
    getSettings: () => apiClient.get('/config/ticker'),
    updateSettings: data => apiClient.post('/config/ticker', data)
}
