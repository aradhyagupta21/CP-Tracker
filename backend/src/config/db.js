import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

let isMongoConnected = false;

export const connectDB = async () => {
  const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/cptracker';
  try {
    mongoose.set('strictQuery', false);
    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 3000 // Timeout after 3 seconds instead of hanging
    });
    isMongoConnected = true;
    console.log('MongoDB connected successfully.');
  } catch (error) {
    console.warn('MongoDB connection failed. Falling back to Local JSON File Storage.');
    console.warn(`Error details: ${error.message}`);
    isMongoConnected = false;
  }
};

export const checkMongoConnection = () => {
  return isMongoConnected;
};
