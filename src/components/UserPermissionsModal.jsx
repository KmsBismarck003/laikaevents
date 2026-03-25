import React, { useEffect } from 'react'
import { Modal, Button, Badge } from '../components'
import Alert from './Alert/Alert'
import Icon from './Icons'
import Skeleton, { SkeletonRow } from './Skeleton/Skeleton'
import { useNotification } from '../context/NotificationContext'
import useUserPermissions from '../hooks/useUserPermissions'
import { getImageUrl } from '../utils/imageUtils'
import './UserPermissionsModal.css'

const ROLE_VARIANTS = { admin: 'danger', gestor: 'warning', operador: 'info', usuario: 'default' }

const UserPermissionsModal = ({ isOpen, onClose, user, onUpdate }) => {
  const { success, error: showNotificationError } = useNotification()
  const [isChangingRole, setIsChangingRole] = React.useState(false)

  const {
    role,
    permissions,
    status,
    error,
    setRole,
    togglePermission,
    setAllPermissions,
    savePermissions,
    reload
  } = useUserPermissions(user?.id, user?.role || 'usuario')

  useEffect(() => {
    if (isOpen && user?.id) {
      reload()
    }
  }, [isOpen, user, reload])

  const handleSave = async () => {
    const ok = await savePermissions()
    if (ok) {
      success('Permisos actualizados correctamente')
      onUpdate?.()
      onClose()
    } else {
      showNotificationError(error || 'Error al guardar permisos')
    }
  }

  if (!user || !isOpen) return null

  const permissionGroups = [
    {
      roleScope: ['admin', 'gestor', 'operador', 'usuario'],
      title: 'Seguridad y Perfil',
      icon: 'shield',
      keys: ['canLogin', 'canManageMyProfile'],
      labels: { canLogin: 'Iniciar Sesión', canManageMyProfile: 'Editar Perfil' }
    },
    {
      roleScope: ['usuario'],
      title: 'Experiencia Fan',
      icon: 'heart',
      keys: ['canPurchaseTickets', 'canViewMyTickets', 'canViewMyHistory', 'canViewAchievements', 'canTransferTickets', 'canAccessCart'],
      labels: {
        canPurchaseTickets: 'Comprar Boletos',
        canViewMyTickets: 'Mis Entradas',
        canViewMyHistory: 'Historial',
        canViewAchievements: 'Logros',
        canTransferTickets: 'Enviar Tickets',
        canAccessCart: 'Carrito'
      }
    },
    {
      roleScope: ['admin', 'gestor'],
      title: 'Gestión de Negocio',
      icon: 'grid',
      keys: ['canCreateEvents', 'canEditEvents', 'canDeleteEvents', 'canManageAds', 'canViewStats', 'canViewEventAnalytics'],
      labels: {
        canCreateEvents: 'Crear Eventos',
        canEditEvents: 'Editar',
        canDeleteEvents: 'Eliminar',
        canManageAds: 'Publicidad',
        canViewStats: 'Métricas',
        canViewEventAnalytics: 'Estadísticas'
      }
    },
    {
      roleScope: ['admin', 'operador'],
      title: 'Operaciones de Campo',
      icon: 'ticket',
      keys: ['canSellTickets', 'canValidateTickets', 'canOverrideValidation', 'canScanMultipleEvents', 'canViewRealTimeAttendance'],
      labels: {
        canSellTickets: 'Venta Directa',
        canValidateTickets: 'Validar QR',
        canOverrideValidation: 'Forzar Entrada',
        canScanMultipleEvents: 'Scan Masivo',
        canViewRealTimeAttendance: 'Aforo en Vivo'
      }
    },
    {
      roleScope: ['admin'],
      title: 'Control del Sistema',
      icon: 'sparkles',
      keys: ['canCreateUsers', 'canEditUsers', 'canDeleteUsers', 'canRefundTickets', 'canManageDatabase', 'canViewLogs'],
      labels: {
        canCreateUsers: 'Crear Usuarios',
        canEditUsers: 'Editar Usuarios',
        canDeleteUsers: 'Eliminar Usuarios',
        canRefundTickets: 'Reembolsar',
        canManageDatabase: 'Base de Datos',
        canViewLogs: 'Logs del Sistema'
      }
    }
  ].filter(group => {
    if (group.title === 'Experiencia Fan' && role !== 'usuario') return false
    return group.roleScope.includes(role)
  })

  const isLoading = status === 'LOADING'
  const isSaving = status === 'SAVING'

  const handleSelectGroup = (keys) => {
    const allActive = keys.every(k => permissions[k])
    setAllPermissions(keys, !allActive)
  }

  const fullName = [user.first_name, user.last_name].filter(Boolean).join(' ') || user.email || 'Usuario'
  const initials = (user.first_name?.[0] || '') + (user.last_name?.[0] || '') || user.email?.[0]?.toUpperCase() || 'U'

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="perm-modal-header-title">
          <div className="perm-modal-avatar">
            {user.avatar_url
              ? <img src={getImageUrl(user.avatar_url)} alt={fullName} className="perm-modal-avatar-img" onError={e => e.target.style.display='none'} />
              : <span className="perm-modal-avatar-initials">{initials}</span>
            }
          </div>
          <div className="perm-modal-header-info">
            <span className="perm-modal-name">{fullName}</span>
            <Badge variant={ROLE_VARIANTS[role] || 'default'} className="perm-modal-role-badge">
              {role?.toUpperCase()}
            </Badge>
          </div>
        </div>
      }
      size="medium"
    >
      <div className="user-permissions-modal">
        {error && <Alert type="error" message="ERROR DE CONEXIÓN — MOSTRANDO PERMISOS TEMPORALES" compact />}

        {isLoading ? (
          <div className="perm-skeleton-wrapper">
            {/* Role selector skeleton */}
            <div className="perm-skeleton-role">
              <Skeleton width="180px" height="36px" borderRadius="8px" />
              <Skeleton width="80px" height="14px" />
            </div>
            {/* Groups skeleton */}
            {[1, 2].map(i => (
              <div key={i} className="perm-skeleton-group">
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                  <Skeleton type="circle" width="20px" height="20px" />
                  <Skeleton width="120px" height="14px" />
                </div>
                <div className="perm-skeleton-items">
                  {[1, 2, 3, 4].map(j => (
                    <Skeleton key={j} height="36px" borderRadius="8px" />
                  ))}
                </div>
              </div>
            ))}
            <Skeleton height="44px" borderRadius="10px" style={{ marginTop: '8px' }} />
          </div>
        ) : (
          <>
            {/* Role selector */}
            <div className="role-selector">
              <div className={`role-display ${isChangingRole ? 'changing' : 'single'}`}>
                {['admin', 'gestor', 'operador', 'usuario'].map(roleOption => {
                  if (!isChangingRole && role !== roleOption) return null
                  return (
                    <button
                      key={roleOption}
                      className={`role-button ${role === roleOption ? 'active' : ''}`}
                      onClick={() => { setRole(roleOption); if (isChangingRole) setIsChangingRole(false) }}
                    >
                      <div className="role-icon-wrapper">
                        {roleOption === 'admin' && <Icon name="star" size={14} />}
                        {roleOption === 'gestor' && <Icon name="grid" size={14} />}
                        {roleOption === 'operador' && <Icon name="ticket" size={14} />}
                        {roleOption === 'usuario' && <Icon name="user" size={14} />}
                      </div>
                      <div className="role-info"><span>{roleOption.toUpperCase()}</span></div>
                    </button>
                  )
                })}
                <div className="role-change-btn-wrap">
                  {!isChangingRole ? (
                    <button className="role-change-btn" onClick={() => setIsChangingRole(true)}>
                      <Icon name="edit" size={11} /> Cambiar rol
                    </button>
                  ) : (
                    <button className="role-change-btn role-change-btn--cancel" onClick={() => setIsChangingRole(false)}>
                      Cerrar
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Permission Groups */}
            <div className="permissions-groups">
              {permissionGroups.map((group, index) => (
                <div key={index} className="permission-group">
                  <div className="group-header">
                    <div className="group-header-left">
                      <Icon name={group.icon || 'shield'} size={14} />
                      <h4>{group.title}</h4>
                    </div>
                    <button className="select-all-btn" onClick={() => handleSelectGroup(group.keys)}>
                      Todo
                    </button>
                  </div>
                  <div className="permissions-list">
                    {group.keys.map(key => (
                      <label key={key} className={`permission-item ${permissions[key] ? 'permission-item--on' : ''}`}>
                        <span className="permission-label">{group.labels[key]}</span>
                        <div className={`perm-switch ${permissions[key] ? 'perm-switch--on' : ''}`}
                          onClick={() => togglePermission(key)}>
                          <div className="perm-switch-thumb" />
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="modal-actions">
              <Button variant="primary" onClick={handleSave} disabled={isSaving} fullWidth>
                {isSaving ? 'Guardando...' : 'Guardar Permisos'}
              </Button>
            </div>
          </>
        )}
      </div>
    </Modal>
  )
}

export default UserPermissionsModal
