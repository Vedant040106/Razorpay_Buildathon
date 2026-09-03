import bcrypt from 'bcryptjs';
import { connectDatabase, disconnectDatabase } from '../config/database.js';
import { Merchant } from '../modules/auth/merchant.model.js';
import { User } from '../modules/auth/user.model.js';
import { RecoveryCase } from '../modules/recovery/recoveryCase.model.js';
import { DemoService } from '../modules/demo/demo.service.js';
import { logger } from '../utils/logger.js';

export async function seedDatabase(options = {}) {
  const { forceReset = false } = options;

  // 1. Create or update Default Merchant
  let merchant = await Merchant.findOne({ merchantId: 'merch_apex_retail' });
  if (!merchant) {
    merchant = await Merchant.create({
      merchantId: 'merch_apex_retail',
      name: 'Apex Retail Electronics',
      email: 'ops@apexretail.in',
      currency: 'INR',
      policyConfig: {
        autoActionMaxAmountPaise: 500000, // ₹5,000.00
        maxRecoveryAttempts: 3,
        cooldownPeriodMinutes: 15,
        minConfidenceAutoAction: 0.75,
        allowedAutoStrategies: ['RETRY_PAYMENT', 'SEND_PAYMENT_REMINDER']
      }
    });
    logger.info('Created default merchant: Apex Retail Electronics');
  }

  // 2. Create Default Admin User
  const adminEmail = 'admin@recoverai.local';
  let admin = await User.findOne({ email: adminEmail });
  if (!admin) {
    const passwordHash = await bcrypt.hash('password123', 10);
    admin = await User.create({
      email: adminEmail,
      passwordHash,
      name: 'Vedant (Lead Merchant Ops)',
      role: 'ADMIN',
      merchantId: merchant._id
    });
    logger.info(`Created default admin: ${adminEmail} / password123`);
  } else {
    // Verify password hash matches 'password123' for deterministic demo reliability
    const isMatch = await admin.comparePassword('password123');
    if (!isMatch) {
      admin.passwordHash = await bcrypt.hash('password123', 10);
      await admin.save();
      logger.info(`Updated admin password hash for demo reliability: ${adminEmail}`);
    }
  }

  // 3. Seed demo pitch scenarios if no cases exist or forced
  const caseCount = await RecoveryCase.countDocuments();
  if (caseCount === 0 || forceReset) {
    await DemoService.resetBaseline(merchant._id);
    logger.info('Successfully seeded demo scenarios A, B, and C!');
  } else {
    logger.info(`Existing recovery cases detected (${caseCount}). Preserving demo state.`);
  }

  return { merchant, admin };
}

async function runSeed() {
  try {
    logger.info('Starting standalone database seeder...');
    await connectDatabase();
    await seedDatabase({ forceReset: true });
    await disconnectDatabase();
    logger.info('Database seeding completed successfully.');
    process.exit(0);
  } catch (err) {
    logger.error(`Seeding failed: ${err.message}`, { stack: err.stack });
    process.exit(1);
  }
}

// Only run automatically if executed directly as entrypoint
const isDirectEntry = process.argv[1] && (
  process.argv[1].endsWith('seed.js') || 
  process.argv[1].includes('seed')
);

if (isDirectEntry) {
  runSeed();
}

