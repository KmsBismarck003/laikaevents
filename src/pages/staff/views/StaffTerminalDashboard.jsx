import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Icon, AnimatedCounter } from '../../../components';
import { useAuth } from '../../../context/AuthContext';

const StaffTerminalDashboard = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [displayText, setDisplayText] = useState('');
    const fullText = `¡Hola, ${user?.firstName || 'Operador'}!`;

    const [sessionStats, setSessionStats] = useState({
        scansToday: 0,
        valids: 0,
        incidents: 0,
        hoursActive: 0
    });

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
        // Cargar estadísticas reales del historial de escaneo
        const savedHistory = localStorage.getItem('staff_scan_history');
        if (savedHistory) {
            try {
                const history = JSON.parse(savedHistory);
                const valids = history.filter(h => h.status === 'valid' || h.status === 'used').length;
                const invalids = history.filter(h => h.status === 'invalid').length;
                
                setSessionStats({
                    scansToday: history.length,
                    valids: valids,
                    incidents: invalids,
                    hoursActive: 0
                });
            } catch (e) {
                console.error('Error loading staff session stats', e);
            }
        }
    }, []);

    const shortcuts = [
        { id: 'scan', label: 'Terminal Escaneo', path: '/staff', icon: 'checkCircle' },
        { id: 'history', label: 'Historial Entradas', path: '/staff/history', icon: 'history' },
        { id: 'incidents', label: 'Incidencias', path: '/staff/incidents', icon: 'alertTriangle' },
        { id: 'events', label: 'Mis Asignaciones', path: '/staff/events', icon: 'calendar' }
    ];

    return (
        <div className="admin-dashboard-page">
            <header className="dashboard-header">
                <div className="welcome-banner">
                    <h1 className="welcome-greeting">{displayText}</h1>
                    <p className="welcome-date">Panel de Control Operativo Staff</p>
                </div>
            </header>

            <div className="stats-grid">
                <Card className="stat-card">
                    <div className="stat-info">
                        <p className="stat-label">Escaneos Hoy</p>
                        <h2 className="stat-value"><AnimatedCounter value={sessionStats.scansToday} /></h2>
                    </div>
                    <div className="stat-icon"><Icon name="checkCircle" size={20} /></div>
                </Card>

                <Card className="stat-card">
                    <div className="stat-info">
                        <p className="stat-label">Válidos</p>
                        <h2 className="stat-value"><AnimatedCounter value={sessionStats.valids} /></h2>
                    </div>
                    <div className="stat-icon" style={{ backgroundColor: '#28a745', color: '#fff' }}><Icon name="check" size={20} /></div>
                </Card>

                <Card className="stat-card hero-stat-dark">
                    <div className="stat-info">
                        <p className="stat-label">Incidencias</p>
                        <h2 className="stat-value"><AnimatedCounter value={sessionStats.incidents} /></h2>
                    </div>
                    <div className="stat-icon" style={{ backgroundColor: '#dc3545', color: '#fff' }}><Icon name="alertTriangle" size={20} /></div>
                </Card>

                <Card className="stat-card">
                    <div className="stat-info">
                        <p className="stat-label">Horas Activo</p>
                        <h2 className="stat-value"><AnimatedCounter value={sessionStats.hoursActive} />h</h2>
                    </div>
                    <div className="stat-icon"><Icon name="history" size={20} /></div>
                </Card>
            </div>

            <div className="dashboard-shortcuts">
                <div className="shortcuts-section">
                    <h3 className="section-title"><Icon name="shield" size={16} /> Operaciones Staff</h3>
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
                            <span className="health-label">Estado Staff</span>
                            <div className="health-value">EN SERVICIO</div>
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

export default StaffTerminalDashboard;
