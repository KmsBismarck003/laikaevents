import React, { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Dropdown, Badge } from '../components';
import './DashboardLayout.css';

const DashboardLayout = ({ user }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const handleLogout = () => {
    // TODO: Integrar con API y context
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const isActive = (path) => {
    return location.pathname === path;
  };

  const getSidebarItems = () => {
    if (!user) return [];

    const items = {
      admin: [
        { path: '/admin', icon: '📊', label: 'Dashboard', badge: null },
        { path: '/admin/users', icon: '👥', label: 'Usuarios', badge: null },
        { path: '/admin/events', icon: '🎫', label: 'Eventos', badge: null },
        { path: '/admin/config', icon: '⚙️', label: 'Configuración', badge: null },
        { path: '/admin/database', icon: '💾', label: 'Base de Datos', badge: null },
        { path: '/admin/monitoring', icon: '📈', label: 'Monitoreo', badge: 'new' },
        { path: '/admin/logs', icon: '📋', label: 'Logs del Sistema', badge: null }
      ],
      gestor: [
        { path: '/events/manage', icon: '🎭', label: 'Mis Eventos', badge: null },
        { path: '/events/create', icon: '➕', label: 'Crear Evento', badge: null },
        { path: '/events/statistics', icon: '📊', label: 'Estadísticas', badge: null },
        { path: '/events/sales', icon: '💰', label: 'Ventas', badge: null }
      ],
      operador: [
        { path: '/staff', icon: '✓', label: 'Verificación', badge: null },
        { path: '/staff/history', icon: '📜', label: 'Historial', badge: null },
        { path: '/staff/events', icon: '🎫', label: 'Eventos Asignados', badge: null }
      ]
    };

    return items[user.role] || [];
  };

  const sidebarItems = getSidebarItems();

  const getRoleTitle = () => {
    const titles = {
      admin: 'Panel de Administración',
      gestor: 'Gestión de Eventos',
      operador: 'Panel de Operación'
    };
    return titles[user?.role] || 'Dashboard';
  };

  const getRoleBadgeVariant = () => {
    const variants = {
      admin: 'danger',
      gestor: 'warning',
      operador: 'info'
    };
    return variants[user?.role] || 'default';
  };

  return (
    <div className="dashboard-layout">
      {/* Sidebar */}
      <aside className={`sidebar ${isSidebarOpen ? 'open' : 'closed'}`}>
        <div className="sidebar-header">
          <div className="sidebar-brand" onClick={() => navigate('/')}>
            <span className="sidebar-brand-icon">🐕</span>
            {isSidebarOpen && <span className="sidebar-brand-name">LAIKA Club</span>}
          </div>
        </div>

        <nav className="sidebar-nav">
          {sidebarItems.map((item) => (
            <button
              key={item.path}
              className={`sidebar-link ${isActive(item.path) ? 'active' : ''}`}
              onClick={() => navigate(item.path)}
              title={!isSidebarOpen ? item.label : ''}
            >
              <span className="sidebar-icon">{item.icon}</span>
              {isSidebarOpen && (
                <>
                  <span className="sidebar-label">{item.label}</span>
                  {item.badge && (
                    <Badge variant="primary" size="small" className="sidebar-badge">
                      {item.badge}
                    </Badge>
                  )}
                </>
              )}
            </button>
          ))}
        </nav>

        <div className="sidebar-footer">
          <button 
            className="sidebar-link"
            onClick={() => navigate('/')}
            title={!isSidebarOpen ? 'Ir a Inicio' : ''}
          >
            <span className="sidebar-icon">🏠</span>
            {isSidebarOpen && <span className="sidebar-label">Ir a Inicio</span>}
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="dashboard-main">
        {/* Top Bar */}
        <header className="dashboard-header">
          <div className="dashboard-header-left">
            <button 
              className="sidebar-toggle"
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            >
              ☰
            </button>
            <div className="dashboard-title-section">
              <h1 className="dashboard-title">{getRoleTitle()}</h1>
              <Badge variant={getRoleBadgeVariant()}>
                {user?.role?.toUpperCase()}
              </Badge>
            </div>
          </div>

          <div className="dashboard-header-right">
            <button className="header-icon-btn">
              <span className="header-icon">🔍</span>
            </button>

            <button className="header-icon-btn notification-btn">
              <span className="header-icon">🔔</span>
              <Badge variant="danger" className="notification-badge">5</Badge>
            </button>

            <Dropdown
              trigger={
                <button className="user-menu-trigger-dashboard">
                  <span className="user-avatar-dashboard">👤</span>
                  <div className="user-info-dashboard">
                    <span className="user-name-dashboard">{user?.firstName} {user?.lastName}</span>
                    <span className="user-role-dashboard">{user?.role}</span>
                  </div>
                  <span className="dropdown-arrow-dashboard">▼</span>
                </button>
              }
              align="right"
            >
              <Dropdown.Item icon="👤" onClick={() => navigate('/profile')}>
                Mi Perfil
              </Dropdown.Item>
              <Dropdown.Item icon="⚙️" onClick={() => navigate('/settings')}>
                Configuración
              </Dropdown.Item>
              <Dropdown.Divider />
              <Dropdown.Item icon="🚪" danger onClick={handleLogout}>
                Cerrar Sesión
              </Dropdown.Item>
            </Dropdown>
          </div>
        </header>

        {/* Page Content */}
        <main className="dashboard-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
