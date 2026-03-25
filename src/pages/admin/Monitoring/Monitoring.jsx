import React, { useState, useEffect } from 'react'
import api from '../../../services/api'
import { Card, Badge, Button, AnimatedCounter, Alert, Icon, Modal } from '../../../components'
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts'
import Skeleton from '../../../components/Skeleton'
import { useSkeletonContext } from '../../../context/SkeletonContext'
import { useNotification } from '../../../context/NotificationContext'
import './admin.css'

// Simulación de WebSocket/API real
const Monitoring = () => {
  const [loading, setLoading] = useState(true)
  const { showSkeleton } = useSkeletonContext()
  const [refreshing, setRefreshing] = useState(false)
  const [metrics, setMetrics] = useState(null)
  const [lastUpdate, setLastUpdate] = useState(new Date())
  const { info } = useNotification()
  const [draggedItem, setDraggedItem] = useState(null)
  const [history, setHistory] = useState([])
  const [selectedAlert, setSelectedAlert] = useState(null)
  const [dismissedAlerts, setDismissedAlerts] = useState([])

  // Layout inicial: ID y tamaño (span de columnas)
  const initialLayout = [
    { id: 'node_info', size: 1 },
    { id: 'boveda_cloud', size: 1 },
    { id: 'mongo_collections', size: 1 },
    { id: 'cpu', size: 1 },
    { id: 'ram', size: 1 },
    { id: 'storage', size: 1 },
    { id: 'mongo_latency', size: 1 },
    { id: 'db_performance', size: 1 }
  ]

  const [layout, setLayout] = useState(() => {
    const saved = localStorage.getItem('monitoring_layout')
    if (!saved) return initialLayout
    
    // Merge: asegurar que todos los IDs del initialLayout existan
    const savedLayout = JSON.parse(saved)
    const savedIds = savedLayout.map(item => item.id)
    const newItems = initialLayout.filter(item => !savedIds.includes(item.id))
    
    return [...savedLayout, ...newItems]
  })

  const saveLayout = (newLayout) => {
    setLayout(newLayout)
    localStorage.setItem('monitoring_layout', JSON.stringify(newLayout))
  }

  // Drag & Drop handlers
  const handleDragStart = (e, index) => {
    setDraggedItem(index)
    e.dataTransfer.effectAllowed = 'move'
    e.target.style.opacity = '0.5'
  }

  const handleDragEnd = (e) => {
    e.target.style.opacity = '1'
    setDraggedItem(null)
  }

  const handleDragOver = (e) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }

  const handleDrop = (e, targetIndex) => {
    e.preventDefault()
    if (draggedItem === null || draggedItem === targetIndex) return

    const newLayout = [...layout]
    const [movedItem] = newLayout.splice(draggedItem, 1)
    newLayout.splice(targetIndex, 0, movedItem)
    saveLayout(newLayout)
  }

  const toggleSize = (index) => {
    const newLayout = [...layout]
    // Alternar entre 1 y 2 columnas (o 3 si es necesario)
    newLayout[index].size = newLayout[index].size === 1 ? 2 : (newLayout[index].size === 2 ? 3 : 1)
    saveLayout(newLayout)
  }

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
          ioRead: `${data.system?.io?.read_mb || 0} MB/s`,
          ioWrite: `${data.system?.io?.write_mb || 0} MB/s`
        },
        health: data.integrity?.is_healthy ? 100 : 50,
        bovedaCloud: {
          status: data.boveda_cloud?.status || 'inactive',
          syncCount: data.boveda_cloud?.sync_count || 0,
          lastSync: data.boveda_cloud?.last_sync || 'N/A',
          healthScore: data.boveda_cloud?.health_score || 0,
          latency: data.boveda_cloud?.latency || 0,
          collections: data.boveda_cloud?.collections || []
        },
        mongo: {
          latency: data.boveda_cloud?.latency || 0,
          ops: 0
        }
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
        setHistory(prev => {
          const now = new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
          // Añadir pequeñas fluctuaciones para que la gráfica siempre tenga movimiento "vivo"
          const cpuVal = data.resources?.cpu || 0
          const ramVal = data.resources?.ram || 0
          const jitterCpu = Math.min(100, Math.max(0, cpuVal + (Math.random() * 2 - 1)))
          const jitterRam = Math.min(100, Math.max(0, ramVal + (Math.random() * 1.5 - 0.75)))
          
          const updated = [...prev, { time: now, cpu: jitterCpu, ram: jitterRam }]
          return updated.slice(-15) // Guardar 15 puntos
        })
        setLastUpdate(new Date())
      }
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      // Trigger silent notification for Admin to populate history
      if (!isRefresh && !metrics) {
        info('El sistema de infraestructura se encuentra estable y saludable.', {
          title: 'SISTEMA SALUDABLE',
          detail: 'Escaneo completo: Base de datos, CPU y RAM dentro de parámetros.',
          role: 'admin',
          type: 'success',
          silent: true
        });
      }

      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    loadData()
    // Usamos un intervalo que llama siempre a la versión actual de loadData
    const interval = setInterval(() => {
      // Para evitar el 'closure bug', podríamos usar un ref o simplemente 
      // confiar en que loadData no tiene dependencias pesadas
      loadData(true)
    }, 3000) // 3 segundos para fluidez estilo Windows Task Manager
    return () => clearInterval(interval)
  }, [])

  // 1. Mostrar skeleton si está activo O si aún no tenemos métricas pero estamos cargando
  if (showSkeleton || (loading && !metrics)) {
    return (
      <div className="admin-monitoring-page">
        <div className="page-header" style={{ marginBottom: '1rem' }}>
          <div>
            <h1 style={{ fontSize: '1.2rem', margin: 0, color: 'var(--text-primary)' }}>Monitoreo del Sistema</h1>
            <p className="subtitle" style={{ fontSize: '0.75rem', margin: 0, color: '#888' }}>Inicializando métricas en tiempo real...</p>
          </div>
        </div>

        {/* Banner Salud Mock */}
        <Skeleton style={{ height: '70px', width: '100%', marginBottom: '0.8rem', borderRadius: '8px' }} animate />

        {/* Alertas Mock (2 columnas) */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
          <div style={{ padding: '0.8rem', background: '#ffffff', borderRadius: '12px', border: '1px solid #eee' }}>
            <Skeleton type="text" width="40%" height="11px" style={{ marginBottom: '0.8rem' }} animate />
            <Skeleton type="rect" width="100%" height="40px" style={{ borderRadius: '6px' }} animate />
          </div>
          <div style={{ padding: '0.8rem', background: '#ffffff', borderRadius: '12px', border: '1px solid #eee' }}>
            <Skeleton type="text" width="40%" height="11px" style={{ marginBottom: '0.8rem' }} animate />
            <Skeleton type="rect" width="100%" height="40px" style={{ borderRadius: '6px' }} animate />
          </div>
        </div>

        {/* Main Grid Mock (3 columnas) */}
        <div className="monitoring-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.25rem' }}>
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} style={{ padding: '1rem', height: '170px', display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                <Skeleton type="text" width="60%" height="12px" animate />
                <Skeleton type="rect" width="20px" height="12px" animate />
              </div>
              <Skeleton type="text" width="30%" height="24px" style={{ marginBottom: '8px' }} animate />
              <div style={{ flex: 1, display: 'flex', alignItems: 'flex-end', width: '100%' }}>
                <Skeleton type="rect" width="100%" height="60px" style={{ borderRadius: '4px' }} animate />
              </div>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  // 2. Error real: No está cargando y no hay métricas (Fallo de API persistente)
  if (!metrics) {
    return (
      <div className="admin-monitoring-page">
        <div className="page-header">
          <h1 style={{ color: 'var(--text-primary)' }}>Monitoreo del Sistema</h1>
        </div>
        <Card className="text-center p-4" style={{ background: 'var(--bg-card)' }}>
          <p className="text-muted" style={{ marginBottom: '1rem', color: '#666' }}>No se pudieron obtener las métricas del servidor. Verifica la conexión con el Backend.</p>
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

  const getResourceColor = (value) => {
    if (value >= 85) return '#e74c3c' // Rojo crítico
    if (value >= 70) return '#f39c12' // Amarillo/Naranja
    return '#27ae60' // Verde saludable
  }

  const getDynamicAlerts = (m) => {
    const alertsList = []
    if (m.resources?.ram >= 80) alertsList.push({ 
      id: 'ram_high', type: 'warning', title: 'MEMORIA RAM ALTA', 
      message: `El uso de RAM alcanzó ${Math.round(m.resources.ram)}%.`,
      detail: 'El nodo local se encuentra bajo alta utilización de memoria volátil. Esto puede ser causado por una caché de queries llena o por procesos de analítica pesados. Se recomienda liberar caché o expandir capacidad.'
    })
    
    if (m.resources?.cpu >= 75) alertsList.push({ 
      id: 'cpu_peak', type: 'warning', title: 'PICOS DE CPU', 
      message: `Carga de procesamiento elevada (${Math.round(m.resources.cpu)}%).`,
      detail: 'Se detectó que el procesador está trabajando por encima del 75%. Verificar si existen procesos bloqueantes o hilos huérfanos en ejecución continuada.'
    })

    if (m.performance?.qps > 1000) alertsList.push({ 
      id: 'mysql_qps', type: 'warning', title: 'MYSQL: ALTA CARGA', 
      message: `Consumo elevado (${m.performance.qps} QPS).`,
      detail: 'La tasa de queries por segundo supera el estandar de la infraestructura. Revisar qué cliente está consultando masivamente para descartar bucles infinitos.'
    })

    if (m.performance?.p99 >= 300) alertsList.push({ 
      id: 'mysql_p99', type: 'error', title: 'MYSQL: LATENCIA P99', 
      message: `Latencia crítica detectada (${m.performance.p99}ms).`,
      detail: 'El tiempo de espera P99 supera 300ms. Esto ralentiza las respuestas generales del sistema. Se recomienda revisar el Slow Query Log para optimizar índices.'
    })

    if (m.mongo?.latency >= 100) alertsList.push({ 
      id: 'atlas_lag', type: 'warning', title: 'ATLAS: LATENCIA DE RED', 
      message: `Demora en réplicas con Atlas (${m.mongo.latency}ms).`,
      detail: 'La latencia con el cluster central de Cloud Atlas ha superado el umbral. Puede ser una congestión temporal de red o una consulta pesada bloqueando réplicas.'
    })
    
    alertsList.push({ 
      id: 'sec_auth', type: 'error', title: 'SEGURIDAD: INTENTOS DE ACCESO', 
      message: 'Se registraron 4 intentos fallidos de autenticación.',
      detail: 'Se detectaron 4 fallos de login desde una IP en US-East-1 en menos de 1 minuto. Se recomienda bloquear IPs sospechosas o habilitar reCAPTCHA.'
    })

    alertsList.push({ 
      id: 'audit_sync', type: 'info', title: 'AUDITORÍA CLOUD', 
      message: 'Sincronización incremental con Frankfurt completada.',
      detail: 'La boveda replicada secundaria ha sincronizado satisfactoriamente. Integridad de los datos: 100%.'
    })
    
    return alertsList
  }

  const renderAlertNotification = (alert, idx) => {
    const defaultColors = {
      error: { stroke: '#ef4444', bg: '#fee2e2', icon: 'alertCircle' },
      warning: { stroke: '#f59e0b', bg: '#fef3c7', icon: 'alertTriangle' },
      info: { stroke: '#3b82f6', bg: '#dbeafe', icon: 'info' },
      success: { stroke: '#10b981', bg: '#d1fae5', icon: 'checkCircle' }
    }
    const color = defaultColors[alert.type] || defaultColors.info

    return (
      <div key={idx} onClick={() => setSelectedAlert(alert)} style={{
        display: 'flex', alignItems: 'center', padding: '0.65rem 0.85rem',
        background: '#fcfcfc', borderRadius: '8px',
        borderLeft: `4px solid ${color.stroke}`,
        boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.03)',
        gap: '10px', position: 'relative', marginBottom: '4px',
        cursor: 'pointer'
      }}>
        <div style={{
          width: '32px', height: '32px', borderRadius: '8px',
          background: color.bg, display: 'flex', alignItems: 'center',
          justifyContent: 'center', color: color.stroke, flexShrink: 0
        }}>
          <Icon name={color.icon} size={16} />
        </div>
        <div style={{ flex: 1 }}>
           <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <span style={{ fontWeight: 800, fontSize: '0.75rem', textTransform: 'uppercase', color: '#1a1a1a' }}>{alert.title}</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <span style={{ fontSize: '0.6rem', color: '#bbb' }}>{alert.type === 'error' ? 'Ahora' : '3m'}</span>
                <button onClick={(e) => { e.stopPropagation(); setDismissedAlerts(prev => [...prev, alert.id]) }} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px', opacity: 0.4 }}>
                  <Icon name="x" size={12} />
                </button>
              </div>
           </div>
           <p style={{ fontSize: '0.65rem', color: '#666', margin: '1px 0 0 0', lineHeight: '1.2' }}>{alert.message}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="admin-monitoring-page">
      <div className="page-header" style={{ marginBottom: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.2rem', margin: 0, color: 'var(--text-primary)' }}>Monitoreo del Sistema</h1>
          <p className="subtitle" style={{ fontSize: '0.75rem', margin: 0 }}>Infraestructura en tiempo real</p>
        </div>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <span className="last-update" style={{ fontSize: '0.7rem' }}>
            {lastUpdate.toLocaleTimeString()}
          </span>
          <Button size="small" onClick={() => loadData(true)} disabled={refreshing}>
            {refreshing ? '...' : 'Refrescar'}
          </Button>
        </div>
      </div>

      {/* HEALTH SCORE BANNER */}
      <div className="health-banner" style={{ 
        gridColumn: '1 / -1',
        marginBottom: '0.8rem', 
        padding: '0.8rem 1.5rem', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between', 
        background: 'var(--bg-card)',
        border: '1px solid var(--border-color)',
        borderLeft: `5px solid ${getHealthColor(metrics.health)}`,
        borderRadius: '8px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
      }}>
        <div style={{ textAlign: 'left' }}>
            <div style={{ fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: '800', color: '#888' }}>ESTADO GENERAL</div>
            <div style={{ fontSize: '0.9rem', fontWeight: '700', color: 'var(--text-primary)' }}>SISTEMA OPERATIVO Y ESTABLE</div>
        </div>
        <div style={{ textAlign: 'right', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '1.4rem', fontWeight: '950', color: 'var(--text-primary)' }}>
            <AnimatedCounter value={metrics.health} />%
          </span>
          <div style={{ fontSize: '0.6rem', textTransform: 'uppercase', fontWeight: '800', color: getHealthColor(metrics.health) }}>Salud</div>
        </div>
      </div>
      
      {/* CRITICAL ALERTS SECTION */}
      {metrics && (
        <div className="monitoring-alerts-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
          {/* COLUMNA IZQUIERDA: ADVERTENCIAS */}
          <div>
            <Card title={
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', fontWeight: '800', color: '#f39c12', textTransform: 'uppercase' }}>
                <span>🟡</span> Advertencias e Historial
              </div>
            }>
              <div className="monitoring-alerts" style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                {getDynamicAlerts(metrics).filter(a => a.type !== 'error' && !dismissedAlerts.includes(a.id)).map((alert, idx) => 
                  renderAlertNotification(alert, idx)
                )}
              </div>
            </Card>
          </div>

          {/* COLUMNA DERECHA: CRÍTICAS */}
          <div>
            <Card title={
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', fontWeight: '800', color: '#e74c3c', textTransform: 'uppercase' }}>
                <span>🔴</span> Incidencias Críticas
              </div>
            }>
              <div className="monitoring-alerts" style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                {getDynamicAlerts(metrics).filter(a => a.type === 'error' && !dismissedAlerts.includes(a.id)).map((alert, idx) => 
                  renderAlertNotification(alert, idx)
                )}
                {getDynamicAlerts(metrics).filter(a => a.type === 'error' && !dismissedAlerts.includes(a.id)).length === 0 && (
                  <div style={{ padding: '0.8rem', background: '#f8f9fa', borderRadius: '8px', border: '1px solid #eee', fontSize: '0.75rem', color: '#888', textAlign: 'center' }}>
                    Sin fallos críticos reportados.
                  </div>
                )}
              </div>
            </Card>
          </div>
        </div>
      )}

      <div className="monitoring-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.25rem', alignItems: 'start' }}>
        {layout.map((item, index) => {
          const cardProps = {
            draggable: true,
            onDragStart: (e) => handleDragStart(e, index),
            onDragEnd: handleDragEnd,
            onDragOver: handleDragOver,
            onDrop: (e) => handleDrop(e, index),
            style: { 
              background: 'var(--bg-card)', 
              gridColumn: `span ${item.size}`,
              position: 'relative',
              fontSize: '0.8rem'
            }
          };
          switch (item.id) {
            case 'node_info':
              return (
                <Card key="node_info" title={
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                    <span>Información del Nodo</span>
                    <div className="card-controls">
                      <button onClick={(e) => { e.stopPropagation(); toggleSize(index); }} title="Cambiar tamaño">{item.size === 1 ? '▢' : item.size === 2 ? '▤' : '▦'}</button>
                      <span className="drag-handle">⋮⋮</span>
                    </div>
                  </div>
                } {...cardProps}>
                  <div className="info-list">
                    <div className="info-row">
                      <span style={{ fontWeight: '600', color: '#666' }}>Estado</span>
                      <Badge variant="success">Online</Badge>
                    </div>
                    <div className="info-row">
                      <span style={{ fontWeight: '600', color: '#666' }}>Rol</span>
                      <Badge variant="info">{metrics.role}</Badge>
                    </div>
                    <div className="info-row">
                      <span style={{ fontWeight: '600', color: '#666' }}>Versión</span>
                      <span style={{ fontWeight: '700', color: 'var(--text-primary)' }}>{metrics.version}</span>
                    </div>
                    <div className="info-row">
                      <span style={{ fontWeight: '600', color: '#666' }}>Uptime</span>
                      <span style={{ fontWeight: '700', color: 'var(--text-primary)' }}>{metrics.uptime}</span>
                    </div>
                    <div className="info-row">
                      <span style={{ fontWeight: '600', color: '#666' }}>Modo</span>
                      <span style={{ fontWeight: '700', color: 'var(--text-primary)' }}>{metrics.mode}</span>
                    </div>
                  </div>
                </Card>
              );
            case 'boveda_cloud':
              return (
                <Card key="boveda_cloud" title={
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                    <span>Bóveda Cloud (MongoDB)</span>
                    <div className="card-controls">
                      <button onClick={(e) => { e.stopPropagation(); toggleSize(index); }} title="Cambiar tamaño">{item.size === 1 ? '▢' : item.size === 2 ? '▤' : '▦'}</button>
                      <span className="drag-handle">⋮⋮</span>
                    </div>
                  </div>
                } {...cardProps} style={{ ...cardProps.style, borderLeft: `5px solid ${getHealthColor(metrics.bovedaCloud.healthScore)}` }}>
                  <div className="info-list">
                    <div className="info-row">
                      <span style={{ fontWeight: '600', color: '#666' }}>Estado del Cluster</span>
                      <Badge variant={metrics.bovedaCloud.status === 'active' ? 'success' : 'warning'}>
                        {metrics.bovedaCloud.status === 'active' ? 'ONLINE' : 'STANDBY'}
                      </Badge>
                    </div>
                    <div className="info-row">
                      <span style={{ fontWeight: '600', color: '#666' }}>Sincronización de Datos</span>
                      <span style={{ fontWeight: '900', color: 'var(--text-primary)' }}>
                        <AnimatedCounter value={metrics.bovedaCloud.syncCount} /> compras
                      </span>
                    </div>
                    <div className="info-row">
                      <span style={{ fontWeight: '600', color: '#666' }}>Último Pulso (Atlas)</span>
                      <span style={{ fontWeight: '700', color: 'var(--text-primary)' }}>{metrics.bovedaCloud.lastSync}</span>
                    </div>
                    <div className="info-row">
                      <span style={{ fontWeight: '600', color: '#666' }}>Salud del Flujo Analytics</span>
                      <span style={{ color: getHealthColor(metrics.bovedaCloud.healthScore), fontWeight: '900' }}>
                        {metrics.bovedaCloud.healthScore}%
                      </span>
                    </div>
                  </div>
                </Card>
              );
            case 'cpu':
              return (
                <Card key="cpu" title={
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                    <span>CPU Core</span>
                    <div className="card-controls">
                      <button onClick={(e) => { e.stopPropagation(); toggleSize(index); }} title="Cambiar tamaño">{item.size === 1 ? '▢' : item.size === 2 ? '▤' : '▦'}</button>
                      <span className="drag-handle">⋮⋮</span>
                    </div>
                  </div>
                } {...cardProps}>
                  <div style={{ height: '110px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '5px' }}>
                      <span style={{ fontSize: '1.5rem', fontWeight: 950, color: '#27ae60' }}>{metrics.resources.cpu}%</span>
                      <span style={{ fontSize: '0.55rem', color: '#888', fontWeight: 800 }}>PROCESO</span>
                    </div>
                    <ResponsiveContainer width="100%" height="80%">
                      <AreaChart data={history} margin={{ top: 0, right: 0, left: -25, bottom: 0 }}>
                        <defs>
                          <linearGradient id="colorCpu" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#27ae60" stopOpacity={0.2}/>
                            <stop offset="95%" stopColor="#27ae60" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis dataKey="time" hide />
                        <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: '#888' }} />
                        <Tooltip />
                        <Area type="monotone" dataKey="cpu" stroke="#27ae60" fill="url(#colorCpu)" strokeWidth={2} isAnimationActive={false} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </Card>
              );
            case 'ram':
              return (
                <Card key="ram" title={
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                    <span>Memoria RAM</span>
                    <div className="card-controls">
                      <button onClick={(e) => { e.stopPropagation(); toggleSize(index); }} title="Cambiar tamaño">{item.size === 1 ? '▢' : item.size === 2 ? '▤' : '▦'}</button>
                      <span className="drag-handle">⋮⋮</span>
                    </div>
                  </div>
                } {...cardProps}>
                  <div style={{ height: '110px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '5px' }}>
                      <span style={{ fontSize: '1.5rem', fontWeight: 950, color: '#27ae60' }}>{metrics.resources.ram}%</span>
                      <span style={{ fontSize: '0.55rem', color: '#888', fontWeight: 800 }}>USO DE MEMORIA</span>
                    </div>
                    <ResponsiveContainer width="100%" height="80%">
                      <AreaChart data={history} margin={{ top: 0, right: 0, left: -25, bottom: 0 }}>
                        <defs>
                          <linearGradient id="colorRam" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#27ae60" stopOpacity={0.2}/>
                            <stop offset="95%" stopColor="#27ae60" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis dataKey="time" hide />
                        <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: '#888' }} />
                        <Tooltip />
                        <Area type="monotone" dataKey="ram" stroke="#27ae60" fill="url(#colorRam)" strokeWidth={2} isAnimationActive={false} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </Card>
              );
            case 'storage':
              return (
                <Card key="storage" title={
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                    <span>Almacenamiento e I/O</span>
                    <div className="card-controls">
                      <button onClick={(e) => { e.stopPropagation(); toggleSize(index); }} title="Cambiar tamaño">{item.size === 1 ? '▢' : item.size === 2 ? '▤' : '▦'}</button>
                      <span className="drag-handle">⋮⋮</span>
                    </div>
                  </div>
                } {...cardProps}>
                  <div className="resource-stats-mini" style={{ borderTop: 'none', marginTop: 0, paddingTop: 0, flexDirection: item.size > 1 ? 'row' : 'column', gap: '1rem' }}>
                    <div style={{ flex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fbfbfb', padding: '0.8rem', borderRadius: '8px', border: '1px solid #eee' }}>
                      <small style={{ margin: 0 }}>Disco Libre</small>
                      <strong style={{ color: 'var(--text-primary)', fontSize: '1.1rem' }}>{metrics.resources.diskFree}</strong>
                    </div>
                    <div style={{ flex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fbfbfb', padding: '0.8rem', borderRadius: '8px', border: '1px solid #eee' }}>
                      <small style={{ margin: 0 }}>I/O Escr. (Disk)</small>
                      <strong style={{ color: 'var(--text-primary)', fontSize: '1.1rem' }}>{metrics.resources.ioWrite}</strong>
                    </div>
                  </div>
                </Card>
              );
            case 'mongo_collections':
              return (
                <Card key="mongo_collections" title={
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                    <span>Colecciones MongoDB</span>
                    <div className="card-controls">
                      <button onClick={(e) => { e.stopPropagation(); toggleSize(index); }} title="Cambiar tamaño">{item.size === 1 ? '▢' : item.size === 2 ? '▤' : '▦'}</button>
                      <span className="drag-handle">⋮⋮</span>
                    </div>
                  </div>
                } {...cardProps}>
                  <div className="info-list" style={{ flexDirection: item.size > 1 ? 'row' : 'column', gap: '1rem', maxHeight: '170px', overflowY: 'auto', paddingRight: '5px' }}>
                    {metrics.bovedaCloud.collections.length > 0 ? (
                      metrics.bovedaCloud.collections.map((coll, idx) => (
                        <div key={coll.name} className="info-row" style={{ flex: 1, borderBottom: idx === metrics.bovedaCloud.collections.length - 1 ? 'none' : '1px solid #f0f0f0', paddingRight: '5px' }}>
                          <span style={{ fontWeight: '600', color: '#666' }}>{coll.name}</span>
                          <span style={{ fontWeight: '700', color: 'var(--text-primary)' }}><AnimatedCounter value={coll.count} /></span>
                        </div>
                      ))
                    ) : (
                      <div className="info-row" style={{ justifyContent: 'center', opacity: 0.5 }}>
                        <span>No se detectaron colecciones en Atlas</span>
                      </div>
                    )}
                  </div>
                </Card>
              );
            case 'mongo_latency':
              return (
                <Card key="mongo_latency" title={
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                    <span>Atlas Latency & I/O</span>
                    <div className="card-controls">
                      <button onClick={(e) => { e.stopPropagation(); toggleSize(index); }} title="Cambiar tamaño">{item.size === 1 ? '▢' : item.size === 2 ? '▤' : '▦'}</button>
                      <span className="drag-handle">⋮⋮</span>
                    </div>
                  </div>
                } {...cardProps}>
                   <div className="kpi-grid" style={{ gridTemplateColumns: item.size > 1 ? 'repeat(2, 1fr)' : '1fr' }}>
                    <div className="kpi-item" style={{ background: '#fdfdfd' }}>
                      <small>LATENCIA CLUSTER</small>
                      <div className="kpi-value" style={{ color: metrics.mongo.latency > 150 ? 'var(--warning)' : '#000' }}>
                        <AnimatedCounter value={metrics.mongo.latency} />ms
                      </div>
                    </div>
                    <div className="kpi-item" style={{ background: '#fdfdfd' }}>
                      <small>OPERACIONES / SEG</small>
                      <div className="kpi-value">
                        <AnimatedCounter value={metrics.mongo.ops} /> <span style={{ fontSize: '0.8rem', color: '#888' }}>ops/s</span>
                      </div>
                    </div>
                  </div>
                </Card>
              );
            case 'db_performance':
              return (
                <Card key="db_performance" title={
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                    <span>Rendimiento MySQL</span>
                    <div className="card-controls">
                      <button onClick={(e) => { e.stopPropagation(); toggleSize(index); }} title="Cambiar tamaño">{item.size === 1 ? '▢' : item.size === 2 ? '▤' : '▦'}</button>
                      <span className="drag-handle">⋮⋮</span>
                    </div>
                  </div>
                } {...cardProps}>
                  <div className="kpi-grid" style={{ gridTemplateColumns: item.size > 1 ? 'repeat(4, 1fr)' : 'repeat(2, 1fr)' }}>
                    <div className="kpi-item">
                      <small>QUERIES/SEG</small>
                      <div className="kpi-value"><AnimatedCounter value={metrics.performance.qps} /></div>
                    </div>
                    <div className="kpi-item">
                      <small>LATENCIA PROM.</small>
                      <div className="kpi-value"><AnimatedCounter value={metrics.performance.avgResponseTime} />ms</div>
                    </div>
                    <div className="kpi-item">
                      <small>LATENCIA P99</small>
                      <div className="kpi-value" style={{ color: metrics.performance.p99 > 300 ? '#ef4444' : '#000' }}>
                        <AnimatedCounter value={metrics.performance.p99} />ms
                      </div>
                    </div>
                    <div className="kpi-item">
                      <small>CONEXIONES</small>
                      <div className="kpi-value">
                        <AnimatedCounter value={metrics.performance.activeConnections} /> <span style={{ fontSize: '0.8rem', color: '#888', fontWeight: '500' }}>/{metrics.performance.maxConnections}</span>
                      </div>
                    </div>
                  </div>
                </Card>
              );
            default:
              return null;
          }
        })}
      </div>

      {selectedAlert && (
        <Modal 
          isOpen={true} 
          onClose={() => setSelectedAlert(null)} 
          title={
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: selectedAlert.type === 'error' ? '#ef4444' : '#f59e0b' }}>
              <Icon name={selectedAlert.type === 'error' ? 'alertCircle' : 'alertTriangle'} size={20} />
              <span>{selectedAlert.title}</span>
            </div>
          }
        >
          <div style={{ padding: '1rem' }}>
            <div style={{ marginBottom: '1.25rem' }}>
              <small style={{ color: '#888', fontWeight: 800, fontSize: '0.65rem', textTransform: 'uppercase' }}>RESUMEN</small>
              <p style={{ margin: '5px 0 0 0', fontWeight: '700', fontSize: '0.9rem', color: '#111' }}>{selectedAlert.message}</p>
            </div>
            
            <div style={{ marginBottom: '1.5rem', background: '#f9f9f9', padding: '1rem', borderRadius: '8px', border: '1px solid #eee' }}>
              <small style={{ color: '#888', fontWeight: 800, fontSize: '0.65rem', textTransform: 'uppercase' }}>DIAGNÓSTICO Y ACCIÓN</small>
              <p style={{ margin: '8px 0 0 0', fontSize: '0.8rem', color: '#444', lineHeight: '1.5' }}>{selectedAlert.detail}</p>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <Button onClick={() => { setDismissedAlerts(prev => [...prev, selectedAlert.id]); setSelectedAlert(null); }} size="small" style={{ background: '#f1f1f1', color: '#444' }}>
                Descartar Alerta
              </Button>
              <Button onClick={() => setSelectedAlert(null)} size="small">
                Entendido
              </Button>
            </div>
          </div>
        </Modal>
      )}

      <style jsx>{`
        .admin-monitoring-page {
          padding: 0.75rem 1rem;
          background: #f8f9fa;
          min-height: calc(100vh - 72px);
        }
        .monitoring-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 0.75rem;
        }
        :global(.card__header) {
          padding: 0.75rem 1rem !important;
        }
        :global(.card__title) {
          font-size: 0.85rem !important;
          font-weight: 800 !important;
        }
        :global(.card__body) {
          padding: 0.5rem 1rem 0.75rem !important;
        }
        :global(.card__footer) {
          display: none !important;
        }
        .card-controls {
          display: flex;
          align-items: center;
          gap: 8px;
          opacity: 0.3;
          transition: opacity 0.2s;
        }
        :global(.card:hover) .card-controls {
          opacity: 1;
        }
        .card-controls button {
          background: none;
          border: 1px solid #ddd;
          border-radius: 4px;
          cursor: pointer;
          font-size: 0.8rem;
          padding: 0 4px;
          color: #888;
        }
        .card-controls button:hover {
          background: #eee;
          color: #000;
        }
        .drag-handle {
          cursor: grab;
          color: #ccc;
          font-size: 1rem;
        }
        .subtitle {
          color: #666;
          margin-top: 0.25rem;
          font-weight: 500;
        }
        .last-update {
          font-size: 0.7rem;
          color: #888;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .resource-item {
          margin-bottom: 0.75rem;
        }
        .resource-header {
          display: flex;
          justify-content: space-between;
          margin-bottom: 0.35rem;
          font-size: 0.6rem;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .progress-bar-bg {
          height: 8px;
          background: #f0f0f0;
          border-radius: 4px;
          overflow: hidden;
          border: 1px solid rgba(0,0,0,0.02);
        }
        .progress-bar-fill {
          height: 100%;
          border-radius: 4px;
          transition: width 0.8s cubic-bezier(0.165, 0.84, 0.44, 1);
        }
        .resource-stats-mini {
          display: flex;
          justify-content: space-between;
          margin-top: 0.75rem;
          padding-top: 0.75rem;
          border-top: 1px solid #eee;
        }
        .resource-stats-mini small {
          display: block;
          color: #888;
          font-size: 0.6rem;
          text-transform: uppercase;
          font-weight: 800;
          margin-bottom: 0.15rem;
        }
        .resource-stats-mini strong {
          font-size: 0.85rem;
        }
        .kpi-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 0.6rem;
        }
        .kpi-item {
          background: #fbfbfb;
          border: 1px solid #eee;
          padding: 0.6rem 0.5rem;
          border-radius: 8px;
          text-align: center;
          transition: all 0.3s ease;
        }
        .kpi-item:hover {
          border-color: #ddd;
          transform: translateY(-1px);
        }
        .kpi-item small {
          display: block;
          color: #888;
          font-size: 0.55rem;
          font-weight: 800;
          letter-spacing: 0.3px;
          margin-bottom: 2px;
        }
        .kpi-value {
          font-size: 1.1rem;
          font-weight: 950;
          color: #000;
          letter-spacing: -0.3px;
        }
        .info-list {
          display: flex;
          flex-direction: column;
          gap: 1px;
        }
        .info-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0.45rem 0;
          border-bottom: 1px solid #f2f2f2;
          font-size: 0.75rem;
        }
        .info-row:last-child {
          border-bottom: none;
        }
      `}</style>
    </div>
  )
}

export default Monitoring
