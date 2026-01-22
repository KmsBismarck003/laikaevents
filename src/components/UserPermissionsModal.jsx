import React, { useState, useEffect } from 'react'
import { Modal, Button, Badge, Alert, Spinner } from '../components'
import api from '../services/api'
import { useNotification } from '../context/NotificationContext'
import './UserPermissionsModal.css'

/**
 * Modal para gestionar permisos de usuarios
 * Permite asignar permisos individuales o masivos
 */
const UserPermissionsModal = ({ isOpen, onClose, user, onUpdate }) => {
  const { success, error: showError } = useNotification()
  const [loading, setLoading] = useState(false)
  const [permissions, setPermissions] = useState({
    // Permisos de lectura
    canViewEvents: false,
    canViewUsers: false,
    canViewStats: false,
    canViewTickets: false,
    
    // Permisos de escritura
    canCreateEvents: false,
    canEditEvents: false,
    canDeleteEvents: false,
    
    // Permisos de gestión de usuarios
    canCreateUsers: false,
    canEditUsers: false,
    canDeleteUsers: false,
    
    // Permisos de tickets
    canSellTickets: false,
    canValidateTickets: false,
    canRefundTickets: false,
    
    // Permisos de administración
    canManageDatabase: false,
    canManageConfig: false,
    canViewLogs: false
  })

  const [role, setRole] = useState('usuario')

  useEffect(() => {
    if (user) {
      setRole(user.role || 'usuario')
      // Cargar permisos del usuario desde el backend
      loadUserPermissions(user.id)
    }
  }, [user])

  const loadUserPermissions = async (userId) => {
    setLoading(true)
    try {
      const response = await api.user.getPermissions(userId)
      setPermissions(response.permissions || {})
    } catch (error) {
      console.error('Error al cargar permisos:', error)
      // Si no existen permisos, usar defaults basados en el rol
      setPermissionsByRole(user.role || 'usuario')
    } finally {
      setLoading(false)
    }
  }

  const setPermissionsByRole = (selectedRole) => {
    const rolePermissions = {
      admin: {
        canViewEvents: true,
        canViewUsers: true,
        canViewStats: true,
        canViewTickets: true,
        canCreateEvents: true,
        canEditEvents: true,
        canDeleteEvents: true,
        canCreateUsers: true,
        canEditUsers: true,
        canDeleteUsers: true,
        canSellTickets: true,
        canValidateTickets: true,
        canRefundTickets: true,
        canManageDatabase: true,
        canManageConfig: true,
        canViewLogs: true
      },
      gestor: {
        canViewEvents: true,
        canViewUsers: true,
        canViewStats: true,
        canViewTickets: true,
        canCreateEvents: true,
        canEditEvents: true,
        canDeleteEvents: false,
        canCreateUsers: false,
        canEditUsers: false,
        canDeleteUsers: false,
        canSellTickets: true,
        canValidateTickets: true,
        canRefundTickets: false,
        canManageDatabase: false,
        canManageConfig: false,
        canViewLogs: false
      },
      operador: {
        canViewEvents: true,
        canViewUsers: false,
        canViewStats: false,
        canViewTickets: true,
        canCreateEvents: false,
        canEditEvents: false,
        canDeleteEvents: false,
        canCreateUsers: false,
        canEditUsers: false,
        canDeleteUsers: false,
        canSellTickets: true,
        canValidateTickets: true,
        canRefundTickets: false,
        canManageDatabase: false,
        canManageConfig: false,
        canViewLogs: false
      },
      usuario: {
        canViewEvents: true,
        canViewUsers: false,
        canViewStats: false,
        canViewTickets: false,
        canCreateEvents: false,
        canEditEvents: false,
        canDeleteEvents: false,
        canCreateUsers: false,
        canEditUsers: false,
        canDeleteUsers: false,
        canSellTickets: false,
        canValidateTickets: false,
        canRefundTickets: false,
        canManageDatabase: false,
        canManageConfig: false,
        canViewLogs: false
      }
    }

    setPermissions(rolePermissions[selectedRole] || rolePermissions.usuario)
  }

  const handleRoleChange = (newRole) => {
    setRole(newRole)
    setPermissionsByRole(newRole)
  }

  const handlePermissionChange = (permission) => {
    setPermissions(prev => ({
      ...prev,
      [permission]: !prev[permission]
    }))
  }

  const handleSelectAllRead = () => {
    const allReadSelected = permissions.canViewEvents && 
                           permissions.canViewUsers && 
                           permissions.canViewStats && 
                           permissions.canViewTickets

    setPermissions(prev => ({
      ...prev,
      canViewEvents: !allReadSelected,
      canViewUsers: !allReadSelected,
      canViewStats: !allReadSelected,
      canViewTickets: !allReadSelected
    }))
  }

  const handleSelectAllWrite = () => {
    const allWriteSelected = permissions.canCreateEvents && 
                             permissions.canEditEvents && 
                             permissions.canSellTickets

    setPermissions(prev => ({
      ...prev,
      canCreateEvents: !allWriteSelected,
      canEditEvents: !allWriteSelected,
      canSellTickets: !allWriteSelected,
      canValidateTickets: !allWriteSelected
    }))
  }

  const handleSelectAllAdmin = () => {
    const allAdminSelected = permissions.canManageDatabase && 
                            permissions.canManageConfig && 
                            permissions.canViewLogs

    setPermissions(prev => ({
      ...prev,
      canDeleteEvents: !allAdminSelected,
      canCreateUsers: !allAdminSelected,
      canEditUsers: !allAdminSelected,
      canDeleteUsers: !allAdminSelected,
      canRefundTickets: !allAdminSelected,
      canManageDatabase: !allAdminSelected,
      canManageConfig: !allAdminSelected,
      canViewLogs: !allAdminSelected
    }))
  }

  const handleSavePermissions = async () => {
    setLoading(true)
    try {
      await api.user.updatePermissions(user.id, {
        role,
        permissions
      })

      success('Permisos actualizados correctamente')
      onUpdate?.()
      onClose()
    } catch (error) {
      console.error('Error al guardar permisos:', error)
      showError('Error al actualizar permisos')
    } finally {
      setLoading(false)
    }
  }

  if (!user) return null

  const permissionGroups = [
    {
      title: '📖 Permisos de Lectura',
      selectAllAction: handleSelectAllRead,
      permissions: [
        { key: 'canViewEvents', label: 'Ver Eventos', icon: '🎫' },
        { key: 'canViewUsers', label: 'Ver Usuarios', icon: '👥' },
        { key: 'canViewStats', label: 'Ver Estadísticas', icon: '📊' },
        { key: 'canViewTickets', label: 'Ver Boletos', icon: '🎟️' }
      ]
    },
    {
      title: '✏️ Permisos de Escritura',
      selectAllAction: handleSelectAllWrite,
      permissions: [
        { key: 'canCreateEvents', label: 'Crear Eventos', icon: '➕' },
        { key: 'canEditEvents', label: 'Editar Eventos', icon: '✏️' },
        { key: 'canSellTickets', label: 'Vender Boletos', icon: '💰' },
        { key: 'canValidateTickets', label: 'Validar Boletos', icon: '✅' }
      ]
    },
    {
      title: '🔐 Permisos Administrativos',
      selectAllAction: handleSelectAllAdmin,
      permissions: [
        { key: 'canDeleteEvents', label: 'Eliminar Eventos', icon: '🗑️' },
        { key: 'canCreateUsers', label: 'Crear Usuarios', icon: '👤' },
        { key: 'canEditUsers', label: 'Editar Usuarios', icon: '👥' },
        { key: 'canDeleteUsers', label: 'Eliminar Usuarios', icon: '❌' },
        { key: 'canRefundTickets', label: 'Reembolsar Boletos', icon: '💸' },
        { key: 'canManageDatabase', label: 'Gestionar BD', icon: '💾' },
        { key: 'canManageConfig', label: 'Configuración', icon: '⚙️' },
        { key: 'canViewLogs', label: 'Ver Logs', icon: '📝' }
      ]
    }
  ]

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Permisos de ${user.name || user.email}`}
      size="large"
    >
      <div className="user-permissions-modal">
        {loading && (
          <div style={{ textAlign: 'center', padding: '20px' }}>
            <Spinner text="Cargando permisos..." />
          </div>
        )}

        {!loading && (
          <>
            {/* Selector de Rol */}
            <div className="role-selector">
              <h3>Rol del Usuario</h3>
              <p style={{ fontSize: '14px', color: '#6b7280', marginBottom: '12px' }}>
                Selecciona un rol predefinido o personaliza los permisos
              </p>
              
              <div className="role-buttons">
                {['admin', 'gestor', 'operador', 'usuario'].map(roleOption => (
                  <button
                    key={roleOption}
                    className={`role-button ${role === roleOption ? 'active' : ''}`}
                    onClick={() => handleRoleChange(roleOption)}
                  >
                    {roleOption === 'admin' && '👑'}
                    {roleOption === 'gestor' && '📋'}
                    {roleOption === 'operador' && '🎫'}
                    {roleOption === 'usuario' && '👤'}
                    <span>{roleOption.charAt(0).toUpperCase() + roleOption.slice(1)}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Grupos de Permisos */}
            <div className="permissions-groups">
              {permissionGroups.map((group, index) => (
                <div key={index} className="permission-group">
                  <div className="group-header">
                    <h4>{group.title}</h4>
                    <button
                      className="select-all-btn"
                      onClick={group.selectAllAction}
                    >
                      Seleccionar Todos
                    </button>
                  </div>

                  <div className="permissions-list">
                    {group.permissions.map(perm => (
                      <label key={perm.key} className="permission-item">
                        <input
                          type="checkbox"
                          checked={permissions[perm.key]}
                          onChange={() => handlePermissionChange(perm.key)}
                        />
                        <span className="permission-icon">{perm.icon}</span>
                        <span className="permission-label">{perm.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Resumen de Permisos */}
            <div className="permissions-summary">
              <h4>📋 Resumen</h4>
              <div className="summary-stats">
                <div className="summary-item">
                  <span>Permisos Activos:</span>
                  <Badge variant="primary">
                    {Object.values(permissions).filter(Boolean).length} / {Object.keys(permissions).length}
                  </Badge>
                </div>
                <div className="summary-item">
                  <span>Rol:</span>
                  <Badge variant={
                    role === 'admin' ? 'danger' :
                    role === 'gestor' ? 'warning' :
                    role === 'operador' ? 'info' : 'default'
                  }>
                    {role}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Botones de Acción */}
            <div className="modal-actions">
              <Button
                variant="primary"
                onClick={handleSavePermissions}
                disabled={loading}
                fullWidth
              >
                {loading ? 'Guardando...' : '💾 Guardar Permisos'}
              </Button>
              <Button variant="secondary" onClick={onClose} fullWidth>
                Cancelar
              </Button>
            </div>
          </>
        )}
      </div>
    </Modal>
  )
}

export default UserPermissionsModal
