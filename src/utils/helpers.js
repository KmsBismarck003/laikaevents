/**
 * Funciones auxiliares generales
 */

/**
 * Capitalizar primera letra
 * @param {string} str
 * @returns {string}
 */
export const capitalize = (str) => {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

/**
 * Capitalizar cada palabra
 * @param {string} str
 * @returns {string}
 */
export const capitalizeWords = (str) => {
  if (!str) return '';
  return str.split(' ').map(capitalize).join(' ');
};

/**
 * Truncar texto con puntos suspensivos
 * @param {string} text
 * @param {number} maxLength
 * @returns {string}
 */
export const truncate = (text, maxLength = 100) => {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};

/**
 * Generar slug desde texto
 * @param {string} text
 * @returns {string}
 */
export const slugify = (text) => {
  if (!text) return '';
  
  return text
    .toString()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
};

/**
 * Copiar texto al portapapeles
 * @param {string} text
 * @returns {Promise<boolean>}
 */
export const copyToClipboard = async (text) => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (error) {
    console.error('Error al copiar:', error);
    return false;
  }
};

/**
 * Generar ID único
 * @returns {string}
 */
export const generateId = () => {
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
};

/**
 * Generar código aleatorio
 * @param {number} length
 * @returns {string}
 */
export const generateCode = (length = 9) => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < length; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};

/**
 * Generar código de boleto (TKT-XXXXXXXXX)
 * @returns {string}
 */
export const generateTicketCode = () => {
  return `TKT-${generateCode(9)}`;
};

/**
 * Esperar X milisegundos (sleep)
 * @param {number} ms
 * @returns {Promise}
 */
export const sleep = (ms) => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

/**
 * Eliminar duplicados de array
 * @param {Array} array
 * @returns {Array}
 */
export const removeDuplicates = (array) => {
  return [...new Set(array)];
};

/**
 * Agrupar array por propiedad
 * @param {Array} array
 * @param {string} key
 * @returns {Object}
 */
export const groupBy = (array, key) => {
  return array.reduce((result, item) => {
    const group = item[key];
    if (!result[group]) {
      result[group] = [];
    }
    result[group].push(item);
    return result;
  }, {});
};

/**
 * Ordenar array por propiedad
 * @param {Array} array
 * @param {string} key
 * @param {string} order - 'asc' | 'desc'
 * @returns {Array}
 */
export const sortBy = (array, key, order = 'asc') => {
  return [...array].sort((a, b) => {
    const aVal = a[key];
    const bVal = b[key];
    
    if (aVal < bVal) return order === 'asc' ? -1 : 1;
    if (aVal > bVal) return order === 'asc' ? 1 : -1;
    return 0;
  });
};

/**
 * Filtrar objetos por búsqueda
 * @param {Array} array
 * @param {string} searchTerm
 * @param {Array} keys - Propiedades donde buscar
 * @returns {Array}
 */
export const searchInArray = (array, searchTerm, keys) => {
  if (!searchTerm) return array;
  
  const term = searchTerm.toLowerCase();
  
  return array.filter(item => {
    return keys.some(key => {
      const value = item[key];
      if (typeof value === 'string') {
        return value.toLowerCase().includes(term);
      }
      return false;
    });
  });
};

/**
 * Descargar archivo
 * @param {Blob|string} data
 * @param {string} filename
 */
export const downloadFile = (data, filename) => {
  const url = typeof data === 'string' ? data : URL.createObjectURL(data);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  if (typeof data !== 'string') {
    URL.revokeObjectURL(url);
  }
};

/**
 * Obtener extensión de archivo
 * @param {string} filename
 * @returns {string}
 */
export const getFileExtension = (filename) => {
  if (!filename) return '';
  return filename.split('.').pop().toLowerCase();
};

/**
 * Verificar si es imagen
 * @param {string} filename
 * @returns {boolean}
 */
export const isImageFile = (filename) => {
  const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'];
  const ext = getFileExtension(filename);
  return imageExtensions.includes(ext);
};

/**
 * Obtener iniciales de nombre
 * @param {string} name
 * @returns {string}
 */
export const getInitials = (name) => {
  if (!name) return '';
  
  const parts = name.trim().split(' ');
  if (parts.length === 1) {
    return parts[0].substring(0, 2).toUpperCase();
  }
  
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

/**
 * Parsear query string a objeto
 * @param {string} queryString
 * @returns {Object}
 */
export const parseQueryString = (queryString) => {
  const params = new URLSearchParams(queryString);
  const result = {};
  
  for (const [key, value] of params) {
    result[key] = value;
  }
  
  return result;
};

/**
 * Construir query string desde objeto
 * @param {Object} params
 * @returns {string}
 */
export const buildQueryString = (params) => {
  const queryString = new URLSearchParams(params).toString();
  return queryString ? `?${queryString}` : '';
};

/**
 * Obtener color aleatorio hex
 * @returns {string}
 */
export const randomColor = () => {
  return '#' + Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0');
};

/**
 * Debounce function
 * @param {Function} func
 * @param {number} wait
 * @returns {Function}
 */
export const debounce = (func, wait = 300) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

export default {
  capitalize,
  capitalizeWords,
  truncate,
  slugify,
  copyToClipboard,
  generateId,
  generateCode,
  generateTicketCode,
  sleep,
  removeDuplicates,
  groupBy,
  sortBy,
  searchInArray,
  downloadFile,
  getFileExtension,
  isImageFile,
  getInitials,
  parseQueryString,
  buildQueryString,
  randomColor,
  debounce
};
