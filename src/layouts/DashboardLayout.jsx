import React, { useState, useEffect } from 'react'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { Dropdown, Badge } from '../components'
import { useAuth } from '../context/AuthContext'
import './DashboardLayout.css'

const DashboardLayout = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, logout } = useAuth()
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
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
        { path: '/admin', icon: '📊', label: 'Dashboard' },
        { path: '/admin/users', icon: '👥', label: 'Usuarios' },
        { path: '/admin/events', icon: '🎫', label: 'Eventos' },
        { path: '/admin/config', icon: '⚙️', label: 'Configuración' },
        { path: '/admin/database', icon: '💾', label: 'Base de Datos' },
        { path: '/admin/monitoring', icon: '📈', label: 'Monitoreo' },
        { path: '/admin/logs', icon: '📋', label: 'Logs del Sistema' }
      ],
      gestor: [
        { path: '/events/manage', icon: '🎭', label: 'Mis Eventos' },
        { path: '/events/create', icon: '➕', label: 'Crear Evento' },
        { path: '/events/statistics', icon: '📊', label: 'Estadísticas' },
        { path: '/events/sales', icon: '💰', label: 'Ventas' }
      ],
      operador: [
        { path: '/staff', icon: '✓', label: 'Verificación' },
        { path: '/staff/history', icon: '📜', label: 'Historial' },
        { path: '/staff/events', icon: '🎫', label: 'Eventos Asignados' }
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

  const getRoleBadgeVariant = () => {
    const variants = {
      admin: 'danger',
      gestor: 'warning',
      operador: 'info'
    }
    return variants[user?.role] || 'default'
  }

  const markAsRead = id => {
    setNotifications(prev =>
      prev.map(notif => (notif.id === id ? { ...notif, read: true } : notif))
    )
  }

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(notif => ({ ...notif, read: true })))
  }

  const deleteNotification = id => {
    setNotifications(prev => prev.filter(notif => notif.id !== id))
  }

  const unreadCount = notifications.filter(n => !n.read).length

  const getNotificationIcon = type => {
    const icons = {
      success: '✅',
      warning: '⚠️',
      info: 'ℹ️',
      danger: '❌'
    }
    return icons[type] || 'ℹ️'
  }

  // Si no hay usuario, no renderizar nada (el ProtectedRoute se encargará de redirigir)
  if (!user) {
    return null
  }

  return (
    <div className='dashboard-layout'>
      {/* Overlay solo cuando sidebar está abierto */}
      {isSidebarOpen && (
        <div className='sidebar-overlay' onClick={closeSidebar} />
      )}

      {/* Sidebar */}
      <aside className={`sidebar ${isSidebarOpen ? 'open' : ''}`}>
        <div className='sidebar-header'>
          <div className='sidebar-brand' onClick={() => navigate('/')}>
            <span className='sidebar-brand-icon'>🐕</span>
            <span className='sidebar-brand-name'>LAIKA Club</span>
          </div>
          <button className='sidebar-close' onClick={closeSidebar}>
            ✕
          </button>
        </div>

        <nav className='sidebar-nav'>
          {sidebarItems.map(item => (
            <button
              key={item.path}
              className={`sidebar-link ${isActive(item.path) ? 'active' : ''}`}
              onClick={() => navigate(item.path)}
            >
              <span className='sidebar-icon'>{item.icon}</span>
              <span className='sidebar-label'>{item.label}</span>
              {item.badge && (
                <Badge variant='primary' size='small' className='sidebar-badge'>
                  {item.badge}
                </Badge>
              )}
            </button>
          ))}
        </nav>

        <div className='sidebar-footer'>
          <button className='sidebar-link' onClick={() => navigate('/')}>
            <span className='sidebar-icon'>🏠</span>
            <span className='sidebar-label'>Ir a Inicio</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className='dashboard-main'>
        {/* Top Bar */}
        <header className='dashboard-header'>
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
              <Badge variant={getRoleBadgeVariant()} size='small'>
                {user?.role?.toUpperCase()}
              </Badge>
            </div>
          </div>

          <div className='dashboard-header-right'>
            {/* Botón de notificaciones */}
            <div className='notification-wrapper'>
              <button
                className='header-icon-btn notification-btn'
                onClick={() => setShowNotifications(!showNotifications)}
                title='Notificaciones'
              >
                <span className='header-icon'>🔔</span>
                {unreadCount > 0 && (
                  <Badge variant='danger' className='notification-badge'>
                    {unreadCount}
                  </Badge>
                )}
              </button>

              {/* Panel de Notificaciones */}
              {showNotifications && (
                <div className='notifications-panel'>
                  <div className='notifications-header'>
                    <h3>Notificaciones</h3>
                    {unreadCount > 0 && (
                      <button className='mark-all-read' onClick={markAllAsRead}>
                        Marcar todas como leídas
                      </button>
                    )}
                  </div>

                  <div className='notifications-list'>
                    {notifications.length === 0 ? (
                      <div className='no-notifications'>
                        <span className='no-notif-icon'>🔕</span>
                        <p>No tienes notificaciones</p>
                      </div>
                    ) : (
                      notifications.map(notif => (
                        <div
                          key={notif.id}
                          className={`notification-item ${notif.read ? 'read' : 'unread'}`}
                          onClick={() => markAsRead(notif.id)}
                        >
                          <div className='notification-icon'>
                            {getNotificationIcon(notif.type)}
                          </div>
                          <div className='notification-content'>
                            <h4>{notif.title}</h4>
                            <p>{notif.message}</p>
                            <span className='notification-time'>
                              {notif.time}
                            </span>
                          </div>
                          <button
                            className='notification-delete'
                            onClick={e => {
                              e.stopPropagation()
                              deleteNotification(notif.id)
                            }}
                          >
                            ✕
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Menú de usuario */}
            <Dropdown
              trigger={
                <button className='user-menu-trigger'>
                  <span className='user-avatar'>
                    {user?.first_name?.charAt(0) ||
                      user?.firstName?.charAt(0) ||
                      'U'}
                    {user?.last_name?.charAt(0) ||
                      user?.lastName?.charAt(0) ||
                      ''}
                  </span>
                  <div className='user-info'>
                    <span className='user-name'>
                      {user?.first_name || user?.firstName || ''}{' '}
                      {user?.last_name || user?.lastName || ''}
                    </span>
                    <span className='user-role'>{user?.role}</span>
                  </div>
                  <span className='dropdown-arrow'>▼</span>
                </button>
              }
              align='right'
            >
              <Dropdown.Item icon='👤' onClick={() => navigate('/profile')}>
                Mi Perfil
              </Dropdown.Item>
              <Dropdown.Item icon='⚙️' onClick={() => navigate('/settings')}>
                Configuración
              </Dropdown.Item>
              <Dropdown.Divider />
              <Dropdown.Item icon='🚪' danger onClick={handleLogout}>
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
