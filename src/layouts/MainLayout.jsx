import React, { useState, useEffect, useRef } from 'react'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Button } from '../components'
import Footer from '../components/Footer'
import ThemeToggle from '../components/ThemeToggle'
import Icon from '../components/Icons'
import './MainLayout.css'

const MainLayout = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, logout } = useAuth()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)
  const [showUserDropdown, setShowUserDropdown] = useState(false)
  const userDropdownRef = useRef(null)

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    setIsMobileMenuOpen(false)
    setShowUserDropdown(false)
  }, [location.pathname])

  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isMobileMenuOpen])

  // Cerrar dropdown al hacer click fuera
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (userDropdownRef.current && !userDropdownRef.current.contains(e.target)) {
        setShowUserDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleLogout = () => {
    logout()
    setShowUserDropdown(false)
    navigate('/login')
  }

  const isActive = path => {
    return location.pathname === path
  }

  const getUserInitials = () => {
    if (!user) return ''
    const first = user.firstName?.charAt(0) || ''
    const last = user.lastName?.charAt(0) || ''
    return (first + last).toUpperCase() || user.email?.charAt(0)?.toUpperCase() || 'U'
  }

  const getUserDisplayName = () => {
    if (!user) return ''
    if (user.firstName) return user.firstName
    return user.email?.split('@')[0] || 'Usuario'
  }

  const getDashboardLink = () => {
    if (!user?.role) return '/user/dashboard'
    switch (user.role) {
      case 'admin': return '/admin'
      case 'gestor': return '/events/manage'
      case 'operador': return '/staff'
      default: return '/user/dashboard'
    }
  }

  const getNavItems = () => {
    const items = [
      { path: '/', label: 'Eventos' },
      { path: '/info/nosotros', label: 'Nosotros' }
    ]
    return items
  }

  const navItems = getNavItems()

  return (
    <div className='main-layout'>
      <ThemeToggle />
      {/* Header / Navbar */}
      <header className={`navbar ${isScrolled ? 'navbar-scrolled' : ''}`}>
        <div className='navbar-container'>
          <div className='navbar-brand' onClick={() => navigate('/')}>
            <div className='brand-icon'>
              <svg width='32' height='32' viewBox='0 0 32 32' fill='none'>
                <circle cx='16' cy='16' r='14' fill='url(#gradient)' />
                <path d='M12 10L20 16L12 22V10Z' fill='white' />
                <defs>
                  <linearGradient id='gradient' x1='0' y1='0' x2='32' y2='32'>
                    <stop offset='0%' stopColor='#667eea' />
                    <stop offset='100%' stopColor='#764ba2' />
                  </linearGradient>
                </defs>
              </svg>
            </div>
            <span className='brand-name'>LAIKA Club</span>
          </div>

          {/* Desktop Navigation */}
          <nav className='navbar-nav desktop-nav'>
            {navItems.map(item => (
              <button
                key={item.path}
                className={`nav-link ${isActive(item.path) ? 'active' : ''}`}
                onClick={() => navigate(item.path)}
              >
                <span>{item.label}</span>
              </button>
            ))}
          </nav>

          {/* Desktop Actions */}
          <div className='navbar-actions desktop-actions'>
            {user ? (
              <div className='main-user-menu' ref={userDropdownRef}>
                <button
                  className='main-user-btn'
                  onClick={() => setShowUserDropdown(!showUserDropdown)}
                  aria-label='Menu de usuario'
                  aria-expanded={showUserDropdown}
                >
                  <span className='main-user-avatar'>
                    {user.profile_photo ? (
                      <img src={`http://localhost:8000${user.profile_photo}`} alt='' style={{width:'100%',height:'100%',objectFit:'cover',borderRadius:'50%'}} />
                    ) : <Icon name="user" size={20} />}
                  </span>
                  <span className='main-user-name'>
                    {getUserDisplayName()}
                  </span>
                  <svg
                    className={`main-user-chevron ${showUserDropdown ? 'open' : ''}`}
                    width='14'
                    height='14'
                    viewBox='0 0 24 24'
                    fill='none'
                    stroke='currentColor'
                    strokeWidth='2'
                    strokeLinecap='round'
                    strokeLinejoin='round'
                  >
                    <polyline points='6 9 12 15 18 9' />
                  </svg>
                </button>

                {showUserDropdown && (
                  <div className='main-user-dropdown'>
                    <div className='main-user-dropdown-header'>
                      <span className='main-user-dropdown-avatar'>
                        {user.profile_photo ? (
                          <img src={`http://localhost:8000${user.profile_photo}`} alt='' style={{width:'100%',height:'100%',objectFit:'cover',borderRadius:'50%'}} />
                        ) : <Icon name="user" size={24} />}
                      </span>
                      <div className='main-user-dropdown-info'>
                        <span className='main-user-dropdown-name'>
                          {user.firstName} {user.lastName}
                        </span>
                        <span className='main-user-dropdown-email'>
                          {user.email}
                        </span>
                      </div>
                    </div>

                    <div className='main-user-dropdown-divider' />

                    <button
                      className='main-user-dropdown-item'
                      onClick={() => navigate('/user/profile')}
                    >
                      <Icon name="user" size={18} />
                      Mi Perfil
                    </button>

                    <button
                      className='main-user-dropdown-item'
                      onClick={() => navigate(getDashboardLink())}
                    >
                      <Icon name="dashboard" size={18} />
                      Dashboard
                    </button>

                    <div className='main-user-dropdown-divider' />

                    <button
                      className='main-user-dropdown-item main-user-dropdown-logout'
                      onClick={handleLogout}
                    >
                      <Icon name="logout" size={18} />
                      Cerrar Sesion
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <>
                <Button variant='secondary' onClick={() => navigate('/login')}>
                  Iniciar Sesion
                </Button>
                <Button variant='primary' onClick={() => navigate('/register')}>
                  Registrarse
                </Button>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className='mobile-menu-btn'
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label='Menu'
            aria-expanded={isMobileMenuOpen}
          >
            <span className={`hamburger ${isMobileMenuOpen ? 'open' : ''}`}>
              <span></span>
              <span></span>
              <span></span>
            </span>
          </button>
        </div>

        {/* Mobile Navigation */}
        <div className={`mobile-nav ${isMobileMenuOpen ? 'open' : ''}`}>
          <nav className='mobile-nav-items'>
            {navItems.map(item => (
              <button
                key={item.path}
                className={`mobile-nav-link ${isActive(item.path) ? 'active' : ''}`}
                onClick={() => navigate(item.path)}
              >
                <span>{item.label}</span>
              </button>
            ))}
          </nav>

          <div className='mobile-nav-actions'>
            {user ? (
              <>
                <button
                  className='mobile-nav-link'
                  onClick={() => navigate('/user/profile')}
                >
                  <svg width='18' height='18' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round'>
                    <path d='M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2' />
                    <circle cx='12' cy='7' r='4' />
                  </svg>
                  <span>Mi Perfil</span>
                </button>
                <button
                  className='mobile-nav-link'
                  onClick={() => navigate(getDashboardLink())}
                >
                  <svg width='18' height='18' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round'>
                    <rect x='3' y='3' width='7' height='7' />
                    <rect x='14' y='3' width='7' height='7' />
                    <rect x='14' y='14' width='7' height='7' />
                    <rect x='3' y='14' width='7' height='7' />
                  </svg>
                  <span>Dashboard</span>
                </button>
                <button
                  className='mobile-nav-link danger'
                  onClick={handleLogout}
                >
                  <svg width='18' height='18' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round'>
                    <path d='M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4' />
                    <polyline points='16 17 21 12 16 7' />
                    <line x1='21' y1='12' x2='9' y2='12' />
                  </svg>
                  <span>Cerrar Sesion</span>
                </button>
              </>
            ) : (
              <>
                <Button
                  variant='secondary'
                  fullWidth
                  onClick={() => navigate('/login')}
                >
                  Iniciar Sesion
                </Button>
                <Button
                  variant='primary'
                  fullWidth
                  onClick={() => navigate('/register')}
                >
                  Registrarse
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Overlay para cerrar menu movil */}
      {isMobileMenuOpen && (
        <div
          className='mobile-overlay'
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Main Content */}
      <main className='main-content'>
        <Outlet />
      </main>

      {/* Footer */}
      <Footer />
    </div>
  )
}

export default MainLayout
