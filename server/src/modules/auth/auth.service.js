import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { User } from './user.model.js';
import { Merchant } from './merchant.model.js';
import { env } from '../../config/env.js';
import { BadRequestError, UnauthorizedError, NotFoundError } from '../../utils/errors.js';

export class AuthService {
  static async login(email, password) {
    const user = await User.findOne({ email: email.toLowerCase() }).populate('merchantId');
    if (!user) {
      throw new UnauthorizedError('Invalid email or password');
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      throw new UnauthorizedError('Invalid email or password');
    }

    const payload = {
      id: user._id.toString(),
      email: user.email,
      name: user.name,
      role: user.role,
      merchantId: user.merchantId?._id?.toString()
    };

    const token = jwt.sign(payload, env.JWT_SECRET, {
      expiresIn: env.JWT_EXPIRES_IN
    });

    return {
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        role: user.role,
        merchant: user.merchantId
      },
      token
    };
  }

  static async getCurrentUser(userId) {
    const user = await User.findById(userId).select('-passwordHash').populate('merchantId');
    if (!user) {
      throw new NotFoundError('User not found');
    }
    return user;
  }
}
