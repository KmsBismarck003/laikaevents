/**
 * ApiClient - Base class for HTTP requests
 */

export const API_BASE_URL =
    process.env.REACT_APP_API_URL ||
    (window.location.hostname === 'localhost' ||
        window.location.hostname === '127.0.0.1'
        ? 'http://localhost:8000/api'
        : `http://${window.location.hostname}:8000/api`)

class ApiClient {
    constructor(baseURL) {
        this.baseURL = baseURL
    }

    getHeaders() {
        const token = localStorage.getItem('token') || sessionStorage.getItem('token')
        const headers = {
            'Content-Type': 'application/json'
        }
        if (token) {
            headers['Authorization'] = `Bearer ${token}`
        }
        return headers
    }

    async handleResponse(response) {
        const contentType = response.headers.get('content-type')
        let data
        if (contentType && contentType.includes('application/json')) {
            data = await response.json()
        } else {
            data = await response.text()
        }
        if (!response.ok) {
            // Handle unauthorized
            if (response.status === 401 && !window.location.pathname.includes('/login')) {
                localStorage.removeItem('token')
                localStorage.removeItem('user')
                sessionStorage.removeItem('token')
                sessionStorage.removeItem('user')
                // window.location.href = '/login'
            }
            throw {
                status: response.status,
                message: data.message || data.detail || 'Error en la petición',
                data
            }
        }
        return data
    }

    async get(endpoint, params = {}) {
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

    async post(endpoint, data = {}) {
        const response = await fetch(`${this.baseURL}${endpoint}`, {
            method: 'POST',
            headers: this.getHeaders(),
            body: JSON.stringify(data)
        })
        return this.handleResponse(response)
    }

    async put(endpoint, data = {}) {
        const response = await fetch(`${this.baseURL}${endpoint}`, {
            method: 'PUT',
            headers: this.getHeaders(),
            body: JSON.stringify(data)
        })
        return this.handleResponse(response)
    }

    async patch(endpoint, data = {}) {
        const response = await fetch(`${this.baseURL}${endpoint}`, {
            method: 'PATCH',
            headers: this.getHeaders(),
            body: JSON.stringify(data)
        })
        return this.handleResponse(response)
    }

    async delete(endpoint) {
        const response = await fetch(`${this.baseURL}${endpoint}`, {
            method: 'DELETE',
            headers: this.getHeaders()
        })
        return this.handleResponse(response)
    }

    async upload(endpoint, file) {
        const formData = new FormData()
        formData.append('file', file)

        const token = localStorage.getItem('token') || sessionStorage.getItem('token')
        const headers = {}
        if (token) {
            headers['Authorization'] = `Bearer ${token}`
        }

        const response = await fetch(`${this.baseURL}${endpoint}`, {
            method: 'POST',
            headers: headers,
            body: formData
        })
        return this.handleResponse(response)
    }
}

export const apiClient = new ApiClient(API_BASE_URL)
export default ApiClient
