import React, { useState, useEffect } from 'react'
import {
  Card,
  Button,
  Badge,
  Table,
  Modal,
  Alert,
  Spinner
} from '../components'
import api from '../services/api'
import { useNotification } from '../context/NotificationContext'
import './AdminDashboard.css'

const AdminDashboard = () => {
  const { success, error: showError } = useNotification()
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalEvents: 0,
    totalSales: 0,
    activeUsers: 0
  })
  const [users, setUsers] = useState([])
  const [systemConfig, setSystemConfig] = useState({})
  const [loading, setLoading] = useState(true)
  const [showBackupModal, setShowBackupModal] = useState(false)
  const [showUsersModal, setShowUsersModal] = useState(false)
  const [showRestoreModal, setShowRestoreModal] = useState(false)
  const [showSelectiveModal, setShowSelectiveModal] = useState(false)
  const [alert, setAlert] = useState(null)

  // Estados para respaldos
  const [backups, setBackups] = useState([])
  const [tables, setTables] = useState([])
  const [selectedTables, setSelectedTables] = useState([])
  const [loadingBackups, setLoadingBackups] = useState(false)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    setLoading(true)
    try {
      console.log('📤 Obteniendo datos del dashboard...')

      const statsResponse = await api.stats.getAdminDashboard()
      console.log('✅ Estadísticas obtenidas:', statsResponse)

      setStats({
        totalUsers: statsResponse.totalUsers || statsResponse.total_users || 0,
        totalEvents:
          statsResponse.totalEvents || statsResponse.total_events || 0,
        totalSales: statsResponse.totalSales || statsResponse.total_sales || 0,
        activeUsers:
          statsResponse.activeUsers || statsResponse.active_users || 0
      })

      console.log('📤 Obteniendo usuarios...')
      const usersResponse = await api.user.getAll({ limit: 100 })
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

      console.log('📤 Obteniendo configuración...')
      const configResponse = await api.config.getConfig()
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
          configResponse.sessionTimeout || configResponse.session_timeout || 30,
        maxTicketsPerUser:
          configResponse.maxTicketsPerUser ||
          configResponse.max_tickets_per_user ||
          10
      })
    } catch (error) {
      console.error('❌ Error al cargar datos del dashboard:', error)
      showError('Error al cargar datos del dashboard')

      setStats({ totalUsers: 0, totalEvents: 0, totalSales: 0, activeUsers: 0 })
      setUsers([])
      setSystemConfig({
        maintenanceMode: false,
        registrationEnabled: true,
        sessionTimeout: 30,
        maxTicketsPerUser: 10
      })
    } finally {
      setLoading(false)
    }
  }

  // ============================================
  // FUNCIONES DE RESPALDO
  // ============================================

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
      fetchBackupsList() // Actualizar lista
    } catch (error) {
      console.error('❌ Error al crear respaldo:', error)

      // ✅ EXTRAER MENSAJE DE ERROR CORRECTAMENTE
      let errorMsg = 'Error al realizar el respaldo'

      if (error.data && error.data.detail) {
        if (Array.isArray(error.data.detail)) {
          // Errores de validación Pydantic (422)
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
      setShowRestoreModal(false)
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

  // ============================================
  // OTRAS FUNCIONES
  // ============================================

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

  const userColumns = [
    { key: 'name', header: 'Nombre', sortable: true },
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
        <Button
          size='small'
          variant='danger'
          onClick={e => {
            e.stopPropagation()
            handleDeleteUser(row.id)
          }}
        >
          Eliminar
        </Button>
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
        <div style={{ display: 'flex', gap: '8px' }}>
          <Button
            size='small'
            variant='primary'
            onClick={() => handleRestore(row.backup_id)}
          >
            Restaurar
          </Button>
          <Button
            size='small'
            variant='danger'
            onClick={() => handleDeleteBackup(row.backup_id)}
          >
            Eliminar
          </Button>
        </div>
      )
    }
  ]

  if (loading) {
    return <Spinner fullScreen text='Cargando dashboard...' />
  }

  return (
    <div className='admin-dashboard'>
      <div className='dashboard-header'>
        <h1>Panel de Administración</h1>
        <p>Control total del sistema LAIKA Club</p>
      </div>

      {alert && (
        <Alert
          type={alert.type}
          message={alert.message}
          closable
          onClose={() => setAlert(null)}
        />
      )}

      <div className='stats-grid'>
        <Card className='stat-card'>
          <div className='stat-content'>
            <div className='stat-icon' style={{ backgroundColor: '#dbeafe' }}>
              👥
            </div>
            <div className='stat-info'>
              <p className='stat-label'>Total Usuarios</p>
              <h2 className='stat-value'>
                {stats.totalUsers.toLocaleString()}
              </h2>
            </div>
          </div>
        </Card>

        <Card className='stat-card'>
          <div className='stat-content'>
            <div className='stat-icon' style={{ backgroundColor: '#fef3c7' }}>
              🎫
            </div>
            <div className='stat-info'>
              <p className='stat-label'>Eventos Activos</p>
              <h2 className='stat-value'>{stats.totalEvents}</h2>
            </div>
          </div>
        </Card>

        <Card className='stat-card'>
          <div className='stat-content'>
            <div className='stat-icon' style={{ backgroundColor: '#d1fae5' }}>
              💰
            </div>
            <div className='stat-info'>
              <p className='stat-label'>Ventas Totales</p>
              <h2 className='stat-value'>
                ${stats.totalSales.toLocaleString()}
              </h2>
            </div>
          </div>
        </Card>

        <Card className='stat-card'>
          <div className='stat-content'>
            <div className='stat-icon' style={{ backgroundColor: '#ddd6fe' }}>
              🟢
            </div>
            <div className='stat-info'>
              <p className='stat-label'>Usuarios Activos</p>
              <h2 className='stat-value'>{stats.activeUsers}</h2>
            </div>
          </div>
        </Card>
      </div>

      <div className='admin-sections'>
        <Card title='Gestión de Usuarios'>
          <div className='section-actions'>
            <Button variant='primary' onClick={() => setShowUsersModal(true)}>
              Ver Todos los Usuarios ({users.length})
            </Button>
            <Button variant='secondary' onClick={fetchDashboardData}>
              Actualizar Lista
            </Button>
          </div>
          <Table
            columns={userColumns}
            data={users.slice(0, 5)}
            hoverable
            striped
          />
        </Card>

        <Card title='Configuración del Sistema'>
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

        <Card title='Gestión de Base de Datos'>
          <div className='section-actions'>
            <Button
              variant='primary'
              onClick={() => {
                setShowBackupModal(true)
                fetchBackupsList()
              }}
            >
              Gestionar Respaldos
            </Button>
            <Button variant='warning' onClick={handleOptimizeDB}>
              Optimizar BD
            </Button>
            <Button variant='danger' onClick={handleClearCache}>
              Limpiar Caché
            </Button>
          </div>
        </Card>

        <Card title='Monitoreo del Sistema'>
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
            Actualizar Información
          </Button>
        </Card>
      </div>

      {/* ============================================ */}
      {/* MODAL DE GESTIÓN DE RESPALDOS */}
      {/* ============================================ */}
      <Modal
        isOpen={showBackupModal}
        onClose={() => setShowBackupModal(false)}
        title='Gestión de Respaldos'
        size='large'
      >
        <div className='backup-management'>
          {/* Crear Respaldo */}
          <div className='backup-section'>
            <h3>Crear Nuevo Respaldo</h3>
            <div
              className='backup-options'
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '16px',
                marginBottom: '24px'
              }}
            >
              <Card className='backup-option-card'>
                <h4>🗂️ Completo</h4>
                <p>Todos los datos del sistema</p>
                <Button
                  variant='primary'
                  fullWidth
                  onClick={() => handleBackup('completo')}
                >
                  Crear Completo
                </Button>
              </Card>

              <Card className='backup-option-card'>
                <h4>📊 Incremental</h4>
                <p>Solo cambios recientes</p>
                <Button
                  variant='secondary'
                  fullWidth
                  onClick={() => handleBackup('incremental')}
                >
                  Crear Incremental
                </Button>
              </Card>

              <Card className='backup-option-card'>
                <h4>🎯 Selectivo</h4>
                <p>Tablas específicas</p>
                <Button
                  variant='secondary'
                  fullWidth
                  onClick={() => {
                    setShowSelectiveModal(true)
                    fetchTables()
                  }}
                >
                  Configurar
                </Button>
              </Card>
            </div>
          </div>

          {/* Lista de Respaldos */}
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
              <div style={{ textAlign: 'center', padding: '40px' }}>
                <Spinner text='Cargando respaldos...' />
              </div>
            ) : backups.length === 0 ? (
              <div
                style={{
                  textAlign: 'center',
                  padding: '40px',
                  background: '#f9fafb',
                  borderRadius: '8px'
                }}
              >
                <p>No hay respaldos disponibles</p>
                <p style={{ fontSize: '14px', color: '#6b7280' }}>
                  Crea tu primer respaldo para comenzar
                </p>
              </div>
            ) : (
              <Table columns={backupColumns} data={backups} hoverable striped />
            )}
          </div>
        </div>
      </Modal>

      {/* ============================================ */}
      {/* MODAL DE RESPALDO SELECTIVO */}
      {/* ============================================ */}
      <Modal
        isOpen={showSelectiveModal}
        onClose={() => {
          setShowSelectiveModal(false)
          setSelectedTables([])
        }}
        title='Respaldo Selectivo - Seleccionar Tablas'
        size='medium'
      >
        <div className='selective-backup'>
          <p style={{ marginBottom: '16px' }}>
            Selecciona las tablas que deseas incluir en el respaldo:
          </p>

          {tables.length === 0 ? (
            <Spinner text='Cargando tablas...' />
          ) : (
            <div
              style={{
                maxHeight: '400px',
                overflowY: 'auto',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                padding: '16px'
              }}
            >
              {tables.map(table => (
                <label
                  key={table.name}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    padding: '12px',
                    cursor: 'pointer',
                    borderBottom: '1px solid #f3f4f6',
                    transition: 'background 0.2s'
                  }}
                  onMouseEnter={e =>
                    (e.currentTarget.style.background = '#f9fafb')
                  }
                  onMouseLeave={e =>
                    (e.currentTarget.style.background = 'transparent')
                  }
                >
                  <input
                    type='checkbox'
                    checked={selectedTables.includes(table.name)}
                    onChange={() => toggleTableSelection(table.name)}
                    style={{ marginRight: '12px' }}
                  />
                  <div style={{ flex: 1 }}>
                    <strong>{table.name}</strong>
                    <p
                      style={{
                        fontSize: '12px',
                        color: '#6b7280',
                        margin: '4px 0 0 0'
                      }}
                    >
                      {table.row_count.toLocaleString()} registros
                    </p>
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
        title={`Gestión de Usuarios (${users.length} total)`}
        size='large'
      >
        {users.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <p>No hay usuarios registrados</p>
          </div>
        ) : (
          <Table
            columns={userColumns}
            data={users}
            sortable
            hoverable
            striped
          />
        )}
      </Modal>
    </div>
  )
}

export default AdminDashboard
