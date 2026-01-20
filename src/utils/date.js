/**
 * Utilidades para formateo de fechas
 */

/**
 * Formatear fecha a formato español
 * @param {string|Date} date - Fecha a formatear
 * @param {Object} options - Opciones de formato
 * @returns {string}
 */
export const formatDate = (date, options = {}) => {
  if (!date) return '';
  
  const d = new Date(date);
  if (isNaN(d.getTime())) return '';

  const defaultOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    ...options
  };

  return d.toLocaleDateString('es-MX', defaultOptions);
};

/**
 * Formatear fecha corta (DD/MM/YYYY)
 * @param {string|Date} date
 * @returns {string}
 */
export const formatDateShort = (date) => {
  if (!date) return '';
  
  const d = new Date(date);
  if (isNaN(d.getTime())) return '';

  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();

  return `${day}/${month}/${year}`;
};

/**
 * Formatear hora (HH:MM)
 * @param {string|Date} date
 * @returns {string}
 */
export const formatTime = (date) => {
  if (!date) return '';
  
  const d = new Date(date);
  if (isNaN(d.getTime())) return '';

  return d.toLocaleTimeString('es-MX', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });
};

/**
 * Formatear fecha y hora completa
 * @param {string|Date} date
 * @returns {string}
 */
export const formatDateTime = (date) => {
  if (!date) return '';
  
  const d = new Date(date);
  if (isNaN(d.getTime())) return '';

  return d.toLocaleString('es-MX', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

/**
 * Obtener fecha relativa (hace X tiempo)
 * @param {string|Date} date
 * @returns {string}
 */
export const formatRelativeTime = (date) => {
  if (!date) return '';
  
  const d = new Date(date);
  if (isNaN(d.getTime())) return '';

  const now = new Date();
  const diff = now - d;
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  const months = Math.floor(days / 30);
  const years = Math.floor(days / 365);

  if (seconds < 60) return 'Hace un momento';
  if (minutes < 60) return `Hace ${minutes} minuto${minutes > 1 ? 's' : ''}`;
  if (hours < 24) return `Hace ${hours} hora${hours > 1 ? 's' : ''}`;
  if (days < 30) return `Hace ${days} día${days > 1 ? 's' : ''}`;
  if (months < 12) return `Hace ${months} mes${months > 1 ? 'es' : ''}`;
  return `Hace ${years} año${years > 1 ? 's' : ''}`;
};

/**
 * Verificar si una fecha ya pasó
 * @param {string|Date} date
 * @returns {boolean}
 */
export const isPastDate = (date) => {
  if (!date) return false;
  const d = new Date(date);
  return d < new Date();
};

/**
 * Verificar si una fecha es hoy
 * @param {string|Date} date
 * @returns {boolean}
 */
export const isToday = (date) => {
  if (!date) return false;
  const d = new Date(date);
  const today = new Date();
  
  return d.getDate() === today.getDate() &&
         d.getMonth() === today.getMonth() &&
         d.getFullYear() === today.getFullYear();
};

/**
 * Calcular días restantes hasta una fecha
 * @param {string|Date} date
 * @returns {number}
 */
export const daysUntil = (date) => {
  if (!date) return 0;
  
  const d = new Date(date);
  const now = new Date();
  const diff = d - now;
  
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
};

export default {
  formatDate,
  formatDateShort,
  formatTime,
  formatDateTime,
  formatRelativeTime,
  isPastDate,
  isToday,
  daysUntil
};
