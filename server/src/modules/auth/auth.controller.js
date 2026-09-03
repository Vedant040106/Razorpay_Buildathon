import { AuthService } from './auth.service.js';
import { loginSchema } from './auth.validation.js';
import { sendSuccess } from '../../utils/response.js';
import { env } from '../../config/env.js';

export class AuthController {
  static async login(req, res, next) {
    try {
      const validatedData = loginSchema.parse(req.body);
      const { user, token } = await AuthService.login(validatedData.email, validatedData.password);

      // Set secure HTTP-only cookie
      res.cookie('token', token, {
        httpOnly: true,
        secure: env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
      });

      return sendSuccess(res, { user, token }, 200, {
        message: 'Authentication successful'
      });
    } catch (err) {
      next(err);
    }
  }

  static async logout(req, res, next) {
    try {
      res.clearCookie('token');
      return sendSuccess(res, { loggedOut: true }, 200, {
        message: 'Successfully logged out'
      });
    } catch (err) {
      next(err);
    }
  }

  static async getMe(req, res, next) {
    try {
      const user = await AuthService.getCurrentUser(req.user.id);
      return sendSuccess(res, { user });
    } catch (err) {
      next(err);
    }
  }
}
