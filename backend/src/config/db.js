import mongoose from 'mongoose';
import { env } from './env.js';

mongoose.set('strictQuery', true);

export const connectDB = async () => {
  try {
    const conn = await mongoose.connect(env.mongodbUri, {
      autoIndex: env.nodeEnv !== 'production',
    });
    // eslint-disable-next-line no-console
    console.log(`✅ MongoDB Atlas connected: ${conn.connection.host}/${conn.connection.name}`);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(`❌ MongoDB connection error: ${error.message}`);
    process.exit(1);
  }

  mongoose.connection.on('disconnected', () => {
    // eslint-disable-next-line no-console
    console.warn('⚠️  MongoDB disconnected');
  });
};
