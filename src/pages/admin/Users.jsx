import React, { useState, useEffect } from 'react'
import { Card, Button, Badge, Table, Spinner, Input } from '../../components'
import { useNotification } from '../../context/NotificationContext'
import UserPermissionsModal from '../../components/UserPermissionsModal'
import UserFormModal from '../../components/UserFormModal'
import ChangePasswordModal from '../../components/ChangePasswordModal'
import useAdminUsers from '../../hooks/useAdminUsers'
import './UserManagement.css'
import './admin.css'

const Users = () => {
  const { success } = useNotification()

  // ── Hook de gestión ──
  const {
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
  } = useAdminUsers()

  // ── Modales ──
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [showPermissionsModal, setShowPermissionsModal] = useState(false)
  const [selectedUser, setSelectedUser] = useState(null)

  // ── Temporizador para búsqueda ──
  const [searchInput, setSearchInput] = useState('')

  useEffect(() => {
    fetchUsers()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Debounce para búsqueda
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchInput !== filters.search) {
        updateFilters({ search: searchInput })
      }
    }, 400)
    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchInput])

  // ── Handlers ──
  const handleChangePassword = (user) => {
    setSelectedUser(user)
    setShowPasswordModal(true)
  }

  const handleEditPermissions = (user) => {
    setSelectedUser(user)
    setShowPermissionsModal(true)
  }

  const handleToggleStatus = async (user) => {
    const label = user.status === 'active' ? 'deshabilitar' : 'habilitar'
    if (!window.confirm(`¿Estás seguro de ${label} a ${user.first_name || user.email}?`)) return
    await toggleStatus(user.id, user.status)
  }

  const handleUnlock = async (user) => {
    if (!window.confirm(`¿Desbloquear la cuenta de ${user.first_name || user.email}?`)) return
    await unlockUser(user.id)
  }

  const handleClearFilters = () => {
    setSearchInput('')
    clearFilters()
  }

  // ── Status badge ──
  const renderStatusBadge = (status) => {
    const config = {
      active: { label: 'Activo', cls: 'active' },
      disabled: { label: 'Deshabilitado', cls: 'disabled' },
      locked: { label: 'Bloqueado', cls: 'locked' }
    }
    const c = config[status] || { label: status, cls: 'disabled' }
    return (
      <span className={`user-mgmt__status-badge user-mgmt__status-badge--${c.cls}`}>
        <span className="user-mgmt__status-dot" />
        {c.label}
      </span>
    )
  }

  // ── Columnas de la tabla ──
  const columns = [
    {
      key: 'name',
      header: 'Nombre',
      render: (_v, row) => {
        const name = `${row.first_name || ''} ${row.last_name || ''}`.trim()
        return name || '—'
      }
    },
    { key: 'email', header: 'Email' },
    {
      key: 'role',
      header: 'Rol',
      render: (value) => {
        const variants = { admin: 'danger', gestor: 'warning', operador: 'info', usuario: 'default' }
        return <Badge variant={variants[value]}>{value}</Badge>
      }
    },
    {
      key: 'status',
      header: 'Estado',
      render: (value) => renderStatusBadge(value)
    },
    {
      key: 'actions',
      header: 'Acciones',
      render: (_v, row) => (
        <div className="user-mgmt__actions">
          <Button size="small" variant="warning" onClick={(e) => { e.stopPropagation(); handleChangePassword(row) }}>
            🔑 Contraseña
          </Button>
          <Button size="small" variant="secondary" onClick={(e) => { e.stopPropagation(); handleEditPermissions(row) }}>
            🛡️ Permisos
          </Button>
          {row.status === 'active' ? (
            <Button size="small" variant="danger" onClick={(e) => { e.stopPropagation(); handleToggleStatus(row) }}>
              ⛔ Deshabilitar
            </Button>
          ) : row.status === 'disabled' ? (
            <Button size="small" variant="primary" onClick={(e) => { e.stopPropagation(); handleToggleStatus(row) }}>
              ✅ Habilitar
            </Button>
          ) : null}
          {(row.status === 'locked' || row.status === 'disabled') && (
            <Button size="small" variant="info" onClick={(e) => { e.stopPropagation(); handleUnlock(row) }}>
              🔓 Desbloquear
            </Button>
          )}
        </div>
      )
    }
  ]

  const hasActiveFilters = filters.search || filters.role || filters.status

  if (loading && users.length === 0) return <Spinner fullScreen text="Cargando usuarios..." />

  return (
    <div className="admin-users-page">
      {/* Header */}
      <div className="user-mgmt__header">
        <h1>Gestión de Usuarios</h1>
        <div className="user-mgmt__header-actions">
          <Button variant="secondary" onClick={() => fetchUsers()}>
            🔄 Actualizar
          </Button>
          <Button variant="primary" onClick={() => setShowCreateModal(true)}>
            ➕ Nuevo Usuario
          </Button>
        </div>
      </div>

      {/* Toolbar de filtros */}
      <Card>
        <div className="user-mgmt__toolbar">
          <div className="user-mgmt__search">
            <Input
              placeholder="Buscar por nombre o email..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              icon="🔍"
              fullWidth
            />
          </div>

          <div className="user-mgmt__filter-group">
            <div className="user-mgmt__select-wrapper">
              <label>Rol</label>
              <select
                className="user-mgmt__select"
                value={filters.role}
                onChange={(e) => updateFilters({ role: e.target.value })}
              >
                <option value="">Todos</option>
                <option value="admin">Administrador</option>
                <option value="gestor">Gestor</option>
                <option value="operador">Operador</option>
                <option value="usuario">Usuario</option>
              </select>
            </div>

            <div className="user-mgmt__select-wrapper">
              <label>Estado</label>
              <select
                className="user-mgmt__select"
                value={filters.status}
                onChange={(e) => updateFilters({ status: e.target.value })}
              >
                <option value="">Todos</option>
                <option value="active">Activo</option>
                <option value="disabled">Deshabilitado</option>
                <option value="locked">Bloqueado</option>
              </select>
            </div>

            {hasActiveFilters && (
              <Button variant="secondary" size="small" onClick={handleClearFilters}>
                ✕ Limpiar
              </Button>
            )}
          </div>
        </div>
      </Card>

      {/* Contador */}
      <div className="user-mgmt__count">
        {total} usuario{total !== 1 ? 's' : ''} encontrado{total !== 1 ? 's' : ''}
        {hasActiveFilters && ' (filtrados)'}
      </div>

      {/* Tabla */}
      <Card>
        {users.length === 0 ? (
          <div className="user-mgmt__empty">
            <span style={{ fontSize: '2rem' }}>👤</span>
            <p>{hasActiveFilters ? 'No se encontraron usuarios con los filtros actuales' : 'No hay usuarios registrados'}</p>
            {hasActiveFilters && (
              <Button variant="secondary" size="small" onClick={handleClearFilters} style={{ marginTop: '12px' }}>
                Limpiar filtros
              </Button>
            )}
          </div>
        ) : (
          <Table columns={columns} data={users} />
        )}
      </Card>

      {/* Modales */}
      <UserFormModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSubmit={createUser}
      />

      <ChangePasswordModal
        isOpen={showPasswordModal}
        onClose={() => setShowPasswordModal(false)}
        user={selectedUser}
        onSubmit={resetPassword}
      />

      <UserPermissionsModal
        isOpen={showPermissionsModal}
        onClose={() => setShowPermissionsModal(false)}
        user={selectedUser}
        onUpdate={() => fetchUsers()}
      />
    </div>
  )
}

export default Users
