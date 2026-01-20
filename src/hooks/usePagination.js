import { useState, useMemo, useCallback } from 'react';

/**
 * Hook personalizado para manejo de paginación
 * 
 * @param {Array} data - Array de datos a paginar
 * @param {number} itemsPerPage - Número de items por página (default: 10)
 */
const usePagination = (data = [], itemsPerPage = 10) => {
  const [currentPage, setCurrentPage] = useState(1);

  /**
   * Calcular datos paginados
   */
  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return data.slice(startIndex, endIndex);
  }, [data, currentPage, itemsPerPage]);

  /**
   * Calcular número total de páginas
   */
  const totalPages = useMemo(() => {
    return Math.ceil(data.length / itemsPerPage);
  }, [data.length, itemsPerPage]);

  /**
   * Verificar si hay página anterior
   */
  const hasPrevious = useMemo(() => {
    return currentPage > 1;
  }, [currentPage]);

  /**
   * Verificar si hay página siguiente
   */
  const hasNext = useMemo(() => {
    return currentPage < totalPages;
  }, [currentPage, totalPages]);

  /**
   * Ir a la página anterior
   */
  const goToPrevious = useCallback(() => {
    setCurrentPage(prev => Math.max(1, prev - 1));
  }, []);

  /**
   * Ir a la página siguiente
   */
  const goToNext = useCallback(() => {
    setCurrentPage(prev => Math.min(totalPages, prev + 1));
  }, [totalPages]);

  /**
   * Ir a una página específica
   */
  const goToPage = useCallback((page) => {
    const pageNumber = Math.max(1, Math.min(page, totalPages));
    setCurrentPage(pageNumber);
  }, [totalPages]);

  /**
   * Ir a la primera página
   */
  const goToFirst = useCallback(() => {
    setCurrentPage(1);
  }, []);

  /**
   * Ir a la última página
   */
  const goToLast = useCallback(() => {
    setCurrentPage(totalPages);
  }, [totalPages]);

  /**
   * Resetear a la primera página (útil cuando cambian los datos)
   */
  const reset = useCallback(() => {
    setCurrentPage(1);
  }, []);

  /**
   * Generar array de números de página para mostrar
   */
  const pageNumbers = useMemo(() => {
    const pages = [];
    const maxPagesToShow = 5;
    
    let startPage = Math.max(1, currentPage - Math.floor(maxPagesToShow / 2));
    let endPage = Math.min(totalPages, startPage + maxPagesToShow - 1);

    // Ajustar startPage si estamos cerca del final
    if (endPage - startPage < maxPagesToShow - 1) {
      startPage = Math.max(1, endPage - maxPagesToShow + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    return pages;
  }, [currentPage, totalPages]);

  return {
    // Datos
    paginatedData,
    currentPage,
    totalPages,
    hasPrevious,
    hasNext,
    pageNumbers,
    
    // Navegación
    goToPrevious,
    goToNext,
    goToPage,
    goToFirst,
    goToLast,
    reset
  };
};

export default usePagination;
