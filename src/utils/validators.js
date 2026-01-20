/**
 * Utilidades de validación
 */

/**
 * Validar email
 * @param {string} email
 * @returns {boolean}
 */
export const isValidEmail = (email) => {
  if (!email) return false;
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
};

/**
 * Validar teléfono (10 dígitos)
 * @param {string} phone
 * @returns {boolean}
 */
export const isValidPhone = (phone) => {
  if (!phone) return false;
  const cleaned = phone.replace(/\D/g, '');
  return cleaned.length === 10;
};

/**
 * Validar contraseña segura
 * Mínimo 8 caracteres, una mayúscula, una minúscula, un número
 * @param {string} password
 * @returns {boolean}
 */
export const isValidPassword = (password) => {
  if (!password) return false;
  const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/;
  return regex.test(password);
};

/**
 * Validar URL
 * @param {string} url
 * @returns {boolean}
 */
export const isValidURL = (url) => {
  if (!url) return false;
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

/**
 * Validar número positivo
 * @param {number|string} value
 * @returns {boolean}
 */
export const isPositiveNumber = (value) => {
  const num = Number(value);
  return !isNaN(num) && num > 0;
};

/**
 * Validar rango de edad
 * @param {string|Date} birthDate
 * @param {number} minAge
 * @param {number} maxAge
 * @returns {boolean}
 */
export const isValidAge = (birthDate, minAge = 18, maxAge = 120) => {
  if (!birthDate) return false;
  
  const birth = new Date(birthDate);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  
  return age >= minAge && age <= maxAge;
};

/**
 * Validar fecha futura
 * @param {string|Date} date
 * @returns {boolean}
 */
export const isFutureDate = (date) => {
  if (!date) return false;
  const d = new Date(date);
  return d > new Date();
};

/**
 * Validar código de boleto (formato: TKT-XXXXXXXXX)
 * @param {string} code
 * @returns {boolean}
 */
export const isValidTicketCode = (code) => {
  if (!code) return false;
  const regex = /^TKT-[A-Z0-9]{9}$/;
  return regex.test(code);
};

/**
 * Validar tarjeta de crédito (algoritmo de Luhn)
 * @param {string} cardNumber
 * @returns {boolean}
 */
export const isValidCreditCard = (cardNumber) => {
  if (!cardNumber) return false;
  
  const cleaned = cardNumber.replace(/\D/g, '');
  if (cleaned.length < 13 || cleaned.length > 19) return false;
  
  let sum = 0;
  let isEven = false;
  
  for (let i = cleaned.length - 1; i >= 0; i--) {
    let digit = parseInt(cleaned[i], 10);
    
    if (isEven) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    
    sum += digit;
    isEven = !isEven;
  }
  
  return sum % 10 === 0;
};

/**
 * Validar CVV
 * @param {string} cvv
 * @returns {boolean}
 */
export const isValidCVV = (cvv) => {
  if (!cvv) return false;
  const regex = /^[0-9]{3,4}$/;
  return regex.test(cvv);
};

/**
 * Validar nombre (solo letras y espacios)
 * @param {string} name
 * @returns {boolean}
 */
export const isValidName = (name) => {
  if (!name) return false;
  const regex = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/;
  return regex.test(name.trim());
};

/**
 * Validar campo no vacío
 * @param {any} value
 * @returns {boolean}
 */
export const isRequired = (value) => {
  if (value === null || value === undefined) return false;
  if (typeof value === 'string') return value.trim().length > 0;
  return true;
};

/**
 * Validar longitud mínima
 * @param {string} value
 * @param {number} min
 * @returns {boolean}
 */
export const minLength = (value, min) => {
  if (!value) return false;
  return value.length >= min;
};

/**
 * Validar longitud máxima
 * @param {string} value
 * @param {number} max
 * @returns {boolean}
 */
export const maxLength = (value, max) => {
  if (!value) return true;
  return value.length <= max;
};

export default {
  isValidEmail,
  isValidPhone,
  isValidPassword,
  isValidURL,
  isPositiveNumber,
  isValidAge,
  isFutureDate,
  isValidTicketCode,
  isValidCreditCard,
  isValidCVV,
  isValidName,
  isRequired,
  minLength,
  maxLength
};
