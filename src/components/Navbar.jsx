import React from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import './Navbar.css'

const Navbar = () => {
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const isAuthenticated = !!user

  const handleLogout = () => {
    logout()
    navigate('/login') // ✅ Manejar navegación aquí
  }

  const getDashboardLink = () => {
    if (!user?.role) return '/profile'

    switch (user.role) {
      case 'admin':
        return '/admin'
      case 'gestor':
        return '/gestor'
      case 'operador':
        return '/operador'
      default:
        return '/profile'
    }
  }

  return (
    <nav className='navbar'>
      <div className='navbar-container'>
        <Link to='/' className='navbar-logo'>
          🐕 LAIKA Club
        </Link>

        <ul className='navbar-menu'>
          <li>
            <Link to='/' className='navbar-link'>
              Inicio
            </Link>
          </li>

          {isAuthenticated ? (
            <>
              <li>
                <Link to={getDashboardLink()} className='navbar-link'>
                  Dashboard
                </Link>
              </li>
              <li>
                <Link to='/profile' className='navbar-link'>
                  Perfil
                </Link>
              </li>
              <li>
                <button
                  onClick={handleLogout}
                  className='navbar-btn navbar-btn-logout'
                >
                  Cerrar Sesión
                </button>
              </li>
            </>
          ) : (
            <>
              <li>
                <Link to='/login' className='navbar-btn navbar-btn-primary'>
                  Iniciar Sesión
                </Link>
              </li>
              <li>
                <Link
                  to='/register'
                  className='navbar-btn navbar-btn-secondary'
                >
                  Registrarse
                </Link>
              </li>
            </>
          )}
        </ul>
      </div>
    </nav>
  )
}

export default Navbar
