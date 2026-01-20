import { useState, useCallback } from 'react';

/**
 * Hook personalizado para manejar estados booleanos
 * Útil para switches, checkboxes, visibilidad, etc.
 * 
 * @param {boolean} initialValue - Valor inicial (default: false)
 */
const useToggle = (initialValue = false) => {
  const [value, setValue] = useState(initialValue);

  /**
   * Alternar el valor
   */
  const toggle = useCallback(() => {
    setValue(prev => !prev);
  }, []);

  /**
   * Establecer valor a true
   */
  const setTrue = useCallback(() => {
    setValue(true);
  }, []);

  /**
   * Establecer valor a false
   */
  const setFalse = useCallback(() => {
    setValue(false);
  }, []);

  return [value, toggle, setTrue, setFalse];
};

export default useToggle;
