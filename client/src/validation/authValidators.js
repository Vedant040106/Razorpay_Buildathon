import { validateEmail, validatePassword } from './commonValidators.js';

/**
 * Validates login credentials on the frontend before submitting to the API.
 * @param {{ email: string, password: string }} credentials 
 * @returns {{ isValid: boolean, errors: { email?: string, password?: string } }}
 */
export function validateLoginForm({ email, password }) {
  const errors = {};

  const emailResult = validateEmail(email);
  if (!emailResult.isValid) {
    errors.email = emailResult.error;
  }

  const passwordResult = validatePassword(password);
  if (!passwordResult.isValid) {
    errors.password = passwordResult.error;
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
}
