import React, { useState, useEffect } from 'react'
import { Card, Button, Badge, Modal, SkeletonCard } from '../components'
import Alert from './Alert/Alert'
import Icon from './Icons'
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
    { value: 'hourly', label: 'Cada Hora', icon: 'clock' },
    { value: 'daily', label: 'Diario', icon: 'calendar' },
    { value: 'weekly', label: 'Semanal', icon: 'calendar' },
    { value: 'monthly', label: 'Mensual', icon: 'chart' }
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

  const footer = (
    <div className="config-actions-footer">
      <Button variant="secondary" onClick={onClose} disabled={loading} style={{ border: '1px solid #ddd' }}>
        Cancelar
      </Button>
      {config.enabled && (
        <Button
          variant="secondary"
          onClick={handleTestBackup}
          disabled={loading}
          style={{ border: '1px solid #ddd' }}
        >
          <Icon name="refresh" size={16} className="mr-2" /> Prueba
        </Button>
      )}
      <Button
        variant="primary"
        onClick={handleSaveConfig}
        disabled={loading}
        style={{ minWidth: '200px' }}
      >
        <Icon name="save" size={16} className="mr-2" /> Guardar Configuración
      </Button>
    </div>
  )

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ background: '#000', color: '#fff', padding: '6px', borderRadius: '4px', display: 'flex' }}>
            <Icon name="settings" size={18} />
          </div>
          <span style={{ fontWeight: '900', letterSpacing: '1px' }}>CONFIGURACIÓN DE RESPALDOS</span>
        </div>
      }
      size="large"
      footer={footer}
    >
      <div className="automatic-backup-config">
        {loading ? (
          <div style={{ padding: '1rem' }}>
            <SkeletonCard count={3} />
          </div>
        ) : (
          <>
            {/* Estado Actual */}
            <div className="status-grid">
              <div className="status-item-mini">
                <small>ESTADO</small>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                  <div className={`status-dot ${config.enabled ? 'active' : 'inactive'}`} />
                  <span style={{ fontWeight: '800', fontSize: '1rem' }}>{config.enabled ? 'ACTIVO' : 'OFF'}</span>
                </div>
              </div>

              <div className="status-item-mini">
                <small>PRÓXIMO EVENTO</small>
                <div style={{ fontWeight: '800', marginTop: '4px' }}>{getNextBackupText()}</div>
              </div>

              <div className="status-item-mini">
                <small>ÚLTIMA EJECUCIÓN</small>
                <div style={{ fontWeight: '800', marginTop: '4px' }}>
                  {lastBackup ? new Date(lastBackup).toLocaleString('es-MX', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: 'short' }) : 'NUNCA'}
                </div>
              </div>

              <div className="status-item-mini">
                <small>HISTORIAL</small>
                <div style={{ fontWeight: '800', marginTop: '4px' }}>{scheduledBackups.length} archivos</div>
              </div>
            </div>

            {/* Configuración Principal */}
            <div className="config-container-industrial">
              <div className="config-main-toggle">
                <div style={{ flex: 1 }}>
                  <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: '900' }}>AUTOMATIZACIÓN DE RESPALDOS</h3>
                  <p style={{ margin: '4px 0 0', fontSize: '0.75rem', color: '#888' }}>El sistema gestionará copias de seguridad automáticas basadas en estos parámetros.</p>
                </div>
                <label className="premium-toggle">
                  <input
                    type="checkbox"
                    checked={config.enabled}
                    onChange={(e) => handleConfigChange('enabled', e.target.checked)}
                  />
                  <span className="premium-slider"></span>
                </label>
              </div>

              {config.enabled && (
                <div className="industrial-settings-pane">
                  {/* Frecuencia Row */}
                  <div className="settings-row">
                    <div className="settings-label">
                       <Icon name="calendar" size={14} />
                       <span>FRECUENCIA</span>
                    </div>
                    <div className="settings-control">
                      <div className="segmented-control">
                        {frequencyOptions.map(option => (
                          <button
                            key={option.value}
                            className={config.frequency === option.value ? 'active' : ''}
                            onClick={() => handleConfigChange('frequency', option.value)}
                          >
                            {option.label.toUpperCase()}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Programación Dinámica */}
                  {(config.frequency === 'weekly' || config.frequency === 'monthly' || config.frequency !== 'hourly') && (
                    <div className="settings-row">
                      <div className="settings-label">
                         <Icon name="clock" size={14} />
                         <span>PROGRAMACIÓN</span>
                      </div>
                      <div className="settings-control" style={{ display: 'flex', gap: '10px' }}>
                        {config.frequency === 'weekly' && (
                          <select
                            value={config.dayOfWeek}
                            onChange={(e) => handleConfigChange('dayOfWeek', parseInt(e.target.value))}
                            className="industrial-select"
                          >
                            {daysOfWeek.map((day, index) => (
                              <option key={index} value={index}>{day}</option>
                            ))}
                          </select>
                        )}
                        {config.frequency === 'monthly' && (
                          <input
                            type="number"
                            min="1"
                            max="31"
                            value={config.dayOfMonth}
                            onChange={(e) => handleConfigChange('dayOfMonth', parseInt(e.target.value))}
                            className="industrial-input"
                            style={{ width: '80px' }}
                            placeholder="Día"
                          />
                        )}
                        {config.frequency !== 'hourly' && (
                          <input
                            type="time"
                            value={config.time}
                            onChange={(e) => handleConfigChange('time', e.target.value)}
                            className="industrial-input"
                          />
                        )}
                      </div>
                    </div>
                  )}

                  {/* Tipo de Respaldo */}
                  <div className="settings-row">
                    <div className="settings-label">
                       <Icon name="database" size={14} />
                       <span>MODO DE COPIA</span>
                    </div>
                    <div className="settings-control" style={{ display: 'flex', gap: '8px' }}>
                      {backupTypeOptions.map(option => (
                        <button
                          key={option.value}
                          className={`type-tag ${config.backupType === option.value ? 'active' : ''}`}
                          onClick={() => handleConfigChange('backupType', option.value)}
                        >
                          {option.label.toUpperCase()}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Retención */}
                  <div className="settings-row">
                    <div className="settings-label">
                       <Icon name="trash" size={14} />
                       <span>RETENCIÓN</span>
                    </div>
                    <div className="settings-control" style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                      <input
                        type="number"
                        min="1"
                        value={config.retentionDays}
                        onChange={(e) => handleConfigChange('retentionDays', parseInt(e.target.value))}
                        className="industrial-input"
                        style={{ width: '80px' }}
                      />
                      <span style={{ fontSize: '0.7rem', fontWeight: '800', color: '#888' }}>DÍAS</span>
                      
                      <div style={{ width: '1px', height: '15px', background: '#ddd', margin: '0 5px' }} />
                      
                      <input
                        type="number"
                        min="1"
                        value={config.maxBackups}
                        onChange={(e) => handleConfigChange('maxBackups', parseInt(e.target.value))}
                        className="industrial-input"
                        style={{ width: '80px' }}
                      />
                      <span style={{ fontSize: '0.7rem', fontWeight: '800', color: '#888' }}>FILES</span>
                    </div>
                  </div>

                  {/* Notificaciones */}
                  <div className="settings-row" style={{ borderBottom: 'none' }}>
                    <div className="settings-label">
                       <Icon name="bell" size={14} />
                       <span>ALERTAS</span>
                    </div>
                    <div className="settings-control" style={{ display: 'flex', gap: '15px' }}>
                      <label className="industrial-checkbox">
                        <input
                          type="checkbox"
                          checked={config.notifyOnSuccess}
                          onChange={(e) => handleConfigChange('notifyOnSuccess', e.target.checked)}
                        />
                        <span>EXITO</span>
                      </label>
                      <label className="industrial-checkbox">
                        <input
                          type="checkbox"
                          checked={config.notifyOnError}
                          onChange={(e) => handleConfigChange('notifyOnError', e.target.checked)}
                        />
                        <span>ERROR</span>
                      </label>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {config.enabled && (
              <div className="industrial-summary">
                 <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                   <Icon name="info" size={16} color="var(--primary)" />
                   <strong style={{ fontSize: '0.7rem', letterSpacing: '0.5px' }}>CONFIGURACIÓN ACTUAL DE SEGURIDAD</strong>
                 </div>
                 <div className="summary-pills">
                   <div className="pill">FRECUENCIA: {config.frequency.toUpperCase()}</div>
                   {config.frequency !== 'hourly' && <div className="pill">HORA: {config.time}</div>}
                   <div className="pill">MODO: {config.backupType.toUpperCase()}</div>
                   <div className="pill">LÍMITE: {config.maxBackups} ARCHIVOS</div>
                 </div>
              </div>
            )}
          </>
        )}
      </div>
    </Modal>
  )
}

export default AutomaticBackupConfig
