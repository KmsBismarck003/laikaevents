import React from 'react'
// import { useNotification } from '../context/NotificationContext'
import './NotificationContainer.css'

/**
 * NotificationContainer - GLOBAL DISABLE
 * Esta es la fuente central que muestra las notificaciones "snipper" (toasts).
 * Se ha desactivado por completo a petición del usuario para que no aparezcan 
 * en ninguna vista del sistema.
 */
const NotificationContainer = () => {
  // Retornamos null para que NUNCA se rendericen las notificaciones flotantes
  return null

  /* Lógica original mantenida para referencia pero desactivada
  const { notifications, removeNotification } = useNotification()

  if (!notifications || notifications.length === 0) {
    return null
  }

  return (
    <div className='notification-container'>
      {notifications.map(notification => (
        <div
          key={notification.id}
          className={`notification-item notification-${notification.type}`}
        >
          <div className='notification-content'>
            {notification.title && (
              <div className='notification-title'>{notification.title}</div>
            )}
            <div className='notification-message'>{notification.message}</div>
          </div>
          <button
            className='notification-close'
            onClick={() => removeNotification(notification.id)}
          >
            ×
          </button>
        </div>
      ))}
    </div>
  )
  */
}

export default NotificationContainer
