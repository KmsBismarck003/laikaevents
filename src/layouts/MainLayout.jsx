import React, { useState, useEffect, useRef } from 'react'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useCart } from '../context/CartContext'
import { Button, NewsTicker, Dropdown, SkeletonMainHeader, SkeletonSearchRow, SkeletonNewsTicker } from '../components'
import Footer from '../components/Footer'
import ThemeToggle from '../components/ThemeToggle'
import LaikaAgent from '../components/LaikaAgent/LaikaAgent'
import Icon from '../components/Icons'
import { useSkeletonContext } from '../context/SkeletonContext'
import './MainLayout.css'

const MainLayout = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, logout } = useAuth()
  const { cartCount, toggleCart } = useCart()
  const { showSkeleton } = useSkeletonContext()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)
  const [showUserDropdown, setShowUserDropdown] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchLocation, setSearchLocation] = useState('Todo México')
  const [searchDate, setSearchDate] = useState('Todas las fechas')
  const userDropdownRef = useRef(null)

  const isHome = location.pathname === '/'


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

  function handleLogout() {
    logout()
    setShowUserDropdown(false)
    navigate('/login')
  }

  function handleSearch(e) {
    if (e) e.preventDefault()
    // Navigate to home with search params
    const params = new URLSearchParams()
    if (searchQuery) params.append('q', searchQuery)
    if (searchLocation !== 'Todo México') params.append('city', searchLocation)

    navigate(`/?${params.toString()}`)
    // Smooth scroll to events section if on home
    if (location.pathname === '/') {
      const eventsElement = document.querySelector('.home-main');
      if (eventsElement) {
        eventsElement.scrollIntoView({ behavior: 'smooth' });
      }
    }
  }




  const isActive = path => {
    return location.pathname === path
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
      {isHome && (showSkeleton ? <SkeletonNewsTicker /> : <NewsTicker />)}
      {/* Header / Navbar */}
      <header className={`main-navbar ${isScrolled ? 'main-navbar-scrolled' : ''}`}>
        <div className='main-navbar-container'>
          {/* Row 1: Brand, Links, Actions */}
          {showSkeleton ? (
            <SkeletonMainHeader />
          ) : (
            <div className="navbar-top-row">
              <div className="brand-nav-group">
                <div className='main-navbar-brand' onClick={() => navigate('/')}>
                  <img src="/logob.png" alt="LAIKA Club" style={{ height: '32px' }} />
                </div>
                <nav className='main-navbar-nav desktop-nav'>
                  <button className='main-nav-link' onClick={() => navigate('/?category=concert')}>Conciertos y Festivales</button>
                  <button className='main-nav-link' onClick={() => navigate('/?category=theater')}>Teatro y Cultura</button>
                  <button className='main-nav-link' onClick={() => navigate('/?category=sport')}>Deportes</button>
                  <button className='main-nav-link' onClick={() => navigate('/?category=family')}>Familiares</button>
                  <button className='main-nav-link' onClick={() => navigate('/?category=other')}>Especiales</button>
                  <button className='main-nav-link' onClick={() => navigate('/?city=CDMX')}>Ciudades</button>
                </nav>
              </div>

              <div className='main-navbar-actions desktop-actions'>
                <ThemeToggle variant="inline" />
                <button
                  className="navbar-cart-btn-main"
                  onClick={toggleCart}
                  aria-label="Ver carrito"
                >
                  <Icon name="shoppingCart" size={18} />
                  {cartCount > 0 && (
                    <span className="cart-badge-main">{cartCount}</span>
                  )}
                </button>
                {user ? (
                  <div className='main-user-menu-group'>
                    <button
                      className="main-nav-link admin-navbar-btn"
                      onClick={() => navigate(getDashboardLink())}
                    >
                      <Icon name="dashboard" size={16} />
                      <span>MANAGER</span>
                    </button>
                    <div
                      className='main-user-menu'
                      ref={userDropdownRef}
                    >
                      <button className='main-user-btn' onClick={() => setShowUserDropdown(!showUserDropdown)}>
                        <span className="main-user-avatar-circle">
                          {(user?.avatarUrl || user?.avatar_url) ? (
                            <img 
                              src={(user.avatarUrl || user.avatar_url).startsWith('http') || (user.avatarUrl || user.avatar_url).startsWith('data:')
                                ? (user.avatarUrl || user.avatar_url) 
                                : `${process.env.REACT_APP_API_HOST || 'http://localhost:8000'}${user.avatarUrl || user.avatar_url}`} 
                              alt="Avatar" 
                              style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }}
                              onError={(e) => {
                                e.currentTarget.style.display = 'none';
                                e.currentTarget.parentElement.innerHTML = '<div class="avatar-fallback-mini">' + 
                                  ((user?.firstName?.[0] || user?.first_name?.[0] || 'U')).toUpperCase() + 
                                  '</div>';
                              }}
                            />
                          ) : (
                            <Icon name="user" size={18} />
                          )}
                        </span>
                        <span className='main-user-name'>{getUserDisplayName()}</span>
                        <Icon name="chevronDown" size={14} className={showUserDropdown ? 'open' : ''} />
                      </button>
                      {showUserDropdown && (
                        <div className='main-user-dropdown'>
                          <div className='main-user-dropdown-header'>
                            <div className='main-user-dropdown-info'>
                              <span className='main-user-dropdown-name'>{user.firstName} {user.lastName}</span>
                              <span className='main-user-dropdown-email'>{user.email}</span>
                            </div>
                          </div>
                          <div className='main-user-dropdown-divider' />
                          <button className='main-user-dropdown-item' onClick={() => navigate('/user/profile')}>
                            <Icon name="user" size={18} /> Mi Perfil
                          </button>
                          <button className='main-user-dropdown-item' onClick={() => navigate(getDashboardLink())}>
                            <Icon name="dashboard" size={18} /> Dashboard
                          </button>
                          <div className='main-user-dropdown-divider' />
                          <button className='main-user-dropdown-item main-user-dropdown-logout' onClick={handleLogout}>
                            <Icon name="logout" size={18} /> Cerrar Sesión
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <button className="tm-login-btn" onClick={() => navigate('/login')}>
                    <Icon name="user" size={16} />
                    <span>Ingresa</span>
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Row 2: Ticketmaster Search Bar */}
          {showSkeleton ? (
            <SkeletonSearchRow />
          ) : (
            <div className="navbar-search-row">
              <form className="tm-search-block" onSubmit={handleSearch}>
                <div className="search-section">
                  <Icon name="mapPin" size={16} className="section-icon" />
                  <div className="section-content">
                    <span className="label">UBICACIÓN</span>
                    <Dropdown
                      triggerOnHover
                      className="value-dropdown"
                      trigger={<span className="value">{searchLocation}</span>}
                    >
                      <Dropdown.Item onClick={() => setSearchLocation('Todo México')}>Todo México</Dropdown.Item>
                      <Dropdown.Item onClick={() => setSearchLocation('CDMX')}>CDMX</Dropdown.Item>
                      <Dropdown.Item onClick={() => setSearchLocation('Guadalajara')}>Guadalajara</Dropdown.Item>
                      <Dropdown.Item onClick={() => setSearchLocation('Monterrey')}>Monterrey</Dropdown.Item>
                    </Dropdown>
                  </div>
                </div>
                <div className="search-divider" />
                <div className="search-section">
                  <Icon name="calendar" size={16} className="section-icon" />
                  <div className="section-content">
                    <span className="label">FECHAS</span>
                    <Dropdown
                      triggerOnHover
                      className="value-dropdown"
                      trigger={<span className="value">{searchDate}</span>}
                    >
                      <Dropdown.Item onClick={() => setSearchDate('Todas las fechas')}>Todas las fechas</Dropdown.Item>
                      <Dropdown.Item onClick={() => setSearchDate('Hoy')}>Hoy</Dropdown.Item>
                      <Dropdown.Item onClick={() => setSearchDate('Mañana')}>Mañana</Dropdown.Item>
                      <Dropdown.Item onClick={() => setSearchDate('Este fin')}>Este fin de semana</Dropdown.Item>
                    </Dropdown>
                  </div>
                  <Icon name="chevronDown" size={12} className="chevron" />
                </div>
                <div className="search-divider" />
                <div className="search-section search-query">
                  <Icon name="search" size={16} className="section-icon" />
                  <div className="section-content">
                    <span className="label">BUSCAR</span>
                    <input
                      type="text"
                      placeholder="Artista, evento o inmueble"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                </div>
                <button type="submit" className="search-submit-btn">Buscar</button>
              </form>
            </div>
          )}

          {/* Mobile Menu Button - Moved inside container and hidden on desktop */}
          <button
            className='main-mobile-toggle'
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label='Menu'
            aria-expanded={isMobileMenuOpen}
          >
            <span className={`main-mobile-toggle-icon ${isMobileMenuOpen ? 'open' : ''}`}>
              <span></span>
              <span></span>
              <span></span>
            </span>
          </button>
        </div>
      </header>

      {/* Mobile Navigation */}
      <div className={`main-mobile-nav ${isMobileMenuOpen ? 'main-mobile-nav--open' : ''}`}>
        <nav className='main-mobile-nav-items'>
          <button className='main-mobile-nav-link' onClick={() => { navigate('/'); setIsMobileMenuOpen(false); }}>
            <span>Conciertos y Festivales</span>
          </button>
          <button className='main-mobile-nav-link' onClick={() => { navigate('/'); setIsMobileMenuOpen(false); }}>
            <span>Teatro y Cultura</span>
          </button>
          {/* Add more as needed */}
        </nav>

        <div className='main-mobile-nav-divider' />

        <div className='main-mobile-nav-actions'>
          <button
            className="main-mobile-nav-link main-mobile-nav-cart"
            onClick={() => { toggleCart(); setIsMobileMenuOpen(false); }}
          >
            <Icon name="shoppingCart" size={20} />
            <span>Ver mi carrito</span>
            {cartCount > 0 && (
              <span className="mobile-cart-badge">{cartCount}</span>
            )}
          </button>
          {user ? (
            <>
              <button className='main-mobile-nav-link' onClick={() => { navigate('/user/profile'); setIsMobileMenuOpen(false); }}>
                <Icon name="user" size={18} />
                <span>Mi Perfil</span>
              </button>
              <button className='main-mobile-nav-link danger' onClick={handleLogout}>
                <Icon name="logout" size={18} />
                <span>Cerrar Sesión</span>
              </button>
            </>
          ) : (
            <>
              <Button variant='primary' fullWidth onClick={() => { navigate('/login'); setIsMobileMenuOpen(false); }}>
                Iniciar Sesión
              </Button>
            </>
          )}
        </div>
      </div >

      {/* Overlay para cerrar menu movil */}
      {
        isMobileMenuOpen && (
          <div className='main-mobile-overlay' onClick={() => setIsMobileMenuOpen(false)} />
        )
      }

      {/* Main Content */}
      <main className='main-content'>
        <Outlet />
        <LaikaAgent />
      </main>

      {/* Footer */}
      <Footer />
    </div >
  )
}

export default MainLayout
