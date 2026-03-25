import React, { useRef, useEffect, useState } from 'react'
import { useNotification } from '../../context/NotificationContext'
import Icon from '../Icons'
import './Notifications.css'

const NotificationPanel = ({ isOpen, onClose, triggerRef }) => {
    const { history, markAsRead, markAllAsRead, clearHistory, removeFromHistory, setSelectedNotification } = useNotification()
    const [activeFilter, setActiveFilter] = useState('all') // 'all' or 'unread'
    // Instant UI: Eliminada simulación de carga. Las notificaciones se muestran de inmediato.
    const [isLoading, setIsLoading] = useState(false)
    const panelRef = useRef(null)

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (panelRef.current && !panelRef.current.contains(event.target) &&
                triggerRef?.current && !triggerRef.current.contains(event.target)) {
                onClose()
            }
        }

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside)
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside)
        }
    }, [isOpen, onClose, triggerRef])

    if (!isOpen) return null

    const formatTime = (timestamp) => {
        const diff = Date.now() - timestamp
        const minutes = Math.floor(diff / 60000)
        if (minutes < 1) return 'Ahora mismo'
        if (minutes < 60) return `${minutes}m`
        const hours = Math.floor(minutes / 60)
        if (hours < 24) return `${hours}h`
        return new Date(timestamp).toLocaleDateString()
    }

    const getIcon = (type) => {
        switch (type) {
            case 'success': return <Icon name="info" size={16} />
            case 'error': return <Icon name="alertCircle" size={16} />
            case 'warning': return <Icon name="alertTriangle" size={16} />
            default: return <Icon name="info" size={16} />
        }
    }

    // Filtrado de notificaciones
    const filteredHistory = history.filter(item =>
        activeFilter === 'all' ? true : !item.read
    )

    // Agrupamiento (Nuevas < 1h, Anteriores > 1h)
    const now = Date.now()
    const newNotifications = filteredHistory.filter(item => now - item.timestamp < 3600000)
    const earlierNotifications = filteredHistory.filter(item => now - item.timestamp >= 3600000)

    const renderSkeleton = () => (
        <>
            {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className="skeleton-notification">
                    <div className="skeleton-avatar"></div>
                    <div className="skeleton-text-group">
                        <div className="skeleton-line title"></div>
                        <div className="skeleton-line msg-1"></div>
                        <div className="skeleton-line msg-2"></div>
                    </div>
                </div>
            ))}
        </>
    )

    const SwipeableNotificationItem = ({ item }) => {
        const [startX, setStartX] = useState(0)
        const [currentX, setCurrentX] = useState(0)
        const [isDragging, setIsDragging] = useState(false)
        const [isResetting, setIsResetting] = useState(false)

        const SWIPE_THRESHOLD = 120 // Desplazamiento máximo para eliminar
        const ACTION_WIDTH = 80 // Ancho visual del botón/acción

        const onTouchStart = (e) => {
            setStartX(e.touches[0].clientX)
            setIsDragging(true)
            setIsResetting(false)
        }

        const onTouchMove = (e) => {
            if (!isDragging) return
            const diff = e.touches[0].clientX - startX
            setCurrentX(diff)
        }

        const onTouchEnd = () => {
            setIsDragging(false)
            if (currentX < -SWIPE_THRESHOLD) {
                // Swipe Izquierda -> Eliminar
                removeFromHistory(item.id)
            } else if (currentX > SWIPE_THRESHOLD) {
                // Swipe Derecha -> Archivar (Marcar como leído)
                markAsRead(item.id)
                setIsResetting(true)
                setCurrentX(0)
            } else {
                // Resetear posición
                setIsResetting(true)
                setCurrentX(0)
            }
        }

        // Soporte para Mouse (PC)
        const onMouseDown = (e) => {
            setStartX(e.clientX)
            setIsDragging(true)
            setIsResetting(false)
        }

        const onMouseMove = (e) => {
            if (!isDragging) return
            const diff = e.clientX - startX
            setCurrentX(diff)
        }

        const onMouseUp = () => {
            if (isDragging) {
                onTouchEnd()
            }
        }

        return (
            <div className="swipe-container"
                onTouchStart={onTouchStart}
                onTouchMove={onTouchMove}
                onTouchEnd={onTouchEnd}
                onMouseDown={onMouseDown}
                onMouseMove={onMouseMove}
                onMouseUp={onMouseUp}
                onMouseLeave={onMouseUp}
            >
                {/* Fondo de ARCHIVAR (Derecha - aparece cuando deslizas a la derecha) */}
                <div className={`swipe-action-bg archive ${currentX > 20 ? 'visible' : ''}`}
                    style={{
                        backgroundColor: currentX > SWIPE_THRESHOLD ? '#4338ca' : '#4f46e5',
                        transition: 'background-color 0.2s'
                    }}
                >
                    <div className="swipe-icon">
                        <Icon name="check" size={20} />
                        <span>Archivar</span>
                    </div>
                </div>

                {/* Fondo de ELIMINAR (Izquierda - aparece cuando deslizas a la izquierda) */}
                <div className={`swipe-action-bg delete ${currentX < -20 ? 'visible' : ''}`}
                    style={{
                        backgroundColor: currentX < -SWIPE_THRESHOLD ? '#dc2626' : '#ef4444',
                        transition: 'background-color 0.2s'
                    }}
                >
                    <div className="swipe-icon">
                        <Icon name="trash" size={20} />
                        <span>Eliminar</span>
                    </div>
                </div>

                <div
                    className={`swipe-content ${isResetting ? 'resetting' : ''}`}
                    style={{ transform: `translateX(${currentX}px)` }}
                >
                    <div
                        className={`notification-item ${!item.read ? 'unread' : ''}`}
                        onClick={(e) => {
                            if (Math.abs(currentX) > 5) return; // Evitar clic si estaba arrastrando
                            e.stopPropagation();
                            setSelectedNotification(item);
                            markAsRead(item.id);
                        }}
                    >
                        <div className={`notification-item-icon icon-${item.type}`}>
                            {getIcon(item.type)}
                        </div>
                        <div className="notification-item-content">
                            <div className="notification-item-header">
                                <span className="notification-item-title">{item.title || 'Sistema'}</span>
                                <span className="notification-item-time">{formatTime(item.timestamp)}</span>
                            </div>
                            <p className="notification-item-message">{item.message}</p>
                        </div>
                        {/* El botón de eliminar se mantiene como fallback o acceso rápido */}
                        <button
                            className="notification-delete"
                            onClick={(e) => {
                                e.stopPropagation();
                                removeFromHistory(item.id);
                            }}
                            title="Eliminar"
                        >
                            <Icon name="x" size={14} />
                        </button>
                    </div>
                </div>
            </div>
        )
    }

    const renderNotificationItem = (item) => (
        <SwipeableNotificationItem key={item.id} item={item} />
    )

    return (
        <div className="notification-panel" ref={panelRef}>
            <div className="panel-header">
                <h4>Notificaciones</h4>
                <div className="panel-actions">
                    <button className="panel-btn" onClick={clearHistory}>LIMPIAR</button>
                </div>
            </div>

            <div className="panel-filters">
                <button
                    className={`filter-btn ${activeFilter === 'all' ? 'active' : ''}`}
                    onClick={() => setActiveFilter('all')}
                >
                    Todas
                </button>
                <button
                    className={`filter-btn ${activeFilter === 'unread' ? 'active' : ''}`}
                    onClick={() => setActiveFilter('unread')}
                >
                    No leídas
                </button>
            </div>

            <div className="notification-list">
                {isLoading ? (
                    renderSkeleton()
                ) : filteredHistory.length === 0 ? (
                    <div className="empty-state">
                        <Icon name="bell" size={32} />
                        <p>{activeFilter === 'unread' ? 'No tienes notificaciones sin leer' : 'No tienes notificaciones'}</p>
                    </div>
                ) : (
                    <>
                        {newNotifications.length > 0 && (
                            <div className="notification-group">
                                <div className="notification-group-header">
                                    <span>Nuevas</span>
                                    <span className="ver-todo-link" onClick={markAllAsRead}>Leído todo</span>
                                </div>
                                {newNotifications.map(renderNotificationItem)}
                            </div>
                        )}
                        {earlierNotifications.length > 0 && (
                            <div className="notification-group">
                                <div className="notification-group-header">Anteriores</div>
                                {earlierNotifications.map(renderNotificationItem)}
                            </div>
                        )}
                    </>
                )}
            </div>

            {history.length > 0 && !isLoading && (
                <div className="panel-footer">
                    <button className="panel-btn" onClick={onClose}>CERRAR</button>
                </div>
            )}
        </div>
    )
}

export default NotificationPanel
