import { useState, useEffect, useCallback } from 'react';

/**
 * Hook personalizado para realizar peticiones HTTP
 * Maneja estados de loading, data y error automáticamente
 * 
 * @param {string} url - URL del endpoint (opcional, se puede pasar en execute)
 * @param {Object} options - Opciones de configuración
 * @param {boolean} options.immediate - Si debe ejecutar la petición inmediatamente (default: true)
 * @param {string} options.method - Método HTTP (default: 'GET')
 * @param {Object} options.headers - Headers personalizados
 * @param {Object} options.body - Body de la petición
 */
const useFetch = (url = null, options = {}) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const {
    immediate = false,
    method = 'GET',
    headers: customHeaders = {},
    body: initialBody = null
  } = options;

  /**
   * Ejecutar la petición HTTP
   * @param {string} customUrl - URL personalizada (opcional)
   * @param {Object} customOptions - Opciones personalizadas (opcional)
   */
  const execute = useCallback(async (customUrl = null, customOptions = {}) => {
    const finalUrl = customUrl || url;
    
    if (!finalUrl) {
      console.error('useFetch: URL no proporcionada');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Obtener token de autenticación si existe
      const token = localStorage.getItem('token');

      // Construir headers
      const headers = {
        'Content-Type': 'application/json',
        ...customHeaders,
        ...customOptions.headers
      };

      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      // Construir opciones de fetch
      const fetchOptions = {
        method: customOptions.method || method,
        headers,
        ...customOptions
      };

      // Agregar body si es necesario
      const requestBody = customOptions.body || initialBody;
      if (requestBody && ['POST', 'PUT', 'PATCH'].includes(fetchOptions.method)) {
        fetchOptions.body = JSON.stringify(requestBody);
      }

      // Realizar petición
      const response = await fetch(finalUrl, fetchOptions);

      // Verificar si la respuesta es exitosa
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP Error ${response.status}`);
      }

      // Parsear respuesta
      const contentType = response.headers.get('content-type');
      let responseData;

      if (contentType && contentType.includes('application/json')) {
        responseData = await response.json();
      } else {
        responseData = await response.text();
      }

      setData(responseData);
      setLoading(false);

      return { success: true, data: responseData };
    } catch (err) {
      console.error('useFetch error:', err);
      setError(err.message);
      setLoading(false);

      return { success: false, error: err.message };
    }
  }, [url, method, customHeaders, initialBody]);

  /**
   * Resetear el estado del hook
   */
  const reset = useCallback(() => {
    setData(null);
    setError(null);
    setLoading(false);
  }, []);

  /**
   * Ejecutar petición GET
   */
  const get = useCallback((customUrl = null, customOptions = {}) => {
    return execute(customUrl, { ...customOptions, method: 'GET' });
  }, [execute]);

  /**
   * Ejecutar petición POST
   */
  const post = useCallback((customUrl = null, body = null, customOptions = {}) => {
    return execute(customUrl, { ...customOptions, method: 'POST', body });
  }, [execute]);

  /**
   * Ejecutar petición PUT
   */
  const put = useCallback((customUrl = null, body = null, customOptions = {}) => {
    return execute(customUrl, { ...customOptions, method: 'PUT', body });
  }, [execute]);

  /**
   * Ejecutar petición PATCH
   */
  const patch = useCallback((customUrl = null, body = null, customOptions = {}) => {
    return execute(customUrl, { ...customOptions, method: 'PATCH', body });
  }, [execute]);

  /**
   * Ejecutar petición DELETE
   */
  const del = useCallback((customUrl = null, customOptions = {}) => {
    return execute(customUrl, { ...customOptions, method: 'DELETE' });
  }, [execute]);

  // Ejecutar automáticamente si immediate es true
  useEffect(() => {
    if (immediate && url) {
      execute();
    }
  }, [immediate, url]); // No incluir execute para evitar loops

  return {
    data,
    loading,
    error,
    execute,
    get,
    post,
    put,
    patch,
    delete: del,
    reset
  };
};

export default useFetch;
