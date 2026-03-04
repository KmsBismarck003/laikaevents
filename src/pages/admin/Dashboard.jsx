import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../../services/api'
import { useNotification } from '../../context/NotificationContext'
import { Card, Button, Badge, Alert, Spinner, Icon } from '../../components'
import './admin.css'

const Dashboard = () => {
  const navigate = useNavigate()
  const { success, error: showError } = useNotification()
  const [loading, setLoading] = useState(true)
  const [loadingErrors, setLoadingErrors] = useState([])
  const [alert, setAlert] = useState(null)

  const [stats, setStats] = useState({
    totalUsers: 0,
    totalEvents: 0,
    totalSales: 0,
    activeUsers: 0
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

      // Use Promise.race for timeout handling as in original
      const statsPromise = api.stats.getAdminDashboard()
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Timeout en estadísticas')), 5000)
      )

      try {
        const statsResponse = await Promise.race([statsPromise, timeoutPromise])
        console.log('✅ Estadísticas obtenidas:', statsResponse)

        setStats({
          totalUsers: statsResponse.totalUsers || statsResponse.total_users || 0,
          totalEvents: statsResponse.totalEvents || statsResponse.total_events || 0,
          totalSales: statsResponse.totalSales || statsResponse.total_sales || 0,
          activeUsers: statsResponse.activeUsers || statsResponse.active_users || 0
        })
      } catch (error) {
        console.error('❌ Error al cargar estadísticas:', error)
        errors.push('Estadísticas no disponibles')
      }

      if (errors.length > 0) {
        setLoadingErrors(errors)
        setAlert({
          type: 'warning',
          message: `Algunos datos no se pudieron cargar: ${errors.join(', ')}`
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

  if (loading) {
    return <Spinner fullScreen text="Cargando dashboard..." />
  }

  return (
    <div className="admin-dashboard-page">
      <div className="dashboard-header">
        <h1>Panel de Administración</h1>
        <p>Control Total del Sistema LAIKA Club v2.6</p>
      </div>

      {alert && (
        <Alert
          type={alert.type}
          message={alert.message}
          onClose={() => setAlert(null)}
        />
      )}

      {loadingErrors.length > 0 && !alert && (
        <Alert
          type="warning"
          message="Advertencia: Algunos servicios no respondieron correctamente"
          onClose={() => setLoadingErrors([])}
        />
      )}

      <div className="stats-grid">
        <Card className="stat-card">
          <div className="stat-content">
            <div className="stat-icon bg-blue">
              <Icon name="users" size={28} />
            </div>
            <div className="stat-info">
              <p className="stat-label">Total Usuarios</p>
              <h2 className="stat-value">{stats.totalUsers.toLocaleString()}</h2>
            </div>
          </div>
        </Card>

        <Card className="stat-card">
          <div className="stat-content">
            <div className="stat-icon bg-yellow">
              <Icon name="calendar" size={28} />
            </div>
            <div className="stat-info">
              <p className="stat-label">Eventos Activos</p>
              <h2 className="stat-value">{stats.totalEvents}</h2>
            </div>
          </div>
        </Card>

        <Card className="stat-card">
          <div className="stat-content">
            <div className="stat-icon bg-green">
              <Icon name="dollarSign" size={28} />
            </div>
            <div className="stat-info">
              <p className="stat-label">Ventas Totales</p>
              <h2 className="stat-value">${stats.totalSales.toLocaleString()}</h2>
            </div>
          </div>
        </Card>

        <Card className="stat-card">
          <div className="stat-content">
            <div className="stat-icon bg-cyan">
              <Icon name="checkCircle" size={28} />
            </div>
            <div className="stat-info">
              <p className="stat-label">Usuarios Activos</p>
              <h2 className="stat-value">{stats.activeUsers}</h2>
            </div>
          </div>
        </Card>
      </div>

      <div className="dashboard-shortcuts">
        <h3>Accesos Rápidos</h3>
        <div className="shortcuts-grid">
          <Button onClick={() => navigate('/admin/users')}>Gestionar Usuarios</Button>
          <Button onClick={() => navigate('/admin/events')}>Gestionar Eventos</Button>
          <Button onClick={() => navigate('/admin/cms')}>Gestionar Contenidos</Button>
          <Button onClick={() => navigate('/admin/ads')}>Publicidad</Button>
          <Button onClick={() => navigate('/admin/database')}>Respaldo de BD</Button>
          <Button onClick={() => navigate('/admin/logs')}>Ver Logs</Button>
        </div>
      </div>
    </div>
  )
}

export default Dashboard
