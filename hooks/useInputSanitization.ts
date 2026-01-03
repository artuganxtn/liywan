import { useCallback } from 'react';
import { sanitizeInput, sanitizeObject, validateEmail, validatePhone, validateLength } from '../utils/security';

/**
 * Hook for input sanitization
 */
export function useInputSanitization() {
  const sanitize = useCallback((value: string): string => {
    return sanitizeInput(value);
  }, []);

  const sanitizeForm = useCallback(<T extends Record<string, any>>(formData: T): T => {
    return sanitizeObject(formData);
  }, []);

  const validate = useCallback({
    email: validateEmail,
    phone: validatePhone,
    length: validateLength,
  }, []);

  return {
    sanitize,
    sanitizeForm,
    validate,
  };
}

