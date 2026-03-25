import { useState, useCallback, useEffect } from 'react'
import api from '../services/api'

// ============================================
// CONSTANTES Y DEFAULTS
// ============================================

const VALID_ROLES = ['admin', 'gestor', 'operador', 'usuario']

const ROLE_DEFAULTS = {
  admin: {
    canLogin: true,
    canViewEvents: true, canViewUsers: true, canViewStats: true, canViewTickets: true,
    canCreateEvents: true, canEditEvents: true, canDeleteEvents: true,
    canCreateUsers: true, canEditUsers: true, canDeleteUsers: true,
    canSellTickets: true, canValidateTickets: true, canRefundTickets: true,
    canManageDatabase: true, canManageConfig: true, canViewLogs: true, canManageAds: true,
    canManageMyProfile: true, canManageTicketsPricing: true, canMessageAttendees: true, 
    canCreateCoupons: true, canViewEventAnalytics: true, canOverrideValidation: true, 
    canScanMultipleEvents: true, canViewRealTimeAttendance: true
  },
  gestor: {
    canLogin: true,
    canViewEvents: true, canViewUsers: false, canViewStats: true, canViewTickets: false,
    canCreateEvents: true, canEditEvents: true, canDeleteEvents: true,
    canCreateUsers: false, canEditUsers: false, canDeleteUsers: false,
    canSellTickets: false, canValidateTickets: false, canRefundTickets: false,
    canManageDatabase: false, canManageConfig: false, canViewLogs: false, canManageAds: true,
    canManageMyProfile: true, canManageTicketsPricing: true, canMessageAttendees: true, 
    canCreateCoupons: true, canViewEventAnalytics: true, canOverrideValidation: false, 
    canScanMultipleEvents: false, canViewRealTimeAttendance: true
  },
  operador: {
    canLogin: true,
    canViewEvents: true, canViewUsers: false, canViewStats: false, canViewTickets: true,
    canCreateEvents: false, canEditEvents: false, canDeleteEvents: false,
    canCreateUsers: false, canEditUsers: false, canDeleteUsers: false,
    canSellTickets: true, canValidateTickets: true, canRefundTickets: false,
    canManageDatabase: false, canManageConfig: false, canViewLogs: false, canManageAds: false,
    canManageMyProfile: true, canManageTicketsPricing: false, canMessageAttendees: false, 
    canCreateCoupons: false, canViewEventAnalytics: false, canOverrideValidation: true, 
    canScanMultipleEvents: true, canViewRealTimeAttendance: true
  },
  usuario: {
    canLogin: true,
    canViewEvents: true,
    canViewAchievements: true, canRequestRefunds: true, canPurchaseTickets: true,
    canTransferTickets: true, canUseVipServices: true, canManageMyProfile: true,
    canAccessCart: true, canViewMyHistory: true, canViewMyTickets: true
  }
}

/**
 * Hook aislado para gestión de permisos y roles.
 * Maneja lógica de negocio, validaciones y comunicación con API.
 */
const useUserPermissions = (userId, initialRole = 'usuario') => {
  const [role, setRoleState] = useState(initialRole)
  const [permissions, setPermissions] = useState(ROLE_DEFAULTS[initialRole] || ROLE_DEFAULTS.usuario)
  const [status, setStatus] = useState('IDLE')
  const [error, setError] = useState(null)

  // Sincronización reactiva con el prop inicial (CRÍTICO para que la tabla mande)
  useEffect(() => {
    if (initialRole && VALID_ROLES.includes(initialRole)) {
      setRoleState(initialRole)
      setPermissions(prev => ({ ...ROLE_DEFAULTS[initialRole], ...prev }))
    }
  }, [initialRole])

  // ── Cargar permisos desde API ──
  const loadPermissions = useCallback(async () => {
    if (!userId) return

    setStatus('LOADING')
    setError(null)

    try {
      const data = await api.user.getPermissions(userId)

      // Normalizar datos recibidos
      const receivedRole = VALID_ROLES.includes(data.role) ? data.role : role
      let receivedPermissions = data.permissions || {}

      if (typeof receivedPermissions === 'string') {
        try {
          receivedPermissions = JSON.parse(receivedPermissions)
        } catch (e) {
          receivedPermissions = {}
        }
      }

      // NO PERMITIR QUE LA API REVIERTA UN GESTOR A USUARIO SI EL FRONTEND SABE QUE ES GESTOR
      const finalRole = (role !== 'usuario' && receivedRole === 'usuario') ? role : receivedRole
      const safePermissions = { ...ROLE_DEFAULTS[finalRole], ...receivedPermissions }

      setRoleState(finalRole)
      setPermissions(safePermissions)
      setStatus('READY')

    } catch (err) {
      console.error("Error cargando permisos:", err)
      setError("TEMPORAL_ADN_ACTIVE")
      setStatus('ERROR')
    }
  }, [userId, role])

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

  // Restaurar permisos por defecto del rol seleccionado (Purga Total)
  const applyRoleDefaults = () => {
    const defaults = ROLE_DEFAULTS[role] || ROLE_DEFAULTS.usuario
    setPermissions({ ...defaults }) // Nueva referencia para forzar re-render
    setError(null)
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
