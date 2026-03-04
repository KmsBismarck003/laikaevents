import React, { useState, useEffect } from 'react'
import api from '../../services/api'
import { Card, Badge, Button, Spinner } from '../../components'
import './admin.css'

// Simulación de WebSocket/API real
const Monitoring = () => {
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [metrics, setMetrics] = useState(null)
  const [lastUpdate, setLastUpdate] = useState(new Date())

  const fetchMetrics = async () => {
    try {
      const data = await api.monitoring.getSystemStatus()

      // Mapear respuesta del API al estado del componente de forma segura
      const dbStatus = data.database?.status === 'healthy' ? 'online' : 'degraded'
      const dbUptime = data.database?.uptime || 0

      return {
        status: dbStatus,
        uptime: dbUptime ? `${Math.floor(dbUptime / 3600)}h ${Math.floor((dbUptime % 3600) / 60)}m` : 'N/A',
        version: 'MySQL 8.0',
        role: 'Primary',
        mode: 'Read-Write',
        performance: {
          avgResponseTime: 0,
          p95: 0,
          p99: 0,
          qps: data.database?.queries?.total || 0,
          activeConnections: data.database?.connections?.active || 0,
          maxConnections: data.database?.connections?.max || 151,
          poolUsage: data.database?.connections?.usage_percent || 0
        },
        resources: {
          cpu: data.system?.cpu?.percent || 0,
          ram: data.system?.memory?.percent || 0,
          diskTotal: `${data.system?.disk?.total_gb || 0} GB`,
          diskFree: `${data.system?.disk?.free_gb || 0} GB`,
          ioRead: '0 MB/s',
          ioWrite: '0 MB/s'
        },
        health: data.integrity?.is_healthy ? 100 : 50
      }
    } catch (error) {
      console.error('Error fetching metrics:', error)
      return null
    }
  }

  const loadData = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true)
    try {
      const data = await fetchMetrics()
      if (data) {
        setMetrics(data)
        setLastUpdate(new Date())
      }
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    loadData()
    const interval = setInterval(() => loadData(false), 5000) // Polling cada 5s
    return () => clearInterval(interval)
  }, [])

  if (loading) return <Spinner fullScreen text="Cargando métricas del sistema..." />

  if (!metrics) {
    return (
      <div className="admin-monitoring-page">
        <div className="page-header">
           <h1>Monitoreo del Sistema</h1>
        </div>
        <Card className="glass-panel text-center p-4">
          <p className="text-muted" style={{ marginBottom: '1rem' }}>No se pudieron cargar las métricas del sistema.</p>
          <Button onClick={() => loadData(true)}>Reintentar Conexión</Button>
        </Card>
      </div>
    )
  }

  const getHealthColor = (score) => {
    if (score >= 90) return 'var(--success)'
    if (score >= 70) return 'var(--warning)'
    return 'var(--error)'
  }

  return (
    <div className="admin-monitoring-page">
      <div className="page-header">
        <div>
          <h1>Monitoreo del Sistema</h1>
          <p className="subtitle">Estado en tiempo real de la infraestructura</p>
        </div>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <span className="last-update">
            Actualizado: {lastUpdate.toLocaleTimeString()}
          </span>
          <Button onClick={() => loadData(true)} disabled={refreshing}>
            {refreshing ? 'Actualizando...' : 'Refrescar'}
          </Button>
        </div>
      </div>

      {/* HEALTH SCORE BANNER */}
      <div className="glass-panel health-banner" style={{ marginBottom: '2rem', padding: '2rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: `linear-gradient(90deg, ${getHealthColor(metrics.health)}20, transparent)` }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '1.5rem' }}>Salud del Sistema</h2>
          <p style={{ margin: '0.5rem 0 0', opacity: 0.8 }}>Todos los sistemas operativos y estables</p>
        </div>
        <div style={{ textAlign: 'right' }}>
           <span style={{ fontSize: '3rem', fontWeight: '800', color: getHealthColor(metrics.health) }}>
             {metrics.health}%
           </span>
           <div style={{ fontSize: '0.875rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Puntuación</div>
        </div>
      </div>

      <div className="monitoring-grid">
        {/* RESOURCE USAGE */}
        <Card title="Recursos del Servidor" className="glass-panel">
          <div className="resource-bars">
            <div className="resource-item">
              <div className="resource-header">
                <span>CPU Core</span>
                <span style={{ fontWeight: 'bold' }}>{metrics.resources.cpu}%</span>
              </div>
              <div className="progress-bar-bg">
                <div className="progress-bar-fill" style={{ width: `${metrics.resources.cpu}%`, background: 'var(--primary)' }}></div>
              </div>
            </div>

            <div className="resource-item">
              <div className="resource-header">
                <span>Memoria RAM</span>
                <span style={{ fontWeight: 'bold' }}>{metrics.resources.ram}%</span>
              </div>
              <div className="progress-bar-bg">
                <div className="progress-bar-fill" style={{ width: `${metrics.resources.ram}%`, background: 'var(--warning)' }}></div>
              </div>
            </div>

            <div className="resource-stats-mini">
              <div>
                <small>Disco Libre</small>
                <strong>{metrics.resources.diskFree}</strong>
              </div>
              <div>
                <small>I/O Lectura</small>
                <strong>{metrics.resources.ioRead}</strong>
              </div>
            </div>
          </div>
        </Card>

        {/* DB PERFORMANCE */}
        <Card title="Rendimiento de Base de Datos" className="glass-panel">
          <div className="kpi-grid">
             <div className="kpi-item">
               <small>Queries/seg (QPS)</small>
               <div className="kpi-value">{metrics.performance.qps}</div>
             </div>
             <div className="kpi-item">
               <small>Latencia Prom.</small>
               <div className="kpi-value">{metrics.performance.avgResponseTime}ms</div>
             </div>
             <div className="kpi-item">
               <small>Latencia P99</small>
               <div className="kpi-value" style={{ color: metrics.performance.p99 > 300 ? 'var(--warning)' : 'inherit' }}>
                 {metrics.performance.p99}ms
               </div>
             </div>
             <div className="kpi-item">
               <small>Conexiones Activas</small>
               <div className="kpi-value">
                 {metrics.performance.activeConnections} <span style={{fontSize:'1rem', color:'#888'}}>/ {metrics.performance.maxConnections}</span>
               </div>
             </div>
          </div>
        </Card>

        {/* GENERAL STATUS */}
        <Card title="Información del Nodo" className="glass-panel">
           <div className="info-list">
             <div className="info-row">
               <span>Estado</span>
               <Badge variant="success">Online</Badge>
             </div>
             <div className="info-row">
               <span>Rol</span>
               <Badge variant="info">{metrics.role}</Badge>
             </div>
             <div className="info-row">
               <span>Versión</span>
               <span>{metrics.version}</span>
             </div>
             <div className="info-row">
               <span>Uptime</span>
               <span>{metrics.uptime}</span>
             </div>
             <div className="info-row">
               <span>Modo</span>
               <span>{metrics.mode}</span>
             </div>
           </div>
        </Card>
      </div>

      <style jsx>{`
        .monitoring-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 1.5rem;
        }
        .subtitle {
          color: var(--text-secondary);
          margin-top: 0.25rem;
        }
        .last-update {
          font-size: 0.875rem;
          color: var(--text-muted);
        }
        .resource-item {
          margin-bottom: 1.5rem;
        }
        .resource-header {
          display: flex;
          justify-content: space-between;
          margin-bottom: 0.5rem;
          font-size: 0.9rem;
        }
        .progress-bar-bg {
          height: 8px;
          background: rgba(0,0,0,0.1);
          border-radius: 4px;
          overflow: hidden;
        }
        .progress-bar-fill {
          height: 100%;
          border-radius: 4px;
          transition: width 0.5s ease;
        }
        .resource-stats-mini {
          display: flex;
          justify-content: space-between;
          margin-top: 1rem;
          padding-top: 1rem;
          border-top: 1px solid var(--border-color);
        }
        .resource-stats-mini small {
          display: block;
          color: var(--text-muted);
          margin-bottom: 0.25rem;
        }
        .kpi-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1rem;
        }
        .kpi-item {
          background: rgba(0,0,0,0.02);
          padding: 1rem;
          border-radius: 8px;
          text-align: center;
        }
        .kpi-value {
          font-size: 1.5rem;
          font-weight: 800;
          margin-top: 0.5rem;
          color: var(--text-primary);
        }
        .info-list {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }
        .info-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0.75rem 0;
          border-bottom: 1px solid var(--border-color);
        }
        .info-row:last-child {
          border-bottom: none;
        }
      `}</style>
    </div>
  )
}

export default Monitoring
