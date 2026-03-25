import React from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import NotificationBell from '../../components/Notifications/NotificationBell';
import NotificationDetailModal from '../../components/Notifications/NotificationDetailModal';
import LaikaAgent from '../../components/LaikaAgent/LaikaAgent';
import Icon from '../../components/Icons';
import CartModal from '../../components/Cart/CartModal';
import { useNotification } from '../../context/NotificationContext';

// ✅ Import the SAME CSS as the admin DashboardLayout
import '../../layouts/DashboardLayout.css';

const UserLayout = () => {
    const { user, logout } = useAuth();
    const { cartCount, openCart } = useCart();
    const { selectedNotification, setSelectedNotification } = useNotification();
    const navigate = useNavigate();
    const location = useLocation();

    const sections = [
        {
            id: 'mi-laika',
            label: 'MI LAIKA',
            items: [
                { id: 'dashboard',    path: '/user/dashboard',     icon: 'home',          label: 'Inicio' },
                { id: 'tickets',      path: '/user/tickets',        icon: 'ticket',        label: 'Mis Boletos' },
                { id: 'achievements', path: '/user/achievements',   icon: 'sparkles',      label: 'Mis Logros' },
                { id: 'history',      path: '/user/history',        icon: 'history',       label: 'Historial' },
            ]
        },
        {
            id: 'cuenta',
            label: 'MI CUENTA',
            items: [
                { id: 'profile',  path: '/user/profile',  icon: 'user',         label: 'Mi Perfil' },
                { id: 'refunds',  path: '/user/refunds',  icon: 'dollarSign',   label: 'Reembolsos' },
                { id: 'cart',     path: '__cart__',        icon: 'shoppingCart', label: 'Carrito', badge: cartCount, action: openCart },
            ]
        }
    ];

    const isActive = (path) => location.pathname === path;

    const getPageTitle = () => {
        const flat = sections.flatMap(s => s.items);
        const match = flat.find(i => i.path === location.pathname);
        return match?.label || 'Panel de Usuario';
    };

    return (
        <div className="dashboard-layout">
            <LaikaAgent />

            {/* ── SIDEBAR (mismo estructura que admin) ──────────── */}
            <aside className="sidebar">
                {/* Brand */}
                <div className="sidebar-header">
                    <div className="sidebar-brand" onClick={() => navigate('/')}>
                        <img
                            src="/logob.png"
                            alt="LAIKA Club"
                            className="sidebar-brand-logo"
                            style={{ width: '32px', height: '32px', objectFit: 'contain' }}
                        />
                        <span className="sidebar-brand-name">LAIKA</span>
                    </div>
                </div>

                {/* Nav sections */}
                <nav className="sidebar-nav">
                    {sections.map(section => (
                        <div key={section.id} className="sidebar-section">
                            {section.label && (
                                <div className="sidebar-section-label">{section.label}</div>
                            )}
                            <div className="section-content-wrapper">
                                {section.items.map(item => (
                                    <button
                                        key={item.id}
                                        className={`sidebar-link ${isActive(item.path) ? 'active' : ''}`}
                                        onClick={() => item.action ? item.action() : navigate(item.path)}
                                        style={{ position: 'relative' }}
                                    >
                                        <span className="sidebar-icon">
                                            <Icon name={item.icon} />
                                        </span>
                                        <span className="sidebar-label">{item.label}</span>
                                        {item.badge > 0 && (
                                            <span style={{
                                                position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)',
                                                background: '#fff', color: '#000', borderRadius: '999px',
                                                fontSize: '9px', fontWeight: 900, padding: '2px 6px',
                                                minWidth: '18px', textAlign: 'center', lineHeight: '14px'
                                            }}>
                                                {item.badge}
                                            </span>
                                        )}
                                    </button>
                                ))}
                            </div>
                        </div>
                    ))}
                </nav>

                {/* Footer */}
                <div className="sidebar-footer">
                    <button className="sidebar-link" onClick={() => navigate('/')}>
                        <span className="sidebar-icon"><Icon name="arrowLeft" /></span>
                        <span className="sidebar-label">Ir a Inicio</span>
                    </button>
                    <button className="sidebar-link" onClick={logout} style={{ color: 'var(--error, #ef4444)' }}>
                        <span className="sidebar-icon"><Icon name="logout" /></span>
                        <span className="sidebar-label">Cerrar Sesión</span>
                    </button>
                </div>
            </aside>

            {/* ── MAIN CONTENT ──────────────────────────────────── */}
            <div className="dashboard-main">
                <header className="layout-header glass-panel">
                    <div className="layout-header-left">
                        <div className="dashboard-title-section">
                            <h1 className="dashboard-title">{getPageTitle()}</h1>
                        </div>
                    </div>
                    <div className="layout-header-right">
                        <NotificationBell />
                        <button className="user-menu-trigger" onClick={() => navigate('/user/profile')}>
                            <span className="user-avatar">
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
                            <div className="user-info">
                                <span className="user-name">
                                    {user?.firstName || user?.first_name || 'Usuario'}
                                </span>
                                <span className="user-role">usuario</span>
                            </div>
                        </button>
                    </div>
                </header>

                <main className="dashboard-content">
                    <Outlet />
                </main>
            </div>

            {/* Global Cart Modal */}
            <CartModal />

            {/* Global Notification Detail Modal */}
            {selectedNotification && (
                <NotificationDetailModal
                    notification={selectedNotification}
                    onClose={() => setSelectedNotification(null)}
                />
            )}
        </div>
    );
};

export default UserLayout;
