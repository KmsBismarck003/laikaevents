import { useState, useCallback } from 'react'
import api from '../services/api'
import { useNotification } from '../context/NotificationContext'

/**
 * Hook reutilizable para gestión de usuarios desde admin.
 * Encapsula estado, filtros, y todas las operaciones CRUD.
 */
const useAdminUsers = () => {
  const { success, error: showError } = useNotification()

  const [users, setUsers] = useState([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [filters, setFilters] = useState({ search: '', role: '', status: '' })

  // ── Fetch con filtros ──
  const fetchUsers = useCallback(async (overrideFilters) => {
    setLoading(true)
    try {
      const params = { ...(overrideFilters || filters), limit: 200 }
      // Limpiar vacíos
      Object.keys(params).forEach(k => { if (!params[k]) delete params[k] })

      const res = await api.adminUsers.getAll(params)
      setUsers(res.users || [])
      setTotal(res.total || 0)
    } catch (err) {
      console.error('❌ Error al cargar usuarios:', err)
      showError(err?.message || 'Error al cargar usuarios')
      setUsers([])
    } finally {
      setLoading(false)
    }
  }, [filters, showError])

  // ── Crear usuario ──
  const createUser = async (data) => {
    try {
      await api.adminUsers.create(data)
      success('Usuario creado exitosamente')
      await fetchUsers()
      return true
    } catch (err) {
      showError(err?.message || err?.data?.detail || 'Error al crear usuario')
      return false
    }
  }

  // ── Resetear contraseña ──
  const resetPassword = async (userId, newPassword) => {
    try {
      await api.adminUsers.resetPassword(userId, newPassword)
      success('Contraseña actualizada exitosamente')
      return true
    } catch (err) {
      showError(err?.message || 'Error al cambiar contraseña')
      return false
    }
  }

  // ── Cambiar estado ──
  const toggleStatus = async (userId, currentStatus) => {
    const newStatus = currentStatus === 'active' ? 'disabled' : 'active'
    try {
      await api.adminUsers.changeStatus(userId, newStatus)
      success(newStatus === 'active' ? 'Usuario habilitado' : 'Usuario deshabilitado')
      await fetchUsers()
      return true
    } catch (err) {
      showError(err?.message || 'Error al cambiar estado')
      return false
    }
  }

  // ── Desbloquear ──
  const unlockUser = async (userId) => {
    try {
      await api.adminUsers.unlock(userId)
      success('Usuario desbloqueado exitosamente')
      await fetchUsers()
      return true
    } catch (err) {
      showError(err?.message || 'Error al desbloquear usuario')
      return false
    }
  }

  // ── Actualizar filtros y recargar ──
  const updateFilters = (newFilters) => {
    const merged = { ...filters, ...newFilters }
    setFilters(merged)
    fetchUsers(merged)
  }

  const clearFilters = () => {
    const empty = { search: '', role: '', status: '' }
    setFilters(empty)
    fetchUsers(empty)
  }

  return {
    users,
    total,
    loading,
    filters,
    fetchUsers,
    createUser,
    resetPassword,
    toggleStatus,
    unlockUser,
    updateFilters,
    clearFilters
  }
}

export default useAdminUsers
