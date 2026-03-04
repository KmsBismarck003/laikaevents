import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, Button, Table, Badge, Modal, Spinner, Alert } from '../../components'
import AutomaticBackupConfig from '../../components/AutomaticBackupConfig'
import ExternalBackupRestore from '../../components/ExternalBackup/ExternalBackupRestore'
import { useNotification } from '../../context/NotificationContext'
import api from '../../services/api'
import './admin.css'

const Database = () => {
  const { success, error: showError } = useNotification()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [loadingBackups, setLoadingBackups] = useState(false)

  const [backups, setBackups] = useState([])
  const [tables, setTables] = useState([])
  const [selectedTables, setSelectedTables] = useState([])

  const [showBackupModal, setShowBackupModal] = useState(false)
  const [showAutoBackupModal, setShowAutoBackupModal] = useState(false)
  const [showSelectiveModal, setShowSelectiveModal] = useState(false)
  const [alert, setAlert] = useState(null)

  // Filters & Pagination
  const [filterType, setFilterType] = useState('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(5)
  const [retentionDays, setRetentionDays] = useState(30) // Default 30 days

  useEffect(() => {
    fetchBackupsList()
  }, [])

  const fetchBackupsList = async () => {
    setLoadingBackups(true)
    try {
      console.log('📤 Obteniendo lista de respaldos...')
      const [backupsResponse, configResponse] = await Promise.all([
        api.database.listBackups(),
        api.database.getAutomaticBackupConfig()
      ])

      console.log('✅ Respaldos obtenidos:', backupsResponse)
      setBackups(backupsResponse.backups || [])

      if (configResponse && configResponse.config) {
          setRetentionDays(configResponse.config.retentionDays || 30)
      }
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

  const handleCreateBackup = async (type) => {
    setLoading(true)
    setAlert({ type: 'info', message: `Iniciando respaldo ${type}...` })
    try {
      console.log('📤 Creando respaldo:', type)
      await api.database.createBackup(type)
      success(`Respaldo ${type} creado correctamente`)
      setAlert({ type: 'success', message: 'Respaldo completado exitosamente' })
      setShowBackupModal(false)
      fetchBackupsList()
    } catch (error) {
       console.error('❌ Error al crear respaldo:', error)
       let errorMsg = 'Error al realizar el respaldo'
       // Error logic simplified for brevity but kept functional
       if (error.data?.detail) errorMsg = error.data.detail
       showError(errorMsg)
       setAlert({ type: 'error', message: errorMsg })
    } finally {
      setLoading(false)
    }
  }

  const handleSelectiveBackup = async () => {
    if (selectedTables.length === 0) {
      showError('Selecciona al menos una tabla')
      return
    }

    try {
      console.log('📤 Creando respaldo selectivo:', selectedTables)
      await api.database.createBackup('selectivo', { tables: selectedTables })
      success('Respaldo selectivo creado correctamente')
      setShowSelectiveModal(false)
      setSelectedTables([])
      fetchBackupsList()
    } catch (error) {
      console.error('❌ Error:', error)
      showError('Error al crear respaldo selectivo')
    }
  }

  const handleRestore = async (backupId) => {
    if (!window.confirm('⚠️ ADVERTENCIA: Esta acción sobrescribirá todos los datos actuales. ¿Estás seguro?')) {
        return
    }

    const restoreStartTime = new Date().toISOString()

    try {
        console.log('📤 Restaurando respaldo:', backupId)
        const response = await api.database.restore(backupId)
        success('Base de datos restaurada exitosamente')
        fetchBackupsList()

        // Find backup info for pre-filling the audit form
        const backupInfo = backups.find(b => b.backup_id === backupId)

        // Ask if they want to register the audit
        if (window.confirm('✅ Restauración exitosa. ¿Desea registrar esta restauración en la Auditoría?')) {
          navigate('/admin/restore-audit', {
            state: {
              prefill: {
                start_datetime: restoreStartTime.slice(0, 16),
                end_datetime: new Date().toISOString().slice(0, 16),
                database_name: response?.database || 'laika_club',
                environment: 'produccion',
                restore_type: backupInfo?.type || response?.backup_type || 'completo',
                backup_size_mb: backupInfo?.size_mb || '',
                execution_method: 'manual',
                server_name: window.location.hostname || 'localhost',
                restore_reason: `Restauración desde respaldo ${backupId.substring(0, 20)}...`
              },
              autoOpenWizard: true
            }
          })
        }
    } catch (error) {
        console.error('❌ Error al restaurar:', error)
        showError('Error al restaurar base de datos')
    }
  }

  const handleDeleteBackup = async (backupId) => {
    if (!window.confirm('¿Estás seguro de eliminar este respaldo?')) {
        return
    }

    try {
        await api.database.deleteBackup(backupId)
        success('Respaldo eliminado exitosamente')
        fetchBackupsList()
    } catch (error) {
        showError('Error al eliminar respaldo')
    }
  }

  const handleClearCache = async () => {
    try {
      await api.database.clearCache()
      success('Caché limpiado exitosamente')
    } catch (error) {
      showError('Error al limpiar caché')
    }
  }

  const handleOptimizeDB = async () => {
    try {
      await api.database.optimize()
      success('Base de datos optimizada exitosamente')
    } catch (error) {
      showError('Error al optimizar base de datos')
    }
  }

  const toggleTableSelection = (tableName) => {
    setSelectedTables(prev =>
      prev.includes(tableName)
        ? prev.filter(t => t !== tableName)
        : [...prev, tableName]
    )
  }

  // Calculate Time Remaining
  const calculateTimeRemaining = (timestamp) => {
      const createdDate = new Date(timestamp)
      const expirationDate = new Date(createdDate.getTime() + retentionDays * 24 * 60 * 60 * 1000)
      const now = new Date()
      const diffTime = expirationDate - now
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

      if (diffDays < 0) return { text: 'Expirado', color: 'error' }
      if (diffDays === 0) return { text: 'Hoy', color: 'warning' }
      return { text: `${diffDays} días`, color: diffDays < 3 ? 'warning' : 'success' }
  }

  // Filtering Logic
  const filteredBackups = backups.filter(backup => {
      if (filterType === 'all') return true
      return backup.type === filterType
  })

  // Pagination Logic
  const indexOfLastItem = currentPage * itemsPerPage
  const indexOfFirstItem = indexOfLastItem - itemsPerPage
  const currentBackups = filteredBackups.slice(indexOfFirstItem, indexOfLastItem)
  const totalPages = Math.ceil(filteredBackups.length / itemsPerPage)

  const paginate = (pageNumber) => setCurrentPage(pageNumber)

  const columns = [
    {
        key: 'backup_id',
        header: 'Archivo',
        render: value => (
            <span title={value} style={{ fontWeight: 'bold' }}>
                {value.length > 25 ? value.substring(0, 25) + '...' : value}
            </span>
        ),
        width: '25%',
        minWidth: '200px'
    },
    {
        key: 'timestamp',
        header: 'Fecha',
        render: value => (
            <span style={{ whiteSpace: 'nowrap' }}>
                {new Date(value).toLocaleString('es-MX')}
            </span>
        ),
        width: '20%',
        minWidth: '160px'
    },
    {
        key: 'type',
        header: 'Tipo',
        render: value => {
            const variants = { completo: 'primary', incremental: 'warning', selectivo: 'info' }
            return <div style={{ textAlign: 'center' }}><Badge variant={variants[value] || 'default'}>{value}</Badge></div>
        },
        width: '15%',
        minWidth: '100px'
    },
    {
        key: 'size_mb',
        header: 'Tamaño',
        render: value => <div style={{ textAlign: 'right', fontFamily: 'monospace' }}>{value} MB</div>,
        width: '15%',
        minWidth: '100px'
    },
    {
        key: 'time_remaining',
        header: 'Tiempo Restante',
        render: (_, row) => {
            const { text, color } = calculateTimeRemaining(row.timestamp)
            return <Badge variant={color}>{text}</Badge>
        },
        width: '15%',
        minWidth: '120px'
    },
    {
      key: 'actions',
      header: 'Acciones',
      render: (value, row) => (
        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
             <Button size="small" variant="success" onClick={() => handleRestore(row.backup_id)}>Restaurar</Button>
             <Button size="small" variant="danger" onClick={() => handleDeleteBackup(row.backup_id)}>Eliminar</Button>
        </div>
      ),
      width: '25%',
      minWidth: '180px'
    }
  ]

  return (
    <div className="admin-database-page">
      <div className="page-header">
        <h1>Gestión de Base de Datos</h1>
      </div>

      {alert && (
        <Alert
            type={alert.type}
            message={alert.message}
            onClose={() => setAlert(null)}
        />
       )}

      <div className="actions-bar" style={{ marginBottom: '20px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
        <Button onClick={() => setShowBackupModal(true)}>Gestionar Respaldos</Button>
        <Button variant="info" onClick={() => setShowAutoBackupModal(true)}>Config. Automática</Button>
        <Button variant="warning" onClick={handleOptimizeDB}>Optimizar BD</Button>
        <Button variant="danger" onClick={handleClearCache}>Limpiar Caché</Button>
      </div>

      {/* Seccion de Respaldo Externo */}
      <div className="mb-8" style={{ marginBottom: '20px' }}>
          <ExternalBackupRestore />
      </div>

      <Card title={`Respaldos Disponibles (${backups.length})`}>
        <div style={{ marginBottom: '15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <span className="text-sm font-semibold text-gray-400">Filtrar por:</span>
                <select
                    className="p-2 rounded bg-gray-800 border border-gray-700 text-white text-sm"
                    value={filterType}
                    onChange={(e) => { setFilterType(e.target.value); setCurrentPage(1); }}
                >
                    <option value="all">Todos</option>
                    <option value="completo">Completo</option>
                    <option value="incremental">Incremental</option>
                    <option value="selectivo">Selectivo</option>
                </select>
            </div>
            <Button size="small" variant="secondary" onClick={fetchBackupsList} disabled={loadingBackups}>
                Refresh
            </Button>
        </div>

        {loadingBackups ? <Spinner /> :
         filteredBackups.length === 0 ? <p className="text-muted p-4 text-center">No hay respaldos disponibles</p> :
         <>
            <Table columns={columns} data={currentBackups} />

            {/* Pagination Controls */}
            {totalPages > 1 && (
                <div style={{ display: 'flex', justifyContent: 'center', gap: '5px', marginTop: '15px' }}>
                    <Button
                        size="small"
                        variant="secondary"
                        disabled={currentPage === 1}
                        onClick={() => paginate(currentPage - 1)}
                    >
                        Anterior
                    </Button>
                    <span style={{ display: 'flex', alignItems: 'center', padding: '0 10px', color: '#888' }}>
                        Página {currentPage} de {totalPages}
                    </span>
                    <Button
                        size="small"
                        variant="secondary"
                        disabled={currentPage === totalPages}
                        onClick={() => paginate(currentPage + 1)}
                    >
                        Siguiente
                    </Button>
                </div>
            )}
         </>
        }
      </Card>

      {/* Modal Manual Backup */}
      <Modal
        isOpen={showBackupModal}
        onClose={() => setShowBackupModal(false)}
        title="Crear Respaldo"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <Button onClick={() => handleCreateBackup('completo')}>Respaldo Completo</Button>
            <Button variant="secondary" onClick={() => handleCreateBackup('incremental')}>Respaldo Incremental</Button>
            <Button variant="info" onClick={() => {
                setShowBackupModal(false)
                setShowSelectiveModal(true)
                fetchTables()
            }}>Respaldo Selectivo</Button>
        </div>
      </Modal>

      {/* Modal Selective Backup */}
      <Modal
        isOpen={showSelectiveModal}
        onClose={() => {
          setShowSelectiveModal(false)
          setSelectedTables([])
        }}
        title="Respaldo Selectivo"
      >
          {tables.length === 0 ? <Spinner text="Cargando tablas..." /> : (
            <div style={{ maxHeight: '300px', overflowY: 'auto', border: '1px solid #333', padding: '10px', marginBottom: '10px' }}>
                {tables.map(table => (
                    <label key={table.name} style={{ display: 'flex', gap: '10px', padding: '5px' }}>
                        <input
                            type="checkbox"
                            checked={selectedTables.includes(table.name)}
                            onChange={() => toggleTableSelection(table.name)}
                        />
                        <span>{table.name} ({table.row_count})</span>
                    </label>
                ))}
            </div>
          )}
          <Button disabled={selectedTables.length === 0} onClick={handleSelectiveBackup} fullWidth>
              Crear Respaldo
          </Button>
      </Modal>

      {/* Modal Auto Backup */}
      <AutomaticBackupConfig
        isOpen={showAutoBackupModal}
        onClose={() => setShowAutoBackupModal(false)}
      />
    </div>
  )
}

export default Database
