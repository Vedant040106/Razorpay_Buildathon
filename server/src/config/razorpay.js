import Razorpay from 'razorpay';
import { env } from './env.js';
import { logger } from '../utils/logger.js';

let razorpayClient = null;

export function getRazorpayClient() {
  if (razorpayClient) return razorpayClient;

  const key_id = env.RAZORPAY_KEY_ID;
  const key_secret = env.RAZORPAY_KEY_SECRET;

  const isConfigured = key_id && key_secret && !key_id.includes('placeholder') && key_id.startsWith('rzp_test_');

  if (!isConfigured) {
    logger.warn('Razorpay test credentials not fully configured or placeholder detected. Gateway client will operate in safe test/mock mode.');
  }

  razorpayClient = new Razorpay({
    key_id: key_id || 'rzp_test_mockKey',
    key_secret: key_secret || 'mockSecret'
  });

  return razorpayClient;
}
