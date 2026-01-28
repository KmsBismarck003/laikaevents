import { useEffect, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import api from '../services/api'

const MaintenanceGuard = ({ children }) => {
  const navigate = useNavigate()
  const location = useLocation()
  const [isChecking, setIsChecking] = useState(true)
  const [maintenanceMode, setMaintenanceMode] = useState(false)

  useEffect(() => {
    let isMounted = true

    const checkMaintenanceMode = async () => {
      try {
        const config = await api.config.getConfig()

        if (!isMounted) return

        const user = JSON.parse(localStorage.getItem('user') || '{}')
        const isMaintenance = config.maintenanceMode || config.maintenance_mode

        setMaintenanceMode(isMaintenance)

        // Si está en mantenimiento y NO es admin, redirigir
        if (isMaintenance && user.role !== 'admin') {
          if (location.pathname !== '/maintenance') {
            navigate('/maintenance', { replace: true })
          }
        } else if (!isMaintenance && location.pathname === '/maintenance') {
          navigate('/', { replace: true })
        }
      } catch (error) {
        console.error('Error verificando modo mantenimiento:', error)
      } finally {
        if (isMounted) {
          setIsChecking(false)
        }
      }
    }

    checkMaintenanceMode()

    // Verificar cada 30 segundos
    const interval = setInterval(checkMaintenanceMode, 30000)

    return () => {
      isMounted = false
      clearInterval(interval)
    }
  }, [location.pathname, navigate])

  if (isChecking) {
    return (
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
          background: '#0a0a0a'
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <div className='spinner'></div>
          <p style={{ color: '#c0c0c0', marginTop: '16px' }}>
            Verificando estado del sistema...
          </p>
        </div>
      </div>
    )
  }

  return children
}

export default MaintenanceGuard
