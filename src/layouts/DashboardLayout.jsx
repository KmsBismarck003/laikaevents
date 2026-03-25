import React, { useState, useEffect } from 'react'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { Dropdown, Badge, SkeletonSidebarSection, SkeletonNavbar, SkeletonLaikaBtn, ConfirmationModal } from '../components'
import Icon from '../components/Icons'
import NotificationBell from '../components/Notifications/NotificationBell'
import NotificationDetailModal from '../components/Notifications/NotificationDetailModal'
import { useNotification } from '../context/NotificationContext'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import ThemeToggle from '../components/ThemeToggle'
import LaikaAgent from '../components/LaikaAgent/LaikaAgent'
import { useSkeletonContext, SkeletonProvider } from '../context/SkeletonContext'
import './DashboardLayout.css'

const DashboardLayout = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, logout, loading } = useAuth()
  const { theme, toggleTheme, isDark, customColor, setCustomColor, sidebarOnly, setSidebarOnly } = useTheme()
  const { selectedNotification, setSelectedNotification } = useNotification()
  const [draggedItem, setDraggedItem] = useState(null)
  const [expandedSections, setExpandedSections] = useState({
    gestor: false,
    operador: false,
    usuario: false,
    sistema: true
  })
  const { showSkeleton } = useSkeletonContext()
  const [searchTerm, setSearchTerm] = useState('')


  const defaultAdminSections = [
    {
      id: 'control',
      label: 'CENTRO DE CONTROL',
      items: [
        { id: 'dashboard', path: '/admin', icon: 'dashboard', label: 'Dashboard General', permission: 'admin.view' },
        { id: 'monitoring_rt', path: '/admin/monitoring', icon: 'chart', label: 'Monitoreo Realtime', permission: 'monitoring.view' },
        { id: 'big_data', path: '/admin/big-data', icon: 'database', label: 'Análisis Big Data', permission: 'admin.view' },
        { id: 'logs', path: '/admin/logs', icon: 'fileText', label: 'Logs del Sistema', permission: 'logs.view' }
      ]
    },
    {
      id: 'eventos_control',
      label: 'CONTROL DE EVENTOS',
      items: [
        { id: 'events', path: '/admin/events', icon: 'calendar', label: 'Eventos', permission: 'events.view' },
        { id: 'sales', path: '/admin/sales', icon: 'dollarSign', label: 'Ventas y Reportes', permission: 'sales.view' },
        { id: 'venues', path: '/admin/venues', icon: 'map', label: 'Recintos', permission: 'venues.view' },
        { id: 'venue_map', path: '/admin/venue-map', icon: 'map', label: 'Mapa de Ventas', permission: 'admin.view' },
        { id: 'ticket_builder', path: '/admin/ticket-builder', icon: 'fileText', label: 'Constructor Boletos', permission: 'admin.view' }
      ]
    },
    {
      id: 'mkt',
      label: 'MARKETING & CONTENIDOS',
      items: [
        { id: 'ads', path: '/admin/ads', icon: 'image', label: 'Publicidad & Ads', permission: 'cms.view' },
        { id: 'emails', path: '/admin/emails', icon: 'mail', label: 'Email Marketing', permission: 'admin.view' },
        { id: 'cms', path: '/admin/cms', icon: 'fileText', label: 'Contenidos CMS', permission: 'cms.view' },
        { id: 'ticker', path: '/admin/ticker', icon: 'sparkles', label: 'Cinta de Noticias', permission: 'cms.view' }
      ]
    },
    {
      id: 'sistema',
      label: 'SEGURIDAD & SISTEMA',
      items: [
        { id: 'database', path: '/admin/database', icon: 'database', label: 'Base de Datos', permission: 'database.view' },
        { id: 'users', path: '/admin/users', icon: 'users', label: 'Gestión Usuarios', permission: 'users.view' },
        { id: 'auth_audit', path: '/admin/auth-audit', icon: 'shield', label: 'Auditoría Accesos', permission: 'auth.audit' },
        { id: 'config', path: '/admin/config', icon: 'settings', label: 'Configuración', permission: 'config.view' },
        { id: 'laika_agent', path: '#laika-agent', icon: 'sparkles', label: 'Laika Agente', permission: 'admin.view' }
      ]
    }
  ]

  const [sidebarItems, setSidebarItems] = useState(defaultAdminSections)

  const handleLogout = () => {
    logout()
  }

  const isActive = (targetPath) => {
    const currentPath = location.pathname + location.search;
    
    // Comparación exacta primero (mejor para tabs con ?tab=)
    if (currentPath === targetPath) return true;
    
    // Si el target no tiene query params, pero el actual sí, 
    // evitamos que el padre se ilumine si es una ruta base compartida
    if (!targetPath.includes('?') && location.search) {
      return false;
    }

    // Fallback a comparación de pathname solo si no hay queries involucradas
    return location.pathname === targetPath;
  };

  /**
   * Helper para verificar permisos granulares
   */
  const hasPermission = (permissionKey) => {
    if (!user) return false
    if (user.role === 'admin') return true // Admin siempre tiene acceso a todo
    if (!user.permissions) return true // Retrocompatibilidad si no hay objeto permisos
    return !!user.permissions[permissionKey]
  }

  const getFilteredItems = (sections) => {
    if (!user) return []

    // Roles Operativos (No Admin)
    if (user.role !== 'admin') {
      const roleItems = {
        gestor: [
          {
            id: 'g_main',
            label: 'GESTIÓN GESTOR',
            items: [
              { id: 'g_main_hub', path: '/events/manage', icon: 'dashboard', label: 'Monitor Gestor' },
              { id: 'g_create', path: '/events/create', icon: 'plus', label: 'Nuevo Evento' },
              { id: 'g_events', path: '/events/manage', icon: 'calendar', label: 'Mis Eventos' },
              { id: 'g_venue_map', path: '/admin/venue-map', icon: 'map', label: 'Diseño de Recinto' },
              { id: 'g_stats', path: '/manager/analytics', icon: 'chart', label: 'Analíticas Avanzadas' },
              { id: 'g_transactions', path: '/manager/transactions', icon: 'dollarSign', label: 'Auditoría Ventas' },
              { id: 'g_attendees', path: '/manager/attendees', icon: 'users', label: 'Gestor Asistentes' },
              { id: 'g_ads', path: '/admin/ads', icon: 'image', label: 'Publicidad & Ads' }
            ]
          }
        ],
        operador: [
          {
            id: 'o_main',
            label: 'CONTROL OPERADOR',
            items: [
              { id: 'o_dashboard', path: '/staff/dashboard', icon: 'dashboard', label: 'Monitor Operativo' },
              { id: 'o_staff', path: '/staff?tab=scanner', icon: 'checkCircle', label: 'Terminal Escaneo' },
              { id: 'o_helpdesk', path: '/staff?tab=helpdesk', icon: 'search', label: 'Mesa de Ayuda' },
              { id: 'o_boxoffice', path: '/staff?tab=boxoffice', icon: 'shoppingBag', label: 'Taquilla On-site' },
              { id: 'o_history', path: '/staff/history', icon: 'history', label: 'Historial Entradas' },
              { id: 'o_incidents', path: '/staff/incidents', icon: 'alertTriangle', label: 'Reportar Incidencias' }
            ]
          }
        ],
        usuario: [
          {
            id: 'u_main',
            label: 'MI LAIKA',
            items: [
              { id: 'u_tickets', path: '/user/tickets', icon: 'ticket', label: 'Mis Boletos', adnPermission: 'canViewMyTickets' },
              { id: 'u_history', path: '/user/history', icon: 'history', label: 'Historial', adnPermission: 'canViewMyHistory' },
              { id: 'u_achievements', path: '/user/achievements', icon: 'star', label: 'Mis Logros', adnPermission: 'canViewAchievements' },
              { id: 'u_refunds', path: '/user/refunds', icon: 'refresh', label: 'Reembolsos', adnPermission: 'canRequestRefunds' },
              { id: 'u_vip', path: '/user/profile', icon: 'shield', label: 'Área VIP', adnPermission: 'canUseVipServices' }
            ].filter(item => hasPermission(item.adnPermission))
          }
        ]
      }
      return roleItems[user.role] || []
    }

    // Para Admin, inyectamos las secciones de "Supervisión" al final (Ven lo que los roles ven)
    return [
      ...sections,
      {
        id: 'super_gestor',
        label: 'GESTOR (Supervisión)',
        isCollapsible: true,
        isExpanded: expandedSections.gestor,
        onToggle: () => setExpandedSections(prev => ({ ...prev, gestor: !prev.gestor })),
        items: [
          { id: 'g_events_s', path: '/events/manage', icon: 'calendar', label: 'Monitor Eventos' },
          { id: 'g_stats_s', path: '/manager/analytics', icon: 'chart', label: 'Analíticas Globales' },
          { id: 'g_transactions_s', path: '/manager/transactions', icon: 'dollarSign', label: 'Auditoría Transacciones' },
          { id: 'g_attendees_s', path: '/manager/attendees', icon: 'users', label: 'Censo Asistentes' },
          { id: 'g_ads_s', path: '/admin/ads', icon: 'image', label: 'Publicidad & Ads' }
        ]
      },
      {
        id: 'super_operador',
        label: 'OPERADOR (Supervisión)',
        isCollapsible: true,
        isExpanded: expandedSections.operador,
        onToggle: () => setExpandedSections(prev => ({ ...prev, operador: !prev.operador })),
        items: [
          { id: 'o_staff_s', path: '/staff', icon: 'checkCircle', label: 'Terminal Staff' },
          { id: 'o_history_s', path: '/staff/history', icon: 'history', label: 'Historial Entradas' },
          { id: 'o_incidents_s', path: '/staff/incidents', icon: 'alertTriangle', label: 'Monitor Incidencias' }
        ]
      },
      {
        id: 'super_usuario',
        label: 'USUARIO (Supervisión)',
        isCollapsible: true,
        isExpanded: expandedSections.usuario,
        onToggle: () => setExpandedSections(prev => ({ ...prev, usuario: !prev.usuario })),
        items: [
          { id: 'u_dashboard_s', path: '/user/dashboard', icon: 'dashboard', label: 'Vista Dashboard' },
          { id: 'u_tickets_s', path: '/user/tickets', icon: 'ticket', label: 'Mis Boletos' },
          { id: 'u_achievements_s', path: '/user/achievements', icon: 'star', label: 'Logros y ADN' }
        ]
      }
    ]
  }

  const unfilteredSidebarItems = getFilteredItems(sidebarItems)
  const filteredSidebarItems = unfilteredSidebarItems.map(section => ({
    ...section,
    items: (section.items || []).filter(item => 
      item.label.toLowerCase().includes(searchTerm.toLowerCase())
    )
  })).filter(section => section.items.length > 0)

  // --- LÓGICA DRAG & DROP SIDEBAR ---
  const handleDragStart = (e, sectionId, itemId) => {
    setDraggedItem({ sectionId, itemId })
    e.dataTransfer.effectAllowed = 'move'
    e.target.style.opacity = '0.5'
  }

  const handleDragEnd = (e) => {
    e.target.style.opacity = '1'
    setDraggedItem(null)
  }

  const handleDragOver = (e) => {
    e.preventDefault()
  }

  const handleDrop = (e, targetSectionId, targetItemId) => {
    e.preventDefault()
    if (!draggedItem) return

    const newSections = JSON.parse(JSON.stringify(sidebarItems))
    const sourceSection = newSections.find(s => s.id === draggedItem.sectionId)
    const targetSection = newSections.find(s => s.id === targetSectionId)

    const sourceIdx = sourceSection.items.findIndex(i => i.id === draggedItem.itemId)
    const targetIdx = targetSection.items.findIndex(i => i.id === targetItemId)

    if (sourceIdx !== -1 && targetIdx !== -1) {
      const [movedItem] = sourceSection.items.splice(sourceIdx, 1)
      targetSection.items.splice(targetIdx, 0, movedItem)
      setSidebarItems(newSections)
      localStorage.setItem('sidebar_order', JSON.stringify(newSections))
    }
  }

  const [isResetSidebarModalOpen, setIsResetSidebarModalOpen] = useState(false)

  const handleResetSidebar = () => {
    setIsResetSidebarModalOpen(true)
  }

  const handleConfirmResetSidebar = () => {
    localStorage.removeItem('sidebar_order')
    setSidebarItems(defaultAdminSections)
    setIsResetSidebarModalOpen(false)
  }

  const getRoleTitle = () => {
    const titles = {
      admin: 'Panel de Administración',
      gestor: 'Gestión de Eventos',
      operador: 'Panel de Operación'
    }
    return titles[user?.role] || 'Dashboard'
  }

  return (
    <div className={`dashboard-layout${showSkeleton ? ' app-skeleton' : ''}`}>
      <aside className="sidebar">
        <div className='sidebar-header'>
          <div className='sidebar-brand' onClick={() => navigate('/')}>
            <img
              src="/logob.png"
              alt="LAIKA Club"
              className="sidebar-brand-logo"
              style={{ width: '32px', height: '32px', objectFit: 'contain' }}
            />
            <span className='sidebar-brand-name'>LAIKA</span>
          </div>
        </div>

        <nav className='sidebar-nav'>

          {showSkeleton ? (
            <>
              <SkeletonSidebarSection items={4} />
              <SkeletonSidebarSection items={3} />
              <SkeletonSidebarSection items={4} />
            </>
          ) : (
            filteredSidebarItems.map((section) => (
              <div
                key={section.id}
                className={`sidebar-section ${section.isCollapsible ? 'collapsible' : ''} ${section.isExpanded ? 'expanded' : ''}`}
                onMouseEnter={() => {
                  if (section.isCollapsible && !section.isExpanded) {
                    section.onToggle();
                  }
                }}
                onMouseLeave={() => {
                  if (section.isCollapsible && section.isExpanded) {
                    section.onToggle();
                  }
                }}
              >
                {section.label && (
                  <div
                    className={`sidebar-section-label ${section.isCollapsible ? 'clickable' : ''}`}
                    onClick={section.onToggle}
                  >
                    {section.label}
                    {section.isCollapsible && (
                      <Icon name={section.isExpanded ? 'chevronUp' : 'chevronDown'} size={14} className="ml-2" />
                    )}
                  </div>
                )}

                {(!section.isCollapsible || section.isExpanded) && (
                  <div className="section-content-wrapper">
                    {section.items.map(item => (
                      <button
                        key={item.path}
                        className={`sidebar-link ${isActive(item.path) ? 'active' : ''}`}
                        onClick={() => {
                          if (item.path === '#laika-agent') {
                            window.dispatchEvent(new Event('openLaikaAgent'));
                          } else {
                            navigate(item.path);
                          }
                        }}
                        draggable={user?.role === 'admin' && !section.isCollapsible}
                        onDragStart={(e) => handleDragStart(e, section.id, item.id)}
                        onDragEnd={handleDragEnd}
                        onDragOver={handleDragOver}
                        onDrop={(e) => handleDrop(e, section.id, item.id)}
                        style={{ cursor: (user?.role === 'admin' && !section.isCollapsible) ? 'grab' : 'pointer' }}
                      >
                        <span className='sidebar-icon'>
                          <Icon name={item.icon} />
                        </span>
                        <span className='sidebar-label'>{item.label}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))
          )}
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

      <div className='dashboard-main'>
        <header className='layout-header glass-panel'>
          <div className='layout-header-left'>
            <div className='dashboard-title-section'>
              {showSkeleton
                ? <div className="skeleton" style={{ width: '180px', height: '22px', borderRadius: '6px' }} />
                : <h1 className='dashboard-title'>{getRoleTitle()}</h1>
              }
            </div>
          </div>

          <div className='layout-header-right'>
            <div className='notification-wrapper'>
              {showSkeleton
                ? <div className="skeleton skeleton-avatar" style={{ width: '36px', height: '36px', borderRadius: '50%' }} />
                : <NotificationBell />
              }
            </div>

            {showSkeleton ? (
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <div className="skeleton skeleton-avatar" style={{ width: '36px', height: '36px', borderRadius: '50%' }} />
                <div>
                  <div className="skeleton" style={{ width: '80px', height: '11px', borderRadius: '4px', marginBottom: '5px' }} />
                  <div className="skeleton" style={{ width: '55px', height: '10px', borderRadius: '4px' }} />
                </div>
              </div>
            ) : (
              <Dropdown
                trigger={
                  <button className='user-menu-trigger'>
                    <span className='user-avatar'>
                      {(user?.avatarUrl || user?.avatar_url) ? (
                        <img 
                          src={(user.avatarUrl || user.avatar_url).startsWith('http') || (user.avatarUrl || user.avatar_url).startsWith('data:')
                            ? (user.avatarUrl || user.avatar_url) 
                            : `${process.env.REACT_APP_API_HOST || 'http://localhost:8000'}${user.avatarUrl || user.avatar_url}`} 
                          alt="Avatar" 
                          style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }}
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                            e.currentTarget.parentElement.innerHTML = '<div class="avatar-fallback">' + 
                              ((user?.first_name?.[0] || user?.firstName?.[0] || 'U') + 
                               (user?.last_name?.[0] || user?.lastName?.[0] || '')).toUpperCase() + 
                              '</div>';
                          }}
                        />
                      ) : (
                        <Icon name="user" size={20} />
                      )}
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

                {/* Selector de Temas */}
                <div 
                  onClick={(e) => e.stopPropagation()} 
                  style={{ padding: '10px 16px', display: 'flex', flexDirection: 'column', gap: '8px', borderTop: '1px solid rgba(0,0,0,0.05)' }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-primary)' }}>Modo Oscuro</span>
                    <label style={{ position: 'relative', display: 'inline-block', width: '34px', height: '18px' }}>
                      <input 
                        type="checkbox" 
                        checked={isDark} 
                        onChange={toggleTheme} 
                        style={{ opacity: 0, width: 0, height: 0 }} 
                      />
                      <span style={{ position: 'absolute', cursor: 'pointer', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: isDark ? '#10b981' : '#ccc', transition: '.4s', borderRadius: '20px' }}>
                        <span style={{ position: 'absolute', content: '""', height: '12px', width: '12px', left: isDark ? '18px' : '3px', bottom: '3px', backgroundColor: 'white', transition: '.4s', borderRadius: '50%' }} />
                      </span>
                    </label>
                  </div>
                  {isDark && (
                    <>
                      <div style={{ display: 'flex', gap: '8px', marginTop: '4px', paddingTop: '6px', borderTop: '1px solid rgba(0,0,0,0.03)' }}>
                        <button onClick={() => setCustomColor('default')} style={{ width: '16px', height: '16px', borderRadius: '50%', background: '#121212', border: customColor==='default'?'2px solid #fff':'1px solid #ccc', cursor: 'pointer' }} title="Default Dark" />
                        <button onClick={() => setCustomColor('github')} style={{ width: '16px', height: '16px', borderRadius: '50%', background: '#0d1117', border: customColor==='github'?'2_px solid #fff':'1px solid #ccc', cursor: 'pointer' }} title="GitHub Dark" />
                        <button onClick={() => setCustomColor('charcoal')} style={{ width: '16px', height: '16px', borderRadius: '50%', background: '#1b1e23', border: customColor==='charcoal'?'2px solid #fff':'1px solid #ccc', cursor: 'pointer' }} title="Charcoal" />
                        <button onClick={() => setCustomColor('midnight')} style={{ width: '16px', height: '16px', borderRadius: '50%', background: '#050505', border: customColor==='midnight'?'2px solid #fff':'1px solid #ccc', cursor: 'pointer' }} title="Midnight" />
                        <button onClick={() => setCustomColor('grey')} style={{ width: '16px', height: '16px', borderRadius: '50%', background: '#2b2b2b', border: customColor==='grey'?'2px solid #fff':'1px solid #ccc', cursor: 'pointer' }} title="Gris Premium" />
                      </div>
                      
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '6px', paddingTop: '6px', borderTop: '1px solid rgba(0,0,0,0.03)' }}>
                        <input 
                          type="checkbox" 
                          id="sidebarOnly-toggle"
                          checked={sidebarOnly} 
                          onChange={(e) => setSidebarOnly(e.target.checked)} 
                          style={{ cursor: 'pointer', margin: 0 }}
                        />
                        <label htmlFor="sidebarOnly-toggle" style={{ fontSize: '0.72rem', color: 'var(--text-primary)', cursor: 'pointer', userSelect: 'none' }}>
                          Solo barras de navegación
                        </label>
                      </div>
                    </>
                  )}
                </div>

                <Dropdown.Divider />
                <Dropdown.Item icon={<Icon name="logout" size={16} />} danger onClick={handleLogout}>
                  Cerrar Sesión
                </Dropdown.Item>
              </Dropdown>
            )}
          </div>
        </header>

        <main className='dashboard-content'>
          {!['/admin', '/events/manage', '/staff'].includes(location.pathname) && (
            <button className='back-body-btn' onClick={() => navigate(-1)} title="Volver">
              <Icon name="arrowLeft" size={18} /> Volver
            </button>
          )}
          <Outlet />
        </main>
      </div>

      {selectedNotification && (
        <NotificationDetailModal
          notification={selectedNotification}
          onClose={() => setSelectedNotification(null)}
        />
      )}
      <ConfirmationModal
        isOpen={isResetSidebarModalOpen}
        onClose={() => setIsResetSidebarModalOpen(false)}
        onConfirm={handleConfirmResetSidebar}
        title="Restablecer Menú"
        message="¿Estás seguro de que deseas restablecer el orden predeterminado del menú lateral?"
        confirmText="Restablecer"
        cancelText="Cancelar"
      />
      <LaikaAgent />
    </div>
  )
}

export default DashboardLayout
