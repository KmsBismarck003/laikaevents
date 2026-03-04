import React, { useState, useEffect } from 'react'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { Dropdown, Badge, Icon } from '../components'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import ThemeToggle from '../components/ThemeToggle'
import './DashboardLayout.css'

const DashboardLayout = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, logout } = useAuth()
  const { theme, toggleTheme, isDark } = useTheme()
  const [isSidebarOpen, setIsSidebarOpen] = useState(false) // Default closed for overlay mode on all screens
  const [showNotifications, setShowNotifications] = useState(false)
  const [notifications, setNotifications] = useState([])

  // Cerrar sidebar al cambiar de ruta
  useEffect(() => {
    setIsSidebarOpen(false)
  }, [location.pathname])

  // Cerrar notificaciones al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = e => {
      if (
        showNotifications &&
        !e.target.closest('.notifications-panel') &&
        !e.target.closest('.notification-btn')
      ) {
        setShowNotifications(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [showNotifications])

  // TODO: Cargar notificaciones desde la API
  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        // Aquí irá tu llamada a la API real
        // const response = await api.notifications.getAll()
        // setNotifications(response)

        // Por ahora solo mostrar notificaciones si hay
        setNotifications([])
      } catch (error) {
        console.error('Error al cargar notificaciones:', error)
      }
    }

    fetchNotifications()
  }, [])

  const handleLogout = () => {
    logout()
  }

  const isActive = path => {
    return location.pathname === path
  }

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen)
  }

  const closeSidebar = () => {
    setIsSidebarOpen(false)
  }

  const getSidebarItems = () => {
    if (!user) return []

    const items = {
      admin: [
        { path: '/admin', icon: 'dashboard', label: 'Dashboard' },
        { path: '/admin/venues', icon: 'map', label: 'Recintos' },
        { path: '/admin/cms', icon: 'fileText', label: 'Gestor de Contenidos' },
        { path: '/admin/users', icon: 'users', label: 'Usuarios' },
        { path: '/admin/events', icon: 'calendar', label: 'Eventos' },
        { path: '/admin/config', icon: 'settings', label: 'Configuración' },
        { path: '/admin/database', icon: 'database', label: 'Base de Datos' },
        { path: '/admin/monitoring', icon: 'chart', label: 'Monitoreo' },
        { path: '/admin/logs', icon: 'fileText', label: 'Logs del Sistema' },
        { path: '/admin/sales', icon: 'dollarSign', label: 'Reporte de Ventas' },
        { path: '/admin/ads', icon: 'megaphone', label: 'Publicidad' },
        { path: '/admin/restore-audit', icon: 'history', label: 'Auditoría Restauraciones' }
      ],
      gestor: [
        { path: '/events/manage', icon: 'calendar', label: 'Mis Eventos (Gestión)' },
        // { path: '/events/create', icon: 'plus', label: 'Crear Evento' }, // Ahora dentro de Mis Eventos
        // { path: '/events/statistics', icon: 'chart', label: 'Estadísticas' }, // Ahora en detalle evento
      ],
      operador: [
        { path: '/staff', icon: 'checkCircle', label: 'Verificación' },
        { path: '/staff/history', icon: 'history', label: 'Historial' },
        { path: '/staff/events', icon: 'ticket', label: 'Eventos Asignados' }
      ]
    }

    return items[user.role] || []
  }

  const sidebarItems = getSidebarItems()

  const getRoleTitle = () => {
    const titles = {
      admin: 'Panel de Administración',
      gestor: 'Gestión de Eventos',
      operador: 'Panel de Operación'
    }
    return titles[user?.role] || 'Dashboard'
  }

  // Si no hay usuario, no renderizar nada (el ProtectedRoute se encargará de redirigir)
  if (!user) {
    return null
  }

  const unreadCount = notifications.filter(n => !n.read).length

  return (
    <div className='dashboard-layout'>
      <ThemeToggle />
      {/* Overlay solo cuando sidebar está abierto */}
      {isSidebarOpen && (
        <div className='sidebar-overlay' onClick={closeSidebar} />
      )}

      {/* Sidebar */}
      <aside className={`sidebar ${isSidebarOpen ? 'open' : ''}`}>
        <div className='sidebar-header'>
          <div className='sidebar-brand' onClick={() => navigate('/')}>
            <span className='sidebar-brand-icon'>
              <Icon name="logo" size={32} />
            </span>
            <span className='sidebar-brand-name'>LAIKA Club</span>
          </div>
          <button className='sidebar-close' onClick={closeSidebar}>
            <Icon name="close" />
          </button>
        </div>

        <nav className='sidebar-nav'>
          {sidebarItems.map(item => (
            <button
              key={item.path}
              className={`sidebar-link ${isActive(item.path) ? 'active' : ''}`}
              onClick={() => navigate(item.path)}
            >
              <span className='sidebar-icon'>
                <Icon name={item.icon} />
              </span>
              <span className='sidebar-label'>{item.label}</span>
            </button>
          ))}
        </nav>

        <div className='sidebar-footer'>
          <button className='sidebar-link' onClick={() => navigate('/')}>
            <span className='sidebar-icon'>
              <Icon name="home" />
            </span>
            <span className='sidebar-label'>Ir a Inicio</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className='dashboard-main'>
        {/* Top Bar */}
        <header className='dashboard-header glass-panel'>
          <div className='dashboard-header-left'>
            <button
              className='hamburger-btn'
              onClick={toggleSidebar}
              aria-label='Toggle menu'
            >
              <span className='hamburger-line'></span>
              <span className='hamburger-line'></span>
              <span className='hamburger-line'></span>
            </button>

            <div className='dashboard-title-section'>
              <h1 className='dashboard-title'>{getRoleTitle()}</h1>
            </div>
          </div>

          <div className='dashboard-header-right'>
            {/* TEMA TOGGLE - Eliminado de aquí, ahora usa el componente flotante */}


            {/* Botón de notificaciones */}
            <div className='notification-wrapper'>
              <button
                className='header-icon-btn notification-btn'
                onClick={() => setShowNotifications(!showNotifications)}
                title='Notificaciones'
              >
                <span className='header-icon'>
                  <Icon name="bell" />
                </span>
                {unreadCount > 0 && (
                  <Badge variant='danger' className='notification-badge'>
                    {unreadCount}
                  </Badge>
                )}
              </button>
            </div>

            {/* Menú de usuario */}
            <Dropdown
              trigger={
                <button className='user-menu-trigger'>
                  <span className='user-avatar'>
                    <Icon name="user" size={20} />
                  </span>
                  <div className='user-info'>
                    <span className='user-name'>
                      {user?.first_name || user?.firstName || ''}
                    </span>
                    <span className='user-role'>{user?.role}</span>
                  </div>
                  <span className='dropdown-arrow'>
                    <Icon name="chevronDown" size={16} />
                  </span>
                </button>
              }
              align='right'
            >
              <Dropdown.Item icon={<Icon name="user" size={16} />} onClick={() => navigate('/profile')}>
                Mi Perfil
              </Dropdown.Item>
              <Dropdown.Item icon={<Icon name="settings" size={16} />} onClick={() => navigate('/settings')}>
                Configuración
              </Dropdown.Item>
              <Dropdown.Divider />
              <Dropdown.Item icon={<Icon name="logout" size={16} />} danger onClick={handleLogout}>
                Cerrar Sesión
              </Dropdown.Item>
            </Dropdown>
          </div>
        </header>

        {/* Page Content */}
        <main className='dashboard-content'>
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export default DashboardLayout
