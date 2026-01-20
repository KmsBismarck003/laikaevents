import { useState, useEffect } from 'react';

/**
 * Hook personalizado para media queries
 * Detecta cambios en el tamaño de pantalla
 * 
 * @param {string} query - Media query CSS (ej: '(min-width: 768px)')
 */
const useMediaQuery = (query) => {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const media = window.matchMedia(query);
    
    // Establecer valor inicial
    setMatches(media.matches);

    // Listener para cambios
    const listener = (event) => {
      setMatches(event.matches);
    };

    // Agregar listener
    if (media.addEventListener) {
      media.addEventListener('change', listener);
    } else {
      // Fallback para navegadores antiguos
      media.addListener(listener);
    }

    return () => {
      // Limpiar listener
      if (media.removeEventListener) {
        media.removeEventListener('change', listener);
      } else {
        media.removeListener(listener);
      }
    };
  }, [query]);

  return matches;
};

/**
 * Hooks predefinidos para breakpoints comunes
 */
export const useIsMobile = () => useMediaQuery('(max-width: 640px)');
export const useIsTablet = () => useMediaQuery('(min-width: 641px) and (max-width: 1024px)');
export const useIsDesktop = () => useMediaQuery('(min-width: 1025px)');

export default useMediaQuery;
