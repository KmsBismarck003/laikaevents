import { useState, useCallback } from 'react';

/**
 * Hook personalizado para manejo de modales
 * Simplifica el control de apertura/cierre de modales
 * 
 * @param {boolean} initialState - Estado inicial del modal (default: false)
 */
const useModal = (initialState = false) => {
  const [isOpen, setIsOpen] = useState(initialState);

  /**
   * Abrir el modal
   */
  const open = useCallback(() => {
    setIsOpen(true);
  }, []);

  /**
   * Cerrar el modal
   */
  const close = useCallback(() => {
    setIsOpen(false);
  }, []);

  /**
   * Alternar estado del modal
   */
  const toggle = useCallback(() => {
    setIsOpen(prev => !prev);
  }, []);

  return {
    isOpen,
    open,
    close,
    toggle
  };
};

export default useModal;
