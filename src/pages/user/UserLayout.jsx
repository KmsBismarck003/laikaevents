import React, { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import Icon from '../../components/Icons';
import './User.css';

const UserLayout = () => {
    const { user, logout } = useAuth();
    const { cartCount } = useCart();
    const navigate = useNavigate();
    const location = useLocation();
    const [isSidebarOpen, setSidebarOpen] = useState(false);

    const menuItems = [
        { path: '/user/dashboard', icon: <Icon name="home" size={20} />, label: 'Inicio' },
        { path: '/user/tickets', icon: <Icon name="ticket" size={20} />, label: 'Mis Boletos' },
        { path: '/user/refunds', icon: <Icon name="dollarSign" size={20} />, label: 'Solicitar Reembolso' },
        { path: '/user/history', icon: <Icon name="history" size={20} />, label: 'Historial' },
        { path: '/user/achievements', icon: <Icon name="sparkles" size={20} />, label: 'Logros' },
        { path: '/user/profile', icon: <Icon name="user" size={20} />, label: 'Mi Perfil' },
        { path: '/user/cart', icon: <Icon name="shoppingCart" size={20} />, label: 'Carrito', badge: cartCount }
    ];

    const isActive = (path) => location.pathname === path;

    return (
        <div className="user-layout">
            <aside className={`user-sidebar ${isSidebarOpen ? 'open' : ''}`}>
                <div className="sidebar-header">
                    <h2>Mi Cuenta</h2>
                    <button className="close-btn" onClick={() => setSidebarOpen(false)}>×</button>
                </div>

                <div className="user-info-summary">
                    <div className="avatar-circle">
                        {user?.firstName?.charAt(0) || 'U'}
                    </div>
                    <div>
                        <h4>{user?.firstName} {user?.lastName}</h4>
                        <span>{user?.email}</span>
                    </div>
                </div>

                <nav className="user-nav">
                    {menuItems.map(item => (
                        <button
                            key={item.path}
                            className={`nav-item ${isActive(item.path) ? 'active' : ''}`}
                            onClick={() => {
                                navigate(item.path);
                                setSidebarOpen(false);
                            }}
                        >
                            <span className="icon">{item.icon}</span>
                            <span className="label">{item.label}</span>
                            {item.badge > 0 && <span className="badge">{item.badge}</span>}
                        </button>
                    ))}
                </nav>

                <div className="sidebar-footer">
                    <button onClick={() => navigate('/')} className="nav-item">
                        <span className="icon"><Icon name="arrowLeft" size={20} /></span>
                        <span className="label">Volver al Inicio</span>
                    </button>
                    <button onClick={logout} className="nav-item logout">
                        <span className="icon"><Icon name="logout" size={20} /></span>
                        <span className="label">Cerrar Sesión</span>
                    </button>
                </div>
            </aside>

            <div className="user-content-wrapper">
                <header className="user-header">
                    <button className="menu-toggle" onClick={() => setSidebarOpen(true)}>
                        <Icon name="menu" size={24} />
                    </button>
                    <h3>{menuItems.find(i => isActive(i.path))?.label || 'Panel de Usuario'}</h3>
                </header>

                <main className="user-main p-4">
                    <Outlet />
                </main>
            </div>

            {isSidebarOpen && <div className="overlay" onClick={() => setSidebarOpen(false)} />}
        </div>
    );
};

export default UserLayout;
