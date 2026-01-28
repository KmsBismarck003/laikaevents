import React from 'react'
import { Navigate } from 'react-router-dom'

const PrivateRoute = ({ children, roles = [] }) => {
  const token = localStorage.getItem('token')
  const user = JSON.parse(localStorage.getItem('user') || '{}')

  // No autenticado
  if (!token) {
    return <Navigate to='/login' replace />
  }

  // Si se especifican roles, verificar que el usuario tenga uno de ellos
  if (roles.length > 0 && !roles.includes(user.role)) {
    return <Navigate to='/' replace />
  }

  return children
}

export default PrivateRoute
