/* eslint-disable react/prop-types */
import React, { useRef } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useNotification } from '../context/NotificationContext'
import { getDefaultRouteByRole } from '../routes'
import Spinner from './Spinner'

const ProtectedRoute = ({ children, allowedRoles = null }) => {
  const { user, loading, hasRole } = useAuth()
  const { error, warning } = useNotification()
  const location = useLocation()

  // Ref para evitar doble notificación en re-rendersStrictMode
  const notificationRef = useRef(false)

  // 1. Loading State (Strict Execution Order)
  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        width: '100%',
        backgroundColor: '#111827', // Dark background to ensure spinner visibility
        color: '#fff'
      }}>
        <Spinner size="medium" text="Verificando..." />
      </div>
    )
  }

  // 2. No Active Session
  if (!user) {
    if (!notificationRef.current) {
        error('Sesión expirada o inválida. Por favor inicia sesión.')
        notificationRef.current = true
    }
    // Universal Replace: true
    return <Navigate to="/" state={{ from: location }} replace />
  }

  // 3. Role Mismatch
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
