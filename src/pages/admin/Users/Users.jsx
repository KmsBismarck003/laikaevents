import React, { useState, useEffect, useCallback } from 'react'
import { Card, Table, Badge, Button, Input, Icon, SkeletonRow } from '../../../components'
import Skeleton from '../../../components/Skeleton/Skeleton';
import { useNotification } from '../../../context/NotificationContext'
import useAdminUsers from '../../../hooks/useAdminUsers'
import { useSkeletonContext } from '../../../context/SkeletonContext'
import { getImageUrl } from '../../../utils/imageUtils'

// Modales Advanced
import UserPermissionsModal from '../../../components/UserPermissionsModal'
import UserFormModal from '../../../components/UserFormModal'
import UserEditModal from '../../../components/UserEditModal'
import UserPreviewModal from '../../../components/UserPreviewModal'
import ConfirmationModal from '../../../components/ConfirmationModal'

import './UserManagement.css'
import './admin.css'

const Users = () => {
  const { success, error: notifyError } = useNotification()
  const {
    users,
    total,
    loading,
    filters,
    fetchUsers,
    createUser,
    updateUser,
    deleteUser,
    toggleStatus,
    unlockUser,
    approvePermission,
    togglePermission,
    updateFilters,
    clearFilters
  } = useAdminUsers()
  const { showSkeleton } = useSkeletonContext()

  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showPreviewModal, setShowPreviewModal] = useState(false)
  const [showPermissionsModal, setShowPermissionsModal] = useState(false)
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [confirmConfig, setConfirmConfig] = useState({
    title: '',
    message: '',
    confirmText: '',
    onConfirm: () => { },
    variant: 'danger'
  })
  const [selectedUser, setSelectedUser] = useState(null)
  const [searchInput, setSearchInput] = useState('')

  // Carga inicial
  useEffect(() => {
    fetchUsers()
  }, [])

  // Debounce para búsqueda
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchInput !== filters.search) {
        updateFilters({ search: searchInput })
      }
    }, 400)
    return () => clearTimeout(timer)
  }, [searchInput, filters.search, updateFilters])

  const handleClearFilters = () => {
    setSearchInput('')
    clearFilters()
  }

  const handleToggleStatus = (user) => {
    setSelectedUser(user) // CRITICAL: Sin esto el modal no se renderiza
    const isDeactivating = user.status === 'active'
    const label = isDeactivating ? 'BAJA' : 'ALTA'
    const finalConfirmText = `${label} ${user.first_name || 'USUARIO'}`.toUpperCase()

    setConfirmConfig({
      title: `Confirmar ${label}`,
      message: `¿Estás seguro de ${isDeactivating ? 'deshabilitar' : 'habilitar'} a ${user.first_name || user.email}?`,
      confirmText: finalConfirmText,
      variant: isDeactivating ? 'danger' : 'success',
      onConfirm: async () => {
        const ok = await toggleStatus(user.id, user.status)
        if (ok) setShowConfirmModal(false)
      }
    })
    setShowConfirmModal(true)
  }

  const handleUnlock = (user) => {
    setSelectedUser(user)
    const confirmText = `DESBLOQUEAR ${user.first_name || 'USUARIO'}`.toUpperCase()
    setConfirmConfig({
      title: 'Desbloquear Cuenta',
      message: `¿Desbloquear la cuenta de ${user.first_name || user.email}?`,
      confirmText,
      variant: 'info',
      onConfirm: async () => {
        const ok = await unlockUser(user.id)
        if (ok) setShowConfirmModal(false)
      }
    })
    setShowConfirmModal(true)
  }

  const handleDelete = (user) => {
    setSelectedUser(user)
    const confirmText = `ELIMINAR ${user.first_name || 'USUARIO'}`.toUpperCase()
    setConfirmConfig({
      title: 'ELIMINAR USUARIO',
      message: `¡ALERTA! Esta acción eliminará permanentemente a ${user.first_name || user.email} y todos sus datos asociados.`,
      confirmText,
      variant: 'danger',
      onConfirm: async () => {
        const ok = await deleteUser(user.id)
        if (ok) setShowConfirmModal(false)
      }
    })
    setShowConfirmModal(true)
  }

  // Sub-componente interno para cuenta regresiva de bloqueo
  const LockoutCountdown = ({ targetDate }) => {
    const [secondsLeft, setSecondsLeft] = useState(() => {
      if (!targetDate) return 0
      const diff = Math.floor((new Date(targetDate) - new Date()) / 1000)
      return diff > 0 ? diff : 0
    })

    useEffect(() => {
      if (secondsLeft <= 0) return
      const timer = setInterval(() => setSecondsLeft(prev => prev - 1), 1000)
      return () => clearInterval(timer)
    }, [secondsLeft])

    if (secondsLeft <= 0) return null

    const m = Math.floor(secondsLeft / 60)
    const s = secondsLeft % 60
    return (
      <span className="user-mgmt__status-badge user-mgmt__status-badge--locked">
        <Icon name="lock" size={10} className="mr-1" />
        BLOQUEADO ({m}:{s.toString().padStart(2, '0')})
      </span>
    )
  }

  const renderStatusBadge = (user) => {
    const lockoutUntil = user.lockout_until
    const isLockedByTime = lockoutUntil && new Date(lockoutUntil) > new Date()

    if (isLockedByTime || user.status === 'locked') {
      return <LockoutCountdown targetDate={lockoutUntil} /> || (
        <span className="user-mgmt__status-badge user-mgmt__status-badge--locked">
          <Icon name="lock" size={10} className="mr-1" /> BLOQUEADO
        </span>
      )
    }

    const config = {
      active: { label: 'Activo', cls: 'active' },
      disabled: { label: 'Baja', cls: 'disabled' }
    }
    const c = config[user.status] || { label: user.status || 'OFF', cls: 'disabled' }
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        <span className={`user-mgmt__status-badge user-mgmt__status-badge--${c.cls}`}>
          <span className="user-mgmt__status-dot" /> {c.label}
        </span>
        {user.pending_request && (
          <span className="user-mgmt__status-badge" style={{ backgroundColor: 'rgba(255, 193, 7, 0.2)', color: '#ffc107', border: '1px solid #ffc107' }}>
            <Icon name="bell" size={10} className="mr-1" /> SOLICITUD
          </span>
        )}
      </div>
    )
  }

  const columns = [
    {
      key: 'avatar_url',
      header: '',
      render: (val, row) => (
        <div 
          className="user-mgmt__avatar-wrapper"
          onClick={(e) => {
            e.stopPropagation();
            setSelectedUser(row);
            setShowPreviewModal(true);
          }}
          style={{ cursor: 'pointer' }}
          title="Ver vista previa"
        >
          <img 
            src={getImageUrl(val || row.avatar || row.profile_photo)} 
            alt="Avatar" 
            className="user-mgmt__avatar-img"
            onError={(e) => {
              e.target.src = 'https://ui-avatars.com/api/?name=' + (row.first_name || 'U') + '&background=random'
            }}
          />
        </div>
      )
    },
    {
      key: 'name',
      header: 'Nombre',
      sortable: true,
      render: (_, row) => `${row.first_name || ''} ${row.last_name || ''}`.trim() || row.email || '—'
    },
    { key: 'email', header: 'Email', sortable: true },
    {
      key: 'role',
      header: 'Rol',
      sortable: true,
      render: (value) => {
        const variants = { admin: 'danger', gestor: 'warning', operador: 'info', usuario: 'default' }
        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Badge variant={variants[value] || 'default'}>{value?.toUpperCase() || 'USUARIO'}</Badge>
            {value === 'admin' && <Icon name="sparkles" size={14} style={{ color: '#fadb14' }} />}
          </div>
        )
      }
    },
    { key: 'status', header: 'Estado', render: (_, row) => renderStatusBadge(row) },
    {
      key: 'actions',
      header: 'Acciones',
      render: (_, row) => {
        if (row.role === 'admin') {
          return (
            <div className="user-mgmt__protected-badge">
              <Icon name="shield" size={16} /> <span style={{ marginLeft: '8px' }}>PROTEGIDO</span>
            </div>
          )
        }
        return (
          <div className="user-mgmt__actions">
            {row.pending_request && (
              <Button size="small" variant="success" onClick={() => approvePermission(row.id, row.pending_request)}>
                <Icon name="check" size={12} className="mr-1" /> AUTORIZAR
              </Button>
            )}
            

            <Button size="small" variant="warning" onClick={() => { setSelectedUser(row); setShowEditModal(true) }}>
              <Icon name="edit" size={12} className="mr-1" /> EDITAR
            </Button>
            <Button size="small" variant="secondary" onClick={() => { setSelectedUser(row); setShowPermissionsModal(true) }}>
              <Icon name="shield" size={12} className="mr-1" /> PERMISOS
            </Button>
            <Button
              size="small"
              variant={row.status === 'active' ? 'danger' : 'primary'}
              onClick={() => handleToggleStatus(row)}
            >
              <Icon name="power" size={12} className="mr-1" /> {row.status === 'active' ? 'BAJA' : 'ALTA'}
            </Button>
            {(row.status === 'locked' || (row.lockout_until && new Date(row.lockout_until) > new Date())) && (
              <Button size="small" variant="info" onClick={() => handleUnlock(row)}>
                <Icon name="unlock" size={12} className="mr-1" /> LIBERAR
              </Button>
            )}
          </div>
        )
      }
    }
  ]


  return (
    <div className="admin-users-page" style={{ padding: '0.5rem 0' }}>
      <div className="user-mgmt__header" style={{ marginBottom: '0.5rem' }}>
        <h1 style={{ fontSize: '1.25rem', margin: 0 }}>Usuarios</h1>
        <div className="user-mgmt__header-actions">
          <Button variant="secondary" size="small" onClick={() => fetchUsers()} style={{ height: '30px', padding: '0 12px', fontSize: '0.8rem' }}>
            Refrescar
          </Button>
          <Button variant="primary" size="small" onClick={() => setShowCreateModal(true)} style={{ height: '30px', padding: '0 12px', fontSize: '0.8rem' }}>
            <Icon name="plus" size={12} className="mr-1" /> Nuevo
          </Button>
        </div>
      </div>

      <div className="user-mgmt__toolbar-bar">
        <div className="user-mgmt__compact-toolbar">
          <div className="user-mgmt__search-container">
            <Input
              placeholder="Buscar..."
              value={searchInput}
              onChange={e => setSearchInput(e.target.value)}
              className="input--compact"
              icon={<Icon name="search" size={14} />}
              fullWidth
            />
          </div>

          <div className="user-mgmt__filters-row">
            <div className="user-mgmt__select-wrapper">
              <label>ROL:</label>
              <select
                className="user-mgmt__select"
                value={filters.role}
                onChange={e => updateFilters({ role: e.target.value })}
              >
                <option value="">TODOS</option>
                <option value="admin">ADMIN</option>
                <option value="gestor">GESTOR</option>
                <option value="operador">OPERADOR</option>
                <option value="usuario">USUARIO</option>
              </select>
            </div>

            <div className="user-mgmt__select-wrapper">
              <label>ESTADO:</label>
              <select
                className="user-mgmt__select"
                value={filters.status || ''}
                onChange={e => updateFilters({ status: e.target.value })}
              >
                <option value="">TODOS</option>
                <option value="active">ACTIVO</option>
                <option value="disabled">BAJA</option>
                <option value="locked">BLOQUEO</option>
              </select>
            </div>

            {(filters.search || filters.role || filters.status) && (
              <Button
                variant="secondary"
                size="small"
                onClick={handleClearFilters}
                className="user-mgmt__clear-btn"
              >
                <Icon name="close" size={10} />
              </Button>
            )}
          </div>

          <div className="user-mgmt__stats">
            {loading ? <Skeleton type="text" width="30px" height="12px" /> : <strong>{total}</strong>} <span>REGISTROS</span>
          </div>
        </div>
      </div>

      <Card style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead><tr style={{ background: 'var(--bg-secondary)', borderBottom: '2px solid var(--border-color)' }}>
              {['USUARIO', 'EMAIL', 'ROL', 'ESTADO', 'FECHA', 'ACCIONES'].map(h => <th key={h} style={{ padding: '14px 16px', textAlign: 'left', fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.05em', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>{h}</th>)}
            </tr></thead>
            <tbody>{Array.from({ length: 8 }).map((_, i) => <SkeletonRow key={i} columns={6} />)}</tbody>
          </table>
        ) : (
          <Table 
            columns={columns} 
            data={users} 
            sortable 
            rowPriority={(row) => {
              const priorities = {
                admin: 100,
                gestor: 90,
                operador: 80,
                usuario: 70
              }
              return priorities[row.role] || 0
            }}
            rowClassName={(row) => `user-row--${row.role}`}
          />
        )}
      </Card>

      {/* Modales */}
      <UserFormModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSubmit={createUser}
      />

      {selectedUser && (
        <>
          <UserPreviewModal
            isOpen={showPreviewModal}
            onClose={() => setShowPreviewModal(false)}
            user={selectedUser}
          />
          <UserEditModal
            isOpen={showEditModal}
            onClose={() => setShowEditModal(false)}
            user={selectedUser}
            onUpdate={updateUser}
          />
          <UserPermissionsModal
            isOpen={showPermissionsModal}
            onClose={() => setShowPermissionsModal(false)}
            user={selectedUser}
            onUpdate={() => fetchUsers()}
          />
          <ConfirmationModal
            isOpen={showConfirmModal}
            onClose={() => setShowConfirmModal(false)}
            onConfirm={confirmConfig.onConfirm}
            title={confirmConfig.title}
            message={confirmConfig.message}
            confirmText={confirmConfig.confirmText}
            variant={confirmConfig.variant}
            loading={loading}
          />
        </>
      )}
    </div>
  )
}

export default Users
