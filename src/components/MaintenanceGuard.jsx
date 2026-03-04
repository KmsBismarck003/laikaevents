import { useEffect, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useSystem } from '../context/SystemContext'
import { useAuth } from '../context/AuthContext'

const MaintenanceGuard = ({ children }) => {
  const navigate = useNavigate()
  const location = useLocation()
  const { maintenanceMode, isRestored, isLoading } = useSystem()
  const { user } = useAuth()

  // Local state for restoration UI (if not handled by Maintenance page itself)
  const [showRestored, setShowRestored] = useState(false)

  // Determine if we should redirect (Blocking Render)
  const isMaintenancePage = location.pathname === '/maintenance'
  const isAdmin = user?.role === 'admin'
  const shouldRedirectToMaintenance = maintenanceMode && !isAdmin && !isMaintenancePage
  const shouldRedirectToHome = !maintenanceMode && isMaintenancePage && !isRestored

  useEffect(() => {
    if (isLoading) return

    if (shouldRedirectToMaintenance) {
         console.log('🔒 Redirecting to Maintenance Page')
         navigate('/maintenance', { replace: true })
    } else if (shouldRedirectToHome) {
          // If user manually navigates to /maintenance while system is UP
          navigate('/', { replace: true })
    }
  }, [maintenanceMode, isLoading, user, location.pathname, navigate, isRestored, shouldRedirectToMaintenance, shouldRedirectToHome])

  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#0a0a0a' }}>
        <div className='spinner'></div>
      </div>
    )
  }

  // CRITICAL FIX: Do not render children if we are about to redirect.
  // This prevents React from trying to mount/hydrate components that are immediately removed.
  if (shouldRedirectToMaintenance || shouldRedirectToHome) {
      return null
  }

  return (
    <div className="app-content-wrapper" style={{ width: '100%', height: '100%' }}>
      {children}
    </div>
  )
}

export default MaintenanceGuard
