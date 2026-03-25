import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { useAuth } from './AuthContext';

const NotificationContext = createContext(null);

export const NotificationProvider = ({ children }) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [selectedNotification, setSelectedNotification] = useState(null);
  const [history, setHistory] = useState(() => {
    const saved = localStorage.getItem('notification_history');
    if (saved) return JSON.parse(saved);

    return [];
  });

  // Filtrar historial según rol del usuario
  const filteredHistory = history.filter(n => {
    if (n.role === 'all') return true;
    if (!user) return false;
    return n.role === user.role;
  });

  const unreadCount = filteredHistory.filter(n => !n.read).length;

  const removeNotification = useCallback((id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  const addNotification = useCallback((notification) => {
    const timestamp = Date.now();
    const id = `${timestamp}-${Math.random().toString(36).substr(2, 9)}`;
    const newNotification = {
      type: 'info',
      title: 'Nueva Notificación',
      message: '',
      detail: '',
      duration: 5000,
      read: false,
      role: 'all',
      ...notification,
      id,
      timestamp
    };

    // Mostrar notificación flotante DESACTIVADO GLOBALMENTE a petición del usuario
    /*
    if ((newNotification.role === 'all' || (user && newNotification.role === user.role)) && !notification.silent) {
      setNotifications(prev => {
        const isDuplicate = prev.some(n => n.message === newNotification.message && (timestamp - n.timestamp) < 2000);
        if (isDuplicate) return prev;
        return [...prev.slice(-4), newNotification];
      });
      if (newNotification.duration > 0) {
        setTimeout(() => removeNotification(id), newNotification.duration);
      }
    }
    */

    // Guardar en historial (con deduplicación básica)
    setHistory(prev => {
      // Evitar duplicados idénticos consecutivos en menos de 1 minuto
      if (prev.length > 0) {
        const last = prev[0];
        if (last.title === newNotification.title &&
          last.message === newNotification.message &&
          (newNotification.timestamp - last.timestamp) < 60000) {
          return prev;
        }
      }
      const updated = [newNotification, ...prev].slice(0, 30);
      localStorage.setItem('notification_history', JSON.stringify(updated));
      return updated;
    });

    return id;
  }, [user, removeNotification]);

  const removeFromHistory = useCallback((id) => {
    setHistory(prev => {
      const updated = prev.filter(n => n.id !== id);
      localStorage.setItem('notification_history', JSON.stringify(updated));
      return updated;
    });
  }, []);

  const markAsRead = useCallback((id) => {
    setHistory(prev => {
      const updated = prev.map(n => n.id === id ? { ...n, read: true } : n);
      localStorage.setItem('notification_history', JSON.stringify(updated));
      return updated;
    });
  }, []);

  const markAllAsRead = useCallback(() => {
    setHistory(prev => {
      const updated = prev.map(n => ({ ...n, read: true }));
      localStorage.setItem('notification_history', JSON.stringify(updated));
      return updated;
    });
  }, []);

  const clearHistory = useCallback(() => {
    setHistory([]);
    localStorage.removeItem('notification_history');
  }, []);

  const success = useCallback((message, options = {}) => addNotification({ type: 'success', message, ...options }), [addNotification]);
  const error = useCallback((message, options = {}) => addNotification({ type: 'error', message, ...options }), [addNotification]);
  const warning = useCallback((message, options = {}) => addNotification({ type: 'warning', message, ...options }), [addNotification]);
  const info = useCallback((message, options = {}) => addNotification({ type: 'info', message, ...options }), [addNotification]);

  const value = {
    notifications,
    history: filteredHistory,
    unreadCount,
    selectedNotification,
    addNotification,
    removeNotification,
    removeFromHistory,
    markAsRead,
    markAllAsRead,
    clearHistory,
    setSelectedNotification,
    success,
    error,
    warning,
    info
  };

  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>;
};

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification debe usarse dentro de NotificationProvider');
  }
  return context;
};

export default NotificationContext;
