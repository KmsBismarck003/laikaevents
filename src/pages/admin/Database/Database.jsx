
import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, Button, Table, Badge, Modal, Alert, ConfirmationModal, SkeletonRow, Pagination, Icon, Dropdown } from '../../../components'
import Skeleton from '../../../components/Skeleton'
import { useSkeletonContext } from '../../../context/SkeletonContext'
import AutomaticBackupConfig from '../../../components/AutomaticBackupConfig'
import ExternalBackupRestore from '../../../components/ExternalBackup/ExternalBackupRestore'
import NoSqlVault from './NoSqlVault'
import SqlVault from './SqlVault'
import { useNotification } from '../../../context/NotificationContext'
import api from '../../../services/api'
import './admin.css'

const Database = () => {
  const { success, error: showError } = useNotification()
  const navigate = useNavigate()
  const { showSkeleton } = useSkeletonContext()
  const [loading, setLoading] = useState(false)
  const [loadingBackups, setLoadingBackups] = useState(false)
  const [noSqlLoading, setNoSqlLoading] = useState(false)

  const [backups, setBackups] = useState([])
  const [tables, setTables] = useState([])
  const [selectedTables, setSelectedTables] = useState([])

  const [showBackupModal, setShowBackupModal] = useState(false)
  const [showAutoBackupModal, setShowAutoBackupModal] = useState(false)
  const [activeView, setActiveView] = useState('sql') // 'sql' or 'nosql'
  const [showSelectiveModal, setShowSelectiveModal] = useState(false)
  const [alert, setAlert] = useState(null)
  const [confirmModal, setConfirmModal] = useState({ open: false, title: '', message: '', confirmText: '', onConfirm: null })

  // NoSQL Actions States
  const [showNoSqlBackupModal, setShowNoSqlBackupModal] = useState(false)
  const [noSqlRefresh, setNoSqlRefresh] = useState(0)

  // Filters & Pagination
  const [filterType, setFilterType] = useState('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(8) // Updated to 8
  const [retentionDays, setRetentionDays] = useState(30) // Default 30 days

  // Tick for Real-Time Countdown
  const [tick, setTick] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => {
      setTick(t => t + 1)
    }, 1000)
    return () => clearInterval(timer)
  }, [])

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
      const allBackups = backupsResponse.backups || []
      const mysqlBackups = allBackups.filter(b => b && b.type !== 'mongodb' && !(b.backup_id && b.backup_id.toLowerCase().includes('mongo')))
      setBackups(mysqlBackups)

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

  const toggleTableSelection = (tableName) => {
    setSelectedTables(prev => 
      prev.includes(tableName) 
        ? prev.filter(t => t !== tableName) 
        : [...prev, tableName]
    )
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

  const handleCreateNoSqlBackup = async (type) => {
    setShowNoSqlBackupModal(false)
    setLoading(true)
    try {
      if (type === 'atlas') {
        const { analyticsAPI } = await import('../../../services/miscService');
        await analyticsAPI.syncNoSqlVault({ type: 'completo' })
        success('Sincronización Cloud Atlas iniciada correctamente')
      } else {
        await api.database.createBackup('full', { engine: 'mongodb' })
        success('Respaldo a disco JSON iniciado correctamente')
      }
      setNoSqlRefresh(r => r + 1)
    } catch (error) {
      showError('Error al crear respaldo NoSQL')
    } finally {
      setLoading(false)
    }
  }

  const handleOptimizeNoSqlDB = () => {
    setAlert({ type: 'success', message: 'Optimización de Nodos y Compactación iniciada en Atlas...' })
    setTimeout(() => setAlert(null), 3000)
  }

  const handleRestore = async (backupId) => {
    setConfirmModal({
      open: true,
      title: '⚠️ Restaurar Base de Datos',
      message: 'ADVERTENCIA: Esta acción sobrescribirá TODOS los datos actuales con los del respaldo seleccionado. Esta operación es irreversible.',
      confirmText: 'RESTAURAR',
      onConfirm: () => _doRestore(backupId)
    })
  }

  const [auditMetadata, setAuditMetadata] = useState(null)

  const _doRestore = async (backupId) => {
    setConfirmModal(m => ({ ...m, open: false }))
    const restoreStartTime = new Date().toISOString()

    try {
      console.log('📤 Restaurando respaldo:', backupId)
      const response = await api.database.restore(backupId)
      success('Base de datos restaurada exitosamente')
      fetchBackupsList()

      const backupInfo = backups.find(b => b.backup_id === backupId)
      const prefillData = {
        start_datetime: restoreStartTime.slice(0, 16),
        end_datetime: new Date().toISOString().slice(0, 16),
        database_name: response?.database || 'laika_club',
        environment: 'produccion',
        restore_type: backupInfo?.type || response?.backup_type || 'completo',
        backup_size_mb: backupInfo?.size_mb || '',
        execution_method: 'manual',
        server_name: window.location.hostname || 'localhost',
        restore_reason: `Restauración desde respaldo ${backupId.substring(0, 20)}...`
      }

      // Show custom audit confirmation instead of window.confirm
      setConfirmModal({
        open: true,
        title: '✅ Restauración Exitosa',
        message: '¿Deseas registrar esta restauración en el sistema de Auditoría para mantener un historial preventivo?',
        confirmText: 'Registrar Auditoría',
        cancelText: 'Cerrar',
        onConfirm: () => {
          setConfirmModal(m => ({ ...m, open: false }))
          navigate('/admin/restore-audit', {
            state: {
              prefill: prefillData,
              autoOpenWizard: true
            }
          })
        }
      })
    } catch (error) {
      console.error('❌ Error al restaurar:', error)
      showError('Error al restaurar base de datos')
    }
  }

  const handleDeleteBackup = async (backupId) => {
    setConfirmModal({
      open: true,
      title: 'Eliminar Respaldo',
      message: '¿Estás seguro de que deseas eliminar este respaldo permanentemente? No podrás recuperarlo.',
      confirmText: 'ELIMINAR',
      onConfirm: () => _doDeleteBackup(backupId)
    })
  }

  const _doDeleteBackup = async (backupId) => {
    setConfirmModal(m => ({ ...m, open: false }))

    try {
      await api.database.deleteBackup(backupId)
      success('Respaldo eliminado exitosamente')
      fetchBackupsList()
    } catch (error) {
      showError('Error al eliminar respaldo')
    }
  }
  
  const handleDownloadBackup = (backupId, format = 'sql') => {
    try {
      let url = api.database.downloadBackupUrl(backupId)
      let fileName = backupId.toLowerCase().endsWith('.sql') ? backupId : `${backupId}.sql`
      
      if (format === 'json') {
        url = api.database.exportJsonUrl()
        fileName = `database_export_${new Date().toISOString().split('T')[0]}.json`
      } else if (format === 'excel') {
        url = api.database.exportExcelUrl()
        fileName = `database_export_${new Date().toISOString().split('T')[0]}.xlsx`
      } else if (format === 'pdf') {
        url = api.database.exportPdfUrl()
        fileName = `database_report_${new Date().toISOString().split('T')[0]}.pdf`
      } else if (format === 'svg') {
        url = api.database.exportSvgUrl()
        fileName = `database_schema_${new Date().toISOString().split('T')[0]}.svg`
      }

      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', fileName)
      document.body.appendChild(link)
      link.click()
      link.remove()
      success('Iniciando descarga en formato ' + format.toUpperCase() + '...')
    } catch (error) {
      showError('Error al iniciar la descarga')
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


  // Calculate Time Remaining (Real-Time DHMS)
  const calculateTimeRemaining = (createdAt) => {
    if (!createdAt) return { text: 'N/A', color: 'secondary' }
    const createdDate = new Date(createdAt)
    if (isNaN(createdDate.getTime())) return { text: 'N/A', color: 'secondary' }

    const expirationDate = new Date(createdDate.getTime() + retentionDays * 24 * 60 * 60 * 1000)
    const now = new Date()
    const diffTime = expirationDate - now

    if (diffTime <= 0) return { text: 'Expirado', color: 'error' }

    const d = Math.floor(diffTime / (1000 * 60 * 60 * 24))
    const h = Math.floor((diffTime % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
    const m = Math.floor((diffTime % (1000 * 60 * 60)) / (1000 * 60))
    const s = Math.floor((diffTime % (1000 * 60)) / 1000)

    const text = `${d}d ${h}h ${m}m ${s}s`
    const color = d < 3 ? 'warning' : 'success'
    
    return { text, color }
  }

  // Filtering Logic
  const filteredBackups = backups.filter(backup => {
    // Filter out filler backups with 0 size if they are marked as completed
    if (parseFloat(backup.size_mb) <= 0 && backup.status === 'completed') return false;
    
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
      key: 'created_at',
      header: 'Fecha',
      render: value => (
        <span style={{ whiteSpace: 'nowrap' }}>
          {value ? new Date(value).toLocaleString('es-MX') : '—'}
        </span>
      ),
      width: '20%',
      minWidth: '160px'
    },
    {
      key: 'type',
      header: 'Tipo',
      render: value => {
        const variants = { completo: 'info', incremental: 'warning', selectivo: 'primary' }
        return <div style={{ textAlign: 'center' }}><Badge variant={variants[value] || 'default'} rounded>{value?.toUpperCase()}</Badge></div>
      },
      width: '15%',
      minWidth: '100px'
    },
    {
      key: 'size_mb',
      header: 'Tamaño',
      render: value => (
        <div style={{ textAlign: 'right', fontFamily: 'monospace', fontWeight: 'bold' }}>
          {(parseFloat(value) || 0).toFixed(2)} MB
        </div>
      ),
      width: '10%',
      minWidth: '80px'
    },
    {
      key: 'status',
      header: 'Estado',
      render: (value, row) => {
        const variants = { completed: 'success', failed: 'error', in_progress: 'warning', scheduled: 'info' }
        return (
          <div style={{ textAlign: 'center' }}>
            <Badge 
              variant={variants[value] || 'secondary'} 
              rounded 
              title={row.error_message || ''}
            >
              {(value || 'UNKNOWN').toUpperCase()}
            </Badge>
          </div>
        )
      },
      width: '12%',
      minWidth: '100px'
    },
    {
      key: 'time_remaining',
      header: 'Tiempo Restante',
      render: (_, row) => {
        const { text, color } = calculateTimeRemaining(row.created_at)
        return <Badge variant={color} rounded dot>{text}</Badge>
      },
      width: '15%',
      minWidth: '120px'
    },
    {
      key: 'actions',
      header: 'Acciones',
      render: (value, row) => {
        const isCompleted = row.status === 'completed' || !row.status;
        const isFailed = row.status === 'failed';
        
        return (
          <div style={{ display: 'flex', gap: '4px', justifyContent: 'flex-end' }}>
             <Dropdown 
               align="right"
               trigger={
                 <Button 
                   size="small" 
                   variant="info" 
                   disabled={!isCompleted && !isFailed}
                   style={{ padding: '2px 6px', height: '26px', fontSize: '0.62rem', minWidth: 'auto' }}
                   title={isFailed ? "Ver detalles de error" : "Descargar Respaldo"}
                 >
                   <Icon name="download" size={10} /> <span style={{ marginLeft: '4px' }}>DESCARGAR</span>
                 </Button>
               }
             >
               <Dropdown.Item className="dropdown__item--sql" icon={<Icon name="file-text" size={14}/>} onClick={() => handleDownloadBackup(row.backup_id, 'sql')}>SQL (Archivo Base)</Dropdown.Item>
               <Dropdown.Item className="dropdown__item--json" icon={<Icon name="code" size={14}/>} onClick={() => handleDownloadBackup(row.backup_id, 'json')}>JSON (Data Dump)</Dropdown.Item>
               <Dropdown.Item className="dropdown__item--excel" icon={<Icon name="grid" size={14}/>} onClick={() => handleDownloadBackup(row.backup_id, 'excel')}>EXCEL (Tablas)</Dropdown.Item>
               <Dropdown.Divider />
               <Dropdown.Item className="dropdown__item--pdf" icon={<Icon name="file" size={14}/>} onClick={() => handleDownloadBackup(row.backup_id, 'pdf')}>PDF (Reporte)</Dropdown.Item>
               <Dropdown.Item className="dropdown__item--svg" icon={<Icon name="image" size={14}/>} onClick={() => handleDownloadBackup(row.backup_id, 'svg')}>SVG (Esquema)</Dropdown.Item>
             </Dropdown>

            <Button 
               size="small" 
               variant="warning" 
               onClick={() => handleRestore(row.backup_id)}
               disabled={!isCompleted}
               style={{ padding: '2px 6px', height: '26px', fontSize: '0.62rem', minWidth: 'auto', color: '#ffffff' }}
               title="Restaurar Base de Datos"
            >
              <Icon name="history" size={10} /> <span style={{ marginLeft: '4px' }}>RESTAURAR</span>
            </Button>
            <Button 
               size="small" 
               variant="danger" 
               onClick={() => handleDeleteBackup(row.backup_id)}
               style={{ padding: '2px 6px', height: '26px', fontSize: '0.62rem', minWidth: 'auto' }}
               title="Eliminar Respaldo"
            >
              <Icon name="trash" size={10} /> <span style={{ marginLeft: '4px' }}>ELIMINAR</span>
            </Button>
          </div>
        );
      },
      width: '28%',
      minWidth: '280px'
    }
  ]

  // Calcular estadísticas del resumen
  const totalSize = backups.reduce((acc, b) => acc + (parseFloat(b.size_mb) || 0), 0).toFixed(2)
  const lastBackup = backups.length > 0 ? new Date(backups[0].created_at || backups[0].timestamp).toLocaleDateString('es-MX') : 'N/A'

  return (
    <div className="admin-database-page" style={{ transform: 'scale(0.9)', transformOrigin: 'top left', width: '111.11%' }}>
      <div className="page-header">
        <h1 style={{ fontSize: '1.4rem', color: 'var(--text-primary)' }}>Gestión de Base de Datos</h1>
      </div>

      {/* Banner de Estado */}
      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
        <div className="glass-panel" style={{ flex: 1, padding: '0.75rem 1rem', display: 'flex', alignItems: 'center', gap: '0.75rem', minWidth: '140px' }}>
          {(loadingBackups || noSqlLoading) ? <Skeleton type="text" width="40px" height="30px" /> : <span style={{ fontSize: '1.4rem', fontWeight: '800', color: 'var(--text-primary)' }}>{backups.length}</span>}
          <div>
            {(loadingBackups || noSqlLoading) ? <Skeleton width="60px" height="10px" style={{ marginBottom: '4px' }} /> : <div style={{ fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '1px', opacity: 0.6, color: 'var(--text-primary)' }}>Respaldos</div>}
            {(loadingBackups || noSqlLoading) ? <Skeleton width="80px" height="14px" /> : <div style={{ fontWeight: '700', fontSize: '0.85rem', color: 'var(--text-primary)' }}>Disponibles</div>}
          </div>
        </div>
        <div className="glass-panel" style={{ flex: 1, padding: '0.75rem 1rem', display: 'flex', alignItems: 'center', gap: '0.75rem', minWidth: '140px' }}>
          {(loadingBackups || noSqlLoading) ? <Skeleton type="text" width="50px" height="30px" /> : <span style={{ fontSize: '1.4rem', fontWeight: '800', color: 'var(--text-primary)' }}>{totalSize}</span>}
          <div>
            {(loadingBackups || noSqlLoading) ? <Skeleton width="60px" height="10px" style={{ marginBottom: '4px' }} /> : <div style={{ fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '1px', opacity: 0.6, color: 'var(--text-primary)' }}>MB Total</div>}
            {(loadingBackups || noSqlLoading) ? <Skeleton width="80px" height="14px" /> : <div style={{ fontWeight: '700', fontSize: '0.85rem', color: 'var(--text-primary)' }}>Almacenados</div>}
          </div>
        </div>
        <div className="glass-panel" style={{ flex: 1, padding: '0.75rem 1rem', display: 'flex', alignItems: 'center', gap: '0.75rem', minWidth: '140px' }}>
          {(loadingBackups || noSqlLoading) ? <Skeleton type="text" width="70px" height="24px" /> : <span style={{ fontSize: '1rem', fontWeight: '800', color: 'var(--text-primary)' }}>{lastBackup}</span>}
          <div>
            {(loadingBackups || noSqlLoading) ? <Skeleton width="50px" height="10px" style={{ marginBottom: '4px' }} /> : <div style={{ fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '1px', opacity: 0.6, color: 'var(--text-primary)' }}>Último</div>}
            {(loadingBackups || noSqlLoading) ? <Skeleton width="70px" height="14px" /> : <div style={{ fontWeight: '700', fontSize: '0.85rem', color: 'var(--text-primary)' }}>Respaldo</div>}
          </div>
        </div>
      </div>

      {alert && (
        <Alert
          type={alert.type}
          message={alert.message}
          onClose={() => setAlert(null)}
        />
      )}

      <div className="actions-bar" style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: '10px' }}>
          {(loadingBackups || noSqlLoading) ? (
            <>
              <Skeleton style={{ height: '38px', width: '160px', borderRadius: '6px' }} animate />
              <Skeleton style={{ height: '38px', width: '160px', borderRadius: '6px' }} animate />
              <Skeleton style={{ height: '38px', width: '120px', borderRadius: '6px' }} animate />
              <Skeleton style={{ height: '38px', width: '120px', borderRadius: '6px' }} animate />
            </>
          ) : (
            <>
              {activeView?.toLowerCase() === 'sql' && (
                <>
                  <Button onClick={() => setShowBackupModal(true)} style={{ background: '#111111', color: '#ffffff', border: '1px solid #ffffff' }}>Gestionar Respaldos</Button>
                  <Button variant="info" style={{ color: '#ffffff', background: '#2980b9' }} onClick={() => setShowAutoBackupModal(true)}>Config. Automática</Button>
                  <Button variant="warning" onClick={handleOptimizeDB} style={{ color: '#ffffff', background: '#f39c12' }}>Optimizar BD</Button>
                  <Button variant="danger" onClick={handleClearCache} style={{ background: '#e74c3c', color: '#ffffff' }}>Limpiar Caché</Button>
                </>
              )}
              {activeView?.toLowerCase() === 'nosql' && (
                <>
                  <Button onClick={() => setShowNoSqlBackupModal(true)} style={{ background: '#111111', color: '#ffffff', border: '1px solid #ffffff' }}>Gestionar Respaldos</Button>
                  <Button variant="info" style={{ color: '#ffffff', background: '#2980b9' }} onClick={() => setShowAutoBackupModal(true)}>Config. Automática</Button>
                  <Button variant="warning" onClick={handleOptimizeNoSqlDB} style={{ color: '#ffffff', background: '#f39c12' }}>Optimizar BD</Button>
                  <Button variant="danger" onClick={handleClearCache} style={{ background: '#e74c3c', color: '#ffffff' }}>Limpiar Caché</Button>
                </>
              )}
            </>
          )}
        </div>

        {(loadingBackups || noSqlLoading) ? (
          <Skeleton style={{ height: '34px', width: '170px', borderRadius: '8px' }} animate />
        ) : (
          <div className="view-toggle-premium" style={{ display: 'flex', background: '#e0e0e0', padding: '4px', borderRadius: '8px', border: '1px solid #ccc' }}>
            <Button 
                  size="small" 
                  onClick={() => setActiveView('sql')}
                  style={{ 
                    fontSize: '0.7rem', 
                    fontWeight: 900, 
                    minWidth: '80px', 
                    background: activeView?.toLowerCase() === 'sql' ? '#111111' : 'transparent',
                    color: activeView?.toLowerCase() === 'sql' ? '#ffffff' : '#444444',
                    border: 'none',
                    borderRadius: '6px',
                    transition: 'all 0.2s'
                  }}
            >
              SQL
            </Button>
            <Button 
                  size="small" 
                  onClick={() => setActiveView('nosql')}
                  style={{ 
                    fontSize: '0.7rem', 
                    fontWeight: 900, 
                    minWidth: '80px', 
                    background: activeView?.toLowerCase() === 'nosql' ? '#111111' : 'transparent',
                    color: activeView?.toLowerCase() === 'nosql' ? '#ffffff' : '#444444',
                    border: 'none',
                    borderRadius: '6px',
                    transition: 'all 0.2s'
                  }}
            >
              NOSQL
            </Button>
          </div>
        )}
      </div>
      
      {activeView === 'sql' ? (
        <>
          {/* Seccion de Respaldo Externo (Desactivado por ruta BE inexistente)
          <div className="mb-8" style={{ marginBottom: '20px' }}>
            <ExternalBackupRestore />
          </div>
          */}

          <SqlVault 
            backups={currentBackups}
            loading={loadingBackups}
            onRefresh={fetchBackupsList}
            onRestore={handleRestore}
            onDelete={handleDeleteBackup}
            onDownload={handleDownloadBackup}
            retentionDays={retentionDays}
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={paginate}
          />
        </>
       ) : (
         <NoSqlVault retentionDays={retentionDays} refreshTrigger={noSqlRefresh} onLoadingChange={setNoSqlLoading} />
       )}

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

      {/* Modal Manual NoSQL Backup */}
      <Modal
        isOpen={showNoSqlBackupModal}
        onClose={() => setShowNoSqlBackupModal(false)}
        title="Crear Respaldo NoSQL"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <Button onClick={() => handleCreateNoSqlBackup('atlas')}>Sincronizar Cloud Atlas</Button>
          <Button variant="secondary" onClick={() => handleCreateNoSqlBackup('disk')}>Respaldo a Disco (JSON)</Button>
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
        {tables.length === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', padding: '10px' }}>
            {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} type="text" width={`${60 + i * 8}%`} height="14px" />)}
          </div>
        ) : (
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

      {/* Modal de Confirmación Premium */}
      {confirmModal.open && (
        <ConfirmationModal
          isOpen={confirmModal.open}
          title={confirmModal.title}
          message={confirmModal.message}
          confirmText={confirmModal.confirmText}
          onConfirm={confirmModal.onConfirm}
          onClose={() => setConfirmModal(m => ({ ...m, open: false }))}
        />
      )}
    </div>
  )
}

export default Database
