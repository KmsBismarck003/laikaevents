import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../../../services/api'
import { useNotification } from '../../../context/NotificationContext'
import { Card, Button, Alert, Icon, AnimatedCounter, SkeletonCard, ConfirmationModal } from '../../../components'
import Skeleton from '../../../components/Skeleton/Skeleton';
import PermissionGuard from '../../../components/common/PermissionGuard'
import useSkeleton from '../../../hooks/useSkeleton'
import { useSkeletonContext } from '../../../context/SkeletonContext'
import './admin.css'

const Dashboard = () => {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [loadingErrors, setLoadingErrors] = useState([])
  const [alert, setAlert] = useState(null)
  const [displayText, setDisplayText] = useState('')
  const [currentTime, setCurrentTime] = useState(new Date())
  const [draggedItem, setDraggedItem] = useState(null)
  const { showSkeleton } = useSkeletonContext()
  // Instant UI:forced latency removed

  // Definición inicial de secciones (se usará si no hay nada en localStorage)
  const initialSections = [
    {
      id: 'criticas',
      label: 'Operaciones Críticas',
      icon: 'activity',
      items: [
        { id: 'users', path: '/admin/users', icon: 'users', label: 'Gestión Usuarios', color: 'var(--primary)' },
        { id: 'monitoring_rt', path: '/admin/monitoring', icon: 'activity', label: 'Monitoreo Realtime', color: 'var(--primary)' },
        { id: 'big_data', path: '/admin/big-data', icon: 'chart', label: 'Big Data', color: 'var(--primary)' },
        { id: 'audit', path: '/admin/auth-audit', icon: 'shield', label: 'Auditoría' }
      ]
    },
    {
      id: 'operativa',
      label: 'Gestión Operativa',
      icon: 'calendar',
      items: [
        { id: 'events', path: '/admin/events', icon: 'calendar', label: 'Eventos' },
        { id: 'sales', path: '/admin/sales', icon: 'dollarSign', label: 'Ventas' },
        { id: 'venues', path: '/admin/venues', icon: 'map', label: 'Recintos' }
      ]
    },
    {
      id: 'infra',
      label: 'Infraestructura',
      icon: 'settings',
      items: [
        { id: 'monitoring', path: '/admin/monitoring', icon: 'activity', label: 'Monitoreo' },
        { id: 'database', path: '/admin/database', icon: 'database', label: 'Base de Datos' },
        { id: 'config', path: '/admin/config', icon: 'settings', label: 'Configuración' }
      ]
    }
  ]

  const [sections, setSections] = useState(() => {
    const saved = localStorage.getItem('dashboard_order')
    return saved ? JSON.parse(saved) : initialSections
  })
  const fullText = '¡Hola, Admin!'

  useEffect(() => {
    let index = 0
    const timer = setInterval(() => {
      setDisplayText(fullText.slice(0, index + 1))
      index++
      if (index >= fullText.length) clearInterval(timer)
    }, 100)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    const clockTimer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)
    return () => clearInterval(clockTimer)
  }, [])

  const [stats, setStats] = useState({
    totalUsers: null,
    totalEvents: null,
    totalSales: null,
    activeUsers: null
  })

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    setLoading(true)
    setLoadingErrors([])
    const errors = []

    try {
      console.log('📤 Obteniendo estadísticas...')

      const statsPromise = api.stats.getAdminDashboard()
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Timeout en estadísticas')), 5000)
      )

      try {
        const statsResponse = await Promise.race([statsPromise, timeoutPromise])
        console.log('✅ Estadísticas obtenidas:', statsResponse)

        setStats({
          totalUsers: statsResponse?.totalUsers ?? statsResponse?.total_users ?? 0,
          totalEvents: statsResponse?.totalEvents ?? statsResponse?.total_events ?? 0,
          totalSales: statsResponse?.totalSales ?? statsResponse?.total_sales ?? 0,
          activeUsers: statsResponse?.activeUsers ?? statsResponse?.active_users ?? 0
        })
      } catch (error) {
        console.error('❌ Error al cargar estadísticas:', error)
        errors.push('Estadísticas no disponibles')
      }

      if (errors.length > 0) {
        setLoadingErrors(errors)
        setAlert({
          type: 'warning',
          message: `Algunos datos no se pudieron cargar: ${errors.join(', ')} `
        })
      }
    } catch (error) {
      console.error('❌ Error crítico al cargar dashboard:', error)
      setAlert({
        type: 'error',
        message: 'Error crítico al cargar el dashboard. Por favor, recarga la página.'
      })
    } finally {
      setLoading(false)
    }
  }

  // --- LÓGICA DRAG & DROP ---
  const handleDragStart = (e, sectionId, itemId) => {
    setDraggedItem({ sectionId, itemId })
    e.dataTransfer.effectAllowed = 'move'
    // Hacer la tarjeta semi-transparente mientras se arrastra
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

  const handleDrop = (e, targetSectionId, targetItemId) => {
    e.preventDefault()
    if (!draggedItem) return

    const newSections = [...sections]
    const sourceSection = newSections.find(s => s.id === draggedItem.sectionId)
    const targetSection = newSections.find(s => s.id === targetSectionId)

    const sourceIdx = sourceSection.items.findIndex(i => i.id === draggedItem.itemId)
    const targetIdx = targetSection.items.findIndex(i => i.id === targetItemId)

    if (sourceIdx !== -1 && targetIdx !== -1) {
      const [movedItem] = sourceSection.items.splice(sourceIdx, 1)
      targetSection.items.splice(targetIdx, 0, movedItem)
      setSections(newSections)
      localStorage.setItem('dashboard_order', JSON.stringify(newSections))
    }
  }

  const [isResetModalOpen, setIsResetModalOpen] = useState(false)

  const handleResetOrder = () => {
    setIsResetModalOpen(true)
  }

  const handleConfirmReset = () => {
    localStorage.removeItem('dashboard_order')
    setSections(initialSections)
    setIsResetModalOpen(false)
  }


  const isLoading = loading || showSkeleton;

  return (
    <div className="admin-dashboard-page">
      <header className="dashboard-header">
        <div className="welcome-banner">
          <h1 className="welcome-greeting">{isLoading ? <Skeleton width="220px" height="32px" /> : displayText}</h1>
          {isLoading ? (
            <Skeleton width="300px" height="14px" style={{ marginTop: '8px' }} />
          ) : (
            <p className="welcome-date">
              {currentTime.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })} | {currentTime.toLocaleTimeString('es-ES')}
            </p>
          )}
        </div>
        <div className="header-actions">
          {isLoading ? (
            <Skeleton width="100px" height="26px" style={{ borderRadius: '4px' }} />
          ) : (
            <Button
              variant="ghost"
              size="small"
              onClick={handleResetOrder}
              className="premium-reset-btn"
            >
              <span style={{ marginLeft: '6px' }}>Reset Order</span>
            </Button>
          )}
        </div>
      </header>

      {alert && (
        <Alert
          type={alert.type}
          message={alert.message}
          onClose={() => setAlert(null)}
          className="premium-alert"
        />
      )}

      <div className="stats-grid">
        <Card className="stat-card">
          <div className="stat-content">
            <div className="stat-info">
              {isLoading ? <Skeleton width="90px" height="12px" style={{ marginBottom: '6px' }} /> : <p className="stat-label">Total Usuarios</p>}
              <h2 className="stat-value">
                {isLoading ? <Skeleton width="60px" height="24px" /> : stats.totalUsers !== null ? <AnimatedCounter value={stats.totalUsers} /> : '-'}
              </h2>
            </div>
            <div className="stat-icon">
              {isLoading ? <Skeleton width="24px" height="24px" /> : <Icon name="users" size={12} />}
            </div>
          </div>
        </Card>

        <Card className="stat-card">
          <div className="stat-content">
            <div className="stat-info">
              {isLoading ? <Skeleton width="80px" height="12px" style={{ marginBottom: '6px' }} /> : <p className="stat-label">Eventos</p>}
              <h2 className="stat-value">
                {isLoading ? <Skeleton width="50px" height="24px" /> : stats.totalEvents !== null ? <AnimatedCounter value={stats.totalEvents} /> : '-'}
              </h2>
            </div>
            <div className="stat-icon">
              {isLoading ? <Skeleton width="24px" height="24px" /> : <Icon name="calendar" size={12} />}
            </div>
          </div>
        </Card>

        <Card className="stat-card">
          <div className="stat-content">
            <div className="stat-info">
              {isLoading ? <Skeleton width="90px" height="12px" style={{ marginBottom: '6px' }} /> : <p className="stat-label">Ventas Totales</p>}
              <h2 className="stat-value">
                {isLoading ? <Skeleton width="100px" height="24px" /> : stats.totalSales !== null ? <AnimatedCounter value={stats.totalSales} /> : '-'}
              </h2>
            </div>
            <div className="stat-icon">
              {isLoading ? <Skeleton width="24px" height="24px" /> : <Icon name="dollarSign" size={12} />}
            </div>
          </div>
        </Card>

        <Card className="stat-card">
          <div className="stat-content">
            <div className="stat-info">
              {isLoading ? <Skeleton width="60px" height="12px" style={{ marginBottom: '6px' }} /> : <p className="stat-label">Online</p>}
              <h2 className="stat-value">
                {isLoading ? <Skeleton width="40px" height="24px" /> : stats.activeUsers !== null ? <AnimatedCounter value={stats.activeUsers} /> : '-'}
              </h2>
            </div>
            <div className="stat-icon">
              {isLoading ? <Skeleton width="24px" height="24px" /> : <Icon name="checkCircle" size={12} />}
            </div>
          </div>
        </Card>
      </div>

      <div className="dashboard-shortcuts">
        {sections.map((section) => (
          <div key={section.id} className="shortcuts-section">
            <h3 className="section-title">
              {isLoading ? (
                <Skeleton width="180px" height="16px" />
              ) : (
                <>
                  <Icon name={section.icon} size={16} /> {section.label}
                </>
              )}
            </h3>
            <div className="shortcuts-grid">
              {isLoading ? (
                [...Array(section.items.length)].map((_, i) => (
                  <div key={i} className="shortcut-card" style={{ minHeight: '75px', justifyContent: 'center' }}>
                    <Skeleton style={{ height: '14px', width: '80%', marginBottom: '8px' }} />
                    <Skeleton style={{ height: '14px', width: '20px', alignSelf: 'flex-end' }} />
                  </div>
                ))
              ) : (
                section.items.map((item) => (
                  <div
                    key={item.id}
                    className="shortcut-card"
                    draggable
                    onDragStart={(e) => handleDragStart(e, section.id, item.id)}
                    onDragEnd={handleDragEnd}
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, section.id, item.id)}
                    onClick={() => navigate(item.path)}
                  >
                    <p className="shortcut-label">{item.label}</p>
                    <div className="icon-container">
                      <Icon name={item.icon} size={18} />
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        ))}
      </div>



      <div className="dashboard-footer-grid">
        <div className="metric-card" onClick={() => navigate('/admin/monitoring')}>
          <div className="metric-card-header">
            <span className="metric-title">MEMORIA RAM</span>
            <div className="metric-icon-box">
              <Icon name="server" size={14} />
            </div>
          </div>
          <div className="metric-card-body">
            {showSkeleton ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <Skeleton type="text" width="40%" height="10px" />
                <Skeleton type="text" width="80%" height="24px" />
                <Skeleton type="rect" width="100%" height="8px" borderRadius="4px" />
              </div>
            ) : (
              <>
                <div className="metric-info-row">
                  <span className="metric-subtitle">USO DE MEMORIA VOLÁTIL</span>
                  <span className="metric-value">87.7%</span>
                </div>
                <div className="metric-progress-wrapper">
                  <div 
                    className="metric-progress-bar" 
                    style={{ width: '87.7%', backgroundColor: '#ef4444' }} 
                  ></div>
                </div>
              </>
            )}
          </div>
        </div>

        <div className="metric-card" onClick={() => navigate('/admin/monitoring')}>
          <div className="metric-card-header">
            <span className="metric-title">CPU CORE</span>
            <div className="metric-icon-box">
              <Icon name="cpu" size={14} />
            </div>
          </div>
          <div className="metric-card-body">
            {showSkeleton ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <Skeleton type="text" width="40%" height="10px" />
                <Skeleton type="text" width="80%" height="24px" />
                <Skeleton type="rect" width="100%" height="8px" borderRadius="4px" />
              </div>
            ) : (
              <>
                <div className="metric-info-row">
                  <span className="metric-subtitle">CARGA DE PROCESAMIENTO</span>
                  <span className="metric-value">56%</span>
                </div>
                <div className="metric-progress-wrapper">
                  <div 
                    className="metric-progress-bar" 
                    style={{ width: '56%', backgroundColor: '#eab308' }} 
                  ></div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
      <style>{`
        .metric-card {
          background: var(--bg-card);
          border-radius: 0px; /* Sharp corners */
          padding: 1.5rem;
          border: var(--laika-border-light);
          box-shadow: 0 10px 25px -10px rgba(0,0,0,0.2) !important;
          cursor: pointer;
          transition: all 0.2s ease;
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
          height: 100%;
        }
        .metric-card:hover { 
          border-color: var(--text-primary); 
          box-shadow: 0 15px 30px -10px rgba(0,0,0,0.3) !important; 
        }
        .metric-card-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding-bottom: 1rem;
          border-bottom: 1px solid rgba(0,0,0,0.06);
        }
        .metric-title {
          font-size: 0.9rem;
          font-weight: 900;
          color: var(--text-primary);
          letter-spacing: 0.05em;
        }
        .metric-icon-box {
          width: 24px;
          height: 24px;
          border: 1px solid #eee;
          border-radius: 4px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #aaa;
        }
        .metric-card-body {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }
        .metric-info-row {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
        }
        .metric-subtitle {
          font-size: 0.65rem;
          font-weight: 800;
          color: #999;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        .metric-value {
          font-size: 1.25rem;
          font-weight: 900;
          color: var(--text-primary);
          line-height: 1;
        }
        .metric-progress-wrapper {
          width: 100%;
          height: 8px;
          background: #f0f0f0;
          border-radius: 4px;
          overflow: hidden;
        }
        .metric-progress-bar {
          height: 100%;
          border-radius: 4px;
          transition: width 0.5s ease-in-out, background-color 0.5s ease;
        }
        .dashboard-footer-grid {
          display: flex; /* Changed from grid so they don't stretch */
          gap: 1.5rem;
          margin-top: 2rem;
          flex-wrap: wrap;
        }
        .metric-card {
          width: 380px; /* Fixed width so they aren't stretched */
          max-width: 100%; /* Responsive fallback */
        .premium-reset-btn { font-size: 0.65rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; border: 1px solid #eee !important; padding: 2px 8px !important; }
        .premium-reset-btn:hover { background: #000 !important; color: #fff !important; border-color: var(--text-primary) !important; }
      `}</style>


      <ConfirmationModal
        isOpen={isResetModalOpen}
        onClose={() => setIsResetModalOpen(false)}
        onConfirm={handleConfirmReset}
        title="Restablecer Orden"
        message="¿Estás seguro de que deseas restablecer el orden de las tarjetas del dashboard a su estado original?"
        confirmText="Restablecer"
        cancelText="Cancelar"
      />
    </div>
  )
}

export default Dashboard
