import { useEffect, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useSystem } from '../context/SystemContext'
import { useAuth } from '../context/AuthContext'
import { LoadingScreen } from './index'

const MaintenanceGuard = ({ children }) => {
  const navigate = useNavigate()
  const location = useLocation()
  const { maintenanceMode, isRestored, isLoading, isHardLocked } = useSystem()
  const { user } = useAuth()

  // Local state for restoration UI (if not handled by Maintenance page itself)
  const [showRestored, setShowRestored] = useState(false)

  // Determine if we should redirect (Blocking Render)
  const isMaintenancePage = location.pathname === '/maintenance'
  const isAuthPage = location.pathname === '/login' || location.pathname === '/register'
  const isAdmin = user?.role === 'admin'
  const isAuthorized = isAdmin || isAuthPage // Admins or Auth pages are allowed
  const shouldRedirectToMaintenance = (maintenanceMode || isHardLocked) && !isAuthorized && !isMaintenancePage
  const shouldRedirectToHome = !maintenanceMode && !isHardLocked && isMaintenancePage && !isRestored

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


  // CRITICAL FIX: Do not render children if we are about to redirect OR loading.
  if (isLoading) return <LoadingScreen />
  
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
