/* eslint-disable react/prop-types */
import React, { useRef } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useSystem } from '../context/SystemContext'
import { useNotification } from '../context/NotificationContext'
import { getDefaultRouteByRole } from '../routes'
import { LoadingScreen } from './index'

const ProtectedRoute = ({ children, allowedRoles = null }) => {
  const { user, loading, hasRole } = useAuth()
  const { isHardLocked } = useSystem()
  const { error, warning } = useNotification()
  const location = useLocation()

  // Ref para evitar doble notificación en re-rendersStrictMode
  const notificationRef = useRef(false)

  // 1. Loading State (Instant UI Transition)
  if (loading) {
    return <LoadingScreen />;
  }

  // 2. No Active Session
  if (!user) {
    // Si todavía hay datos en localStorage, podríamos estar en un parpadeo de red
    // Mantenemos al usuario un momento más antes de expulsar
    const hasToken = !!localStorage.getItem('token');
    if (hasToken) {
      // ARRANCADO DE RAIZ: No bloqueamos con pantalla de carga. 
      // Devolvemos null para que el layout se mantenga o se reintente silenciosamente.
      return null;
    }

    if (!notificationRef.current) {
      // Notification removed
      notificationRef.current = true
    }
    return <Navigate to="/login" state={{ from: location }} replace />
  }
  // 3. HARD LOCKOUT (PROTOCOL WINTER LEVEL 5)
  if (isHardLocked && user && user.role !== 'admin') {
    return <Navigate to="/maintenance" replace />
  }

  // 4. Role Mismatch
  if (allowedRoles && !hasRole(allowedRoles)) {
    if (!notificationRef.current) {
      warning('No tienes permisos para acceder a esta sección.')
      notificationRef.current = true
    }
    // Smart Redirect
    const redirectPath = getDefaultRouteByRole(user.role)
    return <Navigate to={redirectPath} replace />
  }

  // 4. Authorized
  return children
}

export default ProtectedRoute
