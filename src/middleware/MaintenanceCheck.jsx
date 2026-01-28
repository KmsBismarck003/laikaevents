import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'

const MaintenanceCheck = ({ children }) => {
  const navigate = useNavigate()

  useEffect(() => {
    checkMaintenanceMode()

    // Verificar cada 30 segundos
    const interval = setInterval(checkMaintenanceMode, 30000)

    return () => clearInterval(interval)
  }, [])

  const checkMaintenanceMode = async () => {
    try {
      const config = await api.config.getConfig()
      const user = JSON.parse(localStorage.getItem('user') || '{}')

      if (config.maintenanceMode && user.role !== 'admin') {
        // Redirigir a página de mantenimiento
        navigate('/maintenance')
      }
    } catch (error) {
      console.error('Error verificando modo mantenimiento:', error)
    }
  }

  return children
}

export default MaintenanceCheck
