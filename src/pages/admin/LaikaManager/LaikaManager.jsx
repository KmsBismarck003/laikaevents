import React, { useState, useEffect } from 'react'
import { Card, Button, Alert, SkeletonRow } from '../../../components'
import Skeleton from '../../../components/Skeleton'
import { useSkeletonContext } from '../../../context/SkeletonContext'
import Icon from '../../../components/Icons'
import './admin.css'

const LaikaManager = () => {
    const [isEnabled, setIsEnabled] = useState(() => {
        const saved = localStorage.getItem('laika_agent_enabled');
        return saved === null ? true : saved === 'true';
    });

    // Estados por Rol
    const [roleSettings, setRoleSettings] = useState(() => {
        const saved = localStorage.getItem('laika_role_settings');
        return saved ? JSON.parse(saved) : {
            admin: true,
            gestor: true,
            operador: true,
            usuario: true
        };
    });

    const [soundEnabled, setSoundEnabled] = useState(() => {
        const saved = localStorage.getItem('laika_sound_enabled');
        return saved === 'true';
    });
    const [typingSpeed, setTypingSpeed] = useState(() => {
        const saved = localStorage.getItem('laika_typing_speed');
        return saved || 'normal';
    });
    const [laikaAvatar, setLaikaAvatar] = useState(() => {
        return localStorage.getItem('laika_avatar_url') || '/logob.png';
    });
    const [alert, setAlert] = useState(null);
    const [loading, setLoading] = useState(false);
    const { showSkeleton } = useSkeletonContext();

    // Historial simulado
    const [history] = useState([
        { id: 1, type: 'Consulta', query: '¿Cómo comprar boletos?', role: 'Admin', time: 'Hace 5 min' },
        { id: 2, type: 'Sugerencia', query: 'Reporte de ventas hoy', role: 'Gestor', time: 'Hace 15 min' },
        { id: 3, type: 'Acción', query: 'Escaneo de entrada #AF32', role: 'Operador', time: 'Hace 1 hora' },
        { id: 4, type: 'Tip', query: 'Evento más vendido: Rock Fest', role: 'Todos', time: 'Hace 3 horas' },
    ]);

    const handleToggleLaika = () => {
        const newState = !isEnabled;
        setIsEnabled(newState);
        localStorage.setItem('laika_agent_enabled', newState.toString());
        window.dispatchEvent(new Event('storage'));
        setAlert({ type: 'success', message: `Laika Agent ${newState ? 'activado' : 'desactivado'} globalmente` });
    };

    const handleToggleRole = (role) => {
        const newSettings = { ...roleSettings, [role]: !roleSettings[role] };
        setRoleSettings(newSettings);
        localStorage.setItem('laika_role_settings', JSON.stringify(newSettings));
        window.dispatchEvent(new Event('storage'));
        setAlert({ type: 'success', message: `Laika Agent ${newSettings[role] ? 'activado' : 'desactivado'} para rol: ${role.toUpperCase()}` });
    };

    const handleAvatarChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setLaikaAvatar(reader.result);
                localStorage.setItem('laika_avatar_url', reader.result);
                setAlert({ type: 'success', message: 'Imagen de Laika actualizada correctamente' });
                window.dispatchEvent(new Event('storage'));
            };
            reader.readAsDataURL(file);
        }
    };

    return (
        <div className="admin-page laika-manager-view">
            <div className="page-header">
                <div className="title-area">
                    <h1>Laika Agent Control Center</h1>
                    <p className="subtitle">Gestión avanzada y por roles del asistente</p>
                </div>
                <div className="header-actions">
                    <Button variant="secondary" onClick={() => window.location.reload()}>
                        Refrescar
                    </Button>
                </div>
            </div>

            {alert && (
                <Alert
                    type={alert.type}
                    message={alert.message}
                    onClose={() => setAlert(null)}
                    style={{ marginBottom: '20px' }}
                />
            )}

            {showSkeleton ? (
                <div className="admin-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                    <Card><div style={{ padding: '40px', textAlign: 'center' }}>
                        <Skeleton type="circle" width="140px" height="140px" style={{ margin: '0 auto 20px' }} />
                        <Skeleton type="text" width="60%" height="24px" style={{ margin: '0 auto 15px' }} />
                        <Skeleton type="text" width="40%" height="16px" style={{ margin: '0 auto' }} />
                    </div></Card>
                    <Card><div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                        {Array.from({ length: 4 }).map((_, i) => (
                            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div style={{ flex: 1 }}><Skeleton type="text" width="50%" height="14px" style={{ marginBottom: '5px' }} /><Skeleton type="text" width="30%" height="10px" /></div>
                                <Skeleton type="text" width="40px" height="20px" borderRadius="10px" />
                            </div>
                        ))}
                    </div></Card>
                    <Card style={{ gridColumn: 'span 2' }}><div style={{ display: 'flex', gap: '20px' }}>
                        <div style={{ flex: 1 }}><Skeleton type="text" width="40%" height="14px" style={{ marginBottom: '10px' }} /><Skeleton type="text" width="60px" height="24px" /></div>
                        <div style={{ flex: 1 }}><Skeleton type="text" width="40%" height="14px" style={{ marginBottom: '10px' }} /><div style={{ display: 'flex', gap: '10px' }}><Skeleton type="text" width="33%" height="40px" /><Skeleton type="text" width="33%" height="40px" /><Skeleton type="text" width="33%" height="40px" /></div></div>
                    </div></Card>
                </div>
            ) : (
                <div className="admin-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                    <Card title="Identidad de Laika">
                        <div className="avatar-manager-content" style={{ textAlign: 'center', padding: '20px 0' }}>
                            <div className="avatar-preview-wrapper" style={{ position: 'relative', display: 'inline-block' }}>
                                <img
                                    src={laikaAvatar}
                                    alt="Laika"
                                    style={{
                                        width: '140px',
                                        height: '140px',
                                        borderRadius: '50%',
                                        objectFit: 'cover',
                                        border: '4px solid var(--primary)',
                                        marginBottom: '20px',
                                        padding: '5px',
                                        background: 'rgba(0,0,0,0.2)'
                                    }}
                                />
                                <label className="avatar-edit-btn" style={{
                                    position: 'absolute',
                                    bottom: '25px',
                                    right: '5px',
                                    background: 'var(--primary)',
                                    color: '#000',
                                    width: '36px',
                                    height: '36px',
                                    borderRadius: '50%',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    cursor: 'pointer',
                                    boxShadow: '0 4px 15px rgba(0,0,0,0.8)'
                                }}>
                                    <Icon name="camera" size={18} />
                                    <input type="file" hidden onChange={handleAvatarChange} accept="image/*" />
                                </label>
                            </div>
                            <h2 style={{ fontSize: '2rem', fontWeight: '900' }}>LAIKA AI v2.6.7</h2>
                            <div className="laika-status-badge" style={{
                                display: 'inline-block',
                                marginTop: '15px',
                                padding: '8px 20px',
                                background: isEnabled ? 'rgba(0, 255, 0, 0.05)' : 'rgba(255, 0, 0, 0.05)',
                                border: `1px solid ${isEnabled ? '#00FF00' : '#FF0000'}`,
                                borderRadius: '30px',
                                color: isEnabled ? '#00FF00' : '#FF0000',
                                fontWeight: '800',
                                fontSize: '0.7rem',
                                letterSpacing: '2px'
                            }}>
                                {isEnabled ? '● SISTEMA GLOBAL ACTIVO' : '○ SISTEMA GLOBAL OFF'}
                            </div>
                        </div>
                    </Card>

                    <Card title="Activación por Roles">
                        <div className="role-switches-container">
                            <div className="laika-setting-item" style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                padding: '15px 0',
                                borderBottom: '1px solid rgba(255,255,255,0.05)'
                            }}>
                                <div className="s-info">
                                    <strong style={{ display: 'block' }}>General (Admin)</strong>
                                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Control maestro del asistente</span>
                                </div>
                                <label className="toggle-switch">
                                    <input type="checkbox" checked={isEnabled} onChange={handleToggleLaika} />
                                    <span className="toggle-slider"></span>
                                </label>
                            </div>

                            {['gestor', 'operador', 'usuario'].map(role => (
                                <div key={role} className="laika-setting-item" style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    padding: '15px 0',
                                    borderBottom: '1px solid rgba(255,255,255,0.05)'
                                }}>
                                    <div className="s-info">
                                        <strong style={{ display: 'block', textTransform: 'capitalize' }}>Rol: {role}</strong>
                                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Habilitar Laika para este rol</span>
                                    </div>
                                    <label className="toggle-switch">
                                        <input
                                            type="checkbox"
                                            checked={roleSettings[role]}
                                            onChange={() => handleToggleRole(role)}
                                            disabled={!isEnabled}
                                        />
                                        <span className="toggle-slider" style={{ opacity: isEnabled ? 1 : 0.5 }}></span>
                                    </label>
                                </div>
                            ))}
                        </div>
                    </Card>

                    <Card title="Comportamiento y Sonido" style={{ gridColumn: 'span 2' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px' }}>
                            <div className="laika-setting-item">
                                <strong style={{ display: 'block', marginBottom: '10px' }}>Efectos de Sonido</strong>
                                <label className="toggle-switch">
                                    <input
                                        type="checkbox"
                                        checked={soundEnabled}
                                        onChange={(e) => {
                                            setSoundEnabled(e.target.checked);
                                            localStorage.setItem('laika_sound_enabled', e.target.checked.toString());
                                            window.dispatchEvent(new Event('storage'));
                                        }}
                                    />
                                    <span className="toggle-slider"></span>
                                </label>
                            </div>

                            <div className="laika-setting-item">
                                <strong style={{ display: 'block', marginBottom: '10px' }}>Velocidad de Escritura</strong>
                                <div style={{ display: 'flex', gap: '10px' }}>
                                    {['Lento', 'Normal', 'Instántaneo'].map(s => (
                                        <button
                                            key={s}
                                            className={`theme-badge ${typingSpeed === s.toLowerCase() ? 'active' : ''}`}
                                            onClick={() => {
                                                setTypingSpeed(s.toLowerCase());
                                                localStorage.setItem('laika_typing_speed', s.toLowerCase());
                                                window.dispatchEvent(new Event('storage'));
                                            }}
                                            style={{
                                                padding: '10px',
                                                borderRadius: '10px',
                                                cursor: 'pointer',
                                                flex: 1,
                                                background: typingSpeed === s.toLowerCase() ? 'var(--primary)' : 'rgba(255,255,255,0.03)',
                                                color: typingSpeed === s.toLowerCase() ? '#000' : 'var(--text-primary)',
                                                border: 'none',
                                                fontWeight: '800'
                                            }}
                                        >
                                            {s}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </Card>
                </div>
            )}

            <Card title="Peticiones Recientes" style={{ marginTop: '20px' }}>
                <div className="history-table-wrapper">
                    <table className="admin-table">
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Tipo</th>
                                <th>Consulta</th>
                                <th>Rol</th>
                                <th>Fecha</th>
                            </tr>
                        </thead>
                        <tbody>
                            {showSkeleton ? (
                                Array.from({ length: 4 }).map((_, i) => (
                                    <SkeletonRow key={i} columns={5} />
                                ))
                            ) : (
                                history.map(item => (
                                    <tr key={item.id}>
                                        <td>#{item.id}</td>
                                        <td><span className="badge">{item.type}</span></td>
                                        <td>{item.query}</td>
                                        <td>{item.role}</td>
                                        <td>{item.time}</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </Card>
        </div>
    )
}

export default LaikaManager
