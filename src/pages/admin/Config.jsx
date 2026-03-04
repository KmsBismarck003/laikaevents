import React, { useState, useEffect } from 'react'
import { Card, Button, Spinner, Alert } from '../../components'
import { useNotification } from '../../context/NotificationContext'
import api from '../../services/api'
import './admin.css'

const Config = () => {
  const { success, error: showError } = useNotification()
  const [loading, setLoading] = useState(true)
  const [systemConfig, setSystemConfig] = useState({
    maintenanceMode: false,
    registrationEnabled: true,
    sessionTimeout: 30,
    maxTicketsPerUser: 5
  })
  const [alert, setAlert] = useState(null)

  useEffect(() => {
    fetchConfig()
  }, [])

  const fetchConfig = async () => {
    setLoading(true)
    try {
        console.log('📤 Obteniendo configuración...')
        const configResponse = await api.config.getConfig()
        console.log('✅ Configuración obtenida:', configResponse)

        setSystemConfig({
          maintenanceMode: configResponse.maintenanceMode || configResponse.maintenance_mode || false,
          registrationEnabled: configResponse.registrationEnabled || configResponse.registration_enabled !== false,
          sessionTimeout: configResponse.sessionTimeout || configResponse.session_timeout || 30,
          maxTicketsPerUser: configResponse.maxTicketsPerUser || configResponse.max_tickets_per_user || 10
        })
    } catch (error) {
        console.error('❌ Error al cargar configuración:', error)
        showError('Error al cargar configuración')
    } finally {
        setLoading(false)
    }
  }

  const handleConfigChange = async (key, value) => {
    try {
      console.log('📤 Actualizando configuración:', key, value)
      // Optimistic update
      setSystemConfig(prev => ({ ...prev, [key]: value }))

      const configKey = key.replace(/([A-Z])/g, '_$1').toLowerCase()
      await api.config.updateParameter(configKey, value)

      console.log('✅ Configuración actualizada')
      setAlert({ type: 'success', message: 'Configuración actualizada' })
      setTimeout(() => setAlert(null), 3000)
    } catch (error) {
      console.error('❌ Error al actualizar configuración:', error)
      showError('Error al actualizar configuración')
      // Revert on error
      fetchConfig()
    }
  }

  if (loading) return <Spinner fullScreen text="Cargando configuración..." />

  return (
    <div className="admin-config-page">
      <div className="page-header">
        <h1>Configuración del Sistema</h1>
        <Button variant="secondary" onClick={fetchConfig} disabled={loading}>
            Actualizar
        </Button>
      </div>

      {alert && (
        <Alert
          type={alert.type}
          message={alert.message}
          onClose={() => setAlert(null)}
        />
      )}

      <Card title="Ajustes Generales">
        <div className="config-grid">
          <div className="config-item">
            <div className="config-info">
              <strong>Modo Mantenimiento</strong>
              <p>Deshabilita el acceso de usuarios al sistema</p>
            </div>
            <label className="toggle-switch">
              <input
                type="checkbox"
                checked={systemConfig.maintenanceMode}
                onChange={(e) => handleConfigChange('maintenanceMode', e.target.checked)}
              />
              <span className="toggle-slider"></span>
            </label>
          </div>

          <div className="config-item">
            <div className="config-info">
              <strong>Registro de Usuarios</strong>
              <p>Permite que nuevos usuarios se registren</p>
            </div>
            <label className="toggle-switch">
              <input
                type="checkbox"
                checked={systemConfig.registrationEnabled}
                onChange={(e) => handleConfigChange('registrationEnabled', e.target.checked)}
              />
              <span className="toggle-slider"></span>
            </label>
          </div>

          <div className="config-item">
            <div className="config-info">
              <strong>Tiempo de Sesión (minutos)</strong>
            </div>
            <input
              type="number"
              className="config-input"
              value={systemConfig.sessionTimeout}
              onChange={(e) => handleConfigChange('sessionTimeout', parseInt(e.target.value))}
              min="5"
              max="120"
            />
          </div>

          <div className="config-item">
            <div className="config-info">
              <strong>Boletos Máximos por Usuario</strong>
            </div>
            <input
              type="number"
              className="config-input"
              value={systemConfig.maxTicketsPerUser}
              onChange={(e) => handleConfigChange('maxTicketsPerUser', parseInt(e.target.value))}
              min="1"
              max="50"
            />
          </div>
        </div>
      </Card>
    </div>
  )
}

export default Config
