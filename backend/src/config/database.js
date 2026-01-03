import mongoose from 'mongoose';
import logger from '../utils/logger.js';

const connectDB = async (retries = 5) => {
  for (let i = 0; i < retries; i++) {
    try {
      // MongoDB connection options for better performance
      const options = {
        maxPoolSize: 10, // Maintain up to 10 socket connections
        serverSelectionTimeoutMS: 5000, // Keep trying to send operations for 5 seconds
        socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
      };

      await mongoose.connect(process.env.DB_URL, options);
      
      // Set mongoose options for better performance
      mongoose.set('strictQuery', true);
      
      logger.info('✅ MongoDB Connected successfully');
      return;
    } catch (error) {
      logger.error(`❌ MongoDB connection attempt ${i + 1}/${retries} failed: ${error.message}`);
      if (i === retries - 1) {
        logger.error(`❌ Failed to connect to MongoDB after ${retries} attempts. Exiting...`);
        process.exit(1);
      }
      // Wait before retrying (exponential backoff)
      await new Promise(resolve => setTimeout(resolve, Math.min(1000 * Math.pow(2, i), 10000)));
    }
  }
};

export default connectDB;
