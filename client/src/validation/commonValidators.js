/**
 * Common validation utilities for RecoverAI frontend.
 * Provides consistent, user-friendly validation functions adhering to fintech standards.
 */

// RFC 5322 compliant simplified email regex with safe bounded backtracking
const EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;

/**
 * Validates an email address.
 * @param {string} value 
 * @returns {{ isValid: boolean, error: string | null, value: string }}
 */
export function validateEmail(value) {
  if (value === undefined || value === null) {
    return { isValid: false, error: 'Email is required.', value: '' };
  }
  const trimmed = String(value).trim();
  if (!trimmed) {
    return { isValid: false, error: 'Email is required.', value: '' };
  }
  if (trimmed.length > 255) {
    return { isValid: false, error: 'Email must not exceed 255 characters.', value: trimmed };
  }
  if (!EMAIL_REGEX.test(trimmed)) {
    return { isValid: false, error: 'Enter a valid email address.', value: trimmed };
  }
  return { isValid: true, error: null, value: trimmed };
}

/**
 * Validates a password input.
 * Preserves password content without silent alterations.
 * @param {string} value 
 * @returns {{ isValid: boolean, error: string | null, value: string }}
 */
export function validatePassword(value) {
  if (value === undefined || value === null || value === '') {
    return { isValid: false, error: 'Password is required.', value: '' };
  }
  const strVal = String(value);
  if (strVal.length > 128) {
    return { isValid: false, error: 'Password must not exceed 128 characters.', value: strVal };
  }
  return { isValid: true, error: null, value: strVal };
}

/**
 * Validates a required text field with min/max constraints.
 * @param {string} value 
 * @param {string} fieldName 
 * @param {number} minLength 
 * @param {number} maxLength 
 * @returns {{ isValid: boolean, error: string | null, value: string }}
 */
export function validateText(value, fieldName = 'Field', minLength = 1, maxLength = 500) {
  if (value === undefined || value === null) {
    return { isValid: false, error: `${fieldName} is required.`, value: '' };
  }
  const trimmed = String(value).trim();
  if (!trimmed) {
    return { isValid: false, error: `${fieldName} is required.`, value: '' };
  }
  if (trimmed.length < minLength) {
    return { isValid: false, error: `${fieldName} must be at least ${minLength} characters.`, value: trimmed };
  }
  if (trimmed.length > maxLength) {
    return { isValid: false, error: `${fieldName} must not exceed ${maxLength} characters.`, value: trimmed };
  }
  return { isValid: true, error: null, value: trimmed };
}

/**
 * Validates a monetary integer paise value (never floating-point).
 * @param {any} value 
 * @returns {{ isValid: boolean, error: string | null, value: number }}
 */
export function validateIntegerPaise(value) {
  const num = Number(value);
  if (isNaN(num) || !Number.isSafeInteger(num)) {
    return { isValid: false, error: 'Amount must be a safe integer in paise.', value: 0 };
  }
  if (num < 0) {
    return { isValid: false, error: 'Amount cannot be negative.', value: num };
  }
  return { isValid: true, error: null, value: num };
}

/**
 * Validates an AI confidence score bounded in [0, 1].
 * @param {any} value 
 * @returns {{ isValid: boolean, error: string | null, value: number }}
 */
export function validateConfidence(value) {
  const num = Number(value);
  if (isNaN(num) || !isFinite(num)) {
    return { isValid: false, error: 'Confidence must be a valid number.', value: 0 };
  }
  if (num < 0 || num > 1) {
    return { isValid: false, error: 'Confidence must be between 0.0 and 1.0.', value: num };
  }
  return { isValid: true, error: null, value: num };
}

/**
 * Validates a search query filter safely.
 * @param {string} value 
 * @param {number} maxLength 
 * @returns {string} Cleaned search string
 */
export function sanitizeSearchQuery(value, maxLength = 100) {
  if (!value) return '';
  const trimmed = String(value).trim();
  return trimmed.slice(0, maxLength);
}
