import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from server directory or root
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

export const env = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: parseInt(process.env.PORT || '5000', 10),
  CLIENT_URL: process.env.CLIENT_URL || 'http://localhost:5173',

  // Database
  MONGODB_URI: process.env.MONGODB_URI || '',

  // Authentication
  JWT_SECRET: process.env.JWT_SECRET || 'recoverai_dev_jwt_secret_change_in_production_min32chars!',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
  COOKIE_SECRET: process.env.COOKIE_SECRET || 'recoverai_cookie_secret_key_at_least_32_characters!',

  // Razorpay
  RAZORPAY_KEY_ID: process.env.RAZORPAY_KEY_ID || 'rzp_test_placeholder_key',
  RAZORPAY_KEY_SECRET: process.env.RAZORPAY_KEY_SECRET || 'rzp_test_placeholder_secret',
  RAZORPAY_WEBHOOK_SECRET: process.env.RAZORPAY_WEBHOOK_SECRET || 'rzp_webhook_secret_placeholder',

  // AI Configuration
  AI_PROVIDER: process.env.AI_PROVIDER || 'gemini', // 'gemini' | 'openai' | 'rule_fallback'
  AI_API_KEY: process.env.AI_API_KEY || '',
  AI_MODEL: process.env.AI_MODEL || 'gemini-1.5-flash',

  // Policy Engine Thresholds (Amounts in paise: 1 INR = 100 paise)
  AUTO_ACTION_MAX_AMOUNT_PAISE: parseInt(process.env.AUTO_ACTION_MAX_AMOUNT_PAISE || '500000', 10), // ₹5,000.00
  MAX_RECOVERY_ATTEMPTS: parseInt(process.env.MAX_RECOVERY_ATTEMPTS || '3', 10),
  COOLDOWN_PERIOD_MINUTES: parseInt(process.env.COOLDOWN_PERIOD_MINUTES || '15', 10),
  MIN_CONFIDENCE_AUTO_ACTION: parseFloat(process.env.MIN_CONFIDENCE_AUTO_ACTION || '0.75')
};
