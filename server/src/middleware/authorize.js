import { ForbiddenError, UnauthorizedError } from '../utils/errors.js';

export function authorize(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return next(new UnauthorizedError('Authentication required.'));
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(new ForbiddenError(`Forbidden: Role '${req.user.role}' is not authorized for this operation.`));
    }

    next();
  };
}
