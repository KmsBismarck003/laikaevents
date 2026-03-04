import React from 'react'
import { Outlet, useNavigate } from 'react-router-dom'
import './AuthLayout.css'

const AuthLayout = () => {
  const navigate = useNavigate()

  return (
    <div className='auth-layout'>
      {/* Header simple */}
      <header className='auth-header'>
        <div className='auth-header-container'>
          <div className='auth-brand' onClick={() => navigate('/')}>
            <span className='auth-brand-icon'>🐕</span>
            <span className='auth-brand-name'>LAIKA Clubxd2</span>
          </div>
        </div>
      </header>

      {/* Main Content (Login/Register forms) */}
      <main className='auth-main'>
        <Outlet />
      </main>

      {/* Footer simple */}
      <footer className='auth-footer'>
        <div className='auth-footer-content'>
          <p>&copy; 2025 LAIKA Club. Todos los derechos reservados.</p>
          <div className='auth-footer-links'>
            <a href='/terms'>Términos</a>
            <span>•</span>
            <a href='/privacy'>Privacidad</a>
            <span>•</span>
            <a href='/contact'>Contacto</a>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default AuthLayout
