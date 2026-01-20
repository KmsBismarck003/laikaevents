import React, { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Button, Dropdown, Badge } from '../components';
import './MainLayout.css';

const MainLayout = ({ user }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    // TODO: Integrar con API y context
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const isActive = (path) => {
    return location.pathname === path;
  };

  const getNavItems = () => {
    if (!user) {
      return [
        { path: '/', label: 'Eventos', icon: '🎫' },
        { path: '/about', label: 'Nosotros', icon: 'ℹ️' }
      ];
    }

    const baseItems = [
      { path: '/', label: 'Eventos', icon: '🎫' },
      { path: '/profile', label: 'Mi Perfil', icon: '👤' }
    ];

    // Agregar items según el rol
    switch (user.role) {
      case 'admin':
        baseItems.push({ path: '/admin', label: 'Administración', icon: '⚙️' });
        break;
      case 'gestor':
        baseItems.push({ path: '/events/manage', label: 'Mis Eventos', icon: '🎭' });
        break;
      case 'operador':
        baseItems.push({ path: '/staff', label: 'Verificación', icon: '✓' });
        break;
      default:
        break;
    }

    return baseItems;
  };

  const navItems = getNavItems();

  return (
    <div className="main-layout">
      {/* Header / Navbar */}
      <header className="navbar">
        <div className="navbar-container">
          <div className="navbar-brand" onClick={() => navigate('/')}>
            <span className="brand-icon">🐕</span>
            <span className="brand-name">LAIKA Club</span>
          </div>

          {/* Desktop Navigation */}
          <nav className="navbar-nav desktop-nav">
            {navItems.map((item) => (
              <button
                key={item.path}
                className={`nav-link ${isActive(item.path) ? 'active' : ''}`}
                onClick={() => navigate(item.path)}
              >
                <span className="nav-icon">{item.icon}</span>
                <span>{item.label}</span>
              </button>
            ))}
          </nav>

          {/* Desktop Actions */}
          <div className="navbar-actions desktop-actions">
            {user ? (
              <>
                <button className="notification-btn">
                  <span className="notification-icon">🔔</span>
                  <Badge variant="danger" className="notification-badge">3</Badge>
                </button>

                <Dropdown
                  trigger={
                    <button className="user-menu-trigger">
                      <span className="user-avatar">👤</span>
                      <span className="user-name">{user.firstName}</span>
                      <span className="dropdown-arrow">▼</span>
                    </button>
                  }
                  align="right"
                >
                  <Dropdown.Item icon="👤" onClick={() => navigate('/profile')}>
                    Mi Perfil
                  </Dropdown.Item>
                  <Dropdown.Item icon="🎫" onClick={() => navigate('/my-tickets')}>
                    Mis Boletos
                  </Dropdown.Item>
                  <Dropdown.Item icon="⚙️" onClick={() => navigate('/settings')}>
                    Configuración
                  </Dropdown.Item>
                  <Dropdown.Divider />
                  <Dropdown.Item icon="🚪" danger onClick={handleLogout}>
                    Cerrar Sesión
                  </Dropdown.Item>
                </Dropdown>
              </>
            ) : (
              <>
                <Button variant="secondary" onClick={() => navigate('/login')}>
                  Iniciar Sesión
                </Button>
                <Button variant="primary" onClick={() => navigate('/register')}>
                  Registrarse
                </Button>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button 
            className="mobile-menu-btn"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? '✕' : '☰'}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <div className="mobile-nav">
            <nav className="mobile-nav-items">
              {navItems.map((item) => (
                <button
                  key={item.path}
                  className={`mobile-nav-link ${isActive(item.path) ? 'active' : ''}`}
                  onClick={() => {
                    navigate(item.path);
                    setIsMobileMenuOpen(false);
                  }}
                >
                  <span className="nav-icon">{item.icon}</span>
                  <span>{item.label}</span>
                </button>
              ))}
            </nav>

            <div className="mobile-nav-actions">
              {user ? (
                <>
                  <button 
                    className="mobile-nav-link"
                    onClick={() => {
                      navigate('/profile');
                      setIsMobileMenuOpen(false);
                    }}
                  >
                    <span className="nav-icon">👤</span>
                    <span>Mi Perfil</span>
                  </button>
                  <button 
                    className="mobile-nav-link danger"
                    onClick={() => {
                      handleLogout();
                      setIsMobileMenuOpen(false);
                    }}
                  >
                    <span className="nav-icon">🚪</span>
                    <span>Cerrar Sesión</span>
                  </button>
                </>
              ) : (
                <>
                  <Button 
                    variant="secondary" 
                    fullWidth
                    onClick={() => {
                      navigate('/login');
                      setIsMobileMenuOpen(false);
                    }}
                  >
                    Iniciar Sesión
                  </Button>
                  <Button 
                    variant="primary" 
                    fullWidth
                    onClick={() => {
                      navigate('/register');
                      setIsMobileMenuOpen(false);
                    }}
                  >
                    Registrarse
                  </Button>
                </>
              )}
            </div>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="main-content">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="footer">
        <div className="footer-container">
          <div className="footer-section">
            <h3 className="footer-title">LAIKA Club</h3>
            <p className="footer-description">
              La mejor plataforma para descubrir y disfrutar eventos increíbles
            </p>
          </div>

          <div className="footer-section">
            <h4 className="footer-heading">Eventos</h4>
            <ul className="footer-links">
              <li><a href="/">Conciertos</a></li>
              <li><a href="/">Deportes</a></li>
              <li><a href="/">Teatro</a></li>
              <li><a href="/">Festivales</a></li>
            </ul>
          </div>

          <div className="footer-section">
            <h4 className="footer-heading">Ayuda</h4>
            <ul className="footer-links">
              <li><a href="/faq">Preguntas Frecuentes</a></li>
              <li><a href="/contact">Contacto</a></li>
              <li><a href="/terms">Términos y Condiciones</a></li>
              <li><a href="/privacy">Política de Privacidad</a></li>
            </ul>
          </div>

          <div className="footer-section">
            <h4 className="footer-heading">Síguenos</h4>
            <div className="social-links">
              <a href="#" className="social-link">📘</a>
              <a href="#" className="social-link">📷</a>
              <a href="#" className="social-link">🐦</a>
              <a href="#" className="social-link">📺</a>
            </div>
          </div>
        </div>

        <div className="footer-bottom">
          <p>&copy; 2025 LAIKA Club. Todos los derechos reservados.</p>
        </div>
      </footer>
    </div>
  );
};

export default MainLayout;
