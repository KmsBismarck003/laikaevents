import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Icon, AnimatedCounter } from '../../components';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import api from '../../services/api';

const EventManagerDashboard = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const { info } = useNotification();
    const [stats, setStats] = useState({
        totalEvents: 0,
        publishedEvents: 0,
        totalSold: 0,
        totalRevenue: 0
    });
    const [displayText, setDisplayText] = useState('');
    const fullText = `¡Hola, ${user?.firstName || 'Gestor'}!`;

    useEffect(() => {
        let index = 0;
        const timer = setInterval(() => {
            setDisplayText(fullText.slice(0, index + 1));
            index++;
            if (index >= fullText.length) clearInterval(timer);
        }, 100);
        return () => clearInterval(timer);
    }, [fullText]);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const events = await api.manager.getMyEvents();
                const totalSold = events.reduce((acc, curr) => acc + (parseInt(curr.tickets_sold) || 0), 0);
                const totalRevenue = events.reduce((acc, curr) => acc + (parseFloat(curr.revenue) || 0), 0);
                
                setStats({
                    totalEvents: events.length,
                    publishedEvents: events.filter(e => e.status === 'published').length,
                    totalSold,
                    totalRevenue
                });
            } catch (error) {
                console.error('Error fetching manager stats:', error);
            }
        };
        fetchStats();
    }, []);

    const shortcuts = [
        { id: 'events', label: 'Mis Eventos', path: '/events/manage', icon: 'calendar' },
        { id: 'stats', label: 'Analíticas', path: '/manager/analytics', icon: 'chart' },
        { id: 'transactions', label: 'Ventas', path: '/manager/transactions', icon: 'dollarSign' },
        { id: 'attendees', label: 'Asistentes', path: '/manager/attendees', icon: 'users' },
        { id: 'create', label: 'Nuevo Evento', path: '/events/create', icon: 'plus' },
        { id: 'ads', label: 'Publicidad', path: '/admin/ads', icon: 'image' }
    ];

    return (
        <div className="admin-dashboard-page">
            <header className="dashboard-header">
                <div className="welcome-banner">
                    <h1 className="welcome-greeting">{displayText}</h1>
                    <p className="welcome-date">
                        {new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}
                    </p>
                </div>
            </header>

            <div className="stats-grid">
                <Card className="stat-card">
                    <div className="stat-info">
                        <p className="stat-label">Total Eventos</p>
                        <h2 className="stat-value"><AnimatedCounter value={stats.totalEvents} /></h2>
                    </div>
                    <div className="stat-icon"><Icon name="calendar" size={20} /></div>
                </Card>

                <Card className="stat-card">
                    <div className="stat-info">
                        <p className="stat-label">Boletos Vendidos</p>
                        <h2 className="stat-value"><AnimatedCounter value={stats.totalSold} /></h2>
                    </div>
                    <div className="stat-icon"><Icon name="ticket" size={20} /></div>
                </Card>

                <Card className="stat-card hero-stat-dark">
                    <div className="stat-info">
                        <p className="stat-label">Recaudación</p>
                        <h2 className="stat-value">$<AnimatedCounter value={stats.totalRevenue} /></h2>
                    </div>
                    <div className="stat-icon"><Icon name="dollarSign" size={20} /></div>
                </Card>

                <Card className="stat-card">
                    <div className="stat-info">
                        <p className="stat-label">Publicados</p>
                        <h2 className="stat-value"><AnimatedCounter value={stats.publishedEvents} /></h2>
                    </div>
                    <div className="stat-icon"><Icon name="checkCircle" size={20} /></div>
                </Card>
            </div>

            <div className="dashboard-shortcuts">
                <div className="shortcuts-section">
                    <h3 className="section-title"><Icon name="grid" size={16} /> Panel de Control</h3>
                    <div className="shortcuts-grid">
                        {shortcuts.map(item => (
                            <div key={item.id} className="shortcut-card" onClick={() => navigate(item.path)}>
                                <p className="shortcut-label">{item.label}</p>
                                <div className="icon-container"><Icon name={item.icon} size={18} /></div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <div className="dashboard-footer-grid">
                <div className="health-panel premium-vitals" style={{ background: '#fff' }}>
                    <div className="health-item">
                        <div className="status-dot online"></div>
                        <div>
                            <span className="health-label">Estado Gestor</span>
                            <div className="health-value">ACTIVO</div>
                        </div>
                    </div>
                </div>
            </div>
            
            <style>{`
                .section-title { font-size: 0.8rem; font-weight: 900; letter-spacing: 0.15em; color: #000; margin-bottom: 1.25rem; display: flex; align-items: center; gap: 0.5rem; border-bottom: 1px solid #eee; padding-bottom: 0.5rem; }
                .health-label { font-size: 0.6rem; font-weight: 800; color: #999; }
                .health-value { font-size: 0.75rem; font-weight: 800; color: #000; }
            `}</style>
        </div>
    );
};

export default EventManagerDashboard;
