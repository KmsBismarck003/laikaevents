import { useEffect } from 'react';

/**
 * Hook personalizado para detectar clics fuera de un elemento
 * Útil para cerrar modales, dropdowns, etc.
 * 
 * @param {Object} ref - Ref del elemento a monitorear
 * @param {Function} callback - Función a ejecutar cuando se hace clic fuera
 */
const useClickOutside = (ref, callback) => {
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (ref.current && !ref.current.contains(event.target)) {
        callback();
      }
    };

    // Agregar event listener
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);

    return () => {
      // Limpiar event listeners
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [ref, callback]);
};

export default useClickOutside;
