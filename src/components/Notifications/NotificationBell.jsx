import React, { useState, useEffect, useRef } from 'react'
import { useNotification } from '../../context/NotificationContext'
import Icon from '../Icons'
import NotificationPanel from './NotificationPanel'
import './Notifications.css'

const NotificationBell = () => {
    const { unreadCount } = useNotification()
    const [isPanelOpen, setIsPanelOpen] = useState(false)
    const [isBadgeHidden, setIsBadgeHidden] = useState(false)
    const bellRef = useRef(null)

    // Intervalo de recordatorio (5 minutos = 300,000 ms)
    const REMINDER_INTERVAL = 5 * 60 * 1000

    useEffect(() => {
        let timer;
        if (isBadgeHidden && unreadCount > 0 && !isPanelOpen) {
            timer = setTimeout(() => {
                setIsBadgeHidden(false)
            }, REMINDER_INTERVAL)
        }
        return () => clearTimeout(timer)
    }, [isBadgeHidden, unreadCount, isPanelOpen])

    const [closeTimer, setCloseTimer] = useState(null)

    const handleMouseEnter = () => {
        if (closeTimer) clearTimeout(closeTimer)
        setIsPanelOpen(true)
        setIsBadgeHidden(true)
    }

    const handleMouseLeave = () => {
        const timer = setTimeout(() => {
            setIsPanelOpen(false)
        }, 300) // 300ms de gracia
        setCloseTimer(timer)
    }

    const togglePanel = (e) => {
        e.stopPropagation()
        if (closeTimer) clearTimeout(closeTimer)
        setIsPanelOpen(prev => {
            const next = !prev
            if (next) setIsBadgeHidden(true)
            return next
        })
    }

    return (
        <div
            style={{ position: 'relative' }}
        >
            <div className="notification-bell-container" onClick={togglePanel} ref={bellRef}>
                <Icon name="bell" size={24} />
                {unreadCount > 0 && !isBadgeHidden && (
                    <span className="notification-badge">{unreadCount}</span>
                )}
            </div>

            <NotificationPanel
                isOpen={isPanelOpen}
                onClose={() => setIsPanelOpen(false)}
                triggerRef={bellRef}
            />
        </div>
    )
}

export default NotificationBell
