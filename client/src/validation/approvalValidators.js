import { validateText } from './commonValidators.js';

/**
 * Validates operator approval or rejection submissions.
 * @param {{ actionType: 'approve' | 'reject', notes: string }} param0 
 * @returns {{ isValid: boolean, error: string | null }}
 */
export function validateApprovalForm({ actionType, notes }) {
  if (actionType === 'reject') {
    if (!notes || !notes.trim()) {
      return {
        isValid: false,
        error: 'Please provide a reason for rejecting this recovery action.'
      };
    }
    const result = validateText(notes, 'Rejection reason', 5, 500);
    return {
      isValid: result.isValid,
      error: result.error
    };
  }

  // For approval, notes are optional but bounded
  if (notes && notes.length > 500) {
    return {
      isValid: false,
      error: 'Reviewer notes must not exceed 500 characters.'
    };
  }

  return {
    isValid: true,
    error: null
  };
}
