// components/DatabaseMonitor.jsx
import React, { useState, useEffect, useRef } from 'react'
import { Card, Badge, Spinner, Alert } from '../components'
import './DatabaseMonitor.css'

const DatabaseMonitor = () => {
  const [monitoringData, setMonitoringData] = useState(null)
  const [isConnected, setIsConnected] = useState(false)
  const [error, setError] = useState(null)
  const [autoRefresh, setAutoRefresh] = useState(true)
  const wsRef = useRef(null)

  useEffect(() => {
    if (autoRefresh) {
      connectWebSocket()
    }

    return () => {
      if (wsRef.current) {
        wsRef.current.close()
      }
    }
  }, [autoRefresh])

  const connectWebSocket = () => {
    try {
      const wsUrl = 'ws://localhost:8000/api/monitoring/ws'
      wsRef.current = new WebSocket(wsUrl)

      wsRef.current.onopen = () => {
        console.log('✅ WebSocket conectado')
        setIsConnected(true)
        setError(null)
      }

      wsRef.current.onmessage = event => {
        const data = JSON.parse(event.data)
        setMonitoringData(data.data)
      }

      wsRef.current.onerror = err => {
        console.error('❌ WebSocket error:', err)
        setError('Error de conexión WebSocket')
        setIsConnected(false)
      }

      wsRef.current.onclose = () => {
        console.log('🔌 WebSocket cerrado')
        setIsConnected(false)

        // Intentar reconectar después de 5 segundos
        if (autoRefresh) {
          setTimeout(() => {
            connectWebSocket()
          }, 5000)
        }
      }
    } catch (err) {
      console.error('❌ Error creando WebSocket:', err)
      setError('No se pudo conectar al servidor de monitoreo')
    }
  }

  const formatUptime = seconds => {
    const days = Math.floor(seconds / 86400)
    const hours = Math.floor((seconds % 86400) / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    return `${days}d ${hours}h ${minutes}m`
  }

  const getStatusColor = status => {
    if (status === 'healthy') return 'success'
    if (status === 'warning') return 'warning'
    return 'danger'
  }

  const getConnectionHealthStatus = usage => {
    if (usage < 50) return { status: 'healthy', text: 'Saludable' }
    if (usage < 80) return { status: 'warning', text: 'Advertencia' }
    return { status: 'critical', text: 'Crítico' }
  }

  if (!monitoringData) {
    return (
      <div className='database-monitor'>
        <Card>
          <Spinner text='Conectando al sistema de monitoreo...' />
        </Card>
      </div>
    )
  }

  const { database, performance, sessions, system } = monitoringData
  const connectionHealth = getConnectionHealthStatus(
    database?.connections?.usage_percent || 0
  )

  return (
    <div className='database-monitor'>
      {/* HEADER */}
      <div className='monitor-header'>
        <div>
          <h1>Monitor de Base de Datos en Tiempo Real</h1>
          <p className='monitor-subtitle'>
            Actualizado: {new Date().toLocaleTimeString('es-MX')}
          </p>
        </div>
        <div className='monitor-controls'>
          <Badge
            variant={isConnected ? 'success' : 'danger'}
            dot
            className='connection-status'
          >
            {isConnected ? 'Conectado' : 'Desconectado'}
          </Badge>
          <label className='auto-refresh-toggle'>
            <input
              type='checkbox'
              checked={autoRefresh}
              onChange={e => setAutoRefresh(e.target.checked)}
            />
            <span>Auto-actualizar</span>
          </label>
        </div>
      </div>

      {error && (
        <Alert
          type='error'
          message={error}
          closable
          onClose={() => setError(null)}
        />
      )}

      {/* ESTADO GENERAL */}
      <div className='monitor-grid'>
        <Card className='status-overview'>
          <h3>Estado General</h3>
          <div className='status-item'>
            <span className='status-label'>Base de Datos:</span>
            <Badge variant={getStatusColor(database?.status)}>
              {database?.status === 'healthy' ? 'Saludable' : 'Error'}
            </Badge>
          </div>
          <div className='status-item'>
            <span className='status-label'>Tiempo Activo:</span>
            <span className='status-value'>
              {formatUptime(database?.uptime || 0)}
            </span>
          </div>
          <div className='status-item'>
            <span className='status-label'>Sesiones Activas:</span>
            <span className='status-value'>
              {sessions?.active_sessions || 0}
            </span>
          </div>
        </Card>

        {/* CONEXIONES */}
        <Card className='connections-card'>
          <h3>Conexiones</h3>
          <div className='metric-row'>
            <span>Activas:</span>
            <strong>{database?.connections?.active || 0}</strong>
          </div>
          <div className='metric-row'>
            <span>En Ejecución:</span>
            <strong>{database?.connections?.running || 0}</strong>
          </div>
          <div className='metric-row'>
            <span>Máximo:</span>
            <strong>{database?.connections?.max || 0}</strong>
          </div>
          <div className='usage-bar'>
            <div className='usage-label'>
              <span>Uso</span>
              <Badge variant={getStatusColor(connectionHealth.status)}>
                {database?.connections?.usage_percent || 0}%
              </Badge>
            </div>
            <div className='progress-bar'>
              <div
                className={`progress-fill ${connectionHealth.status}`}
                style={{
                  width: `${database?.connections?.usage_percent || 0}%`
                }}
              ></div>
            </div>
          </div>
        </Card>

        {/* RENDIMIENTO */}
        <Card className='performance-card'>
          <h3>Rendimiento</h3>
          <div className='metric-row'>
            <span>Buffer Pool Hit:</span>
            <strong>{performance?.buffer_pool?.hit_ratio || 0}%</strong>
          </div>
          <div className='metric-row'>
            <span>Tamaño Buffer:</span>
            <strong>{performance?.buffer_pool?.size_mb || 0} MB</strong>
          </div>
          <div className='metric-row'>
            <span>Consultas Totales:</span>
            <strong>{(database?.queries?.total || 0).toLocaleString()}</strong>
          </div>
          <div className='metric-row'>
            <span>Consultas Lentas:</span>
            <Badge
              variant={
                (database?.queries?.slow || 0) > 10 ? 'warning' : 'success'
              }
            >
              {database?.queries?.slow || 0}
            </Badge>
          </div>
        </Card>

        {/* RECURSOS DEL SISTEMA */}
        <Card className='system-card'>
          <h3>Recursos del Sistema</h3>

          <div className='resource-metric'>
            <div className='resource-header'>
              <span>CPU</span>
              <strong>{system?.cpu?.percent || 0}%</strong>
            </div>
            <div className='progress-bar'>
              <div
                className={`progress-fill ${system?.cpu?.percent > 80 ? 'critical' : system?.cpu?.percent > 50 ? 'warning' : 'healthy'}`}
                style={{ width: `${system?.cpu?.percent || 0}%` }}
              ></div>
            </div>
          </div>

          <div className='resource-metric'>
            <div className='resource-header'>
              <span>Memoria</span>
              <strong>{system?.memory?.percent || 0}%</strong>
            </div>
            <div className='progress-bar'>
              <div
                className={`progress-fill ${system?.memory?.percent > 80 ? 'critical' : system?.memory?.percent > 50 ? 'warning' : 'healthy'}`}
                style={{ width: `${system?.memory?.percent || 0}%` }}
              ></div>
            </div>
            <div className='resource-detail'>
              {system?.memory?.used_mb || 0} MB /{' '}
              {system?.memory?.total_mb || 0} MB
            </div>
          </div>

          <div className='resource-metric'>
            <div className='resource-header'>
              <span>Disco</span>
              <strong>{system?.disk?.percent || 0}%</strong>
            </div>
            <div className='progress-bar'>
              <div
                className={`progress-fill ${system?.disk?.percent > 80 ? 'critical' : system?.disk?.percent > 50 ? 'warning' : 'healthy'}`}
                style={{ width: `${system?.disk?.percent || 0}%` }}
              ></div>
            </div>
            <div className='resource-detail'>
              {system?.disk?.used_gb || 0} GB / {system?.disk?.total_gb || 0} GB
            </div>
          </div>
        </Card>
      </div>

      {/* SESIONES ACTIVAS */}
      {sessions?.sessions && sessions.sessions.length > 0 && (
        <Card className='sessions-card'>
          <h3>Sesiones Activas ({sessions.sessions.length})</h3>
          <div className='sessions-table'>
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Usuario</th>
                  <th>Host</th>
                  <th>Base de Datos</th>
                  <th>Comando</th>
                  <th>Tiempo (s)</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                {sessions.sessions.slice(0, 10).map(session => (
                  <tr key={session.id}>
                    <td>{session.id}</td>
                    <td>{session.user}</td>
                    <td className='host-cell'>{session.host}</td>
                    <td>{session.database || '-'}</td>
                    <td>
                      <Badge
                        variant={
                          session.command === 'Query' ? 'primary' : 'default'
                        }
                      >
                        {session.command}
                      </Badge>
                    </td>
                    <td>{session.time}</td>
                    <td className='state-cell'>{session.state || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  )
}

export default DatabaseMonitor
