// pages/AdminDashboard.jsx - VERSIÓN MODERNA COMPLETAMENTE INDEPENDIENTE

import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'
import { useNotification } from '../context/NotificationContext'
import './AdminDashboard.css'

// ============================================
// COMPONENTES INTERNOS DEL DASHBOARD
// ============================================

const Alert = ({ type, message, onClose }) => (
  <div className={`alert alert-${type}`}>
    <span>{message}</span>
    {onClose && (
      <button className='alert-close' onClick={onClose}>
        ✕
      </button>
    )}
  </div>
)

const Badge = ({ variant = 'default', dot = false, children }) => (
  <span className={`badge badge-${variant} ${dot ? 'badge-dot' : ''}`}>
    {children}
  </span>
)

const Spinner = ({ text = 'Cargando...', fullScreen = false }) => (
  <div
    className={fullScreen ? 'spinner-fullscreen' : ''}
    style={{ textAlign: 'center', padding: '40px' }}
  >
    <div className='spinner'></div>
    <p className='spinner-text'>{text}</p>
  </div>
)

const Modal = ({ isOpen, onClose, title, children, size = 'medium' }) => {
  if (!isOpen) return null

  return (
    <div className='modal-overlay' onClick={onClose}>
      <div
        className={`modal-content modal-${size}`}
        onClick={e => e.stopPropagation()}
      >
        <div className='modal-header'>
          <h2 className='modal-title'>{title}</h2>
          <button className='modal-close' onClick={onClose}>
            ✕
          </button>
        </div>
        <div className='modal-body'>{children}</div>
      </div>
    </div>
  )
}

const Table = ({ data, columns }) => (
  <div className='table-container'>
    <table>
      <thead>
        <tr>
          {columns.map(col => (
            <th key={col.key}>{col.header}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {data.length === 0 ? (
          <tr>
            <td
              colSpan={columns.length}
              style={{ textAlign: 'center', padding: '40px', color: '#888' }}
            >
              No hay datos disponibles
            </td>
          </tr>
        ) : (
          data.map((row, idx) => (
            <tr key={idx}>
              {columns.map(col => (
                <td key={col.key}>
                  {col.render ? col.render(row[col.key], row) : row[col.key]}
                </td>
              ))}
            </tr>
          ))
        )}
      </tbody>
    </table>
  </div>
)

const Button = ({
  children,
  variant = 'primary',
  onClick,
  disabled = false,
  fullWidth = false,
  size = 'normal'
}) => (
  <button
    className={`btn btn-${variant} ${fullWidth ? 'btn-full' : ''}`}
    onClick={onClick}
    disabled={disabled}
    style={{
      fontSize: size === 'small' ? '0.875rem' : '0.95rem',
      padding: size === 'small' ? '8px 16px' : '12px 24px'
    }}
  >
    {children}
  </button>
)

const Card = ({ title, children, className = '' }) => (
  <div className={`card ${className}`}>
    {title && <h3 className='card-title'>{title}</h3>}
    {children}
  </div>
)

// ============================================
// MODAL DE PERMISOS DE USUARIO
// ============================================

const UserPermissionsModal = ({ isOpen, onClose, user, onUpdate }) => {
  const { success, error: showError } = useNotification()
  const [permissions, setPermissions] = useState({
    canCreateEvents: false,
    canEditEvents: false,
    canDeleteEvents: false,
    canManageUsers: false,
    canViewReports: false,
    canManagePayments: false
  })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (user && isOpen) {
      // Cargar permisos del usuario
      setPermissions({
        canCreateEvents: user.canCreateEvents || false,
        canEditEvents: user.canEditEvents || false,
        canDeleteEvents: user.canDeleteEvents || false,
        canManageUsers: user.canManageUsers || false,
        canViewReports: user.canViewReports || false,
        canManagePayments: user.canManagePayments || false
      })
    }
  }, [user, isOpen])

  const handleSavePermissions = async () => {
    if (!user) return

    setLoading(true)
    try {
      // ✅ CORRECCIÓN: Enviar role y permissions correctamente
      const payload = {
        role: user.role, // Mantener el rol actual o el nuevo
        permissions: permissions
      }

      await api.user.updatePermissions(user.id, payload)
      success('Permisos actualizados correctamente')
      onUpdate && onUpdate()
      onClose()
    } catch (error) {
      console.error('Error al actualizar permisos:', error)
      showError(error.message || 'Error al actualizar permisos')
    } finally {
      setLoading(false)
    }
  }

  const togglePermission = key => {
    setPermissions(prev => ({ ...prev, [key]: !prev[key] }))
  }

  if (!user) return null

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`⚙️ Permisos de ${user.name}`}
      size='medium'
    >
      <div className='permissions-container'>
        <p style={{ color: '#c0c0c0', marginBottom: '24px' }}>
          Configura los permisos específicos para este usuario
        </p>

        <div className='permissions-list'>
          <div className='permission-item'>
            <div className='permission-info'>
              <strong>Crear Eventos</strong>
              <p>Permite crear nuevos eventos</p>
            </div>
            <label className='toggle-switch'>
              <input
                type='checkbox'
                checked={permissions.canCreateEvents}
                onChange={() => togglePermission('canCreateEvents')}
              />
              <span className='toggle-slider'></span>
            </label>
          </div>

          <div className='permission-item'>
            <div className='permission-info'>
              <strong>Editar Eventos</strong>
              <p>Permite modificar eventos existentes</p>
            </div>
            <label className='toggle-switch'>
              <input
                type='checkbox'
                checked={permissions.canEditEvents}
                onChange={() => togglePermission('canEditEvents')}
              />
              <span className='toggle-slider'></span>
            </label>
          </div>

          <div className='permission-item'>
            <div className='permission-info'>
              <strong>Eliminar Eventos</strong>
              <p>Permite eliminar eventos</p>
            </div>
            <label className='toggle-switch'>
              <input
                type='checkbox'
                checked={permissions.canDeleteEvents}
                onChange={() => togglePermission('canDeleteEvents')}
              />
              <span className='toggle-slider'></span>
            </label>
          </div>

          <div className='permission-item'>
            <div className='permission-info'>
              <strong>Gestionar Usuarios</strong>
              <p>Permite administrar otros usuarios</p>
            </div>
            <label className='toggle-switch'>
              <input
                type='checkbox'
                checked={permissions.canManageUsers}
                onChange={() => togglePermission('canManageUsers')}
              />
              <span className='toggle-slider'></span>
            </label>
          </div>

          <div className='permission-item'>
            <div className='permission-info'>
              <strong>Ver Reportes</strong>
              <p>Permite acceder a reportes y estadísticas</p>
            </div>
            <label className='toggle-switch'>
              <input
                type='checkbox'
                checked={permissions.canViewReports}
                onChange={() => togglePermission('canViewReports')}
              />
              <span className='toggle-slider'></span>
            </label>
          </div>

          <div className='permission-item'>
            <div className='permission-info'>
              <strong>Gestionar Pagos</strong>
              <p>Permite administrar transacciones y pagos</p>
            </div>
            <label className='toggle-switch'>
              <input
                type='checkbox'
                checked={permissions.canManagePayments}
                onChange={() => togglePermission('canManagePayments')}
              />
              <span className='toggle-slider'></span>
            </label>
          </div>
        </div>

        <div style={{ marginTop: '24px', display: 'flex', gap: '12px' }}>
          <Button
            variant='primary'
            fullWidth
            onClick={handleSavePermissions}
            disabled={loading}
          >
            {loading ? '⏳ Guardando...' : '💾 Guardar Permisos'}
          </Button>
          <Button variant='secondary' onClick={onClose}>
            ❌ Cancelar
          </Button>
        </div>
      </div>
    </Modal>
  )
}

// ============================================
// MODAL DE RESPALDOS AUTOMÁTICOS
// ============================================

const AutomaticBackupConfig = ({ isOpen, onClose }) => {
  const { success, error: showError } = useNotification()
  const [config, setConfig] = useState({
    enabled: false,
    frequency: 'daily',
    time: '02:00',
    backupType: 'completo',
    retentionDays: 30
  })
  const [loading, setLoading] = useState(false)

  const [lastBackup, setLastBackup] = useState(null)
  const [nextBackup, setNextBackup] = useState(null)

  useEffect(() => {
    if (isOpen) {
      loadConfig()
    }
  }, [isOpen])

  const loadConfig = async () => {
    try {
      // ✅ CORRECCIÓN: Usar el nombre correcto
      const response = await api.database.getAutomaticBackupConfig()
      setConfig(response.config || config)
      setLastBackup(response.lastBackup)
      setNextBackup(response.nextBackup)
    } catch (error) {
      console.error('Error al cargar configuración:', error)
    }
  }
  const handleSaveConfig = async () => {
    setLoading(true)
    try {
      // ✅ CORRECCIÓN: Usar el nombre correcto
      await api.database.updateAutomaticBackupConfig(config)
      success('Configuración de respaldos automáticos actualizada')
      onClose()
    } catch (error) {
      console.error('Error al guardar configuración:', error)
      showError('Error al guardar configuración')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title='⚙️ Respaldos Automáticos'
      size='medium'
    >
      <div className='auto-backup-config'>
        <p style={{ color: '#c0c0c0', marginBottom: '24px' }}>
          Configura los respaldos automáticos de la base de datos
        </p>

        <div className='config-options'>
          <div className='config-item'>
            <div className='config-info'>
              <strong>Habilitar Respaldos Automáticos</strong>
              <p>Activa o desactiva los respaldos programados</p>
            </div>
            <label className='toggle-switch'>
              <input
                type='checkbox'
                checked={config.enabled}
                onChange={e =>
                  setConfig(prev => ({ ...prev, enabled: e.target.checked }))
                }
              />
              <span className='toggle-slider'></span>
            </label>
          </div>

          <div className='config-item'>
            <div className='config-info'>
              <strong>Frecuencia</strong>
              <p>¿Cada cuánto realizar respaldos?</p>
            </div>
            <select
              className='config-input'
              value={config.frequency}
              onChange={e =>
                setConfig(prev => ({ ...prev, frequency: e.target.value }))
              }
              style={{ width: '200px' }}
            >
              <option value='hourly'>Cada hora</option>
              <option value='daily'>Diario</option>
              <option value='weekly'>Semanal</option>
              <option value='monthly'>Mensual</option>
            </select>
          </div>

          <div className='config-item'>
            <div className='config-info'>
              <strong>Hora de Ejecución</strong>
              <p>Hora programada para el respaldo</p>
            </div>
            <input
              type='time'
              className='config-input'
              value={config.time}
              onChange={e =>
                setConfig(prev => ({ ...prev, time: e.target.value }))
              }
              style={{ width: '140px' }}
            />
          </div>

          <div className='config-item'>
            <div className='config-info'>
              <strong>Tipo de Respaldo</strong>
              <p>Tipo de respaldo a realizar</p>
            </div>
            <select
              className='config-input'
              value={config.backupType}
              onChange={e =>
                setConfig(prev => ({ ...prev, backupType: e.target.value }))
              }
              style={{ width: '200px' }}
            >
              <option value='completo'>Completo</option>
              <option value='incremental'>Incremental</option>
            </select>
          </div>

          <div className='config-item'>
            <div className='config-info'>
              <strong>Retención (días)</strong>
              <p>Días antes de eliminar respaldos antiguos</p>
            </div>
            <input
              type='number'
              className='config-input'
              value={config.retentionDays}
              onChange={e =>
                setConfig(prev => ({
                  ...prev,
                  retentionDays: parseInt(e.target.value)
                }))
              }
              min='7'
              max='365'
            />
          </div>
        </div>

        <div style={{ marginTop: '24px', display: 'flex', gap: '12px' }}>
          <Button
            variant='primary'
            fullWidth
            onClick={handleSaveConfig}
            disabled={loading}
          >
            {loading ? '⏳ Guardando...' : '💾 Guardar Configuración'}
          </Button>
          <Button variant='secondary' onClick={onClose}>
            ❌ Cancelar
          </Button>
        </div>
      </div>
    </Modal>
  )
}

const AdminDashboard = () => {
  const { success, error: showError } = useNotification()
  const navigate = useNavigate()

  // Estados principales
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalEvents: 0,
    totalSales: 0,
    activeUsers: 0
  })
  const [users, setUsers] = useState([])
  const [systemConfig, setSystemConfig] = useState({
    maintenanceMode: false,
    registrationEnabled: true,
    sessionTimeout: 30,
    maxTicketsPerUser: 10
  })
  const [loading, setLoading] = useState(true)
  const [alert, setAlert] = useState(null)
  const [loadingErrors, setLoadingErrors] = useState([])

  // Estados para modales
  const [showBackupModal, setShowBackupModal] = useState(false)
  const [showUsersModal, setShowUsersModal] = useState(false)
  const [showSelectiveModal, setShowSelectiveModal] = useState(false)
  const [showPermissionsModal, setShowPermissionsModal] = useState(false)
  const [showAutoBackupModal, setShowAutoBackupModal] = useState(false)

  // Estados para respaldos
  const [backups, setBackups] = useState([])
  const [tables, setTables] = useState([])
  const [selectedTables, setSelectedTables] = useState([])
  const [loadingBackups, setLoadingBackups] = useState(false)

  // Estados para permisos
  const [selectedUser, setSelectedUser] = useState(null)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  // ============================================
  // FUNCIONES DE CARGA DE DATOS
  // ============================================

  const fetchDashboardData = async () => {
    setLoading(true)
    setLoadingErrors([])
    const errors = []

    try {
      // 1. Cargar estadísticas
      try {
        console.log('📤 Obteniendo estadísticas...')
        const statsPromise = api.stats.getAdminDashboard()
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Timeout en estadísticas')), 5000)
        )

        const statsResponse = await Promise.race([statsPromise, timeoutPromise])
        console.log('✅ Estadísticas obtenidas:', statsResponse)

        setStats({
          totalUsers:
            statsResponse.totalUsers || statsResponse.total_users || 0,
          totalEvents:
            statsResponse.totalEvents || statsResponse.total_events || 0,
          totalSales:
            statsResponse.totalSales || statsResponse.total_sales || 0,
          activeUsers:
            statsResponse.activeUsers || statsResponse.active_users || 0
        })
      } catch (error) {
        console.error('❌ Error al cargar estadísticas:', error)
        errors.push('Estadísticas no disponibles')
        setStats({
          totalUsers: 0,
          totalEvents: 0,
          totalSales: 0,
          activeUsers: 0
        })
      }

      // 2. Cargar usuarios
      try {
        console.log('📤 Obteniendo usuarios...')
        const usersPromise = api.user.getAll({ limit: 100 })
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Timeout en usuarios')), 5000)
        )

        const usersResponse = await Promise.race([usersPromise, timeoutPromise])
        console.log('✅ Usuarios obtenidos:', usersResponse)

        setUsers(
          usersResponse.map(u => ({
            id: u.id,
            name: `${u.first_name || u.firstName || ''} ${u.last_name || u.lastName || ''}`.trim(),
            email: u.email,
            role: u.role,
            status: u.status
          }))
        )
      } catch (error) {
        console.error('❌ Error al cargar usuarios:', error)
        errors.push('Usuarios no disponibles')
        setUsers([])
      }

      // 3. Cargar configuración
      try {
        console.log('📤 Obteniendo configuración...')
        const configPromise = api.config.getConfig()
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Timeout en configuración')), 5000)
        )

        const configResponse = await Promise.race([
          configPromise,
          timeoutPromise
        ])
        console.log('✅ Configuración obtenida:', configResponse)

        setSystemConfig({
          maintenanceMode:
            configResponse.maintenanceMode ||
            configResponse.maintenance_mode ||
            false,
          registrationEnabled:
            configResponse.registrationEnabled ||
            configResponse.registration_enabled !== false,
          sessionTimeout:
            configResponse.sessionTimeout ||
            configResponse.session_timeout ||
            30,
          maxTicketsPerUser:
            configResponse.maxTicketsPerUser ||
            configResponse.max_tickets_per_user ||
            10
        })
      } catch (error) {
        console.error('❌ Error al cargar configuración:', error)
        errors.push('Configuración no disponible')
        setSystemConfig({
          maintenanceMode: false,
          registrationEnabled: true,
          sessionTimeout: 30,
          maxTicketsPerUser: 10
        })
      }

      if (errors.length > 0) {
        setLoadingErrors(errors)
        setAlert({
          type: 'warning',
          message: `Algunos datos no se pudieron cargar: ${errors.join(', ')}`
        })
      }
    } catch (error) {
      console.error('❌ Error crítico al cargar dashboard:', error)
      setAlert({
        type: 'error',
        message:
          'Error crítico al cargar el dashboard. Por favor, recarga la página.'
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchBackupsList = async () => {
    setLoadingBackups(true)
    try {
      console.log('📤 Obteniendo lista de respaldos...')
      const response = await api.database.listBackups()
      console.log('✅ Respaldos obtenidos:', response)
      setBackups(response.backups || [])
    } catch (error) {
      console.error('❌ Error al obtener respaldos:', error)
      showError('Error al cargar lista de respaldos')
    } finally {
      setLoadingBackups(false)
    }
  }

  const fetchTables = async () => {
    try {
      console.log('📤 Obteniendo tablas...')
      const response = await api.database.listTables()
      console.log('✅ Tablas obtenidas:', response)
      setTables(response.tables || [])
    } catch (error) {
      console.error('❌ Error al obtener tablas:', error)
      showError('Error al cargar tablas')
    }
  }

  const handleBackup = async type => {
    setAlert({ type: 'info', message: `Iniciando respaldo ${type}...` })
    try {
      console.log('📤 Creando respaldo:', type)
      const response = await api.database.createBackup(type)
      console.log('✅ Respaldo creado:', response)

      setAlert({ type: 'success', message: 'Respaldo completado exitosamente' })
      success(`Respaldo ${type} creado correctamente`)
      setShowBackupModal(false)
      fetchBackupsList()
    } catch (error) {
      console.error('❌ Error al crear respaldo:', error)

      let errorMsg = 'Error al realizar el respaldo'
      if (error.data && error.data.detail) {
        if (Array.isArray(error.data.detail)) {
          errorMsg = error.data.detail.map(err => err.msg).join(', ')
        } else if (typeof error.data.detail === 'string') {
          errorMsg = error.data.detail
        }
      } else if (error.message) {
        errorMsg = error.message
      }

      setAlert({ type: 'error', message: errorMsg })
      showError(errorMsg)
    }
  }

  const handleSelectiveBackup = async () => {
    if (selectedTables.length === 0) {
      showError('Selecciona al menos una tabla')
      return
    }

    try {
      console.log('📤 Creando respaldo selectivo:', selectedTables)
      const response = await api.database.createBackup('selectivo', {
        tables: selectedTables
      })
      console.log('✅ Respaldo selectivo creado:', response)

      success('Respaldo selectivo creado correctamente')
      setShowSelectiveModal(false)
      setSelectedTables([])
      fetchBackupsList()
    } catch (error) {
      console.error('❌ Error:', error)

      let errorMsg = 'Error al crear respaldo selectivo'
      if (error.data?.detail) {
        errorMsg = Array.isArray(error.data.detail)
          ? error.data.detail.map(e => e.msg).join(', ')
          : error.data.detail
      }
      showError(errorMsg)
    }
  }

  const handleRestore = async backupId => {
    if (
      !window.confirm(
        '⚠️ ADVERTENCIA: Esta acción sobrescribirá todos los datos actuales. ¿Estás seguro?'
      )
    ) {
      return
    }

    try {
      console.log('📤 Restaurando respaldo:', backupId)
      const response = await api.database.restore(backupId)
      console.log('✅ Restauración completada:', response)

      success('Base de datos restaurada exitosamente')
      setShowBackupModal(false)
      fetchDashboardData()
    } catch (error) {
      console.error('❌ Error al restaurar:', error)

      let errorMsg = 'Error al restaurar base de datos'
      if (error.data?.detail) {
        errorMsg =
          typeof error.data.detail === 'string'
            ? error.data.detail
            : error.data.detail.map(e => e.msg).join(', ')
      }
      showError(errorMsg)
    }
  }

  const handleDeleteBackup = async backupId => {
    if (!window.confirm('¿Estás seguro de eliminar este respaldo?')) {
      return
    }

    try {
      console.log('📤 Eliminando respaldo:', backupId)
      await api.database.deleteBackup(backupId)
      console.log('✅ Respaldo eliminado')

      success('Respaldo eliminado exitosamente')
      fetchBackupsList()
    } catch (error) {
      console.error('❌ Error al eliminar respaldo:', error)
      showError('Error al eliminar respaldo')
    }
  }

  const toggleTableSelection = tableName => {
    setSelectedTables(prev =>
      prev.includes(tableName)
        ? prev.filter(t => t !== tableName)
        : [...prev, tableName]
    )
  }

  const handleEditPermissions = user => {
    setSelectedUser(user)
    setShowPermissionsModal(true)
  }

  const handlePermissionsUpdated = () => {
    fetchDashboardData()
  }

  const handleConfigChange = async (key, value) => {
    try {
      console.log('📤 Actualizando configuración:', key, value)
      setSystemConfig(prev => ({ ...prev, [key]: value }))

      const configKey = key.replace(/([A-Z])/g, '_$1').toLowerCase()
      await api.config.updateParameter(configKey, value)

      console.log('✅ Configuración actualizada')
      setAlert({ type: 'success', message: 'Configuración actualizada' })
    } catch (error) {
      console.error('❌ Error al actualizar configuración:', error)
      await fetchDashboardData()

      const errorMsg = error.message || 'Error al actualizar configuración'
      setAlert({ type: 'error', message: errorMsg })
      showError(errorMsg)
    }
  }

  const handleClearCache = async () => {
    try {
      console.log('📤 Limpiando caché...')
      await api.database.clearCache()
      console.log('✅ Caché limpiado')
      success('Caché limpiado exitosamente')
      setAlert({ type: 'success', message: 'Caché limpiado correctamente' })
    } catch (error) {
      console.error('❌ Error al limpiar caché:', error)
      const errorMsg = error.message || 'Error al limpiar caché'
      showError(errorMsg)
      setAlert({ type: 'error', message: errorMsg })
    }
  }

  const handleOptimizeDB = async () => {
    try {
      console.log('📤 Optimizando base de datos...')
      await api.database.optimize()
      console.log('✅ Base de datos optimizada')
      success('Base de datos optimizada exitosamente')
      setAlert({ type: 'success', message: 'Base de datos optimizada' })
    } catch (error) {
      console.error('❌ Error al optimizar BD:', error)
      const errorMsg = error.message || 'Error al optimizar base de datos'
      showError(errorMsg)
      setAlert({ type: 'error', message: errorMsg })
    }
  }

  const handleDeleteUser = async userId => {
    if (!window.confirm('¿Estás seguro de eliminar este usuario?')) {
      return
    }

    try {
      console.log('📤 Eliminando usuario:', userId)
      await api.user.delete(userId)
      console.log('✅ Usuario eliminado')
      success('Usuario eliminado exitosamente')
      setUsers(prev => prev.filter(u => u.id !== userId))
    } catch (error) {
      console.error('❌ Error al eliminar usuario:', error)
      const errorMsg = error.message || 'Error al eliminar usuario'
      showError(errorMsg)
    }
  }

  const handleOpenDatabaseMonitor = () => {
    navigate('/admin/database-monitor')
  }

  // ============================================
  // COMPONENTES AUXILIARES
  // ============================================

  const Alert = ({ type, message, onClose }) => (
    <div className={`alert alert-${type}`}>
      <span>{message}</span>
      {onClose && (
        <button className='alert-close' onClick={onClose}>
          ✕
        </button>
      )}
    </div>
  )

  const Badge = ({ variant = 'default', dot = false, children }) => (
    <span className={`badge badge-${variant} ${dot ? 'badge-dot' : ''}`}>
      {children}
    </span>
  )

  const Spinner = ({ text = 'Cargando...', fullScreen = false }) => (
    <div
      className={fullScreen ? 'spinner-fullscreen' : ''}
      style={{ textAlign: 'center', padding: '40px' }}
    >
      <div className='spinner'></div>
      <p className='spinner-text'>{text}</p>
    </div>
  )

  const Modal = ({ isOpen, onClose, title, children, size = 'medium' }) => {
    if (!isOpen) return null

    return (
      <div className='modal-overlay' onClick={onClose}>
        <div
          className={`modal-content modal-${size}`}
          onClick={e => e.stopPropagation()}
        >
          <div className='modal-header'>
            <h2 className='modal-title'>{title}</h2>
            <button className='modal-close' onClick={onClose}>
              ✕
            </button>
          </div>
          <div className='modal-body'>{children}</div>
        </div>
      </div>
    )
  }

  const Table = ({ data, columns }) => (
    <div className='table-container'>
      <table>
        <thead>
          <tr>
            {columns.map(col => (
              <th key={col.key}>{col.header}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length}
                style={{ textAlign: 'center', padding: '40px', color: '#888' }}
              >
                No hay datos disponibles
              </td>
            </tr>
          ) : (
            data.map((row, idx) => (
              <tr key={idx}>
                {columns.map(col => (
                  <td key={col.key}>
                    {col.render ? col.render(row[col.key], row) : row[col.key]}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )

  const Button = ({
    children,
    variant = 'primary',
    onClick,
    disabled = false,
    fullWidth = false,
    size = 'normal'
  }) => (
    <button
      className={`btn btn-${variant} ${fullWidth ? 'btn-full' : ''}`}
      onClick={onClick}
      disabled={disabled}
      style={{
        fontSize: size === 'small' ? '0.875rem' : '0.95rem',
        padding: size === 'small' ? '8px 16px' : '12px 24px'
      }}
    >
      {children}
    </button>
  )

  const Card = ({ title, children, className = '' }) => (
    <div className={`card ${className}`}>
      {title && <h3 className='card-title'>{title}</h3>}
      {children}
    </div>
  )

  // ============================================
  // COLUMNAS DE TABLAS
  // ============================================

  const userColumns = [
    { key: 'name', header: 'Nombre' },
    { key: 'email', header: 'Email' },
    {
      key: 'role',
      header: 'Rol',
      render: value => {
        const variants = {
          admin: 'danger',
          gestor: 'warning',
          operador: 'info',
          usuario: 'default'
        }
        return <Badge variant={variants[value]}>{value}</Badge>
      }
    },
    {
      key: 'status',
      header: 'Estado',
      render: value => (
        <Badge variant={value === 'active' ? 'success' : 'default'} dot>
          {value === 'active' ? 'Activo' : 'Inactivo'}
        </Badge>
      )
    },
    {
      key: 'actions',
      header: 'Acciones',
      render: (value, row) => (
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <Button
            size='small'
            variant='warning'
            onClick={e => {
              e.stopPropagation()
              handleEditPermissions(row)
            }}
          >
            ⚙️ Permisos
          </Button>
          <Button
            size='small'
            variant='danger'
            onClick={e => {
              e.stopPropagation()
              handleDeleteUser(row.id)
            }}
          >
            🗑️ Eliminar
          </Button>
        </div>
      )
    }
  ]

  const backupColumns = [
    {
      key: 'backup_id',
      header: 'ID',
      render: value => value.substring(0, 20) + '...'
    },
    {
      key: 'type',
      header: 'Tipo',
      render: value => {
        const variants = {
          completo: 'primary',
          incremental: 'warning',
          selectivo: 'info'
        }
        return <Badge variant={variants[value]}>{value}</Badge>
      }
    },
    {
      key: 'timestamp',
      header: 'Fecha',
      render: value => new Date(value).toLocaleString('es-MX')
    },
    {
      key: 'size_mb',
      header: 'Tamaño',
      render: value => `${value} MB`
    },
    {
      key: 'actions',
      header: 'Acciones',
      render: (value, row) => (
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <Button
            size='small'
            variant='success'
            onClick={() => handleRestore(row.backup_id)}
          >
            ↩️ Restaurar
          </Button>
          <Button
            size='small'
            variant='danger'
            onClick={() => handleDeleteBackup(row.backup_id)}
          >
            🗑️ Eliminar
          </Button>
        </div>
      )
    }
  ]

  // ============================================
  // RENDER
  // ============================================

  if (loading) {
    return (
      <div className='admin-dashboard'>
        <Spinner fullScreen text='Cargando dashboard...' />
        <p className='text-center text-muted mt-2'>
          Si esto tarda mucho, verifica que el backend esté ejecutándose en el
          puerto 8000
        </p>
      </div>
    )
  }

  return (
    <div className='admin-dashboard'>
      {/* HEADER */}
      <div className='dashboard-header'>
        <h1>Panel de Administración</h1>
        <p>Control Total del Sistema LAIKA Club v2.0</p>
      </div>

      {/* ALERTAS */}
      {alert && (
        <Alert
          type={alert.type}
          message={alert.message}
          onClose={() => setAlert(null)}
        />
      )}

      {loadingErrors.length > 0 && (
        <Alert
          type='warning'
          message={`Advertencia: Algunos servicios no respondieron correctamente`}
          onClose={() => setLoadingErrors([])}
        />
      )}

      {/* ESTADÍSTICAS */}
      <div className='stats-grid'>
        <div className='stat-card'>
          <div className='stat-content'>
            <div
              className='stat-icon'
              style={{
                background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)'
              }}
            >
              👥
            </div>
            <div className='stat-info'>
              <p className='stat-label'>Total Usuarios</p>
              <h2 className='stat-value'>
                {stats.totalUsers.toLocaleString()}
              </h2>
            </div>
          </div>
        </div>

        <div className='stat-card'>
          <div className='stat-content'>
            <div
              className='stat-icon'
              style={{
                background: 'linear-gradient(135deg, #d4af37 0%, #b8931f 100%)'
              }}
            >
              🎫
            </div>
            <div className='stat-info'>
              <p className='stat-label'>Eventos Activos</p>
              <h2 className='stat-value'>{stats.totalEvents}</h2>
            </div>
          </div>
        </div>

        <div className='stat-card'>
          <div className='stat-content'>
            <div
              className='stat-icon'
              style={{
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
              }}
            >
              💰
            </div>
            <div className='stat-info'>
              <p className='stat-label'>Ventas Totales</p>
              <h2 className='stat-value'>
                ${stats.totalSales.toLocaleString()}
              </h2>
            </div>
          </div>
        </div>

        <div className='stat-card'>
          <div className='stat-content'>
            <div
              className='stat-icon'
              style={{
                background: 'linear-gradient(135deg, #00d9ff 0%, #0099cc 100%)'
              }}
            >
              🟢
            </div>
            <div className='stat-info'>
              <p className='stat-label'>Usuarios Activos</p>
              <h2 className='stat-value'>{stats.activeUsers}</h2>
            </div>
          </div>
        </div>
      </div>

      {/* SECCIONES DE ADMINISTRACIÓN */}
      <div className='admin-sections'>
        {/* GESTIÓN DE USUARIOS */}
        <Card title='👥 Gestión de Usuarios'>
          <div className='section-actions'>
            <Button variant='primary' onClick={() => setShowUsersModal(true)}>
              Ver Todos ({users.length})
            </Button>
            <Button variant='secondary' onClick={fetchDashboardData}>
              🔄 Actualizar
            </Button>
          </div>
          <Table columns={userColumns} data={users.slice(0, 5)} />
        </Card>

        {/* CONFIGURACIÓN DEL SISTEMA */}
        <Card title='⚙️ Configuración del Sistema'>
          <div className='config-options'>
            <div className='config-item'>
              <div className='config-info'>
                <strong>Modo Mantenimiento</strong>
                <p>Deshabilita el acceso de usuarios al sistema</p>
              </div>
              <label className='toggle-switch'>
                <input
                  type='checkbox'
                  checked={systemConfig.maintenanceMode}
                  onChange={e =>
                    handleConfigChange('maintenanceMode', e.target.checked)
                  }
                />
                <span className='toggle-slider'></span>
              </label>
            </div>

            <div className='config-item'>
              <div className='config-info'>
                <strong>Registro de Usuarios</strong>
                <p>Permite que nuevos usuarios se registren</p>
              </div>
              <label className='toggle-switch'>
                <input
                  type='checkbox'
                  checked={systemConfig.registrationEnabled}
                  onChange={e =>
                    handleConfigChange('registrationEnabled', e.target.checked)
                  }
                />
                <span className='toggle-slider'></span>
              </label>
            </div>

            <div className='config-item'>
              <div className='config-info'>
                <strong>Tiempo de Sesión</strong>
                <p>Minutos antes de cerrar sesión automáticamente</p>
              </div>
              <input
                type='number'
                className='config-input'
                value={systemConfig.sessionTimeout}
                onChange={e =>
                  handleConfigChange('sessionTimeout', parseInt(e.target.value))
                }
                min='5'
                max='120'
              />
            </div>

            <div className='config-item'>
              <div className='config-info'>
                <strong>Boletos Máximos por Usuario</strong>
                <p>Límite de boletos por compra</p>
              </div>
              <input
                type='number'
                className='config-input'
                value={systemConfig.maxTicketsPerUser}
                onChange={e =>
                  handleConfigChange(
                    'maxTicketsPerUser',
                    parseInt(e.target.value)
                  )
                }
                min='1'
                max='20'
              />
            </div>
          </div>
        </Card>

        {/* GESTIÓN DE BASE DE DATOS */}
        <Card title='💾 Gestión de Base de Datos'>
          <div className='section-actions'>
            <Button
              variant='primary'
              onClick={() => {
                setShowBackupModal(true)
                fetchBackupsList()
              }}
            >
              💾 Gestionar Respaldos
            </Button>
            <Button variant='info' onClick={() => setShowAutoBackupModal(true)}>
              ⚙️ Respaldos Automáticos
            </Button>
            <Button variant='success' onClick={handleOpenDatabaseMonitor}>
              📊 Monitor en Tiempo Real
            </Button>
            <Button variant='warning' onClick={handleOptimizeDB}>
              ⚡ Optimizar BD
            </Button>
            <Button variant='danger' onClick={handleClearCache}>
              🗑️ Limpiar Caché
            </Button>
          </div>
        </Card>

        {/* MONITOREO DEL SISTEMA */}
        <Card title='📊 Monitoreo del Sistema'>
          <div className='monitoring-info'>
            <div className='monitor-item'>
              <span className='monitor-label'>Estado del Servidor:</span>
              <Badge variant='success' dot>
                En línea
              </Badge>
            </div>
            <div className='monitor-item'>
              <span className='monitor-label'>Total de Usuarios:</span>
              <span className='monitor-value'>{users.length}</span>
            </div>
            <div className='monitor-item'>
              <span className='monitor-label'>Total de Eventos:</span>
              <span className='monitor-value'>{stats.totalEvents}</span>
            </div>
            <div className='monitor-item'>
              <span className='monitor-label'>Usuarios Activos:</span>
              <span className='monitor-value'>{stats.activeUsers}</span>
            </div>
          </div>
          <Button variant='secondary' fullWidth onClick={fetchDashboardData}>
            🔄 Actualizar Información
          </Button>
        </Card>
      </div>

      {/* ============================================ */}
      {/* MODALES */}
      {/* ============================================ */}

      {/* Modal de Gestión de Respaldos */}
      <Modal
        isOpen={showBackupModal}
        onClose={() => setShowBackupModal(false)}
        title='💾 Gestión de Respaldos'
        size='large'
      >
        <div className='backup-management'>
          <div className='backup-section'>
            <h3>Crear Nuevo Respaldo</h3>
            <div className='backup-options'>
              <div className='backup-option-card'>
                <h4>🗂️ Completo</h4>
                <p>Todos los datos del sistema</p>
                <Button
                  variant='primary'
                  fullWidth
                  onClick={() => handleBackup('completo')}
                >
                  Crear Completo
                </Button>
              </div>

              <div className='backup-option-card'>
                <h4>📊 Incremental</h4>
                <p>Solo cambios recientes</p>
                <Button
                  variant='secondary'
                  fullWidth
                  onClick={() => handleBackup('incremental')}
                >
                  Crear Incremental
                </Button>
              </div>

              <div className='backup-option-card'>
                <h4>🎯 Selectivo</h4>
                <p>Tablas específicas</p>
                <Button
                  variant='info'
                  fullWidth
                  onClick={() => {
                    setShowSelectiveModal(true)
                    fetchTables()
                  }}
                >
                  Configurar
                </Button>
              </div>
            </div>
          </div>

          <div className='backup-section'>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '16px'
              }}
            >
              <h3>Respaldos Disponibles ({backups.length})</h3>
              <Button onClick={fetchBackupsList} disabled={loadingBackups}>
                {loadingBackups ? '⏳ Cargando...' : '🔄 Actualizar'}
              </Button>
            </div>

            {loadingBackups ? (
              <Spinner text='Cargando respaldos...' />
            ) : backups.length === 0 ? (
              <div className='text-center p-4'>
                <p className='text-muted'>No hay respaldos disponibles</p>
                <p style={{ fontSize: '14px', color: '#6b7280' }}>
                  Crea tu primer respaldo para comenzar
                </p>
              </div>
            ) : (
              <Table columns={backupColumns} data={backups} />
            )}
          </div>
        </div>
      </Modal>

      {/* Modal de Respaldo Selectivo */}
      <Modal
        isOpen={showSelectiveModal}
        onClose={() => {
          setShowSelectiveModal(false)
          setSelectedTables([])
        }}
        title='🎯 Respaldo Selectivo'
        size='medium'
      >
        <div className='selective-backup'>
          <p style={{ marginBottom: '16px', color: '#c0c0c0' }}>
            Selecciona las tablas que deseas incluir en el respaldo:
          </p>

          {tables.length === 0 ? (
            <Spinner text='Cargando tablas...' />
          ) : (
            <div
              style={{
                maxHeight: '400px',
                overflowY: 'auto',
                border: '1px solid #2a2a2a',
                borderRadius: '8px',
                padding: '16px',
                background: 'rgba(26, 26, 26, 0.5)'
              }}
            >
              {tables.map(table => (
                <label key={table.name}>
                  <input
                    type='checkbox'
                    checked={selectedTables.includes(table.name)}
                    onChange={() => toggleTableSelection(table.name)}
                  />
                  <div style={{ flex: 1 }}>
                    <strong>{table.name}</strong>
                    <p>{table.row_count.toLocaleString()} registros</p>
                  </div>
                </label>
              ))}
            </div>
          )}

          <div style={{ marginTop: '16px', display: 'flex', gap: '8px' }}>
            <Button
              variant='primary'
              fullWidth
              onClick={handleSelectiveBackup}
              disabled={selectedTables.length === 0}
            >
              Crear Respaldo ({selectedTables.length} tablas)
            </Button>
            <Button
              variant='secondary'
              onClick={() => {
                setShowSelectiveModal(false)
                setSelectedTables([])
              }}
            >
              Cancelar
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal de Usuarios */}
      <Modal
        isOpen={showUsersModal}
        onClose={() => setShowUsersModal(false)}
        title={`👥 Gestión de Usuarios (${users.length} total)`}
        size='large'
      >
        {users.length === 0 ? (
          <div className='text-center p-4'>
            <p className='text-muted'>No hay usuarios registrados</p>
          </div>
        ) : (
          <Table columns={userColumns} data={users} />
        )}
      </Modal>

      {/* Modal de Permisos de Usuarios */}
      <UserPermissionsModal
        isOpen={showPermissionsModal}
        onClose={() => setShowPermissionsModal(false)}
        user={selectedUser}
        onUpdate={handlePermissionsUpdated}
      />

      {/* Modal de Respaldos Automáticos */}
      <AutomaticBackupConfig
        isOpen={showAutoBackupModal}
        onClose={() => setShowAutoBackupModal(false)}
      />
    </div>
  )
}

export default AdminDashboard
