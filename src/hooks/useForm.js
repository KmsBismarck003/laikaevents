import { useState, useCallback } from 'react';

/**
 * Hook personalizado para manejo de formularios
 * Gestiona valores, validaciones y estados de error
 * 
 * @param {Object} initialValues - Valores iniciales del formulario
 * @param {Function} onSubmit - Función a ejecutar al enviar el formulario
 * @param {Function} validate - Función de validación personalizada
 */
const useForm = (initialValues = {}, onSubmit, validate) => {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  /**
   * Manejar cambios en los campos del formulario
   */
  const handleChange = useCallback((e) => {
    const { name, value, type, checked } = e.target;
    
    setValues(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));

    // Limpiar error del campo cuando el usuario empieza a escribir
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  }, [errors]);

  /**
   * Manejar blur en los campos (para validación)
   */
  const handleBlur = useCallback((e) => {
    const { name } = e.target;
    
    setTouched(prev => ({
      ...prev,
      [name]: true
    }));

    // Validar campo individual si hay función de validación
    if (validate) {
      const fieldErrors = validate(values);
      if (fieldErrors[name]) {
        setErrors(prev => ({
          ...prev,
          [name]: fieldErrors[name]
        }));
      }
    }
  }, [validate, values]);

  /**
   * Establecer valor de un campo específico
   */
  const setFieldValue = useCallback((name, value) => {
    setValues(prev => ({
      ...prev,
      [name]: value
    }));
  }, []);

  /**
   * Establecer error de un campo específico
   */
  const setFieldError = useCallback((name, error) => {
    setErrors(prev => ({
      ...prev,
      [name]: error
    }));
  }, []);

  /**
   * Marcar campo como tocado
   */
  const setFieldTouched = useCallback((name, isTouched = true) => {
    setTouched(prev => ({
      ...prev,
      [name]: isTouched
    }));
  }, []);

  /**
   * Validar todo el formulario
   */
  const validateForm = useCallback(() => {
    if (!validate) return {};

    const formErrors = validate(values);
    setErrors(formErrors);
    return formErrors;
  }, [validate, values]);

  /**
   * Manejar envío del formulario
   */
  const handleSubmit = useCallback(async (e) => {
    if (e) {
      e.preventDefault();
    }

    // Marcar todos los campos como tocados
    const allTouched = Object.keys(values).reduce((acc, key) => {
      acc[key] = true;
      return acc;
    }, {});
    setTouched(allTouched);

    // Validar formulario
    const formErrors = validateForm();

    // Si hay errores, no enviar
    if (Object.keys(formErrors).length > 0) {
      return;
    }

    // Ejecutar onSubmit
    if (onSubmit) {
      setIsSubmitting(true);
      try {
        await onSubmit(values);
      } catch (error) {
        console.error('Error al enviar formulario:', error);
      } finally {
        setIsSubmitting(false);
      }
    }
  }, [values, validateForm, onSubmit]);

  /**
   * Resetear el formulario a sus valores iniciales
   */
  const resetForm = useCallback(() => {
    setValues(initialValues);
    setErrors({});
    setTouched({});
    setIsSubmitting(false);
  }, [initialValues]);

  /**
   * Resetear solo los errores
   */
  const resetErrors = useCallback(() => {
    setErrors({});
  }, []);

  /**
   * Verificar si el formulario es válido
   */
  const isValid = useCallback(() => {
    return Object.keys(errors).length === 0;
  }, [errors]);

  /**
   * Verificar si un campo tiene error y fue tocado
   */
  const getFieldError = useCallback((name) => {
    return touched[name] && errors[name] ? errors[name] : '';
  }, [touched, errors]);

  /**
   * Obtener props para un campo de input
   */
  const getFieldProps = useCallback((name) => {
    return {
      name,
      value: values[name] || '',
      onChange: handleChange,
      onBlur: handleBlur,
      error: getFieldError(name)
    };
  }, [values, handleChange, handleBlur, getFieldError]);

  return {
    // Valores y estados
    values,
    errors,
    touched,
    isSubmitting,
    
    // Handlers
    handleChange,
    handleBlur,
    handleSubmit,
    
    // Setters
    setFieldValue,
    setFieldError,
    setFieldTouched,
    setValues,
    setErrors,
    
    // Utilidades
    resetForm,
    resetErrors,
    validateForm,
    isValid,
    getFieldError,
    getFieldProps
  };
};

export default useForm;
