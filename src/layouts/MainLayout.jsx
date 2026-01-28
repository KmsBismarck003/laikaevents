import React, { useState, useEffect } from 'react'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { Button, Dropdown, Badge } from '../components'
import './MainLayout.css'

const MainLayout = ({ user }) => {
  const navigate = useNavigate()
  const location = useLocation()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)

  // Detectar scroll para cambiar estilo del navbar
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20)
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Cerrar menú móvil al cambiar de ruta
  useEffect(() => {
    setIsMobileMenuOpen(false)
  }, [location.pathname])

  // Prevenir scroll cuando el menú móvil está abierto
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

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    navigate('/login')
  }

  const isActive = path => {
    return location.pathname === path
  }

  const getNavItems = () => {
    if (!user) {
      return [
        { path: '/', label: 'Eventos', icon: '🎫' },
        { path: '/about', label: 'Nosotros', icon: 'ℹ️' }
      ]
    }

    const baseItems = [
      { path: '/', label: 'Eventos', icon: '🎫' },
      { path: '/profile', label: 'Mi Perfil', icon: '👤' }
    ]

    switch (user.role) {
      case 'admin':
        baseItems.push({
          path: '/admin',
          label: 'Administración',
          icon: '⚙️'
        })
        break
      case 'gestor':
        baseItems.push({
          path: '/events/manage',
          label: 'Mis Eventos',
          icon: '🎭'
        })
        break
      case 'operador':
        baseItems.push({
          path: '/staff',
          label: 'Verificación',
          icon: '✓'
        })
        break
      default:
        break
    }

    return baseItems
  }

  const navItems = getNavItems()
  const currentYear = new Date().getFullYear()

  return (
    <div className='main-layout'>
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
                <span className='nav-icon'>{item.icon}</span>
                <span>{item.label}</span>
              </button>
            ))}
          </nav>

          {/* Desktop Actions */}
          <div className='navbar-actions desktop-actions'>
            {user ? (
              <>
                <button
                  className='notification-btn'
                  aria-label='Notificaciones'
                >
                  <span className='notification-icon'>🔔</span>
                  <Badge variant='danger' className='notification-badge'>
                    3
                  </Badge>
                </button>

                <Dropdown
                  trigger={
                    <button className='user-menu-trigger'>
                      <div className='user-avatar'>
                        {user.firstName?.charAt(0)?.toUpperCase() || '👤'}
                      </div>
                      <span className='user-name'>{user.firstName}</span>
                      <span className='dropdown-arrow'>▼</span>
                    </button>
                  }
                  align='right'
                >
                  <Dropdown.Item icon='👤' onClick={() => navigate('/profile')}>
                    Mi Perfil
                  </Dropdown.Item>
                  <Dropdown.Item
                    icon='🎫'
                    onClick={() => navigate('/my-tickets')}
                  >
                    Mis Boletos
                  </Dropdown.Item>
                  <Dropdown.Item
                    icon='⚙️'
                    onClick={() => navigate('/settings')}
                  >
                    Configuración
                  </Dropdown.Item>
                  <Dropdown.Divider />
                  <Dropdown.Item icon='🚪' danger onClick={handleLogout}>
                    Cerrar Sesión
                  </Dropdown.Item>
                </Dropdown>
              </>
            ) : (
              <>
                <Button variant='secondary' onClick={() => navigate('/login')}>
                  Iniciar Sesión
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
            aria-label='Menú'
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
                <span className='nav-icon'>{item.icon}</span>
                <span>{item.label}</span>
              </button>
            ))}
          </nav>

          <div className='mobile-nav-actions'>
            {user ? (
              <>
                <button
                  className='mobile-nav-link'
                  onClick={() => navigate('/profile')}
                >
                  <span className='nav-icon'>👤</span>
                  <span>Mi Perfil</span>
                </button>
                <button
                  className='mobile-nav-link'
                  onClick={() => navigate('/my-tickets')}
                >
                  <span className='nav-icon'>🎫</span>
                  <span>Mis Boletos</span>
                </button>
                <button
                  className='mobile-nav-link danger'
                  onClick={handleLogout}
                >
                  <span className='nav-icon'>🚪</span>
                  <span>Cerrar Sesión</span>
                </button>
              </>
            ) : (
              <>
                <Button
                  variant='secondary'
                  fullWidth
                  onClick={() => navigate('/login')}
                >
                  Iniciar Sesión
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

      {/* Overlay para cerrar menú móvil */}
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
      <footer className='footer'>
        <div className='footer-container'>
          <div className='footer-section footer-brand'>
            <div className='footer-logo'>
              <div className='brand-icon'>
                <svg width='40' height='40' viewBox='0 0 32 32' fill='none'>
                  <circle cx='16' cy='16' r='14' fill='url(#footerGradient)' />
                  <path d='M12 10L20 16L12 22V10Z' fill='white' />
                  <defs>
                    <linearGradient
                      id='footerGradient'
                      x1='0'
                      y1='0'
                      x2='32'
                      y2='32'
                    >
                      <stop offset='0%' stopColor='#667eea' />
                      <stop offset='100%' stopColor='#764ba2' />
                    </linearGradient>
                  </defs>
                </svg>
              </div>
              <h3 className='footer-title'>LAIKA Club</h3>
            </div>
            <p className='footer-description'>
              La plataforma líder para descubrir y disfrutar los mejores
              eventos. Conectamos personas con experiencias inolvidables.
            </p>
            <div className='social-links'>
              <a href='#' className='social-link' aria-label='Facebook'>
                <svg
                  width='20'
                  height='20'
                  viewBox='0 0 24 24'
                  fill='currentColor'
                >
                  <path d='M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z' />
                </svg>
              </a>
              <a href='#' className='social-link' aria-label='Instagram'>
                <svg
                  width='20'
                  height='20'
                  viewBox='0 0 24 24'
                  fill='currentColor'
                >
                  <path d='M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z' />
                </svg>
              </a>
              <a href='#' className='social-link' aria-label='Twitter'>
                <svg
                  width='20'
                  height='20'
                  viewBox='0 0 24 24'
                  fill='currentColor'
                >
                  <path d='M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z' />
                </svg>
              </a>
              <a href='#' className='social-link' aria-label='YouTube'>
                <svg
                  width='20'
                  height='20'
                  viewBox='0 0 24 24'
                  fill='currentColor'
                >
                  <path d='M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z' />
                </svg>
              </a>
            </div>
          </div>

          <div className='footer-section'>
            <h4 className='footer-heading'>Categorías</h4>
            <ul className='footer-links'>
              <li>
                <a href='/events/conciertos'>Conciertos</a>
              </li>
              <li>
                <a href='/events/deportes'>Deportes</a>
              </li>
              <li>
                <a href='/events/teatro'>Teatro</a>
              </li>
              <li>
                <a href='/events/festivales'>Festivales</a>
              </li>
              <li>
                <a href='/events/cultural'>Cultural</a>
              </li>
            </ul>
          </div>

          <div className='footer-section'>
            <h4 className='footer-heading'>Ayuda</h4>
            <ul className='footer-links'>
              <li>
                <a href='/faq'>Preguntas Frecuentes</a>
              </li>
              <li>
                <a href='/contact'>Contacto</a>
              </li>
              <li>
                <a href='/support'>Soporte</a>
              </li>
              <li>
                <a href='/refunds'>Devoluciones</a>
              </li>
            </ul>
          </div>

          <div className='footer-section'>
            <h4 className='footer-heading'>Legal</h4>
            <ul className='footer-links'>
              <li>
                <a href='/terms'>Términos y Condiciones</a>
              </li>
              <li>
                <a href='/privacy'>Política de Privacidad</a>
              </li>
              <li>
                <a href='/cookies'>Política de Cookies</a>
              </li>
              <li>
                <a href='/security'>Seguridad</a>
              </li>
            </ul>
          </div>
        </div>

        <div className='footer-bottom'>
          <div className='footer-bottom-content'>
            <p>
              &copy; {currentYear} LAIKA Club. Todos los derechos reservados.
            </p>
            <div className='footer-bottom-links'>
              <a href='/sitemap'>Mapa del sitio</a>
              <span className='separator'>•</span>
              <a href='/accessibility'>Accesibilidad</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default MainLayout
