import React, { useState, useEffect } from 'react'
import { Card, Button, Badge, Alert, Modal, Spinner } from '../components'
import api from '../services/api'
import { useNotification } from '../context/NotificationContext'
import './AutomaticBackupConfig.css'

/**
 * Componente para configurar respaldos automáticos periódicos
 */
const AutomaticBackupConfig = ({ isOpen, onClose }) => {
  const { success, error: showError } = useNotification()
  const [loading, setLoading] = useState(false)
  const [config, setConfig] = useState({
    enabled: false,
    frequency: 'daily', // daily, weekly, monthly
    time: '02:00', // HH:MM formato 24h
    backupType: 'completo', // completo, incremental
    retentionDays: 30, // Días para mantener respaldos
    maxBackups: 10, // Máximo número de respaldos a conservar
    notifyOnSuccess: true,
    notifyOnError: true,
    dayOfWeek: 0, // 0 = Domingo, 6 = Sábado (para weekly)
    dayOfMonth: 1 // 1-31 (para monthly)
  })

  const [scheduledBackups, setScheduledBackups] = useState([])
  const [lastBackup, setLastBackup] = useState(null)
  const [nextBackup, setNextBackup] = useState(null)

  useEffect(() => {
    if (isOpen) {
      loadBackupConfig()
      loadScheduledBackups()
    }
  }, [isOpen])

  const loadBackupConfig = async () => {
    setLoading(true)
    try {
      const response = await api.database.getAutomaticBackupConfig()
      setConfig(response.config || config)
      setLastBackup(response.lastBackup)
      setNextBackup(response.nextBackup)
    } catch (error) {
      console.error('Error al cargar configuración:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadScheduledBackups = async () => {
    try {
      const response = await api.database.getScheduledBackups()
      setScheduledBackups(response.scheduled || [])
    } catch (error) {
      console.error('Error al cargar respaldos programados:', error)
    }
  }

  const handleConfigChange = (key, value) => {
    setConfig(prev => ({ ...prev, [key]: value }))
  }

  const handleSaveConfig = async () => {
    setLoading(true)
    try {
      await api.database.updateAutomaticBackupConfig(config)
      success('Configuración de respaldos automáticos guardada')
      loadBackupConfig()
    } catch (error) {
      console.error('Error al guardar configuración:', error)
      showError('Error al guardar configuración de respaldos')
    } finally {
      setLoading(false)
    }
  }

  const handleTestBackup = async () => {
    setLoading(true)
    try {
      await api.database.createBackup(config.backupType)
      success('Respaldo de prueba creado exitosamente')
      loadBackupConfig()
    } catch (error) {
      console.error('Error al crear respaldo de prueba:', error)
      showError('Error al crear respaldo de prueba')
    } finally {
      setLoading(false)
    }
  }

  const frequencyOptions = [
    { value: 'hourly', label: '⏱️ Cada Hora', icon: '⏱️' },
    { value: 'daily', label: '📅 Diario', icon: '📅' },
    { value: 'weekly', label: '📆 Semanal', icon: '📆' },
    { value: 'monthly', label: '📊 Mensual', icon: '📊' }
  ]

  const backupTypeOptions = [
    { value: 'completo', label: 'Completo', description: 'Todos los datos' },
    { value: 'incremental', label: 'Incremental', description: 'Solo cambios' }
  ]

  const daysOfWeek = [
    'Domingo', 'Lunes', 'Martes', 'Miércoles', 
    'Jueves', 'Viernes', 'Sábado'
  ]

  const getNextBackupText = () => {
    if (!config.enabled) return 'Deshabilitado'
    if (!nextBackup) return 'Calculando...'
    
    const date = new Date(nextBackup)
    const now = new Date()
    const diff = date - now
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
    
    if (hours < 1) return `En ${minutes} minutos`
    if (hours < 24) return `En ${hours} horas`
    return date.toLocaleString('es-MX')
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="⚙️ Configuración de Respaldos Automáticos"
      size="large"
    >
      <div className="automatic-backup-config">
        {loading && (
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <Spinner text="Cargando configuración..." />
          </div>
        )}

        {!loading && (
          <>
            {/* Estado Actual */}
            <Card className="backup-status-card">
              <div className="status-grid">
                <div className="status-item">
                  <div className="status-icon" style={{ background: config.enabled ? '#d1fae5' : '#fee2e2' }}>
                    {config.enabled ? '✅' : '⏸️'}
                  </div>
                  <div className="status-info">
                    <p className="status-label">Estado</p>
                    <p className="status-value">
                      <Badge variant={config.enabled ? 'success' : 'default'}>
                        {config.enabled ? 'Activo' : 'Deshabilitado'}
                      </Badge>
                    </p>
                  </div>
                </div>

                <div className="status-item">
                  <div className="status-icon" style={{ background: '#dbeafe' }}>
                    📅
                  </div>
                  <div className="status-info">
                    <p className="status-label">Próximo Respaldo</p>
                    <p className="status-value">{getNextBackupText()}</p>
                  </div>
                </div>

                <div className="status-item">
                  <div className="status-icon" style={{ background: '#fef3c7' }}>
                    📁
                  </div>
                  <div className="status-info">
                    <p className="status-label">Último Respaldo</p>
                    <p className="status-value">
                      {lastBackup ? new Date(lastBackup).toLocaleString('es-MX') : 'Nunca'}
                    </p>
                  </div>
                </div>

                <div className="status-item">
                  <div className="status-icon" style={{ background: '#ddd6fe' }}>
                    🗄️
                  </div>
                  <div className="status-info">
                    <p className="status-label">Respaldos Programados</p>
                    <p className="status-value">{scheduledBackups.length}</p>
                  </div>
                </div>
              </div>
            </Card>

            {/* Toggle Principal */}
            <div className="config-section">
              <div className="section-header">
                <h3>Habilitar Respaldos Automáticos</h3>
                <label className="toggle-switch">
                  <input
                    type="checkbox"
                    checked={config.enabled}
                    onChange={(e) => handleConfigChange('enabled', e.target.checked)}
                  />
                  <span className="toggle-slider"></span>
                </label>
              </div>
              <p className="section-description">
                Cuando está activado, el sistema creará respaldos automáticamente según la configuración
              </p>
            </div>

            {config.enabled && (
              <>
                {/* Frecuencia */}
                <div className="config-section">
                  <h3>Frecuencia de Respaldo</h3>
                  <div className="frequency-options">
                    {frequencyOptions.map(option => (
                      <button
                        key={option.value}
                        className={`frequency-button ${config.frequency === option.value ? 'active' : ''}`}
                        onClick={() => handleConfigChange('frequency', option.value)}
                      >
                        <span className="frequency-icon">{option.icon}</span>
                        <span className="frequency-label">{option.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Configuración Específica por Frecuencia */}
                <div className="config-section">
                  <h3>Programación</h3>
                  
                  {config.frequency === 'weekly' && (
                    <div className="schedule-config">
                      <label>
                        <span>Día de la Semana:</span>
                        <select
                          value={config.dayOfWeek}
                          onChange={(e) => handleConfigChange('dayOfWeek', parseInt(e.target.value))}
                          className="config-select"
                        >
                          {daysOfWeek.map((day, index) => (
                            <option key={index} value={index}>{day}</option>
                          ))}
                        </select>
                      </label>
                    </div>
                  )}

                  {config.frequency === 'monthly' && (
                    <div className="schedule-config">
                      <label>
                        <span>Día del Mes:</span>
                        <input
                          type="number"
                          min="1"
                          max="31"
                          value={config.dayOfMonth}
                          onChange={(e) => handleConfigChange('dayOfMonth', parseInt(e.target.value))}
                          className="config-input"
                        />
                      </label>
                    </div>
                  )}

                  {config.frequency !== 'hourly' && (
                    <div className="schedule-config">
                      <label>
                        <span>Hora de Ejecución:</span>
                        <input
                          type="time"
                          value={config.time}
                          onChange={(e) => handleConfigChange('time', e.target.value)}
                          className="config-input"
                        />
                      </label>
                      <p className="help-text">Formato 24 horas (ej: 02:00 para 2:00 AM)</p>
                    </div>
                  )}
                </div>

                {/* Tipo de Respaldo */}
                <div className="config-section">
                  <h3>Tipo de Respaldo</h3>
                  <div className="backup-type-options">
                    {backupTypeOptions.map(option => (
                      <label
                        key={option.value}
                        className={`backup-type-option ${config.backupType === option.value ? 'selected' : ''}`}
                      >
                        <input
                          type="radio"
                          name="backupType"
                          value={option.value}
                          checked={config.backupType === option.value}
                          onChange={(e) => handleConfigChange('backupType', e.target.value)}
                        />
                        <div className="option-content">
                          <strong>{option.label}</strong>
                          <p>{option.description}</p>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Retención de Respaldos */}
                <div className="config-section">
                  <h3>Retención de Respaldos</h3>
                  
                  <div className="retention-config">
                    <label>
                      <span>📅 Días de Retención:</span>
                      <input
                        type="number"
                        min="1"
                        max="365"
                        value={config.retentionDays}
                        onChange={(e) => handleConfigChange('retentionDays', parseInt(e.target.value))}
                        className="config-input"
                      />
                    </label>
                    <p className="help-text">
                      Los respaldos más antiguos se eliminarán automáticamente
                    </p>
                  </div>

                  <div className="retention-config">
                    <label>
                      <span>🗄️ Máximo de Respaldos:</span>
                      <input
                        type="number"
                        min="1"
                        max="100"
                        value={config.maxBackups}
                        onChange={(e) => handleConfigChange('maxBackups', parseInt(e.target.value))}
                        className="config-input"
                      />
                    </label>
                    <p className="help-text">
                      Número máximo de respaldos a conservar (los más antiguos se eliminarán)
                    </p>
                  </div>
                </div>

                {/* Notificaciones */}
                <div className="config-section">
                  <h3>Notificaciones</h3>
                  
                  <div className="notification-options">
                    <label className="checkbox-option">
                      <input
                        type="checkbox"
                        checked={config.notifyOnSuccess}
                        onChange={(e) => handleConfigChange('notifyOnSuccess', e.target.checked)}
                      />
                      <span>✅ Notificar cuando el respaldo se complete exitosamente</span>
                    </label>

                    <label className="checkbox-option">
                      <input
                        type="checkbox"
                        checked={config.notifyOnError}
                        onChange={(e) => handleConfigChange('notifyOnError', e.target.checked)}
                      />
                      <span>❌ Notificar cuando ocurra un error en el respaldo</span>
                    </label>
                  </div>
                </div>
              </>
            )}

            {/* Resumen de Configuración */}
            {config.enabled && (
              <Alert type="info" closable={false}>
                <strong>📋 Resumen de Configuración:</strong>
                <ul style={{ marginTop: '8px', marginLeft: '20px' }}>
                  <li>
                    Frecuencia: <strong>{frequencyOptions.find(f => f.value === config.frequency)?.label}</strong>
                  </li>
                  {config.frequency !== 'hourly' && (
                    <li>Hora: <strong>{config.time}</strong></li>
                  )}
                  {config.frequency === 'weekly' && (
                    <li>Día: <strong>{daysOfWeek[config.dayOfWeek]}</strong></li>
                  )}
                  {config.frequency === 'monthly' && (
                    <li>Día del mes: <strong>{config.dayOfMonth}</strong></li>
                  )}
                  <li>Tipo: <strong>{config.backupType}</strong></li>
                  <li>Retención: <strong>{config.retentionDays} días</strong> o máximo <strong>{config.maxBackups} respaldos</strong></li>
                </ul>
              </Alert>
            )}

            {/* Botones de Acción */}
            <div className="config-actions">
              <Button
                variant="primary"
                onClick={handleSaveConfig}
                disabled={loading}
                fullWidth
              >
                💾 Guardar Configuración
              </Button>
              
              {config.enabled && (
                <Button
                  variant="secondary"
                  onClick={handleTestBackup}
                  disabled={loading}
                  fullWidth
                >
                  🧪 Crear Respaldo de Prueba Ahora
                </Button>
              )}

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

export default AutomaticBackupConfig
