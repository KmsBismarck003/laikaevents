/**
 * Utilidades de formateo de números y moneda
 */

/**
 * Formatear número como moneda mexicana
 * @param {number} amount
 * @param {boolean} includeDecimals
 * @returns {string}
 */
export const formatCurrency = (amount, includeDecimals = true) => {
  if (amount === null || amount === undefined || isNaN(amount)) return '$0.00';
  
  const options = {
    style: 'currency',
    currency: 'MXN',
    minimumFractionDigits: includeDecimals ? 2 : 0,
    maximumFractionDigits: includeDecimals ? 2 : 0
  };
  
  return new Intl.NumberFormat('es-MX', options).format(amount);
};

/**
 * Formatear número con separadores de miles
 * @param {number} number
 * @returns {string}
 */
export const formatNumber = (number) => {
  if (number === null || number === undefined || isNaN(number)) return '0';
  
  return new Intl.NumberFormat('es-MX').format(number);
};

/**
 * Formatear porcentaje
 * @param {number} value
 * @param {number} decimals
 * @returns {string}
 */
export const formatPercentage = (value, decimals = 2) => {
  if (value === null || value === undefined || isNaN(value)) return '0%';
  
  return `${value.toFixed(decimals)}%`;
};

/**
 * Formatear número compacto (1K, 1M, etc.)
 * @param {number} number
 * @returns {string}
 */
export const formatCompactNumber = (number) => {
  if (number === null || number === undefined || isNaN(number)) return '0';
  
  const absNumber = Math.abs(number);
  
  if (absNumber >= 1000000) {
    return (number / 1000000).toFixed(1) + 'M';
  }
  if (absNumber >= 1000) {
    return (number / 1000).toFixed(1) + 'K';
  }
  
  return number.toString();
};

/**
 * Redondear a decimales específicos
 * @param {number} number
 * @param {number} decimals
 * @returns {number}
 */
export const roundTo = (number, decimals = 2) => {
  if (isNaN(number)) return 0;
  const multiplier = Math.pow(10, decimals);
  return Math.round(number * multiplier) / multiplier;
};

/**
 * Formatear tamaño de archivo
 * @param {number} bytes
 * @returns {string}
 */
export const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
};

/**
 * Calcular porcentaje
 * @param {number} partial
 * @param {number} total
 * @returns {number}
 */
export const calculatePercentage = (partial, total) => {
  if (!total || total === 0) return 0;
  return (partial / total) * 100;
};

/**
 * Formatear número de teléfono (XX XXXX XXXX)
 * @param {string} phone
 * @returns {string}
 */
export const formatPhoneNumber = (phone) => {
  if (!phone) return '';
  
  const cleaned = phone.replace(/\D/g, '');
  
  if (cleaned.length === 10) {
    return `${cleaned.slice(0, 2)} ${cleaned.slice(2, 6)} ${cleaned.slice(6)}`;
  }
  
  return phone;
};

/**
 * Formatear número de tarjeta (**** **** **** 1234)
 * @param {string} cardNumber
 * @returns {string}
 */
export const formatCardNumber = (cardNumber) => {
  if (!cardNumber) return '';
  
  const cleaned = cardNumber.replace(/\D/g, '');
  const lastFour = cleaned.slice(-4);
  
  return `**** **** **** ${lastFour}`;
};

/**
 * Generar número aleatorio en rango
 * @param {number} min
 * @param {number} max
 * @returns {number}
 */
export const randomInRange = (min, max) => {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

export default {
  formatCurrency,
  formatNumber,
  formatPercentage,
  formatCompactNumber,
  roundTo,
  formatFileSize,
  calculatePercentage,
  formatPhoneNumber,
  formatCardNumber,
  randomInRange
};
