import React from 'react';
import Icon from '../Icons';
import './Notifications.css';

const NotificationDetailModal = ({ notification, onClose }) => {
    if (!notification) return null;

    const getIcon = (type) => {
        switch (type) {
            case 'success': return <Icon name="checkCircle" className="text-success" />;
            case 'error': return <Icon name="xCircle" className="text-error" />;
            case 'warning': return <Icon name="alertTriangle" className="text-warning" />;
            default: return <Icon name="info" className="text-info" />;
        }
    };

    const formatFullTime = (timestamp) => {
        return new Date(timestamp).toLocaleString();
    };

    return (
        <div className="notification-modal-overlay" onClick={onClose}>
            <div className="notification-modal-content glass-panel" onClick={e => e.stopPropagation()}>
                <header className="notification-modal-header">
                    <div className="notification-modal-title-wrapper">
                        {getIcon(notification.type)}
                        <h3>{notification.title || 'Detalle de Notificación'}</h3>
                    </div>
                    <button className="notification-modal-close" onClick={onClose}>
                        <Icon name="close" size={20} />
                    </button>
                </header>

                <div className="notification-modal-body">
                    <div className="notification-modal-meta">
                        <span className={`type-badge ${notification.type}`}>{notification.type.toUpperCase()}</span>
                        <span className="time-stamp">{formatFullTime(notification.timestamp)}</span>
                    </div>

                    <p className="notification-modal-message">{notification.message}</p>

                    {notification.detail && (
                        <div className="notification-modal-extra">
                            <h4>Información Adicional</h4>
                            <div className="detail-box">
                                {notification.detail}
                            </div>
                        </div>
                    )}
                </div>

                <footer className="notification-modal-footer">
                    <button className="btn-primary" onClick={onClose}>ENTENDIDO</button>
                </footer>
            </div>
        </div>
    );
};

export default NotificationDetailModal;
