import mongoose from 'mongoose';
import { env } from './env.js';
import { logger } from '../utils/logger.js';

let mongodInstance = null;

export async function connectDatabase() {
  // If already connected, return
  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  // 1. If explicit URI provided, attempt connection
  if (env.MONGODB_URI) {
    try {
      logger.info(`Attempting connection to MongoDB URI: ${env.MONGODB_URI.replace(/\/\/.*@/, '//***@')}`);
      await mongoose.connect(env.MONGODB_URI, {
        serverSelectionTimeoutMS: 3000
      });
      logger.info('Successfully connected to primary MongoDB instance.');
      return mongoose.connection;
    } catch (err) {
      logger.warn(`Failed to connect to primary MongoDB URI (${err.message}). Falling back to in-memory database...`);
    }
  }

  // 2. Fallback to MongoMemoryServer for zero-setup demo/test mode
  try {
    logger.info('Initializing embedded MongoMemoryServer for zero-setup execution...');
    process.env.MONGOMS_MD5_CHECK = 'false';
    const { MongoMemoryServer } = await import('mongodb-memory-server');
    mongodInstance = await MongoMemoryServer.create({
      binary: {
        checkMD5: false
      }
    });
    const memoryUri = mongodInstance.getUri();
    
    await mongoose.connect(memoryUri);
    logger.info(`Connected to embedded in-memory MongoDB: ${memoryUri}`);
    return mongoose.connection;
  } catch (err) {
    logger.error('Failed to initialize MongoDB connection:', { error: err.message });
    throw err;
  }
}

export async function disconnectDatabase() {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
    logger.info('MongoDB disconnected.');
  }

  if (mongodInstance) {
    await mongodInstance.stop();
    mongodInstance = null;
    logger.info('Embedded MongoMemoryServer stopped.');
  }
}
