import { useState, useEffect } from 'react';

/**
 * Hook personalizado para debounce
 * Retrasa la actualización de un valor hasta que el usuario deje de escribir
 * Útil para búsquedas, validaciones y llamadas a API
 * 
 * @param {*} value - Valor a debounce
 * @param {number} delay - Delay en milisegundos (default: 500)
 */
const useDebounce = (value, delay = 500) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    // Establecer timeout para actualizar el valor después del delay
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // Limpiar timeout si el valor cambia antes del delay
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

export default useDebounce;
