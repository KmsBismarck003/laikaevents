import { useState, useEffect, useCallback } from 'react';

/**
 * Hook personalizado para trabajar con localStorage
 * Sincroniza automáticamente el estado con localStorage
 * 
 * @param {string} key - Clave en localStorage
 * @param {*} initialValue - Valor inicial si no existe en localStorage
 */
const useLocalStorage = (key, initialValue) => {
  // Función para obtener el valor inicial
  const getInitialValue = () => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(`Error al leer localStorage key "${key}":`, error);
      return initialValue;
    }
  };

  // Estado
  const [storedValue, setStoredValue] = useState(getInitialValue);

  /**
   * Función para establecer valor (tanto en estado como en localStorage)
   */
  const setValue = useCallback((value) => {
    try {
      // Permitir que value sea una función (como setState)
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      
      // Guardar en estado
      setStoredValue(valueToStore);
      
      // Guardar en localStorage
      if (valueToStore === undefined) {
        window.localStorage.removeItem(key);
      } else {
        window.localStorage.setItem(key, JSON.stringify(valueToStore));
      }
      
      // Disparar evento personalizado para sincronizar entre pestañas
      window.dispatchEvent(new Event('local-storage'));
    } catch (error) {
      console.error(`Error al guardar en localStorage key "${key}":`, error);
    }
  }, [key, storedValue]);

  /**
   * Función para eliminar el valor
   */
  const removeValue = useCallback(() => {
    try {
      window.localStorage.removeItem(key);
      setStoredValue(undefined);
      window.dispatchEvent(new Event('local-storage'));
    } catch (error) {
      console.error(`Error al eliminar localStorage key "${key}":`, error);
    }
  }, [key]);

  /**
   * Sincronizar entre pestañas
   */
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === key || e.type === 'local-storage') {
        setStoredValue(getInitialValue());
      }
    };

    // Escuchar cambios en localStorage
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('local-storage', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('local-storage', handleStorageChange);
    };
  }, [key]);

  return [storedValue, setValue, removeValue];
};

export default useLocalStorage;
