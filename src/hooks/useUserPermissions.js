import { useState, useCallback, useEffect } from 'react'
import api from '../services/api'

// ============================================
// CONSTANTES Y DEFAULTS
// ============================================

const VALID_ROLES = ['admin', 'gestor', 'operador', 'usuario']

const ROLE_DEFAULTS = {
  admin: {
    canViewEvents: true, canViewUsers: true, canViewStats: true, canViewTickets: true,
    canCreateEvents: true, canEditEvents: true, canDeleteEvents: true,
    canCreateUsers: true, canEditUsers: true, canDeleteUsers: true,
    canSellTickets: true, canValidateTickets: true, canRefundTickets: true,
    canManageDatabase: true, canManageConfig: true, canViewLogs: true
  },
  gestor: {
    canViewEvents: true, canViewUsers: true, canViewStats: true, canViewTickets: true,
    canCreateEvents: true, canEditEvents: true, canDeleteEvents: false,
    canCreateUsers: false, canEditUsers: false, canDeleteUsers: false,
    canSellTickets: true, canValidateTickets: true, canRefundTickets: false,
    canManageDatabase: false, canManageConfig: false, canViewLogs: false
  },
  operador: {
    canViewEvents: true, canViewUsers: false, canViewStats: false, canViewTickets: true,
    canCreateEvents: false, canEditEvents: false, canDeleteEvents: false,
    canCreateUsers: false, canEditUsers: false, canDeleteUsers: false,
    canSellTickets: true, canValidateTickets: true, canRefundTickets: false,
    canManageDatabase: false, canManageConfig: false, canViewLogs: false
  },
  usuario: {
    canViewEvents: true, canViewUsers: false, canViewStats: false, canViewTickets: false,
    canCreateEvents: false, canEditEvents: false, canDeleteEvents: false,
    canCreateUsers: false, canEditUsers: false, canDeleteUsers: false,
    canSellTickets: false, canValidateTickets: false, canRefundTickets: false,
    canManageDatabase: false, canManageConfig: false, canViewLogs: false
  }
}

/**
 * Hook aislado para gestión de permisos y roles.
 * Maneja lógica de negocio, validaciones y comunicación con API.
 */
const useUserPermissions = (userId) => {
  const [role, setRoleState] = useState('usuario')
  const [permissions, setPermissions] = useState(ROLE_DEFAULTS.usuario)
  const [status, setStatus] = useState('IDLE') // IDLE, LOADING, READY, SAVING, ERROR
  const [error, setError] = useState(null)

  // ── Cargar permisos desde API ──
  const loadPermissions = useCallback(async () => {
    if (!userId) return

    setStatus('LOADING')
    setError(null)

    try {
      const data = await api.user.getPermissions(userId)

      // Normalizar datos recibidos
      const receivedRole = VALID_ROLES.includes(data.role) ? data.role : 'usuario'
      let receivedPermissions = data.permissions || {}

      if (typeof receivedPermissions === 'string') {
        try {
          receivedPermissions = JSON.parse(receivedPermissions)
        } catch (e) {
          console.error("Error parseando permisos:", e)
          receivedPermissions = {}
        }
      }

      // Asegurar estructura completa usando defaults como base
      const safePermissions = { ...ROLE_DEFAULTS.usuario, ...receivedPermissions }

      setRoleState(receivedRole)
      setPermissions(safePermissions)
      setStatus('READY')

    } catch (err) {
      console.error("Error cargando permisos:", err)
      setError("No se pudieron cargar los permisos del usuario.")
      setStatus('ERROR')
    }
  }, [userId])

  // Carga inicial
  useEffect(() => {
    loadPermissions()
  }, [loadPermissions])

  // ── Modificadores de Estado ──

  const setRole = (newRole) => {
    if (!VALID_ROLES.includes(newRole)) return
    setRoleState(newRole)
  }

  const togglePermission = (key) => {
    setPermissions(prev => ({
      ...prev,
      [key]: !prev[key]
    }))
  }

  const setAllPermissions = (subsetKeys, value) => {
    setPermissions(prev => {
      const next = { ...prev }
      subsetKeys.forEach(k => next[k] = value)
      return next
    })
  }

  // Restaurar permisos por defecto del rol seleccionado
  const applyRoleDefaults = () => {
    const defaults = ROLE_DEFAULTS[role] || ROLE_DEFAULTS.usuario
    setPermissions(defaults)
  }

  // ── Guardar cambios ──
  const savePermissions = async () => {
    setStatus('SAVING')
    setError(null)

    try {
      // Enviar datos limpios
      const payload = {
        role,
        permissions
      }

      await api.user.updatePermissions(userId, payload)

      setStatus('READY')
      return true
    } catch (err) {
      console.error("Error guardando permisos:", err)
      setError(err?.message || "Error al actualizar permisos.")
      setStatus('ERROR')
      return false
    }
  }

  return {
    role,
    permissions,
    status,
    error,

    // Actions
    setRole,
    togglePermission,
    setAllPermissions,
    applyRoleDefaults,
    savePermissions,
    reload: loadPermissions,

    // Constants
    VALID_ROLES,
    ROLE_DEFAULTS
  }
}

export default useUserPermissions
