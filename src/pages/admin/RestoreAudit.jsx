import React, { useState, useEffect, useCallback } from 'react'
import { useLocation } from 'react-router-dom'
import api from '../../services/api'
import { Card, Spinner, Icon } from '../../components'
import './RestoreAudit.css'
import './admin.css'

// ============================================
// HELPER FUNCTIONS
// ============================================

const formatDuration = (seconds) => {
  if (!seconds && seconds !== 0) return 'N/A'
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = Math.floor(seconds % 60)
  if (h > 0) return `${h}h ${m}m ${s}s`
  if (m > 0) return `${m}m ${s}s`
  return `${s}s`
}

const formatDate = (iso) => {
  if (!iso) return 'N/A'
  try {
    return new Date(iso).toLocaleString('es-MX', {
      year: 'numeric', month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit'
    })
  } catch { return iso }
}

const severityBadge = (sev) => {
  const map = {
    bajo: 'ra-badge ra-badge-success',
    medio: 'ra-badge ra-badge-warning',
    alto: 'ra-badge ra-badge-danger',
    critico: 'ra-badge ra-badge-critical'
  }
  return <span className={map[sev] || 'ra-badge ra-badge-neutral'}>{(sev || 'N/A').toUpperCase()}</span>
}

const resultBadge = (result) => {
  if (result === 'exito') return <span className="ra-badge ra-badge-success"><Icon name="checkCircle" size={14} className="mr-1 inline-block" /> Éxito</span>
  if (result === 'fallo') return <span className="ra-badge ra-badge-danger"><Icon name="xCircle" size={14} className="mr-1 inline-block" /> Fallo</span>
  return <span className="ra-badge ra-badge-neutral"><Icon name="clock" size={14} className="mr-1 inline-block" /> Pendiente</span>
}

// Safely extract error message string from any error shape
const getErrorMessage = (err, fallback = 'Error desconocido') => {
  if (!err) return fallback
  if (typeof err === 'string') return err
  // API client may return { message: string } or { message: { message, errors } } or { detail: string }
  if (err.detail && typeof err.detail === 'string') return err.detail
  if (err.message) {
    if (typeof err.message === 'string') return err.message
    if (typeof err.message === 'object') {
      // { message: { message: '...', errors: [...] } }
      if (err.message.message && typeof err.message.message === 'string') return err.message.message
      if (err.message.errors && Array.isArray(err.message.errors)) return err.message.errors.join(', ')
      return JSON.stringify(err.message)
    }
  }
  if (err.errors && Array.isArray(err.errors)) return err.errors.join(', ')
  try { return JSON.stringify(err) } catch { return fallback }
}

// ============================================
// MAIN COMPONENT
// ============================================

const RestoreAudit = () => {
  const location = useLocation()
  const [activeTab, setActiveTab] = useState('history')
  const [events, setEvents] = useState([])
  const [stats, setStats] = useState(null)
  const [selectedEvent, setSelectedEvent] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // History filters
  const [filters, setFilters] = useState({
    start_date: '', end_date: '', environment: '', severity: '', is_confirmed: ''
  })

  // Wizard state
  const [wizardStep, setWizardStep] = useState(0)
  const [currentEventId, setCurrentEventId] = useState(null)
  const [formData, setFormData] = useState({
    // Step 0 - Info General
    start_datetime: '', end_datetime: '', database_name: '',
    environment: 'dev', restore_type: '', backup_size_mb: '',
    restore_reason: '', execution_method: 'manual', server_name: '',
    // Step 1 - Technical Checks
    integrity_verified: false, integrity_result: 'pendiente', integrity_observations: '',
    total_tables: '', critical_record_count: '',
    log_errors_detected: '', log_errors_observations: '',
    data_consistency_validated: false, data_consistency_observations: '',
    checksum_match: false, checksum_observations: '',
    // Step 2 - Functional Checks
    auth_result: 'pendiente', auth_observations: '',
    critical_modules_result: 'pendiente', critical_modules_observations: '',
    main_apis_result: 'pendiente', main_apis_observations: '',
    sensitive_operations_result: 'pendiente', sensitive_operations_observations: '',
    admin_panel_result: 'pendiente', admin_panel_observations: '',
    // Step 3 - Operational Impact
    had_downtime: false, downtime_minutes: '', estimated_affected_users: '',
    severity: 'bajo', needed_retry: false, needed_rollback: false, impact_observations: '',
    // Step 4 - Confirmation
    final_comments: '', accepts_responsibility: false
  })

  // Fetch events
  const fetchEvents = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const params = {}
      if (filters.start_date) params.start_date = filters.start_date
      if (filters.end_date) params.end_date = filters.end_date
      if (filters.environment) params.environment = filters.environment
      if (filters.severity) params.severity = filters.severity
      if (filters.is_confirmed !== '') params.is_confirmed = filters.is_confirmed === 'true'
      const data = await api.restoreAudit.getEvents(params)
      setEvents(data.events || [])
    } catch (err) {
      setError('Error al cargar eventos: ' + getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }, [filters])

  const fetchStats = useCallback(async () => {
    setLoading(true)
    try {
      const data = await api.restoreAudit.getStats()
      setStats(data.stats || null)
    } catch (err) {
      setError('Error al cargar estadísticas: ' + getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchEventDetail = useCallback(async (id) => {
    setLoading(true)
    try {
      const data = await api.restoreAudit.getEvent(id)
      setSelectedEvent(data)
    } catch (err) {
      setError('Error al cargar detalle: ' + getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (activeTab === 'history') fetchEvents()
    if (activeTab === 'stats') fetchStats()
  }, [activeTab, fetchEvents, fetchStats])

  // Auto-open wizard with pre-filled data from Database page
  useEffect(() => {
    if (location.state?.autoOpenWizard && location.state?.prefill) {
      setActiveTab('new')
      setFormData(prev => ({
        ...prev,
        ...location.state.prefill
      }))
      setSuccess('Datos pre-llenados desde la restauración. Complete el formulario de auditoría.')
      // Clean up state so it doesn't re-trigger on re-renders
      window.history.replaceState({}, document.title)
    }
  }, [location.state])

  // Clear messages after 5s
  useEffect(() => {
    if (success) {
      const t = setTimeout(() => setSuccess(''), 5000)
      return () => clearTimeout(t)
    }
  }, [success])

  useEffect(() => {
    if (error) {
      const t = setTimeout(() => setError(''), 8000)
      return () => clearTimeout(t)
    }
  }, [error])

  // Form input handler
  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  // ============================================
  // WIZARD ACTIONS
  // ============================================

  const resetWizard = () => {
    setWizardStep(0)
    setCurrentEventId(null)
    setFormData({
      start_datetime: '', end_datetime: '', database_name: '',
      environment: 'dev', restore_type: '', backup_size_mb: '',
      restore_reason: '', execution_method: 'manual', server_name: '',
      integrity_verified: false, integrity_result: 'pendiente', integrity_observations: '',
      total_tables: '', critical_record_count: '',
      log_errors_detected: '', log_errors_observations: '',
      data_consistency_validated: false, data_consistency_observations: '',
      checksum_match: false, checksum_observations: '',
      auth_result: 'pendiente', auth_observations: '',
      critical_modules_result: 'pendiente', critical_modules_observations: '',
      main_apis_result: 'pendiente', main_apis_observations: '',
      sensitive_operations_result: 'pendiente', sensitive_operations_observations: '',
      admin_panel_result: 'pendiente', admin_panel_observations: '',
      had_downtime: false, downtime_minutes: '', estimated_affected_users: '',
      severity: 'bajo', needed_retry: false, needed_rollback: false, impact_observations: '',
      final_comments: '', accepts_responsibility: false
    })
    setError('')
    setSuccess('')
  }

  // Step 0: Create Event
  const handleCreateEvent = async () => {
    setError('')
    if (!formData.start_datetime || !formData.database_name || !formData.restore_reason || !formData.server_name || !formData.restore_type) {
      setError('Todos los campos obligatorios deben ser completados')
      return
    }
    setLoading(true)
    try {
      const payload = {
        start_datetime: formData.start_datetime,
        end_datetime: formData.end_datetime || undefined,
        database_name: formData.database_name,
        environment: formData.environment,
        restore_type: formData.restore_type,
        backup_size_mb: formData.backup_size_mb ? parseFloat(formData.backup_size_mb) : undefined,
        restore_reason: formData.restore_reason,
        execution_method: formData.execution_method,
        server_name: formData.server_name
      }
      const data = await api.restoreAudit.createEvent(payload)
      setCurrentEventId(data.event.id)
      setWizardStep(1)
      setSuccess('Evento de restauración creado exitosamente')
    } catch (err) {
      setError(getErrorMessage(err, 'Error al crear evento'))
    } finally {
      setLoading(false)
    }
  }

  // Step 1: Technical Checks
  const handleSaveTechnical = async () => {
    setError('')
    setLoading(true)
    try {
      await api.restoreAudit.saveTechnicalChecks(currentEventId, {
        integrity_verified: formData.integrity_verified,
        integrity_result: formData.integrity_result,
        integrity_observations: formData.integrity_observations || undefined,
        total_tables: formData.total_tables ? parseInt(formData.total_tables) : undefined,
        critical_record_count: formData.critical_record_count ? parseInt(formData.critical_record_count) : undefined,
        log_errors_detected: formData.log_errors_detected || undefined,
        log_errors_observations: formData.log_errors_observations || undefined,
        data_consistency_validated: formData.data_consistency_validated,
        data_consistency_observations: formData.data_consistency_observations || undefined,
        checksum_match: formData.checksum_match || undefined,
        checksum_observations: formData.checksum_observations || undefined
      })
      setWizardStep(2)
      setSuccess('Validaciones técnicas guardadas')
    } catch (err) {
      setError(getErrorMessage(err, 'Error al guardar validaciones técnicas'))
    } finally {
      setLoading(false)
    }
  }

  // Step 2: Functional Checks
  const handleSaveFunctional = async () => {
    setError('')
    setLoading(true)
    try {
      await api.restoreAudit.saveFunctionalChecks(currentEventId, {
        auth_result: formData.auth_result,
        auth_observations: formData.auth_observations || undefined,
        critical_modules_result: formData.critical_modules_result,
        critical_modules_observations: formData.critical_modules_observations || undefined,
        main_apis_result: formData.main_apis_result,
        main_apis_observations: formData.main_apis_observations || undefined,
        sensitive_operations_result: formData.sensitive_operations_result,
        sensitive_operations_observations: formData.sensitive_operations_observations || undefined,
        admin_panel_result: formData.admin_panel_result,
        admin_panel_observations: formData.admin_panel_observations || undefined
      })
      setWizardStep(3)
      setSuccess('Validaciones funcionales guardadas')
    } catch (err) {
      setError(getErrorMessage(err, 'Error al guardar validaciones funcionales'))
    } finally {
      setLoading(false)
    }
  }

  // Step 3: Operational Impact
  const handleSaveImpact = async () => {
    setError('')
    setLoading(true)
    try {
      await api.restoreAudit.saveOperationalImpact(currentEventId, {
        had_downtime: formData.had_downtime,
        downtime_minutes: formData.downtime_minutes ? parseFloat(formData.downtime_minutes) : 0,
        estimated_affected_users: formData.estimated_affected_users ? parseInt(formData.estimated_affected_users) : 0,
        severity: formData.severity,
        needed_retry: formData.needed_retry,
        needed_rollback: formData.needed_rollback,
        observations: formData.impact_observations || undefined
      })
      setWizardStep(4)
      setSuccess('Impacto operativo guardado')
    } catch (err) {
      setError(getErrorMessage(err, 'Error al guardar impacto operativo'))
    } finally {
      setLoading(false)
    }
  }

  // Step 4: Confirm
  const handleConfirm = async () => {
    setError('')
    if (!formData.accepts_responsibility) {
      setError('Debe aceptar la responsabilidad operativa para confirmar')
      return
    }
    setLoading(true)
    try {
      await api.restoreAudit.confirmEvent(currentEventId, {
        final_comments: formData.final_comments || undefined,
        accepts_responsibility: true
      })
      setSuccess('✅ Evento confirmado exitosamente. Registro bloqueado para edición.')
      resetWizard()
      setActiveTab('history')
      fetchEvents()
    } catch (err) {
      // Handle validation errors from backend
      const msg = getErrorMessage(err, 'Error al confirmar')
      if (err.errors && Array.isArray(err.errors)) {
        setError('Checklist incompleto: ' + err.errors.join(', '))
      } else {
        setError(msg)
      }
    } finally {
      setLoading(false)
    }
  }

  // Export CSV
  const handleExport = async () => {
    try {
      const params = {}
      if (filters.start_date) params.start_date = filters.start_date
      if (filters.end_date) params.end_date = filters.end_date
      if (filters.environment) params.environment = filters.environment

      const response = await fetch(
        `${process.env.REACT_APP_API_URL || 'http://localhost:8000/api'}/restore-audit/export?${new URLSearchParams(params)}`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }
      )
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `restore_audit_${new Date().toISOString().split('T')[0]}.csv`
      document.body.appendChild(a)
      a.click()
      a.remove()
      window.URL.revokeObjectURL(url)
      setSuccess('Archivo CSV exportado exitosamente')
    } catch (err) {
      setError('Error al exportar: ' + getErrorMessage(err))
    }
  }

  // ============================================
  // RENDER WIZARD STEPS
  // ============================================

  const renderWizardStepIndicator = () => {
    const steps = ['Info General', 'Técnicas', 'Funcionales', 'Impacto', 'Confirmación']
    return (
      <div className="ra-wizard-steps">
        {steps.map((label, i) => (
          <div key={i} className={`ra-wizard-step ${i === wizardStep ? 'active' : ''} ${i < wizardStep ? 'completed' : ''}`}>
            <div className="ra-wizard-step-num">{i < wizardStep ? <Icon name="check" size={14} /> : i + 1}</div>
            <span className="ra-wizard-step-label">{label}</span>
          </div>
        ))}
      </div>
    )
  }

  const renderStep0 = () => (
    <div className="ra-form-section">
      <h3><Icon name="fileText" className="mr-2 inline-block" /> Información General de la Restauración</h3>
      <div className="ra-form-grid">
        <div className="ra-form-group">
          <label>Fecha/Hora Inicio <span className="required">*</span></label>
          <input type="datetime-local" value={formData.start_datetime} onChange={e => handleChange('start_datetime', e.target.value)} />
        </div>
        <div className="ra-form-group">
          <label>Fecha/Hora Fin</label>
          <input type="datetime-local" value={formData.end_datetime} onChange={e => handleChange('end_datetime', e.target.value)} />
        </div>
        <div className="ra-form-group">
          <label>Base de Datos <span className="required">*</span></label>
          <input type="text" value={formData.database_name} onChange={e => handleChange('database_name', e.target.value)} placeholder="ej: laika_club" />
        </div>
        <div className="ra-form-group">
          <label>Entorno <span className="required">*</span></label>
          <select value={formData.environment} onChange={e => handleChange('environment', e.target.value)}>
            <option value="dev">Desarrollo</option>
            <option value="staging">Staging</option>
            <option value="produccion">Producción</option>
          </select>
        </div>
        <div className="ra-form-group">
          <label>Tipo de Restauración <span className="required">*</span></label>
          <input type="text" value={formData.restore_type} onChange={e => handleChange('restore_type', e.target.value)} placeholder="ej: completa, parcial, incremental" />
        </div>
        <div className="ra-form-group">
          <label>Tamaño del Respaldo (MB)</label>
          <input type="number" step="0.01" min="0" value={formData.backup_size_mb} onChange={e => handleChange('backup_size_mb', e.target.value)} placeholder="ej: 125.5" />
        </div>
        <div className="ra-form-group">
          <label>Método de Ejecución <span className="required">*</span></label>
          <select value={formData.execution_method} onChange={e => handleChange('execution_method', e.target.value)}>
            <option value="manual">Manual</option>
            <option value="script">Script</option>
            <option value="automatizado">Automatizado</option>
          </select>
        </div>
        <div className="ra-form-group">
          <label>Servidor Afectado <span className="required">*</span></label>
          <input type="text" value={formData.server_name} onChange={e => handleChange('server_name', e.target.value)} placeholder="ej: db-server-01" />
        </div>
        <div className="ra-form-group full-width">
          <label>Motivo de la Restauración <span className="required">*</span></label>
          <textarea value={formData.restore_reason} onChange={e => handleChange('restore_reason', e.target.value)} placeholder="Describa el motivo detallado de la restauración..." />
        </div>
      </div>
      <div className="ra-btn-row">
        <button className="ra-btn ra-btn-secondary" onClick={() => { resetWizard(); setActiveTab('history') }}>Cancelar</button>
        <button className="ra-btn ra-btn-primary" onClick={handleCreateEvent} disabled={loading}>
          {loading ? <span><Icon name="loader" className="animate-spin mr-2 inline-block" /> Guardando...</span> : <span>Siguiente <Icon name="arrowRight" className="ml-2 inline-block" />: Validaciones Técnicas</span>}
        </button>
      </div>
    </div>
  )

  const renderStep1 = () => (
    <div className="ra-form-section">
      <h3><Icon name="settings" className="mr-2 inline-block" /> Validaciones Técnicas</h3>
      <div className="ra-form-grid">
        <div className="ra-form-group">
          <div className="ra-check-row" onClick={() => handleChange('integrity_verified', !formData.integrity_verified)}>
            <input type="checkbox" checked={formData.integrity_verified} onChange={() => {}} />
            <label>Verificación de integridad ejecutada</label>
          </div>
        </div>
        <div className="ra-form-group">
          <label>Resultado de Integridad</label>
          <select value={formData.integrity_result} onChange={e => handleChange('integrity_result', e.target.value)}>
            <option value="pendiente">Pendiente</option>
            <option value="exito">Éxito</option>
            <option value="fallo">Fallo</option>
          </select>
        </div>
        <div className="ra-form-group full-width">
          <label>Observaciones de Integridad</label>
          <textarea value={formData.integrity_observations} onChange={e => handleChange('integrity_observations', e.target.value)} placeholder="Detalles adicionales..." />
        </div>
        <div className="ra-form-group">
          <label>Número Total de Tablas</label>
          <input type="number" min="0" value={formData.total_tables} onChange={e => handleChange('total_tables', e.target.value)} />
        </div>
        <div className="ra-form-group">
          <label>Conteo de Registros Críticos</label>
          <input type="number" min="0" value={formData.critical_record_count} onChange={e => handleChange('critical_record_count', e.target.value)} />
        </div>
        <div className="ra-form-group full-width">
          <label>Errores Detectados en Logs</label>
          <textarea value={formData.log_errors_detected} onChange={e => handleChange('log_errors_detected', e.target.value)} placeholder="Errores encontrados en los logs del proceso..." />
        </div>
        <div className="ra-form-group full-width">
          <label>Observaciones de Errores</label>
          <textarea value={formData.log_errors_observations} onChange={e => handleChange('log_errors_observations', e.target.value)} placeholder="Estado de resolución de errores..." />
        </div>
        <div className="ra-form-group">
          <div className="ra-check-row" onClick={() => handleChange('data_consistency_validated', !formData.data_consistency_validated)}>
            <input type="checkbox" checked={formData.data_consistency_validated} onChange={() => {}} />
            <label>Consistencia de datos validada</label>
          </div>
        </div>
        <div className="ra-form-group">
          <label>Observaciones de Consistencia</label>
          <input type="text" value={formData.data_consistency_observations} onChange={e => handleChange('data_consistency_observations', e.target.value)} />
        </div>
        <div className="ra-form-group">
          <div className="ra-check-row" onClick={() => handleChange('checksum_match', !formData.checksum_match)}>
            <input type="checkbox" checked={formData.checksum_match} onChange={() => {}} />
            <label>Coincidencia de checksum</label>
          </div>
        </div>
        <div className="ra-form-group">
          <label>Observaciones de Checksum</label>
          <input type="text" value={formData.checksum_observations} onChange={e => handleChange('checksum_observations', e.target.value)} />
        </div>
      </div>
      <div className="ra-btn-row">
        <button className="ra-btn ra-btn-secondary" onClick={() => setWizardStep(0)} disabled><span><Icon name="arrowLeft" className="mr-2 inline-block" /> Anterior</span></button>
        <button className="ra-btn ra-btn-primary" onClick={handleSaveTechnical} disabled={loading}>
          {loading ? <span><Icon name="loader" className="animate-spin mr-2 inline-block" /> Guardando...</span> : <span>Siguiente <Icon name="arrowRight" className="mr-2 inline-block" />: Validaciones Funcionales</span>}
        </button>
      </div>
    </div>
  )

  const renderStep2 = () => {
    const checks = [
      { key: 'auth', label: 'Autenticación' },
      { key: 'critical_modules', label: 'Módulos Críticos' },
      { key: 'main_apis', label: 'APIs Principales' },
      { key: 'sensitive_operations', label: 'Operaciones Sensibles' },
      { key: 'admin_panel', label: 'Panel Administrativo' }
    ]
    return (
      <div className="ra-form-section">
        <h3><Icon name="checkCircle" className="mr-2 inline-block" /> Validaciones Funcionales</h3>
        {checks.map(({ key, label }) => (
          <div key={key} style={{ marginBottom: '1rem', padding: '12px', background: 'var(--bg-input, rgba(255,255,255,0.02))', borderRadius: '10px', border: '1px solid var(--border-color, rgba(255,255,255,0.06))' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
              <span style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-primary)' }}>{label}</span>
              <select value={formData[`${key}_result`]} onChange={e => handleChange(`${key}_result`, e.target.value)}
                style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-input)', color: 'var(--text-primary)', fontSize: '0.85rem' }}>
                <option value="pendiente">⏳ Pendiente</option>
                <option value="exito">✅ Éxito</option>
                <option value="fallo">❌ Fallo</option>
              </select>
            </div>
            <input type="text" value={formData[`${key}_observations`]} onChange={e => handleChange(`${key}_observations`, e.target.value)}
              placeholder={`Observaciones de ${label.toLowerCase()}...`}
              style={{ width: '100%', marginTop: '8px', padding: '8px 10px', borderRadius: '6px', border: '1px solid var(--border-color, rgba(255,255,255,0.08))', background: 'var(--bg-input, rgba(255,255,255,0.03))', color: 'var(--text-primary)', fontSize: '0.85rem', boxSizing: 'border-box' }} />
          </div>
        ))}
        <div className="ra-btn-row">
          <button className="ra-btn ra-btn-secondary" onClick={() => setWizardStep(1)}><span><Icon name="arrowLeft" className="mr-2 inline-block" /> Anterior</span></button>
          <button className="ra-btn ra-btn-primary" onClick={handleSaveFunctional} disabled={loading}>
            {loading ? <span><Icon name="loader" className="animate-spin mr-2 inline-block" /> Guardando...</span> : <span>Siguiente <Icon name="arrowRight" className="ml-2 inline-block" />: Impacto Operativo</span>}
          </button>
        </div>
      </div>
    )
  }

  const renderStep3 = () => (
    <div className="ra-form-section">
      <h3><Icon name="alertTriangle" className="mr-2 inline-block" /> Impacto Operativo</h3>
      <div className="ra-form-grid">
        <div className="ra-form-group">
          <div className="ra-check-row" onClick={() => handleChange('had_downtime', !formData.had_downtime)}>
            <input type="checkbox" checked={formData.had_downtime} onChange={() => {}} />
            <label>Hubo tiempo de inactividad (downtime)</label>
          </div>
        </div>
        {formData.had_downtime && (
          <div className="ra-form-group">
            <label>Duración del Downtime (minutos)</label>
            <input type="number" min="0" step="0.1" value={formData.downtime_minutes} onChange={e => handleChange('downtime_minutes', e.target.value)} />
          </div>
        )}
        <div className="ra-form-group">
          <label>Usuarios Afectados (estimado)</label>
          <input type="number" min="0" value={formData.estimated_affected_users} onChange={e => handleChange('estimated_affected_users', e.target.value)} />
        </div>
        <div className="ra-form-group">
          <label>Nivel de Severidad</label>
          <select value={formData.severity} onChange={e => handleChange('severity', e.target.value)}>
            <option value="bajo">🟢 Bajo</option>
            <option value="medio">🟡 Medio</option>
            <option value="alto">🟠 Alto</option>
            <option value="critico">🔴 Crítico</option>
          </select>
        </div>
        <div className="ra-form-group">
          <div className="ra-check-row" onClick={() => handleChange('needed_retry', !formData.needed_retry)}>
            <input type="checkbox" checked={formData.needed_retry} onChange={() => {}} />
            <label>Fue necesario reintentar</label>
          </div>
        </div>
        <div className="ra-form-group">
          <div className="ra-check-row" onClick={() => handleChange('needed_rollback', !formData.needed_rollback)}>
            <input type="checkbox" checked={formData.needed_rollback} onChange={() => {}} />
            <label>Fue necesario rollback posterior</label>
          </div>
        </div>
        <div className="ra-form-group full-width">
          <label>Observaciones</label>
          <textarea value={formData.impact_observations} onChange={e => handleChange('impact_observations', e.target.value)} placeholder="Detalles adicionales del impacto operativo..." />
        </div>
      </div>
      <div className="ra-btn-row">
        <button className="ra-btn ra-btn-secondary" onClick={() => setWizardStep(2)}><span><Icon name="arrowLeft" className="mr-2 inline-block" /> Anterior</span></button>
        <button className="ra-btn ra-btn-primary" onClick={handleSaveImpact} disabled={loading}>
          {loading ? <span><Icon name="loader" className="animate-spin mr-2 inline-block" /> Guardando...</span> : <span>Siguiente <Icon name="arrowRight" className="ml-2 inline-block" />: Confirmación</span>}
        </button>
      </div>
    </div>
  )

  const renderStep4 = () => (
    <div className="ra-form-section">
      <div className="ra-confirm-box">
        <h3><Icon name="lock" className="mr-2 inline-block" /> Confirmación Formal</h3>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
          Al confirmar, el registro quedará <strong>bloqueado permanentemente</strong>. No se permitirán modificaciones posteriores.
        </p>
        <div className="ra-form-grid" style={{ textAlign: 'left', maxWidth: '600px', margin: '0 auto' }}>
          <div className="ra-form-group full-width">
            <label>Comentarios Finales</label>
            <textarea value={formData.final_comments} onChange={e => handleChange('final_comments', e.target.value)}
              placeholder="Observaciones finales sobre la restauración..." style={{ minHeight: '100px' }} />
          </div>
          <div className="ra-form-group full-width">
            <div className="ra-check-row" onClick={() => handleChange('accepts_responsibility', !formData.accepts_responsibility)}
              style={{ border: formData.accepts_responsibility ? '2px solid var(--success, #22c55e)' : '2px solid var(--danger, #ef4444)', background: formData.accepts_responsibility ? 'rgba(34,197,94,0.05)' : 'rgba(239,68,68,0.05)' }}>
              <input type="checkbox" checked={formData.accepts_responsibility} onChange={() => {}} />
              <label style={{ fontSize: '0.92rem' }}>
                <strong>Confirmo que he validado completamente esta restauración y acepto la responsabilidad operativa del evento.</strong>
              </label>
            </div>
          </div>
        </div>
      </div>
      <div className="ra-btn-row" style={{ marginTop: '1.5rem' }}>
        <button className="ra-btn ra-btn-secondary" onClick={() => setWizardStep(3)}><span><Icon name="arrowLeft" className="mr-2 inline-block" /> Anterior</span></button>
        <button className="ra-btn ra-btn-success" onClick={handleConfirm} disabled={loading || !formData.accepts_responsibility}>
          {loading ? <span><Icon name="loader" className="animate-spin mr-2 inline-block" /> Confirmando...</span> : <span><Icon name="lock" className="mr-2 inline-block" /> Confirmar y Bloquear Registro</span>}
        </button>
      </div>
    </div>
  )

  // ============================================
  // RENDER DETAIL VIEW
  // ============================================

  const renderDetail = () => {
    if (!selectedEvent) return null
    const { event, technical_checks: tc, functional_checks: fc, operational_impact: oi, confirmation } = selectedEvent

    return (
      <div className="ra-detail-sections">
        <button className="ra-btn ra-btn-secondary" onClick={() => { setSelectedEvent(null); setActiveTab('history') }} style={{ alignSelf: 'flex-start' }}>
          <span><Icon name="arrowLeft" className="mr-2 inline-block" /> Volver al Historial</span>
        </button>

        {event.is_confirmed ? (
          <div className="ra-confirmed-banner">
            <span className="icon"><Icon name="lock" size={24} /></span>
            <div>
              <div className="text">Registro Confirmado y Bloqueado</div>
              <div className="subtext">Confirmado por {event.confirmed_by_username} el {formatDate(event.confirmed_at)}</div>
            </div>
          </div>
        ) : (
          <div className="ra-pending-banner">
            <span className="icon"><Icon name="clock" size={24} /></span>
            <div>
              <div className="text">Pendiente de Confirmación</div>
            </div>
          </div>
        )}

        {/* Info General */}
        <div className="ra-detail-section">
          <h3><Icon name="fileText" className="mr-2 inline-block" /> Información General</h3>
          <div className="ra-detail-grid">
            <div className="ra-detail-item"><span className="label">ID</span><span className="value">#{event.id}</span></div>
            <div className="ra-detail-item"><span className="label">Administrador</span><span className="value">{event.admin_username}</span></div>
            <div className="ra-detail-item"><span className="label">Inicio</span><span className="value">{formatDate(event.start_datetime)}</span></div>
            <div className="ra-detail-item"><span className="label">Fin</span><span className="value">{formatDate(event.end_datetime)}</span></div>
            <div className="ra-detail-item"><span className="label">Duración</span><span className="value">{formatDuration(event.duration_seconds)}</span></div>
            <div className="ra-detail-item"><span className="label">Base de Datos</span><span className="value">{event.database_name}</span></div>
            <div className="ra-detail-item"><span className="label">Entorno</span><span className="value">{severityBadge(null)}{event.environment?.toUpperCase()}</span></div>
            <div className="ra-detail-item"><span className="label">Tipo</span><span className="value">{event.restore_type}</span></div>
            <div className="ra-detail-item"><span className="label">Tamaño Respaldo</span><span className="value">{event.backup_size_mb ? `${event.backup_size_mb} MB` : 'N/A'}</span></div>
            <div className="ra-detail-item"><span className="label">Método</span><span className="value">{event.execution_method}</span></div>
            <div className="ra-detail-item"><span className="label">Servidor</span><span className="value">{event.server_name}</span></div>
            <div className="ra-detail-item full-width"><span className="label">Motivo</span><span className="value">{event.restore_reason}</span></div>
            <div className="ra-detail-item"><span className="label">Última Modificación</span><span className="value">{formatDate(event.last_modified_at)} por {event.last_modified_by_username}</span></div>
          </div>
        </div>

        {/* Technical Checks */}
        {tc && (
          <div className="ra-detail-section">
            <h3><Icon name="settings" className="mr-2 inline-block" /> Validaciones Técnicas</h3>
            <div className="ra-detail-grid">
              <div className="ra-detail-item"><span className="label">Integridad Verificada</span><span className="value">{tc.integrity_verified ? '✅ Sí' : '❌ No'}</span></div>
              <div className="ra-detail-item"><span className="label">Resultado</span><span className="value">{resultBadge(tc.integrity_result)}</span></div>
              <div className="ra-detail-item"><span className="label">Total Tablas</span><span className="value">{tc.total_tables ?? 'N/A'}</span></div>
              <div className="ra-detail-item"><span className="label">Registros Críticos</span><span className="value">{tc.critical_record_count ?? 'N/A'}</span></div>
              <div className="ra-detail-item"><span className="label">Consistencia Validada</span><span className="value">{tc.data_consistency_validated ? '✅ Sí' : '❌ No'}</span></div>
              <div className="ra-detail-item"><span className="label">Checksum</span><span className="value">{tc.checksum_match === null ? 'N/A' : tc.checksum_match ? '✅ Coincide' : '❌ No coincide'}</span></div>
              {tc.integrity_observations && <div className="ra-detail-item full-width"><span className="label">Obs. Integridad</span><span className="value">{tc.integrity_observations}</span></div>}
              {tc.log_errors_detected && <div className="ra-detail-item full-width"><span className="label">Errores en Logs</span><span className="value">{tc.log_errors_detected}</span></div>}
              {tc.log_errors_observations && <div className="ra-detail-item full-width"><span className="label">Obs. Errores</span><span className="value">{tc.log_errors_observations}</span></div>}
            </div>
          </div>
        )}

        {/* Functional Checks */}
        {fc && (
          <div className="ra-detail-section">
            <h3><Icon name="checkCircle" className="mr-2 inline-block" /> Validaciones Funcionales</h3>
            <div className="ra-detail-grid">
              {[
                { label: 'Autenticación', result: fc.auth_result, obs: fc.auth_observations },
                { label: 'Módulos Críticos', result: fc.critical_modules_result, obs: fc.critical_modules_observations },
                { label: 'APIs Principales', result: fc.main_apis_result, obs: fc.main_apis_observations },
                { label: 'Operaciones Sensibles', result: fc.sensitive_operations_result, obs: fc.sensitive_operations_observations },
                { label: 'Panel Admin', result: fc.admin_panel_result, obs: fc.admin_panel_observations }
              ].map((item, i) => (
                <React.Fragment key={i}>
                  <div className="ra-detail-item">
                    <span className="label">{item.label}</span>
                    <span className="value">{resultBadge(item.result)}</span>
                  </div>
                  {item.obs && <div className="ra-detail-item"><span className="label">Obs.</span><span className="value" style={{ fontSize: '0.82rem' }}>{item.obs}</span></div>}
                </React.Fragment>
              ))}
            </div>
          </div>
        )}

        {/* Operational Impact */}
        {oi && (
          <div className="ra-detail-section">
            <h3><Icon name="alertTriangle" className="mr-2 inline-block" /> Impacto Operativo</h3>
            <div className="ra-detail-grid">
              <div className="ra-detail-item"><span className="label">Downtime</span><span className="value">{oi.had_downtime ? `✅ Sí — ${oi.downtime_minutes} min` : '❌ No'}</span></div>
              <div className="ra-detail-item"><span className="label">Usuarios Afectados</span><span className="value">{oi.estimated_affected_users ?? 0}</span></div>
              <div className="ra-detail-item"><span className="label">Severidad</span><span className="value">{severityBadge(oi.severity)}</span></div>
              <div className="ra-detail-item"><span className="label">Reintento</span><span className="value">{oi.needed_retry ? '✅ Sí' : '❌ No'}</span></div>
              <div className="ra-detail-item"><span className="label">Rollback</span><span className="value">{oi.needed_rollback ? '✅ Sí' : '❌ No'}</span></div>
              {oi.observations && <div className="ra-detail-item full-width"><span className="label">Observaciones</span><span className="value">{oi.observations}</span></div>}
            </div>
          </div>
        )}

        {/* Confirmation */}
        {confirmation && (
          <div className="ra-detail-section" style={{ borderColor: 'rgba(34,197,94,0.3)' }}>
            <h3><Icon name="lock" className="mr-2 inline-block" /> Confirmación Formal</h3>
            <div className="ra-detail-grid">
              <div className="ra-detail-item"><span className="label">Confirmado Por</span><span className="value">{confirmation.admin_username}</span></div>
              <div className="ra-detail-item"><span className="label">Fecha</span><span className="value">{formatDate(confirmation.confirmed_at)}</span></div>
              <div className="ra-detail-item"><span className="label">Acepta Responsabilidad</span><span className="value">{confirmation.accepts_responsibility ? '✅ Sí' : '❌ No'}</span></div>
              {confirmation.final_comments && <div className="ra-detail-item full-width"><span className="label">Comentarios Finales</span><span className="value">{confirmation.final_comments}</span></div>}
            </div>
          </div>
        )}
      </div>
    )
  }

  // ============================================
  // RENDER STATS
  // ============================================

  const renderStats = () => {
    if (!stats) return <div className="ra-loading"><Spinner /></div>
    return (
      <div>
        <div className="ra-stats-grid">
          <div className="ra-stat-card"><div className="stat-icon"><Icon name="chart" size={28} /></div><div className="stat-value">{stats.total_restorations}</div><div className="stat-label">Total Restauraciones</div></div>
          <div className="ra-stat-card"><div className="stat-icon"><Icon name="checkCircle" size={28} /></div><div className="stat-value">{stats.confirmed}</div><div className="stat-label">Confirmadas</div></div>
          <div className="ra-stat-card"><div className="stat-icon"><Icon name="clock" size={28} /></div><div className="stat-value">{stats.pending_confirmation}</div><div className="stat-label">Pendientes</div></div>
          <div className="ra-stat-card"><div className="stat-icon"><Icon name="clock" size={28} /></div><div className="stat-value">{stats.avg_duration_formatted}</div><div className="stat-label">Duración Promedio</div></div>
          <div className="ra-stat-card"><div className="stat-icon"><Icon name="chevronDown" size={28} /></div><div className="stat-value">{stats.total_downtime_minutes}m</div><div className="stat-label">Downtime Acumulado</div></div>
          <div className="ra-stat-card"><div className="stat-icon"><Icon name="alertTriangle" size={28} /></div><div className="stat-value">{stats.error_rate_percent}%</div><div className="stat-label">Tasa de Errores</div></div>
          <div className="ra-stat-card"><div className="stat-icon"><Icon name="alertTriangle" size={28} className="text-red-500" /></div><div className="stat-value">{stats.critical_impact_rate_percent}%</div><div className="stat-label">Tasa Impacto Crítico</div></div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '1.5rem' }}>
          {/* By Environment */}
          <div className="ra-detail-section">
            <h3><Icon name="server" className="mr-2 inline-block" /> Por Entorno</h3>
            <table className="ra-dist-table">
              <thead><tr><th>Entorno</th><th>Cantidad</th></tr></thead>
              <tbody>
                {(stats.by_environment || []).map((r, i) => (
                  <tr key={i}><td>{(r.environment || '').toUpperCase()}</td><td>{r.count}</td></tr>
                ))}
                {(!stats.by_environment || stats.by_environment.length === 0) && <tr><td colSpan={2} style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>Sin datos</td></tr>}
              </tbody>
            </table>
          </div>

          {/* By Severity */}
          <div className="ra-detail-section">
            <h3><Icon name="alertTriangle" className="mr-2 inline-block" /> Por Severidad</h3>
            <table className="ra-dist-table">
              <thead><tr><th>Severidad</th><th>Cantidad</th></tr></thead>
              <tbody>
                {(stats.by_severity || []).map((r, i) => (
                  <tr key={i}><td>{severityBadge(r.severity)}</td><td>{r.count}</td></tr>
                ))}
                {(!stats.by_severity || stats.by_severity.length === 0) && <tr><td colSpan={2} style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>Sin datos</td></tr>}
              </tbody>
            </table>
          </div>

          {/* By Admin */}
          <div className="ra-detail-section">
            <h3><Icon name="user" className="mr-2 inline-block" /> Por Administrador</h3>
            <table className="ra-dist-table">
              <thead><tr><th>Admin</th><th>Cantidad</th></tr></thead>
              <tbody>
                {(stats.by_admin || []).map((r, i) => (
                  <tr key={i}><td>{r.admin_username}</td><td>{r.count}</td></tr>
                ))}
                {(!stats.by_admin || stats.by_admin.length === 0) && <tr><td colSpan={2} style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>Sin datos</td></tr>}
              </tbody>
            </table>
          </div>

          {/* By Reason */}
          <div className="ra-detail-section">
            <h3><Icon name="fileText" className="mr-2 inline-block" /> Por Causa</h3>
            <table className="ra-dist-table">
              <thead><tr><th>Motivo</th><th>Cantidad</th></tr></thead>
              <tbody>
                {(stats.by_reason || []).map((r, i) => (
                  <tr key={i}><td style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.reason}</td><td>{r.count}</td></tr>
                ))}
                {(!stats.by_reason || stats.by_reason.length === 0) && <tr><td colSpan={2} style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>Sin datos</td></tr>}
              </tbody>
            </table>
          </div>

          {/* Monthly Trend */}
          <div className="ra-detail-section" style={{ gridColumn: '1 / -1' }}>
            <h3><Icon name="chart" className="mr-2 inline-block" /> Tendencia Mensual</h3>
            <table className="ra-dist-table">
              <thead><tr><th>Mes</th><th>Restauraciones</th></tr></thead>
              <tbody>
                {(stats.monthly_trend || []).map((r, i) => (
                  <tr key={i}><td>{r.month}</td><td>{r.count}</td></tr>
                ))}
                {(!stats.monthly_trend || stats.monthly_trend.length === 0) && <tr><td colSpan={2} style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>Sin datos</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    )
  }

  // ============================================
  // MAIN RENDER
  // ============================================

  return (
    <div className="restore-audit-page">
      <div className="page-header">
        <div>
          <h1><Icon name="refresh" className="mr-2 inline-block" /> Auditoría de Restauraciones</h1>
          <p>Registro, validación y trazabilidad de restauraciones de base de datos</p>
        </div>
      </div>

      {error && <div className="ra-error-msg"><Icon name="xCircle" className="mr-2 inline-block" /> {error}</div>}
      {success && <div className="ra-success-msg"><Icon name="checkCircle" className="mr-2 inline-block" /> {success}</div>}

      {/* Tabs */}
      {!selectedEvent && (
        <div className="ra-tabs">
          <button className={`ra-tab-btn ${activeTab === 'history' ? 'active' : ''}`} onClick={() => setActiveTab('history')}>
            <Icon name="fileText" className="mr-1 inline-block" /> Historial
          </button>
          <button className={`ra-tab-btn ${activeTab === 'new' ? 'active' : ''}`} onClick={() => { setActiveTab('new'); resetWizard() }}>
            <Icon name="plus" className="mr-1 inline-block" /> Nueva Restauración
          </button>
          <button className={`ra-tab-btn ${activeTab === 'stats' ? 'active' : ''}`} onClick={() => setActiveTab('stats')}>
            <Icon name="chart" className="mr-1 inline-block" /> Estadísticas
          </button>
        </div>
      )}

      {/* History Tab */}
      {activeTab === 'history' && !selectedEvent && (
        <Card className="glass-panel" style={{ padding: '1.5rem' }}>
          <div className="ra-history-filters">
            <input type="date" value={filters.start_date} onChange={e => setFilters(f => ({ ...f, start_date: e.target.value }))} placeholder="Desde" />
            <input type="date" value={filters.end_date} onChange={e => setFilters(f => ({ ...f, end_date: e.target.value }))} placeholder="Hasta" />
            <select value={filters.environment} onChange={e => setFilters(f => ({ ...f, environment: e.target.value }))}>
              <option value="">Todos los entornos</option>
              <option value="dev">Desarrollo</option>
              <option value="staging">Staging</option>
              <option value="produccion">Producción</option>
            </select>
            <select value={filters.severity} onChange={e => setFilters(f => ({ ...f, severity: e.target.value }))}>
              <option value="">Todas las severidades</option>
              <option value="bajo">Bajo</option>
              <option value="medio">Medio</option>
              <option value="alto">Alto</option>
              <option value="critico">Crítico</option>
            </select>
            <select value={filters.is_confirmed} onChange={e => setFilters(f => ({ ...f, is_confirmed: e.target.value }))}>
              <option value="">Todos</option>
              <option value="true">Confirmados</option>
              <option value="false">Pendientes</option>
            </select>
            <button className="ra-btn ra-btn-secondary" onClick={fetchEvents} style={{ padding: '8px 14px' }}><span><Icon name="search" className="mr-2 inline-block" /> Filtrar</span></button>
            <button className="ra-btn ra-btn-secondary" onClick={handleExport} style={{ padding: '8px 14px' }}><span><Icon name="download" className="mr-2 inline-block" /> Exportar CSV</span></button>
          </div>

          {loading ? (
            <div className="ra-loading"><Spinner /></div>
          ) : events.length === 0 ? (
            <div className="ra-empty">
              <div className="icon"><Icon name="fileText" size={48} /></div>
              <p>No hay restauraciones registradas</p>
              <button className="ra-btn ra-btn-primary" onClick={() => { setActiveTab('new'); resetWizard() }} style={{ marginTop: '1rem' }}>
                <span><Icon name="plus" className="mr-2 inline-block" /> Registrar Primera Restauración</span>
              </button>
            </div>
          ) : (
            <div className="ra-table-wrap">
              <table className="ra-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Fecha</th>
                    <th>BD</th>
                    <th>Entorno</th>
                    <th>Admin</th>
                    <th>Duración</th>
                    <th>Severidad</th>
                    <th>Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {events.map(ev => (
                    <tr key={ev.id} onClick={() => { fetchEventDetail(ev.id); setActiveTab('detail') }}>
                      <td style={{ fontFamily: 'monospace', fontWeight: 700 }}>#{ev.id}</td>
                      <td style={{ whiteSpace: 'nowrap' }}>{formatDate(ev.created_at)}</td>
                      <td>{ev.database_name}</td>
                      <td><span className="ra-badge ra-badge-info">{(ev.environment || '').toUpperCase()}</span></td>
                      <td>{ev.admin_username}</td>
                      <td>{formatDuration(ev.duration_seconds)}</td>
                      <td>{severityBadge(ev.severity)}</td>
                      <td>
                        {ev.is_confirmed
                          ? <span className="ra-badge ra-badge-success"><Icon name="lock" size={14} className="mr-1 inline-block" /> Confirmado</span>
                          : <span className="ra-badge ra-badge-warning"><Icon name="clock" size={14} className="mr-1 inline-block" /> Pendiente</span>
                        }
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      {/* Detail Tab */}
      {(activeTab === 'detail' || selectedEvent) && renderDetail()}

      {/* New Restoration Wizard */}
      {activeTab === 'new' && !selectedEvent && (
        <Card className="glass-panel" style={{ padding: '1.5rem' }}>
          {renderWizardStepIndicator()}
          {wizardStep === 0 && renderStep0()}
          {wizardStep === 1 && renderStep1()}
          {wizardStep === 2 && renderStep2()}
          {wizardStep === 3 && renderStep3()}
          {wizardStep === 4 && renderStep4()}
        </Card>
      )}

      {/* Stats Tab */}
      {activeTab === 'stats' && !selectedEvent && renderStats()}
    </div>
  )
}

export default RestoreAudit
