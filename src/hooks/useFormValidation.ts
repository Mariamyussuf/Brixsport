import { useState, useCallback } from 'react';
import { validateEvent, validateMatch, validatePlayer, ValidationResult } from '@/lib/validationUtils';
import { CampusEventType, SportType, Team } from '@/types/campus';

// Validation hook for event forms
export function useEventValidation() {
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  
  const validate = useCallback((
    eventType: CampusEventType | null,
    selectedTeam: Team | null,
    selectedPlayerId: string | null,
    eventValue: string | number | undefined,
    sportType: SportType,
    existingEvents: any[] = []
  ) => {
    const result = validateEvent(
      eventType as any,
      selectedTeam,
      selectedPlayerId,
      eventValue,
      sportType,
      existingEvents
    );
    
    setValidationResult(result);
    return result;
  }, []);
  
  const clearValidation = useCallback(() => {
    setValidationResult(null);
  }, []);
  
  return {
    validationResult,
    validate,
    clearValidation,
    isValid: validationResult?.isValid ?? true,
    errors: validationResult?.errors ?? []
  };
}

// Validation hook for match forms
export function useMatchValidation() {
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  
  const validate = useCallback((matchData: {
    name: string;
    homeTeamId: string;
    awayTeamId: string;
    date: string;
    location: string;
  }) => {
    const result = validateMatch(matchData);
    setValidationResult(result);
    return result;
  }, []);
  
  const clearValidation = useCallback(() => {
    setValidationResult(null);
  }, []);
  
  return {
    validationResult,
    validate,
    clearValidation,
    isValid: validationResult?.isValid ?? true,
    errors: validationResult?.errors ?? []
  };
}

// Validation hook for player forms
export function usePlayerValidation() {
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  
  const validate = useCallback((playerData: any) => {
    const result = validatePlayer(playerData);
    setValidationResult(result);
    return result;
  }, []);
  
  const clearValidation = useCallback(() => {
    setValidationResult(null);
  }, []);
  
  return {
    validationResult,
    validate,
    clearValidation,
    isValid: validationResult?.isValid ?? true,
    errors: validationResult?.errors ?? []
  };
}

// Generic form validation hook
export function useFormValidation<T>() {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const validateField = useCallback((name: string, value: any, rules: any) => {
    const newErrors: Record<string, string> = { ...errors };
    
    // Required validation
    if (rules.required && (!value || (typeof value === 'string' && value.trim() === ''))) {
      newErrors[name] = `${name} is required`;
    }
    
    // Min length validation
    if (rules.minLength && value && value.length < rules.minLength) {
      newErrors[name] = `${name} must be at least ${rules.minLength} characters`;
    }
    
    // Max length validation
    if (rules.maxLength && value && value.length > rules.maxLength) {
      newErrors[name] = `${name} must be no more than ${rules.maxLength} characters`;
    }
    
    // Email validation
    if (rules.email && value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      newErrors[name] = 'Please enter a valid email address';
    }
    
    // Number validation
    if (rules.number && value && isNaN(Number(value))) {
      newErrors[name] = 'Please enter a valid number';
    }
    
    // Custom validation
    if (rules.validate && typeof rules.validate === 'function') {
      const customError = rules.validate(value);
      if (customError) {
        newErrors[name] = customError;
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [errors]);
  
  const validateForm = useCallback((formData: Record<string, any>, validationRules: Record<string, any>) => {
    const newErrors: Record<string, string> = {};
    
    Object.keys(validationRules).forEach(field => {
      const value = formData[field];
      const rules = validationRules[field];
      
      // Required validation
      if (rules.required && (!value || (typeof value === 'string' && value.trim() === ''))) {
        newErrors[field] = `${field} is required`;
      }
      
      // Min length validation
      if (rules.minLength && value && value.length < rules.minLength) {
        newErrors[field] = `${field} must be at least ${rules.minLength} characters`;
      }
      
      // Max length validation
      if (rules.maxLength && value && value.length > rules.maxLength) {
        newErrors[field] = `${field} must be no more than ${rules.maxLength} characters`;
      }
      
      // Email validation
      if (rules.email && value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
        newErrors[field] = 'Please enter a valid email address';
      }
      
      // Number validation
      if (rules.number && value && isNaN(Number(value))) {
        newErrors[field] = 'Please enter a valid number';
      }
      
      // Custom validation
      if (rules.validate && typeof rules.validate === 'function') {
        const customError = rules.validate(value);
        if (customError) {
          newErrors[field] = customError;
        }
      }
    });
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, []);
  
  const clearErrors = useCallback(() => {
    setErrors({});
  }, []);
  
  const getError = useCallback((fieldName: string) => {
    return errors[fieldName];
  }, [errors]);
  
  return {
    errors,
    isSubmitting,
    validateField,
    validateForm,
    clearErrors,
    getError,
    hasErrors: Object.keys(errors).length > 0,
    setIsSubmitting
  };
}