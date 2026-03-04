import React, { useEffect } from 'react'
import { Modal, Button, Badge, Spinner, Alert } from '../components'
import { useNotification } from '../context/NotificationContext'
import useUserPermissions from '../hooks/useUserPermissions'
import './UserPermissionsModal.css'

/**
 * Modal para gestionar permisos de usuarios.
 * Refactorizado para usar hook de lógica aislada.
 */
const UserPermissionsModal = ({ isOpen, onClose, user, onUpdate }) => {
  const { success, error: showNotificationError } = useNotification()

  // Si no hay usuario, no renderizamos nada útil, pero necesitamos llamar al hook condicionalmente
  // o simplemente devolver null antes.
  // React Hooks rules: deben llamarse siempre en el mismo orden.
  // Pasamos user?.id, si es undefined el hook maneja no hacer fetch.
  const {
    role,
    permissions,
    status,
    error,
    setRole,
    togglePermission,
    setAllPermissions,
    applyRoleDefaults,
    savePermissions,
    reload
  } = useUserPermissions(user?.id)

  // Efecto para recargar cuando se abre el modal
  useEffect(() => {
    if (isOpen && user?.id) {
      reload()
    }
  }, [isOpen, user, reload])

  // Manejador de Guardado
  const handleSave = async () => {
    const ok = await savePermissions()
    if (ok) {
      success('Permisos actualizados correctamente')
      onUpdate?.() // Notificar al padre para recargar la tabla
      onClose()
    } else {
      showNotificationError(error || 'Error al guardar permisos')
    }
  }

  if (!user || !isOpen) return null

  // Grupos de UI para render
  const permissionGroups = [
    {
      title: '📖 Permisos de Lectura',
      keys: ['canViewEvents', 'canViewUsers', 'canViewStats', 'canViewTickets'],
      labels: {
        canViewEvents: 'Ver Eventos',
        canViewUsers: 'Ver Usuarios',
        canViewStats: 'Ver Estadísticas',
        canViewTickets: 'Ver Boletos'
      },
      icons: {
        canViewEvents: '🎫',
        canViewUsers: '👥',
        canViewStats: '📊',
        canViewTickets: '🎟️'
      }
    },
    {
      title: '✏️ Permisos de Escritura',
      keys: ['canCreateEvents', 'canEditEvents', 'canSellTickets', 'canValidateTickets'],
      labels: {
        canCreateEvents: 'Crear Eventos',
        canEditEvents: 'Editar Eventos',
        canSellTickets: 'Vender Boletos',
        canValidateTickets: 'Validar Boletos'
      },
      icons: {
        canCreateEvents: '➕',
        canEditEvents: '✏️',
        canSellTickets: '💰',
        canValidateTickets: '✅'
      }
    },
    {
      title: '🔐 Permisos Administrativos',
      keys: ['canDeleteEvents', 'canCreateUsers', 'canEditUsers', 'canDeleteUsers', 'canRefundTickets', 'canManageDatabase', 'canManageConfig', 'canViewLogs'],
      labels: {
        canDeleteEvents: 'Eliminar Eventos',
        canCreateUsers: 'Crear Usuarios',
        canEditUsers: 'Editar Usuarios',
        canDeleteUsers: 'Eliminar Usuarios',
        canRefundTickets: 'Reembolsar Boletos',
        canManageDatabase: 'Gestionar BD',
        canManageConfig: 'Configuración',
        canViewLogs: 'Ver Logs'
      },
      icons: {
        canDeleteEvents: '🗑️',
        canCreateUsers: '👤',
        canEditUsers: '👥',
        canDeleteUsers: '❌',
        canRefundTickets: '💸',
        canManageDatabase: '💾',
        canManageConfig: '⚙️',
        canViewLogs: '📝'
      }
    }
  ]

  const isLoading = status === 'LOADING'
  const isSaving = status === 'SAVING'
  const isReady = status === 'READY' || status === 'ERROR' || status === 'SAVING'

  // Funciones auxiliares de UI para select all
  const handleSelectGroup = (keys) => {
    // Determinar si activar o desactivar: si alguno está false -> activar todos. Si todos true -> desactivar.
    const allActive = keys.every(k => permissions[k])
    setAllPermissions(keys, !allActive)
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Permisos de ${user.first_name || user.email}`}
      size="large"
    >
      <div className="user-permissions-modal">
        {error && <Alert type="error" message={error} />}

        {isLoading ? (
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <Spinner text="Cargando permisos..." />
          </div>
        ) : (
          <>
            {/* Selector de Rol */}
            <div className="role-selector">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <h3>Rol del Usuario</h3>
                <Button
                  size="small"
                  variant="secondary"
                  onClick={applyRoleDefaults}
                  title="Restablecer permisos a los valores por defecto del rol"
                >
                  ↺ Aplicar Defaults
                </Button>
              </div>

              <div className="role-buttons">
                {['admin', 'gestor', 'operador', 'usuario'].map(roleOption => (
                  <button
                    key={roleOption}
                    className={`role-button ${role === roleOption ? 'active' : ''}`}
                    onClick={() => setRole(roleOption)}
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
                      onClick={() => handleSelectGroup(group.keys)}
                    >
                      Alternar Todos
                    </button>
                  </div>

                  <div className="permissions-list">
                    {group.keys.map(key => (
                      <label key={key} className="permission-item">
                        <input
                          type="checkbox"
                          checked={!!permissions[key]}
                          onChange={() => togglePermission(key)}
                        />
                        <span className="permission-icon">{group.icons[key]}</span>
                        <span className="permission-label">{group.labels[key]}</span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Resumen */}
            <div className="permissions-summary">
              <h4>📋 Resumen</h4>
              <div className="summary-stats">
                <div className="summary-item">
                  <span>Rol:</span>
                  <Badge variant={
                    role === 'admin' ? 'danger' :
                    role === 'gestor' ? 'warning' :
                    role === 'operador' ? 'info' : 'default'
                  }>
                    {role.toUpperCase()}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Botones */}
            <div className="modal-actions">
              <Button
                variant="primary"
                onClick={handleSave}
                disabled={isSaving}
                fullWidth
              >
                {isSaving ? 'Guardando...' : '💾 Guardar Permisos'}
              </Button>
              <Button variant="secondary" onClick={onClose} fullWidth disabled={isSaving}>
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
