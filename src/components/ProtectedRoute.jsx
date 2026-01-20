import React from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const ProtectedRoute = ({ children, allowedRoles = null }) => {
  const { user, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'rgba(255, 255, 255, 0.9)'
        }}
      >
        <div
          style={{
            width: '40px',
            height: '40px',
            border: '4px solid #f3f4f6',
            borderTopColor: '#667eea',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
          }}
        ></div>
      </div>
    )
  }

  // Si no hay usuario, redirigir a login guardando la ubicación actual
  if (!user) {
    return <Navigate to='/login' state={{ from: location }} replace />
  }

  // Si hay roles específicos requeridos
  if (allowedRoles) {
    const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles]

    if (!roles.includes(user.role)) {
      // Redirigir según el rol del usuario
      const redirectMap = {
        admin: '/admin',
        gestor: '/events/manage',
        operador: '/staff',
        usuario: '/'
      }

      return <Navigate to={redirectMap[user.role] || '/'} replace />
    }
  }

  return children
}

export default ProtectedRoute
